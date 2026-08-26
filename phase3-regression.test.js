const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

assert.match(app, /function calculatePayroll\(/);
assert.match(app, /function validatePayrollInputs\(/);
assert.match(app, /function buildBackupPayload\(/);
assert.match(app, /function validateBackupPayload\(/);
assert.match(app, /function renderAnnualSummary\(/);
assert.match(app, /typeof Chart === 'undefined'/);
assert.match(html, /id="exportBackupBtn"/);
assert.match(html, /id="importBackupInput"/);
assert.match(html, /id="annualSummary"/);

console.log('Phase 3 regression checks passed');
