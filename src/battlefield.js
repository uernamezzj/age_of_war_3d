/**
 * 《战争进化史 3D》战场环境调度引擎
 * 时代 1 (原始石器)：100% 保持经典原生洞穴要塞、红石峡谷植被与史前干涸泥土
 * 时代 2~5：直接无缝挂载用户定制调优的物理净空大场景 (森林/汉诺威/现代战争/太空星云)
 */

import { GAME_CONFIG } from './game_config.js';

export const CUSTOM_ERA_SCENES = {
  2: {
    name: "欧洲原野森林大道",
    tag: "纪元 II：欧洲原野森林",
    file: './models/custom_scenes/forest_night_road_cleared.glb',
    scale: 2.37,
    position: [-32.0, -5.1, 30.0],
    rotationY: 0.0,
    clipZ: 3.5,
    skyColor: 0x030712,
    groundColor: 0x2d4a22,
    roadColor: 0x475569,
    baseModel: './models/era2/base_2.glb',
    baseScale: 0.75,
    lightColor: 0xf0fdf4,
    lightIntensity: 2.2
  },
  3: {
    name: "汉诺威古典城市街区",
    tag: "纪元 III：汉诺威古典要塞",
    file: './models/custom_scenes/city_hannover_cleared.glb',
    scale: 1.16,
    position: [0.5, -0.1, 6.5],
    rotationY: 0.0,
    clipZ: -5.5,
    skyColor: 0x38bdf8,
    groundColor: 0x334155,
    roadColor: 0x1e293b,
    baseModel: './models/era3/base_3.glb',
    baseScale: 0.75,
    lightColor: 0xffedd5,
    lightIntensity: 2.2
  },
  4: {
    name: "现代战争战场街区",
    tag: "纪元 IV：现代战争焦土",
    file: './models/custom_scenes/modern_war_cleared.glb',
    scale: 0.65,
    position: [0.5, -1.9, 0.0],
    rotationY: 0.0,
    clipZ: -4.5,
    skyColor: 0x1e293b,
    groundColor: 0x1e293b,
    roadColor: 0x0f172a,
    baseModel: './models/era4/base_4.glb',
    baseScale: 0.75,
    lightColor: 0xf1f5f9,
    lightIntensity: 2.2
  },
  5: {
    name: "太空星际星云穹顶",
    tag: "纪元 V：未来星际轨道",
    file: './models/custom_scenes/space_nebula_cleared.glb',
    scale: 14.20,
    position: [-27.0, -19.2, 0.0],
    rotationY: 0.0,
    clipZ: 5.0,
    skyColor: 0x020617,
    groundColor: 0x0a1128,
    roadColor: 0x1e1b4b,
    baseModel: './models/era5/base_5.glb',
    baseScale: 0.75,
    lightColor: 0xc7d2fe,
    lightIntensity: 2.4
  }
};

export class Battlefield {
  constructor(scene, gltfLoader, fbxLoader) {
    this.scene = scene;
    this.gltfLoader = gltfLoader || new THREE.GLTFLoader();
    this.fbxLoader = fbxLoader;

    this.currentEra = 1;

    // 结构分组
    this.environmentGroup = new THREE.Group();
    this.prehistoricGroup = new THREE.Group();
    this.customBgGroup = new THREE.Group();
    this.borderGroup = new THREE.Group();
    this.baseGroup = new THREE.Group();

    this.scene.add(this.environmentGroup);
    this.scene.add(this.prehistoricGroup);
    this.scene.add(this.customBgGroup);
    this.scene.add(this.borderGroup);
    this.scene.add(this.baseGroup);

    this.playerBaseMesh = null;
    this.enemyBaseMesh = null;
    this.currentCustomBgMesh = null;

    // 基地要塞防御塔槽位
    this.playerTurretSlots = [
      new THREE.Vector3(-24.5, 4.6, 0),
      new THREE.Vector3(-26.5, 5.0, -1.3),
      new THREE.Vector3(-26.5, 5.0, 1.3),
    ];

    this.enemyTurretSlots = [
      new THREE.Vector3(24.5, 4.6, 0),
      new THREE.Vector3(26.5, 5.0, -1.3),
      new THREE.Vector3(26.5, 5.0, 1.3),
    ];

    // 灯光引用
    this.sunLight = null;
    this.skyLight = null;
    this.ambientLight = null;
    this.playerCampfire = null;
    this.enemyCampfire = null;

    // 地面材质
    this.groundMat = null;
    this.centerLineMat = null;
  }

