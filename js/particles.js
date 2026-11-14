/**
 * Quantum Particle & Visual FX Engine for Chamber Introduction
 * Handles canvas-based sparks, circuit energy pulses, dust motes, and hologram waveforms.
 */
class ChamberFX {
  constructor(canvasId, containerId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.container = document.getElementById(containerId);

    this.width = 0;
    this.height = 0;
    this.dpr = window.devicePixelRatio || 1;

    // State
    this.isRunning = false;
    this.isSpeaking = false;
    this.isSurging = false;
    this.lastSparkTime = 0;
    this.sparkInterval = 2200; // ms

    // Particle arrays
    this.sparks = [];
    this.dustMotes = [];
    this.circuitPackets = [];

    // Floor circuit paths (normalized 0..1 coordinates matching s1.jpg)
    this.circuitPaths = [
      [
        { x: 0.32, y: 0.77 },
        { x: 0.39, y: 0.81 },
        { x: 0.48, y: 0.79 },
        { x: 0.57, y: 0.73 },
        { x: 0.64, y: 0.73 }
      ],
      [
        { x: 0.31, y: 0.82 },
        { x: 0.42, y: 0.86 },
        { x: 0.53, y: 0.83 },
        { x: 0.62, y: 0.78 },
        { x: 0.71, y: 0.76 }
      ],
      [
        { x: 0.34, y: 0.88 },
        { x: 0.45, y: 0.92 },
        { x: 0.58, y: 0.89 },
        { x: 0.67, y: 0.83 },
        { x: 0.73, y: 0.80 }
      ],
      [
        { x: 0.30, y: 0.75 },
        { x: 0.35, y: 0.78 },
        { x: 0.44, y: 0.76 },
        { x: 0.54, y: 0.71 },
        { x: 0.61, y: 0.70 }
      ]
    ];

    this.initMotes(35);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  initMotes(count) {
    this.dustMotes = [];
    for (let i = 0; i < count; i++) {
      this.dustMotes.push({
        x: Math.random(),
        y: Math.random(),
        size: 0.8 + Math.random() * 2.2,
        vx: (Math.random() - 0.5) * 0.0003,
        vy: -0.0002 - Math.random() * 0.0004,
        alpha: 0.2 + Math.random() * 0.5,
        fadeSpeed: 0.002 + Math.random() * 0.004,
        fadeDir: Math.random() > 0.5 ? 1 : -1
      });
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  stop() {
    this.isRunning = false;
  }

  emitSparks(intensity = 1) {
    const count = Math.floor((12 + Math.random() * 12) * intensity);
    const originX = 0.325 * this.width;
    const originY = 0.62 * this.height;

    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * 0.9 - 0.2) * Math.PI; // shoot rightwards and slightly up/down
      const speed = (2 + Math.random() * 6) * (this.width / 1400);
      this.sparks.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.03,
        size: 1.2 + Math.random() * 2.4,
        color: Math.random() > 0.3 ? '#00f0ff' : '#ffb700',
        gravity: 0.18 * (this.height / 800)
      });
    }

