// Grid.js — GridBoard React component (10×10 grid with headers)

function GridBoard({ id, cells, onCellClick, onCellEnter, onCellLeave }) {
  const handleClick = (row, col) => onCellClick && onCellClick(row, col);
  const handleEnter = (row, col) => onCellEnter && onCellEnter(row, col);
  const handleLeave = (row, col) => onCellLeave && onCellLeave(row, col);

  // Build 11×11 grid: corner + 10 col headers + 10 rows of (label + 10 cells)
  const items = [];

  // corner
  items.push(html`<div key="corner" className="grid-label"></div>`);

  // col headers A-J
  for (let c = 0; c < COLS; c++) {
    items.push(html`<div key=${'ch-' + c} className="grid-label">${COL_LABELS[c]}</div>`);
  }

  // rows
  for (let r = 0; r < ROWS; r++) {
    // row label
    items.push(html`<div key=${'rl-' + r} className="grid-label">${r + 1}</div>`);

    for (let c = 0; c < COLS; c++) {
      const cellObj = cells[r * COLS + c];
      const cls = ['cell', ...(cellObj ? cellObj.classes : [])].join(' ');
      const innerContent = cellObj && cellObj.inner ? cellObj.inner : null;
      items.push(html`
        <div
          key=${r + '-' + c}
          className=${cls}
          data-row=${r}
          data-col=${c}
          onClick=${() => handleClick(r, c)}
          onMouseEnter=${() => handleEnter(r, c)}
          onMouseLeave=${() => handleLeave(r, c)}
        >${innerContent}</div>
      `);
    }
  }

  return html`<div id=${id} className="grid-wrap">${items}</div>`;
}
