/**
 * SpecialAttackManager.js - 时代终极大招武器调度器 (高保真 3D 重制版)
 * 1:1 映射原版 AgeOfWarRemake 与经典战争时代技能体系
 *
 * 时代 1：Volcano eruption (火山喷发 - 原版真实火山陨石岩 + 烈焰流光浓烟尾迹 + 落地剧烈地裂爆炸)
 * 时代 2：Sword Rain (万剑归宗 / 倾盆剑雨 - 真实中世纪骑士冷兵器钢剑 + 破空残影 + 贯穿插地颤音物理)
 * 时代 3：Blessing (神圣庇护 - 天降金色圣光柱 + 环绕全身旋转神圣金环 + 脚底神圣法阵 + 全身金光流转沐浴圣光)
 * 时代 4：Aerial support (现代军用战机地毯轰炸 - 原版战机掠空投掷航弹 + 连环火海爆炸)
 * 时代 5：Satellite (天基死光轨道卫星扫荡 - 高能离子激光垂直扫荡 + 1500 湮灭瞬杀)
 */

import { BattleCameraController } from '../camera/BattleCameraController.js';

export class SpecialAttackManager {
  constructor(scene, gameManager) {
    this.scene = scene;
    this.gm = gameManager;

    this.cooldown = 30.0;
    this.lastUseTime = -999.0; // 开局立即可用
    this.isAttacking = false;

    // 活跃特效对象池
    this.meteors = [];
    this.meteorParticles = []; // 伴随陨石的烈焰与浓烟粒子
    this.arrows = []; // 时代 2: 真实呼啸箭雨
    this.holyAuras = []; // 时代 3 全身神圣光环与光柱
    this.bombers = [];
    this.bombs = [];
    this.beams = [];
    this.explosions = [];
    this.debrisParticles = []; // 爆炸溅射熔岩碎石与火星
    this.scorchMarks = [];

    // 定时器池 (供 resetGame 时一键清除)
    this.activeTimeouts = [];

    // 神圣庇护状态 (时代 3)
    this.isBlessingActive = false;
    this.blessingEndTime = 0;
    this.blessingLastTickTime = 0;

    // 真实 3D 资产模板缓存
    this.meteorTemplate = null;
    this.arrowTemplate = null; // 真实箭矢模型 (weapon-ammo-arrow.glb)
    this.planeTemplate = null;
    this.bombTemplate = null;

    // 通用共享几何体与材质缓存
    this.initSharedAssets();
  }

