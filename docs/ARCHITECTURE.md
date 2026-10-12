# 《战争进化史 3D》技术架构设计说明书

## 1. 架构选型推荐：ECS (Entity-Component-System) + 原生 ESM

### 为什么选择 ECS 架构？
《战争进化史》是一种典型的**同屏多单位即时推线战术游戏**。战场上会同时存在：
- 数十个不同时代的士兵（近战步兵、弓手、火枪手、坦克、机甲）；
- 几十发不同轨迹的投射物（抛物线石块、瞬发穿甲弹、跟踪导弹、聚合激光）；
- 双方要塞、防御哨塔与全屏自然灾害。

如果采用传统的“大类继承（OOP Class Unit extends Entity）”，代码很快会膨胀失控。
采用 **ECS（实体-组件-系统）** 模式，具有极致的解耦能力与高性能：
- **Entity（实体）**：仅仅是一个唯一的 ID（如 `unit_101`, `bullet_42`）；
- **Component（纯数据组件）**：
  - `TransformComponent`（3D 位置、朝向、行进轴坐标）
  - `MovementComponent`（基础移速、当前速度、目标方向）
  - `CombatComponent`（生命值、攻击力、攻击距离、攻击间隔、阵营标识 player/enemy）
  - `RenderComponent`（Three.js 的 Mesh / Group 引用、AnimationMixer 骨骼动画控制器）
- **System（逻辑驱动系统）**：
  - `MovementSystem`（只负责计算行进、前方友军排队防穿模）
  - `CombatSystem`（只负责索敌、射程判定、伤害结算与攻击动作触发）
  - `ProjectileSystem`（只负责子弹与箭矢的弹道飞行与命中碰撞）
  - `RenderSystem`（负责 Three.js 场景对象位置同步与骨骼动画混合）

---

## 2. 工程目录结构规范

```
age_of_war_3d/
├── index.html                  # 游戏主入口（包含 Canvas 与游戏 HUD DOM）
├── README.md                   # 项目总览
├── docs/                       # 项目架构与设计文档
│   ├── ARCHITECTURE.md         # 技术架构设计说明书（本文档）
│   ├── MATERIALS.md            # 全量材料与开源资产清单
│   └── COLLABORATION.md        # 三人协同开发分工流水线
├── models/                     # 3D 骨骼模型（.glb 格式）
│   ├── Soldier.glb             # 现代突击步兵
│   ├── RobotExpressive.glb     # 未来量子战斗机甲
│   └── Xbot.glb                # 通用人形测试机甲
├── src/                        # 原生模块化 ESM 源代码
│   ├── main.js                 # 游戏启动主入口与主循环初始化
│   ├── config/                 # 游戏配置（5大时代数值表、兵种数据、防御塔数据）
│   │   ├── eras.js             # 时代定义与升级经验表
│   │   └── units.js            # 30大兵种攻防血量速查表
│   ├── core/                   # 引擎核心底座
│   │   ├── Game.js             # 游戏总状态管理器与主时钟 Loop
│   │   ├── SceneManager.js     # Three.js 场景、相机、光影与渲染器管理
│   │   └── EventBus.js         # 全局发布订阅事件总线
│   ├── ecs/                    # ECS 核心架构
│   │   ├── EntityManager.js    # 实体的创建、销毁与生命周期查询
│   │   └── Components.js       # Transform, Health, Attack, Team 等组件定义
│   ├── systems/                # 业务逻辑系统
│   │   ├── MovementSystem.js   # 兵线推进、寻路排队与防重叠
│   │   ├── CombatSystem.js     # 索敌、攻击判断、伤害扣除
│   │   ├── ProjectileSystem.js # 弹道抛物线、射线与爆炸反馈
│   │   ├── EconomySystem.js    # 金币自然增长、击杀奖励与时代升级
│   │   └── AISystem.js         # 敌方要塞自动出兵与决策大脑
│   ├── visual/                 # 视觉表现与特效
│   │   ├── Terrain.js          # 160米战场长廊、道路与地形环境
│   │   ├── Fortress.js         # 双方要塞与时代外观变迁
│   │   ├── AnimationDirector.js# 骨骼动作切换、平滑过渡融混控制器
│   │   └── ParticleVFX.js      # 枪口火花、扬尘、受击爆炸与光刃残影
│   ├── ui/                     # 界面控制
│   │   ├── UIManager.js        # DOM HUD 同步更新（金币、经验、血条）
│   │   ├── SpawnMenu.js        # 底部造兵按钮栏与冷却蒙版
│   │   └── DamageText.js       # 3D 空间伤害浮动飘字
│   └── audio/                  # 音频引擎
│       └── SoundFX.js          # Web Audio API 合成声音系统
```

---

## 3. 核心游戏循环（Game Loop）执行时序

每一帧（60 FPS）中严格遵循以下执行流水线：
1. **Input Phase**：捕获玩家点击出兵、升级、施放技能指令；
2. **Economy Phase**：计算金币秒增长，更新基地经济状态；
3. **AI Phase**：敌方要塞 AI 评估当前战况，决定出兵或升级；
4. **Movement Phase**：各单位计算位移，前沿碰撞检测与队形推挤；
5. **Combat Phase**：索敌范围检测，进入射程触发挥刀/开火，发射投射物；
6. **Projectile & VFX Phase**：更新子弹飞行轨迹，检测命中，激发爆炸粒子；
7. **Render Phase**：Three.js 同步所有 3D 模型骨骼姿态与网格空间坐标；
8. **UI Sync Phase**：更新顶部金币条、经验进度条、基地血条与伤害飘字。
