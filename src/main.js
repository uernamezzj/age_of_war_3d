/**
 * 《战争进化史 3D》主游戏引擎与用户交互总线
 * 协同 Three.js 渲染管线、物理战斗逻辑、UI 状态响应与胜利结算
 */

import { GAME_CONFIG } from './game_config.js';
import { audioManager } from './audio_manager.js';
import { Battlefield } from './battlefield.js';
import { UnitManager } from './unit_manager.js';
import { TurretManager } from './turret_manager.js';
import { SpecialAttackManager } from './special_attack.js';
import { BotAI } from './bot_ai.js';

class GameApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    // 基础三维组件
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.fbxLoader = new THREE.FBXLoader();
    this.gltfLoader = new THREE.GLTFLoader();

    // 核心子系统
    this.battlefield = null;
    this.unitManager = null;
    this.turretManager = null;
    this.specialAttack = null;
    this.botAI = null;

    // 玩家经济与基地状态
    this.playerGold = GAME_CONFIG.base.startingMoney;
    this.playerExp = 0;
    this.playerBaseHp = GAME_CONFIG.base.maxHp;
    this.enemyBaseHp = GAME_CONFIG.base.maxHp;
    this.gameTime = 0;
    this.isGameOver = false;
    this.currentEra = 1;

    // 出兵排队队列 (最多 5 队)
    this.spawnQueue = [];
    this.currentSpawnProgress = 0;

    // 摄像机漫游控制
    this.cameraTargetX = 0;
    this.cameraPanSpeed = 28;
    this.keysDown = {};

    // 浮动跳字列表
    this.floatingTexts = [];

    this.init();
  }

  async init() {
    this.setupScene();
    this.setupInputListeners();

    // 更新加载文本
    const loadText = document.getElementById('loading-text');
    if (loadText) loadText.innerText = "正在构建史前荒原走廊与洞穴要塞...";

    this.battlefield = new Battlefield(this.scene, this.gltfLoader, this.fbxLoader);
    await this.battlefield.build();

    if (loadText) loadText.innerText = "正在预热石器时代兵种与骨骼动作库...";
    this.unitManager = new UnitManager(this.scene, this.gltfLoader, this.fbxLoader);
    await this.unitManager.preloadTemplates();

    if (loadText) loadText.innerText = "正在预热要塞防御塔与弹道系统...";
    this.turretManager = new TurretManager(this.scene, this.gltfLoader, this.fbxLoader, this.battlefield, this.unitManager);
    await this.turretManager.preloadTemplates();

    if (loadText) loadText.innerText = "正在装配流星雨终极大招与电脑脑核...";
    this.specialAttack = new SpecialAttackManager(this.scene, this.fbxLoader, this.unitManager, this.camera);
    await this.specialAttack.preloadTemplate();

    this.botAI = new BotAI(this.unitManager, this.turretManager, this.specialAttack);

    // 挂载单位管理器回调
    this.unitManager.onUnitKilled = (evt) => this.handleCombatEvent(evt);
    this.unitManager.onFloatingText = (evt) => this.addFloatingText(evt.text, evt.x, evt.y, evt.color);

    // 隐藏 Loading
    const loadingScreen = document.getElementById('loading');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => loadingScreen.style.display = 'none', 400);
    }

    this.setupUIBindings();
    this.updateHUD();
    this.isLoaded = true;

    // 启动动画渲染循环
    this.animate();
  }

  setupScene() {
    this.scene = new THREE.Scene();

    // 经典横向 RTS 侧视倾角摄影机
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 8.5, 18.5);
    this.camera.lookAt(0, 1.2, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.localClippingEnabled = true; // 启用硬件局部剖切支持大场景净空
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      this.keysDown[e.code] = true;
      audioManager.unlockAudio();

      if (e.code === 'Digit1') this.requestSpawn('caveman_1');
      if (e.code === 'Digit2') this.requestSpawn('caveman_2');
      if (e.code === 'Digit3') this.requestSpawn('caveman_3');
      if (e.code === 'KeyE') this.evolveEra();
      if (e.code === 'Space') this.requestSpecial();
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown[e.code] = false;
    });

    // 鼠标拖拽平移
    let isDragging = false;
    let prevMouseX = 0;
    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('#hud') || e.target.closest('.bottom-dock') || e.target.closest('#modal-gameover')) return;
      isDragging = true;
      prevMouseX = e.clientX;
      audioManager.unlockAudio();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      this.cameraTargetX -= deltaX * 0.04;
      this.clampCameraTarget();
    });

    window.addEventListener('mouseup', () => { isDragging = false; });
  }

  clampCameraTarget() {
    this.cameraTargetX = THREE.MathUtils.clamp(
      this.cameraTargetX,
      GAME_CONFIG.battlefield.cameraBounds[0],
      GAME_CONFIG.battlefield.cameraBounds[1]
    );
  }

  // 玩家申请制造单位
  requestSpawn(unitId) {
    if (this.isGameOver) return;
    const cfg = GAME_CONFIG.units[unitId];
    if (!cfg) return;

    if (this.spawnQueue.length >= 5) {
      this.addFloatingText("队列已满！", this.cameraTargetX, 4.0, '#facc15');
      return;
    }

    if (this.playerGold < cfg.cost) {
      this.addFloatingText("金币不足！", this.cameraTargetX, 4.0, '#f87171');
      return;
    }

    audioManager.playClick();
    this.playerGold -= cfg.cost;
    this.spawnQueue.push({
      unitId,
      cfg,
      totalTime: cfg.spawnTime,
      remainingTime: cfg.spawnTime
    });
    this.updateHUD();
  }

  // 玩家申请释放流星雨
  requestSpecial() {
    if (this.isGameOver) return;
    if (this.specialAttack.triggerSpecial(true)) {
      this.addFloatingText("🌋 火山流星雨倾泻！", this.cameraTargetX, 4.5, '#f97316');
      this.updateHUD();
    }
  }

  // 战斗事件回调
  handleCombatEvent(evt) {
    if (this.isGameOver) return;

    if (evt.type === 'kill_reward') {
      this.playerGold += evt.gold;
      this.playerExp += evt.exp;
      this.updateHUD();
    } else if (evt.type === 'base_damage') {
      if (evt.isPlayerBase) {
        this.playerBaseHp = Math.max(0, this.playerBaseHp - evt.damage);
        if (this.playerBaseHp <= 0) {
          this.endGame(false);
        }
      } else {
        this.enemyBaseHp = Math.max(0, this.enemyBaseHp - evt.damage);
        if (this.enemyBaseHp <= 0) {
          this.endGame(true);
        }
      }
      this.updateHUD();
    }
  }

  // 游戏胜负终局结算
  endGame(isVictory) {
    this.isGameOver = true;
    const modal = document.getElementById('modal-gameover');
    const title = document.getElementById('gameover-title');
    const desc = document.getElementById('gameover-desc');

    if (isVictory) {
      title.innerText = "🏆 史诗大捷！(VICTORY)";
      title.style.color = "#38bdf8";
      desc.innerText = "你率领石器时代野人勇士踏平了敌方部落，摧毁了对方洞穴要塞！";
    } else {
      title.innerText = "💀 基地陷落！(DEFEAT)";
      title.style.color = "#ef4444";
      desc.innerText = "我方石器洞穴被敌军攻陷，卷土重来吧，伟大的部落酋长！";
    }
    if (modal) modal.style.display = 'flex';
  }

  restart() {
    this.isGameOver = false;
    this.playerGold = GAME_CONFIG.base.startingMoney;
    this.playerExp = 0;
    this.playerBaseHp = GAME_CONFIG.base.maxHp;
    this.enemyBaseHp = GAME_CONFIG.base.maxHp;
    this.gameTime = 0;
    this.spawnQueue = [];
    this.currentSpawnProgress = 0;

    this.unitManager.clearAll();
    this.turretManager.clearAll();
    this.botAI.reset();

    const modal = document.getElementById('modal-gameover');
    if (modal) modal.style.display = 'none';

    this.updateHUD();
  }

  // 帧循环驱动
  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (!this.isGameOver) {
      this.gameTime += delta;
      // 玩家被动金币增长
      this.playerGold += GAME_CONFIG.base.passiveIncomePerSec * delta;

      // 处理出兵队列
      this.updateSpawnQueue(delta);

      // 核心系统更新
      this.unitManager.update(delta, this.playerBaseHp, this.enemyBaseHp);
      this.turretManager.update(delta);
      this.specialAttack.update(delta);
      this.botAI.update(delta);

      this.updateHUD();
    }

    // 摄影机平滑漫游追踪
    this.updateCamera(delta);

    // 渲染三维场景
    this.renderer.render(this.scene, this.camera);

    // 浮动文本更新
    this.renderFloatingTexts();
  }

  updateCamera(delta) {
    if (this.keysDown['KeyA'] || this.keysDown['ArrowLeft']) {
      this.cameraTargetX -= this.cameraPanSpeed * delta;
      this.clampCameraTarget();
    }
    if (this.keysDown['KeyD'] || this.keysDown['ArrowRight']) {
      this.cameraTargetX += this.cameraPanSpeed * delta;
      this.clampCameraTarget();
    }

    // 摄影机位置阻尼逼近目标 X
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.cameraTargetX, delta * 6.5);
    this.camera.lookAt(this.camera.position.x, 1.2, 0);
  }

  updateSpawnQueue(delta) {
    if (this.spawnQueue.length === 0) {
      this.currentSpawnProgress = 0;
      return;
    }

    const current = this.spawnQueue[0];
    current.remainingTime -= delta;
    this.currentSpawnProgress = Math.max(0, Math.min(1, 1 - (current.remainingTime / current.totalTime)));

    if (current.remainingTime <= 0) {
      // 生产完成，步出战场
      this.unitManager.spawnUnit(current.unitId, true);
      this.spawnQueue.shift();
      this.currentSpawnProgress = 0;
    }
  }

  // 浮动跳字系统 (3D 世界坐标投影至 2D 网页屏幕)
  addFloatingText(text, worldX, worldY, color = '#f87171') {
    const el = document.createElement('div');
    el.className = 'floating-number';
    el.innerText = text;
    el.style.color = color;
    document.body.appendChild(el);

    this.floatingTexts.push({
      el,
      worldPos: new THREE.Vector3(worldX, worldY, 0),
      life: 1.0,
      maxLife: 1.0
    });
  }

  renderFloatingTexts() {
    const tempVec = new THREE.Vector3();
    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const item = this.floatingTexts[i];
      item.life -= 0.02;
      item.worldPos.y += 0.025; // 缓慢上浮

      tempVec.copy(item.worldPos);
      tempVec.project(this.camera);

      // 投影至屏幕像素
      const screenX = (tempVec.x * halfWidth) + halfWidth;
      const screenY = -(tempVec.y * halfHeight) + halfHeight;

      item.el.style.left = `${screenX}px`;
      item.el.style.top = `${screenY}px`;
      item.el.style.opacity = Math.max(0, item.life / item.maxLife);

      if (item.life <= 0) {
        item.el.remove();
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // 更新全局 HUD 数据与按键状态
  updateHUD() {
    // 玩家金币与经验
    const goldEl = document.getElementById('hud-gold');
    if (goldEl) goldEl.innerText = `$${Math.floor(this.playerGold)}`;
    const expEl = document.getElementById('hud-exp');
    if (expEl) expEl.innerText = `${Math.floor(this.playerExp)} XP`;

    // 战斗计时
    const timerEl = document.getElementById('hud-timer');
    if (timerEl) {
      const m = Math.floor(this.gameTime / 60);
      const s = Math.floor(this.gameTime % 60);
      timerEl.innerText = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }

    // 双方基地血条
    const pBar = document.getElementById('bar-player-hp');
    const pTxt = document.getElementById('txt-player-hp');
    if (pBar) {
      const pPct = Math.max(0, Math.min(100, (this.playerBaseHp / GAME_CONFIG.base.maxHp) * 100));
      pBar.style.width = `${pPct}%`;
      pTxt.innerText = `${Math.round(this.playerBaseHp)} / ${GAME_CONFIG.base.maxHp}`;
    }

    const eBar = document.getElementById('bar-enemy-hp');
    const eTxt = document.getElementById('txt-enemy-hp');
    if (eBar) {
      const ePct = Math.max(0, Math.min(100, (this.enemyBaseHp / GAME_CONFIG.base.maxHp) * 100));
      eBar.style.width = `${ePct}%`;
      eTxt.innerText = `${Math.round(this.enemyBaseHp)} / ${GAME_CONFIG.base.maxHp}`;
    }

    // 队列图标展示
    const queueCont = document.getElementById('spawn-queue-container');
    if (queueCont) {
      queueCont.innerHTML = '';
      this.spawnQueue.forEach((item, idx) => {
        const slot = document.createElement('div');
        slot.className = `queue-slot ${idx === 0 ? 'active' : ''}`;
        slot.innerText = item.cfg.icon;
        if (idx === 0) {
          const fill = document.createElement('div');
          fill.className = 'queue-progress-bar';
          fill.style.width = `${this.currentSpawnProgress * 100}%`;
          slot.appendChild(fill);
        }
        queueCont.appendChild(slot);
      });
    }

    // 大招冷却环与按钮状态
    const specBtn = document.getElementById('btn-special');
    const specCd = document.getElementById('spec-cd-overlay');
    if (specBtn && this.specialAttack) {
      if (this.specialAttack.isReady) {
        specBtn.classList.add('ready');
        if (specCd) specCd.style.height = '0%';
      } else {
        specBtn.classList.remove('ready');
        const pct = Math.round((1 - this.specialAttack.getCooldownPercent()) * 100);
        if (specCd) specCd.style.height = `${pct}%`;
      }
    }

    // 时代标签与切换按钮更新
    const eraTag = document.getElementById('hud-era-tag');
    if (eraTag) {
      const eraTags = {
        1: "纪元 I：原始石器",
        2: "纪元 II：欧洲原野森林",
        3: "纪元 III：汉诺威古典要塞",
        4: "纪元 IV：现代战争焦土",
        5: "纪元 V：未来星际轨道"
      };
      eraTag.innerText = eraTags[this.currentEra] || `纪元 ${this.currentEra}`;
    }

    document.querySelectorAll('.btn-era-select').forEach(btn => {
      const e = parseInt(btn.dataset.era, 10);
      btn.classList.toggle('active', e === this.currentEra);
    });

    const evolveBtn = document.getElementById('btn-evolve-era');
    if (evolveBtn) {
      const canEvolve = (this.playerExp >= GAME_CONFIG.base.evolveExpRequired) && (this.currentEra < 5);
      evolveBtn.classList.toggle('ready', canEvolve);
      if (this.currentEra >= 5) {
        evolveBtn.innerText = "⭐ 满级终极纪元";
        evolveBtn.disabled = true;
      } else {
        evolveBtn.innerText = canEvolve ? `⭐ 演进到纪元 ${this.currentEra + 1} (可演进!)` : `⭐ 演进 [E] (${Math.floor(this.playerExp)}/${GAME_CONFIG.base.evolveExpRequired}XP)`;
        evolveBtn.disabled = false;
      }
    }
  }

  async switchEra(eraId) {
    if (this.currentEra === eraId) return;
    this.currentEra = eraId;
    this.addFloatingText(`⏳ 迁跃至纪元 ${eraId}...`, 0, 3.5, "#38bdf8");
    await this.battlefield.setEra(eraId);
    this.addFloatingText(`✨ 纪元切换完成！`, 0, 4.0, "#34d399");
    this.updateHUD();
  }

  async evolveEra() {
    if (this.currentEra >= 5) {
      this.addFloatingText("已达到最终纪元！", 0, 3, "#38bdf8");
      return;
    }
    const nextEra = this.currentEra + 1;
    this.addFloatingText(`🌟 时代演进！进入纪元 ${nextEra}`, 0, 4, "#fbbf24");
    audioManager.playSfx('victory');
    await this.switchEra(nextEra);
  }

  setupUIBindings() {
    // 摄像机机位快速跳转
    window.jumpToPlayerBase = () => { this.cameraTargetX = -22; this.clampCameraTarget(); };
    window.jumpToFrontline = () => {
      let frontX = 0;
      if (this.unitManager.playerUnits.length > 0 && this.unitManager.enemyUnits.length > 0) {
        frontX = (this.unitManager.playerUnits[0].x + this.unitManager.enemyUnits[0].x) / 2;
      }
      this.cameraTargetX = frontX;
      this.clampCameraTarget();
    };
    window.jumpToEnemyBase = () => { this.cameraTargetX = 22; this.clampCameraTarget(); };

    // 音频开关
    window.toggleMute = () => {
      const isMuted = audioManager.toggleMute();
      const btn = document.getElementById('btn-audio');
      if (btn) btn.innerText = isMuted ? '🔇 静音中' : '🔊 音乐就绪';
    };

    // 时代系统绑定
    window.switchEra = (id) => this.switchEra(id);
    window.evolveEra = () => this.evolveEra();

    // 出兵按键
    window.requestSpawn = (id) => this.requestSpawn(id);
    window.requestSpecial = () => this.requestSpecial();
    window.restartGame = () => this.restart();

    // 防御塔控制弹窗
    window.toggleTurretModal = () => {
      const modal = document.getElementById('turret-dock-panel');
      if (modal) {
        modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
        this.renderTurretPanel();
      }
    };
  }

  // 渲染防御塔建造坞
  renderTurretPanel() {
    const container = document.getElementById('turret-slots-list');
    if (!container) return;
    container.innerHTML = '';

    this.turretManager.playerSlots.forEach((slot, idx) => {
      const row = document.createElement('div');
      row.className = 'turret-slot-card';

      if (!slot.unlocked) {
        const unlockCost = GAME_CONFIG.base.expansionCosts[idx];
        row.innerHTML = `
          <div class="slot-info">
            <span class="slot-name">第 ${idx + 1} 炮台挂载位 (未解锁)</span>
            <span class="slot-cost">解锁花费: $${unlockCost}</span>
          </div>
          <button class="btn btn-unlock" onclick="window.game.unlockTurretSlot(${idx})">🔓 解锁槽位</button>
        `;
      } else if (!slot.turret) {
        row.innerHTML = `
          <div class="slot-info">
            <span class="slot-name">第 ${idx + 1} 炮台挂载位 (空置)</span>
            <span class="slot-desc">请选择建造的原始投石防空塔</span>
          </div>
          <div class="turret-build-btns">
            <button class="btn" onclick="window.game.buildTurret(${idx}, 'turret_1_1')">🏹 1阶单发塔 ($100)</button>
            <button class="btn" onclick="window.game.buildTurret(${idx}, 'turret_1_2')">⚔️ 2阶双联塔 ($200)</button>
            <button class="btn" onclick="window.game.buildTurret(${idx}, 'turret_1_3')">☄️ 3阶巨石炮 ($500)</button>
          </div>
        `;
      } else {
        const t = slot.turret;
        const nextId = t.level === 1 ? 'turret_1_2' : (t.level === 2 ? 'turret_1_3' : null);
        const upgradeCost = nextId ? GAME_CONFIG.turrets[nextId].cost : 0;
        row.innerHTML = `
          <div class="slot-info">
            <span class="slot-name">${t.displayName}</span>
            <span class="slot-desc">伤害: ${t.damage} · 射程: ${t.range}m · 回售: +$${t.sellRefund}</span>
          </div>
          <div class="turret-build-btns">
            ${nextId ? `<button class="btn btn-upgrade" onclick="window.game.buildTurret(${idx}, '${nextId}')">⬆️ 升为${nextId === 'turret_1_2' ? '2阶' : '3阶'} ($${upgradeCost})</button>` : `<span class="max-badge">⭐ 满级要塞炮</span>`}
            <button class="btn btn-sell" onclick="window.game.sellTurret(${idx})">💰 出售 (+${t.sellRefund})</button>
          </div>
        `;
      }
      container.appendChild(row);
    });
  }

  buildTurret(slotIdx, turretId) {
    const cost = GAME_CONFIG.turrets[turretId].cost;
    if (this.playerGold < cost) {
      this.addFloatingText("金币不足！", this.cameraTargetX, 4.0, '#f87171');
      return;
    }
    this.playerGold -= cost;
    this.turretManager.buildTurret(slotIdx, turretId, true);
    this.renderTurretPanel();
    this.updateHUD();
  }

  sellTurret(slotIdx) {
    const refund = this.turretManager.sellTurret(slotIdx, true);
    this.playerGold += refund;
    this.renderTurretPanel();
    this.updateHUD();
  }

  unlockTurretSlot(slotIdx) {
    const cost = GAME_CONFIG.base.expansionCosts[slotIdx];
    if (this.playerGold < cost) {
      this.addFloatingText("金币不足！", this.cameraTargetX, 4.0, '#f87171');
      return;
    }
    this.playerGold -= cost;
    this.turretManager.unlockSlot(slotIdx, true);
    this.renderTurretPanel();
    this.updateHUD();
  }

  restart() {
    const modal = document.getElementById('modal-gameover');
    if (modal) modal.style.display = 'none';

    this.playerGold = GAME_CONFIG.base.startingMoney;
    this.playerExp = 0;
    this.playerBaseHp = GAME_CONFIG.base.maxHp;
    this.enemyBaseHp = GAME_CONFIG.base.maxHp;
    this.gameTime = 0;
    this.isGameOver = false;
    this.spawnQueue = [];
    this.currentSpawnProgress = 0;

    [...this.unitManager.playerUnits, ...this.unitManager.enemyUnits].forEach(u => {
      if (u.mesh) this.scene.remove(u.mesh);
    });
    this.unitManager.playerUnits = [];
    this.unitManager.enemyUnits = [];

    this.turretManager.reset();
    this.specialAttack.currentCooldown = 15;
    this.specialAttack.isReady = false;

    this.botAI.enemyMoney = GAME_CONFIG.base.startingMoney;
    this.botAI.unitSpawnTimer = 3.0;

    this.updateHUD();
    this.addFloatingText("全新战局开启！", 0, 4.0, '#38bdf8');
  }
}

// 启动游戏实例并挂载至全局
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameApp();
  });
} else {
  // 当用户在命令行敲击 node main.js 时的智能提示与服务器自启动
  console.log('\n======================================================');
  console.log('🎮 《战争进化史 3D》正在为您启动服务...');
  console.log('ℹ️  提示：main.js 是浏览器端 WebGL 游戏代码，非 Node 后端。');
  console.log('🚀 正在自动为您拉起游戏 HTTP 本地服务器并打开浏览器...');
  console.log('======================================================\n');
  import('../server.js');
}

