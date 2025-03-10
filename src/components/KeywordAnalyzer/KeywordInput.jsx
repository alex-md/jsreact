import React, { useState } from 'react';

export const KeywordInput = ({
    keywords,
    onKeywordsChange,
    matchingStrategy,
    onMatchingStrategyChange,
    windowSizePercent,
    onWindowSizeChange,
    hasText
}) => {
    const [newKeyword, setNewKeyword] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
            onKeywordsChange([...keywords, newKeyword.trim()], hasText);
            setNewKeyword('');
        }
    };

    const handleRemove = (keywordToRemove) => {
        onKeywordsChange(keywords.filter(k => k !== keywordToRemove));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd(e);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleAdd} className="relative">
                <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a keyword and press Enter..."
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-[#eaeaea] dark:border-[#333] rounded-lg
                        focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-400
                        placeholder-gray-400 dark:placeholder-gray-600 transition-all duration-200
                        hover:border-gray-300 dark:hover:border-gray-700"
                />
                <button
                    type="submit"
                    disabled={!newKeyword.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary-500 text-white rounded-lg
                        hover:bg-primary-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                        text-sm font-medium shadow-sm hover:shadow-md disabled:hover:shadow-none"
                >
                    Add
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Matching Strategy
                    </label>
                    <select
                        value={matchingStrategy}
                        onChange={(e) => onMatchingStrategyChange(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-[#eaeaea] dark:border-[#333] rounded-lg
                            focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-400
                            text-gray-900 dark:text-gray-100 cursor-pointer transition-all duration-200
                            hover:border-gray-300 dark:hover:border-gray-700"
                    >
                        <option value="exact">Exact Match</option>
                        <option value="partial">Partial Match</option>
                        <option value="word">Word Boundary Match</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Content Window Size
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            value={windowSizePercent}
                            onChange={(e) => onWindowSizeChange(parseInt(e.target.value))}
                            min="1"
                            max="50"
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer
                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500
                                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
                                [&::-webkit-slider-thumb]:hover:scale-110"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem]">
                            {windowSizePercent}%
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Slide to adjust the analysis window size (1-50% of total text)
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {keywords.map(keyword => (
                    <div
                        key={keyword}
                        className="group flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20
                            text-primary-700 dark:text-primary-300 rounded-lg text-sm font-medium
                            border border-primary-100 dark:border-primary-800 hover:bg-primary-100 
                            dark:hover:bg-primary-900/30 transition-colors duration-200"
                    >
                        {keyword}
                        <button
                            onClick={() => handleRemove(keyword)}
                            className="ml-1 text-primary-400 hover:text-primary-600 transition-colors"
                            aria-label="Remove keyword"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
