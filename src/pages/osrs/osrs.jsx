import React, { useEffect, useState, useMemo } from 'react';
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
    CssBaseline,
    CircularProgress
} from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';

// --- API Endpoints and Constants (Keep these the same) ---
const API_BASE = 'https://prices.runescape.wiki/api/v1/osrs';
const MAPPING_URL = `${API_BASE}/mapping`;
const LATEST_PRICES_URL = `${API_BASE}/latest`;
const HOURLY_AVG_URL = `${API_BASE}/1h`;
const FIVE_MINUTE_URL = `${API_BASE}/5m`;

// Constants
const TAX_RATE = 0.01;
const DEFAULT_BUDGET = 10000000; // Increased default budget for more realistic results (10M)
const DEFAULT_RISK = 0.2; // Default auto-risk starting point
const MIN_VOLUME_THRESHOLD = 50; // Minimum 5-min buy or sell volume to consider an item (reduced slightly, adjust as needed)
const VOLUME_CAP_FACTOR = 3; // Suggest buying up to this multiple of the 5-minute buy volume (reduced slightly)
const MAX_FLIP_SUGGESTIONS = 20; // Limit the number of displayed flips

// --- Helper Functions (Keep these the same or slightly adjusted based on original code improvements) ---

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

    // Calculate volatility as a percentage difference between hourly avg high and low
    const volatility = (hourlyData.avgHighPrice - hourlyData.avgLowPrice) / hourlyData.avgLowPrice;

    // Trend based on latest high vs hourly average high
    const trend = latestData.high > hourlyData.avgHighPrice ? 'up' : 'down';

    return {
        volatility: volatility,
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
    if (!volatilityAnalysis) return null; // Skip if volatility cannot be calculated

    const { avgHighPrice: fiveMinAvgHigh, avgLowPrice: fiveMinAvgLow, highPriceVolume: fiveMinHighVolume, lowPriceVolume: fiveMinLowVolume } = fiveMinItemData;

    // Basic data validation
    if (!fiveMinAvgHigh || !fiveMinAvgLow || !latestItemData.high || !latestItemData.low || !hourlyItemData.avgHighPrice || !hourlyItemData.avgLowPrice) {
        return null; // Ensure core prices exist
    }

    // Minimum volume filter
    if (fiveMinHighVolume < MIN_VOLUME_THRESHOLD || fiveMinLowVolume < MIN_VOLUME_THRESHOLD) {
        return null; // Filter out items with very low recent trading volume
    }

    // Calculate weighted prices
    // Weights: 5m (0.5), Latest (0.3), 1h (0.2) - Note: This is a simple example, real strategies vary.
    // Using avgLow for buy, avgHigh for sell from all sources
    const weightedBuyPrice = Math.floor(fiveMinAvgLow * 0.5 + latestItemData.low * 0.3 + hourlyItemData.avgLowPrice * 0.2);
    const weightedSellPrice = Math.floor(fiveMinAvgHigh * 0.5 + latestItemData.high * 0.3 + hourlyItemData.avgHighPrice * 0.2);

    // Ensure prices are valid and non-zero
    if (weightedBuyPrice <= 0 || weightedSellPrice <= 0) {
        return null;
    }

    const buyPrice = weightedBuyPrice;
    const sellPrice = weightedSellPrice;
    const taxedSell = Math.floor(sellPrice * (1 - TAX_RATE));

    const profitPer = taxedSell - buyPrice;

    if (profitPer <= 0) {
        return null; // Only consider profitable flips
    }

    // Calculate suggested quantity based on budget, GE limit, and adjusted by volatility/volume
    // Volatility factor reduces suggested quantity for more volatile items
    const volatilityFactor = Math.max(0.1, 1 - volatilityAnalysis.volatility * 2); // Adjust volatility impact, cap at 0.1
    const maxQtyBudgetLimit = Math.floor(budget * volatilityFactor / buyPrice);

    // Quantity cap based on recent buy volume (5-minute low price volume)
    const volumeCapQty = fiveMinLowVolume * VOLUME_CAP_FACTOR;

    // The final suggested quantity is the minimum of the budget/limit cap AND the volume cap AND the GE limit
    const suggestedQty = Math.floor(Math.min(maxQtyBudgetLimit, volumeCapQty, item.limit));

    // If suggested quantity is 0 or negative after calculations, return null
    if (suggestedQty <= 0) {
        return null;
    }

    // Calculate total profit based on the suggested quantity
    const totalProfit = profitPer * suggestedQty;

    // Calculate margin and risk score
    const margin = profitPer / buyPrice;
    const riskScore = margin * volatilityFactor; // Risk influenced by margin and volatility

    // Filter by risk tolerance - only include if riskScore is >= the calculated optimal risk
    if (riskScore < risk) {
        return null;
    }

    return {
        ...item, // Include item name, id, limit, icon etc.
        wiki: getWikiLink(item.name), // Add wiki link here
        buyPrice,
        sellPrice,
        taxedSell,
        profitPer,
        maxQty: suggestedQty, // Use the newly calculated, volume-capped quantity
        totalProfit,
        margin,
        volatility: volatilityAnalysis.volatility,
        trend: volatilityAnalysis.trend,
        fiveMinHighVolume, // Include 5-min volumes for display/sorting
        fiveMinLowVolume
    };
}

