# 🌶️ FULL SALSING - Tech Gossip with a Spicy Flavour

Welcome to **FULL SALSING** (fullsalsing.com) - your one-stop destination for sensationalist tech news, programming gossip, and AI drama served with a side of retro vibes!

## 🎨 Design Philosophy

- **Soft Gossip Magazine Aesthetic**: Pastel pink colors, transparent blocks, gentle shadows
- **Single-Page Application**: All content on one page for maximum user engagement
- **Performance Optimized**: Bare HTML, CSS, and minimal JavaScript
- **Mobile Responsive**: Works great on all devices
- **JSON-Based**: All news stored in news-data.json file
- **Easy Management**: Direct JSON file editing for news updates
- **Tiled Background**: Custom background.png pattern throughout the page

## 🚀 Features

### 1. **Animated Multicolor Carousel**
Displays rotating catchphrases with glittery gradient effects:
- 20 spicy taglines that rotate every 4 seconds
- Smooth sliding animation (fade in from top, fade out to bottom)
- Rainbow gradient text with flowing colors (Deep Pink → Gold → Turquoise → Hot Pink → Purple)
- Glowing text shadow effect for maximum retro-neon impact
- Examples: "Tech news with a spicy flavour", "Sriracha based tech gossip", "Idiocracy++", "Sensationalism As A Service"

### 2. **Dynamic News Blocks**
- **Multiple sizes**: Small, Medium, Large
- **Categories**: Tech, Software, Programming, AI
- **External links**: Sriracha emoji button linking to source URLs
- **Visual effects**: Soft shadows, hover animations, transparency
- **Twitter embeds**: Automatic embedding for Twitter/X URLs
- **News order**: Latest news appears first (reverse chronological)

### 3. **Responsive 2-Column Grid**
- Desktop: 2 columns for optimal reading
- Mobile: 1 column that adapts to screen size
- Transparent blocks let background show through

## 📝 How to Update News

Edit the `news-data.json` file directly. The app loads all news from this file on page load and displays them in **reverse order** (newest first).

### News Item Structure
```json
{
  "id": 1,
  "title": "🚨 BREAKING: Your Sensationalist Headline Here",
  "content": "Your gossip/news content here (1-3 sentences)...",
  "category": "Tech",
  "size": "medium",
  "link": "https://example.com/source-url"
}
```

### Field Descriptions
- **id**: Unique number (required)
- **title**: Sensational headline with emoji (max 80 chars)
- **content**: 1-3 sentences of spicy commentary
- **category**: Tech, Software, Programming, or AI
- **size**: small, medium, or large
- **link**: (optional) URL that appears as sriracha button
- **tweet_url**: (optional) Twitter URL for automatic embedding
- **embed_html**: (optional) Custom embed HTML

### Example with Link
```json
{
  "id": 5,
  "title": "💣 Jack Manages 50% Salary Cuts With Strategic Detonations",
  "content": "The remaining 50% of workforce will continue training AI and prompting themselves out of their jobs.",
  "category": "Tech",
  "size": "large",
  "link": "https://x.com/jack/status/2027129697092731343"
}
```

### Example with Twitter Embed
```json
{
  "id": 6,
  "title": "🎬 Black Mirror Getting Real: Fifteen Million Merits Edition",
  "content": "While our favorite Philantrotechbros fantasize about saving the world, the real dystopia unfolds.",
  "category": "Tech",
  "size": "medium",
  "link": "https://x.com/mikethree/status/2026919757526483393",
  "tweet_url": "https://x.com/mikethree/status/2026919757526483393"
}
```

## 🎯 Content Guidelines

### Title Format
- **Use emojis** for visual impact: 🚨 🔥 ⚡ 💥 🌶️ 💉 🇨🇳 🤡
- **Make it sensational** without being misleading
- **Keep it punchy** - max 80 characters
- **Examples**:
  - "🚨 BREAKING: New Framework Claims to Be 10x Better (Nobody Asked)"
  - "🔥 EXCLUSIVE: DevOps Engineer Hasn't Slept in 73 Hours"
  - "⚡ SHOCKING: ChatGPT Finally Admits It's Confused Too"

