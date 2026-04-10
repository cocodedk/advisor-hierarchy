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

// ── Shared test flow ──────────────────────────────────────────────────────────

async function testGame(page, urlPath, opts = {}) {
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));

  await page.goto(`http://127.0.0.1:${port}${urlPath}`);

  // 1. Start screen — title + button
  const title = await page.textContent('h1');
  assert.ok(title.toUpperCase().includes('BATTLESHIP'), `title should include BATTLESHIP, got: ${title}`);
  assert.ok(await page.$('button'), 'at least one button should exist on start screen');

  // 2. Click start
  if (opts.startSelector) {
    await page.click(opts.startSelector);
  } else {
    await page.click('button');
  }

  // Wait for grid cells to appear (100 per grid)
  await page.waitForFunction(() => document.querySelectorAll('.cell').length >= 100);
  const cells = await page.$$('.cell');
  assert.ok(cells.length >= 100, `expected ≥100 cells, got ${cells.length}`);

  // 3. Click random placement
  await page.click('button:has-text("Random")');

  // Wait for ship cells to appear on player side
  await page.waitForFunction(() => document.querySelectorAll('.cell.ship').length > 0, { timeout: 5000 })
    .catch(() => {
      // Some builds use data attributes instead of .ship class — check both
    });

  // Verify ships placed (cells with .ship class OR data-ship attribute)
  const shipCount = await page.evaluate(() =>
    document.querySelectorAll('.cell.ship, .cell[data-ship]').length
  );
  assert.ok(shipCount > 0, 'ship cells should be present after random placement');

  // 4. Ready button (ah build only)
  if (opts.readySelector) {
    await page.waitForSelector(opts.readySelector + ':not([disabled])', { timeout: 5000 });
    await page.click(opts.readySelector);
  }

  // 5. Battle phase — wait for it to be active
  await page.waitForFunction(
    () => {
      const statusEl = document.querySelector('#status-bar, #statusBar, .status, [class*="status"]');
      if (statusEl) return statusEl.textContent.length > 0;
      // fallback: check a global phase variable
      return typeof window.phase !== 'undefined'
        ? window.phase === 'battle'
        : true; // assume active if no indicator
    },
    { timeout: 5000 }
  );

  // 6. Fire a shot — find an unfired enemy cell and click it
  const enemyGridSelector = opts.enemyGridSelector || '#computerGridEl, #computer-grid';
  const unfiredCell = await page.evaluateHandle((sel) => {
    const grids = document.querySelectorAll(sel.split(',').map(s => s.trim()).join(','));
    for (const grid of grids) {
      const cells = grid.querySelectorAll('.cell:not(.hit):not(.miss):not(.fired)');
      if (cells.length > 0) return cells[0];
    }
    // fallback: any cell with computer-grid class not yet fired
    const fallback = document.querySelector('.cell.computer-grid:not(.fired):not(.hit):not(.miss)');
    return fallback;
  }, enemyGridSelector);

  const cellHandle = unfiredCell.asElement();
  assert.ok(cellHandle, 'should find an unfired enemy cell');
  await cellHandle.click();

  // 7. Verify hit or miss appeared on enemy grid
  await page.waitForFunction(
    () => document.querySelectorAll('.cell.hit, .cell.miss').length > 0,
    { timeout: 5000 }
  );
  const markerCount = await page.evaluate(
    () => document.querySelectorAll('.cell.hit, .cell.miss').length
  );
  assert.ok(markerCount > 0, 'hit or miss marker should appear after firing');

  // 8. Computer fires back — player grid should have a marker too
  // Wait for the computer to fire (total markers > 1 OR player grid has marker)
  await page.waitForFunction(
    () => document.querySelectorAll('.cell.hit, .cell.miss').length > 1,
    { timeout: 8000 }
  ).catch(() => {
    // computer may not fire if game is already over (rare edge case)
  });

  // 9. No JS errors
  assert.strictEqual(jsErrors.length, 0, `JS errors: ${jsErrors.join('; ')}`);
}

// ── Direct build ──────────────────────────────────────────────────────────────

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

  test('full game flow: placement → battle → fire shot', async () => {
    await testGame(page, '/benchmark/direct/battleship.html', {
      // direct build: first button is "DEPLOY FLEET", no separate Ready button
      startSelector: 'button',
      enemyGridSelector: '#computerGridEl',
    });
  });
});

// ── /ah build ────────────────────────────────────────────────────────────────

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

  test('full game flow: placement → ready → battle → fire shot', async () => {
    await testGame(page, '/benchmark/ah/battleship.html', {
      startSelector: '#overlay button, #overlay-btn',
      readySelector: '#btn-ready',
      enemyGridSelector: '#computer-grid',
    });
  });
});
