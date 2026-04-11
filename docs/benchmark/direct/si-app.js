const html = htm.bind(React.createElement);
const { useState, useEffect, useRef, useCallback } = React;

function LivesDisplay({ lives }) {
  return html`<span class="lives-icons">
    ${Array.from({ length: lives }, (_, i) => html`<span key=${i} class="life-icon">▲</span>`)}
  </span>`;
}

function HUD({ score, hiScore, level, lives }) {
  return html`<div class="hud">
    <div class="hud-item"><span class="hud-label">SCORE</span><span class="hud-value">${String(score).padStart(5,'0')}</span></div>
    <div class="hud-item"><span class="hud-label">HI-SCORE</span><span class="hud-value" style=${{color:'#ffb800'}}>${String(hiScore).padStart(5,'0')}</span></div>
    <div class="hud-item"><span class="hud-label">LEVEL</span><span class="hud-value" style=${{color:'#4da6ff'}}>${level}</span></div>
    <div class="hud-item"><span class="hud-label">LIVES</span><${LivesDisplay} lives=${lives} /></div>
  </div>`;
}

function StartOverlay({ onStart }) {
  return html`<div class="overlay">
    <div class="overlay-content">
      <h1 class="title-main">SPACE<br/>INVADERS</h1>
      <div class="title-sub">DEFEND EARTH</div>
      <div class="controls-hint">
        <div>← → / A D — Move</div>
        <div>SPACE — Fire</div>
      </div>
      <button class="btn-play" onClick=${onStart}>INSERT COIN</button>
    </div>
  </div>`;
}

function GameOverOverlay({ score, hiScore, onRestart }) {
  return html`<div class="overlay">
    <div class="overlay-content">
      <h2 class="overlay-title" style=${{color:'#ff4466'}}>GAME OVER</h2>
      <div class="overlay-score">SCORE: <span>${score}</span></div>
      ${score >= hiScore && score > 0 ? html`<div class="new-hi">NEW HI-SCORE!</div>` : null}
      <button class="btn-play" onClick=${onRestart}>PLAY AGAIN</button>
    </div>
  </div>`;
}

function LevelClearOverlay({ level, score }) {
  return html`<div class="overlay">
    <div class="overlay-content">
      <h2 class="overlay-title" style=${{color:'#00ff88'}}>WAVE CLEAR!</h2>
      <div class="overlay-score">LEVEL ${level} COMPLETE</div>
      <div class="overlay-score" style=${{fontSize:'0.8em',marginTop:'8px'}}>SCORE: ${score}</div>
      <div style=${{color:'#8888aa',marginTop:'16px',fontSize:'0.7em'}}>NEXT WAVE INCOMING…</div>
    </div>
  </div>`;
}

