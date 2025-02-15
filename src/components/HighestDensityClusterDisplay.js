const HighestDensityClusterDisplay = ({ text, keywords, windowSize, matchingStrategy, utils }) => {
    const { createElement: h, useState, useEffect } = React;
    const [highestDensityCluster, setHighestDensityCluster] = useState(null);

    useEffect(() => {
        if (!text || !keywords.length) {
            setHighestDensityCluster(null);
            return;
        }

        const allClusters = keywords.flatMap(keyword =>
            utils.findKeywordClusters(text, keyword, windowSize, matchingStrategy)
        );
        const sortedClusters = allClusters.sort((a, b) => b.density - a.density);
        setHighestDensityCluster(sortedClusters[0] || null);
    }, [text, keywords, windowSize, matchingStrategy, utils]);

    if (!highestDensityCluster) {
        return h('div', { className: 'card-modern' },
            h('h3', { className: 'text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2' }, '🌟 Highest Density Cluster'),
            h('p', { className: 'text-gray-600' }, 'No clusters found.')
        );
    }

    return h('div', { className: 'card-modern' },
        h('h3', { className: 'text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2' }, '🌟 Highest Density Cluster'),
        h('div', { className: 'space-y-2' },
            h('p', { className: 'text-gray-600' }, `Text: ${highestDensityCluster.text}`),
            h('p', { className: 'text-gray-600' }, `Start: ${highestDensityCluster.start}, End: ${highestDensityCluster.end}`),
            h('p', { className: 'text-gray-600' }, `Count: ${highestDensityCluster.count}, Density: ${highestDensityCluster.density.toFixed(2)}%`)
        )
    );
};

// Make component available globally
window.HighestDensityClusterDisplay = HighestDensityClusterDisplay;
export default HighestDensityClusterDisplay;
console.log('HighestDensityClusterDisplay.js loaded successfully');
