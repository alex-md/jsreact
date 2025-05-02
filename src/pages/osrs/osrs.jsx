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
    ThemeProvider,
    Box,
    Container,
    CssBaseline
} from '@mui/material';
import '@mui/material/styles';
import { StyledEngineProvider } from '@mui/material/styles';

// Define API endpoints
const API_BASE = 'https://prices.runescape.wiki/api/v1/osrs';
const MAPPING_URL = `${API_BASE}/mapping`;
const LATEST_PRICES_URL = `${API_BASE}/latest`;
const HOURLY_AVG_URL = `${API_BASE}/1h`;
const FIVE_MINUTE_URL = `${API_BASE}/5m`;

// Constants
const TAX_RATE = 0.01;
const DEFAULT_BUDGET = 1000000; // 1M
const DEFAULT_RISK = 0.2; // Default auto-risk starting point
const MIN_VOLUME_THRESHOLD = 100; // Minimum 5-min buy or sell volume to consider an item (increased from 5)
const VOLUME_CAP_FACTOR = 5; // Suggest buying up to this multiple of the 5-minute buy volume

// Helper function to analyze price volatility
function analyzePriceVolatility(itemId, latest, hourly) {
    // Use optional chaining defensively
    if (!latest?.[itemId] || !hourly?.[itemId]) return null;

    const latestData = latest[itemId];
    const hourlyData = hourly[itemId];

    // Ensure valid data exists for volatility calculation
    if (!hourlyData.avgHighPrice || !hourlyData.avgLowPrice || hourlyData.avgLowPrice === 0) {
        return null;
    }

    const highToLowRatio = hourlyData.avgHighPrice / hourlyData.avgLowPrice;

    // Calculate volatility as a percentage difference
    const volatility = highToLowRatio - 1; // e.g., 1.05 ratio is 0.05 volatility

    // Volume calculation might not be needed for volatility, but included original fields
    const volume = hourlyData.highPriceVolume + hourlyData.lowPriceVolume;

    // Trend based on latest high vs hourly average high
    const trend = latestData.high > hourlyData.avgHighPrice ? 'up' : 'down';

    return {
        volatility: volatility,
        volume: volume, // This volume is hourly total, might not be used directly later
        trend: trend
    };
}

