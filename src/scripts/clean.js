document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const cleanButton = document.getElementById('clean-button');
    const copyButton = document.getElementById('copy-button');
    const clearButton = document.getElementById('clear-button');
    const replaceButton = document.getElementById('replace-button');
    const findInput = document.getElementById('find-input');
    const replaceInput = document.getElementById('replace-input');
    const toast = document.getElementById('toast');

    // Get option checkboxes
    const removeExtraSpaces = document.getElementById('remove-extra-spaces');
    const removeEmptyLines = document.getElementById('remove-empty-lines');
    const trimLines = document.getElementById('trim-lines');
    const removePunctuation = document.getElementById('remove-punctuation');
    const normalizeQuotes = document.getElementById('normalize-quotes');
    const normalizeWhitespace = document.getElementById('normalize-whitespace');
    const normalizeDashes = document.getElementById('normalize-dashes');
    const convertNewlines = document.getElementById('convert-newlines');
    const removeNumbers = document.getElementById('remove-numbers');
    const caseSensitive = document.getElementById('case-sensitive');
    const wholeWords = document.getElementById('whole-words');

    // Function to show toast notification
    function showToast(message = 'Text copied to clipboard!') {
        const toastMessage = document.getElementById('toast-message');
        toastMessage.textContent = message;
        toast.classList.remove('translate-y-full', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-full', 'opacity-0');
        }, 3000);
    }

    // Function to clean text based on selected options
    function cleanText() {
        let text = inputText.value;
        
        if (!text.trim()) {
            showToast('Please enter some text to clean');
            return;
        }

        // Normalize quotes if selected
        if (normalizeQuotes.checked) {
            text = text
                .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
                .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
        }

        // Normalize dashes if selected
        if (normalizeDashes.checked) {
            text = text
                .replace(/[\u2013\u2014]/g, '-') // Em and en dashes
                .replace(/--+/g, '-'); // Multiple dashes to single
        }

        // Remove numbers if selected
        if (removeNumbers.checked) {
            text = text.replace(/\d+/g, '');
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
    }

    // Function to handle find and replace
    function handleReplace() {
        const findText = findInput.value;
        const replaceText = replaceInput.value;

        if (!findText) {
            showToast('Please enter text to find');
            return;
        }

        if (!inputText.value) {
            showToast('Please enter some text to search in');
            return;
        }

        try {
            let flags = 'g';
            if (!caseSensitive.checked) {
                flags += 'i';
            }

            let pattern = findText;
            if (wholeWords.checked) {
                pattern = `\\b${findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`;
            } else {
                pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }

            const regex = new RegExp(pattern, flags);
            const newText = inputText.value.replace(regex, replaceText);
            
            if (newText === inputText.value) {
                showToast('No matches found');
                return;
            }

            outputText.value = newText;
            showToast('Text replaced successfully');
        } catch (error) {
            showToast('Error in find/replace operation');
            console.error('Replace error:', error);
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
        findInput.value = '';
        replaceInput.value = '';
        showToast('All text cleared');
    }

    // Event listeners
    cleanButton.addEventListener('click', cleanText);
    copyButton.addEventListener('click', copyOutput);
    clearButton.addEventListener('click', clearAll);
    replaceButton.addEventListener('click', handleReplace);

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
        // Enter in find/replace inputs to trigger replace
        if (e.key === 'Enter' && (document.activeElement === findInput || document.activeElement === replaceInput)) {
            e.preventDefault();
            handleReplace();
        }
    });
});
