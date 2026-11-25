// Clockwork Kitchen: boot and the one loop. Input is read every frame, the
// kitchen advances in fixed 1/60 s steps, and the renderer paints what is
// there. Screens: title, play, over.
//
// ?shot=cover|prep|serve|win (with &seed=N) stages that scene instead of
// running the loop, paints it twice and sets window.__shotReady.
import { W, H } from './config.js';
import { createKitchen, resetKitchen, stepKitchen } from './kitchen.js';
import { handleClick, handleKey } from './input.js';
import { draw } from './render.js';
import { ensureAudio, playSound } from './audio.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 7;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = `${Math.floor(W * scale)}px`;
  canvas.style.height = `${Math.floor(H * scale)}px`;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

let s = (seed ^ 0x9e3779b9) >>> 0;
const random = () => {
  s = (s * 1664525 + 1013904223) >>> 0;
  return s / 4294967296;
};
const kitchen = createKitchen(random);

function runShot(name) {
  const scene = stageShot(name, seed);
  let painted = 0;
  function paint() {
    draw(ctx, scene.kitchen, scene.screen, null, performance.now());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const mouse = { x: 640, y: 360 };
  let screen = 'title';
  let lastTickSecond = -1;

  function announce(message) {
    status.textContent = message;
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H,
    };
  }

  function startGame() {
    resetKitchen(kitchen);
    screen = 'play';
    announce('Playing. Serve 120 coins before the shift timer runs out.');
  }

  function endGame() {
    screen = 'over';
    announce(kitchen.won
      ? `Shift complete! ${kitchen.coins} coins, ${kitchen.served} dishes served.`
      : `Time's up. ${kitchen.coins} coins — the target was 120.`);
  }

  canvas.addEventListener('mousemove', (event) => {
    const p = canvasPoint(event);
    mouse.x = p.x;
    mouse.y = p.y;
  });

  canvas.addEventListener('click', (event) => {
    ensureAudio();
    if (screen === 'title' || screen === 'over') {
      startGame();
      return;
    }
    const p = canvasPoint(event);
    playSound(handleClick(kitchen, p.x, p.y));
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    ensureAudio();
    if (event.code === 'KeyR' && (screen === 'over' || screen === 'play')) {
      startGame();
      return;
    }
    if (event.code === 'Space' || event.code.startsWith('Digit') || event.code === 'KeyT' || event.code === 'Escape') {
      event.preventDefault();
    }
    if (screen === 'title' || screen === 'over') {
      if (event.code === 'Space' || event.code === 'Enter') startGame();
      return;
    }
    if (screen === 'play') playSound(handleKey(kitchen, event.code));
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === 'play') {
      // The timer keeps running, but the tab is hidden — nothing to pause
      // against: the shift is short and the player chose to leave.
    }
  });

  let accumulator = 0;
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    if (screen === 'play') {
      while (accumulator >= STEP) {
        stepKitchen(kitchen, STEP);
        accumulator -= STEP;
        if (kitchen.screen === 'over') {
          endGame();
          break;
        }
      }
      const sec = Math.ceil(kitchen.timeLeft);
      if (sec <= 10 && sec !== lastTickSecond && sec > 0) {
        lastTickSecond = sec;
        playSound('tick');
      }
    } else {
      accumulator = 0;
    }
    draw(ctx, kitchen, screen, mouse, now);
  }

  announce('Clockwork Kitchen. Click or press Space to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
