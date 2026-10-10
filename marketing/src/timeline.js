// Deterministic animation helpers: every frame is a pure function of time `t` (seconds),
// so the renderer can capture frame N exactly, and the page can also preview in real time.
(() => {
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (t, start, dur) => clamp((t - start) / dur);
const ease = {
  out: p => 1 - Math.pow(1 - p, 3),
  inOut: p => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  back: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  expo: p => (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)),
};
const lerp = (a, b, p) => a + (b - a) * p;
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// Enter at `start` over `dur`, optionally leave at `end` over `out`.
function inOut(t, start, dur, end = Infinity, out = .4) {
  const pin = ease.out(prog(t, start, dur));
  const pout = end === Infinity ? 0 : ease.inOut(prog(t, end, out));
  return { pin, pout, v: pin * (1 - pout) };
}
function show(el, t, { start, dur = .6, end = Infinity, out = .4, y = 40, x = 0, scale = 0, blur = 0 }) {
  if (!el) return;
  const { pin, pout, v } = inOut(t, start, dur, end, out);
  const ty = (1 - pin) * y - pout * y * .5;
  const s = 1 - (1 - pin) * scale + pout * scale * .3;
  el.style.opacity = v;
  el.style.transform = `translate(${(1 - pin) * x}px, ${ty}px) scale(${s})`;
  el.style.filter = blur ? `blur(${(1 - pin) * blur + pout * blur}px)` : '';
}
function typeText(el, text, t, start, cps = 14) {
  if (!el) return;
  const n = Math.floor(clamp((t - start) * cps, 0, text.length));
  el.textContent = text.slice(0, n);
}
function countUp(el, to, t, start, dur, fmt = v => Math.round(v).toLocaleString('en-US')) {
  if (!el) return;
  el.textContent = fmt(to * ease.out(prog(t, start, dur)));
}

window.TL = { clamp, prog, ease, lerp, $, $$, inOut, show, typeText, countUp };
})();

// Real-time preview when opened directly in a browser (renderer passes ?render=1).
window.addEventListener('load', () => {
  if (new URLSearchParams(location.search).has('render')) return;
  const t0 = performance.now();
  const loop = () => { const t = ((performance.now() - t0) / 1000) % (window.DURATION || 15); window.renderFrame(t); requestAnimationFrame(loop); };
  document.fonts.ready.then(loop);
});
