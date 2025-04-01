// Assuming you have clsx and tailwind-merge installed and configured
// If not, you can remove the cn function and its usage
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Helper function to escape special characters for regex
const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

// Helper function for consistent word splitting (handles basic punctuation)
const splitIntoWords = (text) => {
    if (!text) return [];
    // Split by whitespace and remove leading/trailing punctuation from words
    // Keep empty strings resulting from multiple spaces to maintain indices if needed,
    // but filter them out for most calculations.
    // A simpler approach for density: split by space, then trim punctuation.
    return text.split(/\s+/).map(word => word.replace(/^[.,!?;:]+|[.,!?;:]+$/g, '')).filter(Boolean);
    // Alternative: More aggressive split including punctuation:
    // return text.toLowerCase().split(/[\s.,!?;:()"]+/).filter(Boolean);
};

// --- Main Utility Object ---
const utils = {

    // Calculates count and density for a SINGLE keyword
    calculateDensity: (text, keyword, matchingStrategy = 'exact') => {
        if (!text || !keyword) return { count: 0, density: 0 };

        // Use consistent word splitting
        const words = text.split(/\s+/).filter(Boolean); // Simple split by space for windowing
        const totalWords = words.length;
        if (totalWords === 0) return { count: 0, density: 0 };

        let count = 0;
        const lowerKeyword = keyword.toLowerCase();
        const escapedKeyword = escapeRegExp(lowerKeyword); // Escape for regex safety

        words.forEach(word => {
            const lowerWord = word.toLowerCase();
            let isMatch = false;
            switch (matchingStrategy) {
                case 'exact':
                    // Trim punctuation for exact match comparison
                    isMatch = lowerWord.replace(/^[.,!?;:]+|[.,!?;:]+$/g, '') === lowerKeyword;
                    break;
                case 'partial':
                    isMatch = lowerWord.includes(lowerKeyword);
                    break;
                case 'word': // Use word boundary regex
                    try {
                        const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i'); // case-insensitive
                        isMatch = regex.test(lowerWord);
                    } catch (e) {
                        console.error('Invalid regex pattern for word boundary:', e);
                    }
                    break;
                case 'regex': // User-provided regex
                    try {
                        // Assume user provides flags if needed, default to 'gi' if none are obvious
                        let regex;
                        try {
                            // Attempt to parse flags if provided like /pattern/flags
                            const match = keyword.match(/^\/(.+)\/([gimyus]*)$/);
                            if (match) {
                                regex = new RegExp(match[1], match[2] || 'gi');
                            } else {
                                // Assume pattern is just the string, use default flags
                                regex = new RegExp(keyword, 'gi');
                            }
                        } catch (innerE) {
                            // Fallback if parsing fails
                            regex = new RegExp(escapedKeyword, 'gi'); // Use escaped version as fallback
                        }
                        // Test against the original word (case sensitivity handled by regex flags)
                        isMatch = regex.test(word);
                    } catch (e) {
                        console.error('Invalid user regex pattern:', e);
                        count = 0; // Reset count on error
                    }
                    break;
                default: // Default to exact
                    isMatch = lowerWord.replace(/^[.,!?;:]+|[.,!?;:]+$/g, '') === lowerKeyword;
            }
            if (isMatch) {
                count++;
            }
        });

        const density = totalWords > 0 ? (count / totalWords) * 100 : 0;
        return { count, density };
    },

    // Finds the highest density cluster based on a combined score
    findHighestDensityCluster: (text, keywords, windowSize, matchingStrategy = 'exact') => {
        if (!text || !keywords.length || windowSize <= 0) return null;

        // Use a simple split by whitespace to define windows consistently
        const words = text.split(/\s+/);
        // Filter out potential empty strings from multiple spaces if necessary for accurate windowing
        const validWords = words.filter(Boolean);
        const numValidWords = validWords.length;

        if (windowSize > numValidWords) {
            console.warn("Window size is larger than the number of words in the text.");
            windowSize = numValidWords; // Adjust window size if necessary
        }
        if (windowSize <= 0) return null; // Cannot have a zero or negative window size


        let highestDensityCluster = null;
        let maxCombinedScore = -1; // Use -1 to ensure any positive score is initially higher

        // --- Find Individual Best Clusters (Optional but kept from original logic) ---
        const individualClusters = keywords.map((keyword, keywordIndex) => {
            let maxScore = -1;
            let bestCluster = null;

            for (let i = 0; i <= numValidWords - windowSize; i++) {
                const windowWords = validWords.slice(i, i + windowSize);
                const windowText = windowWords.join(' ');
                const { count } = utils.calculateDensity(windowText, keyword, matchingStrategy); // Use the same util

                if (count > 0) {
                    const score = count / windowSize; // Simple density score for individual keyword
                    if (score > maxScore) {
                        maxScore = score;
                        bestCluster = {
                            text: windowText,
                            // Highlight only the specific keyword for this individual view
                            highlightedText: utils.highlightText(windowText, [keyword], matchingStrategy, [keywordIndex]), // Pass index
                            startWordIndex: i, // Store word index
                            endWordIndex: i + windowSize,
                            keyword: keyword,
                            count: count,
                            density: score * 100,
                            wordCount: windowSize,
                        };
                    }
                }
            }
            return bestCluster;
        }).filter(Boolean); // Remove nulls if a keyword wasn't found

        // --- Find Combined Highest Density Cluster ---
        for (let i = 0; i <= numValidWords - windowSize; i++) {
            const windowWords = validWords.slice(i, i + windowSize);
            const windowText = windowWords.join(' ');

            let totalMatchesInWindow = 0;
            let intersectionsInWindow = 0;
            const keywordCountsInWindow = {}; // Store counts per keyword { keyword: count }
            const matchedIndicesInWindow = new Set(); // Store indices of words that matched *any* keyword
            const wordMatchDetails = {}; // Store details like { wordIndex: [kwIndex1, kwIndex2] }

            // Analyze the window word by word for all keywords
            windowWords.forEach((word, wordIndexInWindow) => {
                const lowerWord = word.toLowerCase();
                let matchesForThisWord = []; // List of keyword *indices* matching this word

                keywords.forEach((keyword, keywordIndex) => {
                    const lowerKeyword = keyword.toLowerCase();
                    const escapedKeyword = escapeRegExp(lowerKeyword);
                    let isMatch = false;

                    switch (matchingStrategy) {
                        case 'exact':
                            isMatch = lowerWord.replace(/^[.,!?;:]+|[.,!?;:]+$/g, '') === lowerKeyword;
                            break;
                        case 'partial':
                            isMatch = lowerWord.includes(lowerKeyword);
                            break;
                        case 'word':
                            try {
                                const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
                                isMatch = regex.test(lowerWord);
                            } catch (e) { }
                            break;
                        case 'regex':
                            try {
                                // Consistent regex handling as in calculateDensity
                                let regex;
                                try {
                                    const match = keyword.match(/^\/(.+)\/([gimyus]*)$/);
                                    if (match) {
                                        regex = new RegExp(match[1], match[2] || 'gi');
                                    } else {
                                        regex = new RegExp(keyword, 'gi');
                                    }
                                } catch (innerE) {
                                    regex = new RegExp(escapedKeyword, 'gi');
                                }
                                isMatch = regex.test(word); // Test original word
                            } catch (e) { }
                            break;
                        default:
                            isMatch = lowerWord.replace(/^[.,!?;:]+|[.,!?;:]+$/g, '') === lowerKeyword;
                    }

                    if (isMatch) {
                        matchesForThisWord.push(keywordIndex);
                        // Increment count for this specific keyword
                        keywordCountsInWindow[keyword] = (keywordCountsInWindow[keyword] || 0) + 1;
                        matchedIndicesInWindow.add(wordIndexInWindow); // Mark word as matched
                        totalMatchesInWindow++; // Increment total matches
                    }
                });

                // Store which keywords matched this word index
                if (matchesForThisWord.length > 0) {
                    wordMatchDetails[wordIndexInWindow] = matchesForThisWord;
                }
                // Count intersections (words matched by > 1 keyword)
                if (matchesForThisWord.length > 1) {
                    intersectionsInWindow++;
                }
            });

            // Ensure all keywords are present in the counts map, even if count is 0
            keywords.forEach(keyword => {
                if (!(keyword in keywordCountsInWindow)) {
                    keywordCountsInWindow[keyword] = 0;
                }
            });

            // Calculate metrics only if there are matches in the window
            if (totalMatchesInWindow > 0) {
                const keywordCountsArray = Object.values(keywordCountsInWindow);

                // Calculate distribution score (0-1, higher is more balanced)
                // Avoid division by zero if totalCount is 0 or only one keyword exists
                let distributionScore = 0;
                if (keywords.length > 1 && totalMatchesInWindow > 0) {
                    const avgCount = totalMatchesInWindow / keywords.length;
                    if (avgCount > 0) { // Avoid division by zero if avg is zero
                        const variance = keywordCountsArray.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) / keywords.length;
                        const stdDev = Math.sqrt(variance);
                        // Coefficient of variation, inverted and clamped (lower CV means better distribution)
                        distributionScore = Math.max(0, 1 - (stdDev / avgCount));
                    } else if (keywordCountsArray.every(c => c === 0)) {
                        distributionScore = 1; // Perfect distribution if all counts are 0
                    } else {
                        distributionScore = 0; // Undefined/bad distribution if avg is 0 but counts exist
                    }
                } else if (keywords.length === 1) {
                    distributionScore = 1; // Distribution is perfect with only one keyword
                }


                // --- Combined Scoring ---
                // Weights can be adjusted based on desired outcome
                const densityWeight = 1;    // Increased weight on raw density
                const intersectionWeight = 0.2; // Lowered weight on intersections
                const distributionWeight = 0.3; // Weight for balance

                const densityValue = totalMatchesInWindow / windowSize;
                const intersectionValue = intersectionsInWindow / windowSize; // Density of intersections
                const distributionValue = distributionScore;

                // Calculate the combined score
                const combinedScore = (
                    (densityValue * densityWeight) +
                    (intersectionValue * intersectionWeight) +
                    (distributionValue * distributionWeight)
                );

                // Update highest density cluster if this window is better
                if (combinedScore > maxCombinedScore) {
                    maxCombinedScore = combinedScore;
                    highestDensityCluster = {
                        text: windowText,
                        // Highlight all keywords found in this window
                        highlightedText: utils.highlightText(windowText, keywords, matchingStrategy),
                        matchCount: totalMatchesInWindow,
                        intersections: intersectionsInWindow,
                        density: densityValue * 100, // Overall density %
                        wordCount: windowSize,
                        score: combinedScore,
                        distribution: distributionValue * 100, // Distribution score %
                        keywordCounts: keywordCountsInWindow, // Map { keyword: count }
                        startWordIndex: i,
                        endWordIndex: i + windowSize,
                        // Keep individual best clusters (calculated earlier)
                        individualClusters: individualClusters,
                    };
                }
            }
        }

        return highestDensityCluster;
    },

    // Calculate overall stats for the entire text
    analyzeKeywords: (text, keywords, matchingStrategy = 'exact') => {
        if (!text || !keywords.length) return [];
        const totalWords = splitIntoWords(text).length; // Use consistent splitting

        return keywords.map(keyword => {
            const { count } = utils.calculateDensity(text, keyword, matchingStrategy);
            return {
                keyword,
                count,
                // Density relative to the entire text
                density: totalWords > 0 ? (count / totalWords) * 100 : 0,
                // Raw count is often more useful than 'distribution' for overall stats
            };
        });
    },

    // Calculate intersections and total count for the entire text
    calculateMultiKeywordDensity: (text, keywords, matchingStrategy = 'exact') => {
        if (!text || !keywords.length) return { totalCount: 0, density: 0, intersections: 0 };

        const words = text.split(/\s+/).filter(Boolean); // Simple split
        const totalWords = words.length;
        if (totalWords === 0) return { totalCount: 0, density: 0, intersections: 0 };

        let totalCount = 0;
        let intersectionCount = 0;
        const wordMatches = Array(totalWords).fill(0).map(() => []); // Store keyword *indices* matching each word

        keywords.forEach((keyword, keywordIndex) => {
            const lowerKeyword = keyword.toLowerCase();
            const escapedKeyword = escapeRegExp(lowerKeyword);

            words.forEach((word, wordIndex) => {
                const lowerWord = word.toLowerCase();
                let isMatch = false;
                switch (matchingStrategy) {
                    case 'exact':
                        isMatch = lowerWord.replace(/^[.,!?;:]+|[.,!?;:]+$/g, '') === lowerKeyword;
                        break;
                    case 'partial':
                        isMatch = lowerWord.includes(lowerKeyword);
                        break;
                    case 'word':
                        try {
                            const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
                            isMatch = regex.test(lowerWord);
                        } catch (e) { }
                        break;
                    case 'regex':
                        try {
                            let regex;
                            try {
                                const match = keyword.match(/^\/(.+)\/([gimyus]*)$/);
                                if (match) {
                                    regex = new RegExp(match[1], match[2] || 'gi');
                                } else {
                                    regex = new RegExp(keyword, 'gi');
                                }
                            } catch (innerE) {
                                regex = new RegExp(escapedKeyword, 'gi');
                            }
                            isMatch = regex.test(word);
                        } catch (e) { }
                        break;
                    default:
                        isMatch = lowerWord.replace(/^[.,!?;:]+|[.,!?;:]+$/g, '') === lowerKeyword;
                }

                if (isMatch) {
                    // Only add index if not already present for this word (avoid double counting total)
                    if (!wordMatches[wordIndex].includes(keywordIndex)) {
                        wordMatches[wordIndex].push(keywordIndex);
                        totalCount++; // Increment total count only once per keyword match per word
                    }
                }
            });
        });

        // Count intersections (words matching multiple unique keywords)
        intersectionCount = wordMatches.filter(matches => matches.length > 1).length;

        return {
            totalCount,
            density: totalWords > 0 ? (totalCount / totalWords) * 100 : 0,
            intersections: intersectionCount
        };
    },


    // Highlight text - Refined to handle multiple overlaps and use specific indices if provided
    highlightText: (text, keywords, matchingStrategy = 'exact', keywordIndices = null) => {
        if (!text || !keywords || keywords.length === 0) return text; // Added check for keywords array itself

        // Determine the function to get the correct index for coloring.
        // If keywordIndices is provided, it maps the local index (in the potentially subset 'keywords' array)
        // back to the original index from the full list. Otherwise, use the local index.
        const getEffectiveIndex = (localIndex) => {
            // Ensure keywordIndices is valid and has an entry for the localIndex
            if (keywordIndices && Array.isArray(keywordIndices) && localIndex < keywordIndices.length) {
                return keywordIndices[localIndex];
            }
            return localIndex; // Fallback to local index
        };

        // Split text while preserving whitespace
        const words = text.split(/(\s+)/);
        let highlightedOutput = "";

        words.forEach(segment => {
            // Preserve whitespace segments
            if (/^\s+$/.test(segment)) {
                highlightedOutput += segment;
                return;
            }

            // Process word segments
            const word = segment;
            if (!word) return; // Skip empty segments just in case

            const lowerWord = word.toLowerCase(); // Perform toLowerCase once for the word
            let wordHighlightClasses = [];
            let matchedEffectiveIndices = new Set(); // Track *effective* indices for unique color check

            // Iterate through the keywords array passed to *this function call*
            keywords.forEach((keyword, localIndex) => {
                // --- Safety Check: Ensure keyword is a string ---
                if (typeof keyword !== 'string') {
                    console.warn(`HighlightText: Skipping non-string keyword at local index ${localIndex}:`, keyword);
                    return; // Skip this iteration safely
                }
                // --- End Safety Check ---

                const effectiveKeywordIndex = getEffectiveIndex(localIndex);
                // --- Safety Check: Ensure effective index is valid ---
                if (typeof effectiveKeywordIndex !== 'number' || effectiveKeywordIndex < 0) {
                    console.warn(`HighlightText: Invalid effective index (${effectiveKeywordIndex}) derived for keyword "${keyword}" at local index ${localIndex}. Indices provided:`, keywordIndices);
                    return; // Skip if the index mapping seems broken
                }
                // --- End Safety Check ---

                const lowerKeyword = keyword.toLowerCase(); // Now safe
                const escapedKeyword = escapeRegExp(lowerKeyword);
                let isMatch = false;

                // Match logic (same as before)
                switch (matchingStrategy) {
                    case 'exact':
                        isMatch = lowerWord.replace(/^[.,!?;:]+|[.,!?;:]+$/g, '') === lowerKeyword;
                        break;
                    case 'partial':
                        isMatch = lowerWord.includes(lowerKeyword);
                        break;
                    case 'word':
                        try {
                            const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
                            isMatch = regex.test(lowerWord); // Use lowerWord for case-insensitivity consistency
                        } catch (e) { console.error("Regex error (word):", e) }
                        break;
                    case 'regex':
                        try {
                            let regex;
                            try {
                                const match = keyword.match(/^\/(.+)\/([gimyus]*)$/);
                                if (match) {
                                    regex = new RegExp(match[1], match[2] || 'gi');
                                } else {
                                    regex = new RegExp(keyword, 'gi');
                                }
                            } catch (innerE) {
                                regex = new RegExp(escapedKeyword, 'gi');
                            }
                            isMatch = regex.test(word); // Test original case word for regex
                        } catch (e) { console.error("Regex error (user):", e) }
                        break;
                    default:
                        isMatch = lowerWord.replace(/^[.,!?;:]+|[.,!?;:]+$/g, '') === lowerKeyword;
                }

                if (isMatch) {
                    // Use the effectiveKeywordIndex for coloring
                    wordHighlightClasses.push(utils.getKeywordColor(effectiveKeywordIndex));
                    matchedEffectiveIndices.add(effectiveKeywordIndex);
                }
            });

            // Apply highlighting if any keyword matched
            if (wordHighlightClasses.length > 0) {
                const uniqueClasses = [...new Set(wordHighlightClasses)].join(' ');
                // Base opacity/border on the number of *unique* effective indices matching
                const opacity = matchedEffectiveIndices.size > 1 ? 'bg-opacity-80' : 'bg-opacity-60';
                const border = matchedEffectiveIndices.size > 1 ? 'ring-1 ring-gray-400 ring-offset-1' : '';
                highlightedOutput += `<mark class="${uniqueClasses} ${opacity} ${border} rounded px-0.5 mx-px">${word}</mark>`;
            } else {
                highlightedOutput += word; // Append the word as is if no match
            }
        });

        return highlightedOutput;
    },

    // Color selection for keywords - remains the same
    getKeywordColor: (keywordIndex) => {
        const colors = [
            'bg-yellow-300', 'text-yellow-900', // Pair for better contrast possibility
            'bg-emerald-300', 'text-emerald-900',
            'bg-sky-300', 'text-sky-900',
            'bg-pink-300', 'text-pink-900',
            'bg-purple-300', 'text-purple-900',
            'bg-orange-300', 'text-orange-900',
            'bg-cyan-300', 'text-cyan-900',
            'bg-rose-300', 'text-rose-900',
            'bg-lime-300', 'text-lime-900',
            'bg-indigo-300', 'text-indigo-900',
        ];
        // Use only the background color part for the highlight mark
        return colors[(keywordIndex * 2) % colors.length];
    },

    // Calculate speaking time - remains the same
    calculateSpeakingTime: (wordCount, rate = "average") => {
        const rates = { slow: 130, average: 150, fast: 183 };
        const wordsPerMinute = rates[rate] || rates.average;
        if (wordCount === 0) return `~0 sec speaking time`;
        const totalSeconds = Math.max(1, Math.round((wordCount / wordsPerMinute) * 60)); // Ensure at least 1 sec if words > 0
        const fullMinutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        let parts = [];
        if (fullMinutes > 0) {
            parts.push(`${fullMinutes} min`);
        }
        if (seconds > 0) {
            parts.push(`${seconds} sec`);
        }
        return `~${parts.join(' ')} of speaking time`;
    },
};

export { utils };
