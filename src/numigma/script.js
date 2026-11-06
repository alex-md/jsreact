import { difficultySettings, cluePackDefinitions, validateSettings, GENERATOR_VERSION } from './engine.js';
import { trackAnalyticsEvent } from '@components/analytics.js';
import '@styles/global.css';
import './styles.css';

const $ = id => document.getElementById(id);
const form = $('puzzle-form');
const packInputs = new Map();
let currentPuzzle = null;
let pendingGeneration = null;
const mobileLayout = matchMedia('(max-width: 650px)');
$('setup-disclosure').open = !mobileLayout.matches;
mobileLayout.addEventListener('change', event => { $('setup-disclosure').open = !event.matches; });

function message(element, text = '', kind = 'info') {
    element.textContent = text;
    element.dataset.kind = kind;
}

for (const pack of cluePackDefinitions) {
    const label = document.createElement('label');
    label.className = 'n-pack';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'packs';
    checkbox.value = pack.id;
    checkbox.checked = pack.default;
    const content = document.createElement('span');
    content.textContent = pack.label;
    const description = document.createElement('small');
    description.textContent = pack.description;
    content.append(description);
    label.append(checkbox, content);
    $('clue-pack-list').append(label);
    packInputs.set(pack.id, checkbox);
}

function updateControls() {
    $('pack-count').textContent = `${[...packInputs.values()].filter(input => input.checked).length}/${packInputs.size}`;
    $('difficulty-help').textContent = difficultySettings[$('difficulty').value].description;
    $('setup-summary').textContent = `${form.elements.clueCount.value} clues · ${difficultySettings[$('difficulty').value].label}`;
    if (currentPuzzle && !pendingGeneration) {
        message($('setup-message'), 'Settings changed. Create a new puzzle to use them.');
    }
}
form.addEventListener('input', updateControls);
$('select-all-packs').addEventListener('click', () => { packInputs.forEach(input => { input.checked = true; }); updateControls(); });
$('clear-all-packs').addEventListener('click', () => { packInputs.forEach(input => { input.checked = false; }); updateControls(); });
updateControls();

function collectSettings(token) {
    return {
        min: $('min-value').value === '' ? NaN : Number($('min-value').value),
        max: $('max-value').value === '' ? NaN : Number($('max-value').value),
        clueCount: Number(form.elements.clueCount.value),
        difficulty: $('difficulty').value,
        packs: [...packInputs].filter(([, input]) => input.checked).map(([id]) => id),
        seed: token
    };
}
function randomToken() {
    return [...crypto.getRandomValues(new Uint32Array(3))].map(n => n.toString(36)).join('-');
}
function shareUrl(settings) {
    const url = new URL(location.href);
    url.search = '';
    url.hash = '';
    for (const [key, value] of Object.entries({ v: GENERATOR_VERSION, p: settings.seed, min: settings.min, max: settings.max,
        clues: settings.clueCount, difficulty: settings.difficulty, packs: settings.packs.join(',') })) url.searchParams.set(key, value);
    return url;
}
function setLoading(loading) {
    $('generate-button').disabled = loading;
    $('quick-generate-button').disabled = loading;
    $('quick-generate-button').textContent = loading ? 'Building & verifying…' : 'New puzzle ↗';
    if (loading) $('setup-disclosure').open = true;
    $('generate-button').textContent = loading ? 'Building & verifying…' : 'New puzzle ↗';
    $('cancel-button').hidden = !loading;
    document.querySelector('.n-puzzle').setAttribute('aria-busy', String(loading));
}
function runGeneration(settings) {
    return new Promise(resolve => {
        let worker;
        const finish = result => {
            clearTimeout(pendingGeneration?.timer);
            worker?.terminate();
            pendingGeneration = null;
            resolve(result);
        };
        try {
            worker = new Worker(new URL('./generator.worker.js', import.meta.url), { type: 'module' });
            pendingGeneration = { cancel: () => finish({ cancelled: true }), timer: setTimeout(() => finish({ error: 'The search took too long. Try fewer clues, a smaller range, or more themes.' }), 20000) };
            worker.onmessage = ({ data }) => finish(data);
            worker.onerror = () => finish({ error: 'Could not generate a puzzle. Try again or reduce the range.' });
            worker.postMessage({ settings });
        } catch { finish({ error: 'Your browser could not start the puzzle builder. Reload the page and try again.' }); }
    });
}

