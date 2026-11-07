import { Search, X } from 'lucide-react';

export default function SearchForms({ searchQuery, onSearchQueryChange, onSearchSubmit, loading }) {
    const clear = () => onSearchQueryChange({ target: { value: '' } });
    return (
        <form className="osrs-search-form" role="search" onSubmit={event => { event.preventDefault(); onSearchSubmit(); }}>
            <label htmlFor="osrs-item-search">Find an item</label>
            <p>Compare estimated buy and sell prices from recent RuneScape Wiki trades.</p>
            <div className="osrs-search-row"><div className="osrs-search-field"><Search aria-hidden="true" size={17} /><input id="osrs-item-search" name="item" type="search" autoComplete="off" spellCheck={false} placeholder="e.g. Abyssal whip…" value={searchQuery} onChange={onSearchQueryChange} disabled={loading} />{searchQuery && <button type="button" onClick={clear} aria-label="Clear item search"><X aria-hidden="true" size={16} /></button>}</div><button className="osrs-button osrs-primary" type="submit" disabled={loading}>{loading ? 'Loading prices…' : 'Search prices'}</button></div>
        </form>
    );
}
