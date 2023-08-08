'use strict';

// Cache the DOM elements
const originalTextArea: HTMLTextAreaElement = document.getElementById('originalTextArea') as HTMLTextAreaElement;
const modifiedTextArea: HTMLTextAreaElement = document.getElementById('modifiedTextArea') as HTMLTextAreaElement;
const diffResponseArea: HTMLElement = document.getElementById('diffResponseArea') as HTMLElement;
const diffResponseContainer: HTMLElement = document.getElementById('diffResponseContainer') as HTMLElement;
const errorContainer: HTMLElement = document.getElementById('errorContainer') as HTMLElement;
const findDiffBtn: HTMLElement = document.getElementById('findDiffBtn') as HTMLElement;

// Create a regular expression to match the paragraph character (¶)
const returnPattern: RegExp = new RegExp('&para;', 'g');

// Create CodeMirror editors for the text areas
const originalTextAreaEditor: CodeMirror.Editor = CodeMirror.fromTextArea(originalTextArea, {
    value: originalTextArea.value,
    lineNumbers: true,
});
const modifiedTextAreaEditor: CodeMirror.Editor = CodeMirror.fromTextArea(modifiedTextArea, {
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
    const diffParser: diff_match_patch = new diff_match_patch();

    // Get the differences between the two text areas
    const diff: diff_match_patch.Diff[] = diffParser.diff_main(originalTextAreaEditor.getValue(), modifiedTextAreaEditor.getValue());

    // Clean up the differences for efficiency
    diffParser.diff_cleanupEfficiency(diff);

    // Convert the differences to HTML
    const diffText: string = diffParser.diff_prettyHtml(diff);

    // Remove the paragraph characters from the HTML
    const sanitisedDiffText: string = diffText.replace(returnPattern, '');

    // Show the differences
    showDiff(sanitisedDiffText);
});

function showError (message: string): void {
    diffResponseArea.style.display = 'none';
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
}

function showDiff (diffText: string): void {
    errorContainer.style.display = 'none';
    diffResponseContainer.innerHTML = diffText;
    diffResponseArea.style.display = 'flex';
}