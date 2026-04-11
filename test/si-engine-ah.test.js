import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createContext, Script } from 'node:vm';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DOCS = join(import.meta.dirname, '..', 'docs', 'benchmark', 'ah');

function makeCtx() {
  const ctx = createContext({
    Math, Date, console, parseInt, parseFloat, isNaN, isFinite,
    Array, Object, Set, Map, JSON, performance: { now: () => 0 }
  });
  new Script(readFileSync(join(DOCS, 'si-config.js'), 'utf8')).runInContext(ctx);
  new Script(readFileSync(join(DOCS, 'si-engine.js'), 'utf8')).runInContext(ctx);
  return ctx;
}

describe('Space Invaders engine', () => {
  test('initState returns 55 alive aliens (5×11 grid)', () => {
    const ctx = makeCtx();
    const state = ctx.initState(0);
    assert.equal(state.aliens.length, 55);
    assert.ok(state.aliens.every(a => a.alive === true));
  });

  test('initState returns 96 shield blocks (4 bunkers × 6cols × 4rows, flat array)', () => {
    const ctx = makeCtx();
    const state = ctx.initState(0);
    // 4 bunkers × 6 cols × 4 rows = 96
    assert.equal(state.shields.length, 96);
    assert.ok(state.shields.every(bl => bl.state === 0));
  });

  test('initState returns correct initial values', () => {
    const ctx = makeCtx();
    const state = ctx.initState(0);
    assert.equal(state.phase, 'start');
    assert.equal(state.score, 0);
    assert.equal(state.lives, 3);
    assert.equal(state.level, 1);
    assert.equal(state.playerBullet, null);
    assert.equal(state.alienBullets.length, 0);
  });

  test('applyCollisions: player bullet kills alien and awards points', () => {
    const ctx = makeCtx();
    const state = ctx.initState(0);
    state.phase = 'play';
    // First alien is row 0 = typeIdx 0 = type A = 30 points
    const alien = state.aliens[0];
    assert.equal(alien.typeIdx, 0); // row 0 → ROW_TYPE[0] = 0 → type A = 30pts
    state.playerBullet = { x: alien.x, y: alien.y };
    ctx.applyCollisions(state, 0);
    assert.equal(alien.alive, false);
    assert.equal(state.score, 30);
    assert.equal(state.playerBullet, null);
  });

  test('applyCollisions: player bullet erodes shield block state', () => {
    const ctx = makeCtx();
    const state = ctx.initState(0);
    state.phase = 'play';
    const block = state.shields[0];
    assert.equal(block.state, 0);
    // Place bullet at top-left corner of block (inside the 6×6 area)
    state.playerBullet = { x: block.bx, y: block.by };
    ctx.applyCollisions(state, 0);
    assert.equal(block.state, 1);
    assert.equal(state.playerBullet, null);
  });

  test('applyCollisions: alien bullet hitting player reduces lives', () => {
    const ctx = makeCtx();
    const state = ctx.initState(0);
    state.phase = 'play';
    const px = state.player.x, py = state.player.y;
    // Bullet exactly at player center (within P.W/2=16 and P.H/2=10)
    state.alienBullets.push({ x: px, y: py, phase: 0 });
    state.player.invincibleUntil = 0; // not invincible
    ctx.applyCollisions(state, 1); // now=1 > invincibleUntil=0
    assert.equal(state.lives, 2);
    assert.equal(state.alienBullets.length, 0);
  });

  test('updateFrame: all aliens dead → phase becomes levelclear', () => {
    const ctx = makeCtx();
    const state = ctx.initState(0);
    state.phase = 'play';
    for (const al of state.aliens) al.alive = false;
    ctx.updateFrame(state, 0.016, { left: false, right: false, fire: false }, 0);
    assert.equal(state.phase, 'levelclear');
  });

  test('updateFrame: player moves right when right input given', () => {
    const ctx = makeCtx();
    const state = ctx.initState(0);
    state.phase = 'play';
    const origX = state.player.x;
    ctx.updateFrame(state, 0.1, { left: false, right: true, fire: false }, 0);
    assert.ok(state.player.x > origX, `expected x > ${origX}, got ${state.player.x}`);
  });

  test('updateFrame: no-op when phase is not play', () => {
    const ctx = makeCtx();
    const state = ctx.initState(0);
    // phase is 'start' — updateFrame should be a no-op
    const origX = state.player.x;
    ctx.updateFrame(state, 0.1, { left: false, right: true, fire: false }, 0);
    assert.equal(state.player.x, origX);
    assert.equal(state.phase, 'start');
  });
});
