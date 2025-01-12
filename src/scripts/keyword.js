/**
 * Text Analysis and Keyword Detection Module
 * This module provides functionality for analyzing text content, detecting keywords,
 * and identifying keyword clusters with visualization capabilities.
 */

// State management using a custom hook-like pattern
const createState = (initialValue) => {
    let value = initialValue;
    const listeners = new Set();

    return {
        get: () => value,
        set: (newValue) => {
            value = newValue;
            listeners.forEach(listener => listener(value));
        },
        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }
    };
};

// Application state
const state = {
    text: createState(''),
    keywords: createState([]),
    results: createState(null),
    fileContent: createState(null),
    windowSize: createState(100)
};

// Utility functions
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Text preprocessing with advanced handling of special cases
 * @param {string} text - Raw input text
 * @returns {string[]} Array of processed words
 */
const preprocessText = (text) => {
    if (!text) return [];
    
    return text
        .toLowerCase()
        .normalize('NFKD')
        // Handle smart quotes only
        .replace(/[\u201C\u201D]/g, '"')
        // Handle em/en dashes
        .replace(/[\u2013\u2014]/g, '-')
        // Remove HTML tags if present
        .replace(/<[^>]*>/g, ' ')
        // Split on word boundaries while preserving punctuation
        .split(/\b/)
        .map(word => word.trim())
        // Keep words with apostrophes and hyphens
        .filter(word => /[\w''-]+/.test(word));
};

/**
 * Finds the window with the highest keyword density by checking every possible position
 * @param {string[]} words - Array of preprocessed words
 * @param {string} keyword - Keyword to search for
 * @param {number} windowSize - Size of the sliding window
 * @returns {Object} Information about the highest density window
 */
const findDensestWindow = (words, keyword, windowSize) => {
    let bestWindow = {
        start: 0,
        end: 0,
        count: 0,
        density: 0
    };

    // Check every possible window position
    for (let start = 0; start <= words.length - windowSize; start++) {
        let count = 0;
        
        // Count occurrences in this window
        for (let pos = start; pos < start + windowSize; pos++) {
            if (words[pos].includes(keyword.toLowerCase())) {
                count++;
            }
        }

        // Calculate density for this window
        const density = count / windowSize;

        // Update if this is the densest window found
        if (density > bestWindow.density || 
            (density === bestWindow.density && count > bestWindow.count)) {
            bestWindow = {
                start,
                end: start + windowSize - 1,
                count,
                density
            };
        }
    }

    return bestWindow;
};

/**
 * Advanced keyword analysis with sliding window and intersection detection
 * @param {string} text - Input text
 * @param {string[]} keywords - Array of keywords
 * @param {number} windowSize - Size of the sliding window in words
 * @returns {Object} Comprehensive analysis results
 */
const analyzeText = (text, keywords, windowSize) => {
    const words = preprocessText(text);
    if (!words.length || !keywords.length) return null;

    // Calculate distribution segments based on text length
    // Aim for segments of roughly 100-200 words each, with a minimum of 10 segments
    const segmentSize = Math.max(100, Math.floor(words.length / 20));
    const numSegments = Math.max(10, Math.ceil(words.length / segmentSize));

    const results = {
        totalWords: words.length,
        keywordResults: {},
        distribution: new Array(numSegments).fill(0),
        intersections: [],
        windowSize
    };

    // Initialize keyword tracking
    keywords.forEach(keyword => {
        results.keywordResults[keyword] = {
            occurrences: 0,
            positions: [],
            density: 0,
            highestDensityRegion: null
        };
    });

    // First pass: collect all keyword positions and total occurrences
    words.forEach((word, index) => {
        keywords.forEach(keyword => {
            if (word.includes(keyword.toLowerCase())) {
                results.keywordResults[keyword].occurrences++;
                results.keywordResults[keyword].positions.push(index);
                results.distribution[Math.floor(index / (words.length / numSegments))]++;
            }
        });
    });

    // Find highest density region for each keyword
    keywords.forEach(keyword => {
        const data = results.keywordResults[keyword];
        if (data.occurrences === 0) return;

        // Find the densest window for this keyword
        const densestWindow = findDensestWindow(words, keyword, windowSize);

        // Calculate text positions for highlighting
        let textStart = 0;
        let textEnd = 0;
        let currentPos = 0;
        const textWords = text.split(/\b/);

        for (let i = 0; i < textWords.length; i++) {
            if (i === densestWindow.start) textStart = currentPos;
            if (i === densestWindow.end + 1) {
                textEnd = currentPos;
                break;
            }
            currentPos += textWords[i].length;
        }

        // Store the results
        data.highestDensityRegion = {
            start: densestWindow.start,
            end: densestWindow.end,
            count: densestWindow.count,
            density: densestWindow.density * 100,
            textStart: textStart,
            textEnd: textEnd || text.length,
            text: words.slice(
                Math.max(0, densestWindow.start - 5),
                Math.min(words.length, densestWindow.end + 6)
            ).join(' ')
        };

        data.density = (data.occurrences / words.length) * 100;
    });

    // Find intersections where multiple keywords appear in the same window
    for (let start = 0; start <= words.length - windowSize; start++) {
        const keywordCounts = keywords.map(keyword => {
            let count = 0;
            for (let pos = start; pos < start + windowSize; pos++) {
                if (words[pos].includes(keyword.toLowerCase())) {
                    count++;
                }
            }
            return { keyword, count };
        });

        // Only consider windows where all keywords appear at least once
        if (keywordCounts.every(k => k.count > 0)) {
            const totalCount = keywordCounts.reduce((sum, k) => sum + k.count, 0);
            results.intersections.push({
                start,
                end: start + windowSize - 1,
                score: totalCount / windowSize,
                counts: keywordCounts,
                text: words.slice(
                    Math.max(0, start - 5),
                    Math.min(words.length, start + windowSize + 5)
                ).join(' ')
            });
        }
    }

    // Sort intersections by density score and then by total occurrences
    results.intersections.sort((a, b) => {
        const totalA = a.counts.reduce((sum, k) => sum + k.count, 0);
        const totalB = b.counts.reduce((sum, k) => sum + k.count, 0);
        if (a.score === b.score) return totalB - totalA;
        return b.score - a.score;
    });

    return results;
};

