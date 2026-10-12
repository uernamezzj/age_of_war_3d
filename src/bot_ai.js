/**
 * 《战争进化史 3D》敌方电脑 Bot AI 决策脑核
 * 1:1 映射 MrPio 原版 BotAI.cs (Melee -> Range -> Tank 三阶段出兵、造塔升级与大招反制)
 */

import { GAME_CONFIG } from './game_config.js';

export class BotAI {
  constructor(unitManager, turretManager, specialAttackManager) {
    this.unitManager = unitManager;
    this.turretManager = turretManager;
    this.specialAttackManager = specialAttackManager;

    // 经济与时代状态
    this.gold = GAME_CONFIG.base.startingMoney;
    this.gameTime = 0;
    this.phase = 'Melee'; // Melee -> Range -> Tank

    // 出兵循环计时器
    this.spawnTimer = 2.0;

    // 造塔循环计时器
    this.turretTimer = GAME_CONFIG.bot.initialTurretInterval; // 25s
  }

  update(delta) {
    this.gameTime += delta;

    // 1. 阶段流转 (1:1 BotAI.cs: 0~90s Melee, 90~180s Range, 180s+ Tank)
    if (this.gameTime < 90) {
      this.phase = 'Melee';
    } else if (this.gameTime < 180) {
      this.phase = 'Range';
    } else {
      this.phase = 'Tank';
    }

    // 2. 电脑金币被动增长 (带 1.75x 难度倍率)
    this.gold += GAME_CONFIG.base.passiveIncomePerSec * GAME_CONFIG.bot.incomeMultiplier * delta;

    // 3. 出兵决策循环
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.decideSpawn();
      // 下次出兵随机延时
      const range = GAME_CONFIG.bot.unitSpawnIntervalRange[this.phase.toLowerCase()] || [2.5, 5.0];
      this.spawnTimer = THREE.MathUtils.lerp(range[0], range[1], Math.random());
    }

    // 4. 防御塔决策循环 (造塔 / 升塔)
    this.turretTimer -= delta;
    if (this.turretTimer <= 0) {
      this.decideTurret();
      this.turretTimer = 25.0 + Math.random() * 10.0;
    }

    // 5. 危险反制大招 (我方兵力大举压境且逼近敌方基地时触发)
    this.checkEmergencySpecial();
  }

  // 出兵选择
  decideSpawn() {
    let chosenUnit = 'caveman_1';
    const rand = Math.random();

    if (this.phase === 'Melee') {
      chosenUnit = 'caveman_1';
    } else if (this.phase === 'Range') {
      chosenUnit = rand < 0.5 ? 'caveman_1' : 'caveman_2';
    } else if (this.phase === 'Tank') {
      if (rand < 0.25) chosenUnit = 'caveman_1';
      else if (rand < 0.5) chosenUnit = 'caveman_2';
      else chosenUnit = 'caveman_3';
    }

    const cost = GAME_CONFIG.units[chosenUnit].cost;
    if (this.gold >= cost) {
      this.gold -= cost;
      this.unitManager.spawnUnit(chosenUnit, false);
    }
  }

  // 基地造塔决策
  decideTurret() {
    const slots = this.turretManager.enemySlots;

    // 优先在未建塔的已解锁槽位造塔
    const emptySlotIdx = slots.findIndex(s => s.unlocked && !s.turret);
    if (emptySlotIdx !== -1) {
      // 倾向造 T1 或 T2
      const targetTurret = (this.phase === 'Tank' && this.gold >= 500) ? 'turret_1_3' :
                           (this.phase !== 'Melee' && this.gold >= 200) ? 'turret_1_2' : 'turret_1_1';
      const cost = GAME_CONFIG.turrets[targetTurret].cost;
      if (this.gold >= cost) {
        this.gold -= cost;
        this.turretManager.buildTurret(emptySlotIdx, targetTurret, false);
        return;
      }
    }

    // 若槽位已建塔，尝试升级 (T1 -> T2 -> T3)
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (s.unlocked && s.turret && s.turret.level < 3) {
        const nextId = s.turret.level === 1 ? 'turret_1_2' : 'turret_1_3';
        const cost = GAME_CONFIG.turrets[nextId].cost;
        if (this.gold >= cost) {
          this.gold -= cost;
          this.turretManager.buildTurret(i, nextId, false);
          return;
        }
      }
    }

    // 若还有未解锁槽位且资金极其充裕，解锁槽位
    const lockedIdx = slots.findIndex(s => !s.unlocked);
    if (lockedIdx !== -1) {
      const unlockCost = GAME_CONFIG.base.expansionCosts[lockedIdx];
      if (this.gold >= unlockCost) {
        this.gold -= unlockCost;
        this.turretManager.unlockSlot(lockedIdx, false);
      }
    }
  }

  // 紧急大招反击
  checkEmergencySpecial() {
    if (!this.specialAttackManager) return;
    // 统计威胁逼近敌方基地的我方军团数量 (X > 8)
    const dangerousUnits = this.unitManager.playerUnits.filter(u => u.state !== 'die' && u.x > 8);
    if (dangerousUnits.length >= 4 && Math.random() < 0.05) {
      this.specialAttackManager.triggerSpecial(false);
    }
  }

  reset() {
    this.gold = GAME_CONFIG.base.startingMoney;
    this.gameTime = 0;
    this.phase = 'Melee';
    this.spawnTimer = 3.0;
    this.turretTimer = 25.0;
  }
}
