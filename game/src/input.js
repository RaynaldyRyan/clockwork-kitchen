// Clockwork Kitchen: mouse and keyboard. Clicks land on bins, the pot, the
// pan, the plate, the bell or the trash; keys 1-6 grab bins, Space serves.
import { BINS, PLATE, POT, PAN, BELL, TRASH } from './config.js';
import {
  pickBin, clickPot, clickPan, clickPlate, takeOffPlate, servePlate, trashHand,
} from './kitchen.js';

function inside(x, y, box) {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

function insideCircle(x, y, c) {
  const dx = x - c.x;
  const dy = y - c.y;
  return dx * dx + dy * dy <= c.r * c.r;
}

/** Which game zone a canvas point (in CSS pixels) falls in, or null. */
export function zoneAt(x, y, plateItems) {
  for (const bin of BINS) if (inside(x, y, bin)) return { type: 'bin', kind: bin.kind };
  if (insideCircle(x, y, POT)) return { type: 'pot' };
  if (insideCircle(x, y, PAN)) return { type: 'pan' };
  if (insideCircle(x, y, BELL)) return { type: 'bell' };
  if (insideCircle(x, y, TRASH)) return { type: 'trash' };
  if (insideCircle(x, y, PLATE)) {
    // Clicking near a placed item lifts it back off the plate.
    if (plateItems.length > 0) {
      const spread = Math.min(150, plateItems.length * 46);
      const startX = PLATE.x - spread / 2 + 23;
      for (let i = 0; i < plateItems.length; i += 1) {
        const ix = startX + i * 46;
        if (Math.hypot(x - ix, y - PLATE.y) < 24) return { type: 'plateItem', index: i };
      }
    }
    return { type: 'plate' };
  }
  return null;
}

/** Run one click's action on the kitchen; returns the action's sound key. */
export function handleClick(k, x, y) {
  const zone = zoneAt(x, y, k.plate);
  if (!zone) return 'none';
  if (zone.type === 'bin') return pickBin(k, zone.kind);
  if (zone.type === 'pot') return clickPot(k);
  if (zone.type === 'pan') return clickPan(k);
  if (zone.type === 'plate') return clickPlate(k);
  if (zone.type === 'plateItem') return takeOffPlate(k, zone.index);
  if (zone.type === 'bell') return servePlate(k);
  if (zone.type === 'trash') return trashHand(k);
  return 'none';
}

/** Keyboard: returns an action key for the main loop to sound. */
export function handleKey(k, code) {
  if (code === 'Space') return servePlate(k);
  if (code === 'KeyT' || code === 'Escape') return trashHand(k);
  const bin = BINS.find((b) => b.key === code.replace('Digit', ''));
  if (bin) return pickBin(k, bin.kind);
  return 'none';
}
