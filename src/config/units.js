/**
 * 兵种基础数值与技能属性配置表
 */
export const UNITS_DATA = {
  // --- 时代 1：史前石器时代 ---
  stone_club: {
    id: 'stone_club',
    eraId: 1,
    name: '棒槌野人',
    type: 'melee',
    cost: 15,
    health: 60,
    attack: 16,
    attackSpeed: 1.2, // 每秒攻击次数
    attackRange: 1.8, // 攻击距离（米）
    moveSpeed: 3.2,   // 行军移速（米/秒）
    rewardGold: 18,
    rewardExp: 30,
    modelKey: 'caveman',
    desc: '造价极低的高攻速肉搏敢死队'
  },
  stone_slingshot: {
    id: 'stone_slingshot',
    eraId: 1,
    name: '弹弓投石手',
    type: 'ranged',
    cost: 25,
    health: 45,
    attack: 12,
    attackSpeed: 0.9,
    attackRange: 16.0,
    moveSpeed: 2.8,
    rewardGold: 30,
    rewardExp: 45,
    modelKey: 'slingshot',
    desc: '远程投掷碎石，克制轻装步兵'
  },
  stone_dino: {
    id: 'stone_dino',
    eraId: 1,
    name: '翼龙/恐龙骑兵',
    type: 'heavy',
    cost: 100,
    health: 280,
    attack: 45,
    attackSpeed: 0.8,
    attackRange: 2.2,
    moveSpeed: 3.5,
    rewardGold: 120,
    rewardExp: 180,
    modelKey: 'dino',
    desc: '石器时代的推线霸主，高血量与范围践踏'
  },

  // --- 时代 4：现代战争时代 (已有 Soldier.glb 模型就绪) ---
  modern_soldier: {
    id: 'modern_soldier',
    eraId: 4,
    name: '战术突击步兵',
    type: 'ranged',
    cost: 400,
    health: 650,
    attack: 85,
    attackSpeed: 2.0,
    attackRange: 22.0,
    moveSpeed: 3.6,
    rewardGold: 450,
    rewardExp: 600,
    modelKey: 'soldier',
    localModel: './models/Soldier.glb',
    desc: '配备全自动突击步枪与战术防弹背心'
  },

  // --- 时代 5：未来科幻纪元 (已有 RobotExpressive.glb 模型就绪) ---
  scifi_robot: {
    id: 'scifi_robot',
    eraId: 5,
    name: '未来量子机甲',
    type: 'heavy',
    cost: 1200,
    health: 2200,
    attack: 260,
    attackSpeed: 1.5,
    attackRange: 18.0,
    moveSpeed: 3.8,
    rewardGold: 1400,
    rewardExp: 2000,
    modelKey: 'robot',
    localModel: './models/RobotExpressive.glb',
    desc: '装备脉冲护盾与高能等离子炮的双足机兵'
  }
};
