import React from 'react';
import { Typography } from '@mui/material';

const ItemLookupResult = ({ data, getWikiLink, formatTimeSince, formatPrice }) => {
    const { item, buyData, sellData, wiki } = data;

    // Helper to determine freshness color
    const getFreshnessColor = (timestamp) => {
        const seconds = (Date.now() - timestamp) / 1000;
        if (seconds < 60) return 'text-green-600';
        if (seconds < 300) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
                <a
                    href={wiki}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-bold text-gray-900 hover:text-blue-600 hover:underline flex items-center gap-2"
                >
                    <img
                        src={`https://oldschool.runescape.wiki/images/${encodeURIComponent(item.icon?.replace(/ /g, '_') ?? '')}`}
                        alt=""
                        className="w-6 h-6 object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                    />
                    {item.name}
                </a>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Limit: {item.limit ?? 'None'}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Buying Strategy (For Flippers: Price to Place Buy Offer) */}
                <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                    <Typography variant="subtitle2" className="text-blue-800 font-bold mb-2 flex justify-between">
                        <span>Suggested Insta-Buy Price</span>
                        {buyData && <span className="text-xs font-normal opacity-75">Confidence: {Math.round(buyData.confidence * 100)}%</span>}
                    </Typography>

                    {buyData ? (
                        <>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-2xl font-bold text-gray-900">{formatPrice(buyData.weightedLowPrice)}</span>
                                <span className="text-xs text-gray-500">gp</span>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                                <div className="flex justify-between">
                                    <span>Latest Low:</span>
                                    <span className="font-medium">{formatPrice(buyData.latestLow)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>5m Avg:</span>
                                    <span className="font-medium">{formatPrice(buyData.fiveMinLow)}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-blue-200/50 flex justify-between items-center">
                                    <span>Volume (5m):</span>
                                    <span className="font-medium">{formatPrice(buyData.lowPriceVolume)}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <span className="text-sm text-gray-500 italic">Insufficient buy data</span>
                    )}
                </div>

                {/* Selling Strategy (For Flippers: Price to Place Sell Offer) */}
                <div className="bg-green-50/50 rounded-lg p-3 border border-green-100">
                    <Typography variant="subtitle2" className="text-green-800 font-bold mb-2 flex justify-between">
                        <span>Suggested Insta-Sell Price</span>
                        {sellData && <span className="text-xs font-normal opacity-75">Confidence: {Math.round(sellData.confidence * 100)}%</span>}
                    </Typography>

                    {sellData ? (
                        <>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-2xl font-bold text-gray-900">{formatPrice(sellData.weightedHighPrice)}</span>
                                <span className="text-xs text-gray-500">gp</span>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                                <div className="flex justify-between">
                                    <span>Latest High:</span>
                                    <span className="font-medium">{formatPrice(sellData.latestHigh)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>5m Avg:</span>
                                    <span className="font-medium">{formatPrice(sellData.fiveMinHigh)}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-green-200/50 flex justify-between items-center">
                                    <span>Volume (5m):</span>
                                    <span className="font-medium">{formatPrice(sellData.highPriceVolume)}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <span className="text-sm text-gray-500 italic">Insufficient sell data</span>
                    )}
                </div>
            </div>

            {/* Margin Info */}
            {buyData && sellData && (
                <div className="mt-3 flex items-center justify-center gap-4 bg-gray-100 rounded-lg p-2 text-sm">
                    <div className="flex flex-col items-center">
                        <span className="text-gray-500 text-xs">Potential Profit</span>
                        <span className="font-bold text-green-600">
                            {formatPrice(sellData.taxedSellPrice - buyData.weightedLowPrice)} gp
                        </span>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-gray-500 text-xs">ROI</span>
                        <span className="font-bold text-blue-600">
                            {((sellData.suggestedMargin) * 100).toFixed(2)}%
                        </span>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="flex flex-col items-center">
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItemLookupResult;
