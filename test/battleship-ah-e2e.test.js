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
  browser = await chromium.launch({ headless: true, slowMo: 0 });
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

  // Run entire battle in-browser — single IPC round-trip
  const won = await page.evaluate((gridSel) => {
    return new Promise((resolve) => {
      let shots = 0;
      function fireNext() {
        if (shots++ > 200) { resolve(false); return; } // safety limit
        const text = document.body.innerText.toUpperCase();
        if (text.includes('VICTORY') || text.includes('DEFEATED') ||
            text.includes('YOU WIN') || text.includes('YOU LOSE')) {
          resolve(true);
          return;
        }
        // Find a targetable (unfired) cell in the enemy grid
        const grid = document.querySelector(gridSel);
        const cell = grid && grid.querySelector('.cell.targetable, .cell:not(.hit):not(.miss):not(.sunk):not(.fired)[data-row]');
        if (!cell) {
          // No targetable cells yet (computer's turn or brief re-render) — retry
          setTimeout(fireNext, 10);
          return;
        }
        cell.click();
        setTimeout(fireNext, 15); // wait for React render + computer's setTimeout(0)
      }
      fireNext();
    });
  }, enemyGridSelector);

  assert.ok(won, 'a win/lose screen should appear after all ships are sunk');
  assert.strictEqual(jsErrors.length, 0, `JS errors: ${jsErrors.join('; ')}`);
}

describe('AH build', () => {
  let page;
  before(async () => { page = await browser.newPage(); });
  after(async () => { await page.close(); });

  test('start screen has BATTLESHIP title and a button', async () => {
    await page.goto(`http://127.0.0.1:${port}/benchmark/ah/battleship.html`);
    const title = await page.textContent('h1');
    assert.ok(title.toUpperCase().includes('BATTLESHIP'));
    assert.ok(await page.$('button'));
  });

  test('full game flow: placement → ready → battle → game over', { timeout: 120000 }, async () => {
    await testGame(page, '/benchmark/ah/battleship.html', {
      startSelector: '#overlay button, #overlay-btn',
      readySelector: '#btn-ready',
      enemyGridSelector: '#computer-grid',
    });
  });
});