// Function to find the optimal risk tolerance
function getOptimalRisk(mapping, fiveMin, latest, hourly, budget) {
    let bestRisk = 0.01; // Start iterating from a very low risk
    let bestProfit = 0;
    const risksToEvaluate = [];

    // Generate a range of risk levels to test (e.g., 0.01 to 0.3, stepped)
    for (let r = 0.01; r <= 0.3; r += 0.01) {
        risksToEvaluate.push(r);
    }
    for (let r = 0.31; r <= 0.5; r += 0.05) { // Larger step for higher risk
        risksToEvaluate.push(r);
    }


    risksToEvaluate.forEach(r => {
        // Calculate suggestions for the current risk level
        let suggestions = mapping
            .map(item => calculateTradeMetrics(item, fiveMin, latest, hourly, budget, r))
            .filter(Boolean) // Remove null results
            // Sort purely by totalProfit, which is now volume-capped
            .sort((a, b) => b.totalProfit - a.totalProfit)
            .slice(0, Math.min(10, MAX_FLIP_SUGGESTIONS)); // Consider top N flips for optimal risk calculation

        // Sum total profit directly
        let total = suggestions.reduce((sum, f) => sum + f.totalProfit, 0);

        // Find the risk level that yields the highest total profit from the top flips
        if (total > bestProfit) {
            bestProfit = total;
            bestRisk = r;
        }
    });

    // Return the best risk found, formatted
    return parseFloat(bestRisk.toFixed(2));
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
    // Add days for longer periods
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return 'over a week ago';
}

// Helper to format large numbers (e.g., 1.2M, 500K)
function formatGrandExchangePrice(price) {
    if (price === null || price === undefined) return '-';
    if (price >= 1000000) {
        return (price / 1000000).toFixed(1) + 'M';
    } else if (price >= 1000) {
        return (price / 1000).toFixed(1) + 'K';
    }
    return price.toLocaleString();
}

