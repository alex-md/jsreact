import { cn } from './cn';

// Helper function to escape special characters for regex, used by the 'word' strategy
const escapeRegExp = (string) => {
    if (typeof string !== 'string') return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// --- Internal Tokenization Helper ---
/**
 * Tokenizes and normalizes text.
 * @param {string} text The input text.
 * @param {boolean} forMatchingPurposes If true, performs aggressive normalization (lowercase, split by punctuation).
 *                                     If false, splits by whitespace and keeps original forms (for windowing).
 * @returns {string[]} Array of word tokens.
 */
const _getTokens = (text, forMatchingPurposes = true) => {
    if (!text || typeof text !== 'string') return [];
    if (forMatchingPurposes) {
        return text
            .toLowerCase()
            .split(/[\s!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]+/)
            .filter(Boolean);
    } else {
        return text.split(/\s+/).filter(Boolean);
    }
};

// --- OPTIMIZATION: Centralized Matching Logic ---
/**
 * A single, reusable function to check if a word matches a keyword based on a given strategy.
 * This avoids repeating the same switch statement across multiple functions.
 * @param {string} normalizedWord The word from the text, already normalized.
 * @param {string} originalWord The original, un-normalized word from the text (for 'word' strategy).
 * @param {object} processedKeyword A pre-processed keyword object.
 * @param {string} matchingStrategy The matching strategy.
 * @returns {boolean} True if it's a match.
 */
const _isMatch = (normalizedWord, originalWord, processedKeyword, matchingStrategy) => {
    switch (matchingStrategy) {
        case 'exact':
            return normalizedWord === processedKeyword.lower;
        case 'partial':
            // Note: Partial matching should also use the normalized word for consistency.
            return normalizedWord.includes(processedKeyword.lower);
        case 'word':
            // Use the pre-compiled regex for performance.
            return processedKeyword.regex.test(originalWord);
        default:
            return normalizedWord === processedKeyword.lower;
    }
};

export function getKeywordColor(keywordIndex) {
    const colors = [
        'bg-yellow-300', 'bg-emerald-300',
        'bg-sky-300', 'bg-pink-300',
        'bg-purple-300', 'bg-orange-300',
        'bg-cyan-300', 'bg-rose-300',
        'bg-lime-300', 'bg-indigo-300',
        'bg-teal-300', 'bg-fuchsia-300',
    ];
    const safeIndex = (typeof keywordIndex === 'number' && keywordIndex >= 0) ? Math.floor(keywordIndex) : 0;
    return colors[safeIndex % colors.length];
}

export function calculateSpeakingTime(wordCount, rate = "average") {
    const rates = { slow: 120, average: 150, fast: 180 };
    const wordsPerMinute = rates[rate] || rates.average;
    if (wordCount === 0 || typeof wordCount !== 'number' || wordCount < 0) return `~0 sec`;

    const totalSeconds = Math.max(1, Math.round((wordCount / wordsPerMinute) * 60));
    const fullMinutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    let parts = [];
    if (fullMinutes > 0) {
        parts.push(`${fullMinutes} min`);
    }
    if (seconds > 0 || fullMinutes === 0) {
        parts.push(`${seconds} sec`);
    }
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = (totalSeconds / 60).toFixed(1);
    return `${minutes}m`;
}

/**
 * OPTIMIZED: Analyzes multiple keywords in a single pass over the text.
 */
export function analyzeKeywords(text, keywords, matchingStrategy = 'exact') {
    if (!text || !keywords || !keywords.length || typeof text !== 'string') return [];

    // OPTIMIZATION: Tokenize and normalize text only once.
    const originalWords = _getTokens(text, false);
    const totalWords = _getTokens(text, true).length;
    if (totalWords === 0) {
        return keywords.map(keyword => ({ keyword: String(keyword), count: 0, density: 0 }));
    }
    const normalizedWords = originalWords.map(w => w.toLowerCase().replace(/^[.,!?;:"“”()]+|[.,!?;:"“”()]+$/g, ''));

    // OPTIMIZATION: Pre-process keywords for faster matching.
    const processedKeywords = keywords.map((kw) => {
        if (typeof kw !== 'string') return { original: String(kw), count: 0, lower: '', regex: null };
        return {
            original: kw,
            count: 0,
            lower: kw.toLowerCase(),
            regex: new RegExp(`\\b${escapeRegExp(kw.toLowerCase())}\\b`, 'i')
        };
    });

    // OPTIMIZATION: Use a map for quick lookups by lowercase keyword.
    const keywordMap = new Map(processedKeywords.map(pk => [pk.lower, pk]));
    // OPTIMIZATION: For 'exact' strategy, use a Set for O(1) lookups.
    const keywordSet = matchingStrategy === 'exact' ? new Set(processedKeywords.map(pk => pk.lower)) : null;

    // OPTIMIZATION: Single pass over the text words.
    normalizedWords.forEach((normalizedWord, index) => {
        if (!normalizedWord) return;
        const originalWord = originalWords[index];

        if (matchingStrategy === 'exact') {
            if (keywordSet.has(normalizedWord)) {
                keywordMap.get(normalizedWord).count++;
            }
        } else {
            // For other strategies, we still iterate, but the logic is centralized.
            processedKeywords.forEach(pk => {
                if (_isMatch(normalizedWord, originalWord, pk, matchingStrategy)) {
                    pk.count++;
                }
            });
        }
    });

    return processedKeywords.map(pk => ({
        keyword: pk.original,
        count: pk.count,
        density: (pk.count / totalWords) * 100,
    }));
}

/**
 * Calculates the occurrence count and density of a single keyword within a text.
 * @param {string} text The source text to analyze.
 * @param {string} keyword The keyword to search for.
 * @param {string} [matchingStrategy='exact'] The strategy for matching: 'exact', 'partial', or 'word'.
 * @returns {{count: number, density: number}} An object containing the keyword count and its density percentage.
 */
export function calculateDensity(text, keyword, matchingStrategy = 'exact') {
    // This function is now a lightweight wrapper around the more efficient `analyzeKeywords`.
    // It's kept for API compatibility but delegates the heavy lifting.
    if (!text || !keyword || typeof text !== 'string' || typeof keyword !== 'string') {
        return { count: 0, density: 0 };
    }
    const results = analyzeKeywords(text, [keyword], matchingStrategy);
    return results.length ? { count: results[0].count, density: results[0].density } : { count: 0, density: 0 };
}

/**
 * Finds the highest concentration segment ("cluster") of text for a given set of keywords.
 * OPTIMIZED: This version consolidates loops, pre-computes values, and uses more efficient data structures.
 *
 * @param {string} text The source text to analyze.
 * @param {string[]} keywords An array of keyword strings to search for.
 * @param {number} windowSize The number of words to include in each sliding window segment.
 * @param {string} [matchingStrategy='exact'] The matching strategy ('exact', 'partial', or 'word').
 * @param {object} [config] An object with weights for the scoring model.
 * @returns {object|null} The highest-scoring cluster object, or null if no matches are found.
 */
export function findHighestDensityCluster(
    text,
    keywords,
    windowSize,
    matchingStrategy = 'exact',
    config = {
        densityWeight: 0.4,
        distributionWeight: 0.25,
        intersectionWeight: 0.15,
        completenessWeight: 0.2,
    }
) {
    // --- 1. Input Validation & Setup ---
    if (!text || !keywords || !keywords.length || windowSize <= 0 || typeof text !== 'string') {
        return null;
    }

    const originalWords = _getTokens(text, false);
    const numOriginalWords = originalWords.length;
    if (numOriginalWords === 0) return null;

    // OPTIMIZATION: Make windowSize realistic and pre-normalize all words once.
    windowSize = Math.min(windowSize, numOriginalWords);
    if (windowSize <= 0) return null;
    const normalizedWords = originalWords.map(w => w.toLowerCase().replace(/^[.,!?;:"“”()]+|[.,!?;:"“”()]+$/g, ''));


    // --- 2. OPTIMIZATION: Keyword Pre-processing ---
    // Pre-process keywords to avoid repeated operations in the loop.
    // This includes lower-casing and pre-compiling regexes.
    const processedKeywords = keywords.map((kw, index) => ({
        original: kw,
        lower: kw.toLowerCase(),
        // OPTIMIZATION: Pre-compile regex for 'word' strategy
        regex: new RegExp(`\\b${escapeRegExp(kw.toLowerCase())}\\b`, 'i'),
        originalIndex: index,
    }));

    // OPTIMIZATION: For 'exact' strategy, use a Set for O(1) lookups.
    const keywordSet = matchingStrategy === 'exact' ? new Set(processedKeywords.map(kw => kw.lower)) : null;


    // --- 3. OPTIMIZATION: Combined Loop for All Calculations ---
    // We now use a single sliding window loop to calculate both the combined
    // cluster score and track the best individual clusters simultaneously.
    let highestDensityCluster = null;
    let maxCombinedScore = -1;

    // State for tracking best *individual* keyword clusters
    const individualClusters = new Array(keywords.length).fill(null);
    const individualMaxScores = new Array(keywords.length).fill(-1);

    for (let i = 0; i <= numOriginalWords - windowSize; i++) {
        // --- 3a. Window Initialization ---
        let totalMatchesInWindow = 0;
        let intersectionsInWindow = 0;
        const keywordCountsInWindow = {};
        keywords.forEach(kw => keywordCountsInWindow[kw] = 0);
        const matchedKeywordsInWindow = new Set();

        // Per-keyword counts for the individual cluster tracking
        const individualKeywordCounts = new Array(keywords.length).fill(0);

        // --- 3b. Analyze Words in Current Window ---
        for (let j = 0; j < windowSize; j++) {
            const wordIndex = i + j;
            const originalWord = originalWords[wordIndex];
            const normalizedWord = normalizedWords[wordIndex];
            if (!normalizedWord) continue;

            let matchesForThisWordCount = 0;

            processedKeywords.forEach((pk, kwIndex) => {
                if (_isMatch(normalizedWord, originalWord, pk, matchingStrategy)) {
                    keywordCountsInWindow[pk.original]++;
                    totalMatchesInWindow++;
                    matchedKeywordsInWindow.add(pk.original);
                    matchesForThisWordCount++;
                    individualKeywordCounts[kwIndex]++;
                }
            });

            if (matchesForThisWordCount > 1) {
                intersectionsInWindow++;
            }
        }

        // --- 3c. Combined Cluster Scoring & Update ---
        if (totalMatchesInWindow > 0) {
            const densityValue = totalMatchesInWindow / windowSize;
            const intersectionValue = intersectionsInWindow / windowSize;

            let distributionScore = 0;
            const numKeywords = keywords.length;
            if (numKeywords > 1) {
                const counts = Object.values(keywordCountsInWindow);
                const avgCount = totalMatchesInWindow / numKeywords; // Use pre-calculated sum
                if (avgCount > 0) {
                    const variance = counts.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) / numKeywords;
                    distributionScore = Math.max(0, 1 - (Math.sqrt(variance) / avgCount));
                }
            } else if (numKeywords === 1) {
                distributionScore = 1;
            }

            const completenessScore = matchedKeywordsInWindow.size / numKeywords;

            const combinedScore =
                (densityValue * config.densityWeight) +
                (distributionScore * config.distributionWeight) +
                (intersectionValue * config.intersectionWeight) +
                (completenessScore * config.completenessWeight);

            if (combinedScore > maxCombinedScore) {
                maxCombinedScore = combinedScore;
                const windowOriginalWords = originalWords.slice(i, i + windowSize);
                const windowText = windowOriginalWords.join(' ');
                highestDensityCluster = {
                    text: windowText,
                    highlightedText: highlightText(windowText, keywords, matchingStrategy, keywords.map((_, idx) => idx)),
                    matchCount: totalMatchesInWindow,
                    intersections: intersectionsInWindow,
                    density: densityValue * 100,
                    wordCount: windowSize,
                    score: combinedScore,
                    distribution: distributionScore * 100,
                    completeness: completenessScore * 100,
                    keywordCounts: keywordCountsInWindow,
                    startWordIndex: i,
                    endWordIndex: i + windowSize - 1,
                };
            }
        }

        // --- 3d. Individual Cluster Update ---
        // In the same loop, check if this window is the best for any individual keyword.
        individualKeywordCounts.forEach((count, kwIndex) => {
            if (count > 0) {
                const score = count / windowSize;
                if (score > individualMaxScores[kwIndex]) {
                    individualMaxScores[kwIndex] = score;
                    const pk = processedKeywords[kwIndex];
                    const windowOriginalWords = originalWords.slice(i, i + windowSize);
                    const windowText = windowOriginalWords.join(' ');
                    individualClusters[kwIndex] = {
                        text: windowText,
                        highlightedText: highlightText(windowText, [pk.original], matchingStrategy, [pk.originalIndex]),
                        startWordIndex: i,
                        endWordIndex: i + windowSize - 1,
                        keyword: pk.original,
                        count: count,
                        density: score * 100,
                        wordCount: windowSize,
                    };
                }
            }
        });
    }

    // --- 4. Finalize and Return ---
    if (highestDensityCluster) {
        highestDensityCluster.individualClusters = individualClusters.filter(Boolean);
    }

    return highestDensityCluster;
}

