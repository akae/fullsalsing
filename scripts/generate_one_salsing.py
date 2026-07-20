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
        "salsing": {
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
        }
    },
    "required": ["salsing"],
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
- If you have a source URL, set it in `link`
- If you don't have a real URL, omit the field entirely — never invent URLs

Focus on: AI drama, corporate lawsuits, chip wars, dev culture absurdity, startup founder drama, Big Tech power moves, geopolitics × tech.
"""


def is_url(s):
    return s.strip().lower().startswith(("http://", "https://"))


def fetch_url_content(url):
    """Fetch a page and return (title, text_excerpt). Degrades gracefully on failure."""
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (compatible; salsing-from-input/1.0)"},
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"[warn] URL fetch failed: {e}", file=sys.stderr)
        return "", ""

    title = ""
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    if m:
        title = re.sub(r"\s+", " ", m.group(1)).strip()

    # Strip scripts/styles then all tags, collapse whitespace, take an excerpt.
    body = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.IGNORECASE | re.DOTALL)
    body = re.sub(r"<[^>]+>", " ", body)
    body = re.sub(r"\s+", " ", body).strip()
    return title, body[:2000]


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
    raw_input = os.environ.get("SALSING_INPUT", "").strip()
    dry_run = os.environ.get("DRY_RUN", "false").lower() in ("true", "1", "yes")

    if not raw_input:
        print("[error] SALSING_INPUT is empty — provide a link or a topic", file=sys.stderr)
        sys.exit(1)

    print(f"[info] Generating one salsing (dry_run={dry_run})", file=sys.stderr)

    data = load_news_data()
    max_id = max((item["id"] for item in data["news"]), default=0)
    print(f"[info] Current max id: {max_id}", file=sys.stderr)

    input_is_url = is_url(raw_input)
    if input_is_url:
        print(f"[info] Input is a URL, fetching content: {raw_input}", file=sys.stderr)
        page_title, page_text = fetch_url_content(raw_input)
        context = f"Source URL: {raw_input}\n"
        if page_title:
            context += f"Page title: {page_title}\n"
        if page_text:
            context += f"Page content excerpt:\n{page_text}\n"
        user_prompt = (
            "Generate exactly ONE salsing based on this source article.\n\n"
            + context
            + "\nSet `link` to the source URL. Return it in the `salsing` object with "
            "title, content, category, size."
        )
    else:
        print(f"[info] Input is a free topic: {raw_input}", file=sys.stderr)
        user_prompt = (
            f"Generate exactly ONE salsing about this topic:\n\n{raw_input}\n\n"
            "Use your knowledge of recent tech news to ground it. Return it in the "
            "`salsing` object with title, content, category, size. Omit `link` unless "
            "you have a real source URL."
        )

    client = anthropic.Anthropic()
    print("[info] Calling Claude API...", file=sys.stderr)

    tool_def = {
        "name": "submit_salsing",
        "description": "Submit the generated salsing",
        "input_schema": SALSING_SCHEMA,
    }

    response = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        tools=[tool_def],
        tool_choice={"type": "tool", "name": "submit_salsing"},
        messages=[{"role": "user", "content": user_prompt}],
    )

    tool_block = None
    for block in response.content:
        if block.type == "tool_use" and block.name == "submit_salsing":
            tool_block = block
            break

    if not tool_block:
        print("[error] No tool_use block in Claude response", file=sys.stderr)
        print(f"[error] Content types: {[b.type for b in response.content]}", file=sys.stderr)
        sys.exit(1)

    try:
        salsing = tool_block.input["salsing"]
    except (KeyError, TypeError) as e:
        print(f"[error] Failed to extract salsing from tool input: {e}", file=sys.stderr)
        sys.exit(1)

    # Validate
    valid_categories = {"Tech", "Software", "Programming", "AI"}
    valid_sizes = {"small", "medium", "large"}
    if not all(k in salsing for k in ("title", "content", "category", "size")):
        print(f"[error] Salsing missing required fields: {salsing}", file=sys.stderr)
        sys.exit(1)
    if salsing["category"] not in valid_categories:
        print(f"[error] Invalid category: {salsing['category']}", file=sys.stderr)
        sys.exit(1)
    if salsing["size"] not in valid_sizes:
        print(f"[error] Invalid size: {salsing['size']}", file=sys.stderr)
        sys.exit(1)
    if len(salsing["title"]) > 80:
        print(f"[warn] Title too long ({len(salsing['title'])} chars), truncating", file=sys.stderr)
        salsing["title"] = salsing["title"][:80]

    # Force full-width rendering (grid-column: span 2 via the .large CSS class)
    salsing["size"] = "large"

    # Assign the next id
    salsing["id"] = max_id + 1

    # If the input was a URL, that URL is the authoritative source link
    if input_is_url:
        salsing["link"] = raw_input
    elif "link" in salsing and not salsing["link"]:
        del salsing["link"]

    print(f"[info] Generated salsing (id {salsing['id']})", file=sys.stderr)

    if dry_run:
        print(json.dumps(salsing, ensure_ascii=False, indent=2))
        print("[info] DRY RUN — no changes written", file=sys.stderr)
        return

    # Re-read to avoid race condition, then prepend (newest first)
    data = load_news_data()
    data["news"] = [salsing] + data["news"]
    save_news_data(data)
    print("[info] Wrote salsing to news-data.json", file=sys.stderr)

    # Output topic for the commit message
    title = salsing["title"]
    topic = title.split(":", 1)[-1].strip()[:40] if ":" in title else title[:40]
    write_github_output("topic", topic)
    print(f"[info] Topic: {topic}", file=sys.stderr)


if __name__ == "__main__":
    main()
