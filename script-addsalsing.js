// FULL SALSING - Add Salsing Page
// Handles news addition and data management for the addsalsing page

const STORAGE_KEY = 'fullsalsing_news';

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// Setup event listeners for admin forms
function setupEventListeners() {
    const addNewsForm = document.getElementById('add-news-form');
    const exportBtn = document.getElementById('export-data');
    const importBtn = document.getElementById('import-data');
    const importFile = document.getElementById('import-file');

    // Add news form submission
    addNewsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('news-title').value;
        const content = document.getElementById('news-content').value;
        const category = document.getElementById('news-category').value;
        const size = document.getElementById('news-size').value;

        if (title.trim() && content.trim()) {
            addNews(title, content, category, size);
            addNewsForm.reset();
            document.getElementById('news-size').value = 'medium';
        }
    });

    // Export data as JSON
    exportBtn.addEventListener('click', () => {
        const newsStore = getNewsStore();
        const dataStr = JSON.stringify(newsStore, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fullsalsing-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    // Import data from JSON
    importBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    if (Array.isArray(imported)) {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
                        alert('✅ Data imported successfully!');
                    } else {
                        alert('⚠️ Invalid data format');
                    }
                } catch (err) {
                    alert('❌ Error importing file');
                }
            };
            reader.readAsText(file);
        }
    });
}

// Get news store from localStorage
function getNewsStore() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    }
    return [];
}

// Add new news item
function addNews(title, content, category, size) {
    const newsStore = getNewsStore();
    const nextId = newsStore.length > 0 ? Math.max(...newsStore.map(n => n.id), 0) + 1 : 1;
    
    const newItem = {
        id: nextId,
        title,
        content,
        category,
        size
    };
    
    newsStore.unshift(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newsStore));
    
    alert('🔥 Your spicy take has been added! Heading back to the feed...');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}
