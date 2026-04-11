// gameLogic.js — pure functions, no React deps

function emptyGrid() {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => ({ ship: -1, hit: false }))
  );
}

function newShipStatus() {
  return SHIPS.map(() => ({ cells: [], hits: 0, sunk: false }));
}

function initState() {
  return {
    phase:          'start',     // 'start' | 'placement' | 'battle' | 'over'
    placementIndex: 0,
    isVertical:     false,
    playerGrid:     emptyGrid(),
    computerGrid:   emptyGrid(),
    playerShips:    newShipStatus(),
    computerShips:  newShipStatus(),
    playerFired:    [],          // array of 'r-c' strings (serializable)
    computerFired:  [],
    turn:           'player',
    lastMsg:        '',
    winner:         null,        // 'player' | 'computer' | null
  };
}

function shipCells(row, col, size, vertical) {
  const cells = [];
  for (let i = 0; i < size; i++) {
    cells.push(vertical ? [row + i, col] : [row, col + i]);
  }
  return cells;
}

function isValid(cells, grid) {
  for (const [r, c] of cells) {
    if (r < 0 || r >= 10 || c < 0 || c >= 10) return false;
    if (grid[r][c].ship !== -1) return false;
  }
  return true;
}

function placeShip(cells, idx, grid, ships) {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  const newShips = ships.map(s => ({ ...s, cells: [...s.cells] }));
  newShips[idx] = { ...newShips[idx], cells };
  for (const [r, c] of cells) {
    newGrid[r][c] = { ...newGrid[r][c], ship: idx };
  }
  return { grid: newGrid, ships: newShips };
}

function randomPlacements(initialGrid, initialShips) {
  let grid = initialGrid.map(row => row.map(cell => ({ ...cell })));
  let ships = initialShips.map(s => ({ ...s, cells: [] }));
  for (let i = 0; i < SHIPS.length; i++) {
    let placed = false, attempts = 0;
    while (!placed && attempts < 2000) {
      attempts++;
      const vertical = Math.random() < 0.5;
      const row = Math.floor(Math.random() * 10);
      const col = Math.floor(Math.random() * 10);
      const cells = shipCells(row, col, SHIPS[i].size, vertical);
      if (isValid(cells, grid)) {
        const result = placeShip(cells, i, grid, ships);
        grid = result.grid;
        ships = result.ships;
        placed = true;
      }
    }
  }
  return { grid, ships };
}

function checkAllSunk(ships) {
  return ships.every(s => s.sunk);
}

function applyFire(row, col, grid, ships, firedSet) {
  const key = `${row}-${col}`;
  if (firedSet.includes(key)) return null; // already fired
  const newGrid = grid.map(r => r.map(c => ({ ...c })));
  const newShips = ships.map(s => ({ ...s }));
  newGrid[row][col] = { ...newGrid[row][col], hit: true };
  const idx = grid[row][col].ship;
  let msg = '';
  let won = false;
  if (idx !== -1) {
    newShips[idx] = { ...newShips[idx], hits: newShips[idx].hits + 1 };
    if (newShips[idx].hits >= SHIPS[idx].size) {
      newShips[idx] = { ...newShips[idx], sunk: true };
      msg = `HIT & SUNK`;
      won = checkAllSunk(newShips);
    } else {
      msg = `HIT`;
    }
  } else {
    msg = `MISS`;
  }
  return { newGrid, newShips, fired: [...firedSet, key], msg, idx, won };
}

function computerFireRandom(state) {
  const fired = state.computerFired;
  let row, col, key;
  let attempts = 0;
  do {
    row = Math.floor(Math.random() * 10);
    col = Math.floor(Math.random() * 10);
    key = `${row}-${col}`;
    attempts++;
  } while (fired.includes(key) && attempts < 200);

  const result = applyFire(row, col, state.playerGrid, state.playerShips, fired);
  if (!result) return state;

  const shipName = result.idx !== -1 ? SHIPS[result.idx].name.toUpperCase() : '';
  let msg = '';
  if (result.msg === 'HIT & SUNK') msg = `Computer SUNK your ${shipName}!`;
  else if (result.msg === 'HIT') msg = `Computer HIT your ${shipName}!`;
  else msg = 'Computer MISSED — your fleet is safe.';

  const nextState = {
    ...state,
    playerGrid: result.newGrid,
    playerShips: result.newShips,
    computerFired: result.fired,
    turn: result.won ? 'computer' : 'player',
    phase: result.won ? 'over' : 'battle',
    winner: result.won ? 'computer' : null,
    lastMsg: msg + (result.won ? '' : '  |  YOUR TURN — click enemy grid to fire!'),
  };
  return nextState;
}
