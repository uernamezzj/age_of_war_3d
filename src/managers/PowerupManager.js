/**
 * PowerupManager.js - 战场空投物资气泡道具系统
 * 1:1 映射开源项目 AgeOfWarRemake/Assets/Scripts/Managers/PowerupManager.cs
 */

export class PowerupManager {
  constructor(scene, gameManager) {
    this.scene = scene;
    this.gm = gameManager;

    this.spawnedPowerups = [];
    this.lastSpawnTime = 0;
    this.spawnInterval = 20.0; // 每隔 20 秒左右在战场空投一枚补给物资
    this.spawnRange = 18.0; // 战场中央投放范围 (-9.0 ~ +9.0)

    // 加速增益追踪 (30 秒)
    this.speedBuffActive = false;
    this.speedBuffEndTime = 0;

    // 纹理缓存
    const textureLoader = new THREE.TextureLoader();
    this.textures = {
      bubble: textureLoader.load('./AgeOfWarRemake/Assets/Resources/Sprites/PowerUps/bubble_get.png'),
      coin: textureLoader.load('./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_1_1.png'),
      exp: textureLoader.load('./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/evolve.png'),
      special: textureLoader.load('./AgeOfWarRemake/Assets/Resources/Sprites/PowerUps/satellite.png'),
      speed: textureLoader.load('./AgeOfWarRemake/Assets/Resources/Sprites/PowerUps/speed.png'),
      health: textureLoader.load('./AgeOfWarRemake/Assets/Resources/Sprites/PowerUps/health.png'),
      shadow: textureLoader.load('./AgeOfWarRemake/Assets/Resources/Sprites/PowerUps/bubble_shadow.png')
    };

    // 共享几何体与材质
    this.bubbleGeo = new THREE.SphereGeometry(0.48, 16, 16);
    this.bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0x67e8f9,
      transmission: 0.85,
      opacity: 0.85,
      transparent: true,
      roughness: 0.1,
      ior: 1.33,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5
    });

    this.shadowGeo = new THREE.PlaneGeometry(0.75, 0.75);
    this.shadowGeo.rotateX(-Math.PI / 2);
    this.shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
  }

  // 生成一个战场空投道具
  spawnPowerup(forceType = null, forceX = null) {
    if (this.gm.isGameOver || this.gm.isPaused) return;

    const types = ['coin', 'exp', 'special', 'speed', 'health'];
    const type = forceType || types[Math.floor(Math.random() * types.length)];
    const xPos = (forceX !== null) ? forceX : (Math.random() - 0.5) * this.spawnRange;

    // 根据当前时代计算道具数值
    const age = this.gm.currentAge || 1;
    const baseAlly = this.gm.baseAlly;
    let value = 0;

    switch (type) {
      case 'coin':
        value = Math.floor((100 * Math.pow(2.5, age - 1)) * (0.8 + Math.random() * 0.8));
        break;
      case 'exp':
        value = Math.floor((80 * Math.pow(2.2, age - 1)) * (0.8 + Math.random() * 0.6));
        break;
      case 'special':
        value = 1;
        break;
      case 'speed':
        value = 30; // 30 秒疾风狂暴
        break;
      case 'health':
        value = Math.floor((baseAlly?.maxHp || 500) * 0.15);
        break;
    }

    // 建立 3D 泡泡模型组
    const group = new THREE.Group();

    // 1. 发光通透外层水晶气泡
    const bubbleMesh = new THREE.Mesh(this.bubbleGeo, this.bubbleMat.clone());
    group.add(bubbleMesh);

    // 2. 内部核心 2D 标志 Sprite
    const spriteMat = new THREE.SpriteMaterial({
      map: this.textures[type] || this.textures.bubble,
      transparent: true,
      depthTest: true
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.62, 0.62, 0.62);
    group.add(sprite);

    // 3. 地面投影
    const shadowMesh = new THREE.Mesh(this.shadowGeo, this.shadowMat);
    shadowMesh.position.set(0, -0.92, 0);
    group.add(shadowMesh);

    // 初始位置：从天际缓缓降落至漂浮高度
    const targetY = 1.05;
    group.position.set(xPos, 8.5, 0);
    this.scene.add(group);

    const powerupItem = {
      type,
      value,
      group,
      bubbleMesh,
      sprite,
      shadowMesh,
      targetY,
      x: xPos,
      isLanded: false,
      fallSpeed: 4.8,
      bobPhase: Math.random() * Math.PI * 2,
      createdAt: performance.now() / 1000
    };

    this.spawnedPowerups.push(powerupItem);
    return powerupItem;
  }

  // 收集道具
  collect(powerup, isPlayer = true) {
    const idx = this.spawnedPowerups.indexOf(powerup);
    if (idx === -1) return;

    this.spawnedPowerups.splice(idx, 1);
    this.scene.remove(powerup.group);

    // 播放收集音效
    if (this.gm.sound) {
      this.gm.sound.playPowerup(powerup.type);
    }

    const baseAlly = this.gm.baseAlly;
    const baseEnemy = this.gm.baseEnemy;
    const targetBase = isPlayer ? baseAlly : baseEnemy;
    const px = powerup.group.position.x;
    const py = powerup.group.position.y + 0.6;

    switch (powerup.type) {
      case 'coin':
        if (targetBase) targetBase.money += powerup.value;
        if (this.gm.onFloatingText) {
          this.gm.onFloatingText(px, py, `+$${powerup.value}`, '#fbbf24');
        }
        break;

      case 'exp':
        if (targetBase) targetBase.exp += powerup.value;
        if (this.gm.onFloatingText) {
          this.gm.onFloatingText(px, py, `+${powerup.value} EXP`, '#38bdf8');
        }
        break;

      case 'special':
        if (isPlayer && this.gm.specialAttackManager) {
          this.gm.specialAttackManager.lastUseTime = -999;
          const ui = this.gm.uiManager || (typeof window !== 'undefined' ? window.uiManager : null);
          if (ui) {
            ui.highlightSpecialPowerup(true);
          }
        }
        if (this.gm.onFloatingText) {
          this.gm.onFloatingText(px, py, '⚡ SPECIAL READY!', '#f59e0b');
        }
        break;

      case 'speed':
        this.activateSpeedBuff(30);
        if (this.gm.onFloatingText) {
          this.gm.onFloatingText(px, py, '🏃 SPEED BOOST 30s!', '#06b6d4');
        }
        break;

      case 'health':
        if (targetBase) {
          targetBase.hp = Math.min(targetBase.maxHp, targetBase.hp + powerup.value);
        }
        // 治疗场上所有友方士兵 50%
        const army = isPlayer ? this.gm.unitsAlly : this.gm.unitsEnemy;
        if (army) {
          for (const u of army) {
            if (!u.isDead) {
              const heal = Math.floor(u.maxHp * 0.5);
              u.hp = Math.min(u.maxHp, u.hp + heal);
            }
          }
        }
        if (this.gm.onFloatingText) {
          this.gm.onFloatingText(px, py, `💚 HEAL +${powerup.value} HP!`, '#22c55e');
        }
        break;
    }

    const ui = this.gm.uiManager || (typeof window !== 'undefined' ? window.uiManager : null);
    if (ui) {
      ui.updateStats();
    }
  }

  // 开启 30 秒全军狂暴增益
  activateSpeedBuff(durationSec = 30) {
    this.speedBuffActive = true;
    const nowSec = performance.now() / 1000;
    this.speedBuffEndTime = nowSec + durationSec;

    const ui = this.gm.uiManager || (typeof window !== 'undefined' ? window.uiManager : null);
    if (ui) {
      ui.setSpeedPowerup(true);
    }
  }

  // 逐帧更新调度
  update(dt) {
    if (this.gm.isGameOver || this.gm.isPaused) return;

    const nowSec = performance.now() / 1000;

    // 1. 周期性降落空投
    if (nowSec - this.lastSpawnTime >= this.spawnInterval) {
      this.lastSpawnTime = nowSec;
      // 场上气泡上限最多保留 3 个，避免堆积
      if (this.spawnedPowerups.length < 3) {
        this.spawnPowerup();
      }
    }

    // 2. 推进急速狂暴状态机
    if (this.speedBuffActive && nowSec >= this.speedBuffEndTime) {
      this.speedBuffActive = false;
      const ui = this.gm.uiManager || (typeof window !== 'undefined' ? window.uiManager : null);
      if (ui) {
        ui.setSpeedPowerup(false);
      }
    }

    // 3. 道具下坠与悬浮呼吸动画
    for (let i = this.spawnedPowerups.length - 1; i >= 0; i--) {
      const p = this.spawnedPowerups[i];
      p.bobPhase += dt * 3.0;

      if (!p.isLanded) {
        p.group.position.y -= p.fallSpeed * dt;
        if (p.group.position.y <= p.targetY) {
          p.group.position.y = p.targetY;
          p.isLanded = true;
        }
      } else {
        // 轻柔上下漂浮呼吸律动
        p.group.position.y = p.targetY + Math.sin(p.bobPhase) * 0.12;
        p.bubbleMesh.rotation.y += dt * 0.8;
      }

      // 4. 与士兵碰撞拾取检测
      const currentX = p.group.position.x;

      // 我方士兵经过
      if (this.gm.unitsAlly) {
        for (const u of this.gm.unitsAlly) {
          if (!u.isDead && Math.abs(u.position.x - currentX) <= 0.85) {
            this.collect(p, true);
            break;
          }
        }
      }

      // 敌方士兵经过亦可被敌方抢夺
      if (this.spawnedPowerups.includes(p) && this.gm.unitsEnemy) {
        for (const e of this.gm.unitsEnemy) {
          if (!e.isDead && Math.abs(e.position.x - currentX) <= 0.85) {
            this.collect(p, false);
            break;
          }
        }
      }
    }
  }

  // 点击拾取（鼠标射线检测）
  handleClickRaycast(raycaster) {
    if (this.spawnedPowerups.length === 0) return false;

    const meshes = this.spawnedPowerups.map(p => p.bubbleMesh);
    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const powerup = this.spawnedPowerups.find(p => p.bubbleMesh === hitMesh);
      if (powerup) {
        this.collect(powerup, true);
        return true;
      }
    }
    return false;
  }

  // 重置清空
  clear() {
    for (const p of this.spawnedPowerups) {
      this.scene.remove(p.group);
    }
    this.spawnedPowerups = [];
    this.speedBuffActive = false;
    this.speedBuffEndTime = 0;
  }
}
