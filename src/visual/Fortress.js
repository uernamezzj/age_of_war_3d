/**
 * Fortress.js - 基于开源 Kenney 资产拼装的文明要塞与防御炮塔插槽系统
 */
export class Fortress {
  constructor(scene, team = 'player', posX = -75) {
    this.scene = scene;
    this.team = team; // 'player' | 'enemy'
    this.posX = posX;
    this.maxHealth = 1200;
    this.currentHealth = 1200;

    this.gltfLoader = new THREE.GLTFLoader();
    this.group = new THREE.Group();
    this.group.position.set(posX, 0, 0);

    // 敌方基地朝向左边，我方朝向右边
    if (this.team === 'enemy') {
      this.group.rotation.y = -Math.PI / 2;
    } else {
      this.group.rotation.y = Math.PI / 2;
    }
    this.scene.add(this.group);

    // 炮塔插槽列表
    this.turretSockets = [];

    this.initStructure();
    this.initHealthHUD();
  }

  initStructure() {
    const castleDir = './assets/models/kenney_castle/';
    const scale = 3.2;

    // 1. 中央出兵主城门 (gate.glb)
    this.gltfLoader.load(castleDir + 'gate.glb', (gltf) => {
      const gate = gltf.scene;
      gate.scale.set(scale, scale, scale);
      gate.position.set(0, 0, 0);
      gate.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });
      this.group.add(gate);

      // 城楼中央炮塔插槽
      this.addTurretSocket(0, 5.8, 0, 'center');
    });

    // 2. 护城吊桥 (bridge-draw.glb)
    this.gltfLoader.load(castleDir + 'bridge-draw.glb', (gltf) => {
      const bridge = gltf.scene;
      bridge.scale.set(scale * 0.9, scale, scale * 1.1);
      bridge.position.set(0, 0.05, 4.2);
      bridge.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });
      this.group.add(bridge);
    });

    // 3. 左右两侧坚固城墙 (wall.glb)
    this.gltfLoader.load(castleDir + 'wall.glb', (gltf) => {
      const wallL = gltf.scene.clone();
      wallL.scale.set(scale, scale, scale);
      wallL.position.set(-6.8, 0, -0.5);
      wallL.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      this.group.add(wallL);

      const wallR = gltf.scene.clone();
      wallR.scale.set(scale, scale, scale);
      wallR.position.set(6.8, 0, -0.5);
      wallR.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      this.group.add(wallR);
    });

    // 4. 两翼卫城方塔 (tower-square.glb)
    this.gltfLoader.load(castleDir + 'tower-square.glb', (gltf) => {
      const towerL = gltf.scene.clone();
      towerL.scale.set(scale * 1.05, scale * 1.25, scale * 1.05);
      towerL.position.set(-4.2, 0, 0);
      towerL.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      this.group.add(towerL);

      const towerR = gltf.scene.clone();
      towerR.scale.set(scale * 1.05, scale * 1.25, scale * 1.05);
      towerR.position.set(4.2, 0, 0);
      towerR.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      this.group.add(towerR);

      // 左塔顶炮台插槽与右塔顶炮台插槽
      this.addTurretSocket(-4.2, 7.2, 0, 'left_flank');
      this.addTurretSocket(4.2, 7.2, 0, 'right_flank');
    });

    // 5. 飘扬要塞阵营战旗 (flag.glb) - 置于两翼塔顶
    this.gltfLoader.load(castleDir + 'flag.glb', (gltf) => {
      const bannerColor = (this.team === 'player') ? 0x0284c7 : 0xdc2626;
      [-4.2, 4.2].forEach(posX => {
        const flag = gltf.scene.clone();
        flag.scale.set(scale * 1.2, scale * 1.2, scale * 1.2);
        flag.position.set(posX, 8.5, 0);
        flag.traverse(c => {
          if (c.isMesh) {
            c.castShadow = true;
            c.material = new THREE.MeshStandardMaterial({
              color: bannerColor,
              roughness: 0.5
            });
          }
        });
        this.group.add(flag);
      });
    });
  }

  /**
   * 注册要塞防御塔挂载插槽并安装开源防御火炮
   */
  addTurretSocket(x, y, z, name) {
    const socketMount = new THREE.Group();
    socketMount.position.set(x, y, z);
    this.group.add(socketMount);

    // 加载开源重型加农炮 (weapon-cannon.glb) 或床弩
    const modelName = (name === 'center') ? 'weapon-cannon.glb' : 'weapon-ballista.glb';
    this.gltfLoader.load('./assets/models/kenney_turrets/' + modelName, (gltf) => {
      const turretModel = gltf.scene;
      turretModel.scale.set(2.2, 2.2, 2.2);
      turretModel.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });
      socketMount.add(turretModel);
      this.turretSockets.push({
        name,
        mount: socketMount,
        model: turretModel
      });
    });
  }

  /**
   * 基地 3D 浮动血条面板
   */
  initHealthHUD() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    this.hudCanvas = canvas;
    this.hudCtx = canvas.getContext('2d');

    this.hudTexture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: this.hudTexture,
      transparent: true
    });
    this.hudSprite = new THREE.Sprite(spriteMat);
    this.hudSprite.position.set(0, 18.0, 0);
    this.hudSprite.scale.set(13, 3.2, 1);
    this.group.add(this.hudSprite);

    this.updateHealthHUD();
  }

  updateHealthHUD() {
    const ctx = this.hudCtx;
    const w = 512;
    const h = 128;
    ctx.clearRect(0, 0, w, h);

    // 背景底板
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(16, 16, w - 32, h - 32, 16);
    ctx.fill();
    ctx.strokeStyle = (this.team === 'player') ? '#38bdf8' : '#ef4444';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 标题文本
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    const label = (this.team === 'player') ? '我方文明要塞' : '敌方文明要塞';
    ctx.fillText(`${label} [${this.currentHealth} / ${this.maxHealth}]`, w / 2, 54);

    // 进度条槽
    const barX = 36;
    const barY = 68;
    const barW = w - 72;
    const barH = 22;

    ctx.fillStyle = '#334155';
    ctx.fillRect(barX, barY, barW, barH);

    // 实时生命值
    const ratio = Math.max(0, this.currentHealth / this.maxHealth);
    ctx.fillStyle = (this.team === 'player') ? '#0284c7' : '#dc2626';
    ctx.fillRect(barX, barY, barW * ratio, barH);

    this.hudTexture.needsUpdate = true;
  }

  /**
   * 让城头防御塔实时转动瞄准目标
   */
  aimTurretsAt(targetWorldPos) {
    this.turretSockets.forEach(socket => {
      if (socket.model) {
        socket.model.rotation.y += 0.01; // 待机缓慢巡视
      }
    });
  }
}
