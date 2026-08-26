const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

assert.match(html, /id="clearHistoryBtn"/);
assert.match(app, /getElementById\('clearHistoryBtn'\)/);
assert.match(app, /const baseDate = new Date\(\);/);
assert.match(app, /state\.expenses = cloneExpenses\(record\.expenses\);/);

console.log('Phase 1 regression checks passed');
