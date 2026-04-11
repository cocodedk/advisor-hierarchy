// Grid.js — GridBoard React component
// Props: { id, cells, onCellClick, onCellEnter, onCellLeave }
// cells: array of {row, col, classes:[]} objects (100 total)
// Renders: corner spacer, col headers A-J, row labels 1-10, 100 .cell divs

function GridBoard({ id, cells, onCellClick, onCellEnter, onCellLeave }) {
  const handleClick = useCallback((row, col) => {
    if (onCellClick) onCellClick(row, col);
  }, [onCellClick]);

  const handleEnter = useCallback((row, col) => {
    if (onCellEnter) onCellEnter(row, col);
  }, [onCellEnter]);

  const handleLeave = useCallback(() => {
    if (onCellLeave) onCellLeave();
  }, [onCellLeave]);

  const colHeaders = COLS.map(col =>
    html`<div key=${col} className="coord-label">${col}</div>`
  );

  const rows = [];
  for (let r = 0; r < 10; r++) {
    rows.push(html`<div key=${'row-' + r} className="coord-label">${ROWS[r]}</div>`);
    for (let c = 0; c < 10; c++) {
      const cellData = cells?.[r * 10 + c];
      const className = 'cell' + (cellData?.classes?.length ? ' ' + cellData.classes.join(' ') : '');
      rows.push(
        html`<div
          key=${r + '-' + c}
          className=${className}
          data-row=${r}
          data-col=${c}
          data-r=${r}
          data-c=${c}
          onClick=${() => handleClick(r, c)}
          onMouseEnter=${() => handleEnter(r, c)}
          onMouseLeave=${handleLeave}
        />`
      );
    }
  }

  return html`
    <div className="grid-wrap" id=${id}>
      <div className="coord-label"></div>
      ${colHeaders}
      ${rows}
    </div>
  `;
}
