// /osrs/utils/calculations.js

// --- Core Calculation Logic ---

export function analyzePriceVolatility(itemId, latest, hourly) {
    if (!latest?.[itemId] || !hourly?.[itemId]) {
        return null;
    }
    const latestData = latest[itemId];
    const hourlyData = hourly[itemId];

    if (!hourlyData.avgHighPrice || !hourlyData.avgLowPrice || hourlyData.avgLowPrice === 0) {
        return null;
    }

    return {
        volatility: (hourlyData.avgHighPrice - hourlyData.avgLowPrice) / hourlyData.avgLowPrice,
        trend: latestData.high > hourlyData.avgHighPrice ? 'up' : 'down',
    };
}

export function calculatePriceVariance(priceHistory, lambda = 0.94) {
    if (!priceHistory || priceHistory.length < 2) return null;

    const returns = [];
    for (let i = 1; i < priceHistory.length; i++) {
        if (priceHistory[i - 1] && priceHistory[i - 1] !== 0) {
            returns.push((priceHistory[i] - priceHistory[i - 1]) / priceHistory[i - 1]);
        }
    }

    if (returns.length === 0) return null;

    let variance = 0;
    let weightSum = 0;
    returns.forEach((ret, i) => {
        const weight = Math.pow(lambda, returns.length - i - 1);
        variance += weight * ret * ret;
        weightSum += weight;
    });

    return weightSum > 0 ? variance / weightSum : null;
}

export function calculateModifiedSharpeRatio(expectedProfit, variance, riskFreeRate = (0.02 / 365)) {
    if (variance == null || variance === 0) return null;
    const profit = Number(expectedProfit);
    if (isNaN(profit)) return null;

    const stdDev = Math.sqrt(variance);
    if (stdDev === 0) return null;

    return (profit / stdDev) - riskFreeRate;
}

export function calculateConfidenceScore(item, fiveMin, latest, hourly) {
    const weights = {
        volumeStability: 0.25,
        priceConsistency: 0.25,
        marketDepth: 0.20,
        trendStrength: 0.15,
        volatilityPenalty: 0.15,
    };
    const scores = {};

    const fiveMinItem = fiveMin?.[item.id];
    const latestItem = latest?.[item.id];
    const hourlyItem = hourly?.[item.id];

    if (!fiveMinItem || !latestItem || !hourlyItem) {
        return { confidenceScore: 0, componentScores: {} };
    }

    // Volume Stability
    const volumes = [fiveMinItem.lowPriceVolume, fiveMinItem.highPriceVolume].filter(v => v != null);
    if (volumes.length < 2 || volumes.some(v => v < 0)) {
        scores.volumeStability = 0;
    } else {
        const volumeMean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
        if (volumeMean === 0) {
            scores.volumeStability = 0;
        } else {
            const volumeStdDev = Math.sqrt(volumes.reduce((a, b) => a + Math.pow(b - volumeMean, 2), 0) / volumes.length);
            scores.volumeStability = Math.max(0, Math.min(1, 1 - (volumeStdDev / volumeMean)));
        }
    }

    // Price Consistency
    const prices = [
        latestItem.high, latestItem.low,
        fiveMinItem.avgHighPrice, fiveMinItem.avgLowPrice,
        hourlyItem.avgHighPrice, hourlyItem.avgLowPrice
    ].filter(p => p != null && p > 0);
    if (prices.length < 3) {
        scores.priceConsistency = 0;
    } else {
        const priceMean = prices.reduce((a, b) => a + b, 0) / prices.length;
        if (priceMean === 0) {
            scores.priceConsistency = 0;
        } else {
            const priceStdDev = Math.sqrt(prices.reduce((a, b) => a + Math.pow(b - priceMean, 2), 0) / prices.length);
            scores.priceConsistency = Math.max(0, Math.min(1, 1 - (priceStdDev / priceMean)));
        }
    }

    // Market Depth (Normalized volume check)
    const lowVol = fiveMinItem.lowPriceVolume ?? 0;
    const highVol = fiveMinItem.highPriceVolume ?? 0;
    // Scaled from 0 to 1, reaching 1 around 500 volume for both buy/sell
    scores.marketDepth = Math.min(1, Math.max(0, Math.min(lowVol / 50, highVol / 50) / 10));

    // Trend Strength
    let shortTermTrend = 0;
    if (fiveMinItem.avgHighPrice > 0) {
        shortTermTrend = (latestItem.high - fiveMinItem.avgHighPrice) / fiveMinItem.avgHighPrice;
    }
    let longTermTrend = 0;
    if (hourlyItem.avgHighPrice > 0) {
        longTermTrend = (fiveMinItem.avgHighPrice - hourlyItem.avgHighPrice) / hourlyItem.avgHighPrice;
    }
    scores.trendStrength = Math.min(1, Math.abs(shortTermTrend + longTermTrend) / 2); // Average absolute trend

    // Volatility Penalty
    const variance = calculatePriceVariance(
        [hourlyItem.avgHighPrice, fiveMinItem.avgHighPrice, latestItem.high].filter(p => p != null)
    );
    scores.volatilityPenalty = variance !== null ? Math.max(0, Math.min(1, 1 - (5 * variance))) : 0.5; // Penalize high variance

    // Calculate final score
    let totalScore = 0;
    for (const factor in weights) {
        const componentScore = scores[factor];
        if (typeof componentScore === 'number' && !isNaN(componentScore)) {
            totalScore += componentScore * weights[factor];
        }
    }

    return {
        confidenceScore: Math.max(0, Math.min(1, totalScore)),
        componentScores: scores,
    };
}


