// Keyword Analysis Service
export class KeywordAnalysisService {
    static findMatches(text, keywords, options = {}) {
        const {
            matchingStrategy = 'exact',
            caseSensitive = false,
            windowSizePercent = 20
        } = options;

        if (!text || !keywords.length) return [];

        const normalizedText = caseSensitive ? text : text.toLowerCase();
        const matches = [];

        keywords.forEach(keyword => {
            const normalizedKeyword = caseSensitive ? keyword : keyword.toLowerCase();
            let pattern;

            switch (matchingStrategy) {
                case 'exact':
                    pattern = new RegExp(this.escapeRegExp(normalizedKeyword), 'g');
                    break;
                case 'partial':
                    pattern = new RegExp(this.escapeRegExp(normalizedKeyword), 'g');
                    break;
                case 'word':
                    pattern = new RegExp(`\\b${this.escapeRegExp(normalizedKeyword)}\\b`, 'g');
                    break;
                default:
                    pattern = new RegExp(this.escapeRegExp(normalizedKeyword), 'g');
            }

            let match;
            while ((match = pattern.exec(normalizedText)) !== null) {
                const windowSize = Math.floor(text.length * (windowSizePercent / 100));
                const start = Math.max(0, match.index - windowSize);
                const end = Math.min(text.length, match.index + keyword.length + windowSize);

                matches.push({
                    keyword,
                    index: match.index,
                    context: text.slice(start, end),
                    highlightStart: match.index - start,
                    highlightEnd: match.index - start + keyword.length
                });
            }
        });

        return matches.sort((a, b) => a.index - b.index);
    }

    static findDensityClusters(matches, text, windowSize = 100) {
        if (!matches.length) return [];

        const clusters = [];
        let currentCluster = [];
        let lastIndex = -windowSize;

        matches.forEach(match => {
            if (match.index - lastIndex > windowSize) {
                if (currentCluster.length) {
                    clusters.push([...currentCluster]);
                }
                currentCluster = [match];
            } else {
                currentCluster.push(match);
            }
            lastIndex = match.index;
        });

        if (currentCluster.length) {
            clusters.push(currentCluster);
        }

        return clusters.map(cluster => ({
            matches: cluster,
            density: cluster.length / (text.length / 1000), // Matches per 1000 characters
            start: cluster[0].index,
            end: cluster[cluster.length - 1].index + cluster[cluster.length - 1].keyword.length
        }));
    }

    static escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static getStatistics(matches, text) {
        const keywordCounts = {};
        matches.forEach(match => {
            keywordCounts[match.keyword] = (keywordCounts[match.keyword] || 0) + 1;
        });

        return {
            totalMatches: matches.length,
            matchesPerWord: matches.length / (text.split(/\s+/).length || 1),
            keywordDensity: (matches.length / (text.length || 1)) * 100,
            keywordCounts
        };
    }
}
