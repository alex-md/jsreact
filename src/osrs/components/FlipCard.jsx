import React, { useMemo } from 'react';
import { Typography } from '@mui/material';
import { formatGrandExchangePrice } from '../utils/formatting'; // Corrected import path

const FlipCard = ({ flip }) => {
    // Memoized color calculations
    const volatilityColor = useMemo(() => {
        if (!flip.volatility) return 'text-gray-600';
        if (flip.volatility > 0.15) return 'text-red-600'; // High risk
        if (flip.volatility > 0.07) return 'text-orange-600'; // Medium risk
        return 'text-green-700'; // Low risk
    }, [flip.volatility]);

    // Note: Confidence color wasn't used in the original template, but kept logic
    const confidenceColor = useMemo(() => {
        if (!flip.confidenceScore) return 'text-gray-600';
        if (flip.confidenceScore >= 0.8) return 'text-green-700';
        if (flip.confidenceScore >= 0.6) return 'text-yellow-600';
        return 'text-orange-600';
    }, [flip.confidenceScore]);

    // Note: Sharpe ratio color wasn't used in the original template, but kept logic
    const sharpeColor = useMemo(() => {
        if (flip.sharpeRatio == null) return 'text-gray-600';
        if (flip.sharpeRatio >= 1.0) return 'text-green-700'; // Excellent
        if (flip.sharpeRatio >= 0.3) return 'text-yellow-600'; // Decent
        return 'text-orange-600'; // Low/Poor
    }, [flip.sharpeRatio]);


    const flipScoreColor = useMemo(() => {
        if (!flip.flipScore) return 'text-gray-600';
        if (flip.flipScore >= 80) return 'text-green-700'; // Great flip
        if (flip.flipScore >= 65) return 'text-blue-600'; // Good flip
        if (flip.flipScore >= 50) return 'text-yellow-600'; // Okay flip
        return 'text-orange-600'; // Marginal / Risky flip
    }, [flip.flipScore]);

    const formatPrice = formatGrandExchangePrice; // Alias for clarity

    const buyPressureDisplay = useMemo(() => {
        if (flip.buyPressure == null || !isFinite(flip.buyPressure)) {
            return '—';
        }
        return `${flip.buyPressure.toFixed(2)}x`;
    }, [flip.buyPressure]);

    // Image loading/error handling
    const handleImageError = (e) => {
        // Hide the image container or replace with a placeholder
        e.target.style.display = 'none';
        // Optionally, show a placeholder div
        // e.target.parentElement.querySelector('.placeholder-icon')?.classList.remove('hidden');
    };

    const iconUrl = `https://oldschool.runescape.wiki/images/${encodeURIComponent(flip.icon?.replace(/ /g, '_') ?? '')}`;

    return (
        <article className="osrs-flip-card bg-white rounded-xl shadow-sm p-5 flex gap-4 items-start border border-gray-100 hover:shadow-md transition group relative">
            {/* Score Badge */}
            <div className="absolute top-3 right-3 bg-gray-100 rounded-full px-3 py-1 flex items-center gap-1 shadow-sm z-10">
                <Typography variant="caption" className="text-gray-600 font-medium">Score:</Typography>
                <Typography variant="body2" className={`font-bold ${flipScoreColor}`}>
                    {flip.flipScore}
                </Typography>
            </div>

            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
                <img
                    src={iconUrl}
                    alt={flip.name}
                    width={48}
                    height={48}
                    className="rounded-md bg-gray-100 border border-gray-200 block" // Use block display
                    loading="lazy"
                    onError={handleImageError}
                />
                {/* Optional Placeholder
                <div className="placeholder-icon hidden w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center">?</div> */}
            </div>


            {/* Details */}
            <div className="flex-1 min-w-0">
                {/* Item Name (Link) */}
                <a
                    href={flip.wiki}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-lg text-green-700 hover:underline truncate block pr-16" // Add padding right for score
                    title={`View ${flip.name} on OSRS Wiki`}
                >
                    {flip.name}
                </a>
                <Typography variant="caption" className="bg-gray-50 border-b" sx={{ mt: -0.5, mb: 1 }}>
                    Buy {formatPrice(flip.maxQty)} {flip.name} for {formatPrice(flip.buyPrice)}gp, sell for {formatPrice(flip.sellPrice)}gp
                    <br />
                    {flip.buyPrice > flip.sellPrice ? 'Potential Loss' : 'Potential Profit'}: {formatPrice(flip.totalProfit)}gp
                </Typography>

                {/* Profit/Qty Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 mb-3">
                    <div className="bg-green-50 rounded-md p-2">
                        <Typography variant="caption" className="block text-gray-600">Total Profit</Typography>
                        <Typography variant="body1" className="font-bold text-green-800 truncate">
                            {formatPrice(flip.totalProfit)} gp
                        </Typography>
                    </div>
                    <div className="bg-blue-50 rounded-md p-2">
                        <Typography variant="caption" className="block text-gray-600">Profit/Item</Typography>
                        <Typography variant="body1" className="font-medium text-blue-800 truncate">
                            {formatPrice(flip.profitPer)} gp
                        </Typography>
                    </div>
                    <div className="bg-yellow-50 rounded-md p-2">
                        <Typography variant="caption" className="block text-gray-600">Quantity</Typography>
                        <Typography variant="body1" className="font-medium text-yellow-800 truncate">
                            {formatPrice(flip.maxQty)}
                        </Typography>
                    </div>
                </div>



                {/* Metrics */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span className="flex items-center gap-1" title="Buy volume (last 5 min)">
                        <span className="font-medium">Buy Vol (5m):</span> {formatPrice(flip.fiveMinLowVolume)}
                    </span>
                    <span className="flex items-center gap-1" title="Sell volume (last 5 min)">
                        <span className="font-medium">Sell Vol (5m):</span> {formatPrice(flip.fiveMinHighVolume)}
                    </span>
                    <span className="flex items-center gap-1" title={`Volatility: ${(flip.volatility * 100).toFixed(1)}% (Higher value means more price fluctuation)`}>
                        <span className="font-medium">Volatility:</span> <b className={volatilityColor}>{(flip.volatility * 100).toFixed(1)}%</b>
                    </span>
                    <span className="flex items-center gap-1" title="Price trend (latest high vs hourly average high)">
                        <span className="font-medium">Trend:</span>
                        <b className={`${flip.trend === 'up' ? 'text-green-700' : 'text-red-600'}`}>
                            {flip.trend === 'up' ? 'Rising' : 'Falling'}
                        </b>
                        <svg
                            className={`w-3 h-3 flex-shrink-0 ${flip.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={flip.trend === 'up' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                        </svg>
                    </span>
                    <span className="flex items-center gap-1" title="Estimated total units traded in the last 24 hours">
                        <span className="font-medium">Est. Daily Vol:</span> {formatPrice(flip.estimatedDailyVolume)}
                    </span>
                    <span className="flex items-center gap-1" title="Estimated gp traded in the last 24 hours">
                        <span className="font-medium">Daily Turnover:</span> {formatPrice(flip.turnover24h)} gp
                    </span>
                    <span className="flex items-center gap-1" title="Buy vs sell pressure ratio (values above 1 indicate stronger demand)">
                        <span className="font-medium">Buy/Sell:</span> {buyPressureDisplay}
                    </span>
                    {/* Optional: Display Confidence/Sharpe if needed */}
                    {/*
                     <span className="flex items-center gap-1" title={`Confidence Score: ${Math.round(flip.confidenceScore * 100)}%`}>
                       <span className="font-medium">Confidence:</span> <b className={confidenceColor}>{Math.round(flip.confidenceScore * 100)}%</b>
                     </span>
                     <span className="flex items-center gap-1" title={`Sharpe Ratio: ${flip.sharpeRatio?.toFixed(2) ?? 'N/A'}`}>
                        <span className="font-medium">Sharpe:</span> <b className={sharpeColor}>{flip.sharpeRatio?.toFixed(2) ?? 'N/A'}</b>
                     </span>
                     */}
                </div>
            </div>
        </article>
    );
};

export default FlipCard;
