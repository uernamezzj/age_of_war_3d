# 《战争进化史 3D》已备材料与资产库清单

本文件汇总了项目当前已经就绪的全部素材、模型骨骼、动作清单及各大开源源站导航。

---

## 一、本地已下载与就绪资产

### 1. 3D 骨骼动画模型库 (`models/`)
| 模型文件名 | 文件大小 | 时代对应 | 内置完整骨骼动作清单 |
| :--- | :--- | :--- | :--- |
| **`Soldier.glb`** | 2.16 MB | 现代战争 | • `Idle` (待机警戒)<br>• `Walk` (迈步巡逻行军)<br>• `Run` (全速奔跑冲锋)<br>• `TPose` (基础姿势) |
| **`RobotExpressive.glb`** | 0.46 MB | 未来科技 | 包含整整 14 种骨骼动作：<br>• `Walking` (行走)<br>• `Running` (奔跑)<br>• `Punch` (近战挥拳/重击)<br>• `Death` (倒地阵亡)<br>• `Jump` (跳跃)<br>• `Dance` (胜利欢呼)<br>• `Idle`, `Wave`, `Yes`, `No`, `ThumbsUp` 等 |
| **`Xbot.glb`** | 2.93 MB | 通用/中世纪备选 | 工业标准骨骼人形，支持 Mixamo 动作无缝映射 |

### 2. 动效与画廊原型验证文件
- **`walk_demo.html`**：
  验证通过的 3D 实战战场原型。实现了向前真实物理位移、扬尘粒子、脚步声、步枪射击闪光、激光发射、子弹弹道命中爆炸与 3 种电影镜头模式。
- **`preview.html`**：
  30 个时代兵种的开源高清矢量图鉴展示页。

---

## 二、5 大时代 30 个作战单位规划表

| 时代序号与名称 | 近战兵种 (Melee) | 远程兵种 (Ranged) | 重装核心 (Heavy) | 专属防御塔 (Tower) | 时代终极技能 (Ultimate) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **① 原始石器时代** | 棒槌野人 | 弹弓投石手 | 恐龙/猛犸骑兵 | 巨石投石塔 | 天降流星雨 (Meteor) |
| **② 中世纪铁血时代** | 十字重剑士 | 长弓神射手 | 皇家重装骑兵 | 重型穿甲床弩塔 | 漫天箭雨 (Arrow Storm) |
| **③ 文艺复兴火器时代** | 线膛枪刺刀兵 | 双枪近卫哨骑 | 前膛野战加农炮 | 迫击重炮要塞塔 | 皇家炮火齐射 (Artillery) |
| **④ 现代工业战争时代** | 战术突击步兵 | 标枪火箭筒手 | 钢铁洪流主战坦克 | 密集阵多管近防炮 | 幽灵地毯轰炸 (Carpet Bomb) |
| **⑤ 未来量子星际时代** | 离子光刃兵 | 磁暴狙击机兵 | 终极泰坦重型机甲 | 激光聚合方尖碑 | 天基轨道死光 (Orbital Beam) |

---

## 三、推荐后续补充调用的开源库索引 (100% 免费免版权)

1. **Quaternius 3D 带动作模型库 (CC0)**
   - 恐龙与史前动物：`https://quaternius.com/packs/animateddinosaurs.html`
   - 人物与野人原型：`https://quaternius.com/packs/animatedmen.html`
   - 中世纪重装骑士：`https://quaternius.com/packs/knightcharacter.html`
   - 现代枪战士兵：`https://quaternius.com/packs/toonshootergamekit.html`
   - 坦克装甲部队：`https://quaternius.com/packs/animatedtanks.html`
   - 重型双足机甲：`https://quaternius.com/packs/animatedmech.html`
   - 基地防卫炮塔：`https://quaternius.com/packs/turretpack.html`
2. **Kenney UI Packs (CC0)**
   - 通用精品 UI 套件：`https://kenney.nl/assets/ui-pack`
   - 中世纪复古扩展包：`https://kenney.nl/assets/ui-pack-rpg-expansion`
   - 赛博科幻扩展包：`https://kenney.nl/assets/ui-pack-sci-fi`
3. **Adobe Mixamo 动作捕捉库 (免费商用)**
   - 动作在线绑定与预览：`https://www.mixamo.com/`
