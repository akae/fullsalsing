// FULL SALSING — client-side RSS generator.
// Fetches news-data.json and builds an RSS 2.0 feed on the fly.
// NOTE: RSS readers can't run JS, so this is a viewer/exporter, not a live
// subscribable endpoint. Use the "Download feed.xml" button to produce a real
// static feed file.

const SITE_URL = "https://fullsalsing.com";
const FEED_TITLE = "FULL SALSING — Tech Gossip with a Spicy Flavour";
const FEED_DESC = "Sensationalist tech news, programming gossip, and AI drama. 🌶️";

// Stable base for id-derived pubDates (higher id = newer). Readers dedupe on
// the stable <guid>, so these synthetic dates only drive sort order.
const PUBDATE_BASE = Date.UTC(2024, 0, 1); // 2024-01-01 UTC
const HOUR_MS = 3600 * 1000;

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(ms) {
  // Date.prototype.toUTCString() already returns RFC-822-style GMT dates.
  return new Date(ms).toUTCString();
}

function pubDateMs(item) {
  // Prefer the real (commit-estimated) date; fall back to an id-derived date.
  if (item.date && /^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
    const [y, m, d] = item.date.split("-").map(Number);
    return Date.UTC(y, m - 1, d, 12, 0, 0);
  }
  return PUBDATE_BASE + (item.id || 0) * HOUR_MS;
}

function itemXml(item) {
  const id = item.id || 0;
  const link = item.link || `${SITE_URL}/#${id}`;
  const guid = `${SITE_URL}/#${id}`;
  const pub = pubDateMs(item);

  let body = (item.content || "").trim();
  if (item.image) {
    body = `<img src="${escapeXml(item.image)}" alt="" /><br/>${body}`;
  }

  const parts = [
    "    <item>",
    `      <title>${escapeXml((item.title || "").trim())}</title>`,
    `      <link>${escapeXml(link)}</link>`,
    `      <guid isPermaLink="false">${escapeXml(guid)}</guid>`,
    `      <pubDate>${rfc822(pub)}</pubDate>`,
  ];
  if (item.category) {
    parts.push(`      <category>${escapeXml(item.category)}</category>`);
  }
  // CDATA keeps the HTML body intact; guard against a literal "]]>" sequence.
  const safeBody = body.replace(/]]>/g, "]]&gt;");
  parts.push(`      <description><![CDATA[${safeBody}]]></description>`);
  parts.push("    </item>");
  return parts.join("\n");
}

function buildFeed(news) {
  const items = news.map(itemXml);
  const lastBuild = news.reduce((m, i) => Math.max(m, pubDateMs(i)), PUBDATE_BASE);

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(FEED_DESC)}</description>
    <language>en</language>
    <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>
`;
}

async function init() {
  const output = document.getElementById("feed-output");
  const status = document.getElementById("status");
  const downloadBtn = document.getElementById("download-btn");
  const copyBtn = document.getElementById("copy-btn");

  try {
    const res = await fetch("news-data.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const feed = buildFeed(data.news || []);

    output.textContent = feed;
    status.textContent = `Generated feed with ${(data.news || []).length} items.`;

    downloadBtn.disabled = false;
    downloadBtn.addEventListener("click", () => {
      const blob = new Blob([feed], { type: "application/rss+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "feed.xml";
      a.click();
      URL.revokeObjectURL(url);
    });

    copyBtn.disabled = false;
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(feed);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy to clipboard"), 1500);
    });
  } catch (err) {
    status.textContent = `Failed to build feed: ${err.message}`;
  }
}

// Browser: wire up the page. Node (CI feed generation): export buildFeed.
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", init);
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildFeed };
}
