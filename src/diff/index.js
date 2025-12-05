'use strict';

// Import styles and components
import '@styles/global.css';
import { showToast } from '@components/toast.js';

// Import the diff-match-patch library using CDN
// We'll keep using the CDN version since it's already working well and doesn't need bundling
// The script is loaded in the HTML file

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const originalText = document.getElementById('original-text');
    const modifiedText = document.getElementById('modified-text');
    const compareButton = document.getElementById('compare-button');
    const clearButton = document.getElementById('clear-button');
    const swapButton = document.getElementById('swap-button');
    const diffContainer = document.getElementById('diff-container');
    const diffOutput = document.getElementById('diff-output');
    const errorMessage = document.getElementById('error-message');
    const toast = document.getElementById('toast');

    // Function to show error message
    function showError(message) {
        if (!errorMessage) return;
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        diffContainer.classList.add('hidden');
    }

    // Function to hide error message
    function hideError() {
        if (!errorMessage) return;
        errorMessage.classList.add('hidden');
    }

    // Function to compute and display diff
    function computeDiff() {
        const text1 = originalText.value.trim();
        const text2 = modifiedText.value.trim();

        // Validate inputs
        if (!text1 || !text2) {
            showError('Please enter text in both fields to compare');
            return;
        }

        try {
            // Create diff-match-patch instance
            const dmp = new diff_match_patch();

            // Compute diff
            const diffs = dmp.diff_main(text1, text2);

            // Optimize diff result
            dmp.diff_cleanupSemantic(diffs);

            // Convert diff to HTML with custom styling
            let html = '';
            for (let diff of diffs) {
                const [type, text] = diff;
                const escapedText = text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;')
                    .replace(/ /g, '&nbsp;')
                    .replace(/\n/g, '<br>');

                switch (type) {
                    case 1: // Addition
                        html += `<span class="diff-add">${escapedText}</span>`;
                        break;
                    case -1: // Deletion
                        html += `<span class="diff-remove">${escapedText}</span>`;
                        break;
                    case 0: // No change
                        html += escapedText;
                        break;
                }
            }

            // Show diff output
            diffOutput.innerHTML = html;
            diffContainer.classList.remove('hidden');
            hideError();
            showToast('Differences highlighted successfully');

            // Scroll to diff output
            diffContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            console.error('Diff error:', error);
            showError('An error occurred while comparing the texts. Please try again.');
        }
    }

    // Function to clear all inputs
    function clearAll() {
        originalText.value = '';
        modifiedText.value = '';
        diffOutput.innerHTML = '';
        diffContainer.classList.add('hidden');
        hideError();
        showToast('All text cleared');
    }

    // Function to swap inputs
    function swapInputs() {
        const temp = originalText.value;
        originalText.value = modifiedText.value;
        modifiedText.value = temp;
        
        // If we have content, we might want to re-run the diff or just clear the output
        if (originalText.value.trim() || modifiedText.value.trim()) {
            if (!diffContainer.classList.contains('hidden')) {
                computeDiff();
            }
            showToast('Inputs swapped');
        }
    }

    // Event listeners
    compareButton.addEventListener('click', computeDiff);
    clearButton.addEventListener('click', clearAll);
    if (swapButton) {
        swapButton.addEventListener('click', swapInputs);
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to compare
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            computeDiff();
        }
        // Ctrl/Cmd + Shift + C to clear
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            clearAll();
        }
    });

    // Add paste event listeners with debounce
    let pasteTimeout;
    const handlePaste = () => {
        clearTimeout(pasteTimeout);
        pasteTimeout = setTimeout(() => {
            if (modifiedText.value.trim() && originalText.value.trim()) {
                computeDiff();
            }
        }, 500);
    };

    originalText.addEventListener('paste', handlePaste);
    modifiedText.addEventListener('paste', handlePaste);
});
