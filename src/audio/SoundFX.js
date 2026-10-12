/**
 * 零外部音频依赖的 Web Audio API 声音合成管理器
 */
export class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  play(type) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (type === 'step') {
      // 士兵脚步
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.08);
      osc.start(t);
      osc.stop(t + 0.08);
    } else if (type === 'gun') {
      // 突击步枪开火
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(550, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.16);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
      osc.start(t);
      osc.stop(t + 0.16);
    } else if (type === 'laser') {
      // 未来激光等离子
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.2);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    } else if (type === 'hit') {
      // 命中爆炸
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.25);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.25);
    } else if (type === 'spawn') {
      // 造兵出征号角/提示
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, t);
      osc.frequency.setValueAtTime(440, t + 0.08);
      osc.frequency.setValueAtTime(550, t + 0.16);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.28);
      osc.start(t);
      osc.stop(t + 0.28);
    }
  }
}

export const sound = new SoundFX();
