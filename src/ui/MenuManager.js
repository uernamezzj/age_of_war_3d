/**
 * MenuManager.js - 顶级菜单中枢调度器
 * 1:1 映射开源项目 MainMenu.cs, PauseMenu.cs, SettingsMenu.cs, EndGameMenu.cs
 */

export class MenuManager {
  constructor(gameManager, soundManager, uiManager) {
    this.gm = gameManager;
    this.sound = soundManager;
    this.ui = uiManager;

    // 游戏状态: 'MAIN_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'
    this.state = 'MAIN_MENU';
    if (this.gm) {
      this.gm.isPaused = true;
    }
    this.difficulty = 'normal'; // 'easy' | 'normal' | 'hard' | 'impossible'

    this.root = null;
    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.root = document.createElement('div');
    this.root.id = 'aow-menu-root';
    this.root.innerHTML = `
      <!-- 1. 主菜单全屏遮罩 (MAIN MENU) -->
      <div id="modal-main-menu" class="aow-menu-overlay">
        <div class="aow-menu-card aow-card-main">
          <div class="aow-logo-header">
            <div class="aow-shield-badge">⚔️</div>
            <h1 class="aow-main-title">战争进化史 3D</h1>
            <div class="aow-main-subtitle">《战争进化史 3D》· 经典原版 1:1 官方重制</div>
          </div>

          <div class="aow-menu-actions">
            <button id="btn-show-campaign" class="aow-menu-btn btn-primary">
              <span class="btn-icon">🛡️</span>
              <span class="btn-text">单人战役模式</span>
            </button>
            <button id="btn-open-settings" class="aow-menu-btn btn-secondary">
              <span class="btn-icon">⚙️</span>
              <span class="btn-text">游戏设置</span>
            </button>
            <button id="btn-open-help" class="aow-menu-btn btn-secondary">
              <span class="btn-icon">📖</span>
              <span class="btn-text">战场指南与操作</span>
            </button>
          </div>

          <div class="aow-menu-footer">
            <span>Powered by Three.js & WebGL · 致敬 Flash 原始经典</span>
          </div>
        </div>
      </div>

      <!-- 2. 战役难度选择浮层 (DIFFICULTY SELECTOR) -->
      <div id="modal-difficulty" class="aow-menu-overlay" style="display:none;">
        <div class="aow-menu-card aow-card-sub">
          <h2 class="aow-card-title">选择战役难度</h2>
          <p class="aow-card-desc">不同难度决定敌方电脑 AI 的进阶节奏、造兵侵略性与经济收益乘数：</p>
          
          <div class="aow-difficulty-grid">
            <div class="aow-diff-card diff-easy" data-diff="easy">
              <div class="diff-title">🟢 休闲探索</div>
              <div class="diff-desc">敌方经济 0.75x，出兵频率舒缓，适合初学者体验时代演进与视觉特效。</div>
            </div>
            <div class="aow-diff-card diff-normal active" data-diff="normal">
              <div class="diff-title">🟡 经典正统</div>
              <div class="diff-desc">1:1 对齐原版 Flash 数值，AI 攻守兼备，原汁原味的策略推塔体验。</div>
            </div>
            <div class="aow-diff-card diff-hard" data-diff="hard">
              <div class="diff-title">🔴 铁血修罗</div>
              <div class="diff-desc">敌方经济 1.4x，AI 频繁升级防御塔与高阶重装单位，极具挑战性。</div>
            </div>
            <div class="aow-diff-card diff-impossible" data-diff="impossible">
              <div class="diff-title">🟣 噩梦炼狱</div>
              <div class="diff-desc">敌方经济 1.8x，极速进化与凶悍狂暴兵潮，必须步步为营方可取胜！</div>
            </div>
          </div>

          <div class="aow-sub-btn-row">
            <button id="btn-start-battle" class="aow-menu-btn btn-primary">⚔️ 开始战斗</button>
            <button id="btn-back-to-main" class="aow-menu-btn btn-back">⬅️ 返回</button>
          </div>
        </div>
      </div>

      <!-- 3. ESC 暂停菜单 (PAUSE MENU) -->
      <div id="modal-pause" class="aow-menu-overlay" style="display:none;">
        <div class="aow-menu-card aow-card-sub">
          <h2 class="aow-card-title">⏸️ 战局暂停</h2>
          
          <div class="aow-pause-stats">
            <div class="pause-stat-item">
              <span class="lbl">战斗已进行时间:</span>
              <span id="pause-timer-val" class="val">00m 00s</span>
            </div>
            <div class="pause-stat-item">
              <span class="lbl">当前战役难度:</span>
              <span id="pause-diff-val" class="val text-gold">NORMAL</span>
            </div>
          </div>

          <div class="aow-menu-actions">
            <button id="btn-resume-game" class="aow-menu-btn btn-primary">▶️ 继续战斗</button>
            <button id="btn-pause-settings" class="aow-menu-btn btn-secondary">⚙️ 音量设置</button>
            <button id="btn-pause-restart" class="aow-menu-btn btn-secondary">🔄 从头再战</button>
            <button id="btn-pause-quit" class="aow-menu-btn btn-back">🚪 退出到主菜单</button>
          </div>
        </div>
      </div>

      <!-- 4. 设置面板 (SETTINGS MENU) -->
      <div id="modal-settings" class="aow-menu-overlay" style="display:none;">
        <div class="aow-menu-card aow-card-sub">
          <h2 class="aow-card-title">⚙️ 游戏设置</h2>

          <div class="aow-settings-list">
            <div class="setting-item">
              <div class="setting-lbl">
                <span>🎵 背景音乐音量</span>
                <span id="val-bgm-text">50%</span>
              </div>
              <input type="range" id="slider-bgm" min="0" max="100" value="50" class="aow-slider">
            </div>

            <div class="setting-item">
              <div class="setting-lbl">
                <span>💥 战斗音效音量</span>
                <span id="val-sfx-text">70%</span>
              </div>
              <input type="range" id="slider-sfx" min="0" max="100" value="70" class="aow-slider">
            </div>

            <div class="setting-item">
              <div class="setting-lbl">
                <span>📐 基础界面 UI 缩放</span>
                <span id="val-ui-scale-text">自适应 (标杆大小)</span>
              </div>
              <input type="range" id="slider-ui-scale" min="80" max="220" value="100" class="aow-slider">
            </div>

            <div class="setting-item setting-switch-row">
              <span>🔇 一键静音</span>
              <input type="checkbox" id="check-mute" class="aow-checkbox">
            </div>

            <div class="setting-item setting-switch-row">
              <span>🖥️ 全屏模式 (快捷键 F11)</span>
              <button id="btn-toggle-fullscreen" class="aow-btn-small">切换全屏</button>
            </div>
          </div>

          <div class="aow-sub-btn-row">
            <button id="btn-close-settings" class="aow-menu-btn btn-primary">✅ 保存并返回</button>
          </div>
        </div>
      </div>

      <!-- 5. 操作指南面板 (HOW TO PLAY) -->
      <div id="modal-help" class="aow-menu-overlay" style="display:none;">
        <div class="aow-menu-card aow-card-sub aow-card-help">
          <h2 class="aow-card-title">📖 战场操作指南</h2>
          
          <div class="aow-help-content">
            <div class="help-section">
              <h3>🎯 基础操作与快捷键</h3>
              <ul>
                <li><b>数字键 1 ~ 4</b>：快速训练当前时代第 1~4 款士兵（时代 5 可训练超能特种兵）。</li>
                <li><b>按键 T</b>：打开防御塔建造菜单 / 修建防御炮塔。</li>
                <li><b>空格键 Space</b>：触发当前时代毁天灭地的终极大招。</li>
                <li><b>ESC 键</b>：随时呼出战局暂停菜单与音量设置。</li>
                <li><b>鼠标滚轮</b>：多级缩放战场全景视觉效果（广角与微距特写）。</li>
                <li><b>鼠标拖拽 / A/D 键 / 屏幕边缘</b>：自由平移全图战场视野。</li>
              </ul>
            </div>


          </div>

          <div class="aow-sub-btn-row">
            <button id="btn-close-help" class="aow-menu-btn btn-primary">我知道了</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.root);
    this.injectStyles();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #aow-menu-root {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 500;
        font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      }

      .aow-menu-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        animation: aow-fade-in 0.25s ease;
      }

      @keyframes aow-fade-in {
        from { opacity: 0; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1); }
      }

      .aow-menu-card {
        background: linear-gradient(180deg, #1e293b, #0f172a);
        border: 2px solid #f59e0b;
        border-radius: 16px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 25px rgba(245, 158, 11, 0.35);
        color: #f8fafc;
        padding: 32px 40px;
        text-align: center;
      }

      .aow-card-main {
        width: 520px;
        max-width: 90vw;
      }

      .aow-card-sub {
        width: 620px;
        max-width: 92vw;
      }

      .aow-card-help {
        width: 720px;
      }

      .aow-logo-header {
        margin-bottom: 28px;
      }

      .aow-shield-badge {
        font-size: 56px;
        margin-bottom: 8px;
        filter: drop-shadow(0 4px 10px rgba(245, 158, 11, 0.5));
      }

      .aow-main-title {
        font-family: 'Arial Black', Impact, sans-serif;
        font-size: 38px;
        font-weight: 900;
        letter-spacing: 2px;
        background: linear-gradient(180deg, #fef08a, #f59e0b, #d97706);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 4px 12px rgba(0,0,0,0.6);
        margin: 0;
      }

      .aow-main-subtitle {
        color: #94a3b8;
        font-size: 14px;
        font-weight: 600;
        margin-top: 6px;
        letter-spacing: 1px;
      }

      .aow-card-title {
        font-family: 'Arial Black', Impact, sans-serif;
        font-size: 24px;
        color: #fbbf24;
        margin-bottom: 12px;
      }

      .aow-card-desc {
        color: #94a3b8;
        font-size: 13px;
        margin-bottom: 20px;
        line-height: 1.5;
      }

      .aow-menu-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 24px;
      }

      .aow-menu-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-family: 'Arial Black', Impact, sans-serif;
        font-size: 16px;
        font-weight: 900;
        padding: 14px 20px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 10px rgba(0,0,0,0.4);
      }

      .aow-menu-btn.btn-primary {
        background: linear-gradient(180deg, #f59e0b, #d97706);
        border: 2px solid #fef08a;
        color: #451a03;
        text-shadow: 0 1px 1px rgba(255,255,255,0.4);
      }

      .aow-menu-btn.btn-primary:hover {
        background: linear-gradient(180deg, #fbbf24, #f59e0b);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
      }

      .aow-menu-btn.btn-secondary {
        background: linear-gradient(180deg, #334155, #1e293b);
        border: 2px solid #64748b;
        color: #f1f5f9;
      }

      .aow-menu-btn.btn-secondary:hover {
        background: linear-gradient(180deg, #475569, #334155);
        border-color: #94a3b8;
        transform: translateY(-2px);
      }

      .aow-menu-btn.btn-back {
        background: transparent;
        border: 1px solid #475569;
        color: #94a3b8;
      }

      .aow-menu-btn.btn-back:hover {
        background: rgba(255,255,255,0.05);
        color: #f1f5f9;
        border-color: #94a3b8;
      }

      .aow-menu-footer {
        color: #64748b;
        font-size: 12px;
        border-top: 1px solid rgba(255,255,255,0.1);
        padding-top: 14px;
      }

      /* 难度卡片网络 */
      .aow-difficulty-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 24px;
        text-align: left;
      }

      .aow-diff-card {
        background: rgba(30, 41, 59, 0.7);
        border: 2px solid #475569;
        border-radius: 10px;
        padding: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .aow-diff-card:hover {
        background: rgba(51, 65, 85, 0.9);
        border-color: #94a3b8;
        transform: translateY(-2px);
      }

      .aow-diff-card.active {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.15);
        box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);
      }

      .diff-title {
        font-weight: 800;
        font-size: 15px;
        color: #f8fafc;
        margin-bottom: 4px;
      }

      .diff-desc {
        color: #94a3b8;
        font-size: 12px;
        line-height: 1.4;
      }

      .aow-sub-btn-row {
        display: flex;
        gap: 14px;
        justify-content: center;
      }

      .aow-sub-btn-row .aow-menu-btn {
        flex: 1;
      }

      /* 暂停统计 */
      .aow-pause-stats {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 12px 18px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-around;
      }

      .pause-stat-item .lbl {
        color: #94a3b8;
        font-size: 13px;
        margin-right: 8px;
      }

      .pause-stat-item .val {
        color: #38bdf8;
        font-weight: 800;
        font-size: 15px;
      }

      .text-gold { color: #fbbf24 !important; }

      /* 设置条目 */
      .aow-settings-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 24px;
        text-align: left;
      }

      .setting-item {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 12px 16px;
      }

      .setting-lbl {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .aow-slider {
        width: 100%;
        accent-color: #f59e0b;
        cursor: pointer;
      }

      .setting-switch-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        font-weight: 700;
      }

      .aow-checkbox {
        width: 20px;
        height: 20px;
        accent-color: #f59e0b;
        cursor: pointer;
      }

      .aow-btn-small {
        background: #334155;
        border: 1px solid #64748b;
        color: #f8fafc;
        padding: 6px 14px;
        border-radius: 6px;
        font-weight: 700;
        cursor: pointer;
      }

      .aow-btn-small:hover {
        background: #475569;
      }

      /* 帮助内容 */
      .aow-help-content {
        max-height: 55vh;
        overflow-y: auto;
        text-align: left;
        margin-bottom: 20px;
        padding-right: 8px;
      }

      .help-section {
        margin-bottom: 18px;
      }

      .help-section h3 {
        color: #38bdf8;
        font-size: 15px;
        margin-bottom: 8px;
      }

      .help-section ul {
        margin: 0;
        padding-left: 20px;
        color: #cbd5e1;
        font-size: 13px;
        line-height: 1.6;
      }

      .help-section p {
        color: #94a3b8;
        font-size: 13px;
        margin-bottom: 6px;
      }
    `;
    document.head.appendChild(style);
  }

