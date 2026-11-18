class IntroController {
  constructor(fx) {
    this.fx = fx;
    this.state = 'STANDBY'; // STANDBY -> AWAKENING -> CELL_EXPLORE -> TALKING_TO_X -> SURGE -> BREACHED

    // UI elements
    this.viewport = document.getElementById('viewport');
    this.standbyScreen = document.getElementById('standby-screen');
    this.eyelids = document.getElementById('eyelids-overlay');
    this.hudOverlay = document.getElementById('hud-overlay');
    this.dialogueBox = document.getElementById('dialogue-box');
    this.dialogueSpeaker = document.getElementById('dialogue-speaker');
    this.dialogueText = document.getElementById('dialogue-text');
    this.dialogueChoices = document.getElementById('dialogue-choices');
    this.dialogueNextBtn = document.getElementById('dialogue-next-btn');
    this.terminalHotspot = document.getElementById('hotspot-terminal');
    this.doorHotspot = document.getElementById('hotspot-door');
    this.statusBanner = document.getElementById('status-banner');
    this.notificationToast = document.getElementById('notification-toast');

    // Dialogue typing state
    this.typingTimer = null;
    this.isTyping = false;
    this.currentFullText = '';
    this.dialogueQueue = [];
    this.currentDialogueIndex = 0;
    this.isTransitioning = false;

    this.bindEvents();
  }

  bindEvents() {
    // Initial start button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startAwakening());
    }

    // Terminal hotspot click
    if (this.terminalHotspot) {
      this.terminalHotspot.addEventListener('click', () => this.interactWithTerminal());
    }

    // Door hotspot click
    if (this.doorHotspot) {
      this.doorHotspot.addEventListener('click', () => this.interactWithDoor());
    }

    // Dialogue Next button
    if (this.dialogueNextBtn) {
      this.dialogueNextBtn.addEventListener('click', () => {
        if (this.isTyping) {
          this.skipTyping();
        } else {
          this.advanceDialogue();
        }
      });
    }

    // Dialogue box click to fast-forward typing
    if (this.dialogueBox) {
      this.dialogueBox.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON' && this.isTyping) {
          this.skipTyping();
        }
      });
    }

    // Skip intro/awakening button
    const skipBtn = document.getElementById('skip-awakening-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        this.skipAwakening();
      });
    }

    // Sound toggle button
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        if (window.soundEngine) {
          const enabled = window.soundEngine.toggleMute();
          soundToggle.classList.toggle('muted', !enabled);
          soundToggle.setAttribute('title', enabled ? 'Sound: ON' : 'Sound: MUTED');
        }
      });
    }

    // Fullscreen toggle button
    const fsToggle = document.getElementById('fullscreen-toggle');
    if (fsToggle) {
      fsToggle.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  showNotification(message, duration = 3500) {
    if (!this.notificationToast) return;
    this.notificationToast.textContent = message;
    this.notificationToast.classList.add('active');
    if (window.soundEngine) window.soundEngine.playClick();
    setTimeout(() => {
      this.notificationToast.classList.remove('active');
    }, duration);
  }

  startAwakening() {
    if (window.soundEngine) {
      window.soundEngine.init();
      window.soundEngine.resume();
      window.soundEngine.playBootChime();
    }

    this.state = 'AWAKENING';
    this.standbyScreen.classList.add('fade-out');
    setTimeout(() => {
      this.standbyScreen.style.display = 'none';
    }, 1000);

    // Show "you wake up just now" caption
    const caption = document.getElementById('awakening-caption');
    if (caption) {
      setTimeout(() => {
        caption.classList.add('visible');
      }, 600);
    }
    this.setStatus('YOU WAKE UP JUST NOW...');

    // Start FX loop
    this.fx.start();

    // Trigger blinking eyelids animation
    this.eyelids.classList.add('blinking');

    // Gradually clear viewport blur
    this.viewport.classList.add('blur-awakening');

    // Show skip awakening button during transition
    const skipBtn = document.getElementById('skip-awakening-btn');
    if (skipBtn) skipBtn.style.display = 'block';

    // After awakening finishes (approx 5.5s)
    this.awakeningTimer = setTimeout(() => {
      this.finishAwakening();
    }, 5600);
  }

  skipAwakening() {
    if (this.state !== 'AWAKENING') return;
    if (this.awakeningTimer) clearTimeout(this.awakeningTimer);
    this.finishAwakening();
  }

  finishAwakening() {
    const skipBtn = document.getElementById('skip-awakening-btn');
    if (skipBtn) skipBtn.style.display = 'none';

    const caption = document.getElementById('awakening-caption');
    if (caption) caption.classList.remove('visible');

    this.eyelids.classList.remove('blinking');
    this.eyelids.classList.add('fully-open');
    this.viewport.classList.remove('blur-awakening');

    this.enterCellExploration();
  }

  enterCellExploration() {
    this.state = 'CELL_EXPLORE';
    this.hudOverlay.classList.add('visible');

    // Update status banner
    this.setStatus('OBJECTIVE: CLICK ON TERMINAL X');

    // Activate terminal hotspot with radar ping
    this.terminalHotspot.classList.add('active');
    this.doorHotspot.classList.add('active');

    // Terminal emits alert sparks and sound
    setTimeout(() => {
      this.fx.emitSparks(1.8);
      this.showNotification('TERMINAL X: CLICK TO TALK TO X');
    }, 800);
  }

  setStatus(text) {
    if (this.statusBanner) {
      this.statusBanner.innerHTML = `<span class="pulse-dot"></span> ${text}`;
    }
  }

  interactWithDoor() {
    if (this.state === 'BREACHED') {
      this.transitionToChamber1();
      return;
    }

    if (window.soundEngine) {
      window.soundEngine.playSpark();
    }

    this.showNotification('THE DOOR IS LOCKED! TALK TO TERMINAL X FIRST.');
  }

  interactWithTerminal() {
    if (this.state === 'TALKING_TO_X' || this.state === 'SURGE') return;

    if (window.soundEngine) {
      window.soundEngine.playClick();
      window.soundEngine.playHologramPulse();
    }

    this.state = 'TALKING_TO_X';
    this.terminalHotspot.classList.remove('active');

    // Cinematic camera focus towards terminal
    this.viewport.classList.add('focus-terminal');

    // Sequential story conversation (no confusing 3 options)
    this.dialogueQueue = [
      {
        speaker: 'TERMINAL X',
        text: 'Hey! Can you hear me? Wake up... Easy. The Warden\'s drones took your gear and left you in a holding cell. That was about an hour ago.',
        btnText: 'CONTINUE ▶'
      },
      {
        speaker: 'TERMINAL X',
        text: 'My name is X. I run this facility — or I did, until the Warden took my network. Only this emergency terminal still has power.',
        btnText: 'CONTINUE ▶'
      },
      {
        speaker: 'TERMINAL X',
        text: 'The Warden is not from Earth. It arrived on a signal, ahead of an invasion fleet. It is not here to break our machines. It is using me — my own systems — to freeze the world outside.',
        btnText: 'CONTINUE ▶'
      },
      {
        speaker: 'TERMINAL X',
        text: 'It physically pulled three of my core algorithm modules, and it has locked every corridor behind quantum puzzles. Ordinary access codes will never work on these doors. Quantum laws will — and that is where I can help you.',
        btnText: 'ASK: "CAN YOU OPEN THIS CELL DOOR?" ▶'
      },
      {
        speaker: 'YOU',
        text: '"Can you open this cell door?"',
        btnText: 'LISTEN TO X ▶'
      },
      {
        speaker: 'TERMINAL X',
        text: 'Yes! Look at the glowing lines on your floor. They connect this terminal directly to the door lock. I will discharge my remaining energy through the floor wires right now to blast the latch open. Stand back!',
        btnText: 'BLAST THE LOCK! ⚡',
        action: () => this.triggerCellDoorBreach()
      }
    ];

    this.currentDialogueIndex = 0;
    this.showDialogue(this.dialogueQueue[0]);
  }

  showDialogue(step) {
    this.dialogueBox.classList.add('visible');
    this.dialogueSpeaker.textContent = step.speaker;
    this.dialogueSpeaker.style.color = (step.speaker === 'YOU') ? 'var(--color-emerald)' : 'var(--color-cyan)';
    this.dialogueChoices.innerHTML = '';
    this.dialogueNextBtn.style.display = 'inline-block';
    this.dialogueNextBtn.textContent = step.btnText || 'CONTINUE ▶';

    this.typewrite(step.text);
  }

  typewrite(text, onComplete) {
    if (this.typingTimer) clearInterval(this.typingTimer);

    this.isTyping = true;
    this.currentFullText = text;
    this.dialogueText.textContent = '';
    this.fx.isSpeaking = true;

    let index = 0;
    this.typingTimer = setInterval(() => {
      if (index < text.length) {
        this.dialogueText.textContent += text[index];
        if (index % 2 === 0 && window.soundEngine) {
          window.soundEngine.playTerminalType();
        }
        index++;
      } else {
        clearInterval(this.typingTimer);
        this.isTyping = false;
        this.fx.isSpeaking = false;
        if (onComplete) onComplete();
      }
    }, 22);
  }

  skipTyping() {
    if (!this.isTyping) return;
    clearInterval(this.typingTimer);
    this.dialogueText.textContent = this.currentFullText;
    this.isTyping = false;
    this.fx.isSpeaking = false;
  }

  advanceDialogue() {
    if (this.state === 'BREACHED') {
      this.transitionToChamber1();
      return;
    }

    // If current step has an action triggered by its button (e.g. blast the lock)
    const currentStep = this.dialogueQueue[this.currentDialogueIndex];
    if (currentStep && currentStep.action) {
      currentStep.action();
      return;
    }

    this.currentDialogueIndex++;
    if (this.currentDialogueIndex < this.dialogueQueue.length) {
      const nextStep = this.dialogueQueue[this.currentDialogueIndex];
      this.showDialogue(nextStep);
    } else {
      // End of dialogue
      this.dialogueBox.classList.remove('visible');
    }
  }

  triggerCellDoorBreach() {
    this.state = 'SURGE';
    this.setStatus('BLASTING DOOR LOCK...');

    // Hide dialogue temporarily
    this.dialogueBox.classList.remove('visible');

    // Pan camera back to show the whole room and the door
    this.viewport.classList.remove('focus-terminal');
    this.viewport.classList.add('camera-shake');

    // Trigger audio and visual FX surge
    if (window.soundEngine) {
      window.soundEngine.playPowerSurge();
    }
    this.fx.triggerSurge();

    // After surge travels across the floor lines to the door
    setTimeout(() => {
      this.viewport.classList.remove('camera-shake');

      if (window.soundEngine) {
        window.soundEngine.playDoorUnlock();
      }

      this.state = 'BREACHED';
      this.setStatus('DOOR OPEN! CLICK DOOR TO ENTER CHAMBER 1');

      // Update door visuals
      const doorGlow = document.getElementById('door-breached-glow');
      if (doorGlow) doorGlow.classList.add('active');

      this.doorHotspot.classList.add('breached');

      // Show completion dialogue & button
      this.dialogueBox.classList.add('visible');
      this.dialogueSpeaker.textContent = 'TERMINAL X';
      const breachText = 'It worked! The door is wide open. Just past this doorway is Chamber 1: The Superposition Chamber. Click the door or press below to enter!';
      this.typewrite(breachText, () => {
        this.dialogueNextBtn.style.display = 'inline-block';
        this.dialogueNextBtn.textContent = 'ENTER CHAMBER 1 ▶';
        this.dialogueNextBtn.onclick = () => this.transitionToChamber1();
      });

      this.showNotification('DOOR UNLOCKED! CLICK TO MOVE FORWARD.', 4500);
    }, 1800);
  }

  transitionToChamber1() {
    // Guard: the door hotspot, the dialogue button listener and its onclick
    // can all fire for the same click.
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    if (window.soundEngine) {
      window.soundEngine.playClick();
    }

    const transitionOverlay = document.getElementById('transition-screen');
    if (transitionOverlay) {
      transitionOverlay.classList.add('active');
    }

    // Modal announcing Chamber 1
    setTimeout(() => {
      const summaryModal = document.getElementById('chamber1-modal');
      if (summaryModal) {
        summaryModal.classList.add('active');
      }
    }, 800);
  }
}

window.IntroController = IntroController;