export function calculateRiskAdjustedReturn(expectedProfit, variance, riskAversionCoeff = 2.0) {
    if (variance == null || isNaN(Number(expectedProfit))) return null;
    return Number(expectedProfit) - (riskAversionCoeff / 2) * variance;
}

export function calculateFlipScore(flip) {
    const weights = {
        profitScore: 0.30,
        sharpeScore: 0.20,
        confidenceScore: 0.20,
        volumeScore: 0.15, // Combined 5m volume
        marginScore: 0.10,
        varianceScore: 0.05,
    };

    // Normalize scores (mostly 0-1 range)
    const scores = {
        profitScore: Math.max(0, Math.min(1, Math.log10(Math.max(flip.totalProfit, 1)) / Math.log10(100_000_000))), // Cap at 100m profit
        sharpeScore: flip.sharpeRatio !== null ? Math.max(0, Math.min(1, flip.sharpeRatio / 2.0)) : 0, // Cap at Sharpe ratio of 2.0
        confidenceScore: flip.confidenceScore ?? 0,
        volumeScore: Math.min(1, ((flip.fiveMinLowVolume ?? 0) + (flip.fiveMinHighVolume ?? 0)) / 1000), // Cap at 1000 total volume
        marginScore: Math.min(1, Math.max(0, (flip.margin ?? 0) * 5)), // Cap at 20% margin for max score
        varianceScore: flip.variance !== null ? Math.max(0, Math.min(1, 1 - (10 * flip.variance))) : 0.5, // Penalize variance > 0.1 heavily
    };

    let totalScore = 0;
    for (const metric in weights) {
        const scoreValue = scores[metric];
        if (typeof scoreValue === 'number' && !isNaN(scoreValue)) {
            totalScore += scoreValue * weights[metric];
        }
    }

    // Return score out of 100
    return Math.round(Math.max(0, Math.min(1, totalScore)) * 100);
}


