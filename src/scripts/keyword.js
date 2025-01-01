/**
 * Text Analysis and Keyword Detection Module
 * This module provides functionality for analyzing text content, detecting keywords,
 * and identifying keyword clusters with visualization capabilities.
 */

/**
 * Preprocesses input text by converting to lowercase and splitting into words.
 * Handles various edge cases and normalizes text for better analysis.
 * @param {string} text - The input text to preprocess
 * @returns {string[]} Array of preprocessed words
 */
function preprocessText(text) {
    if (!text) return [];
    
    return text
        .toLowerCase()
        // Normalize unicode characters
        .normalize('NFKD')
        // Replace smart quotes and dashes with standard ones
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        // Remove non-word characters except hyphens between words
        .replace(/[^a-z0-9\s-]|(?<=\s)-|-(?=\s)/g, ' ')
        // Split on whitespace
        .split(/\s+/)
        // Remove empty strings and trim each word
        .map(word => word.trim())
        .filter(word => word !== "");
}

/**
 * Finds all occurrences of a substring within a string, case-insensitive.
 * Uses optimized search algorithm and handles word boundaries.
 * @param {string} str - The string to search within
 * @param {string} searchStr - The substring to search for
 * @returns {number[]} Array of positions where the substring was found
 */
function findSubstringPositions(str, searchStr) {
    if (!str || !searchStr) return [];
    
    const positions = [];
    const lowerStr = str.toLowerCase();
    const lowerSearchStr = searchStr.toLowerCase();
    let pos = 0;
    
    while ((pos = lowerStr.indexOf(lowerSearchStr, pos)) !== -1) {
        // Check if the match is at word boundaries
        const beforeChar = pos === 0 ? ' ' : lowerStr[pos - 1];
        const afterChar = pos + lowerSearchStr.length >= lowerStr.length ? ' ' : lowerStr[pos + lowerSearchStr.length];
        
        // Only count if it's a whole word match or part of a hyphenated word
        if ((/[\s-]/.test(beforeChar) || pos === 0) && 
            (/[\s-]/.test(afterChar) || pos + lowerSearchStr.length === lowerStr.length)) {
            positions.push(pos);
        }
        pos += 1; // Move to next character to prevent infinite loop on overlapping matches
    }
    
    return positions;
}

/**
 * Analyzes text for keyword occurrences and calculates keyword density.
 * Provides detailed analysis including proximity and distribution metrics.
 * @param {string} text - The text to analyze
 * @param {string[]} keywords - Array of keywords to search for
 * @returns {Object} Analysis results including counts, density, and detailed metrics
 */
function analyzeKeywords(text, keywords) {
    if (!text || !keywords.length) {
        return { 
            counts: {}, 
            density: 0, 
            totalKeywordsFound: 0,
            totalWords: 0,
            averageDistance: 0,
            distribution: []
        };
    }

    const words = preprocessText(text);
    const keywordCounts = {};
    const distribution = new Array(10).fill(0); // Track distribution in 10 segments
    const segmentSize = Math.max(1, Math.floor(words.length / 10));
    
    keywords.forEach(keyword => {
        keywordCounts[keyword] = { 
            total: 0,          // Total occurrences
            inCluster: 0,      // Occurrences within densest cluster
            positions: [],     // Positions where keyword appears
            proximity: [],     // Distance to nearest other keyword
            segments: new Array(10).fill(0) // Distribution across text segments
        };
    });

    let totalKeywordsFound = 0;
    let lastKeywordPosition = -1;
    let minDistance = Infinity;
    let maxDistance = 0;

    // Analyze each word
    words.forEach((word, index) => {
        const segment = Math.min(9, Math.floor(index / segmentSize));
        
        keywords.forEach(keyword => {
            if (word.toLowerCase().includes(keyword.toLowerCase())) {
                keywordCounts[keyword].total++;
                keywordCounts[keyword].positions.push(index);
                keywordCounts[keyword].segments[segment]++;
                distribution[segment]++;
                totalKeywordsFound++;

                // Calculate proximity to other keywords
                if (lastKeywordPosition !== -1) {
                    const distance = index - lastKeywordPosition;
                    keywordCounts[keyword].proximity.push(distance);
                    minDistance = Math.min(minDistance, distance);
                    maxDistance = Math.max(maxDistance, distance);
                }
                lastKeywordPosition = index;
            }
        });
    });

    // Calculate average distance between keywords
    const averageDistance = totalKeywordsFound > 1 
        ? keywordCounts[Object.keys(keywordCounts)[0]].proximity.reduce((a, b) => a + b, 0) / 
          (totalKeywordsFound - 1)
        : 0;

    const density = words.length > 0 ? (totalKeywordsFound / words.length) * 100 : 0;

    return { 
        counts: keywordCounts, 
        density, 
        totalKeywordsFound,
        totalWords: words.length,
        averageDistance,
        minDistance: minDistance === Infinity ? 0 : minDistance,
        maxDistance,
        distribution,
        distributionPercentages: distribution.map(count => 
            (count / totalKeywordsFound * 100).toFixed(1)
        )
    };
}

