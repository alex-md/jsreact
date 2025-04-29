import React, { useEffect, useState } from 'react';
import {
    Paper,
    Grid,
    TextField,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    createTheme,
    ThemeProvider
} from '@mui/material';

const API_BASE = 'https://prices.runescape.wiki/api/v1/osrs';
const MAPPING_URL = `${API_BASE}/mapping`;
const LATEST_PRICES_URL = `${API_BASE}/latest`;
const HOURLY_AVG_URL = `${API_BASE}/1h`;
const FIVE_MINUTE_URL = `${API_BASE}/5m`;

const TAX_RATE = 0.01; // 1% GE tax
const DEFAULT_BUDGET = 1000000; // 1M gp
const DEFAULT_RISK = 0.2; // 20% risk tolerance

function getWikiLink(name) {
    return `https://oldschool.runescape.wiki/w/Exchange:${encodeURIComponent(name.replace(/ /g, '_'))}`;
}

function calculateProfit(item, fiveMinData, budget, risk) {
    if (!fiveMinData) return null;
    const { avgHighPrice, avgLowPrice, highPriceVolume, lowPriceVolume } = fiveMinData;
    if (!avgHighPrice || !avgLowPrice || highPriceVolume < 5 || lowPriceVolume < 5) return null;
    const buyPrice = avgLowPrice;
    const sellPrice = avgHighPrice;
    const taxedSell = Math.floor(sellPrice * (1 - TAX_RATE));
    const profitPer = taxedSell - buyPrice;
    if (profitPer <= 0) return null;
    const maxQty = Math.min(item.limit, Math.floor(budget / buyPrice));
    const totalProfit = profitPer * maxQty;
    // Risk filter: only show if profit margin is above risk threshold
    const margin = profitPer / buyPrice;
    if (margin < risk) return null;
    return {
        ...item,
        buyPrice,
        sellPrice,
        taxedSell,
        profitPer,
        maxQty,
        totalProfit,
        margin,
        wiki: getWikiLink(item.name),
        highPriceVolume,
        lowPriceVolume
    };
}

// Utility: auto-optimize risk tolerance for best flips
function getOptimalRisk(mapping, fiveMin, budget) {
    // Try a range of risk values, pick the one that yields the highest total profit in top 10 flips
    let bestRisk = 0.1;
    let bestProfit = 0;
    for (let r = 0.05; r <= 0.5; r += 0.01) {
        let suggestions = mapping
            .map(item => calculateProfit(item, fiveMin[item.id], budget, r))
            .filter(Boolean)
            .sort((a, b) => b.totalProfit - a.totalProfit)
            .slice(0, 10);
        let total = suggestions.reduce((sum, f) => sum + f.totalProfit, 0);
        if (total > bestProfit) {
            bestProfit = total;
            bestRisk = r;
        }
    }
    return bestRisk;
}

