import React, { useEffect, useState, useMemo } from 'react';
import { Paper, TextField, Typography, FormControl, InputLabel, Select, MenuItem, Button, createTheme, ThemeProvider, Box, Container, CssBaseline, CircularProgress, Divider } from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
let API_BASE = 'https://prices.runescape.wiki/api/v1/osrs', MAPPING_URL = `${API_BASE}/mapping`, LATEST_PRICES_URL = `${API_BASE}/latest`, HOURLY_AVG_URL = `${API_BASE}/1h`, FIVE_MINUTE_URL = `${API_BASE}/5m`;
function analyzePriceVolatility(itemId, latest, hourly) {
    if (!latest?.[itemId] || !hourly?.[itemId]) return null;
    let latestData = latest[itemId], hourlyData = hourly[itemId];
    return hourlyData.avgHighPrice && hourlyData.avgLowPrice && 0 !== hourlyData.avgLowPrice ? {
        volatility: (hourlyData.avgHighPrice - hourlyData.avgLowPrice) / hourlyData.avgLowPrice,
        trend: latestData.high > hourlyData.avgHighPrice ? 'up' : 'down'
    } : null;
}
function calculatePriceVariance(priceHistory, lambda = 0.94) {
    if (!priceHistory || priceHistory.length < 2) return null;
    let returns = [];
    for (let i = 1; i < priceHistory.length; i++)0 !== priceHistory[i - 1] && priceHistory[i - 1] && returns.push((priceHistory[i] - priceHistory[i - 1]) / priceHistory[i - 1]);
    if (0 === returns.length) return null;
    let variance = 0, weightSum = 0;
    return returns.forEach((ret, i) => {
        let weight = Math.pow(lambda, returns.length - i - 1);
        variance += weight * ret * ret, weightSum += weight;
    }), weightSum > 0 ? variance / weightSum : null;
}
function calculateModifiedSharpeRatio(expectedProfit, variance, riskFreeRate = 0.02 / 365) {
    if (null == variance || 0 === variance) return null;
    let profit = Number(expectedProfit);
    if (isNaN(profit)) return null;
    let stdDev = Math.sqrt(variance);
    return 0 === stdDev ? null : profit / stdDev - riskFreeRate;
}
function calculateConfidenceScore(item, fiveMin, latest, hourly) {
    let weights = {
        volumeStability: 0.25,
        priceConsistency: 0.25,
        marketDepth: 0.20,
        trendStrength: 0.15,
        volatilityPenalty: 0.15
    }, scores = {}, fiveMinItem = fiveMin?.[item.id], latestItem = latest?.[item.id], hourlyItem = hourly?.[item.id];
    if (!fiveMinItem || !latestItem || !hourlyItem) return {
        confidenceScore: 0,
        componentScores: {}
    };
    let volumes = [
        fiveMinItem.lowPriceVolume,
        fiveMinItem.highPriceVolume
    ].filter((v) => null != v);
    if (volumes.length < 2 || volumes.some((v) => v < 0)) scores.volumeStability = 0;
    else {
        let volumeMean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
        0 === volumeMean ? scores.volumeStability = 0 : scores.volumeStability = Math.max(0, Math.min(1, 1 - Math.sqrt(volumes.reduce((a, b) => a + Math.pow(b - volumeMean, 2), 0) / volumes.length) / volumeMean));
    }
    let prices = [
        latestItem.high,
        latestItem.low,
        fiveMinItem.avgHighPrice,
        fiveMinItem.avgLowPrice,
        hourlyItem.avgHighPrice,
        hourlyItem.avgLowPrice
    ].filter((p) => null != p && p > 0);
    if (prices.length < 3) scores.priceConsistency = 0;
    else {
        let priceMean = prices.reduce((a, b) => a + b, 0) / prices.length;
        0 === priceMean ? scores.priceConsistency = 0 : scores.priceConsistency = Math.max(0, Math.min(1, 1 - Math.sqrt(prices.reduce((a, b) => a + Math.pow(b - priceMean, 2), 0) / prices.length) / priceMean));
    }
    scores.marketDepth = Math.min(1, Math.max(0, Math.min((fiveMinItem.lowPriceVolume ?? 0) / 50, (fiveMinItem.highPriceVolume ?? 0) / 50) / 10));
    let shortTermTrend = 0;
    fiveMinItem.avgHighPrice > 0 && (shortTermTrend = (latestItem.high - fiveMinItem.avgHighPrice) / fiveMinItem.avgHighPrice);
    let longTermTrend = 0;
    hourlyItem.avgHighPrice > 0 && (longTermTrend = (fiveMinItem.avgHighPrice - hourlyItem.avgHighPrice) / hourlyItem.avgHighPrice), scores.trendStrength = Math.min(1, Math.abs(shortTermTrend + longTermTrend) / 2);
    let variance = calculatePriceVariance([
        hourlyItem.avgHighPrice,
        fiveMinItem.avgHighPrice,
        latestItem.high
    ].filter((p) => null != p));
    return scores.volatilityPenalty = null !== variance ? Math.max(0, Math.min(1, 1 - 5 * variance)) : 0.5, {
        confidenceScore: Math.max(0, Math.min(1, Object.keys(weights).reduce((score, factor) => {
            let componentScore = scores[factor];
            return score + ('number' != typeof componentScore || isNaN(componentScore) ? 0 : componentScore * weights[factor]);
        }, 0))),
        componentScores: scores
    };
}
function calculateRiskAdjustedReturn(expectedProfit, variance, riskAversionCoeff = 2.0) {
    return null == variance || isNaN(Number(expectedProfit)) ? null : Number(expectedProfit) - riskAversionCoeff / 2 * variance;
}
function calculateFlipScore(flip) {
    let weights = {
        profitScore: 0.30,
        sharpeScore: 0.20,
        confidenceScore: 0.20,
        volumeScore: 0.15,
        marginScore: 0.10,
        varianceScore: 0.05
    }, scores = {
        profitScore: Math.max(0, Math.min(1, Math.log10(Math.max(flip.totalProfit, 1)) / Math.log10(1e8))),
        sharpeScore: null !== flip.sharpeRatio ? Math.max(0, Math.min(1, flip.sharpeRatio / 2)) : 0,
        confidenceScore: flip.confidenceScore ?? 0,
        volumeScore: Math.min(1, ((flip.fiveMinLowVolume ?? 0) + (flip.fiveMinHighVolume ?? 0)) / 1000),
        marginScore: Math.min(1, Math.max(0, (flip.margin ?? 0) * 5)),
        varianceScore: null !== flip.variance ? Math.max(0, Math.min(1, 1 - 10 * flip.variance)) : 0.5
    }, totalScore = 0;
    for (let metric in weights) {
        let scoreValue = scores[metric];
        'number' != typeof scoreValue || isNaN(scoreValue) || (totalScore += scoreValue * weights[metric]);
    }
    return Math.round(100 * Math.max(0, Math.min(1, totalScore)));
}
function calculateTradeMetrics(item, fiveMinData, latestData, hourlyData, budget, risk) {
    if (!fiveMinData?.[item.id] || !latestData?.[item.id] || !hourlyData?.[item.id]) return null;
    let fiveMinItemData = fiveMinData[item.id], latestItemData = latestData[item.id], hourlyItemData = hourlyData[item.id], volatilityAnalysis = analyzePriceVolatility(item.id, latestData, hourlyData);
    if (!volatilityAnalysis) return null;
    let { avgHighPrice: fiveMinAvgHigh, avgLowPrice: fiveMinAvgLow, highPriceVolume: fiveMinHighVolume = 0, lowPriceVolume: fiveMinLowVolume = 0 } = fiveMinItemData;
    if ([
        fiveMinAvgHigh,
        fiveMinAvgLow,
        latestItemData.high,
        latestItemData.low,
        hourlyItemData.avgHighPrice,
        hourlyItemData.avgLowPrice
    ].some((p) => 'number' != typeof p || p <= 0) || fiveMinHighVolume < 50 || fiveMinLowVolume < 50) return null;
    let weightedBuyPrice = Math.floor(0.5 * fiveMinAvgLow + 0.3 * latestItemData.low + 0.2 * hourlyItemData.avgLowPrice), weightedSellPrice = Math.floor(0.5 * fiveMinAvgHigh + 0.3 * latestItemData.high + 0.2 * hourlyItemData.avgHighPrice);
    if (weightedBuyPrice <= 0 || weightedSellPrice <= 0) return null;
    let taxedSell = Math.floor(0.99 * weightedSellPrice), profitPer = taxedSell - weightedBuyPrice;
    if (profitPer <= 0 || weightedBuyPrice > budget) return null;
    let volatilityFactor = Math.max(0.1, 1 - 2 * volatilityAnalysis.volatility), suggestedQty = Math.floor(Math.min(Math.floor(budget / weightedBuyPrice), Math.max(1, 3 * fiveMinLowVolume), 'number' == typeof item.limit && item.limit > 0 ? item.limit : 1 / 0));
    if (suggestedQty <= 0) return null;
    let totalProfit = profitPer * suggestedQty, margin = profitPer / weightedBuyPrice;
    if (margin * volatilityFactor < risk) return null;
    let variance = calculatePriceVariance([
        hourlyItemData.avgHighPrice,
        fiveMinAvgHigh,
        latestItemData.high
    ].filter((p) => 'number' == typeof p)), sharpeRatio = calculateModifiedSharpeRatio(profitPer, variance), { confidenceScore, componentScores } = calculateConfidenceScore(item, fiveMinData, latestData, hourlyData), riskAdjustedReturn = calculateRiskAdjustedReturn(profitPer, variance);
    if (confidenceScore < 0.6 || null !== sharpeRatio && sharpeRatio < 0.1) return null;
    let flipScore = calculateFlipScore({
        id: item.id,
        name: item.name,
        totalProfit,
        profitPer,
        buyPrice: weightedBuyPrice,
        sellPrice: weightedSellPrice,
        margin,
        maxQty: suggestedQty,
        sharpeRatio,
        confidenceScore,
        fiveMinLowVolume,
        fiveMinHighVolume,
        variance,
        volatility: volatilityAnalysis.volatility,
        trend: volatilityAnalysis.trend,
        riskAdjustedReturn,
        componentScores
    });
    return {
        ...item,
        wiki: getWikiLink(item.name),
        buyPrice: weightedBuyPrice,
        sellPrice: weightedSellPrice,
        taxedSell,
        profitPer,
        maxQty: suggestedQty,
        totalProfit,
        margin,
        volatility: volatilityAnalysis.volatility,
        trend: volatilityAnalysis.trend,
        fiveMinHighVolume,
        fiveMinLowVolume,
        variance,
        sharpeRatio,
        confidenceScore,
        componentScores,
        riskAdjustedReturn,
        flipScore
    };
}
function getOptimalRisk(mapping, fiveMin, latest, hourly, budget) {
    let evaluatedRisks = [], baseRiskLevels = [];
    for (let r = 0.01; r <= 0.1; r += 0.005)baseRiskLevels.push(r);
    for (let r = 0.11; r <= 0.3; r += 0.01)baseRiskLevels.push(r);
    for (let r = 0.31; r <= 0.5; r += 0.02)baseRiskLevels.push(r);
    return (baseRiskLevels.forEach((risk) => {
        let flips = mapping.map((item) => calculateTradeMetrics(item, fiveMin, latest, hourly, budget, risk)).filter(Boolean).sort((a, b) => b.flipScore - a.flipScore).slice(0, 20);
        if (flips.length > 0) {
            let totalProfit = flips.reduce((acc, f) => acc + f.totalProfit, 0), utilityScore = totalProfit / Math.sqrt(flips.reduce((acc, f) => acc + f.volatility, 0) / flips.length + 0.001);
            evaluatedRisks.push({
                risk,
                utilityScore,
                numFlips: flips.length,
                avgProfit: totalProfit / flips.length
            });
        } else evaluatedRisks.push({
            risk,
            utilityScore: -1 / 0,
            numFlips: 0,
            avgProfit: 0
        });
    }), 0 === evaluatedRisks.length || evaluatedRisks.every((r) => r.utilityScore === -1 / 0)) ? 0.2 : (evaluatedRisks.sort((a, b) => b.utilityScore - a.utilityScore), parseFloat(evaluatedRisks[0].risk.toFixed(3)));
}
function getWikiLink(name) {
    return `https://oldschool.runescape.wiki/w/Exchange:${encodeURIComponent(name.replace(/ /g, '_'))}`;
}
function formatTimeSince(timestamp) {
    if (!timestamp) return 'never';
    let seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds} seconds ago`;
    let minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${1 !== minutes ? 's' : ''} ago`;
    let hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${1 !== hours ? 's' : ''} ago`;
    let days = Math.floor(hours / 24);
    return days < 7 ? `${days} day${1 !== days ? 's' : ''} ago` : 'over a week ago';
}
function formatGrandExchangePrice(price) {
    return null == price || 'number' != typeof price ? '-' : price >= 10000000 ? (price / 1000000).toFixed(1) + 'M' : price >= 10000 ? (price / 1000).toFixed(1) + 'K' : price.toLocaleString();
}
let SellSearchResults = ({ results, getWikiLink, formatTimeSince, formatPrice }) => null === results ? null : 0 === results.length ? React.createElement("div", {
    className: "p-4 text-gray-500 italic text-center"
}, "No items found matching your sell search query or with sufficient price data.") : React.createElement("div", {
    className: "space-y-3"
}, results.map((item) => React.createElement("a", {
    key: `${item.id}-sell`,
    href: getWikiLink(item.name),
    target: "_blank",
    rel: "noopener noreferrer",
    className: "block bg-white rounded-lg border border-gray-100 p-4 hover:shadow-sm transition-shadow duration-200 group"
}, React.createElement("div", {
    className: "flex justify-between items-start mb-2"
}, React.createElement(Typography, {
    variant: "subtitle1",
    className: "font-medium text-green-700 group-hover:underline truncate pr-2"
}, item.name), React.createElement(Typography, {
    variant: "caption",
    className: "text-gray-500 flex-shrink-0"
}, formatTimeSince(item.timestamp))), React.createElement("div", {
    className: "bg-green-50 rounded-md p-2 mb-3"
}, React.createElement("div", {
    className: "flex justify-between items-center mb-1"
}, React.createElement(Typography, {
    variant: "caption",
    className: "text-gray-600 block"
}, "Recommended Insta-sell"), React.createElement("div", {
    className: "flex items-center gap-1"
}, React.createElement("div", {
    className: `h-2 w-2 rounded-full ${item.confidence >= 0.8 ? 'bg-green-500' : item.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-orange-500'}`,
    title: `Confidence: ${Math.round(100 * item.confidence)}%`
}), React.createElement(Typography, {
    variant: "caption",
    className: "text-gray-500"
}, Math.round(100 * item.confidence), "% conf."))), React.createElement(Typography, {
    variant: "body1",
    className: "font-bold text-green-800"
}, formatPrice(item.weightedHighPrice), " gp"), React.createElement("div", {
    className: "flex items-center gap-2 mt-1"
}, React.createElement(Typography, {
    variant: "caption",
    className: `${'rising' === item.momentum ? 'text-green-600' : 'falling' === item.momentum ? 'text-red-600' : 'text-gray-600'}`
}, 'rising' === item.momentum ? '↑ Rising' : 'falling' === item.momentum ? '↓ Falling' : '→ Stable'), React.createElement(Typography, {
    variant: "caption",
    className: "text-gray-600"
}, "• Margin: ", (100 * item.suggestedMargin).toFixed(1), "%"))), React.createElement("div", {
    className: "grid grid-cols-3 gap-2 text-xs text-gray-700"
}, React.createElement("div", {
    className: "bg-gray-50 rounded-md p-1.5"
}, React.createElement(Typography, {
    variant: "caption",
    className: "block text-gray-600 truncate"
}, "Latest High"), React.createElement(Typography, {
    variant: "body2",
    className: "font-medium text-gray-900 truncate"
}, formatPrice(item.latestHigh))), React.createElement("div", {
    className: "bg-gray-50 rounded-md p-1.5"
}, React.createElement(Typography, {
    variant: "caption",
    className: "block text-gray-600 truncate"
}, "5m Avg High"), React.createElement(Typography, {
    variant: "body2",
    className: "font-medium text-gray-900 truncate"
}, formatPrice(item.fiveMinHigh))), React.createElement("div", {
    className: "bg-gray-50 rounded-md p-1.5"
}, React.createElement(Typography, {
    variant: "caption",
    className: "block text-gray-600 truncate"
}, "1h Avg High"), React.createElement(Typography, {
    variant: "body2",
    className: "font-medium text-gray-900 truncate"
}, formatPrice(item.hourlyHigh)))), React.createElement("div", {
    className: "mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600"
}, React.createElement("div", null, React.createElement("span", {
    className: "font-medium"
}, "Buy Vol (5m):"), " ", formatPrice(item.lowPriceVolume)), React.createElement("div", null, React.createElement("span", {
    className: "font-medium"
}, "Sell Vol (5m):"), " ", formatPrice(item.highPriceVolume)), React.createElement("div", {
    className: "col-span-2 mt-1"
}, React.createElement("span", {
    className: "font-medium"
}, "Market Stability:"), React.createElement("div", {
    className: "w-full bg-gray-200 rounded-full h-1.5 mt-1",
    title: `Stability: ${Math.round(100 * item.marketStability)}%`
}, React.createElement("div", {
    className: `h-1.5 rounded-full ${item.marketStability >= 0.8 ? 'bg-green-500' : item.marketStability >= 0.5 ? 'bg-yellow-500' : 'bg-orange-500'}`,
    style: {
        width: `${100 * item.marketStability}%`
    }
}))))))), BuySearchResults = ({ results, getWikiLink, formatTimeSince, formatPrice }) => null === results ? null : 0 === results.length ? React.createElement("div", {
    className: "p-4 text-gray-500 italic text-center"
}, "No items found matching your buy search query or with sufficient price data.") : React.createElement("div", {
    className: "space-y-3"
}, results.map((item) => React.createElement("a", {
    key: `${item.id}-buy`,
    href: getWikiLink(item.name),
    target: "_blank",
    rel: "noopener noreferrer",
    className: "block bg-white rounded-lg border border-gray-100 p-4 hover:shadow-sm transition-shadow duration-200 group"
}, React.createElement("div", {
    className: "flex justify-between items-start mb-2"
}, React.createElement(Typography, {
    variant: "subtitle1",
    className: "font-medium text-blue-700 group-hover:underline truncate pr-2"
}, item.name), React.createElement(Typography, {
    variant: "caption",
    className: "text-gray-500 flex-shrink-0"
}, formatTimeSince(item.timestamp))), React.createElement("div", {
    className: "bg-blue-50 rounded-md p-2 mb-3"
}, React.createElement("div", {
    className: "flex justify-between items-center mb-1"
}, React.createElement(Typography, {
    variant: "caption",
    className: "text-gray-600 block"
}, "Recommended Insta-buy"), React.createElement("div", {
    className: "flex items-center gap-1"
}, React.createElement("div", {
    className: `h-2 w-2 rounded-full ${item.confidence >= 0.8 ? 'bg-green-500' : item.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-orange-500'}`,
    title: `Confidence: ${Math.round(100 * item.confidence)}%`
}), React.createElement(Typography, {
    variant: "caption",
    className: "text-gray-500"
}, Math.round(100 * item.confidence), "% conf."))), React.createElement(Typography, {
    variant: "body1",
    className: "font-bold text-blue-800"
}, formatPrice(item.weightedLowPrice), " gp "), React.createElement("div", {
    className: "flex items-center gap-2 mt-1"
}, React.createElement(Typography, {
    variant: "caption",
    className: `${'rising' === item.buyMomentum ? 'text-green-600' : 'falling' === item.buyMomentum ? 'text-red-600' : 'text-gray-600'}`
}, 'rising' === item.buyMomentum ? '↑ Rising' : 'falling' === item.buyMomentum ? '↓ Falling' : '→ Stable', " (Buy Trend)"), React.createElement(Typography, {
    variant: "caption",
    className: "text-gray-600"
}, "• Volatility: ", (100 * item.volatility).toFixed(1), "%"))), React.createElement("div", {
    className: "grid grid-cols-3 gap-2 text-xs text-gray-700"
}, React.createElement("div", {
    className: "bg-gray-50 rounded-md p-1.5"
}, React.createElement(Typography, {
    variant: "caption",
    className: "block text-gray-600 truncate"
}, "Latest Low"), React.createElement(Typography, {
    variant: "body2",
    className: "font-medium text-gray-900 truncate"
}, formatPrice(item.latestLow))), React.createElement("div", {
    className: "bg-gray-50 rounded-md p-1.5"
}, React.createElement(Typography, {
    variant: "caption",
    className: "block text-gray-600 truncate"
}, "5m Avg Low"), React.createElement(Typography, {
    variant: "body2",
    className: "font-medium text-gray-900 truncate"
}, formatPrice(item.fiveMinLow))), React.createElement("div", {
    className: "bg-gray-50 rounded-md p-1.5"
}, React.createElement(Typography, {
    variant: "caption",
    className: "block text-gray-600 truncate"
}, "1h Avg Low"), React.createElement(Typography, {
    variant: "body2",
    className: "font-medium text-gray-900 truncate"
}, formatPrice(item.hourlyLow)))), React.createElement("div", {
    className: "mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600"
}, React.createElement("div", null, React.createElement("span", {
    className: "font-medium"
}, "Buy Vol (5m):"), " ", formatPrice(item.lowPriceVolume)), React.createElement("div", null, React.createElement("span", {
    className: "font-medium"
}, "Sell Vol (5m):"), " ", formatPrice(item.highPriceVolume)), React.createElement("div", {
    className: "col-span-2 mt-1"
}, React.createElement("span", {
    className: "font-medium"
}, "Market Stability:"), React.createElement("div", {
    className: "w-full bg-gray-200 rounded-full h-1.5 mt-1",
    title: `Stability: ${Math.round(100 * item.marketStability)}%`
}, React.createElement("div", {
    className: `h-1.5 rounded-full ${item.marketStability >= 0.8 ? 'bg-green-500' : item.marketStability >= 0.5 ? 'bg-yellow-500' : 'bg-orange-500'}`,
    style: {
        width: `${100 * item.marketStability}%`
    }
}))))))), FlipCard = ({ flip }) => {
    let volatilityColor = useMemo(() => flip.volatility ? flip.volatility > 0.15 ? 'text-red-600' : flip.volatility > 0.07 ? 'text-orange-600' : 'text-green-700' : 'text-gray-600', [
        flip.volatility
    ]);
    useMemo(() => flip.confidenceScore ? flip.confidenceScore >= 0.8 ? 'text-green-700' : flip.confidenceScore >= 0.6 ? 'text-yellow-600' : 'text-orange-600' : 'text-gray-600', [
        flip.confidenceScore
    ]), useMemo(() => null === flip.sharpeRatio || void 0 === flip.sharpeRatio ? 'text-gray-600' : flip.sharpeRatio >= 1.0 ? 'text-green-700' : flip.sharpeRatio >= 0.3 ? 'text-yellow-600' : 'text-orange-600', [
        flip.sharpeRatio
    ]);
    let flipScoreColor = useMemo(() => flip.flipScore ? flip.flipScore >= 80 ? 'text-green-700' : flip.flipScore >= 65 ? 'text-blue-600' : flip.flipScore >= 50 ? 'text-yellow-600' : 'text-orange-600' : 'text-gray-600', [
        flip.flipScore
    ]), formatPrice = formatGrandExchangePrice;
    return React.createElement("article", {
        className: "osrs-flip-card bg-white rounded-xl shadow-sm p-5 flex gap-4 items-start border border-gray-100 hover:shadow-md transition group relative"
    }, " ", React.createElement("div", {
        className: "absolute top-3 right-3 bg-gray-100 rounded-full px-3 py-1 flex items-center gap-1 shadow-sm"
    }, React.createElement(Typography, {
        variant: "caption",
        className: "text-gray-600 font-medium"
    }, "Score:"), React.createElement(Typography, {
        variant: "body2",
        className: `font-bold ${flipScoreColor}`
    }, flip.flipScore)), React.createElement("img", {
        src: `https://oldschool.runescape.wiki/images/${encodeURIComponent(flip.icon?.replace(/ /g, '_') ?? '')}`,
        alt: flip.name,
        width: 48,
        height: 48,
        className: "rounded-md bg-gray-100 border border-gray-200 flex-shrink-0 mt-1",
        loading: "lazy",
        onError: (e) => {
            e.target.style.display = 'none';
        }
    }), React.createElement("div", {
        className: "flex-1 min-w-0"
    }, " ", React.createElement("a", {
        href: flip.wiki,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "font-bold text-lg text-green-700 hover:underline truncate block pr-16",
        title: `View ${flip.name} on OSRS Wiki`
    }, flip.name), React.createElement("div", {
        className: "grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 mb-3"
    }, React.createElement("div", {
        className: "bg-green-50 rounded-md p-2"
    }, React.createElement(Typography, {
        variant: "caption",
        className: "block text-gray-600"
    }, "Total Profit"), React.createElement(Typography, {
        variant: "body1",
        className: "font-bold text-green-800 truncate"
    }, formatPrice(flip.totalProfit), " gp")), React.createElement("div", {
        className: "bg-blue-50 rounded-md p-2"
    }, React.createElement(Typography, {
        variant: "caption",
        className: "block text-gray-600"
    }, "Profit/Item"), React.createElement(Typography, {
        variant: "body1",
        className: "font-medium text-blue-800 truncate"
    }, formatPrice(flip.profitPer), " gp")), React.createElement("div", {
        className: "bg-yellow-50 rounded-md p-2"
    }, React.createElement(Typography, {
        variant: "caption",
        className: "block text-gray-600"
    }, "Quantity"), React.createElement(Typography, {
        variant: "body1",
        className: "font-medium text-yellow-800 truncate"
    }, formatPrice(flip.maxQty)))), React.createElement("div", {
        className: "flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700 mb-3"
    }, React.createElement("span", {
        title: "Estimated price to buy on GE"
    }, React.createElement("span", {
        className: "font-medium"
    }, "Buy:"), " ", formatPrice(flip.buyPrice), " gp"), React.createElement("span", {
        title: "Estimated price to sell on GE (before tax)"
    }, React.createElement("span", {
        className: "font-medium"
    }, "Sell:"), " ", formatPrice(flip.sellPrice), " gp"), React.createElement("span", {
        title: "Estimated price after GE tax"
    }, React.createElement("span", {
        className: "font-medium"
    }, "Taxed Sell:"), " ", formatPrice(flip.taxedSell), " gp")), React.createElement("div", {
        className: "flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600"
    }, React.createElement("span", {
        className: "flex items-center gap-1",
        title: "Profit margin as a percentage of the buy price"
    }, React.createElement("span", {
        className: "font-medium"
    }, "Margin:"), " ", React.createElement("b", {
        className: "text-purple-700"
    }, (100 * flip.margin).toFixed(2), "%")), React.createElement("span", {
        className: "flex items-center gap-1",
        title: "Buy volume (last 5 min)"
    }, React.createElement("span", {
        className: "font-medium"
    }, "Buy Vol (5m):"), " ", formatPrice(flip.fiveMinLowVolume)), React.createElement("span", {
        className: "flex items-center gap-1",
        title: "Sell volume (last 5 min)"
    }, React.createElement("span", {
        className: "font-medium"
    }, "Sell Vol (5m):"), " ", formatPrice(flip.fiveMinHighVolume)), React.createElement("span", {
        className: "flex items-center gap-1",
        title: `Volatility: ${(100 * flip.volatility).toFixed(1)}% (Higher value means more price fluctuation)`
    }, React.createElement("span", {
        className: "font-medium"
    }, "Volatility:"), " ", React.createElement("b", {
        className: volatilityColor
    }, (100 * flip.volatility).toFixed(1), "%")), React.createElement("span", {
        className: "flex items-center gap-1",
        title: "Price trend (latest high vs hourly average high)"
    }, React.createElement("span", {
        className: "font-medium"
    }, "Trend:"), React.createElement("b", {
        className: `${'up' === flip.trend ? 'text-green-700' : 'text-red-600'}`
    }, 'up' === flip.trend ? 'Rising' : 'Falling'), React.createElement("svg", {
        className: `w-3 h-3 flex-shrink-0 ${'up' === flip.trend ? 'text-green-600' : 'text-red-600'}`,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24"
    }, React.createElement("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: "2",
        d: 'up' === flip.trend ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'
    }))))));
};
export default function OSRSFlipper() {
    let [mapping, setMapping] = useState([]), [fiveMin, setFiveMin] = useState({}), [latestPrices, setLatestPrices] = useState({}), [hourlyPrices, setHourlyPrices] = useState({}), [flips, setFlips] = useState([]), [sellSearchQuery, setSellSearchQuery] = useState(''), [sellSearchResults, setSellSearchResults] = useState(null), [buySearchQuery, setBuySearchQuery] = useState(''), [buySearchResults, setBuySearchResults] = useState(null), [loading, setLoading] = useState(!0), [calculatingFlips, setCalculatingFlips] = useState(!1), [budget, setBudget] = useState(10000000), [budgetUnit, setBudgetUnit] = useState('M'), [budgetValue, setBudgetValue] = useState("10"), [refreshKey, setRefreshKey] = useState(0), [autoRisk, setAutoRisk] = useState(0.2), [lastUpdate, setLastUpdate] = useState(null), handleBudgetChange = (value, unit) => {
        let numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) return void setBudgetValue(value);
        setBudget(Math.floor(numValue * ('M' === unit ? 1000000 : 1000))), setBudgetValue(value), setBudgetUnit(unit);
    }, calculateSearchPriceBase = (itemId) => {
        let latest = latestPrices?.[itemId], fiveMinData = fiveMin?.[itemId], hourlyData = hourlyPrices?.[itemId];
        if (!latest || !fiveMinData || !hourlyData || 'number' != typeof latest.high || 'number' != typeof latest.low || 'number' != typeof fiveMinData.avgHighPrice || 'number' != typeof fiveMinData.avgLowPrice || 'number' != typeof hourlyData.avgHighPrice || 'number' != typeof hourlyData.avgLowPrice || hourlyData.avgLowPrice <= 0 || fiveMinData.avgLowPrice <= 0 || latest.low <= 0) return null;
        let highVol = fiveMinData.highPriceVolume ?? 0, lowVol = fiveMinData.lowPriceVolume ?? 0, totalVolume = highVol + lowVol;
        if (0 === totalVolume) return null;
        let volumeConfidence = Math.min(1, totalVolume / 250), validSpreads = [
            (latest.high - latest.low) / latest.low,
            (fiveMinData.avgHighPrice - fiveMinData.avgLowPrice) / fiveMinData.avgLowPrice,
            (hourlyData.avgHighPrice - hourlyData.avgLowPrice) / hourlyData.avgLowPrice
        ].filter((s) => isFinite(s)), marketStabilityFactor = Math.max(0.1, Math.min(1, 1 - 2 * (validSpreads.length > 0 ? validSpreads.reduce((a, b) => a + b, 0) / validSpreads.length : 0))), latestWeight = 0.5 * marketStabilityFactor * volumeConfidence, fiveMinWeight = 0.3 * (1 + volumeConfidence) / 2, hourlyWeight = Math.max(0, 1 - latestWeight - fiveMinWeight), volatility = (hourlyData.avgHighPrice - hourlyData.avgLowPrice) / hourlyData.avgLowPrice;
        return {
            latest,
            fiveMinData,
            hourlyData,
            latestWeight,
            fiveMinWeight,
            hourlyWeight,
            buyVolumeRatio: lowVol / totalVolume,
            sellVolumeRatio: highVol / totalVolume,
            volumeConfidence,
            marketStabilityFactor,
            volatility,
            highPriceVolume: highVol,
            lowPriceVolume: lowVol,
            timestamp: latest.timestamp ?? fiveMinData.timestamp ?? hourlyData.timestamp
        };
    }, calculateInstaSellPrice = (itemId) => {
        let baseData = calculateSearchPriceBase(itemId);
        if (!baseData) return null;
        let { latest, fiveMinData, hourlyData, latestWeight, fiveMinWeight, hourlyWeight, sellVolumeRatio, buyVolumeRatio, volumeConfidence, marketStabilityFactor, volatility, highPriceVolume, lowPriceVolume, timestamp } = baseData, weightedHighPrice = Math.floor(latest.high * latestWeight * (0.5 + 0.5 * sellVolumeRatio) + fiveMinData.avgHighPrice * fiveMinWeight + hourlyData.avgHighPrice * hourlyWeight), momentum = 'stable';
        if (hourlyData.avgHighPrice > 0) {
            let priceMovement = (latest.high - hourlyData.avgHighPrice) / hourlyData.avgHighPrice;
            priceMovement > 0.01 ? momentum = 'rising' : priceMovement < -0.01 && (momentum = 'falling');
        }
        let suggestedMargin = Math.max(0.005, Math.min(0.10, (fiveMinData.avgHighPrice - fiveMinData.avgLowPrice) / fiveMinData.avgLowPrice));
        return {
            weightedHighPrice,
            latestHigh: latest.high,
            fiveMinHigh: fiveMinData.avgHighPrice,
            hourlyHigh: hourlyData.avgHighPrice,
            highPriceVolume,
            lowPriceVolume,
            confidence: volumeConfidence * marketStabilityFactor,
            marketStability: marketStabilityFactor,
            momentum,
            suggestedMargin,
            timestamp
        };
    }, calculateInstaBuyPrice = (itemId) => {
        let baseData = calculateSearchPriceBase(itemId);
        if (!baseData) return null;
        let { latest, fiveMinData, hourlyData, latestWeight, fiveMinWeight, hourlyWeight, buyVolumeRatio, sellVolumeRatio, volumeConfidence, marketStabilityFactor, volatility, highPriceVolume, lowPriceVolume, timestamp } = baseData, weightedLowPrice = Math.floor(latest.low * latestWeight * (0.5 + 0.5 * buyVolumeRatio) + fiveMinData.avgLowPrice * fiveMinWeight + hourlyData.avgLowPrice * hourlyWeight), buyMomentum = 'stable';
        if (hourlyData.avgLowPrice > 0) {
            let priceMovement = (latest.low - hourlyData.avgLowPrice) / hourlyData.avgLowPrice;
            priceMovement > 0.01 ? buyMomentum = 'rising' : priceMovement < -0.01 && (buyMomentum = 'falling');
        }
        return {
            weightedLowPrice,
            latestLow: latest.low,
            fiveMinLow: fiveMinData.avgLowPrice,
            hourlyLow: hourlyData.avgLowPrice,
            highPriceVolume,
            lowPriceVolume,
            confidence: volumeConfidence * marketStabilityFactor,
            marketStability: marketStabilityFactor,
            buyMomentum,
            volatility,
            timestamp
        };
    }, handleSellSearch = () => {
        if (!sellSearchQuery.trim()) return void setSellSearchResults(null);
        if (!mapping.length || !Object.keys(latestPrices).length) return void setSellSearchResults([]);
        let lowerCaseQuery = sellSearchQuery.toLowerCase();
        setSellSearchResults(mapping.filter((item) => item && item.name && item.name.toLowerCase().includes(lowerCaseQuery)).map((item) => {
            let priceData = calculateInstaSellPrice(item.id);
            return priceData ? {
                ...item,
                ...priceData
            } : null;
        }).filter(Boolean));
    }, handleBuySearch = () => {
        if (!buySearchQuery.trim()) return void setBuySearchResults(null);
        if (!mapping.length || !Object.keys(latestPrices).length) return void setBuySearchResults([]);
        let lowerCaseQuery = buySearchQuery.toLowerCase();
        setBuySearchResults(mapping.filter((item) => item && item.name && item.name.toLowerCase().includes(lowerCaseQuery)).map((item) => {
            let priceData = calculateInstaBuyPrice(item.id);
            return priceData ? {
                ...item,
                ...priceData
            } : null;
        }).filter(Boolean));
    }, muiTheme = createTheme({
        palette: {
            mode: 'light',
            primary: {
                main: '#16a34a',
                dark: '#15803d',
                light: '#4ade80',
                contrastText: '#fff'
            },
            secondary: {
                main: '#2563eb',
                dark: '#1d4ed8',
                light: '#60a5fa',
                contrastText: '#fff'
            },
            background: {
                default: '#f3f4f6',
                paper: '#ffffff'
            },
            text: {
                primary: '#1f2937',
                secondary: '#4b5563'
            }
        },
        typography: {
            fontFamily: "Inter,sans-serif",
            h6: {
                fontWeight: 600,
                fontSize: '1.15rem'
            },
            subtitle1: {
                fontWeight: 500,
                fontSize: '1rem'
            },
            body1: {
                fontSize: '0.95rem'
            },
            body2: {
                fontSize: '0.85rem'
            },
            caption: {
                fontSize: '0.75rem',
                color: '#6b7280'
            }
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontWeight: 600
                    }
                }
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px'
                        },
                        '& .MuiInputLabel-root': {
                            fontWeight: 500
                        }
                    }
                }
            },
            MuiSelect: {
                styleOverrides: {
                    root: {
                        borderRadius: '8px',
                        fontWeight: 500
                    }
                }
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                    }
                }
            },
            MuiCircularProgress: {
                styleOverrides: {
                    root: {
                        color: '#16a34a'
                    }
                }
            }
        }
    });
    return useEffect(() => {
        (async () => {
            setLoading(!0), setCalculatingFlips(!0), setSellSearchResults(null), setBuySearchResults(null);
            try {
                let [mappingResponse, fiveMinResponse, latestResponse, hourlyResponse] = await Promise.all([
                    fetch(MAPPING_URL),
                    fetch(FIVE_MINUTE_URL),
                    fetch(LATEST_PRICES_URL),
                    fetch(HOURLY_AVG_URL)
                ]);
                if (!mappingResponse.ok) throw Error(`Mapping fetch failed: ${mappingResponse.statusText}`);
                if (!fiveMinResponse.ok) throw Error(`5m fetch failed: ${fiveMinResponse.statusText}`);
                if (!latestResponse.ok) throw Error(`Latest fetch failed: ${latestResponse.statusText}`);
                if (!hourlyResponse.ok) throw Error(`Hourly fetch failed: ${hourlyResponse.statusText}`);
                let [mappingData, fiveMinData, latestData, hourlyData] = await Promise.all([
                    mappingResponse.json(),
                    fiveMinResponse.json(),
                    latestResponse.json(),
                    hourlyResponse.json()
                ]), filteredMapping = mappingData.filter((item) => item && 'number' == typeof item.id && 'string' == typeof item.name && item.name && 'number' == typeof item.limit && 'string' == typeof item.icon && item.icon);
                setMapping(filteredMapping), setFiveMin(fiveMinData.data ?? {}), setLatestPrices(latestData.data ?? {}), setHourlyPrices(hourlyData.data ?? {}), setLastUpdate(Date.now());
            } catch (error) {
                setFlips([]);
            } finally {
                setLoading(!1);
            }
        })();
    }, [
        refreshKey
    ]), useEffect(() => {
        if (loading || !mapping.length || !Object.keys(fiveMin).length || !Object.keys(latestPrices).length || !Object.keys(hourlyPrices).length) {
            loading || setCalculatingFlips(!1);
            return;
        }
        setCalculatingFlips(!0);
        let calculationTimeout = setTimeout(() => {
            try {
                let risk = getOptimalRisk(mapping, fiveMin, latestPrices, hourlyPrices, budget);
                setAutoRisk(risk);
                let suggestions = mapping.map((item) => calculateTradeMetrics(item, fiveMin, latestPrices, hourlyPrices, budget, risk)).filter(Boolean).sort((a, b) => (b.flipScore ?? 0) - (a.flipScore ?? 0)).slice(0, 20);
                setFlips(suggestions);
            } catch (error) {
                setFlips([]);
            } finally {
                setCalculatingFlips(!1);
            }
        }, 50);
        return () => clearTimeout(calculationTimeout);
    }, [
        mapping,
        fiveMin,
        latestPrices,
        hourlyPrices,
        budget,
        loading
    ]), useEffect(() => {
        let interval = setInterval(() => {
            setLastUpdate((prev) => prev);
        }, 300000);
        return () => clearInterval(interval);
    }, []), React.createElement(ThemeProvider, {
        theme: muiTheme
    }, React.createElement(StyledEngineProvider, {
        injectFirst: !0
    }, " ", React.createElement(CssBaseline, null), React.createElement("div", {
        className: "min-h-screen py-8 px-4 lg:px-8",
        style: {
            backgroundColor: muiTheme.palette.background.default
        }
    }, React.createElement(Container, {
        maxWidth: "xl",
        disableGutters: !0
    }, React.createElement("div", {
        className: "flex flex-col lg:flex-row gap-6"
    }, React.createElement("div", {
        className: "lg:w-1/3 space-y-6 flex flex-col"
    }, " ", React.createElement(Paper, {
        elevation: 0,
        className: "p-5"
    }, " ", React.createElement(Typography, {
        variant: "h6",
        gutterBottom: !0,
        sx: {
            color: 'text.primary'
        }
    }, "Flipping Budget"), React.createElement("div", {
        className: "flex items-end gap-2"
    }, React.createElement(TextField, {
        fullWidth: !0,
        id: "budget-input",
        label: `Enter budget (${budgetUnit})`,
        variant: "outlined",
        value: budgetValue,
        onChange: (e) => handleBudgetChange(e.target.value, budgetUnit),
        type: "number",
        InputProps: {
            inputProps: {
                min: 0.01,
                step: 0.1
            }
        },
        size: "small"
    }), React.createElement(FormControl, {
        size: "small",
        sx: {
            width: '80px'
        }
    }, React.createElement(InputLabel, {
        id: "budget-unit-label"
    }, "Unit"), React.createElement(Select, {
        labelId: "budget-unit-label",
        id: "budget-unit-select",
        value: budgetUnit,
        label: "Unit",
        onChange: (e) => handleBudgetChange(budgetValue, e.target.value)
    }, React.createElement(MenuItem, {
        value: "K"
    }, "K"), React.createElement(MenuItem, {
        value: "M"
    }, "M")))), React.createElement(Typography, {
        variant: "body2",
        sx: {
            color: 'primary.dark',
            fontWeight: 500,
            mt: 2
        }
    }, "Current Budget: ", budget.toLocaleString(), " gp")), React.createElement(Paper, {
        elevation: 0,
        className: "p-5 space-y-5"
    }, React.createElement("div", null, React.createElement(Typography, {
        variant: "h6",
        gutterBottom: !0,
        sx: {
            color: 'text.primary'
        }
    }, "Recommended Sell Price"), React.createElement("div", {
        className: "space-y-3"
    }, React.createElement(TextField, {
        fullWidth: !0,
        label: "Search item to sell",
        variant: "outlined",
        value: sellSearchQuery,
        onChange: (e) => setSellSearchQuery(e.target.value),
        onKeyPress: (e) => {
            'Enter' === e.key && handleSellSearch();
        },
        size: "small",
        disabled: loading
    }), React.createElement(Button, {
        fullWidth: !0,
        variant: "contained",
        color: "primary",
        onClick: handleSellSearch,
        disabled: !sellSearchQuery.trim() || loading
    }, "Search Sell Price"))), React.createElement(Divider, null), " ", React.createElement("div", null, React.createElement(Typography, {
        variant: "h6",
        gutterBottom: !0,
        sx: {
            color: 'text.primary'
        }
    }, "Recommended Buy Price"), React.createElement("div", {
        className: "space-y-3"
    }, React.createElement(TextField, {
        fullWidth: !0,
        label: "Search item to buy",
        variant: "outlined",
        value: buySearchQuery,
        onChange: (e) => setBuySearchQuery(e.target.value),
        onKeyPress: (e) => {
            'Enter' === e.key && handleBuySearch();
        },
        size: "small",
        disabled: loading
    }), React.createElement(Button, {
        fullWidth: !0,
        variant: "contained",
        color: "secondary",
        onClick: handleBuySearch,
        disabled: !buySearchQuery.trim() || loading
    }, "Search Buy Price")))), React.createElement("div", {
        className: "flex-grow overflow-y-auto space-y-6 pr-2 -mr-2 custom-scrollbar"
    }, loading && null === sellSearchResults && null === buySearchResults ? React.createElement(Box, {
        display: "flex",
        justifyContent: "center",
        py: 4
    }, React.createElement(CircularProgress, {
        size: 24
    }), React.createElement(Typography, {
        sx: {
            ml: 2,
            color: 'text.secondary'
        }
    }, "Loading item data...")) : React.createElement(React.Fragment, null, null !== sellSearchResults && React.createElement("div", null, React.createElement(Typography, {
        variant: "subtitle1",
        gutterBottom: !0,
        sx: {
            fontWeight: 600,
            color: 'text.primary',
            px: 1
        }
    }, "Sell Search Results ", sellSearchResults ? `(${sellSearchResults.length})` : ''), React.createElement(SellSearchResults, {
        results: sellSearchResults,
        getWikiLink: getWikiLink,
        formatTimeSince: formatTimeSince,
        formatPrice: formatGrandExchangePrice
    })), null !== buySearchResults && React.createElement("div", null, React.createElement(Typography, {
        variant: "subtitle1",
        gutterBottom: !0,
        sx: {
            fontWeight: 600,
            color: 'text.primary',
            px: 1,
            mt: 4 * (null !== sellSearchResults)
        }
    }, "Buy Search Results ", buySearchResults ? `(${buySearchResults.length})` : ''), React.createElement(BuySearchResults, {
        results: buySearchResults,
        getWikiLink: getWikiLink,
        formatTimeSince: formatTimeSince,
        formatPrice: formatGrandExchangePrice
    })), null === sellSearchResults && null === buySearchResults && !loading && React.createElement(Typography, {
        sx: {
            textAlign: 'center',
            color: 'text.secondary',
            fontStyle: 'italic',
            py: 4
        }
    }, "Search for an item's recommended buy or sell price.")))), " ", React.createElement("div", {
        className: "lg:w-2/3 space-y-6"
    }, React.createElement(Paper, {
        elevation: 0,
        className: "p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
    }, React.createElement("div", null, React.createElement(Typography, {
        variant: "h6",
        sx: {
            color: 'text.primary'
        }
    }, "Optimal Risk Level"), React.createElement(Typography, {
        variant: "body1",
        sx: {
            color: 'text.secondary',
            mt: 0.5
        }
    }, "Calculated Risk: ", React.createElement("span", {
        className: "font-bold text-green-700"
    }, autoRisk.toFixed(3))), React.createElement(Typography, {
        variant: "body2",
        sx: {
            color: 'text.secondary',
            mt: 0.5
        }
    }, "Automatically adjusted based on budget & market data.")), React.createElement("div", {
        className: "flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0 mt-2 sm:mt-0"
    }, React.createElement(Typography, {
        variant: "caption",
        sx: {
            fontStyle: 'italic',
            color: 'text.secondary'
        }
    }, "Data updated: ", formatTimeSince(lastUpdate)), React.createElement(Button, {
        variant: "contained",
        color: "primary",
        onClick: () => setRefreshKey((prev) => prev + 1),
        disabled: loading || calculatingFlips,
        startIcon: loading ? React.createElement(CircularProgress, {
            size: 16,
            color: "inherit"
        }) : null,
        size: "small"
    }, loading ? 'Refreshing...' : 'Refresh Data'))), React.createElement("section", {
        className: "osrs-flips-list space-y-4",
        "aria-live": "polite"
    }, React.createElement(Typography, {
        variant: "h6",
        gutterBottom: !0,
        sx: {
            color: 'text.primary'
        }
    }, "Recommended Flips (", calculatingFlips ? '...' : flips.length, ")"), calculatingFlips ? React.createElement(Box, {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "200px"
    }, React.createElement(CircularProgress, {
        size: 30
    }), React.createElement(Typography, {
        variant: "body1",
        sx: {
            ml: 2,
            color: 'text.secondary'
        }
    }, "Calculating flips...")) : 0 === flips.length ? React.createElement(Paper, {
        elevation: 0,
        sx: {
            textAlign: 'center',
            py: 8,
            backgroundColor: 'transparent'
        }
    }, React.createElement(Typography, {
        sx: {
            color: 'text.secondary',
            fontStyle: 'italic'
        }
    }, loading ? 'Loading data...' : 'No profitable flips found matching criteria. Try adjusting your budget or refreshing data.')) : React.createElement("div", {
        className: "grid grid-cols-1 md:grid-cols-2 gap-4"
    }, flips.map((flip, index) => React.createElement("div", {
        key: flip.id,
        className: "relative"
    }, React.createElement("div", {
        className: "absolute -top-2.5 left-4 bg-primary-dark text-white px-2.5 py-0.5 rounded-full text-xs font-semibold z-10 shadow-sm"
    }, "#", index + 1), React.createElement(FlipCard, {
        flip: flip
    })))))), " "), " "), React.createElement("style", {
        jsx: !0,
        global: !0
    }, `
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 6px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: #f3f4f6; /* gray-100 */
                            border-radius: 3px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #d1d5db; /* gray-300 */
                            border-radius: 3px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: #9ca3af; /* gray-400 */
                        }
                        /* For Firefox */
                        .custom-scrollbar {
                            scrollbar-width: thin;
                            scrollbar-color: #d1d5db #f3f4f6;
                        }
                    `)), " "));
}
