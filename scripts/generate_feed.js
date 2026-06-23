#!/usr/bin/env node
// Regenerate feed.xml from news-data.json. Run from anywhere: `node scripts/generate_feed.js`.

const fs = require("fs");
const path = require("path");

const SITE_URL = "https://fullsalsing.com";
const FEED_TITLE = "FULL SALSING — Tech Gossip with a Spicy Flavour";
const FEED_DESC = "Sensationalist tech news, programming gossip, and AI drama. 🌶️";
const PUBDATE_BASE = Date.UTC(2024, 0, 1);
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
  return new Date(ms).toUTCString();
}

function pubDateMs(item) {
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

const root = path.join(__dirname, "..");
const news = JSON.parse(
  fs.readFileSync(path.join(root, "news-data.json"), "utf8")
).news || [];

fs.writeFileSync(path.join(root, "feed.xml"), buildFeed(news));
console.log(`Wrote feed.xml with ${news.length} items.`);
