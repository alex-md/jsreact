'use strict';

// Cache the DOM elements
const originalTextArea = document.getElementById('originalTextArea');
const modifiedTextArea = document.getElementById('modifiedTextArea');
const diffResponseArea = document.getElementById('diffResponseArea');
const diffResponseContainer = document.getElementById('diffResponseContainer');
const errorContainer = document.getElementById('errorContainer');
const findDiffBtn = document.getElementById('findDiffBtn');

// Create a regular expression to match the paragraph character (¶)
const returnPattern = new RegExp('&para;', 'g');

// Create CodeMirror editors for the text areas
const originalTextAreaEditor = CodeMirror.fromTextArea(originalTextArea, {
    value: originalTextArea.value,
    lineNumbers: true,
});
const modifiedTextAreaEditor = CodeMirror.fromTextArea(modifiedTextArea, {
    value: modifiedTextArea.value,
    lineNumbers: true,
});

// Add a click event listener to the "Find Diff" button
findDiffBtn.addEventListener('click', () => {
    // Validate the input
    if (!originalTextAreaEditor.getValue() || !modifiedTextAreaEditor.getValue()) {
        showError('Please add texts to compare and generate the difference');
        return;
    }

    // Create a new diff_match_patch object
    const diffParser = new diff_match_patch();

    // Get the differences between the two text areas
    const diff = diffParser.diff_main(originalTextAreaEditor.getValue(), modifiedTextAreaEditor.getValue());

    // Clean up the differences for efficiency
    diffParser.diff_cleanupEfficiency(diff);

    // Convert the differences to HTML
    const diffText = diffParser.diff_prettyHtml(diff);

    // Remove the paragraph characters from the HTML
    const sanitisedDiffText = diffText.replace(returnPattern, '');

    showDiff(sanitisedDiffText);
});

function showError(message) {
    diffResponseArea.classList.add('d-none');
    errorContainer.textContent = message;
    errorContainer.classList.remove('d-none');
}

function showDiff(diffText) {
    errorContainer.classList.add('d-none');
    diffResponseContainer.innerHTML = diffText;
    diffResponseArea.classList.remove('d-none');
}

document.getElementById('findDiffBtn').addEventListener('click', function () {
    var existingText = document.querySelector('.scroll-down-text');
    if (existingText) {
        existingText.remove();
    }
    var scrollText = document.createElement('p');
    scrollText.textContent = 'Scroll down to view diff';
    scrollText.className = 'text-center scroll-down-text';
    // place above button
    document.querySelector('.d-grid').insertBefore(scrollText, document.getElementById('findDiffBtn'));
});
