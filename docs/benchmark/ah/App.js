// App.js — React App root component

function playerCells(game) {
  return Array.from({ length: 100 }, (_, i) => {
    const r = Math.floor(i / 10), c = i % 10, gc = game.playerGrid[r][c];
    const classes = [];
    if (game.phase === 'placement') {
      const idx = gc.ship;
      if (idx !== -1) classes.push('ship', `ship-${idx}`);
      else classes.push('placement-clickable');
    } else {
      if (gc.hit) {
        classes.push(gc.ship !== -1 ? (game.playerShips[gc.ship].sunk ? 'enemy-sunk' : 'enemy-hit') : 'miss-player');
      } else if (gc.ship !== -1) classes.push(`ship-${gc.ship}`);
    }
    return { row: r, col: c, classes };
  });
}

function computerCells(game) {
  return Array.from({ length: 100 }, (_, i) => {
    const r = Math.floor(i / 10), c = i % 10, gc = game.computerGrid[r][c];
    const classes = [];
    if (game.phase === 'battle' && game.turn === 'player' && !gc.hit) classes.push('targetable');
    if (gc.hit) classes.push(gc.ship !== -1 ? (game.computerShips[gc.ship].sunk ? 'sunk' : 'hit') : 'miss');
    return { row: r, col: c, classes };
  });
}

function withPreview(cells, previewCells, valid) {
  const cls = valid ? 'preview-valid' : 'preview-invalid';
  const set = new Set(previewCells.map(([r, c]) => r * 10 + c));
  return cells.map((cell, i) => set.has(i) ? { ...cell, classes: [...cell.classes, cls] } : cell);
}

