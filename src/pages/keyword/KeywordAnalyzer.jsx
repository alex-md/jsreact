// KeywordAnalyzer.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { utils } from './KeywordUtils'; // Assuming KeywordUtils.js is in the same directory

const KeywordAnalyzer = () => {
    const [text, setText] = useState('');
    const [keywords, setKeywords] = useState([]); // Array of keyword strings
    const [matchingStrategy, setMatchingStrategy] = useState('partial');
    const [windowSize, setWindowSize] = useState(50);
    const [displayWindowSize, setDisplayWindowSize] = useState(50);
    const [analysisState, setAnalysisState] = useState(null);

    const handleKeywordsChange = useCallback((newKeywords) => {
        setKeywords(newKeywords);
    }, []);

    const handleMatchingStrategyChange = useCallback((newStrategy) => {
        setMatchingStrategy(newStrategy);
    }, []);

    const handleWindowSizeChange = useCallback((newSize) => {
        setDisplayWindowSize(newSize);
    }, []);

    const runAnalysis = useCallback(() => {
        if (text && keywords.length > 0) {
            setWindowSize(displayWindowSize); // Update actual window size for analysis
            setAnalysisState({
                trigger: Date.now(),
            });
        }
    }, [text, keywords, matchingStrategy, displayWindowSize]);

    const canAnalyze = text.trim().length > 0 && keywords.length > 0;
    const currentTextWordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

    return (
        <div className="container mx-auto px-4 py-8 max-w-screen-2xl"> {/* Wider container */}
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Keyword Density Analyzer</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Input your text, add keywords, and gain insights into keyword distribution and density.
                </p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-8 gap-8">
                <div className="xl:col-span-3 space-y-8">
                    <div className="grid grid-cols-1 gap-8">
                        <TextInput onTextChange={setText} initialText={text} />
                        <FileUpload handleFileLoad={setText} />
                    </div>
                    <KeywordInput
                        keywords={keywords}
                        onKeywordsChange={handleKeywordsChange}
                        matchingStrategy={matchingStrategy}
                        onMatchingStrategyChange={handleMatchingStrategyChange}
                        windowSize={displayWindowSize}
                        onWindowSizeChange={handleWindowSizeChange}
                        maxWindowSize={Math.max(10, currentTextWordCount)}
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={runAnalysis}
                            disabled={!canAnalyze}
                            className={`px-6 py-3 rounded-lg text-sm font-medium shadow-sm transition-all duration-200
                                ${canAnalyze
                                    ? 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-md dark:bg-primary-600 dark:hover:bg-primary-700'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'}`}
                        >
                            Analyze Text
                        </button>
                    </div>
                </div>

                {analysisState && (
                    <div className="xl:col-span-5 space-y-8">
                        <ResultsDisplay
                            key={`results-${analysisState.trigger}`}
                            text={text}
                            keywords={keywords}
                            matchingStrategy={matchingStrategy}
                            windowSize={windowSize}
                            utils={utils}
                        />
                        <HighestDensityClusterDisplay
                            key={`cluster-${analysisState.trigger}`}
                            text={text}
                            keywords={keywords}
                            windowSize={windowSize}
                            matchingStrategy={matchingStrategy}
                            utils={utils}
                        />
                        <TextHighlightDisplay
                            key={`highlight-${analysisState.trigger}`}
                            text={text}
                            keywords={keywords}
                            matchingStrategy={matchingStrategy}
                            utils={utils}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const TextInput = ({ onTextChange, initialText }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="mb-6">
                <h2 className="font-bold text-gray-900 dark:text-white">Input Text</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Enter or upload text to analyze.</p>
            </div>
            <textarea
                value={initialText}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Paste your content here or upload a file..."
                className="text-sm w-full h-48 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-gray-700 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 resize-none"
            />
        </div>
    );
};

const FileUpload = ({ handleFileLoad }) => {
    const fileInputRef = useRef(null);
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => handleFileLoad(ev.target.result);
            reader.readAsText(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    return (
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700/50 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-300 dark:hover:border-primary-500 transition-colors duration-200">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.md"
            />
            <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="px-6 py-3 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
                Choose File
            </button>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Supported formats: TXT, MD</p>
        </div>
    );
};

const KeywordInput = ({ keywords, onKeywordsChange, matchingStrategy, onMatchingStrategyChange, windowSize, onWindowSizeChange, maxWindowSize }) => {
    const [newKeyword, setNewKeyword] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        const trimmedKeyword = newKeyword.trim();
        if (trimmedKeyword && !keywords.some(k => k.toLowerCase() === trimmedKeyword.toLowerCase())) {
            onKeywordsChange([...keywords, trimmedKeyword]);
            setNewKeyword('');
        } else if (trimmedKeyword) {
            console.warn("Keyword already exists (case-insensitive)");
        }
    };

    const handleRemove = (keywordToRemove) => {
        onKeywordsChange(keywords.filter((k) => k !== keywordToRemove));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAdd(e);
        }
    };

    const speakingTimeForWindow = utils.calculateSpeakingTime(windowSize);
    const effectiveMaxWindowSize = Math.max(10, maxWindowSize);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="mb-6">
                <h2 className=" font-bold text-gray-900 dark:text-white">Configuration</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Set keywords, matching, and analysis window.</p>
            </div>
            <div className="space-y-6">
                <form onSubmit={handleAdd} className="relative">
                    <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter a keyword (e.g., 'marketing' or '/\\bregex\\b/i')"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-gray-700 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                    />
                    <button
                        type="submit"
                        disabled={!newKeyword.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm hover:shadow-md disabled:hover:shadow-none dark:bg-primary-600 dark:hover:bg-primary-700"
                    >
                        Add
                    </button>
                </form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm block text-sm font-medium text-gray-700 dark:text-gray-300">Matching Strategy</label>
                        <select
                            value={matchingStrategy}
                            onChange={(e) => onMatchingStrategyChange(e.target.value)}
                            className="text-sm w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-gray-700 transition-all duration-200 text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            <option value="exact">Exact Match</option>
                            <option value="partial">Partial Match (in word)</option>
                            <option value="word">Whole Word Match</option>
                            <option value="regex">Regular Expression</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                            Content Window Size
                            <span className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-700/30 px-2 py-1 rounded-md">
                                🎙️ {speakingTimeForWindow}
                            </span>
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                value={windowSize}
                                onChange={(e) => onWindowSizeChange(parseInt(e.target.value))}
                                min="10"
                                max={effectiveMaxWindowSize}
                                step="1"
                                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500 dark:accent-primary-600"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[4rem] text-right">{windowSize} words</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Adjust window (10-{effectiveMaxWindowSize} words). Applied on analysis.</p>
                    </div>
                </div>
                {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {keywords.map((keyword, index) => (
                            <div
                                key={keyword + index}
                                className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-200
                                            ${utils.getKeywordColor(index)} bg-opacity-20 dark:bg-opacity-30 border-current text-current`}
                            >
                                {keyword}
                                <button
                                    onClick={() => handleRemove(keyword)}
                                    className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                                    aria-label={`Remove keyword ${keyword}`}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const TextHighlightDisplay = ({ text, keywords, matchingStrategy, utils }) => {
    if (!text || keywords.length === 0) return null;

    const cleanTextForDisplay = text.replace(/\s+/g, ' ').trim();
    const wordCountForDisplay = cleanTextForDisplay ? cleanTextForDisplay.split(/\s+/).length : 0;

    const multiKeywordStats = utils.calculateMultiKeywordDensity(text, keywords, matchingStrategy);
    const { totalMatchCount, density: overallDensity, intersectionCount } = multiKeywordStats;

    const highlightedText = utils.highlightText(text, keywords, matchingStrategy, keywords.map((_, idx) => idx));
    const speakingTime = utils.calculateSpeakingTime(wordCountForDisplay);

    return (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl shadow-lg border border-purple-100 dark:border-purple-800 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📝</span>
                    <h2 className=" font-bold text-gray-900 dark:text-white">Full Text Analysis</h2>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <span>Words: <span className="font-medium text-gray-800 dark:text-gray-100">{wordCountForDisplay}</span></span>

                    <span>Overall Density: <span className="font-medium text-gray-800 dark:text-gray-100">{overallDensity.toFixed(2)}%</span></span>
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-800/50 rounded-md">
                        <span className="text-sm text-purple-600 dark:text-purple-300">🎙️ {speakingTime}</span>
                    </div>
                </div>
            </div>
            {keywords.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                        <div
                            key={`${keyword}-${index}-legend`}
                            className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium ${utils.getKeywordColor(index)} bg-opacity-60 dark:bg-opacity-70`}
                        >
                            {keyword}
                        </div>
                    ))}
                </div>
            )}
            {/* MODIFIED: Removed max-h-[400px] and overflow-y-auto */}
            <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-purple-100 dark:border-purple-700">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div
                        className="text-gray-900 dark:text-gray-100 whitespace-pre-line break-words leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: highlightedText }}
                    />
                </div>
            </div>
        </div>
    );
};

