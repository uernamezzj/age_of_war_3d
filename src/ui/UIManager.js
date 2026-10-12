/**
 * UIManager.js - 经典木质 UI 界面调度器 (1:1 映射 ref1.png 及 ActionMenu.cs / UnitLoadingMenu.cs)
 */

import { UnitFactory } from '../model/UnitFactory.js';
import { TurretFactory } from '../model/TurretFactory.js';
import { BaseFactory } from '../model/BaseFactory.js';

export class UIManager {
  constructor(gameManager, container) {
    this.gm = gameManager;
    this.container = container;
    window.UnitFactory = UnitFactory;
    window.TurretFactory = TurretFactory;
    window.uiManager = this;
    window.gameManager = gameManager;

    // 当前右侧菜单模式: 'main' | 'units' | 'turrets'
    this.menuMode = 'main';

    // 3D 射线拾取与防御塔出售模式引擎
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isSellingMode = false;
    this.hoveredSlotIdx = null;

    this.root = null;
    this.initDOM();
  }

  initDOM() {
    this.root = document.createElement('div');
    this.root.id = 'aow-ui-root';
    this.root.innerHTML = `
      <!-- 顶部整体 HUD 容器 -->
      <div class="aow-top-hud">
        
        <!-- 左侧金币与经验看板 (top_ui_bg_left.png) -->
        <div class="aow-wood-board aow-board-left">
          <div class="aow-stat-row">
            <span class="aow-gold-coin">🪙</span>
            <span id="aow-gold-val" class="aow-stat-val font-gold">175</span>
          </div>
          <div class="aow-stat-row">
            <span class="aow-stat-label">经验:</span>
            <span id="aow-exp-val" class="aow-stat-val font-exp">0</span>
          </div>
          <div class="aow-stat-row aow-unit-limit-row">
            <span class="aow-stat-label">人口:</span>
            <span id="aow-unit-count" class="aow-stat-val font-army">0 / 10</span>
          </div>
          <div class="aow-board-btn-row">
            <button class="aow-reset-btn" id="btn-pause-hud" title="暂停游戏 (按 ESC)">
              ⏸️ 暂停
            </button>
            <button class="aow-reset-btn" id="btn-reset-game" title="从时代 1 重新开始">
              🔄 重置
            </button>
          </div>
        </div>

        <!-- 中央造兵排队队列 (5格排队槽 + 充能进度条) -->
        <div class="aow-queue-board">
          <div class="aow-queue-slots">
            <div class="aow-queue-slot" id="slot-0"></div>
            <div class="aow-queue-slot" id="slot-1"></div>
            <div class="aow-queue-slot" id="slot-2"></div>
            <div class="aow-queue-slot" id="slot-3"></div>
            <div class="aow-queue-slot" id="slot-4"></div>
          </div>
          <div class="aow-progress-bar-wrap">
            <div id="aow-progress-fill" class="aow-progress-fill"></div>
          </div>
        </div>

        <!-- 右侧木质操作控制台 (top_ui_bg_right.png) -->
        <div class="aow-wood-board aow-board-right">
          <!-- 悬停即时提示文字栏 -->
          <div id="aow-tooltip" class="aow-tooltip-bar">训练派遣士兵</div>
          
          <!-- 1. 一级主菜单 -->
          <div id="aow-menu-main" class="aow-btn-row">
            <button class="aow-wood-btn" id="btn-menu-units" title="训练派遣士兵">
              <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/units.png" alt="Units">
            </button>
            <button class="aow-wood-btn" id="btn-menu-turrets" title="建造防御塔">
              <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_buy.png" alt="Turrets">
            </button>
            <button class="aow-wood-btn" id="btn-sell-turret" title="出售防御塔">
              <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_sell.png" alt="Sell">
            </button>
            <button class="aow-wood-btn" id="btn-buy-expansion" title="扩建防御塔位">
              <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/expansion_buy.png" alt="Expansion">
            </button>
            <button class="aow-wood-btn" id="btn-evolve" title="进化至下一时代">
              <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/evolve.png" alt="Evolve">
            </button>
          </div>

          <!-- 2. 二级出兵菜单 -->
          <div id="aow-menu-units" class="aow-btn-row" style="display:none;">
            <button class="aow-wood-btn aow-unit-btn" id="btn-buy-unit-0" data-unit="0">
              <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_1_1.png" alt="原始棍棒手">
            </button>
            <button class="aow-wood-btn aow-unit-btn" id="btn-buy-unit-1" data-unit="1">
              <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_1_2.png" alt="弹弓猎手">
            </button>
            <button class="aow-wood-btn aow-unit-btn" id="btn-buy-unit-2" data-unit="2">
              <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_1_3.png" alt="恐龙骑兵">
            </button>
            <button class="aow-wood-btn aow-unit-btn" id="btn-buy-unit-3" data-unit="3" style="display:none;" title="超级特种兵">
              <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/unit_5_4.png" alt="超级特种兵">
            </button>
            <button class="aow-wood-btn" id="btn-units-back" title="返回上一级">
              <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/back.png" alt="返回">
            </button>
          </div>

          <!-- 3. 二级造塔菜单 -->
          <div id="aow-menu-turrets" class="aow-btn-row" style="display:none;">
            <button class="aow-wood-btn aow-turret-btn" id="btn-buy-turret-0" data-turret="0">
              <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_1_1.png" alt="投石索">
            </button>
            <button class="aow-wood-btn aow-turret-btn" id="btn-buy-turret-1" data-turret="1">
              <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_1_2.png" alt="原始投蛋机">
            </button>
            <button class="aow-wood-btn aow-turret-btn" id="btn-buy-turret-2" data-turret="2">
              <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_1_3.png" alt="重型投石机">
            </button>
            <button class="aow-wood-btn" id="btn-turrets-sell-sub" title="出售防御塔">
              <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/turret_sell.png" alt="出售">
            </button>
            <button class="aow-wood-btn" id="btn-turrets-back" title="返回上一级">
              <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Buttons/back.png" alt="返回">
            </button>
          </div>
        </div>

        <!-- 右侧下方槽位状态指示与快速换装条 -->
        <div id="aow-turret-slots-bar" class="aow-turret-slots-bar">
          <div class="aow-slots-title">防御塔槽位</div>
          <div id="aow-slots-list" class="aow-slots-list"></div>
        </div>

        <!-- 右侧下方悬挂的 Special 大招按钮 (Volcano eruption) 与 Speed Buff 指示器 -->
        <div class="aow-special-box">
          <div class="aow-special-label">终极大招</div>
          <button class="aow-special-btn" id="btn-special" title="释放当前时代终极大招">
            <img src="./AgeOfWarRemake/Assets/Resources/Sprites/Specials/1.png" alt="Special">
            <div id="aow-special-overlay" class="aow-special-cd-overlay"></div>
            <span id="aow-special-timer" class="aow-special-timer"></span>
          </button>

        </div>

      </div>

      <!-- 基地边缘竖向生命槽 (1:1 还原 ref1.png 原版红绿竖条) -->
      <div class="aow-base-hp-bar aow-player-hp-bar">
        <div class="aow-hp-label">我方要塞</div>
        <div class="aow-vertical-bar">
          <div id="aow-player-hp-fill" class="aow-vertical-fill"></div>
        </div>
        <div id="aow-player-hp-text" class="aow-hp-num">500</div>
      </div>

      <div class="aow-base-hp-bar aow-enemy-hp-bar">
        <div class="aow-hp-label">敌方要塞</div>
        <div class="aow-vertical-bar">
          <div id="aow-enemy-hp-fill" class="aow-vertical-fill"></div>
        </div>
        <div id="aow-enemy-hp-text" class="aow-hp-num">500</div>
      </div>

      <!-- 游戏结束结算面板 -->
      <div id="aow-gameover-modal" class="aow-modal" style="display:none;">
        <div class="aow-modal-content">
          <h1 id="aow-gameover-title">战役大捷！</h1>
          <p id="aow-gameover-desc">你已摧毁敌军要塞，征服了整个时代战场！</p>
          <button id="btn-restart" class="aow-modal-btn">再战一局</button>
        </div>
      </div>
    `;

    this.container.appendChild(this.root);
    this.injectStyles();
    this.bindEvents();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --ui-scale: 1;
      }

