'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const cleanButton = document.getElementById('clean-button');
    const copyButton = document.getElementById('copy-button');
    const clearButton = document.getElementById('clear-button');
    const toast = document.getElementById('toast');

    // Find & Replace elements
    const findText = document.getElementById('find-text');
    const replaceText = document.getElementById('replace-text');
    const useRegex = document.getElementById('use-regex');
    const findNextBtn = document.getElementById('find-next');
    const replaceNextBtn = document.getElementById('replace-next');
    const replaceAllBtn = document.getElementById('replace-all');
    const matchCount = document.getElementById('match-count');

    // Search state
    let currentMatchIndex = -1;
    let matches = [];
    let lastSearchTerm = '';
    let searchArea = null;

    // Get option checkboxes
    const removeExtraSpaces = document.getElementById('remove-extra-spaces');
    const removeEmptyLines = document.getElementById('remove-empty-lines');
    const trimLines = document.getElementById('trim-lines');
    const removePunctuation = document.getElementById('remove-punctuation');
    const normalizeQuotes = document.getElementById('normalize-quotes');
    const normalizeWhitespace = document.getElementById('normalize-whitespace');
    const normalizeDashes = document.getElementById('normalize-dashes');
    const convertNewlines = document.getElementById('convert-newlines');

    // Function to show toast notification
    function showToast(message) {
        const toastMessage = document.getElementById('toast-message');
        if (!toastMessage) return;
        
        toastMessage.textContent = message;
        toast.classList.remove('translate-y-full', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-full', 'opacity-0');
        }, 3000);
    }

    // Find and Replace Functions
    function updateMatchCount() {
        matchCount.textContent = matches.length ? `${currentMatchIndex + 1}/${matches.length}` : '0/0';
    }

    function getSearchArea() {
        // Search in output if it has content, otherwise search in input
        return outputText.value ? outputText : inputText;
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function findMatches(searchTerm) {
        if (!searchTerm) {
            matches = [];
            currentMatchIndex = -1;
            updateMatchCount();
            return;
        }

        searchArea = getSearchArea();
        const text = searchArea.value;
        matches = [];
        
        try {
            const pattern = useRegex.checked ? new RegExp(searchTerm, 'g') : new RegExp(escapeRegExp(searchTerm), 'g');
            let match;
            while ((match = pattern.exec(text)) !== null) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0]
                });
            }
        } catch (e) {
            showToast('Invalid regular expression');
            return;
        }

        currentMatchIndex = matches.length > 0 ? 0 : -1;
        updateMatchCount();
        if (matches.length > 0) {
            highlightMatch();
        }
    }

    function highlightMatch() {
        if (currentMatchIndex === -1 || !matches.length) return;
        
        const match = matches[currentMatchIndex];
        searchArea.focus();
        searchArea.setSelectionRange(match.start, match.end);
    }

    function findNext() {
        const searchTerm = findText.value;
        if (!searchTerm) {
            showToast('Please enter text to find');
            return;
        }

        if (searchTerm !== lastSearchTerm || getSearchArea() !== searchArea) {
            findMatches(searchTerm);
            lastSearchTerm = searchTerm;
        } else if (matches.length > 0) {
            currentMatchIndex = (currentMatchIndex + 1) % matches.length;
            highlightMatch();
            updateMatchCount();
        }
    }

    function replaceNext() {
        if (currentMatchIndex === -1 || !matches.length) {
            showToast('No match selected');
            return;
        }

        const match = matches[currentMatchIndex];
        const replacement = replaceText.value;
        const text = searchArea.value;
        
        searchArea.value = text.substring(0, match.start) + replacement + text.substring(match.end);
        
        // Update matches after replacement
        findMatches(findText.value);
    }

    function replaceAll() {
        const searchTerm = findText.value;
        if (!searchTerm) {
            showToast('Please enter text to find');
            return;
        }

        searchArea = getSearchArea();
        try {
            const pattern = useRegex.checked ? new RegExp(searchTerm, 'g') : new RegExp(escapeRegExp(searchTerm), 'g');
            const replacement = replaceText.value;
            const originalText = searchArea.value;
            const newText = originalText.replace(pattern, replacement);
            
            if (originalText === newText) {
                showToast('No matches found');
                return;
            }
            
            searchArea.value = newText;
            showToast('All matches replaced');
            
            // Reset search state
            matches = [];
            currentMatchIndex = -1;
            updateMatchCount();
        } catch (e) {
            showToast('Invalid regular expression');
        }
    }

    // Function to clean text based on selected options
    function cleanText() {
        let text = inputText.value;
        
        if (!text.trim()) {
            showToast('Please enter some text to clean');
            return;
        }

        try {
            // Normalize quotes if selected
            if (normalizeQuotes.checked) {
                text = text
                    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
                    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
                    .replace(/['']/g, "'") // Other single quotes
                    .replace(/[""]/g, '"'); // Other double quotes
            }

            // Normalize dashes if selected
            if (normalizeDashes.checked) {
                text = text
                    .replace(/[\u2013\u2014]/g, '-') // Em and en dashes
                    .replace(/--+/g, '-') // Multiple dashes to single
                    .replace(/—/g, '-'); // Additional em dash
            }

            // Remove punctuation if selected
            if (removePunctuation.checked) {
                text = text.replace(/[^\w\s\n]/g, '');
            }

            // Convert newlines to spaces if selected
            if (convertNewlines.checked) {
                text = text.replace(/\n/g, ' ');
            }

            // Split into lines for line-based operations (if not converting newlines)
            let lines = convertNewlines.checked ? [text] : text.split('\n');

            // Process each line
            lines = lines.map(line => {
                if (trimLines.checked) {
                    line = line.trim();
                }
                return line;
            });

            // Remove empty lines if selected
            if (removeEmptyLines.checked) {
                lines = lines.filter(line => line.trim() !== '');
            }

            // Join lines back together
            text = lines.join(convertNewlines.checked ? ' ' : '\n');

            // Remove extra spaces if selected
            if (removeExtraSpaces.checked) {
                text = text.replace(/\s+/g, ' ');
            }

            // Normalize whitespace if selected
            if (normalizeWhitespace.checked) {
                text = text
                    .replace(/\r\n/g, '\n') // Convert Windows line endings
                    .replace(/\r/g, '\n') // Convert Mac line endings
                    .replace(/\t/g, '    ') // Convert tabs to spaces
                    .replace(/[^\S\n]+/g, ' '); // Convert multiple spaces to single space (preserve newlines)
            }

            // Final trim
            text = text.trim();

            outputText.value = text;
            showToast('Text cleaned successfully');
        } catch (error) {
            console.error('Error cleaning text:', error);
            showToast('Error cleaning text. Please try again.');
        }
    }

    // Function to copy output text
    async function copyOutput() {
        if (!outputText.value) {
            showToast('No text to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(outputText.value);
            showToast('Text copied to clipboard');
        } catch (error) {
            showToast('Failed to copy text');
            console.error('Copy error:', error);
        }
    }

    // Function to clear all inputs
    function clearAll() {
        inputText.value = '';
        outputText.value = '';
        showToast('All text cleared');
    }

    // Event listeners
    cleanButton.addEventListener('click', cleanText);
    copyButton.addEventListener('click', copyOutput);
    clearButton.addEventListener('click', clearAll);

    // Add input event listener for real-time cleaning
    inputText.addEventListener('input', () => {
        if (!inputText.value) {
            outputText.value = '';
        }
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to clean text
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            cleanText();
        }
        // Ctrl/Cmd + Shift + C to copy output
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            copyOutput();
        }
        // New shortcuts
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            findText.focus();
        }
        if (e.key === 'F3' || (e.ctrlKey && e.key === 'g')) {
            e.preventDefault();
            findNext();
        }
        if (e.shiftKey && e.key === 'Enter' && document.activeElement === findText) {
            e.preventDefault();
            findNext();
        }
        if (e.key === 'Enter' && document.activeElement === replaceText) {
            e.preventDefault();
            replaceNext();
        }
    });

    // Find & Replace Event Listeners
    findText.addEventListener('input', () => {
        findMatches(findText.value);
    });

    useRegex.addEventListener('change', () => {
        findMatches(findText.value);
    });

    findNextBtn.addEventListener('click', findNext);
    replaceNextBtn.addEventListener('click', replaceNext);
    replaceAllBtn.addEventListener('click', replaceAll);
});
