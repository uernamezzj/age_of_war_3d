/**
 * GameManager.js - 核心游戏对战总调度器 (1:1 映射 AgeOfWarRemake/Assets/Scripts/Managers/GameManager.cs)
 * 维护全场对阵生命周期、双阵营 FIFO 队列、防穿模交战碰撞、经济与胜负裁定
 */

import { Unit } from '../entities/Unit.js';
import { Base } from '../entities/Base.js';
import { Turret } from '../entities/Turret.js';
import { BaseFactory } from '../model/BaseFactory.js';
import { TurretFactory } from '../model/TurretFactory.js';
import { ProjectileManager } from './ProjectileManager.js';
import { SpecialAttackManager } from './SpecialAttackManager.js';
import { UnitLoadingManager } from './UnitLoadingManager.js';
// PowerupManager removed
import { BotAI } from '../ai/BotAI.js';

export class GameManager {
  constructor(scene, soundManager) {
    this.scene = scene;
    this.sound = soundManager;

    // 活跃单位 FIFO 阵列 (索引 0 为最前沿先锋)
    this.unitsAlly = [];
    this.unitsEnemy = [];

    // 双基地
    this.baseAlly = null;
    this.baseEnemy = null;

    // 投射物、时代大招与空投物资道具管理器
    this.projectileManager = new ProjectileManager(scene, (p) => this.onProjectileHit(p));
    this.specialAttackManager = new SpecialAttackManager(scene, this);
    this.powerupManager = null;

    // 5 格排队训练出兵系统
    this.loadingManager = new UnitLoadingManager(5, (unitConfig) => {
      this.spawnUnit(unitConfig, true);
    });

    // 敌方单机 AI
    this.botAI = new BotAI(this);

    // 游戏状态
    this.isGameOver = false;
    this.winner = null; // 'player' | 'enemy'
    this.gameTime = 0;
    this.isPaused = false;
    this.currentAge = 1;

    // 预热好的 3D 模型资产与动画剪辑引用
    this.templates = {};
    this.clipLibraries = {};

    // UI 更新事件监听
    this.onStateChanged = null;
    this.onFloatingText = null;
    this.onAgeEvolved = null;
    this.ageListeners = [];

    // 被动收入定时器 (每秒 +$2)
    this.lastIncomeTime = 0;
  }

  addAgeListener(fn) {
    if (typeof fn === 'function') {
      this.ageListeners.push(fn);
    }
  }

  notifyAgeChanged(newAge) {
    if (this.onAgeEvolved) {
      this.onAgeEvolved(newAge);
    }
    this.ageListeners.forEach(fn => {
      try { fn(newAge); } catch (e) { console.error("Error in ageListener:", e); }
    });
  }

  setAssets(templates, clipLibraries) {
    this.templates = templates;
    this.clipLibraries = clipLibraries;
  }

  // 初始化对局
  initGame() {
    this.isGameOver = false;
    this.winner = null;
    this.gameTime = 0;
    this.currentAge = 1;

    // 创建基地
    const caveConf = BaseFactory.Cave();
    this.baseAlly = new Base(caveConf, true, this.scene);
    this.baseEnemy = new Base(caveConf, false, this.scene);

    if (this.templates['base_1']) {
      this.baseAlly.initMesh(this.templates['base_1']);
      this.baseEnemy.initMesh(this.templates['base_1']);
    }

    // 双方初始免费获赠 1 门投石索炮塔挂载在主槽位 0
    if (this.templates['turret_1_1']) {
      const rockConfig = TurretFactory.Rock();
      this.buildTurret(0, rockConfig, true);
      this.buildTurret(0, rockConfig, false);
    }
  }

