const utils = {
    calculateDensity: (text, keyword, matchingStrategy = 'exact') => {
        if (!text || !keyword) return { count: 0, density: 0 };

        const words = text.split(/\s+/);
        let count = 0;

        switch (matchingStrategy) {
            case 'exact':
                count = words.filter(word => word.toLowerCase() === keyword.toLowerCase()).length;
                break;
            case 'partial':
                count = words.filter(word => word.toLowerCase().includes(keyword.toLowerCase())).length;
                break;
            case 'regex':
                try {
                    const regex = new RegExp(keyword, 'gi');
                    count = (text.match(regex) || []).length;
                } catch (e) {
                    console.error('Invalid regex pattern:', e);
                    count = 0;
                }
                break;
            default:
                count = words.filter(word => word.toLowerCase() === keyword.toLowerCase()).length;
        }

        const density = (count / words.length) * 100;
        return { count, density };
    },

    findKeywordClusters: (text, keyword, windowSize, matchingStrategy = 'exact') => {
        if (!text || !keyword || windowSize <= 0) return [];

        const words = text.split(/\s+/);
        const clusters = [];

        for (let i = 0; i <= words.length - windowSize; i++) {
            const windowText = words.slice(i, i + windowSize).join(' ');
            const { count, density } = utils.calculateDensity(windowText, keyword, matchingStrategy);

            if (count > 0) {
                clusters.push({
                    text: windowText,
                    start: i,
                    end: i + windowSize - 1,
                    count,
                    density
                });
            }
        }

        return clusters.sort((a, b) => b.density - a.density);
    },

    findIntersectionClusters: (text, keywords, windowSize, matchingStrategy = 'exact') => {
        if (!text || !keywords.length || windowSize <= 0) return [];

        const words = text.split(/\s+/);
        const clusters = [];

        for (let i = 0; i <= words.length - windowSize; i++) {
            const windowText = words.slice(i, i + windowSize).join(' ');
            const keywordsFound = keywords.filter(keyword => {
                const { count } = utils.calculateDensity(windowText, keyword, matchingStrategy);
                return count > 0;
            });

            if (keywordsFound.length > 1) {
                clusters.push({
                    text: windowText,
                    start: i,
                    end: i + windowSize - 1,
                    keywords: keywordsFound
                });
            }
        }

        return clusters.sort((a, b) => b.keywords.length - a.keywords.length);
    },

    getOverallStats: (text, keywords, matchingStrategy = 'exact') => {
        if (!text || !keywords.length) return [];

        return keywords.map(keyword => ({
            keyword,
            ...utils.calculateDensity(text, keyword, matchingStrategy)
        }));
    },

    calculateColorIntensity: (count, textLength) => {
        if (textLength === 0) return 200;
        // Calculate density as percentage (occurrences per 100 words)
        const density = (count / (textLength / 100));
        // Scale intensity based on density thresholds
        // 0-1% -> 400
        // 1-2% -> 300
        // 2-3% -> 200
        // >3% -> 100
        if (density <= 1) return 400;
        if (density <= 2) return 300;
        if (density <= 3) return 200;
        return 100;
    },

    getKeywordColor: (keywordIndex) => {
        // Array of distinct colors for different keywords
        const colors = [
            'bg-yellow-400',
            'bg-green-300',
            'bg-blue-300',
            'bg-pink-300',
            'bg-purple-300',
            'bg-orange-300',
            'bg-cyan-300',
            'bg-red-300'
        ];
        return colors[keywordIndex % colors.length];
    },

    calculateMultiKeywordDensity: (text, keywords, matchingStrategy = 'exact') => {
        if (!text || !keywords.length) return { totalCount: 0, density: 0, intersections: 0 };

        const words = text.split(/\s+/);
        let totalCount = 0;
        let intersectionCount = 0;
        let wordMatches = new Array(words.length).fill([]);

        keywords.forEach((keyword, keywordIndex) => {
            let matches = [];
            words.forEach((word, wordIndex) => {
                let isMatch = false;
                switch (matchingStrategy) {
                    case 'exact':
                        isMatch = word.toLowerCase() === keyword.toLowerCase();
                        break;
                    case 'partial':
                        isMatch = word.toLowerCase().includes(keyword.toLowerCase());
                        break;
                    case 'regex':
                        try {
                            isMatch = new RegExp(keyword, 'i').test(word);
                        } catch (e) {
                            console.error('Invalid regex pattern:', e);
                        }
                        break;
                }
                if (isMatch) {
                    matches.push(wordIndex);
                    wordMatches[wordIndex] = [...wordMatches[wordIndex], keywordIndex];
                }
            });
            totalCount += matches.length;
        });

        // Count intersections (words matching multiple keywords)
        intersectionCount = wordMatches.filter(matches => matches.length > 1).length;

        return {
            totalCount,
            density: (totalCount / words.length) * 100,
            intersections: intersectionCount
        };
    },

    highlightText: (text, keywords, matchingStrategy = 'exact') => {
        if (!text || !keywords.length) return text;

        let positions = [];
        const words = text.split(/\s+/);

        // Find all keyword matches and their positions
        keywords.forEach((keyword, keywordIndex) => {
            words.forEach((word, wordIndex) => {
                let isMatch = false;
                switch (matchingStrategy) {
                    case 'exact':
                        isMatch = word.toLowerCase() === keyword.toLowerCase();
                        break;
                    case 'partial':
                        isMatch = word.toLowerCase().includes(keyword.toLowerCase());
                        break;
                    case 'regex':
                        try {
                            isMatch = new RegExp(keyword, 'i').test(word);
                        } catch (e) {
                            console.error('Invalid regex pattern:', e);
                        }
                        break;
                }
                if (isMatch) {
                    positions.push({
                        word,
                        index: wordIndex,
                        keywordIndex,
                        keywords: [keywordIndex]
                    });
                }
            });
        });

        // Merge overlapping highlights
        positions = positions.reduce((acc, curr) => {
            const existing = acc.find(p => p.index === curr.index);
            if (existing) {
                existing.keywords = [...new Set([...existing.keywords, ...curr.keywords])];
                return acc;
            }
            return [...acc, curr];
        }, []);

        // Apply highlights
        let highlightedWords = [...words];
        positions.forEach(pos => {
            const colorClasses = pos.keywords.map(idx => utils.getKeywordColor(idx)).join(' ');
            const opacity = pos.keywords.length > 1 ? '90' : '60';
            highlightedWords[pos.index] = `<mark class="${colorClasses} bg-opacity-${opacity} rounded px-1">${pos.word}</mark>`;
        });

        return highlightedWords.join(' ');
    },

    findHighestDensityCluster: (text, keywords, windowSize, matchingStrategy = 'exact') => {
        if (!text || !keywords.length || windowSize <= 0) return null;

        const words = text.split(/\s+/);
        let highestDensityCluster = null;
        let maxCombinedScore = 0;

        // Find clusters with highest density for individual keywords
        const individualClusters = keywords.map(keyword => {
            let maxScore = 0;
            let bestCluster = null;

            for (let i = 0; i <= words.length - windowSize; i++) {
                const windowText = words.slice(i, i + windowSize).join(' ');
                const { count } = utils.calculateDensity(windowText, keyword, matchingStrategy);
                const score = count / windowSize;

                if (score > maxScore) {
                    maxScore = score;
                    bestCluster = {
                        text: windowText,
                        highlightedText: utils.highlightText(windowText, [keyword], matchingStrategy),
                        start: i,
                        end: i + windowSize,
                        keyword,
                        count,
                        density: score * 100
                    };
                }
            }
            return bestCluster;
        }).filter(Boolean);

        // Find clusters with highest combined density
        // Consider both total matches and balanced distribution across keywords
        for (let i = 0; i <= words.length - windowSize; i++) {
            const windowText = words.slice(i, i + windowSize).join(' ');
            const keywordCounts = keywords.map(keyword => {
                const { count } = utils.calculateDensity(windowText, keyword, matchingStrategy);
                return count;
            });

            const totalCount = keywordCounts.reduce((sum, count) => sum + count, 0);
            const { intersections } = utils.calculateMultiKeywordDensity(windowText, keywords, matchingStrategy);

            // Enhanced scoring that considers:
            // 1. Total keyword density
            // 2. Number of intersections (words matching multiple keywords)
            // 3. Balance of keyword distribution
            const avgCount = totalCount / keywords.length;
            const distribution = 1 - Math.sqrt(
                keywordCounts.reduce((variance, count) =>
                    variance + Math.pow(count - avgCount, 2), 0) / keywords.length
            ) / avgCount;

            const combinedScore = (
                (totalCount / windowSize) * 0.4 + // 40% weight on total density
                (intersections / windowSize) * 0.3 + // 30% weight on intersections
                distribution * 0.3 // 30% weight on balanced distribution
            );

            if (combinedScore > maxCombinedScore) {
                maxCombinedScore = combinedScore;
                highestDensityCluster = {
                    text: windowText,
                    highlightedText: utils.highlightText(windowText, keywords, matchingStrategy),
                    matchCount: totalCount,
                    intersections,
                    density: (totalCount / windowSize) * 100,
                    wordCount: windowSize,
                    score: combinedScore,
                    distribution: distribution * 100,
                    keywordCounts: Object.fromEntries(
                        keywords.map((keyword, i) => [keyword, keywordCounts[i]])
                    ),
                    start: i,
                    end: i + windowSize
                };
            }
        }

        // Add individual best clusters to the result
        if (highestDensityCluster) {
            highestDensityCluster.individualClusters = individualClusters;
        }

        return highestDensityCluster;
    },

    analyzeKeywords: (text, keywords, matchingStrategy = 'exact') => {
        if (!text || !keywords.length) return [];

        const words = text.split(/\s+/);
        const totalWords = words.length;

        return keywords.map(keyword => {
            const { count } = utils.calculateDensity(text, keyword, matchingStrategy);
            // Calculate distribution as percentage of text covered
            const distribution = count / totalWords;
            return {
                keyword,
                count,
                density: distribution,
                distribution
            };
        });
    },

    calculateSpeakingTime: (wordCount, rate = "average") => {
        // Words per minute rates based on research
        const rates = {
            slow: 130,   // Public speaking/presentation speed
            average: 150, // General conversational speed
            fast: 183     // Professional audiobook/podcast narration
        };

        // Ensure a valid rate is used, defaulting to "average" if invalid
        const wordsPerMinute = rates[rate] || rates.average;

        // Calculate total seconds (more accurate than relying on minutes alone)
        const totalSeconds = Math.round((wordCount / wordsPerMinute) * 60);

        // Convert seconds into minutes and seconds
        const fullMinutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        // Format output
        if (fullMinutes === 0) return `~${seconds} sec of speaking time`;
        if (seconds === 0) return `~${fullMinutes} min of speaking time`;
        return `~${fullMinutes} min ${seconds} sec of speaking time`;
    }
};

export { utils };