  async build() {
    this.setupLighting();
    this.setupGround();
    await this.setupPrehistoricVegetation();
    await this.setupBases(1);
    await this.setEra(1);
  }

  setupLighting() {
    // 1. 主太阳光
    this.sunLight = new THREE.DirectionalLight(0xffedd5, 1.9);
    this.sunLight.position.set(12, 28, 16);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 140;
    this.sunLight.shadow.camera.left = -50;
    this.sunLight.shadow.camera.right = 50;
    this.sunLight.shadow.camera.top = 30;
    this.sunLight.shadow.camera.bottom = -30;
    this.sunLight.shadow.bias = -0.0006;
    this.scene.add(this.sunLight);

    // 2. 天空漫反射
    this.skyLight = new THREE.DirectionalLight(0x7dd3fc, 0.7);
    this.skyLight.position.set(-20, 20, -20);
    this.scene.add(this.skyLight);

    // 3. 环境漫射光
    this.ambientLight = new THREE.AmbientLight(0xfffbeb, 0.65);
    this.scene.add(this.ambientLight);

    // 4. 史前篝火
    this.playerCampfire = new THREE.PointLight(0xf97316, 2.5, 12, 1.8);
    this.playerCampfire.position.set(GAME_CONFIG.battlefield.playerBaseX + 3.5, 1.2, 0);
    this.scene.add(this.playerCampfire);

    this.enemyCampfire = new THREE.PointLight(0xef4444, 2.5, 12, 1.8);
    this.enemyCampfire.position.set(GAME_CONFIG.battlefield.enemyBaseX - 3.5, 1.2, 0);
    this.scene.add(this.enemyCampfire);

    // 时代 1 默认雾气与天空
    this.scene.fog = new THREE.FogExp2(0x0e1726, 0.012);
    this.scene.background = new THREE.Color(0x0e1726);
  }

  setupGround() {
    const groundGeo = new THREE.PlaneGeometry(74, 14, 64, 16);
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const edgeFactor = Math.min(1, Math.abs(y) / 6.0);
      const bump = Math.sin(x * 0.4) * Math.cos(y * 0.5) * 0.12 * edgeFactor;
      pos.setZ(i, bump);
    }
    groundGeo.computeVertexNormals();

    this.groundMat = new THREE.MeshStandardMaterial({
      color: 0x47382d,
      roughness: 0.92,
      metalness: 0.04,
      flatShading: true
    });
    const groundMesh = new THREE.Mesh(groundGeo, this.groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    groundMesh.receiveShadow = true;
    this.environmentGroup.add(groundMesh);

    // 战道中线与交战分界地标微光环
    const centerLineGeo = new THREE.PlaneGeometry(0.3, 10);
    this.centerLineMat = new THREE.MeshBasicMaterial({
      color: 0xe07a5f,
      transparent: true,
      opacity: 0.35
    });
    const centerLine = new THREE.Mesh(centerLineGeo, this.centerLineMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.02, 0);
    this.environmentGroup.add(centerLine);

    this.createPathBorders();
  }

