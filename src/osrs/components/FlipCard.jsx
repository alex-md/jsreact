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
        <article className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-gray-200 hover:shadow-md transition-all group relative flex flex-col h-full">
            {/* Header Section */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
                        <img
                            src={iconUrl}
                            alt=""
                            className="max-w-full max-h-full object-contain"
                            loading="lazy"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <a
                                href={flip.wiki}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-base sm:text-lg text-gray-900 hover:text-blue-600 hover:underline truncate"
                                title={`View ${flip.name} on OSRS Wiki`}
                            >
                                {flip.name}
                            </a>
                            <Tooltip title={copied ? "Copied!" : "Copy Name"} arrow>
                                <IconButton size="small" onClick={handleCopyName} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i className={`fas ${copied ? 'fa-check text-green-500' : 'fa-copy text-gray-400'} text-xs`}></i>
                                </IconButton>
                            </Tooltip>
                        </div>
                        <Typography variant="caption" className="text-gray-500 block truncate">
                            Limit: {flip.limit?.toLocaleString() ?? 'None'} • 5m Vol: {formatPrice(flip.fiveMinHighVolume + flip.fiveMinLowVolume)}
                        </Typography>
                    </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end">
                    <span className={`text-lg font-extrabold ${flipScoreColor}`}>
                        {flip.flipScore}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Score</span>
                </div>
            </div>

            {/* Price & Profit Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-blue-50/50 rounded-lg p-2 border border-blue-100/50">
                    <span className="text-xs text-blue-600/80 font-medium block mb-0.5">Target Buy</span>
                    <span className="text-sm font-bold text-gray-900">{formatPrice(flip.buyPrice)}</span>
                </div>
                <div className="bg-green-50/50 rounded-lg p-2 border border-green-100/50 text-right">
                    <span className="text-xs text-green-600/80 font-medium block mb-0.5">Target Sell</span>
                    <span className="text-sm font-bold text-gray-900">{formatPrice(flip.sellPrice)}</span>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-[10px] text-gray-500 uppercase block mb-1">Profit/Item</span>
                    <span className="font-bold text-blue-600 text-sm">{formatPrice(flip.profitPer)}</span>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-[10px] text-gray-500 uppercase block mb-1">ROI</span>
                    <span className={`font-bold text-sm ${(flip.margin * 100) > 1 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {(flip.margin * 100).toFixed(2)}%
                    </span>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-[10px] text-gray-500 uppercase block mb-1">Quantity</span>
                    <span className="font-bold text-gray-900 text-sm">{formatPrice(flip.maxQty)}</span>
                </div>
            </div>

            {/* Footer: Total Potential */}
            <div className="mt-auto bg-gray-900 rounded-lg p-3 flex justify-between items-center">
                <span className="text-gray-400 text-xs font-medium">Potential Profit</span>
                <span className="text-green-400 font-bold text-base">{formatPrice(flip.totalProfit)} gp</span>
            </div>
        </article>
    );
};

export default FlipCard;