  // 彻底从零重置游戏 (RESET 按钮核心回调)
  resetGame() {
    console.log("🔄 执行游戏全面从零重置...");

    // 1. 清空双方所有战场单位
    for (const unit of this.unitsAlly) {
      unit.destroy();
    }
    this.unitsAlly = [];

    for (const unit of this.unitsEnemy) {
      unit.destroy();
    }
    this.unitsEnemy = [];

    // 2. 清空投射物、时代大招与空投道具
    if (this.projectileManager) {
      this.projectileManager.clear();
    }
    if (this.specialAttackManager) {
      this.specialAttackManager.clear();
    }
// powerupManager cleared

    // 3. 清空造兵排队队列
    if (this.loadingManager) {
      this.loadingManager.clear();
    }

    // 4. 销毁并移除旧基地与旧炮塔
    if (this.baseAlly) {
      for (let i = 0; i < this.baseAlly.turretSlots.length; i++) {
        if (this.baseAlly.turretSlots[i]) {
          this.baseAlly.turretSlots[i].destroy();
          this.baseAlly.turretSlots[i] = null;
        }
      }
      if (this.baseAlly.mesh) {
        this.scene.remove(this.baseAlly.mesh);
        this.baseAlly.mesh = null;
      }
    }

    if (this.baseEnemy) {
      for (let i = 0; i < this.baseEnemy.turretSlots.length; i++) {
        if (this.baseEnemy.turretSlots[i]) {
          this.baseEnemy.turretSlots[i].destroy();
          this.baseEnemy.turretSlots[i] = null;
        }
      }
      if (this.baseEnemy.mesh) {
        this.scene.remove(this.baseEnemy.mesh);
        this.baseEnemy.mesh = null;
      }
    }

    // 5. 重新以第一时代初始化基地
    this.initGame();

    // 6. 恢复相机机位对准玩家洞穴
    if (window.battleCameraController) {
      window.battleCameraController.currentX = -13;
      window.battleCameraController.updatePosition();
    }

    // 7. 触发 UI 与环境背景重建刷新
    this.notifyAgeChanged(1);
    if (this.onStateChanged) {
      this.onStateChanged();
    }

    if (this.onFloatingText) {
      this.onFloatingText(this.baseAlly.position.x, 5.0, "GAME RESET TO AGE 1!", "#38bdf8");
    }
  }

  // 时代进化 (1:1 映射 Base.cs EvolveServerRpc)
  evolve(isPlayer = true) {
    const base = isPlayer ? this.baseAlly : this.baseEnemy;
    if (!base) return false;

    const currentAge = base.age;
    if (currentAge >= 5) return false;

    const nextAge = currentAge + 1;
    const newConfig = BaseFactory.Bases[nextAge - 1]();

    // 检查经验值是否达标
    if (base.exp < base.config.evolveExpRequired) {
      return false;
    }

    // 获取下一时代基地的 3D 模板
    const nextBaseTemplate = this.templates[`base_${nextAge}`] || this.templates['base_1'];
    base.evolveTo(newConfig, nextBaseTemplate);

    if (isPlayer) {
      this.currentAge = nextAge;
      // 触发 UI 界面与环境背景协同更新
      this.notifyAgeChanged(nextAge);
      if (this.sound) {
        this.sound.play('special');
      }
      if (this.onFloatingText) {
        this.onFloatingText(base.position.x, 6.0, `晋升至时代 ${nextAge}！`, '#fbbf24');
      }
      console.log(`🏰 玩家成功进化至时代 ${nextAge} (${newConfig.name})！`);
    } else {
      if (this.onFloatingText) {
        this.onFloatingText(base.position.x, 6.0, `敌方晋升至时代 ${nextAge}！`, '#ef4444');
      }
      console.log(`🤖 敌方成功进化至时代 ${nextAge} (${newConfig.name})！`);
    }

    return true;
  }

  // 时代直接跳转 (供调试与测试直达 1~5 时代)
  setAgeDirect(targetAge) {
    if (targetAge < 1 || targetAge > 5) return;
    this.currentAge = targetAge;
    const newConfig = BaseFactory.Bases[targetAge - 1]();
    const nextBaseTemplate = this.templates[`base_${targetAge}`] || this.templates['base_1'];

    if (this.baseAlly) {
      this.baseAlly.age = targetAge;
      this.baseAlly.evolveTo(newConfig, nextBaseTemplate);
    }
    if (this.baseEnemy) {
      this.baseEnemy.age = targetAge;
      this.baseEnemy.evolveTo(newConfig, nextBaseTemplate);
    }

    this.notifyAgeChanged(targetAge);

    if (this.onStateChanged) {
      this.onStateChanged();
    }
    if (this.onFloatingText && this.baseAlly) {
      this.onFloatingText(this.baseAlly.position.x, 6.0, `AGE ${targetAge}: ${newConfig.name}`, '#fbbf24');
    }
    console.log(`🚀 [GameManager] 时代直接跳转至时代 ${targetAge} (${newConfig.name})`);
  }

