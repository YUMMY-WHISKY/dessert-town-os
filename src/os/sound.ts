// Cozy Web Audio API synthesizer for UI sound effects and Pocket Music Box melodies

interface ToneOptions {
  freq: number;
  /** 终止频率，用于滑音（猫叫、滑哨） */
  freqEnd?: number;
  duration?: number;
  type?: OscillatorType;
  gain?: number;
  /** 低通滤波截止频率，克制刺耳的高频 */
  lowpass?: number;
  /** 起始延迟（秒） */
  delay?: number;
  /** 颤音深度（Hz） */
  vibrato?: number;
}

interface NoiseOptions {
  duration?: number;
  filter?: BiquadFilterType;
  freqStart?: number;
  freqEnd?: number;
  q?: number;
  gain?: number;
  delay?: number;
  attack?: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private musicTimer: number | null = null;
  private stepIndex = 0;
  private lastClickAt = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      // 主音量 + 压缩器：多个音效叠在一起也不会爆音
      const master = this.ctx.createGain();
      master.gain.value = 0.85;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 24;
      comp.ratio.value = 6;
      comp.attack.value = 0.004;
      comp.release.value = 0.18;
      master.connect(comp);
      comp.connect(this.ctx.destination);
      this.master = master;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getOutput(ctx: AudioContext): AudioNode {
    return this.master ?? ctx.destination;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const length = Math.floor(ctx.sampleRate * 1.2);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.85, this.ctx.currentTime, 0.02);
    }
    if (muted) {
      this.stopMusic();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** 单个音符，带起音、衰减和低通，比裸振荡器柔和 */
  private tone(opts: ToneOptions): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const {
      freq,
      freqEnd,
      duration = 0.08,
      type = 'sine',
      gain: gainVal = 0.08,
      lowpass = 5200,
      delay = 0,
      vibrato = 0,
    } = opts;

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (freqEnd && freqEnd !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), start + duration);
    }

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(lowpass, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainVal, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getOutput(ctx));

    if (vibrato > 0) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(7.5, start);
      lfoGain.gain.setValueAtTime(vibrato, start);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(start);
      lfo.stop(start + duration + 0.05);
    }

    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  /** 噪声爆发：翻纸、盖章、打字、收音机底噪都靠它 */
  private noise(opts: NoiseOptions = {}): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const {
      duration = 0.12,
      filter: filterType = 'bandpass',
      freqStart = 1200,
      freqEnd = 800,
      q = 0.9,
      gain: gainVal = 0.04,
      delay = 0,
      attack = 0.008,
    } = opts;

    const start = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer(ctx);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freqStart, start);
    filter.frequency.linearRampToValueAtTime(Math.max(40, freqEnd), start + duration);
    filter.Q.value = q;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainVal, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.getOutput(ctx));
    src.start(start);
    src.stop(start + duration + 0.03);
  }

  /** 兼容旧接口 */
  playTone(freq: number, duration = 0.08, type: OscillatorType = 'sine', gainVal = 0.08) {
    this.tone({ freq, duration, type, gain: gainVal });
  }

  playClick() {
    const now = performance.now();
    if (now - this.lastClickAt < 24) return;
    this.lastClickAt = now;
    this.tone({ freq: 620, freqEnd: 520, duration: 0.045, type: 'triangle', gain: 0.05 });
    this.noise({ duration: 0.03, filter: 'highpass', freqStart: 3200, freqEnd: 2400, gain: 0.016 });
  }

  /** 页签 / 列表项切换 */
  playTab() {
    this.tone({ freq: 760, duration: 0.035, type: 'triangle', gain: 0.032 });
  }

  /** 悬停极轻的反馈 */
  playHover() {
    this.tone({ freq: 980, duration: 0.025, type: 'sine', gain: 0.014 });
  }

  /** 顶部提醒弹窗的轻提示音 */
  playNotify() {
    this.tone({ freq: 880, duration: 0.07, type: 'sine', gain: 0.045 });
    this.tone({ freq: 1174.66, duration: 0.11, type: 'sine', gain: 0.038, delay: 0.08 });
  }

  playOpenWindow() {
    this.tone({ freq: 523.25, duration: 0.07, type: 'sine', gain: 0.055 });
    this.tone({ freq: 659.25, duration: 0.1, type: 'sine', gain: 0.055, delay: 0.05 });
    this.tone({ freq: 1046.5, duration: 0.12, type: 'sine', gain: 0.018, delay: 0.09 });
  }

  playCloseWindow() {
    this.tone({ freq: 660, freqEnd: 520, duration: 0.075, type: 'sine', gain: 0.04 });
    this.tone({ freq: 440, freqEnd: 330, duration: 0.1, type: 'sine', gain: 0.032, delay: 0.045 });
  }

  playClueFound() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.tone({ freq: n, duration: 0.18, type: 'triangle', gain: 0.065, delay: idx * 0.075 });
    });
    // 末尾一点高频闪光
    this.noise({
      duration: 0.16,
      filter: 'highpass',
      freqStart: 6000,
      freqEnd: 4200,
      gain: 0.012,
      delay: 0.16,
    });
  }

  /** 成就解锁：比线索更隆重 */
  playAchievement() {
    const melody = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    melody.forEach((n, idx) => {
      this.tone({ freq: n, duration: 0.26, type: 'triangle', gain: 0.055, delay: idx * 0.085 });
      this.tone({ freq: n * 2, duration: 0.2, type: 'sine', gain: 0.016, delay: idx * 0.085 });
    });
    this.tone({ freq: 523.25, duration: 0.7, type: 'sine', gain: 0.03, delay: 0.42 });
    this.tone({ freq: 783.99, duration: 0.7, type: 'sine', gain: 0.022, delay: 0.42 });
  }

  playError() {
    this.tone({ freq: 240, freqEnd: 210, duration: 0.13, type: 'sawtooth', gain: 0.038, lowpass: 1600 });
    this.tone({ freq: 190, freqEnd: 160, duration: 0.17, type: 'sawtooth', gain: 0.036, delay: 0.09, lowpass: 1400 });
    this.noise({ duration: 0.08, filter: 'lowpass', freqStart: 500, freqEnd: 200, gain: 0.018 });
  }

  /** 推理成立：三连上行 + 一记轻响 */
  playCombine() {
    [659.25, 830.61, 987.77, 1318.5].forEach((n, idx) => {
      this.tone({ freq: n, duration: 0.16, type: 'triangle', gain: 0.05, delay: idx * 0.06 });
    });
    this.tone({ freq: 1975.53, duration: 0.3, type: 'sine', gain: 0.014, delay: 0.24 });
  }

  /** 翻纸／打开文件 */
  playPaper() {
    this.noise({ duration: 0.16, filter: 'bandpass', freqStart: 2200, freqEnd: 900, q: 0.7, gain: 0.035 });
  }

  /** 键盘敲击／发送消息 */
  playType() {
    this.noise({ duration: 0.028, filter: 'highpass', freqStart: 3600, freqEnd: 2800, gain: 0.02 });
    this.tone({ freq: 1500, duration: 0.02, type: 'square', gain: 0.008 });
  }

  playSend() {
    this.tone({ freq: 620, freqEnd: 940, duration: 0.11, type: 'sine', gain: 0.04 });
    this.tone({ freq: 1240, duration: 0.09, type: 'sine', gain: 0.018, delay: 0.06 });
  }

  /** 收到邮件 */
  playMail() {
    this.tone({ freq: 987.77, duration: 0.12, type: 'sine', gain: 0.04 });
    this.tone({ freq: 1318.5, duration: 0.16, type: 'sine', gain: 0.034, delay: 0.1 });
  }

  /** 盖章／归档 */
  playStamp() {
    this.tone({ freq: 110, freqEnd: 70, duration: 0.16, type: 'sine', gain: 0.09, lowpass: 700 });
    this.noise({ duration: 0.1, filter: 'lowpass', freqStart: 900, freqEnd: 300, gain: 0.045 });
  }

  /** 抽屉／密码锁打开 */
  playUnlock() {
    this.noise({ duration: 0.05, filter: 'bandpass', freqStart: 1800, freqEnd: 1200, q: 2, gain: 0.03 });
    this.tone({ freq: 392, duration: 0.14, type: 'sine', gain: 0.04, delay: 0.05 });
    this.tone({ freq: 587.33, duration: 0.16, type: 'sine', gain: 0.04, delay: 0.11 });
    this.tone({ freq: 783.99, duration: 0.26, type: 'sine', gain: 0.04, delay: 0.17 });
  }

  /** 登录结果 */
  playLoginResult(ok: boolean) {
    if (ok) {
      [523.25, 659.25, 880].forEach((n, idx) => {
        this.tone({ freq: n, duration: 0.2, type: 'sine', gain: 0.05, delay: idx * 0.08 });
      });
    } else {
      this.tone({ freq: 330, duration: 0.12, type: 'square', gain: 0.03, lowpass: 1200 });
      this.tone({ freq: 247, duration: 0.18, type: 'square', gain: 0.03, delay: 0.1, lowpass: 1100 });
    }
  }

  /** 开机／进入系统 */
  playBoot() {
    this.tone({ freq: 261.63, duration: 1.1, type: 'sine', gain: 0.035 });
    this.tone({ freq: 392, duration: 1.1, type: 'sine', gain: 0.028, delay: 0.06 });
    this.tone({ freq: 523.25, duration: 1.2, type: 'sine', gain: 0.026, delay: 0.12 });
    this.tone({ freq: 783.99, duration: 1.0, type: 'sine', gain: 0.014, delay: 0.24 });
  }

  /** 警告／施压 */
  playWarning() {
    this.tone({ freq: 220, duration: 0.14, type: 'square', gain: 0.026, lowpass: 1200 });
    this.tone({ freq: 220, duration: 0.14, type: 'square', gain: 0.026, delay: 0.18, lowpass: 1200 });
  }

  /** 猫叫：频率先扬后抑 + 颤音 */
  playMeow() {
    this.tone({
      freq: 620,
      freqEnd: 900,
      duration: 0.16,
      type: 'sawtooth',
      gain: 0.026,
      lowpass: 2400,
      vibrato: 26,
    });
    this.tone({
      freq: 900,
      freqEnd: 480,
      duration: 0.22,
      type: 'sawtooth',
      gain: 0.022,
      delay: 0.14,
      lowpass: 1800,
      vibrato: 18,
    });
  }

  /** 呼噜声：低频抖动 */
  playPurr() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const start = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const tremolo = ctx.createOscillator();
    const tremoloGain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(72, start);

    tremolo.frequency.setValueAtTime(22, start);
    tremoloGain.gain.setValueAtTime(0.5, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.05, start + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.75);

    // 用 LFO 调制音量做出呼噜的起伏
    const ampGate = ctx.createGain();
    ampGate.gain.setValueAtTime(1, start);
    tremolo.connect(tremoloGain);
    tremoloGain.connect(ampGate.gain);

    osc.connect(ampGate);
    ampGate.connect(gain);
    gain.connect(this.getOutput(ctx));

    osc.start(start);
    osc.stop(start + 0.78);
    tremolo.start(start);
    tremolo.stop(start + 0.78);
  }

  /** 调频时的短促沙沙声 */
  playRadioStatic(duration = 0.55) {
    this.noise({
      duration,
      filter: 'bandpass',
      freqStart: 900,
      freqEnd: 2200,
      q: 0.9,
      gain: 0.045,
      attack: 0.08,
    });
  }

  /** 广播字幕上屏时的轻响 */
  playRadioTick() {
    this.tone({ freq: 294, duration: 0.035, type: 'triangle', gain: 0.012 });
  }

  playVictory() {
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const times = [0, 90, 180, 270, 400, 500];
    fanfare.forEach((freq, i) => {
      this.tone({ freq, duration: 0.26, type: 'triangle', gain: 0.075, delay: times[i] / 1000 });
    });
    // 低音铺底 + 结尾闪光
    this.tone({ freq: 130.81, duration: 1.1, type: 'sine', gain: 0.05, delay: 0.2 });
    this.tone({ freq: 196, duration: 1.0, type: 'sine', gain: 0.032, delay: 0.4 });
    this.noise({
      duration: 0.5,
      filter: 'highpass',
      freqStart: 7000,
      freqEnd: 5000,
      gain: 0.012,
      delay: 0.5,
    });
  }

  startMusic(trackIndex: number) {
    this.stopMusic();
    if (this.muted) return;

    const tracks = [
      // 午后甜点店
      [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 659.25, 523.25],
      // 雨天侦探社
      [440, 523.25, 659.25, 587.33, 493.88, 523.25, 392, 440],
      // 轻快八音盒
      [659.25, 783.99, 880, 783.99, 698.46, 659.25, 587.33, 523.25],
    ];
    const basses = [
      [130.81, 146.83],
      [110, 98],
      [164.81, 146.83],
    ];
    const melody = tracks[trackIndex % tracks.length];
    const bass = basses[trackIndex % basses.length];
    this.stepIndex = 0;

    const tick = () => {
      if (this.muted) return;
      const idx = this.stepIndex % melody.length;
      const note = melody[idx];
      this.tone({ freq: note, duration: 0.26, type: 'sine', gain: 0.042, lowpass: 3600 });
      this.tone({ freq: note * 2, duration: 0.14, type: 'sine', gain: 0.009 });
      if (idx % 2 === 0) {
        this.tone({
          freq: bass[Math.floor(this.stepIndex / 2) % bass.length],
          duration: 0.55,
          type: 'sine',
          gain: 0.026,
          lowpass: 500,
        });
      }
      this.stepIndex += 1;
    };

    tick();
    this.musicTimer = window.setInterval(tick, 380);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundEngine = new SoundEngine();
