// Run this function with the Playwright browser_run_code tool, on a local Connect 4 page.
// No Playwright test-runner dependency is needed.
async (page) => {
    const origin = new URL(page.url()).origin;
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    const sequence = () => new URL(page.url()).searchParams.get('board') || '';
    const go = (board = '') => page.goto(`${origin}/connect4/${board ? `?board=${board}` : ''}`);
    const button = (name) => page.getByRole('button', { name, exact: true });
    const completed = [];

    await go();
    await page.evaluate(() => {
        window.c4Requests = [];
        window.c4Held = [];
        window.c4Hold = false;
        const post = Worker.prototype.postMessage;
        Worker.prototype.postMessage = function (message, ...args) {
            if (message.purpose === 'practice') {
                window.c4Worker = this;
                if (!this.c4Wrapped) {
                    this.c4Wrapped = true;
                    const receive = this.onmessage;
                    this.onmessage = event => {
                        if (window.c4Hold) window.c4Held.push(() => receive.call(this, event));
                        else receive.call(this, event);
                    };
                }
            }
            window.c4Requests.push(message);
            return post.call(this, message, ...args);
        };
    });
    await button('Practice vs AI').click();
    for (const name of ['Easy depth 3', 'Standard depth 4–5', 'Master deep analysis']) {
        await button(name).click();
        const before = await page.evaluate(() => window.c4Requests.length);
        await page.keyboard.press('4');
        await page.waitForURL(url => (url.searchParams.get('board') || '').length === 2);
        const played = sequence();
        check(await page.evaluate(() => window.c4Requests.length) === before + 1, 'AI request loop');
        await button('Undo move').click();
        await page.waitForURL(url => !url.searchParams.has('board'));
        await button('Redo move').click();
        await page.waitForURL(url => url.searchParams.get('board') === played);
        check(await page.locator('.connect4-ai-status').innerText() === 'Your move — play Red', 'Redo turn');
        await button('Start a new board').click();
        completed.push(name);
    }

    // Deterministically hold actual worker replies while cancelling their turn.
    for (const action of ['reset', 'undo', 'mode']) {
        await page.evaluate(() => { window.c4Hold = true; });
        await page.keyboard.press('4');
        await page.waitForFunction(() => window.c4Held.length > 0);
        check(await page.locator('.connect4-column:enabled').count() === 0, 'Human input enabled on AI turn');
        if (action === 'reset') await button('Start a new board').click();
        if (action === 'undo') await button('Undo move').click();
        if (action === 'mode') await button('Solver / Analysis').click();
        const expected = sequence();
        await page.evaluate(() => {
            window.c4Hold = false;
            window.c4Held.splice(0).forEach(deliver => deliver());
        });
        check(sequence() === expected, `Stale AI reply after ${action}`);
        if (action === 'mode') {
            await button('Reset Board').click();
            await button('Practice vs AI').click();
        }
        completed.push(`cancel via ${action}`);
    }

    // A worker failure must give the user a way to recover.
    await page.evaluate(() => { window.c4Hold = true; });
    await page.keyboard.press('4');
    await page.waitForFunction(() => window.c4Held.length > 0);
    await page.evaluate(() => {
        window.c4Hold = false;
        window.c4Worker.dispatchEvent(new Event('error'));
    });
    await button('Retry analysis').click();
    await page.waitForURL(url => (url.searchParams.get('board') || '').length === 2);
    completed.push('worker retry');

    await go('414142');
    await page.getByRole('switch').evaluate(element => {
        if (element.getAttribute('aria-checked') === 'false') element.click();
    });
    await page.waitForFunction(() => document.querySelector('.connect4-result-strip')?.textContent.includes('column 4'));
    await page.keyboard.press('4');
    await page.getByText('Red wins!', { exact: true }).waitFor();
    check(await page.locator('.connect4-winning-cell').count() === 4, 'Win highlight');
    await button('Undo move').click();
    await button('Redo move').focus();
    await page.keyboard.press('Enter');
    await page.getByText('Red wins!', { exact: true }).waitFor();
    check(sequence() === '4141424', 'Native keyboard Redo was intercepted');
    completed.push('winning hint, win highlight, keyboard undo/redo');

    await go('257771314744647214154617633623313656555222');
    await page.getByText('Draw — board full', { exact: true }).waitFor();
    check(await button('Show Best Move').isDisabled(), 'Hint available on draw');
    await button('Practice vs AI').click();
    check(await page.locator('.connect4-ai-status').innerText() === 'Game complete', 'AI runs after draw');
    completed.push('full-board draw');

    await go('1111111');
    await page.waitForURL(url => !url.searchParams.has('board'));
    await page.evaluate(() => {
        localStorage.setItem('connect4-aiStrength', JSON.stringify('invalid'));
        localStorage.setItem('connect4-practiceDifficulty', JSON.stringify(null));
        localStorage.setItem('connect4-solverTarget', JSON.stringify(99));
    });
    await go('414142');
    await page.waitForFunction(() => document.querySelector('.connect4-result-strip')?.textContent.includes('column 4'));
    completed.push('invalid shared board and stored settings');
    await page.getByRole('button', { name: 'How to play', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    for (let index = 0; index < 5; index++) {
        await page.keyboard.press('Tab');
        check(await page.evaluate(() => Boolean(document.activeElement.closest('dialog'))), 'Help focus escaped');
    }
    await page.keyboard.press('Escape');
    check(await dialog.count() === 0, 'Help did not close');
    completed.push('help focus and Escape');

    for (const [width, height] of [[320,568], [390,844], [768,900], [1440,900]]) {
        await page.setViewportSize({ width, height });
        for (const path of ['/connect4/', '/connect4/strategy/', '/connect4/best-first-move/', '/connect4/solver-guide/']) {
            const response = await page.goto(origin + path);
            await page.getByRole('heading', { level: 1 }).waitFor();
            check(response.status() === 200, path + ' status');
            const metadata = await page.evaluate(() => ({
                canonical: [...document.querySelectorAll('link[rel="canonical"]')].map(link => link.href),
                descriptions: [...document.querySelectorAll('meta[name="description"]')].map(meta => meta.content),
                robots: document.querySelector('meta[name="robots"]')?.content,
                h1s: document.querySelectorAll('h1').length,
                overflow: document.documentElement.scrollWidth > innerWidth,
                schema: [...document.querySelectorAll('script[type="application/ld+json"]')].map(script => JSON.parse(script.textContent)),
                badAnchors: [...document.querySelectorAll('main a[href^="#"]')].filter(link => !document.getElementById(link.getAttribute('href').slice(1))).length,
            }));
            check(metadata.canonical.length === 1 && metadata.canonical[0] === 'https://jsreact.com' + path, path + ' canonical');
            check(metadata.descriptions.length === 1 && metadata.descriptions[0].length > 50, path + ' description');
            check(!metadata.robots?.includes('noindex'), path + ' robots');
            check(metadata.schema.length > 0 && metadata.h1s === 1 && !metadata.overflow && !metadata.badAnchors, path + ' layout/SEO');
            if (path === '/connect4/' && width < 768) {
                check(await page.locator('.connect4-mobile-target').isVisible(), 'Mobile options hidden');
                check(await page.locator('.connect4-result-strip').isVisible(), 'Mobile result hidden');
            }
        }
    }
    completed.push('four pages: layout, anchors, canonical, descriptions, structured data at four widths');
    return completed;
}
