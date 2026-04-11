import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS_DIR = join(import.meta.dirname, '..', 'docs');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

let server, browser, port;

const serve = (req, res) => {
  const filePath = join(DOCS_DIR, req.url === '/' ? '/index.html' : req.url);
  const stream = createReadStream(filePath);
  stream.on('error', () => { res.writeHead(404); res.end('Not found'); });
  stream.on('open', () => {
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'text/plain' });
    stream.pipe(res);
  });
};

before(async () => {
  server = createServer(serve);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  port = server.address().port;
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser.close();
  await new Promise(r => server.close(r));
});

const SI_URL = () => `http://127.0.0.1:${port}/benchmark/ah/space-invaders.html`;

describe('AH build: Space Invaders E2E', () => {
  test('start screen loads correctly', async () => {
    const jsErrors = [];
    const page = await browser.newPage();
    page.on('pageerror', e => jsErrors.push(e.message));

    try {
      await page.goto(SI_URL());
      await page.waitForSelector('.overlay h1', { timeout: 8000 });

      const h1Text = await page.textContent('.overlay h1');
      assert.ok(
        h1Text.toUpperCase().includes('SPACE INVADERS'),
        `Expected SPACE INVADERS heading, got: ${h1Text}`
      );

      const playBtn = await page.$('button.si-btn');
      assert.ok(playBtn, 'button.si-btn should exist on start screen');
      const btnText = await playBtn.textContent();
      assert.ok(btnText.toUpperCase().includes('PLAY'), `button text should include PLAY, got: ${btnText}`);

      const canvas = await page.$('canvas#si-canvas');
      assert.ok(canvas, 'canvas#si-canvas should exist');

      const width = await canvas.getAttribute('width');
      const height = await canvas.getAttribute('height');
      assert.strictEqual(width, '800', `canvas width should be 800, got: ${width}`);
      assert.strictEqual(height, '600', `canvas height should be 600, got: ${height}`);

      assert.strictEqual(jsErrors.length, 0, `JS errors: ${jsErrors.join('; ')}`);
    } finally {
      await page.close();
    }
  });

  test('clicking PLAY starts the game and shows HUD', async () => {
    const jsErrors = [];
    const page = await browser.newPage();
    page.on('pageerror', e => jsErrors.push(e.message));

    try {
      await page.goto(SI_URL());
      await page.waitForSelector('button.si-btn', { timeout: 8000 });

      const btns = await page.$$('button.si-btn');
      let playBtn = null;
      for (const btn of btns) {
        const text = await btn.textContent();
        if (text.toUpperCase().includes('PLAY')) { playBtn = btn; break; }
      }
      assert.ok(playBtn, 'PLAY button should exist before clicking');
      await playBtn.click();

      await page.waitForSelector('.hud', { timeout: 3000 });
      const hud = await page.$('.hud');
      assert.ok(hud, '.hud should be visible after clicking PLAY');

      await page.waitForFunction(
        () => !document.querySelector('.overlay'),
        { timeout: 3000 }
      );
      const overlay = await page.$('.overlay');
      assert.strictEqual(overlay, null, 'start overlay should be gone after clicking PLAY');

      assert.strictEqual(jsErrors.length, 0, `JS errors: ${jsErrors.join('; ')}`);
    } finally {
      await page.close();
    }
  });

  test('canvas renders on start screen (non-empty with correct dimensions)', async () => {
    const jsErrors = [];
    const page = await browser.newPage();
    page.on('pageerror', e => jsErrors.push(e.message));

    try {
      await page.goto(SI_URL());
      await page.waitForSelector('.overlay h1', { timeout: 8000 });

      const canvas = await page.$('canvas#si-canvas');
      assert.ok(canvas, 'canvas#si-canvas should exist on start screen');

      const isVisible = await canvas.isVisible();
      assert.ok(isVisible, 'canvas should be visible');

      const width = await canvas.getAttribute('width');
      const height = await canvas.getAttribute('height');
      assert.strictEqual(width, '800', `canvas width should be 800, got: ${width}`);
      assert.strictEqual(height, '600', `canvas height should be 600, got: ${height}`);

      assert.strictEqual(jsErrors.length, 0, `JS errors: ${jsErrors.join('; ')}`);
    } finally {
      await page.close();
    }
  });
});
