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
    'Tech tabloid, zero apologies',
    'The Super-Pop of tech news',
    'Where traitors get their dose of salsing'
];

let newsStore = [];

let currentCarouselIndex = 0;

const ITEMS_PER_PAGE = 12;

let currentPage = 1;
let totalPages = 1;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    startCarousel();
    loadNews();
});

// Start carousel rotation
function startCarousel() {
    const elA = document.getElementById('carousel-text-a');
    const elB = document.getElementById('carousel-text-b');
    if (!elA || !elB) return;

    let active = elA;
    let inactive = elB;

    elA.textContent = CAROUSEL_SENTENCES[currentCarouselIndex];

    setInterval(() => {
        currentCarouselIndex = (currentCarouselIndex + 1) % CAROUSEL_SENTENCES.length;

        // Pre-load next text into the hidden element, then crossfade
        inactive.textContent = CAROUSEL_SENTENCES[currentCarouselIndex];
        inactive.classList.remove('carousel-item--hidden');
        active.classList.add('carousel-item--hidden');

        // Swap roles
        const tmp = active;
        active = inactive;
        inactive = tmp;
    }, 4000);
}

// Load news from JSON file
function loadNews() {
    fetch('./news-data.json')
        .then(response => response.json())
        .then(data => {
            newsStore = data.news || [];
            const requestedPage = parseInt(new URLSearchParams(window.location.search).get('page'), 10);
            currentPage = Number.isNaN(requestedPage) ? 1 : requestedPage;
            renderNews();
        })
        .catch(error => {
            console.error('Error loading news:', error);
            newsStore = [];
            renderNews();
        });
}

// Render all news blocks for the current page
function renderNews() {
    const container = document.getElementById('blocks-container');
    container.innerHTML = '';

    const sortedNews = getSortedNews();

    totalPages = Math.max(1, Math.ceil(sortedNews.length / ITEMS_PER_PAGE));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = sortedNews.slice(start, start + ITEMS_PER_PAGE);

    let hasEmbeds = false;

    pageItems.forEach((news, index) => {
        const block = createNewsBlock(news, index);
        container.appendChild(block);
        
        if (news.embed_html) {
            hasEmbeds = true;
        }
    });

    renderPagination();
    
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

// Group small blocks together, keep others as-is
function getSortedNews() {
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

    return sortedNews;
}

// Render pagination controls (top compact bar + bottom bar)
function renderPagination() {
    const navs = [
        document.getElementById('pagination-top'),
        document.getElementById('pagination')
    ].filter(Boolean);

    const makeButton = (label, page, { disabled = false, active = false, ariaLabel = null, scroll = true } = {}) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `pagination-button${active ? ' active' : ''}`;
        button.textContent = label;

        if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
        if (active) button.setAttribute('aria-current', 'page');

        if (disabled) {
            button.disabled = true;
        } else {
            button.addEventListener('click', () => goToPage(page, scroll));
        }

        return button;
    };

    navs.forEach(nav => {
        nav.innerHTML = '';

        if (totalPages <= 1) {
            nav.hidden = true;
            return;
        }

        // The top bar should not jump the viewport; the bottom bar scrolls back to the news.
        const scrollToNews = nav.id !== 'pagination-top';

        nav.hidden = false;

        nav.appendChild(makeButton('« Prev', currentPage - 1, {
            disabled: currentPage === 1,
            ariaLabel: 'Previous page',
            scroll: scrollToNews
        }));

        getPageNumbers(currentPage, totalPages).forEach(page => {
            if (page === '…') {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis';
                ellipsis.textContent = '…';
                nav.appendChild(ellipsis);
            } else {
                nav.appendChild(makeButton(String(page), page, {
                    active: page === currentPage,
                    ariaLabel: `Page ${page}`,
                    scroll: scrollToNews
                }));
            }
        });

        nav.appendChild(makeButton('Next »', currentPage + 1, {
            disabled: currentPage === totalPages,
            ariaLabel: 'Next page',
            scroll: scrollToNews
        }));
    });
}

// Build a compact page list, e.g. 1 … 4 5 6 … 12
function getPageNumbers(current, total) {
    const delta = 1;
    const pages = [];

    for (let page = 1; page <= total; page++) {
        if (page === 1 || page === total || Math.abs(page - current) <= delta) {
            pages.push(page);
        } else if (pages[pages.length - 1] !== '…') {
            pages.push('…');
        }
    }

    return pages;
}

// Navigate to a page and keep the URL shareable
function goToPage(page, scrollToNews = true) {
    const nextPage = Math.min(Math.max(1, page), totalPages);
    if (nextPage === currentPage) return;

    currentPage = nextPage;
    renderNews();

    const url = new URL(window.location.href);
    if (currentPage === 1) {
        url.searchParams.delete('page');
    } else {
        url.searchParams.set('page', currentPage);
    }
    window.history.replaceState(null, '', url);

    if (scrollToNews) {
        const content = document.querySelector('.content-grid');
        if (content) content.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Create a single news block element
function createNewsBlock(news, index = 0) {
    const block = document.createElement('article');
    block.style.setProperty('--stagger', index);
    const categoryClass = news.category.toLowerCase().replace(/\s+/g, '-');
    block.className = `news-block ${news.size} ${categoryClass}`;
    const imageClass = news.image_thumb ? 'block-image block-image--thumb' : 'block-image';
    const imageHTML = news.image ? `<img src="${news.image}" alt="${news.title}" class="${imageClass}" loading="lazy">` : '';
    
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


