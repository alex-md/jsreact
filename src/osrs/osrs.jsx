import React, { useState, useCallback, useMemo } from 'react';

// Local Imports
import { useOsrsData } from './hooks/useOsrsData';
import { useFlipCalculation } from './hooks/useFlipCalculation';
import { formatTimeSince, formatGrandExchangePrice } from './utils/formatting';
import { getWikiLink } from './utils/helpers';
import { calculateInstaSellPrice, calculateInstaBuyPrice } from './utils/calculations';

import FlipCard from './components/FlipCard';
import ItemLookupResult from './components/ItemLookupResult';
import SearchForms from './components/SearchForms';

const BUDGET_PRESETS = [
    { label: '1M', value: '1', unit: 'M' },
    { label: '5M', value: '5', unit: 'M' },
    { label: '10M', value: '10', unit: 'M' },
    { label: '25M', value: '25', unit: 'M' }
];

export default function OSRSFlipper() {
    // === State ===
    // Budget State
    const [budget, setBudget] = useState(10_000_000);
    const [budgetUnit, setBudgetUnit] = useState('M');
    const [budgetValue, setBudgetValue] = useState('10');
    const [showSidebar, setShowSidebar] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null); // null: not searched, []: no results

    // === Hooks ===
    const {
        mapping,
        fiveMin,
        latestPrices,
        hourlyPrices,
        loading: dataLoading,
        error: dataError,
        lastUpdate,
        refreshData,
    } = useOsrsData();

    const {
        flips,
        calculatingFlips,
        hasData,
    } = useFlipCalculation(mapping, fiveMin, latestPrices, hourlyPrices, budget, dataLoading);

    const statusPill = useMemo(() => {
        if (dataError) {
            return {
                label: 'Data error',
                className: 'bg-red-100 text-red-700 border-red-200',
            };
        }
        if (dataLoading) {
            return {
                label: 'Syncing live prices',
                className: 'bg-amber-100 text-amber-700 border-amber-200',
            };
        }
        if (hasData) {
            return {
                label: 'Live pricing',
                className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            };
        }
        return {
            label: 'Waiting for data',
            className: 'bg-slate-100 text-slate-600 border-slate-200',
        };
    }, [dataError, dataLoading, hasData]);


    // === Event Handlers ===
    const handleBudgetChange = useCallback((value, unit) => {
        const numValue = parseFloat(value);
        setBudgetValue(value);
        setBudgetUnit(unit);

        if (!isNaN(numValue) && numValue >= 0) {
            setBudget(Math.floor(numValue * (unit === 'M' ? 1_000_000 : 1_000)));
        } else if (value === '') {
            setBudget(0);
        }
    }, []);

    const applyBudgetPreset = useCallback((preset) => {
        handleBudgetChange(preset.value, preset.unit);
    }, [handleBudgetChange]);

    const handleSearchQueryChange = useCallback((event) => {
        const value = event.target.value;
        setSearchQuery(value);
        if (!value.trim()) {
            setSearchResults(null);
        }
    }, []);

    const handleSearch = useCallback(() => {
        if (!searchQuery.trim() || !hasData) {
            setSearchResults(searchQuery.trim() ? [] : null);
            return;
        }
        const lowerCaseQuery = searchQuery.toLowerCase();
        // Filter first, then slice, then map to avoid calculating expensive metrics for all items
        const results = mapping
            .filter(item => item && item.name && item.name.toLowerCase().includes(lowerCaseQuery))
            .slice(0, 20) // Limit to top 20 matches
            .map(item => {
                // Calculate both buy (to flip) and sell (to dump) perspectives
                // Note: calculateInstaBuyPrice gives the price you should PAY (entry)
                // Note: calculateInstaSellPrice gives the price you should ASK (exit)
                const buyData = calculateInstaBuyPrice(item.id, latestPrices, fiveMin, hourlyPrices);
                const sellData = calculateInstaSellPrice(item.id, latestPrices, fiveMin, hourlyPrices);

                if (!buyData && !sellData) return null;

                return {
                    item,
                    buyData,
                    sellData,
                    wiki: getWikiLink(item.name)
                };
            })
            .filter(Boolean);
        setSearchResults(results);
    }, [searchQuery, hasData, mapping, latestPrices, fiveMin, hourlyPrices]);

    // === Render ===
    return (
        <div className="page-osrs relative min-h-screen text-slate-900">
            <div className="osrs-grid" aria-hidden="true"></div>
            <div className="osrs-glow" aria-hidden="true"></div>
            <div className="relative mx-auto w-full max-w-7xl px-4 py-10 lg:px-8">
                <header className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-blue-50/60"></div>
                    <div className="relative px-6 py-8 md:px-10">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                    OSRS Flip Finder
                                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusPill.className}`}>
                                        {statusPill.label}
                                    </span>
                                </div>
                                <h1 className="mt-4 text-3xl font-semibold text-slate-950 md:text-4xl lg:text-[2.75rem]">
                                    Start with your budget. We’ll surface the best flips.
                                </h1>
                                <p className="mt-3 text-sm text-slate-600 md:text-base">
                                    Enter your GP, refresh prices, and review the ranked list. Simple, fast, and focused.
                                </p>
                                <div className="mt-6 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400">Step 1</p>
                                        <p className="font-semibold text-slate-800">Set your budget</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400">Step 2</p>
                                        <p className="font-semibold text-slate-800">Refresh live prices</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400">Step 3</p>
                                        <p className="font-semibold text-slate-800">Pick a top flip</p>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full max-w-sm space-y-4">
                                <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
                                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Live Prices
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                                            <span className={`h-2 w-2 rounded-full ${dataLoading ? 'bg-amber-400 animate-pulse' : dataError ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                            {dataLoading ? 'Updating' : dataError ? 'Issues' : 'Stable'}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-end justify-between">
                                        <div>
                                            <p className="text-2xl font-semibold text-slate-900">{formatTimeSince(lastUpdate)}</p>
                                            <p className="text-xs text-slate-500">Last refresh</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={refreshData}
                                            disabled={dataLoading}
                                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {dataLoading ? (
                                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                                            ) : (
                                                <i className="fas fa-sync-alt"></i>
                                            )}
                                            {dataLoading ? 'Refreshing' : 'Refresh'}
                                        </button>
                                    </div>
                                </div>
                                {dataError && (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        <strong className="block text-xs uppercase tracking-wide text-red-500">Data error</strong>
                                        {dataError}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className={`mt-8 grid gap-6 ${showSidebar ? 'lg:grid-cols-[1fr_minmax(280px,360px)]' : 'grid-cols-1'}`}>
                    <main className="space-y-6">
                        <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                                        Capital Settings
                                    </div>
                                    <h2 className="mt-3 text-2xl font-semibold text-slate-900">Set your trading budget</h2>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Enter your GP once. Everything below updates to match your budget.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Total GP</p>
                                    <p className="text-base font-semibold text-slate-900">{budget.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Budget amount</label>
                                <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                                    <div className="relative">
                                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">GP</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={budgetValue}
                                            onChange={(e) => handleBudgetChange(e.target.value, budgetUnit)}
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3 text-lg font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:bg-white"
                                            placeholder="Amount"
                                            aria-label="Budget amount"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleBudgetChange(budgetValue, 'K')}
                                            aria-pressed={budgetUnit === 'K'}
                                            className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-widest transition ${budgetUnit === 'K'
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'
                                                }`}
                                        >
                                            K
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleBudgetChange(budgetValue, 'M')}
                                            aria-pressed={budgetUnit === 'M'}
                                            className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-widest transition ${budgetUnit === 'M'
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'
                                                }`}
                                        >
                                            M
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-2">
                                {BUDGET_PRESETS.map((preset) => {
                                    const isActive = budgetUnit === preset.unit && budgetValue === preset.value;
                                    return (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => applyBudgetPreset(preset)}
                                            aria-pressed={isActive}
                                            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${isActive
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'
                                                }`}
                                        >
                                            {preset.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Auto allocation cap</p>
                                    <p className="mt-1 font-semibold text-slate-700">25% per item</p>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Ideal flip range</p>
                                    <p className="mt-1 font-semibold text-slate-700">
                                        {Math.max(1, Math.round(budget * 0.08)).toLocaleString()} – {Math.max(1, Math.round(budget * 0.25)).toLocaleString()} gp
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Optional Tools</h2>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Need instant price checks? Open the sidebar search when you want it.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowSidebar((prev) => !prev)}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900"
                                >
                                    <i className={`fas ${showSidebar ? 'fa-eye-slash' : 'fa-search'}`}></i>
                                    {showSidebar ? 'Hide Tools' : 'Show Tools'}
                                </button>
                            </div>
                        </section>

                        <section aria-live="polite" className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Top Opportunities</h2>
                                    <p className="text-sm text-slate-500">
                                        Curated for a {budgetUnit === 'M' ? `${budgetValue}M` : `${budgetValue}K`} budget.
                                    </p>
                                </div>
                                {calculatingFlips && (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></span>
                                        Updating recommendations
                                    </div>
                                )}
                            </div>

                            <div className="mt-6">
                                {calculatingFlips && flips.length === 0 ? (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-52 rounded-2xl border border-slate-200 bg-slate-50 animate-pulse"></div>
                                        ))}
                                    </div>
                                ) : hasData && flips.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
                                        <div className="mb-3 text-3xl">🔎</div>
                                        <p className="text-base font-semibold text-slate-900">No flips found</p>
                                        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                                            Increase your budget or refresh the data to surface new opportunities.
                                        </p>
                                    </div>
                                ) : !hasData && !dataLoading ? (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 py-10 text-center text-sm font-semibold text-red-600">
                                        Data unavailable. Please refresh.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {flips.map((flip, index) => (
                                            <div key={flip.id} className="relative animate-fade-in" style={{ animationDelay: `${index * 60}ms` }}>
                                                <div className="absolute -top-3 left-4 z-10">
                                                    <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white shadow">
                                                        #{index + 1}
                                                    </span>
                                                </div>
                                                <FlipCard flip={{ ...flip, wiki: getWikiLink(flip.name) }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </main>

                    {showSidebar && (
                        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                            <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400">Optional Tools</p>
                                        <p className="text-sm font-semibold text-slate-800">Search & price lookup</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowSidebar(false)}
                                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                    >
                                        Hide
                                    </button>
                                </div>
                            </section>

                            <SearchForms
                                searchQuery={searchQuery}
                                onSearchQueryChange={handleSearchQueryChange}
                                onSearchSubmit={handleSearch}
                                loading={dataLoading || !hasData}
                            />

                            <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Instant Price Results</h2>
                                    {searchResults && (
                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                            {searchResults.length}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-4 space-y-4">
                                    {dataLoading && !searchResults ? (
                                        <div className="flex items-center justify-center py-6">
                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
                                        </div>
                                    ) : (
                                        <>
                                            {searchResults && searchResults.length > 0 && (
                                                <div className="space-y-3">
                                                    {searchResults.map((result) => (
                                                        <ItemLookupResult
                                                            key={result.item.id}
                                                            data={result}
                                                            formatPrice={formatGrandExchangePrice}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {searchResults && searchResults.length === 0 && !dataLoading && (
                                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                                                    No items found for "{searchQuery}".
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </section>
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
}