/**
 * OPTIMIZED: Re-implemented to use the same single-pass pattern.
 */
export function calculateMultiKeywordDensity(text, keywords, matchingStrategy = 'exact') {
    if (!text || !keywords || !keywords.length || typeof text !== 'string') {
        return { totalMatchCount: 0, density: 0, intersectionCount: 0, uniqueWordsMatched: 0 };
    }

    const originalWords = _getTokens(text, false);
    const totalOriginalWordTokens = originalWords.length;
    if (totalOriginalWordTokens === 0) return { totalMatchCount: 0, density: 0, intersectionCount: 0, uniqueWordsMatched: 0 };
    const normalizedWords = originalWords.map(w => w.toLowerCase().replace(/^[.,!?;:"“”()]+|[.,!?;:"“”()]+$/g, ''));
    const totalNormalizedWordsForDensity = _getTokens(text, true).length;

    let totalMatchCount = 0;
    let intersectionCount = 0;
    let uniqueWordsMatchedCount = 0;

    // OPTIMIZATION: Pre-process keywords.
    const processedKeywords = keywords.map((kw, index) => ({
        original: kw,
        lower: kw.toLowerCase(),
        regex: new RegExp(`\\b${escapeRegExp(kw.toLowerCase())}\\b`, 'i'),
        index
    }));

    normalizedWords.forEach((normalizedWord, wordIndex) => {
        if (!normalizedWord) return;
        const originalWord = originalWords[wordIndex];

        let matchesOnThisWord = 0;
        processedKeywords.forEach(pk => {
            if (_isMatch(normalizedWord, originalWord, pk, matchingStrategy)) {
                matchesOnThisWord++;
            }
        });

        if (matchesOnThisWord > 0) {
            totalMatchCount += matchesOnThisWord;
            uniqueWordsMatchedCount++;
            if (matchesOnThisWord > 1) {
                intersectionCount++;
            }
        }
    });

    return {
        totalMatchCount,
        density: totalNormalizedWordsForDensity > 0 ? (totalMatchCount / totalNormalizedWordsForDensity) * 100 : 0,
        intersectionCount,
        uniqueWordsMatched: uniqueWordsMatchedCount,
    };
}

