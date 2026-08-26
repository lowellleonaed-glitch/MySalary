# Design Specification: Pay Period Auto-Sync & Half-Day Leave Calculation

- **Date:** 2026-08-17
- **Project:** SalaryHub (ระบบบันทึกรายรับ-รายจ่ายเงินเดือน)
- **Status:** Approved

---

## 1. Overview & Business Goals

This feature enhances SalaryHub in two key areas:
1. **Pay Period Auto-Sync (16th-to-15th Cycle):** When opening the OT/Shift Calendar Modal, the calendar automatically selects the active payroll cycle based on the current real-world date. If today is the 16th or later, it jumps to the next month's payroll cycle (e.g. 17 Aug -> Sep 2569 cycle: 16 Aug - 15 Sep). If today is the 1st-15th, it opens the current month's payroll cycle (e.g. 5 Aug -> Aug 2569 cycle: 16 Jul - 15 Aug). It also adds quick month navigation (`<` / `>`), a "📍 วันนี้ (รอบปัจจุบัน)" jump button, and a visual highlight for today's cell.
2. **Half-Day Leave Calculation (ลาครึ่งวัน):** Adds support for tracking half-day leave days. A half-day leave earns half a day's basic wage (`dailyRate * 0.5`), full breakfast allowance (`breakfastRate`), and full travel/fuel allowance (`travelRate`), but earns **no target allowance** (`targetRate = 0`) and **no OT food allowance** (`otFoodRate = 0`).

---

## 2. Pay Period Auto-Sync Architecture

### 2.1 Current Active Pay Period Formula
Function `getCurrentPayPeriodMonth(baseDate = new Date())`:
- Extract day `d = baseDate.getDate()`, month `m = baseDate.getMonth()`, year `gYear = baseDate.getFullYear()`.
- If `d >= 16`:
  - Target month index: `(m + 1) % 12`
  - Target year (AD): `gYear + (m === 11 ? 1 : 0)`
  - Target Thai Year: `gYear + (m === 11 ? 1 : 0) + 543`
- If `d < 16`:
  - Target month index: `m`
  - Target year (AD): `gYear`
  - Target Thai Year: `gYear + 543`
- Returns formatted string: `${THAI_MONTHS[targetMonthIdx]} ${targetThaiYear}` (e.g. `"กันยายน 2569"`).

### 2.2 Calendar Modal Interactions
- **On Modal Open:** Default active calendar month is set to `getCurrentPayPeriodMonth()`.
- **Navigation Controls:**
  - Header displays: `[ < ก่อนหน้า ] [ รอบ 16 ก.ค. - 15 ส.ค. (สิงหาคม 2569) ] [ ถัดไป > ]` and a `[ 📍 วันนี้ ]` button.
  - User can browse past/future months inside the modal.
- **Today Highlight:**
  - The cell matching today's ISO date string `YYYY-MM-DD` receives `.is-today` class with a glowing accent border and `วันนี้` pill badge.
- **Sync Action ("บันทึก & ซิงก์คำนวณเงินเดือน"):**
  - Reads calendar data for the selected modal month.
  - Updates `state.inputs` (daysWorked, halfDays, otDays, shiftDays, weekendDays).
  - Switches `state.currentMonth` and the main month selector to this month.
  - Triggers `calculateAll()`, `updateChart()`, `saveDataToLocalStorage()`, and displays success toast.

---

## 3. Half-Day Leave (ลาครึ่งวัน) Calculation Engine

### 3.1 State & Input Model
- Add `halfDays: 0` to `DEFAULT_INPUTS` and `state.inputs`.
- Add `halfDay: false` property to calendar day records in `state.monthlyData[month].calendar[dateKey]`.

### 3.2 Calculation Rules
Given:
- `c.baseSalary`: Base monthly salary (e.g. 12,500 THB)
- `c.baseDays`: Base divisor days (e.g. 30 days)
- `dailyRate = c.baseSalary / c.baseDays` (e.g. 416.6667 THB/day)
- `halfDayWage = dailyRate * 0.5` (e.g. 208.3333 THB/day)

Calculations:
1. **Base Salary / Wage Paid (`baseWagePay`):**
   - If `i.halfDays > 0`: `c.baseSalary - (i.halfDays * (dailyRate * 0.5))`
   - If `i.halfDays === 0`: `c.baseSalary` (when income inputs exist)
2. **Breakfast Allowance (`breakfastPay`):**
   - `(i.daysWorked + i.halfDays) * c.breakfastRate`
3. **Travel / Fuel Allowance (`travelPay`):**
   - `(i.daysWorked + i.halfDays) * c.travelRate`
4. **Target Allowance (`targetPay`):**
   - `i.daysWorked * c.targetRate` (Half-day leaves do NOT receive target pay)
5. **OT Food Allowance (`otFoodPay`):**
   - `(i.otDays + i.weekendDays) * c.otFoodRate` (Half-day leaves do NOT receive OT food)

### 3.3 UI Components
1. **Dashboard Tab:**
   - Add "วันลาครึ่งวัน" slider & compact number input (`inputHalfDays`, `inputHalfDaysNum`) in the input controls section.
2. **Salary Breakdown Table:**
   - Add row or badge detailing `วันลาครึ่งวัน` and wage adjustment.
   - Update `ค่าอาหารเช้า` and `ค่าเดินทาง` badges to show `(ทำงาน X วัน + ลาครึ่งวัน Y วัน)`.
   - Update `ค่าเป้าหมาย` badge to show `(เฉพาะวันทำงานเต็ม X วัน)`.
3. **Calendar Modal:**
   - Add `🌓 ลาครึ่งวัน` toggle button in Day Editor (`#toggleDayHalfDay`).
   - Add `.b-halfday` mini-badge to day cells.
   - Add `ลาครึ่งวัน: N วัน` in the calendar live summary bar (`#calSumHalfDays`).

---

## 4. Verification Plan

### Automated Regression & Unit Tests
1. Verify `getCurrentPayPeriodMonth()` with dates `>= 16` and `< 16`, including December -> January rollover.
2. Verify `calculatePayroll()` with `halfDays > 0`:
   - Basic wage deduction = `halfDays * (dailyRate * 0.5)`.
   - Breakfast allowance includes `daysWorked + halfDays`.
   - Travel allowance includes `daysWorked + halfDays`.
   - Target allowance includes only `daysWorked`.
3. Verify calendar day toggle for `halfDay` and syncing to `inputHalfDays`.
4. Verify all existing tests pass with zero regression.

### Manual Verification
- Test opening calendar modal when system date is >= 16 (should show next month's pay period).
- Test clicking `<` and `>` in calendar modal.
- Test marking full days, half-days, OT, shift, and syncing to Dashboard.
- Verify mobile viewport (390px iPhone 13) layout and touch targets.
