import React, { useState, useEffect } from 'react';

const HighestDensityClusterDisplay = ({ text, keywords, windowSize, matchingStrategy, utils }) => {
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
        return (
            <div className="card-modern">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    🌟 Highest Density Cluster
                </h3>
                <p className="text-gray-600">No clusters found.</p>
            </div>
        );
    }

    return (
        <div className="card-modern">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                🌟 Highest Density Cluster
            </h3>
            <div className="space-y-2">
                <p className="text-gray-600">Text: {highestDensityCluster.text}</p>
                <p className="text-gray-600">
                    Start: {highestDensityCluster.start}, End: {highestDensityCluster.end}
                </p>
                <p className="text-gray-600">
                    Count: {highestDensityCluster.count}, Density: {highestDensityCluster.density.toFixed(2)}%
                </p>
            </div>
        </div>
    );
};

export default HighestDensityClusterDisplay;
