// Clockwork Kitchen: the kitchen itself — orders, plate, pot, pan, hand,
// the shift timer and the score. Pure logic, no drawing, no DOM.
import {
  SHIFT_SECONDS, TARGET_COINS, ORDER_MAX, ORDER_SPAWN_SECONDS,
  ORDER_PATIENCE, EXPIRE_PENALTY, WRONG_SERVE_PENALTY, BOIL_SECONDS,
  FRY_SECONDS, BURN_GRACE_SECONDS,
} from './config.js';
import { DISHES, DISH_ORDER, INGREDIENTS, makeItem, matchDish } from './recipes.js';

let orderId = 0;

export function createKitchen(random) {
  return {
    random,
    screen: 'title',
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    orders: [],
    spawnIn: 2,
    plate: [],
    hand: null,
    pot: { item: null, progress: 0, done: false, burnIn: 0 },
    pan: { item: null, progress: 0, done: false, burnIn: 0 },
    hatch: null,
    particles: [],
    floats: [],
    message: '',
    messageIn: 0,
    shake: 0,
    won: false,
    tick: 0,
  };
}

export function resetKitchen(k) {
  const fresh = createKitchen(k.random);
  for (const key of Object.keys(fresh)) k[key] = fresh[key];
  k.screen = 'play';
  spawnOrder(k);
  spawnOrder(k);
}

function pickDish(k) {
  // Weight the cheap dishes early, the Special later, so pressure grows.
  const minute = 1 - k.timeLeft / SHIFT_SECONDS;
  const pool = minute < 0.5
    ? ['pasta', 'salad', 'bunstack', 'pasta', 'salad']
    : ['pasta', 'salad', 'bunstack', 'special', 'special', 'pasta'];
  return DISHES[pool[Math.floor(k.random() * pool.length)]];
}

export function spawnOrder(k, dishId) {
  if (k.orders.length >= ORDER_MAX) return null;
  const dish = dishId ? DISHES[dishId] : pickDish(k);
  const order = {
    id: orderId += 1,
    dish,
    patience: ORDER_PATIENCE,
    maxPatience: ORDER_PATIENCE,
  };
  k.orders.push(order);
  return order;
}

function burst(k, x, y, color, n) {
  for (let i = 0; i < n; i += 1) {
    k.particles.push({
      x, y,
      vx: (k.random() - 0.5) * 160,
      vy: -40 - k.random() * 120,
      life: 0.7 + k.random() * 0.5,
      age: 0,
      color,
      r: 2 + k.random() * 4,
    });
  }
}

function floatText(k, x, y, text, color) {
  k.floats.push({ x, y, text, color, age: 0, life: 1.2 });
}

function say(k, message, seconds) {
  k.message = message;
  k.messageIn = seconds;
}

// --- Player actions -------------------------------------------------------

export function pickBin(k, kind) {
  if (k.screen !== 'play' || k.hand) return 'busy';
  k.hand = makeItem(kind);
  return 'pick';
}

export function clickPot(k) {
  if (k.screen !== 'play') return 'none';
  const pot = k.pot;
  if (pot.item && pot.done) {
    k.hand = pot.item;
    k.pot = { item: null, progress: 0, done: false, burnIn: 0 };
    return 'take';
  }
  if (!pot.item && k.hand && k.hand.kind === 'noodle' && !k.hand.cooked) {
    pot.item = k.hand;
    pot.progress = 0;
    pot.done = false;
    pot.burnIn = BURN_GRACE_SECONDS;
    k.hand = null;
    return 'boil';
  }
  return 'none';
}

export function clickPan(k) {
  if (k.screen !== 'play') return 'none';
  const pan = k.pan;
  if (pan.item && pan.done) {
    k.hand = pan.item;
    k.pan = { item: null, progress: 0, done: false, burnIn: 0 };
    return 'take';
  }
  if (!pan.item && k.hand && k.hand.kind === 'egg' && !k.hand.cooked) {
    pan.item = k.hand;
    pan.progress = 0;
    pan.done = false;
    pan.burnIn = BURN_GRACE_SECONDS;
    k.hand = null;
    return 'fry';
  }
  return 'none';
}

export function clickPlate(k) {
  if (k.screen !== 'play') return 'none';
  if (k.hand) {
    if (!k.hand.cooked) {
      say(k, 'Cook it first — noodle in the pot, egg in the pan!', 2);
      return 'raw';
    }
    if (k.plate.some((item) => item.kind === k.hand.kind)) {
      say(k, 'Already on the plate.', 1.5);
      return 'dup';
    }
    k.plate.push(k.hand);
    k.hand = null;
    return 'place';
  }
  return 'none';
}

