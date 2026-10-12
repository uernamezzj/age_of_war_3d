/**
 * 《战争进化史 3D》兵种生命周期与战斗仿真调度器
 * 负责模板预热、骨架统一克隆、状态机 (Walk/Combat/Death)、弹道物理及伤害结算
 */

import { GAME_CONFIG } from './game_config.js';
import { audioManager } from './audio_manager.js';

export class UnitManager {
  constructor(scene, gltfLoader, fbxLoader) {
    this.scene = scene;
    this.gltfLoader = gltfLoader || new THREE.GLTFLoader();
    this.fbxLoader = fbxLoader;

    // 预热好的兵种基础模板原型与动作剪辑字典
    this.templates = {};
    this.clipLibraries = {};

    // 活跃在战场上的军团单位
    this.playerUnits = [];
    this.enemyUnits = [];

    // 飞行中的弹道投射物
    this.projectiles = [];

    // 单位唯一计数器
    this.nextUnitId = 1;

    // 回调通知 (击杀、阵亡、金币/经验变更)
    this.onUnitKilled = null;
    this.onFloatingText = null;
  }

  // 1. 初始化预热所有石器时代单位模型与原生骨骼动作 (通过 GLB 映射包)
  async preloadTemplates() {
    console.log("正在预热石器时代兵种模板 (GLB 映射)...");

    // 预加载投射物弹药模型
    const eggFbx = await this.loadFbxAsync('./models/era1/egg.fbx');
    this.eggModel = eggFbx;
    if (this.eggModel) {
      this.eggModel.scale.set(0.35, 0.35, 0.35);
    }

    // 预加载所有兵种 GLB (包含完整网格、武器挂载与原版骨骼动画)
    for (const [unitId, conf] of Object.entries(GAME_CONFIG.units)) {
      const gltf = await this.loadGltfAsync(conf.modelFile);
      if (gltf) {
        const model = gltf.scene;
        this.normalizeModel(model, conf.targetHeight);
        this.templates[unitId] = model;

        this.clipLibraries[unitId] = {};
        gltf.animations.forEach(clip => {
          this.clipLibraries[unitId][clip.name] = clip;
          this.clipLibraries[unitId][clip.name.toLowerCase()] = clip;
        });
        console.log(`✅ 兵种 ${unitId} 预热完成，包含 ${gltf.animations.length} 个原版动画:`, Object.keys(this.clipLibraries[unitId]));
      }
    }

    console.log("石器时代全量兵种原型预热完毕！");
  }

  loadGltfAsync(url) {
    return new Promise((resolve) => {
      this.gltfLoader.load(url, resolve, undefined, (err) => {
        console.error("加载 GLTF 失败:", url, err);
        resolve(null);
      });
    });
  }

  loadFbxAsync(url) {
    return new Promise((resolve) => {
      if (!this.fbxLoader) return resolve(null);
      this.fbxLoader.load(url, resolve, undefined, (err) => {
        console.error("加载 FBX 失败:", url, err);
        resolve(null);
      });
    });
  }

