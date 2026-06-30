const WORD_SOURCE_URL = 'https://www.thisworddoesnotexist.com/';
const SERVER_MIN_FETCH_INTERVAL_MS = 900;
const MAX_CACHE_SIZE = 160;
const MAX_BATCH_SIZE = 36;
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
    'Velmire'
];

let lastRemoteFetchAt = 0;
let cachedWords = [];
let inFlightBatch = null;

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
        }
    });
}

function cleanWord(word) {
    return String(word || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+/g, '')
        .trim();
}

function uniqueWords(words) {
    const seen = new Set();
    return words.filter((word) => {
        const cleaned = cleanWord(word);
        const key = cleaned.toLowerCase();
        if (!cleaned || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function extractDefinitionWord(html) {
    const match = String(html).match(/<[^>]+id=["']definition-word["'][^>]*>(.*?)<\/[^>]+>/i);
    if (!match) return '';
    return cleanWord(match[1].replace(/<[^>]*>/g, ''));
}

function fallbackWords(count) {
    return uniqueWords([...FALLBACK_WORDS].sort(() => Math.random() - 0.5)).slice(0, count);
}

function sampleCache(count) {
    return uniqueWords([...cachedWords].sort(() => Math.random() - 0.5)).slice(0, count);
}

async function waitForRemoteSlot() {
    const elapsed = Date.now() - lastRemoteFetchAt;
    if (elapsed < SERVER_MIN_FETCH_INTERVAL_MS) {
        await new Promise(resolve => setTimeout(resolve, SERVER_MIN_FETCH_INTERVAL_MS - elapsed));
    }
}

async function fetchRemoteWord() {
    await waitForRemoteSlot();
    const response = await fetch(WORD_SOURCE_URL, {
        headers: {
            Accept: 'text/html',
            'User-Agent': 'JSreact username generator source enrichment'
        }
    });

    lastRemoteFetchAt = Date.now();

    if (!response.ok) {
        throw new Error(`Remote word source returned ${response.status}`);
    }

    const word = extractDefinitionWord(await response.text());
    if (!word) {
        throw new Error('Remote word source did not include definition-word');
    }

    return word;
}

async function fetchRemoteBatch(count) {
    const words = [];
    let failures = 0;
    const target = Math.min(MAX_BATCH_SIZE, Math.max(1, count));

    while (words.length < target && failures < 3) {
        try {
            const word = await fetchRemoteWord();
            if (!words.some(item => item.toLowerCase() === word.toLowerCase())) {
                words.push(word);
            }
        } catch {
            failures += 1;
        }
    }

    if (words.length) {
        cachedWords = uniqueWords([...cachedWords, ...words]).slice(-MAX_CACHE_SIZE);
    }

    return words;
}

async function getWords(count) {
    const cached = sampleCache(count);
    const missing = count - cached.length;

    if (missing <= 0) {
        return {
            words: cached,
            source: 'cache'
        };
    }

    if (!inFlightBatch) {
        inFlightBatch = fetchRemoteBatch(Math.max(missing, Math.min(12, count)))
            .finally(() => {
                inFlightBatch = null;
            });
    }

    const remote = await inFlightBatch;
    const combined = uniqueWords([...cached, ...remote]).slice(0, count);

    if (combined.length) {
        return {
            words: combined,
            source: remote.length ? 'remote' : 'cache'
        };
    }

    return {
        words: fallbackWords(count),
        source: 'fallback'
    };
}

export default {
    async fetch(request) {
        const url = new URL(request.url);

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        if (request.method !== 'GET' || !['/api/word', '/api/words'].includes(url.pathname)) {
            return json({ error: 'Not found' }, 404);
        }

        const count = url.pathname === '/api/word'
            ? 1
            : Math.min(MAX_BATCH_SIZE, Math.max(1, Number.parseInt(url.searchParams.get('count') || '24', 10)));
        const result = await getWords(count);

        if (url.pathname === '/api/word') {
            return json({
                word: result.words[0],
                source: result.source
            });
        }

        return json(result);
    }
};