/**
 * Identifies the largest cluster of keywords within a given window size.
 * Uses sliding window technique to find the most keyword-dense section of text.
 * @param {string[]} words - Array of preprocessed words
 * @param {string[]} keywords - Keywords to look for
 * @param {number} windowSize - Size of the sliding window
 * @param {Object} keywordCounts - Current keyword statistics
 * @returns {Object} Cluster information including start, end positions and density
 */
function findLargestCluster(words, keywords, windowSize, keywordCounts) {
    if (words.length === 0 || keywords.length === 0 || windowSize <= 0 || windowSize > words.length) {
        return { start: -1, end: -1, density: 0 };
    }

    let maxDensity = 0;
    let maxStart = -1;
    let maxEnd = -1;
    let maxClusterKeywordCounts = {};

    // Initialize cluster keyword counts
    keywords.forEach(keyword => {
        maxClusterKeywordCounts[keyword] = 0;
    });

    // First window calculation
        let currentDensity = 0;
        let currentClusterKeywordCounts = {};
        keywords.forEach(keyword => {
            currentClusterKeywordCounts[keyword] = 0;
        });

    // Calculate initial window
    for (let i = 0; i < windowSize && i < words.length; i++) {
            keywords.forEach(keyword => {
            if (words[i].toLowerCase().includes(keyword.toLowerCase())) {
                    currentDensity++;
                    currentClusterKeywordCounts[keyword]++;
                }
            });
        }

    // Update max if initial window is best so far
    if (currentDensity > maxDensity) {
        maxDensity = currentDensity;
        maxStart = 0;
        maxEnd = windowSize - 1;
        maxClusterKeywordCounts = { ...currentClusterKeywordCounts };
    }

    // Slide the window
    for (let i = 1; i <= words.length - windowSize; i++) {
        // Remove counts for word leaving the window
        keywords.forEach(keyword => {
            if (words[i - 1].toLowerCase().includes(keyword.toLowerCase())) {
                currentDensity--;
                currentClusterKeywordCounts[keyword]--;
            }
        });

        // Add counts for word entering the window
        keywords.forEach(keyword => {
            if (words[i + windowSize - 1].toLowerCase().includes(keyword.toLowerCase())) {
                currentDensity++;
                currentClusterKeywordCounts[keyword]++;
            }
        });

        // Update max if current window is better
        if (currentDensity > maxDensity) {
            maxDensity = currentDensity;
            maxStart = i;
            maxEnd = i + windowSize - 1;
            maxClusterKeywordCounts = { ...currentClusterKeywordCounts };
        }
    }

    // Update cluster counts in the keyword statistics
    if (maxStart !== -1) {
        for (const keyword in maxClusterKeywordCounts) {
            keywordCounts[keyword].inCluster = maxClusterKeywordCounts[keyword];
        }
    }

    return {
        start: maxStart,
        end: maxEnd,
        density: maxDensity > 0 ? (maxDensity / windowSize) * 100 : 0
    };
}

