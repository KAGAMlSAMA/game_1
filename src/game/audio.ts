/* 轻量 WebAudio 合成音效 —— 无外部资源 */

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  muted = false;

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.055;
      this.musicGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol = 1, slide = 0, delay = 0) {
    if (!this.ctx || !this.master || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  private noise(dur: number, vol = 0.5, freq = 1800, delay = 0) {
    if (!this.ctx || !this.master || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t0);
  }

  private musicTone(freq: number, dur: number, delay = 0, vol = 1) {
    if (!this.ctx || !this.musicGain || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, t0);
    f.type = 'lowpass';
    f.frequency.value = 980;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.18 * vol, t0 + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(f).connect(g).connect(this.musicGain);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  startMusic() {
    this.ensure();
    if (this.musicTimer !== null) return;
    const scale = [196, 220, 247, 294, 330, 392, 440]; // 宫商角徵羽的温和近似
    const playPhrase = () => {
      if (!this.ctx || this.muted) return;
      const base = this.musicStep % scale.length;
      const notes = [scale[base], scale[(base + 2) % scale.length], scale[(base + 4) % scale.length], scale[(base + 1) % scale.length]];
      notes.forEach((n, i) => this.musicTone(n, 1.9, i * 0.62, i === 0 ? 1 : 0.72));
      this.musicTone(notes[0] / 2, 3.2, 0, 0.45);
      this.musicStep = (this.musicStep + 1) % 64;
    };
    playPhrase();
    this.musicTimer = window.setInterval(playPhrase, 3300);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  setMuted(v: boolean) {
    this.muted = v;
    if (this.musicGain && this.ctx) {
      const target = v ? 0.0001 : 0.055;
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.exponentialRampToValueAtTime(target, this.ctx.currentTime + 0.15);
    }
  }

  jump() { this.tone(300, 0.14, 'square', 0.5, 260); }
  grab() { this.tone(240, 0.07, 'triangle', 0.4, 120); this.noise(0.05, 0.2, 1200); }
  fly() { this.tone(523, 0.2, 'triangle', 0.45, 320); this.tone(784, 0.24, 'sine', 0.3, 240, 0.07); this.noise(0.28, 0.16, 3200); }
  flyEnd() { this.tone(660, 0.16, 'triangle', 0.35, -260); this.noise(0.12, 0.18, 1400); }
  blink() { this.noise(0.1, 0.32, 2800); this.tone(988, 0.1, 'triangle', 0.4, 620); this.tone(1319, 0.14, 'sine', 0.28, -520, 0.04); }
  breakthrough() {
    [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.36, 'triangle', 0.5, 0, i * 0.13));
    this.noise(0.8, 0.16, 2200, 0.18);
  }
  bottleneck() { this.tone(196, 0.3, 'triangle', 0.4, -40); this.tone(147, 0.34, 'sine', 0.3, -30, 0.12); }
  attack() { this.noise(0.09, 0.55, 2600); this.tone(220, 0.07, 'sawtooth', 0.22, -80); }
  hit() { this.tone(160, 0.09, 'square', 0.5, -60); this.noise(0.06, 0.4, 900); }
  crit() { this.tone(140, 0.14, 'square', 0.7, -70); this.noise(0.1, 0.6, 700); }
  fire() { this.noise(0.22, 0.42, 700); this.tone(392, 0.2, 'triangle', 0.35, -120); }
  ice() { this.tone(880, 0.16, 'triangle', 0.5, 400); this.tone(1320, 0.2, 'sine', 0.3, 300, 0.03); }
  thunder() { this.noise(0.3, 0.75, 400); this.tone(110, 0.3, 'sawtooth', 0.6, -40); this.tone(660, 0.12, 'triangle', 0.25, 120, 0.05); }
  sniperLaser() {
    this.noise(0.45, 0.9, 3200);
    this.tone(90, 0.45, 'sawtooth', 0.8, -30);
    this.tone(1320, 0.2, 'triangle', 0.5, -900, 0.02);
  }
  chargeLoop(ratio: number) {
    // 蓄力微鸣音
    this.tone(220 + ratio * 440, 0.08, 'sine', 0.18 + ratio * 0.2);
  }
  giantSword() {
    this.noise(0.35, 0.6, 600);
    this.tone(140, 0.4, 'sawtooth', 0.5, 50);
  }
  swordHoming() {
    this.noise(0.08, 0.3, 2400);
    this.tone(700 + Math.random() * 300, 0.09, 'triangle', 0.3, 300);
  }
  spin() { this.noise(0.28, 0.6, 1400); this.tone(200, 0.24, 'sawtooth', 0.3, 160); }
  buff() { this.tone(392, 0.12, 'triangle', 0.4); this.tone(523, 0.12, 'triangle', 0.4, 0, 0.09); this.tone(659, 0.18, 'triangle', 0.4, 0, 0.18); }
  hurt() { this.tone(180, 0.18, 'sawtooth', 0.6, -90); }
  mobDie() { this.tone(300, 0.16, 'square', 0.4, -200); this.noise(0.12, 0.4, 500); }
  pickup() { this.tone(988, 0.07, 'square', 0.35); this.tone(1319, 0.1, 'square', 0.35, 0, 0.06); }
  gold() { this.tone(1568, 0.06, 'square', 0.3); this.tone(2093, 0.09, 'square', 0.3, 0, 0.05); }
  potion() { this.tone(420, 0.1, 'sine', 0.5, 120); this.tone(560, 0.12, 'sine', 0.4, 140, 0.08); }
  equip() { this.tone(523, 0.08, 'square', 0.35); this.tone(784, 0.12, 'square', 0.35, 0, 0.07); }
  levelup() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.16, 'square', 0.45, 0, i * 0.09));
    this.noise(0.4, 0.2, 3000, 0.2);
  }
  skillUp() { this.tone(659, 0.1, 'square', 0.4); this.tone(988, 0.16, 'square', 0.4, 0, 0.08); }
  die() { [400, 320, 250, 180].forEach((f, i) => this.tone(f, 0.22, 'sawtooth', 0.5, -30, i * 0.14)); }
  boss() { this.tone(110, 0.5, 'sawtooth', 0.7, -30); this.tone(165, 0.5, 'sawtooth', 0.5, -40, 0.1); }
  portal() { this.tone(440, 0.25, 'sine', 0.4, 440); this.tone(660, 0.3, 'sine', 0.3, 500, 0.08); }
  ui() { this.tone(700, 0.05, 'square', 0.25); }
  err() { this.tone(180, 0.12, 'square', 0.4, -60); }
}

export const sfx = new Sfx();