const ResultsDisplay = ({ text, keywords, matchingStrategy, windowSize, utils }) => {
    if (!text || keywords.length === 0) return null;

    const uiTotalWords = text.trim() ? text.trim().split(/\s+/).length : 0;
    const speakingTimeForTotal = utils.calculateSpeakingTime(uiTotalWords);

    const overallKeywordStats = utils.analyzeKeywords(text, keywords, matchingStrategy);
    const totalMatchesAcrossAllKeywords = overallKeywordStats.reduce((sum, r) => sum + r.count, 0);

    const cluster = utils.findHighestDensityCluster(text, keywords, windowSize, matchingStrategy);

    const resultsForTable = keywords.map(kw => ({
        keyword: kw,
        countInCluster: cluster ? (cluster.keywordCounts[kw] || 0) : 0,
        overallCount: overallKeywordStats.find(s => s.keyword === kw)?.count || 0,
        overallDensity: overallKeywordStats.find(s => s.keyword === kw)?.density || 0,
    })).sort((a, b) => b.countInCluster - a.countInCluster);

    const matchesInIdentifiedCluster = cluster ? cluster.matchCount : 0;

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl shadow-lg border border-emerald-100 dark:border-emerald-800 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <h2 className=" font-bold text-gray-900 dark:text-white">Keyword Performance</h2>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-800/50 rounded-md">
                    <span className="text-sm text-emerald-600 dark:text-emerald-300">🎙️ {speakingTimeForTotal} (full text)</span>
                </div>
            </div>
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Total Words" value={uiTotalWords} color="emerald" />
                    <StatCard title="Window Size" value={windowSize} unit="words" color="emerald" />
                    <StatCard title="Window matches" value={matchesInIdentifiedCluster} color="emerald" />
                    <StatCard title="Total Matches" value={totalMatchesAcrossAllKeywords} color="emerald" />
                </div>
                {/* MODIFIED: Removed max-h-[300px] and overflow-y-auto from the table's scrollable div if it existed, but it seems it was already fine.
                    This is just to confirm no accidental max-height on the table itself. */}
                <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-emerald-100 dark:border-emerald-700 overflow-hidden">
                    <div className="grid grid-cols-4 gap-4 p-3 sm:p-4 border-b border-emerald-100 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/30 text-sm ">
                        <div className="font-medium text-gray-700 dark:text-gray-300 col-span-2">Keyword</div>
                        <div className="font-medium text-gray-700 dark:text-gray-300 text-right">In Window</div>
                        <div className="font-medium text-gray-700 dark:text-gray-300 text-right">Overall</div>
                    </div>
                    <div className="divide-y divide-emerald-100 dark:divide-emerald-700 text-sm"> {/* Removed max-h and overflow here if it was present */}
                        {resultsForTable.map((result, index) => (
                            <div key={`${result.keyword}-${index}-results`} className="grid grid-cols-4 gap-4 p-3 sm:p-4 hover:bg-emerald-50/30 dark:hover:bg-emerald-800/30 transition-colors">
                                <div className={`font-medium col-span-2 ${utils.getKeywordColor(keywords.indexOf(result.keyword))} bg-opacity-20 dark:bg-opacity-30 px-2 py-1 rounded-md truncate`}>{result.keyword}</div>
                                <div className="text-gray-800 dark:text-gray-100 text-right">{result.countInCluster}</div>
                                <div className="text-gray-800 dark:text-gray-100 text-right">
                                    {result.overallCount} <span className="text-sm text-gray-500 dark:text-gray-400">({result.overallDensity.toFixed(1)}%)</span>
                                </div>
                            </div>
                        ))}
                        {resultsForTable.length === 0 && <p className="p-4 text-center text-gray-500 dark:text-gray-400">No keywords found in the best window.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, unit = '', color = 'gray' }) => (
    <div className={`bg-white/70 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-${color}-100 dark:border-${color}-700`}>
        <p className={`text-sm  font-medium text-${color}-600 dark:text-${color}-400 mb-1 truncate`}>{title}</p>
        <p className=" sm:text-2xl font-bold text-gray-900 dark:text-white">
            {value} <span className="text-sm font-normal">{unit}</span>
        </p>
    </div>
);

