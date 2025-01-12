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
        // Handle special characters and formatting
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        // Remove HTML tags if present
        .replace(/<[^>]*>/g, ' ')
        // Handle common abbreviations
        .replace(/(\w+)\.(\w+)/g, '$1 $2')
        // Split on word boundaries while preserving hyphenated words
        .split(/\b/)
        .map(word => word.trim())
        .filter(word => /\w+/.test(word));
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
    if (!results) {
        console.log('No results to display');
        return;
    }

    console.log('Updating UI with results:', results);

    // Update overview statistics
    document.getElementById('total-words').textContent = results.totalWords.toLocaleString();
    document.getElementById('total-keywords').textContent = 
        Object.values(results.keywordResults)
            .reduce((sum, result) => sum + result.occurrences, 0)
            .toLocaleString();
    
    const overallDensity = 
        Object.values(results.keywordResults)
            .reduce((sum, result) => sum + result.density, 0) / 
        Object.keys(results.keywordResults).length;
    document.getElementById('keyword-density').textContent = `${overallDensity.toFixed(1)}%`;

    // Update intersection score
    const bestIntersection = results.intersections[0];
    document.getElementById('intersection-score').textContent = 
        bestIntersection ? bestIntersection.score.toFixed(2) : '0';

    // Update keyword table with highest density regions
    const tableBody = document.getElementById('keyword-table');
    tableBody.innerHTML = '';
    
    Object.entries(results.keywordResults).forEach(([keyword, data]) => {
        const row = document.createElement('tr');
        row.className = 'border-b';
        const densityRegion = data.highestDensityRegion;
        row.innerHTML = `
            <td class="px-4 py-3">${keyword}</td>
            <td class="px-4 py-3">${data.occurrences}</td>
            <td class="px-4 py-3">${data.density.toFixed(1)}%</td>
            <td class="px-4 py-3">${
                densityRegion ? 
                `${densityRegion.count} in ${results.windowSize} words (${densityRegion.density.toFixed(1)}%)` : 
                '0%'
            }</td>
        `;
        tableBody.appendChild(row);
    });

    // Update intersection section
    const intersectionSection = document.getElementById('intersection-section');
    const intersectionText = document.getElementById('intersection-text');
    
    if (bestIntersection) {
        intersectionSection.classList.remove('hidden');
        // Highlight keywords within the intersection text
        const highlightedIntersectionText = bestIntersection.text.replace(
            new RegExp(state.keywords.get().join('|'), 'gi'),
            match => `<span class="bg-green-300">${match}</span>`
        );
        intersectionText.innerHTML = highlightedIntersectionText;
    } else {
        intersectionSection.classList.add('hidden');
    }

    // Update distribution chart
    const distributionChart = document.getElementById('distribution-chart');
    distributionChart.innerHTML = '';
    
    const maxCount = Math.max(...results.distribution);
    results.distribution.forEach((count, index) => {
        const bar = document.createElement('div');
        bar.className = 'bg-blue-500 hover:bg-blue-600 transition-colors rounded-t';
        bar.style.height = `${(count / maxCount) * 100}%`;
        bar.style.flex = '1';
        bar.title = `Section ${index + 1}: ${count} occurrences`;
        distributionChart.appendChild(bar);
    });

    // Add text highlighting with best intersection
    const originalText = state.text.get();
    const keywords = state.keywords.get();
    
    // Pass the best intersection text directly for highlighting
    const highlightedText = highlightText(
        originalText,
        keywords,
        bestIntersection // Pass the entire intersection object which includes the text property
    );
    
    document.getElementById('highlighted-text').innerHTML = highlightedText;

    // Show results section
    document.getElementById('results-section').classList.remove('hidden');
};

// Event handlers
const handleTextInput = debounce(() => {
    const text = document.getElementById('input-text').value;
    console.log('Text input updated:', text.slice(0, 50) + '...');
    state.text.set(text);
}, 300);

const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        document.getElementById('input-text').value = text;
        state.text.set(text);
    } catch (error) {
        console.error('Error reading file:', error);
    }
};

const handleAddKeyword = () => {
    const input = document.getElementById('keyword-input');
    const keyword = input.value.trim();
    
    if (keyword && !state.keywords.get().includes(keyword)) {
        console.log('Adding keyword:', keyword);
        state.keywords.set([...state.keywords.get(), keyword]);
        input.value = '';
        updateKeywordsList();
        // Trigger analysis if we have text
        if (state.text.get()) {
            handleAnalyze();
        }
    }
};

const handleRemoveKeyword = (keyword) => {
    state.keywords.set(state.keywords.get().filter(k => k !== keyword));
    updateKeywordsList();
    // Trigger analysis if we have text
    if (state.text.get()) {
        handleAnalyze();
    }
};

const updateKeywordsList = () => {
    const container = document.getElementById('keywords-list');
    container.innerHTML = '';
    
    state.keywords.get().forEach(keyword => {
        const tag = document.createElement('div');
        tag.className = 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2';
        tag.innerHTML = `
            <span>${keyword}</span>
            <button class="text-blue-600 hover:text-blue-800" onclick="handleRemoveKeyword('${keyword}')">×</button>
        `;
        container.appendChild(tag);
    });
};

const handleAnalyze = () => {
    console.log('Analyze button clicked');
    
    // Get text directly from input instead of state
    const text = document.getElementById('input-text').value;
    state.text.set(text); // Update state with current value
    
    const keywords = state.keywords.get();
    const windowSize = parseInt(document.getElementById('window-size').value) || 100;
    
    console.log('Analysis parameters:', { 
        textLength: text.length,
        textPreview: text.slice(0, 100) + '...', 
        keywords, 
        windowSize 
    });
    
    if (!text || !keywords.length) {
        console.log('Missing required input:', { hasText: !!text, keywordsCount: keywords.length });
        return;
    }
    
    state.windowSize.set(windowSize);
    const results = analyzeText(text, keywords, windowSize);
    console.log('Analysis results:', results);
    
    state.results.set(results);
    updateUI(results);
};

// Initialize event listeners and expose necessary functions to window
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Initialize text state with any existing input value
    const initialText = document.getElementById('input-text').value;
    if (initialText) {
        state.text.set(initialText);
    }
    
    const analyzeButton = document.getElementById('analyze-button');
    if (!analyzeButton) {
        console.error('Analyze button not found');
        return;
    }
    
    analyzeButton.addEventListener('click', () => {
        console.log('Analyze button clicked (from event listener)');
        handleAnalyze();
    });
    
    // Add input event listener directly to ensure immediate state updates
    document.getElementById('input-text').addEventListener('input', (e) => {
        state.text.set(e.target.value);
        handleTextInput();
    });
    
    document.getElementById('file-input').addEventListener('change', handleFileUpload);
    document.getElementById('upload-button').addEventListener('click', () => 
        document.getElementById('file-input').click()
    );
    document.getElementById('keyword-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddKeyword();
    });
    document.getElementById('add-keyword').addEventListener('click', handleAddKeyword);
});

// Export functions to window for event handlers
Object.assign(window, {
    handleRemoveKeyword,
    handleAddKeyword,
    handleAnalyze,
    handleFileUpload
});
