import { useState, useEffect, useMemo } from 'react';
import { getStableFlipSuggestions } from '../utils/stableFlipper';

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
            setFlips([]);
            setCalculatingFlips(false);
            return;
        }

        let active = true;
        setCalculatingFlips(true);

        const params = {
            total_cash_stack: budget,
            max_item_allocation_pct: 0.25,
            min_roi_threshold: 0.005,
            min_daily_volume: 50000,
        };

        getStableFlipSuggestions(mapping, fiveMin, latestPrices, hourlyPrices, params)
            .then(result => { if (active) setFlips(result); })
            .catch(err => {
                console.error('Error calculating flips:', err);
                if (active) setFlips([]);
            })
            .finally(() => { if (active) setCalculatingFlips(false); });

        return () => { active = false; };

    }, [hasData, mapping, fiveMin, latestPrices, hourlyPrices, budget]);

    return {
        flips,
        calculatingFlips,
        hasData
    };
};

