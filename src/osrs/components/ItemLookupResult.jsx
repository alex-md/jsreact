import React from 'react';

const ItemLookupResult = ({ data, formatPrice }) => {
    const { item, buyData, sellData, wiki } = data;

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <a
                    href={wiki}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-2 text-base font-semibold text-slate-900 transition hover:text-blue-600"
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                        <img
                            src={`https://oldschool.runescape.wiki/images/${encodeURIComponent(item.icon?.replace(/ /g, '_') ?? '')}`}
                            alt=""
                            className="h-6 w-6 object-contain"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    </span>
                    <span className="truncate">{item.name}</span>
                </a>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Limit {item.limit ?? 'None'}
                </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                        <span>Insta-Buy</span>
                        {buyData && (
                            <span className="text-[10px] font-medium text-blue-500">
                                {Math.round(buyData.confidence * 100)}% conf.
                            </span>
                        )}
                    </div>
                    {buyData ? (
                        <>
                            <p className="mt-2 text-lg font-semibold text-slate-900">{formatPrice(buyData.weightedLowPrice)} gp</p>
                            <div className="mt-2 space-y-1 text-xs text-slate-600">
                                <div className="flex items-center justify-between">
                                    <span>Latest Low</span>
                                    <span className="font-semibold">{formatPrice(buyData.latestLow)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>5m Avg</span>
                                    <span className="font-semibold">{formatPrice(buyData.fiveMinLow)}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-blue-100 pt-2">
                                    <span>Volume (5m)</span>
                                    <span className="font-semibold">{formatPrice(buyData.lowPriceVolume)}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="mt-2 text-sm text-slate-500 italic">Insufficient buy data</p>
                    )}
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                        <span>Insta-Sell</span>
                        {sellData && (
                            <span className="text-[10px] font-medium text-emerald-500">
                                {Math.round(sellData.confidence * 100)}% conf.
                            </span>
                        )}
                    </div>
                    {sellData ? (
                        <>
                            <p className="mt-2 text-lg font-semibold text-slate-900">{formatPrice(sellData.weightedHighPrice)} gp</p>
                            <div className="mt-2 space-y-1 text-xs text-slate-600">
                                <div className="flex items-center justify-between">
                                    <span>Latest High</span>
                                    <span className="font-semibold">{formatPrice(sellData.latestHigh)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>5m Avg</span>
                                    <span className="font-semibold">{formatPrice(sellData.fiveMinHigh)}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-emerald-100 pt-2">
                                    <span>Volume (5m)</span>
                                    <span className="font-semibold">{formatPrice(sellData.highPriceVolume)}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="mt-2 text-sm text-slate-500 italic">Insufficient sell data</p>
                    )}
                </div>
            </div>

            {buyData && sellData && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Potential Profit</p>
                        <p className="font-semibold text-emerald-600">
                            {formatPrice(sellData.taxedSellPrice - buyData.weightedLowPrice)} gp
                        </p>
                    </div>
                    <div className="h-8 w-px bg-slate-200"></div>
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">ROI</p>
                        <p className="font-semibold text-blue-600">
                            {(sellData.suggestedMargin * 100).toFixed(2)}%
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItemLookupResult;
