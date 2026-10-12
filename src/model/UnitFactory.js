/**
 * UnitFactory.js - 兵种配置与工厂 (1:1 映射 AgeOfWarRemake/Assets/Scripts/Model/Units/UnitFactory.cs)
 */

export const UnitFactory = {
  // === 第一时代：原始石器时代 (Primitive Age) ===
  Caveman1: () => ({
    id: "caveman_1",
    displayName: "Caveman",
    cnName: "原始棒槌兵",
    modelUrl: "./models/era1/caveman_1_remastered.glb",
    type: "melee",
    maxHp: 55,
    damage: 16,
    attackDuration: 1.0,
    hitDelay: 0.35,
    cost: 15,
    revenue: 20,
    expReward: 30,
    spawnTime: 1.0,
    moveSpeed: 2.2,
    colliderWidth: 1.2,
    attackRange: 1.5,
    level: 1,
    age: 1,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_1_1.png"
  }),

  Caveman2: () => ({
    id: "caveman_2",
    displayName: "Slingshot man",
    cnName: "弹弓投石手",
    modelUrl: "./models/era1/caveman_2_remastered.glb",
    type: "range",
    maxHp: 42,
    damage: 10,
    shootDamage: 10,
    attackDuration: 1.85,
    hitDelay: 1.30, // 严格等拉满弓、右手甩出松弦放下的动作完全做完瞬间发射飞石 (1.30s)
    shootRate: 0.30, // 发射再慢一点：单次射击间隔延长至 3.33 秒，慢速沉稳开火，两次射击间有 2 秒纯粹行军步态
    maxShootingDistance: 15.0,
    bulletSpeed: 28.0, // 飞石初速提升
    cost: 25,
    revenue: 33,
    expReward: 45,
    spawnTime: 1.0,
    moveSpeed: 2.0,
    colliderWidth: 1.2,
    attackRange: 1.4,
    level: 2,
    age: 1,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_1_2.png"
  }),

  Caveman3: () => ({
    id: "caveman_3",
    displayName: "Dino",
    cnName: "恐龙骑兵",
    modelUrl: "./models/era1/caveman_3.glb",
    type: "tank",
    scale: 1.5,
    maxHp: 160,
    damage: 40,
    attackDuration: 0.95,
    hitDelay: 0.40,
    cost: 100,
    revenue: 130,
    expReward: 160,
    spawnTime: 3.0,
    moveSpeed: 2.5,
    colliderWidth: 3.3,
    attackRange: 2.6,
    level: 3,
    age: 1,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_1_3.png"
  }),

  // === 第二时代：中世纪城堡时代 (Medieval Age) ===
  Knight1: () => ({
    id: "knight_1",
    displayName: "Swordman",
    cnName: "十字军剑士",
    modelUrl: "./models/era2/knight_1.glb",
    type: "melee",
    maxHp: 100,
    damage: 32,
    attackDuration: 1.0,
    hitDelay: 0.35,
    cost: 50,
    revenue: 65,
    expReward: 80,
    spawnTime: 2.0,
    moveSpeed: 2.2,
    colliderWidth: 1.2,
    attackRange: 1.5,
    level: 1,
    age: 2,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_2_1.png"
  }),

  Knight2: () => ({
    id: "knight_2",
    displayName: "Archer",
    cnName: "长弓射手",
    modelUrl: "./models/era2/knight_2.glb",
    type: "range",
    maxHp: 80,
    damage: 20,
    shootDamage: 12,
    attackDuration: 1.15,
    hitDelay: 0.35,
    shootRate: 1.0,
    maxShootingDistance: 16.0,
    bulletSpeed: 24.0,
    cost: 75,
    revenue: 98,
    expReward: 120,
    spawnTime: 2.0,
    moveSpeed: 2.0,
    colliderWidth: 1.2,
    attackRange: 1.4,
    level: 2,
    age: 2,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_2_2.png"
  }),

  Knight3: () => ({
    id: "knight_3",
    displayName: "Knight",
    cnName: "重装战马骑士",
    modelUrl: "./models/era2/knight_3.glb",
    type: "tank",
    scale: 1.3,
    yOffset: -0.45, // 微调高度至 -0.45 (原 -0.55 -> -0.45)
    maxHp: 300,
    damage: 60,
    attackDuration: 1.0,
    hitDelay: 0.40,
    cost: 500,
    revenue: 650,
    expReward: 700,
    spawnTime: 5.0,
    moveSpeed: 2.8,
    colliderWidth: 2.8,
    attackRange: 2.5,
    level: 3,
    age: 2,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_2_3.png"
  }),

  // === 第三时代：近代文艺复兴时代 (Renaissance Age) ===
  Swordman1: () => ({
    id: "swordman_1",
    displayName: "Dueler",
    cnName: "佩剑决斗刺客",
    modelUrl: "./models/era3/swordman_1.glb",
    type: "melee",
    maxHp: 200,
    damage: 79,
    attackDuration: 1.0,
    hitDelay: 0.35,
    cost: 200,
    revenue: 260,
    expReward: 300,
    spawnTime: 3.0,
    moveSpeed: 2.3,
    colliderWidth: 1.2,
    attackRange: 1.5,
    level: 1,
    age: 3,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_3_1.png"
  }),

  Swordman2: () => ({
    id: "swordman_2",
    displayName: "Mousquettere",
    cnName: "近卫火枪手",
    modelUrl: "./models/era3/swordman_2.glb",
    type: "range",
    maxHp: 160,
    damage: 40,
    shootDamage: 25,
    attackDuration: 1.15,
    hitDelay: 0.35,
    shootRate: 0.8,
    maxShootingDistance: 17.0,
    bulletSpeed: 28.0,
    cost: 400,
    revenue: 520,
    expReward: 600,
    spawnTime: 3.0,
    moveSpeed: 2.0,
    colliderWidth: 1.2,
    attackRange: 1.4,
    level: 2,
    age: 3,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_3_2.png"
  }),

  Swordman3: () => ({
    id: "swordman_3",
    displayName: "Canoneer",
    cnName: "轮式野战攻城炮",
    modelUrl: "./models/era3/swordman_3.glb",
    type: "tank",
    scale: 1.2,
    maxHp: 600,
    damage: 140,
    shootDamage: 0,
    attackDuration: 1.8,
    hitDelay: 0.50,
    maxShootingDistance: 0, // 原版中轮式攻城炮绝不超视距远程开火，仅在推进至最前线面对面交锋时近身开炮轰击！
    cost: 1000,
    revenue: 1300,
    expReward: 1500,
    spawnTime: 5.0,
    moveSpeed: 1.8,
    colliderWidth: 2.6,
    attackRange: 2.4,
    level: 3,
    age: 3,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_3_3.png"
  }),

  // === 第四时代：现代工业战争时代 (Modern Age) ===
  Soldier1: () => ({
    id: "soldier_1",
    displayName: "Melee Infantry",
    cnName: "精锐刺刀步兵",
    modelUrl: "./models/era4/soldier_1.glb",
    type: "melee",
    maxHp: 350,
    damage: 100,
    attackDuration: 1.0,
    hitDelay: 0.35,
    cost: 1500,
    revenue: 1950,
    expReward: 2200,
    spawnTime: 3.0,
    moveSpeed: 2.4,
    colliderWidth: 1.2,
    attackRange: 1.5,
    level: 1,
    age: 4,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_4_1.png"
  }),

  Soldier2: () => ({
    id: "soldier_2",
    displayName: "Infantry",
    cnName: "自动步枪突击手",
    modelUrl: "./models/era4/soldier_2.glb",
    type: "range",
    maxHp: 300,
    damage: 60,
    shootDamage: 38,
    attackDuration: 0.85,
    hitDelay: 0.28,
    shootRate: 1.4,
    maxShootingDistance: 18.0,
    bulletSpeed: 38.0,
    cost: 2000,
    revenue: 2600,
    expReward: 3000,
    spawnTime: 3.0,
    moveSpeed: 2.1,
    colliderWidth: 1.2,
    attackRange: 1.4,
    level: 2,
    age: 4,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_4_2.png"
  }),

  Soldier3: () => ({
    id: "soldier_3",
    displayName: "Tank",
    cnName: "主战装甲坦克",
    modelUrl: "./models/era4/soldier_3.glb",
    type: "tank",
    scale: 3.9, // 严格遵从指令放大 1.5 倍 (2.6 * 1.5 = 3.9)，体长 7.8m，高 2.3m，主战重装气势磅礴
    maxHp: 1200,
    damage: 320,
    shootDamage: 0,
    attackDuration: 2.2,
    hitDelay: 0.55,
    maxShootingDistance: 0, // 原版中主战坦克推进至最前线面对面肉搏交锋时才近身开火，绝不超视距远程攻击！
    cost: 7000,
    revenue: 9100,
    expReward: 10000,
    spawnTime: 8.0,
    moveSpeed: 1.7,
    colliderWidth: 5.8,
    attackRange: 3.8,
    level: 3,
    age: 4,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_4_3.png"
  }),

  // === 第五时代：未来科幻时代 (Future Age) ===
  Trooper1: () => ({
    id: "trooper_1",
    displayName: "God's Blade",
    cnName: "光刃机能特警",
    modelUrl: "./models/era5/trooper_1.glb",
    type: "melee",
    scale: 2.5, // 挺拔未来特警 (原高仅0.79m)
    maxHp: 1000,
    damage: 250,
    attackDuration: 1.0,
    hitDelay: 0.30,
    cost: 5000,
    revenue: 6500,
    expReward: 7500,
    spawnTime: 3.0,
    moveSpeed: 2.6,
    colliderWidth: 1.5,
    attackRange: 1.6,
    level: 1,
    age: 5,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_5_1.png"
  }),

  Trooper2: () => ({
    id: "trooper_2",
    displayName: "Blaster",
    cnName: "等离子爆能枪手",
    modelUrl: "./models/era5/trooper_2.glb",
    type: "range",
    scale: 1.8, // 沉稳爆能枪手 (原高仅1.12m)
    maxHp: 800,
    damage: 130,
    shootDamage: 85,
    attackDuration: 1.2,
    hitDelay: 0.30,
    shootRate: 1.0,
    maxShootingDistance: 20.0,
    bulletSpeed: 35.0,
    cost: 6000,
    revenue: 7800,
    expReward: 9000,
    spawnTime: 3.0,
    moveSpeed: 2.2,
    colliderWidth: 1.4,
    attackRange: 1.5,
    level: 2,
    age: 5,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_5_2.png"
  }),

  Trooper3: () => ({
    id: "trooper_3",
    displayName: "War Machine",
    cnName: "终极重装突击机甲",
    modelUrl: "./models/era5/trooper_3.glb",
    type: "tank",
    scale: 2.8, // 终极巨型突击机甲 (原高仅1.03m，放大后近3m威慑全场)
    maxHp: 3000,
    damage: 600,
    shootDamage: 450,
    attackDuration: 2.0,
    hitDelay: 0.45,
    shootRate: 0.55,
    maxShootingDistance: 22.0,
    bulletSpeed: 30.0,
    cost: 20000,
    revenue: 26000,
    expReward: 30000,
    spawnTime: 8.0,
    moveSpeed: 1.9,
    colliderWidth: 5.2,
    attackRange: 3.2,
    level: 3,
    age: 5,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_5_3.png"
  }),

  Trooper4: () => ({
    id: "trooper_4",
    displayName: "Super Soldier",
    cnName: "终极超能特种兵",
    modelUrl: "./models/era5/trooper_4.glb",
    type: "range",
    scale: 2.2, // 终极超能英雄体态，挺拔气势
    maxHp: 5000, // 5000 点雄厚英雄生命值
    damage: 400,
    shootDamage: 120,
    attackDuration: 1.3,
    hitDelay: 0.25,
    shootRate: 0.85,
    maxShootingDistance: 24.0,
    bulletSpeed: 40.0,
    cost: 150000,
    revenue: 200000,
    expReward: 250000,
    spawnTime: 3.0,
    moveSpeed: 2.5,
    colliderWidth: 1.6,
    attackRange: 1.6,
    level: 4,
    age: 5,
    isSuper: true,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_5_4.png"
  }),

  // 按时代索引获取兵种生成器数组 (age: 1 ~ 5)
  getUnitsByAge(age = 1) {
    switch (age) {
      case 1:
        return [this.Caveman1, this.Caveman2, this.Caveman3];
      case 2:
        return [this.Knight1, this.Knight2, this.Knight3];
      case 3:
        return [this.Swordman1, this.Swordman2, this.Swordman3];
      case 4:
        return [this.Soldier1, this.Soldier2, this.Soldier3];
      case 5:
        return [this.Trooper1, this.Trooper2, this.Trooper3, this.Trooper4];
      default:
        return [this.Caveman1, this.Caveman2, this.Caveman3];
    }
  }
};
