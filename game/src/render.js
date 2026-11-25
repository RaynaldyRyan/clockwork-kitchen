// Clockwork Kitchen: every pixel on screen. One canvas, flat colours, big
// shapes — the game must read at a glance when shrunk to a thumbnail.
import {
  W, H, COLORS, STATION, PLATE, POT, PAN, TIMER_TEXT, HATCH, BELL, TRASH,
  SCORE_PANEL, BINS, TICKETS, TARGET_COINS, SHIFT_SECONDS, BURN_GRACE_SECONDS,
} from './config.js';
import { DISHES, INGREDIENTS } from './recipes.js';
import { dishForPlate, plateProgress } from './kitchen.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Draw one ingredient at (x, y) with radius r. Cooked noodle/egg look done. */
export function drawIngredient(ctx, kind, x, y, r, cooked) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'noodle') {
    ctx.fillStyle = '#f7f3e3';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = cooked ? '#f2c14e' : '#e8c96a';
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(0, i * r * 0.32, r * 0.55, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
    if (cooked) {
      ctx.fillStyle = '#e8452c';
      ctx.beginPath(); ctx.arc(r * 0.4, -r * 0.35, r * 0.18, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'tomato') {
    ctx.fillStyle = '#e8452c';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f9e4d';
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      ctx.moveTo(0, -r * 0.3);
      ctx.lineTo(Math.cos(a) * r * 0.55, -r * 0.3 + Math.sin(a) * r * 0.55);
      ctx.lineTo(Math.cos(a + 0.5) * r * 0.3, -r * 0.3 + Math.sin(a + 0.5) * r * 0.3);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.35, r * 0.22, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'lettuce') {
    ctx.fillStyle = '#2f8f46';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#58b368';
    for (let i = 0; i < 6; i += 1) {
      const a = (i * Math.PI * 2) / 6;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#7ed491';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'cheese') {
    ctx.fillStyle = '#ffc93c';
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6); ctx.lineTo(r, r * 0.6); ctx.lineTo(0, -r * 0.85);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8a91c';
    ctx.beginPath(); ctx.arc(-r * 0.25, r * 0.2, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.3, r * 0.35, r * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.12, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'egg') {
    ctx.fillStyle = cooked ? '#fff8e6' : '#fdf6e3';
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.78, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = cooked ? '#ffb703' : '#ffd34d';
    ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(r * 0.1 - r * 0.12, -r * 0.12, r * 0.12, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'bun') {
    ctx.fillStyle = '#d99a4e';
    ctx.beginPath(); ctx.arc(0, r * 0.25, r, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b97a33';
    ctx.fillRect(-r, r * 0.25, r * 2, r * 0.28);
    ctx.fillStyle = '#fff3d6';
    for (const [sx, sy] of [[-0.45, -0.35], [0, -0.55], [0.45, -0.35], [-0.2, -0.1], [0.25, -0.12]]) {
      ctx.beginPath(); ctx.ellipse(sx * r, sy * r, r * 0.09, r * 0.06, 0.4, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawStationRing(ctx, k) {
  const frac = Math.max(0, k.timeLeft / SHIFT_SECONDS);
  const urgent = frac < 0.2;
  ctx.save();
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#313c5e';
  ctx.beginPath(); ctx.arc(STATION.x, STATION.y, STATION.ring, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = urgent ? '#f87171' : COLORS.gold;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(STATION.x, STATION.y, STATION.ring, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  text(ctx, fmtTime(k.timeLeft), TIMER_TEXT.x, TIMER_TEXT.y, 40, urgent ? '#f87171' : COLORS.cream, 'center', 800);
  text(ctx, 'SHIFT', TIMER_TEXT.x, TIMER_TEXT.y + 30, 13, '#8b96b8', 'center', 700);
}

function drawTicket(ctx, order, box) {
  const dish = order.dish;
  const frac = Math.max(0, order.patience / order.maxPatience);
  const urgent = frac < 0.3;
  rr(ctx, box.x, box.y, box.w, box.h, 10);
  ctx.fillStyle = urgent ? '#5b2a2a' : '#f5efe0';
  ctx.fill();
  ctx.strokeStyle = urgent ? '#f87171' : '#d8cdb2';
  ctx.lineWidth = 2;
  ctx.stroke();
  const ink = urgent ? '#ffd9d9' : '#2b2118';
  text(ctx, dish.name.toUpperCase(), box.x + 12, box.y + 20, 15, ink, 'left', 800);
  // Component dots: tiny ingredient icons for the recipe.
  dish.needs.forEach((kind, i) => {
    drawIngredient(ctx, kind, box.x + 26 + i * 34, box.y + 52, 13, true);
  });
  text(ctx, `$${dish.price}`, box.x + box.w - 12, box.y + 20, 16, urgent ? '#ffd9d9' : '#8a6d1f', 'right', 800);
  // Patience bar.
  ctx.fillStyle = urgent ? '#3a1d1d' : '#e2d9c2';
  rr(ctx, box.x + 12, box.y + box.h - 16, box.w - 24, 8, 4);
  ctx.fill();
  ctx.fillStyle = urgent ? '#f87171' : '#58b368';
  if (frac > 0) {
    rr(ctx, box.x + 12, box.y + box.h - 16, (box.w - 24) * frac, 8, 4);
    ctx.fill();
  }
}

function drawCookStation(ctx, station, cx, cy, r, kind, label, seconds) {
  // Pot (dark steel) or pan (flat) with a progress ring while cooking.
  ctx.save();
  if (kind === 'pot') {
    ctx.fillStyle = '#3a4358';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#20263a';
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a6b8a';
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#2c2f38';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#454a58';
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2); ctx.fill();
  }
  if (station.item) {
    drawIngredient(ctx, station.item.kind, cx, cy, r * 0.42, station.item.cooked);
    if (!station.done) {
      const frac = Math.min(1, station.progress / seconds);
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, r + 8, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    } else {
      // Done: first half of the burn grace still reads as READY (green full
      // ring). Second half is a draining red arc + "PULL!" so the food never
      // vanishes without warning — burnIn drains from BURN_GRACE_SECONDS to 0.
      const burnFrac = Math.max(0, station.burnIn / BURN_GRACE_SECONDS);
      if (burnFrac <= 0.5) {
        ctx.strokeStyle = COLORS.bad;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy, r + 8, -Math.PI / 2, -Math.PI / 2 + burnFrac * Math.PI * 2);
        ctx.stroke();
        text(ctx, 'PULL!', cx, cy + r + 22, 12, COLORS.bad, 'center', 800);
      } else {
        ctx.strokeStyle = COLORS.good;
        ctx.lineWidth = 7;
        ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, Math.PI * 2); ctx.stroke();
        text(ctx, 'READY', cx, cy + r + 22, 12, COLORS.good, 'center', 800);
      }
    }
  } else {
    text(ctx, label, cx, cy, 13, '#8b96b8', 'center', 700);
  }
  ctx.restore();
}

function drawPlate(ctx, k) {
  const ready = dishForPlate(k);
  const progress = plateProgress(k);
  ctx.save();
  if (ready) {
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 26;
  }
  ctx.fillStyle = '#f5efe0';
  ctx.beginPath(); ctx.arc(PLATE.x, PLATE.y, PLATE.r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#d8cdb2';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(PLATE.x, PLATE.y, PLATE.r - 8, 0, Math.PI * 2); ctx.stroke();
  const items = k.plate;
  const spread = Math.min(150, items.length * 46);
  const startX = PLATE.x - spread / 2 + 23;
  items.forEach((item, i) => {
    drawIngredient(ctx, item.kind, startX + i * 46, PLATE.y, 20, item.cooked);
  });
  if (ready) {
    text(ctx, `${ready.name} — READY!`, PLATE.x, PLATE.y - PLATE.r - 16, 16, COLORS.good, 'center', 800);
  } else if (progress && items.length > 0) {
    text(ctx, `${progress.dish.name} ${progress.placed}/${progress.dish.needs.length}`, PLATE.x, PLATE.y - PLATE.r - 16, 15, COLORS.cream, 'center', 700);
  } else if (items.length === 0) {
    text(ctx, 'PLATE', PLATE.x, PLATE.y, 14, '#9a8f74', 'center', 700);
  }
  ctx.restore();
}

function drawBins(ctx, k) {
  for (const bin of BINS) {
    const held = k.hand && k.hand.kind === bin.kind;
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 12);
    ctx.fillStyle = held ? '#4a3b1e' : COLORS.rail;
    ctx.fill();
    ctx.strokeStyle = held ? COLORS.gold : '#3a4568';
    ctx.lineWidth = held ? 3 : 2;
    ctx.stroke();
    drawIngredient(ctx, bin.kind, bin.x + bin.w / 2, bin.y + 36, 24, true);
    text(ctx, INGREDIENTS[bin.kind].name.toUpperCase(), bin.x + bin.w / 2, bin.y + 74, 13, COLORS.cream, 'center', 700);
    text(ctx, bin.key, bin.x + 12, bin.y + 14, 11, '#8b96b8', 'center', 700);
    if (INGREDIENTS[bin.kind].cooksIn) {
      text(ctx, INGREDIENTS[bin.kind].cooksIn === 'pot' ? 'BOIL' : 'FRY', bin.x + bin.w - 14, bin.y + 14, 10, COLORS.gold, 'right', 800);
    }
  }
}

function drawHatch(ctx, k) {
  rr(ctx, HATCH.x, HATCH.y, HATCH.w, HATCH.h, 14);
  ctx.fillStyle = '#232c44';
  ctx.fill();
  ctx.strokeStyle = '#3a4568';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Heat lamp glow.
  const glow = ctx.createRadialGradient(HATCH.x + HATCH.w / 2, HATCH.y + 30, 4, HATCH.x + HATCH.w / 2, HATCH.y + 30, 90);
  glow.addColorStop(0, 'rgba(255,150,60,0.55)');
  glow.addColorStop(1, 'rgba(255,150,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(HATCH.x, HATCH.y, HATCH.w, 130);
  text(ctx, 'SERVICE', HATCH.x + HATCH.w / 2, HATCH.y + 22, 13, '#ffb37a', 'center', 800);
  if (k.hatch) {
    const dish = k.hatch.dish;
    ctx.strokeStyle = COLORS.good;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(HATCH.x + HATCH.w / 2, HATCH.y + 118, 58, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#f5efe0';
    ctx.beginPath(); ctx.arc(HATCH.x + HATCH.w / 2, HATCH.y + 118, 52, 0, Math.PI * 2); ctx.fill();
    dish.needs.forEach((kind, i) => {
      const n = dish.needs.length;
      const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.7;
      drawIngredient(ctx, kind, HATCH.x + HATCH.w / 2 + Math.cos(a) * 24, HATCH.y + 118 + Math.sin(a) * 24, 15, true);
    });
    text(ctx, 'READY', HATCH.x + HATCH.w / 2, HATCH.y + 198, 14, COLORS.good, 'center', 800);
    text(ctx, dish.name, HATCH.x + HATCH.w / 2, HATCH.y + 218, 13, COLORS.cream, 'center', 700);
  } else {
    text(ctx, 'Serve a dish', HATCH.x + HATCH.w / 2, HATCH.y + 118, 14, '#8b96b8', 'center', 700);
    text(ctx, 'to light the lamp', HATCH.x + HATCH.w / 2, HATCH.y + 140, 14, '#8b96b8', 'center', 700);
  }
  // Serve bell.
  const canServe = !!dishForPlate(k);
  ctx.fillStyle = canServe ? COLORS.gold : '#3a4358';
  ctx.beginPath(); ctx.arc(BELL.x, BELL.y, BELL.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = canServe ? '#ffe1a1' : '#4a5468';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#2b2118';
  ctx.beginPath(); ctx.arc(BELL.x, BELL.y - 6, 16, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillRect(BELL.x - 20, BELL.y + 8, 40, 6);
  text(ctx, canServe ? 'SERVE!' : 'SERVE', BELL.x, BELL.y + 30, 13, canServe ? COLORS.gold : '#8b96b8', 'center', 800);
}

function drawScorePanel(ctx, k) {
  rr(ctx, SCORE_PANEL.x, SCORE_PANEL.y, SCORE_PANEL.w, SCORE_PANEL.h, 12);
  ctx.fillStyle = '#232c44';
  ctx.fill();
  ctx.strokeStyle = '#3a4568';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'COINS', SCORE_PANEL.x + 16, SCORE_PANEL.y + 24, 13, '#8b96b8', 'left', 800);
  text(ctx, `${k.coins}`, SCORE_PANEL.x + 16, SCORE_PANEL.y + 58, 34, COLORS.gold, 'left', 800);
  text(ctx, `TARGET ${TARGET_COINS}`, SCORE_PANEL.x + 16, SCORE_PANEL.y + 92, 13, COLORS.cream, 'left', 700);
  text(ctx, `SERVED ${k.served}`, SCORE_PANEL.x + 16, SCORE_PANEL.y + 122, 13, COLORS.cream, 'left', 700);
  text(ctx, `COMBO x${k.combo}`, SCORE_PANEL.x + 16, SCORE_PANEL.y + 152, 13, k.combo >= 3 ? COLORS.gold : COLORS.cream, 'left', 700);
  // Trash bin.
  ctx.fillStyle = '#2c354f';
  ctx.beginPath(); ctx.arc(TRASH.x, TRASH.y, TRASH.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4a5468';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'TRASH', TRASH.x, TRASH.y - 2, 12, '#8b96b8', 'center', 800);
  text(ctx, 'T / Esc', TRASH.x, TRASH.y + 16, 11, '#6b7694', 'center', 700);
}

function drawSteam(ctx, k, now) {
  ctx.save();
  ctx.fillStyle = COLORS.steam;
  const sources = [];
  if (k.pot.item) sources.push([POT.x, POT.y - 40]);
  if (k.pan.item) sources.push([PAN.x, PAN.y - 40]);
  if (k.hatch) sources.push([HATCH.x + HATCH.w / 2, HATCH.y + 60]);
  for (const [sx, sy] of sources) {
    for (let i = 0; i < 3; i += 1) {
      const phase = ((now / 900 + i / 3) % 1);
      const y = sy - phase * 46;
      const x = sx + Math.sin(phase * 9 + i * 2) * 8;
      ctx.globalAlpha = 0.5 * (1 - phase);
      ctx.beginPath(); ctx.arc(x, y, 4 + phase * 7, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawOverlay(ctx, k, screen) {
  ctx.fillStyle = 'rgba(10,13,24,0.72)';
  ctx.fillRect(0, 0, W, H);
  if (screen === 'title') {
    text(ctx, 'CLOCKWORK KITCHEN', W / 2, 170, 56, COLORS.gold, 'center', 800);
    text(ctx, 'The whole kitchen is a clock — race every order around it.', W / 2, 224, 20, COLORS.cream, 'center', 600);
    text(ctx, '1  Pick ingredients from the rail   •   Boil noodles, fry eggs', W / 2, 300, 18, '#c9d2e8', 'center', 600);
    text(ctx, '2  Build the dish on the plate   •   Ring the bell to serve', W / 2, 332, 18, '#c9d2e8', 'center', 600);
    text(ctx, '3  Earn 120 coins before the shift timer runs out', W / 2, 364, 18, '#c9d2e8', 'center', 600);
    text(ctx, 'Click or press SPACE to start  •  Keys 1-6 grab ingredients', W / 2, 440, 18, COLORS.gold, 'center', 700);
  } else {
    const won = k.won;
    text(ctx, won ? 'SHIFT COMPLETE!' : "TIME'S UP", W / 2, 200, 52, won ? COLORS.good : '#f87171', 'center', 800);
    text(ctx, won ? 'The kitchen ran like clockwork.' : `You needed ${TARGET_COINS} coins — you made ${k.coins}.`, W / 2, 258, 20, COLORS.cream, 'center', 600);
    text(ctx, `Coins ${k.coins}    •    Dishes served ${k.served}    •    Best combo x${k.bestCombo}`, W / 2, 330, 20, '#c9d2e8', 'center', 600);
    text(ctx, 'Press R or click to cook again', W / 2, 420, 18, COLORS.gold, 'center', 700);
  }
}

export function draw(ctx, k, screen, mouse, now) {
  ctx.save();
  if (k.shake > 0) {
    ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
  }
  // Background: cool slate with a warm glow over the station.
  const bg = ctx.createRadialGradient(640, 400, 60, 640, 400, 720);
  bg.addColorStop(0, '#2b3247');
  bg.addColorStop(1, COLORS.bgDeep);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // Counter ring under the station.
  ctx.fillStyle = '#20263a';
  ctx.beginPath(); ctx.arc(STATION.x, STATION.y, STATION.r + 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a4568';
  ctx.lineWidth = 3;
  ctx.stroke();

  text(ctx, 'CLOCKWORK KITCHEN', 24, 34, 22, COLORS.gold, 'left', 800);
  drawStationRing(ctx, k);
  k.orders.forEach((order, i) => {
    if (i < TICKETS.length) drawTicket(ctx, order, TICKETS[i]);
  });
  drawCookStation(ctx, k.pot, POT.x, POT.y, POT.r, 'pot', 'POT', 5);
  drawCookStation(ctx, k.pan, PAN.x, PAN.y, PAN.r, 'pan', 'PAN', 4);
  drawPlate(ctx, k);
  drawBins(ctx, k);
  drawHatch(ctx, k);
  drawScorePanel(ctx, k);
  drawSteam(ctx, k, now);

  // Particles and floating scores.
  for (const p of k.particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of k.floats) {
    ctx.globalAlpha = Math.max(0, 1 - f.age / f.life);
    text(ctx, f.text, f.x, f.y, 22, f.color, 'center', 800);
  }
  ctx.globalAlpha = 1;

  // Held ingredient follows the mouse.
  if (k.hand && mouse) {
    ctx.globalAlpha = 0.95;
    drawIngredient(ctx, k.hand.kind, mouse.x, mouse.y - 18, 22, k.hand.cooked);
    ctx.globalAlpha = 1;
    if (!k.hand.cooked) {
      text(ctx, INGREDIENTS[k.hand.kind].cooksIn === 'pot' ? 'to the POT' : 'to the PAN', mouse.x, mouse.y + 18, 12, COLORS.gold, 'center', 800);
    }
  }
  // Message banner.
  if (k.messageIn > 0) {
    ctx.font = '700 15px system-ui, sans-serif';
    const w = ctx.measureText(k.message).width + 44;
    ctx.fillStyle = 'rgba(16,20,31,0.85)';
    rr(ctx, W / 2 - w / 2, 116, w, 34, 17);
    ctx.fill();
    text(ctx, k.message, W / 2, 134, 15, COLORS.cream, 'center', 700);
  }
  ctx.restore();

  if (screen === 'title' || screen === 'over') drawOverlay(ctx, k, screen);
}
