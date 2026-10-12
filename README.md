# 《战争进化史 3D》（Age of War 3D）

> **项目目标**：100% 纯前端 3D 还原经典即时对决神作《战争进化史》。玩家与 AI 各自坐拥一座文明要塞，横跨 **史前石器、中世纪铁血、文艺复兴火药、现代工业战争、未来量子科幻** 5 大时代，通过采集资源、训练兵种、建造要塞防御塔、释放全屏毁灭大招摧毁敌方基地！

---

## 一、当前项目已就绪素材清单

| 资产类型 | 存放路径 / 索引 | 当前包含内容 |
| :--- | :--- | :--- |
| **3D 骨骼模型库** | `models/` | • `Soldier.glb` (现代步兵，含骨骼动作：Idle/Walk/Run)<br>• `RobotExpressive.glb` (未来机甲，含 14 种动作：Walking/Running/Punch/Death等)<br>• `Xbot.glb` (通用骨骼人形机甲) |
| **3D 动作原型演示** | `walk_demo.html` | 验证通过的 3D 角色迈步走动、奔跑冲锋、开火射击、中弹倒地动效 |
| **开源 30 兵种图鉴** | `preview.html` | 涵盖 5 大时代整整 30 个作战单位、防御塔、大招的开源矢量图鉴 |
| **开源 UI 库索引** | `docs/MATERIALS.md` | Kenney UI Pack、Game-Icons.net、Quaternius 3D 带动作模型库全量超链接 |

---

## 二、项目运行方式

本工程采用 **原生模块化 ES Modules (ESM)** 架构，零打包编译成本，即开即测：

```bash
# 进入工程目录
cd age_of_war_3d

# 启动本地开发服务（或双击运行 start_game.bat）
python -m http.server 8080

# 浏览器访问
http://localhost:8080/index.html
```

---

## 三、工程文档导航

- 📘 [技术架构设计方案 (ARCHITECTURE.md)](./docs/ARCHITECTURE.md)
- 📦 [全量已备材料清单 (MATERIALS.md)](./docs/MATERIALS.md)
- 👥 [三人协作分工与多线程开发规范 (COLLABORATION.md)](./docs/COLLABORATION.md)
