const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

assert.match(app, /function createBlankMonthData\([^)]*\)[\s\S]*expenses:/);
assert.match(app, /function normalizeMonthData\([^)]*\)[\s\S]*expenses:/);
assert.match(app, /state\.expenses = cloneExpenses\(fallbackExpenses\)/);
assert.match(app, /expenses: cloneExpenses\(state\.expenses\)/);
assert.match(app, /normalizeMonthData\(\{[\s\S]*inputs: parsedLegacyInputs[\s\S]*expenses:/);
assert.match(app, /state\.currentMonth = e\.target\.value;[\s\S]*applyMonthData\(state\.currentMonth, state\.expenses\);/);

console.log('Phase 2 regression checks passed');
