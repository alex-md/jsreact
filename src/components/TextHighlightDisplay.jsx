import React from 'react';

const TextHighlightDisplay = ({ text, keywords, matchingStrategy, utils }) => {
    const highlightedText = utils.highlightText(text, keywords, matchingStrategy);
    const wordCount = text.trim().split(/\s+/).length;
    const { totalCount, intersections } = utils.calculateMultiKeywordDensity(text, keywords, matchingStrategy);
    const speakingTime = utils.calculateSpeakingTime(wordCount);

    return (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg border border-purple-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📝</span>
                    <h2 className="text-xl font-bold text-gray-900">Full Text Analysis</h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                        Word Count: <span className="font-medium">{wordCount}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-md">
                        <span className="text-xs text-purple-600">🎙️ {speakingTime}</span>
                    </div>
                    {keywords.length > 1 && (
                        <div className="text-sm text-gray-600">
                            Intersections: <span className="font-medium">{intersections}</span>
                        </div>
                    )}
                </div>
            </div>

            {keywords.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                        <div
                            key={index}
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${utils.getKeywordColor(index)} bg-opacity-60`}
                        >
                            <span className="mr-1">🎯</span>
                            {keyword}
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-purple-100">
                <div className="prose prose-sm max-w-none">
                    <div
                        className="text-gray-900 whitespace-pre-wrap break-words leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: highlightedText }}
                    />
                </div>
            </div>
        </div>
    );
};

export default TextHighlightDisplay;