function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const [ui, setUi] = useState({ score: 0, hiScore: 0, level: 1, lives: 3, phase: 'start' });

  const startGame = useCallback((level = 1) => {
    gameRef.current = initState(CONFIG, level);
    lastTimeRef.current = null;
    setUi(s => ({ ...s, score: 0, lives: 3, level, phase: 'playing',
      hiScore: parseInt(localStorage.getItem('si_hiscore') || '0', 10) }));
  }, []);

  const restartGame = useCallback(() => startGame(1), [startGame]);

  useEffect(() => {
    const handleKey = (e) => {
      if (!gameRef.current) return;
      const down = e.type === 'keydown';
      gameRef.current.keys[e.code] = down;
      if (down && e.code === 'Space') {
        e.preventDefault();
        const s = gameRef.current;
        if (s.phase === 'playing' && !s.playerBullet)
          s.playerBullet = { x: s.playerX, y: CONFIG.player.y - 16 };
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    return () => { window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKey); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = (timestamp) => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = lastTimeRef.current ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.05) : 0.016;
      lastTimeRef.current = timestamp;
      const s = gameRef.current;
      if (!s || s.phase !== 'playing') {
        // Render canvas for start/gameover/levelclear — aliens march on start screen
        if (s && (s.phase === 'start' || s.phase === 'gameover' || s.phase === 'levelclear')) {
          updateStarsOnly(s, dt);
          if (s.phase === 'start') updateAliensDemoOnly(s, dt, CONFIG);
          renderFrame(ctx, s, CONFIG, ALIEN_TYPES);
          if (typeof SFX !== 'undefined') SFX.tick(s);
        }
        return;
      }
      // Player movement
      const spd = CONFIG.player.speed * dt;
      if ((s.keys['ArrowLeft'] || s.keys['KeyA']) && s.playerX > 24) s.playerX -= spd;
      if ((s.keys['ArrowRight'] || s.keys['KeyD']) && s.playerX < CONFIG.canvas.width - 24) s.playerX += spd;

      updateFrame(s, dt, CONFIG, ALIEN_TYPES);
      renderFrame(ctx, s, CONFIG, ALIEN_TYPES);
      if (typeof SFX !== 'undefined') SFX.tick(s);

      setUi({ score: s.score, hiScore: s.hiScore, level: s.level, lives: s.lives, phase: s.phase });

      if (s.phase === 'levelclear') {
        setTimeout(() => {
          if (gameRef.current && gameRef.current.phase === 'levelclear') {
            const newState = initState(CONFIG, s.level + 1);
            newState.score = s.score;
            newState.hiScore = s.hiScore;
            newState.lives = s.lives;
            gameRef.current = newState;
            setUi(u => ({ ...u, phase: 'playing', level: s.level + 1 }));
          }
        }, CONFIG.levelClearDelay);
      }
    };

    // Initialize start state for canvas animation
    if (!gameRef.current) {
      gameRef.current = initState(CONFIG, 1);
      gameRef.current.phase = 'start';
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return html`<div class="game-container">
    <canvas ref=${canvasRef} width=${CONFIG.canvas.width} height=${CONFIG.canvas.height} class="game-canvas" />
    ${ui.phase !== 'start' ? html`<${HUD} score=${ui.score} hiScore=${ui.hiScore} level=${ui.level} lives=${ui.lives} />` : null}
    ${ui.phase === 'start'    ? html`<${StartOverlay}    onStart=${restartGame} />` : null}
    ${ui.phase === 'gameover' ? html`<${GameOverOverlay} score=${ui.score} hiScore=${ui.hiScore} onRestart=${restartGame} />` : null}
    ${ui.phase === 'levelclear' ? html`<${LevelClearOverlay} level=${ui.level} score=${ui.score} />` : null}
  </div>`;
}

function updateStarsOnly(state, dt) {
  for (const layer of state.stars)
    for (const s of layer.stars) { s.y += layer.speed; if (s.y > 600) { s.y = 0; s.x = Math.random() * 800; } }
}

function updateAliensDemoOnly(state, dt, cfg) {
  const speed = 20;
  let minX = Infinity, maxX = -Infinity;
  for (const row of state.aliens) for (const a of row)
    if (a.alive) { minX = Math.min(minX, a.x); maxX = Math.max(maxX, a.x + 30); }
  let drop = 0, newDir = state.alienDir;
  if (maxX + speed * dt * state.alienDir > cfg.canvas.width - 10 && state.alienDir > 0) { drop = cfg.alien.dropAmount; newDir = -1; }
  else if (minX + speed * dt * state.alienDir < 10 && state.alienDir < 0) { drop = cfg.alien.dropAmount; newDir = 1; }
  for (const row of state.aliens) for (const a of row)
    if (a.alive) { a.x += drop ? 0 : speed * dt * state.alienDir; a.y += drop; }
  if (drop) { state.alienDir = newDir; }
  // Wrap aliens back to top if they march off screen
  let maxY = 0;
  for (const row of state.aliens) for (const a of row) if (a.alive) maxY = Math.max(maxY, a.y);
  if (maxY > 520) for (const row of state.aliens) for (const a of row) a.y -= 400;
  state.alienFrameTimer += dt * 1000;
  if (state.alienFrameTimer >= cfg.alien.animInterval) { state.alienFrame ^= 1; state.alienFrameTimer = 0; }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(html`<${App} />`);