export function calculateTradeMetrics(item, fiveMinData, latestData, hourlyData, budget, riskThreshold) {
    if (!fiveMinData?.[item.id] || !latestData?.[item.id] || !hourlyData?.[item.id]) {
        return null;
    }

    const fiveMinItemData = fiveMinData[item.id];
    const latestItemData = latestData[item.id];
    const hourlyItemData = hourlyData[item.id];

    const volatilityAnalysis = analyzePriceVolatility(item.id, latestData, hourlyData);
    if (!volatilityAnalysis) return null;

    const {
        avgHighPrice: fiveMinAvgHigh,
        avgLowPrice: fiveMinAvgLow,
        highPriceVolume: fiveMinHighVolume = 0, // Default to 0 if null/undefined
        lowPriceVolume: fiveMinLowVolume = 0,
    } = fiveMinItemData;

    // Ensure essential prices are valid numbers > 0
    const essentialPrices = [
        fiveMinAvgHigh, fiveMinAvgLow,
        latestItemData.high, latestItemData.low,
        hourlyItemData.avgHighPrice, hourlyItemData.avgLowPrice
    ];
    if (essentialPrices.some(p => typeof p !== 'number' || p <= 0)) {
        return null;
    }
    // Filter out low-volume items early
    if (fiveMinHighVolume < 50 || fiveMinLowVolume < 50) {
        return null;
    }


    // Weighted price calculation (example weights, adjust as needed)
    const weightedBuyPrice = Math.floor(
        0.5 * fiveMinAvgLow + 0.3 * latestItemData.low + 0.2 * hourlyItemData.avgLowPrice
    );
    const weightedSellPrice = Math.floor(
        0.5 * fiveMinAvgHigh + 0.3 * latestItemData.high + 0.2 * hourlyItemData.avgHighPrice
    );

    if (weightedBuyPrice <= 0 || weightedSellPrice <= 0) return null;

    const taxedSell = Math.floor(weightedSellPrice * 0.99); // GE Tax
    const profitPer = taxedSell - weightedBuyPrice;

    if (profitPer <= 0) return null;
    if (weightedBuyPrice > budget) return null; // Cannot afford even one

    // Calculate suggested quantity
    const volatilityFactor = Math.max(0.1, 1 - (2 * volatilityAnalysis.volatility)); // Reduce qty for high volatility
    const affordableQty = Math.floor(budget / weightedBuyPrice);
    const volumeLimitQty = Math.max(1, fiveMinLowVolume * 3); // Heuristic: aim for 3x recent 5min buy vol
    const geLimit = typeof item.limit === 'number' && item.limit > 0 ? item.limit : Infinity;
    let suggestedQty = Math.floor(Math.min(affordableQty, volumeLimitQty, geLimit));

    if (suggestedQty <= 0) return null; // Should not happen if affordableQty >= 1

    const totalProfit = profitPer * suggestedQty;
    const margin = profitPer / weightedBuyPrice;

    // Risk filtering: Margin adjusted by volatility must meet threshold
    if ((margin * volatilityFactor) < riskThreshold) {
        return null;
    }

    // Calculate advanced metrics
    const priceHistory = [hourlyItemData.avgHighPrice, fiveMinAvgHigh, latestItemData.high].filter(p => typeof p === 'number');
    const variance = calculatePriceVariance(priceHistory);
    const sharpeRatio = calculateModifiedSharpeRatio(profitPer, variance); // Use profit per item for Sharpe
    const { confidenceScore, componentScores } = calculateConfidenceScore(item, fiveMinData, latestData, hourlyData);
    const riskAdjustedReturn = calculateRiskAdjustedReturn(profitPer, variance);

    // Confidence and Sharpe Ratio Filtering
    if (confidenceScore < 0.60) return null; // Minimum confidence required
    if (sharpeRatio !== null && sharpeRatio < 0.10) return null; // Minimum risk-adjusted return indicator

    // Calculate Flip Score
    const flipInput = {
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
        componentScores // Pass this for potential detailed display later
    };
    const flipScore = calculateFlipScore(flipInput);

    return {
        ...item, // Spread original item properties (id, name, limit, icon)
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
        componentScores, // Include for potential debugging/display
        riskAdjustedReturn,
        flipScore,
    };
}


