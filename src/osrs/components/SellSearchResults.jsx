import React from 'react';

const SellSearchResultItem = ({ item, getWikiLink, formatTimeSince, formatPrice }) => (
    <a
        key={`${item.id}-sell`}
        href={getWikiLink(item.name)}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-white rounded-lg border border-gray-100 p-4 hover:shadow-sm transition-shadow duration-200 group"
    >
        <div className="flex justify-between items-start mb-2">
            <p className="font-medium text-green-700 group-hover:underline truncate pr-2">
                {item.name}
            </p>
            <span className="text-xs text-gray-500 flex-shrink-0">
                {formatTimeSince(item.timestamp)}
            </span>
        </div>

        <div className="bg-green-50 rounded-md p-2 mb-3">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600 block">Recommended Insta-sell</span>
                <div className="flex items-center gap-1">
                    <div
                        className={`h-2 w-2 rounded-full ${item.confidence >= 0.8 ? 'bg-green-500' : item.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                        title={`Confidence: ${Math.round(item.confidence * 100)}%`}
                    />
                    <span className="text-xs text-gray-500">{Math.round(item.confidence * 100)}% conf.</span>
                </div>
            </div>
            <p className="font-bold text-green-800">
                {formatPrice(item.weightedHighPrice)} gp
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs">
                <span className={`${item.momentum === 'rising' ? 'text-green-600' : item.momentum === 'falling' ? 'text-red-600' : 'text-gray-600'}`}>
                    {item.momentum === 'rising' ? '↑ Rising' : item.momentum === 'falling' ? '↓ Falling' : '→ Stable'}
                </span>
                <span className="text-gray-600">• Margin: {(item.suggestedMargin * 100).toFixed(1)}%</span>
                {typeof item.netProfit === 'number' && (
                    <span className="text-gray-600">• Profit: {formatPrice(item.netProfit)}</span>
                )}
            </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs text-gray-700">
            <div className="bg-gray-50 rounded-md p-1.5">
                <span className="block text-gray-600 truncate">Latest High</span>
                <span className="font-medium text-gray-900 truncate">{formatPrice(item.latestHigh)}</span>
            </div>
            <div className="bg-gray-50 rounded-md p-1.5">
                <span className="block text-gray-600 truncate">5m Avg High</span>
                <span className="font-medium text-gray-900 truncate">{formatPrice(item.fiveMinHigh)}</span>
            </div>
            <div className="bg-gray-50 rounded-md p-1.5">
                <span className="block text-gray-600 truncate">1h Avg High</span>
                <span className="font-medium text-gray-900 truncate">{formatPrice(item.hourlyHigh)}</span>
            </div>
        </div>

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

const SellSearchResults = ({ results, getWikiLink, formatTimeSince, formatPrice }) => {
    if (results === null) {
        return null;
    }
    if (results.length === 0) {
        return (
            <div className="p-4 text-gray-500 italic text-center">
                No items found matching your sell search query or with sufficient price data.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {results.map((item) => (
                <SellSearchResultItem
                    key={`${item.id}-sell-result`}
                    item={item}
                    getWikiLink={getWikiLink}
                    formatTimeSince={formatTimeSince}
                    formatPrice={formatPrice}
                />
            ))}
        </div>
    );
};

export default SellSearchResults;
