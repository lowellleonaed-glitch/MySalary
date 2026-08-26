# Pay Period Auto-Sync & Half-Day Leave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement automatic current pay-period cycle detection on calendar open (16th-to-15th rule), in-modal cycle navigation with "Today" cell highlighting, and half-day leave tracking/calculation across the entire salary calculation engine and UI.

**Architecture:** Extend `app.js` with `getCurrentPayPeriodMonth(baseDate)` for cycle resolution, enhance `calculatePayroll()` to incorporate half-day basic wage deductions and allowance rules, wire half-day toggles and counters into `calendarModal` and `dashboard`, and update `index.html` and `style.css` for mobile-first responsive controls.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, Vanilla CSS, Node.js assert test runner.

## Global Constraints
- Mobile-first responsive design (390px viewport, touch-friendly, safe areas).
- Strictly adhere to Pay Period Cycle (16th previous month to 15th current month).
- All existing test suites must continue to pass with 0 regressions.

---

### Task 1: Pay Period Auto-Sync Engine & Unit Tests

**Files:**
- Modify: `app.js`
- Test: `new-features.test.js`

**Interfaces:**
- Produces: `getCurrentPayPeriodMonth(baseDate = new Date()): string`
- Produces: `getAdjacentPayPeriodMonth(currentMonthLabel: string, direction: number): string`

- [ ] **Step 1: Write the failing tests in `new-features.test.js`**

Add tests for:
1. `getCurrentPayPeriodMonth(new Date(2026, 7, 17))` -> `"กันยายน 2569"` (August 17th is >= 16th, so Sep 2569 cycle).
2. `getCurrentPayPeriodMonth(new Date(2026, 7, 10))` -> `"สิงหาคม 2569"` (August 10th is < 16th, so Aug 2569 cycle).
3. `getCurrentPayPeriodMonth(new Date(2026, 11, 16))` -> `"มกราคม 2570"` (December 16th rolls over to Jan 2570).
4. `getAdjacentPayPeriodMonth("สิงหาคม 2569", 1)` -> `"กันยายน 2569"`
5. `getAdjacentPayPeriodMonth("สิงหาคม 2569", -1)` -> `"กรกฎาคม 2569"`

- [ ] **Step 2: Run test to verify failure**
Run: `node new-features.test.js`
Expected: FAIL (`getCurrentPayPeriodMonth is not defined`)

- [ ] **Step 3: Implement `getCurrentPayPeriodMonth` and `getAdjacentPayPeriodMonth` in `app.js`**
```javascript
function getCurrentPayPeriodMonth(baseDate = new Date()) {
    const d = baseDate.getDate();
    const m = baseDate.getMonth();
    const gYear = baseDate.getFullYear();

    let targetMIdx = m;
    let targetGY = gYear;

    if (d >= 16) {
        targetMIdx = (m + 1) % 12;
        if (m === 11) {
            targetGY += 1;
        }
    }

    const thaiYear = targetGY + 543;
    return `${THAI_MONTHS[targetMIdx]} ${thaiYear}`;
}

function getAdjacentPayPeriodMonth(monthLabel, direction = 1) {
    const match = String(monthLabel || '').match(/^(.+?)\s+(\d{4})$/);
    let mIdx = match ? THAI_MONTHS.indexOf(match[1].trim()) : -1;
    let thaiYear = match ? Number(match[2]) : (new Date().getFullYear() + 543);
    
    if (mIdx < 0) {
        mIdx = new Date().getMonth();
    }

    let nextMIdx = mIdx + direction;
    let nextThaiYear = thaiYear;

    if (nextMIdx > 11) {
        nextMIdx = 0;
        nextThaiYear += 1;
    } else if (nextMIdx < 0) {
        nextMIdx = 11;
        nextThaiYear -= 1;
    }

    return `${THAI_MONTHS[nextMIdx]} ${nextThaiYear}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `node new-features.test.js`
Expected: PASS

---

### Task 2: Half-Day Leave (ลาครึ่งวัน) Calculation Logic

**Files:**
- Modify: `app.js`
- Test: `new-features.test.js`

**Interfaces:**
- Consumes: `c.baseSalary`, `c.baseDays`, `c.breakfastRate`, `c.travelRate`, `c.targetRate`, `i.daysWorked`, `i.halfDays`
- Produces: `calculations.baseWagePay`, `calculations.halfDays`, `calculations.breakfastPay`, `calculations.travelPay`, `calculations.targetPay`

- [ ] **Step 1: Write failing tests for half-day leave calculations in `new-features.test.js`**
Test cases:
1. `daysWorked = 24`, `halfDays = 1`, `baseSalary = 12500`, `baseDays = 30`:
   - `dailyRate = 416.6667`
   - `halfDayWageDeduction = 1 * (416.6667 * 0.5) = 208.3333`
   - `baseWagePay = 12500 - 208.3333 = 12291.6667`
   - `breakfastPay = (24 + 1) * 60 = 1500`
   - `travelPay = (24 + 1) * 105 = 2625`
   - `targetPay = 24 * 100 = 2400` (no target pay for half days)
   - `otFoodPay = 0` (no ot food for half days)

- [ ] **Step 2: Run test to verify failure**
Run: `node new-features.test.js`
Expected: FAIL

