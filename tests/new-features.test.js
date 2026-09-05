const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Starting New Features Test Suite (Calendar, Half-Day Leave, Savings Goal, Tax Estimator) ---');

const ROOT = path.resolve(__dirname, '..');

// 1. Check HTML Markup Elements
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
assert.match(html, /id="calendarModal"/, 'index.html must contain #calendarModal');
assert.match(html, /id="openCalendarBtn"/, 'index.html must contain #openCalendarBtn');
assert.match(html, /id="mobileCalendarBtn"/, 'index.html must contain #mobileCalendarBtn');
assert.match(html, /id="calPrevMonthBtn"/, 'index.html must contain #calPrevMonthBtn');
assert.match(html, /id="calNextMonthBtn"/, 'index.html must contain #calNextMonthBtn');
assert.match(html, /id="calTodayBtn"/, 'index.html must contain #calTodayBtn');
assert.match(html, /id="toggleDayHalfDay"/, 'index.html must contain #toggleDayHalfDay');
assert.match(html, /id="calSumHalfDays"/, 'index.html must contain #calSumHalfDays');
assert.match(html, /id="inputHalfDays"/, 'index.html must contain #inputHalfDays');
assert.match(html, /id="inputHalfDaysNum"/, 'index.html must contain #inputHalfDaysNum');

