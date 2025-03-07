import React, { useState, useCallback, useRef, useEffect } from 'react';
import { utils } from '../utils/utils';

const KeywordAnalyzer = () => {
    const [text, setText] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [matchingStrategy, setMatchingStrategy] = useState('partial');
    const [windowSizePercent, setWindowSizePercent] = useState(10);
    const [activeTab, setActiveTab] = useState('input'); // New state for tab navigation

    const handleKeywordsChange = useCallback((newKeywords) => {
        setKeywords(newKeywords);
    }, []);
    const handleMatchingStrategyChange = useCallback((newStrategy) => {
        setMatchingStrategy(newStrategy);
    }, []);
    const handleWindowSizeChange = useCallback((newSizePercent) => {
        setWindowSizePercent(newSizePercent);
    }, []);
    const getActualWindowSize = useCallback(() => {
        const words = text.trim().split(/\s+/);
        return Math.max(1, Math.round(windowSizePercent / 100 * words.length));
    }, [
        text,
        windowSizePercent
    ]);

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#111]">
            {/* Modern Header */}
            <header className="border-b border-[#eaeaea] dark:border-[#333] bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                        Keyword Density Analyzer
                    </h1>
                    <nav className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('input')}
                            className={`px-4 py-2 text-sm transition-colors ${activeTab === 'input'
                                    ? 'text-primary-500 border-b-2 border-primary-500'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Input
                        </button>
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`px-4 py-2 text-sm transition-colors ${activeTab === 'analysis'
                                    ? 'text-primary-500 border-b-2 border-primary-500'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                            disabled={!text || !keywords.length}
                        >
                            Analysis
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {activeTab === 'input' ? (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="card-modern">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary-50 text-primary-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Input Text</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Enter or paste the text you want to analyze</p>
                                </div>
                            </div>
                            <TextInput onTextChange={setText} />
                            <FileUpload handleFileLoad={setText} />
                        </div>

                        <div className="card-modern">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary-50 text-primary-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 010 2.828l-7.586 7.586a2 2 0 01-2.828 0l-5-5a2 2 0 010-2.828L7 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Keywords</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Configure your keywords and analysis settings</p>
                                </div>
                            </div>
                            <KeywordInput
                                keywords={keywords}
                                onKeywordsChange={handleKeywordsChange}
                                matchingStrategy={matchingStrategy}
                                onMatchingStrategyChange={handleMatchingStrategyChange}
                                windowSizePercent={windowSizePercent}
                                onWindowSizeChange={handleWindowSizeChange}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto space-y-8">
                        {text && keywords.length > 0 && (
                            <>
                                <HighestDensityClusterDisplay
                                    text={text}
                                    keywords={keywords}
                                    windowSize={getActualWindowSize()}
                                    matchingStrategy={matchingStrategy}
                                    utils={utils}
                                />
                                <ResultsDisplay
                                    text={text}
                                    keywords={keywords}
                                    matchingStrategy={matchingStrategy}
                                    windowSize={getActualWindowSize()}
                                    utils={utils}
                                />
                                <TextHighlightDisplay
                                    text={text}
                                    keywords={keywords}
                                    matchingStrategy={matchingStrategy}
                                    utils={utils}
                                />
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

const TextInput = ({ onTextChange }) => {
    return React.createElement("div", {
        className: "bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300"
    }, React.createElement("div", {
        className: "mb-6"
    }, React.createElement("h2", {
        className: "text-xl font-bold text-gray-900"
    }, "Input Text"), React.createElement("p", {
        className: "text-sm text-gray-600 mt-1"
    }, "Enter or paste the text you want to analyze.")), React.createElement("textarea", {
        onChange: (e) => onTextChange(e.target.value),
        placeholder: "Enter your text here...",
        className: "w-full h-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg   focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white   transition-all duration-200 placeholder-gray-400 text-gray-900 resize-none"
    }));
};
const FileUpload = ({ handleFileLoad }) => {
    const fileInputRef = useRef(null);
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => handleFileLoad(e.target.result);
            reader.readAsText(file);
        }
    };
    return React.createElement("div", {
        className: "flex flex-col items-center justify-center p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg hover:border-primary-300 transition-colors duration-200"
    }, React.createElement("input", {
        type: "file",
        ref: fileInputRef,
        onChange: handleFileChange,
        className: "hidden",
        accept: ".txt,.doc,.docx,.pdf,.md"
    }), React.createElement("button", {
        onClick: () => fileInputRef.current.click(),
        className: "px-6 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium   text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200   focus:outline-none focus:ring-2 focus:ring-primary-500/20"
    }, "Choose File"), React.createElement("p", {
        className: "mt-2 text-sm text-gray-500"
    }, "Supported formats: TXT, DOC, DOCX, PDF, MD"));
};
const KeywordInput = ({ keywords, onKeywordsChange, matchingStrategy, onMatchingStrategyChange, windowSizePercent, onWindowSizeChange }) => {
    const [newKeyword, setNewKeyword] = useState('');
    const handleAdd = (e) => {
        e.preventDefault();
        if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
            onKeywordsChange([
                ...keywords,
                newKeyword.trim()
            ]);
            setNewKeyword('');
        }
    };
    const handleRemove = (keywordToRemove) => {
        onKeywordsChange(keywords.filter((k) => k !== keywordToRemove));
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd(e);
        }
    };
    return React.createElement("div", {
        className: "bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300"
    }, React.createElement("div", {
        className: "mb-6"
    }, React.createElement("h2", {
        className: "text-xl font-bold text-gray-900"
    }, "Keywords"), React.createElement("p", {
        className: "text-sm text-gray-600 mt-1"
    }, "Add keywords to analyze their density and distribution in your text.")), React.createElement("div", {
        className: "space-y-6"
    }, React.createElement("form", {
        onSubmit: handleAdd,
        className: "relative"
    }, React.createElement("input", {
        type: "text",
        value: newKeyword,
        onChange: (e) => setNewKeyword(e.target.value),
        onKeyPress: handleKeyPress,
        placeholder: "Enter a keyword...",
        className: "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg   focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white   transition-all duration-200 placeholder-gray-400 text-gray-900"
    }), React.createElement("button", {
        type: "submit",
        disabled: !newKeyword.trim(),
        className: "absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary-500   text-white rounded-lg hover:bg-primary-600 transition-all duration-200   disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium   shadow-sm hover:shadow-md disabled:hover:shadow-none"
    }, "Add")), React.createElement("div", {
        className: "grid grid-cols-1 md:grid-cols-2 gap-6"
    }, React.createElement("div", {
        className: "space-y-2"
    }, React.createElement("label", {
        className: "block text-sm font-medium text-gray-700"
    }, "Matching Strategy"), React.createElement("select", {
        value: matchingStrategy,
        onChange: (e) => onMatchingStrategyChange(e.target.value),
        className: "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg   focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white   transition-all duration-200 text-gray-900 cursor-pointer hover:bg-gray-100"
    }, React.createElement("option", {
        value: "exact"
    }, "Exact Match"), React.createElement("option", {
        value: "partial"
    }, "Partial Match"), React.createElement("option", {
        value: "word"
    }, "Word Boundary Match"))), React.createElement("div", {
        className: "space-y-2"
    }, React.createElement("label", {
        className: "block text-sm font-medium text-gray-700"
    }, "Content Window Size (% of text)"), React.createElement("div", {
        className: "flex items-center gap-4"
    }, React.createElement("input", {
        type: "range",
        value: windowSizePercent,
        onChange: (e) => onWindowSizeChange(parseInt(e.target.value)),
        min: "1",
        max: "50",
        className: "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
    }), React.createElement("span", {
        className: "text-sm text-gray-600 min-w-[3rem]"
    }, windowSizePercent, "%")), React.createElement("p", {
        className: "text-xs text-gray-500 mt-1"
    }, "Slide to adjust the analysis window size (1-50% of total text)"))), React.createElement("div", {
        className: "flex flex-wrap gap-2 mt-4"
    }, keywords.map((keyword) => React.createElement("div", {
        key: keyword,
        className: "group flex items-center gap-2 px-3 py-1.5 bg-primary-50   text-primary-700 rounded-lg text-sm font-medium   border border-primary-100 hover:bg-primary-100 transition-colors duration-200"
    }, keyword, React.createElement("button", {
        onClick: () => handleRemove(keyword),
        className: "ml-1 text-primary-400 hover:text-primary-600 transition-colors",
        "aria-label": "Remove keyword"
    }, "×"))))));
};

const TextHighlightDisplay = ({ text, keywords, matchingStrategy, utils }) => {
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

const ResultsDisplay = ({ text, keywords, matchingStrategy, windowSize, utils }) => {
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

const HighestDensityClusterDisplay = ({ text, keywords, windowSize, matchingStrategy, utils }) => {
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

export default KeywordAnalyzer;
