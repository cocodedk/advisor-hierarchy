const CONFIG = {
  canvas: { width: 800, height: 600 },
  player: { speed: 240, y: 544, startX: 400 },
  bullet: { speed: 480, maxPlayer: 1, maxAlien: 3 },
  alien: {
    cols: 11, rows: 5,
    cellW: 56, cellH: 48,
    startX: 72, startY: 80,
    dropAmount: 24,
    baseSpeed: 28,
    fireInterval: 1200,
    minFireInterval: 600,
    animInterval: 500,
    points: [30, 20, 20, 10, 10],
    speedLevelMult: 1.15,
    fireIntervalMult: 0.9,
  },
  shields: {
    count: 4, y: 460,
    cols: 6, rows: 4, blockSize: 6,
    colors: ['#00ff44', '#009922', '#004411'],
  },
  ufo: {
    speed: 120, y: 80,
    scores: [50, 100, 150, 300],
    minInterval: 15000, maxInterval: 25000,
  },
  stars: [
    { count: 150, speed: 0.8 },
    { count: 80,  speed: 0.4 },
    { count: 40,  speed: 0.2 },
  ],
  particles: { count: 10, speed: 80, life: 400 },
  invincibilityDuration: 1500,
  shakeDuration: 500,
  levelClearDelay: 1500,
};

// Pixel data arrays for alien shapes: [frame0, frame1], each is array of [x,y,w,h] rects in a 16×12 cell
// Type A (top row) — classic Octopus shape
const ALIEN_A = {
  color: '#ff4488',
  frames: [
    [[2,0,2,2],[6,0,2,2],[10,0,2,2],[0,2,12,2],[2,4,10,2],[4,6,2,2],[8,6,2,2],[2,8,3,2],[9,8,3,2]],
    [[2,0,2,2],[6,0,2,2],[10,0,2,2],[0,2,12,2],[2,4,10,2],[4,6,2,2],[8,6,2,2],[0,8,3,2],[11,8,3,2]],
  ],
};
// Type B (rows 2-3) — Crab shape
const ALIEN_B = {
  color: '#44aaff',
  frames: [
    [[4,0,6,2],[2,2,10,2],[0,4,2,2],[4,4,6,2],[10,4,2,2],[2,6,2,2],[10,6,2,2],[0,8,2,4],[12,8,2,4]],
    [[4,0,6,2],[2,2,10,2],[0,4,2,2],[4,4,6,2],[10,4,2,2],[2,6,2,2],[10,6,2,2],[2,8,2,4],[10,8,2,4]],
  ],
};
// Type C (rows 4-5) — Squid shape
const ALIEN_C = {
  color: '#88ffaa',
  frames: [
    [[4,0,6,2],[2,2,2,2],[10,2,2,2],[2,4,10,2],[0,6,14,2],[2,8,4,2],[8,8,4,2],[0,10,2,2],[12,10,2,2]],
    [[4,0,6,2],[2,2,2,2],[10,2,2,2],[2,4,10,2],[0,6,14,2],[4,8,4,2],[6,8,4,2],[2,10,2,2],[10,10,2,2]],
  ],
};

const ALIEN_TYPES = [ALIEN_A, ALIEN_B, ALIEN_B, ALIEN_C, ALIEN_C];

if (typeof module !== 'undefined') module.exports = { CONFIG, ALIEN_TYPES };
