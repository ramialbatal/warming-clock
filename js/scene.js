// @ts-check
/**
 * Warming Clock: the picture behind the top of the page. A blazing sun in a washed-out, overheated sky, dry hills,
 * a bare tree, cracked ground, heat shimmering over the land and wildfire smoke on the horizon. Drawn with a 2D
 * canvas; clock-core's startScene runs it (see app.js).
 */
import { seeded } from "clock-core";

/** @typedef {[number, number, number]} RGB */
/** @param {RGB} c @param {number} [a] */
const rgba = (c, a = 1) => `rgba(${c.join(",")},${a})`;

const SKY = /** @type {RGB[]} */ ([[38, 14, 8], [140, 52, 20], [244, 160, 70]]);
const HILLS = /** @type {RGB[]} */ ([[120, 62, 32], [86, 44, 24], [52, 27, 15]]);

/** A soft round sprite for smoke and glows. */
function softDot() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext("2d"));
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(90,70,62,1)"); r.addColorStop(0.55, "rgba(90,70,62,.4)"); r.addColorStop(1, "rgba(90,70,62,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return c;
}

/**
 * Build the warming scene.
 * @returns {import("clock-core").Scene}
 */
export function warmingScene() {
  const dot = softDot();
  /** @type {Float32Array[]} */ let hills = [];
  const STEP = 4;
  /** @type {HTMLCanvasElement | null} */ let ground = null;
  /** @type {{ x: number, y: number }[]} */ let fires = [];
  /** @type {{ x: number, y: number, vy: number, r: number, age: number, life: number }[]} */ let smoke = [];
  /** @type {{ x: number, base: number, h: number }} */ let tree = { x: 0, base: 0, h: 0 };
  /** @param {number} i @param {number} x */
  const hillY = (i, x) => hills[i][Math.max(0, Math.min(hills[i].length - 1, Math.round(x / STEP)))];

  /** Move the smoke on by dt seconds. @param {number} dt */
  function stepSmoke(dt) {
    for (const f of fires) if (Math.random() < 4 * dt) smoke.push({ x: f.x + (Math.random() - 0.5) * 10, y: f.y, vy: -(12 + Math.random() * 10), r: 8, age: 0, life: 8 + Math.random() * 4 });
    for (const p of smoke) { p.age += dt; p.y += p.vy * dt; p.x += 9 * dt; p.r += 6 * dt; }
    smoke = smoke.filter((p) => p.age < p.life);
  }

  return {
    layout(f) {
      const { w, h, ground: G } = f;
      const rnd = seeded(13);
      const n = Math.ceil(w / STEP) + 2;
      hills = [0.24, 0.13, 0.05].map((top) => {
        const a = new Float32Array(n), p1 = rnd() * 6, p2 = rnd() * 6, f1 = 0.004 + rnd() * 0.003, f2 = 0.012 + rnd() * 0.006;
        for (let k = 0; k < n; k++) {
          const x = k * STEP, wave = (Math.sin(x * f1 + p1) * 0.65 + Math.sin(x * f2 + p2) * 0.35 + 1) / 2;
          a[k] = G - G * top * (0.4 + 0.6 * wave);
        }
        return a;
      });
      // Wildfires on the far hills, away from the middle where the text is
      fires = [0.12, 0.88].map((p) => ({ x: w * p, y: hillY(0, w * p) + 2 }));
      tree = { x: w * (w < 600 ? 0.2 : 0.27), base: hillY(2, w * 0.27) + 2, h: Math.min(G * 0.32, 110) };
      // Cracked, sun-baked ground below the horizon, drawn once per size
      ground = document.createElement("canvas");
      const dpr = f.ctx.getTransform().a || 1, depth = Math.max(1, h - G);
      ground.width = Math.ceil(w * dpr); ground.height = Math.ceil(depth * dpr);
      const g = /** @type {CanvasRenderingContext2D} */ (ground.getContext("2d"));
      g.scale(dpr, dpr);
      const grd = g.createLinearGradient(0, 0, 0, depth);
      grd.addColorStop(0, "rgb(122,70,36)"); grd.addColorStop(0.3, "rgb(70,38,20)"); grd.addColorStop(1, "rgb(16,9,6)");
      g.fillStyle = grd; g.fillRect(0, 0, w, depth);
      g.lineCap = "round";
      for (let i = 0; i < Math.round(w / 8); i++) {
        let x = rnd() * w, y = Math.pow(rnd(), 1.3) * depth * 0.85 + 2, a = rnd() * Math.PI * 2;
        const near = () => 0.3 + y / depth;
        g.beginPath(); g.moveTo(x, y);
        for (let k = 0; k < 6; k++) { a += (rnd() - 0.5) * 1.4; x += Math.cos(a) * 13 * near(); y += Math.sin(a) * 4 * near(); g.lineTo(x, y); }
        g.strokeStyle = "rgba(20,10,5,.85)"; g.lineWidth = 1.5 * near(); g.stroke();
      }
      smoke = [];
      for (let i = 0; i < 90; i++) stepSmoke(0.1);
    },

    draw(f) {
      const { ctx, w, h, ground: G, t, dt } = f;

      // An overheated sky: dark at the top for the title, burning towards the horizon
      const sky = ctx.createLinearGradient(0, 0, 0, G);
      sky.addColorStop(0, rgba(SKY[0])); sky.addColorStop(0.55, rgba(SKY[1])); sky.addColorStop(1, rgba(SKY[2]));
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, G + 1);

      // A huge, blazing sun, low and to the side, pulsing with heat
      const sx = w * (w < 600 ? 0.8 : 0.74), sy = G * 0.68, sr = Math.min(w, G) * 0.11 * (1 + 0.03 * Math.sin(t * 1.2));
      for (const [k, a] of /** @type {const} */ ([[4.5, 0.18], [2.6, 0.3], [1.6, 0.5]])) {
        const g = ctx.createRadialGradient(sx, sy, sr * 0.6, sx, sy, sr * k);
        g.addColorStop(0, `rgba(255,214,120,${a})`); g.addColorStop(1, "rgba(255,150,60,0)");
        ctx.fillStyle = g; ctx.fillRect(sx - sr * k, sy - sr * k, sr * k * 2, sr * k * 2);
      }
      ctx.fillStyle = "rgb(255,236,190)"; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();

      // Wildfire smoke drifting over the far hills
      if (dt) stepSmoke(dt);
      for (const p of smoke) {
        const life = p.age / p.life;
        ctx.globalAlpha = Math.min(1, life * 8) * (1 - life) * 0.55;
        ctx.drawImage(dot, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      ctx.globalAlpha = 1;

      // Dry hills, far to near, with the glow of fires on the far ones
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = rgba(HILLS[i]);
        ctx.beginPath(); ctx.moveTo(0, G + 1);
        for (let k = 0; k < hills[i].length; k++) ctx.lineTo(k * STEP, hills[i][k]);
        ctx.lineTo(w, G + 1); ctx.fill();
        if (i === 0) for (const fi of fires) {
          const g = ctx.createRadialGradient(fi.x, fi.y, 0, fi.x, fi.y, 26);
          g.addColorStop(0, `rgba(255,120,40,${0.55 + 0.2 * Math.sin(t * 8 + fi.x)})`); g.addColorStop(1, "rgba(255,90,30,0)");
          ctx.fillStyle = g; ctx.fillRect(fi.x - 26, fi.y - 26, 52, 52);
        }
      }

      // A bare, dead tree
      const { x: tx, base, h: th } = tree;
      ctx.strokeStyle = "rgb(30,16,10)"; ctx.lineCap = "round";
      /** @param {number} x @param {number} y @param {number} a @param {number} len @param {number} wdt */
      const branch = (x, y, a, len, wdt) => {
        const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
        ctx.lineWidth = wdt; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
        if (len > th * 0.12) { branch(x2, y2, a - 0.45, len * 0.68, wdt * 0.65); branch(x2, y2, a + 0.38, len * 0.62, wdt * 0.65); }
      };
      branch(tx, base, -Math.PI / 2, th * 0.45, Math.max(3, th * 0.06));

      // Heat shimmer: faint wavy lines rising off the land
      ctx.strokeStyle = "rgba(255,230,190,.10)"; ctx.lineWidth = 1.2;
      for (let i = 0; i < 7; i++) {
        const y = G - 8 - i * 7 - ((t * 9) % 7);
        ctx.beginPath();
        for (let x = 0; x <= w; x += 12) ctx.lineTo(x, y + Math.sin(x * 0.05 + t * 2 + i) * 1.6);
        ctx.stroke();
      }

      if (ground) ctx.drawImage(ground, 0, G, w, h - G);
    },
  };
}