export default function OSRSFlipper() {
    const [mapping, setMapping] = useState([]);
    const [fiveMin, setFiveMin] = useState({});
    const [flips, setFlips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [budget, setBudget] = useState(DEFAULT_BUDGET);
    const [refreshKey, setRefreshKey] = useState(0);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('totalProfit');
    const [autoRisk, setAutoRisk] = useState(DEFAULT_RISK);

    // Create a custom theme that matches your green color scheme
    const theme = createTheme({
        palette: {
            primary: {
                main: '#15803d', // green-700
                dark: '#166534', // green-800
                contrastText: '#fff'
            },
            background: {
                paper: '#ffffff'
            },
            flexCenter: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        borderRadius: 0,
                    }
                }
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 0,
                        }
                    }
                }
            },
            MuiSelect: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderRadius: 0,
                        }
                    }
                }
            }
        },
    });

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch(MAPPING_URL).then(r => r.json()),
            fetch(FIVE_MINUTE_URL).then(r => r.json())
        ]).then(([mappingData, fiveMinData]) => {
            setMapping(mappingData);
            setFiveMin(fiveMinData.data);
            setLoading(false);
        });
    }, [refreshKey]);

    useEffect(() => {
        if (!mapping.length || !Object.keys(fiveMin).length) return;
        // Auto-optimize risk
        const risk = getOptimalRisk(mapping, fiveMin, budget);
        setAutoRisk(risk);
        let suggestions = mapping
            .map(item => calculateProfit(item, fiveMin[item.id], budget, risk))
            .filter(Boolean);
        if (search.trim()) {
            suggestions = suggestions.filter(flip => flip.name.toLowerCase().includes(search.toLowerCase()));
        }
        suggestions = suggestions.sort((a, b) => b[sortBy] - a[sortBy]).slice(0, 15); // Top 15 flips
        setFlips(suggestions);
    }, [mapping, fiveMin, budget, search, sortBy]);

    return (
        <ThemeProvider theme={theme}>
            <main className="bg-white max-w-6xl mx-auto osrs-flipper p-6 shadow-lg font-inter">
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'); body, .font-inter { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }`}</style>

                <div className="bg-white flex flex-center max-w-full mb-4 mx-auto p-4 rounded-none shadow-md">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 items-center">

                        {/* Budget */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Budget (gp)</label>
                            <input
                                type="number"
                                value={budget}
                                onChange={e => setBudget(+e.target.value)}
                                min="10000"
                                step="10000"
                                className="w-full p-2 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-green-200 focus:border-green-400"
                            />
                        </div>

                        {/* Risk Tolerance */}
                        <div className="col-span-1">
                            <p className="text-sm flex items-center gap-1">
                                Risk tolerance:{' '}
                                <span className="font-semibold text-primary-600" title="Auto-optimized for best flips">
                                    {(autoRisk * 100).toFixed(1)}%
                                </span>
                            </p>
                        </div>

                        {/* Search */}
                        <div className="col-span-1 sm:col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Search</label>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Item name..."
                                className="w-full p-2 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-green-200 focus:border-green-400"
                            />
                        </div>

                        {/* Sort */}
                        <div className="col-span-1 sm:col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700" id="sort-label">Sort by</label>
                            <select
                                id="sort-label"
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-green-200 focus:border-green-400"
                            >
                                <option value="totalProfit">Total Profit</option>
                                <option value="profitPer">Profit/Item</option>
                                <option value="margin">Margin %</option>
                                <option value="highPriceVolume">Sell Volume</option>
                                <option value="lowPriceVolume">Buy Volume</option>
                            </select>
                        </div>

                        {/* Refresh */}
                        <div className="col-span-1 sm:col-span-2 md:col-span-1">
                            <button
                                onClick={() => setRefreshKey(k => k + 1)}
                                disabled={loading}
                                className="w-full py-2 px-4 bg-blue-500 text-white rounded-md text-sm font-medium disabled:opacity-50"
                            >
                                {loading ? 'Loading...' : 'Refresh'}
                            </button>
                        </div>

                    </div>
                </div>


                <section className="osrs-results" aria-live="polite">
                    {flips.length === 0 && !loading && <p className="text-center text-gray-500 py-8">No profitable flips found. Try adjusting your settings or search.</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {flips.map(flip => (
                            <article key={flip.id} className="osrs-flip-card bg-white rounded-lg shadow-md p-5 flex gap-4 items-center min-h-[120px] border border-gray-100 hover:shadow-lg transition group">
                                <img src={`https://oldschool.runescape.wiki/images/${encodeURIComponent(flip.icon.replace(/ /g, '_'))}`} alt={flip.name} width={48} height={48} className="rounded-md bg-gray-100 border border-gray-200" loading="lazy" />
                                <div className="flex-1">
                                    <a href={flip.wiki} target="_blank" rel="noopener noreferrer" className="font-bold text-lg text-green-700 hover:underline" title="View {flip.name} on OSRS Wiki">{flip.name}</a>
                                    <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-700">
                                        <span className="flex items-center gap-1" title="The price you buy this item for on the GE (average of last 5 minutes)">
                                            <span className="flex items-center gap-1" title="The price you buy this item for on the GE (average of last 5 minutes)">
                                                <span className="font-medium">Buy:</span> <b>{flip.buyPrice.toLocaleString()}</b> gp
                                            </span>
                                            <span className="flex items-center gap-1" title="The price you can sell this item for on the GE (average of last 5 minutes)">
                                                <span className="font-medium">Sell:</span> <b>{flip.sellPrice.toLocaleString()}</b> gp
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-1" title="The maximum number of this item you can flip with your budget and GE limits">
                                            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">Qty</text></svg>
                                            <span className="font-medium">Qty:</span> {flip.maxQty}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-700">
                                        <span className="flex items-center gap-1" title="Your profit per item after GE tax">
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19V5m0 0l-7 7m7-7l7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            <span className="font-medium">Profit/item:</span> {flip.profitPer.toLocaleString()} gp
                                        </span>
                                        <span className="flex items-center gap-1" title="Total profit if you flip the max quantity">
                                            <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M8 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            <span className="font-medium">Total Profit:</span> <b className="text-green-700">{flip.totalProfit.toLocaleString()} gp</b>
                                        </span>
                                        <span className="flex items-center gap-1" title="Profit margin as a percent of buy price">
                                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 9V7a5 5 0 00-10 0v2" /><rect x="5" y="9" width="14" height="10" rx="2" /><path d="M8 13h8v4H8z" /></svg>
                                            <span className="font-medium">Margin:</span> {(flip.margin * 100).toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                        <span className="flex items-center gap-1" title="Buy volume (last 5 min)">
                                            <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg>
                                            Buy Vol: <span className="text-green-700">{flip.lowPriceVolume}</span>
                                        </span>
                                        <span className="flex items-center gap-1" title="Sell volume (last 5 min)">
                                            <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg>
                                            Sell Vol: <span className="text-green-700">{flip.highPriceVolume}</span>
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
                <Paper
                    component="footer"
                    elevation={0}
                    sx={{
                        mt: 6,
                        py: 3,
                        px: 2,
                        bgcolor: 'background.paper',
                        borderTop: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            flexWrap: 'wrap'
                        }}
                    >
                        Data from{' '}
                        <Typography
                            component="a"
                            href="https://prices.runescape.wiki/"
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="body2"
                            sx={{
                                color: 'primary.main',
                                textDecoration: 'none',
                                '&:hover': {
                                    textDecoration: 'underline',
                                }
                            }}
                        >
                            RuneScape Prices API
                        </Typography>
                        {' and '}
                        <Typography
                            component="a"
                            href="https://oldschool.runescape.wiki/"
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="body2"
                            sx={{
                                color: 'primary.main',
                                textDecoration: 'none',
                                '&:hover': {
                                    textDecoration: 'underline',
                                }
                            }}
                        >
                            OSRS Wiki
                        </Typography>
                    </Typography>
                </Paper>
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'WebPage',
                        'name': 'OSRS Flipping Suggestions',
                        'description': 'Find profitable Old School RuneScape Grand Exchange flips with real-time data and customizable risk controls.',
                        'url': 'https://jsreact.com/osrs',
                    })}
                </script>
            </main>
        </ThemeProvider >
    );
}
