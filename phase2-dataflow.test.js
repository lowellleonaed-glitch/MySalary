const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('app.js', 'utf8') + `
globalThis.__phase2 = { state, applyMonthData, saveCurrentMonthData, loadDataFromLocalStorage };
`;

const storage = new Map();
const context = {
    console,
    localStorage: {
        getItem: key => storage.has(key) ? storage.get(key) : null,
        setItem: (key, value) => storage.set(key, String(value))
    },
    document: { addEventListener: () => {} },
    confirm: () => true
};
vm.createContext(context);
vm.runInContext(source, context);

const api = context.__phase2;
const july = 'กรกฎาคม 2569';
const august = 'สิงหาคม 2569';
const julyExpense = [{ id: 'exp_food', label: 'ค่ากิน', value: 3000, icon: 'coffee' }];
const augustExpense = [{ id: 'exp_food', label: 'ค่ากิน', value: 4500, icon: 'coffee' }];

api.state.currentMonth = july;
api.state.inputs = { daysWorked: 25, otDays: 2, weekendDays: 0, shiftDays: 0, bonus: 0 };
api.state.expenses = julyExpense;
api.saveCurrentMonthData();

api.state.currentMonth = august;
api.applyMonthData(august, api.state.expenses);
assert.equal(api.state.expenses[0].value, 3000, 'new month should inherit recurring expenses');

api.state.expenses = augustExpense;
api.saveCurrentMonthData();

api.state.currentMonth = july;
api.applyMonthData(july);
assert.equal(api.state.expenses[0].value, 4500, 'switching months should keep global expenses');

storage.set('salary_hub_expenses', JSON.stringify(julyExpense));
storage.set('salary_hub_inputs', JSON.stringify({ daysWorked: 25 }));
storage.set('salary_hub_monthly_data', '{}');
api.state.currentMonth = 'กันยายน 2569';
api.state.monthlyData = {};
api.loadDataFromLocalStorage();
assert.equal(api.state.expenses[0].value, 3000, 'legacy expenses should migrate to the current month');

console.log('Phase 2 data-flow checks passed');