      #aow-ui-root {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        user-select: none;
        font-family: 'Arial Black', Impact, sans-serif;
        color: #fff;
        z-index: 100;
      }

      /* 顶部总容器 (基于 --ui-scale 动态全屏等比缩放，对齐 1024x515 黄金比例标杆) */
      .aow-top-hud {
        position: absolute;
        top: 8px;
        left: 14px;
        right: 14px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        zoom: var(--ui-scale);
      }

      /* 木质看板通用背景 */
      .aow-wood-board {
        pointer-events: auto;
        position: relative;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        filter: drop-shadow(0 6px 12px rgba(0,0,0,0.6));
      }

      .aow-board-left {
        width: 190px;
        min-height: 84px;
        background-image: url('./AgeOfWarRemake/Assets/Resources/Sprites/Panels/top_ui_bg_left.png');
        padding: 6px 14px 8px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 3px;
      }

      .aow-reset-btn {
        margin-top: 3px;
        background: linear-gradient(180deg, #92400e, #451a03);
        border: 2px solid #f59e0b;
        color: #fef08a;
        font-family: inherit;
        font-size: 12px;
        font-weight: 900;
        padding: 3px 6px;
        border-radius: 5px;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.6);
        text-shadow: 1px 1px 2px #000;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }
      .aow-reset-btn:hover {
        filter: brightness(1.25);
        transform: scale(1.02);
        border-color: #fef08a;
        color: #fff;
      }

      .aow-stat-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 900;
        text-shadow: 1px 1px 2px #000;
      }
      .font-gold { color: #fde047; }
      .font-exp { color: #60a5fa; }
      .font-army { color: #a7f3d0; }
      .aow-stat-label { font-size: 13px; color: #cbd5e1; }
      .aow-board-btn-row {
        display: flex;
        gap: 4px;
        margin-top: 3px;
        width: 100%;
      }

      .aow-speed-badge {
        position: absolute;
        bottom: -28px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #0891b2, #06b6d4);
        border: 2px solid #67e8f9;
        border-radius: 12px;
        padding: 2px 8px;
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 900;
        color: #fff;
        box-shadow: 0 0 10px rgba(6, 182, 212, 0.7);
        animation: pulse-speed 1s infinite alternate;
        white-space: nowrap;
        pointer-events: none;
      }
      .aow-speed-badge img {
        width: 14px;
        height: 14px;
      }
      @keyframes pulse-speed {
        from { transform: translateX(-50%) scale(0.95); box-shadow: 0 0 6px #06b6d4; }
        to { transform: translateX(-50%) scale(1.05); box-shadow: 0 0 14px #67e8f9; }
      }

      .aow-special-btn.powerup-ready {
        box-shadow: 0 0 20px #f59e0b, 0 0 35px #fef08a !important;
        animation: special-glow 0.8s infinite alternate !important;
      }
      @keyframes special-glow {
        from { filter: brightness(1.0); transform: scale(1.0); }
        to { filter: brightness(1.4); transform: scale(1.06); }
      }

      
      /* 炮塔槽位快捷管理条样式 (避免与 Special 大招抽屉右侧重叠) */
      .aow-turret-slots-bar {
        position: absolute;
        top: 92px;
        right: 86px;
        background: rgba(30, 15, 8, 0.92);
        border: 2px solid #b45309;
        border-radius: 8px;
        padding: 6px 10px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.7);
        pointer-events: auto;
      }
      .aow-slots-title {
        font-size: 11px;
        font-weight: 900;
        color: #fde047;
        letter-spacing: 0.5px;
        text-shadow: 1px 1px 2px #000;
        text-align: center;
      }
      .aow-slots-list {
        display: flex;
        gap: 6px;
      }
      .aow-slot-card {
        width: 64px;
        min-height: 44px;
        background: linear-gradient(180deg, #451a03, #291002);
        border: 1.5px solid #d97706;
        border-radius: 5px;
        padding: 3px 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;
        transition: all 0.15s ease;
      }
      .aow-slot-card:hover {
        transform: translateY(-2px);
        filter: brightness(1.2);
        border-color: #fef08a;
      }
      .aow-slot-card.locked {
        opacity: 0.55;
        border-color: #64748b;
        background: #1e293b;
      }
      .aow-slot-card.has-turret {
        border-color: #10b981;
      }
      .aow-slot-card.has-turret:hover {
        border-color: #ef4444;
      }
      .aow-slot-num {
        font-size: 10px;
        color: #94a3b8;
      }
      .aow-slot-name {
        font-size: 10px;
        font-weight: 900;
        color: #fff;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 58px;
      }
      .aow-slot-sell-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 15px;
        height: 15px;
        background: #dc2626;
        border: 1px solid #fecaca;
        color: #fff;
        border-radius: 50%;
        font-size: 10px;
        line-height: 14px;
        text-align: center;
        font-weight: 900;
        box-shadow: 0 1px 3px rgba(0,0,0,0.8);
      }

      /* 中央排队队列 */
      .aow-queue-board {
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        margin-top: 6px;
      }

      .aow-queue-slots {
        display: flex;
        gap: 6px;
      }

      .aow-queue-slot {
        width: 22px;
        height: 22px;
        border: 2px solid #3e2723;
        background: rgba(30, 20, 10, 0.85);
        border-radius: 4px;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.8);
        transition: all 0.2s;
      }
      .aow-queue-slot.active {
        background: #f59e0b;
        border-color: #fbbf24;
        box-shadow: 0 0 8px #f59e0b;
      }

      .aow-progress-bar-wrap {
        width: 136px;
        height: 10px;
        background: rgba(20, 15, 10, 0.9);
        border: 2px solid #5d4037;
        border-radius: 6px;
        overflow: hidden;
      }
      .aow-progress-fill {
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #f59e0b, #10b981);
        transition: width 0.05s linear;
      }

      /* 右侧木质操作控制台 */
      .aow-board-right {
        width: 280px;
        height: 82px;
        background-image: url('./AgeOfWarRemake/Assets/Resources/Sprites/Panels/top_ui_bg_right.png');
        padding: 6px 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .aow-tooltip-bar {
        font-size: 11px;
        color: #fef08a;
        text-shadow: 1px 1px 1px #000;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        height: 14px;
        text-align: right;
        padding-right: 4px;
      }

      .aow-btn-row {
        display: flex;
        gap: 6px;
        justify-content: flex-end;
      }

      .aow-wood-btn {
        width: 42px;
        height: 42px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        outline: none;
        transition: transform 0.1s, filter 0.1s;
      }
      .aow-wood-btn:hover {
        transform: scale(1.08);
        filter: brightness(1.2);
      }
      .aow-wood-btn:active {
        transform: scale(0.95);
      }
      .aow-wood-btn img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      /* Special 抽屉大招 */
      .aow-special-box {
        pointer-events: auto;
        position: absolute;
        top: 90px;
        right: 0px;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(30, 20, 15, 0.85);
        border: 2px solid #78350f;
        border-radius: 8px;
        padding: 4px 6px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.6);
      }

      .aow-special-label {
        font-size: 10px;
        color: #f59e0b;
        letter-spacing: 1px;
        margin-bottom: 2px;
      }

      .aow-special-btn {
        width: 50px;
        height: 50px;
        position: relative;
        background: none;
        border: 2px solid #b45309;
        border-radius: 6px;
        cursor: pointer;
        padding: 0;
        overflow: hidden;
      }
      .aow-special-btn img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .aow-special-cd-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 0%;
        background: rgba(0, 0, 0, 0.75);
        transition: height 0.1s;
      }
      .aow-special-timer {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 14px;
        font-weight: 900;
        color: #fff;
        text-shadow: 1px 1px 3px #000;
      }

      /* 基地竖向血量槽 (1:1 ref1.png) */
      .aow-base-hp-bar {
        position: absolute;
        bottom: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        pointer-events: auto;
        zoom: var(--ui-scale);
      }
      .aow-player-hp-bar { left: 24px; }
      .aow-enemy-hp-bar { right: 24px; }

      .aow-hp-label {
        font-size: 11px;
        color: #e2e8f0;
        text-shadow: 1px 1px 2px #000;
      }

      .aow-vertical-bar {
        width: 18px;
        height: 180px;
        background: rgba(15, 23, 42, 0.9);
        border: 2px solid #334155;
        border-radius: 4px;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 8px rgba(0,0,0,0.7);
      }
      .aow-vertical-fill {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(0deg, #ef4444, #22c55e);
        transition: height 0.15s ease-out;
      }
      .aow-hp-num {
        font-size: 14px;
        font-weight: 900;
        color: #f8fafc;
        text-shadow: 1px 1px 3px #000;
      }

      /* 结算弹窗 */
      .aow-modal {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.75);
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: auto;
      }
      .aow-modal-content {
        background: linear-gradient(135deg, #2d1810, #1a0f0a);
        border: 3px solid #d97706;
        padding: 30px 50px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.9);
      }
      .aow-modal-content h1 {
        font-size: 42px;
        color: #fbbf24;
        margin-bottom: 12px;
        text-shadow: 2px 2px 4px #000;
      }
      .aow-modal-content p {
        font-size: 18px;
        color: #cbd5e1;
        margin-bottom: 24px;
      }
      .aow-modal-btn {
        background: linear-gradient(180deg, #f59e0b, #d97706);
        border: 2px solid #fef3c7;
        color: #000;
        font-weight: 900;
        font-size: 18px;
        padding: 10px 32px;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      }
      .aow-modal-btn:hover {
        filter: brightness(1.15);
      }

      /* === 卖出模式：大号金色/绿色美元光标 === */
      body.sell-turret-mode,
      body.sell-turret-mode * {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" fill="%2316a34a" stroke="%23facc15" stroke-width="3.5" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.8))"/><text x="22" y="29" font-family="Arial Black, Impact, sans-serif" font-size="26" font-weight="900" fill="%23fef08a" text-anchor="middle" filter="drop-shadow(0 2px 2px rgba(0,0,0,0.9))">$</text></svg>') 22 22, crosshair !important;
      }

      .selling-active {
        animation: sell-pulse 0.8s infinite alternate !important;
        border-color: #facc15 !important;
        box-shadow: 0 0 18px rgba(250, 204, 21, 0.9) !important;
      }
      @keyframes sell-pulse {
        0% { transform: scale(1); filter: brightness(1.1); }
        100% { transform: scale(1.08); filter: brightness(1.5); }
      }

      #aow-sell-cursor-hud {
        position: fixed;
        pointer-events: none;
        z-index: 99999;
        background: rgba(15, 23, 42, 0.95);
        border: 2px solid #facc15;
        border-radius: 8px;
        padding: 6px 14px;
        color: #fef08a;
        font-family: 'Arial Black', Impact, sans-serif;
        font-size: 13px;
        font-weight: 900;
        text-shadow: 1px 1px 2px #000;
        box-shadow: 0 6px 20px rgba(0,0,0,0.8);
        transform: translate(25px, 20px);
        display: none;
        white-space: nowrap;
        transition: border-color 0.15s, color 0.15s;
      }
    `;
    document.head.appendChild(style);
  }

  bindEvents() {
    const tooltip = document.getElementById('aow-tooltip');
    const setTooltip = (text) => { tooltip.textContent = text; };

    // 基础界面 UI 全局响应式等比缩放引擎 (基于 1024x515 标杆像素对齐)
    this.updateUIScale();
    window.addEventListener('resize', () => this.updateUIScale());

    // 0. 顶部 HUD 暂停按钮
    const pauseBtn = document.getElementById('btn-pause-hud');
    if (pauseBtn) {
      pauseBtn.onclick = () => {
        if (window.menuManager) {
          window.menuManager.togglePause();
        }
      };
      pauseBtn.onmouseenter = () => setTooltip("暂停游戏 (按 ESC 键)");
    }

    // 0.1 从零重置游戏
    const resetBtn = document.getElementById('btn-reset-game');
    if (resetBtn) {
      resetBtn.onclick = () => {
        this.gm.resetGame();
        this.renderTurretSlotsBar();
        setTooltip("战役已从第一时代重新开始！");
        const modal = document.getElementById('aow-gameover-modal');
        if (modal) modal.style.display = 'none';
      };
      resetBtn.onmouseenter = () => setTooltip("从时代 1 重新开始战役");
    }

    // 1. 切换到 Units 菜单
    document.getElementById('btn-menu-units').onclick = () => {
      this.switchMenu('units');
    };
    document.getElementById('btn-menu-units').onmouseenter = () => setTooltip("训练派遣士兵");

    // 2. 切换到 Turrets 菜单
    document.getElementById('btn-menu-turrets').onclick = () => {
      this.switchMenu('turrets');
    };
    document.getElementById('btn-menu-turrets').onmouseenter = () => setTooltip("建造防御塔");

    // 创建鼠标跟随出售 HUD
    if (!document.getElementById('aow-sell-cursor-hud')) {
      const sellHud = document.createElement('div');
      sellHud.id = 'aow-sell-cursor-hud';
      document.body.appendChild(sellHud);
      this.sellHud = sellHud;
    } else {
      this.sellHud = document.getElementById('aow-sell-cursor-hud');
    }

    // 3. 出售炮塔：点击进入“大美元光标”选塔出售模式
    const toggleSell = () => {
      if (this.isSellingMode) {
        this.exitSellMode();
      } else {
        this.enterSellMode();
      }
    };
    const sellBtn = document.getElementById('btn-sell-turret');
    if (sellBtn) {
      sellBtn.onclick = toggleSell;
      sellBtn.onmouseenter = () => setTooltip(this.isSellingMode ? "点击退出出售模式" : "出售防御塔 (点击后点选要出售的防御塔)");
    }
    const sellSubBtn = document.getElementById('btn-turrets-sell-sub');
    if (sellSubBtn) {
      sellSubBtn.onclick = toggleSell;
      sellSubBtn.onmouseenter = () => setTooltip(this.isSellingMode ? "点击退出出售模式" : "出售防御塔 (点击后点选要出售的防御塔)");
    }

    // 全局出售模式指针与按键监听
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isSellingMode) {
        this.exitSellMode();
      }
    });
    window.addEventListener('contextmenu', (e) => {
      if (this.isSellingMode) {
        e.preventDefault();
        this.exitSellMode();
      }
    });

    // 4. 解锁炮塔槽位
    document.getElementById('btn-buy-expansion').onclick = () => {
      const base = this.gm.baseAlly;
      const cost = BaseFactory.ExpansionCosts[base.unlockedExpansions - 1] || 1000;
      if (base.unlockedExpansions >= base.maxExpansions) {
        setTooltip("所有防御塔槽位已全部解锁！");
      } else if (base.money < cost) {
        setTooltip(`金币不足！解锁新槽位需要 $${cost} 金币。`);
        if (this.gm.onFloatingText) {
          this.gm.onFloatingText(base.position.x + 2.5, 3.2, "金币不足！", '#ef4444');
        }
      } else {
        base.unlockNextExpansion(cost);
        setTooltip(`已成功解锁防御塔槽位 ${base.unlockedExpansions}！`);
        this.renderTurretSlotsBar();
      }
    };
    document.getElementById('btn-buy-expansion').onmouseenter = () => {
      const base = this.gm.baseAlly;
      const cost = BaseFactory.ExpansionCosts[base.unlockedExpansions - 1] || 1000;
      setTooltip(`扩建新防御塔槽位 - 造价 $${cost}`);
    };

    // 5. 时代进化
    document.getElementById('btn-evolve').onclick = () => {
      const base = this.gm.baseAlly;
      if (base.age >= 5) {
        setTooltip("已演进至最终时代！");
        return;
      }
      if (base.exp >= base.config.evolveExpRequired) {
        const ok = this.gm.evolve(true);
        if (ok) {
          setTooltip(`已成功进化至时代 ${this.gm.baseAlly.age} (${this.gm.baseAlly.config.cnName || this.gm.baseAlly.config.name})！`);
        }
      } else {
        setTooltip(`需要达到 ${base.config.evolveExpRequired} 经验值方可进化！`);
      }
    };
    document.getElementById('btn-evolve').onmouseenter = () => {
      const base = this.gm.baseAlly;
      if (base.age >= 5) {
        setTooltip("已演进至最高时代");
      } else {
        const nextConf = BaseFactory.Bases[base.age]();
        setTooltip(`进化至时代 ${base.age + 1} (${nextConf.cnName || nextConf.name}) - 经验: ${base.exp}/${base.config.evolveExpRequired}`);
      }
    };

    // 返回按钮
    document.getElementById('btn-units-back').onclick = () => this.switchMenu('main');
    document.getElementById('btn-turrets-back').onclick = () => this.switchMenu('main');

    // 监听 GameManager 时代进化通知
    this.gm.addAgeListener((newAge) => {
      this.refreshMenusForAge(newAge);
      this.switchMenu('main');
    });

    // 初始化第一时代菜单
    this.refreshMenusForAge(1);
    this.renderTurretSlotsBar();

    // 释放大招 (支持 1~5 时代专属特技)
    document.getElementById('btn-special').onclick = () => {
      const nowSec = performance.now() / 1000;
      const currentAge = this.gm.baseAlly ? this.gm.baseAlly.age : 1;
      const success = this.gm.specialAttackManager.triggerSpecial(nowSec, currentAge);
      if (success) {
        setTooltip(`终极大招【${this.gm.baseAlly.config.special.cnName || this.gm.baseAlly.config.special.name}】已释放！`);
      }
    };
    document.getElementById('btn-special').onmouseenter = () => {
      const sp = this.gm.baseAlly.config.special;
      setTooltip(`终极大招: ${sp.cnName || sp.name}`);
    };

    // 重玩按钮 (一键 resetGame)
    document.getElementById('btn-restart').onclick = () => {
      this.gm.resetGame();
        this.renderTurretSlotsBar();
      const modal = document.getElementById('aow-gameover-modal');
      if (modal) modal.style.display = 'none';
    };
  }

  // 刷新指定时代的兵种菜单、炮塔菜单与大招图标 (1:1 映射 ActionMenu.cs Initialize)
  refreshMenusForAge(age) {
    const tooltip = document.getElementById('aow-tooltip');
    const setTooltip = (text) => { tooltip.textContent = text; };

    // 1. 刷新兵种菜单 (时代 1~4 为 3 种兵，时代 5 包含第 4 兵种 Trooper4 超级特种兵)
    const unitConfigs = UnitFactory.getUnitsByAge(age);
    for (let i = 0; i < 4; i++) {
      const btn = document.getElementById(`btn-buy-unit-${i}`);
      if (!btn) continue;
      if (i < unitConfigs.length) {
        btn.style.display = 'flex';
        const conf = unitConfigs[i]();
        const img = btn.querySelector('img');
        if (img) {
          img.src = conf.icon;
          img.alt = conf.displayName;
        }
        btn.onclick = () => {
          const base = this.gm.baseAlly;
          if (base.money < conf.cost) {
            setTooltip(`金币不足！(${conf.cnName || conf.displayName} 需要 $${conf.cost} 金币)`);
            if (this.gm.onFloatingText) {
              this.gm.onFloatingText(base.position.x + 2.5, 3.2, "金币不足！", '#ef4444');
            }
            return;
          }
          const queued = this.gm.loadingManager.enqueue(conf);
          if (queued) {
            base.money -= conf.cost;
          } else {
            setTooltip("训练队列已满 (最多 5 人)！");
          }
        };
        btn.onmouseenter = () => setTooltip(`${conf.cnName || conf.displayName} - 费用: $${conf.cost}`);
      } else {
        btn.style.display = 'none';
      }
    }

    // 2. 刷新防御塔菜单
    const turretConfigs = TurretFactory.getTurretsByAge(age);
    for (let i = 0; i < 3; i++) {
      const btn = document.getElementById(`btn-buy-turret-${i}`);
      if (!btn) continue;
      const conf = turretConfigs[i]();
      const img = btn.querySelector('img');
      if (img) {
        img.src = conf.icon;
        img.alt = conf.displayName;
      }
      btn.onclick = () => {
        this.buildTurretInteractive(conf);
      };
      btn.onmouseenter = () => setTooltip(`${conf.cnName || conf.displayName} - 费用: $${conf.cost}`);
    }

    // 3. 刷新大招图标
    const specialBtn = document.getElementById('btn-special');
    if (specialBtn) {
      const img = specialBtn.querySelector('img');
      if (img) {
        img.src = `./AgeOfWarRemake/Assets/Resources/Sprites/Specials/${age}.png`;
      }
    }
  }

  switchMenu(mode) {
    this.menuMode = mode;
    document.getElementById('aow-menu-main').style.display = mode === 'main' ? 'flex' : 'none';
    document.getElementById('aow-menu-units').style.display = mode === 'units' ? 'flex' : 'none';
    document.getElementById('aow-menu-turrets').style.display = mode === 'turrets' ? 'flex' : 'none';
  }


  // 购买防御塔：空槽优先，若无空槽则严禁购买并显示“无法购买，已满格”
  buildTurretInteractive(conf) {
    const base = this.gm.baseAlly;
    const tooltip = document.getElementById('aow-tooltip');
    const setTooltip = (text) => { if (tooltip) tooltip.textContent = text; };

    // 1. 寻找未占用的已解锁槽位
    let targetSlot = -1;
    for (let i = 0; i < base.unlockedExpansions; i++) {
      if (base.turretSlots[i] === null) {
        targetSlot = i;
        break;
      }
    }

    // 2. 如果没有空闲槽位 (已满格)，坚决禁止购买并弹出红色醒目提示
    if (targetSlot === -1) {
      if (this.gm.onFloatingText) {
        const basePos = base.position;
        this.gm.onFloatingText(basePos.x + 2.5, basePos.y + 3.2, "无法购买，已满格！", '#ef4444');
      }
      setTooltip("无法购买，已满格！请先扩建新槽位或出售已有防御塔。");
      return;
    }

    // 3. 检查金币是否充足
    if (base.money < conf.cost) {
      if (this.gm.onFloatingText) {
        const basePos = base.position;
        this.gm.onFloatingText(basePos.x + 2.5, basePos.y + 3.2, "金币不足！", '#ef4444');
      }
      setTooltip(`金币不足！建造需要 $${conf.cost} 金币。`);
      return;
    }

    // 4. 有空闲槽位且金币充足，扣除金币并正常建造
    base.money -= conf.cost;
    this.gm.buildTurret(targetSlot, conf, true);
    setTooltip(`已在槽位 ${targetSlot + 1} 建造 ${conf.cnName || conf.displayName}！`);
    if (this.gm.onFloatingText) {
      const slotPos = base.slotPositions[targetSlot] || base.position;
      this.gm.onFloatingText(slotPos.x, slotPos.y + 1.2, `+${conf.cnName || conf.displayName}`, '#fbbf24');
    }
    this.renderTurretSlotsBar();
  }

  // 进入出售防御塔模式 (大美元光标)
  enterSellMode() {
    const base = this.gm.baseAlly;
    let hasAnyTurret = false;
    for (let i = 0; i < base.unlockedExpansions; i++) {
      if (base.turretSlots[i] !== null) {
        hasAnyTurret = true;
        break;
      }
    }

    if (!hasAnyTurret) {
      const tooltip = document.getElementById('aow-tooltip');
      if (tooltip) tooltip.textContent = "当前没有已安装的防御塔可供出售！";
      if (this.gm.onFloatingText) {
        this.gm.onFloatingText(base.position.x + 2.5, base.position.y + 3.0, "无防御塔可出售", '#f59e0b');
      }
      return;
    }

    this.isSellingMode = true;
    document.body.classList.add('sell-turret-mode');

    const sellBtn = document.getElementById('btn-sell-turret');
    if (sellBtn) sellBtn.classList.add('selling-active');
    const sellSubBtn = document.getElementById('btn-turrets-sell-sub');
    if (sellSubBtn) sellSubBtn.classList.add('selling-active');

    if (this.sellHud) {
      this.sellHud.style.display = 'block';
      this.sellHud.textContent = `💲 点击要出售的防御塔 (按 ESC 取消)`;
      this.sellHud.style.borderColor = '#facc15';
      this.sellHud.style.color = '#fef08a';
    }

    const tooltip = document.getElementById('aow-tooltip');
    if (tooltip) tooltip.textContent = "出售模式已开启：请点击要出售的防御塔 (或点击右侧槽位)，按 ESC 取消";
  }

  // 退出出售防御塔模式
  exitSellMode() {
    this.isSellingMode = false;
    document.body.classList.remove('sell-turret-mode');

    const sellBtn = document.getElementById('btn-sell-turret');
    if (sellBtn) sellBtn.classList.remove('selling-active');
    const sellSubBtn = document.getElementById('btn-turrets-sell-sub');
    if (sellSubBtn) sellSubBtn.classList.remove('selling-active');

    if (this.sellHud) {
      this.sellHud.style.display = 'none';
    }

    this.hoveredSlotIdx = null;
    const tooltip = document.getElementById('aow-tooltip');
    if (tooltip) tooltip.textContent = "已退出出售模式";
  }

  // 监听鼠标指针移动：3D 射线拾取防御塔并更新跟随 HUD
  onPointerMove(e) {
    if (!this.isSellingMode) return;

    if (this.sellHud) {
      this.sellHud.style.left = `${e.clientX}px`;
      this.sellHud.style.top = `${e.clientY}px`;
    }

    if (!window.camera || !this.gm.baseAlly) return;

    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, window.camera);

    const base = this.gm.baseAlly;
    let foundSlot = null;

    for (let i = 0; i < base.unlockedExpansions; i++) {
      const turret = base.turretSlots[i];
      if (turret && turret.mesh) {
        const intersects = this.raycaster.intersectObject(turret.mesh, true);
        if (intersects.length > 0) {
          foundSlot = i;
          break;
        }
      }
    }

    this.hoveredSlotIdx = foundSlot;
    if (foundSlot !== null) {
      const t = base.turretSlots[foundSlot];
      const dName = t.config.cnName || t.config.displayName;
      const refund = t.config.sellPrice || Math.floor(t.config.cost * 0.5);
      if (this.sellHud) {
        this.sellHud.textContent = `💲 点击出售 ${dName} (+$${refund})`;
        this.sellHud.style.borderColor = '#4ade80';
        this.sellHud.style.color = '#4ade80';
      }
    } else {
      if (this.sellHud) {
        this.sellHud.textContent = `💲 点击要出售的防御塔 (按 ESC 取消)`;
        this.sellHud.style.borderColor = '#facc15';
        this.sellHud.style.color = '#fef08a';
      }
    }
  }

  // 监听鼠标指针点击：精准出售 3D 拾取到的防御塔
  onPointerDown(e) {
    if (!this.isSellingMode) return;
    if (e.button !== 0) return; // 仅处理鼠标左键

    // 若点击的是 sell 按钮自身，交由 toggleSell 切换处理
    if (e.target.closest('#btn-sell-turret') || e.target.closest('#btn-turrets-sell-sub')) {
      return;
    }

    // 1. 3D 空间射线拾取到了已挂载防御塔 (支持 hovered 缓存与即时点击重新射线检测)
    let slotToSell = this.hoveredSlotIdx;
    if (slotToSell === null && window.camera && this.gm.baseAlly) {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, window.camera);
      const base = this.gm.baseAlly;
      for (let i = 0; i < base.unlockedExpansions; i++) {
        const turret = base.turretSlots[i];
        if (turret && turret.mesh) {
          const intersects = this.raycaster.intersectObject(turret.mesh, true);
          if (intersects.length > 0) {
            slotToSell = i;
            break;
          }
        }
      }
    }

    if (slotToSell !== null) {
      this.sellTurretInteractive(slotToSell);
      this.exitSellMode();
      return;
    }

    // 2. 如果点击的是右侧槽位卡片上的防御塔
    const slotCard = e.target.closest('.aow-slot-card.has-turret');
    if (slotCard) {
      return; // 允许槽位卡片自身的 onclick 触发并退出
    }

    // 3. 点击其它空白区域退出出售模式
    this.exitSellMode();
  }

  // 执行具体防御塔出售逻辑
  sellTurretInteractive(targetSlotIdx = null) {
    const base = this.gm.baseAlly;
    const tooltip = document.getElementById('aow-tooltip');
    const setTooltip = (text) => { if (tooltip) tooltip.textContent = text; };

    // 如果指定了具体槽位进行出售
    if (targetSlotIdx !== null) {
      const turret = base.turretSlots[targetSlotIdx];
      if (turret) {
        const name = turret.config.cnName || turret.config.displayName;
        const refund = base.sellTurret(targetSlotIdx);
        setTooltip(`成功出售 ${name} (槽位 ${targetSlotIdx + 1})，获得 +$${refund}！`);
        if (this.gm.onFloatingText) {
          const slotPos = base.slotPositions[targetSlotIdx] || base.position;
          this.gm.onFloatingText(slotPos.x, slotPos.y + 1.2, `+$${refund}`, '#4ade80');
        }
        this.renderTurretSlotsBar();
      }
      return;
    }

    // 未指定槽位时，默认触发进入出售模式 (大美元光标)
    this.enterSellMode();
  }

  // 渲染右侧防御塔 4 槽位可视化卡片
  renderTurretSlotsBar() {
    const list = document.getElementById('aow-slots-list');
    if (!list || !this.gm.baseAlly) return;
    const base = this.gm.baseAlly;
    list.innerHTML = '';

    for (let i = 0; i < 4; i++) {
      const isUnlocked = i < base.unlockedExpansions;
      const turret = base.turretSlots[i];
      const card = document.createElement('div');
      card.className = `aow-slot-card ${isUnlocked ? (turret ? 'has-turret' : 'empty') : 'locked'}`;

      if (!isUnlocked) {
        card.innerHTML = `
          <span class="aow-slot-num">槽位 ${i + 1}</span>
          <span class="aow-slot-name">🔒 扩建</span>
        `;
        const expCost = BaseFactory.ExpansionCosts[i - 1] || 1000;
        card.title = `未解锁 - 点击消耗 $${expCost} 金币扩建`;
        card.onclick = () => {
          if (base.unlockedExpansions === i) {
            if (base.money >= expCost) {
              base.unlockNextExpansion(expCost);
              this.renderTurretSlotsBar();
            } else {
              setTooltip(`金币不足！需要 $${expCost} 金币扩建。`);
              if (this.gm.onFloatingText) {
                this.gm.onFloatingText(base.position.x + 2.5, 3.2, "金币不足！", '#ef4444');
              }
            }
          } else {
            setTooltip(`请按顺序解锁前置槽位！`);
          }
        };
      } else if (!turret) {
        card.innerHTML = `
          <span class="aow-slot-num">槽位 ${i + 1}</span>
          <span class="aow-slot-name font-gold">➕ 空闲</span>
        `;
        card.title = `空闲槽位 - 点击进入选塔建造`;
        card.onclick = () => {
          this.switchMenu('turrets');
        };
      } else {
        const dName = (turret.config && (turret.config.cnName || turret.config.displayName || turret.config.id)) || '防御塔';
        const shortName = (turret.config && turret.config.cnName) 
          ? turret.config.cnName.replace('防御塔', '').replace('重型', '') 
          : dName.split(' ')[0];
        const sellPrice = (turret.config && turret.config.sellPrice) || 0;
        card.innerHTML = `
          <div class="aow-slot-sell-badge" title="点击出售">✖</div>
          <span class="aow-slot-num">槽位 ${i + 1}</span>
          <span class="aow-slot-name">${shortName}</span>
        `;
        card.title = `${dName} (点击 ✖ 出售获得 +$${sellPrice})`;
        card.onclick = (e) => {
          this.sellTurretInteractive(i);
          if (this.isSellingMode) {
            this.exitSellMode();
          }
        };
      }

      list.appendChild(card);
    }
  }

  update() {
    const baseAlly = this.gm.baseAlly;
    const baseEnemy = this.gm.baseEnemy;
    if (!baseAlly || !baseEnemy) return;

    // 0. 友军人口数量更新 (ARMY: X/10)
    const unitCountEl = document.getElementById('aow-unit-count');
    if (unitCountEl && this.gm.unitsAlly) {
      const allyCount = this.gm.unitsAlly.filter(u => !u.isDead).length;
      unitCountEl.textContent = `${allyCount} / 10`;
    }

    // 1. 金币与经验数值更新
    document.getElementById('aow-gold-val').textContent = baseAlly.money;
    document.getElementById('aow-exp-val').textContent = baseAlly.exp;

    // 2. 出兵训练队列格与充能条更新
    const queueLen = this.gm.loadingManager.getQueueLength();
    for (let i = 0; i < 5; i++) {
      const slotEl = document.getElementById(`slot-${i}`);
      if (i < queueLen) {
        slotEl.classList.add('active');
      } else {
        slotEl.classList.remove('active');
      }
    }
    const progress = this.gm.loadingManager.getProgress();
    document.getElementById('aow-progress-fill').style.width = `${progress * 100}%`;

    // 3. Special 大招冷却遮罩
    const nowSec = performance.now() / 1000;
    const cdProgress = this.gm.specialAttackManager.getCooldownProgress(nowSec);
    const overlay = document.getElementById('aow-special-overlay');
    const timer = document.getElementById('aow-special-timer');
    if (overlay && timer) {
      if (cdProgress < 1.0) {
        overlay.style.height = `${(1.0 - cdProgress) * 100}%`;
        timer.textContent = `${this.gm.specialAttackManager.getRemainingTime(nowSec)}s`;
      } else {
        overlay.style.height = '0%';
        timer.textContent = '';
      }
    }

    // 4. 基地竖向血量条更新
    const playerHpPercent = Math.max(0, baseAlly.hp / baseAlly.maxHp);
    document.getElementById('aow-player-hp-fill').style.height = `${playerHpPercent * 100}%`;
    document.getElementById('aow-player-hp-text').textContent = Math.ceil(baseAlly.hp);

    const enemyHpPercent = Math.max(0, baseEnemy.hp / baseEnemy.maxHp);
    document.getElementById('aow-enemy-hp-fill').style.height = `${enemyHpPercent * 100}%`;
    document.getElementById('aow-enemy-hp-text').textContent = Math.ceil(baseEnemy.hp);

    // 5. 结算弹窗
    if (this.gm.isGameOver) {
      const modal = document.getElementById('aow-gameover-modal');
      modal.style.display = 'flex';
      const title = document.getElementById('aow-gameover-title');
      const desc = document.getElementById('aow-gameover-desc');
      if (this.gm.winner === 'player') {
        title.textContent = '战役大捷！';
        title.style.color = '#fbbf24';
        desc.textContent = '你已击溃敌军基地，赢得了全场胜利！';
      } else {
        title.textContent = '战役失利！';
        title.style.color = '#ef4444';
        desc.textContent = '我方基地要塞已被摧毁！';
      }
    }
  }

  // 狂暴急速状态机视觉切换
  setSpeedPowerup(active) {
    const badge = document.getElementById('aow-speed-badge');
    if (badge) {
      badge.style.display = active ? 'flex' : 'none';
    }
  }

  // 大招秒刷新高光爆发特效
  highlightSpecialPowerup(active) {
    const btn = document.getElementById('btn-special');
    if (btn) {
      if (active) {
        btn.style.boxShadow = '0 0 20px #fbbf24, 0 0 40px #f59e0b';
        btn.style.borderColor = '#fbbf24';
        setTimeout(() => {
          btn.style.boxShadow = '';
          btn.style.borderColor = '';
        }, 3000);
      } else {
        btn.style.boxShadow = '';
        btn.style.borderColor = '';
      }
    }
  }

  // 响应式基础界面 UI 缩放 (对齐标杆 1024x515 像素尺寸，支持动态全屏适配与玩家自定义缩放)
  updateUIScale() {
    const custom = localStorage.getItem('aow_custom_ui_scale');
    if (custom && custom !== 'auto') {
      const val = parseFloat(custom);
      if (!isNaN(val) && val > 0) {
        document.documentElement.style.setProperty('--ui-scale', val);
        return;
      }
    }
    // 标杆参考尺寸：1024x515
    const refW = 1024;
    const refH = 515;
    const scale = Math.min(window.innerWidth / refW, window.innerHeight / refH);
    const finalScale = Math.max(0.85, Math.round(scale * 100) / 100);
    document.documentElement.style.setProperty('--ui-scale', finalScale);
  }

  updateStats() {
    this.update();
  }
}