    if (window.soundEngine) {
      window.soundEngine.playSpark();
    }
  }

  emitCircuitPacket() {
    const pathIdx = Math.floor(Math.random() * this.circuitPaths.length);
    this.circuitPackets.push({
      pathIdx: pathIdx,
      progress: 0,
      speed: 0.0035 + Math.random() * 0.0035,
      size: 3 + Math.random() * 2.5,
      color: Math.random() > 0.2 ? '#00f7ff' : '#ffffff'
    });
  }

  triggerSurge() {
    this.isSurging = true;
    this.emitSparks(2.5);

    // Flood circuit lines with high-speed pulses
    for (let i = 0; i < 24; i++) {
      setTimeout(() => {
        const pathIdx = i % this.circuitPaths.length;
        this.circuitPackets.push({
          pathIdx: pathIdx,
          progress: 0,
          speed: 0.012 + Math.random() * 0.008,
          size: 4 + Math.random() * 3,
          color: '#00ffff'
        });
      }, i * 45);
    }

    setTimeout(() => {
      this.isSurging = false;
    }, 2000);
  }

  getPointOnPath(points, progress) {
    if (progress <= 0) return points[0];
    if (progress >= 1) return points[points.length - 1];

    const totalSegments = points.length - 1;
    const scaledProgress = progress * totalSegments;
    const segmentIndex = Math.floor(scaledProgress);
    const segmentT = scaledProgress - segmentIndex;

    const p0 = points[segmentIndex];
    const p1 = points[Math.min(segmentIndex + 1, points.length - 1)];

    return {
      x: p0.x + (p1.x - p0.x) * segmentT,
      y: p0.y + (p1.y - p0.y) * segmentT
    };
  }

  animate(now) {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Spontaneous sparks from terminal wires
    if (now - this.lastSparkTime > this.sparkInterval) {
      this.emitSparks(this.isSurging ? 2.0 : 1.0);
      this.lastSparkTime = now;
      this.sparkInterval = 1800 + Math.random() * 2500;
    }

    // 2. Continuous ambient circuit energy packets
    if (Math.random() < 0.07 || this.isSurging) {
      this.emitCircuitPacket();
    }

    // 3. Render and update circuit packets
    this.renderCircuitPackets();

    // 4. Render and update sparks
    this.renderSparks();

    // 5. Render floating dust motes
    this.renderDustMotes();

    // 6. Render dynamic holographic waveform over Terminal X
    this.renderHologram(now);

    requestAnimationFrame(this.animate);
  }

  renderCircuitPackets() {
    this.ctx.save();
    for (let i = this.circuitPackets.length - 1; i >= 0; i--) {
      const p = this.circuitPackets[i];
      p.progress += p.speed;

      if (p.progress >= 1) {
        this.circuitPackets.splice(i, 1);
        continue;
      }

      const path = this.circuitPaths[p.pathIdx];
      const normPos = this.getPointOnPath(path, p.progress);
      const px = normPos.x * this.width;
      const py = normPos.y * this.height;

      // Outer glow
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = '#00f7ff';
      this.ctx.fillStyle = p.color;

      this.ctx.beginPath();
      this.ctx.arc(px, py, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Core bright center
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(px, py, p.size * 0.45, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  renderSparks() {
    this.ctx.save();
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += s.gravity;
      s.life -= s.decay;

      // Bounce off floor if low enough
      if (s.y > this.height * 0.85 && s.vy > 0) {
        s.vy *= -0.45;
        s.vx *= 0.7;
      }

      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }

      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = s.color;
      this.ctx.strokeStyle = s.color;
      this.ctx.lineWidth = s.size * s.life;
      this.ctx.globalAlpha = Math.max(0, s.life);

      this.ctx.beginPath();
      this.ctx.moveTo(s.x, s.y);
      this.ctx.lineTo(s.x - s.vx * 2.2, s.y - s.vy * 2.2);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  renderDustMotes() {
    this.ctx.save();
    const lampX = 0.55 * this.width;
    const lampY = 0.05 * this.height;

    for (const m of this.dustMotes) {
      m.x += m.vx;
      m.y += m.vy;
      m.alpha += m.fadeSpeed * m.fadeDir;

      if (m.alpha > 0.7) {
        m.alpha = 0.7;
        m.fadeDir = -1;
      } else if (m.alpha < 0.1) {
        m.alpha = 0.1;
        m.fadeDir = 1;
      }

      // Loop around
      if (m.y < 0.1) m.y = 0.95;
      if (m.x < 0.1) m.x = 0.9;
      if (m.x > 0.9) m.x = 0.1;

      const px = m.x * this.width;
      const py = m.y * this.height;

      // Light cone illumination boost
      const distFromLampCenter = Math.abs(px - lampX) / (this.width * 0.4);
      const lightFactor = Math.max(0.2, 1 - distFromLampCenter);

      this.ctx.fillStyle = `rgba(210, 240, 255, ${m.alpha * lightFactor * 0.6})`;
      this.ctx.beginPath();
      this.ctx.arc(px, py, m.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  renderHologram(now) {
    this.ctx.save();

    // Coordinates of holographic projection screen above terminal
    const holoCenterX = 0.275 * this.width;
    const holoCenterY = 0.435 * this.height;
    const holoWidth = 0.11 * this.width;
    const holoHeight = 0.06 * this.height;

    // Glitch chance
    const isGlitching = Math.random() < 0.04;
    const glitchOffset = isGlitching ? (Math.random() - 0.5) * 8 : 0;

    const baseAmp = this.isSpeaking ? 18 : 6;
    const timeScale = this.isSpeaking ? 0.015 : 0.005;

    // Glowing waveform
    this.ctx.shadowBlur = 14;
    this.ctx.shadowColor = '#00f7ff';
    this.ctx.strokeStyle = isGlitching ? '#ffffff' : '#00f7ff';
    this.ctx.lineWidth = isGlitching ? 3 : 1.8;
    this.ctx.globalAlpha = 0.85;

    this.ctx.beginPath();
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = (holoCenterX - holoWidth / 2) + t * holoWidth + glitchOffset;

      // Sine wave with harmonic frequencies
      const envelope = Math.sin(t * Math.PI); // Pin at edges
      const freq1 = Math.sin((t * 22) + now * timeScale);
      const freq2 = Math.cos((t * 44) - now * timeScale * 1.5);
      const yOffset = (freq1 * 0.7 + freq2 * 0.3) * baseAmp * envelope;

      const y = holoCenterY + yOffset;
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();

    // Secondary subtle echo line
    this.ctx.strokeStyle = 'rgba(0, 247, 255, 0.35)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = (holoCenterX - holoWidth / 2) + t * holoWidth;
      const envelope = Math.sin(t * Math.PI);
      const freq1 = Math.sin((t * 18) - now * timeScale * 0.8);
      const yOffset = freq1 * (baseAmp * 0.5) * envelope;
      const y = holoCenterY + yOffset;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();

    // Scanlines over the hologram
    this.ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
    const scanY = (holoCenterY - holoHeight / 2) + ((now * 0.05) % holoHeight);
    this.ctx.fillRect(holoCenterX - holoWidth / 2, scanY, holoWidth, 3);

    this.ctx.restore();
  }
}

window.ChamberFX = ChamberFX;
