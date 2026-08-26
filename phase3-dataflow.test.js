const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('app.js', 'utf8') + `
globalThis.__phase3 = { state, calculatePayroll, validatePayrollInputs, buildBackupPayload, validateBackupPayload, renderAnnualSummary };
`;
const annualContainer = { innerHTML: '' };
const context = {
    console,
    document: { addEventListener: () => {}, getElementById: id => id === 'annualSummary' ? annualContainer : null },
    localStorage: { getItem: () => null, setItem: () => {} }
};
vm.createContext(context);
vm.runInContext(source, context);

const api = context.__phase3;
const config = {
    baseSalary: 12500, baseDays: 30, shiftRate: 100, breakfastRate: 60,
    otFoodRate: 60, travelRate: 105, targetRate: 100, rentRate: 2000,
    diligenceRate: 1200, incentiveRate: 1200, standardHours: 8,
    otHoursPerDay: 2.5, mulOtNormal: 1.5, mulWeekendStd: 1,
    mulWeekendOt: 3, socialSecurity: 1300
};
const inputs = { daysWorked: 25, otDays: 16, weekendDays: 6, shiftDays: 0, bonus: 0 };
const expenses = [
    { id: 'car', value: 8353 }, { id: 'fuel', value: 800 },
    { id: 'food', value: 3000 }, { id: 'internet', value: 600 }
];

const result = api.calculatePayroll(config, inputs, expenses);
assert.equal(Number(result.totalRevenue.toFixed(2)), 32813.75);
assert.equal(Number(result.totalExpenses.toFixed(2)), 14053);
assert.equal(Number(result.netBalance.toFixed(2)), 18760.75);
assert.equal(api.validatePayrollInputs(config, inputs).length, 0);

const invalid = api.validatePayrollInputs({ ...config, baseDays: 0 }, { ...inputs, daysWorked: -1 });
assert.ok(invalid.length >= 2);

api.state.config = config;
api.state.monthlyData = { 'กรกฎาคม 2569': { inputs, expenses } };
api.state.history = [];
api.state.expenses = expenses;
const backup = api.buildBackupPayload();
assert.equal(backup.app, 'SalaryHub');
assert.equal(api.validateBackupPayload(backup), true);
api.state.history = [{ month: 'กรกฎาคม 2569', totalRevenue: 100, totalExpenses: 40, netBalance: 60 }];
api.renderAnnualSummary();
assert.ok(annualContainer.innerHTML.includes('2569'));
assert.equal(api.validateBackupPayload({ app: 'Other', version: 1 }), false);

console.log('Phase 3 data-flow checks passed');