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

const markerCount = (page) =>
  page.evaluate(() => document.querySelectorAll('.cell.hit, .cell.miss, .cell.sunk').length);

describe('AH build — marker count regression', () => {
  let page;
  before(async () => { page = await browser.newPage(); });
  after(async () => { await page.close(); });

  test('marker count never decreases across 20 rounds', { timeout: 60000 }, async () => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    await page.goto(`http://127.0.0.1:${port}/benchmark/ah/battleship.html`);

    // Start game
    await page.click('#overlay button');
    await page.waitForFunction(() => document.querySelectorAll('.cell').length >= 100);

    // Random placement
    await page.click('button:has-text("Random")');
    await page.waitForFunction(() => document.querySelectorAll('.cell.ship, .cell[data-ship]').length > 0, { timeout: 5000 });

    // Ready
    await page.waitForSelector('#btn-ready:not([disabled])', { timeout: 5000 });
    await page.click('#btn-ready');

    // Play 20 rounds, verifying marker count never decreases
    let prevCount = 0;
    let rounds = 0;
    const isGameOver = () => page.evaluate(() => {
      const text = document.body.innerText.toUpperCase();
      return text.includes('YOU WIN') || text.includes('YOU LOSE') || text.includes('VICTORY') || text.includes('DEFEATED');
    });

    while (rounds < 20 && !(await isGameOver())) {
      // Wait for player's turn (.turn-player class on status bar, or game over)
      await page.waitForFunction(() => {
        const text = document.body.innerText.toUpperCase();
        if (text.includes('YOU WIN') || text.includes('YOU LOSE') || text.includes('VICTORY') || text.includes('DEFEATED')) return true;
        return document.querySelector('#status-bar.turn-player') !== null;
      }, { timeout: 8000 });

      if (await isGameOver()) break;

      // Find unfired enemy cell coordinates
      const coords = await page.evaluate(() => {
        const grid = document.querySelector('#computer-grid');
        if (!grid) return null;
        const cell = grid.querySelector('.cell:not(.hit):not(.miss):not(.fired):not(.sunk)');
        if (!cell) return null;
        return { r: cell.dataset.r, c: cell.dataset.c };
      });
      if (!coords) break;

      await page.click(`#computer-grid .cell[data-r="${coords.r}"][data-c="${coords.c}"]`);

      // Wait for computer to respond (marker count must increase)
      await page.waitForFunction((prev) => {
        const text = document.body.innerText.toUpperCase();
        if (text.includes('YOU WIN') || text.includes('YOU LOSE') || text.includes('VICTORY') || text.includes('DEFEATED')) return true;
        return document.querySelectorAll('.cell.hit, .cell.miss, .cell.sunk').length > prev;
      }, prevCount, { timeout: 8000 });

      const newCount = await markerCount(page);
      assert.ok(newCount > prevCount,
        `Round ${rounds + 1}: marker count should increase. Was ${prevCount}, now ${newCount}`);
      prevCount = newCount;
      rounds++;
    }

    assert.ok(rounds > 0, 'should have played at least 1 round');
    assert.strictEqual(jsErrors.length, 0, `JS errors: ${jsErrors.join('; ')}`);
  });

  test('computer always sets turn back to player after firing', { timeout: 30000 }, async () => {
    // Fresh page
    await page.goto(`http://127.0.0.1:${port}/benchmark/ah/battleship.html`);
    await page.click('#overlay button');
    await page.waitForFunction(() => document.querySelectorAll('.cell').length >= 100);
    await page.click('button:has-text("Random")');
    await page.waitForFunction(() => document.querySelectorAll('.cell.ship, .cell[data-ship]').length > 0, { timeout: 5000 });
    await page.waitForSelector('#btn-ready:not([disabled])', { timeout: 5000 });
    await page.click('#btn-ready');

    // After 5 player shots, verify status bar always returns to player-turn message
    for (let i = 0; i < 5; i++) {
      const coords = await page.evaluate(() => {
        const grid = document.querySelector('#computer-grid');
        if (!grid) return null;
        const cell = grid.querySelector('.cell:not(.hit):not(.miss):not(.fired):not(.sunk)');
        if (!cell) return null;
        return { r: cell.dataset.r, c: cell.dataset.c };
      });
      if (!coords) break;

      await page.click(`#computer-grid .cell[data-r="${coords.r}"][data-c="${coords.c}"]`);

      // Wait for status bar to indicate player's turn (computer finished firing)
      await page.waitForFunction(() => {
        const text = document.body.innerText.toUpperCase();
        if (text.includes('YOU WIN') || text.includes('YOU LOSE')) return true;
        const bar = document.querySelector('#status-bar');
        return bar && (bar.textContent.includes('YOUR TURN') || bar.textContent.includes('click enemy') || bar.textContent.includes('Fire back'));
      }, { timeout: 5000 });
    }
  });
});
