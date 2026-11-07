import { useState, useCallback, useMemo } from 'react';
import { RefreshCw, Search, TrendingUp, Coins, ArrowUpRight } from 'lucide-react';
import './styles.css';

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
    const [activeTab, setActiveTab] = useState('flips');
    const [submittedQuery, setSubmittedQuery] = useState('');

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

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

    const budgetNumber = Number(budgetValue);
    const budgetError = budgetValue !== '' && (!Number.isFinite(budgetNumber) || budgetNumber < 0 || budgetNumber * (budgetUnit === 'M' ? 1_000_000 : 1_000) > Number.MAX_SAFE_INTEGER)
        ? 'Enter a positive amount within the supported GP range.' : '';
    const statusLabel = dataError ? 'Price update failed' : dataLoading ? 'Updating prices…' : hasData ? 'Prices loaded' : 'Waiting for prices';

    // === Event Handlers ===
    const handleBudgetChange = useCallback((value, unit) => {
        const numValue = Number(value);
        setBudgetValue(value);
        setBudgetUnit(unit);

        if (Number.isFinite(numValue) && numValue >= 0 && numValue * (unit === 'M' ? 1_000_000 : 1_000) <= Number.MAX_SAFE_INTEGER) {
            setBudget(Math.floor(numValue * (unit === 'M' ? 1_000_000 : 1_000)));
        } else {
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
            setSubmittedQuery('');
        }
    }, []);

    const handleSearch = useCallback(() => {
        setSubmittedQuery(searchQuery.trim());
    }, [searchQuery]);

    // Derive results from the current price snapshot, including after a refresh.
    const searchResults = useMemo(() => {
        if (!submittedQuery || !hasData) return null;
        const lowerCaseQuery = submittedQuery.toLowerCase();
        // Filter first, then slice, then map to avoid calculating expensive metrics for all items
        return mapping
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
    }, [submittedQuery, hasData, mapping, latestPrices, fiveMin, hourlyPrices]);

    const busy = dataLoading || calculatingFlips;
    return (
        <main className="osrs-app" id="osrs-main" tabIndex={-1}>
            <header className="osrs-intro">
                <div>
                    <p className="osrs-kicker">The Grand Exchange workbench</p>
                    <h1>OSRS <em>flip finder.</em></h1>
                    <p className="osrs-intro-copy">Find a flip that fits your cash stack. Compare prices, margins, and recent trade volume.</p>
                </div>
                <div className="osrs-data-status">
                    <span className={`osrs-status ${dataError ? 'is-error' : dataLoading ? 'is-loading' : ''}`} role="status">{statusLabel}</span>
                    <span className="osrs-update-time">{lastUpdate ? `Fetched ${formatTimeSince(lastUpdate)}` : 'RuneScape Wiki price data'}</span>
                    <button type="button" onClick={refreshData} disabled={dataLoading} className="osrs-button osrs-refresh">
                        <RefreshCw aria-hidden="true" size={15} className={dataLoading ? 'osrs-spin' : ''} />
                        {dataLoading ? 'Refreshing…' : 'Refresh prices'}
                    </button>
                </div>
            </header>

            {dataError && <div className="osrs-error" role="alert"><strong>Prices could not be refreshed.</strong> Check your connection and try Refresh prices again.</div>}

            <div className="osrs-workspace">
                <aside className="osrs-setup" aria-labelledby="osrs-budget-heading">
                    <section className="osrs-budget-panel">
                        <div className="osrs-panel-heading"><Coins aria-hidden="true" size={18} /><h2 id="osrs-budget-heading">Your cash stack</h2></div>
                        <p className="osrs-help">Set your budget to size each flip.</p>
                        <label htmlFor="osrs-budget">Budget amount</label>
                        <div className="osrs-budget-inputs">
                            <input id="osrs-budget" name="budget" type="number" inputMode="decimal" min="0" step="any" autoComplete="off" value={budgetValue}
                                onChange={(event) => handleBudgetChange(event.target.value, budgetUnit)} aria-invalid={!!budgetError} aria-describedby={budgetError ? 'osrs-budget-error' : 'osrs-budget-total'} />
                            <select name="budget-unit" aria-label="Budget unit" value={budgetUnit} onChange={(event) => handleBudgetChange(budgetValue, event.target.value)}>
                                <option value="K">K · thousand</option><option value="M">M · million</option>
                            </select>
                        </div>
                        {budgetError && <p id="osrs-budget-error" className="osrs-field-error" role="alert">{budgetError}</p>}
                        <div className="osrs-presets" role="group" aria-label="Budget presets">
                            {BUDGET_PRESETS.map((preset) => <button key={preset.label} type="button" aria-pressed={budgetUnit === preset.unit && budgetValue === preset.value} onClick={() => applyBudgetPreset(preset)}>{preset.label}</button>)}
                        </div>
                        <p className="osrs-budget-total" id="osrs-budget-total"><span>Total budget</span><strong>{budget.toLocaleString()} <small>GP</small></strong></p>
                        <div className="osrs-allocation"><span>Maximum per item</span><strong>{Math.floor(budget * 0.25).toLocaleString()} GP</strong><small>Up to 25% of your budget, capped by the buy limit and estimated liquidity.</small></div>
                    </section>
                    <details className="osrs-method">
                        <summary>How to read your results</summary>
                        <p>Suggestions are ranked by a score combining liquidity, turnover, margin, and price stability.</p>
                        <p><strong>Buy / sell</strong> are suggested prices per item. <strong>Estimated profit</strong> uses the suggested quantity after the tool’s 2% tax calculation.</p>
                        <p>Prices and volumes come from recent trades. They do not guarantee that an offer will fill.</p>
                        <a href="https://prices.runescape.wiki/osrs" target="_blank" rel="noopener noreferrer">Price data on RuneScape Wiki <ArrowUpRight aria-hidden="true" size={13} /></a>
                    </details>
                </aside>

                <div className="osrs-results-area">
                    <div className="osrs-view-tabs" role="group" aria-label="Choose a tool">
                        <button type="button" aria-pressed={activeTab === 'flips'} aria-controls={activeTab === 'flips' ? 'osrs-flips' : undefined} onClick={() => setActiveTab('flips')}><TrendingUp aria-hidden="true" size={16} />Flip opportunities</button>
                        <button type="button" aria-pressed={activeTab === 'lookup'} aria-controls={activeTab === 'lookup' ? 'osrs-lookup' : undefined} onClick={() => setActiveTab('lookup')}><Search aria-hidden="true" size={16} />Item lookup</button>
                    </div>

                    {activeTab === 'flips' ? <section id="osrs-flips" aria-labelledby="osrs-results-heading" aria-busy={busy}>
                        <div className="osrs-results-heading"><div><h2 id="osrs-results-heading">Top opportunities</h2><p>{budgetError ? 'Check your budget to see matching flips.' : `For your ${budget.toLocaleString()} GP budget`}</p></div><span className="osrs-result-count" role="status">{busy ? 'Finding flips…' : `${flips.length} suggestions`}</span></div>
                        {budgetError ? <div className="osrs-empty"><Coins aria-hidden="true" size={24} /><h3>Check your cash stack</h3><p>Enter a valid budget to calculate opportunities.</p></div>
                        : busy ? <div className="osrs-flip-grid osrs-skeletons" aria-hidden="true">{[1, 2, 3, 4].map(i => <div key={i} className="osrs-skeleton" />)}</div>
                        : !hasData ? <div className="osrs-empty"><RefreshCw aria-hidden="true" size={24} /><h3>Price data unavailable</h3><p>Refresh prices to load the latest market data.</p><button className="osrs-button" onClick={refreshData} type="button">Try again</button></div>
                        : flips.length === 0 ? <div className="osrs-empty"><Search aria-hidden="true" size={24} /><h3>{budget === 0 ? 'Set a budget to get started' : 'No matching flips right now'}</h3><p>{budget === 0 ? 'Enter your cash stack or choose a budget preset.' : 'Try a larger budget or refresh prices for a new set of trades.'}</p></div>
                        : <div className="osrs-flip-grid">{flips.map((flip, index) => <FlipCard key={flip.id} rank={index + 1} flip={{ ...flip, wiki: getWikiLink(flip.name) }} />)}</div>}
                    </section> : <section id="osrs-lookup" aria-labelledby="osrs-lookup-heading">
                        <SearchForms searchQuery={searchQuery} onSearchQueryChange={handleSearchQueryChange} onSearchSubmit={handleSearch} loading={dataLoading || !hasData} />
                        <div className="osrs-results-heading"><h2 id="osrs-lookup-heading">Price lookup results</h2><span role="status" className="osrs-result-count">{searchResults ? `${searchResults.length} matches` : 'Search by item name'}</span></div>
                        {searchResults?.length ? <div className="osrs-flip-grid">{searchResults.map(result => <ItemLookupResult key={result.item.id} data={result} formatPrice={formatGrandExchangePrice} />)}</div>
                        : <div className="osrs-empty"><Search aria-hidden="true" size={24} /><h3>{dataLoading ? 'Updating item prices…' : !hasData ? 'Price data unavailable' : searchResults ? 'No matching items' : 'Check an item’s prices'}</h3><p>{dataLoading ? 'The latest prices will appear here when loading finishes.' : !hasData ? 'Refresh prices to load the data for item lookup.' : searchResults ? `No priced items found for “${submittedQuery}”. Try a shorter name or a different spelling.` : 'Search for an item such as Blood rune or Abyssal whip to compare its buy and sell estimates.'}</p></div>}
                    </section>}
                </div>
            </div>
        </main>
    );
}
