# Project Progress

## Current Status
iOS Safari "Add to Home Screen" icon fix implemented and verified across all 9 test suites.

## Completed
- Fixed iOS Safari Home Screen fallback monogram issue.
- Removed SVG from `manifest.json` `icons` array to prevent iOS WebKit manifest parser failures.
- Prioritized `<link rel="apple-touch-icon">` tags ahead of `<link rel="manifest">` in `<head>`.
- Added `?v=2` cache-busting query strings to bust Safari's persistent icon failure cache.
- Bumped Service Worker cache version to `salaryhub-v30` and enabled `ignoreSearch: true` in `caches.match`.
- Updated `tests/pwa-pin-regression.test.js` and confirmed 100% test pass rate across all 9 regression suites.

## Recent Changes
- `manifest.json`: Defined PNG-only icons (`icon-192.png`, `icon-512.png`) with clean `any` and `maskable` purposes.
- `index.html`: Reordered `<head>` tags to prioritize Apple Touch Icons with cache-busting `?v=2`.
- `sw.js`: Bumped cache to `salaryhub-v30` and added `ignoreSearch: true`.
- `scripts/generate-icons.js`: Added generation of `apple-touch-icon-180x180.png` and root fallbacks.
- `tests/pwa-pin-regression.test.js`: Added regression assertions for manifest SVG exclusion and apple-touch-icon tag ordering.

## Next
Waiting for user confirmation on iPhone device.


