// /osrs/utils/formatting.js

export function formatTimeSince(timestamp) {
    if (!timestamp) return 'never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds} seconds ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

    const days = Math.floor(hours / 24);
    return days < 7 ? `${days} day${days !== 1 ? 's' : ''} ago` : 'over a week ago';
}

export function formatGrandExchangePrice(price) {
    if (price == null || typeof price !== 'number') return '-';
    if (price >= 10_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
    if (price >= 10_000) return `${(price / 1_000).toFixed(1)}K`;
    return price.toLocaleString();
}
