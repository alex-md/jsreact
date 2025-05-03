import { useState, useEffect, useCallback } from 'react';
import { fetchAllData } from '../api/osrsApi';

export const useOsrsData = () => {
    const [mapping, setMapping] = useState([]);
    const [fiveMin, setFiveMin] = useState({});
    const [latestPrices, setLatestPrices] = useState({});
    const [hourlyPrices, setHourlyPrices] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0); // Trigger fetches

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        // Reset search results on refresh? Maybe not here, depends on desired UX
        // setSellSearchResults(null);
        // setBuySearchResults(null);
        try {
            const data = await fetchAllData();
            setMapping(data.mapping);
            setFiveMin(data.fiveMin);
            setLatestPrices(data.latestPrices);
            setHourlyPrices(data.hourlyPrices);
            setLastUpdate(Date.now());
        } catch (err) {
            setError(err.message || 'Failed to fetch OSRS data');
            // Keep potentially stale data or clear it? Keeping for now.
            // setMapping([]); setFiveMin({}); ... etc.
        } finally {
            setLoading(false);
        }
    }, []); // No dependencies needed for the fetch function itself

    // Effect to fetch data on mount and when refreshKey changes
    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);

    // Effect to update 'lastUpdate' display periodically without refetching
    useEffect(() => {
        const interval = setInterval(() => {
            setLastUpdate((prev) => prev); // Trigger re-render without changing value
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);


    const refreshData = useCallback(() => {
        setRefreshKey((prev) => prev + 1);
    }, []);

    return {
        mapping,
        fiveMin,
        latestPrices,
        hourlyPrices,
        loading,
        error,
        lastUpdate,
        refreshData, // Expose function to trigger refresh
    };
};
