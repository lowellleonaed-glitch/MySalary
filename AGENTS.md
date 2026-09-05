# AI Working Rules — SalaryHub

## 1. Coding & Tech Stack Rules
- **Stack:** Vanilla HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+), Node.js (test runner / utility scripts).
- **Styling:** Vanilla CSS (`style.css`), Glassmorphism dark/light mode system. Do NOT introduce TailwindCSS or heavy CSS frameworks unless requested.
- **Client-Side Only:** 100% Client-side local storage (`localStorage`). No external cloud/backend APIs or databases without permission.
- **PWA & Offline:** Preserve Service Worker (`sw.js`) and PWA manifest (`manifest.json`) integrity. All assets must work offline.

## 2. Testing Requirements
- Run regression tests using `npm test` before concluding non-trivial changes.
- Existing regression suites:
  - `delete-expense-regression.test.js`
  - `expense-input-focus-regression.test.js`
  - `new-features.test.js`
  - `phase1-regression.test.js`, `phase2-dataflow.test.js`, `phase2-regression.test.js`, `phase3-dataflow.test.js`, `phase3-regression.test.js`
  - `pwa-pin-regression.test.js`

## 3. Important Constraints & Protected Files
- `app.js`: Core calculation engine and state management. Exercise caution when editing payroll formula functions (`calcSalary`, `calculateNetPay`, `calcTax91`).
- `sw.js`: Cache versioning must be updated when core assets change.
- Do NOT delete or rewrite user data schemas in `localStorage` without backwards compatibility.
