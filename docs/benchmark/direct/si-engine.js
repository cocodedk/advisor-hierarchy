// Pure game state logic — no React, no canvas

function initStars(layers, w, h) {
  return layers.map(l => ({ speed: l.speed, stars: Array.from({ length: l.count }, () =>
    ({ x: Math.random()*w, y: Math.random()*h, r: Math.random()*1.2+0.4, brightness: Math.random()*0.5+0.5 })) }));
}

function initShields(cfg) {
  const spacing = cfg.canvas.width / (cfg.shields.count + 1);
  return Array.from({ length: cfg.shields.count }, (_, i) => {
    const cx = spacing * (i + 1), tw = cfg.shields.cols * cfg.shields.blockSize;
    return { x: Math.round(cx - tw/2), y: cfg.shields.y,
             blocks: Array.from({ length: cfg.shields.rows }, () => Array(cfg.shields.cols).fill(0)) };
  });
}

function initAliens(cfg) {
  return Array.from({ length: cfg.alien.rows }, (_, row) =>
    Array.from({ length: cfg.alien.cols }, (_, col) => ({
      row, col, alive: true,
      x: cfg.alien.startX + col * cfg.alien.cellW,
      y: cfg.alien.startY + row * cfg.alien.cellH,
    })));
}

function initState(cfg, level = 1) {
  const sm = Math.pow(cfg.alien.speedLevelMult, level-1), fm = Math.pow(cfg.alien.fireIntervalMult, level-1);
  return {
    phase: 'playing', score: 0, lives: 3, level,
    hiScore: parseInt(localStorage.getItem('si_hiscore')||'0', 10),
    aliens: initAliens(cfg), alienDir: 1, alienFrame: 0, alienFrameTimer: 0,
    alienFireTimer: 0, alienBaseSpeed: cfg.alien.baseSpeed * sm,
    alienFireInterval: Math.max(cfg.alien.minFireInterval, cfg.alien.fireInterval * fm),
    playerX: cfg.player.startX, playerBullet: null, alienBullets: [],
    shields: initShields(cfg), ufo: null, ufoTimer: nextUfoTime(cfg),
    ufoScorePopup: null, particles: [], stars: initStars(cfg.stars, cfg.canvas.width, cfg.canvas.height), shake: 0, invincible: 0, keys: {},
  };
}

function nextUfoTime(cfg) {
  return cfg.ufo.minInterval + Math.random() * (cfg.ufo.maxInterval - cfg.ufo.minInterval);
}

function countAlive(aliens) { return aliens.flat().filter(a => a.alive).length; }

function updateAliens(state, dt, cfg) {
  const alive = countAlive(state.aliens);
  const speed = state.alienBaseSpeed * (1 + (55 - alive) / 55 * 2);
  let minX = Infinity, maxX = -Infinity;
  for (const row of state.aliens) for (const a of row)
    if (a.alive) { minX = Math.min(minX, a.x); maxX = Math.max(maxX, a.x + 30); }

  let drop = 0, newDir = state.alienDir;
  if (maxX + speed * dt * state.alienDir > cfg.canvas.width - 10 && state.alienDir > 0) { drop = cfg.alien.dropAmount; newDir = -1; }
  else if (minX + speed * dt * state.alienDir < 10 && state.alienDir < 0) { drop = cfg.alien.dropAmount; newDir = 1; }

  for (const row of state.aliens) for (const a of row)
    if (a.alive) { a.x += drop ? 0 : speed * dt * state.alienDir; a.y += drop; }
  state.alienDir = newDir;

  state.alienFrameTimer += dt * 1000;
  if (state.alienFrameTimer >= cfg.alien.animInterval) { state.alienFrame ^= 1; state.alienFrameTimer = 0; }

  for (const row of state.aliens) for (const a of row)
    if (a.alive && a.y >= cfg.player.y - 32) return true;
  return false;
}

function updateAlienFire(state, dt, cfg) {
  state.alienFireTimer += dt * 1000;
  if (state.alienFireTimer < state.alienFireInterval || state.alienBullets.length >= cfg.bullet.maxAlien) return;
  state.alienFireTimer = 0;
  const cols = Array.from({ length: cfg.alien.cols }, (_, i) => i).sort(() => Math.random() - 0.5);
  for (const col of cols) {
    let best = null;
    for (const row of state.aliens) if (row[col].alive && (!best || row[col].y > best.y)) best = row[col];
    if (best) { state.alienBullets.push({ x: best.x + 15, y: best.y + 22, zigzag: 0 }); break; }
  }
}

function updateBullets(state, dt, cfg) {
  if (state.playerBullet) {
    state.playerBullet.y -= cfg.bullet.speed * dt;
    if (state.playerBullet.y < 0) state.playerBullet = null;
  }
  for (const b of state.alienBullets) { b.y += cfg.bullet.speed * 0.55 * dt; b.zigzag += dt * 8; }
  state.alienBullets = state.alienBullets.filter(b => b.y < cfg.canvas.height);
}

