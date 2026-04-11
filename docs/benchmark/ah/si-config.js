const CONFIG = {
  CANVAS: {
    W: 800,
    H: 600
  },

  ALIENS: {
    ROWS: 5,
    COLS: 11,
    ROW_TYPE: [0, 1, 1, 2, 2],
    TYPES: [
      { name: 'A', points: 30, color: '#ff88ff', glow: '#ff44ff' },
      { name: 'B', points: 20, color: '#88ffff', glow: '#44ffff' },
      { name: 'C', points: 10, color: '#88ff88', glow: '#44ff44' }
    ],
    W: 32,
    H: 24,
    X_GAP: 16,
    Y_GAP: 12,
    START_X: 56,
    START_Y: 72,
    BASE_SPEED: 0.8,
    DROP: 24,
    FRAME_MS: 500
  },

  PLAYER: {
    SPEED: 240,
    Y_OFFSET: 56,
    W: 32,
    H: 20,
    COLOR: '#00ff88',
    GLOW: '#00ff88',
    INVINCIBLE_MS: 1500,
    BLINK_MS: 150,
    LIVES: 3
  },

  BULLETS: {
    PL_SPEED: 480,
    PL_W: 3,
    PL_H: 14,
    PL_COLOR: '#00ff88',
    PL_GLOW: '#00ff88',
    AL_SPEED: 200,
    AL_W: 4,
    AL_H: 16,
    AL_COLOR: '#ff4444',
    AL_MAX: 3,
    FIRE_MS: 1200,
    FIRE_MS_MIN: 600
  },

  SHIELDS: {
    COUNT: 4,
    Y_OFFSET: 140,
    COLS: 6,
    ROWS: 4,
    BLOCK: 6,
    COLORS: ['#00ff44', '#00bb33', '#006622']
  },

  UFO: {
    SPEED: 120,
    Y: 72,
    W: 44,
    H: 20,
    COLOR: '#ff2244',
    GLOW: '#ff0022',
    SCORES: [50, 100, 150, 300],
    MIN_MS: 15000,
    MAX_MS: 25000
  },

  STARS: [
    { count: 150, speed: 0.8, size: 1.5, alpha: 0.9 },
    { count: 80, speed: 0.4, size: 1.0, alpha: 0.6 },
    { count: 40, speed: 0.2, size: 0.6, alpha: 0.35 }
  ],

  PARTICLES: {
    COUNT: 10,
    SPEED: 2.8,
    LIFE_MS: 420
  },

  SHAKE: {
    MS: 500,
    AMP: 4
  },

  POPUP_MS: 800,
  HI_KEY: 'si_hiscore'
};
