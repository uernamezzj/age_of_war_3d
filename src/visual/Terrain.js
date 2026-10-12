/**
 * Terrain.js - 160米战道走廊、三车道刻度线与开源自然生态景观
 */
export class Terrain {
  constructor(scene) {
    this.scene = scene;
    this.gltfLoader = new THREE.GLTFLoader();

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.initHighway();
    this.initSurroundings();
    this.loadNatureProps();
  }

  initHighway() {
    // 1. 160米长、12米宽的中央行军干道 (X: -80 ~ +80)
    const roadLength = 160;
    const roadWidth = 12;

    const roadGeo = new THREE.PlaneGeometry(roadLength, roadWidth, 60, 10);
    this.roadMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // 中世纪石板路
      roughness: 0.85,
      metalness: 0.1
    });
    const road = new THREE.Mesh(roadGeo, this.roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 0);
    road.receiveShadow = true;
    this.group.add(road);

    // 2. 两侧路缘护栏道牙石 (Curb Stones)
    const curbGeo = new THREE.BoxGeometry(roadLength, 0.35, 0.45);
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9
    });

    const northCurb = new THREE.Mesh(curbGeo, curbMat);
    northCurb.position.set(0, 0.15, roadWidth / 2 + 0.2);
    northCurb.castShadow = true;
    northCurb.receiveShadow = true;
    this.group.add(northCurb);

    const southCurb = northCurb.clone();
    southCurb.position.z = -roadWidth / 2 - 0.2;
    this.group.add(southCurb);

    // 3. 3条交错行车道参考虚线 (Top: +3.5, Mid: 0, Bot: -3.5)
    [-3.5, 3.5].forEach(zPos => {
      for (let x = -70; x <= 70; x += 10) {
        const dashGeo = new THREE.PlaneGeometry(5, 0.18);
        const dashMat = new THREE.MeshBasicMaterial({
          color: 0x94a3b8,
          transparent: true,
          opacity: 0.4
        });
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.03, zPos);
        this.group.add(dash);
      }
    });

    // 4. 战线里程刻度线与中锋交火点 (每 20 米一个标线)
    for (let x = -60; x <= 60; x += 20) {
      const isCenter = (x === 0);
      const stripGeo = new THREE.BoxGeometry(0.35, 0.04, roadWidth * 0.9);
      const stripMat = new THREE.MeshBasicMaterial({
        color: isCenter ? 0xef4444 : 0x38bdf8 // 中线鲜红，其余高亮浅蓝
      });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(x, 0.03, 0);
      this.group.add(strip);
    }
  }

  initSurroundings() {
    // 广袤自然平原大地 (长 300米，宽 160米)
    const groundGeo = new THREE.PlaneGeometry(300, 160);
    this.groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a1e, // 中世纪绿色草甸
      roughness: 0.95,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, this.groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, 0);
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  /**
   * 载入并批量散布 Kenney 开源 3D 自然资产（树木、岩石群）
   */
  loadNatureProps() {
    const treeUrls = [
      './assets/models/kenney_nature/tree_default.glb',
      './assets/models/kenney_nature/tree_blocks.glb',
      './assets/models/kenney_nature/tree_cone.glb'
    ];
    const rockUrls = [
      './assets/models/kenney_nature/rock_largeA.glb',
      './assets/models/kenney_nature/rock_largeB.glb',
      './assets/models/kenney_nature/rock_largeC.glb'
    ];

    // 1. 批量加载树木
    treeUrls.forEach((url, idx) => {
      this.gltfLoader.load(url, (gltf) => {
        const treeTemplate = gltf.scene;
        // 在干道南北两侧各布置 12 棵自然树木
        for (let i = 0; i < 14; i++) {
          const tree = treeTemplate.clone();
          const side = (i % 2 === 0) ? 1 : -1;
          const x = -70 + Math.random() * 140;
          const z = side * (8.5 + Math.random() * 22);
          const scale = 2.0 + Math.random() * 1.5;

          tree.position.set(x, 0, z);
          tree.scale.set(scale, scale, scale);
          tree.rotation.y = Math.random() * Math.PI * 2;
          tree.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.group.add(tree);
        }
      }, undefined, (err) => {
        console.warn('Nature tree load warn:', err);
      });
    });

    // 2. 批量加载岩石
    rockUrls.forEach((url) => {
      this.gltfLoader.load(url, (gltf) => {
        const rockTemplate = gltf.scene;
        for (let i = 0; i < 8; i++) {
          const rock = rockTemplate.clone();
          const side = (i % 2 === 0) ? 1 : -1;
          const x = -72 + Math.random() * 144;
          const z = side * (7.5 + Math.random() * 18);
          const scale = 1.2 + Math.random() * 1.8;

          rock.position.set(x, 0, z);
          rock.scale.set(scale, scale, scale);
          rock.rotation.y = Math.random() * Math.PI * 2;
          rock.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.group.add(rock);
        }
      }, undefined, (err) => {
        console.warn('Nature rock load warn:', err);
      });
    });
  }

  setEra(eraId) {
    if (eraId === 1) {
      // 史前石器：黄土泥原
      this.groundMat.color.setHex(0x5c4033);
      this.roadMat.color.setHex(0x8b5a2b);
    } else if (eraId === 2) {
      // 中世纪：青葱平原 + 青石大道
      this.groundMat.color.setHex(0x2d4a22);
      this.roadMat.color.setHex(0x475569);
    } else if (eraId === 3) {
      // 文艺复兴：战壕泥土 + 暗青砖
      this.groundMat.color.setHex(0x3b3a30);
      this.roadMat.color.setHex(0x524836);
    } else if (eraId === 4) {
      // 现代工业：暗色沥青 + 荒草
      this.groundMat.color.setHex(0x272b23);
      this.roadMat.color.setHex(0x1e293b);
    } else if (eraId === 5) {
      // 未来科幻：深黑赛博金属网格
      this.groundMat.color.setHex(0x0a1128);
      this.roadMat.color.setHex(0x0f2b48);
    }
    this.loadCustomBackground(eraId);
  }

  loadCustomBackground(eraId) {
    if (this.currentCustomBg) {
      this.group.remove(this.currentCustomBg);
      this.currentCustomBg = null;
    }
    const configs = {
      2: { file: './models/custom_scenes/forest_night_road_cleared.glb', scale: 2.37, pos: [-32.0, -5.1, 30.0], rotY: 0.0 },
      3: { file: './models/custom_scenes/city_hannover_cleared.glb', scale: 1.16, pos: [0.5, -0.1, 6.5], rotY: 0.0 },
      4: { file: './models/custom_scenes/modern_war_cleared.glb', scale: 0.65, pos: [0.5, -1.9, 0.0], rotY: 0.0 },
      5: { file: './models/custom_scenes/space_nebula_cleared.glb', scale: 14.20, pos: [-27.0, -19.2, 0.0], rotY: 0.0 }
    };
    const cfg = configs[eraId];
    if (!cfg) return;

    this.gltfLoader.load(cfg.file, (gltf) => {
      const root = gltf.scene;
      root.scale.setScalar(cfg.scale);
      root.position.set(...cfg.pos);
      root.rotation.y = cfg.rotY;
      root.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.currentCustomBg = root;
      this.group.add(root);
    }, undefined, (err) => {
      console.warn('Custom background load error:', err);
    });
  }
}
