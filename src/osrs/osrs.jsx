import React, { useState, useCallback } from 'react';
import {
    Paper, TextField, Typography, FormControl, InputLabel, Select, MenuItem,
    Button, ThemeProvider, Box, Container, CssBaseline, CircularProgress, Divider
} from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';

// Local Imports
import { muiTheme } from './theme/muiTheme';
import { OsrsGlobalStyles } from './styles/globalStyles';
import { useOsrsData } from './hooks/useOsrsData';
import { useFlipCalculation } from './hooks/useFlipCalculation';
import { formatTimeSince, formatGrandExchangePrice } from './utils/formatting';
import { getWikiLink } from './utils/helpers';
import { calculateInstaSellPrice, calculateInstaBuyPrice } from './utils/calculations';

import FlipCard from './components/FlipCard';
import ItemLookupResult from './components/ItemLookupResult'; // New component
import SearchForms from './components/SearchForms'; // Updated component

export default function OSRSFlipper() {
    // === State ===
    // Budget State
    const [budget, setBudget] = useState(10_000_000);
    const [budgetUnit, setBudgetUnit] = useState('M');
    const [budgetValue, setBudgetValue] = useState("10");

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
        <ThemeProvider theme={muiTheme}>
            <StyledEngineProvider injectFirst>
                <CssBaseline />
                <OsrsGlobalStyles />
                <div className="min-h-screen py-8 px-4 lg:px-8 bg-gray-50">
                    <Container maxWidth="xl" disableGutters>
                        {/* Header */}
                        <Box
                            component="header"
                            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <Typography
                                        variant="overline"
                                        sx={{ letterSpacing: 2, color: 'primary.main', fontWeight: 700 }}
                                    >
                                        OSRS Flip Finder
                                    </Typography>
                                    <Typography
                                        variant="h4"
                                        component="h1"
                                        sx={{ mt: 0.5, color: 'text.primary', fontWeight: 800 }}
                                    >
                                        Smart OSRS Flipper tool
                                    </Typography>
                                    <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary', maxWidth: '60ch' }}>
                                        Real-time price feeds, profit scoring, and risk analysis to help you find the best flips.
                                    </Typography>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                        <div className="flex flex-col items-end">
                                            <Typography variant="caption" className="text-gray-500">Last Updated</Typography>
                                            <Typography variant="body2" className="font-medium text-gray-900">
                                                {formatTimeSince(lastUpdate)}
                                            </Typography>
                                        </div>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={refreshData}
                                            disabled={dataLoading}
                                            startIcon={dataLoading ? <CircularProgress size={16} color="inherit" /> : null}
                                            size="small"
                                            sx={{ boxShadow: 'none', borderRadius: '10px' }}
                                        >
                                            {dataLoading ? 'Refreshing...' : 'Refresh'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Box>

                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Left Column: Controls & Search */}
                            <div className="lg:w-1/3 space-y-6 flex flex-col">
                                {/* Budget Control */}
                                <Paper elevation={0} className="p-5 border border-gray-200 rounded-2xl">
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        My Capital
                                    </Typography>
                                    <div className="flex items-center gap-2 mb-2">
                                        <TextField
                                            fullWidth
                                            placeholder="Amount"
                                            variant="outlined"
                                            value={budgetValue}
                                            onChange={(e) => handleBudgetChange(e.target.value, budgetUnit)}
                                            type="number"
                                            InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                                            size="medium"
                                        />
                                        <FormControl size="medium" sx={{ minWidth: '80px' }}>
                                            <Select
                                                value={budgetUnit}
                                                onChange={(e) => handleBudgetChange(budgetValue, e.target.value)}
                                            >
                                                <MenuItem value="K">K</MenuItem>
                                                <MenuItem value="M">M</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </div>
                                    <Typography variant="caption" className="text-gray-500 font-medium block text-right">
                                        Total: {budget.toLocaleString()} gp
                                    </Typography>
                                </Paper>

                                {/* Search Forms (Unified) */}
                                <SearchForms
                                    searchQuery={searchQuery}
                                    onSearchQueryChange={(e) => setSearchQuery(e.target.value)}
                                    onSearchSubmit={handleSearch}
                                    loading={dataLoading || !hasData}
                                />

                                {/* Search Results Area */}
                                <div className="flex-grow space-y-4">
                                    {dataLoading && !searchResults ? (
                                        <Box display="flex" justifyContent="center" py={4}>
                                            <CircularProgress size={24} />
                                        </Box>
                                    ) : (
                                        <>
                                            {searchResults && searchResults.length > 0 && (
                                                <div className="space-y-3 animate-fade-in-up">
                                                    <div className="flex justify-between items-center px-1">
                                                        <Typography variant="subtitle2" className="text-gray-500 font-semibold uppercase tracking-wider text-xs">
                                                            Search Results
                                                        </Typography>
                                                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{searchResults.length}</span>
                                                    </div>
                                                    {searchResults.map((result) => (
                                                        <ItemLookupResult
                                                            key={result.item.id}
                                                            data={result}
                                                            getWikiLink={getWikiLink}
                                                            formatTimeSince={formatTimeSince}
                                                            formatPrice={formatGrandExchangePrice}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {searchResults && searchResults.length === 0 && !dataLoading && (
                                                <div className="text-center py-8 px-4 bg-white rounded-xl border border-gray-200 border-dashed">
                                                    <Typography className="text-gray-400 italic">
                                                        No items found matching "{searchQuery}".
                                                    </Typography>
                                                </div>
                                            )}

                                            {dataError && (
                                                <Typography className="text-center text-red-500 py-4 bg-red-50 rounded-xl border border-red-100">
                                                    Error: {dataError}
                                                </Typography>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Flip Suggestions */}
                            <div className="lg:w-2/3 space-y-6">
                                <section aria-live="polite">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                                Top Opportunities
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                Based on your {budgetUnit === 'M' ? `${budgetValue}M` : `${budgetValue}K`} budget
                                            </Typography>
                                        </div>
                                        {calculatingFlips && (
                                            <Typography variant="caption" className="text-blue-600 animate-pulse font-medium">
                                                Updating recommendations...
                                            </Typography>
                                        )}
                                    </div>

                                    {calculatingFlips && flips.length === 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse"></div>
                                            ))}
                                        </div>
                                    ) : hasData && flips.length === 0 ? (
                                        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                                            <div className="mb-4 text-4xl">🔍</div>
                                            <Typography variant="h6" className="text-gray-900 font-bold">No flips found</Typography>
                                            <Typography className="text-gray-500 mt-1 max-w-md mx-auto">
                                                Try increasing your budget or refreshing the data to see more opportunities.
                                            </Typography>
                                        </div>
                                    ) : !hasData && !dataLoading ? (
                                        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                                            <Typography className="text-red-500 font-medium">
                                                Data unavailable. Please refresh.
                                            </Typography>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {flips.map((flip, index) => (
                                                <div key={flip.id} className="relative animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                                    <div className="absolute -top-2.5 -left-2 z-10">
                                                        <span className="bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg border border-gray-700">
                                                            #{index + 1}
                                                        </span>
                                                    </div>
                                                    <FlipCard flip={{ ...flip, wiki: getWikiLink(flip.name) }} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>
                    </Container>
                </div>
            </StyledEngineProvider>
        </ThemeProvider>
    );
}