export function getOptimalRisk(mapping, fiveMin, latest, hourly, budget) {
    if (!mapping || !fiveMin || !latest || !hourly || mapping.length === 0) {
        return 0.2; // Default risk if data is missing
    }

    const evaluatedRisks = [];
    // Define risk levels to test (more granular at lower levels)
    const baseRiskLevels = [];
    for (let r = 0.01; r <= 0.10; r += 0.005) baseRiskLevels.push(r); // 1% to 10% in 0.5% steps
    for (let r = 0.11; r <= 0.30; r += 0.01) baseRiskLevels.push(r); // 11% to 30% in 1% steps
    for (let r = 0.31; r <= 0.50; r += 0.02) baseRiskLevels.push(r); // 31% to 50% in 2% steps

    baseRiskLevels.forEach(risk => {
        const flips = mapping
            .map(item => calculateTradeMetrics(item, fiveMin, latest, hourly, budget, risk))
            .filter(Boolean) // Remove nulls (items not meeting criteria for this risk)
            .sort((a, b) => b.flipScore - a.flipScore) // Sort by score
            .slice(0, 20); // Consider top N flips

        if (flips.length > 0) {
            const totalProfit = flips.reduce((acc, f) => acc + f.totalProfit, 0);
            // Simple utility: total profit penalized by average volatility
            const avgVolatility = flips.reduce((acc, f) => acc + f.volatility, 0) / flips.length;
            const utilityScore = totalProfit / Math.sqrt(avgVolatility + 0.001); // Add small epsilon to avoid division by zero

            evaluatedRisks.push({
                risk: risk,
                utilityScore: utilityScore,
                numFlips: flips.length,
                avgProfit: totalProfit / flips.length
            });
        } else {
            // Assign very low utility if no flips are found for this risk level
            evaluatedRisks.push({
                risk: risk,
                utilityScore: -Infinity,
                numFlips: 0,
                avgProfit: 0
            });
        }
    });

    if (evaluatedRisks.length === 0 || evaluatedRisks.every(r => r.utilityScore === -Infinity)) {
        return 0.2; // Default if no viable risk levels found
    }

    // Find the risk level with the highest utility score
    evaluatedRisks.sort((a, b) => b.utilityScore - a.utilityScore);
    return parseFloat(evaluatedRisks[0].risk.toFixed(3)); // Return the best risk level
}

// --- Calculations Specific to Search Results ---

export function calculateSearchPriceBase(itemId, latestPrices, fiveMin, hourlyPrices) {
    const latest = latestPrices?.[itemId];
    const fiveMinData = fiveMin?.[itemId];
    const hourlyData = hourlyPrices?.[itemId];

    if (!latest || !fiveMinData || !hourlyData ||
        typeof latest.high !== 'number' || typeof latest.low !== 'number' ||
        typeof fiveMinData.avgHighPrice !== 'number' || typeof fiveMinData.avgLowPrice !== 'number' ||
        typeof hourlyData.avgHighPrice !== 'number' || typeof hourlyData.avgLowPrice !== 'number' ||
        hourlyData.avgLowPrice <= 0 || fiveMinData.avgLowPrice <= 0 || latest.low <= 0) {
        return null; // Essential data missing or invalid
    }

    const highVol = fiveMinData.highPriceVolume ?? 0;
    const lowVol = fiveMinData.lowPriceVolume ?? 0;
    const totalVolume = highVol + lowVol;

    if (totalVolume === 0) return null; // Avoid division by zero

    // Calculate volume confidence (scaled 0-1, max at ~250 total 5m volume)
    const volumeConfidence = Math.min(1, totalVolume / 250);

    // Calculate market stability based on recent price spreads
    const spreads = [
        (latest.high - latest.low) / latest.low,
        (fiveMinData.avgHighPrice - fiveMinData.avgLowPrice) / fiveMinData.avgLowPrice,
        (hourlyData.avgHighPrice - hourlyData.avgLowPrice) / hourlyData.avgLowPrice,
    ].filter(s => isFinite(s) && s >= 0); // Filter out invalid/negative spreads

    const avgSpread = spreads.length > 0 ? spreads.reduce((a, b) => a + b, 0) / spreads.length : 0;
    // Stability factor decreases as average spread increases (more volatile = less stable)
    const marketStabilityFactor = Math.max(0.1, Math.min(1, 1 - 2 * avgSpread));

    // Define weights based on confidence and stability
    const latestWeight = 0.5 * marketStabilityFactor * volumeConfidence;
    const fiveMinWeight = 0.3 * (1 + volumeConfidence) / 2; // Give 5min slightly more weight with volume confidence
    const hourlyWeight = Math.max(0, 1 - latestWeight - fiveMinWeight); // Remainder weight

    // Calculate volatility based on hourly data
    const volatility = (hourlyData.avgHighPrice - hourlyData.avgLowPrice) / hourlyData.avgLowPrice;

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
        timestamp: latest.timestamp ?? fiveMinData.timestamp ?? hourlyData.timestamp, // Use most recent timestamp
    };
}