async function generate(token = randomToken(), initial = false) {
    if (pendingGeneration) return;
    const settings = collectSettings(token);
    const error = validateSettings(settings);
    if (error) {
        message($('setup-message'), error, 'error');
        if (!Number.isSafeInteger(settings.min) || settings.min < 1) $('min-value').focus();
        else if (!Number.isSafeInteger(settings.max) || settings.max <= settings.min || settings.max - settings.min + 1 > 50000) $('max-value').focus();
        else if (!settings.packs.length) { document.querySelector('.n-themes').open = true; packInputs.values().next().value.focus(); }
        return;
    }
    setLoading(true);
    message($('setup-message'), 'Searching for clues that all need each other…');
    const result = await runGeneration(settings);
    setLoading(false);
    if (result.cancelled) {
        message($('setup-message'), currentPuzzle ? 'Search cancelled. Your current puzzle is still here.' : 'Search cancelled. Change your settings or try again.');
        if (!currentPuzzle) $('puzzle-status').textContent = 'Ready when you are';
        return;
    }
    if (!result.success) {
        message($('setup-message'), (result.error || 'No verified puzzle found. Try fewer clues or more themes.') + (currentPuzzle ? ' Your previous puzzle is still shown.' : ''), 'error');
        if (!currentPuzzle) { $('puzzle-status').textContent = 'Try different settings'; $('puzzle-description').textContent = 'Choose fewer clues, widen your range, or enable more themes, then create a puzzle.'; }
        return;
    }
    currentPuzzle = result;
    renderPuzzle(result);
    if (mobileLayout.matches) $('setup-disclosure').open = false;
    // Save only the settings that actually built this puzzle, even if controls
    // were edited during the search. Sharing always uses this same snapshot.
    history.replaceState(null, '', shareUrl(settings));
    const draft = collectSettings(token);
    message($('setup-message'), JSON.stringify(draft) === JSON.stringify(settings) ? '' : 'Settings changed. Create a new puzzle to use them.');
    trackAnalyticsEvent('puzzle_generate', { difficulty: settings.difficulty, clue_count: settings.clueCount, result_status: 'verified' });
    if (!initial && matchMedia('(max-width: 650px)').matches) {
        $('puzzle-title').setAttribute('tabindex', '-1');
        $('puzzle-title').focus({ preventScroll: true });
        document.querySelector('.n-puzzle').scrollIntoView({ behavior: 'instant', block: 'start' });
    }
}
$('quick-generate-button').addEventListener('click', () => { if (form.reportValidity()) generate(); });
form.addEventListener('submit', event => { event.preventDefault(); generate(); });
$('cancel-button').addEventListener('click', () => pendingGeneration?.cancel());

function renderPuzzle(result) {
    const { settings } = result;
    $('puzzle-status').textContent = `${settings.clueCount} essential clues · verified`;
    $('puzzle-description').textContent = `A whole number from ${settings.min.toLocaleString()} to ${settings.max.toLocaleString()} · ${difficultySettings[settings.difficulty].label}`;
    $('clue-list').replaceChildren();
    result.steps.forEach(({ clue }) => {
        const item = document.createElement('li');
        item.className = 'n-clue';
        const text = document.createElement('p');
        text.textContent = clue.text;
        const theme = document.createElement('p');
        theme.className = 'n-clue-theme';
        theme.textContent = clue.packLabel;
        item.append(text, theme);
        if (clue.meta?.help) {
            const details = document.createElement('details');
            details.className = 'n-definition';
            const summary = document.createElement('summary');
            summary.textContent = 'What does this mean?';
            const definition = document.createElement('p');
            definition.textContent = clue.meta.help;
            details.append(summary, definition);
            item.append(details);
        }
        $('clue-list').append(item);
    });
    $('solve-area').hidden = false;
    $('answer').value = '';
    $('answer').min = settings.min;
    $('answer').max = settings.max;
    $('answer').removeAttribute('aria-invalid');
    $('notes').value = '';
    $('solution').hidden = true;
    $('solution').replaceChildren();
    $('toggle-solution').textContent = 'Reveal answer';
    $('toggle-solution').setAttribute('aria-expanded', 'false');
    $('analysis').open = false;
    message($('answer-feedback'));
    $('candidate-details').replaceChildren();
    [{ remaining: result.totalCandidates }, ...result.steps].forEach((step, i) => {
        const row = document.createElement('div');
        row.className = 'n-analysis-row';
        const label = document.createElement('span');
        label.textContent = i ? `After clue ${i}` : 'At the start';
        const bar = document.createElement('div');
        bar.className = 'n-bar';
        bar.setAttribute('aria-hidden', 'true');
        const fill = document.createElement('span');
        fill.style.width = `${100 * step.remaining / result.totalCandidates}%`;
        bar.append(fill);
        const value = document.createElement('strong');
        value.textContent = step.remaining.toLocaleString();
        row.append(label, bar, value);
        $('candidate-details').append(row);
    });
}

