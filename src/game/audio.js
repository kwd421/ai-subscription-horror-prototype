export class ProceduralAudio {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  async ensure() {
    if (this.muted) return;
    if (!this.context) {
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (muted && this.context) {
      this.context.suspend();
    }
  }

  async click() {
    await this.tone(260, 0.035, 'square', 0.03);
  }

  async beep() {
    await this.tone(880, 0.12, 'sine', 0.045);
  }

  async thud() {
    if (this.muted) return;
    await this.ensure();
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(96, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain).connect(this.context.destination);
    osc.start(now);
    osc.stop(now + 0.24);
    this.noise(0.12, 0.08);
  }

  async staticBurst(duration = 0.24, volume = 0.055) {
    this.noise(duration, volume);
  }

  async scare() {
    if (this.muted) return;
    await this.ensure();
    const now = this.context.currentTime;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.24, now + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
    const oscA = this.context.createOscillator();
    const oscB = this.context.createOscillator();
    oscA.type = 'sawtooth';
    oscB.type = 'square';
    oscA.frequency.setValueAtTime(90, now);
    oscA.frequency.exponentialRampToValueAtTime(38, now + 0.7);
    oscB.frequency.setValueAtTime(640, now);
    oscB.frequency.exponentialRampToValueAtTime(160, now + 0.45);
    oscA.connect(gain);
    oscB.connect(gain);
    gain.connect(this.context.destination);
    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + 0.75);
    oscB.stop(now + 0.55);
    this.noise(0.58, 0.18);
  }

  async chime() {
    await this.ensure();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
      this.tone(freq, 0.18, 'sine', 0.06, index * 0.12);
    });
  }

  async tone(freq, duration, type = 'sine', volume = 0.06, delay = 0) {
    if (this.muted) return;
    await this.ensure();
    const now = this.context.currentTime + delay;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(this.context.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  async noise(duration, volume) {
    if (this.muted) return;
    await this.ensure();
    const bufferSize = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    gain.gain.value = volume;
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start();
  }
}
