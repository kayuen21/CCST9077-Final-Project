/**
 * Web Audio API Sound Synthesizer for Quantum Escape
 * Fully procedural - no external audio files required.
 */
class QuantumAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.isMuted = false;
    this.isInitialized = false;
    this.ambientOsc = null;
    this.ambientLfo = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.startAmbientHum();
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio could not be initialized:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    if (!this.ctx) this.init();
    this.resume();
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      const target = this.isMuted ? 0 : 0.8;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
    return !this.isMuted;
  }

  startAmbientHum() {
    if (!this.ctx) return;

    // Sub-bass drone osc (55Hz, A1)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, this.ctx.currentTime);

    // Sub-oscillator for warmth (27.5Hz)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(27.5, this.ctx.currentTime);

    // Lowpass filter for dark, heavy industrial sci-fi feel
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);
    filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    // LFO to slowly sweep filter for breathing room ambience
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(45, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(this.ambientGain);

    osc1.start();
    osc2.start();
    lfo.start();

    // Fade ambient in smoothly
    this.ambientGain.gain.setTargetAtTime(0.35, this.ctx.currentTime, 3.0);
  }

  // Typewriter soft high-tech chirp
  playTerminalType() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Subtle random frequency around 1800-2400Hz
    const freq = 1800 + Math.random() * 600;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.035);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Electrical spark crackle
  playSpark() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Buffer of noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1500 + Math.random() * 2000, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08 + Math.random() * 0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  // Terminal boot chime
  playBootChime() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [220, 440, 659.25, 880];

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delay);
      osc.stop(now + delay + 0.55);
    });
  }

  // Hologram active resonant warble
  playHologramPulse() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(330, now + 0.8);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.85);
  }

  // Power surge down the floor circuits
  playPowerSurge() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 1.2);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 1.2);
    filter.Q.setValueAtTime(5.0, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.45);
  }

  // UI button click
  playClick() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Heavy blast door unlocking clunk
  playDoorUnlock() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Sub thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.7);

    // Metal clank
    const clankOsc = this.ctx.createOscillator();
    const clankGain = this.ctx.createGain();
    clankOsc.type = 'square';
    clankOsc.frequency.setValueAtTime(320, now + 0.1);
    clankOsc.frequency.exponentialRampToValueAtTime(120, now + 0.4);

    clankGain.gain.setValueAtTime(0.001, now);
    clankGain.gain.setValueAtTime(0.15, now + 0.1);
    clankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    clankOsc.connect(clankGain);
    clankGain.connect(this.masterGain);
    clankOsc.start(now + 0.1);
    clankOsc.stop(now + 0.5);
  }

  // Quantum shake: rising sweep with a shimmering upper harmonic
  playQuantumShake() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.42);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.8);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(320, now);
    osc2.frequency.exponentialRampToValueAtTime(1120, now + 0.42);
    osc2.frequency.exponentialRampToValueAtTime(600, now + 0.8);
    osc2.detune.setValueAtTime(18, now);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.45);
    filter.Q.setValueAtTime(3.2, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.9);
    osc2.stop(now + 0.9);
  }

  // Observation / collapse: crisp chime plus a mechanical tick
  playCollapse() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    [1320, 1760, 2640].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.035;
      osc.type = i === 2 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.09 / (i + 1), t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.36);
    });

    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(180, now);
    thud.frequency.exponentialRampToValueAtTime(55, now + 0.22);
    thudGain.gain.setValueAtTime(0.22, now);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
    thud.connect(thudGain);
    thudGain.connect(this.masterGain);
    thud.start(now);
    thud.stop(now + 0.28);
  }

  // Low denial buzz for a failed procedure
  playFailBuzz() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    [92, 98].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.02);
      gain.gain.setValueAtTime(0.09, now + 0.28);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.52);
    });
  }

  // Bright confirmation arpeggio for solving a chamber
  playSuccessArpeggio() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.11;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.58);
    });
  }

  // Slow cinematic swell used between prologue scenes
  playSceneSwell() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(58, now);
    osc.frequency.linearRampToValueAtTime(82, now + 2.2);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(116, now);
    osc2.frequency.linearRampToValueAtTime(164, now + 2.2);
    osc2.detune.setValueAtTime(-9, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.linearRampToValueAtTime(900, now + 1.4);
    filter.frequency.linearRampToValueAtTime(280, now + 3.0);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.9);
    gain.gain.linearRampToValueAtTime(0.055, now + 2.0);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 3.3);
    osc2.stop(now + 3.3);
  }
}

window.soundEngine = new QuantumAudio();
