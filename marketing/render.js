#!/usr/bin/env node
/**
 * Renders the marketing sources to final files.
 *   node render.js video  src/video1-day.html videos/out.mp4 18 [--audio sfx.wav]
 *   node render.js slides src/carousel1-loss.html carousels/loss
 * Requires: puppeteer-core, Google Chrome, ffmpeg on PATH.
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FPS = Number(process.env.FPS || 30);

async function open(file, width, height) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--force-color-profile=srgb', '--hide-scrollbars'] });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto('file:///' + path.resolve(file).replace(/\\/g, '/') + '?render=1', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  return { browser, page };
}

async function video(src, out, seconds, audio) {
  const { browser, page } = await open(src, 1080, 1920);
  const total = Math.round(seconds * FPS);
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-'];
  if (audio) args.push('-i', audio);
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
  if (audio) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push(out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let i = 0; i < total; i++) {
    await page.evaluate(t => window.renderFrame(t), i / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`\r${path.basename(out)} ${Math.round((i / total) * 100)}%`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  // Cover frame for posting / previews.
  await page.evaluate(t => window.renderFrame(t), Number(process.env.POSTER_T || seconds - 1.5));
  await page.screenshot({ path: out.replace(/\.mp4$/, '-cover.jpg'), type: 'jpeg', quality: 92 });
  await browser.close();
  console.log(`\r${out} ✓`);
}

async function slides(src, outPrefix) {
  const { browser, page } = await open(src, 1080, 1350);
  const count = await page.evaluate(() => document.querySelectorAll('.slide').length);
  fs.mkdirSync(path.dirname(outPrefix), { recursive: true });
  // Show one slide at a time and capture the full viewport (clipped captures render blank in headless Chrome).
  for (let i = 0; i < count; i++) {
    await page.evaluate(n => document.querySelectorAll('.slide').forEach((s, k) => { s.style.display = k === n ? '' : 'none'; }), i);
    await page.screenshot({ path: `${outPrefix}-${String(i + 1).padStart(2, '0')}.png` });
  }
  await browser.close();
  console.log(`${outPrefix}-*.png ✓ (${count} slides)`);
}

const [mode, src, out, secs, flag, audio] = process.argv.slice(2);
(mode === 'video' ? video(src, out, Number(secs), flag === '--audio' ? audio : null) : slides(src, out))
  .catch(e => { console.error(e); process.exit(1); });
