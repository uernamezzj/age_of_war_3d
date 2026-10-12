/**
 * BaseFactory.js - 基地与要塞配置工厂 (1:1 映射 AgeOfWarRemake/Assets/Scripts/Model/Bases/BaseFactory.cs)
 */

export const BaseFactory = {
  // 时代 1：原始石器时代 (Cave)
  Cave: () => ({
    name: "Cave",
    cnName: "原始洞穴要塞",
    age: 1,
    maxHp: 500,
    evolveExpRequired: 4000,
    startingMoney: 175,
    passiveIncomePerSec: 2,
    modelUrl: "./models/era1/base_1.glb",
    unlockedExpansions: 1,
    maxExpansions: 4,
    special: {
      name: "Volcano eruption",
      cnName: "火山流星雨",
      age: 1,
      cooldown: 60.0,
      damage: 70,
      meteorCount: 16,
      splashRadius: 3.5,
      type: "Rain",
      icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Specials/1.png"
    }
  }),

  // 时代 2：中世纪城堡时代 (Castle)
  Castle: () => ({
    name: "Castle",
    cnName: "中世纪古堡要塞",
    age: 2,
    maxHp: 1200,
    evolveExpRequired: 14000,
    startingMoney: 175,
    passiveIncomePerSec: 5,
    modelUrl: "./models/era2/base_2.glb",
    unlockedExpansions: 1,
    maxExpansions: 4,
    special: {
      name: "Arrow Rain",
      cnName: "倾盆箭雨支援",
      age: 2,
      cooldown: 55.0,
      damage: 85,
      meteorCount: 22,
      splashRadius: 3.0,
      type: "Rain",
      icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Specials/2.png"
    }
  }),

  // 时代 3：近代文艺复兴时代 (Church)
  Church: () => ({
    name: "Church",
    cnName: "文艺复兴大教堂",
    age: 3,
    maxHp: 2000,
    evolveExpRequired: 45000,
    startingMoney: 175,
    passiveIncomePerSec: 20,
    modelUrl: "./models/era3/base_3.glb",
    unlockedExpansions: 1,
    maxExpansions: 4,
    special: {
      name: "Blessing",
      cnName: "神圣庇护祝福",
      age: 3,
      cooldown: 50.0,
      damage: -40, // 治愈友军
      duration: 18.0,
      type: "Heal",
      icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Specials/3.png"
    }
  }),

  // 时代 4：现代战争时代 (Camp)
  Camp: () => ({
    name: "Camp",
    cnName: "现代军事战术营地",
    age: 4,
    maxHp: 3200,
    evolveExpRequired: 200000,
    startingMoney: 175,
    passiveIncomePerSec: 150,
    modelUrl: "./models/era4/base_4.glb",
    unlockedExpansions: 1,
    maxExpansions: 4,
    special: {
      name: "Aerial support",
      cnName: "空中战机地毯轰炸",
      age: 4,
      cooldown: 50.0,
      damage: 400,
      meteorCount: 8,
      splashRadius: 5.0,
      type: "Scan",
      icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Specials/4.png"
    }
  }),

  // 时代 5：未来科幻时代 (Ship)
  Ship: () => ({
    name: "Ship",
    cnName: "未来星际轨道战舰",
    age: 5,
    maxHp: 5000,
    evolveExpRequired: 0,
    startingMoney: 175,
    passiveIncomePerSec: 500,
    modelUrl: "./models/era5/base_5.glb",
    unlockedExpansions: 1,
    maxExpansions: 4,
    special: {
      name: "Satellite",
      cnName: "天基死光卫星打击",
      age: 5,
      cooldown: 45.0,
      damage: 1500,
      meteorCount: 6,
      splashRadius: 6.0,
      type: "Scan",
      icon: "./AgeOfWarRemake/Assets/Resources/Sprites/Specials/5.png"
    }
  }),

  Bases: null, // 初始化在下方

  // 解锁第 2, 3, 4 个炮塔插槽的花费 (对应 BaseFactory.cs)
  ExpansionCosts: [1000, 3000, 7500]
};

BaseFactory.Bases = [
  BaseFactory.Cave,
  BaseFactory.Castle,
  BaseFactory.Church,
  BaseFactory.Camp,
  BaseFactory.Ship
];