  bindEvents() {
    // 1. 主菜单导航
    const modalMain = this.root.querySelector('#modal-main-menu');
    const modalDiff = this.root.querySelector('#modal-difficulty');
    const modalPause = this.root.querySelector('#modal-pause');
    const modalSettings = this.root.querySelector('#modal-settings');
    const modalHelp = this.root.querySelector('#modal-help');

    // 进入难度选择
    this.root.querySelector('#btn-show-campaign').onclick = () => {
      this.sound?.play('click');
      modalMain.style.display = 'none';
      modalDiff.style.display = 'flex';
    };

    // 主菜单打开设置
    this.root.querySelector('#btn-open-settings').onclick = () => {
      this.sound?.play('click');
      modalSettings.style.display = 'flex';
    };

    // 主菜单打开帮助
    this.root.querySelector('#btn-open-help').onclick = () => {
      this.sound?.play('click');
      modalHelp.style.display = 'flex';
    };

    // 难度卡片单选
    const diffCards = this.root.querySelectorAll('.aow-diff-card');
    diffCards.forEach(card => {
      card.onclick = () => {
        this.sound?.play('click');
        diffCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.difficulty = card.getAttribute('data-diff');
      };
    });

    // 从难度返回主菜单
    this.root.querySelector('#btn-back-to-main').onclick = () => {
      this.sound?.play('click');
      modalDiff.style.display = 'none';
      modalMain.style.display = 'flex';
    };

    // 正式开战
    this.root.querySelector('#btn-start-battle').onclick = () => {
      this.sound?.play('click');
      this.startBattle(this.difficulty);
    };

    // 关闭设置
    this.root.querySelector('#btn-close-settings').onclick = () => {
      this.sound?.play('click');
      modalSettings.style.display = 'none';
    };

    // 关闭帮助
    this.root.querySelector('#btn-close-help').onclick = () => {
      this.sound?.play('click');
      modalHelp.style.display = 'none';
    };

    // 2. 音量滑块调节
    const sliderBgm = this.root.querySelector('#slider-bgm');
    const sliderSfx = this.root.querySelector('#slider-sfx');
    const valBgmText = this.root.querySelector('#val-bgm-text');
    const valSfxText = this.root.querySelector('#val-sfx-text');

    sliderBgm.oninput = (e) => {
      const val = parseInt(e.target.value);
      valBgmText.textContent = `${val}%`;
      this.sound?.setMusicVolume(val / 100);
    };

    sliderSfx.oninput = (e) => {
      const val = parseInt(e.target.value);
      valSfxText.textContent = `${val}%`;
      this.sound?.setEffectsVolume(val / 100);
    };

    // 基础界面 UI 缩放调节
    const sliderUiScale = this.root.querySelector('#slider-ui-scale');
    const valUiScaleText = this.root.querySelector('#val-ui-scale-text');
    if (sliderUiScale && valUiScaleText) {
      const saved = localStorage.getItem('aow_custom_ui_scale_slider');
      if (saved && saved !== '100') {
        sliderUiScale.value = saved;
        valUiScaleText.textContent = `${saved}%`;
      } else {
        sliderUiScale.value = 100;
        valUiScaleText.textContent = "自适应 (标杆大小)";
      }

      sliderUiScale.oninput = (e) => {
        const val = parseInt(e.target.value);
        if (val === 100) {
          valUiScaleText.textContent = "自适应 (标杆大小)";
          localStorage.removeItem('aow_custom_ui_scale');
          localStorage.removeItem('aow_custom_ui_scale_slider');
          if (window.uiManager) window.uiManager.updateUIScale();
        } else {
          valUiScaleText.textContent = `${val}%`;
          const multiplier = val / 100;
          const refW = 1024;
          const refH = 515;
          const autoScale = Math.min(window.innerWidth / refW, window.innerHeight / refH);
          const computedScale = Math.round(autoScale * multiplier * 100) / 100;
          document.documentElement.style.setProperty('--ui-scale', computedScale);
          localStorage.setItem('aow_custom_ui_scale', computedScale);
          localStorage.setItem('aow_custom_ui_scale_slider', val);
        }
      };
    }

    // 静音切换
    this.root.querySelector('#check-mute').onchange = (e) => {
      const isMuted = e.target.checked;
      if (this.sound) {
        this.sound.isMuted = isMuted;
        if (this.sound.bgm) {
          this.sound.bgm.volume = isMuted ? 0 : this.sound.musicVolume;
        }
      }
    };

    // 全屏切换
    this.root.querySelector('#btn-toggle-fullscreen').onclick = () => {
      this.sound?.play('click');
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    };

    // 3. 暂停菜单交互
    this.root.querySelector('#btn-resume-game').onclick = () => {
      this.sound?.play('click');
      this.resumeGame();
    };

    this.root.querySelector('#btn-pause-settings').onclick = () => {
      this.sound?.play('click');
      modalSettings.style.display = 'flex';
    };

    this.root.querySelector('#btn-pause-restart').onclick = () => {
      this.sound?.play('click');
      this.resumeGame();
      if (this.gm) this.gm.resetGame();
    };

    this.root.querySelector('#btn-pause-quit').onclick = () => {
      this.sound?.play('click');
      this.quitToMainMenu();
    };

    // 4. 全局键盘快捷键 (ESC 暂停, F11 全屏)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (this.state === 'PLAYING') {
          this.pauseGame();
        } else if (this.state === 'PAUSED') {
          this.resumeGame();
        }
      }
    });
  }

  // 开始战斗
  startBattle(difficulty = 'normal') {
    this.difficulty = difficulty;
    this.state = 'PLAYING';
    if (this.gm) {
      this.gm.isPaused = false;
    }

    const modalMain = this.root.querySelector('#modal-main-menu');
    const modalDiff = this.root.querySelector('#modal-difficulty');
    modalMain.style.display = 'none';
    modalDiff.style.display = 'none';

    // 启动战歌
    if (this.sound) {
      this.sound.startBGM();
    }

    // 根据难度配置 AI 参数
    if (this.gm && this.gm.botAI) {
      this.applyDifficultyToAI(difficulty);
      this.gm.resetGame();
    }
  }

  // 配置 AI 难度
  applyDifficultyToAI(diff) {
    if (!this.gm || !this.gm.botAI) return;
    const ai = this.gm.botAI;

    switch (diff) {
      case 'easy':
        ai.incomeMultiplier = 0.75;
        ai.spawnIntervalMin = 5.0;
        ai.spawnIntervalMax = 10.0;
        break;
      case 'normal':
        ai.incomeMultiplier = 1.0;
        ai.spawnIntervalMin = 3.0;
        ai.spawnIntervalMax = 7.0;
        break;
      case 'hard':
        ai.incomeMultiplier = 1.4;
        ai.spawnIntervalMin = 2.0;
        ai.spawnIntervalMax = 5.0;
        break;
      case 'impossible':
        ai.incomeMultiplier = 1.8;
        ai.spawnIntervalMin = 1.5;
        ai.spawnIntervalMax = 3.5;
        break;
    }
  }

  // 切换暂停状态
  togglePause() {
    if (this.state === 'PLAYING') {
      this.pauseGame();
    } else if (this.state === 'PAUSED') {
      this.resumeGame();
    }
  }

  // 暂停游戏
  pauseGame() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';

    if (this.gm) {
      this.gm.isPaused = true;
    }

    // 更新时间看板
    const timerText = this.root.querySelector('#pause-timer-val');
    const diffText = this.root.querySelector('#pause-diff-val');
    const totalSec = Math.floor(this.gm?.gameTime || 0);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    timerText.textContent = `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    const diffZh = { easy: '休闲探索', normal: '经典正统', hard: '铁血修罗', impossible: '噩梦炼狱' };
    diffText.textContent = diffZh[this.difficulty] || this.difficulty;

    const modalPause = this.root.querySelector('#modal-pause');
    modalPause.style.display = 'flex';
  }

  // 恢复游戏
  resumeGame() {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';

    if (this.gm) {
      this.gm.isPaused = false;
    }

    const modalPause = this.root.querySelector('#modal-pause');
    modalPause.style.display = 'none';
  }

  // 退出到主菜单
  quitToMainMenu() {
    this.state = 'MAIN_MENU';

    if (this.gm) {
      this.gm.isPaused = true;
      this.gm.resetGame();
    }

    const modalPause = this.root.querySelector('#modal-pause');
    const modalMain = this.root.querySelector('#modal-main-menu');
    modalPause.style.display = 'none';
    modalMain.style.display = 'flex';
  }
}