### Content Format
- 1-3 sentences of spicy commentary
- Can include fun details, sarcasm, or observations
- Keep it entertaining but not harmful
- Reference: "Insiders report...", "Sources say...", "Rumor has it..."

### Categories
- **Tech**: General technology news
- **Software**: Tools, frameworks, libraries
- **Programming**: Languages, paradigms, best practices (or lack thereof)
- **AI**: Machine learning, LLMs, AI drama

### Block Sizes
- **Small (1x1)**: Quick hot takes, single sentences
- **Medium (2x1)**: Most gossip items, 2-3 sentences
- **Large (2x2)**: Major stories, complex narratives

## 🎨 Customization

### Colors (in `styles.css`)
```css
--primary-pink: #FFB6D9
--hot-pink: #FFC0CB
--light-pink: #FFE4E1
--dark-bg: #FFF0F5
--text-dark: #333333
```

### Carousel Phrases
Edit in `script.js` - modify the `CAROUSEL_SENTENCES` array:
```javascript
const CAROUSEL_SENTENCES = [
    'Tech news with a spicy flavour',
    'Sriracha based tech gossip',
    'Your unique source of truth',
    'Idiocracy++',
    'Sensationalism As A Service',
    // ... 15 more spicy taglines
];
```

### Carousel Animation Speed
Edit in `styles.css`:
```css
.carousel-item {
    animation: carouselFade 4s ease-in-out, gradientShift 3s linear infinite;
}
```
- `carouselFade`: Controls fade in/out timing
- `gradientShift`: Controls rainbow gradient flow speed

Edit in `script.js`:
```javascript
setInterval(() => {
    // ... rotation logic
}, 4000); // Change rotation frequency (milliseconds)
```

## 📊 File Structure

```
fullsalsing/
├── index.html          # Main page structure
├── styles.css          # All styling (responsive, retro design)
├── script.js           # Client-side logic (no dependencies!)
├── news-data.json      # All news content (edit to update)
├── fullsalsing.png     # Banner image
├── sriracha.webp       # Link button icon
├── background.png      # Tiled background pattern
└── README.md           # This file
```

## ⚡ Performance Stats

- **Total size**: ~35KB (uncompressed)
- **JavaScript**: ~5KB (minified)
- **CSS**: ~15KB (minified)
- **HTML**: ~4KB
- **Zero external dependencies** (except Twitter widgets.js for embeds)
- **Zero API calls required** for basic functionality
- **Works mostly offline** (except Twitter embeds)

## 🚀 Deployment

1. Host on any static hosting (GitHub Pages, Netlify, Vercel, Apache, etc.)
2. No backend required
3. No database needed
4. No build process needed

### Quick Deploy Examples:
```bash
# GitHub Pages
git push origin main

# Netlify
netlify deploy --prod --dir=.

# Simple HTTP server (for testing)
python3 -m http.server 8000
```

## 🎬 Future Ideas

- Dark/Light theme toggle
- Trending hotness filter
- Comment system (client-side)
- Reaction emojis (👍 🔥 😂)
- Search functionality
- Archive/history view
- Social sharing buttons
- RSS feed generation

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)
- Any browser supporting ES6 and CSS Grid

## 🤝 Contributing

Found a spicy tech story? Want to add more drama?
1. Edit `news-data.json` directly
2. Follow the content guidelines
3. Keep the tone satirical but not harmful!

## 📜 License

Free to use, modify, and deploy. Make the web spicier! 🌶️

---

**Stay tuned for more tech hot takes! Remember: In the world of tech, if you're not being sensational, you're being ignored.** 🚀

*FULL SALSING - Where Tech Gets Spicy*
