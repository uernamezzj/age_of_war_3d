/**
 * Unit.js - 核心战斗单位类 (1:1 映射 AgeOfWarRemake/Assets/Scripts/Prefabs/Unit.cs 及 State 模式)
 * 支持：精准命中帧音效与扣血同步、大幅加速挥舞动作、后倒阵亡动作与尸体渐隐消散
 */

export class Unit {
  constructor(config, isPlayer = true, scene, clipLib, allClipLibs = null) {
    this.config = config;
    this.isPlayer = isPlayer; // true 为我方 (朝 +X 前进)，false 为敌方 (朝 -X 前进)
    this.scene = scene;
    this.clipLib = clipLib || {};
    this.allClipLibs = allClipLibs || (typeof window !== 'undefined' && window.gameManager && window.gameManager.clipLibraries) || (typeof window !== 'undefined' && window.clipLibraries) || {};

    // 核心战斗数值 (克隆自配置)
    this.hp = config.maxHp;
    this.maxHp = config.maxHp;
    this.damage = config.damage !== undefined ? config.damage : (config.attackDamage || 15);
    this.shootDamage = config.shootDamage || 0;
    this.moveSpeed = (config.moveSpeed !== undefined && !isNaN(config.moveSpeed)) ? config.moveSpeed : 2.0;
    this.colliderWidth = config.colliderWidth || 1.2;
    this.attackRange = config.attackRange || 1.5;
    this.maxShootingDistance = config.maxShootingDistance || 0;
    
    // 动作与命中帧校准 (大幅加速挥舞，0.32s 挥出瞬间精确扣血与响声音效)
    this.attackDuration = config.attackDuration || 0.85;
    this.hitDelay = config.hitDelay || 0.32;
    this.shootRate = config.shootRate || 1.5;

    // 状态机: 'idle' | 'walk' | 'attack' | 'die'
    this.state = 'idle';
    this.isDead = false;

    // 攻击周期与命中控制
    this.attackStartTime = 0;
    this.hitTriggered = false;
    this.lastShootTime = 0;
    this.stateChangedTime = 0;
    this.currentAttackType = 0; // 0: 水平砍, 1: 下劈

    // 阵亡与消散
    this.dieTime = 0;
    this.shouldDespawn = false;

    // 当前锁定的目标 (敌方单位或敌方基地)
    this.target = null;
    this.onHitCallback = null;

    // 3D 渲染对象
    this.mesh = null;
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;

    // 当前坐标
    this.position = new THREE.Vector3(0, 0, 0);
    this.yOffset = config.yOffset || 0;
  }

