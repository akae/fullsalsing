// FULL SALSING - Minimal JavaScript for maximum spice with minimal calories
// Traffic-optimized gossip delivery system

const CAROUSEL_SENTENCES = [
    'Tech news with a spicy flavour',
    'Sriracha based tech gossip',
    'Your unique source of truth',
    'Idiocracy++',
    'Sensationalism As A Service',
    'Silicon Valley\'s guilty pleasure',
    'Jalapeño-infused hot takes',
    'Burning through your feed',
    'Tech drama, extra crispy',
    'Hacker News but spicier',
    'NaCl with attitude',
    'FOMO as a feature',
    'Clickbait you can trust',
    'Too hot for Hacker News',
    'Chaos engineering for feeds',
    'Weaponized tech takes',
    'Where nuance goes to die',
    'Viral by design',
    'Your daily dose of drama',
    'Tech tabloid, zero apologies'
];

let newsStore = [];

let currentCarouselIndex = 0;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    startCarousel();
    loadNews();
});

// Start carousel rotation
function startCarousel() {
    const carouselText = document.getElementById('carousel-text');
    if (!carouselText) return;

    // Set initial sentence
    carouselText.textContent = CAROUSEL_SENTENCES[currentCarouselIndex];

    // Rotate every 4 seconds
    setInterval(() => {
        currentCarouselIndex = (currentCarouselIndex + 1) % CAROUSEL_SENTENCES.length;
        carouselText.textContent = CAROUSEL_SENTENCES[currentCarouselIndex];

        // Restart animation by removing and re-adding class
        carouselText.style.animation = 'none';
        setTimeout(() => {
            carouselText.style.animation = '';
        }, 10);
    }, 4000);
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
    
    // Group small blocks in pairs, keep others as-is
    const sortedNews = [];
    const smallBlocks = [];
    
    newsStore.forEach(news => {
        if (news.size === 'small') {
            smallBlocks.push(news);
        } else {
            // If we have accumulated small blocks and encounter a non-small, push them first
            if (smallBlocks.length > 0) {
                sortedNews.push(...smallBlocks);
                smallBlocks.length = 0;
            }
            sortedNews.push(news);
        }
    });
    
    // Add any remaining small blocks
    if (smallBlocks.length > 0) {
        sortedNews.push(...smallBlocks);
    }
    
    sortedNews.forEach(news => {
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
    
    const dateHTML = news.date ? `<span class="block-date">${formatDate(news.date)}</span>` : '';

    block.innerHTML = `
        ${imageHTML}
        <span class="block-category">${news.category}</span>
        <h2 class="block-title">${news.title.replace(/📈/g, '<span class="graph-icon">📈</span>')}</h2>
        <p class="block-content">${news.content}</p>
        ${dateHTML}
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

// Format an ISO date (YYYY-MM-DD) as e.g. "Jun 22, 2026"
function formatDate(iso) {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!parts) return iso;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const [, y, m, d] = parts;
    return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
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