- [ ] **Step 3: Update `DEFAULT_INPUTS`, `cloneInputs`, and `calculatePayroll` in `app.js`**
```javascript
const DEFAULT_INPUTS = {
    daysWorked: 0,         // วันทำงานจริง (เต็มวัน)
    halfDays: 0,           // วันลาครึ่งวัน
    otDays: 0,             // จำนวนวันที่มีโอที (จ-ศ)
    weekendDays: 0,        // วันทำงานวันหยุด (ส-อา)
    shiftDays: 0,          // วันเข้ากะดึก
    bonus: 0               // โบนัสเพิ่มเติม
};
```
Update `calculatePayroll`:
```javascript
const hasIncomeInput =
    Number(i.daysWorked || 0) > 0 ||
    Number(i.halfDays || 0) > 0 ||
    Number(i.otDays || 0) > 0 ||
    Number(i.weekendDays || 0) > 0 ||
    Number(i.shiftDays || 0) > 0 ||
    Number(i.bonus || 0) > 0;

const dailyRate = c.baseSalary / c.baseDays;
const halfDaysCount = Number(i.halfDays || 0);
const halfDayDeduction = halfDaysCount * (dailyRate * 0.5);
const baseWagePay = hasIncomeInput ? Math.max(0, c.baseSalary - halfDayDeduction) : 0;

// Allowances:
const breakfastPay = (Number(i.daysWorked || 0) + halfDaysCount) * c.breakfastRate;
const travelPay = (Number(i.daysWorked || 0) + halfDaysCount) * c.travelRate;
const targetPay = Number(i.daysWorked || 0) * c.targetRate; // half-days don't get target pay
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `node new-features.test.js`
Expected: PASS

---

### Task 3: HTML Markup & CSS Styles for Calendar & Half-Day UI

**Files:**
- Modify: `index.html`
- Modify: `style.css`

**UI Additions:**
1. **Calendar Modal Header:**
   - Add `<button id="calPrevMonthBtn" class="cal-nav-btn"><i data-lucide="chevron-left"></i></button>`
   - Add `<button id="calNextMonthBtn" class="cal-nav-btn"><i data-lucide="chevron-right"></i></button>`
   - Add `<button id="calTodayBtn" class="btn btn-secondary btn-sm cal-today-btn"><i data-lucide="crosshair"></i><span>วันนี้ (รอบปัจจุบัน)</span></button>`
2. **Calendar Grid & Legend:**
   - Add legend: `🌓 ลาครึ่งวัน` with `.dot-halfday`
   - Add `.b-halfday` mini-badge CSS
   - Add `.cal-day-cell.is-today` styling (neon border glow + "วันนี้" badge)
3. **Calendar Day Editor:**
   - Add `<button type="button" class="day-toggle-btn" id="toggleDayHalfDay" data-type="halfDay"><i data-lucide="hourglass"></i><span>ลาครึ่งวัน (ได้ 0.5 แรง)</span></button>`
4. **Calendar Summary Bar:**
   - Add `<div class="cal-summary-item"><small>ลาครึ่งวัน</small><strong id="calSumHalfDays">0</strong></div>`
5. **Dashboard Tab Sliders:**
   - Add Half-Day slider `#inputHalfDays` and number input `#inputHalfDaysNum` with icon `hourglass` or `calendar-off`.
6. **Salary Table:**
   - Add row for base wage / half-day deduction adjustment when half days exist.
   - Update breakdown pills to show `วันทำงานเต็มวัน` and `วันลาครึ่งวัน`.

- [ ] **Step 1: Add HTML elements in `index.html`**
- [ ] **Step 2: Add CSS rules in `style.css` for responsive mobile layout & today glow**
- [ ] **Step 3: Verify with markup tests in `new-features.test.js`**
Run: `node new-features.test.js`

---

### Task 4: Calendar Interaction & State Synchronization

**Files:**
- Modify: `app.js`
- Test: `new-features.test.js`

**Logic to wire:**
1. In `showCalModal()`:
   - Calculate `modalActiveMonth = getCurrentPayPeriodMonth()`.
   - Update modal title and render calendar for `modalActiveMonth`.
2. In `renderCalendarModal()`:
   - Identify today's key `YYYY-MM-DD` and add `.is-today` class and `<span class="cal-today-tag">วันนี้</span>`.
   - Render `.b-halfday` badge if `record.halfDay` is true.
   - When marking `halfDay = true`, ensure mutually exclusive or adjusted state with full `worked` (if marked as half day, it records `halfDay: true, worked: false`).
3. In `syncCalendarToSliders()`:
   - Count `halfDays` and set `state.inputs.halfDays = halfDays`.
   - Set `state.currentMonth = modalActiveMonth`.
   - Update `#currentMonthSelect` value.
   - Recalculate all payroll metrics and show toast.
4. Navigation buttons:
   - `calPrevMonthBtn`: `modalActiveMonth = getAdjacentPayPeriodMonth(modalActiveMonth, -1); renderCalendarModal();`
   - `calNextMonthBtn`: `modalActiveMonth = getAdjacentPayPeriodMonth(modalActiveMonth, 1); renderCalendarModal();`
   - `calTodayBtn`: `modalActiveMonth = getCurrentPayPeriodMonth(); renderCalendarModal();`

- [ ] **Step 1: Write integration tests in `new-features.test.js`**
- [ ] **Step 2: Implement handlers in `app.js`**
- [ ] **Step 3: Run all tests to verify passing**
Run: `node new-features.test.js`

---

### Task 5: Full Regression Testing & UI Verification

**Files:**
- All test suites: `phase1-regression.test.js`, `phase2-regression.test.js`, `phase3-regression.test.js`, `pwa-pin-regression.test.js`, `new-features.test.js`

- [ ] **Step 1: Run all test suites**
```bash
node phase1-regression.test.js
node phase2-regression.test.js
node phase3-regression.test.js
node pwa-pin-regression.test.js
node new-features.test.js
```
- [ ] **Step 2: Inspect in browser / automated subagent for mobile responsiveness (390px)**
- [ ] **Step 3: Confirm all constraints met**
