// FULL SALSING — "matrix" easter egg.
// Typing m-a-t-r-i-x swaps the header sticker for the animated ASCII GIF.
// Typing it again puts the sticker back; the mode lasts for the tab.

(() => {
    const SECRET = 'matrix';
    const STORAGE_KEY = 'fullsalsing-matrix';
    const GIF_SRC = 'ascii/fullsalsing-ascii.gif?v=20261124a';

    const link = document.querySelector('.header-link');
    if (!link) return;

    let buffer = '';
    let wanted = false;
    let loaded = false;
    let image = null;

    function ensureImage() {
        if (image) return image;

        image = document.createElement('img');
        image.className = 'matrix-gif';
        image.alt = 'FULL Salsing animated ASCII logo';
        image.decoding = 'async';
        image.addEventListener('load', () => {
            loaded = true;
            if (wanted) document.body.classList.add('matrix-on');
        });
        image.addEventListener('error', () => {
            console.warn('FULL Salsing: could not load the matrix GIF');
        });
        image.src = GIF_SRC;
        link.appendChild(image);

        if (image.complete && image.naturalWidth) {
            loaded = true;
            if (wanted) document.body.classList.add('matrix-on');
        }
        return image;
    }

    function activate() {
        wanted = true;
        try {
            sessionStorage.setItem(STORAGE_KEY, '1');
        } catch (err) { /* private mode */ }

        ensureImage();
        if (loaded && wanted) document.body.classList.add('matrix-on');
    }

    function deactivate() {
        wanted = false;
        document.body.classList.remove('matrix-on');
        try {
            sessionStorage.removeItem(STORAGE_KEY);
        } catch (err) { /* private mode */ }
    }

    function toggle() {
        if (wanted || document.body.classList.contains('matrix-on')) {
            deactivate();
        } else {
            activate();
        }
    }

    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
        const target = event.target;
        if (target && target.matches && target.matches('input, textarea, select, [contenteditable="true"]')) {
            return;
        }
        if (event.key.length !== 1) {
            buffer = '';
            return;
        }
        buffer = (buffer + event.key.toLowerCase()).slice(-SECRET.length);
        if (buffer === SECRET) {
            buffer = '';
            toggle();
        }
    });

    // Keep the mode on across reloads inside the same tab.
    const restore = () => {
        try {
            if (sessionStorage.getItem(STORAGE_KEY) === '1') activate();
        } catch (err) { /* private mode */ }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', restore, { once: true });
    } else {
        restore();
    }

    window.MatrixLogo = { activate, deactivate, toggle };
})();
