// si-render.js — pure canvas draw functions, no game logic, plain globals
/* global CONFIG */
const { W, H } = CONFIG.CANVAS;
const { BLOCK } = CONFIG.SHIELDS;
const { PL_W, PL_H, AL_H } = CONFIG.BULLETS;
const { BLINK_MS, W: PW, H: PH } = CONFIG.PLAYER;

function drawBackground(ctx) {
  let g = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.7);
  g.addColorStop(0, 'rgba(0,0,30,1)'); g.addColorStop(1, 'rgba(0,0,8,1)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  let v = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, Math.max(W,H)*0.7);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

function drawStars(ctx, state) {
  for (let i = 0; i < state.stars.length; i++) {
    const { size, alpha } = CONFIG.STARS[i];
    ctx.globalAlpha = alpha; ctx.fillStyle = '#fff';
    for (const s of state.stars[i]) {
      ctx.beginPath(); ctx.arc(s.x, s.y, size, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawShields(ctx, state) {
  const sc = ['#00ff44','#00bb33','#006622'];
  for (const bl of state.shields) {
    if (bl.state === 3) continue;
    ctx.fillStyle = sc[bl.state]; ctx.fillRect(bl.bx, bl.by, BLOCK, BLOCK);
    if (bl.state === 0) { ctx.strokeStyle='rgba(0,255,100,0.15)'; ctx.lineWidth=0.5; ctx.strokeRect(bl.bx,bl.by,BLOCK,BLOCK); }
  }
}

function _alienShape(ctx, typeIdx, frame) {
  if (typeIdx === 0) { // UFO — pink
    const lo = frame ? 3 : 0;
    ctx.beginPath(); ctx.ellipse(0, 2, 14, 8, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -4, 7, 5, 0, 0, Math.PI*2); ctx.fill();
    [-8,0,8].forEach((lx, i) => { const xo = i===0?-lo:i===2?lo:0; ctx.fillRect(lx-1+xo,8,2,4); });
  } else if (typeIdx === 1) { // crab — cyan
    const cy = frame ? -3 : 0;
    ctx.fillRect(-11,-7,22,14);
    ctx.fillRect(-18,-4+cy,7,3); ctx.fillRect(-20,-6+cy,4,3);
    ctx.fillRect(11,-4+cy,7,3);  ctx.fillRect(16,-6+cy,4,3);
    ctx.fillRect(-8,7,4,4); ctx.fillRect(4,7,4,4);
  } else { // squid — green
    const r=4; ctx.beginPath();
    ctx.moveTo(-8+r,-9); ctx.arcTo(8,-9,8,9,r); ctx.arcTo(8,9,-8,9,r);
    ctx.arcTo(-8,9,-8,-9,r); ctx.arcTo(-8,-9,8,-9,r); ctx.closePath(); ctx.fill();
    [-6,-2,2,6].forEach((tx,i) => {
      const sh = frame ? (i%2===0?-3:3) : 0;
      ctx.fillRect(tx-1, 9, 2, [10,14,14,10][i]+sh);
    });
  }
}

function drawAliens(ctx, state) {
  for (const al of state.aliens) {
    if (!al.alive) continue;
    const t = CONFIG.ALIENS.TYPES[al.typeIdx];
    ctx.save(); ctx.translate(al.x, al.y);
    ctx.fillStyle = t.color; ctx.shadowColor = t.glow; ctx.shadowBlur = 8;
    _alienShape(ctx, al.typeIdx, state.alienFrame);
    ctx.restore();
  }
}

function drawPlayer(ctx, state, now) {
  const p = state.player;
  if (now < p.invincibleUntil && Math.floor(now/BLINK_MS)%2===1) return;
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle='#00ff88'; ctx.shadowColor='#00ff88'; ctx.shadowBlur=16;
  ctx.beginPath(); ctx.moveTo(0,-PH/2); ctx.lineTo(PW/2,PH/2); ctx.lineTo(-PW/2,PH/2); ctx.closePath(); ctx.fill();
  ctx.fillRect(-5, PH/2-1, 10, 4);
  ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur=20; ctx.fillStyle='rgba(0,255,136,0.4)';
  ctx.beginPath(); ctx.arc(0, PH/2+5, 6, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawPlayerBullet(ctx, state) {
  if (!state.playerBullet) return;
  const {x,y} = state.playerBullet;
  ctx.save(); ctx.shadowBlur=18; ctx.shadowColor='#00ff88';
  ctx.fillStyle='#00ff88'; ctx.fillRect(x-PL_W/2, y-PL_H/2, PL_W, PL_H);
  ctx.fillStyle='rgba(0,255,136,0.3)'; ctx.fillRect(x-3, y-PL_H/2, 6, PL_H);
  ctx.restore();
}

function drawAlienBullets(ctx, state) {
  ctx.save(); ctx.strokeStyle='#ff4444'; ctx.shadowColor='#ff6666'; ctx.shadowBlur=10; ctx.lineWidth=2;
  for (const ab of state.alienBullets) {
    const {x,y} = ab; const zz = Math.sin(ab.phase)*4;
    ctx.beginPath(); ctx.moveTo(x,y-AL_H/2); ctx.lineTo(x+zz,y-3); ctx.lineTo(x-zz,y+3); ctx.lineTo(x,y+AL_H/2); ctx.stroke();
  }
  ctx.restore();
}

function drawUFO(ctx, state, now) {
  if (!state.ufo) return;
  const {x,y} = state.ufo;
  ctx.save(); ctx.translate(x,y);
  ctx.shadowColor='#ff2244'; ctx.shadowBlur=12+Math.sin(now/80)*8;
  ctx.fillStyle='#ff2244';
  ctx.beginPath(); ctx.ellipse(0,0,22,7,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#ff4455'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle='#ff6677'; ctx.beginPath(); ctx.ellipse(0,-6,11,5,0,0,Math.PI*2); ctx.fill();
  [-10,0,10].forEach((lx,i) => {
    ctx.fillStyle = (Math.floor(now/200)%2===i%2) ? '#ffaaaa' : '#883333';
    ctx.beginPath(); ctx.arc(lx,6,2.5,0,Math.PI*2); ctx.fill();
  });
  ctx.restore();
}

function drawParticles(ctx, state) {
  ctx.save();
  for (const p of state.particles) {
    const a = (p.life/p.maxLife)**2;
    ctx.globalAlpha=a; ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.arc(p.x,p.y,2.5,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawScorePopups(ctx, state) {
  ctx.save(); ctx.font='bold 14px Orbitron,monospace'; ctx.fillStyle='#ffee44'; ctx.textAlign='center';
  for (const popup of state.scorePopups) {
    ctx.globalAlpha = popup.life/popup.maxLife;
    ctx.fillText(popup.text, popup.x, popup.y);
  }
  ctx.restore();
}

function drawScene(ctx, state, now) {
  ctx.save();
  ctx.translate(state.shakeDx, state.shakeDy);
  drawBackground(ctx);
  drawStars(ctx, state);
  drawShields(ctx, state);
  drawAliens(ctx, state);
  drawPlayerBullet(ctx, state);
  drawAlienBullets(ctx, state);
  drawPlayer(ctx, state, now);
  drawUFO(ctx, state, now);
  drawParticles(ctx, state);
  drawScorePopups(ctx, state);
  ctx.restore();
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
}
