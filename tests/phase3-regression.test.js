const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

assert.match(app, /function calculatePayroll\(/);
assert.match(app, /function validatePayrollInputs\(/);
assert.match(app, /function renderAnnualSummary\(/);
assert.match(app, /typeof Chart === 'undefined'/);
// Backup export UI was intentionally removed (commit 7f3975f) — assert it stays removed.
assert.doesNotMatch(html, /id="exportBackupBtn"/);
assert.doesNotMatch(html, /id="importBackupInput"/);
assert.match(html, /id="annualSummary"/);

console.log('Phase 3 regression checks passed');