$('answer-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!currentPuzzle) return;
    const value = Number($('answer').value);
    const correct = value === currentPuzzle.target;
    $('answer').setAttribute('aria-invalid', String(!correct));
    message($('answer-feedback'), correct ? 'Exactly right. Your number satisfies every clue.' : 'That number does not fit every clue. Keep following the trail.', correct ? 'success' : 'error');
});
$('answer').addEventListener('input', () => { $('answer').removeAttribute('aria-invalid'); message($('answer-feedback')); });
$('toggle-solution').addEventListener('click', () => {
    if (!currentPuzzle) return;
    const reveal = $('solution').hidden;
    $('solution').hidden = !reveal;
    $('toggle-solution').textContent = reveal ? 'Hide answer' : 'Reveal answer';
    $('toggle-solution').setAttribute('aria-expanded', String(reveal));
    if (reveal) {
        $('solution').textContent = 'The only number that fits every clue:';
        const answer = document.createElement('strong');
        answer.textContent = currentPuzzle.target.toLocaleString();
        $('solution').append(answer);
    } else $('solution').replaceChildren();
});
async function copy(text, label) {
    try { await navigator.clipboard.writeText(text); message($('answer-feedback'), label); }
    catch { message($('answer-feedback'), 'Clipboard unavailable. Select and copy the puzzle text, or copy the address bar link.', 'error'); }
}
$('copy-share-link').addEventListener('click', () => { if (currentPuzzle) copy(shareUrl(currentPuzzle.settings).toString(), 'Puzzle link copied. The answer is hidden when opened.'); });
$('copy-clues-button').addEventListener('click', () => {
    if (!currentPuzzle) return;
    const { settings, steps } = currentPuzzle;
    copy(`Numigma · ${difficultySettings[settings.difficulty].label}\nFind a whole number from ${settings.min} to ${settings.max}.\n\n${steps.map(({ clue }, i) => `${i + 1}. ${clue.text}`).join('\n')}\n\nExactly one answer. Every clue is necessary.`, 'Puzzle copied without the answer.');
});

// Puzzle tokens are kept inside links; there is no seed control to manage.
const params = new URLSearchParams(location.search);
let initialToken;
let linkWarning = '';
if (params.has('p') && params.get('v') === GENERATOR_VERSION) {
    const shared = { min: Number(params.get('min')), max: Number(params.get('max')), clueCount: Number(params.get('clues')),
        difficulty: params.get('difficulty'), packs: (params.get('packs') || '').split(',').filter(Boolean), seed: params.get('p') };
    linkWarning = validateSettings(shared) ? 'This puzzle link has invalid settings. Choose your settings and create a new puzzle.' : '';
    $('min-value').value = params.get('min') ?? '1';
    $('max-value').value = params.get('max') ?? '999';
    const count = params.get('clues');
    const radio = [...form.elements.clueCount].find(input => input.value === count);
    if (radio) radio.checked = true;
    if (Object.hasOwn(difficultySettings, params.get('difficulty'))) $('difficulty').value = params.get('difficulty');
    if (params.has('packs')) {
        const ids = params.get('packs').split(',');
        packInputs.forEach((input, id) => { input.checked = ids.includes(id); });
    }
    initialToken = params.get('p');
} else if (params.has('seed') || params.has('p')) {
    linkWarning = 'This link uses a different puzzle version. Create a new puzzle with the current builder.';
}
updateControls();
if (linkWarning) { message($('setup-message'), linkWarning, 'error'); $('puzzle-status').textContent = 'New builder'; }
else generate(initialToken || randomToken(), true);