// --- SearchResults Component (Refactored) ---
const SearchResults = ({ results, getWikiLink, formatTimeSince }) => {
    if (results === null) return null; // Don't render anything until a search is performed

    if (results.length === 0) {
        return (
            <div className="p-4 text-gray-500 italic text-center">
                No items found matching your search query or with sufficient price data.
            </div>
        );
    }

    return (
        <div className="space-y-3"> {/* space-y for gap between cards */}
            {results.map((item) => (
                <a
                    key={item.id}
                    href={getWikiLink(item.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white rounded-lg border border-gray-100 p-4 hover:shadow-sm transition-shadow duration-200 group"
                >
                    <div className="flex justify-between items-start mb-2">
                        <Typography variant="subtitle1" className="font-medium text-green-700 group-hover:underline truncate pr-2">
                            {item.name}
                        </Typography>
                        <Typography variant="caption" className="text-gray-500 flex-shrink-0">
                            {formatTimeSince(item.timestamp)}
                        </Typography>
                    </div>

                    {/* Recommended Price */}
                    <div className="bg-green-50 rounded-md p-2 mb-3">
                        <Typography variant="caption" className="text-gray-600 block">
                            Recommended Insta-sell
                        </Typography>
                        <Typography variant="body1" className="font-bold text-green-800">
                            {item.weightedHighPrice.toLocaleString()} gp
                        </Typography>
                    </div>

                    {/* Historical Prices */}
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-700">
                        <div className="bg-gray-50 rounded-md p-2">
                            <Typography variant="caption" className="block text-gray-600 truncate">Latest High</Typography>
                            <Typography variant="body2" className="font-medium text-gray-900 truncate">
                                {formatGrandExchangePrice(item.latestHigh)}
                            </Typography>
                        </div>
                        <div className="bg-gray-50 rounded-md p-2">
                            <Typography variant="caption" className="block text-gray-600 truncate">5m Avg High</Typography>
                            <Typography variant="body2" className="font-medium text-gray-900 truncate">
                                {formatGrandExchangePrice(item.fiveMinHigh)}
                            </Typography>
                        </div>
                        <div className="bg-gray-50 rounded-md p-2">
                            <Typography variant="caption" className="block text-gray-600 truncate">1h Avg High</Typography>
                            <Typography variant="body2" className="font-medium text-gray-900 truncate">
                                {formatGrandExchangePrice(item.hourlyHigh)}
                            </Typography>
                        </div>
                    </div>

                    {/* Volume */}
                    <div className="mt-3 text-xs text-gray-600">
                        Volume (5m High): {item.highPriceVolume.toLocaleString()}
                    </div>
                </a>
            ))}
        </div>
    );
};

// --- FlipCard Component (New Component for clarity) ---
const FlipCard = ({ flip }) => {
    const volatilityColor = useMemo(() => {
        if (flip.volatility > 0.2) return 'text-red-600'; // High volatility
        if (flip.volatility > 0.1) return 'text-orange-600'; // Medium volatility
        return 'text-green-700'; // Low volatility
    }, [flip.volatility]);

    const volatilityTooltip = `Volatility: ${(flip.volatility * 100).toFixed(1)}% (Higher value means more price fluctuation)`;

    return (
        <article
            key={flip.id}
            className="osrs-flip-card bg-white rounded-xl shadow-sm p-5 flex gap-4 items-start border border-gray-100 hover:shadow-md transition group"
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

            {/* Item Details and Stats */}
            <div className="flex-1 min-w-0"> {/* Use min-w-0 to prevent overflow */}
                <a
                    href={flip.wiki}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-lg text-green-700 hover:underline truncate block"
                    title={`View ${flip.name} on OSRS Wiki`}
                >
                    {flip.name}
                </a>

                {/* Key Metrics: Total Profit, Profit/Item, Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 mb-3">
                    <div className="bg-green-50 rounded-md p-2">
                        <Typography variant="caption" className="block text-gray-600">Total Profit</Typography>
                        <Typography variant="body1" className="font-bold text-green-800 truncate">
                            {flip.totalProfit.toLocaleString()} gp
                        </Typography>
                    </div>
                    <div className="bg-blue-50 rounded-md p-2">
                        <Typography variant="caption" className="block text-gray-600">Profit/Item</Typography>
                        <Typography variant="body1" className="font-medium text-blue-800 truncate">
                            {flip.profitPer.toLocaleString()} gp
                        </Typography>
                    </div>
                    <div className="bg-yellow-50 rounded-md p-2">
                        <Typography variant="caption" className="block text-gray-600">Quantity</Typography>
                        <Typography variant="body1" className="font-medium text-yellow-800 truncate">
                            {flip.maxQty.toLocaleString()}
                        </Typography>
                    </div>
                </div>

                {/* Prices */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700 mb-3">
                    <span title="Estimated price to buy on GE">
                        <span className="font-medium">Buy:</span> {flip.buyPrice.toLocaleString()} gp
                    </span>
                    <span title="Estimated price to sell on GE (before tax)">
                        <span className="font-medium">Sell:</span> {flip.sellPrice.toLocaleString()} gp
                    </span>
                    <span title="Estimated price after GE tax">
                        <span className="font-medium">Taxed Sell:</span> {flip.taxedSell.toLocaleString()} gp
                    </span>
                </div>


                {/* Detailed Stats: Margin, Volumes, Volatility, Trend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span className="flex items-center gap-1" title="Profit margin as a percentage of the buy price">
                        <span className="font-medium">Margin:</span> <b className="text-purple-700">{(flip.margin * 100).toFixed(2)}%</b>
                    </span>
                    <span className="flex items-center gap-1" title="Buy volume (last 5 min)">
                        <span className="font-medium">Buy Vol (5m):</span> {flip.fiveMinLowVolume.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1" title="Sell volume (last 5 min)">
                        <span className="font-medium">Sell Vol (5m):</span> {flip.fiveMinHighVolume.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1" title={volatilityTooltip}>
                        <span className="font-medium">Volatility:</span> <b className={volatilityColor}>{(flip.volatility * 100).toFixed(1)}%</b>
                    </span>
                    <span className="flex items-center gap-1" title="Price trend (latest high vs hourly average high)">
                        <span className="font-medium">Trend:</span>
                        <b className={`${flip.trend === 'up' ? 'text-green-700' : 'text-red-600'}`}>
                            {flip.trend === 'up' ? 'Rising' : 'Falling'}
                        </b>
                        <svg className={`w-3 h-3 flex-shrink-0 ${flip.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={flip.trend === 'up' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}></path>
                        </svg>
                    </span>
                </div>
            </div>
        </article>
    );
};


// --- Main React Component ---
export default function OSRSFlipper() {
    // State variables
    const [mapping, setMapping] = useState([]);
    const [fiveMin, setFiveMin] = useState({});
    const [latestPrices, setLatestPrices] = useState({});
    const [hourlyPrices, setHourlyPrices] = useState({});
    const [flips, setFlips] = useState([]); // Array to hold suggested flips
    const [searchQuery, setSearchQuery] = useState(''); // New state for search input
    const [searchResults, setSearchResults] = useState(null); // New state for search results (null initially, [] after search with no results)
    const [loading, setLoading] = useState(true); // Loading state for initial data fetch
    const [calculatingFlips, setCalculatingFlips] = useState(false); // Loading state for flip calculation
    const [budget, setBudget] = useState(DEFAULT_BUDGET); // User budget in GP
    const [budgetUnit, setBudgetUnit] = useState('M'); // Budget unit (K or M)
    const [budgetValue, setBudgetValue] = useState((DEFAULT_BUDGET / 1000000).toString()); // Budget value for input field
    const [refreshKey, setRefreshKey] = useState(0); // Key to trigger data refetch
    const [sortBy, setSortBy] = useState('totalProfit'); // Sorting criteria
    const [autoRisk, setAutoRisk] = useState(DEFAULT_RISK); // Auto-calculated optimal risk
    const [lastUpdate, setLastUpdate] = useState(Date.now()); // Timestamp of last data update

    // Handler for budget input changes
    const handleBudgetChange = (value, unit) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
            setBudgetValue(value); // Still update input value to allow corrections
            // Optionally show an error
            return;
        }
        const multiplier = unit === 'M' ? 1000000 : 1000;
        const newBudget = Math.floor(numValue * multiplier); // Ensure integer budget
        setBudget(newBudget);
        setBudgetValue(value);
        setBudgetUnit(unit);
    };

    // New function to calculate potential insta-sell price for search results
    const calculateInstaSellPrice = (itemId) => {
        const latest = latestPrices?.[itemId];
        const fiveMinData = fiveMin?.[itemId];
        const hourlyData = hourlyPrices?.[itemId];

        if (!latest || !fiveMinData || !hourlyData || !latest.high || !fiveMinData.avgHighPrice || !hourlyData.avgHighPrice) {
            return null; // Needs essential high price data
        }

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
            timestamp: latest.timestamp // Use latest price timestamp
        };
    };

    // New function to handle item search
    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setSearchResults(null); // Clear results if search query is empty
            return;
        }

        // Check if we have the required data
        if (!mapping.length || !Object.keys(latestPrices).length || !Object.keys(fiveMin).length || !Object.keys(hourlyPrices).length) {
            console.warn('Search attempted before data was fully loaded.');
            setSearchResults([]); // Show empty results if data isn't ready
            return;
        }

        console.log('Starting search for:', searchQuery);

        // Find items that match the search query
        const lowerCaseQuery = searchQuery.toLowerCase();
        const matchingItems = mapping.filter(item =>
            item && item.name && item.name.toLowerCase().includes(lowerCaseQuery)
        );

        console.log('Found matching items in mapping:', matchingItems.length);

        // Get price data for matching items
        const itemsWithPrices = matchingItems.map(item => {
            const priceData = calculateInstaSellPrice(item.id);
            if (!priceData) {
                // console.log('No sufficient price data found for item:', item.name, item.id);
                return null; // Skip items without full price data
            }

            return {
                ...item,
                ...priceData
            };
        }).filter(Boolean); // Remove null entries

        console.log('Items with sufficient price data:', itemsWithPrices.length);
        setSearchResults(itemsWithPrices);
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
            MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 500 } } },
            MuiTextField: { styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: '8px', paddingRight: '8px' }, '& .MuiInputLabel-root': { fontWeight: 500 } } } },
            MuiSelect: { styleOverrides: { select: { padding: '8px 12px' }, root: { borderRadius: '8px', fontWeight: 500 } } },
            MuiPaper: { styleOverrides: { root: { borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' } } }, // Slightly lighter shadow
            MuiTypography: { styleOverrides: { h6: { fontSize: '1.2rem', fontWeight: 600 }, subtitle1: { fontSize: '1rem', fontWeight: 500 }, body1: { fontSize: '0.95rem' }, body2: { fontSize: '0.85rem' }, caption: { fontSize: '0.75rem' } } } // Refined typography sizes/weights
        }
    });

    // Effect to fetch data on initial load and refresh
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setCalculatingFlips(true); // Set calculating state while fetching
            try {
                const [mappingResponse, fiveMinResponse, latestResponse, hourlyResponse] = await Promise.all([
                    fetch(MAPPING_URL),
                    fetch(FIVE_MINUTE_URL),
                    fetch(LATEST_PRICES_URL),
                    fetch(HOURLY_AVG_URL),
                ]);

                if (!mappingResponse.ok || !fiveMinResponse.ok || !latestResponse.ok || !hourlyResponse.ok) {
                    throw new Error("Failed to fetch all data");
                }

                const [mappingData, fiveMinData, latestData, hourlyData] = await Promise.all([
                    mappingResponse.json(),
                    fiveMinResponse.json(),
                    latestResponse.json(),
                    hourlyResponse.json(),
                ]);

                // Filter out items without GE limits or other essential properties if needed
                const filteredMapping = mappingData.filter(item => item && item.limit !== undefined && item.name && item.id !== undefined && item.icon);

                setMapping(filteredMapping);
                setFiveMin(fiveMinData.data);
                setLatestPrices(latestData.data);
                setHourlyPrices(hourlyData.data);

                setLastUpdate(Date.now()); // Record update time
            } catch (error) {
                console.error('Error fetching data:', error);
                // Optionally set an error state to display to the user
            } finally {
                setLoading(false);
                // calculatingFlips state will be turned off after the flip calculation effect runs
            }
        };

        fetchData(); // Call fetchData when refreshKey changes or on mount
    }, [refreshKey]); // Dependency array includes refreshKey

    // Effect to calculate flips when data or budget change
    useEffect(() => {
        // Ensure all necessary data is loaded before calculating flips
        if (!mapping.length || !Object.keys(fiveMin).length || !Object.keys(latestPrices).length || !Object.keys(hourlyPrices).length || loading) {
            //console.log("Waiting for data to calculate flips...");
            setFlips([]); // Clear flips if data is not ready or loading
            return;
        }

        setCalculatingFlips(true); // Indicate that calculation is starting

        // Wrap calculation in a timeout to avoid blocking UI if it's very slow
        const calculationTimeout = setTimeout(() => {
            try {
                // Calculate the optimal risk based on current data and budget
                const risk = getOptimalRisk(mapping, fiveMin, latestPrices, hourlyPrices, budget);
                setAutoRisk(risk); // Set the auto-calculated risk

                // Calculate suggestions for all items based on the optimal risk
                let suggestions = mapping
                    .map(item => calculateTradeMetrics(item, fiveMin, latestPrices, hourlyPrices, budget, risk))
                    .filter(Boolean) // Remove null results (items that didn't meet criteria)
                    // Sort the suggestions based on the chosen criteria
                    .sort((a, b) => {
                        // Sort by totalProfit descending first
                        const profitDiff = b.totalProfit - a.totalProfit;
                        if (profitDiff !== 0) return profitDiff;

                        // If totalProfit is the same, use a secondary sort if needed (e.g., margin)
                        if (sortBy !== 'totalProfit') {
                            return b[sortBy] - a[sortBy];
                        }

                        return 0; // No secondary sort if sorting by totalProfit
                    })
                    .slice(0, MAX_FLIP_SUGGESTIONS); // Limit to top suggestions

                setFlips(suggestions); // Update the list of suggested flips
                console.log(`Calculated ${suggestions.length} flips with optimal risk ${risk}`);

            } catch (error) {
                console.error('Error calculating flips:', error);
                setFlips([]); // Clear flips on calculation error
            } finally {
                setCalculatingFlips(false); // Calculation finished
            }
        }, 50); // Small delay to let UI update loading state

        return () => clearTimeout(calculationTimeout); // Clean up timeout on dependency change

    }, [mapping, fiveMin, latestPrices, hourlyPrices, budget, sortBy, loading]); // Dependencies for recalculation

    // Effect to update the "time since last update" display every minute
    useEffect(() => {
        const interval = setInterval(() => {
            // Trigger a state update to re-render the time format
            setLastUpdate(Date.now()); // Update to current time to force re-render
        }, 60000); // Update every 60 seconds (1 minute)

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, []); // Empty dependency array means this runs once on mount and cleans up on unmount


    // --- JSX Rendering ---
    return (
        <ThemeProvider theme={muiTheme}>
            <StyledEngineProvider injectFirst>
                <CssBaseline />
                <div className="min-h-screen bg-gray-100 py-8 px-4 lg:px-8"> {/* Added horizontal padding */}
                    <Container maxWidth="xl" disableGutters> {/* disableGutters to use padding from parent div */}
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Left Column: Budget, Search, Search Results */}
                            <div className="lg:w-1/3 space-y-6"> {/* Added space-y-6 for gap between left panels */}
                                {/* Budget Card */}
                                <Paper elevation={0} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                                    <Typography variant="h6" gutterBottom className="text-gray-800">
                                        Flipping Budget
                                    </Typography>
                                    <div className="flex items-end gap-2"> {/* Align items to bottom */}
                                        <div className="flex-1">
                                            <TextField
                                                fullWidth
                                                id="budget-input"
                                                label={`Enter budget (${budgetUnit})`}
                                                variant="outlined"
                                                value={budgetValue}
                                                onChange={(e) => handleBudgetChange(e.target.value, budgetUnit)}
                                                type="number"
                                                InputProps={{ inputProps: { min: 0.01, step: 0.1 } }}
                                                size="small" // Compact input
                                            />
                                        </div>
                                        <FormControl size="small" sx={{ width: '80px' }}> {/* Compact select */}
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
                                    <Typography variant="body2" className="text-green-700 font-medium mt-3"> {/* Adjusted margin */}
                                        Current Budget: {budget.toLocaleString()} gp
                                    </Typography>
                                </Paper>

                                {/* Search Card (Made Sticky) */}
                                <div className="sticky top-4 z-10 bg-gray-100 pb-4 -mb-4 lg:top-8"> {/* Sticky container with padding/negative margin to create visual separation */}
                                    <Paper elevation={0} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                                        <Typography variant="h6" gutterBottom className="text-gray-800">
                                            Item Price Search
                                        </Typography>
                                        <div className="space-y-4">
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
                                                size="small" // Compact input
                                                disabled={loading || calculatingFlips} // Disable search while loading
                                            />
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                color="primary"
                                                onClick={handleSearch}
                                                disabled={!searchQuery.trim() || loading || calculatingFlips} // Disable button appropriately
                                            >
                                                Search
                                            </Button>
                                        </div>
                                    </Paper>
                                </div>


                                {/* Search Results Container (Scrollable) */}
                                {/* Added flex-grow to ensure this takes up available space below sticky search */}
                                {/* Added max-h and overflow to make it scrollable */}
                                <div className="max-h-[60vh] lg:max-h-[calc(100vh-280px)] overflow-y-auto pr-2 -mr-2 space-y-4"> {/* Added padding/negative margin for scrollbar */}
                                    {loading ? (
                                        <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight="150px">
                                            <CircularProgress size={24} sx={{ color: muiTheme.palette.primary.main }} />
                                        </Box>
                                    ) : (
                                        <>
                                            {searchResults !== null && ( // Only show header if search has been performed
                                                <Typography variant="subtitle1" gutterBottom className="text-gray-800 font-semibold mt-4">
                                                    Search Results {searchResults ? `(${searchResults.length})` : ''}
                                                </Typography>
                                            )}
                                            <SearchResults
                                                results={searchResults}
                                                getWikiLink={getWikiLink}
                                                formatTimeSince={formatTimeSince}
                                            />
                                        </>
                                    )}
                                </div>

                            </div>

                            {/* Right Column: Recommended Flips */}
                            <div className="lg:w-2/3 space-y-6"> {/* Added space-y-6 for gap between right panels */}
                                {/* Auto Risk & Refresh Card */}
                                <Paper elevation={0} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <Typography variant="h6" className="text-gray-800">
                                            Optimal Risk Level
                                        </Typography>
                                        <Typography variant="body1" className="text-gray-700 mt-1">
                                            Calculated Risk: <span className="font-bold text-green-800">{autoRisk.toFixed(2)}</span>
                                        </Typography>
                                        <Typography variant="body2" className="text-gray-500 mt-1">
                                            Based on your budget and current market data.
                                        </Typography>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0">
                                        <div className="text-sm text-gray-600 italic flex-shrink-0">
                                            Updated: {formatTimeSince(lastUpdate)}
                                        </div>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => setRefreshKey(prev => prev + 1)} // Refresh data
                                            disabled={loading || calculatingFlips} // Disable while loading
                                        >
                                            {loading ? <CircularProgress size={20} color="inherit" /> : 'Refresh Data'}
                                        </Button>
                                    </div>
                                </Paper>

                                {/* Flips List */}
                                <section className="osrs-flips-list space-y-4" aria-live="polite">
                                    <Typography variant="h6" gutterBottom className="text-gray-800">
                                        Recommended Flips
                                    </Typography>
                                    {calculatingFlips ? (
                                        <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight="200px">
                                            <CircularProgress size={30} sx={{ color: muiTheme.palette.primary.main }} />
                                            <Typography variant="body1" className="ml-3 text-gray-600">Calculating flips...</Typography>
                                        </Box>
                                    ) : (
                                        flips.length === 0 ? (
                                            <p className="text-center text-gray-500 italic py-8">No profitable flips found matching criteria. Try adjusting your budget or refresh data.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Reduced gap slightly */}
                                                {flips.map(flip => (
                                                    <FlipCard key={flip.id} flip={flip} />
                                                ))}
                                            </div>
                                        )
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