  // 生产造兵 (实例化 Unit 实体并置入队尾)
  spawnUnit(unitConfig, isPlayer = true) {
    if (this.isGameOver) return null;

    const list = isPlayer ? this.unitsAlly : this.unitsEnemy;
    if (list.length >= 18) return null; // 单方最大上限 18 人 (防拥堵)

    let clipLib = this.clipLibraries[unitConfig.id];
    if (!clipLib && (unitConfig.id === 'trooper_4' || unitConfig.id === 'super_soldier')) {
      clipLib = this.clipLibraries['trooper_4'] || this.clipLibraries['trooper_2'];
    }
    clipLib = clipLib || {};

    const unit = new Unit(unitConfig, isPlayer, this.scene, clipLib, this.clipLibraries);

    // 获取 3D 模板克隆 (trooper_4 优先使用专用白模 trooper_4，未就绪时使用 trooper_2 并在 initMesh 中动态转白模蓝光)
    let templateMesh = this.templates[unitConfig.id];
    if (!templateMesh && (unitConfig.id === 'trooper_4' || unitConfig.id === 'super_soldier')) {
      templateMesh = this.templates['trooper_4'] || this.templates['super_soldier'] || this.templates['trooper_2'];
    }
    templateMesh = templateMesh || this.templates['caveman_1'];

    if (templateMesh) {
      unit.initMesh(templateMesh);
    }

    // 初始出生点：从各自要塞洞口踏出
    const spawnX = isPlayer ? -18.5 : 18.5;
    const spawnZ = (Math.random() - 0.5) * 0.8; // Z 轴微抖动让行军自然
    unit.setPosition(spawnX, 0, spawnZ);

    // 加入军团列表尾部 (FIFO 顺序)
    unit.onHitCallback = (attacker, victim) => this.onMeleeHitFrame(attacker, victim, isPlayer);
    unit.onShootReleaseCallback = (shooter, shot) => this.onShootRelease(shooter, shot);
    list.push(unit);

    if (this.sound) {
      this.sound.play('spawn');
    }

    return unit;
  }

  // 建造防御塔 (支持全时代独立 GLB 模板精准挂载与动态加载)
  buildTurret(slotIdx, turretConfig, isPlayer = true) {
    const base = isPlayer ? this.baseAlly : this.baseEnemy;
    const turret = new Turret(turretConfig, this.scene, this.projectileManager, this.sound);

    const templateMesh = this.templates[turretConfig.id];
    if (templateMesh) {
      turret.initMesh(templateMesh);
      base.installTurret(slotIdx, turret);
    } else if (this.gltfLoader && turretConfig.modelUrl) {
      // 异步动态加载该炮塔的专属独立模型并注入模板缓存
      this.gltfLoader.load(turretConfig.modelUrl, (gltf) => {
        this.templates[turretConfig.id] = gltf.scene;
        turret.initMesh(gltf.scene);
        base.installTurret(slotIdx, turret);
      }, undefined, (err) => {
        console.warn(`防御塔模型 ${turretConfig.modelUrl} 加载失败:`, err);
      });
      base.installTurret(slotIdx, turret);
    } else {
      base.installTurret(slotIdx, turret);
    }
    return turret;
  }

  // 出售防御塔 (中枢代理)
  sellTurret(slotIdx, isPlayer = true) {
    const base = isPlayer ? this.baseAlly : this.baseEnemy;
    if (!base) return 0;
    return base.sellTurret(slotIdx);
  }

  // 购买并生产单位 (带金币与队列防守)
  buyUnit(unitConfig, isPlayer = true) {
    if (this.isGameOver) return false;
    const base = isPlayer ? this.baseAlly : this.baseEnemy;
    if (!base) return false;
    if (base.money < (unitConfig.cost || 0)) return false;

    if (isPlayer) {
      const enqueued = this.loadingManager.enqueue(unitConfig);
      if (enqueued) {
        if (this.sound) this.sound.play('click');
        return true;
      }
      return false;
    } else {
      return !!this.spawnUnit(unitConfig, false);
    }
  }

