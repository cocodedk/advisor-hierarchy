// App.js — Root React application component

function buildCells(grid, extraFn) {
  return Array.from({ length: ROWS * COLS }, (_, i) => {
    const r = Math.floor(i / COLS), c = i % COLS;
    const state = grid[r][c];
    const classes = [];
    if (state === 'ship') classes.push('ship');
    else if (state === 'hit') classes.push('hit');
    else if (state === 'miss') classes.push('miss');
    else if (state === 'sunk') classes.push('sunk');
    if (extraFn) extraFn(r, c, state, classes);
    const hasX = state === 'hit' || state === 'sunk';
    return { row: r, col: c, classes, inner: hasX ? html`<div className="hit-cross">✕</div>` : null };
  });
}

function fireOnComp(game, r, c) {
  if (game.compGrid[r][c] !== 'empty') return game;
  const isHit = game.compShipGrid[r][c] === 'ship';
  const newGrid = game.compGrid.map(row => [...row]);
  const newShips = game.compShips.map(ship => {
    if (!ship.cells.some(cl => cl.row === r && cl.col === c)) return ship;
    const hits = ship.hits + 1;
    const sunk = hits >= ship.size;
    if (sunk) ship.cells.forEach(cl => { newGrid[cl.row][cl.col] = 'sunk'; });
    return { ...ship, hits, sunk };
  });
  if (!newShips.some(s => s.sunk && s.cells.some(cl => cl.row === r && cl.col === c))) {
    newGrid[r][c] = isHit ? 'hit' : 'miss';
  }
  const won = checkAllSunk(newShips);
  return { ...game, compGrid: newGrid, compShips: newShips,
    turn: won ? 'player' : 'computer', phase: won ? 'gameover' : game.phase, winner: won ? 'player' : null };
}

function App() {
  const [game, setGame] = useState(() => initState());

  useEffect(() => {
    if (game.phase === 'battle' && game.turn === 'computer') {
      const t = setTimeout(() => setGame(prev => computerFireRandom(prev)), 0);
      return () => clearTimeout(t);
    }
  }, [game.phase, game.turn]);

  useEffect(() => {
    const fn = e => {
      if (e.code === 'KeyR') setGame(prev =>
        prev.phase === 'placement' ? { ...prev, orient: prev.orient === 'h' ? 'v' : 'h' } : prev
      );
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const { phase, turn, winner, orient, shipIdx, hoverRow, hoverCol, playerGrid, playerShips, compGrid, compShips } = game;
  const allPlaced = shipIdx >= SHIPS.length;

  const playerCells = buildCells(playerGrid, (r, c, state, cls) => {
    if (phase === 'placement' && shipIdx < SHIPS.length && hoverRow >= 0) {
      const prev_cells = shipCells(hoverRow, hoverCol, SHIPS[shipIdx].size, orient);
      if (prev_cells.some(cl => cl.row === r && cl.col === c)) {
        const valid = isValid(playerGrid, hoverRow, hoverCol, SHIPS[shipIdx].size, orient);
        cls.push(valid ? 'preview-valid' : 'preview-invalid');
      }
    }
  });
  const compCells = buildCells(compGrid, (r, c, state, cls) => {
    if (phase === 'battle' && turn === 'player' && state === 'empty') cls.push('targetable');
  });

  const statusText = phase === 'placement'
    ? (allPlaced ? 'All ships placed!' : `Place ${SHIPS[shipIdx].name} (${SHIPS[shipIdx].size}) — R to rotate`)
    : phase === 'battle' ? (turn === 'player' ? 'Your turn — fire on enemy waters' : 'Computer thinking...')
    : '';

  const showOverlay = phase === 'start' || phase === 'gameover';

  return html`<div id="app">
    ${showOverlay && html`<div id="overlay" className="overlay">
      <h1>${phase === 'start' ? 'BATTLESHIP' : ''}</h1>
      ${phase === 'gameover' && html`<h1 id="overlay-title">${winner === 'player' ? 'VICTORY!' : 'DEFEATED!'}</h1>`}
      ${phase === 'start' && html`<p className="overlay-sub">Command your fleet. Destroy the enemy.</p>`}
      <button className="btn primary" onClick=${phase === 'start'
        ? () => setGame(prev => ({ ...prev, phase: 'placement' }))
        : () => setGame(() => initState())}>
        ${phase === 'start' ? 'DEPLOY FLEET' : 'PLAY AGAIN'}
      </button>
    </div>`}
    ${phase !== 'start' && html`<div id="game-ui">
      <div className="game-header">
        <div className="game-title">BATTLESHIP</div>
        <div id="status-bar" className=${'turn-badge ' + (turn === 'player' ? 'player-turn' : 'computer-turn')}>
          ${statusText}
        </div>
      </div>
      <div className="grids-area">
        <div className="grid-panel">
          <h2>Your Grid</h2>
          <${GridBoard} id="playerGridEl" cells=${playerCells}
            onCellClick=${(r,c) => {
              if (phase !== 'placement' || shipIdx >= SHIPS.length) return;
              if (!isValid(game.playerGrid, r, c, SHIPS[shipIdx].size, orient)) return;
              const res = placeShip(game.playerGrid, game.playerShips, shipIdx, r, c, orient);
              const ni = shipIdx + 1;
              setGame(prev => ({ ...prev, playerGrid: res.grid, playerShips: res.ships, shipIdx: ni,
                hoverRow: -1, hoverCol: -1 }));
            }}
            onCellEnter=${(r,c) => phase === 'placement' && setGame(prev => ({ ...prev, hoverRow: r, hoverCol: c }))}
            onCellLeave=${() => phase === 'placement' && setGame(prev => ({ ...prev, hoverRow: -1, hoverCol: -1 }))} />
          <${ShipList} title="Your Fleet" ships=${playerShips} />
        </div>
        <div className="grid-panel">
          <h2>Enemy Waters</h2>
          <${GridBoard} id="computerGridEl" cells=${compCells}
            onCellClick=${(r,c) => { if (phase === 'battle' && turn === 'player') setGame(prev => fireOnComp(prev, r, c)); }} />
          <${ShipList} title="Enemy Fleet" ships=${compShips} />
        </div>
      </div>
      ${phase === 'placement' && html`<div id="placement-panel">
        <button type="button" id="rotation-btn"
          className=${'btn ' + (orient==='h'?'horizontal':'vertical')}
          aria-pressed=${orient === 'v'}
          onClick=${() => setGame(prev => ({ ...prev, orient: prev.orient==='h'?'v':'h' }))}>
          ${orient === 'h' ? '↔ Horizontal' : '↕ Vertical'}
        </button>
        <button className="btn" onClick=${() => {
          const p = randomPlacements();
          setGame(prev => ({ ...prev, phase: 'battle', turn: 'player', shipIdx: SHIPS.length,
            playerGrid: p.grid, playerShips: p.ships, hoverRow: -1, hoverCol: -1 }));
        }}>Random</button>
        <button className="btn danger" onClick=${() => setGame(prev => ({ ...prev, shipIdx: 0,
          playerGrid: emptyGrid(), playerShips: SHIPS.map(s => ({ ...s, cells: [], sunk: false, hits: 0 })),
          hoverRow: -1, hoverCol: -1, orient: 'h' }))}>Reset</button>
        <button id="btn-ready" className="btn success" disabled=${!allPlaced}
          onClick=${() => setGame(prev => ({ ...prev, phase: 'battle', turn: 'player' }))}>START BATTLE</button>
      </div>`}
    </div>`}
  </div>`;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(html`<${App}/>`);
