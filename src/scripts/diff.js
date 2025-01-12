'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const originalText = document.getElementById('original-text');
    const modifiedText = document.getElementById('modified-text');
    const compareButton = document.getElementById('compare-button');
    const clearButton = document.getElementById('clear-button');
    const diffContainer = document.getElementById('diff-container');
    const diffOutput = document.getElementById('diff-output');
    const errorMessage = document.getElementById('error-message');
    const toast = document.getElementById('toast');

    // Function to show toast notification
    function showToast(message) {
        const toastMessage = document.getElementById('toast-message');
        toastMessage.textContent = message;
        toast.classList.remove('translate-y-full', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-full', 'opacity-0');
        }, 3000);
    }

    // Function to show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        diffContainer.classList.add('hidden');
    }

    // Function to hide error message
    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // Function to compute and display diff
    function computeDiff() {
        const text1 = originalText.value;
        const text2 = modifiedText.value;

        // Validate inputs
        if (!text1.trim() || !text2.trim()) {
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

            // Scroll to diff output
            diffContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            showToast('Differences highlighted successfully');
        } catch (error) {
            console.error('Diff error:', error);
            showError('An error occurred while comparing the texts');
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

    // Event listeners
    compareButton.addEventListener('click', computeDiff);
    clearButton.addEventListener('click', clearAll);

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

    // Add paste event listeners
    originalText.addEventListener('paste', (e) => {
        // Small delay to ensure the paste completes
        setTimeout(() => {
            if (modifiedText.value && originalText.value) {
                computeDiff();
            }
        }, 1000);
    });

    modifiedText.addEventListener('paste', (e) => {
        // Small delay to ensure the paste completes
        setTimeout(() => {
            if (modifiedText.value && originalText.value) {
                computeDiff();
            }
        }, 1000);
    });
});
