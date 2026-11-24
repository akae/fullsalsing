#!/usr/bin/env python3
"""
Generate the animated ASCII version of the FULL Salsing logo.

The logo is rebuilt as clean, solid lettering (Archivo Black for FULL,
Lobster Two for the script) so it survives being reduced to a character
grid, then coloured with the brand's pink -> orange -> yellow gradient.
Black keylines are left as empty cells, exactly like the sticker's ink.

Writes:
    ascii/fullsalsing-ascii.html   self-contained terminal-style demo
    ascii/fullsalsing-ascii.txt    plain-text art

The demo is intentionally cheap to animate: the art is static text, and a
handful of CSS animations (float, per-row wave, twinkles, embers) make it
breathe. No frames, no canvas, no dependencies.

Requires: pillow, numpy, scipy
    python3 -m pip install pillow numpy scipy
"""

from __future__ import annotations

import argparse
import json
import math
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = Path(__file__).resolve().parent / "fonts"
OUT_DIR = ROOT / "ascii"

CANVAS_W, CANVAS_H = 2200, 1240
SS = 2  # supersampling factor for the vector composition

# Brand palette used for both the source colours and the HTML runs.
PALETTE = [
    (255, 43, 138),   # hot pink
    (255, 70, 120),
    (255, 95, 105),
    (255, 120, 95),   # coral
    (255, 145, 85),
    (255, 170, 75),   # orange
    (255, 195, 65),
    (255, 220, 80),   # yellow
    (255, 240, 140),
    (255, 250, 205),  # cream
    (255, 246, 236),  # warm white
    (255, 190, 214),  # pale pink
    (255, 160, 196),
    (255, 130, 178),
    (255, 100, 162),
    (232, 64, 132),   # deep pink
]


def _hex(rgb: tuple[int, int, int]) -> str:
    return "#%02x%02x%02x" % rgb


