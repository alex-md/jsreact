import React, { useState, useCallback } from 'react';
import {
    Paper, TextField, Typography, FormControl, InputLabel, Select, MenuItem,
    Button, ThemeProvider, Box, Container, CssBaseline, CircularProgress, Divider,
    Accordion, AccordionSummary, AccordionDetails
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
    const accordionClassName = 'rounded-xl border border-slate-200/80 bg-slate-50/80 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/40';
    const accordionSummarySx = {
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        '& .MuiAccordionSummary-content': { margin: 0 },
        '& .MuiAccordionSummary-expandIconWrapper': { transition: 'transform 0.2s ease' },
        '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': { transform: 'rotate(90deg)' },
    };
    const accordionDetailsSx = { px: { xs: 1.5, sm: 2 }, pt: 0, pb: 2 };
    const renderAccordionExpandIcon = () => (
        <Box
            component="span"
            sx={{
                width: 28,
                height: 28,
                borderRadius: '9999px',
                border: '1px solid',
                borderColor: 'divider',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: 'text.secondary',
            }}
        >
            ›
        </Box>
    );


    // === Render ===
    return (
        <ThemeProvider theme={muiTheme}>
            <StyledEngineProvider injectFirst> {/* Ensure Tailwind overrides MUI where needed */}
                <CssBaseline />
                <OsrsGlobalStyles /> {/* Add global styles */}
                <div className="min-h-screen py-8 px-4 lg:px-8"> {/* Background handled by theme/global styles */}
                    <Container maxWidth="xl" disableGutters>
                        <Box
                            component="header"
                            className="bg-white/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700 rounded-2xl p-6 shadow-sm mb-10"
                        >
                            <Typography
                                variant="overline"
                                sx={{ letterSpacing: 2, color: 'primary.main', fontWeight: 600 }}
                            >
                                OSRS Flip Finder
                            </Typography>
                            <Typography
                                variant="h3"
                                component="h1"
                                sx={{ mt: 1, color: 'text.primary', fontWeight: 700, fontSize: { xs: '2rem', md: '2.75rem' } }}
                            >
                                Real-time Grand Exchange profits tailored to your risk profile
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary', maxWidth: '65ch' }}>
                                Use live GE price feeds, volatility checks, and confidence scoring to spot consistent flips before the market
                                moves. This OSRS flipping tool surfaces deals that align with your budget and trading style so you can scale
                                profits with fewer risky bets.
                            </Typography>
                            <Box className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Box className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-50 px-4 py-2 text-emerald-700 shadow-sm dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                                    <span className="text-xs font-semibold uppercase tracking-widest">100% free</span>
                                    <span className="text-sm font-medium">Hobby-built for the flipping community</span>
                                </Box>
                                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: '60ch' }}>
                                    Everything here is supported by open data and weekend tinkering—no paywalls, logins, or add-on upsells.
                                </Typography>
                            </Box>
                            <Box className="mt-5 grid gap-3 md:grid-cols-3">
                                <Box className="rounded-xl border border-primary/20 bg-primary/5 p-4 dark:border-primary/30 dark:bg-primary/10">
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                        Profit velocity &amp; stability scoring
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                                        Each flip receives a score that blends total profit, execution speed, and risk so you can prioritise the
                                        most reliable margins first.
                                    </Typography>
                                </Box>
                                <Box className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                        Searchable buy &amp; sell price intelligence
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                                        Look up instant buy or sell suggestions for any item and track recent updates to stay ahead of sudden GE
                                        swings.
                                    </Typography>
                                </Box>
                                <Box className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10">
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                                        Instant buy &amp; sell explained
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                                        The Insta Buy check surfaces a safe entry offer based on recent fills, while Insta Sell shows the price most
                                        likely to clear immediately—perfect for validating spreads before you commit your stack.
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
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

                                <Paper elevation={0} className="p-5 border-l-4 border-primary/50 bg-primary/5 dark:border-primary/60 dark:bg-primary/10">
                                    <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                        Instant price scout
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                                        <Box component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>Insta Buy</Box> highlights the offer that is clearing immediately so you can place competitive bids without overpaying.
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                                        <Box component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>Insta Sell</Box> reveals where impatient merchants are exiting right now, helping you lock profits without chasing the market down.
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1.5 }}>
                                        Pair the two searches to confirm a safe spread before locking in your quantity.
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
                        <Box component="section" className="mt-12 space-y-8">
                            <Paper
                                elevation={0}
                                className="p-6 rounded-2xl border border-slate-200/70 bg-white/90 dark:border-slate-700 dark:bg-slate-900/60 space-y-3"
                            >
                                <Typography variant="h5" component="h2" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                    What makes this OSRS flip finder different?
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '72ch' }}>
                                    Instead of static price tables, this OSRS flipping tool analyses buy limits, trade volumes, volatility, and
                                    recent GE shifts to rank items by profit velocity. That means you focus on reliable spreads instead of chasing
                                    outdated margins.
                                </Typography>
                                <Box component="ul" className="grid gap-2 sm:grid-cols-2 list-disc list-inside">
                                    <Typography component="li" variant="body2" sx={{ color: 'text.secondary' }}>
                                        Dynamic scoring rewards consistent spreads and penalises unstable items
                                    </Typography>
                                    <Typography component="li" variant="body2" sx={{ color: 'text.secondary' }}>
                                        Risk tiers help new merchants avoid tying up gold in thin markets
                                    </Typography>
                                    <Typography component="li" variant="body2" sx={{ color: 'text.secondary' }}>
                                        Confidence percentages blend momentum, margin health, and liquidity signals
                                    </Typography>
                                    <Typography component="li" variant="body2" sx={{ color: 'text.secondary' }}>
                                        Budget controls convert between thousands and millions for every account size
                                    </Typography>
                                </Box>
                            </Paper>
                            <Paper
                                elevation={0}
                                className="p-6 rounded-2xl border border-slate-200/70 bg-white/90 dark:border-slate-700 dark:bg-slate-900/60 space-y-4"
                            >
                                <Typography variant="h5" component="h2" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                    Strategy tips for sustainable GE flipping
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                    Use the search widgets to confirm instant buy and sell prices before placing offers. Combine that insight with
                                    the profit score and recommended quantity to spread risk across multiple items while keeping your gold in motion.
                                </Typography>
                                <Divider sx={{ borderColor: 'divider' }} />
                                <Box className="grid gap-3 md:grid-cols-2">
                                    <Box className="space-y-1.5">
                                        <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                            Daily routine
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Check the top flip suggestions, queue medium-risk alternatives, and rotate items every 30-45 minutes to
                                            avoid hitting GE buy limits.
                                        </Typography>
                                    </Box>
                                    <Box className="space-y-1.5">
                                        <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                            When to refresh data
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Re-run the calculations after game updates, clan events, or whenever profit velocity drops below your
                                            target gp/hour.
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                            <Paper
                                elevation={0}
                                className="p-6 rounded-2xl border border-slate-200/70 bg-white/90 dark:border-slate-700 dark:bg-slate-900/60 space-y-5"
                            >
                                <Box className="space-y-2">
                                    <Typography variant="h5" component="h2" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                        OSRS flipping FAQ
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '72ch' }}>
                                        Quick answers for the questions flippers ask most often. Tap a card to reveal the details.
                                    </Typography>
                                </Box>
                                <Box className="space-y-2">
                                    <Accordion
                                        disableGutters
                                        square={false}
                                        className={accordionClassName}
                                        sx={{ '&:before': { display: 'none' } }}
                                    >
                                        <AccordionSummary expandIcon={renderAccordionExpandIcon()} sx={accordionSummarySx}>
                                            <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                                Is this flip finder really free?
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={accordionDetailsSx}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                Yes—this project is built as a passion hobby, so you can use every feature without accounts, paywalls, or
                                                hidden fees. Share feedback and it will go straight onto the weekend tinkering list.
                                            </Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                    <Accordion
                                        disableGutters
                                        square={false}
                                        className={accordionClassName}
                                        sx={{ '&:before': { display: 'none' } }}
                                    >
                                        <AccordionSummary expandIcon={renderAccordionExpandIcon()} sx={accordionSummarySx}>
                                            <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                                How often is the data refreshed?
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={accordionDetailsSx}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                The dataset updates repeatedly throughout the day. Hit the refresh button whenever spreads shrink or a new
                                                game update lands to pull the latest mapping, volumes, and confidence signals.
                                            </Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                    <Accordion
                                        disableGutters
                                        square={false}
                                        className={accordionClassName}
                                        sx={{ '&:before': { display: 'none' } }}
                                    >
                                        <AccordionSummary expandIcon={renderAccordionExpandIcon()} sx={accordionSummarySx}>
                                            <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                                Can I filter for low-risk flips?
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={accordionDetailsSx}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                Definitely. Dial down your budget and prioritise flips with stronger confidence ratings. Those items typically
                                                move faster with tighter spreads, making them perfect for rebuilding a bank without heavy exposure.
                                            </Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                    <Accordion
                                        disableGutters
                                        square={false}
                                        className={accordionClassName}
                                        sx={{ '&:before': { display: 'none' } }}
                                    >
                                        <AccordionSummary expandIcon={renderAccordionExpandIcon()} sx={accordionSummarySx}>
                                            <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                                What if a flip stops being profitable?
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={accordionDetailsSx}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                Remove it from your queue and refresh suggestions. The flip finder recalculates rankings instantly so you can
                                                pivot to quicker opportunities before stale offers tie up your gold.
                                            </Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                </Box>
                            </Paper>
                        </Box>
                    </Container>
                </div>
            </StyledEngineProvider>
        </ThemeProvider>
    );
}
