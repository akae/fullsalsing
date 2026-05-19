# 🌶️ FULL SALSING — Tech Gossip with a Spicy Flavour

**[fullsalsing.com](https://fullsalsing.com)** — Sensationalist tech news, programming gossip, and AI drama.

## Tech Stack

- Pure HTML + CSS + vanilla JS — no frameworks, no npm, no build step
- All news stored in `news-data.json`, loaded on page load
- Deployed via **GitHub Pages** (`main` branch → auto-deploy)

## File Structure

```
fullsalsing/
├── index.html          # Main page
├── styles.css          # All styling
├── script.js           # News loader, carousel, Twitter embeds
├── news-data.json      # All news content
├── fullsalsing.png     # Banner image
├── sriracha.webp       # Link button icon
├── background.png      # Tiled background pattern
├── QUICKSTART.html     # Quick reference for content authors
├── CLAUDE.md           # Agent instructions (salsing format, autosalsing)
└── README.md           # This file
```

## How to Update News

**Always prepend** new items at the top of the `"news"` array in `news-data.json`. The site renders items in array order — top = newest.

### News item structure

```json
{
  "id": 27,
  "title": "🚨 BREAKING: Your Sensationalist Headline Here",
  "content": "1-3 sentences of spicy commentary...",
  "category": "Tech",
  "size": "medium",
  "link": "https://example.com/source-url"
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `id` | ✅ | Next integer after current highest |
| `title` | ✅ | Emoji + ALL CAPS label + headline. Max 80 chars. |
| `content` | ✅ | 1–3 sentences. Gossip tone. Sarcasm welcome. |
| `category` | ✅ | `Tech`, `Software`, `Programming`, or `AI` |
| `size` | ✅ | `small`, `medium` (default), or `large` |
| `link` | ☐ | Source URL — renders as a 🌶️ sriracha button |
| `tweet_url` | ☐ | Twitter/X status URL — auto-embeds the tweet |
| `embed_html` | ☐ | Custom embed HTML block |
| `image` | ☐ | Image URL for visual content |

### Title format

```
[Emoji] [ALL CAPS LABEL]: [Punchy headline]
```

Examples:
- `🚨 BREAKING: New Framework Claims to Be 10x Better`
- `⚖️ LOSER ALERT: Elon's $135B Lawsuit Crashes in Two Hours`
- `🔥 EXCLUSIVE: DevOps Engineer Hasn't Slept 73 Hours`

### Content tone

Gossip magazine energy. Use phrases like "Sources say...", "Insiders report...", "Rumor has it...". Ground it with real names and numbers. End with a punchy kicker. Not harmful.

## Autosalsing

Say **"autosalsing"** to an AI agent (with `CLAUDE.md` loaded) to run the automated news harvesting workflow:

1. Fetches front pages of Hacker News and TechCrunch
2. Picks 2–6 stories matching the site's topic universe
3. Drafts salsings in the correct format with source links
4. Shows each one for individual approval (yes / skip / edit)
5. Writes only approved items and commits

## Design

- **Aesthetic**: Soft gossip magazine — pastel pink, glass-morphism
- **Layout**: 2-column grid on desktop, 1 column on mobile
- **Carousel**: 20 rotating phrases, rainbow gradient, 4s interval (`script.js` → `CAROUSEL_SENTENCES`)

Color palette (`styles.css` `:root`):
```css
--primary-pink: #FFB6D9;
--hot-pink:     #FFC0CB;
--light-pink:   #FFE4E1;
--dark-bg:      #FFF0F5;
--text-dark:    #333333;
```

## Deployment

Push to `main` — GitHub Pages deploys automatically.

```bash
git add news-data.json
git commit -m "Add salsings: topic one and topic two"
git push origin main
```
