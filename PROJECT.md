# SalaryHub — Project Overview

## Purpose
SalaryHub is a privacy-first, client-side personal payroll and expense management Progressive Web App (PWA). It specializes in Thai labor payroll rules: shift/OT recording (16th-15th pay period), half-day leave deductions, social security cap, Thai Personal Income Tax (P.N.D.91 progressive rate estimation), expense budgeting, savings goal tracking, and local PIN security.

## Technology Stack
- **Frontend:** Vanilla HTML5, Vanilla CSS3, Vanilla ES6+ JavaScript
- **PWA:** Service Worker (`sw.js`), Web App Manifest (`manifest.json`), Offline Cache
- **Storage:** Browser `localStorage` (Client-Side only, privacy-first)
- **Runtime / Test:** Node.js (v16+) test runner with custom regression scripts

## Architecture & Important Files
- `index.html`: UI views (Overview, Payroll, Expenses, Analytics, Settings, PIN overlay modal)
- `style.css`: Glassmorphism theme, dark/light color palette (#0b101e, #00f5d4, #00bbf9), responsive mobile layouts
- `app.js`: Payroll calculation formulas, calendar sync, local storage state store, export/import JSON
- `sw.js`: Service worker caching core static assets for offline PWA operation
- `manifest.json`: Web app manifest with icon configurations
- `icons/`: Icon assets (`icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`)
- `generate-icons.js`: Node.js script generating PNG icons from mathematical buffer calculations
- `HANDOVER.md`: Comprehensive business logic, formula reference, and architecture guide

## Important Constraints
- 100% offline capability.
- No remote backend or tracking.
- All payroll calculations must match existing business rules and pass automated regression tests.
