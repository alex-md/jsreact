import React, { useMemo, useState } from 'react';
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

    const volatilityColor = useMemo(() => {
        if (!flip.volatility) return 'text-slate-500';
        if (flip.volatility > 0.15) return 'text-red-600';
        if (flip.volatility > 0.07) return 'text-amber-600';
        return 'text-emerald-600';
    }, [flip.volatility]);

    const flipScoreColor = useMemo(() => {
        if (!flip.flipScore) return 'text-slate-500';
        if (flip.flipScore >= 80) return 'text-emerald-600';
        if (flip.flipScore >= 65) return 'text-blue-600';
        if (flip.flipScore >= 50) return 'text-amber-600';
        return 'text-orange-600';
    }, [flip.flipScore]);

    const formatPrice = formatGrandExchangePrice;
    const iconUrl = `https://oldschool.runescape.wiki/images/${encodeURIComponent(flip.icon?.replace(/ /g, '_') ?? '')}`;

    return (
        <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 via-slate-200 to-emerald-500 opacity-80"></div>
            <div className="p-5 pl-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                            <img
                                src={iconUrl}
                                alt=""
                                className="h-9 w-9 object-contain"
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
                                    className="truncate text-lg font-semibold text-slate-900 transition hover:text-blue-600"
                                    title={`View ${flip.name} on OSRS Wiki`}
                                >
                                    {flip.name}
                                </a>
                                <button
                                    onClick={handleCopyName}
                                    className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 opacity-0 transition hover:text-slate-900 focus:opacity-100 focus:outline-none group-hover:opacity-100"
                                    aria-label="Copy item name"
                                >
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500">
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                                    GE Limit {flip.limit?.toLocaleString() ?? 'None'}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                                    5m Vol {formatPrice(flip.fiveMinHighVolume + flip.fiveMinLowVolume)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                        <span className={`rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold ${flipScoreColor}`}>
                            Score {flip.flipScore}
                        </span>
                        <span className={`text-xs font-semibold ${volatilityColor}`}>
                            {flip.volatility ? `${(flip.volatility * 100).toFixed(1)}% vol` : 'Volatility n/a'}
                        </span>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                            <span>Buy</span>
                            <span>{flip.maxQty?.toLocaleString()} qty</span>
                        </div>
                        <p className="mt-2 text-xl font-semibold text-slate-900">
                            {formatPrice(flip.buyPrice)} gp
                        </p>
                        <div className="mt-2 flex items-center justify-between border-t border-blue-100 pt-2 text-xs text-blue-800">
                            <span>Total cost</span>
                            <span className="font-semibold">{formatPrice(flip.maxQty * flip.buyPrice)}</span>
                        </div>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-right">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                            <span>Sell</span>
                            <span>{flip.maxQty?.toLocaleString()} qty</span>
                        </div>
                        <p className="mt-2 text-xl font-semibold text-slate-900">
                            {formatPrice(flip.sellPrice)} gp
                        </p>
                        <div className="mt-2 flex items-center justify-between border-t border-emerald-100 pt-2 text-xs text-emerald-800">
                            <span>Total return</span>
                            <span className="font-semibold">{formatPrice(flip.maxQty * flip.sellPrice)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center text-xs">
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400">Profit / Item</p>
                        <p className="mt-1 font-semibold text-blue-600">{formatPrice(flip.profitPer)}</p>
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400">ROI</p>
                        <p className={`mt-1 font-semibold ${(flip.margin * 100) > 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {(flip.margin * 100).toFixed(2)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400">Velocity</p>
                        <p className="mt-1 font-semibold text-slate-700">
                            {formatPrice(flip.fiveMinHighVolume + flip.fiveMinLowVolume)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-950 px-5 py-3 text-white">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300">
                    Potential Profit (after 2% tax)
                </div>
                <div className="text-lg font-semibold text-emerald-300">
                    {formatPrice(flip.totalProfit)} gp
                </div>
            </div>
        </article>
    );
};

export default FlipCard;
