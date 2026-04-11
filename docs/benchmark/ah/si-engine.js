// si-engine.js — pure game logic, plain globals, no canvas/React

function _rnd(a, b) { return Math.random() * (b - a) + a; }
function _clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function _lerp(a, b, t) { return a + (b - a) * t; }

function spawnParticles(state, x, y, color) {
  for (let i = 0; i < CONFIG.PARTICLES.COUNT; i++) {
    const ang = Math.random() * Math.PI * 2, spd = Math.random() * CONFIG.PARTICLES.SPEED + 0.5;
    state.particles.push({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      life: CONFIG.PARTICLES.LIFE_MS, maxLife: CONFIG.PARTICLES.LIFE_MS, color });
  }
}

function initState(now) {
  const { W, H } = CONFIG.CANVAS, A = CONFIG.ALIENS, S = CONFIG.SHIELDS;
  const aliens = [];
  for (let r = 0; r < A.ROWS; r++)
    for (let c = 0; c < A.COLS; c++)
      aliens.push({ x: A.START_X + c * (A.W + A.X_GAP), y: A.START_Y + 40 + r * (A.H + A.Y_GAP),
        typeIdx: A.ROW_TYPE[r], alive: true, row: r, col: c });

  const shields = [], bw = S.COLS * S.BLOCK, sp = (W - S.COUNT * bw) / (S.COUNT + 1);
  for (let b = 0; b < S.COUNT; b++) {
    const x0 = sp + b * (bw + sp), y0 = H - S.Y_OFFSET;
    for (let r = 0; r < S.ROWS; r++)
      for (let c = 0; c < S.COLS; c++)
        shields.push({ bx: x0 + c * S.BLOCK, by: y0 + r * S.BLOCK, state: 0 });
  }

  const stars = CONFIG.STARS.map(l => Array.from({ length: l.count }, () =>
    ({ x: Math.random() * W, y: Math.random() * H })));

  return {
    phase: 'start', score: 0, level: 1, lives: CONFIG.PLAYER.LIVES,
    aliens, alienDir: 1, alienFrame: 0, alienFrameTimer: 0,
    alienFireTimer: CONFIG.BULLETS.FIRE_MS,
    player: { x: W / 2, y: H - CONFIG.PLAYER.Y_OFFSET, invincibleUntil: 0 },
    playerBullet: null, fireHeld: false, alienBullets: [], shields, ufo: null,
    ufoNextMs: (now || 0) + _rnd(CONFIG.UFO.MIN_MS, CONFIG.UFO.MAX_MS),
    particles: [], scorePopups: [], shakeUntil: 0, shakeDx: 0, shakeDy: 0, stars
  };
}

function updateFrame(state, dt, input, now) {
  if (state.phase !== 'play') return;
  dt = Math.min(dt, 0.05);
  const { W, H } = CONFIG.CANVAS, P = CONFIG.PLAYER, B = CONFIG.BULLETS, A = CONFIG.ALIENS;

  // Player move & fire
  if (input.left)  state.player.x = _clamp(state.player.x - P.SPEED * dt, P.W / 2, W - P.W / 2);
  if (input.right) state.player.x = _clamp(state.player.x + P.SPEED * dt, P.W / 2, W - P.W / 2);
  if (input.fire && !state.fireHeld && !state.playerBullet)
    state.playerBullet = { x: state.player.x, y: state.player.y - P.H / 2 };
  state.fireHeld = input.fire;

  // Player bullet
  if (state.playerBullet) {
    state.playerBullet.y -= B.PL_SPEED * dt;
    if (state.playerBullet.y < 0) state.playerBullet = null;
  }

  // Alien frame animation
  state.alienFrameTimer += dt * 1000;
  if (state.alienFrameTimer >= A.FRAME_MS) { state.alienFrame ^= 1; state.alienFrameTimer = 0; }

  // Alien grid movement
  const alive = state.aliens.filter(a => a.alive);
  if (!alive.length) { state.phase = 'levelclear'; return; }
  const speed = A.BASE_SPEED * (1 + (55 - alive.length) / 55 * 2);
  let hitEdge = false;
  for (const al of alive) {
    al.x += state.alienDir * speed;
    if (al.x < A.W / 2 + 4 || al.x > W - A.W / 2 - 4) hitEdge = true;
  }
  if (hitEdge) {
    state.alienDir *= -1;
    for (const al of alive) { al.y += A.DROP; if (al.y >= state.player.y - 32) { state.phase = 'over'; return; } }
  }

  // Alien fire
  state.alienFireTimer -= dt * 1000;
  if (state.alienFireTimer <= 0 && state.alienBullets.length < B.AL_MAX) {
    state.alienFireTimer = _lerp(B.FIRE_MS, B.FIRE_MS_MIN, _clamp((state.level - 1) / 4, 0, 1));
    const cols = [...new Set(alive.map(a => a.col))];
    const col = cols[Math.floor(Math.random() * cols.length)];
    const shooter = alive.filter(a => a.col === col).sort((a, b) => b.y - a.y)[0];
    if (shooter) state.alienBullets.push({ x: shooter.x, y: shooter.y + A.H / 2, phase: 0 });
  }

  // Alien bullets
  for (let i = state.alienBullets.length - 1; i >= 0; i--) {
    const ab = state.alienBullets[i];
    ab.y += B.AL_SPEED * dt; ab.phase += 8 * dt;
    if (ab.y > H) state.alienBullets.splice(i, 1);
  }

  // Stars scroll
  CONFIG.STARS.forEach((l, i) => state.stars[i].forEach(s => {
    s.y += l.speed; if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
  }));

  // Shake & score popups
  const amp = CONFIG.SHAKE.AMP;
  if (now < state.shakeUntil) { state.shakeDx = (Math.random() - 0.5) * 2 * amp; state.shakeDy = (Math.random() - 0.5) * 2 * amp; }
  else { state.shakeDx = 0; state.shakeDy = 0; }
  for (let i = state.scorePopups.length - 1; i >= 0; i--) {
    const sp = state.scorePopups[i]; sp.life -= dt * 1000; sp.y -= 30 * dt;
    if (sp.life <= 0) state.scorePopups.splice(i, 1);
  }

  tickUFO(state, now);
  tickParticles(state, dt);
}

