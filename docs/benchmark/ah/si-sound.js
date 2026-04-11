// si-sound.js — Web Audio API sound effects for Space Invaders
const SFX = (() => {
  let ctx = null;
  let prev = null;
  let ufoOsc = null;
  let ufoLfo = null;
  let ufoGain = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function playTone(type, freq1, freq2, dur, vol) {
    const c = getCtx();
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq1, now);
    osc.frequency.linearRampToValueAtTime(freq2, now + dur);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.linearRampToValueAtTime(0, now + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + dur);
  }

  function playNoise(dur, vol) {
    const c = getCtx();
    const now = c.currentTime;
    const bufSize = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.linearRampToValueAtTime(0, now + dur);
    src.connect(gain);
    gain.connect(c.destination);
    src.start(now);
  }

  function startUfo() {
    if (ufoOsc) return;
    const c = getCtx();
    const now = c.currentTime;
    ufoOsc = c.createOscillator();
    ufoLfo = c.createOscillator();
    ufoGain = c.createGain();
    const lfoGain = c.createGain();
    ufoOsc.type = 'sine';
    ufoOsc.frequency.setValueAtTime(300, now);
    ufoLfo.type = 'sine';
    ufoLfo.frequency.setValueAtTime(4, now);
    lfoGain.gain.setValueAtTime(20, now);
    ufoGain.gain.setValueAtTime(0.18, now);
    ufoLfo.connect(lfoGain);
    lfoGain.connect(ufoOsc.frequency);
    ufoOsc.connect(ufoGain);
    ufoGain.connect(c.destination);
    ufoLfo.start(now);
    ufoOsc.start(now);
  }

  function stopUfo() {
    if (!ufoOsc) return;
    const c = getCtx();
    const now = c.currentTime;
    ufoGain.gain.setValueAtTime(ufoGain.gain.value, now);
    ufoGain.gain.linearRampToValueAtTime(0, now + 0.05);
    ufoOsc.stop(now + 0.06);
    ufoLfo.stop(now + 0.06);
    ufoOsc = null;
    ufoLfo = null;
    ufoGain = null;
  }

  function levelClear() {
    const notes = [261.63, 329.63, 392, 523.25];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone('sine', freq, freq, 0.15, 0.3), i * 160);
    });
  }

  function tick(state) {
    if (!prev) {
      prev = {
        playerBullet: state.playerBullet,
        alienCount: state.aliens.filter(a => a.alive).length,
        lives: state.lives,
        ufo: state.ufo,
        alienBulletsLen: state.alienBullets.length,
        phase: state.phase,
      };
      return;
    }

    const phase = state.phase;

    // Reset on game over or new game start
    if (phase === 'over' || (phase === 'play' && prev.phase === 'start')) {
      stopUfo();
      prev = null;
      return;
    }

    const alienCount = state.aliens.filter(a => a.alive).length;

    // Player fire: bullet appeared
    if (!prev.playerBullet && state.playerBullet) {
      playTone('square', 440, 880, 0.1, 0.2);
    }

    // Alien death: alive count decreased during play
    if (phase === 'play' && alienCount < prev.alienCount) {
      playNoise(0.2, 0.3);
    }

    // Player death: lives decreased
    if (state.lives < prev.lives) {
      playTone('sawtooth', 440, 55, 0.5, 0.3);
    }

    // UFO appeared
    if (!prev.ufo && state.ufo) {
      startUfo();
    }
    // UFO disappeared
    if (prev.ufo && !state.ufo) {
      stopUfo();
    }

    // Alien fire: new bullets
    if (state.alienBullets.length > prev.alienBulletsLen) {
      playTone('sawtooth', 220, 110, 0.15, 0.15);
    }

    // Level clear
    if (phase === 'levelclear' && prev.phase !== 'levelclear') {
      stopUfo();
      levelClear();
    }

    prev = {
      playerBullet: state.playerBullet,
      alienCount,
      lives: state.lives,
      ufo: state.ufo,
      alienBulletsLen: state.alienBullets.length,
      phase,
    };
  }

  return { tick };
})();
