const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
assert.match(app, /id="inp_\$\{item\.id\}"[\s\S]*onfocus="this\.select\(\)"/);
console.log('Expense input focus selection check passed');