/**
 * Implements debouncing to prevent excessive function calls.
 * Useful for handling rapid user input events.
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Automatically determines optimal window size for cluster analysis based on:
 * - Text length
 * - Keyword frequency
 * - Average distance between keywords
 * - Overall keyword density
 * 
 * @param {string[]} words - Array of preprocessed words
 * @param {string[]} keywords - Keywords to analyze
 * @param {Object} keywordCounts - Current keyword statistics
 * @returns {number} Recommended window size
 */
function autoSelectWindow(words, keywords, keywordCounts) {
    if (words.length === 0 || keywords.length === 0) {
        return 3; // default minimum
    }

    // Calculate average keyword frequency
    let totalKeywordOccurrences = 0;
    let maxSingleKeywordCount = 0;
    for (const keyword in keywordCounts) {
        totalKeywordOccurrences += keywordCounts[keyword].total;
        maxSingleKeywordCount = Math.max(maxSingleKeywordCount, keywordCounts[keyword].total);
    }

    if (totalKeywordOccurrences === 0) {
        return Math.min(10, Math.max(3, Math.floor(words.length / 20)));
    }

    // Calculate average distance between keywords
    const avgDistance = words.length / totalKeywordOccurrences;

    // Dynamic max window size based on text length
    const dynamicMaxWindow = Math.min(500, Math.max(50, Math.floor(words.length * 0.2)));

    // Consider text length factor with adjusted scaling
    const lengthFactor = Math.log10(words.length);

    // Consider keyword density
    const density = (totalKeywordOccurrences / words.length);

    // Calculate window size based on multiple factors
    let windowSize = Math.round(
        avgDistance * 0.8 + // Base on average distance between keywords
        lengthFactor * 2 + // Add scaling factor based on text length
        (1 / density) * 0.3 // Adjust based on keyword density
    );

    // Ensure window size is within reasonable bounds
    windowSize = Math.max(3, Math.min(windowSize, Math.floor(words.length / 2)));
    windowSize = Math.min(windowSize, dynamicMaxWindow); // Dynamic cap

    return windowSize;
}

/**
 * Main analysis function that orchestrates the text analysis process.
 * Handles UI updates, loading states, and coordinates different analysis components.
 */
function analyzeText() {
    const text = textInput.value;
    const keywords = keywordInput.value.split(',').map(k => k.trim()).filter(k => k !== "");
    let windowSize = parseInt(windowSizeInput.value) || 3;

    if (text === "" || keywords.length === 0) {
        output.textContent = "Please enter text and keywords.";
        highlightedTextDiv.innerHTML = "";
        return;
    }

    loading.classList.remove("hidden");

    setTimeout(() => {
        const words = preprocessText(text);
        let analysis = analyzeKeywords(text, keywords);
        if (autoWindowCheckbox.checked) {
            windowSize = autoSelectWindow(words, keywords, analysis.counts);
            windowSizeInput.value = windowSize;
        }

        const cluster = findLargestCluster(words, keywords, windowSize, analysis.counts);

        updateUI(analysis, cluster);
        loading.classList.add("hidden");
    }, 200);

}

/**
 * Updates the UI with analysis results and visualizations.
 * @param {Object} analysis - Analysis results
 * @param {Object} cluster - Cluster information
 */
