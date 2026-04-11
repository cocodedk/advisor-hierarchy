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

const SI_URL = () => `http://127.0.0.1:${port}/benchmark/direct/space-invaders.html`;

describe('Direct build: Space Invaders E2E', () => {
  test('start screen loads correctly', async () => {
    const jsErrors = [];
    const page = await browser.newPage();
    page.on('pageerror', e => jsErrors.push(e.message));

    try {
      await page.goto(SI_URL());
      await page.waitForSelector('.btn-play', { timeout: 8000 });

      const btnPlay = await page.$('button.btn-play');
      assert.ok(btnPlay, 'button.btn-play should exist on start screen');
      const btnText = await btnPlay.textContent();
      assert.ok(
        btnText.toUpperCase().includes('INSERT COIN'),
        `button text should be INSERT COIN, got: ${btnText}`
      );

      const h1 = await page.$('h1.title-main');
      assert.ok(h1, 'h1.title-main should exist on start screen');
      const h1Text = await h1.textContent();
      assert.ok(
        h1Text.includes('SPACE'),
        `h1.title-main text should include SPACE, got: ${h1Text}`
      );

      const canvas = await page.$('canvas.game-canvas');
      assert.ok(canvas, 'canvas.game-canvas should exist');

      const width = await canvas.getAttribute('width');
      const height = await canvas.getAttribute('height');
      assert.strictEqual(width, '800', `canvas width should be 800, got: ${width}`);
      assert.strictEqual(height, '600', `canvas height should be 600, got: ${height}`);

      assert.strictEqual(jsErrors.length, 0, `JS errors: ${jsErrors.join('; ')}`);
    } finally {
      await page.close();
    }
  });

  test('clicking INSERT COIN starts game and shows HUD', async () => {
    const jsErrors = [];
    const page = await browser.newPage();
    page.on('pageerror', e => jsErrors.push(e.message));

    try {
      await page.goto(SI_URL());
      await page.waitForSelector('.btn-play', { timeout: 8000 });

      const btnPlay = await page.$('button.btn-play');
      assert.ok(btnPlay, 'button.btn-play should exist before clicking');
      await btnPlay.click();

      await page.waitForSelector('.hud', { timeout: 3000 });
      const hud = await page.$('.hud');
      assert.ok(hud, '.hud should be visible after clicking INSERT COIN');

      await page.waitForFunction(
        () => !document.querySelector('.overlay'),
        { timeout: 3000 }
      );
      const overlay = await page.$('.overlay');
      assert.strictEqual(overlay, null, 'start overlay should be gone after clicking INSERT COIN');

      assert.strictEqual(jsErrors.length, 0, `JS errors: ${jsErrors.join('; ')}`);
    } finally {
      await page.close();
    }
  });

  test('canvas renders on start screen (aliens march in demo mode)', async () => {
    const jsErrors = [];
    const page = await browser.newPage();
    page.on('pageerror', e => jsErrors.push(e.message));

    try {
      await page.goto(SI_URL());
      await page.waitForSelector('canvas.game-canvas', { timeout: 8000 });

      const canvas = await page.$('canvas.game-canvas');
      assert.ok(canvas, 'canvas.game-canvas should exist on start screen');

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