  // 核心逐帧物理与交战状态机 (1:1 对齐 Unit.cs CheckCollision)
  update(dt) {
    if (this.isGameOver || this.isPaused) return;

    this.gameTime += dt;
    const nowSec = performance.now() / 1000;

    // 1. 被动金币收入 (每秒 +$2)
    if (nowSec - this.lastIncomeTime >= 1.0) {
      this.lastIncomeTime = nowSec;
      if (this.baseAlly) this.baseAlly.money += (this.baseAlly.config.passiveIncomePerSec || 2);
      if (this.baseEnemy) this.baseEnemy.money += 2;
    }

    // 2. 推进训练建造队列
    this.loadingManager.update(dt);

    // 3. 推进敌方电脑 AI
    this.botAI.update(dt, nowSec);

    // 4. 双阵营单位状态机与碰撞排队检测 (防穿模精髓)
    this.checkCollisionsForArmy(this.unitsAlly, this.unitsEnemy, this.baseEnemy, true, dt, nowSec);
    this.checkCollisionsForArmy(this.unitsEnemy, this.unitsAlly, this.baseAlly, false, dt, nowSec);

    // 5. 更新所有单位动作与位移
    this.updateArmy(this.unitsAlly, dt, nowSec);
    this.updateArmy(this.unitsEnemy, dt, nowSec);

    // 6. 清理阵亡单位
    this.cleanupDeadUnits(this.unitsAlly);
    this.cleanupDeadUnits(this.unitsEnemy);

    // 7. 更新基地与防御塔索敌 (支持锁定敌方老巢)
    if (this.baseAlly) {
      for (const t of this.baseAlly.turretSlots) {
        if (t) t.update(dt, nowSec, this.unitsEnemy, this.baseEnemy);
      }
    }
    if (this.baseEnemy) {
      for (const t of this.baseEnemy.turretSlots) {
        if (t) t.update(dt, nowSec, this.unitsAlly, this.baseAlly);
      }
    }

    // 8. 推进投射物、大招与空投道具
    this.projectileManager.update(dt);
    this.specialAttackManager.update(dt);
// powerupManager updated

    // 9. 胜负裁定
    if (this.baseEnemy && this.baseEnemy.hp <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      this.winner = 'player';
      if (this.sound) this.sound.play('victory');
    } else if (this.baseAlly && this.baseAlly.hp <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      this.winner = 'enemy';
      if (this.sound) this.sound.play('defeat');
    }

    // 10. 触发 UI 刷新
    if (this.onStateChanged) {
      this.onStateChanged();
    }
  }

