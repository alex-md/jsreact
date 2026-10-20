import { difficultySettings, cluePackDefinitions, cluePackMap } from './engine.js';
import { trackAnalyticsEvent } from '@components/analytics.js';
import '@styles/global.css';
import './styles.css';
import { showToast } from '@components/toast.js';
const elements = {
    min: document.getElementById('min-value'),
    max: document.getElementById('max-value'),
    seed: document.getElementById('seed'),
    difficulty: document.getElementById('difficulty'),
    generate: document.getElementById('generate-button'),
    share: document.getElementById('copy-share-link'),
    deepen: document.getElementById('deepen-button'),
    rangeStats: document.getElementById('range-stats'),
    cluePackList: document.getElementById('clue-pack-list'),
    selectAll: document.getElementById('select-all-packs'),
    clearAll: document.getElementById('clear-all-packs'),
    packCountIndicator: document.getElementById('pack-count-indicator'),
    clueList: document.getElementById('clue-list'),
    clueCount: document.getElementById('clue-count'),
    copyClues: document.getElementById('copy-clues-button'),
    diagnostics: document.getElementById('diagnostics-panel'),
    status: document.getElementById('status-badge'),
    candidateDetails: document.getElementById('candidate-details'),
    warningBanner: document.getElementById('warning-banner'),
    warningText: document.getElementById('warning-text'),
    solutionCard: document.getElementById('solution-card'),
    toggleSolution: document.getElementById('toggle-solution')
};
const defaultLoadingMarkup = `
    <span class="numigma-loading">
        <span class="numigma-loading__spinner" aria-hidden="true"></span>
        <span>Generating…</span>
    </span>
`;
const generateButtons = [];
const MAX_DEEPENING_LEVEL = 3;
let lastGeneratedSettings = null;
let lastGenerationOptions = {
    depthLevel: 0
};
let lastResult = null;
let lastClueCopyText = '';
if (elements.generate) {
    registerGenerateButton(elements.generate, {
        loadingClasses: 'opacity-80 cursor-wait'
    });
}
elements.generateFloating = createFloatingGenerateButton(elements.generate);
if (elements.generateFloating) {
    registerGenerateButton(elements.generateFloating, {
        loadingClasses: 'is-loading'
    });
}
if (elements.deepen) {
    registerGenerateButton(elements.deepen, {
        loadingMarkup: defaultLoadingMarkup,
        loadingClasses: 'opacity-80 cursor-wait'
    });
    elements.deepen.classList.add('hidden');
    elements.deepen.setAttribute('aria-hidden', 'true');
    elements.deepen.disabled = true;
}
setShareAvailability(false);
function registerGenerateButton(button, options = {}) {
    if (!button) return;
    const { loadingMarkup = defaultLoadingMarkup, loadingClasses = '' } = options;
    button.dataset.defaultContent = button.innerHTML;
    button.dataset.loadingContent = loadingMarkup;
    button.dataset.loadingClasses = loadingClasses;
    generateButtons.push(button);
}
function setShareAvailability(enabled) {
    if (!elements.share) return;
    if (enabled) {
        elements.share.removeAttribute('disabled');
        elements.share.setAttribute('aria-disabled', 'false');
        elements.share.title = 'Copy a link to this puzzle';
    } else {
        elements.share.setAttribute('disabled', 'disabled');
        elements.share.setAttribute('aria-disabled', 'true');
        elements.share.title = 'Generate a puzzle first';
    }
}
function updateClueCopyState(text) {
    lastClueCopyText = text;
    if (!elements.copyClues) return;
    const hasText = Boolean(text);
    elements.copyClues.disabled = !hasText;
    elements.copyClues.setAttribute('aria-disabled', hasText ? 'false' : 'true');
    elements.copyClues.title = hasText ? 'Copy all clues to the clipboard' : 'Generate a puzzle first';
}
function updateDeepenButton(result, depthLevel = 0) {
    if (!elements.deepen) return;
    const shouldOffer = result && !result.error && !result.success && result.remainingCount > 1 && depthLevel < MAX_DEEPENING_LEVEL;
    if (!shouldOffer) {
        elements.deepen.classList.add('hidden');
        elements.deepen.setAttribute('aria-hidden', 'true');
        elements.deepen.disabled = true;
        return;
    }
    const remaining = result.remainingCount;
    const attemptsLeft = MAX_DEEPENING_LEVEL - depthLevel;
    const label = attemptsLeft > 1 ? `Go deeper (${remaining.toLocaleString()} remain)` : `Final pass (${remaining.toLocaleString()} remain)`;
    const markup = `<i class="fas fa-magnifying-glass-plus"></i><span>${label}</span>`;
    elements.deepen.dataset.defaultContent = markup;
    if (!elements.deepen.classList.contains('hidden')) {
        elements.deepen.innerHTML = markup;
    } else {
        elements.deepen.innerHTML = markup;
    }
    elements.deepen.classList.remove('hidden');
    elements.deepen.removeAttribute('aria-hidden');
    elements.deepen.disabled = false;
}
let initialDepthLevel = 0;
function createFloatingGenerateButton(anchor) {
    if (typeof document === 'undefined') return null;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'floating-generate-button';
    button.className = 'floating-generate-button';
    button.setAttribute('aria-label', 'Generate new puzzle');
    button.innerHTML = '<i class="fas fa-dice"></i><span class="floating-generate-button__label">Generate puzzle</span>';
    document.body.appendChild(button);
    button.setAttribute('aria-hidden', 'true');
    if (typeof IntersectionObserver !== 'undefined' && anchor) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    button.classList.remove('is-visible');
                    button.setAttribute('aria-hidden', 'true');
                } else {
                    button.classList.add('is-visible');
                    button.removeAttribute('aria-hidden');
                }
            });
        }, {
            threshold: 0.6
        });
        observer.observe(anchor);
    } else {
        button.classList.add('is-visible');
        button.removeAttribute('aria-hidden');
    }
    return button;
}
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, function (char) {
        const esc = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return esc[char];
    });
}
const checkboxMap = new Map();
const packCardMap = new Map();
function renderCluePacks() {
    elements.cluePackList.innerHTML = '';
    checkboxMap.clear();
    packCardMap.clear();
    cluePackDefinitions.forEach((pack) => {
        const wrapper = document.createElement('label');
        wrapper.className = 'numigma-pack';
        wrapper.dataset.packId = pack.id;
        if (pack.expensive) {
            wrapper.dataset.expensive = 'true';
        }
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = pack.default;
        checkbox.dataset.packId = pack.id;
        const content = document.createElement('div');
        content.className = 'space-y-1';
        const heading = document.createElement('div');
        heading.className = 'pack-heading flex items-center gap-2 flex-wrap';
        const icon = document.createElement('i');
        icon.className = `fas ${pack.icon} text-indigo-500`;
        const title = document.createElement('span');
        title.textContent = pack.label;
        heading.append(icon, title);
        if (pack.expensive) {
            const badge = document.createElement('span');
            badge.className = 'pack-badge';
            badge.textContent = 'Advanced';
            heading.append(badge);
        }
        const description = document.createElement('p');
        description.className = "pack-description";
        description.textContent = pack.description;
        content.append(heading, description);
        wrapper.append(checkbox, content);
        elements.cluePackList.appendChild(wrapper);
        checkboxMap.set(pack.id, checkbox);
        packCardMap.set(pack.id, wrapper);
        wrapper.classList.toggle('is-active', checkbox.checked);
        checkbox.addEventListener('change', () => {
            wrapper.classList.toggle('is-active', checkbox.checked);
            updatePackCountIndicator();
            const rangeSize = updateRangeStats();
            evaluatePerformanceWarnings(rangeSize, getSelectedPacks());
        });
    });
    updatePackCountIndicator();
}
renderCluePacks();
syncPackSelectionStyles();
function syncPackSelectionStyles() {
    packCardMap.forEach((wrapper, id) => {
        const checkbox = checkboxMap.get(id);
        if (!checkbox) return;
        wrapper.classList.toggle('is-active', checkbox.checked);
    });
}
function updatePackCountIndicator() {
    if (!elements.packCountIndicator) return;
    const label = elements.packCountIndicator.querySelector('span');
    if (!label) return;
    const total = cluePackDefinitions.length;
    const selected = getSelectedPacks().length;
    label.textContent = `${selected} of ${total} packs enabled`;
}
function getSelectedPacks() {
    return Array.from(checkboxMap.entries()).filter(([, checkbox]) => checkbox.checked).map(([packId]) => packId);
}
function updateRangeStats() {
    const min = Number(elements.min.value) || 1;
    const max = Number(elements.max.value) || min + 9;
    const rangeSize = Math.max(0, max - min + 1);
    elements.rangeStats.querySelector('span').textContent = `Range size: ${rangeSize.toLocaleString()}`;
    return rangeSize;
}
function createShareUrl(settings, options = {}) {
    const url = new URL(window.location.href);
    url.searchParams.set('min', settings.min);
    url.searchParams.set('max', settings.max);
    url.searchParams.set('seed', settings.seed);
    url.searchParams.set('difficulty', settings.difficulty);
    url.searchParams.set('packs', settings.packs.join(','));
    if (options.depthLevel && options.depthLevel > 0) {
        url.searchParams.set('depth', options.depthLevel);
    } else {
        url.searchParams.delete('depth');
    }
    return url.toString();
}
function randomSeedString() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const array = new Uint32Array(8);
    if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(array);
    } else {
        for (let i = 0; i < array.length; i += 1) {
            array[i] = Math.floor(Math.random() * alphabet.length);
        }
    }
    return Array.from(array, (value) => alphabet[value % alphabet.length]).join('');
}
function setStatus(status, message) {
    const baseClasses = 'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold';
    if (status === 'success') {
        elements.status.className = `${baseClasses} bg-emerald-100 text-emerald-700 border border-transparent`;
        elements.status.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    } else if (status === 'warning') {
        elements.status.className = `${baseClasses} bg-amber-100 text-amber-700 border border-transparent`;
        elements.status.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    } else if (status === 'error') {
        elements.status.className = `${baseClasses} bg-rose-100 text-rose-700 border border-transparent`;
        elements.status.innerHTML = `<i class="fas fa-times-circle"></i> ${message}`;
    } else {
        elements.status.className = `${baseClasses} border border-gray-200 text-gray-600`;
        elements.status.textContent = message;
    }
}
function setLoading(isLoading) {
    generateButtons.forEach((button) => {
        if (!button) return;
        const loadingClasses = (button.dataset.loadingClasses || '').split(' ').map((token) => token.trim()).filter(Boolean);
        if (isLoading) {
            button.disabled = true;
            if (loadingClasses.length) {
                button.classList.add(...loadingClasses);
            }
            button.innerHTML = button.dataset.loadingContent || defaultLoadingMarkup;
        } else {
            button.disabled = false;
            if (loadingClasses.length) {
                button.classList.remove(...loadingClasses);
            }
            if (button.dataset.defaultContent) {
                button.innerHTML = button.dataset.defaultContent;
            }
        }
    });
}
function showWarning(message) {
    if (!message) {
        elements.warningBanner.classList.add('hidden');
        elements.warningText.textContent = '';
        return;
    }
    elements.warningBanner.classList.remove('hidden');
    elements.warningText.textContent = message;
}
function evaluatePerformanceWarnings(rangeSize, packs) {
    if (rangeSize > 8000 && packs.some((id) => cluePackMap.get(id)?.expensive)) {
        showWarning('Large ranges with advanced clue packs may take several seconds. Consider narrowing the range or lowering the difficulty.');
    } else if (rangeSize > 20000) {
        showWarning('Ranges above 20,000 can produce long search times. Try reducing the range for faster generation.');
    } else {
        showWarning('');
    }
}
function parseQueryParameters() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('min')) {
        elements.min.value = Number(params.get('min')) || 1;
    }
    if (params.has('max')) {
        elements.max.value = Number(params.get('max')) || 9999;
    }
    if (params.has('seed')) {
        elements.seed.value = params.get('seed');
    }
    if (params.has('difficulty')) {
        const diff = params.get('difficulty');
        if (difficultySettings[diff]) {
            elements.difficulty.value = diff;
        }
    }
    if (params.has('packs')) {
        const packIds = params.get('packs').split(',').filter(Boolean);
        checkboxMap.forEach((checkbox, id) => {
            checkbox.checked = packIds.includes(id);
        });
        syncPackSelectionStyles();
        updatePackCountIndicator();
    }
    if (params.has('depth')) {
        const depth = Number(params.get('depth'));
        if (!Number.isNaN(depth) && depth > 0) {
            initialDepthLevel = Math.min(MAX_DEEPENING_LEVEL, Math.floor(depth));
        }
    }
}
parseQueryParameters();
updateRangeStats();
elements.min.addEventListener('change', () => {
    const rangeSize = updateRangeStats();
    evaluatePerformanceWarnings(rangeSize, getSelectedPacks());
});
elements.max.addEventListener('change', () => {
    const rangeSize = updateRangeStats();
    evaluatePerformanceWarnings(rangeSize, getSelectedPacks());
});
elements.min.addEventListener('blur', () => {
    if (Number(elements.min.value) >= Number(elements.max.value)) {
        elements.max.value = Number(elements.min.value) + 9;
    }
    const rangeSize = updateRangeStats();
    evaluatePerformanceWarnings(rangeSize, getSelectedPacks());
});
elements.max.addEventListener('blur', () => {
    if (Number(elements.max.value) <= Number(elements.min.value)) {
        elements.max.value = Number(elements.min.value) + 9;
    }
    const rangeSize = updateRangeStats();
    evaluatePerformanceWarnings(rangeSize, getSelectedPacks());
});
if (elements.share) {
    elements.share.addEventListener('click', async (event) => {
        event.preventDefault();
        if (!lastGeneratedSettings) {
            showToast('Generate a puzzle first.');
            return;
        }
        try {
            await navigator.clipboard.writeText(createShareUrl(lastGeneratedSettings, lastGenerationOptions));
            showToast('Sharable link copied to clipboard!');
        } catch (error) {
            console.error(error);
            showToast('Unable to copy link to clipboard.');
        }
    });
}
if (elements.copyClues) {
    updateClueCopyState('');
    elements.copyClues.addEventListener('click', async () => {
        if (!lastClueCopyText) {
            showToast('Generate a puzzle first.');
            return;
        }
        try {
            await navigator.clipboard.writeText(lastClueCopyText);
            showToast('Clues copied to clipboard!');
        } catch (error) {
            console.error(error);
            showToast('Unable to copy clues to clipboard.');
        }
    });
}
elements.selectAll.addEventListener('click', (event) => {
    event.preventDefault();
    checkboxMap.forEach((checkbox) => {
        checkbox.checked = true;
    });
    syncPackSelectionStyles();
    updatePackCountIndicator();
    evaluatePerformanceWarnings(updateRangeStats(), getSelectedPacks());
    showToast('All clue packs enabled.');
});
elements.clearAll.addEventListener('click', (event) => {
    event.preventDefault();
    checkboxMap.forEach((checkbox) => {
        checkbox.checked = false;
    });
    syncPackSelectionStyles();
    updatePackCountIndicator();
    evaluatePerformanceWarnings(updateRangeStats(), getSelectedPacks());
    showToast('Clue packs cleared. Enable at least one to generate.');
});
if (elements.deepen) {
    elements.deepen.addEventListener('click', () => {
        handleDeepen();
    });
}
let lastSolution = null;
let solutionRevealed = false;
function collectSettings(options = {}) {
    const { autoSeed = false } = options;
    const min = Number(elements.min.value) || 1;
    const max = Number(elements.max.value) || 9999;
    if (min >= max) {
        showToast('Minimum must be less than maximum.');
        return null;
    }
    const packs = getSelectedPacks();
    if (!packs.length) {
        showToast('Enable at least one clue pack.');
        return null;
    }
    const difficulty = elements.difficulty.value;
    let seed = elements.seed.value.trim();
    if (autoSeed || !seed) {
        seed = randomSeedString();
    }
    elements.seed.value = seed;
    evaluatePerformanceWarnings(max - min + 1, packs);
    return {
        min,
        max,
        packs,
        difficulty,
        seed
    };
}
elements.toggleSolution.addEventListener('click', () => {
    if (!lastSolution) {
        showToast('Generate a puzzle first.');
        return;
    }
    solutionRevealed = !solutionRevealed;
    if (solutionRevealed) {
        elements.solutionCard.classList.add('revealed');
        elements.solutionCard.innerHTML = `<div class="space-y-2"><p class="text-sm text-slate-200">Secret number</p><p class="solution-value">${lastSolution}</p></div>`;
        elements.toggleSolution.textContent = 'Hide';
    } else {
        elements.solutionCard.classList.remove('revealed');
        elements.solutionCard.innerHTML = '<p class="text-sm text-slate-300">Solution hidden. Click reveal to view the secret number.</p>';
        elements.toggleSolution.textContent = 'Reveal';
    }
});
function formatCandidatePreview(list) {
    if (!list.length) return '—';
    if (list.length <= 6) {
        return list.join(', ');
    }
    const head = list.slice(0, 5).join(', ');
    return `${head}, … (${list.length} remaining)`;
}
function renderClueCards(result) {
    elements.clueList.innerHTML = '';
    if (!result.steps.length) {
        updateClueCopyState('');
        const message = document.createElement('p');
        message.className = 'text-sm text-gray-500';
        message.textContent = 'No usable clues were assembled. Try widening the range or enabling additional packs.';
        elements.clueList.appendChild(message);
        elements.clueCount.textContent = '0 clues';
        return;
    }
    const fragment = document.createDocumentFragment();
    result.steps.forEach((step, index) => {
        const card = document.createElement('article');
        card.className = 'clue-card';
        const badge = document.createElement('span');
        badge.className = 'clue-pack';
        badge.innerHTML = `<i class="fas fa-lightbulb"></i> ${step.clue.packLabel}`;
        const heading = document.createElement('div');
        heading.className = 'text-xs uppercase tracking-wide text-gray-500';
        heading.textContent = `Clue ${index + 1}`;
        const body = document.createElement('p');
        body.className = 'clue-body';
        body.textContent = step.clue.text;
        const meta = document.createElement('div');
        meta.className = 'clue-meta';
        meta.innerHTML = `
            <span><i class="fas fa-layer-group"></i> Complexity ${step.clue.complexity}</span>
            <span><i class="fas fa-filter"></i> Remaining ${step.remaining}</span>
            <span><i class="fas fa-percentage"></i> Coverage ${(100 - step.coverage * 100).toFixed(1)}% reduction</span>
        `;
        card.append(heading, badge, body, meta);
        fragment.appendChild(card);
    });
    elements.clueList.appendChild(fragment);
    updateClueCopyState(result.steps.map((step, index) => `Clue ${index + 1}: ${step.clue.text}`).join('\n'));
    const profile = result.difficultyProfile || (result.settings ? difficultySettings[result.settings.difficulty] : null);
    const clueCap = profile?.maxClues ?? result.steps.length;
    const depthSuffix = result.depthLevel ? ` • deep +${result.depthLevel}` : '';
    elements.clueCount.textContent = `${result.steps.length} clue${result.steps.length === 1 ? '' : 's'} (max ${clueCap}${depthSuffix})`;
}
function renderCandidateTimeline(result) {
    elements.candidateDetails.innerHTML = '';
    if (!result.steps.length) {
        elements.candidateDetails.innerHTML = '<p>No candidate reduction steps to display.</p>';
        return;
    }
    const fragment = document.createDocumentFragment();
    let previous = result.totalCandidates;
    result.steps.forEach((step, index) => {
        const row = document.createElement('div');
        row.className = 'step-row';
        row.innerHTML = `
            <strong>After clue ${index + 1}</strong>
            <div>${step.clue.text}</div>
            <div class="step-meta">
                <span><i class="fas fa-users"></i> Candidates: ${step.remaining}</span>
                <span><i class="fas fa-arrow-trend-down"></i> Removed: ${previous - step.remaining}</span>
                <span style="display:none;">
  <i class="fas fa-list"></i> Preview: ${formatCandidatePreview(step.preview)}
</span>
            </div>
        `;
        fragment.appendChild(row);
        previous = step.remaining;
    });
    if (result.remainingCount > 1) {
        const unresolved = document.createElement('div');
        unresolved.className = 'step-row';
        unresolved.innerHTML = `
            <strong>Remaining candidates</strong>
            <div class="step-meta">
                <span><i class="fas fa-list-ol"></i> ${result.finalCandidates.slice(0, 10).join(', ')}${result.finalCandidates.length > 10 ? ', …' : ''}</span>
            </div>
        `;
        fragment.appendChild(unresolved);
    }
    elements.candidateDetails.appendChild(fragment);
}
function renderDiagnostics(result) {
    const settings = result.settings || lastGeneratedSettings;
    const baseDifficulty = settings ? difficultySettings[settings.difficulty] : null;
    const profile = result.difficultyProfile || baseDifficulty;
    const rows = [];
    if (settings) {
        rows.push(`<div class="diagnostic-row"><span>Range</span><strong>${settings.min} – ${settings.max}</strong></div>`);
        if (baseDifficulty) {
            rows.push(`<div class="diagnostic-row"><span>Difficulty</span><strong>${baseDifficulty.label}</strong></div>`);
        }
    }
    rows.push(`<div class="diagnostic-row"><span>Total candidates</span><strong>${result.totalCandidates.toLocaleString()}</strong></div>`);
    rows.push(`<div class="diagnostic-row"><span>Clue library size</span><strong>${result.librarySize}</strong></div>`);
    rows.push(`<div class="diagnostic-row"><span>Search attempts</span><strong>${result.attempts}</strong></div>`);
    rows.push(`<div class="diagnostic-row"><span>Remaining candidates</span><strong>${result.remainingCount}</strong></div>`);
    if (profile) {
        rows.push(`<div class="diagnostic-row"><span>Clue budget</span><strong>${profile.maxClues}</strong></div>`);
        if (profile.depthLevel) {
            rows.push(`<div class="diagnostic-row"><span>Search depth</span><strong>Deep +${profile.depthLevel}</strong></div>`);
        }
    }
    const diagnostics = document.createElement('div');
    diagnostics.className = 'diagnostics-grid';
    diagnostics.innerHTML = rows.join('');
    elements.diagnostics.innerHTML = '';
    elements.diagnostics.appendChild(diagnostics);
    if (!result.success) {
        const note = document.createElement('p');
        note.className = 'text-xs text-amber-600';
        if ((result.depthLevel || 0) < MAX_DEEPENING_LEVEL) {
            note.textContent = 'No unique solution was located yet. Consider expanding the clue pool, narrowing the range, or using "Go deeper" to add more clues.';
        } else {
            note.textContent = 'No unique solution was located. Consider adjusting the difficulty, expanding the clue pool, or narrowing the range.';
        }
        elements.diagnostics.appendChild(note);
    }
}
function renderSolution(result) {
    lastSolution = result.target;
    solutionRevealed = false;
    elements.solutionCard.classList.remove('revealed');
    elements.solutionCard.innerHTML = '<p class="text-sm text-slate-300">Solution hidden. Click reveal to view the secret number.</p>';
    elements.toggleSolution.textContent = 'Reveal';
}
function renderPuzzle(result) {
    if (result.error) {
        setStatus('error', 'Generation failed');
        elements.clueList.innerHTML = `<p class="text-sm text-rose-600">${result.error}</p>`;
        elements.candidateDetails.innerHTML = '<p>Unable to compute candidate reductions.</p>';
        elements.diagnostics.innerHTML = '<p class="text-sm text-gray-500">No diagnostics available.</p>';
        lastSolution = null;
        lastResult = null;
        updateClueCopyState('');
        updateDeepenButton(null, 0);
        return;
    }
    lastResult = result;
    const depthLevel = result.depthLevel || 0;
    renderClueCards(result);
    renderCandidateTimeline(result);
    renderDiagnostics(result);
    renderSolution(result);
    if (result.success) {
        const successLabel = depthLevel ? 'Unique solution locked with deep search' : 'Unique solution located';
        setStatus('success', successLabel);
    } else if (result.remainingCount <= 5) {
        setStatus('warning', 'Near-unique solution');
    } else {
        setStatus('warning', 'Multiple candidates remain');
    }
    updateDeepenButton(result, depthLevel);
}

