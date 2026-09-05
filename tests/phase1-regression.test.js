const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

assert.match(html, /id="clearHistoryBtn"/);
assert.match(app, /getElementById\('clearHistoryBtn'\)/);
assert.match(app, /const baseDate = new Date\(\);/);
assert.match(app, /state\.expenses = cloneExpenses\(record\.expenses\);/);

console.log('Phase 1 regression checks passed');
