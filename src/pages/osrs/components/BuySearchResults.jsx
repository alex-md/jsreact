import React from 'react';
import { Typography } from '@mui/material';

const BuySearchResultItem = ({ item, getWikiLink, formatTimeSince, formatPrice }) => (
    <a
        key={`${item.id}-buy`}
        href={getWikiLink(item.name)}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-white rounded-lg border border-gray-100 p-4 hover:shadow-sm transition-shadow duration-200 group"
    >
        {/* Header: Name and Timestamp */}
        <div className="flex justify-between items-start mb-2">
            <Typography variant="subtitle1" className="font-medium text-blue-700 group-hover:underline truncate pr-2">
                {item.name}
            </Typography>
            <Typography variant="caption" className="text-gray-500 flex-shrink-0">
                {formatTimeSince(item.timestamp)}
            </Typography>
        </div>

        {/* Recommended Price Box */}
        <div className="bg-blue-50 rounded-md p-2 mb-3">
            <div className="flex justify-between items-center mb-1">
                <Typography variant="caption" className="text-gray-600 block">Recommended Insta-buy</Typography>
                {/* Confidence Indicator */}
                <div className="flex items-center gap-1">
                    <div
                        className={`h-2 w-2 rounded-full ${item.confidence >= 0.8 ? 'bg-green-500' : item.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                        title={`Confidence: ${Math.round(item.confidence * 100)}%`}
                    />
                    <Typography variant="caption" className="text-gray-500">{Math.round(item.confidence * 100)}% conf.</Typography>
                </div>
            </div>
            <Typography variant="body1" className="font-bold text-blue-800">
                {formatPrice(item.weightedLowPrice)} gp
            </Typography>
            {/* Buy Momentum & Volatility */}
            <div className="flex items-center gap-2 mt-1">
                <Typography variant="caption" className={`${item.buyMomentum === 'rising' ? 'text-green-600' : item.buyMomentum === 'falling' ? 'text-red-600' : 'text-gray-600'}`}>
                    {item.buyMomentum === 'rising' ? '↑ Rising' : item.buyMomentum === 'falling' ? '↓ Falling' : '→ Stable'} (Buy Trend)
                </Typography>
                <Typography variant="caption" className="text-gray-600">• Volatility: {(item.volatility * 100).toFixed(1)}%</Typography>
            </div>
        </div>

        {/* Price Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-700">
            <div className="bg-gray-50 rounded-md p-1.5">
                <Typography variant="caption" className="block text-gray-600 truncate">Latest Low</Typography>
                <Typography variant="body2" className="font-medium text-gray-900 truncate">{formatPrice(item.latestLow)}</Typography>
            </div>
            <div className="bg-gray-50 rounded-md p-1.5">
                <Typography variant="caption" className="block text-gray-600 truncate">5m Avg Low</Typography>
                <Typography variant="body2" className="font-medium text-gray-900 truncate">{formatPrice(item.fiveMinLow)}</Typography>
            </div>
            <div className="bg-gray-50 rounded-md p-1.5">
                <Typography variant="caption" className="block text-gray-600 truncate">1h Avg Low</Typography>
                <Typography variant="body2" className="font-medium text-gray-900 truncate">{formatPrice(item.hourlyLow)}</Typography>
            </div>
        </div>

        {/* Volume & Stability */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div><span className="font-medium">Buy Vol (5m):</span> {formatPrice(item.lowPriceVolume)}</div>
            <div><span className="font-medium">Sell Vol (5m):</span> {formatPrice(item.highPriceVolume)}</div>
            <div className="col-span-2 mt-1">
                <span className="font-medium">Market Stability:</span>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1" title={`Stability: ${Math.round(item.marketStability * 100)}%`}>
                    <div
                        className={`h-1.5 rounded-full ${item.marketStability >= 0.8 ? 'bg-green-500' : item.marketStability >= 0.5 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                        style={{ width: `${item.marketStability * 100}%` }}
                    />
                </div>
            </div>
        </div>
    </a>
);

const BuySearchResults = ({ results, getWikiLink, formatTimeSince, formatPrice }) => {
    if (results === null) {
        return null; // Nothing searched yet
    }
    if (results.length === 0) {
        return (
            <div className="p-4 text-gray-500 italic text-center">
                No items found matching your buy search query or with sufficient price data.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {results.map((item) => (
                <BuySearchResultItem
                    key={`${item.id}-buy-result`}
                    item={item}
                    getWikiLink={getWikiLink}
                    formatTimeSince={formatTimeSince}
                    formatPrice={formatPrice}
                />
            ))}
        </div>
    );
};

export default BuySearchResults;