function App() {
  const [game, setGame] = useState(() => initState());
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (game.phase === 'battle' && game.turn === 'computer') {
      const timer = setTimeout(() => setGame(prev => computerFireRandom(prev)), 0);
      return () => clearTimeout(timer);
    }
  }, [game.phase, game.turn]);

  const startGame = useCallback(() => setGame(g => ({ ...g, phase: 'placement' })), []);
  const toggleRotation = useCallback(() => setGame(g => ({ ...g, isVertical: !g.isVertical })), []);

  const doRandom = useCallback(() => {
    setGame(g => {
      const res = randomPlacements(emptyGrid(), g.playerShips.map(s => ({ ...s, cells: [], hits: 0, sunk: false })));
      return { ...g, playerGrid: res.grid, playerShips: res.ships, placementIndex: SHIPS.length };
    });
    setPreview(null);
  }, []);

  const doReset = useCallback(() => { setGame(initState()); setPreview(null); }, []);

  const startBattle = useCallback(() => {
    setGame(g => {
      const res = randomPlacements(emptyGrid(), g.computerShips.map(s => ({ ...s, cells: [], hits: 0, sunk: false })));
      return { ...g, phase: 'battle', turn: 'player', computerGrid: res.grid, computerShips: res.ships,
               playerFired: [], computerFired: [], lastMsg: 'YOUR TURN — click enemy grid to fire!' };
    });
    setPreview(null);
  }, []);

  const onPlayerCellClick = useCallback((r, c) => {
    setGame(g => {
      if (g.phase !== 'placement' || g.placementIndex >= SHIPS.length) return g;
      const ship = SHIPS[g.placementIndex];
      const cells = shipCells(r, c, ship.size, g.isVertical);
      if (!isValid(cells, g.playerGrid)) return g;
      const res = placeShip(cells, g.placementIndex, g.playerGrid, g.playerShips);
      const ni = g.placementIndex + 1;
      const msg = ni >= SHIPS.length ? 'All ships placed! Click START BATTLE.' :
        `Place your ${SHIPS[ni].name.toUpperCase()} (${SHIPS[ni].size} cells)`;
      return { ...g, playerGrid: res.grid, playerShips: res.ships, placementIndex: ni, lastMsg: msg };
    });
    setPreview(null);
  }, []);

  const onPlayerCellEnter = useCallback((r, c) => {
    if (game.phase !== 'placement' || game.placementIndex >= SHIPS.length) return;
    const ship = SHIPS[game.placementIndex];
    const cells = shipCells(r, c, ship.size, game.isVertical);
    setPreview({ cells, valid: isValid(cells, game.playerGrid) });
  }, [game.phase, game.placementIndex, game.isVertical, game.playerGrid]);

  const onPlayerCellLeave = useCallback(() => setPreview(null), []);

  const onComputerCellClick = useCallback((r, c) => {
    setGame(g => {
      if (g.phase !== 'battle' || g.turn !== 'player') return g;
      const res = applyFire(r, c, g.computerGrid, g.computerShips, g.playerFired);
      if (!res) return g;
      const sn = res.idx !== -1 ? SHIPS[res.idx].name.toUpperCase() : '';
      const msg = res.msg === 'HIT & SUNK' ? `HIT & SUNK the enemy ${sn}!` :
                  res.msg === 'HIT' ? `HIT! Enemy ${sn} is damaged.` : 'MISS — your shot splashed into the sea.';
      if (res.won) return { ...g, computerGrid: res.newGrid, computerShips: res.newShips,
        playerFired: res.fired, phase: 'over', winner: 'player', lastMsg: 'VICTORY — You sunk all enemy ships!' };
      return { ...g, computerGrid: res.newGrid, computerShips: res.newShips,
        playerFired: res.fired, turn: 'computer', lastMsg: msg + '  |  Computer is aiming...' };
    });
  }, []);

  const playAgain = useCallback(() => { setGame(initState()); setPreview(null); }, []);

  let pCells = playerCells(game);
  if (preview) pCells = withPreview(pCells, preview.cells, preview.valid);
  const cCells = computerCells(game);
  const placedAll = game.placementIndex >= SHIPS.length;
  const statusCls = game.phase === 'battle' ? (game.turn === 'player' ? 'turn-player' : 'turn-computer') : game.phase === 'over' ? 'game-over' : '';
  const statusMsg = game.phase === 'placement' && game.placementIndex === 0 ? `Place your ${SHIPS[0].name.toUpperCase()} (${SHIPS[0].size} cells)` : game.lastMsg;
  const pHud = game.playerShips.map((s, i) => ({ name: SHIPS[i].name, size: SHIPS[i].size, hits: s.hits, sunk: s.sunk }));
  const cHud = game.computerShips.map((s, i) => ({ name: SHIPS[i].name, size: SHIPS[i].size, hits: s.hits, sunk: s.sunk }));

  return html`
    <div className="game-wrapper">
      <h1>BATTLESHIP</h1>
      ${game.phase === 'start' && html`
        <div id="overlay" style=${{ display:'flex', position:'fixed', inset:0, background:'rgba(9,9,15,0.92)', backdropFilter:'blur(8px)', zIndex:100, flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'20px' }}>
          <div className="overlay-box" style=${{ textAlign:'center' }}>
            <h2 className="win" style=${{ marginBottom:'12px' }}>BATTLESHIP</h2>
            <p style=${{ marginBottom:'24px' }}>TACTICAL NAVAL WARFARE</p>
            <button className="btn-primary" onClick=${startGame}>DEPLOY FLEET</button>
          </div>
        </div>
      `}
      ${game.phase !== 'start' && html`
        <p className="subtitle">TACTICAL NAVAL WARFARE</p>
        <div id="status-bar" className=${statusCls}>${statusMsg}</div>
        <div className="boards-row">
          <div className="board-section">
            <div className="board-title">YOUR FLEET — <span>${game.phase === 'placement' ? (placedAll ? 'READY' : 'PLACEMENT') : 'FLEET'}</span></div>
            <${GridBoard} id="player-grid" cells=${pCells} onCellClick=${game.phase === 'placement' ? onPlayerCellClick : null} onCellEnter=${game.phase === 'placement' ? onPlayerCellEnter : null} onCellLeave=${game.phase === 'placement' ? onPlayerCellLeave : null} />
          </div>
          <div className="board-section">
            <div className="board-title">ENEMY WATERS — <span>${game.phase === 'placement' ? 'HIDDEN' : 'TARGET'}</span></div>
            <${GridBoard} id="computer-grid" cells=${cCells} onCellClick=${game.phase === 'battle' && game.turn === 'player' ? onComputerCellClick : null} />
          </div>
        </div>
        ${game.phase === 'placement' && html`
          <div className="controls">
            <button id="rotation-btn" className="btn-ghost" onClick=${toggleRotation}>${game.isVertical ? '↻ VERTICAL' : '↻ HORIZONTAL'}</button>
            <button id="random-btn" className="btn-ghost" onClick=${doRandom}>⚄ RANDOM PLACEMENT</button>
            <button id="reset-btn" className="btn-danger" onClick=${doReset}>↺ RESET</button>
            <button id="btn-ready" className="btn-primary" disabled=${!placedAll} onClick=${startBattle}>▶ START BATTLE</button>
          </div>
          <div className="placement-queue">${SHIPS.map((s, i) => html`<div key=${i} className=${'queue-ship' + (i < game.placementIndex ? ' placed' : i === game.placementIndex ? ' active' : '')}>${s.name} (${s.size})</div>`)}</div>
        `}
        ${game.phase !== 'placement' && html`<div className="hud-row"><${ShipList} title="Your Ships" ships=${pHud} /><${ShipList} title="Enemy Ships" ships=${cHud} /></div>`}
      `}
      ${game.phase === 'over' && html`
        <div id="overlay" style=${{ display:'flex', position:'fixed', inset:0, background:'rgba(9,9,15,0.85)', backdropFilter:'blur(8px)', zIndex:100, flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'20px' }}>
          <div className="overlay-box">
            <h2 id="overlay-title" className=${game.winner === 'player' ? 'win' : 'lose'}>${game.winner === 'player' ? 'VICTORY!' : 'DEFEATED!'}</h2>
            <p>${game.winner === 'player' ? 'All enemy ships sunk. The seas are yours.' : 'Your fleet destroyed. The enemy prevails.'}</p>
            <button className="btn-primary" onClick=${playAgain}>↺ PLAY AGAIN</button>
          </div>
        </div>
      `}
    </div>
  `;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(html`<${App}/>`);
