import { trackAnalyticsEvent } from '@components/analytics.js';
import { useState, useEffect } from "react";

// Helper function to format currency
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export function DomainApp() {
    const [domainsInput, setDomainsInput] = useState("");
    const [domainList, setDomainList] = useState([]);
    const [results, setResults] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [requestTimestamps, setRequestTimestamps] = useState([]);
    const [requestsLeft, setRequestsLeft] = useState(60);

    useEffect(() => {
        const domains = domainsInput
            .split(/[\n,\s]+/)
            .map(domain => domain.trim().toLowerCase())
            .filter(domain => domain.length > 0);
        setDomainList([...new Set(domains)]);
    }, [domainsInput]);

    // Update requestsLeft every second
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const oneMinuteAgo = now - 60000;
            setRequestTimestamps(prev => prev.filter(ts => ts > oneMinuteAgo));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Update requestsLeft whenever requestTimestamps changes
    useEffect(() => {
        setRequestsLeft(60 - requestTimestamps.length);
    }, [requestTimestamps]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setResults([]);
        setSubmitted(true);

        if (domainList.length === 0) {
            setError("Please enter at least one domain name.");
            setSubmitted(false);
            return;
        }
        if (domainList.length > 20) {
            setError("Maximum 20 domains allowed per request.");
            setSubmitted(false);
            return;
        }

        if (domainList.some(domain => !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain))) {
            setError('Enter bare domain names such as example.com, without https:// or a path.');
            setSubmitted(false);
            return;
        }
        if (requestTimestamps.filter(ts => ts > Date.now() - 60000).length >= 60) {
            setError('Please wait a minute before requesting another appraisal.');
            setSubmitted(false);
            return;
        }
        trackAnalyticsEvent('appraisal_start', { item_count: domainList.length });
        // Track this request
        setRequestTimestamps(prev => {
            const now = Date.now();
            const oneMinuteAgo = now - 60000;
            const filtered = prev.filter(ts => ts > oneMinuteAgo);
            return [...filtered, now];
        });

        setLoading(true);
        try {
            const response = await fetch("https://valuation.humbleworth.com/api/valuation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domains: domainList }),
                signal: AbortSignal.timeout(15000),
            });
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || "Failed to fetch domain valuations");
            } else {
                if (!Array.isArray(data.valuations) || data.valuations.length === 0) throw new Error('No valuations returned');
                setResults(data.valuations);
                trackAnalyticsEvent('appraisal_complete', { item_count: data.valuations.length, result_status: 'success' });
            }
        } catch (err) {
            trackAnalyticsEvent('appraisal_complete', { result_status: 'error' });
            setError("Failed to connect to the appraisal service. Try again shortly, or open Humbleworth directly.");
            setResults([]);
        }
        setLoading(false);
        setTimeout(() => setSubmitted(false), 1000);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <div className="rounded-lg shadow-md border border-gray-200 bg-white p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <label className="block text-md font-medium mb-2 text-gray-700" htmlFor="domain-input">
                        <i className="fas fa-globe text-indigo-500 mr-2"></i>
                        Enter domain names <span className="font-normal text-sm text-gray-500">(up to 20, separated by line, space, or comma)</span>
                    </label>
                    <textarea
                        id="domain-input"
                        className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm p-3 bg-gray-50 shadow-sm transition-all min-h-[140px] resize-none"
                        rows={6}
                        value={domainsInput}
                        onChange={(e) => setDomainsInput(e.target.value)}
                        placeholder={'example.com\nexample.net'}
                        autoCapitalize="none"
                        spellCheck={false}
                        aria-describedby="domain-count-help"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
                        <span id="domain-count-help">{domainList.length} / 20 domains entered.</span>
                        <span className="italic">Requests left this minute: {requestsLeft}</span>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-base shadow-sm hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={loading || submitted || requestsLeft <= 0}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <span className="loading-spinner mr-2"></span> Appraising...
                            </span>
                        ) : (
                            <>
                                <i className="fas fa-magic mr-1"></i>Calculate Value
                            </>
                        )}
                    </button>
                    {error && (
                        <div role="alert" className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm shadow-sm">
                            <i className="fas fa-exclamation-triangle mr-2"></i>{error}
                            {error.includes("Humbleworth") && <a className="block mt-2 underline" href="https://humbleworth.com/" target="_blank" rel="noopener noreferrer">Open Humbleworth</a>}
                        </div>
                    )}
                </form>
            </div>

            <div role="status" aria-live="polite" className="sr-only">{loading ? "Appraising domains" : results.length ? `${results.length} appraisals ready` : ""}</div>
            {results.length > 0 && (
                <div className="rounded-lg shadow-md border border-gray-200 bg-white p-6 md:p-8 animate-fade-in-up">
                    <h2 className="text-lg font-semibold mb-5 text-gray-800 flex items-center gap-2">
                        <i className="fas fa-coins text-green-500"></i> Appraisal Results
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Domain</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-600 whitespace-nowrap" title="Estimated value if sold in a competitive auction setting.">Auction Value</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-600 whitespace-nowrap" title="Estimated value for direct sales on domain marketplaces.">Marketplace Value</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-600 whitespace-nowrap" title="Estimated value if sold through a domain brokerage service.">Brokerage Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((val, index) => (
                                    <tr key={val.domain} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'} hover:bg-indigo-50/50 transition-colors`}>
                                        <td className="py-3 px-4 font-mono text-indigo-700 font-medium">{val.domain}</td>
                                        <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(val.auction)}</td>
                                        <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(val.marketplace)}</td>
                                        <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(val.brokerage)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
