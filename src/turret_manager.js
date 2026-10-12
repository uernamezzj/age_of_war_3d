/**
 * 《战争进化史 3D》要塞防御塔攻防管理系统
 * 负责槽位扩展、塔楼升级、全自动索敌与抛石弹道打击
 */

import { GAME_CONFIG } from './game_config.js';
import { audioManager } from './audio_manager.js';

export class TurretManager {
  constructor(scene, gltfLoader, fbxLoader, battlefield, unitManager) {
    this.scene = scene;
    this.gltfLoader = gltfLoader || new THREE.GLTFLoader();
    this.fbxLoader = fbxLoader;
    this.battlefield = battlefield;
    this.unitManager = unitManager;

    // 预热好的防御塔模板与动画库
    this.turretTemplates = {};
    this.turretClips = {};
    this.ammoModel = null;

    // 双方槽位状态 (null 表示空置未造塔)
    // 玩家槽位 3 个
    this.playerSlots = [
      { unlocked: true, turret: null, mesh: null, mixer: null, actions: null, cooldown: 0, target: null },
      { unlocked: false, turret: null, mesh: null, mixer: null, actions: null, cooldown: 0, target: null },
      { unlocked: false, turret: null, mesh: null, mixer: null, actions: null, cooldown: 0, target: null },
    ];

    // 敌方电脑槽位 3 个
    this.enemySlots = [
      { unlocked: true, turret: null, mesh: null, mixer: null, actions: null, cooldown: 0, target: null },
      { unlocked: false, turret: null, mesh: null, mixer: null, actions: null, cooldown: 0, target: null },
      { unlocked: false, turret: null, mesh: null, mixer: null, actions: null, cooldown: 0, target: null },
    ];

    // 防御塔抛石弹道
    this.projectiles = [];
  }

  async preloadTemplates() {
    console.log("正在预热防御塔模型原型 (GLB 映射)...");

    const loadGltf = (url) => new Promise(res => {
      this.gltfLoader.load(url, res, undefined, () => res(null));
    });

    for (const [id, conf] of Object.entries(GAME_CONFIG.turrets)) {
      const gltf = await loadGltf(conf.modelFile);
      if (gltf) {
        const model = gltf.scene;
        this.normalizeTurret(model, conf.targetHeight);
        this.turretTemplates[id] = model;
        this.turretClips[id] = {};
        gltf.animations.forEach(c => {
          this.turretClips[id][c.name] = c;
        });
        console.log(`✅ 防御塔 ${id} 预热完成，包含 ${gltf.animations.length} 个原版动画:`, Object.keys(this.turretClips[id]));
      }
    }

    console.log("防御塔原型预热就绪！");
  }

