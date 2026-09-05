# Current Task

## Goal
Fix iPhone "Add to Home Screen" icon not appearing in SalaryHub by mirroring the proven pattern from `D:\Project\รายรับรายจ่าย` (without touching `รายรับรายจ่าย`).

## Current Phase
Completed

## Completed
- [x] Researched and forensically compared `D:\Project\รายรับรายจ่าย` vs `D:\Project\เงินเดือน` (view-only on `รายรับรายจ่าย`).
- [x] Identified 4 core root causes of iOS Safari icon failure.
- [x] Aligned `index.html` Apple Touch Icon and PWA metadata with `รายรับรายจ่าย` pattern:
  - Single standard `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`
  - Clean URLs without query parameters (`?v=...`)
  - Root-absolute paths (`/apple-touch-icon.png`, `/favicon.svg`, `/favicon-32x32.png`, `/favicon-16x16.png`)
  - Removed oversized and competing touch icons.
- [x] Placed root icon assets: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `apple-touch-icon-precomposed.png`, `favicon.png`, `favicon.svg`.
- [x] Updated `manifest.json` with root-absolute icon paths and standard `start_url: "/"`.
- [x] Added `manifest.webmanifest` with MIME-compliant PWA specification.
- [x] Updated `sw.js` cache name to `salaryhub-v31` and cached all root static assets.
- [x] Verified zero modifications in `D:\Project\รายรับรายจ่าย` (`git status` clean).
- [x] Verified 100% pass across all 9 automated test suites (`npm run test:all`).

## In Progress
- None

## Remaining
- Instruct user on testing via Safari Private Browsing or clearing Safari cache on iPhone.

## Important Context
- Never touch anything in `D:\Project\รายรับรายจ่าย` (read-only reference).
- iOS WebBookmark daemon caches icon failures aggressively; clearing Safari cache or testing in a new Private tab allows instant validation.

## Known Problems
- None.

## Blockers
- None.

## Next Action
Deliver concise summary and testing instructions to the user.





