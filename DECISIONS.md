# Architecture & Design Decisions

## 2026-09-05: Adoption of Concept B for SalaryHub Brand Icon & PWA Assets

- **Context:** SalaryHub needed a cohesive, modern app icon for PWA installation, browser favicon, and mobile home screen shortcut.
- **Options Evaluated:**
  - Concept A: Holographic Glass Wallet & Upward Growth Arrow (Rich 3D glassmorphism)
  - Concept B: Cyber Geometric 'S' Monogram & Hub Growth Emblem (Minimalist Fintech / Cyberpunk)
  - Concept C: Vault Shield & Golden Salary Stack (Isometric 3D security)
- **Decision:** Selected **Concept B** per user preference.
- **Rationale:**
  - Highly legible at small dimensions (16x16, 32x32 favicon) while retaining futuristic detail at 512x512.
  - Combines the 'S' monogram with financial growth bar charts and a 45-degree ascending arrow.
  - Aligns with the core dark navy (`#0b101e`) and neon cyan/mint (`#00f5d4` / `#00bbf9`) palette of the app.
- **Implementation Assets:**
  - Vector source: `icons/icon.svg`
  - High-res raster master: `icons/master-concept-b.jpg`
  - PWA icons: `icons/icon-512.png`, `icons/icon-192.png`, `icons/apple-touch-icon.png`
  - Favicons: `favicon.ico`, `icons/favicon.png`
  - Reproducible generation script: `generate-icons.py`