function applyCollisions(state, now) {
  if (state.phase !== 'play') return;
  const A = CONFIG.ALIENS, P = CONFIG.PLAYER, S = CONFIG.SHIELDS, U = CONFIG.UFO;

  // Player bullet vs aliens
  if (state.playerBullet) {
    const { x: bx, y: by } = state.playerBullet;
    for (const al of state.aliens) {
      if (!al.alive || Math.abs(bx - al.x) >= A.W / 2 || Math.abs(by - al.y) >= A.H / 2) continue;
      al.alive = false;
      const t = A.TYPES[al.typeIdx];
      state.score += t.points;
      spawnParticles(state, al.x, al.y, t.color);
      state.scorePopups.push({ x: al.x, y: al.y, text: '+' + t.points, life: CONFIG.POPUP_MS, maxLife: CONFIG.POPUP_MS });
      state.playerBullet = null;
      break;
    }
  }

  // Player bullet vs shields
  if (state.playerBullet) {
    const { x: bx, y: by } = state.playerBullet;
    for (const bl of state.shields) {
      if (bl.state >= 3 || bx < bl.bx || bx >= bl.bx + S.BLOCK || by < bl.by || by >= bl.by + S.BLOCK) continue;
      bl.state++; state.playerBullet = null; break;
    }
  }

  // Alien bullets vs player
  if (state.player.invincibleUntil <= now) {
    for (let i = state.alienBullets.length - 1; i >= 0; i--) {
      const ab = state.alienBullets[i];
      if (Math.abs(ab.x - state.player.x) >= P.W / 2 || Math.abs(ab.y - state.player.y) >= P.H / 2) continue;
      state.lives--;
      if (state.lives <= 0) state.phase = 'over'; else state.player.invincibleUntil = now + P.INVINCIBLE_MS;
      state.shakeUntil = now + CONFIG.SHAKE.MS;
      spawnParticles(state, state.player.x, state.player.y, '#ffffff');
      state.alienBullets.splice(i, 1);
      break;
    }
  }

  // Alien bullets vs shields
  for (let i = state.alienBullets.length - 1; i >= 0; i--) {
    const ab = state.alienBullets[i];
    for (const bl of state.shields) {
      if (bl.state >= 3 || ab.x < bl.bx || ab.x >= bl.bx + S.BLOCK || ab.y < bl.by || ab.y >= bl.by + S.BLOCK) continue;
      bl.state++; state.alienBullets.splice(i, 1); break;
    }
  }

  // UFO vs player bullet
  if (state.ufo && state.playerBullet) {
    const u = state.ufo;
    if (Math.abs(state.playerBullet.x - u.x) < U.W / 2 && Math.abs(state.playerBullet.y - u.y) < U.H / 2) {
      state.score += u.scoreVal;
      state.scorePopups.push({ x: u.x, y: u.y, text: '+' + u.scoreVal, life: CONFIG.POPUP_MS, maxLife: CONFIG.POPUP_MS });
      state.ufo = null; state.playerBullet = null;
      state.ufoNextMs = now + _rnd(U.MIN_MS, U.MAX_MS);
    }
  }
}

function tickUFO(state, now) {
  const U = CONFIG.UFO, W = CONFIG.CANVAS.W;
  if (!state.ufo && now >= state.ufoNextMs) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    state.ufo = { x: dir === 1 ? -U.W / 2 : W + U.W / 2, y: U.Y, dir,
      scoreVal: U.SCORES[Math.floor(Math.random() * U.SCORES.length)] };
  }
  if (state.ufo) {
    state.ufo.x += state.ufo.dir * U.SPEED * (1 / 60);
    if (state.ufo.x < -U.W || state.ufo.x > W + U.W) {
      state.ufo = null; state.ufoNextMs = now + _rnd(U.MIN_MS, U.MAX_MS);
    }
  }
}

function tickParticles(state, dt) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life -= dt * 1000;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
}
