// Text Preprocessing
function preprocessText(text) {
    // Only lowercase the text but preserve word structure
    return text.toLowerCase().split(/\s+/).filter(word => word !== "");
}

// Utility function to find all substring occurrences
function findSubstringPositions(str, searchStr) {
    const positions = [];
    let pos = str.toLowerCase().indexOf(searchStr.toLowerCase());
    while (pos !== -1) {
        positions.push(pos);
        pos = str.toLowerCase().indexOf(searchStr.toLowerCase(), pos + 1);
    }
    return positions;
}

// Keyword Counting and Density
function analyzeKeywords(text, keywords) {
    const words = preprocessText(text);
    const keywordCounts = {};
    keywords.forEach(keyword => {
        keywordCounts[keyword] = { total: 0, inCluster: 0, positions: [] };
    });
    let totalKeywordsFound = 0;

    // Check each word for full and partial matches
    words.forEach((word, index) => {
        keywords.forEach(keyword => {
            if (word.toLowerCase().includes(keyword.toLowerCase())) {
                keywordCounts[keyword].total++;
                keywordCounts[keyword].positions.push(index);
                totalKeywordsFound++;
            }
        });
    });

    const density = words.length > 0 ? (totalKeywordsFound / words.length) * 100 : 0;
    return { counts: keywordCounts, density, totalKeywordsFound };
}

// Sliding Window for Cluster Analysis
function findLargestCluster(words, keywords, windowSize, keywordCounts) {
    if (words.length === 0 || keywords.length === 0 || windowSize <= 0 || windowSize > words.length) {
        return { start: -1, end: -1, density: 0 };
    }

    let maxDensity = 0;
    let maxStart = -1;
    let maxEnd = -1;
    let maxClusterKeywordCounts = {};

    keywords.forEach(keyword => {
        maxClusterKeywordCounts[keyword] = 0;
    });

    for (let i = 0; i <= words.length - windowSize; i++) {
        let currentDensity = 0;
        let currentClusterKeywordCounts = {};

        keywords.forEach(keyword => {
            currentClusterKeywordCounts[keyword] = 0;
        });

        for (let j = 0; j < windowSize; j++) {
            keywords.forEach(keyword => {
                if (words[i + j].toLowerCase().includes(keyword.toLowerCase())) {
                    currentDensity++;
                    currentClusterKeywordCounts[keyword]++;
                }
            });
        }

        if (currentDensity > maxDensity) {
            maxDensity = currentDensity;
            maxStart = i;
            maxEnd = i + windowSize - 1;
            maxClusterKeywordCounts = currentClusterKeywordCounts;
        }
    }

    if (maxStart !== -1) {
        for (const keyword in maxClusterKeywordCounts) {
            keywordCounts[keyword].inCluster = maxClusterKeywordCounts[keyword];
        }
    }
    return { start: maxStart, end: maxEnd, density: (maxDensity / windowSize) * 100 };
}

// Debouncing
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

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

// Main Analysis function
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

function updateUI(analysis, cluster) {
    // Update density metric
    document.getElementById('density-value').textContent = `${analysis.density.toFixed(1)}%`;
    document.getElementById('density-bar').style.width = `${Math.min(analysis.density, 100)}%`;

    // Update keywords found
    document.getElementById('keywords-found').textContent = analysis.totalKeywordsFound;

    // Update keyword stats
    const keywordStats = document.getElementById('keyword-stats');
    keywordStats.innerHTML = '';

    for (const keyword in analysis.counts) {
        const badge = document.createElement('div');
        badge.className = 'keyword-badge';
        badge.innerHTML = `
            ${keyword}: <span class="fw-bold">${analysis.counts[keyword].total}</span>
            <span class="text-muted">(${analysis.counts[keyword].inCluster} in cluster)</span>
        `;
        keywordStats.appendChild(badge);
    }

    // Update cluster info with enhanced visibility
    const jumpButton = document.getElementById('jump-to-cluster');
    if (cluster.start !== -1) {
        document.getElementById('cluster-info').textContent =
            `Cluster Density: ${cluster.density.toFixed(1)}%`;
        jumpButton.classList.remove('d-none');
    } else {
        jumpButton.classList.add('d-none');
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
            for (const keyword of Object.keys(analysis.counts)) {
                if (word.toLowerCase().includes(keyword.toLowerCase())) {
                    const positions = findSubstringPositions(word, keyword);
                    let lastPos = 0;
                    let highlighted = '';

                    positions.forEach(pos => {
                        highlighted += word.substring(lastPos, pos);
                        highlighted += `<span class="keyword-highlight${isInCluster ? ' fw-bold' : ''}">${word.substr(pos, keyword.length)}</span>`;
                        lastPos = pos + keyword.length;
                    });
                    highlighted += word.substring(lastPos);
                    wordToDisplay = highlighted;
                    hasMatch = true;
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

// Add these styles dynamically
const style = document.createElement('style');
style.textContent = `
    .cluster-word {
        background-color: rgba(209, 204, 76, 0.1);
        padding: 2px 0;
    }
    .cluster-word.has-keyword {
        background-color: rgba(249, 249, 29, 0.2);
    }
    .cluster-marker {
    width: 100%;
    height: 2px;
    background: linear-gradient(to right, transparent, #FFD54F, transparent);
    }
    #highlighted-text {
        max-height: 400px;
        overflow-y: auto;
        scroll-behavior: smooth;
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

// Event listeners with debouncing
const debouncedAnalyze = debounce(analyzeText, 300);

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
