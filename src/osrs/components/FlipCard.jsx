import { useEffect, useRef, useState } from 'react';
import { Copy, Check, ArrowUpRight } from 'lucide-react';
import { formatGrandExchangePrice } from '../utils/formatting';

const exact = value => Number.isFinite(value) ? value.toLocaleString() : '—';

export default function FlipCard({ flip, rank }) {
    const [copyState, setCopyState] = useState('idle');
    const timer = useRef(null);
    useEffect(() => () => clearTimeout(timer.current), []);

    const copyName = async () => {
        clearTimeout(timer.current);
        try {
            await navigator.clipboard.writeText(flip.name);
            setCopyState('copied');
        } catch {
            setCopyState('error');
        }
        timer.current = setTimeout(() => setCopyState('idle'), 2500);
    };

    return (
        <article className="osrs-flip-card" aria-label={flip.name}>
            <div className="osrs-item-heading">
                <span className="osrs-item-icon"><img width="36" height="36" src={`https://oldschool.runescape.wiki/images/${encodeURIComponent(flip.icon?.replace(/ /g, '_') ?? '')}`} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} /></span>
                <div className="osrs-item-title"><span className="osrs-rank">Rank {rank} <span>· Score {flip.flipScore}/100</span></span><h3><a href={flip.wiki} target="_blank" rel="noopener noreferrer">{flip.name}<ArrowUpRight aria-hidden="true" size={13} /></a></h3></div>
                <button className="osrs-copy" type="button" onClick={copyName} aria-label={`Copy ${flip.name}`} title={`Copy ${flip.name}`}>{copyState === 'copied' ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}</button>
            </div>
            <span className="osrs-copy-status" role="status">{copyState === 'copied' ? 'Item name copied.' : copyState === 'error' ? 'Could not copy. Select the item name to copy it.' : ''}</span>
            <div className="osrs-item-meta"><span>Buy limit <strong>{exact(flip.limit)}</strong></span><span>Suggested quantity <strong>{exact(flip.maxQty)}</strong></span></div>
            <div className="osrs-price-pair">
                <div><span className="osrs-price-label">Buy / item</span><strong className="osrs-price">{exact(flip.buyPrice)} <small>GP</small></strong><span className="osrs-price-total">Cost <b title={`${exact(flip.maxQty * flip.buyPrice)} GP`}>{formatGrandExchangePrice(flip.maxQty * flip.buyPrice)} GP</b></span></div>
                <div><span className="osrs-price-label">Sell / item</span><strong className="osrs-price">{exact(flip.sellPrice)} <small>GP</small></strong><span className="osrs-price-total">Net proceeds <b title={`${exact(flip.maxQty * flip.taxedSell)} GP`}>{formatGrandExchangePrice(flip.maxQty * flip.taxedSell)} GP</b></span></div>
            </div>
            <dl className="osrs-metrics"><div><dt>Net / item</dt><dd>{exact(flip.profitPer)} <small>GP</small></dd></div><div><dt>Return</dt><dd>{(flip.margin * 100).toFixed(2)}%</dd></div><div><dt>Volume · 5m</dt><dd title={exact(flip.fiveMinHighVolume + flip.fiveMinLowVolume)}>{formatGrandExchangePrice(flip.fiveMinHighVolume + flip.fiveMinLowVolume)}</dd></div></dl>
            <div className="osrs-profit"><div><span>Estimated profit</span><small>After 2% tax · {exact(flip.maxQty)} items</small></div><strong title={`${exact(flip.totalProfit)} GP`}>{formatGrandExchangePrice(flip.totalProfit)} <small>GP</small></strong></div>
            <p className={`osrs-volatility ${flip.volatility > .15 ? 'is-high' : ''}`}>Price volatility <strong>{Number.isFinite(flip.volatility) ? `${(flip.volatility * 100).toFixed(1)}%` : 'Unavailable'}</strong>{flip.volatility > .15 && <span>Higher price variation</span>}</p>
        </article>
    );
}
