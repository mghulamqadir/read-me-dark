# Read Me Dark

Read Me Dark is a browser-local PDF reader for focused reading sessions. PDFs are processed with PDF.js in the browser and are never uploaded by the application.

## Features

- PDF picker and drag-and-drop upload with inline validation
- Continuous virtualized scrolling and progressive page rendering
- Midnight, OLED Black, Sepia, Soft Dark, and Light themes
- Persisted reader-interface typography preferences
- Compact typography, theme, width, zoom, marker, and sidebar toolbar
- Automatic page/scroll restoration plus one local resume marker per PDF
- Keyboard page navigation, fullscreen, and metadata-only recent documents

## Run locally

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

## Privacy and Limitations

The reader stores preferences, document progress, and one manual marker per PDF in `localStorage`. It does not store PDF blobs, so a recent document must be selected again before it can be reopened. Typography controls affect the reader interface only; they do not reflow an authored PDF.
