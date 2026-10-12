/**
 * TurretFactory.js - 防御塔配置与工厂 (1:1 映射 AgeOfWarRemake/Assets/Scripts/Model/Turrets/TurretFactory.cs)
 */

export const TurretFactory = {
  // === 第一时代：原始石器时代 (Primitive Age) ===
  Rock: () => ({
    id: "turret_1_1",
    displayName: "Rock Slingshot",
    cnName: "投石索防御塔",
    modelUrl: "./models/era1/turret_1_1.glb",
    mountPivot: { x: 0, y: 0, z: 0 },
    scale: 0.50,
    damage: 10,
    range: 16.0,
    cost: 100,
    sellPrice: 50,
    bulletSpeed: 16.0,
    attackRate: 1.8,
    level: 1,
    age: 1,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_1_1.png"
  }),

  EggAutomatic: () => ({
    id: "turret_1_2",
    displayName: "Egg Automatic",
    cnName: "双联恐龙蛋机枪塔",
    modelUrl: "./models/era1/turret_1_2.glb",
    mountPivot: { x: 0, y: 0, z: 0 },
    scale: 0.50,
    damage: 4,
    range: 16.0,
    cost: 200,
    sellPrice: 100,
    bulletSpeed: 18.0,
    attackRate: 0.5,
    level: 2,
    age: 1,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_1_2.png"
  }),

  PrimitiveCatapult: () => ({
    id: "turret_1_3",
    displayName: "Primitive Catapult",
    cnName: "原始重型投石机",
    modelUrl: "./models/era1/turret_1_3.glb",
    mountPivot: { x: 0.711, y: 0.891, z: -0.211 }, // 骨骼底座安装点
    rotationOffset: 0, // 统一基准朝向战场前线 (全时代槽位统一 0 旋转)
    scale: 0.50,
    damage: 30,
    splashDamage: 15,
    splashRadius: 3.5,
    range: 20.0,
    cost: 500,
    sellPrice: 250,
    bulletSpeed: 14.0,
    attackRate: 3.6,
    level: 3,
    age: 1,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_1_3.png"
  }),

  // === 第二时代：中世纪城堡时代 (Medieval Age) ===
  StoneCatapult: () => ({
    id: "turret_2_1",
    displayName: "Stone Catapult",
    cnName: "中世纪配重投石机",
    modelUrl: "./models/era2/turret_2_1.glb",
    mountPivot: { x: 1.567, y: 0.636, z: -0.432 }, // 核心红圈：齿轮安装轴心 Gear Hub
    scale: 0.50,
    damage: 32,
    range: 18.0,
    cost: 500,
    sellPrice: 250,
    bulletSpeed: 16.0,
    attackRate: 2.2,
    level: 1,
    age: 2,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_2_1.png"
  }),

  FireCatapult: () => ({
    id: "turret_2_2",
    displayName: "Fire Catapult",
    cnName: "烈焰火油投石塔",
    modelUrl: "./models/era2/turret_2_2.glb",
    mountPivot: { x: 1.804, y: 0.732, z: -0.497 }, // 核心红圈：四螺栓挂载板 Mounting Bracket
    scale: 0.50,
    damage: 45,
    splashDamage: 25,
    splashRadius: 4.0,
    range: 18.0,
    cost: 750,
    sellPrice: 375,
    bulletSpeed: 15.0,
    attackRate: 2.5,
    level: 2,
    age: 2,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_2_2.png"
  }),

  Oil: () => ({
    id: "turret_2_3",
    displayName: "Oil",
    cnName: "城防沸油倾泻机",
    modelUrl: "./models/era2/turret_2_3.glb",
    mountPivot: { x: -1.455, y: 0.394, z: 0.065 }, // 城防沸油倾泻机左侧塔楼安装支架 Cube002
    scale: 1.0, // 放大至原来的两倍大 (原 0.50 -> 1.0)
    damage: 180, // 原版超高爆发：倾泻滚烫沸油瞬秒贴墙步兵
    splashDamage: 120,
    splashRadius: 3.2,
    range: 4.5, // 极短射程：仅对模型右下方脚下逼近大门的敌人倾泻
    cost: 1000,
    sellPrice: 500,
    bulletSpeed: 14.0,
    attackRate: 1.5,
    level: 3,
    age: 2,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_2_3.png"
  }),

  // === 第三时代：近代文艺复兴时代 (Renaissance Age) ===
  SmallCannon: () => ({
    id: "turret_3_1",
    displayName: "Small Cannon",
    cnName: "轻型前装滑膛炮",
    modelUrl: "./models/era3/turret_3_1.glb",
    mountPivot: { x: -0.436, y: 0.650, z: -0.340 }, // 滑膛炮架车轴齿轮 gear
    scale: 0.50,
    damage: 50,
    range: 18.0,
    cost: 1500,
    sellPrice: 750,
    bulletSpeed: 22.0,
    attackRate: 2.0,
    level: 1,
    age: 3,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_3_1.png"
  }),

  LargeCannon: () => ({
    id: "turret_3_2",
    displayName: "Large Cannon",
    cnName: "重型青铜要塞炮",
    modelUrl: "./models/era3/turret_3_2.glb",
    mountPivot: { x: -0.555, y: 0.700, z: -0.353 }, // 要塞炮架齿轮 gear
    scale: 0.50,
    damage: 65,
    splashDamage: 30,
    splashRadius: 3.5,
    range: 20.0,
    cost: 3000,
    sellPrice: 1500,
    bulletSpeed: 24.0,
    attackRate: 2.2,
    level: 2,
    age: 3,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_3_2.png"
  }),

  ExplosiveCannon: () => ({
    id: "turret_3_3",
    displayName: "Explosive Cannon",
    cnName: "高爆霰弹加农炮",
    modelUrl: "./models/era3/turret_3_3.glb",
    mountPivot: { x: -0.701, y: 0.750, z: -0.392 }, // 高爆霰弹加农固定齿轮 gear
    scale: 0.50,
    damage: 85,
    splashDamage: 50,
    splashRadius: 4.5,
    range: 22.0,
    cost: 6000,
    sellPrice: 3000,
    bulletSpeed: 25.0,
    attackRate: 2.5,
    level: 3,
    age: 3,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_3_3.png"
  }),

  // === 第四时代：现代工业战争时代 (Modern Age) ===
  SingleTurret: () => ({
    id: "turret_4_1",
    displayName: "Single Turret",
    cnName: "单管高射速速射机枪塔",
    modelUrl: "./models/era4/turret_4_1.glb",
    mountPivot: { x: -1.143, y: 0.472, z: 0.000 }, // 旋转底盘插槽 Turret1001
    scale: 0.35, // 缩小一半 (原 0.70 -> 0.35)
    damage: 50,
    range: 19.0,
    cost: 7000,
    sellPrice: 3500,
    bulletSpeed: 50.0,
    attackRate: 1.0,
    level: 1,
    age: 4,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_4_1.png"
  }),

  RocketLauncher: () => ({
    id: "turret_4_2",
    displayName: "Rocket Launcher",
    cnName: "多联装战术火箭发射塔",
    modelUrl: "./models/era4/turret_4_2.glb",
    mountPivot: { x: 0.051, y: 0.750, z: 0.000 },  // 圆柱回转底盘 Cylinder004
    scale: 0.35, // 缩小一半 (原 0.70 -> 0.35)
    damage: 120,
    splashDamage: 70,
    splashRadius: 4.5,
    range: 22.0,
    cost: 9000,
    sellPrice: 4500,
    bulletSpeed: 35.0,
    attackRate: 2.2,
    level: 2,
    age: 4,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_4_2.png"
  }),

  DoubleTurret: () => ({
    id: "turret_4_3",
    displayName: "Double Turret",
    cnName: "双联重装防空高炮",
    modelUrl: "./models/era4/turret_4_3.glb",
    mountPivot: { x: -1.168, y: 0.850, z: 0.000 }, // 双联高炮底座 Cube
    scale: 0.32, // 缩小一半 (原 0.65 -> 0.32)
    damage: 80,
    range: 20.0,
    cost: 14000,
    sellPrice: 7000,
    bulletSpeed: 54.0,
    attackRate: 0.6,
    level: 3,
    age: 4,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_4_3.png"
  }),

  // === 第五时代：未来科幻时代 (Future Age) ===
  TitaniumShooter: () => ({
    id: "turret_5_1",
    displayName: "Titanium Shooter",
    cnName: "钛合金脉冲突击炮",
    modelUrl: "./models/era5/turret_5_1.glb",
    mountPivot: { x: -0.858, y: 0.759, z: 0.000 }, // 脉冲突击炮重装机体底座 Cylinder003
    scale: 0.30, // 缩小一半 (原 0.60 -> 0.30)
    damage: 150,
    range: 22.0,
    cost: 24000,
    sellPrice: 12000,
    bulletSpeed: 32.0,
    attackRate: 1.2,
    level: 1,
    age: 5,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_5_1.png"
  }),

  LaserCannon: () => ({
    id: "turret_5_2",
    displayName: "Laser Cannon",
    cnName: "高能聚焦激光炮塔",
    modelUrl: "./models/era5/turret_5_2.glb",
    mountPivot: { x: -0.423, y: 0.800, z: -0.013 }, // 激光炮高能磁极悬浮底座 Sphere008_2
    scale: 0.50, // 缩小一半 (原 1.0 -> 0.50)
    damage: 120,
    range: 25.0,
    cost: 40000,
    sellPrice: 20000,
    bulletSpeed: 45.0,
    attackRate: 0.8,
    level: 2,
    age: 5,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_5_2.png"
  }),

  IonCannon: () => ({
    id: "turret_5_3",
    displayName: "Ion Cannon",
    cnName: "要塞重型离子轨道歼灭炮",
    modelUrl: "./models/era5/turret_5_3.glb",
    mountPivot: { x: -0.541, y: 0.905, z: -0.007 }, // 歼灭轨道炮重力基架 Sphere011_5
    scale: 0.50, // 缩小一半 (原 1.0 -> 0.50)
    damage: 300,
    splashDamage: 200,
    splashRadius: 6.0,
    range: 48.0, // 超视距全图科技打击
    cost: 100000,
    sellPrice: 50000,
    bulletSpeed: 45.0,
    attackRate: 2.0,
    level: 3,
    age: 5,
    icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_5_3.png"
  }),

  getTurretsByAge(age = 1) {
    switch (age) {
      case 1:
        return [this.Rock, this.EggAutomatic, this.PrimitiveCatapult];
      case 2:
        return [this.StoneCatapult, this.FireCatapult, this.Oil];
      case 3:
        return [this.SmallCannon, this.LargeCannon, this.ExplosiveCannon];
      case 4:
        return [this.SingleTurret, this.RocketLauncher, this.DoubleTurret];
      case 5:
        return [this.TitaniumShooter, this.LaserCannon, this.IonCannon];
      default:
        return [this.Rock, this.EggAutomatic, this.PrimitiveCatapult];
    }
  }
};
