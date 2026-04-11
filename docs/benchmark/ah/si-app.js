// si-app.js — React App component, loaded last
(function () {
  const html = htm.bind(React.createElement);
  const { useState, useEffect, useRef, useCallback } = React;

  function ShipIcon() {
    return html`<svg width="16" height="12" viewBox="0 0 32 20" fill="#00ff88">
      <polygon points="16,0 28,18 4,18" />
    </svg>`;
  }

  function App() {
    const canvasRef = useRef(null);
    const gameRef = useRef(null);
    const inputRef = useRef({ left: false, right: false, fire: false });
    const rafRef = useRef(null);
    const lastTimeRef = useRef(null);
    const levelClearTimerRef = useRef(null);

    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(CONFIG.PLAYER.LIVES);
    const [phase, setPhase] = useState('start');
    const [level, setLevel] = useState(1);
    const [hiScore, setHiScore] = useState(
      () => parseInt(localStorage.getItem(CONFIG.HI_KEY) || '0', 10)
    );

    const syncHud = useCallback(() => {
      const s = gameRef.current;
      if (!s) return;
      setScore(s.score);
      setLives(s.lives);
      setLevel(s.level);
      setPhase(s.phase);
    }, []);

    const advanceLevel = useCallback(() => {
      const state = gameRef.current;
      if (!state) return;
      const A = CONFIG.ALIENS;
      state.level++;
      state.aliens = [];
      for (let r = 0; r < A.ROWS; r++)
        for (let c = 0; c < A.COLS; c++)
          state.aliens.push({
            x: A.START_X + c * (A.W + A.X_GAP),
            y: A.START_Y + 40 + r * (A.H + A.Y_GAP),
            typeIdx: A.ROW_TYPE[r], alive: true, row: r, col: c
          });
      state.alienDir = 1;
      state.alienFrame = 0;
      state.alienFrameTimer = 0;
      state.playerBullet = null;
      state.alienBullets = [];
      state.ufo = null;
      const now = performance.now();
      const U = CONFIG.UFO;
      state.ufoNextMs = now + Math.random() * (U.MAX_MS - U.MIN_MS) + U.MIN_MS;
      state.phase = 'play';
      syncHud();
    }, [syncHud]);

    const startGame = useCallback(() => {
      const now = performance.now();
      gameRef.current = initState(now);
      gameRef.current.phase = 'play';
      lastTimeRef.current = null;
      syncHud();
    }, [syncHud]);

    const restartGame = useCallback(() => {
      startGame();
    }, [startGame]);

    useEffect(() => {
      const ctx = canvasRef.current.getContext('2d');

      // Draw idle aliens on 'start' phase via initial state
      const now = performance.now();
      if (!gameRef.current) {
        gameRef.current = initState(now);
        lastTimeRef.current = null;
      }

      function onKey(e, down) {
        const inp = inputRef.current;
        if (e.code === 'ArrowLeft'  || e.code === 'KeyA')     inp.left  = down;
        if (e.code === 'ArrowRight' || e.code === 'KeyD')     inp.right = down;
        if (e.code === 'Space')                                inp.fire  = down;
        if (down && e.code === 'Space') e.preventDefault();
      }
      const onDown = e => onKey(e, true);
      const onUp   = e => onKey(e, false);
      window.addEventListener('keydown', onDown);
      window.addEventListener('keyup', onUp);

      function loop(ts) {
        rafRef.current = requestAnimationFrame(loop);
        const state = gameRef.current;
        if (!state) return;

        if (state.phase === 'over') {
          drawScene(ctx, state, ts);
          // Save hi-score once
          if (state.score > hiScore) {
            localStorage.setItem(CONFIG.HI_KEY, state.score);
            setHiScore(state.score);
          }
          syncHud();
          return;
        }

        if (state.phase === 'start') {
          lastTimeRef.current = ts;
          drawScene(ctx, state, ts);
          return;
        }

        if (state.phase === 'levelclear') {
          drawScene(ctx, state, ts);
          syncHud();
          if (!levelClearTimerRef.current) {
            levelClearTimerRef.current = setTimeout(() => {
              levelClearTimerRef.current = null;
              advanceLevel();
            }, 1500);
          }
          lastTimeRef.current = ts;
          return;
        }

        // phase === 'play'
        const dt = lastTimeRef.current ? Math.min((ts - lastTimeRef.current) / 1000, 0.05) : 0;
        lastTimeRef.current = ts;
        updateFrame(state, dt, inputRef.current, ts);
        applyCollisions(state, ts);
        drawScene(ctx, state, ts);
        syncHud();
      }

      rafRef.current = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(rafRef.current);
        window.removeEventListener('keydown', onDown);
        window.removeEventListener('keyup', onUp);
        if (levelClearTimerRef.current) clearTimeout(levelClearTimerRef.current);
      };
    }, [syncHud, advanceLevel, hiScore]);

    // Update hi-score ref used in loop without re-running the effect
    const hiScoreRef = useRef(hiScore);
    hiScoreRef.current = hiScore;

    const shipIcons = Array.from({ length: lives }, (_, i) => html`<${ShipIcon} key=${i} />`);

    return html`
      <div>
        <canvas id="si-canvas" ref=${canvasRef} width=${CONFIG.CANVAS.W} height=${CONFIG.CANVAS.H} />
        ${(phase === 'play' || phase === 'levelclear') && html`
          <div className="hud">
            <span>SCORE ${score.toString().padStart(6, '0')}</span>
            <span>HI ${hiScore.toString().padStart(6, '0')}</span>
            <span>LV ${level}</span>
            <div className="hud-lives">${shipIcons}</div>
          </div>
        `}

        ${phase === 'start' && html`
          <div className="overlay">
            <h1>SPACE INVADERS</h1>
            <p>DEFEND EARTH — DESTROY ALL ALIENS</p>
            <p style=${{fontSize:'0.7rem',color:'#556677'}}>ARROW KEYS / WASD TO MOVE · SPACE TO FIRE</p>
            <button className="si-btn" onClick=${startGame}>PLAY</button>
          </div>
        `}

        ${phase === 'over' && html`
          <div className="overlay">
            <h1>GAME OVER</h1>
            <h2>SCORE: ${score.toString().padStart(6, '0')}</h2>
            <p>HI-SCORE: ${hiScore.toString().padStart(6, '0')}</p>
            <button className="si-btn" onClick=${restartGame}>PLAY AGAIN</button>
          </div>
        `}

        ${phase === 'levelclear' && html`
          <div className="overlay">
            <h1>LEVEL CLEAR</h1>
            <h2>LEVEL ${level}</h2>
          </div>
        `}
      </div>
    `;
  }

  ReactDOM.createRoot(document.getElementById('root')).render(html`<${App}/>`);
})();
