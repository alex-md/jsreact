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
        // Aggressively tokenize: lowercase, split by common delimiters, filter empty strings
        // Example: "apple-pie." -> ["apple", "pie"]
        return text
            .toLowerCase()
            .split(/[\s!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]+/)
            .filter(Boolean);
    } else {
        // Less aggressive: split by whitespace, keep original casing and internal punctuation
        // Example: "apple-pie." -> ["apple-pie."]
        return text.split(/\s+/).filter(Boolean);
    }
};

// --- Main Utility Object ---
const utils = {

    calculateDensity: (text, keyword, matchingStrategy = 'exact') => {
        if (!text || !keyword || typeof text !== 'string' || typeof keyword !== 'string') {
            return { count: 0, density: 0 };
        }

        // Uses aggressive tokenization for overall density calculation
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
                        // Word boundary regex on the already tokenized word
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

        // Get words preserving original form for window slicing and highlighting
        const originalWordsForWindowing = _getTokens(text, false);
        const numValidWords = originalWordsForWindowing.length;

        if (numValidWords === 0) return null;

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

        // --- Calculate window boundaries helpers for centering ---
        const halfWindowBefore = Math.floor((windowSize - 1) / 2);
        const halfWindowAfter = Math.ceil((windowSize - 1) / 2);

        // --- Find Individual Best Clusters ---
        const individualClusters = processedKeywords.map((pk) => {
            let maxScore = -1;
            let bestCluster = null;

            // Loop through each word as a potential center of the window
            for (let centerIdx = 0; centerIdx < numValidWords; centerIdx++) {
                // Determine window boundaries based on centerIdx
                const windowStart = Math.max(0, centerIdx - halfWindowBefore);
                const windowEnd = Math.min(numValidWords - 1, centerIdx + halfWindowAfter);

                const windowOriginalWords = originalWordsForWindowing.slice(windowStart, windowEnd + 1);
                const effectiveWindowSize = windowOriginalWords.length;

                if (effectiveWindowSize === 0) continue; // Should not happen if numValidWords > 0

                const windowText = windowOriginalWords.join(' ');

                let currentKeywordCountInWindow = 0; // Total matches for *this single* keyword within the window

                windowOriginalWords.forEach(originalWordInWindow => {
                    // **Accuracy Enhancement**: Aggressively tokenize each word from the window for matching consistency
                    // This ensures that "fox-dog" is treated as "fox" and "dog" for matching purposes.
                    const subTokens = _getTokens(originalWordInWindow, true);
                    subTokens.forEach(subToken => {
                        if (!subToken) return;

                        let isMatch = false;
                        switch (matchingStrategy) {
                            case 'exact': isMatch = subToken === pk.lower; break;
                            case 'partial': isMatch = subToken.includes(pk.lower); break;
                            case 'word':
                                try { isMatch = new RegExp(`\\b${pk.escapedLower}\\b`, 'i').test(subToken); } catch (e) { }
                                break;
                            case 'regex':
                                if (pk.regex) { pk.regex.lastIndex = 0; isMatch = pk.regex.test(subToken); }
                                break;
                            default: isMatch = subToken === pk.lower;
                        }
                        if (isMatch) currentKeywordCountInWindow++;
                    });
                });


                if (currentKeywordCountInWindow > 0) {
                    const score = currentKeywordCountInWindow / effectiveWindowSize;
                    if (score > maxScore) {
                        maxScore = score;
                        bestCluster = {
                            text: windowText,
                            highlightedText: utils.highlightText(windowText, [pk.original], matchingStrategy, [pk.originalIndex]),
                            startWordIndex: windowStart,
                            endWordIndex: windowEnd,
                            centerWordIndex: centerIdx,
                            keyword: pk.original,
                            count: currentKeywordCountInWindow,
                            density: score * 100,
                            wordCount: effectiveWindowSize,
                        };
                    }
                }
            }
            return bestCluster;
        }).filter(Boolean);


        // --- Find Combined Highest Density Cluster ---
        let highestDensityCluster = null;
        let maxCombinedScore = -1;

        // Loop through each word as a potential center of the window
        for (let centerIdx = 0; centerIdx < numValidWords; centerIdx++) {
            // Determine window boundaries based on centerIdx
            const windowStart = Math.max(0, centerIdx - halfWindowBefore);
            const windowEnd = Math.min(numValidWords - 1, centerIdx + halfWindowAfter);

            const windowOriginalWords = originalWordsForWindowing.slice(windowStart, windowEnd + 1);
            const effectiveWindowSize = windowOriginalWords.length;

            if (effectiveWindowSize === 0) continue;

            const windowText = windowOriginalWords.join(' ');

            let totalMatchesInWindow = 0; // Total raw matches (e.g., if "apple-pie" is 1 original word, and "apple" is a keyword, count is 1)
            let intersectionsInWindow = 0; // Count of original words that matched >1 unique keywords

            const keywordCountsInWindow = {}; // { originalKeywordString: count }
            keywords.forEach(kw => keywordCountsInWindow[kw] = 0);
            const matchedKeywordsInWindow = new Set(); // Stores *unique* original keyword strings found in the window

            windowOriginalWords.forEach((originalWord) => {
                // For intersection calculation, we need to know which unique keywords matched *this specific original word*
                const uniqueKeywordsMatchedByThisOriginalWord = new Set();

                // **Accuracy Enhancement**: Aggressively tokenize this original word for precise matching
                const subTokens = _getTokens(originalWord, true);

                subTokens.forEach(subToken => {
                    if (!subToken) return;

                    processedKeywords.forEach(pk => {
                        let isMatch = false;
                        switch (matchingStrategy) {
                            case 'exact': isMatch = subToken === pk.lower; break;
                            case 'partial': isMatch = subToken.includes(pk.lower); break;
                            case 'word':
                                try { isMatch = new RegExp(`\\b${pk.escapedLower}\\b`, 'i').test(subToken); } catch (e) { }
                                break;
                            case 'regex':
                                if (pk.regex) { pk.regex.lastIndex = 0; isMatch = pk.regex.test(subToken); }
                                break;
                            default: isMatch = subToken === pk.lower;
                        }

                        if (isMatch) {
                            keywordCountsInWindow[pk.original]++;
                            totalMatchesInWindow++;
                            matchedKeywordsInWindow.add(pk.original); // For completeness score
                            uniqueKeywordsMatchedByThisOriginalWord.add(pk.original); // For intersection count
                        }
                    });
                });

                // An intersection occurs if this original word (via its sub-tokens) matched multiple distinct keywords
                if (uniqueKeywordsMatchedByThisOriginalWord.size > 1) {
                    intersectionsInWindow++;
                }
            });

            if (totalMatchesInWindow > 0) {
                const numKeywords = keywords.length;
                const densityValue = totalMatchesInWindow / effectiveWindowSize; // Uses effective window size
                const intersectionValue = intersectionsInWindow / effectiveWindowSize; // Uses effective window size

                let distributionScore = 0;
                if (numKeywords > 1) {
                    const counts = Object.values(keywordCountsInWindow);
                    const avgCount = counts.reduce((s, c) => s + c, 0) / numKeywords;
                    if (avgCount > 0) {
                        const variance = counts.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) / numKeywords;
                        const stdDev = Math.sqrt(variance);
                        distributionScore = Math.max(0, 1 - (stdDev / avgCount));
                    } else if (counts.every(c => c === 0)) {
                        distributionScore = 1; // If no keywords matched, distribution is considered perfect (vacuously true)
                    }
                } else if (numKeywords === 1) {
                    distributionScore = 1; // A single keyword is always perfectly distributed relative to itself
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
                        highlightedText: utils.highlightText(windowText, keywords, matchingStrategy, keywords.map((_, idx) => idx)),
                        matchCount: totalMatchesInWindow,
                        intersections: intersectionsInWindow,
                        density: densityValue * 100,
                        wordCount: effectiveWindowSize,
                        score: combinedScore,
                        distribution: distributionScore * 100,
                        completeness: completenessScore * 100,
                        keywordCounts: keywordCountsInWindow,
                        startWordIndex: windowStart,
                        endWordIndex: windowEnd,
                        centerWordIndex: centerIdx,
                        individualClusters: individualClusters,
                    };
                }
            }
        }
        return highestDensityCluster;
    },

    analyzeKeywords: (text, keywords, matchingStrategy = 'exact') => {
        if (!text || !keywords || !keywords.length || typeof text !== 'string') return [];
        const totalWords = _getTokens(text, true).length; // This uses aggressive tokenization for consistency

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

        const originalWords = _getTokens(text, false); // Get original words for iterating
        const totalOriginalWordTokens = originalWords.length;
        if (totalOriginalWordTokens === 0) return { totalMatchCount: 0, density: 0, intersectionCount: 0, uniqueWordsMatched: 0 };

        let totalMatchCount = 0; // Total matches based on sub-tokens
        let intersectionCount = 0; // Count of original words that matched >1 unique keywords
        // This keeps track of unique keyword indices matched by each *original word* (not subToken)
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
            // **Accuracy Enhancement**: Aggressively tokenize this original word for matching
            const subTokens = _getTokens(originalWord, true);
            
            subTokens.forEach(subToken => {
                if (!subToken) return;

                processedKeywords.forEach(pk => {
                    let isMatch = false;
                    switch (matchingStrategy) {
                        case 'exact': isMatch = subToken === pk.lower; break;
                        case 'partial': isMatch = subToken.includes(pk.lower); break;
                        case 'word':
                            try { isMatch = new RegExp(`\\b${pk.escapedLower}\\b`, 'i').test(subToken); } catch (e) { }
                            break;
                        case 'regex':
                            if (pk.regex) { pk.regex.lastIndex = 0; isMatch = pk.regex.test(subToken); }
                            break;
                        default: isMatch = subToken === pk.lower;
                    }

                    if (isMatch) {
                        totalMatchCount++;
                        wordMatchDetails[wordIndex].add(pk.index); // Add original keyword index to the original word's set
                    }
                });
            });

            // Intersection count is based on the original word (wordMatchDetails[wordIndex])
            if (wordMatchDetails[wordIndex].size > 1) {
                intersectionCount++;
            }
        });

        // uniqueWordsMatched: Number of *original words* that matched at least one keyword
        const uniqueWordsMatchedCount = wordMatchDetails.filter(s => s.size > 0).length;
        // totalNormalizedWords: total words in the text using aggressive tokenization for overall density denominator
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

        // Split by whitespace and common punctuation, but keep delimiters as separate segments
        // This is important for highlighting: "word." should be "word" + "."
        const segments = text.split(/(\s+|[.,!?;:"“”()[\]{}]+)/);
        let highlightedOutput = "";

        segments.forEach(segment => {
            if (!segment) return;
            // If the segment is just whitespace or punctuation, append it directly
            if (/^\s+$|^[.,!?;:"“”()[\]{}]+$/.test(segment)) {
                highlightedOutput += segment;
                return;
            }

            const originalSegmentWord = segment;
            // **Accuracy Enhancement**: Aggressively tokenize the segment for matching. This is key for highlighting.
            // Example: "apple-pie" segment will be split into ["apple", "pie"] for matching.
            const subTokens = _getTokens(originalSegmentWord, true);

            let matchedPKeywords = new Set(); // Set of processed keywords that matched ANY subToken in this segment

            subTokens.forEach(subToken => {
                if (!subToken) return;

                processedKeywords.forEach(pk => {
                    let isMatch = false;
                    switch (matchingStrategy) {
                        case 'exact': isMatch = subToken === pk.lower; break;
                        case 'partial': isMatch = subToken.includes(pk.lower); break;
                        case 'word':
                            // For 'word' boundary, apply regex to the subToken itself.
                            // E.g., if original was "fox-dog", subToken is "fox". `\bfox\b` on "fox" is correct.
                            try { isMatch = new RegExp(`\\b${pk.escapedLower}\\b`, 'i').test(subToken); } catch (e) { }
                            break;
                        case 'regex':
                            // For 'regex', apply regex to the subToken itself.
                            if (pk.regex) { pk.regex.lastIndex = 0; isMatch = pk.regex.test(subToken); }
                            break;
                        default: isMatch = subToken === pk.lower;
                    }
                    if (isMatch) {
                        matchedPKeywords.add(pk);
                    }
                });
            });

            if (matchedPKeywords.size > 0) {
                // If any keyword matched any sub-token within this original segment, highlight the whole segment.
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
