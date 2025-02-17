import React from 'react';

const ResultsDisplay = ({ text, keywords, matchingStrategy, windowSize, utils }) => {
    const results = utils.analyzeKeywords(text, keywords, matchingStrategy);
    const totalWords = text.trim().split(/\s+/).length;
    const speakingTime = utils.calculateSpeakingTime(totalWords);

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-lg border border-emerald-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <h2 className="text-xl font-bold text-gray-900">Keyword Analysis Overview</h2>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-md">
                    <span className="text-xs text-emerald-600">🎙️ {speakingTime}</span>
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-emerald-100">
                        <p className="text-sm font-medium text-emerald-600 mb-1">Total Words</p>
                        <p className="text-2xl font-bold text-gray-900">{totalWords}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-emerald-100">
                        <p className="text-sm font-medium text-emerald-600 mb-1">Window Size</p>
                        <p className="text-2xl font-bold text-gray-900">{windowSize} words</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-emerald-100">
                        <p className="text-sm font-medium text-emerald-600 mb-1">Total Matches</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {results.reduce((sum, r) => sum + r.count, 0)}
                        </p>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-emerald-100 overflow-hidden">
                    <div className="grid grid-cols-4 gap-4 p-4 border-b border-emerald-100 bg-emerald-50/50">
                        <div className="font-medium text-gray-700">Keyword</div>
                        <div className="font-medium text-gray-700">Occurrences</div>
                        <div className="font-medium text-gray-700">Density (%)</div>
                        <div className="font-medium text-gray-700">Distribution</div>
                    </div>
                    <div className="divide-y divide-emerald-100">
                        {results.map((result, index) => (
                            <div key={index} className="grid grid-cols-4 gap-4 p-4 hover:bg-emerald-50/50 transition-colors">
                                <div className="font-medium text-emerald-700">{result.keyword}</div>
                                <div>{result.count}</div>
                                <div>{(result.density * 100).toFixed(2)}%</div>
                                <div className="flex items-center">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-emerald-500 h-2 rounded-full"
                                            style={{
                                                width: `${Math.min(100, result.distribution * 100)}%`,
                                            }}
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

export default ResultsDisplay;
