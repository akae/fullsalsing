# FULL SALSING — Agent Instructions

---

## PART 1: WRITING NEW SALSINGS (most frequent task)

This is the main thing you'll be asked to do. When the user says "write a salsing", "add news", or similar — follow these rules exactly.

### Where to write
- File: `news-data.json`
- **Always prepend** — insert the new item at the **top** of the `"news"` array
- **Never append** to the bottom; the site renders items in array order, top = newest

### Commit message
After adding salsings, commit with a short message listing the topics, e.g.:
`Add salsings: topic one and topic two`

### ID assignment
- Look at the current highest `id` in the array (it's the first item)
- Assign `id: current_highest + 1`

### Required fields
```json
{
  "id": 27,
  "title": "🚨 BREAKING: Something Outrageous Just Happened",
  "content": "1-3 sentences of spicy commentary. Sarcastic, punchy, entertaining.",
  "category": "AI",
  "size": "medium"
}
```

| Field | Rules |
|-------|-------|
| `id` | Next integer after current highest |
| `title` | Emoji + ALL CAPS label + punchy headline. Max 80 chars. |
| `content` | 1–3 sentences. Gossip tone. Sarcasm welcome. Not harmful. |
| `category` | One of: `Tech`, `Software`, `Programming`, `AI` |
| `size` | `small` (1 sentence hot take), `medium` (default), `large` (big story) |

### Optional fields
| Field | Use when |
|-------|----------|
| `link` | Source URL — renders as a sriracha 🌶️ button |
| `tweet_url` | Twitter/X URL — auto-embeds the tweet |
| `embed_html` | Custom embed HTML block |
| `image` | Image URL for visual content |

### Title format
- Start with an emoji: 🚨 🔥 ⚡ 💥 🌶️ 💉 🤡 🇨🇳 ⚖️ 💊
- Follow with an ALL CAPS label: `BREAKING:`, `EXCLUSIVE:`, `SHOCKING:`, `LOSER ALERT:`, `CONFIRMED:`
- Then a punchy, sensational headline
- Examples:
  - `🚨 BREAKING: New Framework Claims to Be 10x Better`
  - `🔥 EXCLUSIVE: DevOps Engineer Hasn't Slept 73 Hours`
  - `⚖️ LOSER ALERT: Elon's $135B Lawsuit Crashes in Two Hours`
  - `💊 BREAKING: Drug Discovery AI Now Speaks Human — No PhD Required`

### Content tone
- Tech gossip energy — irreverent, sarcastic, entertaining
- Phrases like: "Sources say...", "Insiders report...", "Rumor has it...", "Nobody asked but..."
- Include real details (company names, numbers, context) to make it feel grounded
- Punchy ending — a kicker sentence that lands
- **Not harmful** — no personal attacks, no misinformation presented as fact

---

## PART 2: WEB DESIGN & IMPLEMENTATION

Reference this section only when modifying the site's look, structure, or behaviour.

### Tech stack
- Pure HTML + CSS + vanilla JS — no frameworks, no npm, no build step
- Single page: `index.html`
- All news loaded from `news-data.json` via `script.js`

### File structure
```
fullsalsing/
├── index.html          # Only page
├── styles.css          # All styling
├── script.js           # News loader and carousel
├── news-data.json      # All content
├── fullsalsing.png     # Header banner
├── sriracha.webp       # Link button icon
├── background.png      # Tiled background pattern
└── prompts.md          # This file
```

### Design system
- **Aesthetic**: Soft gossip magazine — pastel pink, glass-morphism, no harsh retro/pixel effects
- **Layout**: 2-column grid on desktop, 1 column on mobile
- **News blocks**: 75% opacity, backdrop-filter blur, soft shadows

**Color palette** (`styles.css` `:root`):
```css
--primary-pink: #FFB6D9;
--hot-pink:     #FFC0CB;
--light-pink:   #FFE4E1;
--dark-bg:      #FFF0F5;
--text-dark:    #333333;
```

**Banner**: 35% page width, max 600px (`styles.css` `.header-banner`)

### Carousel
- Rotates 20 phrases every 4 seconds
- Glittery rainbow gradient text (Deep Pink → Gold → Turquoise → Hot Pink → Purple)
- Smooth slide-in from top, hold, slide-out to bottom
- Phrases defined in `script.js` → `CAROUSEL_SENTENCES` array
- Timing in `styles.css` → `.carousel-item { animation: carouselFade 4s ... }`

### Twitter/X embeds
- Any `link` or `tweet_url` pointing to twitter.com or x.com auto-embeds
- Uses Twitter's official `widgets.js` — no API key needed
- Custom embeds via `embed_html` field

### Deployment
```bash
git add .
git commit -m "Add salsings"
git push origin main
```

Static hosting only — no backend, no database, no build process required.

---

## PART 3: CONTENT REFERENCE

### Categories
| Category | Use for |
|----------|---------|
| `Tech` | General technology news |
| `Software` | Tools, frameworks, libraries |
| `Programming` | Languages, paradigms, dev culture |
| `AI` | LLMs, ML drama, AI company news |

### Block sizes
| Size | When to use |
|------|-------------|
| `small` | One-liner hot take |
| `medium` | Standard gossip item — **use this by default** |
| `large` | Big stories needing more space |

---

**FULL SALSING** — Where Tech Gets Spicy 🌶️
