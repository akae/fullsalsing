// FULL SALSING - Minimal JavaScript for maximum spice with minimal calories
// Traffic-optimized gossip delivery system

const STORAGE_KEY = 'fullsalsing_news';
const CAROUSEL_SENTENCES = [
    'Tech news with a spicy flavour',
    'Sriracha based tech gossip',
    'Your unique source of truth',
    'Idiocracy++',
    'Sensationalism As A Service'
];

const DEFAULT_NEWS = [
    {
        id: 1,
        title: '🚨 BREAKING: New AI Model Too Smart To Care About Humans',
        content: 'Tech insiders report revolutionary ML breakthrough that just sighs whenever asked to explain itself.',
        category: 'AI',
        size: 'medium'
    },
    {
        id: 2,
        title: '⚡ JavaScript Frameworks Declare Independence',
        content: 'In a shocking turn of events, React announced it will henceforth only support projects it deems worthy.',
        category: 'Software',
        size: 'small'
    },
    {
        id: 3,
        title: '💥 Stack Overflow Users Achieve Consciousness',
        content: 'Users report gaining self-awareness after copying their 10,000th answer. Mods deny allegations.',
        category: 'Programming',
        size: 'small'
    },
    {
        id: 4,
        title: '🔥 Elon\'s Latest Idea: Twitter For Servers',
        content: 'Anonymous sources suggest a new platform where servers can tweet about overheating while humans watch helplessly.',
        category: 'Tech',
        size: 'large'
    }
];

let newsStore = [];
let nextId = 5;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    setRandomCarousel();
    loadNews();
    renderNews();
});

// Set random carousel sentence
function setRandomCarousel() {
    const randomSentence = CAROUSEL_SENTENCES[Math.floor(Math.random() * CAROUSEL_SENTENCES.length)];
    const carouselText = document.getElementById('carousel-text');
    if (carouselText) {
        carouselText.textContent = randomSentence;
    }
}

// Load news from localStorage or use defaults
function loadNews() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            newsStore = JSON.parse(stored);
            nextId = Math.max(...newsStore.map(n => n.id), 0) + 1;
        } catch (e) {
            newsStore = DEFAULT_NEWS;
        }
    } else {
        newsStore = [...DEFAULT_NEWS];
    }
}

// Save news to localStorage
function saveNews() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newsStore));
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
    block.innerHTML = `
        <span class="block-category">${news.category}</span>
        <h2 class="block-title">${news.title}</h2>
        <p class="block-content">${news.content}</p>
    `;
    
    return block;
}

// Delete news item
function deleteNews(id) {
    newsStore = newsStore.filter(n => n.id !== id);
    saveNews();
    renderNews();
}

