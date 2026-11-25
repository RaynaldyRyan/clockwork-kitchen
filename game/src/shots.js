// Clockwork Kitchen: screenshot scenes behind ?shot=cover|prep|serve|win.
// Each scene is staged through the real kitchen — real orders, a real plate,
// the real timer — so the frame is what the game genuinely looks like.
import { createKitchen, resetKitchen, spawnOrder, pickBin, clickPot, clickPan, clickPlate, servePlate, stepKitchen } from './kitchen.js';
import { SHIFT_SECONDS } from './config.js';

function freshKitchen(seed) {
  let s = seed >>> 0;
  const random = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const k = createKitchen(random);
  resetKitchen(k);
  return k;
}

/** Build the cover: 3 tickets, Special mid-assembly (3 of 4), 0:12 on the dial. */
function stageCover(k) {
  k.orders = [];
  spawnOrder(k, 'special');
  spawnOrder(k, 'pasta');
  spawnOrder(k, 'salad');
  // Boil a noodle, fry nothing: plate gets noodle + lettuce + tomato.
  pickBin(k, 'noodle');
  clickPot(k);
  stepKitchen(k, 5.2);
  clickPot(k);
  clickPlate(k);
  pickBin(k, 'lettuce');
  clickPlate(k);
  pickBin(k, 'tomato');
  clickPlate(k);
  pickBin(k, 'cheese');
  // Cheese in hand, ready to finish the Special. A served dish glows at the hatch.
  k.hatch = { dish: { id: 'pasta', name: 'Clock Pasta', needs: ['noodle', 'tomato', 'cheese'], price: 25 }, age: 1 };
  k.coins = 75;
  k.served = 3;
  k.combo = 2;
  // Set the dial last: stepping the kitchen above runs the shift timer down.
  k.timeLeft = 12;
  stepKitchen(k, 0);
}

/** Prep: noodle boiling, egg frying, tomato in hand, one ticket waiting. */
function stagePrep(k) {
  k.orders = [];
  spawnOrder(k, 'salad');
  pickBin(k, 'noodle');
  clickPot(k);
  pickBin(k, 'egg');
  clickPan(k);
  stepKitchen(k, 2.5);
  pickBin(k, 'tomato');
  k.coins = 20;
  k.served = 1;
  k.timeLeft = 88;
}

/** Serve: a finished Garden Plate on the plate, bell lit, ticket matched. */
function stageServe(k) {
  k.orders = [];
  spawnOrder(k, 'salad');
  spawnOrder(k, 'pasta');
  pickBin(k, 'lettuce');
  clickPlate(k);
  pickBin(k, 'tomato');
  clickPlate(k);
  pickBin(k, 'egg');
  clickPan(k);
  stepKitchen(k, 4.2);
  clickPan(k);
  clickPlate(k);
  k.coins = 45;
  k.served = 2;
  k.combo = 2;
  k.timeLeft = 54;
}

/** Win: the shift ended with the target beaten. */
function stageWin(k) {
  k.orders = [];
  spawnOrder(k, 'special');
  k.timeLeft = 0;
  k.coins = 148;
  k.served = 6;
  k.combo = 3;
  k.bestCombo = 4;
  k.screen = 'over';
  k.won = true;
  k.hatch = { dish: { id: 'special', name: "Chef's Special", needs: ['noodle', 'lettuce', 'tomato', 'cheese'], price: 40 }, age: 1 };
}

/**
 * Stage the named scene and return the screen to draw.
 * Unknown names stage the cover.
 */
export function stageShot(name, seed) {
  const k = freshKitchen(seed || 7);
  if (name === 'prep') stagePrep(k);
  else if (name === 'serve') stageServe(k);
  else if (name === 'win') stageWin(k);
  else stageCover(k);
  return { kitchen: k, screen: k.screen };
}