export function calculateInstaSellPrice(itemId, latestPrices, fiveMin, hourlyPrices) {
    const baseData = calculateSearchPriceBase(itemId, latestPrices, fiveMin, hourlyPrices);
    if (!baseData) return null;

    const {
        latest, fiveMinData, hourlyData,
        latestWeight, fiveMinWeight, hourlyWeight,
        sellVolumeRatio, buyVolumeRatio,
        volumeConfidence, marketStabilityFactor,
        volatility,
        highPriceVolume, lowPriceVolume, timestamp
    } = baseData;

    // Recent price points for analysis
    const recentPrices = {
        latest: latest.high,
        fiveMin: fiveMinData.avgHighPrice,
        hourly: hourlyData.avgHighPrice,
        latestLow: latest.low,
        fiveMinLow: fiveMinData.avgLowPrice,
        hourlyLow: hourlyData.avgLowPrice
    };

    // Calculate the range of recent trading activity
    const priceRange = {
        min: Math.min(latest.low, fiveMinData.avgLowPrice, hourlyData.avgLowPrice),
        max: Math.max(latest.high, fiveMinData.avgHighPrice, hourlyData.avgHighPrice),
        current: latest.high
    };

    // Calculate sell pressure (-1 = downward, 1 = upward)
    const sellPressure = (
        ((latest.high < fiveMinData.avgHighPrice) ? -1 : 1) * 0.5 +
        ((fiveMinData.avgHighPrice < hourlyData.avgHighPrice) ? -1 : 1) * 0.3 +
        ((buyVolumeRatio > sellVolumeRatio) ? 1 : -1) * 0.2  // More buying than selling is good for sellers
    );

    // Activity level affects how much we need to discount from maximum
    const activityLevel = Math.min(1, (highPriceVolume + lowPriceVolume) / 500);

    // Market competition factor - higher when there's more buying than selling
    const competitionFactor = Math.max(0.2, Math.min(1, sellVolumeRatio / buyVolumeRatio));

    // Base price calculation considering recent trades
    const basePrice = Math.floor(
        latest.high * 0.4 +
        fiveMinData.avgHighPrice * 0.4 +
        hourlyData.avgHighPrice * 0.2
    );

    // Price adjustment based on market conditions (negative adjustments for instant-sell)
    const priceAdjustment = (
        -(activityLevel * 0.03) + // More activity = slightly lower price to ensure quick sale
        (sellPressure * 0.02) + // Price trend influence
        -(competitionFactor * 0.04) + // More competition = lower price
        (volumeConfidence * 0.01) + // Small volume confidence boost
        (marketStabilityFactor * 0.01) // Small stability boost
    );

    // Calculate the suggested price with dynamic adjustments
    const suggestedPrice = Math.floor(
        Math.min(
            basePrice,
            priceRange.max * (1 + priceAdjustment), // Maximum price minus adjustments
            latest.high // Never go above current highest
        )
    );

    // Final safety check: don't go below recent trading range
    const minAllowedPrice = Math.max(
        priceRange.min,
        Math.min(
            priceRange.max * 0.9, // Min 90% of maximum
            latest.low * 0.95 // Min 95% of latest low
        )
    );

    const finalPrice = Math.max(suggestedPrice, minAllowedPrice);

    // Calculate confidence in this price recommendation
    const priceConfidence = Math.min(1,
        volumeConfidence * 0.4 +
        marketStabilityFactor * 0.3 +
        (1 - volatility) * 0.3
    );

    // Determine price momentum (comparing latest high to hourly avg high)
    let momentum = 'stable';
    if (hourlyData.avgHighPrice > 0) {
        const priceMovement = (latest.high - hourlyData.avgHighPrice) / hourlyData.avgHighPrice;
        if (priceMovement > 0.01) momentum = 'rising';
        else if (priceMovement < -0.01) momentum = 'falling';
    }

    // Calculate potential GE tax
    const taxedPrice = Math.floor(finalPrice * 0.99); // 1% GE tax

    return {
        weightedHighPrice: finalPrice,
        taxedSellPrice: taxedPrice,
        latestHigh: latest.high,
        fiveMinHigh: fiveMinData.avgHighPrice,
        hourlyHigh: hourlyData.avgHighPrice,
        highPriceVolume,
        lowPriceVolume,
        confidence: priceConfidence,
        marketStability: marketStabilityFactor,
        momentum,
        sellPressure,
        competitionFactor,
        timestamp,
    };
}

