// FULL SALSING — "game" easter egg: Salsing Breaker.
// Inverted Arkanoid: the pepper paddle sits at the top, the ball travels down
// through a wall of salsing cards, and the bottom wall sends it back up.
//
// Loaded on demand by game-loader.js.

(() => {
    'use strict';

    const MAX_BLOCKS = 24;
    const CATEGORY_COLOR = {
        Tech: '#ff5fae',
        Software: '#5ad7ff',
        Programming: '#b48cff',
        AI: '#ffd166'
    };
    const FONT = '"DejaVu Sans Mono", "Liberation Mono", Menlo, Consolas, "Courier New", monospace';
    const EMOJI_FONT = '"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif';

    // The ball image; it gets a rotational kick on every impact.
    const BALL_IMAGE_SRC = 'pball.png';

    const FALLBACK_TITLES = [
        '🌶️ BREAKING: The Salsing Server Is Down Again',
        '🚨 EXCLUSIVE: Someone Found a Bug in the Matrix',
        '🔥 SHOCKING: Pepper Considered Too Spicy for Production',
        '💥 CONFIRMED: The Build Was Green All Along',
        '⚡ LOSER ALERT: The Linter Has Opinions',
        '🤡 BREAKING: Tenx Developer Ships on Friday',
        '💉 SHOCKING: AI Now Has a Favourite Hot Sauce',
        '🌶️ EXCLUSIVE: GPU Prices Hit a New Emotional Low',
        '🚨 SHOCKING: Cloud Goes Down, Blames the Weather',
        '🔥 BREAKING: Framework Renames Itself to Vibe',
        '⚖️ LOSER ALERT: The Lawsuit Has a Newsletter',
        '💊 CONFIRMED: Productivity Hack Is Just Sleep',
        '🌶️ SHOCKING: The Pepper Has a Roadmap',
        '🚨 EXCLUSIVE: AI Writes Its Own Performance Review',
        '🔥 BREAKING: Cloud Bill Achieves Sentience',
        '💥 CONFIRMED: The Bug Was a Feature All Along',
        '⚡ LOSER ALERT: The Standup Could Have Been an Email',
        '🤡 SHOCKING: Founder Discovers Version Control',
        '💉 EXCLUSIVE: GPU Now Requires a Second Mortgage',
        '🌶️ BREAKING: Hot Take Causes Actual Fire',
        '🚨 SHOCKING: The Roadmap Was a Screenshot',
        '🔥 EXCLUSIVE: AI Startup Raises Another Round of Vibes',
        '⚖️ LOSER ALERT: The Benchmark Was a Lie',
        '💊 CONFIRMED: Sleep Is Still Undefeated'
    ];

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const rand = (lo, hi) => lo + Math.random() * (hi - lo);

    let overlay = null;
    let canvas = null;
    let ctx = null;
    let closeBtn = null;
    let isOpen = false;
    let raf = 0;
    let lastTime = 0;
    let W = 0;
    let H = 0;
    let dpr = 1;

    let state = 'ready'; // ready | playing | paused | won | lost
    let score = 0;
    let lives = 3;
    let blocks = [];
    let particles = [];
    let trail = [];
    let shake = 0;
    let lastFocus = null;
    let resizeTimer = 0;
    let ballImage = null;

    const paddle = { x: 0, y: 0, w: 0, h: 24, targetX: 0, speed: 900 };
    const ball = { x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, r: 8, speed: 420, angle: 0, spin: 0 };
    const keys = { left: false, right: false };

    // ---------------------------------------------------------------- helpers

    function hexToRgba(hex, alpha) {
        const n = parseInt(hex.slice(1), 16);
        const r = (n >> 16) & 255;
        const g = (n >> 8) & 255;
        const b = n & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function roundRect(x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, w, h, rr);
            return;
        }
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
    }

    function splitTitle(title) {
        const text = String(title || 'SALSING');
        const match = text.match(/^([^\w\s]+)\s*(.*)$/u);
        if (match && match[1] && match[2]) return [match[1], match[2]];
        return ['🌶️', text];
    }

    function fitText(text, maxWidth, font) {
        ctx.font = font;
        if (ctx.measureText(text).width <= maxWidth) return text;
        const chars = Array.from(text);
        let lo = 0;
        let hi = chars.length;
        while (lo < hi) {
            const mid = Math.ceil((lo + hi) / 2);
            const candidate = chars.slice(0, mid).join('') + '…';
            if (ctx.measureText(candidate).width <= maxWidth) lo = mid;
            else hi = mid - 1;
        }
        return chars.slice(0, Math.max(0, lo)).join('') + '…';
    }

    // ------------------------------------------------------------- lifecycle

    function open() {
        if (isOpen) return;
        isOpen = true;
        lastFocus = document.activeElement;

        overlay = document.createElement('div');
        overlay.className = 'game-overlay';
        overlay.tabIndex = -1;
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Salsing Breaker arcade game');
        overlay.innerHTML =
            '<canvas class="game-canvas" aria-hidden="true"></canvas>' +
            '<button type="button" class="game-close" aria-label="Close game">×</button>' +
            '<p class="sr-only">Move the pepper with the mouse, touch, arrow keys, or A and D. ' +
            'Press space to serve. Press escape to close the game.</p>';
        document.body.appendChild(overlay);

        canvas = overlay.querySelector('.game-canvas');
        ctx = canvas.getContext('2d');
        closeBtn = overlay.querySelector('.game-close');
        canvas.setAttribute('aria-hidden', 'true');
        document.body.classList.add('game-on');

        closeBtn.addEventListener('click', onCloseClick);
        canvas.addEventListener('pointermove', onPointerMove, { passive: true });
        canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onBlur);
        window.addEventListener('resize', onResize);

        if (BALL_IMAGE_SRC && !ballImage) {
            ballImage = new Image();
            ballImage.src = BALL_IMAGE_SRC;
        }

        resize(true);
        resetGame();
        lastTime = performance.now();
        raf = requestAnimationFrame(loop);
        overlay.focus({ preventScroll: true });
    }

    function close() {
        if (!isOpen) return;
        isOpen = false;
        cancelAnimationFrame(raf);
        raf = 0;
        clearTimeout(resizeTimer);

        closeBtn.removeEventListener('click', onCloseClick);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('blur', onBlur);
        window.removeEventListener('resize', onResize);

        overlay.remove();
        overlay = null;
        canvas = null;
        ctx = null;
        closeBtn = null;
        document.body.classList.remove('game-on');
        keys.left = false;
        keys.right = false;

        if (lastFocus && typeof lastFocus.focus === 'function') {
            lastFocus.focus({ preventScroll: true });
        }
        lastFocus = null;
    }

    function onCloseClick(event) {
        event.preventDefault();
        event.stopPropagation();
        close();
    }

    // ---------------------------------------------------------------- layout

    function resize(first = false) {
        W = Math.max(320, overlay.clientWidth || window.innerWidth);
        H = Math.max(320, overlay.clientHeight || window.innerHeight);
        dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        layout();

        if (!first && (state === 'playing' || state === 'ready')) {
            // A resize can put the ball inside the new block layout; re-serve.
            resetBall();
        }
    }

    function layout() {
        const margin = clamp(W * 0.035, 14, 48);
        const cols = clamp(Math.floor((W - margin * 2) / (W < 600 ? 115 : 150)), 3, 6);
        const rows = Math.max(1, Math.ceil(blocks.length / cols));

        const oldCenter = paddle.w ? paddle.x + paddle.w / 2 : W / 2;
        paddle.w = clamp(W * 0.17, 92, 156);
        paddle.h = clamp(W * 0.017, 20, 28);
        paddle.y = clamp(H * 0.115, 70, 112);
        paddle.x = clamp(oldCenter - paddle.w / 2, 8, W - 8 - paddle.w);
        paddle.targetX = paddle.x;

        const topLimit = paddle.y + paddle.h + 64;
        const gridTop = Math.max(topLimit, H * 0.26);
        const bottomLimit = H - Math.max(64, H * 0.12);
        const availH = Math.max(120, bottomLimit - gridTop);
        const gap = clamp(W * 0.008, 4, 10);
        const blockW = (W - margin * 2 - (cols - 1) * gap) / cols;
        const blockH = clamp((availH - (rows - 1) * gap) / rows, 30, 72);
        const gridH = rows * blockH + (rows - 1) * gap;
        const startY = gridTop;

        blocks.forEach((block, index) => {
            block.col = index % cols;
            block.row = Math.floor(index / cols);
            block.x = margin + block.col * (blockW + gap);
            block.y = startY + block.row * (blockH + gap);
            block.w = blockW;
            block.h = blockH;
        });
    }

    function buildBlocks() {
        const news = (typeof newsStore !== 'undefined' && Array.isArray(newsStore)) ? newsStore : [];
        const maxBlocks = W < 600 ? 12 : MAX_BLOCKS;
        const source = news.length ? news.slice(0, maxBlocks) : [];

        blocks = source.map((item) => ({
            title: item.title || 'SALSING',
            category: item.category || 'Tech',
            alive: true,
            x: 0, y: 0, w: 0, h: 0,
            col: 0, row: 0
        }));

        while (blocks.length < maxBlocks) {
            const title = FALLBACK_TITLES[blocks.length % FALLBACK_TITLES.length];
            blocks.push({
                title,
                category: ['Tech', 'Software', 'Programming', 'AI'][blocks.length % 4],
                alive: true,
                x: 0, y: 0, w: 0, h: 0,
                col: 0, row: 0
            });
        }
    }

    function resetGame() {
        score = 0;
        lives = 3;
        particles = [];
        trail = [];
        shake = 0;
        buildBlocks();
        layout();
        paddle.x = (W - paddle.w) / 2;
        paddle.targetX = paddle.x;
        resetBall();
        state = 'ready';
    }

    function resetBall() {
        ball.r = clamp(W * 0.008, 7, 10);
        ball.speed = clamp(H * 0.55, 300, 520);
        ball.x = paddle.x + paddle.w / 2;
        ball.y = paddle.y + paddle.h + ball.r + 6;
        ball.px = ball.x;
        ball.py = ball.y;
        ball.vx = 0;
        ball.vy = 0;
        ball.angle = 0;
        ball.spin = 0;
        trail = [];
        state = 'ready';
    }

    function serve() {
        if (state === 'ready') {
            ball.x = paddle.x + paddle.w / 2;
            ball.y = paddle.y + paddle.h + ball.r + 6;
            ball.px = ball.x;
            ball.py = ball.y;
            state = 'playing';
            const angle = Math.PI / 2 + rand(-0.55, 0.55);
            ball.vx = Math.cos(angle) * ball.speed;
            ball.vy = Math.sin(angle) * ball.speed;
            normalizeBall();
        } else if (state === 'won' || state === 'lost') {
            resetGame();
            serve();
        } else if (state === 'paused') {
            state = 'playing';
        }
    }

    function normalizeBall() {
        const speed = ball.speed;
        let magnitude = Math.hypot(ball.vx, ball.vy) || 1;
        ball.vx = (ball.vx / magnitude) * speed;
        ball.vy = (ball.vy / magnitude) * speed;

        // Never let the ball settle into a pure horizontal loop.
        if (Math.abs(ball.vy) < speed * 0.3) {
            ball.vy = (ball.vy < 0 ? -1 : 1) * speed * 0.3;
            magnitude = Math.hypot(ball.vx, ball.vy);
            ball.vx = (ball.vx / magnitude) * speed;
            ball.vy = (ball.vy / magnitude) * speed;
        }
    }

    // ---------------------------------------------------------------- inputs

    function pointerX(event) {
        const rect = canvas.getBoundingClientRect();
        return ((event.clientX - rect.left) / rect.width) * W;
    }

    function onPointerMove(event) {
        if (!isOpen) return;
        const x = pointerX(event);
        paddle.targetX = clamp(x - paddle.w / 2, 8, W - 8 - paddle.w);
    }

    function onPointerDown(event) {
        if (!isOpen) return;
        event.preventDefault();
        const x = pointerX(event);
        paddle.targetX = clamp(x - paddle.w / 2, 8, W - 8 - paddle.w);
        paddle.x = paddle.targetX;
        serve();
    }

    function onKeyDown(event) {
        if (!isOpen) return;
        if (event.target === closeBtn && (event.key === ' ' || event.key === 'Enter')) return;

        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                close();
                break;
            case ' ':
                event.preventDefault();
                serve();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                event.preventDefault();
                keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                event.preventDefault();
                keys.right = true;
                break;
            case 'p':
            case 'P':
                if (state === 'playing') state = 'paused';
                else if (state === 'paused') state = 'playing';
                break;
            default:
                break;
        }
    }

    function onKeyUp(event) {
        if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') keys.left = false;
        if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') keys.right = false;
    }

    function onBlur() {
        keys.left = false;
        keys.right = false;
    }

    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (isOpen) resize();
        }, 120);
    }

    // ----------------------------------------------------------------- physics

    function update(dt) {
        const direction = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        if (direction !== 0) {
            paddle.targetX = clamp(
                paddle.targetX + direction * paddle.speed * dt,
                8,
                W - 8 - paddle.w
            );
        }
        paddle.x = clamp(paddle.targetX, 8, W - 8 - paddle.w);

        if (state === 'ready') {
            ball.x = paddle.x + paddle.w / 2;
            ball.y = paddle.y + paddle.h + ball.r + 6;
            ball.px = ball.x;
            ball.py = ball.y;
            ball.vx = 0;
            ball.vy = 0;
        } else if (state === 'playing') {
            const travel = (Math.abs(ball.vx) + Math.abs(ball.vy)) * dt;
            const steps = Math.max(1, Math.ceil(travel / (ball.r * 1.2)));
            const step = dt / steps;

            for (let i = 0; i < steps; i += 1) {
                if (state !== 'playing') break;
                stepBall(step);
            }

            ball.angle += ball.spin * dt;
            ball.spin *= Math.exp(-1.4 * dt);
            if (Math.abs(ball.spin) < 0.03) ball.spin = 0;

            trail.unshift({ x: ball.x, y: ball.y });
            if (trail.length > 8) trail.pop();
        }

        updateParticles(dt);
        shake = Math.max(0, shake - dt * 55);
    }

    function kickSpin(amount) {
        ball.spin = clamp(ball.spin + amount, -22, 22);
        ball.angle += clamp(amount * 0.035, -0.35, 0.35);
    }

    function stepBall(dt) {
        ball.px = ball.x;
        ball.py = ball.y;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        // Side walls.
        if (ball.x < ball.r) {
            ball.x = ball.r;
            ball.vx = Math.abs(ball.vx);
            kickSpin(ball.vy * 0.018);
        } else if (ball.x > W - ball.r) {
            ball.x = W - ball.r;
            ball.vx = -Math.abs(ball.vx);
            kickSpin(-ball.vy * 0.018);
        }

        // Bottom wall: the only thing that sends the ball back up.
        if (ball.y > H - ball.r) {
            ball.y = H - ball.r;
            ball.vy = -Math.abs(ball.vy);
            shake = Math.max(shake, 1.5);
            kickSpin(ball.vx * 0.018);
        }

        // Pepper paddle.
        if (
            ball.vy < 0 &&
            ball.py > paddle.y + paddle.h &&
            ball.y - ball.r < paddle.y + paddle.h &&
            ball.y + ball.r > paddle.y &&
            ball.x + ball.r > paddle.x &&
            ball.x - ball.r < paddle.x + paddle.w
        ) {
            const offset = clamp(
                (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2),
                -1,
                1
            );
            const angle = Math.PI / 2 + offset * 0.95;
            ball.vx = Math.cos(angle) * ball.speed;
            ball.vy = Math.abs(Math.sin(angle) * ball.speed);
            ball.y = paddle.y + paddle.h + ball.r + 1;
            normalizeBall();
            kickSpin(-ball.vx * 0.018 + offset * 3);
            burst(ball.x, paddle.y + paddle.h, '#ffcf7a', 4, 140);
        }

        // Missed the pepper: the top is out of bounds.
        if (ball.y < paddle.y - ball.r * 0.4) {
            loseLife();
            return;
        }

        // Blocks.
        for (const block of blocks) {
            if (!block.alive) continue;
            if (!circleHitsRect(ball.x, ball.y, ball.r, block)) continue;
            hitBlock(block);
            break;
        }
    }

    function circleHitsRect(cx, cy, radius, rect) {
        const nx = clamp(cx, rect.x, rect.x + rect.w);
        const ny = clamp(cy, rect.y, rect.y + rect.h);
        const dx = cx - nx;
        const dy = cy - ny;
        return dx * dx + dy * dy <= radius * radius;
    }

    function hitBlock(block) {
        block.alive = false;
        score += 10;
        shake = Math.max(shake, 5);

        const color = CATEGORY_COLOR[block.category] || '#ff5fae';
        burst(block.x + block.w / 2, block.y + block.h / 2, color, 12, 240);
        burst(block.x + block.w / 2, block.y + block.h / 2, '#ffd166', 4, 180);

        const cameFromLeft = ball.px + ball.r <= block.x;
        const cameFromRight = ball.px - ball.r >= block.x + block.w;
        const cameFromTop = ball.py + ball.r <= block.y;
        const cameFromBottom = ball.py - ball.r >= block.y + block.h;

        if (cameFromLeft || cameFromRight) {
            ball.vx *= -1;
            ball.x += ball.vx > 0 ? 1.5 : -1.5;
        } else if (cameFromTop || cameFromBottom) {
            ball.vy *= -1;
            ball.y += ball.vy > 0 ? 1.5 : -1.5;
        } else {
            ball.vy *= -1;
        }
        normalizeBall();
        kickSpin(cameFromLeft || cameFromRight ? ball.vy * 0.02 : ball.vx * 0.02);

        if (blocks.every((item) => !item.alive)) {
            state = 'won';
            score += lives * 50;
            ball.vx = 0;
            ball.vy = 0;
            burst(W / 2, H * 0.45, '#ffd166', 40, 320);
        }
    }

    function loseLife() {
        lives -= 1;
        shake = 10;
        burst(ball.x, ball.y, '#ff5fae', 18, 260);

        if (lives <= 0) {
            state = 'lost';
            ball.vx = 0;
            ball.vy = 0;
        } else {
            resetBall();
        }
    }

    function burst(x, y, color, count, power) {
        for (let i = 0; i < count; i += 1) {
            const life = rand(0.35, 0.8);
            particles.push({
                x, y,
                vx: rand(-power, power),
                vy: rand(-power * 0.8, power * 0.35),
                life,
                maxLife: life,
                size: rand(1.4, 3.6),
                color,
                gravity: rand(220, 520)
            });
        }
    }

    function updateParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i -= 1) {
            const p = particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
    }

    function drawParticles() {
        particles.forEach((p) => {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (0.5 + alpha * 0.5), 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    // ------------------------------------------------------------------ draw

    function loop(now) {
        if (!isOpen) return;
        const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
        lastTime = now;
        update(dt);
        draw();
        raf = requestAnimationFrame(loop);
    }

    function draw() {
        if (!ctx) return;
        ctx.clearRect(0, 0, W, H);
        drawBackground();

        ctx.save();
        if (shake > 0.2) {
            ctx.translate(rand(-shake, shake), rand(-shake, shake));
        }
        drawBlocks();
        drawParticles();
        if (state !== 'won' && state !== 'lost') {
            drawTrail();
            drawBall();
        }
        drawPepper();
        ctx.restore();

        drawHud();

        if (state === 'ready') drawReadyPrompt();
        else if (state === 'paused') drawMessage('PAUSED', 'The kitchen is quiet.', 'P TO RESUME  ·  ESC TO EXIT');
        else if (state === 'won') drawMessage('SALSING COMPLETE', 'You minced every last one.', 'SPACE / TAP TO PLAY AGAIN  ·  ESC TO EXIT');
        else if (state === 'lost') drawMessage('GAME OVER', 'The salsings survived.', 'SPACE / TAP TO PLAY AGAIN  ·  ESC TO EXIT');
    }

    function drawBackground() {
        // The pastel base + tiled site background come from CSS; draw the
        // soft glows and grid on the transparent canvas above it.
        const pinkGlow = ctx.createRadialGradient(W * 0.5, 0, 0, W * 0.5, 0, H * 0.8);
        pinkGlow.addColorStop(0, 'rgba(255, 182, 217, 0.30)');
        pinkGlow.addColorStop(1, 'rgba(255, 182, 217, 0)');
        ctx.fillStyle = pinkGlow;
        ctx.fillRect(0, 0, W, H);

        const cyanGlow = ctx.createRadialGradient(W * 0.9, H, 0, W * 0.9, H, H * 0.65);
        cyanGlow.addColorStop(0, 'rgba(0, 206, 209, 0.08)');
        cyanGlow.addColorStop(1, 'rgba(0, 206, 209, 0)');
        ctx.fillStyle = cyanGlow;
        ctx.fillRect(0, 0, W, H);

        const goldGlow = ctx.createRadialGradient(W * 0.1, H, 0, W * 0.1, H, H * 0.6);
        goldGlow.addColorStop(0, 'rgba(255, 215, 0, 0.07)');
        goldGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = goldGlow;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(255, 105, 180, 0.075)';
        ctx.lineWidth = 1;
        const cell = 48;
        for (let x = 0; x <= W; x += cell) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, H);
            ctx.stroke();
        }
        for (let y = 0; y <= H; y += cell) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(W, y + 0.5);
            ctx.stroke();
        }

        // Bottom wall, the thing that sends the ball back up.
        const floor = ctx.createLinearGradient(0, H - 34, 0, H);
        floor.addColorStop(0, 'rgba(255, 20, 147, 0)');
        floor.addColorStop(1, 'rgba(255, 20, 147, 0.12)');
        ctx.fillStyle = floor;
        ctx.fillRect(0, H - 34, W, 34);

        ctx.shadowColor = 'rgba(255, 20, 147, 0.35)';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = 'rgba(255, 20, 147, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, H - 2);
        ctx.lineTo(W, H - 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function drawBlocks() {
        blocks.forEach((block) => {
            if (!block.alive) return;
            const color = CATEGORY_COLOR[block.category] || '#ff5fae';
            const radius = Math.min(9, block.h * 0.22);

            ctx.save();
            ctx.shadowColor = 'rgba(255, 105, 180, 0.18)';
            ctx.shadowBlur = 12;
            roundRect(block.x, block.y, block.w, block.h, radius);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
            ctx.fill();
            ctx.shadowBlur = 0;

            const sheen = ctx.createLinearGradient(0, block.y, 0, block.y + block.h);
            sheen.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
            sheen.addColorStop(0.55, 'rgba(255, 255, 255, 0.12)');
            sheen.addColorStop(1, 'rgba(255, 182, 217, 0.08)');
            ctx.fillStyle = sheen;
            roundRect(block.x, block.y, block.w, block.h, radius);
            ctx.fill();

            ctx.strokeStyle = hexToRgba(color, 0.55);
            ctx.lineWidth = 1;
            roundRect(block.x + 0.5, block.y + 0.5, block.w - 1, block.h - 1, radius);
            ctx.stroke();

            roundRect(block.x + 5, block.y + 7, 3, Math.max(8, block.h - 14), 2);
            ctx.fillStyle = hexToRgba(color, 0.9);
            ctx.fill();

            const fontSize = clamp(block.h * 0.22, 9, 12);
            const emojiSize = Math.round(fontSize * 1.15);
            const [emoji, title] = splitTitle(block.title);
            const pad = Math.max(6, block.w * 0.045);
            ctx.save();
            roundRect(block.x + 4, block.y + 3, block.w - 8, block.h - 6, Math.max(2, radius - 2));
            ctx.clip();

            ctx.font = `${emojiSize}px ${EMOJI_FONT}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#3a2b33';
            ctx.fillText(emoji, block.x + pad + 5, block.y + block.h / 2 + 0.5);

            const emojiWidth = ctx.measureText(emoji).width;
            const titleX = block.x + pad + 5 + emojiWidth + 6;
            const titleMax = block.x + block.w - pad - titleX;
            const font = `700 ${fontSize}px ${FONT}`;
            const label = fitText(title, Math.max(0, titleMax), font);

            ctx.font = font;
            ctx.fillStyle = '#3a2b33';
            ctx.fillText(label, titleX, block.y + block.h / 2 + 0.5);
            ctx.restore();

            ctx.restore();
        });
    }

    function drawTrail() {
        if (trail.length < 2) return;
        trail.forEach((point, index) => {
            const alpha = (1 - index / trail.length) * 0.22;
            ctx.fillStyle = `rgba(255, 20, 147, ${alpha})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, ball.r * (0.8 - index * 0.07), 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawBall() {
        ctx.save();
        if (ballImage && ballImage.complete && ballImage.naturalWidth) {
            const size = ball.r * 3.8;
            ctx.translate(ball.x, ball.y);
            const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, ball.r * 2.6);
            glow.addColorStop(0, 'rgba(255, 20, 147, 0.28)');
            glow.addColorStop(1, 'rgba(255, 20, 147, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 0, ball.r * 2.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.rotate(ball.angle);
            ctx.drawImage(ballImage, -size / 2, -size / 2, size, size);
            ctx.restore();
            return;
        }

        ctx.shadowColor = 'rgba(255, 20, 147, 0.45)';
        ctx.shadowBlur = 20;
        const gradient = ctx.createRadialGradient(
            ball.x - ball.r * 0.35,
            ball.y - ball.r * 0.35,
            ball.r * 0.12,
            ball.x,
            ball.y,
            ball.r
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.4, '#ffd6e8');
        gradient.addColorStop(0.82, '#ff3f98');
        gradient.addColorStop(1, '#ff2d8c');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(190, 24, 93, 0.28)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }

    function drawPepper() {
        const x = paddle.x;
        const y = paddle.y;
        const w = paddle.w;
        const h = paddle.h;

        ctx.save();
        ctx.translate(x, y);

        // Stem and leaves on the left.
        ctx.fillStyle = '#2fd07a';
        ctx.shadowColor = 'rgba(47, 208, 122, 0.35)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(w * 0.1, h * 0.3, w * 0.075, h * 0.2, -0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w * 0.075, h * 0.5, w * 0.095, h * 0.16, 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#1a9e58';
        ctx.beginPath();
        ctx.ellipse(w * 0.045, h * 0.4, w * 0.035, h * 0.13, -0.15, 0, Math.PI * 2);
        ctx.fill();

        // Pepper body, pointed at the right.
        const body = ctx.createLinearGradient(0, 0, 0, h);
        body.addColorStop(0, '#ff8a7a');
        body.addColorStop(0.35, '#ff2d55');
        body.addColorStop(1, '#a90f38');
        ctx.fillStyle = body;
        ctx.shadowColor = 'rgba(255, 45, 85, 0.4)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(w * 0.14, h * 0.22);
        ctx.bezierCurveTo(w * 0.34, h * 0.02, w * 0.72, h * 0.08, w * 0.96, h * 0.5);
        ctx.bezierCurveTo(w * 0.82, h * 0.92, w * 0.48, h * 1.02, w * 0.22, h * 0.82);
        ctx.quadraticCurveTo(w * 0.075, h * 0.62, w * 0.14, h * 0.22);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = 'rgba(120, 20, 60, 0.28)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w * 0.28, h * 0.33);
        ctx.quadraticCurveTo(w * 0.52, h * 0.18, w * 0.78, h * 0.36);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = Math.max(1.2, h * 0.06);
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.restore();
    }

    function drawHud() {
        const font = clamp(W * 0.011, 12, 15);

        const fade = ctx.createLinearGradient(0, 0, 0, 86);
        fade.addColorStop(0, 'rgba(255, 240, 245, 0.92)');
        fade.addColorStop(1, 'rgba(255, 240, 245, 0)');
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, W, 86);

        ctx.textBaseline = 'middle';
        ctx.font = `700 ${font}px ${FONT}`;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#c2185b';
        ctx.fillText(`SCORE ${String(score).padStart(4, '0')}`, 18, 28);

        ctx.font = `700 ${font * 0.9}px ${FONT}`;
        ctx.fillStyle = '#ff1493';
        ctx.shadowColor = 'rgba(255, 20, 147, 0.25)';
        ctx.shadowBlur = 6;
        ctx.fillText('♥'.repeat(Math.max(0, lives)), 18, 51);
        ctx.shadowBlur = 0;

        if (W > 560) {
            const title = ctx.createLinearGradient(W * 0.5 - 140, 0, W * 0.5 + 140, 0);
            title.addColorStop(0, '#ff1493');
            title.addColorStop(0.25, '#ffd700');
            title.addColorStop(0.5, '#00ced1');
            title.addColorStop(0.75, '#ff69b4');
            title.addColorStop(1, '#7b68ee');
            ctx.font = `800 ${clamp(W * 0.015, 14, 18)}px ${FONT}`;
            ctx.textAlign = 'center';
            ctx.fillStyle = title;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowBlur = 5;
            ctx.fillText('SALSING BREAKER', W / 2, 28);
            ctx.shadowBlur = 0;
        }

        if (W > 700) {
            ctx.font = `600 ${Math.max(10, font * 0.75)}px ${FONT}`;
            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(58, 43, 51, 0.45)';
            ctx.fillText('ESC TO EXIT', W - 68, 28);
        }
    }

    function drawReadyPrompt() {
        const pulse = 0.55 + 0.45 * Math.sin(performance.now() / 280);
        const size = clamp(W * 0.013, 11, 15);
        const y = paddle.y + paddle.h + 58;
        const text = 'CLICK / TAP / SPACE TO SERVE';

        ctx.save();
        ctx.font = `700 ${size}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textW = ctx.measureText(text).width;
        const padX = 18;
        const height = size + 18;
        const width = textW + padX * 2;
        const x = W / 2 - width / 2;
        const top = y - height / 2;

        ctx.shadowColor = 'rgba(255, 105, 180, 0.18)';
        ctx.shadowBlur = 12;
        roundRect(x, top, width, height, height / 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 105, 180, 0.35)';
        ctx.lineWidth = 1;
        roundRect(x + 0.5, top + 0.5, width - 1, height - 1, height / 2);
        ctx.stroke();

        ctx.fillStyle = `rgba(194, 24, 91, ${0.55 + 0.35 * pulse})`;
        ctx.fillText(text, W / 2, y);
        ctx.restore();
    }

    function drawMessage(title, subtitle, hint) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 240, 245, 0.78)';
        ctx.fillRect(0, 0, W, H);

        const width = Math.min(W - 40, 540);
        const height = Math.min(250, H - 80);
        const x = (W - width) / 2;
        const y = (H - height) / 2;

        ctx.shadowColor = 'rgba(255, 105, 180, 0.2)';
        ctx.shadowBlur = 30;
        roundRect(x, y, width, height, 14);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 105, 180, 0.5)';
        ctx.lineWidth = 1;
        roundRect(x + 0.5, y + 0.5, width - 1, height - 1, 14);
        ctx.stroke();

        const gradient = ctx.createLinearGradient(x, y, x + width, y);
        gradient.addColorStop(0, '#ff1493');
        gradient.addColorStop(0.25, '#ffd700');
        gradient.addColorStop(0.5, '#00ced1');
        gradient.addColorStop(0.75, '#ff69b4');
        gradient.addColorStop(1, '#7b68ee');
        ctx.fillStyle = gradient;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `800 ${clamp(width * 0.062, 20, 30)}px ${FONT}`;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 5;
        ctx.fillText(title, W / 2, y + height * 0.36);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#5a4650';
        ctx.font = `600 ${clamp(width * 0.032, 11, 14)}px ${FONT}`;
        ctx.fillText(subtitle, W / 2, y + height * 0.55);

        ctx.fillStyle = 'rgba(58, 43, 51, 0.5)';
        ctx.font = `600 ${clamp(width * 0.026, 10, 12)}px ${FONT}`;
        ctx.fillText(hint, W / 2, y + height * 0.74);
        ctx.restore();
    }

    // ------------------------------------------------------------------- API

    window.SalsingGame = {
        open,
        close,
        isOpen: () => isOpen
    };
})();