  normalizeTurret(model, targetHeight) {
    if (!model) return;
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scale = size.y > 0.001 ? (targetHeight / size.y) : 1.0;
    model.scale.set(scale, scale, scale);

    model.traverse(c => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        if (c.material) c.material.roughness = 0.8;
      }
    });
  }

  // 建造或升级防御塔
  buildTurret(slotIndex, turretId, isPlayer = true) {
    const slots = isPlayer ? this.playerSlots : this.enemySlots;
    const slot = slots[slotIndex];
    if (!slot || !slot.unlocked) return false;

    const config = GAME_CONFIG.turrets[turretId];
    const template = this.turretTemplates[turretId];
    if (!config || !template) return false;

    // 清除旧塔模型
    if (slot.mesh) {
      if (slot.mixer) slot.mixer.stopAllAction();
      this.scene.remove(slot.mesh);
      slot.mesh = null;
      slot.mixer = null;
      slot.actions = null;
    }

    // 实例化新塔
    const mesh = THREE.SkeletonUtils.clone(template);
    const anchorPos = isPlayer ? this.battlefield.playerTurretSlots[slotIndex] : this.battlefield.enemyTurretSlots[slotIndex];

    mesh.position.copy(anchorPos);
    // 初始朝向敌方中线
    mesh.rotation.y = isPlayer ? (Math.PI / 2) : (-Math.PI / 2);

    this.scene.add(mesh);

    // 动画混音器与剪辑挂载
    const mixer = new THREE.AnimationMixer(mesh);
    const clips = this.turretClips[turretId] || {};
    const actions = {};
    for (const [name, clip] of Object.entries(clips)) {
      actions[name] = mixer.clipAction(clip);
    }
    if (actions['idle']) {
      actions['idle'].play();
    }

    slot.turret = config;
    slot.mesh = mesh;
    slot.mixer = mixer;
    slot.actions = actions;
    slot.cooldown = 0.5; // 刚建好有半秒警戒架设延迟

    audioManager.playTurret(config.level);
    return true;
  }

  // 出售防御塔
  sellTurret(slotIndex, isPlayer = true) {
    const slots = isPlayer ? this.playerSlots : this.enemySlots;
    const slot = slots[slotIndex];
    if (!slot || !slot.turret) return 0;

    const refund = slot.turret.sellRefund;
    if (slot.mesh) {
      if (slot.mixer) slot.mixer.stopAllAction();
      this.scene.remove(slot.mesh);
      slot.mesh = null;
      slot.mixer = null;
      slot.actions = null;
    }
    slot.turret = null;
    audioManager.playCoin();
    return refund;
  }

  // 解锁槽位
  unlockSlot(slotIndex, isPlayer = true) {
    const slots = isPlayer ? this.playerSlots : this.enemySlots;
    if (slots[slotIndex]) {
      slots[slotIndex].unlocked = true;
      return true;
    }
    return false;
  }

  // 主更新：全自动索敌与开火抛射
  update(delta) {
    // 1. 我方防御塔索敌打击敌方单位
    this.updateTurretSlots(this.playerSlots, this.unitManager.enemyUnits, true, delta);

    // 2. 敌方防御塔索敌打击我方单位
    this.updateTurretSlots(this.enemySlots, this.unitManager.playerUnits, false, delta);

    // 3. 飞行巨石抛物线弹道物理与爆裂结算
    this.updateProjectiles(delta);
  }

  updateTurretSlots(slots, targetUnits, isPlayer, delta) {
    slots.forEach((slot, idx) => {
      if (!slot.unlocked || !slot.turret || !slot.mesh) return;

      // 更新防御塔原版动作
      if (slot.mixer) {
        slot.mixer.update(delta);
      }

      if (slot.cooldown > 0) {
        slot.cooldown -= delta;
      }

      // 寻找射程内最近的目标 (排在第 0 位的前锋)
      let target = null;
      if (targetUnits.length > 0) {
        for (let u of targetUnits) {
          if (u.state === 'die') continue;
          const dist = Math.abs(u.x - slot.mesh.position.x);
          if (dist <= slot.turret.range) {
            target = u;
            break;
          }
        }
      }

      if (target) {
        // 水平瞄准转向
        const dx = target.x - slot.mesh.position.x;
        const targetAngle = Math.atan2(target.z - slot.mesh.position.z, dx);
        slot.mesh.rotation.y = THREE.MathUtils.lerp(slot.mesh.rotation.y, targetAngle, delta * 5.0);

        // 装填完毕立即击发
        if (slot.cooldown <= 0) {
          this.fireTurret(slot, target, isPlayer);
          slot.cooldown = slot.turret.fireRate;
        }
      }
    });
  }

  fireTurret(slot, target, isPlayer) {
    // 触发原版投石/攻击动作
    if (slot.actions && slot.actions['attack']) {
      slot.actions['attack'].reset();
      slot.actions['attack'].setLoop(THREE.LoopOnce, 1);
      slot.actions['attack'].play();
    }

    const startPos = slot.mesh.position.clone().add(new THREE.Vector3(isPlayer ? 0.8 : -0.8, 1.2, 0));
    const targetPos = new THREE.Vector3(target.x, 0.8, target.z);
    const dist = Math.abs(target.x - startPos.x);
    const speed = slot.turret.bulletSpeed;
    const duration = Math.max(0.4, dist / speed);

    // 弹药网格 (巨石/恐龙蛋)
    const ammoGeo = new THREE.DodecahedronGeometry(slot.turret.level === 3 ? 0.45 : 0.28, 0);
    const ammoMat = new THREE.MeshStandardMaterial({
      color: slot.turret.level === 3 ? 0x451a03 : 0x78716c,
      roughness: 0.95
    });
    const ammoMesh = new THREE.Mesh(ammoGeo, ammoMat);
    ammoMesh.position.copy(startPos);
    this.scene.add(ammoMesh);

    this.projectiles.push({
      mesh: ammoMesh,
      start: startPos,
      targetPos,
      target,
      damage: slot.turret.damage,
      splashRadius: slot.turret.splashRadius || 0,
      isPlayer,
      duration,
      elapsed: 0,
      peakY: Math.max(5.0, startPos.y + dist * 0.25)
    });

    audioManager.playTurret(slot.turret.level);
  }

  updateProjectiles(delta) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.elapsed += delta;
      const t = Math.min(1, p.elapsed / p.duration);

      const curX = THREE.MathUtils.lerp(p.start.x, p.targetPos.x, t);
      const curZ = THREE.MathUtils.lerp(p.start.z, p.targetPos.z, t);
      const arcY = 4 * p.peakY * t * (1 - t);
      const curY = THREE.MathUtils.lerp(p.start.y, p.targetPos.y, t) + arcY;

      p.mesh.position.set(curX, curY, curZ);
      p.mesh.rotation.x += delta * 15;
      p.mesh.rotation.y += delta * 10;

      if (t >= 1) {
        // 落地爆炸
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);

        audioManager.playExplosion();

        // 范围溅射或单体打击
        const targetList = p.isPlayer ? this.unitManager.enemyUnits : this.unitManager.playerUnits;

        if (p.splashRadius > 0) {
          // 3阶投石塔巨型范围爆破
          targetList.forEach(u => {
            if (u.state === 'die') return;
            if (Math.abs(u.x - curX) <= p.splashRadius) {
              u.hp -= p.damage;
              this.unitManager.spawnFloatingText(`-${p.damage}`, u.x, 2.2, '#f59e0b');
              if (u.hp <= 0) {
                this.unitManager.killUnit(u, p.isPlayer);
              }
            }
          });
        } else if (p.target && p.target.state !== 'die') {
          // 单体命中
          p.target.hp -= p.damage;
          this.unitManager.spawnFloatingText(`-${p.damage}`, p.target.x, 2.0, '#f87171');
          if (p.target.hp <= 0) {
            this.unitManager.killUnit(p.target, p.isPlayer);
          }
        }
      }
    }
  }

  clearAll() {
    [...this.playerSlots, ...this.enemySlots].forEach(s => {
      if (s.mesh) this.scene.remove(s.mesh);
      s.mesh = null;
      s.turret = null;
    });
    this.projectiles.forEach(p => this.scene.remove(p.mesh));
    this.projectiles = [];
  }

  reset() {
    this.clearAll();
    this.playerSlots = [
      { unlocked: true, turret: null, mesh: null, cooldown: 0, target: null },
      { unlocked: false, turret: null, mesh: null, cooldown: 0, target: null },
      { unlocked: false, turret: null, mesh: null, cooldown: 0, target: null },
    ];
    this.enemySlots = [
      { unlocked: true, turret: null, mesh: null, cooldown: 0, target: null },
      { unlocked: false, turret: null, mesh: null, cooldown: 0, target: null },
      { unlocked: false, turret: null, mesh: null, cooldown: 0, target: null },
    ];
  }
}
