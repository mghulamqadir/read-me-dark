# NightReader - Next.js PDF Dark Mode Reader

A local-first Next.js PDF reader with continuous scrolling, virtualized pages, and Light, Dark, and Sepia reading modes.

## Features

- Local PDF upload and drag/drop
- Light, Dark, and Sepia reader themes
- Theme saved in `localStorage`
- Continuous scrolling with virtualized pages for large books
- Page-number jumps, previous/next controls, and Left/Right keyboard navigation
- Zoom controls, including Ctrl + scroll / trackpad pinch
- Fullscreen reading
- Responsive layout
- PDF.js rendered through `react-pdf`
- PDF.js `pageColors` for Dark and Sepia modes, preserving original embedded-image pixels
- No upload API: selected PDFs remain in the browser

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Production build

```bash
npm run build
npm start
```

## How Dark Mode Works

Dark and Sepia modes are passed to PDF.js through `react-pdf`'s `pageColors` option. PDF.js uses those colors during rendering rather than applying a CSS canvas filter after rendering.

This avoids color-inverting or degrading embedded raster images. A PDF whose page is entirely a scanned image cannot gain a true dark background without altering that source image; in that case the reader preserves the original pixels.

## Performance

Only the pages around the current scroll position are mounted. PDF rendering is limited to a small concurrent queue so jumping to a distant page progressively renders the target page and its neighbors without attempting to paint the whole document.

## Generated Files

`tsconfig.tsbuildinfo` is TypeScript's incremental-build cache. It is generated locally because `incremental` is enabled in `tsconfig.json`; it is not required to run, build, or deploy the app and is ignored by Git.

## Main files

- `app/page.tsx` — loads the PDF reader client-side
- `components/PdfReader.tsx` — reader composition and browser-only upload/fullscreen controls
- `components/reader/` — header, landing state, sidebar, toolbar, PDF viewport, and virtual PDF page
- `hooks/usePdfReader.ts` — PDF lifecycle, virtual scrolling, navigation, theme persistence, and zoom behavior
- `hooks/usePageRenderGate.ts` — bounded PDF page rendering queue
- `lib/reader.ts` — reader constants and pure helpers
- `app/styles/reader.css` — reader styling and theme tokens
- `types/reader.ts` — shared theme type
