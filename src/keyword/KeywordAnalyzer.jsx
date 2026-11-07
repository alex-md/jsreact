// KeywordAnalyzer.jsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Settings,
  Info,
  ListRestart,
  BrainCircuit,
  Activity,
  FileText,
  Upload as UploadIcon,
} from "lucide-react";
import CorpusResults from "./CorpusResults.jsx";
import utils from "@utils/textAnalysis";

const KeywordAnalyzer = () => {
  const [text, setText] = useState("");
  const [keywords, setKeywords] = useState([]); // Array of keyword strings
  const [matchingStrategy, setMatchingStrategy] = useState("partial");
  const [displayWindowSize, setDisplayWindowSize] = useState(50);
  const [analysisState, setAnalysisState] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const task = useRef(null);
  const cancelAnalysis = useCallback(() => {
    task.current?.worker.terminate();
    clearTimeout(task.current?.timer);
    task.current = null;
    setIsAnalyzing(false);
  }, []);
  useEffect(
    () => () => {
      task.current?.worker.terminate();
      clearTimeout(task.current?.timer);
    },
    [],
  );

  const handleReset = useCallback(() => {
    setText("");
    setKeywords([]);
    setAnalysisState(null);
    cancelAnalysis();
    setError("");
  }, [cancelAnalysis]);

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
    if (!text.trim() || !keywords.length) return;
    cancelAnalysis();
    setError("");
    setIsAnalyzing(true);
    const snapshot = {
      text,
      keywords: [...keywords],
      matchingStrategy,
      windowSize: displayWindowSize,
    };
    try {
      const worker = new Worker(
        new URL("./analysis.worker.js", import.meta.url),
        { type: "module" },
      );
      const timer = setTimeout(() => {
        cancelAnalysis();
        setError(
          "Analysis exceeded 15 seconds. Simplify regular expressions or analyze a smaller corpus.",
        );
      }, 15000);
      task.current = { worker, timer };
      worker.onmessage = ({ data }) => {
        if (task.current?.worker !== worker) return;
        cancelAnalysis();
        if (data.error) setError(data.error);
        else
          setAnalysisState({
            ...snapshot,
            result: data.result,
            id: Date.now(),
          });
      };
      worker.onerror = () => {
        if (task.current?.worker !== worker) return;
        cancelAnalysis();
        setError(
          "Analysis could not finish. Try a smaller corpus or simpler targets.",
        );
      };
      worker.postMessage(snapshot);
    } catch {
      cancelAnalysis();
      setError(
        "The analysis worker could not start. Reload the page and try again.",
      );
    }
  }, [text, keywords, matchingStrategy, displayWindowSize, cancelAnalysis]);

  const canAnalyze = text.trim().length > 0 && keywords.length > 0;
  const currentTextWordCount = (
    text.match(/[\p{L}\p{N}\p{M}]+(?:['’\-][\p{L}\p{N}\p{M}]+)*/gu) || []
  ).length;
  const isStale =
    analysisState &&
    (analysisState.text !== text ||
      analysisState.matchingStrategy !== matchingStrategy ||
      analysisState.windowSize !== displayWindowSize ||
      JSON.stringify(analysisState.keywords) !== JSON.stringify(keywords));

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-2xl text-foreground selection:bg-primary/10 selection:text-primary animate-in fade-in duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <Activity size={12} />
            Corpus analytics
          </div>
          <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight">
            Keyword <span className="text-primary">Density</span> Analyzer
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Explore how words, phrases, and partial-word matches recur across
            long texts. Trace patterns back to their original context.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/10 transition-all font-bold text-sm shadow-sm"
        >
          <ListRestart size={18} />
          Reset Dashboard
        </button>
      </div>

      {/* Top Grid: Inputs & Global Settings */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-10">
        {/* 1. Content Input (Col 1-8) */}
        <div className="xl:col-span-8 space-y-5">
          <div className="bg-card rounded-2xl shadow-lg border border-border p-6 hover:shadow-xl transition-all duration-300">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FileText size={20} className="text-primary" />
                  Source Content
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Paste text or upload a document.
                </p>
              </div>
              <FileUpload handleFileLoad={setText} />
            </div>
            <textarea
              aria-label="Source content"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your content here..."
              className="text-sm w-full h-[280px] px-6 py-4 bg-background border border-border rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-card transition-all duration-200 placeholder-gray-400 text-foreground resize-none font-sans leading-relaxed"
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
          <div className="bg-background rounded-2xl p-5 text-foreground shadow-xl">
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 bg-card/5 rounded-xl border border-border/10">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  Total Words
                </div>
                <div className="text-xl font-black">{currentTextWordCount}</div>
              </div>
              <div className="p-4 bg-card/5 rounded-xl border border-border/10">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  Est. Pacing
                </div>
                <div className="text-xl font-black text-primary">
                  🎙️ {utils.calculateSpeakingTime(currentTextWordCount)}
                </div>
              </div>
            </div>
            <button
              onClick={runAnalysis}
              disabled={!canAnalyze || isAnalyzing}
              className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg transition-all duration-200 flex items-center justify-center gap-3
                                ${
                                  canAnalyze && !isAnalyzing
                                    ? "bg-primary text-primary-foreground hover:bg-primary hover:scale-[1.02] active:scale-[0.98]"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                                }`}
            >
              <BrainCircuit size={18} />
              {isAnalyzing ? "Analyzing…" : "Launch Analysis"}
            </button>
          </div>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="mb-4 text-sm text-muted-foreground"
      >
        {isAnalyzing && "Analyzing corpus in the background…"}
      </div>
      {isAnalyzing && (
        <button
          className="mb-5 px-4 py-2 rounded-lg border border-border"
          onClick={cancelAnalysis}
        >
          Cancel analysis
        </button>
      )}
      {error && (
        <p
          role="alert"
          className="mb-5 p-4 rounded-xl border border-destructive text-destructive break-words"
        >
          {error}
        </p>
      )}
      {isStale && (
        <p className="mb-5 p-4 bg-muted rounded-xl text-sm">
          Inputs changed. Results below describe the last completed analysis.
          Run analysis to update them.
        </p>
      )}
      {analysisState ? (
        <CorpusResults
          key={analysisState.id}
          data={analysisState.result}
          source={analysisState.text}
        />
      ) : (
        <div className="min-h-[240px] flex flex-col items-center justify-center p-8 bg-card rounded-2xl border border-dashed border-border text-muted-foreground">
          <Activity size={40} className="mb-4 opacity-40" />
          <h2 className="text-lg font-bold">Ready for analysis</h2>
          <p className="text-sm text-center max-w-md mt-3">
            Add a corpus and at least one word, phrase, or partial-word target.
            Analysis runs locally in your browser.
          </p>
        </div>
      )}

      <div className="mt-12 bg-card rounded-2xl p-6 border border-border space-y-3">
        <h3 className="flex items-center gap-2 font-bold">
          <Info size={18} /> About this tool
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Upload a text or Markdown file, or paste text directly. Add targets
          individually, choose a matching mode, and set a segment size. Explore
          individual targets, inspect highlighted passages, and export the
          measurements. Your corpus stays in this browser; analysis requires no
          external service.
        </p>
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
        className="p-2.5 bg-background border border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/10 transition-all duration-200 shadow-sm flex items-center gap-2 group"
      >
        <UploadIcon size={16} />
        <span className="text-[10px] font-bold uppercase tracking-wider pr-1">
          Upload
        </span>
      </button>
    </div>
  );
};

const KeywordInput = ({
  keywords,
  onKeywordsChange,
  matchingStrategy,
  onMatchingStrategyChange,
  windowSize,
  onWindowSizeChange,
  maxWindowSize,
}) => {
  const [newKeyword, setNewKeyword] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmedKeyword = newKeyword.trim();
    if (
      trimmedKeyword &&
      !keywords.some((k) => k.toLowerCase() === trimmedKeyword.toLowerCase())
    ) {
      onKeywordsChange([...keywords, trimmedKeyword]);
      setNewKeyword("");
    }
  };

  const handleRemove = (keywordToRemove) => {
    onKeywordsChange(keywords.filter((k) => k !== keywordToRemove));
  };

  const speakingTimeForWindow = utils.calculateSpeakingTime(windowSize);
  const effectiveMaxWindowSize = Math.max(10, maxWindowSize);

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border p-5 hover:shadow-xl transition-shadow duration-300">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Settings size={18} className="text-primary" />
          Configuration
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Set keywords and segment parameters.
        </p>
      </div>
      <div className="space-y-6">
        <form onSubmit={handleAdd} className="relative">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            aria-label="Add keyword or phrase"
            placeholder="Add a word, phrase, or partial word…"
            className="w-full pl-4 pr-16 py-3 bg-background border border-border rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-card transition-all duration-200 placeholder-gray-400 text-foreground font-medium text-sm"
          />
          <button
            type="submit"
            disabled={!newKeyword.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary transition-all duration-200 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest shadow-sm"
          >
            ADD
          </button>
        </form>

        <p className="text-xs text-muted-foreground leading-relaxed">
          All modes ignore case. Partial finds substrings; Exact and Whole Word
          require complete words or phrases. Regex accepts a JavaScript pattern
          without / delimiters.
        </p>
        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">
              Strategy
            </label>
            <select
              aria-label="Matching strategy"
              value={matchingStrategy}
              onChange={(e) => onMatchingStrategyChange(e.target.value)}
              className="text-sm w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary-500 focus:bg-card transition-all cursor-pointer font-medium text-foreground"
            >
              <option value="exact">Exact Match</option>
              <option value="partial">Partial Match</option>
              <option value="word">Whole Word</option>
              <option value="regex">Regular Expression</option>
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">
                Window size
              </label>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                🎙️ {speakingTimeForWindow}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                aria-label="Segment size in words"
                value={windowSize}
                onChange={(e) => onWindowSizeChange(parseInt(e.target.value))}
                min="10"
                max={Math.max(effectiveMaxWindowSize, windowSize)}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <span className="text-sm font-black text-foreground min-w-[3rem] text-right">
                {windowSize}w
              </span>
            </div>
          </div>
        </div>

        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-5 border-t border-border">
            {keywords.map((keyword, index) => (
              <div
                key={keyword + index}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${utils.getKeywordColor(index)} bg-opacity-5 border-opacity-20 border-current group/kw`}
              >
                <span className="opacity-80">#</span>
                <span className="text-current">{keyword}</span>
                <button
                  aria-label={`Remove ${keyword}`}
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

export default KeywordAnalyzer;
