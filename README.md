# COCOMO II Modernization Estimator V3

A client-side React + Vite + Electron app for COCOMO II-style modernization sizing, effort, schedule, and cost estimation.

## Local dev (web)
```bash
npm ci
npm run dev
```

## Production build (static web)
```bash
npm run build
npm run preview
```

## Electron (desktop)
Dev (runs Vite + Electron together):
```bash
npm run electron-dev
```

Package (creates installer via electron-builder):
```bash
npm run electron-build
```
### Build and Deploy to gh-pages
```bash
npm run build
npm run deploy
```

## Enterprise deployment bundle
Creates a zip of the `dist/` output plus deployment notes:
```bash
npm run build:enterprise
```
Output is written to `enterprise/bundle/`.

## Notes
- Tooltip text is scrollable and wraps, so long help tables are readable.
- Range validation is enforced per field using `src/data/ranges.ts`.
- "Next" is disabled when the current step has invalid values.