const HighestDensityClusterDisplay = ({ text, keywords, windowSize, matchingStrategy, utils }) => {
    if (!text || keywords.length === 0) return null;

    const cluster = utils.findHighestDensityCluster(text, keywords, windowSize, matchingStrategy);

    const renderDistributionChart = (keywordCounts) => {
        if (!keywordCounts || Object.keys(keywordCounts).length === 0) return <p className="text-sm text-gray-500">No keywords in this cluster.</p>;
        const countsArray = Object.values(keywordCounts).filter(c => typeof c === 'number');
        if (countsArray.length === 0) return <p className="text-sm text-gray-500">No keyword counts available.</p>;

        const maxCount = Math.max(1, ...countsArray);

        return (
            <div className="flex items-end gap-1 h-10 sm:h-12">
                {keywords.map((keyword, originalKeywordIndex) => {
                    const count = keywordCounts[keyword] || 0;
                    const heightPercentage = (count / maxCount) * 100;
                    return (
                        <div key={keyword + originalKeywordIndex} className="relative group flex-1 flex flex-col justify-end items-center" title={`${keyword}: ${count}`}>
                            <div
                                className={`w-3/4 ${utils.getKeywordColor(originalKeywordIndex)} bg-opacity-60 dark:bg-opacity-70 rounded-t transition-all duration-300 ease-out group-hover:bg-opacity-100 dark:group-hover:bg-opacity-100`}
                                style={{ height: `${Math.max(2, heightPercentage)}%` }}
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate w-full text-center group-hover:font-semibold">{keyword.length > 7 ? keyword.substring(0, 5) + '..' : keyword}</p>
                            <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-sm rounded px-2 py-1 z-10 whitespace-nowrap">
                                {keyword}: {count}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-800 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🌟</span>
                <h2 className=" font-bold text-gray-900 dark:text-white">Highest Density Cluster</h2>
            </div>
            {cluster ? (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">Top Combined Density Section</h3>
                        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-indigo-100 dark:border-indigo-700">
                            <div className="flex flex-wrap justify-between items-start mb-3 gap-2">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Found {cluster.matchCount} keyword matches in this {cluster.wordCount}-word section.
                                </p>
                                <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-800/50 rounded-md">
                                    <span className="text-sm text-indigo-600 dark:text-indigo-300">🎙️ {utils.calculateSpeakingTime(cluster.wordCount)}</span>
                                </div>
                            </div>
                            {/* MODIFIED: Removed max-h-[200px] and overflow-y-auto */}
                            <div
                                className="text-gray-800 dark:text-gray-100 font-medium p-3 bg-white dark:bg-gray-700/30 rounded-md border border-indigo-100 dark:border-indigo-600 prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: cluster.highlightedText }}
                            />

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-4 text-center sm:text-left">
                                <StatCard title="Matches" value={cluster.matchCount} color="indigo" />
                            </div>

                            {keywords.length > 1 && Object.keys(cluster.keywordCounts).length > 0 && (
                                <div className="mt-4 p-3 bg-white dark:bg-gray-700/30 rounded-md border border-indigo-100 dark:border-indigo-600">
                                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">Keyword Distribution in this Cluster</p>
                                    {renderDistributionChart(cluster.keywordCounts)}
                                </div>
                            )}
                        </div>
                    </div>

                    {cluster.individualClusters && cluster.individualClusters.length > 0 && (
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 mt-6">Best Sections per Individual Keyword</h3>
                            <div className={`grid gap-4 ${cluster.individualClusters.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                                }`}>
                                {cluster.individualClusters.map((individualCluster, index) => (
                                    <div key={`${individualCluster.keyword}-${index}-individual`} className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-indigo-100 dark:border-indigo-700">
                                        <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`${utils.getKeywordColor(keywords.indexOf(individualCluster.keyword))} bg-opacity-60 dark:bg-opacity-70 px-2 py-0.5 rounded text-sm font-medium`}>{individualCluster.keyword}</div>
                                                <span className="text-sm  text-gray-600 dark:text-gray-400">{individualCluster.count} matches</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm ">
                                                <span className="font-medium text-indigo-600 dark:text-indigo-400">Density: {individualCluster.density.toFixed(1)}%</span>
                                                <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-800/50 rounded-md">
                                                    <span className="text-sm text-indigo-600 dark:text-indigo-300">🎙️ {utils.calculateSpeakingTime(individualCluster.wordCount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* MODIFIED: Removed max-h-[150px] and overflow-y-auto */}
                                        <div
                                            className="text-sm text-gray-800 dark:text-gray-100 p-3 bg-white dark:bg-gray-700/30 rounded-md border border-indigo-50 dark:border-indigo-600 prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: individualCluster.highlightedText }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            ) : (
                <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-indigo-100 dark:border-indigo-700">
                    <p className="text-gray-600 dark:text-gray-400 text-center">No significant keyword clusters found with the current settings. Try adjusting window size or keywords.</p>
                </div>
            )}
        </div>
    );
};

export default KeywordAnalyzer;
