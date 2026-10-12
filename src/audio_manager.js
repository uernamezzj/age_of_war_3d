/**
 * 《战争进化史 3D》WebAudio 音效与音乐总监
 * 搭载《Glorious Morning》及全套原版石器时代音效
 */

class AudioManager {
  constructor() {
    this.bgm = null;
    this.bgmVolume = 0.55;
    this.sfxVolume = 0.75;
    this.isMuted = false;
    this.isBgmPlaying = false;
    this.hasUserInteracted = false;

    // 预定义音效映射
    this.sfxMap = {
      click: './audio/click.wav',
      coin: './audio/powerup_coin.wav',
      exp: './audio/powerup_exp.wav',
      whack: './audio/whack_01.mp3',
      whoosh1: './audio/whoosh_01.mp3',
      whoosh2: './audio/whoosh_02.mp3',
      catapult: './audio/catapult.mp3',
      turret2: './audio/cave_turret_2_attack.mp3',
      special: './audio/special_1.mp3',
      explosion1: './audio/explosion_01.mp3',
      explosion2: './audio/explosion_02.mp3',
      tank_die: './audio/cave_tank_die.mp3',
      die_01: './audio/die_01.mp3',
      die_02: './audio/die_02.mp3',
      die_03: './audio/die_03.mp3',
      die_04: './audio/die_04.mp3',
      die_05: './audio/die_05.mp3',
    };

    // 音频缓存池
    this.audioPool = {};
    this.initBGM();
  }

  initBGM() {
    if (typeof Audio === 'undefined') return;
    this.bgm = new Audio('./audio/Glorious Morning.mp3');
    this.bgm.loop = true;
    this.bgm.volume = this.bgmVolume;
  }

  // 用户首次交互后解锁音频自动播放权限
  unlockAudio() {
    if (this.hasUserInteracted) return;
    this.hasUserInteracted = true;
    if (!this.isMuted && !this.isBgmPlaying) {
      this.playBGM();
    }
  }

  playBGM() {
    if (!this.bgm) return;
    this.bgm.volume = this.isMuted ? 0 : this.bgmVolume;
    this.bgm.play().then(() => {
      this.isBgmPlaying = true;
    }).catch(err => {
      console.warn("BGM 自动播放受浏览器策略拦截，待点击后播放:", err);
    });
  }

  pauseBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.isBgmPlaying = false;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.bgm) {
      this.bgm.volume = this.isMuted ? 0 : this.bgmVolume;
      if (!this.isMuted && !this.isBgmPlaying) {
        this.playBGM();
      }
    }
    return this.isMuted;
  }

  setBGMVolume(vol) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    if (this.bgm && !this.isMuted) {
      this.bgm.volume = this.bgmVolume;
    }
  }

  setSFXVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  // 播放单发音效 (轻量Audio实例复用)
  playSFX(name, pitchVariation = 0.05, volumeScale = 1.0) {
    if (this.isMuted) return;

    let soundSrc = this.sfxMap[name];
    if (!soundSrc) {
      if (name === 'die') {
        const idx = Math.floor(Math.random() * 5) + 1;
        soundSrc = this.sfxMap[`die_0${idx}`];
      } else {
        return;
      }
    }

    try {
      const audio = new Audio(soundSrc);
      audio.volume = Math.min(1, this.sfxVolume * volumeScale);
      if (pitchVariation > 0) {
        // 轻微音调起伏避免机械感
        audio.playbackRate = 1.0 + (Math.random() * 2 - 1) * pitchVariation;
      }
      audio.play().catch(() => {});
    } catch (e) {
      console.warn("播放音效异常:", e);
    }
  }

  // 便捷方法
  playAttack() { this.playSFX('whack', 0.1); }
  playWhoosh() { this.playSFX(Math.random() > 0.5 ? 'whoosh1' : 'whoosh2', 0.08); }
  playDeath(isTank = false) {
    if (isTank) {
      this.playSFX('tank_die', 0.05, 1.2);
    } else {
      this.playSFX('die', 0.1);
    }
  }
  playCoin() { this.playSFX('coin', 0.05, 0.9); }
  playTurret(level = 1) {
    if (level === 2) {
      this.playSFX('turret2', 0.08);
    } else {
      this.playSFX('catapult', 0.05);
    }
  }
  playSpecial() { this.playSFX('special', 0, 1.3); }
  playExplosion() {
    this.playSFX(Math.random() > 0.5 ? 'explosion1' : 'explosion2', 0.1, 1.1);
  }
  playClick() { this.playSFX('click', 0, 0.6); }
}

export const audioManager = new AudioManager();
