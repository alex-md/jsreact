// Run with the Playwright browser_run_code tool on the local Connect 4 page.
async (page) => {
    const origin = new URL(page.url()).origin;
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    const sequence = () => new URL(page.url()).searchParams.get('board') || '';
    const completed = [];
    await page.goto(`${origin}/connect4/?board=443`);
    await page.locator('.connect4-column').first().waitFor();
    await page.keyboard.down('5');
    await page.waitForURL(url => url.searchParams.get('board') === '4435');
    await page.keyboard.down('5');
    await page.keyboard.up('5');
    for (const modifier of ['Control', 'Meta', 'Alt']) await page.keyboard.press(`${modifier}+6`);
    check(sequence() === '4435', 'Repeated or modified shortcuts played extra discs');
    check(await page.locator('#connect4-column-description-3').textContent().then(text => text.includes('Red, Yellow')), 'Column contents missing');
    check(await page.locator('.connect4-last-move').count() === 1, 'Last disc not marked');
    await page.getByRole('button', {name:'Undo move', exact:true}).click();
    check(await page.locator('.connect4-move-caption').textContent().then(text => text.includes('column 3')), 'Undo did not update last move');
    const column = page.getByRole('button', {name: /^Drop yellow disc in column 2/});
    await column.focus();
    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    check(sequence() === '4432', 'Focused column Enter repeated');
    completed.push('held keys, browser modifiers, native Enter, board descriptions, last move and undo');

    await page.evaluate(() => {
        window.c4OriginalCopy = document.execCommand;
        window.c4ClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
        Object.defineProperty(navigator, 'clipboard', {configurable:true, value:{writeText:async()=>{throw new Error('blocked');}}});
        document.execCommand = () => false;
    });
    await page.getByRole('button', {name:/^Share(?: Board Position)?$/}).click();
    const link = page.getByLabel('Copy this link to share your board');
    await link.waitFor();
    check((await link.inputValue()).endsWith('?board=4432'), 'Fallback link does not match board');
    check(await link.evaluate(el => el === document.activeElement && el.selectionEnd === el.value.length), 'Fallback link not selected');
    check(await page.getByRole('button', {name:/^(?:Link copied|Copied)$/}).count() === 0, 'False clipboard success');
    await page.evaluate(() => {
        Object.defineProperty(navigator, 'clipboard', {configurable:true, value:{writeText:async text=>{window.c4CopiedText=text;}}});
    });
    await page.getByRole('button', {name:/^Share(?: Board Position)?$/}).click();
    await page.getByRole('button', {name:/^(?:Link copied|Copied)$/}).waitFor();
    check((await page.evaluate(()=>window.c4CopiedText)).endsWith('?board=4432'), 'Clipboard link incorrect');
    await page.evaluate(() => {
        document.execCommand = window.c4OriginalCopy;
        if (window.c4ClipboardDescriptor) Object.defineProperty(navigator, 'clipboard', window.c4ClipboardDescriptor);
        else delete navigator.clipboard;
    });
    completed.push('clipboard failure, selectable fallback, clipboard success');

    const session = await page.context().newCDPSession(page);
    try {
        await session.send('Emulation.setTouchEmulationEnabled', {enabled:true});
        for (const width of [320, 390]) {
            await page.setViewportSize({width,height:844});
            const targets = await page.locator('.connect4-column').evaluateAll(elements => elements.map(el=>{
                const rect=el.getBoundingClientRect(); return {left:rect.left,right:rect.right,width:rect.width};
            }));
            check(targets.every((rect,index)=>rect.width>=24 && (!index || rect.left>=targets[index-1].right-0.1)), 'Touch columns overlap');
            check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'Mobile overflow');
        }
    } finally {
        await session.send('Emulation.setTouchEmulationEnabled', {enabled:false});
        await session.detach();
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    check(await page.locator('.animate-drop').first().evaluate(el=>getComputedStyle(el).animationName==='none'), 'Reduced motion ignored');
    completed.push('320px and 390px touch targets, overflow, reduced motion');
    return completed;
}
