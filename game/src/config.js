// Clockwork Kitchen: layout, timings and palette in one place.
export const W = 1280;
export const H = 720;

export const SHIFT_SECONDS = 120;
export const TARGET_COINS = 120;
export const ORDER_MAX = 3;
export const ORDER_SPAWN_SECONDS = 10;
export const ORDER_PATIENCE = 42;
export const EXPIRE_PENALTY = 10;
export const WRONG_SERVE_PENALTY = 5;
export const BOIL_SECONDS = 5;
export const FRY_SECONDS = 4;
export const BURN_GRACE_SECONDS = 5;

// The station is a clock face: plate in the middle, pot and pan on its ring,
// the shift timer as the dial around it.
export const STATION = { x: 640, y: 400, r: 210, ring: 238 };
export const PLATE = { x: 640, y: 400, r: 82 };
export const POT = { x: 462, y: 400, r: 60 };
export const PAN = { x: 818, y: 400, r: 60 };
export const TIMER_TEXT = { x: 640, y: 196 };
export const HATCH = { x: 1080, y: 180, w: 180, h: 240 };
export const BELL = { x: 1170, y: 492, r: 46 };
export const TRASH = { x: 96, y: 640, r: 42 };
export const SCORE_PANEL = { x: 24, y: 120, w: 168, h: 190 };

// Six ingredient bins along the bottom rail.
export const BINS = [
  { kind: 'noodle', key: '1', x: 210, y: 596, w: 122, h: 96 },
  { kind: 'tomato', key: '2', x: 344, y: 596, w: 122, h: 96 },
  { kind: 'lettuce', key: '3', x: 478, y: 596, w: 122, h: 96 },
  { kind: 'cheese', key: '4', x: 612, y: 596, w: 122, h: 96 },
  { kind: 'egg', key: '5', x: 746, y: 596, w: 122, h: 96 },
  { kind: 'bun', key: '6', x: 880, y: 596, w: 122, h: 96 },
];

// Order tickets ride the top arc, three clipped tickets.
export const TICKETS = [
  { x: 372, y: 12, w: 196, h: 92 },
  { x: 586, y: 12, w: 196, h: 92 },
  { x: 800, y: 12, w: 196, h: 92 },
];

export const COLORS = {
  bg: '#1b2233',
  bgDeep: '#12172a',
  slate: '#2a3350',
  rail: '#232c44',
  gold: '#f5b942',
  cream: '#fff3d6',
  ink: '#10141f',
  tomato: '#e8452c',
  lettuce: '#58b368',
  cheese: '#ffc93c',
  noodle: '#f2c14e',
  eggYolk: '#ffb703',
  bun: '#d99a4e',
  accent: '#ff7a3d',
  good: '#4ade80',
  bad: '#f87171',
  steam: 'rgba(255,255,255,0.55)',
};
