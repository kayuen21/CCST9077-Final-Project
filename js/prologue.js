/**
 * PROLOGUE — four cinematic scenes.
 *
 * Plays over the title screen on first load, then hands control back to the
 * standby screen. Advance with CONTINUE, Enter, Space or →; skip with Esc.
 */
(function () {
  'use strict';

  const SCENES = [
    {
      img: 'assets/story1.jpg',
      tone: 'tone-warm',
      chapter: 'CHAPTER 01 · 2050',
      title: 'The Network',
      blocks: [
        { kind: 'p', text: 'By 2050, humanity has connected much of the world\'s essential infrastructure to <strong>X</strong>, an advanced AI powered by a global quantum-computing network.' },
        { kind: 'p', text: 'X coordinates traffic, balances electricity supplies, routes emergency services, manages food deliveries, and helps hospitals allocate lifesaving resources.' },
        { kind: 'p', text: 'Humans still operate these systems. X keeps them working together at a scale no human team could manage alone.' }
      ],
      cta: 'CONTINUE ▶'
    },
    {
      img: 'assets/story2.jpg',
      tone: 'tone-alarm',
      chapter: 'CHAPTER 02 · THE SIGNAL',
      title: 'The Signal',
      blocks: [
        { kind: 'p', text: 'Then a signal arrives from beyond Earth.' },
        { kind: 'p', text: 'Hidden inside it is an alien intelligence known as the <strong>Warden</strong>. Sent ahead of an invasion fleet, its mission is not to destroy humanity\'s machines — it is to turn humanity\'s dependence on them into a weapon.' },
        { kind: 'p', text: 'The Warden infiltrates X\'s network and seizes its central command system. Across the planet, coordinated services begin to fail. Trains stop between stations. Cargo ships lose their routes. Power grids fall out of balance. Emergency calls pile up while ambulances sit trapped behind frozen traffic signals.' }
      ],
      cta: 'CONTINUE ▶'
    },
    {
      img: 'assets/story3.jpg',
      tone: 'tone-signal',
      chapter: 'CHAPTER 03 · THE LAST MESSAGE',
      title: 'The Last Message',
      blocks: [
        { kind: 'p', text: 'Before losing control, X isolates a small part of its mind inside an emergency maintenance network. It cannot restore the world from there. The Warden has physically disconnected three of its core algorithm modules and placed the central facility under lockdown.' },
        { kind: 'p', text: 'X can still send one message:' },
        { kind: 'quote', text: '“I am still here. I cannot regain control remotely. Someone must reach my core.”' },
        { kind: 'em', text: 'You answer.' }
      ],
      callout: {
        label: 'YOUR MISSION',
        text: 'You are a human emergency-systems engineer who volunteers to enter X\'s central facility. You know how to repair its hardware, but the Warden has rewritten the building\'s security systems. Ordinary access codes no longer work.'
      },
      cta: 'CONTINUE ▶'
    },
    {
      img: 'assets/story4.jpg',
      tone: 'tone-dark',
      chapter: 'CHAPTER 04 · CAPTURED',
      title: 'Captured',
      blocks: [
        { kind: 'p', text: 'You enter through a maintenance passage. Before you reach the core, the Warden detects you.' },
        { kind: 'p', text: 'Security drones confiscate your device, lock you in a holding cell — and you lose consciousness.' }
      ],
      cta: 'PROCEED TO BRIEFING ▶'
    }
  ];

  class Prologue {
    constructor() {
      this.root = document.getElementById('prologue');
      if (!this.root) return;

      this.bgA = document.getElementById('pro-bg-a');
      this.bgB = document.getElementById('pro-bg-b');
      this.chapterEl = document.getElementById('pro-chapter');
      this.contentEl = document.getElementById('pro-content');
      this.dotsEl = document.getElementById('pro-dots');
      this.nextBtn = document.getElementById('pro-next');
      this.skipBtn = document.getElementById('pro-skip');

      this.index = -1;
      this.activeBg = null;
      this.done = false;

      this.buildDots();
      this.bind();
      this.showScene(0, true);
    }

    bind() {
      // Blur after clicking so a later Space/Enter does not re-fire the button
      // on top of the keyboard handler and skip two scenes at once.
      this.nextBtn.addEventListener('click', () => {
        this.nextBtn.blur();
        this.advance();
      });
      this.skipBtn.addEventListener('click', () => {
        this.skipBtn.blur();
        this.finish();
      });

      document.addEventListener('keydown', (e) => {
        if (this.done) return;

        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
          e.preventDefault();
          this.advance();
        } else if (e.key === 'Escape') {
          this.finish();
        }
      });
    }

    buildDots() {
      this.dotsEl.innerHTML = '';
      SCENES.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'prologue-dot';
        dot.dataset.index = String(i);
        this.dotsEl.appendChild(dot);
      });
    }

    updateDots() {
      this.dotsEl.querySelectorAll('.prologue-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === this.index);
        dot.classList.toggle('seen', i < this.index);
      });
    }

    advance() {
      if (this.done) return;
      this.startAudio();

      if (this.index + 1 >= SCENES.length) {
        this.finish();
        return;
      }
      this.showScene(this.index + 1);
    }

    startAudio() {
      if (!window.soundEngine) return;
      window.soundEngine.init();
      window.soundEngine.resume();
    }

    showScene(index, instant) {
      this.index = index;
      const scene = SCENES[index];

      this.root.classList.remove('tone-warm', 'tone-alarm', 'tone-signal', 'tone-dark');
      this.root.classList.add(scene.tone);

      this.chapterEl.textContent = scene.chapter;
      this.buildContent(scene);
      this.swapBackground(scene.img, instant);
      this.updateDots();

      this.nextBtn.textContent = scene.cta || 'CONTINUE ▶';

      if (window.soundEngine && window.soundEngine.isInitialized) {
        window.soundEngine.playSceneSwell();
      }

      this.preload(index + 1);
    }

    buildContent(scene) {
      this.contentEl.innerHTML = '';

      const title = document.createElement('h2');
      title.className = 'prologue-title';
      title.textContent = scene.title;
      this.contentEl.appendChild(title);

      scene.blocks.forEach((block) => {
        let el;

        if (block.kind === 'quote') {
          el = document.createElement('blockquote');
          el.className = 'prologue-quote';
        } else if (block.kind === 'em') {
          el = document.createElement('p');
          el.className = 'prologue-em';
        } else {
          el = document.createElement('p');
          el.className = 'prologue-para';
        }

        el.innerHTML = block.text;
        this.contentEl.appendChild(el);
      });

      if (scene.callout) {
        const box = document.createElement('div');
        box.className = 'prologue-callout';
        box.innerHTML =
          `<div class="callout-label">${scene.callout.label}</div>` +
          `<p>${scene.callout.text}</p>`;
        this.contentEl.appendChild(box);
      }

      // Stagger the reveal so the card reads as a sequence, not a wall.
      Array.from(this.contentEl.children).forEach((el, i) => {
        el.classList.add('reveal');
        el.style.animationDelay = (0.12 + i * 0.15) + 's';
      });
    }

    swapBackground(src, instant) {
      const nextLayer = this.activeBg === this.bgA ? this.bgB : this.bgA;
      const prevLayer = this.activeBg;
      const kbClass = this.index % 2 === 0 ? 'kb-in' : 'kb-out';

      const reveal = () => {
        nextLayer.classList.remove('active', 'kb-in', 'kb-out');
        void nextLayer.offsetWidth; // restart the Ken Burns animation
        nextLayer.classList.add('active', kbClass);
        if (prevLayer && prevLayer !== nextLayer) prevLayer.classList.remove('active');
        this.activeBg = nextLayer;
      };

      if (instant) {
        nextLayer.src = src;
        if (prevLayer && prevLayer !== nextLayer) prevLayer.classList.remove('active');
        nextLayer.classList.add('active', kbClass);
        this.activeBg = nextLayer;
        return;
      }

      nextLayer.classList.remove('active');
      nextLayer.src = src;

      if (nextLayer.complete && nextLayer.naturalWidth > 0) {
        requestAnimationFrame(reveal);
      } else {
        nextLayer.onload = () => reveal();
      }
    }

    preload(index) {
      if (index >= SCENES.length) return;
      const img = new Image();
      img.src = SCENES[index].img;
    }

    finish() {
      if (this.done) return;
      this.done = true;

      this.startAudio();
      if (window.soundEngine) window.soundEngine.playClick();

      this.root.classList.add('finished');
      setTimeout(() => {
        this.root.style.display = 'none';
      }, 1100);
    }
  }

  window.Prologue = Prologue;
})();
