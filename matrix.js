// FULL SALSING — "matrix" easter egg.
// Type m-a-t-r-i-x anywhere on the page to swap the header sticker for the
// animated ASCII logo. Typing it again puts the sticker back.
//
// The heavy ASCII artwork lives in matrix-art.js and is only fetched the
// first time the egg is triggered.

(() => {
    const SECRET = 'matrix';
    const STORAGE_KEY = 'fullsalsing-matrix';
    const ART_SRC = 'matrix-art.js?v=20261124e';

    const link = document.querySelector('.header-link');
    if (!link) return;

    let buffer = '';
    let loading = false;

    function ensureWrap() {
        let wrap = link.querySelector('.matrix-logo-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'matrix-logo-wrap';
            wrap.setAttribute('aria-hidden', 'true');
            link.appendChild(wrap);
        }
        return wrap;
    }

    function fit(wrap) {
        const pre = wrap.querySelector('.matrix-logo');
        const art = window.MATRIX_LOGO;
        if (!pre || !art) return;

        const style = getComputedStyle(wrap);
        const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
        const availW = wrap.clientWidth - padX;
        const availH = wrap.clientHeight - padY;
        if (availW <= 0 || availH <= 0) return;

        let size = availW / (art.cols * 0.6);
        pre.style.fontSize = size + 'px';

        // Refine using the font's real advance width.
        const actualW = pre.scrollWidth;
        if (actualW > 0) {
            size *= availW / actualW;
            pre.style.fontSize = size + 'px';
        }

        // And make sure a tall grid does not spill out of the panel.
        const actualH = pre.getBoundingClientRect().height;
        if (actualH > availH) {
            size *= availH / actualH;
            pre.style.fontSize = size + 'px';
        }
    }

    function insertArt(wrap) {
        if (!window.MATRIX_LOGO || wrap.querySelector('.matrix-logo')) return;
        const pre = document.createElement('pre');
        pre.className = 'matrix-logo';
        pre.setAttribute('aria-hidden', 'true');
        pre.innerHTML = window.MATRIX_LOGO.html;
        wrap.appendChild(pre);
        requestAnimationFrame(() => fit(wrap));
    }

    function loadArt(done) {
        if (window.MATRIX_LOGO) {
            done();
            return;
        }
        if (loading) return;
        loading = true;
        const script = document.createElement('script');
        script.src = ART_SRC;
        script.async = true;
        script.onload = () => {
            loading = false;
            done();
        };
        script.onerror = () => {
            loading = false;
            deactivate();
            console.warn('FULL Salsing: could not load matrix-art.js');
        };
        document.head.appendChild(script);
    }

    function activate() {
        const wrap = ensureWrap();
        document.body.classList.add('matrix-on');
        try {
            sessionStorage.setItem(STORAGE_KEY, '1');
        } catch (err) { /* private mode */ }
        loadArt(() => insertArt(wrap));
    }

    function deactivate() {
        document.body.classList.remove('matrix-on');
        try {
            sessionStorage.removeItem(STORAGE_KEY);
        } catch (err) { /* private mode */ }
    }

    function toggle() {
        if (document.body.classList.contains('matrix-on')) {
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

    window.addEventListener('resize', () => {
        if (!document.body.classList.contains('matrix-on')) return;
        const wrap = link.querySelector('.matrix-logo-wrap');
        if (wrap) fit(wrap);
    });

    // Keep the egg on across reloads inside the same tab.
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

    // Handy for testing from the console.
    window.MatrixLogo = { activate, deactivate, toggle };
})();
