#!/usr/bin/env node
// Regenerate feed.xml from news-data.json using the shared buildFeed() logic
// in rss.js. Run from anywhere: `node scripts/generate_feed.js`.

const fs = require("fs");
const path = require("path");
const { buildFeed } = require("../rss.js");

const root = path.join(__dirname, "..");
const news = JSON.parse(
  fs.readFileSync(path.join(root, "news-data.json"), "utf8")
).news || [];

fs.writeFileSync(path.join(root, "feed.xml"), buildFeed(news));
console.log(`Wrote feed.xml with ${news.length} items.`);
