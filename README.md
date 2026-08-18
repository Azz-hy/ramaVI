# KSECS Proposal Site

A modern, one-page presentation site for the KSECS proposal — one video per
section, presented publicly to an audience. No uploading, no backend, no
build step: videos are just read from a local folder.

## How to use it

1. Copy your section videos into the [videos](videos) folder using the file
   names listed in [videos/README.txt](videos/README.txt) (e.g.
   `01-executive-summary.mp4`), or edit the `src` paths in
   [js/config.js](js/config.js) to match whatever you name them.
2. Open [js/config.js](js/config.js) to edit any text, stats, or add/remove
   sections and appendices.
3. Open `index.html` in a browser — or better, serve it locally (see below)
   for the most reliable video playback.

Local video playback works best when served over `http://` rather than opened
directly as a `file://` path (some browsers restrict autoplay/controls on
local files). To serve it locally:

```bash
python -m http.server 5500
```

then visit `http://localhost:5500` in your browser.

## Customizing

- Colors, fonts, and layout live in [css/style.css](css/style.css) (see the
  `:root` variables at the top for the color palette).
- All page text, section stats, and video paths live in
  [js/config.js](js/config.js) — no need to touch the HTML for everyday edits.
- The left-hand table of contents, scroll-progress bar, and per-section video
  players are generated automatically from `js/config.js`.