/**
 * Finds the highest density region across all keywords
 * @param {string[]} words - Processed words array
 * @param {Object} results - Analysis results
 * @param {string} originalText - The original text for character position mapping
 * @returns {Object} Region with highest keyword density
 */
const findHighestDensityRegion = (words, results, originalText) => {
    const windowSize = results.windowSize;
    let bestWindow = {
        start: 0,
        end: 0,
        count: 0,
        density: 0
    };

    // Check every possible window position
    for (let start = 0; start <= words.length - windowSize; start++) {
        let count = 0;
        
        // Count all keyword occurrences in this window
        for (let pos = start; pos < start + windowSize; pos++) {
            Object.keys(results.keywordResults).forEach(keyword => {
                if (words[pos].includes(keyword.toLowerCase())) {
                    count++;
                }
            });
        }

        // Calculate density for this window
        const density = count / windowSize;

        // Update if this is the densest window found
        if (density > bestWindow.density || 
            (density === bestWindow.density && count > bestWindow.count)) {
            bestWindow = {
                start,
                end: start + windowSize - 1,
                count,
                density
            };
        }
    }

    if (bestWindow.count > 0) {
        // Calculate text positions for highlighting
        let textStart = 0;
        let textEnd = 0;
        let currentPos = 0;
        const textWords = originalText.split(/\b/);

        for (let i = 0; i < textWords.length; i++) {
            if (i === bestWindow.start) textStart = currentPos;
            if (i === bestWindow.end + 1) {
                textEnd = currentPos;
                break;
            }
            currentPos += textWords[i].length;
        }

        return {
            start: bestWindow.start,
            end: bestWindow.end,
            count: bestWindow.count,
            density: bestWindow.density * 100,
            textStart: textStart,
            textEnd: textEnd || originalText.length
        };
    }

    return null;
};

/**
 * Highlights keywords in text and marks the highest density region
 * @param {string} text - Original text
 * @param {string[]} keywords - Keywords to highlight
 * @param {Object} densityRegion - Region with highest keyword density
 * @returns {string} HTML with highlighted text
 */
const highlightText = (text, keywords, densityRegion) => {
    // First, escape HTML special characters
    text = text.replace(/[&<>"]/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
    }[char]));

    // Create a map of positions where highlights should start and end
    const highlights = new Map();
    
    // Add keyword highlights
    keywords.forEach(keyword => {
        let position = -1;
        const keywordLower = keyword.toLowerCase();
        const textLower = text.toLowerCase();
        
        while ((position = textLower.indexOf(keywordLower, position + 1)) !== -1) {
            highlights.set(position, {
                type: 'start',
                class: 'bg-yellow-300'
            });
            highlights.set(position + keyword.length, {
                type: 'end'
            });
        }
    });

    // Add density region highlight if exists
    if (densityRegion) {
        // Find the exact text position of the intersection
        const intersectionStart = text.indexOf(densityRegion.text);
        if (intersectionStart !== -1) {
            highlights.set(intersectionStart, {
                type: 'start',
                class: 'bg-green-300'
            });
            highlights.set(intersectionStart + densityRegion.text.length, {
                type: 'end'
            });
        }
    }

    // Apply highlights
    const positions = Array.from(highlights.entries())
        .sort((a, b) => b[0] - a[0]); // Sort in reverse order to maintain positions

    for (const [pos, highlight] of positions) {
        if (highlight.type === 'end') {
            text = text.slice(0, pos) + '</span>' + text.slice(pos);
        } else {
            text = text.slice(0, pos) + 
                  `<span class="${highlight.class}">` + 
                  text.slice(pos);
        }
    }

    return text;
};

