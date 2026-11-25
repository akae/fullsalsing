// FULL SALSING — mobile shortcut buttons for the easter eggs.

(() => {
    const nav = document.querySelector('.mobile-eggs');
    if (!nav) return;

    const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    nav.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-egg]');
        if (!button) return;

        if (button.dataset.egg === 'matrix') {
            if (window.MatrixLogo) window.MatrixLogo.toggle();
            toTop();
        } else if (button.dataset.egg === 'game') {
            if (window.SalsingGameLoader) window.SalsingGameLoader.open();
        } else if (button.dataset.egg === 'wind') {
            toTop();
            setTimeout(() => {
                if (window.Wind) window.Wind.blow();
            }, 160);
        }
    });
})();
