import React, { useEffect } from 'react';

const HighestDensityClusterDisplay = ({ text, keywords, windowSize, matchingStrategy, utils }) => {
    useEffect(() => {
        console.log('HighestDensityCluster Props:', {
            textLength: text?.length,
            keywords,
            windowSize,
            matchingStrategy
        });
    }, [text, keywords, windowSize, matchingStrategy]);

    const cluster = utils.findHighestDensityCluster(text, keywords, windowSize, matchingStrategy);

    useEffect(() => {
        console.log('Cluster Result:', cluster);
    }, [cluster]);

    const renderDistributionChart = (keywordCounts) => {
        const maxCount = Math.max(...Object.values(keywordCounts));
        return (
            <div className="flex items-end gap-1 h-8">
                {Object.entries(keywordCounts).map(([keyword, count], index) => (
                    <div key={keyword} className="relative group">
                        <div
                            className={`w-4 ${utils.getKeywordColor(index)} bg-opacity-60 rounded-t`}
                            style={{ height: `${(count / maxCount) * 100}%` }}
                        />
                        <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1">
                            {keyword}: {count}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-indigo-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🌟</span>
                <h2 className="text-xl font-bold text-gray-900">Highest Density Analysis</h2>
            </div>

            {cluster ? (
                <div className="space-y-6">
                    {/* Combined Highest Density Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Combined Density Cluster</h3>
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-100">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-sm font-medium text-gray-700">
                                    Found {cluster.matchCount} keyword matches and {cluster.intersections} intersections in this section:
                                </p>
                                <div className="flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded-md">
                                    <span className="text-xs text-indigo-600">🎙️ {utils.calculateSpeakingTime(cluster.wordCount)}</span>
                                </div>
                            </div>
                            <p
                                className="text-gray-900 font-medium p-3 bg-white rounded-md border border-indigo-50"
                                dangerouslySetInnerHTML={{ __html: cluster.highlightedText }}
                            />
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                <div>
                                    <p className="text-xs font-medium text-indigo-600">Density</p>
                                    <p className="text-sm font-semibold">{cluster.density.toFixed(2)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-indigo-600">Distribution</p>
                                    <p className="text-sm font-semibold">{cluster.distribution.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-indigo-600">Matches</p>
                                    <p className="text-sm font-semibold">{cluster.matchCount}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-indigo-600">Intersections</p>
                                    <p className="text-sm font-semibold">{cluster.intersections}</p>
                                </div>
                            </div>
                            {keywords.length > 1 && (
                                <div className="mt-4 p-3 bg-white rounded-md border border-indigo-50">
                                    <p className="text-xs font-medium text-indigo-600 mb-2">Keyword Distribution</p>
                                    {renderDistributionChart(cluster.keywordCounts)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Individual Keyword Clusters */}
                    {cluster.individualClusters && cluster.individualClusters.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Best Clusters per Keyword</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {cluster.individualClusters.map((individualCluster, index) => (
                                    <div
                                        key={index}
                                        className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-100"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`${utils.getKeywordColor(index)} bg-opacity-60 px-2 py-0.5 rounded text-sm font-medium`}
                                                >
                                                    {individualCluster.keyword}
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    {individualCluster.count} matches
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-indigo-600">
                                                    Density: {individualCluster.density.toFixed(2)}%
                                                </span>
                                                <div className="flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded-md">
                                                    <span className="text-xs text-indigo-600">🎙️ {utils.calculateSpeakingTime(windowSize)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="text-sm text-gray-900 p-3 bg-white rounded-md border border-indigo-50"
                                            dangerouslySetInnerHTML={{ __html: individualCluster.highlightedText }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Keyword Legend */}
                    {keywords.length > 1 && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-100">
                            <p className="text-sm font-medium text-indigo-600 mb-2">Keyword Legend</p>
                            <div className="flex flex-wrap gap-2">
                                {keywords.map((keyword, index) => (
                                    <div
                                        key={index}
                                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${utils.getKeywordColor(index)} bg-opacity-60`}
                                    >
                                        {keyword}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-100">
                    <p className="text-gray-600 text-center">
                        No keyword clusters found in the text.
                    </p>
                </div>
            )}
        </div>
    );
};

export default HighestDensityClusterDisplay;
