// si-sound.js — Web Audio API sound effects for Space Invaders (Direct build)
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

  // Ramp an oscillator freq from f1→f2 over dur seconds, then stop
  function playTone(type, f1, f2, dur, vol = 0.3) {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, ac.currentTime);
    osc.frequency.linearRampToValueAtTime(f2, ac.currentTime + dur);
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + dur);
  }

  // White noise burst
  function playNoise(dur, vol = 0.25) {
    const ac = getCtx();
    const bufLen = Math.ceil(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    const gain = ac.createGain();
    src.buffer = buf;
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + dur);
    src.connect(gain);
    gain.connect(ac.destination);
    src.start(ac.currentTime);
    src.stop(ac.currentTime + dur);
  }

  // UFO: sustained sine 300Hz with 4Hz LFO wobble
  function startUfo() {
    if (ufoOsc) return; // already playing
    const ac = getCtx();
    ufoOsc = ac.createOscillator();
    ufoLfo = ac.createOscillator();
    ufoGain = ac.createGain();
    const lfoGain = ac.createGain();

    ufoOsc.type = 'sine';
    ufoOsc.frequency.value = 300;
    ufoLfo.type = 'sine';
    ufoLfo.frequency.value = 4;
    lfoGain.gain.value = 30; // ±30Hz wobble

    ufoGain.gain.value = 0.2;

    ufoLfo.connect(lfoGain);
    lfoGain.connect(ufoOsc.frequency);
    ufoOsc.connect(ufoGain);
    ufoGain.connect(ac.destination);

    ufoOsc.start();
    ufoLfo.start();
  }

  function stopUfo() {
    if (!ufoOsc) return;
    try { ufoOsc.stop(); ufoLfo.stop(); } catch (e) { /* already stopped */ }
    ufoOsc = null;
    ufoLfo = null;
    ufoGain = null;
  }

  // Ascending fanfare: C4→E4→G4→C5, each note 0.15s, spaced 160ms
  function levelClear() {
    const freqs = [261.63, 329.63, 392, 523.25];
    freqs.forEach((f, i) => {
      setTimeout(() => playTone('square', f, f, 0.15, 0.25), i * 160);
    });
  }

  // Main tick — call every game loop frame
  function tick(state) {
    // First call: initialize prev and return (no sound)
    if (prev === null) {
      prev = snapshot(state);
      return;
    }

    const phase = state.phase;

    // Phase transitions that reset state
    if (phase === 'gameover' || (phase === 'playing' && prev.phase !== 'playing')) {
      // Play death sound if lives just dropped (gameover transition)
      if (phase === 'gameover' && state.lives < prev.lives) {
        playTone('sawtooth', 440, 55, 0.5, 0.35);
      }
      stopUfo();
      prev = snapshot(state);
      return;
    }

    if (phase !== 'playing' && phase !== 'levelclear') {
      prev = snapshot(state);
      return;
    }

    // Player fire: playerBullet was falsy, now truthy
    if (!prev.playerBullet && state.playerBullet) {
      playTone('square', 440, 880, 0.1, 0.2);
    }

    // Alien death: alive count decreased while playing
    const aliveNow = countAlive(state);
    const alivePrev = prev.aliveCount;
    if (phase === 'playing' && aliveNow < alivePrev) {
      playNoise(0.2, 0.3);
    }

    // Player death: lives decreased
    if (state.lives < prev.lives) {
      playTone('sawtooth', 440, 55, 0.5, 0.35);
    }

    // UFO appeared
    if (!prev.ufo && state.ufo) {
      startUfo();
    }

    // UFO gone
    if (prev.ufo && !state.ufo) {
      stopUfo();
    }

    // Alien fire: bullet count increased
    if (state.alienBullets.length > prev.alienBulletCount) {
      playTone('sawtooth', 220, 110, 0.15, 0.15);
    }

    // Level clear fanfare (once, on transition)
    if (phase === 'levelclear' && prev.phase !== 'levelclear') {
      stopUfo();
      levelClear();
    }

    prev = snapshot(state);
  }

  function countAlive(state) {
    let n = 0;
    for (const row of state.aliens) for (const a of row) if (a.alive) n++;
    return n;
  }

  function snapshot(state) {
    return {
      phase: state.phase,
      playerBullet: !!state.playerBullet,
      aliveCount: countAlive(state),
      lives: state.lives,
      ufo: !!state.ufo,
      alienBulletCount: state.alienBullets ? state.alienBullets.length : 0,
    };
  }

  return { tick };
})();
