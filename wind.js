// FULL SALSING — "wind" easter egg.
// Type w-i-n-d anywhere and a gust blows every salsing card off the page.
// The cards flutter back after a beat, ready for another gust.

(() => {
    const SECRET = 'wind';
    const KEY_WINDOW_MS = 1500;
    const GUST_MS = 1700;
    const RETURN_AT = 2200;
    const RETURN_MS = 1100;

    let buffer = '';
    let lastKey = 0;
    let busy = false;

    function makeGust() {
        const gust = document.createElement('div');
        gust.className = 'wind-gust';
        gust.setAttribute('aria-hidden', 'true');

        for (let i = 0; i < 30; i += 1) {
            const streak = document.createElement('span');
            const colorRoll = Math.random();
            const color = colorRoll < 0.45
                ? 'rgba(255, 255, 255, 0.95)'
                : colorRoll < 0.72
                    ? 'rgba(255, 20, 147, 0.55)'
                    : 'rgba(0, 190, 230, 0.5)';
            streak.style.cssText = [
                `top:${(Math.random() * 100).toFixed(2)}%`,
                `--w:${(10 + Math.random() * 28).toFixed(2)}vw`,
                `--t:${(0.8 + Math.random() * 0.7).toFixed(2)}s`,
                `--d:${(Math.random() * 0.3).toFixed(2)}s`,
                `--r:${(-14 + Math.random() * 22).toFixed(2)}deg`,
                `--o:${(0.35 + Math.random() * 0.5).toFixed(2)}`,
                `--c:${color}`
            ].join(';');
            gust.appendChild(streak);
        }

        document.body.appendChild(gust);
        setTimeout(() => gust.remove(), GUST_MS);
    }

    function blow() {
        if (busy) return;
        if (window.SalsingGame && window.SalsingGame.isOpen()) return;

        busy = true;
        makeGust();

        const cards = Array.from(document.querySelectorAll('#blocks-container .news-block'));
        if (!cards.length) {
            setTimeout(() => { busy = false; }, GUST_MS);
            return;
        }

        cards.forEach((card) => {
            card.classList.remove('wind-return');
            card.style.setProperty('--wind-x', `${(110 + Math.random() * 40).toFixed(2)}vw`);
            card.style.setProperty('--wind-y', `-${(10 + Math.random() * 45).toFixed(2)}vh`);
            card.style.setProperty('--wind-rot', `${(12 + Math.random() * 38).toFixed(2)}deg`);
            card.style.setProperty('--wind-delay', `${Math.round(Math.random() * 180)}ms`);
            card.classList.add('wind-blown');
        });

        setTimeout(() => {
            cards.forEach((card) => {
                card.classList.remove('wind-blown');
                card.classList.add('wind-return');
            });

            setTimeout(() => {
                cards.forEach((card) => {
                    card.classList.remove('wind-return');
                    card.style.removeProperty('--wind-x');
                    card.style.removeProperty('--wind-y');
                    card.style.removeProperty('--wind-rot');
                    card.style.removeProperty('--wind-delay');
                });
                busy = false;
            }, RETURN_MS);
        }, RETURN_AT);
    }

    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
        if (window.SalsingGame && window.SalsingGame.isOpen()) return;
        if (busy) return;

        const target = event.target;
        if (target && target.matches && target.matches('input, textarea, select, [contenteditable="true"]')) {
            return;
        }

        if (event.key.length !== 1) {
            buffer = '';
            return;
        }

        const now = performance.now();
        if (now - lastKey > KEY_WINDOW_MS) buffer = '';
        lastKey = now;
        buffer = (buffer + event.key.toLowerCase()).slice(-SECRET.length);

        if (buffer === SECRET) {
            buffer = '';
            blow();
        }
    });

    window.Wind = {
        isBusy: () => busy,
        blow
    };
})();
