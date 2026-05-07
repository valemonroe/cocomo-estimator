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

## RAG benchmark corpus (COCOMO + industry proxies)
The corpus at `rag/cocomo_benchmark_rag.jsonl` was regenerated as a richer v2 seed set for retrieval pipelines.

What changed:
- Added a metadata row describing schema expectations and corpus versioning.
- Expanded canonical COCOMO entries with stable retrieval fields (`kind`, `full_name`, `rating_scale`, `retrieval_tags`).
- Preserved key COCOMO parameters (DM, CM, IM, RELY, DATA, CPLX, ACAP, PCAP, TOOL, SITE).
- Kept Jellyfish and Swarmia as **calibration proxies** (not direct EM/SF replacements).

Suggested ingestion:
- Treat each JSONL line as one chunk/document.
- Index `parameter`, `category`, `kind`, `retrieval_tags`, `notes`, `authority`, and `source_url`.
- Prefer `kind=canonical_cocomo` hits for direct parameter values; use `kind=industry_proxy` for calibration context.