  createPathBorders() {
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x2e2723,
      roughness: 0.95
    });
    for (let x = -32; x <= 32; x += 3.5) {
      const geoN = new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.25, 0);
      const meshN = new THREE.Mesh(geoN, borderMat);
      meshN.position.set(x + (Math.random() - 0.5), 0.15, -4.8 + (Math.random() - 0.5) * 0.5);
      meshN.rotation.set(Math.random(), Math.random(), Math.random());
      meshN.receiveShadow = true;
      this.borderGroup.add(meshN);

      const geoS = new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.25, 0);
      const meshS = new THREE.Mesh(geoS, borderMat);
      meshS.position.set(x + (Math.random() - 0.5), 0.15, 4.8 + (Math.random() - 0.5) * 0.5);
      meshS.rotation.set(Math.random(), Math.random(), Math.random());
      meshS.receiveShadow = true;
      this.borderGroup.add(meshS);
    }
  }

  async setupBases(eraId = 1) {
    while (this.baseGroup.children.length > 0) {
      this.baseGroup.remove(this.baseGroup.children[0]);
    }

    const baseFile = eraId === 1 ? './models/era1/base_1.glb' : (CUSTOM_ERA_SCENES[eraId]?.baseModel || './models/era1/base_1.glb');
    const baseScale = eraId === 1 ? 1.0 : (CUSTOM_ERA_SCENES[eraId]?.baseScale || 0.75);

    return new Promise((resolve) => {
      this.gltfLoader.load(baseFile, (gltf) => {
        const baseMesh = gltf.scene;
        baseMesh.traverse(c => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
            if (c.material) c.material.roughness = 0.88;
          }
        });

        // 1. 我方基地 (左侧 X = -26, 洞口/正门朝右)
        this.playerBaseMesh = baseMesh.clone();
        this.playerBaseMesh.scale.setScalar(baseScale);
        this.playerBaseMesh.position.set(GAME_CONFIG.battlefield.playerBaseX, 0, 0);
        this.playerBaseMesh.rotation.y = 0;
        this.baseGroup.add(this.playerBaseMesh);

        // 2. 敌方基地 (右侧 X = 26, 洞口/正门朝左，旋转 180 度)
        this.enemyBaseMesh = baseMesh.clone();
        this.enemyBaseMesh.scale.setScalar(baseScale);
        this.enemyBaseMesh.position.set(GAME_CONFIG.battlefield.enemyBaseX, 0, 0);
        this.enemyBaseMesh.rotation.y = Math.PI;
        this.baseGroup.add(this.enemyBaseMesh);

        resolve();
      }, undefined, () => resolve());
    });
  }

  async setupPrehistoricVegetation() {
    const loadGltf = (file) => new Promise(res => {
      this.gltfLoader.load(file, (gltf) => {
        res(gltf ? gltf.scene : null);
      }, undefined, () => res(null));
    });

    const [rockScene, treeScene, bushScene] = await Promise.all([
      loadGltf('./models/era1/rock_1.glb'),
      loadGltf('./models/era1/tree_1.glb'),
      loadGltf('./models/era1/bush_1.glb')
    ]);

    const decoPositions = [
      { x: -18, z: -7.5, type: 'tree', rot: 0.2 },
      { x: -12, z: -7.8, type: 'rock', rot: 1.1 },
      { x: -5,  z: -7.2, type: 'tree', rot: 2.4 },
      { x: 2,   z: -8.0, type: 'rock', rot: 0.8 },
      { x: 9,   z: -7.3, type: 'tree', rot: 3.5 },
      { x: 16,  z: -8.2, type: 'rock', rot: 1.9 },
      { x: 21,  z: -7.4, type: 'tree', rot: 4.2 },

      { x: -15, z: 7.2, type: 'bush', rot: 0.5 },
      { x: -8,  z: 7.4, type: 'rock', rot: 2.1 },
      { x: 0,   z: 7.0, type: 'bush', rot: 1.7 },
      { x: 8,   z: 7.5, type: 'rock', rot: 3.2 },
      { x: 15,  z: 7.1, type: 'bush', rot: 4.8 },
    ];

    decoPositions.forEach(cfg => {
      let src = null;
      if (cfg.type === 'rock') src = rockScene;
      else if (cfg.type === 'tree') src = treeScene;
      else if (cfg.type === 'bush') src = bushScene;

      if (!src) return;
      const clone = src.clone();
      clone.position.set(cfg.x, 0, cfg.z);
      clone.rotation.y = cfg.rot || Math.random() * Math.PI * 2;
      clone.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });
      this.prehistoricGroup.add(clone);
    });
  }

  /**
   * 核心时代背景与地貌切换
   * eraId = 1: 保持原来经典史前石器时代 (红石大峡谷、原始图腾石树、干涸黄土)
   * eraId = 2~5: 切换到用户定制并调优的 4 大高清净空场景
   */
  async setEra(eraId) {
    this.currentEra = eraId;

    if (eraId === 1) {
      // --- 时代 1：保持原来那个！完全不变 ---
      this.prehistoricGroup.visible = true;
      this.borderGroup.visible = true;
      this.customBgGroup.visible = false;
      while (this.customBgGroup.children.length > 0) {
        this.customBgGroup.remove(this.customBgGroup.children[0]);
      }
      this.currentCustomBgMesh = null;

      // 还原石器时代环境光与苍凉雾气
      this.scene.fog = new THREE.FogExp2(0x0e1726, 0.012);
      this.scene.background = new THREE.Color(0x0e1726);

      if (this.groundMat) this.groundMat.color.setHex(0x47382d);
      if (this.centerLineMat) this.centerLineMat.color.setHex(0xe07a5f);

      if (this.sunLight) {
        this.sunLight.color.setHex(0xffedd5);
        this.sunLight.intensity = 1.9;
      }
      if (this.skyLight) this.skyLight.color.setHex(0x7dd3fc);

      if (this.playerCampfire) this.playerCampfire.visible = true;
      if (this.enemyCampfire) this.enemyCampfire.visible = true;

      await this.setupBases(1);
      return;
    }

    // --- 时代 2~5：直接移植用户调优的净空大场景 ---
    const cfg = CUSTOM_ERA_SCENES[eraId];
    if (!cfg) return;

    this.prehistoricGroup.visible = false;
    this.borderGroup.visible = (eraId !== 5);
    this.customBgGroup.visible = true;

    // 清零雾气，确保宏伟大场景通透一览无余
    this.scene.fog = null;
    this.scene.background = new THREE.Color(cfg.skyColor);

    if (this.groundMat) this.groundMat.color.setHex(cfg.groundColor);
    if (this.centerLineMat) this.centerLineMat.color.setHex(0x38bdf8);

    if (this.sunLight) {
      this.sunLight.color.setHex(cfg.lightColor);
      this.sunLight.intensity = cfg.lightIntensity;
    }
    if (this.skyLight) this.skyLight.color.setHex(cfg.lightColor);

    if (this.playerCampfire) this.playerCampfire.visible = false;
    if (this.enemyCampfire) this.enemyCampfire.visible = false;

    // 切换对峙基地要塞
    await this.setupBases(eraId);

    // 加载并装配大场景
    while (this.customBgGroup.children.length > 0) {
      this.customBgGroup.remove(this.customBgGroup.children[0]);
    }

    return new Promise((resolve) => {
      this.gltfLoader.load(cfg.file, (gltf) => {
        const root = gltf.scene;
        root.scale.setScalar(cfg.scale);
        root.position.set(...cfg.position);
        root.rotation.y = cfg.rotationY;

        // 硬件级局部激光剖切 (严格切除战道与镜头阻碍)
        if (cfg.clipZ !== undefined && cfg.clipZ !== null) {
          const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), cfg.clipZ);
          root.traverse(c => {
            if (c.isMesh && c.material) {
              if (Array.isArray(c.material)) {
                c.material.forEach(m => { m.clippingPlanes = [plane]; m.clipShadows = true; m.needsUpdate = true; });
              } else {
                c.material.clippingPlanes = [plane];
                c.material.clipShadows = true;
                c.material.needsUpdate = true;
              }
            }
          });
        }

        root.traverse(c => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });

        this.customBgGroup.add(root);
        this.currentCustomBgMesh = root;
        resolve();
      }, undefined, (err) => {
        console.error("加载大场景模型失败:", err);
        resolve();
      });
    });
  }
}
