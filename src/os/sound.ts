// Cozy Web Audio API synthesizer for UI sound effects and Pocket Music Box melodies

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private musicTimer: number | null = null;
  private stepIndex = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stopMusic();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  playTone(freq: number, duration = 0.08, type: OscillatorType = 'sine', gainVal = 0.08) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playClick() {
    this.playTone(580, 0.045, 'triangle', 0.05);
  }

  /** 顶部提醒弹窗的轻提示音 */
  playNotify() {
    this.playTone(880, 0.06, 'sine', 0.045);
    setTimeout(() => this.playTone(1174.66, 0.09, 'sine', 0.04), 80);
  }

  playOpenWindow() {
    this.playTone(523.25, 0.07, 'sine', 0.06);
    setTimeout(() => this.playTone(659.25, 0.09, 'sine', 0.06), 55);
  }

  playClueFound() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, 0.14, 'triangle', 0.07), idx * 75);
    });
  }

  playError() {
    this.playTone(240, 0.12, 'sawtooth', 0.04);
    setTimeout(() => this.playTone(190, 0.15, 'sawtooth', 0.04), 90);
  }

  /** 调频时的短促沙沙声 */
  playRadioStatic(duration = 0.55) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      const fade = 1 - i / length;
      data[i] = (Math.random() * 2 - 1) * fade * fade;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(2200, ctx.currentTime + duration);
    filter.Q.value = 0.9;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(ctx.currentTime);
    src.stop(ctx.currentTime + duration + 0.02);
  }

  /** 广播字幕上屏时的轻响 */
  playRadioTick() {
    this.playTone(294, 0.035, 'triangle', 0.012);
  }

  playVictory() {
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const times = [0, 90, 180, 270, 400, 500];
    fanfare.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.22, 'triangle', 0.08), times[i]);
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
    const melody = tracks[trackIndex % tracks.length];
    this.stepIndex = 0;

    const tick = () => {
      if (this.muted) return;
      const note = melody[this.stepIndex % melody.length];
      this.playTone(note, 0.24, 'sine', 0.045);
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
