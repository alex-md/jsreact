// KeywordUtils.js

// Assuming you have clsx and tailwind-merge installed and configured
// If not, you can remove the cn function and its usage
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Helper function to escape special characters for regex
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

// --- Main Utility Object ---
const utils = {

    calculateDensity: (text, keyword, matchingStrategy = 'exact') => {
        if (!text || !keyword || typeof text !== 'string' || typeof keyword !== 'string') {
            return { count: 0, density: 0 };
        }

        const processedWords = _getTokens(text, true);
        const totalWords = processedWords.length;
        if (totalWords === 0) return { count: 0, density: 0 };

        let count = 0;
        const lowerKeyword = keyword.toLowerCase();
        const escapedLowerKeyword = escapeRegExp(lowerKeyword);
        let userRegex;

        if (matchingStrategy === 'regex') {
            try {
                const match = keyword.match(/^\/(.+)\/([gimyus]*)$/);
                if (match && match[1]) {
                    userRegex = new RegExp(match[1], match[2] || 'gi');
                } else if (keyword) {
                    userRegex = new RegExp(keyword, 'gi');
                } else {
                    return { count: 0, density: 0 }; // Empty keyword for regex
                }
            } catch (e) {
                console.error(`Invalid user regex pattern for keyword "${keyword}":`, e);
                return { count: 0, density: 0 };
            }
        }

        processedWords.forEach(word => {
            let isMatch = false;
            switch (matchingStrategy) {
                case 'exact':
                    isMatch = word === lowerKeyword;
                    break;
                case 'partial':
                    isMatch = word.includes(lowerKeyword);
                    break;
                case 'word':
                    try {
                        const regex = new RegExp(`\\b${escapedLowerKeyword}\\b`, 'i');
                        isMatch = regex.test(word);
                    } catch (e) {
                        console.error('Invalid regex pattern for word boundary:', e);
                    }
                    break;
                case 'regex':
                    if (userRegex) {
                        userRegex.lastIndex = 0;
                        isMatch = userRegex.test(word);
                    }
                    break;
                default:
                    isMatch = word === lowerKeyword;
            }
            if (isMatch) {
                count++;
            }
        });

        const density = totalWords > 0 ? (count / totalWords) * 100 : 0;
        return { count, density };
    },

    findHighestDensityCluster: (
        text,
        keywords, // This is the array of original keyword strings
        windowSize,
        matchingStrategy = 'exact',
        config = {
            densityWeight: 0.4,
            distributionWeight: 0.25,
            intersectionWeight: 0.15,
            completenessWeight: 0.2,
        }
    ) => {
        if (!text || !keywords || !keywords.length || windowSize <= 0 || typeof text !== 'string') {
            return null;
        }

        const originalWordsForWindowing = _getTokens(text, false);
        const numValidWords = originalWordsForWindowing.length;

        if (numValidWords === 0) return null;
        if (windowSize > numValidWords) windowSize = numValidWords;
        if (windowSize <= 0) return null;


        // --- Pre-process keywords (original strings from input) ---
        const processedKeywords = keywords.map((kw, index) => ({
            original: kw,
            lower: kw.toLowerCase(),
            escapedLower: escapeRegExp(kw.toLowerCase()),
            regex: (() => {
                if (matchingStrategy === 'regex') {
                    try {
                        const match = kw.match(/^\/(.+)\/([gimyus]*)$/);
                        if (match && match[1]) return new RegExp(match[1], match[2] || 'gi');
                        if (kw) return new RegExp(kw, 'gi');
                    } catch (e) { console.error(`Invalid regex for keyword "${kw}" in cluster search:`, e); return null; }
                }
                return null;
            })(),
            originalIndex: index // Store the original index from the input `keywords` array
        }));


        // --- Find Individual Best Clusters ---
        const individualClusters = processedKeywords.map((pk) => {
            let maxScore = -1;
            let bestCluster = null;

            for (let i = 0; i <= numValidWords - windowSize; i++) {
                const windowOriginalWords = originalWordsForWindowing.slice(i, i + windowSize);
                const windowText = windowOriginalWords.join(' ');

                // Calculate density for this *single* keyword (pk.original) in this window
                // We use a simplified internal count for this specific keyword within this window
                let currentKeywordCountInWindow = 0;
                windowOriginalWords.forEach(originalWordInWindow => {
                    const normalizedWordInWindow = originalWordInWindow.toLowerCase().replace(/^[.,!?;:"“”()]+|[.,!?;:"“”()]+$/g, '');
                    if (!normalizedWordInWindow) return;
                    let isMatch = false;
                    switch (matchingStrategy) {
                        case 'exact': isMatch = normalizedWordInWindow === pk.lower; break;
                        case 'partial': isMatch = normalizedWordInWindow.includes(pk.lower); break;
                        case 'word':
                            try { isMatch = new RegExp(`\\b${pk.escapedLower}\\b`, 'i').test(originalWordInWindow); } catch (e) { }
                            break;
                        case 'regex':
                            if (pk.regex) { pk.regex.lastIndex = 0; isMatch = pk.regex.test(originalWordInWindow); }
                            break;
                        default: isMatch = normalizedWordInWindow === pk.lower;
                    }
                    if (isMatch) currentKeywordCountInWindow++;
                });


                if (currentKeywordCountInWindow > 0) {
                    const score = currentKeywordCountInWindow / windowSize;
                    if (score > maxScore) {
                        maxScore = score;
                        bestCluster = {
                            text: windowText,
                            highlightedText: utils.highlightText(windowText, [pk.original], matchingStrategy, [pk.originalIndex]),
                            startWordIndex: i,
                            endWordIndex: i + windowSize - 1,
                            keyword: pk.original,
                            count: currentKeywordCountInWindow,
                            density: score * 100,
                            wordCount: windowSize,
                        };
                    }
                }
            }
            return bestCluster;
        }).filter(Boolean);


        // --- Find Combined Highest Density Cluster ---
        let highestDensityCluster = null;
        let maxCombinedScore = -1;

        for (let i = 0; i <= numValidWords - windowSize; i++) {
            const windowOriginalWords = originalWordsForWindowing.slice(i, i + windowSize);
            const windowText = windowOriginalWords.join(' ');

            let totalMatchesInWindow = 0;
            let intersectionsInWindow = 0;
            const keywordCountsInWindow = {};
            keywords.forEach(kw => keywordCountsInWindow[kw] = 0);
            const matchedKeywordsInWindow = new Set();

            windowOriginalWords.forEach((originalWord) => {
                const normalizedWord = originalWord.toLowerCase().replace(/^[.,!?;:"“”()]+|[.,!?;:"“”()]+$/g, '');
                if (!normalizedWord) return;

                let matchesForThisWordCount = 0;

                processedKeywords.forEach(pk => {
                    let isMatch = false;
                    switch (matchingStrategy) {
                        case 'exact': isMatch = normalizedWord === pk.lower; break;
                        case 'partial': isMatch = normalizedWord.includes(pk.lower); break;
                        case 'word':
                            try { isMatch = new RegExp(`\\b${pk.escapedLower}\\b`, 'i').test(originalWord); } catch (e) { }
                            break;
                        case 'regex':
                            if (pk.regex) { pk.regex.lastIndex = 0; isMatch = pk.regex.test(originalWord); }
                            break;
                        default: isMatch = normalizedWord === pk.lower;
                    }

                    if (isMatch) {
                        keywordCountsInWindow[pk.original]++;
                        totalMatchesInWindow++;
                        matchedKeywordsInWindow.add(pk.original);
                        matchesForThisWordCount++;
                    }
                });

                if (matchesForThisWordCount > 1) {
                    intersectionsInWindow++;
                }
            });

            if (totalMatchesInWindow > 0) {
                const numKeywords = keywords.length;
                const densityValue = totalMatchesInWindow / windowSize;
                const intersectionValue = intersectionsInWindow / windowSize;

                let distributionScore = 0;
                if (numKeywords > 1) {
                    const counts = Object.values(keywordCountsInWindow);
                    const avgCount = counts.reduce((s, c) => s + c, 0) / numKeywords;
                    if (avgCount > 0) {
                        const variance = counts.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) / numKeywords;
                        const stdDev = Math.sqrt(variance);
                        distributionScore = Math.max(0, 1 - (stdDev / avgCount));
                    } else if (counts.every(c => c === 0)) {
                        distributionScore = 1;
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
                    highestDensityCluster = {
                        text: windowText,
                        originalWindowWords: windowOriginalWords,
                        // Highlight all original keywords with their respective original indices for coloring
                        highlightedText: utils.highlightText(windowText, keywords, matchingStrategy, keywords.map((_, idx) => idx)),
                        matchCount: totalMatchesInWindow,
                        intersections: intersectionsInWindow,
                        density: densityValue * 100,
                        wordCount: windowSize,
                        score: combinedScore,
                        distribution: distributionScore * 100,
                        completeness: completenessScore * 100,
                        keywordCounts: keywordCountsInWindow, // { originalKeywordString: count }
                        startWordIndex: i,
                        endWordIndex: i + windowSize - 1,
                        individualClusters: individualClusters, // Include the pre-calculated individual bests
                    };
                }
            }
        }
        return highestDensityCluster;
    },

    analyzeKeywords: (text, keywords, matchingStrategy = 'exact') => {
        if (!text || !keywords || !keywords.length || typeof text !== 'string') return [];
        const totalWords = _getTokens(text, true).length;

        return keywords.map(keyword => {
            if (typeof keyword !== 'string') return { keyword: String(keyword), count: 0, density: 0 };
            const { count } = utils.calculateDensity(text, keyword, matchingStrategy);
            return {
                keyword,
                count,
                density: totalWords > 0 ? (count / totalWords) * 100 : 0,
            };
        });
    },

    calculateMultiKeywordDensity: (text, keywords, matchingStrategy = 'exact') => {
        if (!text || !keywords || !keywords.length || typeof text !== 'string') {
            return { totalMatchCount: 0, density: 0, intersectionCount: 0, uniqueWordsMatched: 0 };
        }

        const originalWords = _getTokens(text, false);
        const totalOriginalWordTokens = originalWords.length;
        if (totalOriginalWordTokens === 0) return { totalMatchCount: 0, density: 0, intersectionCount: 0, uniqueWordsMatched: 0 };

        let totalMatchCount = 0;
        let intersectionCount = 0;
        const wordMatchDetails = Array(totalOriginalWordTokens).fill(null).map(() => new Set());

        const processedKeywords = keywords.map((kw, index) => ({
            original: kw,
            lower: kw.toLowerCase(),
            escapedLower: escapeRegExp(kw.toLowerCase()),
            regex: (() => {
                if (matchingStrategy === 'regex') {
                    try {
                        const match = kw.match(/^\/(.+)\/([gimyus]*)$/);
                        if (match && match[1]) return new RegExp(match[1], match[2] || 'gi');
                        if (kw) return new RegExp(kw, 'gi');
                    } catch (e) { console.error(`Invalid regex for kw "${kw}" in multi-density:`, e); return null; }
                }
                return null;
            })(),
            index
        }));

        originalWords.forEach((originalWord, wordIndex) => {
            const normalizedWord = originalWord.toLowerCase().replace(/^[.,!?;:"“”()]+|[.,!?;:"“”()]+$/g, '');
            if (!normalizedWord) return;

            processedKeywords.forEach(pk => {
                let isMatch = false;
                switch (matchingStrategy) {
                    case 'exact': isMatch = normalizedWord === pk.lower; break;
                    case 'partial': isMatch = normalizedWord.includes(pk.lower); break;
                    case 'word':
                        try { isMatch = new RegExp(`\\b${pk.escapedLower}\\b`, 'i').test(originalWord); } catch (e) { }
                        break;
                    case 'regex':
                        if (pk.regex) { pk.regex.lastIndex = 0; isMatch = pk.regex.test(originalWord); }
                        break;
                    default: isMatch = normalizedWord === pk.lower;
                }

                if (isMatch) {
                    totalMatchCount++;
                    wordMatchDetails[wordIndex].add(pk.index);
                }
            });

            if (wordMatchDetails[wordIndex].size > 1) {
                intersectionCount++;
            }
        });

        const uniqueWordsMatchedCount = wordMatchDetails.filter(s => s.size > 0).length;
        const totalNormalizedWords = _getTokens(text, true).length;

        return {
            totalMatchCount,
            density: totalNormalizedWords > 0 ? (totalMatchCount / totalNormalizedWords) * 100 : 0,
            intersectionCount,
            uniqueWordsMatched: uniqueWordsMatchedCount,
        };
    },

    highlightText: (text, keywordsToHighlight, matchingStrategy = 'exact', keywordIndicesForColors = null) => {
        if (!text || typeof text !== 'string' || !keywordsToHighlight || keywordsToHighlight.length === 0) return text;

        // If keywordIndicesForColors is null, assume keywordsToHighlight maps 1:1 for coloring
        // and their indices within keywordsToHighlight are used.
        // If keywordIndicesForColors is provided, it's an array of the *original* indices that
        // correspond to each keyword in keywordsToHighlight.
        const getEffectiveColorIndex = (localIndexInKeywordsToHighlight) => {
            if (keywordIndicesForColors && Array.isArray(keywordIndicesForColors) && localIndexInKeywordsToHighlight < keywordIndicesForColors.length && typeof keywordIndicesForColors[localIndexInKeywordsToHighlight] === 'number') {
                return keywordIndicesForColors[localIndexInKeywordsToHighlight];
            }
            return localIndexInKeywordsToHighlight; // Fallback to local index
        };

        const processedKeywords = keywordsToHighlight.map((kw, localIdx) => {
            if (typeof kw !== 'string') return null;
            const effectiveColorIdx = getEffectiveColorIndex(localIdx);
            return {
                original: kw,
                lower: kw.toLowerCase(),
                escapedLower: escapeRegExp(kw.toLowerCase()),
                regex: (() => {
                    if (matchingStrategy === 'regex') {
                        try {
                            const match = kw.match(/^\/(.+)\/([gimyus]*)$/);
                            if (match && match[1]) return new RegExp(match[1], match[2] || 'gi');
                            if (kw) return new RegExp(kw, 'gi');
                        } catch (e) { console.error(`Invalid regex for highlight kw "${kw}":`, e); return null; }
                    }
                    return null;
                })(),
                colorClass: utils.getKeywordColor(effectiveColorIdx)
            };
        }).filter(Boolean);

        if (processedKeywords.length === 0) return text;

        const segments = text.split(/(\s+|[.,!?;:"“”()[\]{}]+)/);
        let highlightedOutput = "";

        segments.forEach(segment => {
            if (!segment) return;
            if (/^\s+$|^[.,!?;:"“”()[\]{}]+$/.test(segment)) {
                highlightedOutput += segment;
                return;
            }

            const originalSegmentWord = segment;
            const lightNormalizedSegment = segment.toLowerCase().replace(/^[.,!?;:"“”()]+|[.,!?;:"“”()]+$/g, '');
            const normalizedSegmentWordForPartial = segment.toLowerCase();


            let matchedPKeywords = new Set();

            processedKeywords.forEach(pk => {
                let isMatch = false;
                switch (matchingStrategy) {
                    case 'exact': isMatch = lightNormalizedSegment === pk.lower; break;
                    case 'partial': isMatch = normalizedSegmentWordForPartial.includes(pk.lower); break;
                    case 'word':
                        try { isMatch = new RegExp(`\\b${pk.escapedLower}\\b`, 'i').test(originalSegmentWord); } catch (e) { }
                        break;
                    case 'regex':
                        if (pk.regex) { pk.regex.lastIndex = 0; isMatch = pk.regex.test(originalSegmentWord); }
                        break;
                    default: isMatch = lightNormalizedSegment === pk.lower;
                }
                if (isMatch) {
                    matchedPKeywords.add(pk);
                }
            });

            if (matchedPKeywords.size > 0) {
                const uniqueColorClasses = [...new Set(Array.from(matchedPKeywords).map(pk => pk.colorClass))].join(' ');
                const opacity = matchedPKeywords.size > 1 ? 'bg-opacity-75' : 'bg-opacity-50';
                const border = matchedPKeywords.size > 1 ? 'ring-1 ring-slate-400 dark:ring-slate-600 ring-offset-1' : '';
                highlightedOutput += `<mark class="${cn(uniqueColorClasses, opacity, border, 'rounded-sm', 'px-0.5', 'mx-px', 'font-semibold')}">${originalSegmentWord}</mark>`;
            } else {
                highlightedOutput += originalSegmentWord;
            }
        });

        return highlightedOutput;
    },

    getKeywordColor: (keywordIndex) => {
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
    },

    calculateSpeakingTime: (wordCount, rate = "average") => {
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
        if (parts.length === 0 && wordCount > 0) return `~1 sec`; // Fallback for very small word counts
        if (parts.length === 0 && wordCount === 0) return `~0 sec`;

        return `~${parts.join(' ')} of speaking time`;
    },
};

export { utils };
