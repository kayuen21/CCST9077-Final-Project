/**
 * CHAMBER 1 — THE SUPERPOSITION CHAMBER
 *
 * The puzzle: the ball began LEFT, then the machine applied one quantum shake.
 * The player builds a procedure from SHAKE and OPEN, then runs it.
 *
 *   [OPEN]                -> 50 / 50 coin flip        -> FAIL (not guaranteed)
 *   [SHAKE, OPEN]         -> always LEFT              -> PASS
 *   [SHAKE, SHAKE, OPEN]  -> 50 / 50 again            -> FAIL
 *
 * Anything with an odd number of shakes before OPEN is deterministic.
 */
(function () {
  'use strict';

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* ======================================================================
     VISUAL EFFECTS — ripples, motes and the door glow over s2.jpg
     ====================================================================== */
  class Chamber1FX {
    constructor(canvasId, containerId) {
      this.canvas = document.getElementById(canvasId);
      this.container = document.getElementById(containerId);
      if (!this.canvas || !this.container) return;

      this.ctx = this.canvas.getContext('2d');
      this.dpr = window.devicePixelRatio || 1;
      this.width = 1;
      this.height = 1;

      this.running = false;
      this.ripples = [];
      this.motes = [];
      this.sparks = [];
      this.lastTime = 0;
      this.time = 0;

      // Normalised anchors read off s2.jpg (16:9)
      this.cube = { x: 0.493, y: 0.385 };
      this.door = { x: 0.725, y: 0.45 };

      this.cubeGlow = 0;   // 0..1 breathing halo
      this.shakePulse = 0;  // decays after each shake
      this.doorOpen = 0;    // 0..1 once the door unlocks
      this.doorRed = 0;     // 0..1 flash on failure

      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      if (!this.container) return;
      const rect = this.container.getBoundingClientRect();
      this.width = Math.max(1, rect.width);
      this.height = Math.max(1, rect.height);
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.canvas.style.width = this.width + 'px';
      this.canvas.style.height = this.height + 'px';
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);

      if (!this.motes.length) this.seedMotes(30);
    }

    seedMotes(count) {
      this.motes = [];
      for (let i = 0; i < count; i++) {
        this.motes.push({
          x: Math.random(),
          y: Math.random(),
          size: 0.7 + Math.random() * 1.9,
          vx: (Math.random() - 0.5) * 0.00022,
          vy: -0.00012 - Math.random() * 0.00028,
          alpha: 0.15 + Math.random() * 0.45,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.lastTime = performance.now();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    stop() {
      this.running = false;
    }

    /** Concentric rings expanding out of the floating cube. */
    shake(strength = 1) {
      this.shakePulse = 1;
      for (let i = 0; i < 3; i++) {
        this.ripples.push({
          radius: 0,
          maxRadius: (this.width * 0.16 + i * this.width * 0.05) * strength,
          speed: 0.55 + i * 0.16,
          alpha: 0.75,
          width: 2.4 - i * 0.5,
          color: '#7fe9ff'
        });
      }
      this.emitSparks(16);
    }

    /** A tighter burst for the moment of observation. */
    collapseFlash(side) {
      this.ripples.push({
        radius: 0,
        maxRadius: this.width * 0.13,
        speed: 1.1,
        alpha: 0.95,
        width: 3,
        color: '#ffffff'
      });
      this.emitSparks(22, this.cube.y + 0.12);
      this.shakePulse = 0.5;
    }

    emitSparks(count, originYOverride) {
      const originX = this.cube.x * this.width;
      const originY = (originYOverride !== undefined ? originYOverride : this.cube.y) * this.height;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.6 + Math.random() * 2.4) * (this.width / 1200);
        this.sparks.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - speed * 0.3,
          life: 1,
          decay: 0.012 + Math.random() * 0.02,
          size: 1 + Math.random() * 2,
          color: Math.random() > 0.35 ? '#8ff3ff' : '#ffffff'
        });
      }
    }

    openDoor() {
      this.doorOpen = 1;
      this.doorRed = 0;
    }

    failDoor() {
      this.doorRed = 1;
    }

    reset() {
      this.doorOpen = 0;
      this.doorRed = 0;
      this.ripples = [];
      this.sparks = [];
    }

    loop(now) {
      if (!this.running) return;
      const dt = Math.min(48, now - this.lastTime) / 16.67;
      this.lastTime = now;
      this.time += dt;

      const c = this.ctx;
      c.clearRect(0, 0, this.width, this.height);

      this.shakePulse = Math.max(0, this.shakePulse - dt * 0.018);

      this.drawCubeHalo(c);
      this.drawRipples(c, dt);
      this.drawSparks(c, dt);
      this.drawMotes(c, dt);
      this.drawDoor(c, dt);

      requestAnimationFrame(this.loop);
    }

    drawCubeHalo(c) {
      const cx = this.cube.x * this.width;
      const cy = this.cube.y * this.height;
      const breathe = 0.5 + 0.5 * Math.sin(this.time * 0.021);
      const radius = this.width * (0.10 + 0.014 * breathe + 0.05 * this.shakePulse);

      const grad = c.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const strength = 0.16 + 0.10 * breathe + 0.34 * this.shakePulse;
      grad.addColorStop(0, `rgba(150, 240, 255, ${strength})`);
      grad.addColorStop(0.55, `rgba(80, 190, 255, ${strength * 0.34})`);
      grad.addColorStop(1, 'rgba(40, 120, 220, 0)');

      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = grad;
      c.beginPath();
      c.arc(cx, cy, radius, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    drawRipples(c, dt) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const cx = this.cube.x * this.width;
      const cy = this.cube.y * this.height;

      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const r = this.ripples[i];
        r.radius += r.speed * dt * (this.width / 900);
        r.alpha -= dt * 0.012;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          this.ripples.splice(i, 1);
          continue;
        }

        const progress = r.radius / r.maxRadius;
        c.globalAlpha = r.alpha * (1 - progress);
        c.strokeStyle = r.color;
        c.lineWidth = r.width * (1 - progress * 0.6);
        c.shadowBlur = 16;
        c.shadowColor = r.color;
        c.beginPath();
        // Slightly squashed ellipse reads as a field around the cube
        c.ellipse(cx, cy, r.radius, r.radius * 0.72, 0, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
    }

    drawSparks(c, dt) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const s = this.sparks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vx *= 0.985;
        s.vy = s.vy * 0.985 - 0.012 * dt;
        s.life -= s.decay * dt;
        if (s.life <= 0) {
          this.sparks.splice(i, 1);
          continue;
        }
        c.globalAlpha = s.life;
        c.fillStyle = s.color;
        c.shadowBlur = 8;
        c.shadowColor = s.color;
        c.beginPath();
        c.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    drawMotes(c, dt) {
      c.save();
      for (const m of this.motes) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.y < -0.05) m.y = 1.05;
        if (m.x < -0.05) m.x = 1.05;
        if (m.x > 1.05) m.x = -0.05;

        const twinkle = 0.55 + 0.45 * Math.sin(this.time * 0.03 + m.phase);
        c.globalAlpha = m.alpha * twinkle;
        c.fillStyle = 'rgba(200, 236, 255, 0.85)';
        c.beginPath();
        c.arc(m.x * this.width, m.y * this.height, m.size, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    drawDoor(c, dt) {
      if (this.doorOpen <= 0 && this.doorRed <= 0) return;

      this.doorRed = Math.max(0, this.doorRed - dt * 0.008);

      const cx = this.door.x * this.width;
      const cy = this.door.y * this.height;
      const rx = this.width * 0.115;
      const ry = this.height * 0.30;
      const pulse = 0.75 + 0.25 * Math.sin(this.time * 0.06);

      const color = this.doorOpen > 0 ? '0, 255, 136' : '255, 51, 102';
      const strength = this.doorOpen > 0 ? 0.42 * pulse : 0.55 * this.doorRed;

      const grad = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      grad.addColorStop(0, `rgba(${color}, ${strength})`);
      grad.addColorStop(0.6, `rgba(${color}, ${strength * 0.35})`);
      grad.addColorStop(1, `rgba(${color}, 0)`);

      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = grad;
      c.beginPath();
      c.ellipse(cx, cy, rx * 1.25, ry, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }

  /* ======================================================================
     GAME LOGIC — three escalating locks
     ====================================================================== */

  /**
   * Each lock hands the player a set of sealed boxes and a power budget.
   *
   * The boxes are opaque: nothing on the rack says whether a given ball is
   * certain or still in two places at once. The only feedback is the counter,
   * which reports HOW MANY are unresolved. Shaking one box changes that count
   * by exactly one, so each shake tells you what that box was — a box that was
   * split becomes certain (count falls) and a box that was certain becomes
   * split (count rises, and one more shake puts it back).
   *
   * Because the counter always tells you what your last move did, a careful
   * player can always reach zero. Nothing here depends on guessing.
   *
   *   Lock 1: 1 box,  1 unresolved, 2 power  -> learn shake + read the counter
   *   Lock 2: 3 boxes, all unresolved, 2 power -> SHAKE ALL BOXES is the answer
   *   Lock 3: 4 boxes, 1 unresolved, 3 power  -> SHAKE ALL BOXES is now a mistake
   */
  const LOCKS = [
    {
      power: 2,
      body: 'The door opens only if the ball is found on the <strong>LEFT</strong>.',
      accent: 'Find a method that guarantees success. Do not rely on luck.',
      balls: [{ split: true }],
      intro: 'ONE BOX — FIND A METHOD THAT GUARANTEES THE LEFT'
    },
    {
      power: 2,
      body: 'Three boxes. The door opens only when <strong>every ball is certain</strong>.',
      accent: 'You may shake one box, or shake every box at once.',
      balls: [{ split: true }, { split: true }, { split: true }],
      intro: 'THREE BOXES — EVERY BALL IS IN TWO PLACES AT ONCE'
    },
    {
      power: 3,
      body: 'Four boxes. The door opens only when <strong>every ball has settled</strong>.',
      accent: 'Shaking every box also moves the ones that were already fine.',
      balls: [{ split: false }, { split: true }, { split: false }, { split: false }],
      intro: 'FOUR BOXES — ONLY ONE BALL HAS NO POSITION'
    }
  ];

  class Chamber1Game {
    constructor() {
      this.scene = document.getElementById('chamber1-scene');
      this.stage = document.getElementById('c1-stage');
      if (!this.scene) return;

      this.fx = new Chamber1FX('c1-canvas', 'c1-stage');

      this.statusEl = document.getElementById('c1-status');
      this.rackEl = document.getElementById('c1-rack');
      this.pipsEl = document.getElementById('c1-pips');
      this.doorLocksEl = document.getElementById('c1-door-locks');
      this.lockNumEl = document.getElementById('c1-lock-num');
      this.uncertainEl = document.getElementById('c1-uncertain');
      this.plaqueTitleEl = document.getElementById('c1-plaque-title');
      this.plaqueBodyEl = document.getElementById('c1-plaque-body');
      this.plaqueAccentEl = document.getElementById('c1-plaque-accent');

      this.shakeAllBtn = document.getElementById('c1-shake-all');
      this.openBtn = document.getElementById('c1-open');

      this.dialogue = document.getElementById('c1-dialogue');
      this.speakerEl = document.getElementById('c1-speaker');
      this.textEl = document.getElementById('c1-text');
      this.nextBtn = document.getElementById('c1-next');

      this.overlay = document.getElementById('c1-overlay');
      this.overlayCard = document.getElementById('c1-overlay-card');
      this.overlayTag = document.getElementById('c1-overlay-tag');
      this.overlayTitle = document.getElementById('c1-overlay-title');
      this.overlayBody = document.getElementById('c1-overlay-body');
      this.overlayActions = document.getElementById('c1-overlay-actions');

      this.lockIndex = 0;
      this.power = 0;
      this.powerMax = 0;
      this.balls = [];
      this.totalActions = 0;
      this.clearedLocks = 0;
      this.busy = false;
      this.lockDone = false;
      this.hasEntered = false;

      this.typing = false;
      this.fullText = '';
      this.typeTimer = null;
      this.sayResolve = null;

      this.bind();
    }

    bind() {
      this.shakeAllBtn.addEventListener('click', () => this.shakeAll());
      this.openBtn.addEventListener('click', () => this.openBox());

      this.nextBtn.addEventListener('click', () => {
        if (this.typing) {
          this.finishTyping();
        } else if (this.sayResolve) {
          const resolve = this.sayResolve;
          this.sayResolve = null;
          this.dialogue.classList.remove('visible');
          resolve();
        }
      });

      document.getElementById('c1-sound-toggle').addEventListener('click', (e) => {
        if (!window.soundEngine) return;
        const on = window.soundEngine.toggleMute();
        e.currentTarget.classList.toggle('muted', !on);
      });

      document.getElementById('c1-fs-toggle').addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    /* ---------------- entry ---------------- */

    async enter() {
      if (this.hasEntered) {
        this.scene.classList.add('visible');
        return;
      }
      this.hasEntered = true;

      document.getElementById('transition-screen').classList.remove('active');
      document.getElementById('chamber1-modal').classList.remove('active');

      this.scene.classList.add('visible');
      await sleep(950);

      this.fx.resize();
      this.fx.start();
      this.setStatus('CHAMBER 1 — THE SUPERPOSITION CHAMBER');
      this.updateControls();

      await sleep(400);
      await this.say('TERMINAL X', 'Welcome to Chamber 1 — the Superposition Chamber.');
      await this.say('TERMINAL X', 'The Warden rebuilt this corridor\'s security around a quantum lock. Those boxes are it. Each holds one ball.');
      await this.say('TERMINAL X', 'A ball that has settled shows you exactly where it sits — you will see it resting on the LEFT. A ball in superposition has no single position, so its box shows nothing but a smear.');
      await this.say('TERMINAL X', 'A SHAKE flips a box. A settled ball goes back into superposition and vanishes from view. A superposed ball settles on the LEFT. SHAKE ALL BOXES does that to every box at once.');
      await this.say('TERMINAL X', 'The door opens only when the counter above the rack reads zero. And it refuses luck: if any ball is still a smear when you open, that result does not count.');
      await this.say('WARDEN', 'So the engineer wakes. No one is coming for you. My fleet is. Three locks stand between you and the corridor, and X has barely enough power to breathe — so let us see how much of it you burn on guesses.');

      document.getElementById('c1-console').classList.add('revealed');
      this.startLock(0);
    }

    say(speaker, text, btnLabel) {
      return new Promise((resolve) => {
        this.sayResolve = resolve;
        const isWarden = speaker === 'WARDEN';
        this.dialogue.classList.toggle('warden', isWarden);
        this.speakerEl.textContent = isWarden ? 'THE WARDEN' : speaker;
        this.nextBtn.textContent = btnLabel || 'CONTINUE ▶';
        this.dialogue.classList.add('visible');
        this.typeText(text);
      });
    }

    typeText(text) {
      if (this.typeTimer) clearInterval(this.typeTimer);
      this.typing = true;
      this.fullText = text;
      this.textEl.textContent = '';

      let i = 0;
      this.typeTimer = setInterval(() => {
        if (i < text.length) {
          this.textEl.textContent += text[i];
          if (i % 3 === 0 && window.soundEngine) window.soundEngine.playTerminalType();
          i++;
        } else {
          clearInterval(this.typeTimer);
          this.typing = false;
        }
      }, 20);
    }

    finishTyping() {
      if (!this.typing) return;
      clearInterval(this.typeTimer);
      this.textEl.textContent = this.fullText;
      this.typing = false;
    }

    /* ---------------- lock setup ---------------- */

    startLock(index) {
      this.lockIndex = index;
      const cfg = LOCKS[index];

      this.powerMax = cfg.power;
      this.power = cfg.power;
      this.balls = cfg.balls.map((b) => ({ split: b.split, found: null }));
      this.lockDone = false;
      this.busy = false;

      this.plaqueTitleEl.textContent = `CHAMBER 1 // LOCK ${index + 1}`;
      this.plaqueBodyEl.innerHTML = cfg.body;
      this.plaqueAccentEl.textContent = cfg.accent;
      this.lockNumEl.textContent = String(index + 1);

      this.renderRack();
      this.renderPips();
      this.refreshDoorLocks();
      this.renderUncertain();
      this.setStatus(cfg.intro);
      this.updateControls();
    }

    renderRack() {
      this.rackEl.innerHTML = '';

      this.balls.forEach((ball, i) => {
        const slot = document.createElement('div');
        slot.className = 'slot ' + (ball.split ? 'split' : 'settled');
        slot.dataset.index = String(i);
        slot.innerHTML = `
          <div class="slot-side">BOX ${i + 1}</div>
          <div class="slot-visual">
            <div class="slot-ball"></div>
            <div class="slot-wave"></div>
          </div>
          <div class="slot-state">${ball.split ? 'SUPERPOSED' : 'LEFT'}</div>
        `;
        slot.addEventListener('click', () => this.shakeBall(i));
        this.rackEl.appendChild(slot);
      });
    }

    /** Tally of how many balls have no settled position. */
    renderUncertain() {
      const unresolved = this.balls.filter((b) => b.split).length;
      const total = this.balls.length;

      this.uncertainEl.textContent = `${unresolved} / ${total}`;
      this.uncertainEl.classList.toggle('clear', unresolved === 0);
    }

    /** Repaint one box after a shake: settled balls show LEFT, superposed do not. */
    refreshSlot(i) {
      const slot = this.rackEl.querySelector(`.slot[data-index="${i}"]`);
      if (!slot) return;

      const ball = this.balls[i];
      slot.classList.toggle('split', ball.split);
      slot.classList.toggle('settled', !ball.split);

      const state = slot.querySelector('.slot-state');
      if (state) state.textContent = ball.split ? 'SUPERPOSED' : 'LEFT';
    }

    /** After OPEN the boxes are revealed, so their results are shown. */
    revealSlot(i) {
      const slot = this.rackEl.querySelector(`.slot[data-index="${i}"]`);
      if (!slot) return;

      const ball = this.balls[i];

      // The ball has collapsed, so the box no longer hides anything.
      slot.classList.remove('split');
      slot.classList.add('settled', 'opened');
      slot.classList.toggle('found-right', ball.found === 'RIGHT');

      const state = slot.querySelector('.slot-state');
      if (state) state.textContent = ball.found;
    }

    renderPips() {
      this.pipsEl.innerHTML = '';
      for (let i = 0; i < this.powerMax; i++) {
        const pip = document.createElement('div');
        pip.className = 'pip';
        this.pipsEl.appendChild(pip);
      }
      this.updatePips();
    }

    updatePips() {
      const pips = this.pipsEl.querySelectorAll('.pip');
      pips.forEach((pip, i) => pip.classList.toggle('spent', i >= this.power));
      this.pipsEl.classList.toggle('depleted', this.power <= 0);
    }

    refreshDoorLocks() {
      this.doorLocksEl.querySelectorAll('.dl-seg').forEach((seg, i) => {
        seg.classList.toggle('lit', i < this.clearedLocks);
      });
    }

    updateControls() {
      const canShake = !this.busy && !this.lockDone && this.power > 0;
      this.shakeAllBtn.disabled = !canShake;
      this.openBtn.disabled = this.busy || this.lockDone;

      this.rackEl.querySelectorAll('.slot').forEach((slot) => {
        slot.classList.toggle('locked', !canShake);
      });
    }

    setStatus(text) {
      this.statusEl.innerHTML = `<span class="pulse-dot"></span> ${text}`;
    }

    /* ---------------- shaking ---------------- */

    async shakeAll() {
      await this.doShake(null);
    }

    async shakeBall(index) {
      await this.doShake(index);
    }

    async doShake(index) {
      if (this.busy || this.lockDone || this.power <= 0) return;

      this.busy = true;
      this.power -= 1;
      this.totalActions += 1;
      this.updatePips();
      this.updateControls();

      if (window.soundEngine) window.soundEngine.playQuantumShake();
      this.fx.shake(index === null ? 1.15 : 0.7);

      const targets = index === null
        ? this.balls.map((_, i) => i)
        : [index];

      this.setStatus(index === null
        ? 'SHAKING EVERY BOX...'
        : `SHAKING BOX ${index + 1}...`);

      targets.forEach((i) => {
        const slot = this.rackEl.querySelector(`.slot[data-index="${i}"]`);
        if (slot) slot.classList.add('shaking');
      });

      await sleep(320);

      targets.forEach((i) => {
        this.balls[i].split = !this.balls[i].split;
        this.refreshSlot(i);
      });

      // The tally follows every shake, so the player always knows how many
      // balls are still without a position.
      this.renderUncertain();

      await sleep(240);

      targets.forEach((i) => {
        const slot = this.rackEl.querySelector(`.slot[data-index="${i}"]`);
        if (slot) slot.classList.remove('shaking');
      });

      this.busy = false;
      this.updateControls();

      const remaining = this.balls.filter((b) => b.split).length;
      if (remaining === 0) {
        this.setStatus('EVERY BOX IS CERTAIN — OPEN THEM');
      } else if (this.power === 0) {
        this.setStatus(`POWER DEPLETED — ${remaining} STILL IN TWO PLACES AT ONCE`);
      } else {
        this.setStatus(`${remaining} STILL IN TWO PLACES AT ONCE`);
      }
    }

    /* ---------------- opening ---------------- */

    async openBox() {
      if (this.busy || this.lockDone) return;

      this.busy = true;
      this.updateControls();
      this.setStatus('OPENING THE BOXES...');
      await sleep(280);

      if (window.soundEngine) window.soundEngine.playCollapse();
      this.fx.collapseFlash();

      const hadSplit = this.balls.some((b) => b.split);

      this.balls.forEach((ball, i) => {
        if (ball.split) {
          // Unobserved: the collapse is a coin flip, and it will not count.
          ball.found = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
          ball.split = false;
        } else {
          ball.found = 'LEFT';
        }

        this.revealSlot(i);

        const slot = this.rackEl.querySelector(`.slot[data-index="${i}"]`);
        if (slot) {
          slot.classList.add('opening');
          if (ball.found === 'RIGHT') slot.classList.add('wrong');
        }
      });

      await sleep(750);

      if (!hadSplit) {
        await this.onLockCleared();
      } else {
        await this.onLockFailed();
      }
    }

    /* ---------------- outcomes ---------------- */

    async onLockCleared() {
      this.lockDone = true;
      this.busy = true;
      this.clearedLocks += 1;
      this.refreshDoorLocks();
      this.updateControls();

      this.setStatus(`LOCK ${this.lockIndex + 1} CLEARED`);

      if (window.soundEngine) window.soundEngine.playSuccessArpeggio();

      await sleep(650);

      if (this.lockIndex === 0) {
        await this.say('TERMINAL X', 'That is it. You changed the state before observing it. Opening immediately would have left your escape to chance.');
        await this.say('WARDEN', 'One ball. One guess. Do not let it go to your head, engineer.');
      } else if (this.lockIndex === 1) {
        await this.say('TERMINAL X', 'Three of them needed steadying, and you spent only two shakes. A register shake moved all four at once — that is why it was worth it.');
        await this.say('WARDEN', 'You reached for the whole register. Adorable. It will not save you on the last one.');
      } else {
        await this.say('TERMINAL X', 'Every ball certain, every ball LEFT. The final lock is giving way.');
        await this.say('WARDEN', '...Fine. The exit is yours. For now. My fleet is patient.');
      }

      const next = this.lockIndex + 1;

      if (next < LOCKS.length) {
        this.startLock(next);
      } else {
        this.finishChamber();
      }
    }

    async onLockFailed() {
      this.lockDone = true;
      this.busy = true;
      this.updateControls();

      if (window.soundEngine) window.soundEngine.playFailBuzz();
      this.fx.failDoor();
      this.setStatus('THE DOOR REJECTS A RESULT THAT WAS NOT GUARANTEED');

      const lucky = this.balls.filter((b) => b.found === 'LEFT').length;
      const total = this.balls.length;

      const lines = this.balls
        .map((b, i) => `<li>Box ${i + 1}: found on the <strong>${b.found}</strong></li>`)
        .join('');

      this.showOverlay({
        tag: 'LOCK REJECTED',
        tone: 'bad',
        title: 'Still in two places when you looked.',
        body: `
          <p>You opened the boxes while the counter had not reached zero. At least one ball was still unresolved, so its position was decided by chance — and the door cannot trust a coin flip.</p>
          <ul class="outcome-list">${lines}</ul>
          <p class="overlay-meta">${lucky === total
            ? 'Every ball happened to land on the LEFT — and the door still refused. Luck is not a method.'
            : 'Bring the counter to zero before you open anything.'}</p>
        `,
        actions: [
          { label: '↺ RETRY THIS LOCK', primary: true, onClick: () => this.retryLock() }
        ]
      });
    }

    retryLock() {
      this.hideOverlay();
      // Shakes already spent stay on the tally — the rating reflects the whole run.
      this.startLock(this.lockIndex);
    }

    finishChamber() {
      const par = 3; // one shake per lock
      let rating = 'ELEGANT';
      let note = 'One shake per lock. You only ever touched the balls that needed it.';

      if (this.totalActions > par) {
        rating = 'EFFICIENT';
        note = 'A few extra shakes. Power well spent, but not optimal.';
      }
      if (this.totalActions > par + 2) {
        rating = 'BRUTE FORCE';
        note = 'You got there by force. The Warden is unimpressed; X is just glad to be out.';
      }

      this.setStatus('CHAMBER 1 CLEARED');
      this.fx.openDoor();

      const doorGlow = document.getElementById('c1-door-glow');
      if (doorGlow) doorGlow.classList.add('active');

      this.showOverlay({
        tag: 'CHAMBER 1 CLEARED',
        tone: 'good',
        title: 'Guaranteed, not lucky.',
        body: `
          <p>Three locks, all opened by certainty rather than chance.</p>
          <div class="rating-block">
            <div class="rating-label">SHAKES USED</div>
            <div class="rating-value">${this.totalActions}</div>
            <div class="rating-tier">${rating}</div>
          </div>
          <p class="overlay-meta">${note}</p>
          <p class="overlay-meta">Concept unlocked: <strong>superposition &amp; interference</strong></p>
        `,
        actions: [
          { label: 'PROCEED TO CHAMBER 2 ▶', primary: true, onClick: () => this.nextChamber() }
        ]
      });
    }

    nextChamber() {
      this.showOverlay({
        tag: 'CHAMBER 2',
        tone: 'info',
        title: "The Spy's Corridor",
        body: '<p>X is preparing the entangled photon link. The corridor is still being built.</p>',
        actions: [{ label: 'BACK TO CHAMBER 1', primary: false, onClick: () => this.hideOverlay() }]
      });
    }

    /* ---------------- overlays ---------------- */

    showOverlay(cfg) {
      this.overlayTag.textContent = cfg.tag;
      this.overlayTitle.textContent = cfg.title;
      this.overlayBody.innerHTML = cfg.body;
      this.overlayCard.className = 'c1-overlay-card tone-' + cfg.tone;
      this.overlayActions.innerHTML = '';

      cfg.actions.forEach((action) => {
        const btn = document.createElement('button');
        btn.className = action.primary ? 'action-btn' : 'c1-ghost-btn';
        btn.textContent = action.label;
        btn.addEventListener('click', () => {
          if (window.soundEngine) window.soundEngine.playClick();
          action.onClick();
        });
        this.overlayActions.appendChild(btn);
      });

      this.overlay.classList.add('active');
    }

    hideOverlay() {
      this.overlay.classList.remove('active');
    }
  }

  window.Chamber1FX = Chamber1FX;
  window.Chamber1Game = Chamber1Game;
})();
