const assert = require('node:assert/strict');
const fs = require('node:fs');
const app = fs.readFileSync('app.js', 'utf8');
assert.match(app, /id="inp_\$\{item\.id\}"[\s\S]*onfocus="this\.select\(\)"/);
console.log('Expense input focus selection check passed');