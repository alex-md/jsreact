import React from 'react';

export const HighestDensityClusterDisplay = ({ text, keywords, windowSize, matchingStrategy, utils }) => {
    const cluster = utils.findHighestDensityCluster(text, keywords, windowSize, matchingStrategy);

    const renderDistributionChart = (keywordCounts) => {
        const maxCount = Math.max(...Object.values(keywordCounts));
        return (
            <div className="flex items-end gap-1 h-8">
                {Object.entries(keywordCounts).map(([keyword, count], index) => (
                    <div key={keyword} className="relative group">
                        <div
                            className={`w-4 ${utils.getKeywordColor(index)} bg-opacity-60 rounded-t transition-all duration-300`}
                            style={{ height: `${(count / maxCount) * 100}%` }}
                        />
                        <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 hidden group-hover:block 
                            bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                            {keyword}: {count}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="card-modern">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Highest Density Analysis</h2>
                    <p className="text-sm text-gray-500 mt-1">Most concentrated keyword clusters</p>
                </div>
            </div>

            {cluster ? (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3">
                            Combined Density Cluster
                        </h3>
                        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-[#eaeaea] dark:border-[#333]">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Found {cluster.matchCount} keyword matches and {cluster.intersections} intersections in this section:
                                </p>
                                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                    <span className="text-xs text-blue-600 dark:text-blue-400">
                                        🎙️ {utils.calculateSpeakingTime(cluster.wordCount)}
                                    </span>
                                </div>
                            </div>
                            <p className="text-gray-900 dark:text-gray-100 font-medium p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-[#eaeaea] dark:border-[#333]"
                                dangerouslySetInnerHTML={{ __html: cluster.highlightedText }}
                            />
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                <div>
                                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Density</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{cluster.density.toFixed(2)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Distribution</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{cluster.distribution.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Matches</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{cluster.matchCount}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Intersections</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{cluster.intersections}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {keywords.length > 1 && (
                        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-[#eaeaea] dark:border-[#333]">
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">Keyword Distribution</p>
                            {renderDistributionChart(cluster.keywordCounts)}
                        </div>
                    )}

                    {cluster.individualClusters && cluster.individualClusters.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3">
                                Best Clusters per Keyword
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {cluster.individualClusters.map((individualCluster, index) => (
                                    <div key={index} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-[#eaeaea] dark:border-[#333]">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`${utils.getKeywordColor(index)} bg-opacity-60 px-2 py-0.5 rounded text-sm font-medium`}>
                                                    {individualCluster.keyword}
                                                </div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {individualCluster.count} matches
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    Density: {individualCluster.density.toFixed(2)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-900 dark:text-gray-100 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-[#eaeaea] dark:border-[#333]"
                                            dangerouslySetInnerHTML={{ __html: individualCluster.highlightedText }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-[#eaeaea] dark:border-[#333]">
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                        No keyword clusters found in the text.
                    </p>
                </div>
            )}
        </div>
    );
};
