import { TIMESERIES_URL } from '../constants/apiEndpoints';
import { getWikiLink } from './helpers';

// Cache for item price histories to avoid duplicate requests within a session
const historyCache = new Map();

// Fetch 14-day price history for an item with caching
async function fetchPriceHistory(itemId) {
    if (historyCache.has(itemId)) return historyCache.get(itemId);
    try {
        const res = await fetch(TIMESERIES_URL(itemId));
        if (!res.ok) {
            historyCache.set(itemId, []);
            return [];
        }
        const json = await res.json();
        const data = json?.data ?? [];
        historyCache.set(itemId, data);
        return data;
    } catch (err) {
        console.error('History fetch failed', err);
        historyCache.set(itemId, []);
        return [];
    }
}

function calculateStats(points) {
    if (!points.length) return null;
    const prices = points
        .map(p => {
            const high = p.avgHighPrice;
            const low = p.avgLowPrice;
            if (typeof high === 'number' && typeof low === 'number') {
                return (high + low) / 2;
            }
            return null;
        })
        .filter(Boolean);
    if (prices.length < 2) return null;
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
    return { mean, stdDev: Math.sqrt(variance) };
}

export async function getStableFlipSuggestions(mapping, fiveMin, latest, hourly, params) {
    const {
        total_cash_stack,
        max_item_allocation_pct = 0.25,
        min_roi_threshold = 0.005,
        min_daily_volume = 50000,
    } = params;
    const maxCapitalPerItem = total_cash_stack * max_item_allocation_pct;

    // Phase 1: cheap pre-filter without history requests
    const preCandidates = [];
    for (const item of mapping) {
        const latestItem = latest?.[item.id];
        const fiveItem = fiveMin?.[item.id];
        const hourlyItem = hourly?.[item.id];
        if (!latestItem || !fiveItem || !hourlyItem) continue;

        const basePrice = latestItem.low ?? hourlyItem.avgLowPrice;
        if (typeof basePrice !== 'number') continue;

        const estDailyVol = ((fiveItem.highPriceVolume ?? 0) + (fiveItem.lowPriceVolume ?? 0)) / 2 * 288;
        if (estDailyVol < min_daily_volume) continue;
        if (basePrice > maxCapitalPerItem / 10) continue;
        if (basePrice < 100) continue;

        preCandidates.push({ item, latestItem, fiveItem, hourlyItem, estDailyVol });
    }

    // Prioritize high volume items and cap history fetches
    preCandidates.sort((a, b) => b.estDailyVol - a.estDailyVol);
    const limitedCandidates = preCandidates.slice(0, 50);

    const flips = [];
    const batchSize = 10; // Limit concurrent history requests

    for (let i = 0; i < limitedCandidates.length && flips.length < 10; i += batchSize) {
        const slice = limitedCandidates.slice(i, i + batchSize);
        const results = await Promise.all(slice.map(async c => {
            const history = await fetchPriceHistory(c.item.id);
            const last14 = history.slice(-24 * 14);
            const stats = calculateStats(last14);
            if (!stats) return null;
            const { mean, stdDev } = stats;
            if (stdDev <= mean * 0.001) return null;
            if ((c.latestItem.high ?? 0) > mean + 2.5 * stdDev) return null;
            if ((c.latestItem.low ?? Infinity) < mean - 2.5 * stdDev) return null;

            const topBuy = c.latestItem.low ?? c.hourlyItem.avgLowPrice;
            const bottomSell = c.latestItem.high ?? c.hourlyItem.avgHighPrice;
            if (typeof topBuy !== 'number' || typeof bottomSell !== 'number') return null;

            const buyPrice = topBuy + 1;
            const sellPrice = bottomSell - 1;
            const grossMargin = sellPrice - buyPrice;
            const geTax = Math.floor(sellPrice * 0.02);
            const profitPer = grossMargin - geTax;
            const roi = profitPer / buyPrice;
            if (profitPer <= 0 || roi < min_roi_threshold) return null;

            const qty = Math.min(Math.floor(maxCapitalPerItem / buyPrice), c.item.limit || Infinity);
            if (qty <= 0) return null;

            const totalProfit = profitPer * qty;
            const avgHourlyVol = ((c.fiveItem.highPriceVolume ?? 0) + (c.fiveItem.lowPriceVolume ?? 0)) / 2 * 12;
            const pvs = profitPer * avgHourlyVol;

            return {
                id: c.item.id,
                name: c.item.name,
                icon: c.item.icon,
                limit: c.item.limit,
                buyPrice,
                sellPrice,
                taxedSell: sellPrice - geTax,
                profitPer,
                maxQty: qty,
                totalProfit,
                margin: profitPer / buyPrice,
                volatility: stdDev / mean,
                trend: (c.latestItem.high ?? 0) > mean ? 'up' : 'down',
                fiveMinHighVolume: c.fiveItem.highPriceVolume ?? 0,
                fiveMinLowVolume: c.fiveItem.lowPriceVolume ?? 0,
                pvs,
                wiki: getWikiLink(c.item.name),
            };
        }));

        for (const r of results) {
            if (r) flips.push(r);
        }
    }

    const maxPvs = Math.max(...flips.map(f => f.pvs), 1);
    flips.forEach(f => {
        f.flipScore = Math.round((f.pvs / maxPvs) * 100);
    });
    flips.sort((a, b) => b.pvs - a.pvs);
    return flips.slice(0, 10);
}