  /**
   * 严格对照 Unit.cs CheckCollision():
   * 1. 优先检测前方友军 inFrontAlly: 距离过近立即停步待命 (IdleState) -> 彻底消灭模型堆叠穿模！
   * 2. 其次检测前方敌军先锋 inFrontEnemy: 挥砍范围内进入 AttackState！
   * 3. 再次检测敌军基地: 逼近基地进入 AttackState 持续砸击基地！
   * 4. 否则保持大踏步行军 (WalkState)！
   * 5. 远程射手 (maxShootingDistance > 0): 只要敌军在射程内，待机或行进中均可开弓射击！
   */
  checkCollisionsForArmy(allies, enemies, enemyBase, isPlayerArmy, dt, nowSec) {
    // 1. 寻找敌军阵营中最靠前、且存活的先锋单位 (防死后阻挡或穿透)
    const livingEnemies = enemies.filter(e => !e.isDead);
    let inFrontEnemy = null;
    if (livingEnemies.length > 0) {
      inFrontEnemy = isPlayerArmy
        ? livingEnemies.reduce((min, e) => e.position.x < min.position.x ? e : min, livingEnemies[0])
        : livingEnemies.reduce((max, e) => e.position.x > max.position.x ? e : max, livingEnemies[0]);
    }

    for (let i = 0; i < allies.length; i++) {
      const unit = allies[i];
      if (unit.isDead) continue;

      // 2. 寻找自己前方最近的存活友军 (跳过已阵亡正在倒地的单位，防止阵线穿模或停滞)
      let inFrontAlly = null;
      for (let j = i - 1; j >= 0; j--) {
        if (!allies[j].isDead) {
          inFrontAlly = allies[j];
          break;
        }
      }

      // 3. 等待前方友军 (Waiting for ally)
      const isBlockedByAlly = inFrontAlly &&
        Math.abs(inFrontAlly.position.x - unit.position.x) < (unit.colliderWidth * 0.5 + inFrontAlly.colliderWidth * 0.5 + 0.35);

      if (isBlockedByAlly) {
        unit.changeState('idle');
      }
      // 4. 劈砍敌军先锋 (Attacking the enemy)
      else if (inFrontEnemy &&
        Math.abs(inFrontEnemy.position.x - unit.position.x) < (unit.colliderWidth * 0.5 + inFrontEnemy.colliderWidth * 0.5 + 0.45)) {
        
        unit.changeState('attack', inFrontEnemy);
      }
      // 5. 劈砍敌方要塞 (Attacking the enemy base)
      else if (enemyBase && !enemyBase.isDead &&
        Math.abs(enemyBase.position.x - unit.position.x) < (unit.colliderWidth * 0.5 + 2.2)) {
        
        unit.changeState('attack', enemyBase);
      }
      // 6. 行军推进 (Walking)
      else {
        unit.changeState('walk');
      }

      // 7. 远程单位常驻射程判定 (在射程内放冷箭/射弹石，若处于面对面肉搏交战状态则禁用射击，专注挥砍)
      if (unit.maxShootingDistance > 0 && !unit.isDead && !unit.isShooting && unit.state !== 'attack') {
        let shootTarget = null;
        if (inFrontEnemy && Math.abs(inFrontEnemy.position.x - unit.position.x) < unit.maxShootingDistance) {
          shootTarget = inFrontEnemy;
        } else if (enemyBase && !enemyBase.isDead && Math.abs(enemyBase.position.x - unit.position.x) < unit.maxShootingDistance) {
          shootTarget = enemyBase;
        }

        if (shootTarget && (nowSec - unit.lastShootTime >= 1.0 / unit.shootRate)) {
          unit.lastShootTime = nowSec;
          unit.startShootCycle(shootTarget, isPlayerArmy);
        }
      }
    }
  }

  // 远程弹弓/弓箭射出瞬间精准回调：仅在拉满弓弦松手瞬间才飞出投射物与发声音效！
  onShootRelease(shooter, shot) {
    if (!shooter || shooter.isDead) return;
    if (!shot.target || shot.target.isDead) return;

    const muzzlePos = shooter.position.clone().add(new THREE.Vector3(shot.isPlayerArmy ? 0.6 : -0.6, 1.2, 0));
    this.projectileManager.spawnUnitProjectile(
      muzzlePos,
      shot.target,
      shooter.shootDamage,
      shooter.config.bulletSpeed || 16.0,
      shot.isPlayerArmy,
      shooter.config
    );
    if (this.sound) this.sound.play('shoot');
  }

  // 近战打击命中帧回调：仅在武器真正挥出劈中时触发扣血与音效！
  onMeleeHitFrame(attacker, victim, isPlayerAttacker) {
    if (!victim || victim.isDead) return;

    // 1. 目标是敌方基地要塞
    if (victim.takeDamage && victim.unlockedExpansions !== undefined) {
      victim.takeDamage(attacker.damage);
      if (this.sound) this.sound.play('hit_base');
      if (this.onFloatingText) {
        const floatX = victim.position.x + (isPlayerAttacker ? -4.5 : 4.5);
        this.onFloatingText(floatX, 3.0, `-${attacker.damage}`, '#f87171');
      }
      return;
    }

    // 2. 目标是敌方士兵
    victim.takeDamage(attacker.damage);
    if (this.sound) {
      if (attacker.config.id === 'swordman_3' || attacker.config.id === 'soldier_3') {
        this.sound.play('explosion');
      } else {
        this.sound.play('slash'); // 精确在挥中瞬间爆发打击音效！
      }
    }

    // 漂浮受击伤害数字
    if (this.onFloatingText) {
      this.onFloatingText(victim.position.x, victim.position.y + 1.8, `-${attacker.damage}`, '#ef4444');
    }

    // 目标阵亡：触发阵亡音效与金币/EXP结算
    if (victim.isDead) {
      const killerBase = isPlayerAttacker ? this.baseAlly : this.baseEnemy;
      killerBase.money += victim.config.revenue;
      killerBase.exp += victim.config.expReward;

      if (isPlayerAttacker && this.onFloatingText) {
        this.onFloatingText(victim.position.x, victim.position.y + 2.4, `+$${victim.config.revenue}`, '#fbbf24');
      }
      if (this.sound) this.sound.play('die'); // 倒地哀嚎声
    }
  }

