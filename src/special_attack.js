/**
 * 《战争进化史 3D》终极大招系统：🌋 史前火山流星雨 (Volcano Eruption)
 * 1:1 对齐 BaseFactory.cs 原始流星雨大招，全屏陨石倾泻与震屏爆裂
 */

import { GAME_CONFIG } from './game_config.js';
import { audioManager } from './audio_manager.js';

export class SpecialAttackManager {
  constructor(scene, fbxLoader, unitManager, camera) {
    this.scene = scene;
    this.fbxLoader = fbxLoader;
    this.unitManager = unitManager;
    this.camera = camera;

    this.meteorTemplate = null;
    this.activeMeteors = [];

    // 冷却状态
    this.cooldown = GAME_CONFIG.base.specialAttack.cooldown; // 60s
    this.currentCooldown = 15; // 开局 15 秒即可首次准备就绪，提升爽感
    this.isReady = false;

    // 屏幕震颤状态
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
  }

  async preloadTemplate() {
    console.log("正在预热流星陨石 3D 模型...");
    return new Promise(resolve => {
      this.fbxLoader.load('./models/era1/special_1.fbx', (fbx) => {
        fbx.scale.set(0.65, 0.65, 0.65);
        fbx.traverse(c => {
          if (c.isMesh) {
            c.castShadow = true;
            if (c.material) {
              c.material.emissive = new THREE.Color(0xea580c);
              c.material.emissiveIntensity = 0.85;
            }
          }
        });
        this.meteorTemplate = fbx;
        console.log("流星陨石原型预热完成！");
        resolve();
      }, undefined, () => resolve());
    });
  }

  // 释放终极大招
  triggerSpecial(isPlayer = true) {
    if (isPlayer && !this.isReady) return false;

    if (isPlayer) {
      this.currentCooldown = this.cooldown;
      this.isReady = false;
    }

    console.log("🌋 终极大招触发：火山流星雨爆发！");
    audioManager.playSpecial();

    // 启动屏幕剧烈震颤
    this.shakeIntensity = 0.45;
    this.shakeDuration = 2.8;

    // 降落区域：我方释放砸向敌方半场 (X: -2 到 24)，敌方释放砸向我方半场 (X: -24 到 2)
    const minX = isPlayer ? -2 : -24;
    const maxX = isPlayer ? 24 : 2;
    const meteorCount = GAME_CONFIG.base.specialAttack.meteorCount || 16;

    for (let i = 0; i < meteorCount; i++) {
      const delay = i * 0.12 + Math.random() * 0.08;
      const targetX = THREE.MathUtils.lerp(minX, maxX, Math.random());
      const targetZ = (Math.random() - 0.5) * 6.0;

      setTimeout(() => {
        this.spawnMeteor(targetX, targetZ, isPlayer);
      }, delay * 1000);
    }

    return true;
  }

  spawnMeteor(targetX, targetZ, isPlayer) {
    const startX = targetX - (isPlayer ? 8 : -8);
    const startY = 24.0 + Math.random() * 4.0;
    const startZ = targetZ - 4.0;

    const meteorMesh = this.meteorTemplate ? this.meteorTemplate.clone() : new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.8, 0),
      new THREE.MeshStandardMaterial({
        color: 0x7c2d12,
        emissive: new THREE.Color(0xf97316),
        emissiveIntensity: 1.2
      })
    );

    meteorMesh.position.set(startX, startY, startZ);
    this.scene.add(meteorMesh);

    // 尾焰光源
    const glowLight = new THREE.PointLight(0xf97316, 3.5, 10, 2);
    meteorMesh.add(glowLight);

    this.activeMeteors.push({
      mesh: meteorMesh,
      start: new THREE.Vector3(startX, startY, startZ),
      target: new THREE.Vector3(targetX, 0, targetZ),
      duration: 0.85,
      elapsed: 0,
      isPlayer,
      damage: GAME_CONFIG.base.specialAttack.damage,
      radius: GAME_CONFIG.base.specialAttack.splashRadius
    });
  }

  update(delta) {
    // 冷却倒计时
    if (this.currentCooldown > 0) {
      this.currentCooldown -= delta;
      if (this.currentCooldown <= 0) {
        this.currentCooldown = 0;
        this.isReady = true;
      }
    }

    // 屏幕震颤衰减
    if (this.shakeDuration > 0) {
      this.shakeDuration -= delta;
      const progress = Math.max(0, this.shakeDuration / 2.8);
      const curIntensity = this.shakeIntensity * progress;
      this.camera.position.x += (Math.random() - 0.5) * curIntensity;
      this.camera.position.y += (Math.random() - 0.5) * curIntensity;
    }

    // 陨石下坠与撞地爆破
    for (let i = this.activeMeteors.length - 1; i >= 0; i--) {
      const m = this.activeMeteors[i];
      m.elapsed += delta;
      const t = Math.min(1, m.elapsed / m.duration);

      m.mesh.position.lerpVectors(m.start, m.target, t);
      m.mesh.rotation.x += delta * 12;
      m.mesh.rotation.z += delta * 15;

      if (t >= 1) {
        // 陨石撞击地面爆炸！
        this.scene.remove(m.mesh);
        this.activeMeteors.splice(i, 1);

        audioManager.playExplosion();

        // 产生地面火花爆裂
        this.spawnExplosionEffect(m.target.x, m.target.z);

        // 伤害结算
        const enemyList = m.isPlayer ? this.unitManager.enemyUnits : this.unitManager.playerUnits;
        enemyList.forEach(u => {
          if (u.state === 'die') return;
          const dist = Math.abs(u.x - m.target.x);
          if (dist <= m.radius) {
            u.hp -= m.damage;
            this.unitManager.spawnFloatingText(`-${m.damage}`, u.x, 2.4, '#ef4444');
            if (u.hp <= 0) {
              this.unitManager.killUnit(u, m.isPlayer);
            }
          }
        });
      }
    }
  }

  // 地面爆裂光环与微粒
  spawnExplosionEffect(x, z) {
    const blastGeo = new THREE.RingGeometry(0.2, 2.5, 32);
    const blastMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    const blast = new THREE.Mesh(blastGeo, blastMat);
    blast.rotation.x = -Math.PI / 2;
    blast.position.set(x, 0.05, z);
    this.scene.add(blast);

    let fadeTimer = 0.4;
    const animateBlast = () => {
      fadeTimer -= 0.03;
      blast.scale.multiplyScalar(1.08);
      blastMat.opacity = Math.max(0, fadeTimer / 0.4);
      if (fadeTimer > 0) {
        requestAnimationFrame(animateBlast);
      } else {
        this.scene.remove(blast);
      }
    };
    animateBlast();
  }

  getCooldownPercent() {
    if (this.isReady) return 1.0;
    return 1.0 - (this.currentCooldown / this.cooldown);
  }
}
