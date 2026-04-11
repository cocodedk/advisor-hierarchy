// gameLogic.js — pure game logic functions
'use strict';

function emptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill('empty'));
}

function shipCells(row, col, size, orient) {
  const cells = [];
  for (let i = 0; i < size; i++) {
    cells.push({ row: orient === 'v' ? row + i : row, col: orient === 'h' ? col + i : col });
  }
  return cells;
}

function isValid(grid, row, col, size, orient) {
  const cells = shipCells(row, col, size, orient);
  for (const { row: r, col: c } of cells) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
    if (grid[r][c] !== 'empty') return false;
  }
  return true;
}

function placeShip(grid, ships, idx, row, col, orient) {
  const cells = shipCells(row, col, SHIPS[idx].size, orient);
  const newGrid = grid.map(r => [...r]);
  cells.forEach(({ row: r, col: c }) => { newGrid[r][c] = 'ship'; });
  const newShips = ships.map((s, i) =>
    i === idx ? { ...s, cells, orient, sunk: false, hits: 0 } : s
  );
  return { grid: newGrid, ships: newShips };
}

function randomPlacements() {
  let grid = emptyGrid();
  let ships = SHIPS.map(s => ({ ...s, cells: [], orient: 'h', sunk: false, hits: 0 }));
  SHIPS.forEach((ship, idx) => {
    let placed = false, attempts = 0;
    while (!placed && attempts < 1000) {
      attempts++;
      const orient = Math.random() < 0.5 ? 'h' : 'v';
      const maxR = orient === 'v' ? ROWS - ship.size : ROWS - 1;
      const maxC = orient === 'h' ? COLS - ship.size : COLS - 1;
      const row = Math.floor(Math.random() * (maxR + 1));
      const col = Math.floor(Math.random() * (maxC + 1));
      if (isValid(grid, row, col, ship.size, orient)) {
        const result = placeShip(grid, ships, idx, row, col, orient);
        grid = result.grid;
        ships = result.ships;
        placed = true;
      }
    }
  });
  return { grid, ships };
}

function computerFireRandom(state) {
  const available = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (state.playerGrid[r][c] !== 'hit' && state.playerGrid[r][c] !== 'miss')
        available.push([r, c]);
  if (available.length === 0) return state;
  const [r, c] = available[Math.floor(Math.random() * available.length)];
  const isHit = state.playerGrid[r][c] === 'ship';
  const newPlayerGrid = state.playerGrid.map(row => [...row]);
  newPlayerGrid[r][c] = isHit ? 'hit' : 'miss';
  let newPlayerShips = state.playerShips;
  if (isHit) {
    newPlayerShips = state.playerShips.map(ship => {
      const match = ship.cells.some(cell => cell.row === r && cell.col === c);
      if (!match) return ship;
      const hits = ship.hits + 1;
      return { ...ship, hits, sunk: hits >= ship.size };
    });
  }
  const allSunk = checkAllSunk(newPlayerShips);
  return {
    ...state,
    playerGrid: newPlayerGrid,
    playerShips: newPlayerShips,
    turn: allSunk ? 'computer' : 'player',
    phase: allSunk ? 'gameover' : state.phase,
    winner: allSunk ? 'computer' : null,
  };
}

function checkAllSunk(ships) {
  return ships.every(s => s.sunk);
}

function initState() {
  const comp = randomPlacements();
  return {
    phase: 'start',
    turn: 'player',
    winner: null,
    orient: 'h',
    shipIdx: 0,
    hoverRow: -1,
    hoverCol: -1,
    playerGrid: emptyGrid(),
    playerShips: SHIPS.map(s => ({ ...s, cells: [], orient: 'h', sunk: false, hits: 0 })),
    compGrid: emptyGrid(),
    compShips: comp.ships,
    compShipGrid: comp.grid,
  };
}
