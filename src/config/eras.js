/**
 * 5 大文明时代定义与演进要求
 */
export const ERAS = [
  {
    id: 1,
    key: 'stone',
    name: '史前石器时代',
    englishName: 'Stone Age',
    expRequired: 4000,
    themeColor: '#e07a5f',
    fogColor: 0x2b1d14,
    skyColor: 0x87CEEB,
    turretSlots: 1,
    baseHealth: 500,
    ultimate: {
      id: 'meteor',
      name: '天降陨石雨',
      cooldown: 45,
      damage: 150,
      desc: '召唤史前天降陨石，轰击战场上的所有敌方单位'
    }
  },
  {
    id: 2,
    key: 'castle',
    name: '中世纪铁血时代',
    englishName: 'Castle Age',
    expRequired: 14000,
    themeColor: '#81b29a',
    fogColor: 0x182825,
    skyColor: 0x6495ED,
    turretSlots: 2,
    baseHealth: 1200,
    ultimate: {
      id: 'arrow_storm',
      name: '漫天箭雨',
      cooldown: 50,
      damage: 350,
      desc: '无数带火羽箭从天而降，消灭整波军团'
    }
  },
  {
    id: 3,
    key: 'gunpowder',
    name: '文艺复兴火药时代',
    englishName: 'Gunpowder Age',
    expRequired: 45000,
    themeColor: '#f2cc8f',
    fogColor: 0x2b261b,
    skyColor: 0x708090,
    turretSlots: 2,
    baseHealth: 2500,
    ultimate: {
      id: 'artillery',
      name: '皇家炮火齐射',
      cooldown: 55,
      damage: 800,
      desc: '后方重炮集群连续齐射轰炸，让敌阵化为火海'
    }
  },
  {
    id: 4,
    key: 'modern',
    name: '现代工业战争时代',
    englishName: 'Modern Warfare',
    expRequired: 200000,
    themeColor: '#6a994e',
    fogColor: 0x1b2617,
    skyColor: 0x4682B4,
    turretSlots: 3,
    baseHealth: 6000,
    ultimate: {
      id: 'carpet_bomb',
      name: '幽灵地毯轰炸',
      cooldown: 60,
      damage: 2000,
      desc: '隐身战略轰炸机掠空投掷大量凝固汽油弹'
    }
  },
  {
    id: 5,
    key: 'scifi',
    name: '未来量子科幻纪元',
    englishName: 'Cyber / Sci-Fi Era',
    expRequired: 0, // 满级
    themeColor: '#00b4d8',
    fogColor: 0x0f1c2e,
    skyColor: 0x191970,
    turretSlots: 4,
    baseHealth: 15000,
    ultimate: {
      id: 'orbital_cannon',
      name: '天基轨道离子死光',
      cooldown: 70,
      damage: 5000,
      desc: '外太空近地卫星阵列聚焦发射天基高能死光'
    }
  }
];
