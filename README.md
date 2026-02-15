# intora.net

Constrained creative coding. Each piece in the INT Series is a self-contained generative artwork built within a fixed set of constraints: monospace text characters, a single colour palette, and canvas rendering.

The site presents as a terminal-style signal archive — every element, from the catalogue to error states, exists within the same fiction.

## INT Series

| # | Title | Description |
|---|-------|-------------|
| INT/001 | DRIFT | Flow field rendered through oriented text characters |

Each piece has an accompanying **analysis** page documenting the concept, technique, and iteration history. The catalogue renders live Canvas thumbnails of each piece.

## Constraints

- **Characters only** — no images, no SVG, no WebGL. Everything is `fillText` on a 2D canvas.
- **Amber Schematic palette** — 10 colours from deep brown-black to accent orange. No white, no system grays.
- **Geist Mono** — monospace-first typography throughout.
- **Desktop only** — these are meant to be seen on a screen you sit in front of.

## Stack

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Geist fonts, Tone.js (audio scaffold), static generation on Vercel.

## Development

```
npm install
npm run dev
```

## License

Code is released under the [ISC License](LICENSE). Creative works (piece designs, analysis content, visual output) are copyright their author — all rights reserved.