export function highlightText(text, keywordsToHighlight, matchingStrategy = 'exact', keywordIndicesForColors = null) {
    if (!text || typeof text !== 'string' || !keywordsToHighlight || keywordsToHighlight.length === 0) return text;

    const getEffectiveColorIndex = (localIndex) => {
        return (keywordIndicesForColors?.[localIndex] ?? localIndex);
    };

    // OPTIMIZATION: Pre-process keywords once.
    const processedKeywords = keywordsToHighlight.map((kw, localIdx) => {
        if (typeof kw !== 'string') return null;
        return {
            lower: kw.toLowerCase(),
            regex: new RegExp(`\\b${escapeRegExp(kw.toLowerCase())}\\b`, 'i'),
            colorClass: getKeywordColor(getEffectiveColorIndex(localIdx))
        };
    }).filter(Boolean);

    if (processedKeywords.length === 0) return text;

    // Use a more robust regex for splitting that keeps delimiters.
    const segments = text.split(/(\s+|[.,!?;:"“”()[\]{}]+)/);
    let highlightedOutput = "";

    segments.forEach(segment => {
        if (!segment || /^\s+$|^[.,!?;:"“”()[\]{}]+$/.test(segment)) {
            highlightedOutput += segment;
            return;
        }

        const normalizedSegment = segment.toLowerCase();
        const matchedPKeywords = new Set();

        processedKeywords.forEach(pk => {
            // OPTIMIZATION: Use the centralized _isMatch helper.
            if (_isMatch(normalizedSegment, segment, pk, matchingStrategy)) {
                matchedPKeywords.add(pk);
            }
        });

        if (matchedPKeywords.size > 0) {
            const uniqueColorClasses = [...new Set(Array.from(matchedPKeywords).map(pk => pk.colorClass))].join(' ');
            const opacity = matchedPKeywords.size > 1 ? 'bg-opacity-75' : 'bg-opacity-50';
            const border = matchedPKeywords.size > 1 ? 'ring-1 ring-slate-400 dark:ring-slate-600 ring-offset-1' : '';
            highlightedOutput += `<mark class="${cn(uniqueColorClasses, opacity, border, 'rounded-sm', 'px-0.5', 'mx-px', 'font-semibold')}">${segment}</mark>`;
        } else {
            highlightedOutput += segment;
        }
    });

    return highlightedOutput;
}

// Default export for backward compatibility if needed, but named exports are preferred.
const utils = {
    calculateDensity,
    findHighestDensityCluster,
    analyzeKeywords,
    calculateMultiKeywordDensity,
    highlightText,
    getKeywordColor,
    calculateSpeakingTime,
    calculateLexicalDiversity,
    detectTopPhrases,
    calculateSpreadScore,
    calculateComplexity
};

/**
 * Calculates lexical diversity as the percentage of unique words.
 */
export function calculateLexicalDiversity(text) {
    const tokens = _getTokens(text, true);
    if (!tokens.length) return 0;
    const uniqueWords = new Set(tokens).size;
    return (uniqueWords / tokens.length) * 100;
}

/**
 * Detects top n-grams (phrases) in the text, excluding stop words and current target keywords.
 */
export function detectTopPhrases(text, keywordsToExclude = [], limit = 8) {
    const tokens = _getTokens(text, true);
    if (!tokens.length) return [];

    const stopWords = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'is', 'it', 'that', 'with', 'for', 'was', 'on', 'as', 'at', 'by', 'an', 'be', 'this', 'are', 'which', 'or', 'from', 'but', 'not', 'what', 'all', 'were', 'when', 'can', 'said', 'there', 'use', 'each', 'she', 'how', 'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'him', 'into', 'time', 'has', 'look', 'more', 'write', 'go', 'see', 'number', 'no', 'way', 'could', 'my', 'than', 'first', 'water', 'been', 'call', 'who', 'oil', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part']);
    const excludeSet = new Set([...keywordsToExclude.map(kw => kw.toLowerCase())]);
    const phrases = {};

    // Helper to evaluate a phrase
    const processNgram = (ngramTokens) => {
        if (ngramTokens.some(t => t.length <= 2 || stopWords.has(t))) return;
        const phrase = ngramTokens.join(' ');
        if (excludeSet.has(phrase)) return;
        phrases[phrase] = (phrases[phrase] || 0) + 1;
    };

    for (let i = 0; i < tokens.length; i++) {
        // 1-word
        processNgram([tokens[i]]);

        // 2-word
        if (i < tokens.length - 1) {
            processNgram([tokens[i], tokens[i + 1]]);
        }

        // 3-word
        if (i < tokens.length - 2) {
            processNgram([tokens[i], tokens[i + 1], tokens[i + 2]]);
        }
    }

    return Object.entries(phrases)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([phrase, count]) => ({
            phrase,
            count,
            words: phrase.split(' ').length
        }));
}

/**
 * Calculates a consistency/spread score for keyword distribution.
 */
export function calculateSpreadScore(windows) {
    if (!windows || windows.length === 0) return 0;
    const totalKeywordHits = windows.reduce((acc, win) => acc + win.count, 0);
    const avgHits = totalKeywordHits / windows.length;
    if (avgHits === 0) return 100;

    const variance = windows.reduce((acc, win) => acc + Math.pow(win.count - avgHits, 2), 0) / windows.length;
    const stdDev = Math.sqrt(variance);
    // 0 is perfectly consistent, higher values are clumped. Map to 0-100 score.
    return Math.max(0, Math.min(100, 100 - (stdDev * 10)));
}

/**
 * Determines reading complexity based on average word length.
 */
export function calculateComplexity(text) {
    const tokens = _getTokens(text, true);
    if (!tokens.length) return 'N/A';
    const totalLength = tokens.reduce((acc, w) => acc + w.length, 0);
    const avgWordLength = totalLength / tokens.length;

    if (avgWordLength > 6) return 'Sophisticated';
    if (avgWordLength > 4.5) return 'Professional';
    return 'Conversational';
}

export default utils;
