/**
 * Turret.js - 基地防御塔实体类 (1:1 映射 AgeOfWarRemake/Assets/Scripts/Prefabs/Turret.cs)
 * 具备原版全时代 15 款武器攻击动作、关键帧插值、瞄准俯仰角与打击节奏引擎
 */

import { TURRET_ANIMATIONS } from '../config/TurretAnimations.js';

export class Turret {
  constructor(config, scene, projectileManager, soundManager = null) {
    this.config = config;
    this.scene = scene;
    this.projectileManager = projectileManager;
    this.soundManager = soundManager;

    this.range = config.range || 16.0;
    this.damage = config.damage || 10;
    this.bulletSpeed = config.bulletSpeed || 16.0;
    this.attackRate = config.attackRate || 1.8;

    this.position = new THREE.Vector3(0, 0, 0);
    this.mesh = null;
    this.innerMesh = null;
    this.isPlayer = true;
    this.currentTarget = null;

    // 原版动画状态机与关键帧引擎
    this.anim = TURRET_ANIMATIONS[config.id] || null;
    this.animState = 'idle'; // 'idle' | 'attack'
    this.animTime = 0;
    this.firedBullets = new Set();
    this.hasPlayedSound = false;

    // 缓存内部所有动部件与初始 Local Transform
    this.animatedParts = {};
    this.subNodeMap = new Map();
    this.ammoPart = null;

    // 瞄准俯仰角
    this.aimPitch = 0;
  }

  initMesh(templateMesh) {
    // 根组：原点为真实的“绑定点 (Mount Pivot / 齿轮安装座)”
    this.mesh = new THREE.Group();
    this.mesh.name = `Turret_${this.config.id}`;

    const innerMesh = templateMesh.clone(true);

    // 取得该防御塔专属的真实绑定点 (Mount Pivot) 并在局部坐标系平移归零
    const pivot = this.config.mountPivot || { x: 0, y: 0, z: 0 };
    innerMesh.position.set(-pivot.x, -pivot.y, -pivot.z);

    const scale = this.config.scale !== undefined ? this.config.scale : 0.50;
    this.mesh.scale.setScalar(scale);

    // 遍历索引所有子网格与动部件
    this.animatedParts = {};
    this.subNodeMap = new Map();

    innerMesh.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }

      // 记录初始 rest pose
      node.userData.initPos = node.position.clone();
      node.userData.initRot = {
        x: node.rotation.x,
        y: node.rotation.y,
        z: node.rotation.z
      };

