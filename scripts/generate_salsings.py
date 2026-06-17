#!/usr/bin/env python3
import json
import os
import sys
import urllib.request
import urllib.error
import re

import anthropic

NEWS_FILE = os.path.join(os.path.dirname(__file__), "..", "news-data.json")
GITHUB_OUTPUT = os.environ.get("GITHUB_OUTPUT", "")

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
                    "size": {"type": "string", "enum": ["small", "medium", "large"]},
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
- small: one-liner hot take
- medium: standard gossip item (default)
- large: big story needing more space

## Link field
- If you have a source URL from the provided headlines, set it in `link`
- If you don't have a real URL, omit the field entirely — never invent URLs

Focus on: AI drama, corporate lawsuits, chip wars, dev culture absurdity, startup founder drama, Big Tech power moves, geopolitics × tech.
"""


def fetch_hn_headlines():
    headlines = []
    try:
        with urllib.request.urlopen(
            "https://hacker-news.firebaseio.com/v0/topstories.json", timeout=10
        ) as r:
            story_ids = json.loads(r.read())[:20]
        for sid in story_ids:
            try:
                with urllib.request.urlopen(
                    f"https://hacker-news.firebaseio.com/v0/item/{sid}.json", timeout=5
                ) as r:
                    item = json.loads(r.read())
                if item and item.get("title"):
                    url = item.get("url", f"https://news.ycombinator.com/item?id={sid}")
                    headlines.append({"title": item["title"], "url": url, "source": "HN"})
            except Exception:
                continue
    except Exception as e:
        print(f"[warn] HN fetch failed: {e}", file=sys.stderr)
    return headlines


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


def save_news_data(data):
    with open(NEWS_FILE, "w", encoding="utf-8") as f:
        f.write(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def write_github_output(key, value):
    if GITHUB_OUTPUT:
        with open(GITHUB_OUTPUT, "a", encoding="utf-8") as f:
            f.write(f"{key}={value}\n")


def main():
    count = int(os.environ.get("SALSING_COUNT", "5"))
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
        lines = [f"- {h['title']} ({h['source']}) | {h['url']}" for h in headlines[:30]]
        headlines_text = "\nToday's headlines for inspiration:\n" + "\n".join(lines)

    user_prompt = (
        f"Generate exactly {count} salsings."
        + (headlines_text or "\n\nNo headlines available — use your knowledge of recent tech news.")
        + "\n\nReturn them in the `salsings` array. Each must have title, content, category, size. "
        "Include `link` only when you have the real article URL from the headlines above."
    )

    # Call Claude
    client = anthropic.Anthropic()
    print("[info] Calling Claude API...", file=sys.stderr)

    response = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=4096,
        thinking={"type": "adaptive"},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
        output_config={"format": {"type": "json_schema", "schema": SALSING_SCHEMA, "name": "salsings_response"}},
    )

    # Parse response
    raw = None
    for block in response.content:
        if block.type == "text":
            raw = block.text
            break

    if not raw:
        print("[error] No text in Claude response", file=sys.stderr)
        sys.exit(1)

    try:
        parsed = json.loads(raw)
        salsings = parsed["salsings"]
    except (json.JSONDecodeError, KeyError) as e:
        print(f"[error] Failed to parse response: {e}", file=sys.stderr)
        print(f"[error] Raw: {raw[:500]}", file=sys.stderr)
        sys.exit(1)

    # Validate
    valid_categories = {"Tech", "Software", "Programming", "AI"}
    valid_sizes = {"small", "medium", "large"}
    for i, s in enumerate(salsings):
        if not all(k in s for k in ("title", "content", "category", "size")):
            print(f"[error] Salsing {i} missing required fields: {s}", file=sys.stderr)
            sys.exit(1)
        if s["category"] not in valid_categories:
            print(f"[error] Salsing {i} invalid category: {s['category']}", file=sys.stderr)
            sys.exit(1)
        if s["size"] not in valid_sizes:
            print(f"[error] Salsing {i} invalid size: {s['size']}", file=sys.stderr)
            sys.exit(1)
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
    save_news_data(data)
    print(f"[info] Wrote {len(salsings)} salsings to news-data.json", file=sys.stderr)

    # Output topics for commit message
    topics = " and ".join(
        s["title"].split(":", 1)[-1].strip()[:40] if ":" in s["title"] else s["title"][:40]
        for s in salsings[:3]
    )
    write_github_output("topics", topics)
    print(f"[info] Topics: {topics}", file=sys.stderr)


if __name__ == "__main__":
    main()
