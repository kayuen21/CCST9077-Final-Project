/**
 * Main Application Bootstrapper
 */
window.addEventListener('DOMContentLoaded', () => {
  // Cinematic prologue sits over the title screen on first load
  if (window.Prologue) new Prologue();

  // Initialize Canvas Visual FX for the intro cell
  const fx = new ChamberFX('fx-canvas', 'viewport');

  // Initialize Story & Intro Sequence
  const story = new IntroController(fx);

  // Initialize Chamber 1
  const chamber1 = new Chamber1Game();
  window.chamber1 = chamber1;

  // Bind Enter Chamber 1 modal button
  const enterChamber1Btn = document.getElementById('enter-chamber-1-btn');
  if (enterChamber1Btn) {
    enterChamber1Btn.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playClick();
      fx.stop();
      chamber1.enter();
    });
  }

  // Preload image confirmation
  const bgImg = document.getElementById('scene-bg');
  if (bgImg && bgImg.complete) {
    fx.resize();
  } else if (bgImg) {
    bgImg.addEventListener('load', () => fx.resize());
  }

  const c1bg = document.getElementById('c1-bg');
  if (c1bg && c1bg.complete && chamber1.fx) {
    chamber1.fx.resize();
  } else if (c1bg && chamber1.fx) {
    c1bg.addEventListener('load', () => chamber1.fx.resize());
  }
});
