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

## PART 4: AUTOSALSING (automated news harvesting)

When the user says **"autosalsing"** — follow this exact workflow. Do not skip steps.

### Step 1 — Fetch the front pages

Use the `WebFetch` tool to fetch both pages **in parallel**:
- `https://news.ycombinator.com/`
- `https://techcrunch.com/`

Extract all visible headlines and their URLs.

### Step 2 — Match to salsing topics

Filter headlines to only those that fit the site's topic universe:
- AI drama (LLMs, model releases, AI company beef, AGI hype)
- Corporate lawsuits & tech legal battles
- Chip wars, GPU supply, semiconductor geopolitics
- Dev culture absurdity (vibe coding, frameworks, "10x" claims)
- Startup personalities & founder drama
- Big Tech power moves (acquisitions, layoffs, pivots)
- Geopolitics intersecting with tech (export controls, bans, state-sponsored)

Discard: pure finance, sports, politics without tech angle, lifestyle, non-tech science.

Pick **2–6 stories** that would make the best salsings. Prefer juicy, surprising, or drama-adjacent stories.

### Step 3 — Draft the salsings

For each selected story, draft a salsing following PART 1 rules exactly:
- Read `news-data.json` to get the current highest `id`
- Assign IDs sequentially starting from `current_highest + 1`
- Set `link` to the source URL (HN or TechCrunch article URL)
- Title: Emoji + ALL CAPS label + punchy headline (≤80 chars)
- Content: 1–3 sentences, gossip tone, grounded in real details
- Category: Tech / AI / Software / Programming
- Size: small/medium/large (default: medium)

### Step 4 — Individual approval loop

**Present each drafted salsing one at a time.** For each one:

1. Show the full JSON block
2. Show a preview of how the title and content read together
3. Ask: **"Add this salsing? (yes / skip / edit)"**
   - `yes` → mark it as approved, move to next
   - `skip` → discard it, move to next
   - `edit` → let the user provide corrections, update the draft, re-show it, ask again

Do **not** write anything to `news-data.json` until all items have been reviewed.

### Step 5 — Write approved salsings

After all items are reviewed:
- If zero items approved → stop, tell the user nothing was added
- If 1+ items approved:
  - Re-read `news-data.json` to confirm current highest `id` (in case it changed during the session)
  - Re-assign IDs sequentially from `current_highest + 1`, in approval order
  - Prepend all approved items to the top of the `"news"` array (newest first)
  - Commit following PART 1 rules: `Add salsings: topic one and topic two`

### Rules
- Never write to `news-data.json` before all approval prompts are done
- Never batch-approve — each salsing must be shown and confirmed individually
- Always set `link` to the original article URL
- IDs must be contiguous integers; re-check after all edits

---

**FULL SALSING** — Where Tech Gets Spicy 🌶️