  initSharedAssets() {
    // ----------------------------------------------------
    // 1. 时代 1: 火山陨石及火焰烟雾共享材质
    // ----------------------------------------------------
    // 火焰拖尾粒子 (加法混合，金黄/橙红流动)
    this.flameGeo = new THREE.SphereGeometry(0.18, 8, 8);
    this.flameMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    // 浓烟拖尾粒子 (半透明暗灰烟团)
    this.smokeGeo = new THREE.SphereGeometry(0.24, 8, 8);
    this.smokeMat = new THREE.MeshBasicMaterial({
      color: 0x1f2937,
      transparent: true,
      opacity: 0.55
    });

    // 备用程序化火山岩 (防止极端情况模型尚未完成加载)
    this.fallbackMeteorGeo = new THREE.DodecahedronGeometry(0.45, 1);
    this.fallbackMeteorMat = new THREE.MeshStandardMaterial({
      color: 0x271e1b,
      emissive: 0xff3800,
      emissiveIntensity: 1.0,
      roughness: 0.85
    });

    // ----------------------------------------------------
    // 2. 时代 2: 倾盆箭雨 (Arrow Rain) 备用几何体与材质
    // ----------------------------------------------------
    // 箭矢入土火星/碎土几何体
    this.sparkGeo = new THREE.SphereGeometry(0.06, 6, 6);
    this.sparkMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    // 备用精美 3D 弓箭箭矢 (尖端位于 (0,0,0)，箭杆朝 +Y，尾羽在顶部)
    this.fallbackArrowGroup = new THREE.Group();
    // A. 锋利钢三角箭镞 (尖端在 0, 向上展开)
    const arrowHeadGeo = new THREE.ConeGeometry(0.045, 0.22, 6);
    arrowHeadGeo.translate(0, 0.11, 0);
    const arrowHeadMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.2
    });
    this.fallbackArrowGroup.add(new THREE.Mesh(arrowHeadGeo, arrowHeadMat));

    // B. 木质细长箭杆
    const shaftGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.1, 8);
    shaftGeo.translate(0, 0.65, 0);
    const shaftMat = new THREE.MeshLambertMaterial({ color: 0x854d0e });
    this.fallbackArrowGroup.add(new THREE.Mesh(shaftGeo, shaftMat));

    // C. 经典三向红色/白色箭尾羽 (三棱 120° 夹角)
    const fletchMat = new THREE.MeshBasicMaterial({ color: 0xdc2626, side: THREE.DoubleSide });
    for (let f = 0; f < 3; f++) {
      const fletchGeo = new THREE.PlaneGeometry(0.06, 0.25);
      fletchGeo.translate(0.03, 1.08, 0);
      const fletchMesh = new THREE.Mesh(fletchGeo, fletchMat);
      fletchMesh.rotation.y = (f * Math.PI * 2) / 3;
      this.fallbackArrowGroup.add(fletchMesh);
    }

    // ----------------------------------------------------
    // 3. 时代 3: 全身圣光笼罩套件 (光柱 + 护体双环 + 地面法阵)
    // ----------------------------------------------------
    // A. 天降金色圣光柱 (柔和半透明琥珀金，完全罩住全身且绝不遮挡角色)
    this.holyPillarGeo = new THREE.CylinderGeometry(0.85, 0.95, 3.2, 24, 1, true);
    this.holyPillarMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.18, // 柔和通透，角色本体与五官清晰可见，多角色重叠不发白
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    // B. 全身金色护体光环 (位于身躯腰胸高度，大口径立体神圣金环)
    this.holyBodyHaloGeo = new THREE.TorusGeometry(0.92, 0.048, 12, 36);
    this.holyBodyHaloGeo.rotateX(Math.PI / 2);
    this.holyBodyHaloMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.8,
      roughness: 0.15,
      metalness: 0.85
    });

    // C. 倾斜交叠副环 (增加立体神圣法相感)
    this.holyCrossHaloGeo = new THREE.TorusGeometry(0.86, 0.035, 10, 32);
    this.holyCrossHaloGeo.rotateX(Math.PI / 2 + 0.35);

    // ----------------------------------------------------
    // 4. 时代 4: 航弹备用几何体
    // ----------------------------------------------------
    this.bombGroup = new THREE.Group();
    const bombBodyGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.9, 8);
    bombBodyGeo.translate(0, 0.45, 0);
    const bombBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    this.bombGroup.add(new THREE.Mesh(bombBodyGeo, bombBodyMat));

    const bombNoseGeo = new THREE.ConeGeometry(0.22, 0.3, 8);
    bombNoseGeo.translate(0, -0.15, 0);
    bombNoseGeo.rotateX(Math.PI);
    this.bombGroup.add(new THREE.Mesh(bombNoseGeo, bombBodyMat));

    const bombFinGeo = new THREE.BoxGeometry(0.55, 0.25, 0.04);
    bombFinGeo.translate(0, 0.85, 0);
    const bombFinMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    this.bombGroup.add(new THREE.Mesh(bombFinGeo, bombFinMat));

    // ----------------------------------------------------
    // 5. 时代 5: 天基激光柱
    // ----------------------------------------------------
    this.beamCoreGeo = new THREE.CylinderGeometry(0.35, 0.35, 22, 16);
    this.beamCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    this.beamGlowGeo = new THREE.CylinderGeometry(0.9, 0.9, 22, 16);
    this.beamGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    // ----------------------------------------------------
    // 异步预加载全套真实 3D 资产模型
    // ----------------------------------------------------
    this.loadReal3DAssets();
  }

  loadReal3DAssets() {
    if (!window.THREE || !window.THREE.GLTFLoader) return;
    const loader = new THREE.GLTFLoader();

    // 1. 时代 1 火山陨石 (special_meteor.glb - 源自原开源项目 special_1.fbx)
    loader.load('./models/era1/special_meteor.glb', (gltf) => {
      gltf.scene.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });
      this.meteorTemplate = gltf.scene;
      console.log('🌋 时代 1 真实火山陨石岩模型预热成功！');
    }, undefined, (err) => {
      console.warn('加载 models/era1/special_meteor.glb 失败，将使用程序化模型:', err);
    });

    // 2. 时代 2 真实中世纪箭矢 (arrow.glb - Kenney Turrets 原版箭矢)
    loader.load('./models/era2/arrow.glb', (gltf) => {
      gltf.scene.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });
      // Kenney 箭矢长轴沿 Z 轴，旋转校准使箭尖朝 (0,0,0)，箭杆朝 +Y
      const arrowGroup = new THREE.Group();
      gltf.scene.rotation.x = Math.PI / 2;
      gltf.scene.scale.setScalar(1.5);
      arrowGroup.add(gltf.scene);
      this.arrowTemplate = arrowGroup;
      console.log('🏹 时代 2 真实中世纪弓箭箭矢模型预热成功！');
    }, undefined, (err) => {
      console.warn('加载 models/era2/arrow.glb 失败，将使用精美程序化箭矢:', err);
    });

    // 4. 时代 4 原版战机与航弹 (plane.glb)
    loader.load('./models/era4/plane.glb', (gltf) => {
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      const planeObj = gltf.scene.getObjectByName('Plane');
      this.planeTemplate = planeObj ? planeObj.clone(true) : gltf.scene.clone(true);
      const bombObj = gltf.scene.getObjectByName('Bomb');
      if (bombObj) this.bombTemplate = bombObj.clone(true);
      console.log('✈️ 时代 4 原版军用战机与高爆炸弹模型预热成功！');
    }, undefined, () => {});
  }

  canUse(nowSec) {
    return (nowSec - this.lastUseTime >= this.cooldown);
  }

  getCooldownProgress(nowSec) {
    const elapsed = nowSec - this.lastUseTime;
    return Math.min(1.0, elapsed / this.cooldown);
  }

  getRemainingTime(nowSec) {
    return Math.max(0, Math.ceil(this.cooldown - (nowSec - this.lastUseTime)));
  }

  // 释放当前时代大招
  triggerSpecial(nowSec, age = 1) {
    if (!this.canUse(nowSec)) return false;
    this.lastUseTime = nowSec;
    this.isAttacking = true;

    console.log(`💥 释放时代 ${age} 终极大招！`);

    switch (age) {
      case 1:
        this.triggerAge1Volcano();
        break;
      case 2:
        this.triggerAge2ArrowRain();
        break;
      case 3:
        this.triggerAge3Blessing();
        break;
      case 4:
        this.triggerAge4Aerial();
        break;
      case 5:
        this.triggerAge5Satellite();
        break;
      default:
        this.triggerAge1Volcano();
        break;
    }

    return true;
  }

  safeSetTimeout(fn, delayMs) {
    const tid = setTimeout(() => {
      const idx = this.activeTimeouts.indexOf(tid);
      if (idx !== -1) this.activeTimeouts.splice(idx, 1);
      fn();
    }, delayMs);
    this.activeTimeouts.push(tid);
    return tid;
  }

  // ==========================================
  // 时代 1：Volcano Eruption (火山喷发真实流星雨)
  // ==========================================
  triggerAge1Volcano() {
    this.isAttacking = true;
    if (this.gm?.sound) this.gm.sound.play('special_1');
    if (BattleCameraController.instance) {
      BattleCameraController.instance.shake(4.2, 0.45);
    }

    // 倾泻 56 枚小巧密集的高能炽热火山流星群，全图地毯式覆盖
    const count = 56;
    for (let i = 0; i < count; i++) {
      this.safeSetTimeout(() => {
        // 每隔 7 颗精准有一颗陨石怒砸敌方要塞城门前沿 (17.5~19.5)，确保全图覆盖同时攻城火雨势大力沉
        const forceX = (i % 7 === 0) ? (17.5 + Math.random() * 2.0) : null;
        this.spawnVolcanoMeteor(forceX);
        if (i === count - 1) {
          this.safeSetTimeout(() => { this.isAttacking = false; }, 2200);
        }
      }, i * 60);
    }
  }

  spawnVolcanoMeteor(forceX = null) {
    // 优先采用真实火山岩模型 special_meteor.glb
    let mesh = null;
    if (this.meteorTemplate) {
      mesh = this.meteorTemplate.clone(true);
      const scaleVariation = 0.48 + Math.random() * 0.16; // 体积减半，更加细腻
      mesh.scale.multiplyScalar(scaleVariation);
    } else {
      mesh = new THREE.Mesh(this.fallbackMeteorGeo, this.fallbackMeteorMat);
    }

    // 增加一层包裹在岩石周围的烈焰燃烧光芒包络 (Flame Aura) - 紧凑小巧
    const auraGeo = new THREE.SphereGeometry(0.55, 12, 12);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    mesh.add(aura);

    // 战局横向覆盖从我家门口 (-18.5) 到敌方家门口与城墙 (+19.5) 全面覆盖 (横跨 38.0m)
    const targetX = (forceX !== null) ? forceX : (-18.5 + Math.random() * 38.0);
    // 从左上方/斜向高空以 15~25 度夹角猛烈坠落 (对齐原版 speed=7~9)
    const spawnX = targetX - (4.0 + Math.random() * 3.5);
    const spawnY = 13.5 + Math.random() * 3.0;
    const spawnZ = (Math.random() - 0.5) * 2.8;

    mesh.position.set(spawnX, spawnY, spawnZ);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    this.scene.add(mesh);

    const speedY = -9.5 - Math.random() * 2.5; // 真实原版下坠速度
    const flightTime = spawnY / (-speedY);
    const speedX = (targetX - spawnX) / flightTime;

    this.meteors.push({
      mesh,
      targetX,
      speedX,
      speedY,
      rotSpeedX: 3.5 + Math.random() * 3.0,
      rotSpeedZ: 4.0 + Math.random() * 3.0,
      damage: 35,
      radius: 2.8,
      lastParticleTime: 0
    });
  }

  // ==========================================
  // 时代 2：Arrow Rain (倾盆箭雨支援 - 真实中世纪弓箭)
  // ==========================================
  triggerAge2ArrowRain() {
    this.isAttacking = true;
    if (this.gm?.sound) this.gm.sound.play('special_2');

    // 倾盆呼啸而下 60 支中世纪长弓真实箭矢，从我方家门口到敌方家门口全面地毯覆盖
    const count = 60;
    for (let i = 0; i < count; i++) {
      this.safeSetTimeout(() => {
        // 定向一部分箭雨直贯敌方城门前沿 (17.5~19.0)，确保城门与全军皆受漫天箭雨洗礼
        const forceX = (i % 8 === 0) ? (17.5 + Math.random() * 1.5) : null;
        this.spawnArrow(forceX);
        if (i === count - 1) {
          this.safeSetTimeout(() => { this.isAttacking = false; }, 2000);
        }
      }, i * 75);
    }
  }

  // 兼容旧接口别名
  triggerAge2SwordRain() {
    this.triggerAge2ArrowRain();
  }

  spawnArrow(forceX = null) {
    let mesh = null;
    if (this.arrowTemplate) {
      mesh = this.arrowTemplate.clone(true);
    } else {
      mesh = this.fallbackArrowGroup.clone(true);
    }

    // 战局横向覆盖从我家门口 (-18.5) 到敌方家门口与要塞 (+19.5) 全面覆盖 (横跨 38.0m)
    const targetX = (forceX !== null) ? forceX : (-18.5 + Math.random() * 38.0);
    const speedX = 6.0 + (Math.random() - 0.5) * 3.0;
    const speedY = -15.0 - Math.random() * 3.0; // 弓箭呼啸贯穿下刺
    const spawnY = 13.0 + Math.random() * 2.5;
    const flightTime = spawnY / (-speedY);
    const spawnX = targetX - (speedX * flightTime);
    const spawnZ = (Math.random() - 0.5) * 2.8;

    mesh.position.set(spawnX, spawnY, spawnZ);

    // 箭尖 (0,0,0) 指向下前飞行切线，箭尾 (+Y) 指向后上方
    const rotZ = Math.atan2(speedX, -speedY);
    mesh.rotation.z = rotZ + (Math.random() - 0.5) * 0.05;
    mesh.rotation.y = (Math.random() - 0.5) * 0.25;
    this.scene.add(mesh);

    this.arrows.push({
      mesh,
      targetX,
      targetY: -0.15, // 箭簇深深钉入泥土 0.15 米
      speedX,
      speedY,
      baseRotZ: rotZ,
      damage: 70,
      state: 'flying',
      stuckElapsed: 0,
      stuckDuration: 3.2 // 钉在地上停留 3.2 秒后消散
    });
  }

  // ==========================================
  // 时代 3：Blessing (神圣庇护 / 全身沐浴圣光)
  // ==========================================
  triggerAge3Blessing() {
    if (this.gm?.sound) this.gm.sound.play('special_3');

    this.isBlessingActive = true;
    const nowSec = performance.now() / 1000;
    this.blessingEndTime = nowSec + 18.0;
    this.blessingLastTickTime = nowSec;

    // 为当前全员装配全身神圣光环与光柱
    if (this.gm?.unitsAlly) {
      for (const unit of this.gm.unitsAlly) {
        if (!unit.isDead) this.attachHolyAuraToUnit(unit);
      }
    }

    if (this.gm?.onFloatingText) {
      this.gm.onFloatingText(-14, 4.5, "神圣圣光降临！", "#fbbf24");
    }

    this.safeSetTimeout(() => {
      this.isBlessingActive = false;
      this.isAttacking = false;
      this.removeAllHolyAuras();
    }, 18000);
  }

  attachHolyAuraToUnit(unit) {
    if (unit._hasHolyAura) return;

    const auraGroup = new THREE.Group();
    auraGroup.name = "holy_aura_unit";

    // 1. 天降垂直金色圣光柱 (高 3.2m，直通云霄，将单位全身笼罩在柔和金芒中)
    const pillar = new THREE.Mesh(this.holyPillarGeo, this.holyPillarMat);
    pillar.position.set(0, 1.4, 0); // 居中覆盖 Y=0 到 Y=3.0
    auraGroup.add(pillar);

    // 2. 环绕身躯主神圣光环 (位于 Y=1.0 腰腹高度，直径 1.9m，完全环绕角色)
    const bodyHalo = new THREE.Mesh(this.holyBodyHaloGeo, this.holyBodyHaloMat);
    bodyHalo.position.set(0, 1.05, 0);
    bodyHalo.rotation.z = 0.25; // 优美的微倾斜角度
    auraGroup.add(bodyHalo);

    // 3. 交叉发光副环 (反向倾斜，交错旋转)
    const crossHalo = new THREE.Mesh(this.holyCrossHaloGeo, this.holyBodyHaloMat);
    crossHalo.position.set(0, 1.05, 0);
    crossHalo.rotation.z = -0.3;
    auraGroup.add(crossHalo);

    auraGroup.position.set(unit.position.x, unit.position.y, unit.position.z);
    this.scene.add(auraGroup);

    // 4. 让单位自身模型全身发着圣光 (Emissive Boost)
    const origMaterials = [];
    if (unit.mesh) {
      unit.mesh.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          for (const m of mats) {
            if (m && m.emissive) {
              origMaterials.push({
                mat: m,
                origEmissive: m.emissive.clone(),
                origIntensity: m.emissiveIntensity !== undefined ? m.emissiveIntensity : 0
              });
              // 注入璀璨神圣暖金光辉
              m.emissive.setHex(0xb45309);
              m.emissiveIntensity = 1.35;
            }
          }
        }
      });
    }

    unit._hasHolyAura = true;
    unit._holyAuraGroup = auraGroup;
    unit._origMaterials = origMaterials;

    this.holyAuras.push({
      unit,
      group: auraGroup,
      pillar,
      bodyHalo,
      crossHalo,
      origMaterials
    });
  }

  removeAllHolyAuras() {
    for (const item of this.holyAuras) {
      if (item.group && item.group.parent) {
        item.group.parent.remove(item.group);
      }
      if (item.origMaterials) {
        // 恢复单位原始自发光
        for (const mData of item.origMaterials) {
          if (mData.mat && mData.mat.emissive) {
            mData.mat.emissive.copy(mData.origEmissive);
            mData.mat.emissiveIntensity = mData.origIntensity;
          }
        }
      }
      if (item.unit) {
        item.unit._hasHolyAura = false;
        item.unit._holyAuraGroup = null;
        item.unit._origMaterials = null;
      }
    }
    this.holyAuras = [];
  }

  // ==========================================
  // 时代 4：Aerial Support (现代轰炸机地毯轰炸)
  // ==========================================
  triggerAge4Aerial() {
    this.isAttacking = true;
    if (this.gm?.sound) this.gm.sound.play('special_4');

    let planeMesh = null;
    if (this.planeTemplate) {
      planeMesh = this.planeTemplate.clone(true);
      planeMesh.scale.setScalar(4.5);
      planeMesh.rotation.set(0, 0, 0); // 原版 plane.fbx 机头天然正对 +X
    } else {
      planeMesh = this.buildProceduralFighterJet();
      planeMesh.rotation.y = Math.PI / 2;
    }

    planeMesh.position.set(-28, 7.2, 0);
    this.scene.add(planeMesh);

    const bomber = {
      mesh: planeMesh,
      speedX: 13.0,
      startX: -28,
      targetX: 30,
      lastDropX: -23.5, // 提前投弹起始位，首枚航弹精准落在我方家门口 (-18.5)
      dropIntervalX: 2.3 // 密集投弹间距，2.3 米投一枚，地毯式连续炸满全战场
    };
    this.bombers.push(bomber);

    this.safeSetTimeout(() => {
      this.isAttacking = false;
    }, 5500);
  }

  buildProceduralFighterJet() {
    const group = new THREE.Group();
    const bodyGeo = new THREE.ConeGeometry(0.65, 4.8, 8);
    bodyGeo.rotateX(-Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));

    const wingGeo = new THREE.BoxGeometry(5.8, 0.1, 2.0);
    wingGeo.translate(0, 0, -0.5);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
    group.add(new THREE.Mesh(wingGeo, wingMat));

    const tailGeo = new THREE.BoxGeometry(0.1, 1.1, 0.9);
    const tail1 = new THREE.Mesh(tailGeo, wingMat);
    tail1.position.set(-0.7, 0.6, -1.6);
    tail1.rotation.z = -0.2;
    group.add(tail1);

    const tail2 = new THREE.Mesh(tailGeo, wingMat);
    tail2.position.set(0.7, 0.6, -1.6);
    tail2.rotation.z = 0.2;
    group.add(tail2);

    const flameGeo = new THREE.ConeGeometry(0.3, 1.6, 8);
    flameGeo.rotateX(Math.PI / 2);
    flameGeo.translate(0, 0, -2.4);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    group.add(new THREE.Mesh(flameGeo, flameMat));

    return group;
  }

  spawnBomb(pos) {
    let mesh = null;
    if (this.bombTemplate) {
      mesh = this.bombTemplate.clone(true);
      mesh.scale.setScalar(15.0);
    } else {
      mesh = this.bombGroup.clone(true);
    }
    mesh.position.copy(pos);
    mesh.position.y -= 0.6;
    this.scene.add(mesh);

    this.bombs.push({
      mesh,
      speedX: 3.5,
      speedY: -14.0,
      damage: 400,
      radius: 5.0
    });
  }

  // ==========================================
  // 时代 5：Satellite (天基死光轨道卫星扫荡)
  // ==========================================
  triggerAge5Satellite() {
    this.isAttacking = true;
    if (this.gm?.sound) this.gm.sound.play('special_5');

    const count = 25;
    const startX = -18.5;
    const endX = 19.5;
    const stepX = (endX - startX) / (count - 1);

    for (let i = 0; i < count; i++) {
      const strikeX = startX + i * stepX;
      this.safeSetTimeout(() => {
        this.spawnOrbitalBeam(strikeX);
        if (i === count - 1) {
          this.safeSetTimeout(() => { this.isAttacking = false; }, 1000);
        }
      }, i * 260);
    }
  }

  spawnOrbitalBeam(worldX) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(this.beamCoreGeo, this.beamCoreMat);
    const glow = new THREE.Mesh(this.beamGlowGeo, this.beamGlowMat);
    group.add(core);
    group.add(glow);

    group.position.set(worldX, 11, 0);
    this.scene.add(group);

    const ringGeo = new THREE.RingGeometry(0.3, 2.8, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(worldX, 0.08, 0);
    this.scene.add(ringMesh);

    if (BattleCameraController.instance) {
      BattleCameraController.instance.shake(0.35, 0.45);
    }

    if (this.gm?.unitsEnemy) {
      for (const enemy of this.gm.unitsEnemy) {
        if (!enemy.isDead && Math.abs(enemy.position.x - worldX) <= 2.5) {
          enemy.takeDamage(1500);
          if (this.gm?.onFloatingText) {
            this.gm.onFloatingText(enemy.position.x, enemy.position.y + 2.0, "-1500", "#00ffff");
          }
          if (enemy.isDead && this.gm.baseAlly) {
            this.gm.baseAlly.money += enemy.config.revenue;
            this.gm.baseAlly.exp += enemy.config.expReward;
          }
        }
      }
    }

    // 天灾大招仅对战场士兵生效，对敌方基地无效（符合原版规则）

    this.beams.push({
      group,
      ringMesh,
      lifespan: 0.32,
      elapsed: 0
    });
  }

  // ==========================================
  // 通用多层爆炸系统 (带冲击波、飞溅火星与焦痕)
  // ==========================================
  spawnExplosion(pos, color = 0xf97316, maxRadius = 3.8, isVolcanic = false) {
    // 1. 核心火球
    const geo = new THREE.SphereGeometry(0.4, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.explosions.push({
      mesh,
      maxRadius,
      duration: 0.48,
      elapsed: 0
    });

    // 2. 地面焦痕
    const scorchGeo = new THREE.CircleGeometry(maxRadius * 0.42, 16);
    scorchGeo.rotateX(-Math.PI / 2);
    const scorchMat = new THREE.MeshBasicMaterial({
      color: 0x1c1917,
      transparent: true,
      opacity: 0.82
    });
    const scorchMesh = new THREE.Mesh(scorchGeo, scorchMat);
    scorchMesh.position.set(pos.x, 0.04, pos.z);
    this.scene.add(scorchMesh);

    this.scorchMarks.push({
      mesh: scorchMesh,
      duration: 3.5,
      elapsed: 0
    });

    // 3. 火山陨石专属：四散喷射的熔岩炽热碎石与烟柱
    if (isVolcanic) {
      const debrisCount = 10;
      for (let i = 0; i < debrisCount; i++) {
        const dMesh = new THREE.Mesh(this.flameGeo, this.flameMat.clone());
        dMesh.scale.setScalar(0.4 + Math.random() * 0.4);
        dMesh.position.copy(pos);
        this.scene.add(dMesh);

        const angle = Math.random() * Math.PI * 2;
        const speedHoriz = 4.0 + Math.random() * 7.0;
        this.debrisParticles.push({
          mesh: dMesh,
          vx: Math.cos(angle) * speedHoriz,
          vy: 6.0 + Math.random() * 8.0,
          vz: Math.sin(angle) * speedHoriz * 0.4,
          life: 0.65,
          elapsed: 0
        });
      }
    }
  }

  // ==========================================
  // 逐帧更新调度系统 (Tick)
  // ==========================================
  update(dt) {
    const nowSec = performance.now() / 1000;

    // ----------------------------------------------------
    // 1. 更新流星与烈焰浓烟尾迹 (时代 1: 火山喷发)
    // ----------------------------------------------------
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.mesh.position.x += m.speedX * dt;
      m.mesh.position.y += m.speedY * dt;
      m.mesh.rotation.x += m.rotSpeedX * dt;
      m.mesh.rotation.z += m.rotSpeedZ * dt;

      // 下坠过程中高频发射火焰粒子与浓烟粒子 (原版 Flame & Smoke 效果)
      m.lastParticleTime += dt;
      if (m.lastParticleTime >= 0.035) {
        m.lastParticleTime = 0;

        // A. 烈焰粒子 (橙红流光，沿运动轨迹后方滞留)
        const pFlame = new THREE.Mesh(this.flameGeo, this.flameMat.clone());
        pFlame.position.copy(m.mesh.position);
        pFlame.position.x += (Math.random() - 0.5) * 0.6;
        pFlame.position.y += (Math.random() - 0.5) * 0.6;
        pFlame.scale.setScalar(0.7 + Math.random() * 0.6);
        this.scene.add(pFlame);
        this.meteorParticles.push({
          mesh: pFlame,
          vx: (Math.random() - 0.5) * 1.5 - m.speedX * 0.1,
          vy: 2.0 + Math.random() * 2.0,
          duration: 0.28,
          elapsed: 0,
          isFlame: true
        });

        // B. 浓烟粒子 (暗灰烟团，膨胀上升消散)
        const pSmoke = new THREE.Mesh(this.smokeGeo, this.smokeMat.clone());
        pSmoke.position.copy(m.mesh.position);
        pSmoke.position.x += (Math.random() - 0.5) * 0.8;
        pSmoke.scale.setScalar(0.6);
        this.scene.add(pSmoke);
        this.meteorParticles.push({
          mesh: pSmoke,
          vx: (Math.random() - 0.5) * 1.2,
          vy: 1.5 + Math.random() * 1.5,
          duration: 0.55,
          elapsed: 0,
          isFlame: false
        });
      }

      // 落地剧烈撞击
      if (m.mesh.position.y <= 0.3) {
        this.spawnExplosion(m.mesh.position, 0xff4500, 2.8, true);
        if (this.gm?.sound) this.gm.sound.play('explosion');
        if (BattleCameraController.instance) {
          BattleCameraController.instance.shake(0.22, 0.25);
        }

        this.applySplashDamage(m.mesh.position.x, m.damage, m.radius);
        this.scene.remove(m.mesh);
        this.meteors.splice(i, 1);
      }
    }

    // 更新流星火焰与烟雾微粒生命周期
    for (let i = this.meteorParticles.length - 1; i >= 0; i--) {
      const p = this.meteorParticles[i];
      p.elapsed += dt;
      const progress = p.elapsed / p.duration;

      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;

      if (p.isFlame) {
        // 火焰粒子快速收缩并淡出
        const s = (1.0 - progress * 0.7);
        p.mesh.scale.multiplyScalar(s);
        p.mesh.material.opacity = Math.max(0, 0.85 * (1.0 - progress));
      } else {
        // 浓烟粒子向外膨胀变淡
        p.mesh.scale.multiplyScalar(1.0 + dt * 1.8);
        p.mesh.material.opacity = Math.max(0, 0.55 * (1.0 - progress));
      }

      if (progress >= 1.0) {
        this.scene.remove(p.mesh);
        this.meteorParticles.splice(i, 1);
      }
    }

    // 更新爆炸飞溅熔岩碎石
    for (let i = this.debrisParticles.length - 1; i >= 0; i--) {
      const d = this.debrisParticles[i];
      d.elapsed += dt;
      d.vy -= 22.0 * dt; // 重力下坠
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;

      const progress = d.elapsed / d.life;
      d.mesh.material.opacity = Math.max(0, 0.9 * (1.0 - progress));

      if (d.mesh.position.y <= 0.05 || progress >= 1.0) {
        this.scene.remove(d.mesh);
        this.debrisParticles.splice(i, 1);
      }
    }

    // ----------------------------------------------------
    // 2. 更新真实中世纪长弓倾盆箭雨 (时代 2: 箭雨)
    // ----------------------------------------------------
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      if (a.state === 'flying') {
        a.mesh.position.x += a.speedX * dt;
        a.mesh.position.y += a.speedY * dt;

        // 到达地面钉入泥土
        if (a.mesh.position.y <= a.targetY) {
          a.mesh.position.y = a.targetY;
          a.state = 'stuck';
          a.stuckElapsed = 0;

          // 溅射微量泥土火星
          for (let k = 0; k < 3; k++) {
            const spark = new THREE.Mesh(this.sparkGeo, this.sparkMat.clone());
            spark.position.copy(a.mesh.position);
            spark.position.y = 0.08;
            this.scene.add(spark);
            this.debrisParticles.push({
              mesh: spark,
              vx: (Math.random() - 0.5) * 4.0,
              vy: 2.0 + Math.random() * 3.0,
              vz: (Math.random() - 0.5) * 3.0,
              life: 0.28,
              elapsed: 0
            });
          }

          // 真实箭矢贯穿杀伤
          this.applyDirectDamage(a.mesh.position.x, a.damage, 1.5);
        }
      } else if (a.state === 'stuck') {
        a.stuckElapsed += dt;

        // 箭杆真实弹性高频阻尼微颤 (箭簇扎入地面时的破空骤停颤鸣)
        if (a.stuckElapsed < 0.45) {
          const decay = Math.exp(-a.stuckElapsed * 9.5);
          const jitter = Math.sin(a.stuckElapsed * 52.0) * 0.16 * decay;
          a.mesh.rotation.z = a.baseRotZ + jitter;
        } else {
          a.mesh.rotation.z = a.baseRotZ;
        }

        // 停留结束时柔和淡出消散并彻底移出
        if (a.stuckElapsed >= a.stuckDuration) {
          this.scene.remove(a.mesh);
          this.arrows.splice(i, 1);
        }
      }
    }

    // ----------------------------------------------------
    // 3. 更新全身笼罩神圣圣光与治愈回血 (时代 3: 圣光)
    // ----------------------------------------------------
    if (this.isBlessingActive) {
      if (this.gm?.unitsAlly) {
        for (const unit of this.gm.unitsAlly) {
          if (!unit.isDead && !unit._hasHolyAura) {
            this.attachHolyAuraToUnit(unit);
          }
        }
      }

      // 实时同步圣光特效至单位世界坐标，驱动全身光环旋转起伏
      for (let i = this.holyAuras.length - 1; i >= 0; i--) {
        const item = this.holyAuras[i];
        if (!item.unit || item.unit.isDead) {
          if (item.group && item.group.parent) item.group.parent.remove(item.group);
          if (item.origMaterials) {
            for (const mData of item.origMaterials) {
              if (mData.mat && mData.mat.emissive) {
                mData.mat.emissive.copy(mData.origEmissive);
                mData.mat.emissiveIntensity = mData.origIntensity;
              }
            }
          }
          this.holyAuras.splice(i, 1);
          continue;
        }

        // 跟随单位位移
        item.group.position.set(item.unit.position.x, item.unit.position.y, item.unit.position.z);

        // A. 主光环：绕身躯水平平稳自转，随呼吸上下轻柔起伏 (sin 缓动)
        const bob = Math.sin(nowSec * 2.8) * 0.12;
        item.bodyHalo.position.y = 1.05 + bob;
        item.bodyHalo.rotation.y += dt * 2.8;

        // B. 交叉副环：反向旋转
        item.crossHalo.position.y = 1.05 + bob * 0.8;
        item.crossHalo.rotation.y -= dt * 2.2;

        // C. 金色圣光柱：光波轻微呼吸
        const pulse = 1.0 + Math.sin(nowSec * 3.5) * 0.08;
        item.pillar.scale.set(pulse, 1.0, pulse);
      }

      // 每 1.0 秒全体神圣回血跳字与圣光闪烁
      if (nowSec - this.blessingLastTickTime >= 1.0) {
        this.blessingLastTickTime = nowSec;
        for (const item of this.holyAuras) {
          const unit = item.unit;
          if (unit && !unit.isDead) {
            unit.hp = Math.min(unit.maxHp, unit.hp + 30);
            if (this.gm?.onFloatingText) {
              this.gm.onFloatingText(unit.position.x, unit.position.y + 2.4, "+30 HP", "#22c55e");
            }

            // 回血瞬间圣光柱明亮脉冲
            if (item.pillar && item.pillar.material) {
              item.pillar.material.opacity = 0.55;
              this.safeSetTimeout(() => {
                if (item.pillar?.material) item.pillar.material.opacity = 0.28;
              }, 250);
            }
          }
        }
      }
    }

    // ----------------------------------------------------
    // 4. 更新轰炸战机与航弹 (时代 4)
    // ----------------------------------------------------
    for (let i = this.bombers.length - 1; i >= 0; i--) {
      const b = this.bombers[i];
      b.mesh.position.x += b.speedX * dt;

      // 投弹覆盖从我方家门口 (-18.5) 到敌方家门口 (+18.5) 全面地毯轰炸
      // 航弹初速 speedX=3.5，下落时间约 0.45s，向前滑行约 1.58m，末端投弹至 x=17.5 落地正中 +19.08
      if (b.mesh.position.x > b.lastDropX + b.dropIntervalX && b.mesh.position.x <= 18.0) {
        b.lastDropX = b.mesh.position.x;
        this.spawnBomb(b.mesh.position);
      }

      if (b.mesh.position.x >= b.targetX) {
        this.scene.remove(b.mesh);
        this.bombers.splice(i, 1);
      }
    }

    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bomb = this.bombs[i];
      bomb.mesh.position.x += bomb.speedX * dt;
      bomb.mesh.position.y += bomb.speedY * dt;
      bomb.mesh.rotation.z = Math.atan2(bomb.speedY, bomb.speedX);

      if (bomb.mesh.position.y <= 0.25) {
        this.spawnExplosion(bomb.mesh.position, 0xef4444, 4.6);
        if (this.gm?.sound) this.gm.sound.play('explosion');
        if (BattleCameraController.instance) {
          BattleCameraController.instance.shake(0.4, 0.45);
        }
        this.applySplashDamage(bomb.mesh.position.x, bomb.damage, bomb.radius);

        this.scene.remove(bomb.mesh);
        this.bombs.splice(i, 1);
      }
    }

    // ----------------------------------------------------
    // 5. 更新天基死光 (时代 5)
    // ----------------------------------------------------
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const beam = this.beams[i];
      beam.elapsed += dt;
      const progress = beam.elapsed / beam.lifespan;

      if (beam.ringMesh) {
        const s = 1.0 + progress * 2.5;
        beam.ringMesh.scale.set(s, s, s);
        beam.ringMesh.material.opacity = 0.95 * (1.0 - progress);
      }

      if (progress >= 1.0) {
        this.scene.remove(beam.group);
        if (beam.ringMesh) this.scene.remove(beam.ringMesh);
        this.beams.splice(i, 1);
      }
    }

    // ----------------------------------------------------
    // 6. 更新爆炸球体膨胀与消散
    // ----------------------------------------------------
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.elapsed += dt;
      const t = exp.elapsed / exp.duration;
      const curScale = 1.0 + t * (exp.maxRadius - 1.0);
      exp.mesh.scale.set(curScale, curScale, curScale);
      exp.mesh.material.opacity = Math.max(0, 0.95 * (1.0 - t));

      if (t >= 1.0) {
        this.scene.remove(exp.mesh);
        this.explosions.splice(i, 1);
      }
    }

    // ----------------------------------------------------
    // 7. 更新地面焦痕淡出
    // ----------------------------------------------------
    for (let i = this.scorchMarks.length - 1; i >= 0; i--) {
      const sc = this.scorchMarks[i];
      sc.elapsed += dt;
      const t = sc.elapsed / sc.duration;
      sc.mesh.material.opacity = Math.max(0, 0.82 * (1.0 - t));
      if (t >= 1.0) {
        this.scene.remove(sc.mesh);
        this.scorchMarks.splice(i, 1);
      }
    }
  }

  // 溅射范围伤害
  applySplashDamage(x, damage, radius) {
    if (this.gm?.unitsEnemy) {
      for (const enemy of this.gm.unitsEnemy) {
        if (!enemy.isDead && Math.abs(enemy.position.x - x) <= radius) {
          enemy.takeDamage(damage);
          if (this.gm?.onFloatingText) {
            this.gm.onFloatingText(enemy.position.x, enemy.position.y + 1.8, `-${damage}`, '#ef4444');
          }
          if (enemy.isDead && this.gm.baseAlly) {
            this.gm.baseAlly.money += (enemy.config?.revenue || 20);
            this.gm.baseAlly.exp += (enemy.config?.expReward || 25);
          }
        }
      }
    }
    // 天灾大招仅对战场士兵生效，对敌方基地无效（符合原版规则）
  }

  // 精准点对点穿透伤害 (剑刃直击)
  applyDirectDamage(x, damage, tolerance) {
    let hit = false;
    if (this.gm?.unitsEnemy) {
      for (const enemy of this.gm.unitsEnemy) {
        if (!enemy.isDead && Math.abs(enemy.position.x - x) <= tolerance) {
          enemy.takeDamage(damage);
          hit = true;
          if (this.gm?.onFloatingText) {
            this.gm.onFloatingText(enemy.position.x, enemy.position.y + 1.8, `-${damage}`, '#f59e0b');
          }
          if (enemy.isDead && this.gm.baseAlly) {
            this.gm.baseAlly.money += (enemy.config?.revenue || 20);
            this.gm.baseAlly.exp += (enemy.config?.expReward || 25);
          }
          break;
        }
      }
    }
    // 天灾大招仅对战场士兵生效，对敌方基地无效（符合原版规则）
  }

  // 一键重置清空场上所有大招特效 (resetGame 调用)
  clear() {
    for (const tid of this.activeTimeouts) clearTimeout(tid);
    this.activeTimeouts = [];

    for (const m of this.meteors) this.scene.remove(m.mesh);
    this.meteors = [];

    for (const p of this.meteorParticles) this.scene.remove(p.mesh);
    this.meteorParticles = [];

    for (const d of this.debrisParticles) this.scene.remove(d.mesh);
    this.debrisParticles = [];

    for (const a of this.arrows) this.scene.remove(a.mesh);
    this.arrows = [];

    this.removeAllHolyAuras();
    this.isBlessingActive = false;

    for (const b of this.bombers) this.scene.remove(b.mesh);
    this.bombers = [];

    for (const bomb of this.bombs) this.scene.remove(bomb.mesh);
    this.bombs = [];

    for (const beam of this.beams) {
      this.scene.remove(beam.group);
      if (beam.ringMesh) this.scene.remove(beam.ringMesh);
    }
    this.beams = [];

    for (const exp of this.explosions) this.scene.remove(exp.mesh);
    this.explosions = [];

    for (const sc of this.scorchMarks) this.scene.remove(sc.mesh);
    this.scorchMarks = [];

    this.isAttacking = false;
  }
}
