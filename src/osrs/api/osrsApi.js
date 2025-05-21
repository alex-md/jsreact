// /osrs/api/osrsApi.js
import { MAPPING_URL, FIVE_MINUTE_URL, LATEST_PRICES_URL, HOURLY_AVG_URL } from '../constants/apiEndpoints';

const fetchData = async (url, errorMessage) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`${errorMessage} failed: ${response.status} ${response.statusText}`);
    }
    const jsonData = await response.json();
    return jsonData.data ?? jsonData; // Handle mapping vs price data structure
};

export const fetchMapping = () => fetchData(MAPPING_URL, 'Mapping fetch');
export const fetchFiveMinPrices = () => fetchData(FIVE_MINUTE_URL, '5m fetch');
export const fetchLatestPrices = () => fetchData(LATEST_PRICES_URL, 'Latest fetch');
export const fetchHourlyPrices = () => fetchData(HOURLY_AVG_URL, 'Hourly fetch');

export const fetchAllData = async () => {
    try {
        const [mappingData, fiveMinData, latestData, hourlyData] = await Promise.all([
            fetchMapping(),
            fetchFiveMinPrices(),
            fetchLatestPrices(),
            fetchHourlyPrices(),
        ]);

        // Basic validation/filtering for mapping data
        const filteredMapping = mappingData.filter(item =>
            item &&
            typeof item.id === 'number' &&
            typeof item.name === 'string' && item.name &&
            typeof item.limit === 'number' &&
            typeof item.icon === 'string' && item.icon
        );

        return {
            mapping: filteredMapping,
            fiveMin: fiveMinData ?? {},
            latestPrices: latestData ?? {},
            hourlyPrices: hourlyData ?? {},
        };
    } catch (error) {
        console.error("Error fetching all OSRS data:", error);
        throw error; // Re-throw error to be handled by the caller
    }
};
