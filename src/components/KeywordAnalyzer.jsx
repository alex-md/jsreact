import React, { useState, useCallback, useRef, useEffect } from 'react';
import { utils } from '../utils/utils';

const KeywordAnalyzer = () => {
    const [text, setText] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [matchingStrategy, setMatchingStrategy] = useState('partial');
    const [windowSizePercent, setWindowSizePercent] = useState(10);
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
    return React.createElement("div", {
        className: "container mx-auto px-4 py-8 max-w-7xl"
    }, React.createElement("div", {
        className: "mb-12 text-center"
    }, React.createElement("h1", {
        className: "text-4xl font-bold text-gray-900 mb-4"
    }, "Keyword Density Analyzer"), React.createElement("p", {
        className: "text-lg text-gray-600 max-w-2xl mx-auto"
    }, "Analyze the density and distribution of keywords in your text. Upload a file or paste your content to get started.")), React.createElement("div", {
        className: "grid grid-cols-1 xl:grid-cols-2 gap-8"
    }, React.createElement("div", {
        className: "space-y-8"
    }, React.createElement("div", {
        className: "grid grid-cols-1 gap-8"
    }, React.createElement(TextInput, {
        onTextChange: setText
    }), React.createElement(FileUpload, {
        handleFileLoad: setText
    })), React.createElement(KeywordInput, {
        keywords: keywords,
        onKeywordsChange: handleKeywordsChange,
        matchingStrategy: matchingStrategy,
        onMatchingStrategyChange: handleMatchingStrategyChange,
        windowSizePercent: windowSizePercent,
        onWindowSizeChange: handleWindowSizeChange
    })), keywords.length > 0 && text && React.createElement("div", {
        className: "space-y-8"
    }, React.createElement(HighestDensityClusterDisplay, {
        text: text,
        keywords: keywords,
        windowSize: getActualWindowSize(),
        matchingStrategy: matchingStrategy,
        utils: utils
    }), React.createElement(ResultsDisplay, {
        text: text,
        keywords: keywords,
        matchingStrategy: matchingStrategy,
        windowSize: getActualWindowSize(),
        utils: utils
    }), React.createElement(TextHighlightDisplay, {
        text: text,
        keywords: keywords,
        matchingStrategy: matchingStrategy,
        utils: utils
    }))));
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
    return React.createElement("div", {
        className: "bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg border border-purple-100 p-6 hover:shadow-xl transition-all duration-300"
    }, React.createElement("div", {
        className: "flex items-center justify-between mb-6"
    }, React.createElement("div", {
        className: "flex items-center gap-3"
    }, React.createElement("span", {
        className: "text-2xl"
    }, "📝"), React.createElement("h2", {
        className: "text-xl font-bold text-gray-900"
    }, "Full Text Analysis")), React.createElement("div", {
        className: "flex items-center gap-4"
    }, React.createElement("div", {
        className: "text-sm text-gray-600"
    }, "Word Count: ", React.createElement("span", {
        className: "font-medium"
    }, wordCount)), React.createElement("div", {
        className: "flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-md"
    }, React.createElement("span", {
        className: "text-xs text-purple-600"
    }, "🎙️ ", speakingTime)), keywords.length > 1 && React.createElement("div", {
        className: "text-sm text-gray-600"
    }, "Intersections: ", React.createElement("span", {
        className: "font-medium"
    }, intersections)))), keywords.length > 0 && React.createElement("div", {
        className: "mb-4 flex flex-wrap gap-2"
    }, keywords.map((keyword, index) => React.createElement("div", {
        key: index,
        className: `inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${utils.getKeywordColor(index)} bg-opacity-60`
    }, React.createElement("span", {
        className: "mr-1"
    }, "🎯"), keyword))), React.createElement("div", {
        className: "bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-purple-100"
    }, React.createElement("div", {
        className: "prose prose-sm max-w-none"
    }, React.createElement("div", {
        className: "text-gray-900 whitespace-pre-wrap break-words leading-relaxed",
        dangerouslySetInnerHTML: {
            __html: highlightedText
        }
    }))));
};
const ResultsDisplay = ({ text, keywords, matchingStrategy, windowSize, utils }) => {
    const results = utils.analyzeKeywords(text, keywords, matchingStrategy);
    const totalWords = text.trim().split(/\s+/).length;
    const speakingTime = utils.calculateSpeakingTime(totalWords);
    return React.createElement("div", {
        className: "bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-lg border border-emerald-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    }, React.createElement("div", {
        className: "flex items-center justify-between mb-6"
    }, React.createElement("div", {
        className: "flex items-center gap-3"
    }, React.createElement("span", {
        className: "text-2xl"
    }, "📊"), React.createElement("h2", {
        className: "text-xl font-bold text-gray-900"
    }, "Keyword Analysis Overview")), React.createElement("div", {
        className: "flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-md"
    }, React.createElement("span", {
        className: "text-xs text-emerald-600"
    }, "🎙️ ", speakingTime))), React.createElement("div", {
        className: "space-y-6"
    }, React.createElement("div", {
        className: "grid grid-cols-1 md:grid-cols-3 gap-4"
    }, React.createElement("div", {
        className: "bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-emerald-100"
    }, React.createElement("p", {
        className: "text-sm font-medium text-emerald-600 mb-1"
    }, "Total Words"), React.createElement("p", {
        className: "text-2xl font-bold text-gray-900"
    }, totalWords)), React.createElement("div", {
        className: "bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-emerald-100"
    }, React.createElement("p", {
        className: "text-sm font-medium text-emerald-600 mb-1"
    }, "Window Size"), React.createElement("p", {
        className: "text-2xl font-bold text-gray-900"
    }, windowSize, " words")), React.createElement("div", {
        className: "bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-emerald-100"
    }, React.createElement("p", {
        className: "text-sm font-medium text-emerald-600 mb-1"
    }, "Total Matches"), React.createElement("p", {
        className: "text-2xl font-bold text-gray-900"
    }, results.reduce((sum, r) => sum + r.count, 0)))), React.createElement("div", {
        className: "bg-white/80 backdrop-blur-sm rounded-lg border border-emerald-100 overflow-hidden"
    }, React.createElement("div", {
        className: "grid grid-cols-4 gap-4 p-4 border-b border-emerald-100 bg-emerald-50/50"
    }, React.createElement("div", {
        className: "font-medium text-gray-700"
    }, "Keyword"), React.createElement("div", {
        className: "font-medium text-gray-700"
    }, "Occurrences"), React.createElement("div", {
        className: "font-medium text-gray-700"
    }, "Density (%)"), React.createElement("div", {
        className: "font-medium text-gray-700"
    }, "Distribution")), React.createElement("div", {
        className: "divide-y divide-emerald-100"
    }, results.map((result, index) => React.createElement("div", {
        key: index,
        className: "grid grid-cols-4 gap-4 p-4 hover:bg-emerald-50/50 transition-colors"
    }, React.createElement("div", {
        className: "font-medium text-emerald-700"
    }, result.keyword), React.createElement("div", null, result.count), React.createElement("div", null, (result.density * 100).toFixed(2), "%"), React.createElement("div", {
        className: "flex items-center"
    }, React.createElement("div", {
        className: "w-full bg-gray-200 rounded-full h-2"
    }, React.createElement("div", {
        className: "bg-emerald-500 h-2 rounded-full",
        style: {
            width: `${Math.min(100, result.distribution * 100)}%`
        }
    })))))))));
};
const HighestDensityClusterDisplay = ({ text, keywords, windowSize, matchingStrategy, utils }) => {
    useEffect(() => {
        console.log('HighestDensityCluster Props:', {
            textLength: text === null || text === void 0 ? void 0 : text.length,
            keywords,
            windowSize,
            matchingStrategy
        });
    }, [
        text,
        keywords,
        windowSize,
        matchingStrategy
    ]);
    const cluster = utils.findHighestDensityCluster(text, keywords, windowSize, matchingStrategy);
    useEffect(() => {
        console.log('Cluster Result:', cluster);
    }, [
        cluster
    ]);
    const renderDistributionChart = (keywordCounts) => {
        const maxCount = Math.max(...Object.values(keywordCounts));
        return React.createElement("div", {
            className: "flex items-end gap-1 h-8"
        }, Object.entries(keywordCounts).map(([keyword, count], index) => React.createElement("div", {
            key: keyword,
            className: "relative group"
        }, React.createElement("div", {
            className: `w-4 ${utils.getKeywordColor(index)} bg-opacity-60 rounded-t`,
            style: {
                height: `${count / maxCount * 100}%`
            }
        }), React.createElement("div", {
            className: "absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1"
        }, keyword, ": ", count))));
    };
    return React.createElement("div", {
        className: "bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-indigo-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    }, React.createElement("div", {
        className: "flex items-center gap-3 mb-6"
    }, React.createElement("span", {
        className: "text-2xl"
    }, "🌟"), React.createElement("h2", {
        className: "text-xl font-bold text-gray-900"
    }, "Highest Density Analysis")), cluster ? React.createElement("div", {
        className: "space-y-6"
    }, React.createElement("div", null, React.createElement("h3", {
        className: "text-lg font-semibold text-gray-900 mb-3"
    }, "Combined Density Cluster"), React.createElement("div", {
        className: "bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-100"
    }, React.createElement("div", {
        className: "flex justify-between items-start mb-2"
    }, React.createElement("p", {
        className: "text-sm font-medium text-gray-700"
    }, "Found ", cluster.matchCount, " keyword matches and ", cluster.intersections, " intersections in this section:"), React.createElement("div", {
        className: "flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded-md"
    }, React.createElement("span", {
        className: "text-xs text-indigo-600"
    }, "🎙️ ", utils.calculateSpeakingTime(cluster.wordCount)))), React.createElement("p", {
        className: "text-gray-900 font-medium p-3 bg-white rounded-md border border-indigo-50",
        dangerouslySetInnerHTML: {
            __html: cluster.highlightedText
        }
    }), React.createElement("div", {
        className: "grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4"
    }, React.createElement("div", null, React.createElement("p", {
        className: "text-xs font-medium text-indigo-600"
    }, "Density"), React.createElement("p", {
        className: "text-sm font-semibold"
    }, cluster.density.toFixed(2), "%")), React.createElement("div", null, React.createElement("p", {
        className: "text-xs font-medium text-indigo-600"
    }, "Distribution"), React.createElement("p", {
        className: "text-sm font-semibold"
    }, cluster.distribution.toFixed(1), "%")), React.createElement("div", null, React.createElement("p", {
        className: "text-xs font-medium text-indigo-600"
    }, "Matches"), React.createElement("p", {
        className: "text-sm font-semibold"
    }, cluster.matchCount)), React.createElement("div", null, React.createElement("p", {
        className: "text-xs font-medium text-indigo-600"
    }, "Intersections"), React.createElement("p", {
        className: "text-sm font-semibold"
    }, cluster.intersections))), keywords.length > 1 && React.createElement("div", {
        className: "mt-4 p-3 bg-white rounded-md border border-indigo-50"
    }, React.createElement("p", {
        className: "text-xs font-medium text-indigo-600 mb-2"
    }, "Keyword Distribution"), renderDistributionChart(cluster.keywordCounts)))), cluster.individualClusters && cluster.individualClusters.length > 0 && React.createElement("div", null, React.createElement("h3", {
        className: "text-lg font-semibold text-gray-900 mb-3"
    }, "Best Clusters per Keyword"), React.createElement("div", {
        className: "grid grid-cols-1 gap-4"
    }, cluster.individualClusters.map((individualCluster, index) => React.createElement("div", {
        key: index,
        className: "bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-100"
    }, React.createElement("div", {
        className: "flex items-center justify-between mb-2"
    }, React.createElement("div", {
        className: "flex items-center gap-2"
    }, React.createElement("div", {
        className: `${utils.getKeywordColor(index)} bg-opacity-60 px-2 py-0.5 rounded text-sm font-medium`
    }, individualCluster.keyword), React.createElement("span", {
        className: "text-sm text-gray-600"
    }, individualCluster.count, " matches")), React.createElement("div", {
        className: "flex items-center gap-2"
    }, React.createElement("span", {
        className: "text-sm font-medium text-indigo-600"
    }, "Density: ", individualCluster.density.toFixed(2), "%"), React.createElement("div", {
        className: "flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded-md"
    }, React.createElement("span", {
        className: "text-xs text-indigo-600"
    }, "🎙️ ", utils.calculateSpeakingTime(windowSize))))), React.createElement("div", {
        className: "text-sm text-gray-900 p-3 bg-white rounded-md border border-indigo-50",
        dangerouslySetInnerHTML: {
            __html: individualCluster.highlightedText
        }
    }))))), keywords.length > 1 && React.createElement("div", {
        className: "bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-100"
    }, React.createElement("p", {
        className: "text-sm font-medium text-indigo-600 mb-2"
    }, "Keyword Legend"), React.createElement("div", {
        className: "flex flex-wrap gap-2"
    }, keywords.map((keyword, index) => React.createElement("div", {
        key: index,
        className: `inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${utils.getKeywordColor(index)} bg-opacity-60`
    }, keyword))))) : React.createElement("div", {
        className: "bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-100"
    }, React.createElement("p", {
        className: "text-gray-600 text-center"
    }, "No keyword clusters found in the text.")));
};
export default KeywordAnalyzer;
