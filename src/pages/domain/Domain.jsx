import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";

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

    useEffect(() => {
        const domains = domainsInput
            .split(/[\n,\s]+/)
            .map(domain => domain.trim())
            .filter(domain => domain.length > 0);
        setDomainList(domains);
    }, [domainsInput]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setResults([]);
        setSubmitted(true);

        if (domainList.length === 0) {
            setError("Please enter at least one domain name.");
            return;
        }
        if (domainList.length > 20) {
            setError("Maximum 20 domains allowed per request.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("https://valuation.humbleworth.com/api/valuation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domains: domainList }),
            });
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || "Failed to fetch domain valuations");
            } else {
                setResults(data.results || []);
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            setError("Failed to connect to the appraisal service. Please check your connection and try again.");
            setResults([]);
        }
        setLoading(false);
        setTimeout(() => setSubmitted(false), 1000);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-10 mt-10 animate-fade-in">
            <div className="rounded-xl shadow-lg border border-gray-100 bg-white/70 backdrop-blur p-6 relative overflow-hidden">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <label className="block text-base font-semibold mb-2 text-gray-700" htmlFor="domain-input">
                        <i className="fas fa-globe text-blue-400 mr-2"></i>
                        Enter domain names <span className="font-normal text-gray-400">(up to 20, one per line or separated by space/comma):</span>
                    </label>
                    <textarea
                        id="domain-input"
                        className="w-full rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 font-mono text-base p-3 bg-white/70 shadow-inner transition-all min-h-[120px] resize-none"
                        rows={6}
                        value={domainsInput}
                        onChange={(e) => setDomainsInput(e.target.value)}
                        placeholder="example.com\nexample.net"
                        aria-describedby="domain-count-help"
                    />
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span id="domain-count-help">{domainList.length} / 20 domains entered.</span>
                        <span className="italic">60 req/min.</span>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 text-white font-semibold text-base shadow hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-150 flex items-center justify-center gap-2"
                        disabled={loading || submitted}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <span className="loading-spinner mr-2"></span> Appraising...
                            </span>
                        ) : (
                            <>
                                <i className="fas fa-magic mr-2"></i>Appraise Domains
                            </>
                        )}
                    </button>
                    {error && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-100 text-red-600 rounded text-xs shadow-sm">
                            <i className="fas fa-exclamation-triangle mr-1"></i>{error}
                        </div>
                    )}
                </form>
            </div>

            {results.length > 0 && (
                <div className="rounded-xl shadow-lg border border-green-100 bg-white/80 backdrop-blur p-6 animate-fade-in-up">
                    <h2 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2">
                        <i className="fas fa-coins"></i> Appraisal Results
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-base border-separate border-spacing-y-1">
                            <thead>
                                <tr>
                                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Domain</th>
                                    <th className="text-right py-2 px-3 font-semibold text-gray-600" title="Estimated value if sold in a competitive auction setting.">Auction</th>
                                    <th className="text-right py-2 px-3 font-semibold text-gray-600" title="Estimated value for direct sales on domain marketplaces.">Marketplace</th>
                                    <th className="text-right py-2 px-3 font-semibold text-gray-600" title="Estimated value if sold through a domain brokerage service.">Brokerage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((val) => (
                                    <tr key={val.domain} className="bg-green-50/40 hover:bg-green-100/60 transition-colors rounded shadow-sm">
                                        <td className="py-2 px-3 font-mono text-blue-800 font-medium rounded-l-lg">{val.domain}</td>
                                        <td className="py-2 px-3 text-right text-green-700 font-semibold">{formatCurrency(val.auction)}</td>
                                        <td className="py-2 px-3 text-right text-green-700 font-semibold">{formatCurrency(val.marketplace)}</td>
                                        <td className="py-2 px-3 text-right text-green-700 font-semibold rounded-r-lg">{formatCurrency(val.brokerage)}</td>
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

// Mount the React app when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("root");
    if (!container) {
        console.error("Root element #root not found in the DOM.");
        return;
    }

    try {
        const root = createRoot(container);
        root.render(
            <StrictMode>
                <DomainApp />
            </StrictMode>
        );
    } catch (error) {
        console.error("Error mounting React app:", error);
    }
});
