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
  browser = await chromium.launch({ headless: false, slowMo: 0 });
});

after(async () => {
  await browser.close();
  await new Promise(r => server.close(r));
});

async function testGame(page, urlPath, opts = {}) {
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));

  await page.goto(`http://127.0.0.1:${port}${urlPath}`);

  const title = await page.textContent('h1');
  assert.ok(title.toUpperCase().includes('BATTLESHIP'), `title should include BATTLESHIP, got: ${title}`);
  assert.ok(await page.$('button'), 'at least one button should exist on start screen');

  if (opts.startSelector) {
    await page.click(opts.startSelector);
  } else {
    await page.click('button');
  }

  await page.waitForFunction(() => document.querySelectorAll('.cell').length >= 100, { polling: 10 });
  const cells = await page.$$('.cell');
  assert.ok(cells.length >= 100, `expected ≥100 cells, got ${cells.length}`);

  await page.click('button:has-text("Random")');

  await page.waitForFunction(() => document.querySelectorAll('.cell.ship').length > 0, { timeout: 5000, polling: 10 })
    .catch(() => {});

  const shipCount = await page.evaluate(() =>
    document.querySelectorAll('.cell.ship, .cell[data-ship]').length
  );
  assert.ok(shipCount > 0, 'ship cells should be present after random placement');

  if (opts.readySelector) {
    await page.waitForSelector(opts.readySelector + ':not([disabled])', { timeout: 5000 });
    await page.click(opts.readySelector);
  }

  await page.waitForFunction(
    () => {
      const statusEl = document.querySelector('#status-bar, #statusBar, .status, [class*="status"]');
      if (statusEl) return statusEl.textContent.length > 0;
      return typeof window.phase !== 'undefined' ? window.phase === 'battle' : true;
    },
    { timeout: 5000, polling: 10 }
  );

  const enemyGridSelector = opts.enemyGridSelector || '#computerGridEl,#computer-grid';

  const isGameOver = () => page.evaluate(() => {
    const text = document.body.innerText.toUpperCase();
    return text.includes('VICTORY') || text.includes('YOU WIN') ||
           text.includes('DEFEATED') || text.includes('YOU LOSE') ||
           text.includes('GAME OVER');
  });

  let gameOver = false;
  while (!gameOver) {
    const cell = await page.evaluateHandle((sel) => {
      for (const s of sel.split(',')) {
        const grid = document.querySelector(s.trim());
        if (grid) {
          const c = grid.querySelector('.cell:not(.hit):not(.miss):not(.fired):not(.sunk)');
          if (c) return c;
        }
      }
      return null;
    }, enemyGridSelector);

    const el = cell.asElement();
    if (!el) break;

    await el.click();
    const prevCount = await page.evaluate(() => document.querySelectorAll('.cell.hit, .cell.miss, .cell.sunk').length);
    await page.waitForFunction(
      (prev) => {
        const text = document.body.innerText.toUpperCase();
        if (text.includes('VICTORY') || text.includes('DEFEATED') || text.includes('YOU WIN') || text.includes('YOU LOSE')) return true;
        return document.querySelectorAll('.cell.hit, .cell.miss, .cell.sunk').length > prev;
      },
      prevCount,
      { timeout: 5000, polling: 10 }
    ).catch(() => {});

    gameOver = await isGameOver();
  }

  assert.ok(await isGameOver(), 'a win/lose screen should appear after all ships are sunk');
  assert.strictEqual(jsErrors.length, 0, `JS errors: ${jsErrors.join('; ')}`);
}

describe('Direct build', () => {
  let page;
  before(async () => { page = await browser.newPage(); });
  after(async () => { await page.close(); });

  test('start screen has BATTLESHIP title and a button', async () => {
    await page.goto(`http://127.0.0.1:${port}/benchmark/direct/battleship.html`);
    const title = await page.textContent('h1');
    assert.ok(title.toUpperCase().includes('BATTLESHIP'));
    assert.ok(await page.$('button'));
  });

  test('full game flow: placement → battle → game over', { timeout: 120000 }, async () => {
    await testGame(page, '/benchmark/direct/battleship.html', {
      startSelector: 'button',
      enemyGridSelector: '#computerGridEl',
    });
  });
});
