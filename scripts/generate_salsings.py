#!/usr/bin/env python3
import json
import os
import sys
import textwrap
import urllib.request
import urllib.error
import re
from concurrent.futures import ThreadPoolExecutor
from difflib import SequenceMatcher

import anthropic

NEWS_FILE = os.path.join(os.path.dirname(__file__), "..", "news-data.json")
GITHUB_OUTPUT = os.environ.get("GITHUB_OUTPUT", "")

# Must match ITEMS_PER_PAGE in script.js so the gap simulation mirrors the site.
ITEMS_PER_PAGE = 12

SALSING_SCHEMA = {
    "type": "object",
    "properties": {
        "salsings": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "content": {"type": "string"},
                    "category": {"type": "string", "enum": ["Tech", "Software", "Programming", "AI"]},
                    # Autosalsings are always compact: two must fit side by side
                    # in the two-column grid, so the model is never allowed to
                    # pick a large (full-width) block.
                    "size": {"type": "string", "enum": ["small"]},
                    "link": {"type": "string"},
                },
                "required": ["title", "content", "category", "size"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["salsings"],
    "additionalProperties": False,
}

SYSTEM_PROMPT = """You are the editorial AI for FULL SALSING — a tech gossip site where news is served spicy.

Your job: generate tech news items ("salsings") following these rules exactly.

## Title rules
- Start with an emoji: 🚨 🔥 ⚡ 💥 🌶️ 💉 🤡 🇨🇳 ⚖️ 💊
- Follow with ALL CAPS label: BREAKING:, EXCLUSIVE:, SHOCKING:, LOSER ALERT:, CONFIRMED:
- Then a punchy sensational headline
- Total max 80 characters
- Examples:
  - 🚨 BREAKING: New Framework Claims to Be 10x Better
  - 🔥 EXCLUSIVE: DevOps Engineer Hasn't Slept 73 Hours
  - ⚖️ LOSER ALERT: Elon's $135B Lawsuit Crashes in Two Hours

## Content rules
- 1–3 sentences. Gossip tone. Sarcastic, punchy, entertaining.
- Phrases like: "Sources say...", "Insiders report...", "Rumor has it...", "Nobody asked but..."
- Include real details (company names, numbers, context) to feel grounded
- Punchy kicker sentence at the end
- NOT harmful — no personal attacks, no misinformation presented as fact

## Category (pick one)
- Tech: general technology news
- Software: tools, frameworks, libraries
- Programming: languages, paradigms, dev culture
- AI: LLMs, ML drama, AI company news

## Size
- Always use `small`. Autosalsings are compact items: two of them must fit
  side by side in the site's two-column grid.
- Never use `medium` or `large` — a large block spans both columns and leaves
  an empty hole in the layout.

## Link field
- If you have a source URL from the provided headlines, set it in `link`
- If you don't have a real URL, omit the field entirely — never invent URLs

Focus on: AI drama, corporate lawsuits, chip wars, dev culture absurdity, startup founder drama, Big Tech power moves, geopolitics × tech.
"""


def fetch_hn_headlines(limit=20):
    """Top Hacker News stories, highest-voted first."""
    headlines = []
    try:
        with urllib.request.urlopen(
            "https://hacker-news.firebaseio.com/v0/topstories.json", timeout=10
        ) as r:
            story_ids = json.loads(r.read())[:40]
    except Exception as e:
        print(f"[warn] HN fetch failed: {e}", file=sys.stderr)
        return headlines

    def fetch_item(sid):
        try:
            with urllib.request.urlopen(
                f"https://hacker-news.firebaseio.com/v0/item/{sid}.json", timeout=5
            ) as r:
                return json.loads(r.read())
        except Exception:
            return None

    with ThreadPoolExecutor(max_workers=10) as pool:
        items = list(pool.map(fetch_item, story_ids))

    for sid, item in zip(story_ids, items):
        if not item or not item.get("title"):
            continue
        url = item.get("url") or f"https://news.ycombinator.com/item?id={sid}"
        headlines.append(
            {
                "title": item["title"],
                "url": url,
                "source": "HN",
                "score": item.get("score", 0),
                "comments": item.get("descendants", 0),
            }
        )

    # Most upvoted stories are the ones worth a salsing
    headlines.sort(key=lambda h: h.get("score", 0), reverse=True)
    return headlines[:limit]


def fetch_techcrunch_headlines():
    headlines = []
    try:
        req = urllib.request.Request(
            "https://techcrunch.com/",
            headers={"User-Agent": "Mozilla/5.0 (compatible; autosalsing/1.0)"},
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode("utf-8", errors="ignore")
        # Extract article titles and links from TC's HTML
        pattern = r'<a[^>]+href="(https://techcrunch\.com/\d{4}/[^"]+)"[^>]*>([^<]{20,120})</a>'
        for url, title in re.findall(pattern, html):
            title = re.sub(r"\s+", " ", title).strip()
            if len(title) > 20:
                headlines.append({"title": title, "url": url, "source": "TechCrunch"})
        # Deduplicate by URL
        seen = set()
        deduped = []
        for h in headlines:
            if h["url"] not in seen:
                seen.add(h["url"])
                deduped.append(h)
        headlines = deduped[:20]
    except Exception as e:
        print(f"[warn] TechCrunch fetch failed: {e}", file=sys.stderr)
    return headlines


def load_news_data():
    with open(NEWS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


STOPWORDS = {
    "the", "and", "for", "with", "from", "that", "this", "after", "over",
    "into", "amid", "about", "says", "say", "just", "now", "has", "have",
    "had", "will", "can", "could", "may", "more", "than", "you", "your",
    "its", "his", "her", "their", "not", "but", "are", "was", "were",
    "been", "being", "new", "who", "how", "why", "what", "when", "where",
}


def normalize_url(url):
    """Normalize a link so the same article matches across http/https/www/slashes."""
    url = (url or "").strip().lower()
    url = re.sub(r"^https?://(?:www\.)?", "", url)
    return url.rstrip("/")


def title_tokens(title):
    """Distinctive words of a headline, ignoring emoji, label and filler words."""
    text = title.split(":", 1)[-1]
    return {
        token
        for token in re.findall(r"[a-z0-9]+", text.lower())
        if len(token) > 2 and token not in STOPWORDS
    }


def normalized_title(title):
    """Lowercase headline without emoji, label or punctuation, for fuzzy matching."""
    text = title.split(":", 1)[-1].lower()
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def duplicate_reason(title, link, existing_news):
    """Return a human-readable reason when a salsing repeats an existing story."""
    normalized_link = normalize_url(link)
    tokens = title_tokens(title)
    plain_title = normalized_title(title)

    for item in existing_news:
        if normalized_link and normalized_link == normalize_url(item.get("link")):
            return f"same source URL as salsing #{item.get('id')}"

        other_title = item.get("title", "")
        other_tokens = title_tokens(other_title)
        token_similarity = 0.0
        if tokens and other_tokens:
            token_similarity = len(tokens & other_tokens) / len(tokens | other_tokens)
        char_similarity = SequenceMatcher(None, plain_title, normalized_title(other_title)).ratio()

        similarity = max(token_similarity, char_similarity)
        if similarity >= 0.6:
            return f"headline is {similarity:.0%} similar to salsing #{item.get('id')}"

    return None


def fix_grid_gaps(news):
    """Downgrade large blocks that would leave an empty cell in the two-column grid.

    A large block spans both columns, so if it follows an odd number of
    single-column blocks it lands on the next row and leaves a hole. Keep the
    site hole-free by turning those blocks into medium ones.
    """
    def ordered_for_render(items):
        # Mirrors getSortedNews() in script.js: consecutive small blocks are
        # grouped together before the next non-small block.
        ordered, smalls = [], []
        for item in items:
            if item["size"] == "small":
                smalls.append(item)
            else:
                ordered.extend(smalls)
                smalls = []
                ordered.append(item)
        ordered.extend(smalls)
        return ordered

    def gap_items(items):
        ordered = ordered_for_render(items)
        gaps = []
        for page in range((len(ordered) + ITEMS_PER_PAGE - 1) // ITEMS_PER_PAGE):
            col = 0
            for item in ordered[page * ITEMS_PER_PAGE:(page + 1) * ITEMS_PER_PAGE]:
                span = 2 if item["size"] == "large" else 1
                if col + span > 2:
                    gaps.append(item)
                    col = 0
                col += span
                if col == 2:
                    col = 0
        return gaps

    downgraded = []
    while True:
        gaps = gap_items(news)
        if not gaps:
            break
        for item in gaps:
            if item["size"] == "large":
                item["size"] = "medium"
                downgraded.append(item["id"])

    return downgraded


def save_news_data(data):
    with open(NEWS_FILE, "w", encoding="utf-8") as f:
        f.write(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def write_github_output(key, value):
    if GITHUB_OUTPUT:
        with open(GITHUB_OUTPUT, "a", encoding="utf-8") as f:
            f.write(f"{key}={value}\n")


def main():
    count = int(os.environ.get("SALSING_COUNT", "4"))
    dry_run = os.environ.get("DRY_RUN", "false").lower() in ("true", "1", "yes")

    print(f"[info] Generating {count} salsings (dry_run={dry_run})", file=sys.stderr)

    # Load current news to get max_id
    data = load_news_data()
    max_id = max((item["id"] for item in data["news"]), default=0)
    print(f"[info] Current max id: {max_id}", file=sys.stderr)

    # Fetch headlines
    print("[info] Fetching headlines...", file=sys.stderr)
    headlines = fetch_hn_headlines() + fetch_techcrunch_headlines()
    print(f"[info] Got {len(headlines)} headlines", file=sys.stderr)

    headlines_text = ""
    if headlines:
        def format_headline(h):
            meta = h["source"]
            if h.get("score") is not None:
                meta += f", {h['score']} points, {h.get('comments', 0)} comments"
            return f"- {h['title']} ({meta}) | {h['url']}"

        lines = [format_headline(h) for h in headlines[:30]]
        headlines_text = (
            "\nToday's headlines, ranked most important first "
            "(HN stories sorted by upvotes):\n" + "\n".join(lines)
        )

    recent_lines = []
    for item in data["news"][:50]:
        if not item.get("title"):
            continue
        link = item.get("link")
        recent_lines.append(f"- {item['title']}" + (f" ({link})" if link else ""))

    recent_text = ""
    if recent_lines:
        recent_text = (
            "\n\nRecent salsings already published on the site — do NOT write about "
            "these stories again, not even from a different angle, headline or source, "
            "and do not reuse these URLs. Pick different stories:\n"
            + "\n".join(recent_lines)
        )

    user_prompt = (
        f"Generate exactly {count} salsings."
        + (headlines_text or "\n\nNo headlines available — use your knowledge of recent tech news.")
        + recent_text
        + "\n\nPick the most important stories: favour the highest-voted HN items "
        "(points/comments) and the most prominent TechCrunch headlines. "
        "Each salsing must cover a different story — no duplicates or near-duplicates. "
        "Return them in the `salsings` array. Each must have title, content, category, size. "
        "Include `link` only when you have the real article URL from the headlines above."
    )

    # Call Claude using tool use for reliable structured output
    client = anthropic.Anthropic()
    print("[info] Calling Claude API...", file=sys.stderr)

    tool_def = {
        "name": "submit_salsings",
        "description": "Submit the generated salsings array",
        "input_schema": SALSING_SCHEMA,
    }

    response = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=8192,
        system=SYSTEM_PROMPT,
        tools=[tool_def],
        tool_choice={"type": "tool", "name": "submit_salsings"},
        messages=[{"role": "user", "content": user_prompt}],
    )

    # Extract tool use block
    tool_block = None
    for block in response.content:
        if block.type == "tool_use" and block.name == "submit_salsings":
            tool_block = block
            break

    if not tool_block:
        print("[error] No tool_use block in Claude response", file=sys.stderr)
        print(f"[error] Content types: {[b.type for b in response.content]}", file=sys.stderr)
        sys.exit(1)

    try:
        salsings = tool_block.input["salsings"]
    except (KeyError, TypeError) as e:
        print(f"[error] Failed to extract salsings from tool input: {e}", file=sys.stderr)
        sys.exit(1)

    # Never write more than requested
    if len(salsings) > count:
        print(f"[warn] Got {len(salsings)} salsings, keeping the first {count}", file=sys.stderr)
        salsings = salsings[:count]

    # Never publish the same story twice: compare against existing coverage
    # (same source URL or a near-identical headline) and against the batch itself.
    existing_news = list(data["news"])
    accepted = []
    for s in salsings:
        reason = duplicate_reason(s.get("title", ""), s.get("link"), existing_news)
        if reason:
            print(f"[warn] Skipping duplicate salsing ({reason}): {s.get('title')}", file=sys.stderr)
            continue
        accepted.append(s)
        existing_news.append(s)

    if len(accepted) != len(salsings):
        print(f"[warn] Dropped {len(salsings) - len(accepted)} duplicate salsing(s)", file=sys.stderr)
    salsings = accepted
    if not salsings:
        print("[warn] Every generated salsing duplicated existing coverage; nothing to write", file=sys.stderr)
        return

    # Validate
    valid_categories = {"Tech", "Software", "Programming", "AI"}
    for i, s in enumerate(salsings):
        if not all(k in s for k in ("title", "content", "category", "size")):
            print(f"[error] Salsing {i} missing required fields: {s}", file=sys.stderr)
            sys.exit(1)
        if s["category"] not in valid_categories:
            print(f"[error] Salsing {i} invalid category: {s['category']}", file=sys.stderr)
            sys.exit(1)
        # Autosalsings are always small so two blocks fit per row.
        salsings[i]["size"] = "small"
        if len(s["title"]) > 80:
            print(f"[warn] Salsing {i} title too long ({len(s['title'])} chars), truncating", file=sys.stderr)
            salsings[i]["title"] = s["title"][:80]

    # Assign IDs
    for i, s in enumerate(salsings):
        s["id"] = max_id + 1 + i
        # Remove link if it's empty/None
        if "link" in s and not s["link"]:
            del s["link"]

    print(f"[info] Generated {len(salsings)} salsings (ids {max_id+1}–{max_id+len(salsings)})", file=sys.stderr)

    if dry_run:
        print(json.dumps(salsings, ensure_ascii=False, indent=2))
        print("[info] DRY RUN — no changes written", file=sys.stderr)
        return

    # Re-read to avoid race condition
    data = load_news_data()
    # Prepend new salsings (newest first = highest id first)
    data["news"] = list(reversed(salsings)) + data["news"]
    downgraded = fix_grid_gaps(data["news"])
    if downgraded:
        print(f"[info] Downgraded large salsings to medium to avoid grid gaps: {downgraded}", file=sys.stderr)
    save_news_data(data)
    print(f"[info] Wrote {len(salsings)} salsings to news-data.json", file=sys.stderr)

    # Output topics for commit message (cut on word boundaries, never mid-word)
    topics = " and ".join(
        textwrap.shorten(
            (s["title"].split(":", 1)[-1] if ":" in s["title"] else s["title"]).strip(),
            width=45,
            placeholder="…",
        )
        for s in salsings[:3]
    )
    write_github_output("topics", topics)
    print(f"[info] Topics: {topics}", file=sys.stderr)


if __name__ == "__main__":
    main()
