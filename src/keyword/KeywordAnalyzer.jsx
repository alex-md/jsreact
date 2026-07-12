import React, { useMemo, useRef, useState } from 'react';
import {
    AlertCircle, BarChart3, CheckCircle2, ChevronDown, Info, ListRestart,
    Search, Target, Upload, X
} from 'lucide-react';
import utils from '@utils/textAnalysis';

const tone = {
    good: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warn: 'bg-amber-50 text-amber-900 border-amber-200',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200'
};

const KeywordAnalyzer = () => {
    const [text, setText] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [keywordDraft, setKeywordDraft] = useState('');
    const [matchingStrategy, setMatchingStrategy] = useState('exact');
    const [windowSize, setWindowSize] = useState(100);
    const [analysisInput, setAnalysisInput] = useState(null);
    const [sort, setSort] = useState('count');
    const [activeWindow, setActiveWindow] = useState(0);
    const fileRef = useRef(null);

    const wordCount = useMemo(() => (text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || []).length, [text]);
    const analysis = useMemo(() => analysisInput
        ? utils.analyzeDocument(analysisInput.text, analysisInput.keywords, analysisInput.matchingStrategy, analysisInput.windowSize)
        : null, [analysisInput]);

    const addKeywords = (value = keywordDraft) => {
        const additions = value.split(/[,\n]/).map(item => item.trim()).filter(Boolean);
        if (!additions.length) return;
        setKeywords(current => [...current, ...additions.filter(item => !current.some(existing => existing.toLowerCase() === item.toLowerCase()))]);
        setKeywordDraft('');
    };
    const reset = () => {
        setText(''); setKeywords([]); setKeywordDraft(''); setAnalysisInput(null); setActiveWindow(0);
    };
    const runAnalysis = () => {
        if (!text.trim() || !keywords.length) return;
        setAnalysisInput({ text, keywords, matchingStrategy, windowSize });
        setActiveWindow(0);
    };
    const stale = analysisInput && (analysisInput.text !== text || analysisInput.keywords.join('\0') !== keywords.join('\0') || analysisInput.matchingStrategy !== matchingStrategy || analysisInput.windowSize !== windowSize);

    return (
        <main className="container mx-auto max-w-7xl px-4 py-8 text-slate-900 sm:px-6 lg:py-12">
            <header className="mb-8 flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-end">
                <div className="max-w-3xl">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600">SEO content analysis</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">See how your target terms actually work in the copy.</h1>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Check coverage, frequency, and placement without relying on a one-size-fits-all density target. Everything runs in your browser.</p>
                </div>
                <button onClick={reset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                    <ListRestart size={17} /> Start over
                </button>
            </header>

            <section aria-labelledby="content-input" className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,.8fr)]">
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <div><h2 id="content-input" className="font-semibold text-slate-950">Content</h2><p className="mt-0.5 text-sm text-slate-500">Paste plain text, Markdown, or upload a file.</p></div>
                        <input ref={fileRef} type="file" accept=".txt,.md,text/plain,text/markdown" className="sr-only" onChange={event => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2_000_000) { event.target.value = ''; return; }
                            const reader = new FileReader(); reader.onload = result => setText(String(result.target?.result || '')); reader.readAsText(file); event.target.value = '';
                        }} />
                        <button onClick={() => fileRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"><Upload size={16} /> Upload</button>
                    </div>
                    <textarea value={text} onChange={event => setText(event.target.value)} aria-label="Content to analyze" placeholder="Paste the page, article, or draft you want to evaluate…" className="min-h-[330px] w-full resize-y border-0 px-5 py-4 text-[15px] leading-7 text-slate-800 placeholder:text-slate-400 focus:ring-0" />
                    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500"><span>{wordCount.toLocaleString()} words</span><span>{utils.calculateSpeakingTime(wordCount)} read</span></div>
                </div>

                <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-slate-950">Targets</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">Add the terms this page should cover. Separate multiple terms with commas.</p>
                    <form className="mt-4 flex gap-2" onSubmit={event => { event.preventDefault(); addKeywords(); }}>
                        <input value={keywordDraft} onChange={event => setKeywordDraft(event.target.value)} placeholder="e.g. content strategy" className="min-w-0 flex-1 rounded-lg border-slate-300 text-sm focus:border-primary-500 focus:ring-primary-500" />
                        <button disabled={!keywordDraft.trim()} className="rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Add</button>
                    </form>
                    <div className="mt-3 flex min-h-9 flex-wrap gap-2">
                        {keywords.length ? keywords.map(keyword => <span key={keyword} className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-800">{keyword}<button aria-label={`Remove ${keyword}`} onClick={() => setKeywords(items => items.filter(item => item !== keyword))} className="rounded-full p-0.5 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"><X size={13} /></button></span>) : <span className="text-sm text-slate-400">No targets added yet.</span>}
                    </div>
                    <details className="mt-5 border-t border-slate-100 pt-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-700">Analysis settings <ChevronDown size={16} /></summary>
                        <div className="mt-4 space-y-4">
                            <label className="block text-sm font-medium text-slate-700">Matching<select value={matchingStrategy} onChange={event => setMatchingStrategy(event.target.value)} className="mt-1.5 w-full rounded-lg border-slate-300 text-sm focus:border-primary-500 focus:ring-primary-500"><option value="exact">Whole term</option><option value="partial">Include word variations</option></select><span className="mt-1 block text-xs font-normal leading-5 text-slate-500">Whole term avoids matching “art” inside “article.” Variations also count partial word matches.</span></label>
                            <label className="block text-sm font-medium text-slate-700">Section size <span className="float-right font-normal text-slate-500">{windowSize} words</span><input type="range" min="50" max="250" step="25" value={windowSize} onChange={event => setWindowSize(Number(event.target.value))} className="mt-2 w-full accent-primary-600" /></label>
                        </div>
                    </details>
                    <button onClick={runAnalysis} disabled={!text.trim() || !keywords.length} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"><Search size={17} /> Analyze content</button>
                    {!text.trim() || !keywords.length ? <p className="mt-2 text-center text-xs text-slate-500">Add content and at least one target to continue.</p> : null}
                </aside>
            </section>

            {!analysis ? <EmptyState /> : <Results analysis={analysis} activeWindow={activeWindow} setActiveWindow={setActiveWindow} sort={sort} setSort={setSort} stale={stale} rerun={runAnalysis} />}

            <details className="mt-10 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
                <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-slate-800"><Info size={17} className="text-primary-600" /> How to read these results</summary>
                <div className="mt-4 max-w-4xl space-y-2 leading-6"><p>Density is the share of total words occupied by a target term. It is descriptive, not a ranking score; there is no universal ideal percentage.</p><p>Use coverage to catch missing topics, the comparison table to spot imbalance, and the section map to find clumps or long gaps. Then edit for clarity and reader intent rather than chasing a fixed number.</p></div>
            </details>
        </main>
    );
};

const EmptyState = () => <section className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"><Target className="mx-auto text-slate-300" size={34} /><h2 className="mt-3 font-semibold text-slate-800">Your analysis will appear here</h2><p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-slate-500">Start with the page’s primary topic and a few supporting terms. The report will prioritize missing targets and uneven placement.</p></section>;

const Results = ({ analysis, activeWindow, setActiveWindow, sort, setSort, stale, rerun }) => {
    const missing = analysis.stats.filter(item => item.count === 0);
    const found = analysis.stats.filter(item => item.count > 0);
    const highest = [...found].sort((a, b) => b.density - a.density)[0];
    const sorted = [...analysis.stats].sort((a, b) => sort === 'keyword' ? a.keyword.localeCompare(b.keyword) : sort === 'density' ? b.density - a.density : b.count - a.count);
    const selected = analysis.windows[activeWindow] || analysis.windows[0];
    const actions = [];
    if (missing.length) actions.push({ kind: 'warn', title: `${missing.length} target${missing.length > 1 ? 's are' : ' is'} missing`, body: `Review ${missing.slice(0, 3).map(item => `“${item.keyword}”`).join(', ')}. Add only where it helps answer the reader’s question.` });
    if (analysis.totalMatches && analysis.spreadScore < 65) actions.push({ kind: 'warn', title: 'Usage is concentrated in a few sections', body: 'Check the darkest sections below. Move or remove repetitions when nearby mentions do the same job.' });
    if (!missing.length && analysis.spreadScore >= 65) actions.push({ kind: 'good', title: 'Targets are covered and reasonably distributed', body: 'No obvious structural issue stands out. Read for clarity before increasing frequency.' });
    if (!analysis.totalMatches) actions.push({ kind: 'warn', title: 'None of the targets appear', body: 'Check spelling and matching settings, or add the terms naturally where they clarify the page topic.' });

    return <section aria-live="polite" className="mt-8 space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600">Analysis</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">What needs attention</h2></div>{stale && <button onClick={rerun} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-100 px-4 text-sm font-semibold text-amber-900 hover:bg-amber-200">Inputs changed — update results</button>}</div>
        <div className="grid gap-4 sm:grid-cols-3">
            <Summary label="Target coverage" value={`${analysis.coveredKeywords} of ${analysis.stats.length}`} note={missing.length ? `${missing.length} missing` : 'All targets found'} />
            <Summary label="Total mentions" value={analysis.totalMatches.toLocaleString()} note={analysis.wordCount ? `Across ${analysis.wordCount.toLocaleString()} words` : 'No content'} />
            <Summary label="Placement" value={analysis.totalMatches ? `${Math.round(analysis.spreadScore)}/100` : '—'} note={analysis.totalMatches ? (analysis.spreadScore >= 65 ? 'Fairly even' : 'Concentrated') : 'No mentions to compare'} />
        </div>
        <div className="space-y-3">{actions.map((action, index) => <div key={index} className={`flex gap-3 rounded-xl border px-4 py-3 ${tone[action.kind]}`}>{action.kind === 'good' ? <CheckCircle2 className="mt-0.5 shrink-0" size={19} /> : <AlertCircle className="mt-0.5 shrink-0" size={19} />}<div><h3 className="font-semibold">{action.title}</h3><p className="mt-0.5 text-sm leading-6 opacity-90">{action.body}</p></div></div>)}</div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center"><div><h3 className="font-semibold text-slate-950">Target comparison</h3><p className="mt-0.5 text-sm text-slate-500">Compare frequency and content share. Missing terms stay visible.</p></div><label className="text-sm text-slate-600">Sort by <select value={sort} onChange={event => setSort(event.target.value)} className="ml-2 rounded-lg border-slate-300 py-1.5 text-sm focus:border-primary-500 focus:ring-primary-500"><option value="count">Mentions</option><option value="density">Density</option><option value="keyword">Name</option></select></label></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Target</th><th className="px-5 py-3 text-right font-semibold">Mentions</th><th className="px-5 py-3 text-right font-semibold">Density</th><th className="px-5 py-3 font-semibold">Placement</th></tr></thead><tbody className="divide-y divide-slate-100">{sorted.map(item => { const sections = analysis.windows.filter(window => window.counts[analysis.stats.indexOf(item)] > 0).length; return <tr key={item.keyword}><th className="px-5 py-4 font-semibold text-slate-900">{item.keyword}</th><td className="px-5 py-4 text-right tabular-nums">{item.count}</td><td className="px-5 py-4 text-right tabular-nums">{item.density.toFixed(2)}%</td><td className="px-5 py-4 text-slate-600">{item.count ? `${sections} of ${analysis.windows.length} sections` : <span className="font-medium text-amber-700">Not found</span>}</td></tr>; })}</tbody></table></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><h3 className="font-semibold text-slate-950">Section map</h3><p className="mt-1 text-sm leading-6 text-slate-500">Each cell is up to {analysis.windows[0]?.end || 0} words. Select one to inspect it.</p></div><BarChart3 size={19} className="text-primary-600" /></div><div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6">{analysis.windows.map((window, index) => { const intensity = analysis.totalMatches ? Math.min(4, Math.ceil(window.count / Math.max(...analysis.windows.map(item => item.count), 1) * 4)) : 0; const colors = ['bg-slate-100 text-slate-500', 'bg-primary-100 text-primary-800', 'bg-primary-300 text-primary-950', 'bg-primary-500 text-white', 'bg-primary-700 text-white']; return <button key={window.start} onClick={() => setActiveWindow(index)} aria-label={`Section ${index + 1}, ${window.count} mentions`} aria-pressed={activeWindow === index} className={`aspect-square rounded-lg border text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${colors[intensity]} ${activeWindow === index ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-2' : 'border-transparent'}`}><span className="block text-xs font-medium opacity-70">{index + 1}</span>{window.count}</button>; })}</div><div className="mt-4 flex justify-between text-xs text-slate-500"><span>Fewer mentions</span><span>More mentions</span></div></div>
            <div className="rounded-xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-300">Section {activeWindow + 1}</p><h3 className="mt-1 font-semibold">Words {selected?.start + 1}–{selected?.end}</h3></div><span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">{selected?.count || 0} mentions</span></div><p className="mt-5 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-300">{selected?.text || 'No section available.'}</p>{selected && <div className="mt-5 flex flex-wrap gap-2">{analysis.stats.map((item, index) => selected.counts[index] ? <span key={item.keyword} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-200">{item.keyword} · {selected.counts[index]}</span> : null)}</div>}</div>
        </div>
        <details className="rounded-xl border border-slate-200 bg-white px-5 py-4"><summary className="cursor-pointer list-none font-semibold text-slate-800">Additional content signals</summary><div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3"><Summary label="Vocabulary variety" value={`${analysis.lexicalDiversity.toFixed(0)}%`} note="Unique words as a share of all words" compact /><Summary label="Word style" value={analysis.complexity} note="Estimated from average word length" compact /><Summary label="Repeated phrases" value={analysis.topPhrases[0]?.phrase || 'None'} note={analysis.topPhrases[0] ? `${analysis.topPhrases[0].count} occurrences` : 'No repeated non-target phrase'} compact /></div></details>
    </section>;
};

const Summary = ({ label, value, note, compact = false }) => <div className={`${compact ? '' : 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm'}`}><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p><p className={`${compact ? 'text-lg' : 'text-3xl'} mt-2 font-bold tracking-tight text-slate-950`}>{value}</p><p className="mt-1 text-sm text-slate-500">{note}</p></div>;

export default KeywordAnalyzer;
