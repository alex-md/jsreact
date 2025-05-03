import { useState, useEffect, useMemo } from 'react';
import { getOptimalRisk, calculateTradeMetrics } from '../utils/calculations';

export const useFlipCalculation = (
    mapping,
    fiveMin,
    latestPrices,
    hourlyPrices,
    budget,
    isDataLoading // Pass loading state from useOsrsData
) => {
    const [flips, setFlips] = useState([]);
    const [calculatingFlips, setCalculatingFlips] = useState(false);
    const [autoRisk, setAutoRisk] = useState(0.2); // Default risk

    const hasData = useMemo(() =>
        !isDataLoading &&
        mapping.length > 0 &&
        Object.keys(fiveMin).length > 0 &&
        Object.keys(latestPrices).length > 0 &&
        Object.keys(hourlyPrices).length > 0,
        [isDataLoading, mapping, fiveMin, latestPrices, hourlyPrices]
    );

    useEffect(() => {
        if (!hasData) {
            // Ensure flips are cleared if data becomes unavailable or is loading
            setFlips([]);
            setCalculatingFlips(false);
            return;
        }

        setCalculatingFlips(true);

        // Use setTimeout to allow UI to update before potentially heavy calculation
        const calculationTimeout = setTimeout(() => {
            try {
                // 1. Calculate Optimal Risk
                const optimalRisk = getOptimalRisk(mapping, fiveMin, latestPrices, hourlyPrices, budget);
                setAutoRisk(optimalRisk);

                // 2. Calculate Flips based on optimal risk
                const suggestions = mapping
                    .map(item => calculateTradeMetrics(item, fiveMin, latestPrices, hourlyPrices, budget, optimalRisk))
                    .filter(Boolean) // Remove nulls
                    .sort((a, b) => (b.flipScore ?? 0) - (a.flipScore ?? 0)) // Sort by score
                    .slice(0, 20); // Limit to top N

                setFlips(suggestions);

            } catch (error) {
                console.error("Error calculating flips:", error);
                setFlips([]); // Clear flips on error
            } finally {
                setCalculatingFlips(false);
            }
        }, 50); // Small delay (50ms)

        // Cleanup function to clear timeout if dependencies change before it runs
        return () => clearTimeout(calculationTimeout);

    }, [hasData, mapping, fiveMin, latestPrices, hourlyPrices, budget]); // Rerun when data or budget changes

    return {
        flips,
        calculatingFlips,
        autoRisk,
        hasData // Expose hasData flag for conditional rendering in parent
    };
};

