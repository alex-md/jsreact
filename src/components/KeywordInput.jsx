import React, { useState } from 'react';

const KeywordInput = ({ keywords, onKeywordsChange, matchingStrategy, onMatchingStrategyChange, windowSizePercent, onWindowSizeChange }) => {
    const [newKeyword, setNewKeyword] = useState('');

    const handleAdd = (e) => {
        e.preventDefault(); // Prevent form submission
        if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
            onKeywordsChange([...keywords, newKeyword.trim()]);
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Keywords</h2>
                <p className="text-sm text-gray-600 mt-1">
                    Add keywords to analyze their density and distribution in your text.
                </p>
            </div>

            <div className="space-y-6">
                <form onSubmit={handleAdd} className="relative">
                    <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter a keyword..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg 
                            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white 
                            transition-all duration-200 placeholder-gray-400 text-gray-900"
                    />
                    <button
                        type="submit"
                        disabled={!newKeyword.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary-500 
                            text-white rounded-lg hover:bg-primary-600 transition-all duration-200 
                            disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium 
                            shadow-sm hover:shadow-md disabled:hover:shadow-none"
                    >
                        Add
                    </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Matching Strategy
                        </label>
                        <select
                            value={matchingStrategy}
                            onChange={(e) => onMatchingStrategyChange(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg 
                                focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white 
                                transition-all duration-200 text-gray-900 cursor-pointer hover:bg-gray-100"
                        >
                            <option value="exact">Exact Match</option>
                            <option value="partial">Partial Match</option>
                            <option value="word">Word Boundary Match</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Content Window Size (% of text)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                value={windowSizePercent}
                                onChange={(e) => onWindowSizeChange(parseInt(e.target.value))}
                                min="1"
                                max="50"
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-sm text-gray-600 min-w-[3rem]">
                                {windowSizePercent}%
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Slide to adjust the analysis window size (1-50% of total text)
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    {keywords.map((keyword) => (
                        <div
                            key={keyword}
                            className="group flex items-center gap-2 px-3 py-1.5 bg-primary-50 
                                text-primary-700 rounded-lg text-sm font-medium 
                                border border-primary-100 hover:bg-primary-100 transition-colors duration-200"
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
        </div>
    );
};

export default KeywordInput;
