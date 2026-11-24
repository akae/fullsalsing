# FULL Salsing — ASCII logo

An animated, terminal-style ASCII rendition of the FULL Salsing sticker,
built in the spirit of the [Ghostty](https://ghostty.org/) hero: dense ASCII
lettering, a dark terminal panel, and a living, shimmering surface.

Open the demo directly in a browser:

```
ascii/fullsalsing-ascii.html
```

`ascii/fullsalsing-ascii.txt` is the same artwork as plain text.
`ascii/fullsalsing-ascii.gif` is a small looping preview of the motion
(regenerate it with `--gif`).

## How it's made

The sticker's fine script and keylines are too detailed to survive at
character resolution, so the wordmark is rebuilt as clean shapes and then
knocked down to a character grid. Black keylines become empty cells, which
is what makes the letters separate and readable.

- **Archivo Black** for `FULL` (vertically stretched to match the sticker)
- **Lobster Two Bold Italic** for `Salsing` (rotated like the sticker)
- a tapered swoosh drawn with a Bézier curve

Those shapes are filled with the brand gradient (`#ff1e82` → coral →
`#ffd15c` on FULL, cream → pink on the script), sampled into a character
grid, and given a bright keyline. The script gets a brighter rim so it
stays legible at ~200 columns.

The web version is static text with CSS-only motion:

- whole-logo float + slow per-row ripple
- single-character twinkles
- drifting ember glyphs
- respects `prefers-reduced-motion`

No canvas, no JS animation loop, no external assets.

## Regenerate

```bash
python3 -m pip install pillow numpy scipy
python3 scripts/generate_ascii_logo.py
```

Optional: `--width 240` for a denser grid (and a wider file), `--out DIR`
to write somewhere other than `ascii/`, `--gif` to refresh the preview.

The main site's `matrix` egg now shows `ascii/fullsalsing-ascii.gif` directly.
The old `--site-js` option still builds the live-text header asset for
experiments, but the site no longer uses it. If you regenerate the GIF, bump
the `?v=` query in `matrix.js`.

## Fonts

The two TTFs live in `scripts/fonts/` with their SIL Open Font License
files. They are only needed when regenerating the artwork; the generated
HTML embeds no fonts and uses the system monospace stack.