let puzzleWorker;
let pendingGeneration;
function runGeneration(settings, options) {
    if (pendingGeneration) return Promise.resolve({ error: 'A puzzle is already being generated.' });
    return new Promise((resolve) => {
        const fail = () => {
            clearTimeout(pendingGeneration?.timer);
            puzzleWorker?.terminate();
            puzzleWorker = null;
            pendingGeneration = null;
            resolve({ error: 'Generation could not finish. Try a smaller range or fewer clue packs.' });
        };
        try {
            puzzleWorker ??= new Worker(new URL('./generator.worker.js', import.meta.url), { type: 'module' });
            pendingGeneration = { timer: setTimeout(fail, 30000) };
            puzzleWorker.onmessage = ({ data }) => {
                clearTimeout(pendingGeneration.timer);
                pendingGeneration = null;
                resolve(data);
            };
            puzzleWorker.onerror = fail;
            puzzleWorker.postMessage({ settings, options });
        } catch { fail(); }
    });
}

async function handleGenerate(options = {}) {
    if (pendingGeneration) return;
    const { autoSeed = false, depthLevel = 0, silent = false } = options;
    const settings = collectSettings({
        autoSeed
    });
    if (!settings) return;
    lastGenerationOptions = {
        depthLevel
    };
    setLoading(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const result = await runGeneration(settings, {
        depthLevel
    });
    if (!result.error) {
        lastGeneratedSettings = {
            ...settings,
            packs: [
                ...settings.packs
            ]
        };
        lastGenerationOptions = {
            depthLevel
        };
        setShareAvailability(true);
    } else if (!lastGeneratedSettings) {
        setShareAvailability(false);
    }
    renderPuzzle(result);
    trackAnalyticsEvent('puzzle_generate', { difficulty: settings.difficulty, result_status: result.error ? 'error' : result.success ? 'unique' : 'multiple' });
    if (!silent && depthLevel > 0 && !result.error) {
        if (result.success) {
            showToast('Deep search found a unique solution.');
        } else {
            showToast('Added more clues, but multiple candidates remain.');
        }
    }
    setLoading(false);
    if (!silent && !result.error) document.getElementById('puzzle-results')?.scrollIntoView({ block: 'start' });
}
async function handleDeepen() {
    if (pendingGeneration) return;
    if (!lastGeneratedSettings || !lastResult) {
        showToast('Generate a puzzle first.');
        return;
    }
    const currentDepth = lastGenerationOptions?.depthLevel || 0;
    if (currentDepth >= MAX_DEEPENING_LEVEL) {
        showToast('Deep search already reached its limit.');
        return;
    }
    const settings = {
        ...lastGeneratedSettings,
        packs: [
            ...lastGeneratedSettings.packs
        ]
    };
    elements.seed.value = settings.seed;
    setLoading(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const nextDepthLevel = currentDepth + 1;
    const result = await runGeneration(settings, {
        depthLevel: nextDepthLevel
    });
    if (!result.error) {
        lastGeneratedSettings = {
            ...settings,
            packs: [
                ...settings.packs
            ]
        };
        lastGenerationOptions = {
            depthLevel: nextDepthLevel
        };
        setShareAvailability(true);
    } else if (!lastGeneratedSettings) {
        setShareAvailability(false);
    }
    renderPuzzle(result);
    trackAnalyticsEvent('puzzle_generate', { difficulty: settings.difficulty, result_status: result.error ? 'error' : result.success ? 'unique' : 'multiple' });
    if (!result.error) {
        if (result.success) {
            showToast('Additional clues secured a unique solution.');
        } else if (nextDepthLevel >= MAX_DEEPENING_LEVEL) {
            showToast('Deep search exhausted without finding a unique solution. Try adjusting the configuration.');
        } else {
            showToast('Added more clues, but multiple candidates remain.');
        }
    } else {
        showToast('Deep search could not refine this puzzle.');
    }
    setLoading(false);
}
generateButtons.forEach((button) => {
    button.addEventListener('click', () => {
        handleGenerate({
            autoSeed: true
        });
    });
});
evaluatePerformanceWarnings(updateRangeStats(), getSelectedPacks());
const autoParams = new URLSearchParams(window.location.search);
if (autoParams.has('seed') && autoParams.get('autoplay') !== '0') {
    setTimeout(() => {
        handleGenerate({
            autoSeed: false,
            depthLevel: initialDepthLevel,
            silent: true
        });
    }, 120);
}
