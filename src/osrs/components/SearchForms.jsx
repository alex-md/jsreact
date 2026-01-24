import React from 'react';

const SearchForms = ({
    searchQuery,
    onSearchQueryChange,
    onSearchSubmit,
    loading
}) => {

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearchSubmit();
    };

    const handleClear = () => {
        onSearchQueryChange({ target: { value: '' } });
    };

    return (
        <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                        Instant Buy/Sell Price Search
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        GE Tracker data updates only for active items. Prices shown are based on recent trading volume.
                    </p>
                </div>
                <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 sm:inline-flex">
                    Press Enter
                </span>
            </div>

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={onSearchQueryChange}
                        placeholder="Search item (e.g. Abyssal whip)"
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Search OSRS item"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                            aria-label="Clear search"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                        ) : (
                            <i className="fas fa-search"></i>
                        )}
                        Search prices
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={loading || !searchQuery}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Clear
                    </button>
                </div>
            </form>
        </section>
    );
};

export default SearchForms;
