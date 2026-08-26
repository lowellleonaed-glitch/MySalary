const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('app.js', 'utf8');

assert.match(app, /const expSumRevenue = document\.getElementById\('expSumRevenue'\)/);
assert.match(app, /if \(expSumRevenue\) expSumRevenue\.textContent/);
assert.match(app, /const expSumExpenses = document\.getElementById\('expSumExpenses'\)/);
assert.match(app, /if \(expSumExpenses\) expSumExpenses\.textContent/);
assert.match(app, /const expSumBalance = document\.getElementById\('expSumBalance'\)/);
assert.match(app, /if \(expSumBalance\) expSumBalance\.textContent/);

console.log('Delete expense regression checks passed');
