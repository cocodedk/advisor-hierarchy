// All canvas draw calls — no React, no game logic

function drawBackground(ctx, W, H) {
  const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.75);
  grad.addColorStop(0, '#0a0a18');
  grad.addColorStop(1, '#000008');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // Vignette
  const vig = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.8);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,20,0.6)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

function drawStars(ctx, stars) {
  for (const layer of stars)
    for (const s of layer.stars) {
      ctx.globalAlpha = s.brightness * (0.4 + layer.speed * 0.5);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
    }
  ctx.globalAlpha = 1;
}

function drawAlienShape(ctx, type, frame, x, y, scale) {
  const rects = type.frames[frame];
  const s = scale || 1.8;
  ctx.fillStyle = type.color;
  ctx.shadowColor = type.color;
  ctx.shadowBlur = 6;
  for (const [rx, ry, rw, rh] of rects)
    ctx.fillRect(x + rx * s, y + ry * s, rw * s, rh * s);
  ctx.shadowBlur = 0;
}

function drawAliens(ctx, aliens, alienFrame, alienTypes) {
  for (const row of aliens)
    for (const a of row) {
      if (!a.alive) continue;
      const type = alienTypes[a.row];
      drawAlienShape(ctx, type, alienFrame, a.x, a.y, 1.8);
    }
}

function drawPlayer(ctx, x, y, invincible) {
  const blink = invincible > 0 && Math.floor(invincible / 150) % 2 === 0;
  if (blink) return;
  ctx.save();
  ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 18;
  ctx.fillStyle = '#00ff88';
  // Body
  ctx.fillRect(x - 18, y - 4, 36, 12);
  // Cannon
  ctx.fillRect(x - 4, y - 14, 8, 12);
  // Wings
  ctx.fillRect(x - 26, y + 2, 10, 8);
  ctx.fillRect(x + 16, y + 2, 10, 8);
  // Cockpit window
  ctx.fillStyle = '#aaffdd'; ctx.shadowBlur = 4;
  ctx.fillRect(x - 5, y - 2, 10, 6);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawPlayerBullet(ctx, bullet) {
  if (!bullet) return;
  ctx.save();
  ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 12;
  ctx.fillStyle = '#00ffff';
  ctx.fillRect(bullet.x - 2, bullet.y - 8, 4, 16);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawAlienBullets(ctx, bullets) {
  for (const b of bullets) {
    ctx.save();
    ctx.strokeStyle = '#ff8800'; ctx.lineWidth = 2;
    ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 8;
    const off = Math.sin(b.zigzag) * 4;
    ctx.beginPath();
    ctx.moveTo(b.x + off, b.y - 8);
    ctx.lineTo(b.x - off, b.y);
    ctx.lineTo(b.x + off, b.y + 8);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawShields(ctx, shields, cfg) {
  const { blockSize, colors } = cfg.shields;
  for (const shield of shields)
    for (let r = 0; r < cfg.shields.rows; r++)
      for (let c = 0; c < cfg.shields.cols; c++) {
        const state = shield.blocks[r][c];
        if (state >= 3) continue;
        ctx.fillStyle = colors[state];
        ctx.shadowColor = colors[0]; ctx.shadowBlur = state === 0 ? 4 : 0;
        ctx.fillRect(shield.x + c * blockSize, shield.y + r * blockSize, blockSize, blockSize);
      }
  ctx.shadowBlur = 0;
}

function drawUfo(ctx, ufo, cfgUfo) {
  if (!ufo) return;
  ctx.save();
  const glowIntensity = 8 + ufo.glow * 16;
  ctx.shadowColor = '#ff2244'; ctx.shadowBlur = glowIntensity;
  ctx.globalAlpha = 0.7 + ufo.glow * 0.3;
  // Saucer body
  ctx.fillStyle = '#cc2244';
  ctx.beginPath(); ctx.ellipse(ufo.x, cfgUfo.y, 30, 10, 0, 0, Math.PI*2); ctx.fill();
  // Dome
  ctx.fillStyle = '#ff6688';
  ctx.beginPath(); ctx.ellipse(ufo.x, cfgUfo.y - 6, 14, 8, 0, 0, Math.PI); ctx.fill();
  // Lights
  ctx.fillStyle = '#ffaacc'; ctx.shadowBlur = 4;
  for (let i = -2; i <= 2; i++)
    ctx.fillRect(ufo.x + i * 10 - 2, cfgUfo.y + 4, 4, 4);
  ctx.shadowBlur = 0; ctx.restore();
}

function drawUfoPopup(ctx, popup) {
  if (!popup) return;
  const alpha = Math.min(1, popup.life / 400);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffdd00'; ctx.font = 'bold 16px Orbitron, monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#ffdd00'; ctx.shadowBlur = 8;
  ctx.fillText(`+${popup.pts}`, popup.x, popup.y - (1200 - popup.life) * 0.03);
  ctx.shadowBlur = 0; ctx.restore();
}

function drawParticles(ctx, particles) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(p.x, p.y, 3 * alpha + 1, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  }
}

function renderFrame(ctx, state, cfg, alienTypes) {
  const { width: W, height: H } = cfg.canvas;
  ctx.save();
  if (state.shake > 0) {
    const mag = (state.shake / cfg.shakeDuration) * 4;
    ctx.translate((Math.random() - 0.5) * mag * 2, (Math.random() - 0.5) * mag * 2);
  }
  drawBackground(ctx, W, H);
  drawStars(ctx, state.stars);
  drawShields(ctx, state.shields, cfg);
  drawAliens(ctx, state.aliens, state.alienFrame, alienTypes);
  drawUfo(ctx, state.ufo, cfg.ufo);
  drawUfoPopup(ctx, state.ufoScorePopup);
  drawPlayerBullet(ctx, state.playerBullet);
  drawAlienBullets(ctx, state.alienBullets);
  drawPlayer(ctx, state.playerX, cfg.player.y, state.invincible);
  drawParticles(ctx, state.particles);
  ctx.restore();
}

if (typeof module !== 'undefined') module.exports = { renderFrame, drawAlienShape };
