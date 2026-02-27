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
        const tweetEmbed = document.createElement('div');
        tweetEmbed.className = 'tweet-embed-container';
        tweetEmbed.innerHTML = `<blockquote class="twitter-tweet"><a href="${news.tweet_url}"></a></blockquote>`;
        block.appendChild(tweetEmbed);
        
        // Load Twitter widgets script if not already loaded
        if (!window.twttr) {
            const script = document.createElement('script');
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            script.charset = 'utf-8';
            document.body.appendChild(script);
        } else {
            // If script already loaded, process the new tweet
            window.twttr.widgets.load(tweetEmbed);
        }
    }
    
    return block;
}