function updateUfo(state, dt, cfg) {
  state.ufoTimer -= dt * 1000;
  if (state.ufoTimer <= 0 && !state.ufo) {
    const fl = Math.random() < 0.5;
    state.ufo = { x: fl ? -60 : cfg.canvas.width + 60, dir: fl ? 1 : -1, glow: 0 };
    state.ufoTimer = nextUfoTime(cfg);
  }
  if (state.ufo) {
    state.ufo.x += cfg.ufo.speed * state.ufo.dir * dt;
    state.ufo.glow = (Math.sin(Date.now() * 0.01) + 1) / 2;
    if (state.ufo.x < -80 || state.ufo.x > cfg.canvas.width + 80) state.ufo = null;
  }
  if (state.ufoScorePopup) { state.ufoScorePopup.life -= dt * 1000; if (state.ufoScorePopup.life <= 0) state.ufoScorePopup = null; }
}

function updateParticles(state, dt) {
  for (const p of state.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1000; }
  state.particles = state.particles.filter(p => p.life > 0);
}

function spawnParticles(state, x, y, color, cfg) {
  for (let i = 0; i < cfg.particles.count; i++) {
    const angle = Math.PI * 2 * i / cfg.particles.count + Math.random() * 0.5;
    const spd = cfg.particles.speed * (0.5 + Math.random());
    state.particles.push({ x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd, life: cfg.particles.life, maxLife: cfg.particles.life, color });
  }
}

function saveHiScore(state) {
  if (state.score > state.hiScore) { state.hiScore = state.score; localStorage.setItem('si_hiscore', state.score); }
}

function checkCollisions(state, cfg, alienTypes) {
  const pb = state.playerBullet;
  if (pb) {
    let hit = false;
    outer: for (const row of state.aliens) for (const a of row) {
      if (!a.alive) continue;
      if (pb.x > a.x && pb.x < a.x+28 && pb.y > a.y && pb.y < a.y+20) {
        a.alive = false; state.score += cfg.alien.points[a.row];
        spawnParticles(state, a.x+14, a.y+10, alienTypes[a.row].color, cfg);
        hit = true; saveHiScore(state); break outer;
      }
    }
    if (!hit && pb && state.ufo) {
      if (Math.abs(pb.x - state.ufo.x) < 30 && Math.abs(pb.y - cfg.ufo.y) < 14) {
        const pts = cfg.ufo.scores[Math.floor(Math.random() * cfg.ufo.scores.length)];
        state.score += pts; state.ufoScorePopup = { x: state.ufo.x, y: cfg.ufo.y, pts, life: 1200 };
        state.ufo = null; hit = true; saveHiScore(state);
      }
    }
    if (hit) state.playerBullet = null;
  }
  // Bullets vs shields
  const bs = cfg.shields.blockSize;
  for (const shield of state.shields)
    for (let r = 0; r < cfg.shields.rows; r++)
      for (let c = 0; c < cfg.shields.cols; c++) {
        if (shield.blocks[r][c] >= 3) continue;
        const bx = shield.x + c*bs, by = shield.y + r*bs;
        if (state.playerBullet && state.playerBullet.x >= bx && state.playerBullet.x <= bx+bs &&
            state.playerBullet.y >= by && state.playerBullet.y <= by+bs) { shield.blocks[r][c]++; state.playerBullet = null; }
        for (const ab of state.alienBullets)
          if (ab.x >= bx && ab.x <= bx+bs && ab.y >= by && ab.y <= by+bs) { shield.blocks[r][c]++; ab.hit = true; }
      }
  state.alienBullets = state.alienBullets.filter(b => !b.hit);
  // Alien bullets vs player
  if (state.invincible <= 0) {
    for (const b of state.alienBullets)
      if (b.x > state.playerX-18 && b.x < state.playerX+18 && b.y > cfg.player.y-10 && b.y < cfg.player.y+10) {
        state.lives--; state.invincible = cfg.invincibilityDuration; state.shake = cfg.shakeDuration;
        spawnParticles(state, state.playerX, cfg.player.y, '#00ff88', cfg);
        state.alienBullets = state.alienBullets.filter(x => x !== b); saveHiScore(state); break;
      }
  }
}

function updateStars(state, w, h) {
  for (const layer of state.stars)
    for (const s of layer.stars) { s.y += layer.speed; if (s.y > h) { s.y = 0; s.x = Math.random()*w; } }
}

function updateFrame(state, dt, cfg, alienTypes) {
  if (state.phase !== 'playing') return;
  if (state.invincible > 0) state.invincible -= dt * 1000;
  if (state.shake > 0) state.shake -= dt * 1000;
  updateStars(state, cfg.canvas.width, cfg.canvas.height);
  const alienReached = updateAliens(state, dt, cfg);
  updateAlienFire(state, dt, cfg);
  updateBullets(state, dt, cfg);
  updateUfo(state, dt, cfg);
  updateParticles(state, dt);
  checkCollisions(state, cfg, alienTypes);
  if (state.lives <= 0 || alienReached) { state.phase = 'gameover'; return; }
  if (countAlive(state.aliens) === 0) state.phase = 'levelclear';
}

if (typeof module !== 'undefined') module.exports = { initState, updateFrame, spawnParticles, countAlive };
