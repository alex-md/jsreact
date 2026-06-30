import '@styles/global.css';
import { showToast } from '@/components/toast.js';

const WORD_SOURCE_URL = 'https://www.thisworddoesnotexist.com/';
const API_WORD_URL = '/api/word';
const API_WORDS_URL = '/api/words?count=36';
const RANDOM_WORD_API_URL = 'https://random-word-api.herokuapp.com/word?number=36';
const DATAMUSE_URL = 'https://api.datamuse.com/words';
const LOCAL_STORAGE_KEY = 'fake-word-username-pool';
const MAX_WORD_POOL_SIZE = 180;
const ENRICHED_POOL_TARGET = 80;
const FETCH_TIMEOUT_MS = 4500;
const DEFAULT_MAX_LENGTH = 12;
const FALLBACK_WORDS = [
    'Ashen',
    'Rune',
    'Mosskin',
    'Frostreel',
    'Duskwick',
    'Brimward',
    'Keldorn',
    'Vyrelume',
    'Oakmere',
    'Tinwick',
    'Grimlet',
    'Vantor',
    'Skeldin',
    'Lumora',
    'Fenwick',
    'Wyrholt',
    'Nimvale',
    'Thistleworn',
    'Cairnox',
    'Velmire',
    'Eldwyck',
    'Marrowen',
    'Solmere',
    'Duskvale',
    'Brindle',
    'Kestrel',
    'Rookfern',
    'Holloway',
    'Vexmoor',
    'Amberlin'
];
const SUFFIXES = ['', '', '', 'x', 'z', 'io', 'ly', '7', '42', '99'];
const CUSTOM_ENDINGS = ['wick', 'vale', 'mere', 'ward', 'fern', 'kin', 'wyn', 'moor', 'thorn', 'rune', 'io', 'ly'];
const ONSETS = ['br', 'cr', 'dr', 'f', 'gl', 'gr', 'k', 'kr', 'l', 'm', 'n', 'r', 'sk', 'st', 'th', 'v', 'w', 'z'];
const NUCLEI = ['a', 'ae', 'e', 'i', 'io', 'o', 'ou', 'u', 'y'];
const CODAS = ['d', 'k', 'l', 'm', 'n', 'r', 's', 'th', 'v', 'x', 'wick', 'mere', 'vale', 'ward', 'fern'];

const elements = {
    generateButton: document.getElementById('generate-button'),
    copyAllButton: document.getElementById('copy-all-button'),
    refreshPoolButton: document.getElementById('refresh-pool-button'),
    maxLength: document.getElementById('max-length'),
    resultCount: document.getElementById('result-count'),
    customWords: document.getElementById('custom-words'),
    allowTypos: document.getElementById('allow-typos'),
    allowSuffixes: document.getElementById('allow-suffixes'),
    preserveWord: document.getElementById('preserve-word'),
    results: document.getElementById('results'),
    poolCount: document.getElementById('pool-count'),
    poolMeter: document.getElementById('pool-meter'),
    sourceNote: document.getElementById('source-note'),
    statusPill: document.getElementById('status-pill'),
    statusText: document.getElementById('status-text')
};

let wordPool = loadWordPool();
let generatedNames = [];
let isEnriching = false;
let inputDebounce = null;
let lastSource = wordPool.length ? 'cache' : 'local';

function pick(items, random = Math.random) {
    return items[Math.floor(random() * items.length)];
}

function sample(items, count) {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function clampNumber(value, min, max, fallback) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
}

function cleanUsernameWord(word) {
    return String(word || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+/g, '')
        .trim();
}

function normalizePoolWord(word) {
    const cleaned = cleanUsernameWord(word);
    if (!cleaned || cleaned.length < 3) return '';
    return cleaned.slice(0, 28);
}

function titleCaseHandle(value) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function loadWordPool() {
    try {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        const parsed = JSON.parse(stored || '[]');
        if (!Array.isArray(parsed)) return [];
        return uniqueWords(parsed.map(normalizePoolWord).filter(Boolean)).slice(-MAX_WORD_POOL_SIZE);
    } catch {
        return [];
    }
}