// UI update functions
const updateUI = (results) => {
    if (!results) return;

    // Update overview section
    document.getElementById('total-words').textContent = results.totalWords.toLocaleString();
    document.getElementById('total-keywords').textContent = 
        Object.values(results.keywordResults)
            .reduce((sum, k) => sum + k.occurrences, 0)
            .toLocaleString();
    
    const overallDensity = 
        Object.values(results.keywordResults)
            .reduce((sum, k) => sum + k.density, 0);
    document.getElementById('keyword-density').textContent = 
        overallDensity.toFixed(2) + '%';

    // Update intersection score
    const bestIntersection = results.intersections[0];
    document.getElementById('intersection-score').textContent = 
        bestIntersection ? (bestIntersection.score * 100).toFixed(2) : '0';

    // Update keyword table
    const tableBody = document.getElementById('keyword-table');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    Object.entries(results.keywordResults).forEach(([keyword, data]) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 cursor-pointer';
        
        // Create highlighted cluster text
        let clusterText = data.highestDensityRegion ? data.highestDensityRegion.text : 'N/A';
        if (clusterText !== 'N/A') {
            clusterText = clusterText.replace(
                new RegExp(escapeRegExp(keyword), 'gi'),
                match => `<span class="bg-yellow-200 px-1 rounded">${match}</span>`
            );
        }
        
        row.innerHTML = `
            <td class="px-4 py-3 text-sm text-gray-900 font-medium">${keyword}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${data.occurrences.toLocaleString()}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${data.density.toFixed(2)}%</td>
            <td class="px-4 py-3 text-sm text-gray-900">${clusterText}</td>
        `;
        tableBody.appendChild(row);
    });

    // Update intersection section
    const intersectionText = document.getElementById('intersection-text');
    if (intersectionText && bestIntersection) {
        // Highlight all keywords in the intersection text
        let highlightedText = bestIntersection.text;
        state.keywords.get().forEach(keyword => {
            highlightedText = highlightedText.replace(
                new RegExp(escapeRegExp(keyword), 'gi'),
                match => `<span class="bg-green-200 px-1 rounded">${match}</span>`
            );
        });
        intersectionText.innerHTML = highlightedText;
        document.getElementById('intersection-section')?.classList.remove('hidden');
    } else if (document.getElementById('intersection-section')) {
        document.getElementById('intersection-section').classList.add('hidden');
    }

    // Update distribution chart with highlighted bars
    const chart = document.getElementById('distribution-chart');
    if (!chart) return;
    
    chart.innerHTML = '';
    chart.className = 'h-48 flex items-end gap-2 mt-4';
    
    const maxCount = Math.max(...results.distribution);
    results.distribution.forEach((count, i) => {
        const barWrapper = document.createElement('div');
        barWrapper.className = 'flex-1 flex flex-col items-center group relative';
        
        const bar = document.createElement('div');
        const height = count ? (count / maxCount) * 100 : 0;
        bar.className = 'w-full bg-primary/80 transition-all duration-300 group-hover:bg-primary cursor-pointer rounded-t';
        bar.style.height = `${height}%`;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded transition-opacity duration-200';
        tooltip.textContent = `${count} keywords`;
        
        const label = document.createElement('div');
        label.className = 'text-xs text-gray-500 mt-1';
        label.textContent = count;
        
        barWrapper.appendChild(tooltip);
        barWrapper.appendChild(bar);
        barWrapper.appendChild(label);
        chart.appendChild(barWrapper);
    });

    // Update full text with highlights
    const fullText = state.text.get();
    if (!fullText) return;
    
    const highlightedText = document.createElement('div');
    highlightedText.className = 'mt-6 p-4 bg-gray-50 rounded-lg text-gray-900 whitespace-pre-wrap';
    
    // Create highlighted version of the full text
    let processedText = fullText;
    
    // First highlight intersections (green)
    if (bestIntersection) {
        const intersectionRegex = new RegExp(escapeRegExp(bestIntersection.text), 'g');
        processedText = processedText.replace(
            intersectionRegex,
            match => `<span class="bg-green-200 px-1 rounded">${match}</span>`
        );
    }
    
    // Then highlight individual keywords (yellow)
    state.keywords.get().forEach(keyword => {
        const keywordRegex = new RegExp(escapeRegExp(keyword), 'gi');
        processedText = processedText.replace(
            keywordRegex,
            match => `<span class="bg-yellow-200 px-1 rounded">${match}</span>`
        );
    });
    
    highlightedText.innerHTML = processedText;
    
    // Add or update the highlighted text section
    let highlightedSection = document.getElementById('highlighted-text-section');
    if (!highlightedSection) {
        highlightedSection = document.createElement('div');
        highlightedSection.id = 'highlighted-text-section';
        highlightedSection.className = 'bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200';
        highlightedSection.innerHTML = `
            <div class="p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Full Text Analysis</h2>
                <div id="highlighted-text"></div>
            </div>
        `;
        document.getElementById('results-section')?.appendChild(highlightedSection);
    }
    
    const highlightedTextContainer = document.getElementById('highlighted-text');
    if (highlightedTextContainer) {
        highlightedTextContainer.innerHTML = '';
        highlightedTextContainer.appendChild(highlightedText);
    }

    // Show results section
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.classList.remove('hidden');
    }
};

