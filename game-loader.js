// FULL SALSING — "game" easter egg loader.
// Keeps the arcade payload out of the page until someone types the word.

(() => {
    const SECRET = 'game';
    const GAME_SRC = 'game.js?v=20261124w';
    const WINDOW_MS = 1500;

    let buffer = '';
    let lastKey = 0;
    let loading = false;

    function start() {
        if (window.SalsingGame) {
            if (!window.SalsingGame.isOpen()) window.SalsingGame.open();
            return;
        }
        if (loading) return;

        loading = true;
        const script = document.createElement('script');
        script.src = GAME_SRC;
        script.async = true;
        script.onload = () => {
            loading = false;
            if (window.SalsingGame) window.SalsingGame.open();
        };
        script.onerror = () => {
            loading = false;
            console.warn('FULL Salsing: could not load game.js');
        };
        document.head.appendChild(script);
    }

    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
        if (window.SalsingGame && window.SalsingGame.isOpen()) return;

        const target = event.target;
        if (target && target.matches && target.matches('input, textarea, select, [contenteditable="true"]')) {
            return;
        }

        if (event.key.length !== 1) {
            buffer = '';
            return;
        }

        const now = performance.now();
        if (now - lastKey > WINDOW_MS) buffer = '';
        lastKey = now;
        buffer = (buffer + event.key.toLowerCase()).slice(-SECRET.length);

        if (buffer === SECRET) {
            buffer = '';
            start();
        }
    });
})();
