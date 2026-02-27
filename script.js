// FULL SALSING - Minimal JavaScript for maximum spice with minimal calories
// Traffic-optimized gossip delivery system

const CAROUSEL_SENTENCES = [
    'Tech news with a spicy flavour',
    'Sriracha based tech gossip',
    'Your unique source of truth',
    'Idiocracy++',
    'Sensationalism As A Service'
];

let newsStore = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    setRandomCarousel();
    loadNews();
});

// Set random carousel sentence
function setRandomCarousel() {
    const randomSentence = CAROUSEL_SENTENCES[Math.floor(Math.random() * CAROUSEL_SENTENCES.length)];
    const carouselText = document.getElementById('carousel-text');
    if (carouselText) {
        carouselText.textContent = randomSentence;
    }
}

// Load news from JSON file
function loadNews() {
    fetch('./news-data.json')
        .then(response => response.json())
        .then(data => {
            newsStore = data.news || [];
            renderNews();
        })
        .catch(error => {
            console.error('Error loading news:', error);
            newsStore = [];
            renderNews();
        });
}

// Render all news blocks
function renderNews() {
    const container = document.getElementById('blocks-container');
    container.innerHTML = '';
    
    let hasEmbeds = false;
    
    newsStore.forEach(news => {
        const block = createNewsBlock(news);
        container.appendChild(block);
        
        if (news.embed_html) {
            hasEmbeds = true;
        }
    });
    
    // Load Twitter script if there are embeds
    if (hasEmbeds && !window.twttr) {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.charset = 'utf-8';
        script.onload = () => {
            // Process tweets after script loads
            if (window.twttr && window.twttr.widgets) {
                window.twttr.widgets.load();
            }
        };
        document.body.appendChild(script);
    } else if (hasEmbeds && window.twttr && window.twttr.widgets) {
        // Script already loaded, just process
        window.twttr.widgets.load();
    }
}

// Create a single news block element
function createNewsBlock(news) {
    const block = document.createElement('article');
    block.className = `news-block ${news.size}`;
    const imageHTML = news.image ? `<img src="${news.image}" alt="${news.title}" class="block-image" loading="lazy">` : '';
    
    block.innerHTML = `
        ${imageHTML}
        <span class="block-category">${news.category}</span>
        <h2 class="block-title">${news.title}</h2>
        <p class="block-content">${news.content}</p>
    `;
    
    // Add link button with sriracha emoji (use link or tweet_url)
    const linkUrl = news.link || news.tweet_url;
    if (linkUrl) {
        const linkButton = document.createElement('a');
        linkButton.href = linkUrl;
        linkButton.target = '_blank';
        linkButton.className = 'block-link-button';
        linkButton.innerHTML = '<img src="./sriracha.webp" alt="link" class="link-icon"> Link...';
        block.appendChild(linkButton);
    }
    
    // Generate Twitter embed if link is a Twitter URL and no custom embed provided
    let embedHtml = news.embed_html;
    if (!embedHtml && linkUrl && isTwitterUrl(linkUrl)) {
        embedHtml = generateTwitterEmbed(linkUrl);
    }
    
    // Add Twitter embed if available
    if (embedHtml) {
        const embedContainer = document.createElement('div');
        embedContainer.className = 'tweet-embed-container';
        embedContainer.innerHTML = embedHtml;
        block.appendChild(embedContainer);
    }
    
    return block;
}

// Check if URL is a Twitter/X URL
function isTwitterUrl(url) {
    return /(?:twitter\.com|x\.com)\/\w+\/status\/\d+/.test(url);
}

// Extract tweet ID from Twitter URL
function extractTweetId(url) {
    const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
    return match ? match[1] : null;
}

// Generate Twitter embed HTML from URL
function generateTwitterEmbed(tweetUrl) {
    const tweetId = extractTweetId(tweetUrl);
    if (!tweetId) return null;
    
    // Convert x.com to twitter.com for embed
    const twitterUrl = `https://twitter.com/i/web/status/${tweetId}`;
    
    return `<blockquote class="twitter-tweet" data-media-max-width="560"><a href="${twitterUrl}"></a></blockquote>`;
}


