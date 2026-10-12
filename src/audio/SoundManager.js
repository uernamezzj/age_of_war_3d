/**
 * SoundManager.js - 音效与经典 BGM 播放器 (Waterflame - Glorious Morning 及原版打击音效)
 */

export class SoundManager {
  constructor() {
    this.musicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.isMuted = false;

    this.bgm = new Audio('./audio/Glorious Morning.mp3');
    this.bgm.loop = true;
    this.bgm.volume = this.musicVolume;

    // 音效缓存池
    this.sfxPool = {
      slash: ['./audio/whack_01.mp3', './audio/stab_01.mp3'],
      shoot: ['./audio/whoosh_01.mp3', './audio/whoosh_02.mp3'],
      hit: ['./audio/sword_clash_01.mp3'],
      hit_base: ['./audio/whack_01.mp3'],
      die: ['./audio/die_01.mp3', './audio/die_02.mp3', './audio/die_03.mp3'],
      spawn: ['./audio/click.wav'],
      click: ['./audio/click.wav'],
      hover: ['./audio/hover.mp3'],
      explosion: ['./audio/explosion_01.mp3', './audio/explosion_02.mp3'],
      meteor_hit: ['./audio/special_1.mp3'],
      victory: ['./audio/powerup_special.mp3'],
      defeat: ['./audio/cave_tank_die.mp3'],
      special: ['./audio/powerup_special.mp3'],
      special_1: ['./audio/special_1.mp3'],
      special_2: ['./audio/special_2.mp3'],
      special_3: ['./audio/special_3.wav'],
      special_4: ['./audio/special_4.mp3'],
      special_5: ['./audio/special_5.mp3']
    };

    this.hasStartedBGM = false;
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.bgm) {
      this.bgm.volume = this.isMuted ? 0 : this.musicVolume;
    }
  }

  setEffectsVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.bgm) {
      this.bgm.volume = this.isMuted ? 0 : this.musicVolume;
    }
    return this.isMuted;
  }

  startBGM() {
    if (this.hasStartedBGM) return;
    this.bgm.volume = this.isMuted ? 0 : this.musicVolume;
    this.bgm.play().then(() => {
      this.hasStartedBGM = true;
    }).catch(() => {
      // 浏览器需要用户交互后才允许自动播放
    });
  }

  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
      this.hasStartedBGM = false;
    }
  }

  playPowerup(type) {
    if (this.isMuted) return;
    const map = {
      coin: './audio/powerup_coin.wav',
      exp: './audio/powerup_exp.wav',
      health: './audio/powerup_health.ogg',
      special: './audio/powerup_special.mp3',
      speed: './audio/powerup_speed.wav',
      pop: './audio/powerup_pop.ogg'
    };
    const file = map[type] || './audio/powerup_pop.ogg';
    const audio = new Audio(file);
    audio.volume = this.sfxVolume;
    audio.play().catch(() => {});
  }

  play(name) {
    if (this.isMuted) return;
    const list = this.sfxPool[name];
    if (!list || list.length === 0) return;

    const file = list[Math.floor(Math.random() * list.length)];
    const audio = new Audio(file);
    audio.volume = this.sfxVolume;
    audio.play().catch(() => {});
  }

  // 1:1 对齐 Unity MusicManager.cs PlayTurret(age, level) 原版全时代炮塔打击音效
  playTurret(age, level) {
    if (this.isMuted) return;
    const turretSfxMap = {
      '1-1': './audio/knight_range_attack.mp3',
      '1-2': './audio/cave_turret_2_attack.mp3',
      '1-3': './audio/catapult.mp3',
      '2-1': './audio/catapult.mp3',
      '2-2': './audio/catapult.mp3',
      '2-3': './audio/fire_01.mp3',
      '3-1': './audio/medival_range_attack.mp3',
      '3-2': './audio/medival_range_attack.mp3',
      '3-3': './audio/medival_range_attack.mp3',
      '4-1': './audio/miltary_turret_attack.mp3',
      '4-2': './audio/medival_tank_attack.mp3',
      '4-3': './audio/miltary_turret_3_attack.mp3',
      '5-1': './audio/future_tank_attack.mp3',
      '5-2': './audio/future_turret_attack.mp3',
      '5-3': './audio/future_turret_attack.mp3'
    };
    const key = `${age}-${level}`;
    const file = turretSfxMap[key] || './audio/whoosh_01.mp3';
    const audio = new Audio(file);
    audio.volume = 0.6;
    audio.play().catch(() => {});
  }

  // 直接按音效名播放炮塔音效
  playTurretClip(clipName) {
    if (this.isMuted) return;
    const file = `./audio/${clipName}.mp3`;
    const audio = new Audio(file);
    audio.volume = 0.6;
    audio.play().catch(() => {});
  }
}