function saveWordPool() {
    try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(wordPool.slice(-MAX_WORD_POOL_SIZE)));
    } catch {
        // Storage can be disabled in private browsing. The in-memory pool still works.
    }
}

function uniqueWords(words) {
    const seen = new Set();
    return words.filter((word) => {
        const key = word.toLowerCase();
        if (!word || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function setStatus(state, message) {
    elements.statusPill.dataset.state = state;
    elements.statusText.textContent = message;
}

function updatePoolUi() {
    const count = wordPool.length;
    const percentage = Math.min(100, Math.round((count / ENRICHED_POOL_TARGET) * 100));
    elements.poolCount.textContent = `${count} source words`;
    elements.poolMeter.style.width = `${percentage}%`;

    if (isEnriching) {
        elements.sourceNote.textContent = 'Generating instantly while public word sources enrich the style bank.';
    } else if (lastSource === 'custom') {
        elements.sourceNote.textContent = 'Using your custom seeds as the main style guide, blended with the source bank.';
    } else if (lastSource === 'remote') {
        elements.sourceNote.textContent = 'Public word sources are cached locally and remixed into new usernames.';
    } else {
        elements.sourceNote.textContent = 'Generates freely from local phonetic chunks, then improves as public sources respond.';
    }
}

function addWordsToPool(words, source = 'remote') {
    const incoming = uniqueWords(words.map(normalizePoolWord).filter(Boolean));
    if (!incoming.length) return 0;

    const existing = new Set(wordPool.map(item => item.toLowerCase()));
    const fresh = incoming.filter(word => !existing.has(word.toLowerCase()));
    if (!fresh.length) return 0;

    wordPool = [...wordPool, ...fresh].slice(-MAX_WORD_POOL_SIZE);
    lastSource = source;
    saveWordPool();
    updatePoolUi();
    return fresh.length;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } finally {
        window.clearTimeout(timeout);
    }
}

async function fetchJsonWords(url) {
    const response = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Word source returned ${response.status}`);
    return extractWordsFromPayload(await response.json());
}

function extractWordsFromPayload(payload) {
    if (Array.isArray(payload)) {
        return payload
            .map(item => typeof item === 'string' ? item : item?.word)
            .filter(Boolean);
    }

    if (Array.isArray(payload?.words)) return payload.words;
    if (payload?.word) return [payload.word];
    return [];
}

function extractDefinitionWord(html) {
    const match = String(html).match(/<[^>]+id=["']definition-word["'][^>]*>(.*?)<\/[^>]+>/i);
    if (!match) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<span>${match[1]}</span>`, 'text/html');
    return doc.body.textContent || '';
}

async function fetchGeneratedWord() {
    try {
        const words = await fetchJsonWords(API_WORD_URL);
        if (words.length) return words;
    } catch {
        // The static site may not have an API route. Fall through to browser fetch.
    }

    try {
        const response = await fetchWithTimeout(WORD_SOURCE_URL, { headers: { Accept: 'text/html' } });
        if (!response.ok) throw new Error(`Word source returned ${response.status}`);
        const word = extractDefinitionWord(await response.text());
        return word ? [word] : [];
    } catch {
        return [];
    }
}

function getCustomWords() {
    return uniqueWords(elements.customWords.value
        .split(/[\s,]+/)
        .map(normalizePoolWord)
        .filter(Boolean))
        .slice(0, 40);
}

function getSeedBank() {
    const customWords = getCustomWords();
    if (customWords.length > 0) {
        lastSource = 'custom';
    }

    return uniqueWords([
        ...customWords,
        ...wordPool,
        ...FALLBACK_WORDS
    ]);
}

function wordChunks(words) {
    const chunks = [];

    words.forEach((word) => {
        const lower = word.toLowerCase();
        const syllables = lower.match(/[^aeiouy]*[aeiouy]+[^aeiouy]*/g) || [];
        syllables.forEach((chunk) => {
            const cleaned = cleanUsernameWord(chunk.toLowerCase());
            if (cleaned.length >= 2 && cleaned.length <= 6) chunks.push(cleaned);
        });

        for (let size = 3; size <= Math.min(5, lower.length); size += 1) {
            chunks.push(lower.slice(0, size));
            chunks.push(lower.slice(-size));
        }
    });

    return uniqueWords(chunks);
}

function blendWords(first, second) {
    const a = first.toLowerCase();
    const b = second.toLowerCase();
    const aCut = clampNumber(Math.ceil(a.length * (0.45 + Math.random() * 0.25)), 2, Math.max(2, a.length), 3);
    const bCut = clampNumber(Math.floor(b.length * (0.35 + Math.random() * 0.25)), 1, Math.max(1, b.length - 1), 2);
    return `${a.slice(0, aCut)}${b.slice(bCut)}`;
}

function forgeFromChunks(chunks) {
    const syllableCount = Math.random() < 0.72 ? 2 : 3;
    const parts = [];

    for (let i = 0; i < syllableCount; i += 1) {
        if (chunks.length && Math.random() < 0.58) {
            parts.push(pick(chunks));
        } else {
            parts.push(`${pick(ONSETS)}${pick(NUCLEI)}${Math.random() < 0.65 ? pick(CODAS) : ''}`);
        }
    }

    return parts.join('');
}

function compactWord(value) {
    const lower = value.toLowerCase();
    if (lower.length <= 6) return lower;
    const compacted = lower.replace(/([aeiouy])(?=.*[aeiouy])/g, '');
    return compacted.length >= 4 ? compacted : lower;
}

function shortenReadable(value, maxLength) {
    if (value.length <= maxLength) return value;

    const compacted = compactWord(value);
    if (compacted.length >= 3 && compacted.length <= maxLength) {
        return compacted;
    }

    return value.slice(0, maxLength);
}

function mutateUsername(raw, options, random = Math.random, gentler = false) {
    let candidate = raw;
    const typoChance = gentler ? 0.06 : 0.16;
    const suffixChance = gentler ? 0.26 : 0.34;

    if (!options.preserveWord && options.allowTypos && random() < typoChance) {
        candidate = compactWord(candidate);
    }

    if (!options.preserveWord && options.allowSuffixes && random() < suffixChance) {
        candidate += pick(SUFFIXES, random);
    }

    return candidate;
}

function makeUsername(maxLength, options, { focusCustom = false } = {}) {
    const bank = getSeedBank();
    const customWords = getCustomWords();
    const weightedBank = customWords.length
        ? [...customWords, ...customWords, ...customWords, ...customWords, ...customWords, ...customWords, ...bank]
        : bank;
    const displayBank = customWords.length
        ? [...customWords, ...customWords, ...FALLBACK_WORDS]
        : FALLBACK_WORDS;
    const chunks = wordChunks(weightedBank);
    const strategy = Math.random();
    let raw = '';

    if (focusCustom && customWords.length) {
        if (strategy < 0.28) {
            raw = pick(customWords);
        } else if (strategy < 0.72) {
            raw = blendWords(pick(customWords), pick(FALLBACK_WORDS));
        } else {
            raw = `${pick(customWords).toLowerCase()}${pick(CUSTOM_ENDINGS)}`;
        }
    } else if (options.preserveWord && strategy < 0.52) {
        raw = pick(displayBank);
    } else if (strategy < 0.38) {
        raw = blendWords(pick(weightedBank), pick(weightedBank));
    } else if (strategy < 0.78) {
        raw = forgeFromChunks(chunks);
    } else {
        raw = pick(weightedBank);
    }

    const mutated = mutateUsername(raw, options, Math.random, focusCustom);
    const shortened = shortenReadable(mutated, maxLength);
    return titleCaseHandle(cleanUsernameWord(shortened).slice(0, maxLength));
}

function generateUsernames() {
    const maxLength = clampNumber(elements.maxLength.value, 3, 20, DEFAULT_MAX_LENGTH);
    const resultCount = clampNumber(elements.resultCount.value, 1, 30, 10);
    const options = {
        allowTypos: elements.allowTypos.checked,
        allowSuffixes: elements.allowSuffixes.checked,
        preserveWord: elements.preserveWord.checked
    };
    const customWords = getCustomWords();

    elements.maxLength.value = maxLength;
    elements.resultCount.value = resultCount;

    const names = [];
    const seen = new Set();
    const maxAttempts = resultCount * 40;
    let attempts = 0;

    while (names.length < resultCount && attempts < maxAttempts) {
        attempts += 1;
        const customQuota = customWords.length ? Math.ceil(resultCount * 0.65) : 0;
        const name = makeUsername(maxLength, options, { focusCustom: names.length < customQuota });
        const key = name.toLowerCase();
        if (name.length >= 1 && name.length <= maxLength && !seen.has(key)) {
            names.push(name);
            seen.add(key);
        }
    }

    generatedNames = names;
    renderResults(names);
    setStatus(lastSource === 'custom' ? 'custom' : 'ready', lastSource === 'custom' ? 'Custom mix' : 'Instant engine');
    updatePoolUi();
}

async function enrichWordPool({ includeCustom = false } = {}) {
    if (isEnriching) return;
    isEnriching = true;
    setStatus('fetching', 'Enriching sources');
    updatePoolUi();

    const customWords = getCustomWords();
    const requests = [
        fetchJsonWords(API_WORDS_URL),
        fetchJsonWords(RANDOM_WORD_API_URL),
        fetchGeneratedWord()
    ];

    if (includeCustom && customWords.length > 0) {
        sample(customWords, 3).forEach((word) => {
            const url = `${DATAMUSE_URL}?ml=${encodeURIComponent(word)}&max=18`;
            requests.push(fetchJsonWords(url));
        });
    }

    const results = await Promise.allSettled(requests);
    const words = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
    const added = addWordsToPool(words, 'remote');

    isEnriching = false;
    setStatus(added ? 'ready' : 'local', added ? 'Sources enriched' : 'Instant engine');
    updatePoolUi();

    if (added) {
        generateUsernames();
    }
}

async function copyText(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        const original = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied';
        button.disabled = true;
        window.setTimeout(() => {
            button.innerHTML = original;
            button.disabled = false;
        }, 1300);
    } catch {
        showToast('Copy failed. Select the text and copy it manually.', 'error');
    }
}

function renderResults(names) {
    elements.results.innerHTML = '';
    elements.copyAllButton.disabled = names.length === 0;

    names.forEach((name) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'generator-name-card';
        button.setAttribute('aria-label', `Copy ${name}`);
        button.innerHTML = `
            <span class="generator-name">${name}</span>
            <span class="generator-name-meta">${name.length} chars</span>
            <span class="generator-copy-cue"><i class="fas fa-copy"></i> Copy</span>
        `;
        button.addEventListener('click', () => copyText(name, button));
        elements.results.appendChild(button);
    });
}

function copyAllNames() {
    if (!generatedNames.length) return;
    copyText(generatedNames.join('\n'), elements.copyAllButton);
}

function handleSeedInput() {
    window.clearTimeout(inputDebounce);
    generateUsernames();
    inputDebounce = window.setTimeout(() => {
        enrichWordPool({ includeCustom: true });
    }, 450);
}

function init() {
    generateUsernames();
    setStatus('ready', 'Instant engine');
    updatePoolUi();

    elements.generateButton.addEventListener('click', generateUsernames);
    elements.customWords.addEventListener('input', handleSeedInput);
    elements.copyAllButton.addEventListener('click', copyAllNames);
    elements.refreshPoolButton.addEventListener('click', () => {
        enrichWordPool({ includeCustom: true });
    });

    if (wordPool.length < ENRICHED_POOL_TARGET) {
        enrichWordPool({ includeCustom: false });
    }
}

init();
