/**
 * Main Application Bootstrapper
 */
window.addEventListener('DOMContentLoaded', () => {
  // Initialize Canvas Visual FX
  const fx = new ChamberFX('fx-canvas', 'viewport');

  // Initialize Story & Intro Sequence
  const story = new IntroController(fx);

  // Bind Enter Chamber 1 modal button
  const enterChamber1Btn = document.getElementById('enter-chamber-1-btn');
  if (enterChamber1Btn) {
    enterChamber1Btn.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      story.showNotification('CHAMBER 1 PROTOCOL ENGAGED - LOADING SIMULATION...', 4000);

      const modal = document.getElementById('chamber1-modal');
      if (modal) {
        modal.innerHTML = `
          <div class="modal-chamber-tag" style="color: #00ff88;">Ready to Build</div>
          <h2 class="modal-title" style="color: #00f0ff;">Chamber 1: Initialized</h2>
          <div class="modal-desc">
            <p>Cell Q-0 escaped successfully! Introduction complete.</p>
            <br>
            <p>Proceeding to <strong>The Superposition Chamber</strong> with interactive quantum box mechanics.</p>
          </div>
          <div class="modal-actions">
            <button class="action-btn" onclick="location.reload()">↺ REPLAY INTRODUCTION</button>
          </div>
        `;
      }
    });
  }

  // Preload image confirmation
  const bgImg = document.getElementById('scene-bg');
  if (bgImg && bgImg.complete) {
    fx.resize();
  } else if (bgImg) {
    bgImg.addEventListener('load', () => fx.resize());
  }
});
