// constants.js — game-wide constants + shared React bindings
const html = htm.bind(React.createElement);
const { useState, useEffect, useCallback } = React;
const COLS = ['A','B','C','D','E','F','G','H','I','J'];
const ROWS = [1,2,3,4,5,6,7,8,9,10];
const SHIPS = [
  { name: 'Carrier',    size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser',    size: 3 },
  { name: 'Submarine',  size: 3 },
  { name: 'Destroyer',  size: 2 },
];
