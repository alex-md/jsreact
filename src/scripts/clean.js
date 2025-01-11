document.addEventListener('DOMContentLoaded', function() {
    // Get the elements from the document
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const toastTrigger = document.getElementById('liveToastBtn');
    const toastElement = document.getElementById('liveToast');
    const cleanBtn = document.getElementById('cleanBtn');
    const removePunctuationBtn = document.getElementById('removePunctuationBtn');
    const replaceBtn = document.getElementById('replaceBtn');
    const findInput = document.getElementById('findInput');
    const replaceInput = document.getElementById('replaceInput');

    // Function to clean the text
    function cleanText() {
        try {
            const text = input.value;
            if (!text.trim()) {
                output.value = '';
                return;
            }

            let cleanedText = text
                .replace(/[\r\n]+/g, ' ')  // Replace line breaks with space
                .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
                .trim();                   // Remove leading/trailing whitespace
            
            output.value = cleanedText;
        } catch (error) {
            console.error('Error cleaning text:', error);
            output.value = 'An error occurred while cleaning the text';
        }
    }

    // Function to remove punctuation from the text
    function removePunctuation() {
        try {
            const text = input.value;
            if (!text.trim()) {
                output.value = '';
                return;
            }

            // Remove all punctuation except hyphens in compound words
            let noPunctuationText = text
                .replace(/[^\w\s-]|(?<!\w)-|-(?!\w)/g, '') // Remove punctuation but keep hyphens between words
                .replace(/\s+/g, ' ')                       // Replace multiple spaces with single space
                .trim();                                    // Remove leading/trailing whitespace
            
            output.value = noPunctuationText;
        } catch (error) {
            console.error('Error removing punctuation:', error);
            output.value = 'An error occurred while removing punctuation';
        }
    }

    // Function to show toast notification
    function showToast() {
        toastElement.classList.remove('hidden');
        setTimeout(() => {
            toastElement.classList.add('hidden');
        }, 3000);
    }

    // Function to perform find and replace
    function performReplace() {
        try {
            const find = findInput.value;
            const replace = replaceInput.value;
            const text = input.value;
            
            if (!text.trim() || !find) {
                return;
            }
            
            // Escape special regex characters and create a global, case-sensitive regex
            const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            const newText = text.replace(regex, replace);
            output.value = newText;
        } catch (error) {
            console.error('Error performing replace:', error);
            output.value = 'An error occurred during find and replace';
        }
    }

    // Add event listeners
    cleanBtn.addEventListener('click', cleanText);
    removePunctuationBtn.addEventListener('click', removePunctuation);
    replaceBtn.addEventListener('click', performReplace);

    // Copy to clipboard functionality
    toastTrigger.addEventListener('click', async function() {
        try {
            if (!output.value.trim()) {
                return;
            }
            await navigator.clipboard.writeText(output.value);
            showToast();
        } catch (error) {
            console.error('Could not copy text:', error);
            output.value = 'Failed to copy text to clipboard';
        }
    });

    // Add input event listener for real-time updates
    input.addEventListener('input', function() {
        if (!this.value.trim()) {
            output.value = '';
        }
    });

    // Initialize tooltips if using Bootstrap
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
});
