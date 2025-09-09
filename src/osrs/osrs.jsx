import React, { useState, useCallback, useEffect } from 'react';
import {
    Paper, TextField, Typography, FormControl, InputLabel, Select, MenuItem,
    Button, ThemeProvider, Box, Container, CssBaseline, CircularProgress, Divider
} from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';

// Local Imports
import { muiTheme } from './theme/muiTheme';
import { OsrsGlobalStyles } from './styles/globalStyles'; // Use MUI GlobalStyles
import { useOsrsData } from './hooks/useOsrsData';
import { useFlipCalculation } from './hooks/useFlipCalculation';
import { formatTimeSince, formatGrandExchangePrice } from './utils/formatting';
import { getWikiLink } from './utils/helpers';
import { calculateInstaSellPrice, calculateInstaBuyPrice } from './utils/calculations'; // Import search calc functions

import FlipCard from './components/FlipCard';
import SellSearchResults from './components/SellSearchResults';
import BuySearchResults from './components/BuySearchResults';
import SearchForms from './components/SearchForms';

export default function OSRSFlipper() {
    // === State ===
    // Budget State
    const [budget, setBudget] = useState(10_000_000); // Default 10M
    const [budgetUnit, setBudgetUnit] = useState('M');
    const [budgetValue, setBudgetValue] = useState("10");

    // Search State
    const [sellSearchQuery, setSellSearchQuery] = useState('');
    const [sellSearchResults, setSellSearchResults] = useState(null); // null: not searched, []: no results
    const [buySearchQuery, setBuySearchQuery] = useState('');
    const [buySearchResults, setBuySearchResults] = useState(null);

    // === Hooks ===
    // Data Fetching Hook
    const {
        mapping,
        fiveMin,
        latestPrices,
        hourlyPrices,
        loading: dataLoading, // Rename to avoid conflict
        error: dataError,
        lastUpdate,
        refreshData,
    } = useOsrsData();

    // Flip Calculation Hook
    const {
        flips,
        calculatingFlips,
        hasData, // Flag indicating if data is ready for calculation
    } = useFlipCalculation(mapping, fiveMin, latestPrices, hourlyPrices, budget, dataLoading);

    // === Event Handlers ===
    const handleBudgetChange = useCallback((value, unit) => {
        const numValue = parseFloat(value);
        // Allow empty input or partial numbers without immediate calculation
        setBudgetValue(value);
        setBudgetUnit(unit);

        if (!isNaN(numValue) && numValue >= 0) {
            setBudget(Math.floor(numValue * (unit === 'M' ? 1_000_000 : 1_000)));
        } else if (value === '') {
            setBudget(0); // Treat empty as 0 budget
        }
        // If value is invalid (e.g., "abc"), budget doesn't update, but input shows "abc"
    }, []);

    const handleSellSearch = useCallback(() => {
        if (!sellSearchQuery.trim() || !hasData) {
            setSellSearchResults(sellSearchQuery.trim() ? [] : null); // Show empty if searched, null if empty query
            return;
        }
        const lowerCaseQuery = sellSearchQuery.toLowerCase();
        const results = mapping
            .filter(item => item && item.name && item.name.toLowerCase().includes(lowerCaseQuery))
            .map(item => {
                const priceData = calculateInstaSellPrice(item.id, latestPrices, fiveMin, hourlyPrices);
                return priceData ? { ...item, ...priceData, wiki: getWikiLink(item.name) } : null;
            })
            .filter(Boolean); // Remove nulls
        setSellSearchResults(results);
    }, [sellSearchQuery, hasData, mapping, latestPrices, fiveMin, hourlyPrices]);

    const handleBuySearch = useCallback(() => {
        if (!buySearchQuery.trim() || !hasData) {
            setBuySearchResults(buySearchQuery.trim() ? [] : null);
            return;
        }
        const lowerCaseQuery = buySearchQuery.toLowerCase();
        const results = mapping
            .filter(item => item && item.name && item.name.toLowerCase().includes(lowerCaseQuery))
            .map(item => {
                const priceData = calculateInstaBuyPrice(item.id, latestPrices, fiveMin, hourlyPrices);
                return priceData ? { ...item, ...priceData, wiki: getWikiLink(item.name) } : null;
            })
            .filter(Boolean);
        setBuySearchResults(results);
    }, [buySearchQuery, hasData, mapping, latestPrices, fiveMin, hourlyPrices]);


    // === Derived State / Flags ===
    const isLoading = dataLoading || calculatingFlips;


    // === Render ===
    return (
        <ThemeProvider theme={muiTheme}>
            <StyledEngineProvider injectFirst> {/* Ensure Tailwind overrides MUI where needed */}
                <CssBaseline />
                <OsrsGlobalStyles /> {/* Add global styles */}
                <div className="min-h-screen py-8 px-4 lg:px-8"> {/* Background handled by theme/global styles */}
                    <Container maxWidth="xl" disableGutters>
                        <div className="flex flex-col lg:flex-row gap-6">

                            {/* Left Column: Controls & Search */}
                            <div className="lg:w-1/3 space-y-6 flex flex-col">
                                {/* Budget Control */}
                                <Paper elevation={0} className="p-5">
                                    <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                                        Flipping Budget
                                    </Typography>
                                    <div className="flex items-end gap-2">
                                        <TextField
                                            fullWidth
                                            id="budget-input"
                                            label={`Enter budget (${budgetUnit})`}
                                            variant="outlined"
                                            value={budgetValue}
                                            onChange={(e) => handleBudgetChange(e.target.value, budgetUnit)}
                                            type="number"
                                            InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                                            size="small"
                                        />
                                        <FormControl size="small" sx={{ width: '80px', flexShrink: 0 }}>
                                            <InputLabel id="budget-unit-label">Unit</InputLabel>
                                            <Select
                                                labelId="budget-unit-label"
                                                id="budget-unit-select"
                                                value={budgetUnit}
                                                label="Unit"
                                                onChange={(e) => handleBudgetChange(budgetValue, e.target.value)}
                                            >
                                                <MenuItem value="K">K</MenuItem>
                                                <MenuItem value="M">M</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </div>
                                    <Typography variant="body2" sx={{ color: 'primary.dark', fontWeight: 500, mt: 2 }}>
                                        Current Budget: {budget.toLocaleString()} gp
                                    </Typography>
                                </Paper>

                                {/* Search Forms */}
                                <SearchForms
                                    sellSearchQuery={sellSearchQuery}
                                    onSellSearchQueryChange={(e) => setSellSearchQuery(e.target.value)}
                                    onSellSearchSubmit={handleSellSearch}
                                    buySearchQuery={buySearchQuery}
                                    onBuySearchQueryChange={(e) => setBuySearchQuery(e.target.value)}
                                    onBuySearchSubmit={handleBuySearch}
                                    loading={dataLoading || !hasData} // Disable search if loading or no data
                                    sellResults={sellSearchResults}
                                    buyResults={buySearchResults}
                                />


                                {/* Search Results Area (Scrollable) */}
                                <div className="flex-grow overflow-y-auto space-y-6 pr-2 -mr-2 custom-scrollbar">
                                    {dataLoading && sellSearchResults === null && buySearchResults === null ? (
                                        // Initial Loading State for Search Area
                                        <Box display="flex" justifyContent="center" py={4}>
                                            <CircularProgress size={24} />
                                            <Typography sx={{ ml: 2, color: 'text.secondary' }}>Loading item data...</Typography>
                                        </Box>
                                    ) : (
                                        // Search Results or Placeholder
                                        <>
                                            {sellSearchResults !== null && (
                                                <div>
                                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', px: 1 }}>
                                                        Sell Search Results {sellSearchResults ? `(${sellSearchResults.length})` : ''}
                                                    </Typography>
                                                    <SellSearchResults
                                                        results={sellSearchResults}
                                                        getWikiLink={getWikiLink}
                                                        formatTimeSince={formatTimeSince}
                                                        formatPrice={formatGrandExchangePrice}
                                                    />
                                                </div>
                                            )}
                                            {buySearchResults !== null && (
                                                <div className={sellSearchResults !== null ? 'mt-6' : ''}> {/* Add margin top if sell results exist */}
                                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', px: 1 }}>
                                                        Buy Search Results {buySearchResults ? `(${buySearchResults.length})` : ''}
                                                    </Typography>
                                                    <BuySearchResults
                                                        results={buySearchResults}
                                                        getWikiLink={getWikiLink}
                                                        formatTimeSince={formatTimeSince}
                                                        formatPrice={formatGrandExchangePrice}
                                                    />
                                                </div>
                                            )}
                                            {/* Placeholder if nothing searched and not loading */}
                                            {sellSearchResults === null && buySearchResults === null && !dataLoading && (
                                                <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontStyle: 'italic', py: 4 }}>
                                                    Search for an item's recommended buy or sell price.
                                                </Typography>
                                            )}
                                            {/* Display Data Loading Error in Search Area */}
                                            {dataError && (
                                                <Typography sx={{ textAlign: 'center', color: 'error.main', py: 4 }}>
                                                    Error loading data: {dataError}. Please try refreshing.
                                                </Typography>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div> {/* End Left Column */}


                            {/* Right Column: Flip Suggestions */}
                            <div className="lg:w-2/3 space-y-6">
                                {/* Refresh Info */}
                                <Paper elevation={0} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <Typography variant="h6" sx={{ color: 'text.primary' }}>
                                            Flip Suggestions
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                            Ranked by profit velocity.
                                        </Typography>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0 mt-2 sm:mt-0">
                                        <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                            Data updated: {formatTimeSince(lastUpdate)}
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={refreshData}
                                            disabled={dataLoading}
                                            startIcon={dataLoading ? <CircularProgress size={16} color="inherit" /> : null}
                                            size="small"
                                        >
                                            {dataLoading ? 'Refreshing...' : 'Refresh Data'}
                                        </Button>
                                    </div>
                                </Paper>

                                {/* Flip List Section */}
                                <section className="osrs-flips-list space-y-4" aria-live="polite">
                                    <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                                        Recommended Flips ({calculatingFlips ? '...' : flips.length})
                                    </Typography>

                                    {calculatingFlips && ( // Show spinner only when calculating flips
                                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                                            <CircularProgress size={30} />
                                            <Typography variant="body1" sx={{ ml: 2, color: 'text.secondary' }}>
                                                Calculating flips...
                                            </Typography>
                                        </Box>
                                    )}

                                    {!calculatingFlips && hasData && flips.length === 0 && ( // No flips found state
                                        <Paper elevation={0} sx={{ textAlign: 'center', py: 8, backgroundColor: 'transparent', border: 'none' }}>
                                            <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                No profitable flips found matching criteria. Try adjusting your budget or refreshing data.
                                            </Typography>
                                        </Paper>
                                    )}

                                    {!calculatingFlips && !hasData && !dataLoading && ( // Data failed to load state
                                        <Paper elevation={0} sx={{ textAlign: 'center', py: 8, backgroundColor: 'transparent', border: 'none' }}>
                                            <Typography sx={{ color: 'error.main', fontStyle: 'italic' }}>
                                                Could not load necessary data to calculate flips. Please try refreshing. {dataError ? `(${dataError})` : ''}
                                            </Typography>
                                        </Paper>
                                    )}


                                    {!calculatingFlips && flips.length > 0 && ( // Display flips
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {flips.map((flip, index) => (
                                                <div key={flip.id} className="relative">
                                                    {/* Rank Badge */}
                                                    <div className="absolute -top-2.5 left-4 bg-primary-dark text-white px-2.5 py-0.5 rounded-full text-xs font-semibold z-10 shadow-sm">
                                                        #{index + 1}
                                                    </div>
                                                    <FlipCard flip={{ ...flip, wiki: getWikiLink(flip.name) }} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </div> {/* End Right Column */}

                        </div> {/* End Main Flex Container */}
                    </Container>
                </div>
            </StyledEngineProvider>
        </ThemeProvider>
    );
}
