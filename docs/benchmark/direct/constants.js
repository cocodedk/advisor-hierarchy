// constants.js — shared game constants + React bindings
const html = htm.bind(React.createElement);
const { useState, useEffect, useCallback } = React;

const ROWS = 10;
const COLS = 10;

const SHIPS = [
  { name: 'Carrier',    size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser',    size: 3 },
  { name: 'Submarine',  size: 3 },
  { name: 'Destroyer',  size: 2 },
];

const COL_LABELS = ['A','B','C','D','E','F','G','H','I','J'];