      this.animatedParts[node.name] = node;
      const normKey = node.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      this.subNodeMap.set(normKey, node);
    });

    this.mesh.add(innerMesh);
    this.innerMesh = innerMesh;

    // 时代 5 最弱炮 (turret_5_1) 外观材质校准：替换为翡翠科技绿光
    if (this.config.id === 'turret_5_1') {
      innerMesh.traverse((child) => {
        if (child.isMesh && child.material) {
          if (child.material.name === 'Red' || child.name === 'Cylinder003_2') {
            child.material = new THREE.MeshStandardMaterial({
              color: 0x10b981,
              emissive: 0x059669,
              roughness: 0.2,
              metalness: 0.6
            });
          }
        }
      });
    }

    // 缓存弹药网格 (如投石车碗中石块)
    if (this.anim && this.anim.ammoPartName) {
      this.ammoPart = this.getPartByPath(this.anim.ammoPartName);
    }

    // 时代 3 加农炮身与后坐力冲程初始化
    this.recoilTimer = 0;
    if (this.config.age === 3) {
      this.recoilBarrel = this.getPartByPath('1') || this.getPartByPath('2') || this.getPartByPath('3');
    }

    // 时代 5 未来科技发射器中枢爆闪光核初始化
    this.coreFlashTimer = 0;
    if (this.config.age === 5) {
      this.initMuzzleCoreFlash();
    }
  }

  // 为时代 5 炮塔建立位于发射器正中的高能发光光核 (上下绝对居中，绿/红/蓝三色等级校准，小巧精致能看见即可)
  initMuzzleCoreFlash() {
    if (!this.innerMesh) return;
    const group = new THREE.Group();

    // 默认/最弱炮 5_1：绿光 (Titanium Shooter)
    let coreColor = 0x34d399; // 翡翠亮绿
    let glowColor = 0x10b981;
    let localPos = new THREE.Vector3(2.2, 0.508, 0.0);
    let radius = 0.045; // 小巧微型光核，清晰可见而不臃肿

    if (this.config.id === 'turret_5_2') {
      // 中等炮 5_2：红光 (Laser Cannon)
      coreColor = 0xf87171; // 宝石纯正高能红
      glowColor = 0xef4444;
      localPos.set(0.95, 0.580, 0.0);
      radius = 0.050;
    } else if (this.config.id === 'turret_5_3') {
      // 最强炮 5_3：蓝光 (Ion Cannon)
      coreColor = 0x67e8f9; // 量子苍蓝电弧
      glowColor = 0x0284c7;
      localPos.set(0.85, 0.636, 0.0);
      radius = 0.055;
    }

    const coreMesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 14, 14),
      new THREE.MeshBasicMaterial({ color: coreColor })
    );
    const glowMesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.8, 14, 14),
      new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.65
      })
    );
    group.add(coreMesh);
    group.add(glowMesh);
    group.position.copy(localPos);
    group.visible = true; // 常态居中呼吸微光，上下绝对居中

    this.innerMesh.add(group);
    this.coreFlashGroup = group;
  }

  // 根据 Unity .anim 中的 path 匹配 Three.js 模型内部的骨骼/网格部件
  getPartByPath(path) {
    if (!path) return null;
    if (this.animatedParts[path]) return this.animatedParts[path];

    const normPath = path.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const leaf = path.split('/').pop().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    if (this.subNodeMap.has(normPath)) return this.subNodeMap.get(normPath);
    if (this.subNodeMap.has(leaf)) return this.subNodeMap.get(leaf);

    const tid = this.config.id;
    // 跨命名差异的智能别名映射
    if (tid && tid.startsWith('turret_3_') && (normPath === '1' || leaf === '1')) {
      if (this.subNodeMap.has('1')) return this.subNodeMap.get('1');
      if (this.subNodeMap.has('2')) return this.subNodeMap.get('2');
      if (this.subNodeMap.has('3')) return this.subNodeMap.get('3');
    }
    if (tid === 'turret_4_1' && leaf === 'handle') {
      if (this.subNodeMap.has('turret1001')) return this.subNodeMap.get('turret1001');
    }
    if (tid === 'turret_4_2' && leaf === 'base') {
      if (this.subNodeMap.has('turret2')) return this.subNodeMap.get('turret2');
    }
    if (tid === 'turret_5_1' && leaf === 'base') {
      if (this.subNodeMap.has('turret1')) return this.subNodeMap.get('turret1');
    }
    if (tid === 'turret_5_2') {
      if (leaf === 'wingdown' && this.subNodeMap.has('turret2001')) return this.subNodeMap.get('turret2001');
      if (leaf === 'wingup' && this.subNodeMap.has('turret2002')) return this.subNodeMap.get('turret2002');
    }
    if (tid === 'turret_5_3') {
      if (leaf === 'wingup' && this.subNodeMap.has('turret3001')) return this.subNodeMap.get('turret3001');
      if (leaf === 'wingdown' && this.subNodeMap.has('turret3002')) return this.subNodeMap.get('turret3002');
      if (leaf === 'handledown' && this.subNodeMap.has('turret3003')) return this.subNodeMap.get('turret3003');
      if (leaf === 'handleup' && this.subNodeMap.has('turret3004')) return this.subNodeMap.get('turret3004');
    }

    return null;
  }

  mount(worldPos, isPlayer, slotConfig = {}) {
    this.position.copy(worldPos);
    this.isPlayer = isPlayer;
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      const rotOffset = (this.config.rotationOffset || 0) + (slotConfig.rotationY || 0);
      this.mesh.rotation.y = (isPlayer ? 0 : Math.PI) + rotOffset;
      this.baseRotationY = this.mesh.rotation.y;

      const baseScale = this.config.scale !== undefined ? this.config.scale : 0.50;
      if (slotConfig.scale) {
        this.mesh.scale.setScalar(baseScale * slotConfig.scale);
      } else {
        this.mesh.scale.setScalar(baseScale);
      }
      this.scene.add(this.mesh);
    }
  }

  // 寻找射程内最靠前的敌方单位或敌方老巢 (1:1 映射 Unity Turret.cs CheckCollision)
  findTarget(enemyUnits = [], enemyBase = null) {
    let closestUnit = null;
    let minDistance = Infinity;

    // 1. 优先搜索射程内的存活敌兵先锋
    for (const unit of enemyUnits) {
      if (unit.isDead) continue;
      const dist = Math.abs(unit.position.x - this.position.x);
      if (dist <= this.range) {
        if (dist < minDistance) {
          minDistance = dist;
          closestUnit = unit;
        }
      }
    }

    // 2. 若无敌兵在射程内，检查敌方老巢：
    // 当战线推进到敌方要塞附近 (baseDist <= this.range) 时可锁定老巢开火
    if (!closestUnit && enemyBase && !enemyBase.isDead) {
      const baseDist = Math.abs(enemyBase.position.x - this.position.x);
      if (baseDist <= this.range) {
        closestUnit = enemyBase;
      }
    }

    return closestUnit;
  }

  // 核心逐帧状态机与动作驱动更新
  update(dt, nowSec, enemyUnits = [], enemyBase = null) {
    if (!this.mesh) return;

    // 1. 索敌检测 (支持小兵与敌方老巢)
    this.currentTarget = this.findTarget(enemyUnits, enemyBase);

    // 2. 目标瞄准俯仰角 (方向指着目标)
    if (this.innerMesh) {
      // 重型投石机械 (原始投石机、中世纪投石机、烈焰火油投石塔) 与沸油倾泻机：
      // 底盘重型稳固固定于城垛，齿轮/机体轴心永远保持原位不发生整车向下倾倒位移，直接以恒定轴心进行旋转投射！
      const isFixedChassisTurret = ['turret_1_3', 'turret_2_1', 'turret_2_2', 'turret_2_3'].includes(this.config.id);

      if (isFixedChassisTurret) {
        this.aimPitch = 0;
        this.innerMesh.rotation.z = 0;
      } else if (this.currentTarget) {
        const isBase = (this.currentTarget.turretSlots !== undefined);
        const tgtCenterY = isBase ? 2.0 : (this.currentTarget.position.y + 0.6);
        const dx = (this.currentTarget.position.x - this.position.x) * (this.isPlayer ? 1 : -1);
        const dy = tgtCenterY - (this.position.y + 0.8);
        const rawPitch = Math.atan2(dy, Math.max(0.5, dx));
        // 限制合理俯仰角：向下最多瞄准 -60° (-1.05 rad)，向上最多抬高 +15° (+0.26 rad)
        const targetPitch = Math.max(-1.05, Math.min(0.26, rawPitch));

        // 瞄准平滑响应 (未来科技炮塔响应更为迅捷精准)
        const lerpSpeed = (this.config.age === 5) ? 14.0 : 6.0;
        this.aimPitch = THREE.MathUtils.lerp(this.aimPitch, targetPitch, dt * lerpSpeed);

        // 时代 3 教堂加农炮：齿轮 gear 牢固固定于城垛底座绝对不动，仅炮台/炮身 recoilBarrel 响应俯仰瞄准
        if (this.config.age === 3 && this.recoilBarrel) {
          this.innerMesh.rotation.z = 0;
          this.recoilBarrel.rotation.z = this.aimPitch;
        } else {
          this.innerMesh.rotation.z = this.aimPitch; // 关键：指向地面目标，消除 -aimPitch 导致的仰天开火！
        }
      } else {
        // 无目标时平滑回平
        this.aimPitch = THREE.MathUtils.lerp(this.aimPitch, 0, dt * 4.0);
        if (this.config.age === 3 && this.recoilBarrel) {
          this.innerMesh.rotation.z = 0;
          this.recoilBarrel.rotation.z = this.aimPitch;
        } else {
          this.innerMesh.rotation.z = this.aimPitch;
        }
      }
    }

    // 时代 3 加农炮身真实后坐力冲程 (Recoil)
    if (this.config.age === 3 && this.recoilBarrel) {
      if (this.recoilTimer > 0) {
        this.recoilTimer -= dt;
        const recoilDuration = 0.35;
        const elapsed = recoilDuration - this.recoilTimer;
        let kickX = 0;
        if (elapsed < 0.06) {
          // 0 ~ 0.06s: 极速向后猛烈后冲 (-0.22m)
          kickX = -(elapsed / 0.06) * 0.22;
        } else {
          // 0.06 ~ 0.35s: 平滑复位回 battery 原位
          const returnFrac = (elapsed - 0.06) / (recoilDuration - 0.06);
          kickX = -0.22 * (1.0 - Math.min(1.0, returnFrac));
        }
        const initPos = this.recoilBarrel.userData.initPos || { x: 0, y: 0, z: 0 };
        this.recoilBarrel.position.x = initPos.x + kickX;
      } else if (this.recoilBarrel.userData.initPos) {
        this.recoilBarrel.position.x = this.recoilBarrel.userData.initPos.x;
      }
    }

    // 时代 5 发射器中间光斑呼吸微光与开火爆闪 (上下绝对居中，小巧精致能看见即可)
    if (this.coreFlashGroup) {
      if (this.coreFlashTimer > 0) {
        this.coreFlashTimer -= dt;
        this.coreFlashGroup.visible = true;
        const p = Math.max(0, this.coreFlashTimer / 0.16);
        this.coreFlashGroup.scale.setScalar(1.0 + p * 0.5); // 击发时微张，不膨胀为巨球
        if (this.coreFlashGroup.children[1]) {
          this.coreFlashGroup.children[1].material.opacity = 0.65 + p * 0.35;
        }
      } else {
        // 常态居中呼吸微光
        this.coreFlashGroup.visible = true;
        const pulse = 1.0 + Math.sin((nowSec || 0) * 3.5) * 0.08;
        this.coreFlashGroup.scale.setScalar(pulse);
        if (this.coreFlashGroup.children[1]) {
          this.coreFlashGroup.children[1].material.opacity = 0.55 + Math.sin((nowSec || 0) * 3.5) * 0.15;
        }
      }
    }

    // 3. 攻击动作状态机 (Attack Trigger)
    if (this.currentTarget) {
      if (this.animState === 'idle') {
        this.animState = 'attack';
        this.animTime = 0;
        this.firedBullets.clear();
        this.hasPlayedSound = false;
      }
    }

    // 4. 推进攻击动作播放
    if (this.animState === 'attack') {
      const cycleDuration = Math.max(this.anim ? this.anim.duration : 0, this.attackRate);
      this.animTime += dt;

      // 检查音效播放时机
      if (this.anim && this.anim.soundEvents) {
        for (const se of this.anim.soundEvents) {
          if (this.animTime >= se.t && !this.hasPlayedSound) {
            this.playSound();
            this.hasPlayedSound = true;
            break;
          }
        }
      }

      // 检查子弹击发生成时机 (SpawnBullet)
      if (this.anim && this.anim.bulletEvents) {
        this.anim.bulletEvents.forEach((be, idx) => {
          if (this.animTime >= be.t && !this.firedBullets.has(idx)) {
            this.firedBullets.add(idx);
            this.fire(this.currentTarget, idx);
          }
        });
      }

      // 驱动全骨骼与部件逐帧曲线插值 (时代 5 炮塔保持刚体姿态，无机械变形)
      if (this.anim) {
        this.anim.applyPose(this, Math.min(this.animTime, this.anim.duration), cycleDuration, this.animTime);
      }

      // 动作周期完成，检查进入下一个循环还是回到 Idle
      if (this.animTime >= cycleDuration) {
        this.animTime = 0;
        this.firedBullets.clear();
        this.hasPlayedSound = false;

        // 若当前目标已阵亡或离开射程，且没有新目标，平滑切回 Idle
        if (!this.currentTarget || this.currentTarget.isDead) {
          this.currentTarget = this.findTarget(enemyUnits, enemyBase);
        }

        if (!this.currentTarget) {
          this.animState = 'idle';
          if (this.anim) {
            this.anim.resetPose(this);
          }
        }
      }
    } else {
      // Idle 休息姿态
      if (this.anim) {
        this.anim.resetPose(this);
      }
      this.aimPitch = THREE.MathUtils.lerp(this.aimPitch, 0, dt * 3.0);
      if (this.config.age === 3 && this.recoilBarrel) {
        this.innerMesh.rotation.z = 0;
        this.recoilBarrel.rotation.z = this.aimPitch;
      } else if (this.innerMesh && !['turret_1_3', 'turret_2_1', 'turret_2_2', 'turret_2_3'].includes(this.config.id)) {
        this.innerMesh.rotation.z = this.aimPitch;
      } else if (this.innerMesh) {
        this.innerMesh.rotation.z = 0;
      }
    }
  }

  // 播放原版攻击音效
  playSound() {
    if (this.soundManager) {
      if (this.soundManager.playTurret) {
        this.soundManager.playTurret(this.config.age, this.config.level);
      } else if (this.anim && this.soundManager.playTurretClip) {
        this.soundManager.playTurretClip(this.anim.soundName);
      }
    }
  }

  // 精准计算各型号炮塔开火炮口在 3D 世界空间下的坐标 (与瞄准俯仰角联动)
  getMuzzleWorldPos(bulletIdx = 0) {
    if (!this.innerMesh) {
      let forwardX = this.isPlayer ? 0.8 : -0.8;
      return this.position.clone().add(new THREE.Vector3(forwardX, 0.6, 0));
    }

    this.innerMesh.updateMatrixWorld(true);
    const tid = this.config.id;

    // 时代 3 加农炮口精准锚点 (与炮台 recoilBarrel 实时联动，烟雾严密锁定在炮嘴前端出口)
    if (this.config.age === 3 && this.recoilBarrel) {
      this.recoilBarrel.updateMatrixWorld(true);
      let localTip = new THREE.Vector3(0.168, 0.0, 0.068);
      if (tid === 'turret_3_2') localTip = new THREE.Vector3(0.174, 0.0, 0.067);
      if (tid === 'turret_3_3') localTip = new THREE.Vector3(0.189, 0.0, 0.065);
      return this.recoilBarrel.localToWorld(localTip.clone());
    }

    // 时代 5 未来科技发射器中枢锚点 (上下绝对居中发射)
    if (tid === 'turret_5_1') {
      return this.innerMesh.localToWorld(new THREE.Vector3(3.30, 0.508, 0.0));
    }
    if (tid === 'turret_5_2') {
      return this.innerMesh.localToWorld(new THREE.Vector3(1.30, 0.580, 0.0));
    }
    if (tid === 'turret_5_3') {
      return this.innerMesh.localToWorld(new THREE.Vector3(1.25, 0.636, 0.0));
    }

    // 时代 2 沸油倾泻机垂直倒油口
    if (tid === 'turret_2_3') {
      return this.innerMesh.localToWorld(new THREE.Vector3(1.50, 0.40, 0.0));
    }

    // 时代 4 武器
    if (tid === 'turret_4_3') {
      const zOff = (bulletIdx === 0) ? 0.15 : -0.15;
      return this.innerMesh.localToWorld(new THREE.Vector3(1.20, 0.60, zOff));
    }
    if (tid === 'turret_4_1') {
      return this.innerMesh.localToWorld(new THREE.Vector3(1.20, 0.60, 0.0));
    }
    if (tid === 'turret_4_2') {
      return this.innerMesh.localToWorld(new THREE.Vector3(0.80, 0.70, 0.0));
    }

    return this.innerMesh.localToWorld(new THREE.Vector3(0.80, 0.60, 0.0));
  }

  // 生成投射物发射
  fire(target, bulletIdx = 0) {
    if (!this.projectileManager) return;

    const spawnPos = this.getMuzzleWorldPos(bulletIdx);

    // 时代 3 加农炮开火反馈：触发后坐力冲程与炮口火光浓烟
    if (this.config.age === 3) {
      this.recoilTimer = 0.35;
      if (this.projectileManager.spawnMuzzleFlash) {
        this.projectileManager.spawnMuzzleFlash(spawnPos, this.isPlayer, 3);
      }
    }
    // 时代 5 未来科技开火反馈：发射器中枢高能光点剧烈爆闪一次
    else if (this.config.age === 5) {
      this.coreFlashTimer = 0.16;
    }

    this.projectileManager.spawnTurretProjectile(
      spawnPos,
      target,
      this.config,
      this.isPlayer
    );
  }

  // 独立动作测试 (用于 align_tool 或调试预览)
  testAttackOnce() {
    this.animState = 'attack';
    this.animTime = 0;
    this.firedBullets.clear();
    this.hasPlayedSound = false;
  }

  destroy() {
    if (this.mesh && this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
  }
}
