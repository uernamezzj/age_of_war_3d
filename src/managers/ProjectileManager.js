/**
 * ProjectileManager.js - 全时代 15 款防御塔与远程兵种高保真弹药与物理系统
 * 1:1 对齐 Unity 原版 AgeOfWarRemake 真实 Bullet Prefab 资产与物理机制：
 * - 时代 1：弹弓石子、恐龙蛋、原始人重型岩石 (彻底告别离谱 1.3米巨球)
 * - 时代 2：中世纪粗凿配重石、烈焰火油球、高空倾泻沸油流体滴
 * - 时代 3：小加农黑铁炮弹、重型加农炮弹、破片集束穿甲弹
 * - 时代 4：现代轻/重机枪金色高速曳光弹 (零重力直线)、战术火箭巡航飞弹 (带弹翼与尾喷)
 * - 时代 5：高能脉冲翡翠绿光栓、红宝石聚焦激光核、量子离子毁灭电浆球
 */

export class ProjectileManager {
  constructor(scene, onHitCallback) {
    this.scene = scene;
    this.onHit = onHitCallback;
    this.projectiles = [];
    this.lightnings = [];
    this.muzzleFlashes = [];

    // === 材质池缓存 (复用材质大幅优化 DrawCall) ===
    this.materials = {
      // 兵种远程小石子
      unitStone: new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 }),
      // 1_1 弹弓精致小石子 (0.08)
      rockSmall: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 }),
      // 1_2 恐龙蛋 (0.12 x 0.16)
      egg: new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.55 }),
      // 1_3 原始人重型岩石 (0.24)
      rockCatapult: new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.88 }),
      // 2_1 中世纪配重石弹 (0.18)
      medievalStone: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 }),
      // 2_2 烈焰火球自发光 (0.16)
      fireballCore: new THREE.MeshBasicMaterial({ color: 0xffedd5 }),
      fireballGlow: new THREE.MeshStandardMaterial({
        color: 0xea580c,
        emissive: 0xff4500,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.88,
        roughness: 0.2
      }),
      // 2_3 滚烫金黄沸油流体 (亮金黄微光，透光油亮)
      oil: new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 0.65,
        metalness: 0.15,
        roughness: 0.20,
        transparent: true,
        opacity: 0.92
      }),
      oilCore: new THREE.MeshBasicMaterial({
        color: 0xfef08a
      }),
      // 3_1 小型铸铁加农炮弹 (0.10)
      cannonIron: new THREE.MeshStandardMaterial({
        color: 0x1c1917,
        metalness: 0.85,
        roughness: 0.25
      }),
      // 3_2 大型重铸铁炮弹 (0.13)
      cannonHeavy: new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.95,
        roughness: 0.18
      }),
      // 3_3 集束高爆铜质炮弹 (0.14)
      cannonCluster: new THREE.MeshStandardMaterial({
        color: 0x78350f,
        metalness: 0.75,
        roughness: 0.3,
        emissive: 0xb45309,
        emissiveIntensity: 0.4
      }),
      // 4_1 & 4_3 军事时代高速赤红曳光弹与碳黑穿甲弹
      tracerRed: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
      tracerRedGlow: new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending }),
      tracerBlack: new THREE.MeshStandardMaterial({
        color: 0x09090b,
        metalness: 0.85,
        roughness: 0.2,
        emissive: 0xef4444,
        emissiveIntensity: 0.35
      }),
      // 4_2 战术导弹 (哑光战术黑弹体 + 炽红破甲尖锥 + 暗黑尾翼 + 烈红推进尾焰)
      missileBody: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.7 }),
      missileNose: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25, emissive: 0x991b1b, emissiveIntensity: 0.5 }),
      missileFin: new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.65 }),
      missileFlame: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
      // 5_1 翡翠绿超小发光微粒子 (核心白绿 + 荧光晕环)
      pulseGreenTiny: new THREE.MeshBasicMaterial({ color: 0xecfdf5 }),
      pulseGreenGlow: new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      }),
      // 5_2 红宝石聚焦超小微粒子 (核心白粉 + 荧光晕环)
      pulseRedTiny: new THREE.MeshBasicMaterial({ color: 0xfff1f2 }),
      pulseRedGlow: new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending
      }),
      // 5_3 苍蓝高压闪电电弧与电离子光球
      lightningCore: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      lightningGlow: new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending
      })
    };

    // === 共享通用几何体池 ===
    this.geos = {
      unitStone: new THREE.DodecahedronGeometry(0.08, 0),
      rockSmall: new THREE.DodecahedronGeometry(0.09, 0),
      egg: new THREE.SphereGeometry(0.042, 12, 12), // 恐龙蛋机枪弹药调小为流线型高速蛋 (长 0.11m, 粗 0.08m，告别冬瓜巨蛋)
      rockCatapult: new THREE.DodecahedronGeometry(0.11, 1), // 投石机重岩石，半径 0.11 (全长 0.22m)，1:1 严格对齐模型碗内石块尺寸
      medievalStone: new THREE.IcosahedronGeometry(0.18, 0),
      sphere10: new THREE.SphereGeometry(0.10, 16, 16),
      sphere13: new THREE.SphereGeometry(0.13, 16, 16),
      sphere14: new THREE.SphereGeometry(0.14, 16, 16),
      sphere16: new THREE.SphereGeometry(0.16, 14, 14),
      sphere20: new THREE.SphereGeometry(0.20, 10, 10),
      tracerCap: new THREE.CylinderGeometry(0.035, 0.035, 0.28, 8),
      pulse08: new THREE.SphereGeometry(0.08, 12, 12),
      pulse11: new THREE.SphereGeometry(0.11, 14, 14)
    };

    // 恐龙蛋几何体进行长轴椭球拉伸
    this.geos.egg.scale(1, 1.35, 1);
    // 曳光弹旋转使其长轴沿 X 轴对齐
    this.geos.tracerCap.rotateZ(Math.PI / 2);
  }

  // === 弹药网格工厂方法 ===

  // 1_1 弹弓小石块
  createRockSmall() {
    return new THREE.Mesh(this.geos.rockSmall, this.materials.rockSmall);
  }

  // 1_2 恐龙蛋
  createEgg() {
    return new THREE.Mesh(this.geos.egg, this.materials.egg);
  }

  // 1_3 原始人重型岩石 (精致多面体石质)
  createCatapultRock() {
    const mesh = new THREE.Mesh(this.geos.rockCatapult, this.materials.rockCatapult);
    mesh.scale.set(1.0, 0.92, 1.05); // 自然非正球形态
    return mesh;
  }

  // 2_1 中世纪粗凿配重石弹
  createMedievalStone() {
    return new THREE.Mesh(this.geos.medievalStone, this.materials.medievalStone);
  }

  // 2_2 烈焰火球/燃烧罐 (带内焰与外层火光)
  createFireball() {
    const group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 8), this.materials.fireballCore);
    const glow = new THREE.Mesh(this.geos.sphere16, this.materials.fireballGlow);
    group.add(core);
    group.add(glow);
    return group;
  }

  // 2_3 滚烫金黄沸油流体大水柱/大油滴簇 (尺寸整体放大 2 倍，流线瀑布水滴形态)
  createOilDrop() {
    const group = new THREE.Group();
    // 主滚烫油团 (放大 2 倍至半径 0.20，沿 Y 轴流线水滴拉伸)
    const geo1 = new THREE.SphereGeometry(0.20, 10, 10);
    geo1.scale(0.85, 1.4, 0.85);
    const d1 = new THREE.Mesh(geo1, this.materials.oil);

    // 内部高亮沸腾油核
    const d1Core = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), this.materials.oilCore);
    group.add(d1);
    group.add(d1Core);

    // 附带大飞溅沸油滴 2 (半径 0.14)
    const d2 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), this.materials.oil);
    d2.position.set(0.08, 0.20, 0.04);
    group.add(d2);

    // 附带大飞溅沸油滴 3 (半径 0.12)
    const d3 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), this.materials.oil);
    d3.position.set(-0.06, -0.16, -0.04);
    group.add(d3);

    // 飞散小沸油珠 4 (半径 0.08)
    const d4 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), this.materials.oilCore);
    d4.position.set(0.05, -0.26, 0.03);
    group.add(d4);

    return group;
  }

  // 3_1 小型铸铁加农炮弹
  createCannonballSmall() {
    return new THREE.Mesh(this.geos.sphere10, this.materials.cannonIron);
  }

  // 3_2 大型重铸铁炮弹
  createCannonballLarge() {
    return new THREE.Mesh(this.geos.sphere13, this.materials.cannonHeavy);
  }

  // 3_3 高爆集束加农穿甲弹
  createCannonballCluster() {
    return new THREE.Mesh(this.geos.sphere14, this.materials.cannonCluster);
  }

  // 4_1 & 4_3 现代高速赤红 / 碳黑穿甲机枪曳光弹
  createTracer(colorMode = 'red') {
    const group = new THREE.Group();
    const isBlack = (colorMode === 'black');
    const mat = isBlack ? this.materials.tracerBlack : this.materials.tracerRed;
    const core = new THREE.Mesh(this.geos.tracerCap, mat);
    group.add(core);

    if (!isBlack) {
      // 炽红超光速破空尾晕
      const glow = new THREE.Mesh(this.geos.tracerCap, this.materials.tracerRedGlow);
      glow.scale.set(1.4, 1.1, 1.4);
      group.add(glow);
    }
    return group;
  }

  // 4_2 现代战术火箭巡航飞弹 (带鼻锥、弹身、尾翼与尾焰)
  createMissile() {
    const group = new THREE.Group();

    // 1. 白色圆柱弹身 (直径 0.09, 长度 0.35, 沿 X 轴)
    const bodyGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.32, 12);
    bodyGeo.rotateZ(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, this.materials.missileBody);
    group.add(body);

    // 2. 红色圆锥尖锐弹头 (长度 0.12)
    const noseGeo = new THREE.ConeGeometry(0.045, 0.12, 12);
    noseGeo.rotateZ(-Math.PI / 2);
    noseGeo.translate(0.22, 0, 0);
    const nose = new THREE.Mesh(noseGeo, this.materials.missileNose);
    group.add(nose);

    // 3. 黑色十字尾翼 (4片)
    const finGeo = new THREE.BoxGeometry(0.08, 0.14, 0.01);
    finGeo.translate(-0.14, 0, 0);
    const fin1 = new THREE.Mesh(finGeo, this.materials.missileFin);
    const fin2 = new THREE.Mesh(finGeo, this.materials.missileFin);
    fin2.rotation.x = Math.PI / 2;
    group.add(fin1);
    group.add(fin2);

    // 4. 尾部喷射微焰
    const flameGeo = new THREE.ConeGeometry(0.03, 0.09, 8);
    flameGeo.rotateZ(Math.PI / 2);
    flameGeo.translate(-0.20, 0, 0);
    const flame = new THREE.Mesh(flameGeo, this.materials.missileFlame);
    group.add(flame);

    return group;
  }

  // 5_1 翡翠绿发光高能微型光核 (很小的精致光粒子，核心 0.035，总直径仅 ~0.19m)
  createTinyPhotonGreen() {
    const group = new THREE.Group();
    // 纯白亮绿微型高能核心 (半径 0.035)
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), this.materials.pulseGreenTiny);
    // 荧光绿内晕环 (半径 0.065)
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), this.materials.pulseGreenGlow);
    // 极光绿柔和外光晕 (半径 0.095)
    const outerHalo = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
      })
    );
    group.add(core);
    group.add(glow);
    group.add(outerHalo);
    return group;
  }

  // 5_2 红宝石聚焦发光高能微型光核 (很小的精致光粒子，核心 0.040，总直径 ~0.22m)
  createTinyPhotonRed() {
    const group = new THREE.Group();
    // 纯白粉高光微型核心 (半径 0.040)
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.040, 10, 10), this.materials.pulseRedTiny);
    // 荧光红内晕环 (半径 0.075)
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), this.materials.pulseRedGlow);
    // 绯红柔和外光晕 (半径 0.11)
    const outerHalo = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
      })
    );
    group.add(core);
    group.add(glow);
    group.add(outerHalo);
    return group;
  }

  // 5_3 苍蓝量子离子等离子光核 (最强蓝色激光高能核，零残留独立弹体，核心 0.055，总直径 ~0.32m)
  createIonPlasmaBlue() {
    const group = new THREE.Group();
    // 纯白苍蓝高能电弧芯 (半径 0.055)
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), this.materials.lightningCore);
    // 苍蓝高亮等离子晕环 (半径 0.11)
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), this.materials.lightningGlow);
    // 天青色深邃能量外晕 (半径 0.16)
    const outerHalo = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.50,
        blending: THREE.AdditiveBlending
      })
    );
    group.add(core);
    group.add(glow);
    group.add(outerHalo);
    return group;
  }

  // 时代 5 极小精致等离子光核微型碰撞电火花 (半径仅 0.22~0.35m，0.14s 瞬时散去，精致利落绝不遮挡)
  spawnPlasmaExplosion(pos, color = 0x00f0ff, maxRadius = 0.35) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // 1. 微型核心等离子碰撞光斑 (半径 0.06m)
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
      })
    );
    group.add(ball);

    // 2. 微型等离子冲击环 (初始 0.04m，轻微扩散到 maxRadius)
    const ringGeo = new THREE.RingGeometry(0.03, 0.08, 12);
    ringGeo.rotateX(-Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    }));
    ring.position.y = 0.02;
    group.add(ring);

    // 3. 伴随 4 颗极其轻巧的高能微火花微粒飞溅
    const sparkParticles = [];
    for (let i = 0; i < 4; i++) {
      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 6, 6),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending
        })
      );
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.2 + Math.random() * 1.5;
      sparkParticles.push({
        mesh: spark,
        vx: Math.cos(angle) * spd,
        vy: (Math.random() - 0.2) * spd,
        vz: Math.sin(angle) * spd * 0.5
      });
      group.add(spark);
    }

    this.scene.add(group);

    const startTime = performance.now();
    const duration = 140; // 140ms 瞬时利落
    const anim = () => {
      const now = performance.now();
      const p = (now - startTime) / duration;
      if (p >= 1.0) {
        if (group.parent) group.parent.remove(group);
        return;
      }
      ball.scale.setScalar(1.0 + p * 1.5);
      ball.material.opacity = (1.0 - p) * 0.95;
      ring.scale.setScalar(1.0 + p * (maxRadius * 4.0));
      ring.material.opacity = (1.0 - p) * 0.85;

      const dt = 0.016;
      for (const sp of sparkParticles) {
        sp.mesh.position.x += sp.vx * dt;
        sp.mesh.position.y += sp.vy * dt;
        sp.mesh.position.z += sp.vz * dt;
        sp.mesh.material.opacity = Math.max(0, 1.0 - p);
      }

      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }

  // 防御塔炮口开火火焰与黑火药硝烟扩散特效 (主要用于时代 3 加农炮等火器)
  spawnMuzzleFlash(muzzlePos, isPlayer, era = 3) {
    const group = new THREE.Group();
    group.position.copy(muzzlePos);

    // 1. 瞬时高亮爆闪火球 (持续 0.12s)
    const flashGeo = new THREE.SphereGeometry(0.45, 12, 12);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const flashMesh = new THREE.Mesh(flashGeo, flashMat);
    group.add(flashMesh);

    // 2. 黑火药浓烟团微粒簇 (大幅提升体积感与扩散速度)
    const smokeParticles = [];
    const dirX = isPlayer ? 1 : -1;
    for (let i = 0; i < 6; i++) {
      const smokeGeo = new THREE.SphereGeometry(0.32 + Math.random() * 0.16, 10, 10);
      const smokeMat = new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        roughness: 0.85,
        transparent: true,
        opacity: 0.85
      });
      const sMesh = new THREE.Mesh(smokeGeo, smokeMat);
      sMesh.position.set(
        (0.12 + Math.random() * 0.30) * dirX,
        (Math.random() - 0.2) * 0.25,
        (Math.random() - 0.5) * 0.25
      );
      group.add(sMesh);
      smokeParticles.push({
        mesh: sMesh,
        vx: (2.2 + Math.random() * 2.8) * dirX,
        vy: 0.6 + Math.random() * 1.0,
        vz: (Math.random() - 0.5) * 0.5
      });
    }

    this.scene.add(group);
    this.muzzleFlashes.push({
      group,
      flashMesh,
      smokeParticles,
      life: 0.48,
      elapsed: 0
    });
  }

  // 5_3 瞬发极速高压苍蓝闪电光束 (折线电弧 + 电浆爆裂 + 老巢直击)
  spawnLightningBolt(startPos, target, turretConfig, isPlayer) {
    if (!target) return;
    const isBase = (target.turretSlots !== undefined);
    const targetY = isBase ? 2.0 : (target.position.y + 1.1);
    const targetX = isBase ? (target.position.x + (isPlayer ? -1.8 : 1.8)) : target.position.x;
    const targetZ = isBase ? 0 : (target.position.z || 0);
    const endPos = new THREE.Vector3(targetX, targetY, targetZ);

    const group = new THREE.Group();
    const segments = 12;

    const buildJitterPoints = () => {
      const pts = [];
      pts.push(startPos.clone());
      for (let i = 1; i < segments; i++) {
        const frac = i / segments;
        const pt = new THREE.Vector3().lerpVectors(startPos, endPos, frac);
        const jitterMag = Math.sin(frac * Math.PI) * 0.45;
        pt.x += (Math.random() - 0.5) * jitterMag;
        pt.y += (Math.random() - 0.5) * jitterMag;
        pt.z += (Math.random() - 0.5) * (jitterMag * 0.5);
        pts.push(pt);
      }
      pts.push(endPos.clone());
      return pts;
    };

    const pts = buildJitterPoints();
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const lineMesh = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 3,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.95
    }));
    group.add(lineMesh);

    // 白色高压闪电电芯
    const coreGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const coreLine = new THREE.Line(coreGeo, new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 1.5,
      blending: THREE.AdditiveBlending
    }));
    group.add(coreLine);

    // 受击点爆裂电火花光球
    const impactGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      })
    );
    impactGlow.position.copy(endPos);
    group.add(impactGlow);

    this.scene.add(group);

    // 瞬发结算雷击伤害
    if (this.onHit) {
      this.onHit({
        mesh: { position: endPos },
        target,
        damage: turretConfig.damage || 80,
        isPlayer,
        isSplash: true,
        splashRadius: turretConfig.splashRadius || 4.2,
        splashDamage: turretConfig.damage || 80,
        type: 'turret',
        tid: 'turret_5_3'
      });
    }

    this.lightnings.push({
      group,
      lineGeo,
      coreGeo,
      impactGlow,
      startPos,
      endPos,
      life: 0.16,
      elapsed: 0,
      buildJitterPoints
    });
  }

  // === 兵种远程弹道 (如弓箭手/原始人投石/现代步兵机枪) ===
  spawnUnitProjectile(startPos, target, damage, bulletSpeed, isPlayer, unitConfig = null) {
    let mesh = null;
    let alignRotation = false;
    let speed = bulletSpeed || 22.0;

    if (unitConfig && unitConfig.age === 4) {
      // 军事时代步兵：高速赤红/碳黑机枪步枪子弹，移速提升至 48m/s
      mesh = this.createTracer(Math.random() > 0.5 ? 'red' : 'black');
      speed = 48.0;
      alignRotation = true;
    } else if (unitConfig && (unitConfig.id === 'trooper_4' || unitConfig.id === 'super_soldier')) {
      // 时代 5 终极超能特种兵英雄：高科技苍蓝离子能量光核，极速 50m/s
      mesh = this.createIonPlasmaBlue();
      speed = 50.0;
      alignRotation = true;
    } else if (unitConfig && unitConfig.id === 'trooper_2') {
      // 时代 5 爆能枪手：高聚能红宝石等离子微型光核，移速 42m/s
      mesh = this.createTinyPhotonRed();
      speed = 42.0;
      alignRotation = true;
    } else {
      mesh = new THREE.Mesh(this.geos.unitStone, this.materials.unitStone);
    }

    mesh.position.copy(startPos);
    this.scene.add(mesh);

    const isBase = target && (target.turretSlots !== undefined);
    const targetY = isBase ? 2.2 : ((target && target.position) ? (target.position.y + 1.1) : startPos.y);
    const targetX = isBase ? (target.position.x + (isPlayer ? -4.2 : 4.2)) : ((target && target.position) ? target.position.x : (startPos.x + (isPlayer ? 10 : -10)));
    const targetPos = new THREE.Vector3(targetX, targetY, startPos.z);

    const dir = new THREE.Vector3().subVectors(targetPos, startPos).normalize();

    this.projectiles.push({
      mesh,
      target,
      damage,
      isPlayer,
      speedX: dir.x * speed,
      speedY: dir.y * speed,
      speedZ: 0,
      gravity: 0, // 直线弹道：零重力
      alignRotation,
      isSplash: false,
      type: 'unit',
      unitConfig
    });
  }

  // === 炮塔弹道发射调度器 (15 款防御塔真实弹药匹配) ===
  spawnTurretProjectile(startPos, target, turretConfig, isPlayer) {
    let mesh = null;
    let isSplash = false;
    let splashRadius = 0;
    let splashDamage = 0;
    let gravity = -22.0;
    let alignRotation = false; // 是否使模型长轴锁定飞行速度向量 (导弹、机枪曳光弹)
    let speed = turretConfig.bulletSpeed || 16.0;

    const tid = turretConfig.id;

    let isEra5Laser = false;
    let isHoming = false;
    let currentSpeed = 0;
    let accel = 0;
    let maxSpeed = 0;

    // 根据 15 种武器配置精准构建模型与弹道物理特性
    switch (tid) {
      case 'turret_1_1': // 原始弹弓
        mesh = this.createRockSmall();
        gravity = -20.0;
        break;

      case 'turret_1_2': // 恐龙蛋连发
        mesh = this.createEgg();
        gravity = -18.0;
        break;

      case 'turret_1_3': // 原始重型投石机 (告别 1.3米巨石，使用真实 0.24米重石)
        mesh = this.createCatapultRock();
        isSplash = true;
        splashRadius = turretConfig.splashRadius || 3.5;
        splashDamage = turretConfig.splashDamage || 15;
        gravity = -24.0;
        break;

      case 'turret_2_1': // 中世纪配重投石车
        mesh = this.createMedievalStone();
        gravity = -22.0;
        break;

      case 'turret_2_2': // 烈焰投石车火球
        mesh = this.createFireball();
        isSplash = true;
        splashRadius = turretConfig.splashRadius || 3.8;
        splashDamage = turretConfig.splashDamage || 20;
        gravity = -20.0;
        break;

      case 'turret_2_3': // 沸油倾泻机 (黄色滚烫瀑布流体垂直下落，对要塞右下方极短范围造成极高爆发伤害)
        mesh = this.createOilDrop();
        isSplash = true;
        splashRadius = turretConfig.splashRadius || 3.2;
        splashDamage = turretConfig.splashDamage || 120;
        gravity = -26.0;
        speed = 10.0;
        break;

      case 'turret_3_1': // 小型加农炮
        mesh = this.createCannonballSmall();
        gravity = -6.0; // 加农炮高速低伸平直弹道
        speed = 28.0;
        break;

      case 'turret_3_2': // 重型加农炮
        mesh = this.createCannonballLarge();
        gravity = -6.5;
        speed = 30.0;
        break;

      case 'turret_3_3': // 高爆集束加农炮
        mesh = this.createCannonballCluster();
        isSplash = true;
        splashRadius = turretConfig.splashRadius || 3.8;
        splashDamage = turretConfig.splashDamage || 25;
        gravity = -6.5;
        speed = 32.0;
        break;

      case 'turret_4_1': // 现代单管防空机枪 (赤红高透穿甲曳光弹，高速 50.0m/s)
        mesh = this.createTracer('red');
        gravity = 0;
        speed = 50.0;
        alignRotation = true;
        break;

      case 'turret_4_2': // 现代战术火箭发射塔 (碳黑弹体+炽红破甲弹头，提速至 35.0m/s)
        mesh = this.createMissile();
        isSplash = true;
        splashRadius = 4.2;
        splashDamage = turretConfig.damage || 100;
        gravity = 0;
        speed = 35.0;
        alignRotation = true;
        break;

      case 'turret_4_3': // 现代双联加特林重机炮 (赤红与碳黑交替高爆穿甲弹，极速 54.0m/s)
        mesh = this.createTracer(Math.random() > 0.5 ? 'red' : 'black');
        gravity = 0;
        speed = 54.0;
        alignRotation = true;
        break;

      case 'turret_5_1': // 钛合金脉冲塔：超小翡翠绿光微粒，直线高能爆发加速，无拐弯吸附
        mesh = this.createTinyPhotonGreen();
        gravity = 0;
        isEra5Laser = true;
        currentSpeed = 16.0;
        maxSpeed = 38.0;
        alignRotation = true;
        break;

      case 'turret_5_2': // 聚焦激光炮：超小红宝石光微粒，直线高能爆发加速，无拐弯吸附
        mesh = this.createTinyPhotonRed();
        gravity = 0;
        isEra5Laser = true;
        currentSpeed = 18.0;
        maxSpeed = 42.0;
        alignRotation = true;
        break;

      case 'turret_5_3': // 要塞离子歼灭炮：苍蓝量子等离子光核，零残留独立弹体，直线高能爆发加速，无拐弯吸附
        mesh = this.createIonPlasmaBlue();
        gravity = 0;
        isEra5Laser = true;
        isSplash = false;
        splashRadius = 0;
        currentSpeed = 20.0;
        maxSpeed = 48.0;
        alignRotation = true;
        break;

      default:
        mesh = this.createRockSmall();
        gravity = -20.0;
        break;
    }

    mesh.position.copy(startPos);
    this.scene.add(mesh);

    // 计算初速度向量与目标坐标
    const isBase = target && (target.turretSlots !== undefined);
    const targetY = isBase ? 2.5 : ((target && target.position) ? (target.position.y + 1.1) : 1.1);
    const targetX = isBase ? (target.position.x + (isPlayer ? -4.2 : 4.2)) : ((target && target.position) ? target.position.x : (startPos.x + (isPlayer ? 15 : -15)));
    const targetZ = isBase ? 0 : ((target && target.position) ? (target.position.z || 0) : 0);
    const dx = targetX - startPos.x;
    const dy = targetY - startPos.y;
    const dz = targetZ - startPos.z;
    const dist = Math.hypot(dx, dy, dz) || 1.0;

    const dirX = dx / dist;
    const dirY = dy / dist;
    const dirZ = dz / dist;

    let speedX = 0;
    let speedY = 0;

    if (tid === 'turret_2_3') {
      // 沸油：直接垂直向下向前倾泻倒油
      speedX = isPlayer ? 1.8 : -1.8;
      speedY = -3.0;
    } else if (isEra5Laser) {
      // 时代 5 激光能量弹：严格沿发射瞬间的直线向量飞射，初速开火出膛
      speedX = dirX * currentSpeed;
      speedY = dirY * currentSpeed;
    } else if (gravity === 0) {
      // 零重力直线弹道 (现代机枪、火箭)
      const dist2 = Math.hypot(dx, dy);
      const timeToTarget = Math.max(0.2, dist2 / speed);
      speedX = dx / timeToTarget;
      speedY = dy / timeToTarget;
    } else {
      // 抛物线弹道 (加农炮、投石机)
      const timeToTarget = Math.max(0.4, Math.abs(dx) / speed);
      speedX = dx / timeToTarget;
      speedY = (dy - 0.5 * gravity * timeToTarget * timeToTarget) / timeToTarget;
    }

    // 若需要将弹体主轴对齐飞行速度切线 (如巡航飞弹、机枪曳光弹、激光光核)
    if (alignRotation) {
      const angle = Math.atan2(speedY, speedX);
      mesh.rotation.z = angle;
      if (!isPlayer && tid !== 'turret_4_2') {
        mesh.rotation.y = Math.PI;
      }
    }

    this.projectiles.push({
      mesh,
      target,
      damage: turretConfig.damage,
      isPlayer,
      speedX,
      speedY,
      gravity,
      alignRotation,
      isSplash,
      splashRadius,
      splashDamage,
      isEra5Laser,
      dirX,
      dirY,
      dirZ,
      targetX,
      targetY,
      targetZ,
      isBaseTarget: isBase,
      initSpeed: currentSpeed, // 初始出膛速度 (16 ~ 20 m/s)
      currentSpeed,
      maxSpeed,
      accelDuration: (tid === 'turret_5_3') ? 0.32 : 0.40, // 快速平滑直线提速
      elapsed: 0, // 每颗子弹独立存活时间，从 0 开始
      type: 'turret',
      tid
    });
  }

  // === 核心逐帧物理移动与击中判定 ===
  update(dt) {
    // 推进所有防御塔与兵种投射物
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      let hitTarget = false;

      // A. 时代 5 高能激光弹：直线平滑加速直击，自然穿透命中，绝不拐弯吸附敌人
      if (p.isEra5Laser) {
        p.elapsed = (p.elapsed || 0) + dt;

        // 每次发射独立经历平滑提速过程，绝不叠加，直线疾射冲刺
        const tNorm = Math.min(1.0, p.elapsed / (p.accelDuration || 0.40));
        const smoothProgress = tNorm * tNorm * (3.0 - 2.0 * tNorm); // Smoothstep 曲线
        p.currentSpeed = p.initSpeed + (p.maxSpeed - p.initSpeed) * smoothProgress;
        const moveStep = p.currentSpeed * dt;

        p.mesh.position.x += p.dirX * moveStep;
        p.mesh.position.y += p.dirY * moveStep;
        p.mesh.position.z += p.dirZ * moveStep;

        // 目标受击命中检测 (直线飞入目标区域即判定命中，不吸附)
        if (p.isBaseTarget) {
          const reachedBase = p.isPlayer ? (p.mesh.position.x >= p.targetX) : (p.mesh.position.x <= p.targetX);
          if (reachedBase) {
            hitTarget = true;
          }
        } else if (p.target && !p.target.isDead) {
          const reachedUnit = p.isPlayer ? (p.mesh.position.x >= p.target.position.x - 0.3) : (p.mesh.position.x <= p.target.position.x + 0.3);
          const yDist = Math.abs(p.mesh.position.y - (p.target.position.y + 1.1));
          if (reachedUnit && yDist < 1.8) {
            hitTarget = true;
          }
        }
      } else {
        // B. 普通常规物理与抛物线
        p.mesh.position.x += p.speedX * dt;
        p.mesh.position.y += p.speedY * dt;

        if (p.gravity !== 0) {
          p.speedY += p.gravity * dt;
          p.mesh.rotation.x += dt * 4.0;
          p.mesh.rotation.z += dt * 5.0;
        } else if (p.alignRotation) {
          p.mesh.rotation.z = Math.atan2(p.speedY, p.speedX);
        }
      }

      // 地面受击判定
      const hitGround = p.mesh.position.y <= 0.2;

      // 敌方单位或敌方老巢受击判定 (防止穿透或高速漏判)
      if (!hitTarget && p.target && !p.target.isDead) {
        const isBase = (p.target.turretSlots !== undefined);
        if (isBase) {
          const reachedBase = p.isPlayer ? (p.mesh.position.x >= p.target.position.x - 4.5) : (p.mesh.position.x <= p.target.position.x + 4.5);
          if (reachedBase) {
            hitTarget = true;
          }
        } else {
          const dist = Math.abs(p.mesh.position.x - p.target.position.x);
          const overshot = (p.isPlayer && p.mesh.position.x >= p.target.position.x) || 
                           (!p.isPlayer && p.mesh.position.x <= p.target.position.x);
          if ((dist < 0.9 || overshot) && Math.abs(p.mesh.position.y - (p.target.position.y + 1.1)) < 1.8) {
            hitTarget = true;
          }
        }
      }

      // 超出战场边界安全回收 (X < -26 或 X > 26)
      const outOfBounds = Math.abs(p.mesh.position.x) > 26.0;

      if (hitGround || hitTarget || outOfBounds) {
        if (!outOfBounds && this.onHit) {
          this.onHit(p);
        }

        // 时代 5 微型高科技碰撞电火花，精致小巧 (半径 0.22~0.35m，彻底消除怪异大光环)
        if (!outOfBounds && (p.tid === 'turret_5_1' || p.tid === 'turret_5_2' || p.tid === 'turret_5_3')) {
          let col = 0x34d399;
          let r = 0.22;
          if (p.tid === 'turret_5_2') { col = 0xf43f5e; r = 0.26; }
          if (p.tid === 'turret_5_3') { col = 0x00f0ff; r = 0.35; }
          this.spawnPlasmaExplosion(p.mesh.position, col, r);
        }

        if (p.mesh && p.mesh.parent) {
          p.mesh.parent.remove(p.mesh);
        }
        this.projectiles.splice(i, 1);
      }
    }

    // 3. 推进炮口开火火焰与黑火药浓烟扩散微粒
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      const mf = this.muzzleFlashes[i];
      mf.elapsed += dt;
      if (mf.elapsed >= mf.life) {
        if (mf.group && mf.group.parent) {
          mf.group.parent.remove(mf.group);
        }
        this.muzzleFlashes.splice(i, 1);
        continue;
      }

      // 火光极速膨胀并快速收敛消退 (0.12s 内消散)
      if (mf.elapsed < 0.12) {
        mf.flashMesh.scale.multiplyScalar(1.0 + dt * 6.0);
        mf.flashMesh.material.opacity = Math.max(0, 1.0 - (mf.elapsed / 0.12));
      } else {
        mf.flashMesh.visible = false;
      }

      // 黑火药浓烟向前上方翻滚膨胀扩散
      const progress = mf.elapsed / mf.life;
      for (const sp of mf.smokeParticles) {
        sp.mesh.position.x += sp.vx * dt;
        sp.mesh.position.y += sp.vy * dt;
        sp.mesh.position.z += sp.vz * dt;
        sp.mesh.scale.multiplyScalar(1.0 + dt * 2.2);
        sp.mesh.material.opacity = Math.max(0, 0.75 * (1.0 - progress));
      }
    }
  }

  clear() {
    for (const p of this.projectiles) {
      if (p.mesh && p.mesh.parent) {
        p.mesh.parent.remove(p.mesh);
      }
    }
    this.projectiles = [];

    for (const lt of this.lightnings) {
      if (lt.group && lt.group.parent) {
        lt.group.parent.remove(lt.group);
      }
    }
    this.lightnings = [];

    for (const mf of this.muzzleFlashes) {
      if (mf.group && mf.group.parent) {
        mf.group.parent.remove(mf.group);
      }
    }
    this.muzzleFlashes = [];
  }
}
