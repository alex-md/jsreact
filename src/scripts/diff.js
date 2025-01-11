'use strict';

// Cache the DOM elements
const originalTextArea = document.getElementById('originalTextArea');
const modifiedTextArea = document.getElementById('modifiedTextArea');
const diffResponseContainer = document.getElementById('diffResponseContainer');
const errorContainer = document.getElementById('errorContainer');
const findDiffBtn = document.getElementById('findDiffBtn');

// Initialize CodeMirror after DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create CodeMirror editors for the text areas
    const originalTextAreaEditor = CodeMirror.fromTextArea(originalTextArea, {
        lineNumbers: true,
        theme: document.documentElement.classList.contains('dark') ? 'monokai' : 'default',
        mode: 'text/plain',
        viewportMargin: Infinity,
        lineWrapping: true,
        height: 'auto'
    });

    const modifiedTextAreaEditor = CodeMirror.fromTextArea(modifiedTextArea, {
        lineNumbers: true,
        theme: document.documentElement.classList.contains('dark') ? 'monokai' : 'default',
        mode: 'text/plain',
        viewportMargin: Infinity,
        lineWrapping: true,
        height: 'auto'
    });

    // Set initial size for editors
    originalTextAreaEditor.setSize('100%', '200px');
    modifiedTextAreaEditor.setSize('100%', '200px');

    // Add dark mode support for CodeMirror
    function updateCodeMirrorTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        const theme = isDark ? 'monokai' : 'default';
        originalTextAreaEditor.setOption('theme', theme);
        modifiedTextAreaEditor.setOption('theme', theme);
    }

    // Watch for theme changes
    const observer = new MutationObserver(updateCodeMirrorTheme);
    observer.observe(document.documentElement, { attributes: true });

    // Add a click event listener to the "Find Diff" button
    findDiffBtn.addEventListener('click', () => {
        // Validate the input
        if (!originalTextAreaEditor.getValue() || !modifiedTextAreaEditor.getValue()) {
            showError('Please add texts to compare and generate the difference');
            return;
        }

        try {
            // Create a new diff_match_patch object
            const diffParser = new diff_match_patch();

            // Get the differences between the two text areas
            const diff = diffParser.diff_main(originalTextAreaEditor.getValue(), modifiedTextAreaEditor.getValue());

            // Clean up the differences for efficiency
            diffParser.diff_cleanupEfficiency(diff);

            // Convert the differences to HTML
            const diffText = diffParser.diff_prettyHtml(diff)
                .replace(/&para;/g, '') // Remove paragraph characters
                .replace(/background:#e6ffe6/g, 'background:rgba(74, 222, 128, 0.1)')  // lighter green
                .replace(/background:#ffe6e6/g, 'background:rgba(248, 113, 113, 0.1)'); // lighter red

            showDiff(diffText);
        } catch (error) {
            showError('An error occurred while comparing the texts. Please try again.');
        }
    });
});

function showError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
    diffResponseContainer.innerHTML = '';
}

function showDiff(diffText) {
    errorContainer.classList.add('hidden');
    diffResponseContainer.innerHTML = diffText;
    // Scroll to the diff container
    diffResponseContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