  // 投射物命中回调
  onProjectileHit(proj) {
    if (proj.isSplash) {
      // 范围伤害 (投石机/流星雨)
      const enemies = proj.isPlayer ? this.unitsEnemy : this.unitsAlly;
      const targetBase = proj.isPlayer ? this.baseEnemy : this.baseAlly;
      const killerBase = proj.isPlayer ? this.baseAlly : this.baseEnemy;

      for (const enemy of enemies) {
        if (!enemy.isDead && Math.abs(enemy.position.x - proj.mesh.position.x) <= proj.splashRadius) {
          enemy.takeDamage(proj.damage);
          if (enemy.isDead) {
            if (enemy.config && enemy.config.revenue) {
              killerBase.money += enemy.config.revenue;
            }
            if (enemy.config && enemy.config.expReward) {
              killerBase.exp += enemy.config.expReward;
            }
          }
        }
      }

      // 范围伤害正常结算给基地
      if (proj.target === targetBase || Math.abs(targetBase.position.x - proj.mesh.position.x) <= proj.splashRadius) {
        targetBase.takeDamage(proj.damage);
        if (this.onFloatingText) {
          // 基地正门前沿可视区飘字 (避免 X=±22 超出摄像机屏幕视野看不到扣血数字)
          const floatX = targetBase.position.x + (proj.isPlayer ? -4.5 : 4.5);
          this.onFloatingText(floatX, 3.8, `-${proj.damage}`, '#ef4444');
        }
        if (this.sound) this.sound.play('hit_base');
      }
      if (this.sound) this.sound.play('explosion');
    } else {
      // 单体命中 (士兵或基地)
      if (proj.target && !proj.target.isDead) {
        const isBase = (proj.target.turretSlots !== undefined);

        proj.target.takeDamage(proj.damage);
        if (this.onFloatingText) {
          const floatY = isBase ? 3.8 : (proj.target.position.y + 1.8);
          const floatX = isBase ? (proj.target.position.x + (proj.isPlayer ? -4.5 : 4.5)) : proj.target.position.x;
          this.onFloatingText(floatX, floatY, `-${proj.damage}`, '#ef4444');
        }
        if (proj.target.turretSlots !== undefined && this.sound) {
          this.sound.play('hit_base');
        }
        if (proj.target.isDead && proj.target.config) {
          const killerBase = proj.isPlayer ? this.baseAlly : this.baseEnemy;
          if (proj.target.config.revenue) {
            killerBase.money += proj.target.config.revenue;
          }
          if (proj.target.config.expReward) {
            killerBase.exp += proj.target.config.expReward;
          }
        }
        if (this.sound) this.sound.play('hit');
      }
    }
  }

  // 火山陨石砸地
  onMeteorImpact(groundX, damage, splashRadius) {
    for (const enemy of this.unitsEnemy) {
      if (!enemy.isDead && Math.abs(enemy.position.x - groundX) <= splashRadius) {
        enemy.takeDamage(damage);
        if (enemy.isDead) {
          this.baseAlly.money += enemy.config.revenue;
          this.baseAlly.exp += enemy.config.expReward;
        }
      }
    }
    // 天灾大招仅对士兵生效，对敌方基地要塞无效
    if (this.sound) this.sound.play('meteor_hit');
  }

  updateArmy(army, dt, nowSec) {
    for (const unit of army) {
      unit.update(dt, nowSec);
    }
  }

  cleanupDeadUnits(army) {
    for (let i = army.length - 1; i >= 0; i--) {
      const unit = army[i];
      if (unit.shouldDespawn) {
        unit.destroy();
        army.splice(i, 1);
      }
    }
  }
}