export function takeOffPlate(k, index) {
  if (k.screen !== 'play' || k.hand || index < 0 || index >= k.plate.length) return 'none';
  k.hand = k.plate.splice(index, 1)[0];
  return 'take';
}

export function trashHand(k) {
  if (!k.hand) return 'none';
  k.hand = null;
  return 'trash';
}

export function servePlate(k) {
  if (k.screen !== 'play') return 'none';
  const dish = matchDish(k.plate);
  if (!dish) {
    k.coins = Math.max(0, k.coins - WRONG_SERVE_PENALTY);
    k.combo = 0;
    k.shake = 0.35;
    say(k, 'That plate matches no order — check the tickets!', 2);
    return 'wrong';
  }
  const orderIndex = k.orders.findIndex((o) => o.dish.id === dish.id);
  if (orderIndex < 0) {
    k.coins = Math.max(0, k.coins - WRONG_SERVE_PENALTY);
    k.combo = 0;
    k.shake = 0.35;
    say(k, `Nobody ordered ${dish.name} right now.`, 2);
    return 'wrong';
  }
  const order = k.orders[orderIndex];
  const patienceBonus = Math.round((order.patience / order.maxPatience) * 10);
  const comboBonus = Math.min(k.combo, 4) * 2;
  const earned = dish.price + patienceBonus + comboBonus;
  k.orders.splice(orderIndex, 1);
  k.coins += earned;
  k.served += 1;
  k.combo += 1;
  k.bestCombo = Math.max(k.bestCombo, k.combo);
  k.hatch = { dish, age: 0 };
  burst(k, 640, 400, '#ffd76a', 22);
  floatText(k, 640, 330, `+${earned} coins`, '#4ade80');
  if (k.combo >= 3) floatText(k, 640, 360, `COMBO x${k.combo}`, '#f5b942');
  k.plate = [];
  return 'serve';
}

// --- Simulation -----------------------------------------------------------

function cookStation(k, station, seconds, dt) {
  if (!station.item || station.done) return;
  station.progress += dt;
  if (station.progress >= seconds) {
    station.done = true;
    station.item.cooked = true;
    // The burn loop in this same step subtracts dt at once, so credit it
    // back: the grace period starts whole from the moment it is done.
    station.burnIn = BURN_GRACE_SECONDS + dt;
  }
}

export function stepKitchen(k, dt) {
  if (k.screen !== 'play') return;
  k.tick += dt;
  k.timeLeft -= dt;
  if (k.messageIn > 0) k.messageIn -= dt;
  if (k.shake > 0) k.shake -= dt;

  k.spawnIn -= dt;
  if (k.spawnIn <= 0) {
    spawnOrder(k);
    k.spawnIn = ORDER_SPAWN_SECONDS;
  }
  for (let i = k.orders.length - 1; i >= 0; i -= 1) {
    const order = k.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      k.orders.splice(i, 1);
      k.coins = Math.max(0, k.coins - EXPIRE_PENALTY);
      k.combo = 0;
      say(k, `${order.dish.name} walked out — -${EXPIRE_PENALTY} coins.`, 2.5);
    }
  }
  cookStation(k, k.pot, BOIL_SECONDS, dt);
  cookStation(k, k.pan, FRY_SECONDS, dt);
  for (const station of [k.pot, k.pan]) {
    if (station.item && station.done) {
      station.burnIn -= dt;
      if (station.burnIn <= 0) {
        station.item = null;
        station.done = false;
        station.progress = 0;
        say(k, 'Burnt! Watch the ring — take it off in time.', 2.5);
      }
    }
  }
  if (k.hatch) {
    k.hatch.age += dt;
    if (k.hatch.age > 6) k.hatch = null;
  }
  for (let i = k.particles.length - 1; i >= 0; i -= 1) {
    const p = k.particles[i];
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
    if (p.age >= p.life) k.particles.splice(i, 1);
  }
  for (let i = k.floats.length - 1; i >= 0; i -= 1) {
    const f = k.floats[i];
    f.age += dt;
    f.y -= 34 * dt;
    if (f.age >= f.life) k.floats.splice(i, 1);
  }
  if (k.timeLeft <= 0) {
    k.timeLeft = 0;
    k.screen = 'over';
    k.won = k.coins >= TARGET_COINS;
  }
}

export function dishForPlate(k) {
  return matchDish(k.plate);
}

export function plateProgress(k) {
  // The closest order the plate could still become, and how many of its
  // ingredients are already placed — drives the "dish mid-assembly" read.
  let best = null;
  for (const order of k.orders) {
    const dish = order.dish;
    const kinds = k.plate.map((item) => item.kind);
    if (kinds.every((kind) => dish.needs.includes(kind))
      && new Set(kinds).size === kinds.length) {
      if (!best || kinds.length > best.placed) best = { dish, placed: kinds.length };
    }
  }
  return best;
}
