# Project Progress

## Current Status
All 9 regression test suites pass (`npm run test:all`). Backup Export/Import (JSON) has been permanently removed from the UI and codebase; the app remains 100% local-first with `localStorage`.

## Completed
- Removed the unused backup export/import feature completely:
  - Deleted `buildBackupPayload()` and `validateBackupPayload()` from `app.js`.
  - Backup buttons/input were already removed from `index.html` in commit `7f3975f`.
- Updated stale regression tests to match the current UI and code:
  - `tests/phase3-regression.test.js` no longer asserts `exportBackupBtn` / `importBackupInput` / backup functions.
  - `tests/phase3-dataflow.test.js` no longer references backup payload functions.
  - `tests/pwa-pin-regression.test.js` no longer tests backup payload PIN preservation.
- Updated `README.md` feature list to remove the Export/Import claim.
- Bumped Service Worker cache from `salaryhub-v34` to `salaryhub-v35`.

## Recent Changes
- `app.js`: dead backup payload functions removed.
- `tests/phase3-regression.test.js`, `tests/phase3-dataflow.test.js`, `tests/pwa-pin-regression.test.js`: synced with removal.
- `README.md`: feature list updated.
- `sw.js`: cache version bumped to `v35`.

## Next
- Manual verification on iPhone Safari (PWA install / Home Screen icon).
- Future roadmap: Excel/CSV export, cloud sync, shift management, advanced tax planning (see `docs/HANDOVER.md`).
