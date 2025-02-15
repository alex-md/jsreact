import React, { useMemo } from 'react';

const ResultsDisplay = ({ text, keywords, matchingStrategy, windowSize, utils, isLoading }) => {
    const results = useMemo(() => {
        if (!text || !keywords.length) return null;

        const overallStats = utils.getOverallStats(text, keywords, matchingStrategy);
        const individualClusters = keywords.map(keyword => ({
            keyword,
            clusters: utils.findKeywordClusters(text, keyword, windowSize, matchingStrategy)
        }));

        return {
            overallStats,
            individualClusters,
            highlightedFullText: utils.highlightText(text, keywords, matchingStrategy)
        };
    }, [text, keywords, matchingStrategy, windowSize, utils]);

    if (isLoading) {
        return (
            <div className="text-gray-500 text-center py-16 animate-pulse">
                <p className="text-lg font-medium">Analyzing text...</p>
            </div>
        );
    }

    if (!results) {
        return (
            <div
                className="text-gray-500 text-center py-16 animate-fade-in"
                style={{ animation: 'fadeIn 0.5s ease-out' }}
            >
                <p className="text-lg font-medium">Enter text and keywords to begin analysis</p>
                <p className="text-sm mt-2 text-gray-400">Your results will appear here</p>
            </div>
        );
    }

    const { overallStats, individualClusters, highlightedFullText } = results;

    return (
        <div
            className="space-y-8 animate-fade-in"
            style={{ animation: 'fadeIn 0.5s ease-out' }}
        >
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 p-6 transform transition-all hover:shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Keyword Analysis Overview</h2>
                {individualClusters.map(({ keyword, clusters }) => (
                    <div key={keyword} className="mb-6 last:mb-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Results for "{keyword}"
                        </h3>
                        <div className="text-sm text-gray-600 mb-3 font-medium">
                            Words {clusters[0].start + 1}-{clusters[0].end + 1}
                        </div>
                        <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                                __html: utils.highlightText(clusters[0].text, [keyword], matchingStrategy)
                            }}
                        />
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-lg card p-6 transform transition-all hover:shadow-xl">
                <h3 className="text-md font-bold text-gray-900 mb-4">Full Text Analysis</h3>
                <div
                    className="prose prose-lg max-w-none prose-primary"
                    dangerouslySetInnerHTML={{
                        __html: (highlightedFullText || '').split('\n')
                            .map(line => `<p class="mb-3 text-gray-900 text-sm">${line || '&nbsp;'}</p>`)
                            .join('')
                    }}
                />
            </div>
        </div>
    );
};

export default ResultsDisplay;
