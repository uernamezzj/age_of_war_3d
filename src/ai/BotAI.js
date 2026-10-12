/**
 * BotAI.js - 敌方电脑 AI 智能状态机 (1:1 映射 AgeOfWarRemake/Assets/Scripts/Partials/AI/BotAI.cs)
 * 阶段流转：Melee (前期近战) -> Range (中期混编远程) -> Tank (后期重装碾压)
 * 智能造兵、防御塔槽位扩建与升级
 */

import { UnitFactory } from '../model/UnitFactory.js';
import { TurretFactory } from '../model/TurretFactory.js';
import { BaseFactory } from '../model/BaseFactory.js';

export class BotAI {
  constructor(gameManager) {
    this.gm = gameManager;

    // 阶段状态: 'Melee' | 'Range' | 'Tank'
    this.phase = 'Melee';
    this.elapsedTime = 0;

    // 阶段时长 (秒)
    this.meleeDuration = 45.0; // 45秒后解锁远程
    this.rangeDuration = 60.0; // 60秒后解锁重装

    // 出兵与造塔计时器
    this.lastSpawnTime = 0;
    this.nextSpawnDelay = 3.5;
    this.lastTurretActionTime = 0;
    this.turretInterval = 25.0; // 每 25 秒评估一次防御塔扩建
  }

  update(dt, nowSec) {
    this.elapsedTime += dt;

    // 1. 阶段推进流转
    if (this.elapsedTime < this.meleeDuration) {
      this.phase = 'Melee';
    } else if (this.elapsedTime < this.meleeDuration + this.rangeDuration) {
      this.phase = 'Range';
    } else {
      this.phase = 'Tank';
    }

    // 2. 出兵循环 (SpawnLoop)
    if (nowSec - this.lastSpawnTime >= this.nextSpawnDelay) {
      this.lastSpawnTime = nowSec;
      this.decideAndSpawnUnit();
      // 下次出兵随机延时 (2.5 ~ 6.0 秒)
      this.nextSpawnDelay = 2.5 + Math.random() * 3.5;
    }

    // 3. 防御塔评估循环 (TurretLoop)
    if (nowSec - this.lastTurretActionTime >= this.turretInterval) {
      this.lastTurretActionTime = nowSec;
      this.evaluateTurrets();
    }
  }

  decideAndSpawnUnit() {
    const enemyBase = this.gm.baseEnemy;
    const unitsList = UnitFactory.getUnitsByAge(enemyBase.age);

    let chosenIdx = 0;
    const ran = Math.random();

    if (this.phase === 'Melee') {
      chosenIdx = 0; // 棒槌兵
    } else if (this.phase === 'Range') {
      chosenIdx = ran < 0.5 ? 0 : 1; // 50% 棒槌兵, 50% 弹弓手
    } else {
      if (ran < 0.3) chosenIdx = 0;
      else if (ran < 0.6) chosenIdx = 1;
      else chosenIdx = 2; // 40% 恐龙重骑兵
    }

    const unitConf = unitsList[chosenIdx]();

    // 检查资金是否充足 (AI 也扣除资金，不足则尝试降级购买)
    if (enemyBase.money >= unitConf.cost) {
      enemyBase.money -= unitConf.cost;
      this.gm.spawnUnit(unitConf, false); // 我方 false 即敌方
    } else if (enemyBase.money >= 15) {
      // 兜底买最便宜的野人
      const fallbackConf = unitsList[0]();
      enemyBase.money -= fallbackConf.cost;
      this.gm.spawnUnit(fallbackConf, false);
    }
  }

  evaluateTurrets() {
    const enemyBase = this.gm.baseEnemy;
    const turrets = enemyBase.turretSlots;

    // 寻找空闲槽位
    const freeSlotIdx = turrets.findIndex(t => t === null);

    if (freeSlotIdx !== -1 && freeSlotIdx < enemyBase.unlockedExpansions) {
      // 在空位建造防御塔 (首选投石塔或蛋塔)
      const turretChoices = TurretFactory.getTurretsByAge(enemyBase.age);
      const choice = (this.phase === 'Tank' && enemyBase.money >= 500) ? 2 :
                     (this.phase !== 'Melee' && enemyBase.money >= 200) ? 1 : 0;
      const conf = turretChoices[choice]();

      if (enemyBase.money >= conf.cost) {
        enemyBase.money -= conf.cost;
        this.gm.buildTurret(freeSlotIdx, conf, false);
      }
    } else if (enemyBase.unlockedExpansions < enemyBase.maxExpansions) {
      // 考虑解锁新槽位
      const nextExpansionCost = BaseFactory.ExpansionCosts[enemyBase.unlockedExpansions - 1] || 1000;
      if (enemyBase.money >= nextExpansionCost + 150) { // 留出充裕出兵资金再开槽
        enemyBase.unlockNextExpansion(nextExpansionCost);
      }
    }
  }
}
