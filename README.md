# NightReader — Next.js PDF Dark Mode Reader

A small Next.js App Router project for opening local PDF books and reading them in Light, Dark, or Sepia mode.

## Features

- Local PDF upload and drag/drop
- Light, Dark, and Sepia reader themes
- Theme saved in `localStorage`
- Previous/next page controls
- Keyboard page navigation with Left/Right arrows
- Zoom controls
- Responsive layout
- PDF.js rendered through `react-pdf`
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

## How PDF dark mode works

PDF pages are rendered to canvas by PDF.js. The starter applies a visual filter to the rendered canvas for Dark and Sepia themes. This works especially well for text-heavy PDFs.

Because a PDF canvas can contain text, photos, illustrations, and backgrounds in the same bitmap, a simple visual filter also changes embedded images. If you need image-preserving dark mode for arbitrary PDFs, the next step is a content-aware PDF rendering pipeline that treats text/vector content and raster images separately.

## Main files

- `app/page.tsx` — loads the PDF reader client-side
- `components/PdfReader.tsx` — upload, PDF.js worker, navigation, theme state
- `app/globals.css` — application and reader themes
- `types/reader.ts` — theme type
