// KeywordAnalyzer.jsx
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    Search, Settings, Clock, Info, BarChart3, ListRestart,
    Hash, Zap, MousePointer2, ChevronRight, BrainCircuit,
    Activity, BookOpen, Layers, FileText, Upload as UploadIcon
} from 'lucide-react';
import utils from '@utils/textAnalysis';

const KeywordAnalyzer = () => {
    const [text, setText] = useState('');
    const [keywords, setKeywords] = useState([]); // Array of keyword strings
    const [matchingStrategy, setMatchingStrategy] = useState('partial');
    const [displayWindowSize, setDisplayWindowSize] = useState(50);
    const [analysisState, setAnalysisState] = useState(null);
    const [activeWindowIdx, setActiveWindowIdx] = useState(null);

    const handleReset = useCallback(() => {
        setText('');
        setKeywords([]);
        setAnalysisState(null);
        setActiveWindowIdx(null);
    }, []);

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
            setAnalysisState({
                trigger: Date.now(),
                text,
                keywords,
                matchingStrategy,
                windowSize: displayWindowSize
            });
            setActiveWindowIdx(null);
        }
    }, [text, keywords, matchingStrategy, displayWindowSize]);

    const canAnalyze = text.trim().length > 0 && keywords.length > 0;
    const currentTextWordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

    // Advanced Metrics Calculation
    const advancedMetrics = useMemo(() => {
        if (!analysisState) return null;
        const { text, keywords, matchingStrategy, windowSize } = analysisState;

        const lexicalDiversity = utils.calculateLexicalDiversity(text);
        const topPhrases = utils.detectTopPhrases(text, keywords);
        const complexity = utils.calculateComplexity(text);

        // Distribution Data (Heatmap)
        const words = text.trim().split(/\s+/).filter(Boolean);
        const windows = [];
        let maxKeywordCount = 0;
        let maxCountIdx = 0;

        for (let i = 0; i < words.length; i += windowSize) {
            const windowWords = words.slice(i, i + windowSize);
            const windowText = windowWords.join(" ");
            let windowKeywordCount = 0;

            keywords.forEach(keyword => {
                const results = utils.analyzeKeywords(windowText, [keyword], matchingStrategy);
                windowKeywordCount += results[0]?.count || 0;
            });

            if (windowKeywordCount > maxKeywordCount) {
                maxKeywordCount = windowKeywordCount;
                maxCountIdx = windows.length;
            }

            windows.push({
                text: windowText,
                count: windowKeywordCount,
                start: i
            });
        }

        const spreadScore = utils.calculateSpreadScore(windows);

        return {
            lexicalDiversity,
            topPhrases,
            complexity,
            windows,
            maxKeywordCount,
            maxCountIdx,
            spreadScore
        };
    }, [analysisState]);

    useEffect(() => {
        if (advancedMetrics && activeWindowIdx === null) {
            setActiveWindowIdx(advancedMetrics.maxCountIdx);
        }
    }, [advancedMetrics, activeWindowIdx]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-screen-2xl text-slate-900 selection:bg-primary-100 selection:text-primary-900 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        <Activity size={12} />
                        Content Analytics v2.0
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
                        Keyword <span className="text-primary-500">Density</span> Analyzer
                    </h1>
                    <p className="text-lg text-gray-500 leading-relaxed">
                        Precision analytics for modern content strategy. Map distribution, identify patterns, and optimize your writing for maximum impact.
                    </p>
                </div>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-all font-bold text-sm shadow-sm"
                >
                    <ListRestart size={18} />
                    Reset Dashboard
                </button>
            </div>

            {/* Top Grid: Inputs & Global Settings */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-10">
                {/* 1. Content Input (Col 1-8) */}
                <div className="xl:col-span-8 space-y-5">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <FileText size={20} className="text-primary-500" />
                                    Source Content
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">Paste text or upload a document.</p>
                            </div>
                            <FileUpload handleFileLoad={setText} />
                        </div>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste your content here..."
                            className="text-sm w-full h-[280px] px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all duration-200 placeholder-gray-400 text-gray-900 resize-none font-sans leading-relaxed"
                        />
                    </div>
                </div>

                {/* 2. Configuration & Stats (Col 9-12) */}
                <div className="xl:col-span-4 space-y-6">
                    <KeywordInput
                        keywords={keywords}
                        onKeywordsChange={handleKeywordsChange}
                        matchingStrategy={matchingStrategy}
                        onMatchingStrategyChange={handleMatchingStrategyChange}
                        windowSize={displayWindowSize}
                        onWindowSizeChange={handleWindowSizeChange}
                        maxWindowSize={Math.max(10, currentTextWordCount)}
                    />

                    {/* Quick Stats & Analyze Button */}
                    <div className="bg-gray-900 rounded-2xl p-5 text-white shadow-xl">
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Words</div>
                                <div className="text-xl font-black">{currentTextWordCount}</div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Est. Pacing</div>
                                <div className="text-xl font-black text-primary-400">🎙️ {utils.calculateSpeakingTime(currentTextWordCount)}</div>
                            </div>
                        </div>
                        <button
                            onClick={runAnalysis}
                            disabled={!canAnalyze}
                            className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg transition-all duration-200 flex items-center justify-center gap-3
                                ${canAnalyze
                                    ? 'bg-primary-500 text-white hover:bg-primary-400 hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                        >
                            <BrainCircuit size={18} />
                            Launch Analysis
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Section (Always visible if analyzed) */}
            {analysisState ? (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    <div className="border-t border-gray-100 pt-10">
                        <AdvancedInsights dashboardData={advancedMetrics} />
                    </div>

                    <div className="space-y-6">
                        <KeywordPrevalence
                            text={analysisState.text}
                            keywords={analysisState.keywords}
                            matchingStrategy={analysisState.matchingStrategy}
                            utils={utils}
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <DistributionHeatmap
                            windows={advancedMetrics.windows}
                            maxCount={advancedMetrics.maxKeywordCount}
                            activeIdx={activeWindowIdx}
                            onSelectIdx={setActiveWindowIdx}
                            maxCountIdx={advancedMetrics.maxCountIdx}
                        />
                        <WindowSpotlight
                            activeWindow={advancedMetrics.windows[activeWindowIdx]}
                            windowSize={analysisState.windowSize}
                            isMax={activeWindowIdx === advancedMetrics.maxCountIdx}
                        />
                    </div>

                    <div className="pt-10 border-t border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-primary-50 text-primary-500 rounded-xl">
                                <Zap size={20} className="fill-primary-500/20" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Peak Saturation</h3>
                        </div>
                        <PeakSaturationView
                            key={`peak-${analysisState.trigger}`}
                            text={analysisState.text}
                            keywords={analysisState.keywords}
                            matchingStrategy={analysisState.matchingStrategy}
                            windowSize={analysisState.windowSize}
                            utils={utils}
                        />
                    </div>
                </div>
            ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-100 text-slate-300">
                    <Activity size={64} className="mb-6 opacity-10 animate-pulse" />
                    <p className="text-xl font-black uppercase tracking-[0.3em]">Ready for Analysis</p>
                    <p className="text-sm text-center max-w-sm mt-4 font-medium text-slate-400">Add your content and target keywords to generate deep semantic insights and distribution mapping.</p>
                </div>
            )}

            {/* Tool Explanation Section */}
            <div className="mt-16 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <h4 className="flex items-center text-lg font-bold text-gray-900 mb-6">
                    <Info size={20} className="mr-2 text-primary-500" />
                    About this tool
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-600 leading-relaxed">
                    <div>
                        <h5 className="font-bold text-gray-900 mb-2">Identifies Overuse or Underuse</h5>
                        <p className="text-sm">By entering keywords, you can see if you are "keyword stuffing" or if you haven't mentioned your primary topics enough to rank well. Strategic density improves both SEO and readability.</p>
                    </div>
                    <div>
                        <h5 className="font-bold text-gray-900 mb-2">Contextual Analysis</h5>
                        <p className="text-sm">The Window Size allows you to analyze keyword distribution in segments (default 50 words). This ensures naturally spread keywords rather than awkward clumping.</p>
                    </div>
                    <div>
                        <h5 className="font-bold text-gray-900 mb-2">Lexical & complexity Analysis</h5>
                        <p className="text-sm">Advanced metrics track your unique vocabulary count and the overall sophistication of your tone, helping you tailor content to your target audience.</p>
                    </div>
                    <div>
                        <h5 className="font-bold text-gray-900 mb-2">Distribution Heatmap</h5>
                        <p className="text-sm">The interactive heatmap visually maps where keywords are most concentrated, allowing you to quickly jump to high-impact or sparse sections of your content.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* --- Component Parts --- */

// TextInput removed as it's now integrated into the main layout

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
        <div className="relative group">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.md"
            />
            <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Upload Text/Markdown File"
                className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-all duration-200 shadow-sm flex items-center gap-2 group"
            >
                <UploadIcon size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider pr-1">Upload</span>
            </button>
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
        }
    };

    const handleRemove = (keywordToRemove) => {
        onKeywordsChange(keywords.filter((k) => k !== keywordToRemove));
    };

    const speakingTimeForWindow = utils.calculateSpeakingTime(windowSize);
    const effectiveMaxWindowSize = Math.max(10, maxWindowSize);

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-shadow duration-300">
            <div className="mb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <Settings size={18} className="text-primary-500" />
                    Configuration
                </h2>
                <p className="text-xs text-gray-500 mt-1">Set keywords and segment parameters.</p>
            </div>
            <div className="space-y-6">
                <form onSubmit={handleAdd} className="relative">
                    <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="Add a new keyword..."
                        className="w-full pl-4 pr-16 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all duration-200 placeholder-gray-400 text-gray-900 font-medium text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!newKeyword.trim()}
                        className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-all duration-200 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest shadow-sm"
                    >
                        ADD
                    </button>
                </form>

                <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">Strategy</label>
                        <select
                            value={matchingStrategy}
                            onChange={(e) => onMatchingStrategyChange(e.target.value)}
                            className="text-sm w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-primary-500 focus:bg-white transition-all cursor-pointer font-medium text-gray-700"
                        >
                            <option value="exact">Exact Match</option>
                            <option value="partial">Partial Match</option>
                            <option value="word">Whole Word</option>
                            <option value="regex">Regular Expression</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">Window size</label>
                            <span className="text-[10px] font-black text-primary-500 bg-primary-50 px-2 py-0.5 rounded-md">🎙️ {speakingTimeForWindow}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                value={windowSize}
                                onChange={(e) => onWindowSizeChange(parseInt(e.target.value))}
                                min="10"
                                max={effectiveMaxWindowSize}
                                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary-500"
                            />
                            <span className="text-sm font-black text-gray-900 min-w-[3rem] text-right">{windowSize}w</span>
                        </div>
                    </div>
                </div>

                {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-5 border-t border-gray-100">
                        {keywords.map((keyword, index) => (
                            <div
                                key={keyword + index}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${utils.getKeywordColor(index)} bg-opacity-5 border-opacity-20 border-current group/kw`}
                            >
                                <span className="opacity-80">#</span>
                                <span className="text-current">{keyword}</span>
                                <button
                                    onClick={() => handleRemove(keyword)}
                                    className="hover:bg-current hover:text-white rounded-sm w-3.5 h-3.5 flex items-center justify-center transition-all opacity-40 group-hover/kw:opacity-100"
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

const AdvancedInsights = ({ dashboardData }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center space-x-2">
                <BrainCircuit size={20} className="text-primary-500" />
                <h4 className="text-lg font-bold text-gray-900 tracking-tight">Advanced Content Insights</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Metric Cards */}
                <MetricCard
                    icon={<BookOpen size={20} />}
                    label="Reading Tone"
                    value={dashboardData.complexity}
                    subtext="Based on word length"
                    color="emerald"
                />
                <MetricCard
                    icon={<Layers size={20} />}
                    label="Distribution"
                    value={`${dashboardData.spreadScore.toFixed(0)}/100`}
                    subtext="Keyword spread rating"
                    color="amber"
                    progress={dashboardData.spreadScore}
                />
            </div>

            {/* Top Phrases (Bigrams) */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="max-w-md">
                        <h5 className="text-lg font-bold mb-1 flex items-center text-gray-900">
                            <BrainCircuit size={18} className="mr-2 text-primary-500" />
                            Smart Phrase Detection
                        </h5>
                        <p className="text-gray-500 text-xs">
                            AI-detected clusters of 1-3 words for enhanced semantic strategy.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {dashboardData.topPhrases.length > 0 ? (
                            dashboardData.topPhrases.map((tp, idx) => (
                                <div key={idx} className="bg-gray-50 hover:bg-white border border-gray-100 hover:border-primary-200 rounded-xl px-4 py-2 flex items-center space-x-3 transition-all hover:shadow-md hover:-translate-y-0.5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-gray-800 tracking-tight">{tp.phrase}</span>
                                        <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest">{tp.words}-word AI Cluster</span>
                                    </div>
                                    <span className="bg-primary-50 text-primary-700 text-[10px] font-black w-8 h-8 flex items-center justify-center rounded-lg border border-primary-100">{tp.count}x</span>
                                </div>
                            ))
                        ) : (
                            <span className="text-gray-400 text-sm italic">Add more content to see detected phrases.</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ icon, label, value, subtext, color, progress }) => {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        violet: 'bg-violet-50 text-violet-600 border-violet-100',
    };
    const progressColors = {
        indigo: 'bg-indigo-600',
        emerald: 'bg-emerald-600',
        amber: 'bg-amber-600',
        violet: 'bg-violet-600',
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 duration-300 group">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl transition-colors ${colorClasses[color]}`}>
                    {React.cloneElement(icon, { size: 18 })}
                </div>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">
                    {label.split(' ')[0]}
                </span>
            </div>
            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 leading-none">{label}</h5>
            <div className="text-2xl font-black text-gray-900 mb-3 tracking-tight leading-none">{value}</div>
            {progress !== undefined && (
                <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden shadow-inner">
                    <div
                        className={`${progressColors[color]} h-full rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                    />
                </div>
            )}
            <p className="text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {subtext}
            </p>
        </div>
    );
};

const DistributionHeatmap = ({ windows, maxCount, activeIdx, onSelectIdx, maxCountIdx }) => {
    const getHeatmapColor = (count) => {
        if (count === 0) return 'bg-gray-50 border-gray-100 text-gray-300';
        const intensity = Math.min(9, Math.ceil((count / (maxCount || 1)) * 9));
        const colors = [
            'bg-primary-50 border-primary-100 text-primary-300',
            'bg-primary-100 border-primary-200 text-primary-400',
            'bg-primary-200 border-primary-300 text-primary-500',
            'bg-primary-300 border-primary-400 text-primary-600',
            'bg-primary-400 border-primary-500 text-white',
            'bg-primary-500 border-primary-600 text-white',
            'bg-primary-600 border-primary-700 text-white',
            'bg-primary-700 border-primary-800 text-white',
            'bg-primary-800 border-primary-900 text-white',
            'bg-primary-900 border-primary-950 text-white',
        ];
        return colors[intensity];
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-0.5">
                        Heatmap
                    </h4>
                    <h5 className="font-bold text-gray-900 flex items-center gap-2">
                        <Hash size={16} className="text-primary-500" />
                        Usage Distribution
                    </h5>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    <span>Sparse</span>
                    <div className="flex gap-0.5">
                        {[2, 5, 8].map(i => <div key={i} className={`w-2 h-2 rounded-full ${getHeatmapColor(i * (maxCount / 9))}`} />)}
                    </div>
                    <span>Dense</span>
                </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
                {windows.map((win, idx) => {
                    const isActive = activeIdx === idx;
                    const isMax = idx === maxCountIdx;
                    return (
                        <button
                            key={idx}
                            onClick={() => onSelectIdx(idx)}
                            className={`w-11 h-11 rounded-xl border-2 transition-all relative flex items-center justify-center group shadow-sm ${getHeatmapColor(win.count)} ${isActive ? 'ring-[6px] ring-primary-500/10 scale-110 z-10 border-primary-500' : 'hover:scale-110 border-transparent hover:z-10'
                                }`}
                        >
                            {isMax && win.count > 0 && (
                                <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-1 rounded-lg shadow-lg animate-pulse">
                                    <Zap size={10} className="fill-white" />
                                </div>
                            )}
                            <span className={`text-[11px] font-black ${isActive ? 'scale-125' : ''}`}>{win.count}</span>

                            {/* Hover info tooltip-like */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                Segment {idx + 1}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const WindowSpotlight = ({ activeWindow, windowSize, isMax }) => {
    return (
        <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-2xl flex flex-col min-h-[280px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full -mr-24 -mt-24 blur-3xl" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex flex-col">
                    <h4 className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-primary-400 mb-1">
                        {isMax ? <Zap size={12} className="mr-2 text-amber-400 fill-amber-400 animate-pulse" /> : <MousePointer2 size={12} className="mr-2" />}
                        {isMax ? 'Peak Saturation' : 'Segment Focus'}
                    </h4>
                    {activeWindow && (
                        <span className="text-[10px] font-black text-gray-500 tracking-widest">
                            WORDS {activeWindow.start}—{activeWindow.start + windowSize}
                        </span>
                    )}
                </div>
                {activeWindow && (
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                        <span className="text-xs font-black text-primary-400">{activeWindow.count}</span>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Matches</span>
                    </div>
                )}
            </div>

            {activeWindow ? (
                <div className="flex-1 flex flex-col relative z-10">
                    <div className="flex-1 bg-white/[0.03] rounded-xl border border-white/[0.08] p-5 relative overflow-hidden group-hover:bg-white/[0.05] transition-colors duration-500">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary-500/50 rounded-full" />
                        <p className="text-base leading-relaxed text-gray-300 italic font-serif tracking-wide">
                            <span className="text-primary-500/40 font-black text-2xl leading-none font-sans">"</span>
                            {activeWindow.text}
                            <span className="text-primary-500/40 font-black text-2xl leading-none font-sans">"</span>
                        </p>
                        <div className="absolute bottom-4 right-4 text-white/10 group-hover:text-primary-500/30 transition-colors">
                            <ChevronRight size={32} />
                        </div>
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Spotlight View</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500/50 opacity-50 relative z-10">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center mb-4">
                        <Search size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Select heatmap segment</p>
                </div>
            )}
        </div>
    );
};

const PeakSaturationView = ({ text, keywords, matchingStrategy, windowSize, utils }) => {
    if (!text || keywords.length === 0) return null;

    const cluster = utils.findHighestDensityCluster(text, keywords, windowSize, matchingStrategy);
    if (!cluster) return (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center text-gray-400 italic font-medium">
            No significant clusters found in the current text.
        </div>
    );

    const speakingTime = utils.calculateSpeakingTime(cluster.wordCount);

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full -mr-24 -mt-24 transition-transform group-hover:scale-110" />

            <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between mb-6 gap-6 border-b border-gray-50 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl shadow-inner">
                            <Zap size={20} className="fill-primary-500/20" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Focus Peak Detected</h2>
                            <p className="text-[10px] text-gray-500 mt-0.5 font-medium tracking-tight">Highest keyword concentration found.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Density Score</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-gray-900 tracking-tight">{cluster.density.toFixed(1)}%</span>
                                <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-black rounded uppercase">High</span>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-gray-100 hidden sm:block" />
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Segment Duration</span>
                            <span className="text-2xl font-black text-primary-500 tracking-tight">🎙️ {speakingTime}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 relative group/quote">
                    <div className="absolute -top-3 -left-3 w-10 h-10 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center text-primary-200">
                        <FileText size={18} />
                    </div>
                    <div className="relative">
                        <div
                            className="text-gray-800 font-medium leading-[1.8] italic font-serif text-lg selection:bg-primary-100 selection:text-primary-900"
                            dangerouslySetInnerHTML={{ __html: cluster.highlightedText }}
                        />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Total Words</span>
                            <div className="text-lg font-black text-gray-900">{cluster.wordCount}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Matches</span>
                            <div className="text-lg font-black text-gray-900">{cluster.matchCount}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Distribution</span>
                            <div className="text-lg font-black text-gray-900">{cluster.distribution.toFixed(0)}%</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Cohesion</span>
                            <div className="text-lg font-black text-gray-900">{cluster.completeness.toFixed(0)}%</div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-between text-gray-400">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Target Keywords identified in segment</span>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg">
                        Words {cluster.startWordIndex}—{cluster.endWordIndex}
                    </div>
                </div>
            </div>
        </div>
    );
};

const KeywordPrevalence = ({ text, keywords, matchingStrategy, utils }) => {
    if (!text || keywords.length === 0) return null;
    const overallKeywordStats = utils.analyzeKeywords(text, keywords, matchingStrategy);
    const sortedStats = [...overallKeywordStats].sort((a, b) => b.count - a.count);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 text-primary-500 rounded-lg">
                    <BarChart3 size={18} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Keyword Prevalence</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-5">
                {sortedStats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${utils.getKeywordColor(keywords.indexOf(stat.keyword))} bg-opacity-10 px-2 py-0.5 rounded-md mb-1 w-fit`}>
                                    Rank #{idx + 1}
                                </span>
                                <span className="font-black text-gray-900 text-base tracking-tight">{stat.keyword}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-black text-gray-900 leading-none">{stat.count}</div>
                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Found</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className={`h-full ${utils.getKeywordColor(keywords.indexOf(stat.keyword))} transition-all duration-1000 ease-out`}
                                    style={{ width: `${Math.min(100, stat.density * 10)}%` }} // Scaled for better visualization
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">
                                <span>Density</span>
                                <span className="text-gray-900">{stat.density.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatBox = ({ label, value, color, subtext }) => (
    <div className={`bg-${color}-50/50 p-4 rounded-2xl border border-${color}-100 transition-all hover:shadow-md hover:bg-white`}>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">{label}</div>
        <div className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">{value}</div>
        {subtext && <div className={`text-[10px] font-bold text-${color}-600/60 uppercase tracking-widest`}>{subtext}</div>}
    </div>
);

export default KeywordAnalyzer;