function updateUI(analysis, cluster) {
    // Update density metric
    document.getElementById('density-value').textContent = `${analysis.density.toFixed(1)}%`;
    document.getElementById('density-bar').style.width = `${Math.min(analysis.density, 100)}%`;

    // Update keywords found and total words
    document.getElementById('keywords-found').textContent = 
        `${analysis.totalKeywordsFound} / ${analysis.totalWords}`;

    // Update keyword stats with enhanced metrics
    const keywordStats = document.getElementById('keyword-stats');
    keywordStats.innerHTML = '';

    // Generate unique colors for each keyword
    const keywordColors = {};
    const baseHues = [210, 280, 25, 340, 120, 180, 60, 0, 300, 150];
    let colorIndex = 0;
    
    for (const keyword in analysis.counts) {
        const hue = baseHues[colorIndex % baseHues.length];
        keywordColors[keyword] = `hsl(${hue}, 85%, 75%)`;
        colorIndex++;

        const stat = document.createElement('div');
        stat.className = 'keyword-stat';
        
        // Calculate average distance for this keyword
        const avgProximity = analysis.counts[keyword].proximity.length > 0
            ? (analysis.counts[keyword].proximity.reduce((a, b) => a + b, 0) / 
               analysis.counts[keyword].proximity.length).toFixed(1)
            : 'N/A';

        // Create distribution bar
        const distributionBar = analysis.counts[keyword].segments
            .map((count, i) => {
                const percentage = analysis.totalKeywordsFound > 0 
                    ? (count / analysis.counts[keyword].total * 100).toFixed(1) 
                    : 0;
                return `<div class="h-full" style="width: 10%; background-color: ${keywordColors[keyword]}; opacity: ${Math.max(0.1, percentage/100)}"></div>`;
            })
            .join('');

        stat.innerHTML = `
            <div class="flex items-center gap-2 mb-2">
                <span class="text-gray-700 dark:text-gray-200 px-2 rounded" 
                    style="background-color: ${keywordColors[keyword]}">${keyword}</span>
                <span class="text-gray-900 dark:text-white font-medium">${analysis.counts[keyword].total}</span>
                <span class="text-gray-500 dark:text-gray-400">
                    (${analysis.counts[keyword].inCluster} in cluster)
                </span>
                <span class="text-gray-500 dark:text-gray-400 ml-auto">
                    Avg. Distance: ${avgProximity}
                </span>
            </div>
            <div class="space-y-2">
                <div class="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full flex">
                    ${distributionBar}
                </div>
                <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div class="keyword-bar" style="width: ${(analysis.counts[keyword].total / analysis.totalWords * 100).toFixed(1)}%; background-color: ${keywordColors[keyword]}"></div>
                </div>
            </div>
        `;
        keywordStats.appendChild(stat);
    }

    // Update cluster info with enhanced visibility
    const jumpButton = document.getElementById('jump-to-cluster');
    if (cluster.start !== -1) {
        document.getElementById('cluster-info').innerHTML = `
            <span class="font-medium">Cluster Density: ${cluster.density.toFixed(1)}%</span>
            <span class="text-sm text-gray-500 dark:text-gray-400">
                (Words ${cluster.start + 1}-${cluster.end + 1})
            </span>
        `;
        jumpButton.classList.remove('hidden');
        
        jumpButton.onclick = () => {
            const clusterStart = document.getElementById('cluster-start');
            if (clusterStart) {
                clusterStart.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center'
                });
                
                clusterStart.classList.add('pulse-highlight');
                setTimeout(() => {
                    clusterStart.classList.remove('pulse-highlight');
                }, 2000);
            }
        };
    } else {
        document.getElementById('cluster-info').textContent = 'No significant cluster found';
        jumpButton.classList.add('hidden');
    }

    // Update highlighted text with enhanced cluster visualization
    const words = textInput.value.split(/\s+/);
    let highlightedText = '';

    if (cluster.start !== -1) {
        // Add cluster markers
        words.forEach((word, index) => {
            const isInCluster = index >= cluster.start && index <= cluster.end;
            let wordToDisplay = word;
            let hasMatch = false;

            // Add cluster start marker
            if (index === cluster.start) {
                highlightedText += '<div class="cluster-marker start" id="cluster-start"></div>';
            }

            // Check for substring matches
            for (const keyword in analysis.counts) {
                if (word.toLowerCase().includes(keyword.toLowerCase())) {
                    // Highlight the entire word instead of just the substring
                    wordToDisplay = `<span class="keyword-highlight" style="background-color: ${keywordColors[keyword]};">${word}</span>`;
                    hasMatch = true;
                    break; // Use the first matching keyword's color if multiple matches
                }
            }

            highlightedText += isInCluster
                ? `<span class="cluster-word${hasMatch ? ' has-keyword' : ''}">${wordToDisplay}</span> `
                : `${wordToDisplay} `;

            // Add cluster end marker
            if (index === cluster.end) {
                highlightedText += '<div class="cluster-marker end" id="cluster-end"></div>';
            }
        });
    } else {
        // When no cluster is found, still highlight keywords
        words.forEach(word => {
            let wordToDisplay = word;
            let hasMatch = false;

            // Check for substring matches
            for (const keyword in analysis.counts) {
                if (word.toLowerCase().includes(keyword.toLowerCase())) {
                    // Highlight the entire word instead of just the substring
                    wordToDisplay = `<span class="keyword-highlight" style="background-color: ${keywordColors[keyword]};">${word}</span>`;
                    hasMatch = true;
                    break; // Use the first matching keyword's color if multiple matches
                }
            }

            highlightedText += `${wordToDisplay} `;
        });
    }

    document.getElementById('highlighted-text').innerHTML = highlightedText;

    // Add scroll-to-cluster functionality
    document.getElementById('jump-to-cluster').addEventListener('click', () => {
        const clusterStart = document.getElementById('cluster-start');
        if (clusterStart) {
            clusterStart.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

// Dynamic style injection for visualization components
const style = document.createElement('style');
style.textContent = `
    .cluster-word {
        padding: 2px 0;
    }
    .cluster-word.has-keyword {
        color: inherit;
    }
    .cluster-marker {
        width: 100%;
        height: 2px;
        background: linear-gradient(to right, transparent, #FFD54F, transparent);
        scroll-margin-top: 2rem;
    }
    .cluster-marker.pulse-highlight {
        animation: pulse 2s;
    }
    @keyframes pulse {
        0% {
            height: 2px;
            opacity: 1;
        }
        50% {
            height: 4px;
            opacity: 0.8;
        }
        100% {
            height: 2px;
            opacity: 1;
        }
    }
    #highlighted-text {
        min-height: 100px;
        width: 100%;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        white-space: pre-wrap;
        word-wrap: break-word;
        line-height: 1.6;
        position: relative;
        display: block;
    }
    #highlighted-text::-webkit-scrollbar {
        display: none;
    }
    .keyword-highlight {
        border-radius: 2px;
        padding: 0 2px;
        font-weight: 500;
        transition: opacity 0.2s ease;
    }
    .keyword-highlight:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(style);

// Get DOM elements
const textInput = document.getElementById('text-input');
const keywordInput = document.getElementById('keyword-input');
const output = document.getElementById('output');
const windowSizeInput = document.getElementById('window-size');
const highlightedTextDiv = document.getElementById('highlighted-text');
const loading = document.getElementById('loading');
const fileUpload = document.getElementById('file-upload');
const autoWindowCheckbox = document.getElementById('auto-window');

/**
 * Event Listeners Setup
 * Implements debounced analysis for text input changes
 * Handles file uploads and automatic window size adjustments
 */
const debouncedAnalyze = debounce(analyzeText, 300);

// Attach event listeners with debouncing for better performance
textInput.addEventListener('input', debouncedAnalyze);
keywordInput.addEventListener('input', debouncedAnalyze);
windowSizeInput.addEventListener('input', debouncedAnalyze);
autoWindowCheckbox.addEventListener('click', analyzeText); // Directly call analyzeText

fileUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        textInput.value = e.target.result;
        analyzeText();
    }

    reader.readAsText(file);
});

// Update event listeners
document.getElementById('auto-window').addEventListener('click', () => {
    const text = textInput.value;
    const keywords = keywordInput.value.split(',').map(k => k.trim()).filter(k => k !== "");
    const words = preprocessText(text);

    if (text && keywords.length > 0) {
        const analysis = analyzeKeywords(text, keywords);
        const newWindowSize = autoSelectWindow(words, keywords, analysis.counts);
        windowSizeInput.value = newWindowSize;
        analyzeText();
    }
});