def _bezier(p0, p1, p2, p3, n=300):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * p1[0] + 3 * (1 - t) * t * t * p2[0] + t ** 3 * p3[0]
        y = (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * p1[1] + 3 * (1 - t) * t * t * p2[1] + t ** 3 * p3[1]
        pts.append((x, y))
    return pts


def compose() -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Return (rgb, alpha, script-mask) for the vector logo at CANVAS size."""
    w, h = CANVAS_W, CANVAS_H
    layer_size = (w * SS, h * SS)

    def blank():
        return Image.new("L", layer_size, 0)

    # ---- FULL ----------------------------------------------------------
    font_full = ImageFont.truetype(str(FONT_DIR / "ArchivoBlack-Regular.ttf"), 600 * SS)
    tmp = blank()
    ImageDraw.Draw(tmp).text((0, 0), "FULL", font=font_full, fill=255)
    full = tmp.crop(tmp.getbbox())
    # The sticker's letters are taller / narrower than Archivo's defaults.
    full = full.resize((full.width, int(full.height * 1.34)), Image.LANCZOS)
    full_layer = blank()
    full_layer.paste(full, (120 * SS, 50 * SS))

    # ---- Salsing -------------------------------------------------------
    font_script = ImageFont.truetype(str(FONT_DIR / "LobsterTwo-BoldItalic.ttf"), 600 * SS)
    tmp = blank()
    ImageDraw.Draw(tmp).text(
        (0, 0), "Salsing", font=font_script, fill=255,
        stroke_width=4 * SS, stroke_fill=255,
    )
    script = tmp.crop(tmp.getbbox()).rotate(7, expand=True, resample=Image.BICUBIC)
    target = 1950 * SS
    script = script.resize((target, int(script.height * target / script.width)), Image.LANCZOS)
    script_layer = blank()
    script_layer.paste(script, (70 * SS, 515 * SS))

    # ---- swoosh --------------------------------------------------------
    swoosh_layer = blank()
    sd = ImageDraw.Draw(swoosh_layer)
    pts = _bezier(
        (0 * SS, 1220 * SS), (450 * SS, 1180 * SS),
        (1450 * SS, 1030 * SS), (2080 * SS, 850 * SS),
    )
    top, bot = [], []
    for i, (x, y) in enumerate(pts):
        t = i / (len(pts) - 1)
        x2, y2 = pts[min(i + 1, len(pts) - 1)]
        x1, y1 = pts[max(i - 1, 0)]
        ang = math.atan2(y2 - y1, x2 - x1)
        nx, ny = -math.sin(ang), math.cos(ang)
        thickness = (56 * (1 - t) ** 1.15 + 1.5) * SS
        top.append((x + nx * thickness, y + ny * thickness))
        bot.append((x - nx * thickness, y - ny * thickness))
    sd.polygon(top + bot[::-1], fill=255)

    # A couple of pixels of thickening keeps 1-cell strokes alive at
    # 200 columns without turning the script into a blob.
    full_layer = full_layer.filter(ImageFilter.MaxFilter(3))
    script_layer = script_layer.filter(ImageFilter.MaxFilter(5))
    swoosh_layer = swoosh_layer.filter(ImageFilter.MaxFilter(5))

    def down(layer):
        return np.asarray(layer.resize((w, h), Image.LANCZOS)).astype(float) / 255.0

    m_full, m_script, m_swoosh = down(full_layer), down(script_layer), down(swoosh_layer)

    ys, xs = np.mgrid[0:h, 0:w]

    # FULL: hot pink at the top, through coral, to yellow.
    g = np.clip((ys - 50) / (620 - 50), 0, 1)[..., None]
    pink = np.array([255, 30, 130])[None, None, :]
    coral = np.array([255, 120, 90])[None, None, :]
    yellow = np.array([255, 225, 90])[None, None, :]
    full_col = np.where(
        g < 0.55,
        pink * (1 - g / 0.55) + coral * (g / 0.55),
        coral * ((g - 0.55) / 0.45) + yellow * (1 - (g - 0.55) / 0.45),
    )

    # Script + swoosh: cream on the left to pink on the right.
    s = np.clip((xs - 60) / (2050 - 60), 0, 1)[..., None]
    script_col = np.array([255, 247, 214])[None, None, :] * (1 - s) + np.array([255, 150, 195])[None, None, :] * s
    swoosh_col = np.array([255, 250, 225])[None, None, :] * (1 - s) + np.array([255, 210, 105])[None, None, :] * s

    rgb = np.zeros((h, w, 3), float)
    rgb += full_col * m_full[..., None]
    rgb = rgb * (1 - m_swoosh[..., None]) + swoosh_col * m_swoosh[..., None]
    rgb = rgb * (1 - m_script[..., None]) + script_col * m_script[..., None]

    alpha = np.clip(m_full + m_script + m_swoosh, 0, 1)
    rgb *= alpha[..., None]
    return rgb, alpha, m_script


def build_art(width: int, cell_aspect: float = 0.5) -> tuple[list[str], list[list[int]]]:
    rgb, alpha, script_mask = compose()
    height = round(width * CANVAS_H / CANVAS_W * cell_aspect)

    small = np.asarray(
        Image.fromarray(rgb.astype("uint8")).resize((width, height), Image.LANCZOS)
    ).astype(float)
    a = np.asarray(
        Image.fromarray((alpha * 255).astype("uint8")).resize((width, height), Image.LANCZOS)
    ).astype(float) / 255.0
    smask = np.asarray(
        Image.fromarray((script_mask * 255).astype("uint8")).resize((width, height), Image.LANCZOS)
    ).astype(float) / 255.0 > 0.3

    r, g, b = small[..., 0], small[..., 1], small[..., 2]
    lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0
    mask = a > 0.32
    dist = ndimage.distance_transform_edt(mask)

    ys, xs = np.mgrid[0:height, 0:width]
    noise = (np.sin(xs * 12.9898 + ys * 78.233) * 43758.5453) % 1.0
    palette = np.asarray(PALETTE, float)

    rows: list[str] = []
    colours: list[list[int]] = []
    for y in range(height):
        chars: list[str] = []
        cols: list[int] = []
        for x in range(width):
            if not mask[y, x]:
                chars.append(" ")
                cols.append(-1)
                continue

            v = min(0.999, lum[y, x] + (noise[y, x] - 0.5) * 0.08)
            ch = "@" if v < 0.50 else ("%" if v < 0.80 else "#")

            rgbv = np.array([r[y, x], g[y, x], b[y, x]])
            idx = int(((palette - rgbv) ** 2).sum(1).argmin())
            col = PALETTE[idx]
            if smask[y, x] and dist[y, x] <= 1.35:
                # A brighter keyline makes the script survive at this size.
                ch = "*"
                col = (255, 246, 228)
            elif dist[y, x] <= 1.0:
                # Bright rim: the sticker's white keyline, in character form.
                col = tuple(min(255, int(c * 1.22 + 10)) for c in col)
            # Snap the final colour (rim included) back to the palette.
            col = tuple(int(c) for c in palette[int(((palette - np.array(col)) ** 2).sum(1).argmin())])
            chars.append(ch)
            cols.append(PALETTE.index(col))
        rows.append("".join(chars))
        colours.append(cols)

    # Crop to the ink plus a one-cell breathing margin.
    ink = [(x, y) for y, row in enumerate(rows) for x, c in enumerate(row) if c != " "]
    minx, maxx = max(0, min(x for x, _ in ink) - 1), min(width, max(x for x, _ in ink) + 2)
    miny, maxy = max(0, min(y for _, y in ink) - 1), min(height, max(y for _, y in ink) + 2)
    rows = [row[minx:maxx] for row in rows[miny:maxy]]
    colours = [row[minx:maxx] for row in colours[miny:maxy]]
    return rows, colours


def html_art(rows: list[str], colours: list[list[int]], twinkle: float = 0.016) -> str:
    """Rows of colour-run <span>s, with a few single-character twinkles."""
    rng = random.Random(20261124)
    out: list[str] = []
    for y, (row, cols) in enumerate(zip(rows, colours)):
        parts: list[str] = []
        x, n = 0, len(row)
        while x < n:
            if row[x] == " ":
                start = x
                while x < n and row[x] == " ":
                    x += 1
                parts.append(" " * (x - start))
                continue
            start = x
            colour = cols[x]
            while x < n and row[x] != " " and cols[x] == colour:
                x += 1
            run = row[start:x]
            while run and rng.random() < twinkle:
                cut = rng.randrange(len(run))
                if run[:cut]:
                    parts.append(f'<span style="color:{_hex(PALETTE[colour])}">{run[:cut]}</span>')
                delay = round(rng.uniform(0, 6), 2)
                parts.append(
                    f'<span class="tw" style="color:{_hex(PALETTE[colour])};--d:{delay}s">{run[cut]}</span>'
                )
                run = run[cut + 1 :]
            if run:
                parts.append(f'<span style="color:{_hex(PALETTE[colour])}">{run}</span>')
        out.append(f'<span class="row" style="--i:{y}">{"".join(parts)}</span>')
    return "".join(out)


def write_gif(
    rows: list[str],
    colours: list[list[int]],
    path: Path,
    *,
    cell_w: int = 5,
    cell_h: int = 10,
    fps: int = 15,
    seconds: float = 2.6,
) -> None:
    """A small preview GIF using the same float/row-wave/twinkle idea."""
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 9)
    h, w = len(rows), max(len(r) for r in rows)
    pad = 14
    frames = []
    n = int(fps * seconds)
    rng = random.Random(11)
    embers = [
        [rng.uniform(0, w), rng.uniform(6, h), rng.uniform(0.3, 1.0), rng.choice(["·", "*", "+"])]
        for _ in range(18)
    ]
    for frame in range(n):
        ph = 2 * math.pi * frame / n
        img = Image.new("RGB", (w * cell_w + pad * 2, h * cell_h + pad * 2), (14, 11, 16))
        d = ImageDraw.Draw(img)
        bob = round(0.55 * math.sin(ph))
        # embers drift up, wrapping
        for p in embers:
            ex, ey = p[0], (p[1] - frame * 0.22) % (h + 4)
            alpha = 0.35 + 0.5 * (0.5 + 0.5 * math.sin(ph * 2 + ex))
            col = (int(255 * alpha), int(190 * alpha), int(90 * alpha))
            d.text((pad + ex * cell_w, pad + ey * cell_h), p[3], font=font, fill=col)
        for y, (row, cols) in enumerate(zip(rows, colours)):
            dy = round(0.55 * math.sin(ph + y * 0.24)) + bob
            for x, ch in enumerate(row):
                if ch == " ":
                    continue
                colour = PALETTE[cols[x]] if cols[x] >= 0 else (255, 255, 255)
                tw = (math.sin(ph * 3 + x * 0.7 + y * 1.3) + 1) / 2
                if tw > 0.985:
                    colour = (255, 248, 226)
                shimmer = 0.92 + 0.12 * (0.5 + 0.5 * math.sin(ph - x * 0.04))
                colour = tuple(min(255, int(c * shimmer)) for c in colour)
                d.text((pad + x * cell_w, pad + (y + dy) * cell_h), ch, font=font, fill=colour)
        frames.append(img.quantize(colors=32, method=Image.MEDIANCUT))
    frames[0].save(
        path, save_all=True, append_images=frames[1:], duration=round(1000 / fps), loop=0, optimize=True
    )


def html_page(art: str, cols: int, rows: int) -> str:
    embers = []
    rng = random.Random(7)
    for _ in range(26):
        left, top = rng.uniform(1.5, 98.5), rng.uniform(2, 98)
        delay, dur = rng.uniform(0, 9), rng.uniform(6, 13)
        size = rng.uniform(0.7, 1.5)
        glyph = rng.choice(["·", "·", "*", "+", "✦"])
        embers.append(
            f'<span class="ember" style="left:{left:.2f}%;top:{top:.2f}%;'
            f'--d:{delay:.2f}s;--t:{dur:.2f}s;--s:{size:.2f}">{glyph}</span>'
        )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FULL Salsing — ASCII logo</title>
<style>
  :root {{
    --bg: #0b0910;
    --line: #3a2b38;
    --muted: #8f7d8d;
    --pink: #ff5fae;
  }}
  * {{ box-sizing: border-box; }}
  html, body {{ min-height: 100%; }}
  body {{
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: clamp(16px, 4vw, 56px);
    background:
      radial-gradient(60% 55% at 50% 42%, rgba(255, 63, 152, 0.16), transparent 70%),
      radial-gradient(45% 40% at 62% 68%, rgba(255, 209, 102, 0.08), transparent 70%),
      var(--bg);
    color: #eee;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
      "Liberation Mono", monospace;
  }}

  .terminal {{
    width: min(1260px, 100%);
    border: 1px solid var(--line);
    border-radius: 12px;
    background: linear-gradient(180deg, #151019, #0e0b12 70%);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.02) inset,
      0 30px 90px rgba(0, 0, 0, 0.65),
      0 0 80px rgba(255, 63, 152, 0.07);
    overflow: hidden;
  }}

  .titlebar {{
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 10px 14px;
    background: linear-gradient(180deg, #241a25, #1a131c);
    border-bottom: 1px solid rgba(0, 0, 0, 0.55);
    user-select: none;
  }}
  .dots {{ display: flex; gap: 8px; }}
  .dots i {{
    width: 12px; height: 12px; border-radius: 50%;
    display: block;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,.25);
  }}
  .dots i:nth-child(1) {{ background: #ff605c; }}
  .dots i:nth-child(2) {{ background: #ffbd44; }}
  .dots i:nth-child(3) {{ background: #00ca4e; }}
  .title {{
    font-size: 13px;
    letter-spacing: .02em;
    color: #e9dfe7;
    font-weight: 700;
    white-space: nowrap;
  }}
  .title em {{ font-style: normal; color: var(--pink); }}
  .meta {{
    justify-self: end;
    font-size: 11px;
    color: var(--muted);
    letter-spacing: .08em;
  }}

  .content {{
    position: relative;
    padding: clamp(10px, 1.6vw, 20px) clamp(8px, 1.2vw, 18px) clamp(8px, 1.2vw, 16px);
    overflow: hidden;
  }}

  .art-wrap {{
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    animation: float 8.5s ease-in-out infinite, glow 5.2s ease-in-out infinite;
  }}

  .art {{
    margin: 0;
    font-family: inherit;
    font-size: clamp(2.1px, calc((min(96vw, 1224px)) / {cols * 0.6:.1f}), 10.8px);
    line-height: 1;
    letter-spacing: 0;
    font-variant-ligatures: none;
    font-weight: 700;
    white-space: pre;
    user-select: text;
    text-shadow: 0 0 0.12em rgba(255, 90, 170, 0.10);
  }}
  .row {{
    display: block;
    height: 1em;
    animation: row-wave 5.6s ease-in-out infinite;
    animation-delay: calc(var(--i) * -0.085s);
    will-change: transform;
  }}

  .tw {{
    animation: twinkle 4.8s ease-in-out infinite;
    animation-delay: var(--d);
  }}

  .ember {{
    position: absolute;
    z-index: 2;
    pointer-events: none;
    color: #ffcf7a;
    font-size: calc(0.9em * var(--s));
    opacity: 0;
    animation: ember var(--t) linear infinite;
    animation-delay: var(--d);
    text-shadow: 0 0 8px currentColor;
  }}

  .footer {{
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 0 clamp(10px, 1.6vw, 20px) 12px;
    color: var(--muted);
    font-size: 11px;
    letter-spacing: .02em;
  }}
  .footer .prompt {{ color: #cbb6c8; }}
  .footer .prompt b {{ color: var(--pink); font-weight: 700; }}
  .caret {{
    display: inline-block;
    width: .6em; height: 1em;
    background: var(--pink);
    vertical-align: -0.12em;
    margin-left: 3px;
    animation: blink 1.05s steps(1) infinite;
  }}

  .sr-only {{
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
  }}

  @keyframes float {{
    0%, 100% {{ transform: translateY(0) scale(1); }}
    50%      {{ transform: translateY(-0.32%) scale(1.004); }}
  }}
  @keyframes glow {{
    0%, 100% {{ filter: drop-shadow(0 0 18px rgba(255, 63, 152, 0.13)); }}
    50%      {{ filter: drop-shadow(0 0 30px rgba(255, 63, 152, 0.24)); }}
  }}
  @keyframes row-wave {{
    0%, 100% {{ transform: translate(0, 0); }}
    25%      {{ transform: translate(0.035em, -0.05em); }}
    50%      {{ transform: translate(0, -0.075em); }}
    75%      {{ transform: translate(-0.035em, -0.05em); }}
  }}
  @keyframes twinkle {{
    0%, 100% {{ opacity: 1;   text-shadow: 0 0 0 transparent; }}
    45%      {{ opacity: .55; text-shadow: 0 0 6px currentColor; }}
    55%      {{ opacity: 1;   text-shadow: 0 0 2px currentColor; }}
  }}
  @keyframes ember {{
    0%   {{ opacity: 0; transform: translate3d(0, 14px, 0) scale(.8); }}
    12%  {{ opacity: .9; }}
    70%  {{ opacity: .55; }}
    100% {{ opacity: 0; transform: translate3d(6px, -46px, 0) scale(1.05); }}
  }}
  @keyframes blink {{ 50% {{ opacity: 0; }} }}

  @media (prefers-reduced-motion: reduce) {{
    .art-wrap, .row, .tw, .ember, .caret {{ animation: none !important; }}
    .ember {{ opacity: .35; }}
  }}
</style>
</head>
<body>
  <h1 class="sr-only">FULL Salsing</h1>
  <main class="terminal" role="img" aria-label="Animated ASCII art of the FULL Salsing logo">
    <div class="titlebar" aria-hidden="true">
      <span class="dots"><i></i><i></i><i></i></span>
      <span class="title">🌶️ <em>FULL</em> Salsing</span>
      <span class="meta">ascii</span>
    </div>
    <div class="content">
      <div class="art-wrap">
        <pre class="art" aria-hidden="true">{art}</pre>
        {''.join(embers)}
      </div>
    </div>
    <div class="footer" aria-hidden="true">
      <span class="prompt">❯ <b>salsing</b> --extra-spicy<span class="caret"></span></span>
      <span>fullsalsing.com</span>
    </div>
  </main>
</body>
</html>
"""


def _shown(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--width", type=int, default=200, help="character columns (default 200)")
    ap.add_argument("--cell-aspect", type=float, default=0.5, help="grid height / width (default 0.5)")
    ap.add_argument("--out", type=Path, default=OUT_DIR, help="output directory")
    ap.add_argument("--gif", action="store_true", help="also write a preview GIF")
    ap.add_argument("--fragment", action="store_true", help="also write the bare art fragment")
    ap.add_argument("--site-js", type=Path, help="write a matrix-art.js asset for the main site")
    args = ap.parse_args()

    rows, colours = build_art(args.width, args.cell_aspect)
    cols = max(len(r) for r in rows)
    rows = [r.ljust(cols) for r in rows]
    colours = [c + [-1] * (cols - len(c)) for c in colours]

    args.out.mkdir(parents=True, exist_ok=True)
    txt = args.out / "fullsalsing-ascii.txt"
    html = args.out / "fullsalsing-ascii.html"

    txt.write_text("\n".join(r.rstrip() for r in rows) + "\n", encoding="utf-8")
    html.write_text(html_page(html_art(rows, colours), cols, len(rows)), encoding="utf-8")

    if args.gif:
        gif = args.out / "fullsalsing-ascii.gif"
        write_gif(rows, colours, gif)
        print(f"wrote {_shown(gif)}")

    if args.fragment or args.site_js:
        fragment = html_art(rows, colours)
        frag = args.out / "fullsalsing-ascii-fragment.html"
        frag.write_text(fragment, encoding="utf-8")
        print(f"wrote {frag}")

    if args.site_js:
        payload = {"cols": cols, "rows": len(rows), "html": html_art(rows, colours)}
        args.site_js.write_text(
            "window.MATRIX_LOGO = " + json.dumps(payload, separators=(",", ":")) + ";\n",
            encoding="utf-8",
        )
        print(f"wrote {args.site_js}")

    print(f"wrote {_shown(txt)} ({cols}×{len(rows)})")
    print(f"wrote {_shown(html)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
