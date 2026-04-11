// ShipList.js — ShipList HUD React component
// Props: { title, ships }
// ships: [{name, size, hits, sunk}]

function ShipList({ title, ships }) {
  return html`
    <div className="ship-list">
      <h3>${title}</h3>
      ${ships.map((ship, i) => html`
        <div key=${i} className=${'ship-entry' + (ship.sunk ? ' sunk-entry' : '')}>
          <span>${ship.name} (${ship.size})</span>
          <div className="ship-dots">
            ${Array.from({ length: ship.size }, (_, d) => html`
              <div
                key=${d}
                className=${'ship-dot ' + (ship.sunk || d < ship.hits ? 'hit-dot' : 'alive')}
              />
            `)}
          </div>
        </div>
      `)}
    </div>
  `;
}
