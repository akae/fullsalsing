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
    
    newsStore.forEach(news => {
        const block = createNewsBlock(news);
        container.appendChild(block);
    });
}

// Create a single news block element
function createNewsBlock(news) {
    const block = document.createElement('article');
    block.className = `news-block ${news.size}`;
    const linkHTML = news.link ? `<a href="${news.link}" target="_blank" class="block-link">Read more →</a>` : '';
    
    block.innerHTML = `
        <span class="block-category">${news.category}</span>
        <h2 class="block-title">${news.title}</h2>
        <p class="block-content">${news.content}</p>
        ${linkHTML}
    `;
    
    // Add tweet embed if tweet_url exists
    if (news.tweet_url) {
        const tweetId = extractTweetId(news.tweet_url);
        if (tweetId) {
            const tweetEmbed = document.createElement('div');
            tweetEmbed.className = 'tweet-embed-container';
            // Use iframe for reliable embedding
            tweetEmbed.innerHTML = `<iframe width="100%" height="400" src="https://twitter.com/i/web/status/${tweetId}" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
            block.appendChild(tweetEmbed);
        }
    }
    
    return block;
}

// Extract tweet ID from various Twitter URL formats
function extractTweetId(url) {
    const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
    return match ? match[1] : null;
}

