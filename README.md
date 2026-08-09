# Read Me Dark

Read Me Dark is a browser-local PDF reader for focused reading sessions. PDFs are parsed and rendered with PDF.js in the browser and are never uploaded by the application.

Built with Next.js 16, React 19, TypeScript, `react-pdf`, and `@tanstack/react-virtual`.

## Features

- PDF picker and drag-and-drop upload with inline validation
- Continuous virtualized scrolling with progressive page rendering
- Local PDF text search with result navigation and highlights
- Midnight, OLED Black, Sepia, Soft Dark, and Light themes
- Persisted reader-interface typography, layout, zoom, and sidebar preferences
- Accurate scroll-based reading progress with automatic page/scroll restoration
- One local resume marker per PDF
- Keyboard page navigation, fullscreen mode, and metadata-only recent documents
- Custom RMD video loading screen while the app loads and while PDF.js parses a document

## Project Structure

- `app/` - Next.js App Router entry points and global reader styles
- `components/` - Reader UI, PDF viewport, virtualized pages, and loading screen
- `hooks/` - PDF reader state, search, preferences, progress, and render gating
- `lib/` - Reader constants, theme configuration, and localStorage helpers
- `public/loaders/` - Static loading-screen media assets
- `types/` - Shared reader TypeScript types

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run build
```

## Privacy

Read Me Dark keeps PDF files on the device. It stores preferences, document progress, recent-document metadata, and one manual marker per PDF in `localStorage`.

It does not store PDF blobs, so a recent document must be selected again before it can be reopened. Typography controls affect the reader interface only; they do not reflow an authored PDF.
