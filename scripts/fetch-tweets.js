#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

if (!BEARER_TOKEN) {
  console.error('Error: TWITTER_BEARER_TOKEN environment variable not set');
  process.exit(1);
}

async function searchTweets() {
  const url = new URL('https://api.twitter.com/2/tweets/search/recent');
  url.searchParams.append('query', '#fullsalsing -is:retweet');
  url.searchParams.append('max_results', '100');
  url.searchParams.append('tweet.fields', 'created_at,author_id,public_metrics');
  url.searchParams.append('expansions', 'author_id');
  url.searchParams.append('user.fields', 'username');

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.twitter.com',
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'User-Agent': 'fullsalsing-bot/1.0'
      }
    };

    https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (err) {
          reject(new Error(`Failed to parse API response: ${err.message}`));
        }
      });
    }).on('error', reject).end();
  });
}

function formatTweet(tweet, author) {
  return {
    id: tweet.id,
    title: tweet.text.substring(0, 100) + (tweet.text.length > 100 ? '...' : ''),
    content: tweet.text,
    category: 'News',
    size: tweet.public_metrics?.like_count > 100 ? 'large' : 'medium',
    link: `https://x.com/${author.username}/status/${tweet.id}`,
    created_at: tweet.created_at,
    likes: tweet.public_metrics?.like_count || 0,
    retweets: tweet.public_metrics?.retweet_count || 0
  };
}

async function main() {
  try {
    console.log('Fetching tweets for #fullsalsing...');
    const result = await searchTweets();

    if (!result.data || result.data.length === 0) {
      console.log('No tweets found');
      // Keep existing data if no new tweets
      return;
    }

    // Create a map of users
    const usersMap = {};
    if (result.includes?.users) {
      result.includes.users.forEach(user => {
        usersMap[user.id] = user;
      });
    }

    // Format tweets
    const news = result.data.map(tweet => {
      const author = usersMap[tweet.author_id] || { username: 'unknown' };
      return formatTweet(tweet, author);
    });

    // Sort by likes
    news.sort((a, b) => b.likes - a.likes);

    const output = { news };
    fs.writeFileSync('news-data.json', JSON.stringify(output, null, 2));
    console.log(`Successfully saved ${news.length} tweets to news-data.json`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