assert.match(html, /class="tax-estimator-panel/, 'index.html must contain .tax-estimator-panel');
assert.match(html, /id="taxEstimatedAnnual"/, 'index.html must contain #taxEstimatedAnnual');
console.log('✓ index.html structure for new features verified');

// 2. Check CSS Classes
const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
assert.match(css, /\.savings-goal-card/, 'style.css must contain .savings-goal-card');
assert.match(css, /\.tax-estimator-panel/, 'style.css must contain .tax-estimator-panel');
assert.match(css, /\.calendar-modal-content/, 'style.css must contain .calendar-modal-content');
assert.match(css, /\.cal-day-cell/, 'style.css must contain .cal-day-cell');
assert.match(css, /\.cal-nav-btn/, 'style.css must contain .cal-nav-btn');
assert.match(css, /\.is-today/, 'style.css must contain .is-today');
assert.match(css, /\.b-halfday/, 'style.css must contain .b-halfday');
assert.match(css, /\.dot-halfday/, 'style.css must contain .dot-halfday');
console.log('✓ style.css classes for new features verified');

// 3. Test Business Logic & Calculations in VM
const appSource = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8') + `
globalThis.__featureTest = {
    state,
    calculations,
    DEFAULT_CONFIG,
    DEFAULT_INPUTS,
    calculatePayroll,
    getCurrentPayPeriodMonth,
    getAdjacentPayPeriodMonth,
    getSavingsTargetAmount,
    calculateAnnualTax,
    getMonthDaysCount,
    getCalendarDataForMonth,
    syncCalendarToSliders,
    fillCalendarWeekdays,
    clearCalendarMonth,
    getThaiMonthSortKey,
    populateMonthSelector,
    getPayPeriodInfo,
    saveCurrentMonthData,
    applyMonthData,
    saveDataToLocalStorage,
    selectCalendarDateKey,
    toggleCalendarType,
    calculateAll,
    syncCurrentMonthToHistory,
    deleteHistoryRecord,
    deleteCurrentMonth
};
`;

const mockStorage = {};
const mockElements = {
    appToast: { classList: { add: () => {}, remove: () => {} }, style: {} },
    toastMessage: { textContent: '' },
    toastIcon: { setAttribute: () => {} },
    pinDotsContainer: { innerHTML: '', classList: { add: () => {}, remove: () => {} } },
    pinLockError: { textContent: '', className: '' },
    pinLockOverlay: { style: { display: 'none' } },
    pinStatusPill: { classList: { add: () => {}, remove: () => {} } },
    pinStatusLabel: { textContent: '' },
    setupPinBtn: { style: { display: 'flex' } },
    changePinBtn: { style: { display: 'none' } },
    disablePinBtn: { style: { display: 'none' } },
    setPinAutoLock: { value: '5', addEventListener: () => {} },
    calCurrentMonthLabel: { textContent: '' },
    calendarDaysGrid: { innerHTML: '' },
    calSumWorked: { textContent: '' },
    calSumHalfDays: { textContent: '' },
    calSumOt: { textContent: '' },
    calSumOtHours: { textContent: '' },
    calSumShift: { textContent: '' },
    calSumWeekend: { textContent: '' },
    toggleDayWork: { classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
    toggleDayHalfDay: { classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
    toggleDayOt: { classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
    toggleDayShift: { classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
    toggleDayWeekend: { classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
    savingsGoalSubText: { textContent: '' },
    savingsCurrentAmount: { textContent: '' },
    savingsTargetAmount: { textContent: '' },
    savingsProgressFill: { style: { width: '0%' }, className: '', classList: { add: () => {}, remove: () => {} } },
    savingsProgressPercent: { textContent: '' },
    savingsRemainingText: { textContent: '' },
    financialHealthBadge: { className: '', classList: { add: () => {}, remove: () => {} } },
    financialHealthText: { textContent: '' },
    taxAnnualGross: { textContent: '' },
    taxTotalDeductions: { textContent: '' },
    taxNetTaxable: { textContent: '' },
    taxEstimatedAnnual: { textContent: '' },
    taxMonthlyWithholdingDesc: { textContent: '' },
    taxBracketBadge: { textContent: '' },
    inputDaysWorked: { value: '0' },
    inputDaysWorkedNum: { value: '0' },
    inputHalfDays: { value: '0' },
    inputHalfDaysNum: { value: '0' },
    inputOtdays: { value: '0' },
    inputOtdaysNum: { value: '0' },
    inputOtDays: { value: '0' },
    inputOtDaysNum: { value: '0' },
    inputShiftDays: { value: '0' },
    inputShiftDaysNum: { value: '0' },
    inputWeekendDays: { value: '0' },
    inputWeekendDaysNum: { value: '0' },
    inputBonusPay: { value: '0' },
    inputBonus: { value: '0' }
};

const context = {
    console,
    document: {
        addEventListener: () => {},
        getElementById: (id) => mockElements[id] || {
            textContent: '',
            innerHTML: '',
            value: '0',
            style: {},
            classList: { add: () => {}, remove: () => {}, toggle: () => {} },
            setAttribute: () => {}
        },
        querySelectorAll: () => [],
        querySelector: () => null,
        documentElement: { getAttribute: () => 'dark' }
    },
    window: {
        addEventListener: () => {}
    },
    localStorage: {
        getItem: (k) => mockStorage[k] || null,
        setItem: (k, v) => { mockStorage[k] = String(v); }
    },
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    confirm: () => true,
    performance: { now: () => Date.now() },
    requestAnimationFrame: (cb) => {},
    Date,
    Math,
    JSON
};

vm.createContext(context);
vm.runInContext(appSource, context);

const testApi = context.__featureTest;

// Test A1: Pay Period Auto-Sync Month Detection (16th-to-15th rule)
// Aug 17, 2026 (day >= 16) -> Next month cycle: Sep 2569
assert.equal(testApi.getCurrentPayPeriodMonth(new Date(2026, 7, 17)), 'กันยายน 2569');
// Aug 10, 2026 (day < 16) -> Current month cycle: Aug 2569
assert.equal(testApi.getCurrentPayPeriodMonth(new Date(2026, 7, 10)), 'สิงหาคม 2569');
// Dec 16, 2026 (day >= 16) -> Year rollover cycle: Jan 2570
assert.equal(testApi.getCurrentPayPeriodMonth(new Date(2026, 11, 16)), 'มกราคม 2570');
// Dec 10, 2026 (day < 16) -> Dec 2569
assert.equal(testApi.getCurrentPayPeriodMonth(new Date(2026, 11, 10)), 'ธันวาคม 2569');
// Jan 1, 2027 (day < 16) -> Jan 2570
assert.equal(testApi.getCurrentPayPeriodMonth(new Date(2027, 0, 1)), 'มกราคม 2570');

assert.equal(testApi.getAdjacentPayPeriodMonth('สิงหาคม 2569', 1), 'กันยายน 2569');
assert.equal(testApi.getAdjacentPayPeriodMonth('สิงหาคม 2569', -1), 'กรกฎาคม 2569');
assert.equal(testApi.getAdjacentPayPeriodMonth('ธันวาคม 2569', 1), 'มกราคม 2570');
assert.equal(testApi.getAdjacentPayPeriodMonth('มกราคม 2570', -1), 'ธันวาคม 2569');
console.log('✓ Pay Period cycle resolution & navigation verified');

// Test A2: Half-Day Leave (ลาครึ่งวัน) Calculation Logic
const testConfig = { ...testApi.DEFAULT_CONFIG, baseSalary: 12500, baseDays: 30, breakfastRate: 60, travelRate: 105, targetRate: 100, otFoodRate: 60 };
const testInputs = { daysWorked: 24, halfDays: 1, otDays: 0, weekendDays: 0, shiftDays: 0, bonus: 0 };
const calcRes = testApi.calculatePayroll(testConfig, testInputs, []);

// Daily rate: 12500 / 30 = 416.6666...
// Half day deduction: 1 * (416.6666... * 0.5) = 208.3333...
// Base wage: 12500 - 208.3333... = 12291.6666...
assert.ok(Math.abs(calcRes.dailyRate - 416.6667) < 0.01, 'Daily rate should be ~416.67');
assert.ok(Math.abs(calcRes.halfDayDeduction - 208.3333) < 0.01, 'Half day deduction should be ~208.33');
assert.ok(Math.abs(calcRes.baseWagePay - 12291.6667) < 0.01, 'Base wage should be ~12291.67');

// Allowances:
// Breakfast: (24 + 1) * 60 = 1500
assert.equal(calcRes.breakfastPay, 1500, 'Breakfast allowance should include full days + half days');
// Travel: (24 + 1) * 105 = 2625
assert.equal(calcRes.travelPay, 2625, 'Travel allowance should include full days + half days');
// Target: 24 * 100 = 2400 (Half days do NOT receive target allowance)
assert.equal(calcRes.targetPay, 2400, 'Target allowance should only include full days');
// OT food: 0
assert.equal(calcRes.otFoodPay, 0, 'No OT food for half days');
console.log('✓ Half-Day Leave calculation rules verified');

// Test A: Savings Goal Calculation
assert.equal(testApi.getSavingsTargetAmount(30000), 6000, '20% of 30,000 should be 6,000');
testApi.state.config.savings = { mode: 'fixed', targetValue: 8000 };
assert.equal(testApi.getSavingsTargetAmount(30000), 8000, 'Fixed savings target should return 8,000');
console.log('✓ Savings target calculations verified');

// Test B: Thai Tax Calculation (ภ.ง.ด.91)
testApi.calculations.totalRevenue = 30000;
testApi.state.history = [];
testApi.state.config.socialSecurity = 750;
testApi.state.config.tax = { customPvd: 0, lifeInsurance: 0, homeLoanInterest: 0 };

const taxResult = testApi.calculateAnnualTax();
assert.equal(taxResult.annualGross, 360000, 'Annual Gross must be 360,000');
assert.equal(taxResult.totalDeductions, 169000, 'Total Deductions should be 169,000');
assert.equal(taxResult.taxableIncome, 191000, 'Taxable Income should be 191,000');
assert.equal(taxResult.annualTax, 2050, 'Annual Tax for 191,000 taxable income should be 2,050');
assert.equal(taxResult.bracketName, 'ฐาน 5%');
console.log('✓ Thai Tax (ภ.ง.ด.91) progressive bracket calculations verified');

// Test C: Calendar Pay Period & Sync with Half-Days
testApi.state.currentMonth = 'กุมภาพันธ์ 2569';
const periodInfo = testApi.getPayPeriodInfo('กุมภาพันธ์ 2569');
assert.equal(periodInfo.days.length, 31, 'Pay period for Feb 2569 (16 Jan - 15 Feb) should have 31 days');
assert.equal(periodInfo.days[0].key, '2026-01-16', 'First day of cycle must be 16 Jan 2026');
assert.equal(periodInfo.days[periodInfo.days.length - 1].key, '2026-02-15', 'Last day of cycle must be 15 Feb 2026');

testApi.clearCalendarMonth();
const cal = testApi.getCalendarDataForMonth('กุมภาพันธ์ 2569');
assert.equal(Object.keys(cal).length, 0, 'Calendar data should be empty after clear');

// Mark 5 full work days, 2 half-days, 2 weekend days
for (let i = 0; i < 5; i++) {
    const k = periodInfo.days[i].key;
    cal[k] = { worked: true, halfDay: false, ot: true, shift: true, weekend: false };
}
cal[periodInfo.days[5].key] = { worked: false, halfDay: true, ot: false, shift: false, weekend: false };
cal[periodInfo.days[6].key] = { worked: false, halfDay: true, ot: false, shift: false, weekend: false };
cal[periodInfo.days[7].key] = { worked: false, halfDay: false, ot: false, shift: false, weekend: true };
cal[periodInfo.days[8].key] = { worked: false, halfDay: false, ot: false, shift: false, weekend: true };

testApi.syncCalendarToSliders();
assert.equal(testApi.state.inputs.daysWorked, 5, 'Full work days should sync to 5');
assert.equal(testApi.state.inputs.halfDays, 2, 'Half days should sync to 2');
assert.equal(testApi.state.inputs.otDays, 5, 'OT days should sync to 5');
assert.equal(testApi.state.inputs.shiftDays, 5, 'Shift days should sync to 5');
assert.equal(testApi.state.inputs.weekendDays, 2, 'Weekend days should sync to 2');
console.log('✓ 16th-to-15th Pay Period Calendar & Sync to Sliders verified');

// Test D: Month Chronological Sorting
const unsortedMonths = ['พฤษภาคม 2569', 'มกราคม 2569', 'ธันวาคม 2568', 'กุมภาพันธ์ 2569', 'ธันวาคม 2569'];
const sortedMonths = [...unsortedMonths].sort((a, b) => testApi.getThaiMonthSortKey(a) - testApi.getThaiMonthSortKey(b));
assert.deepEqual(sortedMonths, [
    'ธันวาคม 2568',
    'มกราคม 2569',
    'กุมภาพันธ์ 2569',
    'พฤษภาคม 2569',
    'ธันวาคม 2569'
], 'Months must be sorted chronologically from oldest year/month to newest');
console.log('✓ Thai Month Chronological Sorting verified');

// Test E: Calendar Persistence
testApi.saveCurrentMonthData();
testApi.saveDataToLocalStorage();
assert.ok(testApi.state.monthlyData['กุมภาพันธ์ 2569'].calendar, 'Monthly data must retain calendar object');
assert.equal(testApi.state.monthlyData['กุมภาพันธ์ 2569'].calendar[periodInfo.days[0].key].worked, true, 'First marked day must stay true after save');
assert.equal(testApi.state.monthlyData['กุมภาพันธ์ 2569'].calendar[periodInfo.days[5].key].halfDay, true, 'Half day marked must stay true after save');

// Test F: Day Toggle Rules (halfDay allows shift, OT auto-checks worked)
const testDateKey = periodInfo.days[0].key;
// Start with day having worked, ot, shift, weekend
testApi.getCalendarDataForMonth('กุมภาพันธ์ 2569')[testDateKey] = { worked: true, halfDay: false, ot: true, shift: true, weekend: true };
testApi.selectCalendarDateKey(testDateKey);

// 1. Toggle halfDay -> worked, ot, weekend must be false, but shift is preserved!
testApi.toggleCalendarType('halfDay');
const dayAfterHalfDay = testApi.getCalendarDataForMonth('กุมภาพันธ์ 2569')[testDateKey];
assert.equal(dayAfterHalfDay.halfDay, true, 'Toggling halfDay should set halfDay to true');
assert.equal(dayAfterHalfDay.worked, false, 'Toggling halfDay must clear worked');
assert.equal(dayAfterHalfDay.ot, false, 'Toggling halfDay must clear ot');
assert.equal(dayAfterHalfDay.weekend, false, 'Toggling halfDay must clear weekend');
assert.equal(dayAfterHalfDay.shift, true, 'Toggling halfDay can coexist with shift');

// 2. Can also toggle shift off and on while halfDay is active
testApi.toggleCalendarType('shift');
assert.equal(testApi.getCalendarDataForMonth('กุมภาพันธ์ 2569')[testDateKey].shift, false, 'Shift can be toggled off');
assert.equal(testApi.getCalendarDataForMonth('กุมภาพันธ์ 2569')[testDateKey].halfDay, true, 'HalfDay remains true when shift is toggled off');

testApi.toggleCalendarType('shift');
assert.equal(testApi.getCalendarDataForMonth('กุมภาพันธ์ 2569')[testDateKey].shift, true, 'Shift can be toggled on with halfDay');
assert.equal(testApi.getCalendarDataForMonth('กุมภาพันธ์ 2569')[testDateKey].halfDay, true, 'HalfDay remains true when shift is toggled on');

// 3. Toggle OT -> automatically enables worked: true, and clears halfDay: false
testApi.toggleCalendarType('ot');
const dayAfterOt = testApi.getCalendarDataForMonth('กุมภาพันธ์ 2569')[testDateKey];
assert.equal(dayAfterOt.ot, true, 'Toggling OT should set OT to true');
assert.equal(dayAfterOt.worked, true, 'Toggling OT must automatically set worked to true');
assert.equal(dayAfterOt.halfDay, false, 'Toggling OT must clear halfDay');

// 4. Unticking worked -> automatically unticks ot
testApi.toggleCalendarType('worked');
const dayAfterUntickWorked = testApi.getCalendarDataForMonth('กุมภาพันธ์ 2569')[testDateKey];
assert.equal(dayAfterUntickWorked.worked, false, 'Worked should be false');
assert.equal(dayAfterUntickWorked.ot, false, 'Unticking worked should automatically untick ot');

console.log('✓ Half-day with shift & OT auto-checking worked verified');

// Test G: History Auto-Sync
testApi.state.currentMonth = 'มกราคม 2569';
testApi.state.inputs.daysWorked = 22;
testApi.state.inputs.halfDays = 0;
testApi.state.inputs.otDays = 10;
testApi.calculateAll();

const janRecord = testApi.state.history.find(h => h.month === 'มกราคม 2569');
assert.ok(janRecord, 'Month with revenue must be automatically synced into state.history');
assert.ok(janRecord.totalRevenue > 0, 'Jan record must have positive revenue');

testApi.deleteHistoryRecord(janRecord.id);
assert.equal(testApi.state.history.some(h => h.month === 'มกราคม 2569'), false, 'Jan must be removed from history');
assert.equal(testApi.state.monthlyData['มกราคม 2569'], undefined, 'Jan monthlyData must be deleted');
console.log('✓ History Auto-Sync & deleteHistoryRecord verified');

// Test H: deleteCurrentMonth
testApi.state.currentMonth = 'กุมภาพันธ์ 2569';
testApi.state.inputs.daysWorked = 20;
testApi.calculateAll();
assert.ok(testApi.state.history.some(h => h.month === 'กุมภาพันธ์ 2569'), 'Feb must be in history');

testApi.deleteCurrentMonth();
assert.equal(testApi.state.history.some(h => h.month === 'กุมภาพันธ์ 2569'), false, 'Feb must be removed by deleteCurrentMonth');
assert.equal(testApi.state.monthlyData['กุมภาพันธ์ 2569'], undefined, 'Feb monthlyData must be deleted');
console.log('✓ deleteCurrentMonth verified');

console.log('\nAll New Features test assertions PASSED successfully!');