// Core function to calculate trade metrics for a single item
function calculateTradeMetrics(item, fiveMinData, latestData, hourlyData, budget, risk) {
    // Use optional chaining and check for data presence for this specific item ID
    if (!fiveMinData?.[item.id] || !latestData?.[item.id] || !hourlyData?.[item.id]) return null;

    const fiveMinItemData = fiveMinData[item.id];
    const latestItemData = latestData[item.id];
    const hourlyItemData = hourlyData[item.id];

    const volatilityAnalysis = analyzePriceVolatility(item.id, latestData, hourlyData);
    if (!volatilityAnalysis) return null;

    const { avgHighPrice, avgLowPrice, highPriceVolume, lowPriceVolume } = fiveMinItemData;

    // **FIX:** Added a more robust minimum volume filter using the new threshold
    if (!avgHighPrice || !avgLowPrice || highPriceVolume < MIN_VOLUME_THRESHOLD || lowPriceVolume < MIN_VOLUME_THRESHOLD) {
        return null; // Filter out items with very low recent trading volume
    }

    // Calculate weighted prices (logic kept from original)
    // Weights: 5m (0.5), Latest (0.3), 1h (0.2)
    const weightedBuyPrice = Math.floor(avgLowPrice * 0.5 + latestItemData.low * 0.3 + hourlyItemData.avgLowPrice * 0.2);
    const weightedSellPrice = Math.floor(avgHighPrice * 0.5 + latestItemData.high * 0.3 + hourlyItemData.avgHighPrice * 0.2);

    // Ensure buy price is positive and less than sell price (after tax)
    const buyPrice = weightedBuyPrice;
    const sellPrice = weightedSellPrice;
    const taxedSell = Math.floor(sellPrice * (1 - TAX_RATE));

    const profitPer = taxedSell - buyPrice;

    if (profitPer <= 0) {
        return null; // Only consider profitable flips
    }

    // Calculate maximum quantity based on budget and GE limit, adjusted by volatility
    // Lower volatilityFactor means less quantity suggested for more volatile items (higher risk)
    const volatilityFactor = Math.max(0.5, 1 - volatilityAnalysis.volatility); // Factor caps at 0.5 even for extremely high volatility
    const maxQtyBudgetLimit = Math.min(item.limit, Math.floor(budget * volatilityFactor / buyPrice));

    // **FIX:** Calculate quantity cap based on recent buy volume from 5-minute data
    const volumeCapQty = fiveMinItemData.lowPriceVolume * VOLUME_CAP_FACTOR;

    // **FIX:** The final suggested quantity is the minimum of the budget/limit cap AND the volume cap
    const suggestedQty = Math.floor(Math.min(maxQtyBudgetLimit, volumeCapQty));

    // **FIX:** If suggested quantity is 0 or negative after calculations, return null
    if (suggestedQty <= 0) {
        return null;
    }

    // Calculate total profit based on the suggested quantity
    const totalProfit = profitPer * suggestedQty;

    // Calculate margin and risk score (logic kept from original)
    const margin = profitPer / buyPrice;
    const riskScore = margin * volatilityFactor; // Risk influenced by margin and volatility

    // Filter by risk tolerance
    if (riskScore < risk) {
        return null;
    }

    // **FIX:** Removed the old 'volumeHealth' calculation and metric as it was based on hourly sell volume
    // The suggestedQty is now directly capped by 5-min buy volume.

    return {
        ...item, // Include item name, id, etc.
        buyPrice,
        sellPrice,
        taxedSell,
        profitPer,
        maxQty: suggestedQty, // Use the newly calculated, volume-capped quantity
        totalProfit,
        margin,
        volatility: volatilityAnalysis.volatility,
        trend: volatilityAnalysis.trend,
        // Removed volumeHealth field
        highPriceVolume: fiveMinItemData.highPriceVolume, // Include 5-min volumes for display/sorting
        lowPriceVolume: fiveMinItemData.lowPriceVolume
    };
}

// Function to find the optimal risk tolerance
function getOptimalRisk(mapping, fiveMin, latest, hourly, budget) {
    let bestRisk = 0.1; // Start iterating from a low risk
    let bestProfit = 0;

    // Iterate through different risk levels
    // **FIX:** Adjusted the loop range slightly for finer tuning potential
    for (let r = 0.02; r <= 0.5; r += 0.01) {
        // Calculate suggestions for the current risk level
        let suggestions = mapping
            .map(item => calculateTradeMetrics(item, fiveMin, latest, hourly, budget, r))
            .filter(Boolean) // Remove null results
            // **FIX:** Sort purely by totalProfit, which is now volume-capped
            .sort((a, b) => b.totalProfit - a.totalProfit)
            .slice(0, 10); // Consider top 10 for optimal risk calculation

        // **FIX:** Sum total profit directly (no longer weighting by volumeHealth)
        let total = suggestions.reduce((sum, f) => sum + f.totalProfit, 0);

        // Find the risk level that yields the highest total profit from the top flips
        if (total > bestProfit) {
            bestProfit = total;
            bestRisk = r;
        }
    }
    return bestRisk;
}

// Helper to get OSRS Wiki link
function getWikiLink(name) {
    return `https://oldschool.runescape.wiki/w/Exchange:${encodeURIComponent(name.replace(/ /g, '_'))}`;
}

// Helper to format time since last update
function formatTimeSince(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return 'over a day ago'; // Simple fallback for longer times
}