export function calculateInstaBuyPrice(itemId, latestPrices, fiveMin, hourlyPrices) {
    const baseData = calculateSearchPriceBase(itemId, latestPrices, fiveMin, hourlyPrices);
    if (!baseData) return null;

    const {
        latest, fiveMinData, hourlyData,
        latestWeight, fiveMinWeight, hourlyWeight,
        buyVolumeRatio, sellVolumeRatio,
        volumeConfidence, marketStabilityFactor,
        volatility,
        highPriceVolume, lowPriceVolume, timestamp
    } = baseData;

    // Recent price points for analysis
    const recentPrices = {
        latest: latest.low,
        fiveMin: fiveMinData.avgLowPrice,
        hourly: hourlyData.avgLowPrice,
        latestHigh: latest.high,
        fiveMinHigh: fiveMinData.avgHighPrice,
        hourlyHigh: hourlyData.avgHighPrice
    };

    // Calculate the range of recent trading activity
    const priceRange = {
        min: Math.min(latest.low, fiveMinData.avgLowPrice, hourlyData.avgLowPrice),
        max: Math.max(latest.high, fiveMinData.avgHighPrice, hourlyData.avgHighPrice),
        current: latest.low
    };

    // Calculate price pressure (1 = upward, -1 = downward)
    const pricePressure = (
        ((latest.low > fiveMinData.avgLowPrice) ? 1 : -1) * 0.5 +
        ((fiveMinData.avgLowPrice > hourlyData.avgLowPrice) ? 1 : -1) * 0.3 +
        ((sellVolumeRatio > buyVolumeRatio) ? 1 : -1) * 0.2
    );

    // Activity level affects how much we need to pay above the minimum
    const activityLevel = Math.min(1, (highPriceVolume + lowPriceVolume) / 500);

    // Market competition factor - higher when there's more selling than buying
    const competitionFactor = Math.max(0.2, Math.min(1, buyVolumeRatio / sellVolumeRatio));

    // Base price calculation considering recent trades
    const basePrice = Math.floor(
        latest.low * 0.4 +
        fiveMinData.avgLowPrice * 0.4 +
        hourlyData.avgLowPrice * 0.2
    );

    // Price adjustment based on market conditions
    const priceAdjustment = (
        (activityLevel * 0.03) + // More activity = slightly higher price
        (pricePressure * 0.02) + // Price trend influence
        ((1 - competitionFactor) * 0.04) + // More competition = higher price
        (volumeConfidence * 0.02) + // Volume confidence boost
        (marketStabilityFactor * 0.02) // Stability boost
    );

    // Calculate the suggested price with dynamic adjustments
    const suggestedPrice = Math.floor(
        Math.max(
            basePrice,
            priceRange.min * (1 + priceAdjustment), // Minimum price plus adjustments
            latest.low // Never go below current lowest
        )
    );

    // Final safety check: don't exceed recent trading range
    const maxAllowedPrice = Math.min(
        priceRange.max,
        Math.max(
            priceRange.min * 1.1, // Max 10% above minimum
            latest.high * 1.05 // Max 5% above latest high
        )
    );

    const finalPrice = Math.min(suggestedPrice, maxAllowedPrice);

    // Calculate confidence in this price recommendation
    const priceConfidence = Math.min(1,
        volumeConfidence * 0.4 +
        marketStabilityFactor * 0.3 +
        (1 - volatility) * 0.3
    );

    // Determine buy-side price momentum
    let buyMomentum = 'stable';
    if (hourlyData.avgLowPrice > 0) {
        const priceMovement = (latest.low - hourlyData.avgLowPrice) / hourlyData.avgLowPrice;
        if (priceMovement > 0.01) buyMomentum = 'rising';
        else if (priceMovement < -0.01) buyMomentum = 'falling';
    }

    return {
        weightedLowPrice: finalPrice,
        latestLow: latest.low,
        fiveMinLow: fiveMinData.avgLowPrice,
        hourlyLow: hourlyData.avgLowPrice,
        highPriceVolume,
        lowPriceVolume,
        confidence: priceConfidence,
        marketStability: marketStabilityFactor,
        buyMomentum,
        volatility,
        pricePressure,
        competitionFactor,
        timestamp,
    };
}