  // 初始化 3D 骨骼模型与动画剪辑
  initMesh(templateMesh) {
    if (window.THREE && window.THREE.SkeletonUtils && window.THREE.SkeletonUtils.clone) {
      this.mesh = window.THREE.SkeletonUtils.clone(templateMesh);
    } else {
      this.mesh = templateMesh.clone(true);
    }

    // 重新克隆骨骼蒙皮网格与绑定骨架 (避免动画共享冲突)
    this.mesh.traverse((node) => {
      if (node.isSkinnedMesh || node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        // 克隆材质防止透明度渐变与多材质相互污染
        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material = node.material.map(m => m ? m.clone() : m);
          } else {
            node.material = node.material.clone();
          }
        }
      }
    });

    // 关键修正：自动步枪突击手 (soldier_2) 仅双手持主武器步枪，隐藏模型中冗余残留的 M9 刺刀
    if (this.config.id === 'soldier_2') {
      this.mesh.traverse((node) => {
        if (node.name === 'Knife' || node.name === 'M9' || (node.name && node.name.toLowerCase().includes('knife'))) {
          node.visible = false;
        }
      });
    }

    // 关键修正：终极超能特种兵英雄 (trooper_4 / super_soldier) 1:1 白模蓝光超能战神
    // 黑色贴纸与装甲变成纯白，红色部分变成高科技湛蓝聚能光！
    if (this.config.id === 'trooper_4' || this.config.id === 'super_soldier') {
      this.mesh.traverse((node) => {
        if (node.isMesh || node.isSkinnedMesh) {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach(mat => {
            if (!mat) return;
            const matName = (mat.name || '').toLowerCase();
            // 黑色贴纸、深灰或护甲本体 -> 纯白/白金纳米高科技战甲
            if (matName.includes('black') || matName.includes('gray') || matName.includes('white')) {
              if (mat.color) mat.color.setHex(0xf8fafc);
              mat.roughness = 0.28;
              mat.metalness = 0.12;
            }
            // 红色发光区域 (RedEmission) -> 湛蓝/青蓝超能聚能辉光
            else if (matName.includes('red') || matName.includes('blue') || matName.includes('emission')) {
              if (mat.color) mat.color.setHex(0x38bdf8);
              if (mat.emissive) {
                mat.emissive.setHex(0x00f0ff);
                mat.emissiveIntensity = 2.8;
              }
            }
          });
        }
      });
    }

    // 创建独立的 AnimationMixer
    this.mixer = new THREE.AnimationMixer(this.mesh);

    // 绑定动画剪辑，同时为标准动作名 (walk, attack, idle, die, shoot) 建立直接索引
    for (const [name, clip] of Object.entries(this.clipLib)) {
      const lowerName = name.toLowerCase();
      const action = this.mixer.clipAction(clip);
      this.actions[lowerName] = action;
      this.actions[name] = action;

      // 提取核心名字 (如 "armature|armature|walk" -> "walk")
      const cleanName = lowerName.split('|').pop().trim();
      if (!this.actions[cleanName]) {
        this.actions[cleanName] = action;
      }

      // 如果包含核心关键字且尚未注册标准名，自动建立别名
      for (const stdName of ['walk', 'attack', 'idle', 'die', 'shoot']) {
        if (!this.actions[stdName] && cleanName.includes(stdName)) {
          this.actions[stdName] = action;
        }
      }

      // 攻击与射击动画单次播放
      if (lowerName.includes('attack') || lowerName.includes('shoot') || lowerName.includes('die')) {
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
      } else {
        action.setLoop(THREE.LoopRepeat);
      }
    }

    // 关键修正：突击手 (soldier_2) 攻击与射击动作统一使用端枪射击动作 attack2，坚决不播放单手刺刀砍刺动作 attack
    if (this.config.id === 'soldier_2') {
      const rifleShootAction = this.actions['attack2'] || this.actions['armature|attack2'];
      if (rifleShootAction) {
        this.actions['attack'] = rifleShootAction;
        this.actions['shoot'] = rifleShootAction;
      }
    }

    // 关键修正：野蛮人弹弓手 (caveman_2) - 深度融合野蛮人近战兵 (caveman_1) 的下半身步态与大步踏地
    // 1. 行走 (walk): c1 下半身 100% 正直迈步 + c2 上半身自然摆臂持弹弓，彻底消除蟹行与歪腿
    // 2. 射击/攻击 (shoot/attack): c1 大步向前扎实踏地下半身 + c2 原生拉满弹弓蓄力上半身 + Spine 脊柱精确偏转 -90°，使弹弓 100% 正对敌方目标！
    if (this.config.id === 'caveman_2') {
      const c1Lib = (this.allClipLibs && this.allClipLibs['caveman_1']) ||
                    (typeof window !== 'undefined' && window.gameManager && window.gameManager.clipLibraries && window.gameManager.clipLibraries['caveman_1']) ||
                    (typeof window !== 'undefined' && window.clipLibraries && window.clipLibraries['caveman_1']);

      const c1Walk = c1Lib ? (c1Lib['walk'] || c1Lib['Walk'] || c1Lib['armature|mixamo.com|layer0_armature']) : null;
      const c2Walk = this.clipLib['walk'] || (this.actions['walk'] && this.actions['walk'].getClip());
      const c2Shoot = this.clipLib['shoot'] || (this.actions['shoot'] && this.actions['shoot'].getClip());

      const isLower = (name) => {
        const l = name.toLowerCase();
        return l.includes('hips') || l.includes('leg') || l.includes('foot') || l.includes('toe');
      };

      // --- A. Walk 纯行军保持 caveman_2 原生挺拔自然走姿 (actions['walk'] 保持原生 Walk 剪辑) ---

      // --- B. Shoot 边走边射击动作融合 (c1下半身循环迈步 + c2上半身满弓拉弦 + Spine -90° 偏转) ---
      // 满足实战要求：行军射击时必须一边向前迈步走一边侧身拉弓射击，双腿持续动态踏步
      if (c1Walk && c2Shoot) {
        const shootDuration = c2Shoot.duration;
        const walkDuration = c1Walk.duration;
        const walkTimeScale = 2.4 / 1.35; // 匹配射击倍速(2.4)与正常行军倍速(1.35)的迈步频率
        const scaledWalkCycle = walkDuration * walkTimeScale;

        const fusedShootTracks = [];

        // 下半身：循环构建迈步轨道覆盖整个 shootDuration，保证射击过程中双腿持续自然行军迈步！
        c1Walk.tracks.forEach(track => {
          if (isLower(track.name)) {
            const times = track.times;
            const values = track.values;
            const itemSize = values.length / times.length;

            const numCycles = Math.ceil(shootDuration / scaledWalkCycle) + 1;
            const loopTimes = [];
            const loopValues = [];

            for (let c = 0; c < numCycles; c++) {
              const cycleTimeOffset = c * scaledWalkCycle;
              for (let i = 0; i < times.length; i++) {
                const t = cycleTimeOffset + times[i] * walkTimeScale;
                if (t > shootDuration + 0.05) break;

                loopTimes.push(t);
                for (let k = 0; k < itemSize; k++) {
                  loopValues.push(values[i * itemSize + k]);
                }
              }
            }

            // 确保末尾点正好落在 shootDuration
            if (loopTimes[loopTimes.length - 1] < shootDuration) {
              loopTimes.push(shootDuration);
              const lastTimeInCycle = (shootDuration % scaledWalkCycle) / walkTimeScale;
              let bestIdx = 0;
              let minDiff = 999;
              for (let i = 0; i < times.length; i++) {
                const d = Math.abs(times[i] - lastTimeInCycle);
                if (d < minDiff) { minDiff = d; bestIdx = i; }
              }
              for (let k = 0; k < itemSize; k++) {
                loopValues.push(values[bestIdx * itemSize + k]);
              }
            }

            const loopedTrack = new track.constructor(track.name, loopTimes, loopValues, track.getInterpolation());
            fusedShootTracks.push(loopedTrack);
          }
        });

        // 上半身：提取 c2Shoot 原生满弓蓄力拉弦轨道，并对 Spine (脊柱) 施加 -90° 偏转，
        // 使得下半身正直向前迈步的同时，上半身自然侧身扭转、弹弓与双臂 100% 正直对准正前方的敌人！
        const deltaQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);

        c2Shoot.tracks.forEach(track => {
          if (!isLower(track.name)) {
            const cloned = track.clone();
            if (track.name.toLowerCase().includes('spine.quaternion')) {
              const q = new THREE.Quaternion();
              for (let i = 0; i < cloned.values.length; i += 4) {
                q.set(cloned.values[i], cloned.values[i+1], cloned.values[i+2], cloned.values[i+3]);
                q.premultiply(deltaQ);
                cloned.values[i] = q.x;
                cloned.values[i+1] = q.y;
                cloned.values[i+2] = q.z;
                cloned.values[i+3] = q.w;
              }
            }
            fusedShootTracks.push(cloned);
          }
        });

        const fusedShootClip = new THREE.AnimationClip('fused_caveman_2_shoot', shootDuration, fusedShootTracks);
        const fusedShootAction = this.mixer.clipAction(fusedShootClip);
        fusedShootAction.setLoop(THREE.LoopOnce);
        fusedShootAction.clampWhenFinished = true;

        this.actions['shoot_walk'] = fusedShootAction;
        this.actions['shoot'] = fusedShootAction;
        this.actions['caveman_2_shoot_fitted'] = fusedShootAction;

        // --- C. ShootStand 原地站桩射击 (下半身双脚扎地稳健站桩 + 上半身拉满弹弓 Shoot + Spine -90° 偏转) ---
        // 彻底解决排队等待时的原地颤抖抽搐与双腿外撇大跨步：
        // 关键：caveman_2 的原生 Idle 带有大跨步和倾斜，改用 caveman_1 的正直站立姿态作为下半身基准！
        const c1Idle = c1Lib ? (c1Lib['idle'] || c1Lib['Idle']) : null;
        const baseIdleForLegs = c1Idle || this.clipLib['idle'] || (this.actions['idle'] && this.actions['idle'].getClip());
        if (baseIdleForLegs) {
          const fusedStandTracks = [];
          baseIdleForLegs.tracks.forEach(track => {
            if (isLower(track.name)) {
              // 提取静止稳健站姿并在整个 shootDuration 锁死保持稳定扎地
              const valSize = track.values.length / track.times.length;
              const val0 = [];
              for (let i = 0; i < valSize; i++) val0.push(track.values[i]);
              const standTrack = new track.constructor(track.name, [0, shootDuration], [...val0, ...val0]);
              fusedStandTracks.push(standTrack);
            }
          });
          // 上半身满弓蓄力
          fusedShootTracks.forEach(track => {
            if (!isLower(track.name)) {
              fusedStandTracks.push(track.clone());
            }
          });
          const fusedStandClip = new THREE.AnimationClip('fused_caveman_2_shoot_stand', shootDuration, fusedStandTracks);
          const fusedStandAction = this.mixer.clipAction(fusedStandClip);
          fusedStandAction.setLoop(THREE.LoopOnce);
          fusedStandAction.clampWhenFinished = true;
          this.actions['shoot_stand'] = fusedStandAction;

          // 同时也优化 caveman_2 的原生 actions['idle']：排队待命时双腿正直立正，不再前探后撇歪斜！
          if (c1Idle) {
            const fusedIdleTracks = [];
            c1Idle.tracks.forEach(t => {
              if (isLower(t.name)) {
                fusedIdleTracks.push(t.clone());
              }
            });
            const c2Idle = this.clipLib['idle'] || (this.actions['idle'] && this.actions['idle'].getClip());
            if (c2Idle) {
              c2Idle.tracks.forEach(t => {
                if (!isLower(t.name)) {
                  fusedIdleTracks.push(t.clone());
                }
              });
              const fusedIdleClip = new THREE.AnimationClip('fused_caveman_2_idle', c1Idle.duration, fusedIdleTracks);
              const fusedIdleAction = this.mixer.clipAction(fusedIdleClip);
              fusedIdleAction.setLoop(THREE.LoopRepeat);
              this.actions['idle'] = fusedIdleAction;
            }
          }
        }
      }
    }

    // 朝向设置：
    // 只有时代 1 的 caveman_1 和 caveman_2 来自 Mixamo (默认面朝 -Z)，需要转 ±Math.PI/2；
    // 其余所有单位 (caveman_3 恐龙骑兵，以及时代 2~5 的全部 12 个兵种)
    // 原始建模与导出基准统一为面朝 +X 轴。我方前进方向为 0，敌方前进方向为 Math.PI。
    // 关键修正：caveman_2 脚步必须完全正直向前沿战场行进 (Math.PI/2)，坚决去除 +0.22 导致的斜腿蟹行
    if (this.config.id === 'caveman_1' || this.config.id === 'caveman_2') {
      this.mesh.rotation.y = this.isPlayer ? Math.PI / 2 : -Math.PI / 2;
    } else {
      this.mesh.rotation.y = this.isPlayer ? 0 : Math.PI;
    }

    // 模型体型规范缩放 (确保所有时代兵种体态协调，消除微型手办失调)
    const defaultScales = {
      'caveman_3': 1.5,
      'soldier_3': 2.6, // 主战装甲坦克威严厚重
      'trooper_1': 2.5, // 挺拔未来光刃特警 (原高仅0.79m)
      'trooper_2': 1.8, // 沉稳等离子爆能枪手 (原高仅1.12m)
      'trooper_3': 2.8  // 终极重装突击机甲 (原高仅1.03m，放大后近3米高震撼战场)
    };
    const scale = this.config.scale || defaultScales[this.config.id] || 1.0;
    this.mesh.scale.setScalar(scale);
    this.mesh.position.set(this.position.x, this.position.y + this.yOffset, this.position.z);

    this.scene.add(this.mesh);
    this.playAnimation('idle');
  }

  playAnimation(name, crossFadeDuration = 0.12) {
    const key = name.toLowerCase();
    const action = this.actions[key] || 
                   this.actions[name] ||
                   Object.values(this.actions).find(a => a.getClip().name.toLowerCase().includes(key));

    if (!action) return;
    if (this.currentAction === action && action.isRunning()) return;

    // 关键修复：同一个动作连招重复播放时严禁对自身 fadeOut (否则权重归零瞬间触发骨骼静止 T-pose)
    if (this.currentAction && this.currentAction !== action) {
      action.reset();
      action.setEffectiveWeight(1.0);
      action.fadeIn(crossFadeDuration);
      this.currentAction.fadeOut(crossFadeDuration);
    } else {
      action.reset();
      action.setEffectiveWeight(1.0);
    }

    // 加速动作播放倍率，让战斗节奏干脆利落
    if (key.includes('attack')) {
      if (this.config.id === 'soldier_2') {
        action.timeScale = 1.6; // 突击手端枪点射连发节奏
      } else if (this.config.id === 'caveman_2') {
        action.timeScale = 5.0; // 弹弓手面对面近战挥砍猛击 (原生 6.04s 剪辑在约 1.1s 内完成强力挥砍)
      } else if (this.config.id === 'caveman_3' || this.config.id.includes('_3')) {
        action.timeScale = 1.2; // 载具与重装骑兵/机甲沉稳厚重
      } else {
        action.timeScale = 1.9; // 步兵极速挥砍
      }
    } else if (key.includes('shoot')) {
      if (this.config.id === 'caveman_2') {
        action.timeScale = 1.4; // 动作加快：拉弓、撒放、收招动作干脆利落 (1.4x 速率，约 1.32s 完成整套动作)
      } else if (this.config.id === 'soldier_2') {
        action.timeScale = 1.6; // 突击手端枪射击
      } else {
        action.timeScale = 1.6; // 射击动作紧凑
      }
    } else if (key.includes('die')) {
      action.timeScale = 1.6; // 倒地动作自然
    } else if (key.includes('walk')) {
      if (this.config.id === 'caveman_2') {
        action.timeScale = 2.4; // 针对野蛮人弹弓手长周期步伐加速，步频紧凑轻快协调，消除慢镜头月步
      } else if (this.config.id.includes('_3')) {
        action.timeScale = 1.0;
      } else {
        action.timeScale = 1.35;
      }
    } else {
      action.timeScale = 1.0;
    }

    action.play();
    this.currentAction = action;
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
    if (this.mesh) {
      this.mesh.position.set(x, y + this.yOffset, z);
    }
  }

  changeState(newState, target = null) {
    if (this.isDead) return;
    if (this.state === newState) {
      if (target) this.target = target;
      return;
    }

    this.state = newState;
    this.stateChangedTime = performance.now() / 1000;
    this.target = target;

    // 如果正在拉弓射击：
    // 若敌人逼近至近战肉搏面对面 (newState === 'attack')，立即取消拉弓、拔出近战招式反击！
    if (this.isShooting && newState !== 'die') {
      if (newState === 'attack') {
        this.isShooting = false;
        this.pendingShot = null;
      } else {
        return;
      }
    }

    if (newState === 'idle') {
      this.playAnimation('idle');
    } else if (newState === 'walk') {
      this.playAnimation('walk');
    } else if (newState === 'attack') {
      this.startAttackCycle();
    } else if (newState === 'die') {
      this.triggerDeath();
    }
  }

  startShootCycle(target, isPlayerArmy) {
    if (this.isDead) return;
    this.isShooting = true;
    this.shootStartTime = performance.now() / 1000;

    // 优先根据移动/待命状态选用动作：原地排队使用 shoot_stand，行军推进使用 shoot_walk
    let animName = 'shoot';
    if (this.config.id === 'soldier_2') {
      animName = 'attack2';
    } else if (this.config.id === 'caveman_2') {
      if (this.state === 'idle' && this.actions['shoot_stand']) {
        animName = 'shoot_stand';
      } else {
        animName = this.actions['shoot_walk'] ? 'shoot_walk' : 'shoot';
      }
    } else {
      const hasShoot = this.actions['shoot'] || Object.values(this.actions).some(a => a.getClip().name.toLowerCase().includes('shoot'));
      animName = hasShoot ? 'shoot' : 'attack';
    }
    this.playAnimation(animName);

    // 动作时长与击发释放点自适应计算
    const action = this.currentAction;
    const clipDuration = (action && action.getClip()) ? action.getClip().duration : 1.0;
    const timeScale = action ? (action.timeScale || 1.0) : 1.0;
    const effectiveDuration = clipDuration / Math.max(0.1, timeScale);

    // 击发延迟与动作周期：
    // 关键修正：弹弓手 caveman_2 严格等待“拉完满弓、右手甩出松弦放下的动作做完瞬间 (clipTime 1.30s)”才发射子弹！
    let releaseDelay = 0;
    let targetClipTime = null;
    if (this.config.id === 'caveman_2') {
      targetClipTime = 1.30; // 严格等拉满弓、手放下来的动作完全做完
      releaseDelay = targetClipTime / timeScale;
      this.shootDuration = Math.max(releaseDelay + 0.55, 1.85 / timeScale);
    } else {
      releaseDelay = this.config.hitDelay || Math.min(0.65, effectiveDuration * 0.55);
      this.shootDuration = Math.max(releaseDelay + 0.15, effectiveDuration);
    }

    this.pendingShot = {
      releaseTime: this.shootStartTime + releaseDelay,
      target: target,
      isPlayerArmy: isPlayerArmy,
      targetClipTime: targetClipTime
    };
  }

  startAttackCycle() {
    this.isShooting = false;
    this.pendingShot = null;
    this.attackStartTime = performance.now() / 1000;
    this.hitTriggered = false;

    // 关键修正：突击兵近战端枪开火；弹弓手面对面近战打人使用原生挥砍动作 (attack / attack_down)
    let animName = 'attack';
    if (this.config.id === 'soldier_2') {
      animName = 'attack2'; // 突击手端枪抵近开火射击
    } else if (this.currentAttackType % 2 === 0 && this.actions['attack_down']) {
      animName = 'attack_down';
    }

    this.playAnimation(animName);
    this.currentAttackType++;
  }

  triggerDeath() {
    this.isDead = true;
    this.isShooting = false;
    this.pendingShot = null;
    this.dieTime = performance.now() / 1000;
    if (this.actions['die']) {
      this.playAnimation('die');
    } else {
      this.playAnimation('idle');
    }
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.changeState('die');
    }
  }

  update(dt, nowSec) {
    if (this.mixer) {
      this.mixer.update(dt);
    }

    // 阵亡后处理：倒地、渐隐消散并在 2.2 秒后彻底移除
    if (this.isDead) {
      const elapsedDeath = nowSec - this.dieTime;

      // 1.4 秒后（倒地动作播完），开始淡出并略微沉入地下
      if (elapsedDeath > 1.3) {
        if (this.mesh) {
          this.mesh.position.y -= dt * 0.25;
          const fadeProgress = Math.max(0, 1.0 - (elapsedDeath - 1.3) / 0.8);
          this.mesh.traverse((node) => {
            if (node.isMesh && node.material) {
              node.material.transparent = true;
              node.material.opacity = fadeProgress;
            }
          });
        }
      }

      // 2.2 秒后演员彻底消失
      if (elapsedDeath >= 2.2) {
        this.shouldDespawn = true;
      }
      return;
    }

    // 远程射手拉弓释放精准判定：
    // 严格等待角色拉满弓、手放下来的一瞬间才发射子弹，坚决不提前发射！
    if (this.pendingShot) {
      let isReadyToRelease = false;
      const act = this.currentAction;
      if (this.pendingShot.targetClipTime && act) {
        // 核心：严格判定动作播放进度到达撒放手放下的瞬间 (act.time >= targetClipTime)
        // 只要手没放下来，子弹绝对不能提前发射！
        if (act.time >= this.pendingShot.targetClipTime) {
          isReadyToRelease = true;
        }
      } else if (nowSec >= this.pendingShot.releaseTime) {
        isReadyToRelease = true;
      }

      if (isReadyToRelease) {
        const shot = this.pendingShot;
        this.pendingShot = null;
        if (this.onShootReleaseCallback) {
          this.onShootReleaseCallback(this, shot);
        }
      }
    }

    // 远程射击动作周期完成判定：必须确保子弹已经发射完毕且动作收招完成后才允许切回走路！
    if (this.isShooting) {
      const act = this.currentAction;
      const animFinished = (this.config.id === 'caveman_2' && act)
        ? (act.time >= 1.85)
        : (nowSec - this.shootStartTime >= this.shootDuration);

      if (!this.pendingShot && animFinished) {
        this.isShooting = false;
        if (this.state === 'walk') {
          this.playAnimation('walk');
        } else if (this.state === 'idle') {
          this.playAnimation('idle');
        }
      }
    }

    // 行军推进 (WalkState) - 边走边打：远程射手在射程内拉弓射击时，持续保持位移推进！
    if (this.state === 'walk') {
      const dir = this.isPlayer ? 1 : -1;
      const speedMul = 1.0;
      this.position.x += dir * this.moveSpeed * speedMul * dt;
      if (this.mesh) {
        this.mesh.position.x = this.position.x;
      }
    }

    // 攻击循环 (AttackState)
    if (this.state === 'attack') {
      // 1. 在挥出最高点触发打击帧：精确播放音效与扣血
      if (!this.hitTriggered && (nowSec - this.attackStartTime >= this.hitDelay)) {
        this.hitTriggered = true;
        if (this.onHitCallback && this.target) {
          this.onHitCallback(this, this.target);
        }
      }

      // 2. 攻击周期结束，继续下一次挥砍或转回待命
      if (nowSec - this.attackStartTime >= this.attackDuration) {
        if (this.target && !this.target.isDead) {
          this.startAttackCycle();
        } else {
          this.changeState('idle');
        }
      }
    }
  }

  destroy() {
    if (this.mesh && this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
  }
}
