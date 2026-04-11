import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join } from 'node:path';

// Mock localStorage before requiring modules that use it
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; },
};

const _require = createRequire(import.meta.url);
const { CONFIG, ALIEN_TYPES } = _require(join(import.meta.dirname, '..', 'docs', 'benchmark', 'direct', 'si-config.js'));
const { initState, updateFrame, countAlive } = _require(join(import.meta.dirname, '..', 'docs', 'benchmark', 'direct', 'si-engine.js'));

describe('Space Invaders direct engine', () => {
  test('initState creates 55 alive aliens (5×11 grid)', () => {
    const state = initState(CONFIG);
    assert.equal(countAlive(state.aliens), 55);
  });

  test('initState creates 4 shields (bunkers)', () => {
    const state = initState(CONFIG);
    assert.equal(state.shields.length, 4);
  });

  test('initState returns correct initial values (phase:playing, score:0, lives:3, level:1)', () => {
    const state = initState(CONFIG);
    assert.equal(state.phase, 'playing');
    assert.equal(state.score, 0);
    assert.equal(state.lives, 3);
    assert.equal(state.level, 1);
    assert.equal(state.playerBullet, null);
    assert.equal(state.alienBullets.length, 0);
  });

  test('countAlive returns correct count after killing some aliens', () => {
    const state = initState(CONFIG);
    state.aliens[0][0].alive = false;
    assert.equal(countAlive(state.aliens), 54);
  });

  test('updateFrame: player bullet kills alien and awards points', () => {
    const state = initState(CONFIG);
    const a = state.aliens[0][0]; // row 0 → 30 points
    state.playerBullet = { x: a.x + 14, y: a.y + 10 };
    updateFrame(state, 0.0001, CONFIG, ALIEN_TYPES);
    assert.equal(a.alive, false);
    assert.equal(state.score, 30);
    assert.equal(state.playerBullet, null);
  });

  test('updateFrame: alien bullet hitting player reduces lives', () => {
    const state = initState(CONFIG);
    state.alienBullets.push({ x: state.playerX, y: CONFIG.player.y, zigzag: 0 });
    updateFrame(state, 0.0001, CONFIG, ALIEN_TYPES);
    assert.equal(state.lives, 2);
  });

  test('updateFrame: all aliens dead → phase becomes levelclear', () => {
    const state = initState(CONFIG);
    for (const row of state.aliens) for (const a of row) a.alive = false;
    updateFrame(state, 0.016, CONFIG, ALIEN_TYPES);
    assert.equal(state.phase, 'levelclear');
  });

  test('level 2 state has higher base speed than level 1', () => {
    const s1 = initState(CONFIG, 1);
    const s2 = initState(CONFIG, 2);
    assert.ok(s2.alienBaseSpeed > s1.alienBaseSpeed,
      `expected level 2 speed ${s2.alienBaseSpeed} > level 1 speed ${s1.alienBaseSpeed}`);
  });
});