// Utility function to escape special characters in regex
const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Event handlers
const handleTextInput = debounce(() => {
    const inputElement = document.getElementById('input-text');
    if (!inputElement) return;
    
    const text = inputElement.value;
    console.log('Text input updated:', text.slice(0, 50) + '...');
    state.text.set(text);
}, 300);

const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        const text = await file.text();
        const inputElement = document.getElementById('input-text');
        if (inputElement) {
            inputElement.value = text;
            state.text.set(text);
        }
    } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please try again.');
    }
};

const handleAddKeyword = () => {
    const input = document.getElementById('keyword-input');
    if (!input) return;
    
    const keyword = input.value.trim();
    
    if (keyword && !state.keywords.get().includes(keyword)) {
        console.log('Adding keyword:', keyword);
        state.keywords.set([...state.keywords.get(), keyword]);
        input.value = '';
        updateKeywordsList(state.keywords.get());
        // Trigger analysis if we have text
        if (state.text.get()) {
            handleAnalyze();
        }
    }
};

const handleRemoveKeyword = (keyword) => {
    if (!keyword) return;
    
    const currentKeywords = state.keywords.get();
    state.keywords.set(currentKeywords.filter(k => k !== keyword));
    updateKeywordsList(state.keywords.get());
    // Trigger analysis if we have text
    if (state.text.get()) {
        handleAnalyze();
    }
};

const updateKeywordsList = (keywords = []) => {
    const container = document.getElementById('keywords-list');
    if (!container) return;
    
    container.innerHTML = '';
    keywords.forEach(keyword => {
        const tag = document.createElement('div');
        tag.className = 'bg-primary/10 text-primary px-3 py-1 rounded-lg flex items-center gap-2';
        tag.innerHTML = `
            <span>${keyword}</span>
            <button 
                class="hover:text-primary/80" 
                onclick="window.keywordAnalyzer.handleRemoveKeyword('${escapeRegExp(keyword)}')"
            >
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(tag);
    });
};

const handleAnalyze = () => {
    const text = state.text.get();
    const keywords = state.keywords.get();
    const windowSize = state.windowSize.get();

    if (!text?.trim()) {
        alert('Please enter some text to analyze');
        return;
    }

    if (!keywords?.length) {
        alert('Please add at least one keyword');
        return;
    }

    const results = analyzeText(text, keywords, windowSize);
    if (results) {
        state.results.set(results);
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
        }
    }
};

// Initialize DOM elements and event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const inputText = document.getElementById('input-text');
    const keywordInput = document.getElementById('keyword-input');
    const addKeywordButton = document.getElementById('add-keyword');
    const analyzeButton = document.getElementById('analyze-button');
    const uploadButton = document.getElementById('upload-button');
    const fileInput = document.getElementById('file-input');
    const windowSizeInput = document.getElementById('window-size');

    // Initialize state
    state.windowSize.set(parseInt(windowSizeInput?.value || '100'));

    // Event listeners
    analyzeButton?.addEventListener('click', handleAnalyze);
    addKeywordButton?.addEventListener('click', handleAddKeyword);
    uploadButton?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', handleFileUpload);
    
    // Add keyword on Enter key
    keywordInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddKeyword();
        }
    });

    // Update window size when changed
    windowSizeInput?.addEventListener('change', () => {
        const value = parseInt(windowSizeInput.value);
        if (value >= 10 && value <= 1000) {
            state.windowSize.set(value);
        }
    });

    // Update text state when input changes
    inputText?.addEventListener('input', handleTextInput);

    // Subscribe to state changes
    state.keywords.subscribe(updateKeywordsList);
    state.results.subscribe(updateUI);
});

// Export functions to window for event handlers
window.keywordAnalyzer = {
    handleRemoveKeyword,
    handleAddKeyword,
    handleAnalyze,
    handleFileUpload
};
