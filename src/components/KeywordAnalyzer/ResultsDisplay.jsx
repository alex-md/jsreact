import React from 'react';

export const ResultsDisplay = ({ text, keywords, matchingStrategy, windowSize, utils }) => {
    const results = utils.analyzeKeywords(text, keywords, matchingStrategy);
    const totalWords = text.trim().split(/\s+/).length;
    const speakingTime = utils.calculateSpeakingTime(totalWords);

    return (
        <div className="card-modern">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Analysis Overview</h2>
                        <p className="text-sm text-gray-500 mt-1">Statistical analysis of keyword distribution</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-[#eaeaea] dark:border-[#333]">
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Total Words</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{totalWords.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-[#eaeaea] dark:border-[#333]">
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Window Size</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{windowSize} words</p>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-[#eaeaea] dark:border-[#333]">
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Total Matches</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                            {results.reduce((sum, r) => sum + r.count, 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg border border-[#eaeaea] dark:border-[#333] overflow-hidden">
                    <div className="grid grid-cols-4 gap-4 p-4 border-b border-[#eaeaea] dark:border-[#333] bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="font-medium text-gray-700 dark:text-gray-300">Keyword</div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">Occurrences</div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">Density (%)</div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">Distribution</div>
                    </div>
                    <div className="divide-y divide-[#eaeaea] dark:divide-[#333]">
                        {results.map((result, index) => (
                            <div key={index} className="grid grid-cols-4 gap-4 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className="font-medium text-emerald-600 dark:text-emerald-400">{result.keyword}</div>
                                <div className="text-gray-900 dark:text-gray-100">{result.count}</div>
                                <div className="text-gray-900 dark:text-gray-100">{(result.density * 100).toFixed(2)}%</div>
                                <div className="flex items-center">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-emerald-500 dark:bg-emerald-400 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(100, result.distribution * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
