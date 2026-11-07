import { ArrowUpRight } from 'lucide-react';

export default function ItemLookupResult({ data, formatPrice }) {
    const { item, buyData, sellData, wiki } = data;
    const profit = buyData && sellData ? sellData.taxedSellPrice - buyData.weightedLowPrice : null;
    return (
        <article className="osrs-lookup-card" aria-label={item.name}>
            <div className="osrs-item-heading"><span className="osrs-item-icon"><img width="36" height="36" src={`https://oldschool.runescape.wiki/images/${encodeURIComponent(item.icon?.replace(/ /g, '_') ?? '')}`} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} /></span><div className="osrs-item-title"><span className="osrs-rank">Buy limit {item.limit?.toLocaleString() ?? 'Unavailable'}</span><h3><a href={wiki} target="_blank" rel="noopener noreferrer">{item.name}<ArrowUpRight aria-hidden="true" size={13} /></a></h3></div></div>
            <div className="osrs-price-pair">
                <div><span className="osrs-price-label">Buy estimate / item</span><strong className="osrs-price">{buyData ? buyData.weightedLowPrice.toLocaleString() : '—'} <small>GP</small></strong><dl className="osrs-lookup-metrics"><div><dt>Latest low</dt><dd>{formatPrice(buyData?.latestLow)}</dd></div><div><dt>5m average</dt><dd>{formatPrice(buyData?.fiveMinLow)}</dd></div><div><dt>5m volume</dt><dd>{formatPrice(buyData?.lowPriceVolume)}</dd></div></dl>{!buyData && <p className="osrs-help">Not enough recent buy data.</p>}</div>
                <div><span className="osrs-price-label">Sell estimate / item</span><strong className="osrs-price">{sellData ? sellData.weightedHighPrice.toLocaleString() : '—'} <small>GP</small></strong><dl className="osrs-lookup-metrics"><div><dt>Latest high</dt><dd>{formatPrice(sellData?.latestHigh)}</dd></div><div><dt>5m average</dt><dd>{formatPrice(sellData?.fiveMinHigh)}</dd></div><div><dt>5m volume</dt><dd>{formatPrice(sellData?.highPriceVolume)}</dd></div></dl>{!sellData && <p className="osrs-help">Not enough recent sell data.</p>}</div>
            </div>
            {profit !== null && <div className={`osrs-profit ${profit < 0 ? 'is-negative' : ''}`}><div><span>Estimated net / item</span><small>Based on the price estimates above</small></div><strong>{formatPrice(profit)} <small>GP</small></strong></div>}
        </article>
    );
}
