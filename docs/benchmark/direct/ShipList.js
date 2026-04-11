// ShipList.js — Ship status HUD component

function ShipList({ title, ships }) {
  return html`
    <div className="ship-list">
      <div className="ship-list-title">${title}</div>
      ${ships.map(ship => html`
        <div key=${ship.name} className=${'ship-entry' + (ship.sunk ? ' sunk' : '')}>
          <span className="ship-entry-name">${ship.name}</span>
          <div className="ship-dots">
            ${Array.from({ length: ship.size }, (_, i) => {
              const hit = i < ship.hits;
              return html`<div key=${i} className=${'dot' + (hit ? ' dot-hit' : '')}></div>`;
            })}
          </div>
        </div>
      `)}
    </div>
  `;
}
