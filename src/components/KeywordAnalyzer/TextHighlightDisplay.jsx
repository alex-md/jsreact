import React from 'react';

export const TextHighlightDisplay = ({ text, keywords, matchingStrategy, utils }) => {
    const highlightedText = utils.highlightText(text, keywords, matchingStrategy);
    const wordCount = text.trim().split(/\s+/).length;
    const { totalCount, intersections } = utils.calculateMultiKeywordDensity(text, keywords, matchingStrategy);
    const speakingTime = utils.calculateSpeakingTime(wordCount);

    return (
        <div className="card-modern">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Full Text Analysis</h2>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm text-gray-500">
                                {wordCount.toLocaleString()} words
                            </p>
                            <div className="flex items-center gap-1 text-sm text-purple-600">
                                <span>🎙️</span>
                                <span>{speakingTime}</span>
                            </div>
                            {keywords.length > 1 && (
                                <p className="text-sm text-gray-500">
                                    {intersections} intersections
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {keywords.map((keyword, index) => (
                        <div
                            key={index}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${utils.getKeywordColor(index)} bg-opacity-60`}
                        >
                            <span>🎯</span>
                            {keyword}
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-[#eaeaea] dark:border-[#333]">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div
                        className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: highlightedText }}
                    />
                </div>
            </div>
        </div>
    );
};