// SearchResults Component
const SearchResults = ({ results, getWikiLink, formatTimeSince }) => {
    if (!results) return null;

    if (results.length === 0) {
        return (
            <Typography color="textSecondary" className="mb-6">
                No items found matching your search.
            </Typography>
        );
    }

    return (
        <>
            <Typography variant="h6" gutterBottom>
                Search Results
            </Typography>
            <Grid container spacing={2} className="mb-6">
                {results.map((item) => (
                    <Grid item xs={12} key={item.id}>
                        <Paper elevation={1} className="p-4">
                            <Typography variant="h6">{item.name}</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body1" color="textSecondary">
                                        Recommended Insta-sell Price:
                                        <Typography component="span" color="primary" className="font-bold ml-2">
                                            {item.weightedHighPrice.toLocaleString()} gp
                                        </Typography>
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Recent Trading Volume (5m): {item.highPriceVolume.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Last Updated: {formatTimeSince(item.timestamp)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Latest High: {item.latestHigh.toLocaleString()} gp
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        5-min Average High: {item.fiveMinHigh.toLocaleString()} gp
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        1-hour Average High: {item.hourlyHigh.toLocaleString()} gp
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        variant="text"
                                        color="primary"
                                        href={getWikiLink(item.name)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View on OSRS Wiki
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </>
    );
};

// Main React Component
export default function OSRSFlipper() {
    // State variables
    const [mapping, setMapping] = useState([]);
    const [fiveMin, setFiveMin] = useState({});
    const [latestPrices, setLatestPrices] = useState({});
    const [hourlyPrices, setHourlyPrices] = useState({});
    const [flips, setFlips] = useState([]); // Array to hold suggested flips
    const [searchQuery, setSearchQuery] = useState(''); // New state for search input
    const [searchResults, setSearchResults] = useState(null); // New state for search results
    const [loading, setLoading] = useState(true); // Loading state
    const [budget, setBudget] = useState(DEFAULT_BUDGET); // User budget in GP
    const [budgetUnit, setBudgetUnit] = useState('M'); // Budget unit (K or M)
    const [budgetValue, setBudgetValue] = useState('1'); // Budget value for input field
    const [refreshKey, setRefreshKey] = useState(0); // Key to trigger data refetch
    const [sortBy, setSortBy] = useState('totalProfit'); // Sorting criteria
    const [autoRisk, setAutoRisk] = useState(DEFAULT_RISK); // Auto-calculated optimal risk
    const [lastUpdate, setLastUpdate] = useState(Date.now()); // Timestamp of last data update

    // Handler for budget input changes
    const handleBudgetChange = (value, unit) => {
        const numValue = parseFloat(value) || 0;
        const multiplier = unit === 'M' ? 1000000 : 1000;
        setBudget(numValue * multiplier);
        setBudgetValue(value);
        setBudgetUnit(unit);
    };

    // New function to calculate potential insta-sell price
    const calculateInstaSellPrice = (itemId) => {
        if (!latestPrices?.[itemId] || !fiveMin?.[itemId] || !hourlyPrices?.[itemId]) {
            return null;
        }

        const latest = latestPrices[itemId];
        const fiveMinData = fiveMin[itemId];
        const hourlyData = hourlyPrices[itemId];

        // We'll use a weighted average of different price points
        // Latest high price (most recent) - 50% weight
        // 5-minute average high - 30% weight
        // Hourly average high - 20% weight
        const weightedHighPrice = Math.floor(
            (latest.high * 0.5) +
            (fiveMinData.avgHighPrice * 0.3) +
            (hourlyData.avgHighPrice * 0.2)
        );

        return {
            weightedHighPrice,
            latestHigh: latest.high,
            fiveMinHigh: fiveMinData.avgHighPrice,
            hourlyHigh: hourlyData.avgHighPrice,
            highPriceVolume: fiveMinData.highPriceVolume,
            timestamp: latest.timestamp
        };
    };

    // New function to handle item search
    const handleSearch = () => {
        try {
            if (!searchQuery.trim()) {
                setSearchResults(null);
                return;
            }

            // Check if we have the required data
            if (!mapping.length || !Object.keys(latestPrices).length || !Object.keys(fiveMin).length || !Object.keys(hourlyPrices).length) {
                console.warn('Search attempted before data was loaded', {
                    mappingLength: mapping.length,
                    latestPricesKeys: Object.keys(latestPrices).length,
                    fiveMinKeys: Object.keys(fiveMin).length,
                    hourlyPricesKeys: Object.keys(hourlyPrices).length
                });
                return;
            }

            console.log('Starting search for:', searchQuery);

            // Find items that match the search query
            const matchingItems = mapping.filter(item => {
                if (!item || !item.name) {
                    console.warn('Invalid item in mapping:', item);
                    return false;
                }
                return item.name.toLowerCase().includes(searchQuery.toLowerCase());
            });

            console.log('Found matching items:', matchingItems.length);

            // Get price data for matching items
            const itemsWithPrices = matchingItems.map(item => {
                try {
                    const priceData = calculateInstaSellPrice(item.id);
                    if (!priceData) {
                        console.log('No price data found for item:', item.name, item.id);
                        return null;
                    }

                    return {
                        ...item,
                        ...priceData
                    };
                } catch (err) {
                    console.error('Error processing item:', item.name, err);
                    return null;
                }
            }).filter(Boolean);

            console.log('Items with prices:', itemsWithPrices.length);
            setSearchResults(itemsWithPrices);
        } catch (error) {
            console.error('Error during search:', error);
            // Don't change the search results if there's an error
        }
    };

    // MUI Theme (kept as is, assuming Tailwind classes are used or you might add MUI components back)
    const muiTheme = createTheme({
        palette: {
            mode: 'light',
            primary: {
                main: '#15803d', // Green-700 equivalent
                dark: '#166534', // Green-800 equivalent
                contrastText: '#fff',
            },
            background: {
                default: '#f8f9fa', // Light background
                paper: '#ffffff', // White cards
            },
        },
        typography: {
            fontFamily: [
                'Inter', // Using Inter font from Google Fonts link in JSX
                '-apple-system',
                'BlinkMacSystemFont',
                'Segoe UI',
                'Roboto',
                'Helvetica Neue',
                'Arial',
                'sans-serif',
            ].join(','),
        },
        components: {
            // Add back component styles if needed, currently rely mostly on Tailwind
            MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: '8px', padding: '8px 16px' } } },
            MuiTextField: { styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: '8px' } } } },
            MuiPaper: { styleOverrides: { root: { borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' } } },
        }
    });

    // Effect to fetch data on initial load and refresh
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch data from all endpoints concurrently
                const [mappingResponse, fiveMinResponse, latestResponse, hourlyResponse] = await Promise.all([
                    fetch(MAPPING_URL),
                    fetch(FIVE_MINUTE_URL),
                    fetch(LATEST_PRICES_URL),
                    fetch(HOURLY_AVG_URL),
                ]);

                // Check if responses are OK before parsing JSON
                if (!mappingResponse.ok || !fiveMinResponse.ok || !latestResponse.ok || !hourlyResponse.ok) {
                    throw new Error("Failed to fetch all data");
                }

                const [mappingData, fiveMinData, latestData, hourlyData] = await Promise.all([
                    mappingResponse.json(),
                    fiveMinResponse.json(),
                    latestResponse.json(),
                    hourlyResponse.json(),
                ]);

                console.log('Mapping data:', mappingData);
                console.log('Five min data:', fiveMinData);
                console.log('Latest data:', latestData);
                console.log('Hourly data:', hourlyData);

                // Update state with fetched data
                // Note: mapping data is a direct array, while price endpoints return { data: { itemId: {...} }, timestamp: ... }
                setMapping(mappingData);
                setFiveMin(fiveMinData.data);
                setLatestPrices(latestData.data);
                setHourlyPrices(hourlyData.data);

                setLoading(false);
                setLastUpdate(Date.now()); // Record update time
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
                // Optionally set an error state to display to the user
            }
        };

        fetchData(); // Call fetchData when refreshKey changes or on mount
    }, [refreshKey]); // Dependency array includes refreshKey

    // Effect to calculate flips when data or parameters change
    useEffect(() => {
        // Ensure all necessary data is loaded before calculating flips
        if (!mapping.length || !Object.keys(fiveMin).length || !Object.keys(latestPrices).length || !Object.keys(hourlyPrices).length) {
            //console.log("Waiting for data...");
            return; // Don't calculate flips until data is ready
        }

        // Calculate the optimal risk based on current data and budget
        // **FIX:** Pass the full data objects
        const risk = getOptimalRisk(mapping, fiveMin, latestPrices, hourlyPrices, budget);
        setAutoRisk(risk); // Set the auto-calculated risk

        // Calculate suggestions for all items based on the optimal risk
        let suggestions = mapping
            .map(item => calculateTradeMetrics(item, fiveMin, latestPrices, hourlyPrices, budget, risk))
            .filter(Boolean) // Remove null results (items that didn't meet criteria)
            // Sort the suggestions based on the chosen criteria
            .sort((a, b) => {
                if (sortBy === 'totalProfit') {
                    // **FIX:** Sort purely by totalProfit (which is now volume-capped)
                    return b.totalProfit - a.totalProfit;
                }
                // Sort by other metrics if selected
                return b[sortBy] - a[sortBy];
            })
            .slice(0, 15); // Limit to the top 15 suggestions

        setFlips(suggestions); // Update the list of suggested flips

    }, [mapping, fiveMin, latestPrices, hourlyPrices, budget, sortBy]); // Dependencies for recalculation

    // Effect to update the "time since last update" display every minute
    useEffect(() => {
        const interval = setInterval(() => {
            // Trigger a state update to re-render the time format
            setLastUpdate((prev) => prev); // Simple way to force re-render without changing state value
        }, 60000); // Update every 60 seconds (1 minute)

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, []); // Empty dependency array means this runs once on mount and cleans up on unmount


    // --- JSX Rendering (kept mostly as is, using Tailwind classes) ---
    return (
        <ThemeProvider theme={muiTheme}>
            <StyledEngineProvider injectFirst>
                <CssBaseline />
                <Container maxWidth="lg" className="py-8">
                    <Paper elevation={0} className="p-6 mb-6">
                        <Grid container spacing={3}>
                            {/* Existing budget input */}
                            <Grid item xs={12} md={4}>
                                <label htmlFor="budget-input" className="block text-sm font-medium text-gray-700">Budget</label>
                                <div className="flex gap-2">
                                    <input
                                        id="budget-input"
                                        type="number"
                                        value={budgetValue}
                                        onChange={(e) => handleBudgetChange(e.target.value, budgetUnit)}
                                        min="0.01"
                                        step="0.1"
                                        className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-200 focus:border-green-400"
                                    />
                                    <select
                                        value={budgetUnit}
                                        onChange={(e) => handleBudgetChange(budgetValue, e.target.value)}
                                        className="w-20 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-200 focus:border-green-400 bg-gray-50"
                                    >
                                        <option value="K">K</option>
                                        <option value="M">M</option>
                                    </select>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{budget.toLocaleString()} gp</p>
                            </Grid>

                            {/* Search section */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Item Price Search
                                </Typography>
                                <div className="flex gap-2">
                                    <TextField
                                        fullWidth
                                        label="Search for an item"
                                        variant="outlined"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearch();
                                            }
                                        }}
                                        className="mb-4"
                                    />
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleSearch}
                                        className="h-14"
                                    >
                                        Search
                                    </Button>
                                </div>
                            </Grid>

                            {/* Search Results */}
                            <Grid item xs={12}>
                                {loading ? (
                                    <Typography color="textSecondary" className="mb-6">
                                        Loading item data...
                                    </Typography>
                                ) : (
                                    <SearchResults
                                        results={searchResults}
                                        getWikiLink={getWikiLink}
                                        formatTimeSince={formatTimeSince}
                                    />
                                )}
                            </Grid>

                            {/* Main flips display */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Recommended Flips
                                </Typography>
                                <section className="osrs-results" aria-live="polite">
                                    {loading && <p className="text-center text-gray-500 py-8">Loading flips...</p>}
                                    {!loading && flips.length === 0 && <p className="text-center text-gray-500 py-8">No profitable flips found matching criteria. Try adjusting your budget or refresh data.</p>}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {flips.map(flip => (
                                            <article
                                                key={flip.id}
                                                className="osrs-flip-card bg-white rounded-lg shadow-md p-5 flex gap-4 items-start min-h-[120px] border border-gray-100 hover:shadow-lg transition group"
                                            >
                                                {/* Item Icon */}
                                                <img
                                                    src={`https://oldschool.runescape.wiki/images/${encodeURIComponent(flip.icon.replace(/ /g, '_'))}`}
                                                    alt={flip.name}
                                                    width={48}
                                                    height={48}
                                                    className="rounded-md bg-gray-100 border border-gray-200 flex-shrink-0"
                                                    loading="lazy"
                                                />

                                                {/* Item Details */}
                                                <div className="flex-1 min-w-0"> {/* Use min-w-0 to prevent overflow */}
                                                    <a
                                                        href={flip.wiki}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-bold text-lg text-green-700 hover:underline truncate block" /* Added truncate */
                                                        title={`View ${flip.name} on OSRS Wiki`}
                                                    >
                                                        {flip.name}
                                                    </a>

                                                    {/* Price and Quantity */}
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-700">
                                                        <span className="flex items-center gap-1" title="The estimated price to buy this item for on the GE">
                                                            <span className="font-medium">Buy:</span> <b>{flip.buyPrice.toLocaleString()}</b> gp
                                                        </span>
                                                        <span className="flex items-center gap-1" title="The estimated price to sell this item for on the GE">
                                                            <span className="font-medium">Sell:</span> <b>{flip.sellPrice.toLocaleString()}</b> gp
                                                        </span>
                                                        <span className="flex items-center gap-1" title="The maximum number of this item suggested to flip based on budget, GE limit, and recent buy volume">
                                                            <svg className="w-4 h-4 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"></circle>
                                                                <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">Qty</text>
                                                            </svg>
                                                            <span className="font-medium">Qty:</span> {flip.maxQty.toLocaleString()}
                                                        </span>
                                                    </div>

                                                    {/* Profit and Margin */}
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-700">
                                                        <span className="flex items-center gap-1" title="Your estimated profit per item after GE tax">
                                                            <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19V5m0 0l-7 7m7-7l7 7" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                                            <span className="font-medium">Profit/item:</span> {flip.profitPer.toLocaleString()} gp
                                                        </span>
                                                        <span className="flex items-center gap-1" title="Total estimated profit if you flip the suggested quantity">
                                                            <svg className="w-4 h-4 text-green-700 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"></circle><path d="M8 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                                            <span className="font-medium">Total Profit:</span> <b className="text-green-700">{flip.totalProfit.toLocaleString()}</b> gp
                                                        </span>
                                                        <span className="flex items-center gap-1" title="Profit margin as a percentage of the buy price">
                                                            <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 9V7a5 5 0 00-10 0v2"></path><rect x="5" y="9" width="14" height="10" rx="2"></rect><path d="M8 13h8v4H8z"></path></svg>
                                                            <span className="font-medium">Margin:</span> {(flip.margin * 100).toFixed(2)}%
                                                        </span>
                                                    </div>

                                                    {/* Additional Data (Volumes, Volatility, Trend) */}
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                                                        {/* **FIX:** Display 5-min volumes */}
                                                        <span className="flex items-center gap-1" title="Buy volume (last 5 min)">
                                                            <svg className="w-3 h-3 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10"></circle></svg>
                                                            Buy Vol (5m): <span className="text-green-700">{flip.lowPriceVolume.toLocaleString()}</span>
                                                        </span>
                                                        <span className="flex items-center gap-1" title="Sell volume (last 5 min)">
                                                            <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10"></circle></svg>
                                                            Sell Vol (5m): <span className="text-green-700">{flip.highPriceVolume.toLocaleString()}</span>
                                                        </span>
                                                        <span className="flex items-center gap-1" title="Price volatility (hourly average high vs low)">
                                                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
                                                            Volatility: <span className={`${flip.volatility > 0.05 ? (flip.volatility > 0.15 ? 'text-red-600' : 'text-orange-600') : 'text-green-700'}`}>{(flip.volatility * 100).toFixed(1)}%</span> {/* Adjusted color thresholds */}
                                                        </span>
                                                        {/* **FIX:** Removed Volume Health display as the metric was removed/redefined */}
                                                        <span className="flex items-center gap-1" title="Price trend (latest high vs hourly average high)">
                                                            <svg className={`w-3 h-3 flex-shrink-0 ${flip.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={flip.trend === 'up' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}></path>
                                                            </svg>
                                                            Trend: <span className={`${flip.trend === 'up' ? 'text-green-700' : 'text-red-600'}`}>{flip.trend === 'up' ? 'Rising' : 'Falling'}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            </Grid>
                        </Grid>
                    </Paper>
                </Container>
            </StyledEngineProvider>
        </ThemeProvider>
    );
}
