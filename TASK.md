# Current Task

## Goal
Fix iOS Safari "Add to Home Screen" (เพิ่มไปยังหน้าจอโฮม) icon issue where Safari displays the first letter monogram instead of the custom SalaryHub app icon.

## Current Phase
Completed

## Completed
- [x] Researched root cause of iOS Safari "first letter monogram" fallback.
- [x] Identified root causes:
  1. `manifest.json` contained SVG (`icons/icon.svg`) as the first icon which iOS WebKit fails to process for Home Screen shortcuts.
  2. `<link rel="manifest">` was placed before `<link rel="apple-touch-icon">` in `<head>`.
  3. Safari aggressive icon caching of previously failed / missing icons requires cache-busting version query string (`?v=...`) and cache clearance instructions.
  4. Redundant / legacy tags (`apple-touch-icon-precomposed`) and relative path fallbacks needed refinement.
  5. Service worker cache name needed bumping to `salaryhub-v30` and support `ignoreSearch: true` for cached assets.
- [x] Updated `manifest.json` to include only standard PNG icons (192x192, 512x512) and valid purposes (`any`, `maskable`).
- [x] Updated `index.html` to prioritize `<link rel="apple-touch-icon">` before manifest, added cache-busting query `?v=2`, and linked multi-resolution touch icons.
- [x] Updated `sw.js` cache name to `salaryhub-v30` and added `ignoreSearch: true` in `caches.match`.
- [x] Updated `scripts/generate-icons.js` to output `apple-touch-icon-180x180.png` and root fallbacks.
- [x] Updated automated test assertions in `tests/pwa-pin-regression.test.js` to prevent regressions.
- [x] Verified 100% pass across all 9 automated test suites (`npm run test:all`).

## In Progress
- None

## Remaining
- Deliver concise instructions to user on how to verify on iPhone Safari.

## Important Context
- iOS Safari strictly requires high-resolution PNG for Apple Touch Icon and does not support SVG icons from manifest.
- Safari caches Home Screen icon failures aggressively in memory/WebKit cache. Clearing Safari cache or using Private Browsing tab forces an immediate reload.

## Known Problems
- None.

## Blockers
- None.

## Next Action
Explain root cause, fixes applied, and provide step-by-step instructions for testing on iPhone Safari.




