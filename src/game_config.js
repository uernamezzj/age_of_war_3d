/**
 * 《战争进化史 3D》第一纪元（原始石器时代）数值与配置系统
 * 严格 1:1 对齐 MrPio 原版开源项目 AgeOfWarRemake
 */

export const GAME_CONFIG = {
  // 战场规格 (米)
  battlefield: {
    length: 64,               // 总长 64 米
    width: 10,                // 战道宽度 10 米
    laneZ: 0,                 // 主行军中线 Z 坐标
    playerBaseX: -26,         // 我方基地洞穴中心 X
    enemyBaseX: 26,           // 敌方基地洞穴中心 X
    playerSpawnX: -21.5,      // 我方出兵点 (从洞穴走出)
    enemySpawnX: 21.5,        // 敌方出兵点 (从洞穴走出)
    cameraDefaultX: 0,        // 摄影机默认 X 居中
    cameraBounds: [-26, 26],  // 摄影机横向可漫游范围
  },

  // 基地配置 (1:1 BaseFactory.cs)
  base: {
    maxHp: 500,
    startingMoney: 175,
    passiveIncomePerSec: 2,   // BaseFactory.MoneyPerSecond[0]
    evolveExpRequired: 4000,
    turretSlotsMax: 3,
    expansionCosts: [0, 1000, 3000], // 0(默认开放第1位), $1000(第2位), $3000(第3位)
    specialAttack: {
      name: "火山流星雨 (Volcano Eruption)",
      cooldown: 60,           // 冷却时间 (秒)
      damage: 70,             // 每颗陨石基础伤害
      meteorCount: 16,        // 流星雨数量
      splashRadius: 3.5,      // 溅射半径
    }
  },

  // 兵种配置 (1:1 UnitFactory.cs)
  units: {
    caveman_1: {
      id: "caveman_1",
      displayName: "棒槌野人 (Caveman)",
      type: "melee",
      modelFile: "./models/era1/caveman_1.glb",
      targetHeight: 1.80,
      cost: 15,
      revenue: 20,            // 击杀奖励金币
      expReward: 30,          // 击杀奖励经验
      maxHp: 55,
      damage: 16,             // 近战劈砸伤害
      attackDuration: 1.0,    // 攻击周期 (秒)
      spawnTime: 1.0,         // 训练时间 (秒)
      moveSpeed: 2.2,         // 行军速度 (m/s)
      attackRange: 1.5,       // 近战判定距离 (m)
      hitDelay: 0.35,         // 动作前摇命中点 (秒)
      icon: "🪓"
    },
    caveman_2: {
      id: "caveman_2",
      displayName: "弹弓投石手 (Slingshot)",
      type: "range",
      modelFile: "./models/era1/caveman_2.glb",
      ammoFile: "./models/era1/egg.fbx",
      targetHeight: 1.75,
      cost: 25,
      revenue: 33,
      expReward: 45,
      maxHp: 42,
      damage: 10,             // 近战反击伤害
      shootDamage: 5,         // 远程投石伤害
      shootRate: 1.5,         // 投射冷却 (秒)
      shootRange: 14.0,       // 远程射程 (m)
      attackDuration: 1.0,
      spawnTime: 1.0,
      moveSpeed: 2.0,
      attackRange: 1.4,
      bulletSpeed: 14.0,
      icon: "🎯"
    },
    caveman_3: {
      id: "caveman_3",
      displayName: "恐龙骑手 (Dino Rider)",
      type: "tank",
      modelFile: "./models/era1/caveman_3.glb",
      targetHeight: 2.20,
      cost: 100,
      revenue: 130,
      expReward: 160,
      maxHp: 160,
      damage: 40,             // 近身撕咬/长矛刺击
      attackDuration: 1.5,
      spawnTime: 3.0,
      moveSpeed: 2.6,
      attackRange: 1.8,
      hitDelay: 0.45,
      icon: "🦕"
    }
  },

  // 防御塔配置 (1:1 TurretFactory.cs)
  turrets: {
    turret_1_1: {
      id: "turret_1_1",
      displayName: "1阶 单发弹弓塔 (Rock Slingshot)",
      level: 1,
      cost: 100,
      sellRefund: 70,
      damage: 10,
      range: 16.0,
      bulletSpeed: 12.0,
      fireRate: 1.4,          // 射击间隔 (秒)
      modelFile: "./models/era1/turret_1_1.glb",
      ammoFile: "./models/era1/egg.fbx",
      targetHeight: 2.2,
      icon: "🏹"
    },
    turret_1_2: {
      id: "turret_1_2",
      displayName: "2阶 双联投石塔 (Egg Automatic)",
      level: 2,
      cost: 200,
      sellRefund: 140,
      damage: 6,              // 双联快速发射，单发 6 伤害
      range: 17.0,
      bulletSpeed: 14.0,
      fireRate: 0.8,
      modelFile: "./models/era1/turret_1_2.glb",
      ammoFile: "./models/era1/egg.fbx",
      targetHeight: 2.4,
      icon: "⚔️"
    },
    turret_1_3: {
      id: "turret_1_3",
      displayName: "3阶 巨石重炮机 (Primitive Catapult)",
      level: 3,
      cost: 500,
      sellRefund: 350,
      damage: 32,             // 巨石重炮重创
      splashRadius: 2.5,
      range: 22.0,
      bulletSpeed: 16.0,
      fireRate: 2.2,
      modelFile: "./models/era1/turret_1_3.glb",
      ammoFile: "./models/era1/egg.fbx",
      targetHeight: 2.8,
      icon: "☄️"
    }
  },

  // Bot 电脑决策 AI 配置 (1:1 BotAI.cs)
  bot: {
    incomeMultiplier: 1.75,   // BotAI.BotIncomeMultiplier = 1.75f
    phaseDurations: [90, 90], // [0]=Melee(90s), [1]=Range(90s), [2]=Tank
    initialTurretInterval: 25,
    unitSpawnIntervalRange: {
      melee: [2.5, 6.0],
      range: [2.5, 5.5],
      tank: [3.0, 6.5]
    }
  }
};