  normalizeModel(model, targetHeight) {
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.set(1, 1, 1);

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scale = size.y > 0.001 ? (targetHeight / size.y) : 1.0;
    model.scale.set(scale, scale, scale);

    const scaledBox = new THREE.Box3().setFromObject(model);
    model.userData.groundOffset = -scaledBox.min.y;

    model.traverse(c => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        if (c.material) {
          c.material.roughness = 0.8;
          c.material.metalness = 0.05;
        }
      }
    });
  }

  // 2. 战场产生单位实体
  spawnUnit(unitTypeId, isPlayer = true) {
    const config = GAME_CONFIG.units[unitTypeId];
    const template = this.templates[unitTypeId];
    if (!config || !template) {
      console.warn("未能生成单位，模板未就绪:", unitTypeId);
      return null;
    }

    // 使用 SkeletonUtils 完整克隆独立骨架网格
    const mesh = THREE.SkeletonUtils.clone(template);

    // 初始位置：从基地洞口步出
    const spawnX = isPlayer ? GAME_CONFIG.battlefield.playerSpawnX : GAME_CONFIG.battlefield.enemySpawnX;
    const randomZ = (Math.random() - 0.5) * 1.2;
    const groundOffsetY = template.userData.groundOffset || 0.0;
    mesh.position.set(spawnX, groundOffsetY, randomZ);

    // 朝向设置：GLB 模型默认面朝 -X。因此我方 (+X行军) 旋转 Math.PI，敌方 (-X行军) 保持 0
    if (isPlayer) {
      mesh.rotation.y = Math.PI;
    } else {
      mesh.rotation.y = 0;
      // 敌方单位赋予微调色调区分
      mesh.traverse(c => {
        if (c.isMesh && c.material) {
          if (Array.isArray(c.material)) {
            c.material = c.material.map(m => {
              const cl = m.clone();
              if (cl.color) cl.color.multiplyScalar(0.92);
              return cl;
            });
          } else if (typeof c.material.clone === 'function') {
            c.material = c.material.clone();
            if (c.material.color) c.material.color.multiplyScalar(0.92);
          }
        }
      });
    }

    this.scene.add(mesh);

    // 动作与混音器
    const mixer = new THREE.AnimationMixer(mesh);
    const clips = this.clipLibraries[unitTypeId] || {};
    const actions = {};
    for (const [name, clip] of Object.entries(clips)) {
      actions[name] = mixer.clipAction(clip);
    }

    const unit = {
      id: this.nextUnitId++,
      configId: unitTypeId,
      config,
      isPlayer,
      mesh,
      mixer,
      actions,
      state: 'walk',           // walk, attack, shoot, die
      hp: config.maxHp,
      maxHp: config.maxHp,
      x: spawnX,
      z: randomZ,
      attackCooldown: 0,
      hitPendingTimer: -1,
      target: null,
      deathTimer: 0,
      isRemoved: false,
      currentAction: null
    };

    // 默认执行行军迈步动作
    this.playAction(unit, 'walk');

    if (isPlayer) {
      this.playerUnits.push(unit);
    } else {
      this.enemyUnits.push(unit);
    }

    return unit;
  }

  // 播放指定骨骼动作 (原版 Unity 动画标准驱动)
  playAction(unit, actionName, loop = THREE.LoopRepeat) {
    if (!unit.actions) return;

    let resolvedName = actionName;
    if (resolvedName === 'death') resolvedName = 'die';

    let action = unit.actions[resolvedName];
    if (!action) {
      if (resolvedName === 'shoot' && unit.actions['attack']) action = unit.actions['attack'];
      else if (resolvedName === 'attack' && unit.actions['walk']) action = unit.actions['walk'];
      else if (resolvedName === 'die' && unit.actions['idle']) action = unit.actions['idle'];
      else action = Object.values(unit.actions)[0];
    }
    if (!action || unit.currentAction === action) return;

    if (unit.currentAction) {
      unit.currentAction.fadeOut(0.15);
    }

    action.reset();
    action.fadeIn(0.15);
    action.setLoop(loop, loop === THREE.LoopOnce ? 1 : Infinity);
    if (loop === THREE.LoopOnce) {
      action.clampWhenFinished = true;
    }
    action.play();
    unit.currentAction = action;
  }

  // 3. 主战斗帧驱动逻辑
  update(delta, playerBaseHp, enemyBaseHp) {
    // 排序单位：我方从右到左 (X 升序)，敌方从左到右 (X 降序)，前线单位始终在数组第 0 位
    this.playerUnits.sort((a, b) => b.x - a.x);
    this.enemyUnits.sort((a, b) => a.x - b.x);

    // 更新我方单位
    this.updateUnitList(this.playerUnits, this.enemyUnits, true, delta, enemyBaseHp);

    // 更新敌方单位
    this.updateUnitList(this.enemyUnits, this.playerUnits, false, delta, playerBaseHp);

    // 更新投射物抛物线弹道
    this.updateProjectiles(delta);

    // 清理阵亡单位
    this.cleanupDeadUnits(this.playerUnits);
    this.cleanupDeadUnits(this.enemyUnits);
  }

  updateUnitList(units, enemyUnits, isPlayer, delta, enemyBaseHp) {
    const moveDir = isPlayer ? 1 : -1;
    const enemyBaseX = isPlayer ? GAME_CONFIG.battlefield.enemyBaseX : GAME_CONFIG.battlefield.playerBaseX;

    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (u.isRemoved) continue;

      // 骨骼动画更新 (统一由原生 AnimationMixer 驱动)
      if (u.mixer) {
        u.mixer.update(delta);
      }

      // 死亡状态沉入地面
      if (u.state === 'die') {
        u.deathTimer += delta;
        if (u.deathTimer > 0.8) {
          u.mesh.position.y -= delta * 0.8; // 倒地后渐隐下沉
        }
        if (u.deathTimer >= 1.6) {
          u.isRemoved = true;
          this.scene.remove(u.mesh);
        }
        continue;
      }

      // 攻击冷却递减
      if (u.attackCooldown > 0) {
        u.attackCooldown -= delta;
      }

      // 攻击前摇伤害判定计时
      if (u.hitPendingTimer >= 0) {
        u.hitPendingTimer -= delta;
        if (u.hitPendingTimer <= 0) {
          this.executeHit(u, u.target);
          u.hitPendingTimer = -1;
        }
      }

      // --- 索敌与排队碰撞逻辑 ---
      // 1. 检查前方是否有友军阻挡 (防止兵团重叠挤压，已倒地死者不阻挡)
      let blockedByAlly = false;
      for (let aIdx = 0; aIdx < i; aIdx++) {
        const allyInFront = units[aIdx];
        if (allyInFront.state === 'die' || allyInFront.isRemoved) continue;
        const distToAlly = isPlayer ? (allyInFront.x - u.x) : (u.x - allyInFront.x);
        if (distToAlly > 0 && distToAlly < 1.35) {
          blockedByAlly = true;
          break;
        }
      }

      // 2. 检查前方最靠近的敌方存活目标
      let targetEnemy = null;
      let distToEnemy = 999;
      for (let eIdx = 0; eIdx < enemyUnits.length; eIdx++) {
        const e = enemyUnits[eIdx];
        if (e.state === 'die' || e.isRemoved) continue;
        const d = isPlayer ? (e.x - u.x) : (u.x - e.x);
        if (d >= -0.3 && d < distToEnemy) {
          distToEnemy = d;
          targetEnemy = e;
        }
      }

      const distToBase = isPlayer ? (enemyBaseX - u.x) : (u.x - enemyBaseX);

      // 判定是否进入近战打击范围
      const meleeReach = u.config.attackRange;
      const inMeleeWithEnemy = (targetEnemy && distToEnemy <= meleeReach && distToEnemy >= -0.3);
      const inMeleeWithBase = (distToBase <= (meleeReach + 2.5) && distToBase >= -0.5);

      // 远程投石兵判定是否进入射程 (14米)
      const isRanged = u.config.type === 'range';
      const inRangedWithEnemy = isRanged && !inMeleeWithEnemy && (targetEnemy && distToEnemy <= u.config.shootRange && distToEnemy >= 0.5);
      const inRangedWithBase = isRanged && !inMeleeWithBase && (distToBase <= u.config.shootRange && distToBase >= 0.5);

      if (inMeleeWithEnemy || inMeleeWithBase) {
        // --- 状态：近战挥砍 ---
        u.state = 'attack';
        const target = inMeleeWithEnemy ? targetEnemy : { isBase: true, isPlayer: !isPlayer };
        u.target = target;

        if (u.attackCooldown <= 0) {
          this.playAction(u, 'attack', THREE.LoopOnce);
          audioManager.playWhoosh();
          u.attackCooldown = u.config.attackDuration;
          u.hitPendingTimer = u.config.hitDelay || 0.35;
        }
      } else if (inRangedWithEnemy || inRangedWithBase) {
        // --- 状态：远程投石 ---
        u.state = 'shoot';
        const target = inRangedWithEnemy ? targetEnemy : { isBase: true, isPlayer: !isPlayer };
        u.target = target;

        if (blockedByAlly) {
          // 前方有友军，停步射击
          if (u.attackCooldown <= 0) {
            this.playAction(u, 'shoot', THREE.LoopOnce);
            audioManager.playWhoosh();
            u.attackCooldown = u.config.shootRate;
            this.launchRangedProjectile(u, target);
          } else {
            this.playAction(u, 'idle');
          }
        } else {
          // 前方无友军，边走边射或停下射击
          if (u.attackCooldown <= 0) {
            this.playAction(u, 'shoot', THREE.LoopOnce);
            u.attackCooldown = u.config.shootRate;
            this.launchRangedProjectile(u, target);
          } else {
            // 继续迈步
            this.playAction(u, 'walk');
            u.x += moveDir * u.config.moveSpeed * delta;
            u.mesh.position.x = u.x;
          }
        }
      } else {
        // --- 状态：行军推进 ---
        if (blockedByAlly) {
          // 排队待机
          u.state = 'idle';
          this.playAction(u, 'idle');
        } else {
          u.state = 'walk';
          this.playAction(u, 'walk');
          u.x += moveDir * u.config.moveSpeed * delta;
          u.mesh.position.x = u.x;
        }
      }
    }
  }

  // 近战实打命中
  executeHit(attacker, target) {
    if (!target) return;

    if (target.isBase) {
      // 攻击基地
      audioManager.playAttack();
      if (this.onUnitKilled) {
        this.onUnitKilled({ type: 'base_damage', isPlayerBase: target.isPlayer, damage: attacker.config.damage });
      }
      this.spawnFloatingText(`-${attacker.config.damage}`, attacker.mesh.position.x + (attacker.isPlayer ? 2 : -2), 2.5, '#f87171');
      return;
    }

    if (target.state === 'die') return;

    // 攻击敌方单位
    audioManager.playAttack();
    target.hp -= attacker.config.damage;
    this.spawnFloatingText(`-${attacker.config.damage}`, target.x, 2.0, '#ef4444');

    if (target.hp <= 0) {
      this.killUnit(target, attacker.isPlayer);
    }
  }

  // 远程投射原始恐龙卵/飞石
  launchRangedProjectile(attacker, target) {
    const startPos = new THREE.Vector3(
      attacker.x + (attacker.isPlayer ? 0.8 : -0.8),
      1.5,
      attacker.z
    );

    const targetX = target.isBase ? (target.isPlayer ? GAME_CONFIG.battlefield.playerBaseX : GAME_CONFIG.battlefield.enemyBaseX) : target.x;
    const targetPos = new THREE.Vector3(targetX, target.isBase ? 2.5 : 1.0, attacker.z);

    const dist = Math.abs(targetX - startPos.x);
    const speed = attacker.config.bulletSpeed || 14.0;
    const duration = dist / speed;

    const rockGeo = new THREE.DodecahedronGeometry(0.18, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 });
    const projectileMesh = new THREE.Mesh(rockGeo, rockMat);
    projectileMesh.position.copy(startPos);
    this.scene.add(projectileMesh);

    this.projectiles.push({
      mesh: projectileMesh,
      start: startPos,
      targetPos,
      target,
      damage: attacker.config.shootDamage,
      isPlayer: attacker.isPlayer,
      duration,
      elapsed: 0,
      peakY: Math.max(3.0, 1.5 + dist * 0.18)
    });
  }

  // 更新所有飞行中的弹道
  updateProjectiles(delta) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.elapsed += delta;
      const t = Math.min(1, p.elapsed / p.duration);

      // 二次抛物线轨迹
      const curX = THREE.MathUtils.lerp(p.start.x, p.targetPos.x, t);
      const curZ = THREE.MathUtils.lerp(p.start.z, p.targetPos.z, t);
      const arcY = 4 * p.peakY * t * (1 - t);
      const curY = THREE.MathUtils.lerp(p.start.y, p.targetPos.y, t) + arcY;

      p.mesh.position.set(curX, curY, curZ);
      p.mesh.rotation.x += delta * 12;
      p.mesh.rotation.z += delta * 10;

      if (t >= 1) {
        // 击中落地
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);

        if (p.target) {
          if (p.target.isBase) {
            audioManager.playAttack();
            if (this.onUnitKilled) {
              this.onUnitKilled({ type: 'base_damage', isPlayerBase: p.target.isPlayer, damage: p.damage });
            }
            this.spawnFloatingText(`-${p.damage}`, curX, 2.0, '#f87171');
          } else if (p.target.state !== 'die') {
            audioManager.playAttack();
            p.target.hp -= p.damage;
            this.spawnFloatingText(`-${p.damage}`, p.target.x, 2.0, '#f87171');
            if (p.target.hp <= 0) {
              this.killUnit(p.target, p.isPlayer);
            }
          }
        }
      }
    }
  }

  // 处死单位，触发金币/经验奖赏与阵亡倒地动作
  killUnit(unit, killedByPlayer) {
    if (unit.state === 'die') return;
    unit.state = 'die';
    unit.deathTimer = 0;

    this.playAction(unit, 'death', THREE.LoopOnce);
    audioManager.playDeath(unit.config.type === 'tank');

    if (killedByPlayer) {
      // 玩家获得金币与经验奖励
      audioManager.playCoin();
      const reward = unit.config.revenue;
      const exp = unit.config.expReward;

      this.spawnFloatingText(`+$${reward}`, unit.x, 2.5, '#34d399');

      if (this.onUnitKilled) {
        this.onUnitKilled({
          type: 'kill_reward',
          gold: reward,
          exp: exp,
          unitId: unit.configId
        });
      }
    }
  }

  // 抛出浮动伤害/金币提示文本
  spawnFloatingText(text, x, y, color = '#f87171') {
    if (this.onFloatingText) {
      this.onFloatingText({ text, x, y, color });
    }
  }

  cleanupDeadUnits(list) {
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].isRemoved) {
        list.splice(i, 1);
      }
    }
  }

  // 重置清空战场所有单位
  clearAll() {
    this.playerUnits.forEach(u => this.scene.remove(u.mesh));
    this.enemyUnits.forEach(u => this.scene.remove(u.mesh));
    this.projectiles.forEach(p => this.scene.remove(p.mesh));
    this.playerUnits = [];
    this.enemyUnits = [];
    this.projectiles = [];
  }
}
