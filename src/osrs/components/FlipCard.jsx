import React, { useMemo, useState } from 'react';
import { Typography, IconButton, Tooltip } from '@mui/material';
import { formatGrandExchangePrice } from '../utils/formatting';

const FlipCard = ({ flip }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyName = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(flip.name);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Memoized color calculations
    const volatilityColor = useMemo(() => {
        if (!flip.volatility) return 'text-gray-600';
        if (flip.volatility > 0.15) return 'text-red-600';
        if (flip.volatility > 0.07) return 'text-orange-600';
        return 'text-green-700';
    }, [flip.volatility]);

    const flipScoreColor = useMemo(() => {
        if (!flip.flipScore) return 'text-gray-600';
        if (flip.flipScore >= 80) return 'text-green-700';
        if (flip.flipScore >= 65) return 'text-blue-600';
        if (flip.flipScore >= 50) return 'text-yellow-600';
        return 'text-orange-600';
    }, [flip.flipScore]);

    const formatPrice = formatGrandExchangePrice;

    const iconUrl = `https://oldschool.runescape.wiki/images/${encodeURIComponent(flip.icon?.replace(/ /g, '_') ?? '')}`;

    return (
        <article className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 transition-all duration-200 group relative flex flex-col h-full overflow-hidden">
            {/* Header Section */}
            <div className="p-4 sm:p-5 flex-grow">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-1">
                            <img
                                src={iconUrl}
                                alt=""
                                className="w-full h-full object-contain drop-shadow-sm"
                                loading="lazy"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        </div>
                        <div className="min-w-0 flex flex-col">
                            <div className="flex items-center gap-2">
                                <a
                                    href={flip.wiki}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-extrabold text-lg leading-tight text-gray-900 hover:text-blue-600 transition-colors truncate"
                                    title={`View ${flip.name} on OSRS Wiki`}
                                >
                                    {flip.name}
                                </a>
                                <Tooltip title={copied ? "Copied!" : "Copy Name"} arrow>
                                    <button
                                        onClick={handleCopyName}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded focus:opacity-100"
                                    >
                                        <i className={`fas ${copied ? 'fa-check text-green-500' : 'fa-copy text-gray-400'} text-xs`}></i>
                                    </button>
                                </Tooltip>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">GE Limit: {flip.limit?.toLocaleString() ?? 'None'}</span>
                                <span>•</span>
                                <span>Vol: {formatPrice(flip.fiveMinHighVolume + flip.fiveMinLowVolume)} in 5m</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Primary Action: Instructions */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    {/* Buy Instruction */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 flex flex-col relative group/price">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="text-[11px] uppercase tracking-wider text-blue-700 font-bold">Buy <u>{flip.maxQty?.toLocaleString()}</u></span>
                            <span className="text-[10px] text-blue-600/70 font-medium">Qty</span>
                        </div>
                        <span className="text-xl font-black text-gray-900 tracking-tight">for {formatPrice(flip.buyPrice)}gp</span>
                        <div className="mt-1 pt-1 border-t border-blue-200/50 flex justify-between items-center">
                            <span className="text-[10px] text-blue-800/60 font-medium">Total Cost</span>
                            <span className="text-xs font-bold text-blue-900">{formatPrice(flip.maxQty * flip.buyPrice)}</span>
                        </div>
                        <div className="inset-x-0 bottom-0 h-0.5 bg-blue-300/50 rounded-b-lg"></div>
                    </div>

                    {/* Sell Instruction */}
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100 flex flex-col relative group/price text-right">
                        <div className="flex justify-between items-baseline mb-1 flex-row-reverse">
                            <span className="text-[11px] uppercase tracking-wider text-green-700 font-bold">Sell {flip.maxQty?.toLocaleString()}</span>
                            <span className="text-[10px] text-green-600/70 font-medium">Qty</span>
                        </div>
                        <span className="text-xl font-black text-gray-900 tracking-tight">for {formatPrice(flip.sellPrice)}gp</span>
                        <div className="mt-1 pt-1 border-t border-green-200/50 flex justify-between items-center">
                            <span className="text-[10px] text-green-800/60 font-medium">Total Return</span>
                            <span className="text-xs font-bold text-green-900">{formatPrice(flip.maxQty * flip.sellPrice)}</span>
                        </div>
                        <div className="inset-x-0 bottom-0 h-0.5 bg-green-300/50 rounded-b-lg"></div>
                    </div>
                </div>

                {/* Secondary Metrics Grid */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 pt-4">
                    <div className="text-center px-1">
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">Profit/Item</p>
                        <p className="font-bold text-blue-600 text-sm">{formatPrice(flip.profitPer)}</p>
                    </div>
                    <div className="text-center px-1">
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">ROI</p>
                        <p className={`font-bold text-sm ${(flip.margin * 100) > 1 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {(flip.margin * 100).toFixed(2)}%
                        </p>
                    </div>
                    <div className="text-center px-1">
                        <div className="flex flex-col items-center">
                            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">Score</p>
                            <span className={`font-bold text-sm ${flipScoreColor}`}>
                                {flip.flipScore}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer: Potential Profit */}
            <div className="mt-auto bg-gray-800 p-3 px-5 flex justify-between items-center border-t border-gray-700/50">
                <div className="flex flex-col">
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Potential Profit (after 2% GE tax)</span>
                    <span className="text-xs text-gray-500">If all sold</span>
                </div>
                <div className="text-right">
                    <span className="block text-green-400 font-bold text-lg leading-none">{formatPrice(flip.totalProfit)}</span>
                </div>
            </div>
        </article>
    );
};

export default FlipCard;
