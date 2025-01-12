'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const inputElement = document.getElementById('input-code');
    const outputElement = document.getElementById('output-code');
    const minifyButton = document.getElementById('minify-button');
    const copyButton = document.getElementById('copy-button');
    const clearButton = document.getElementById('clear-button');
    const removeComments = document.getElementById('remove-comments');
    const mangleNames = document.getElementById('mangle-names');
    const compressCode = document.getElementById('compress-code');

    // Early return if required elements are missing
    if (!inputElement || !outputElement || !minifyButton) {
        console.error('Required DOM elements not found');
        return;
    }

    // Function to show toast notification
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Function to update size labels
    function updateSizeLabels() {
        if (!inputElement || !outputElement) return;

        const inputSize = new TextEncoder().encode(inputElement.value || '').length;
        const outputSize = new TextEncoder().encode(outputElement.value || '').length;
        
        const reduction = inputSize ? ((inputSize - outputSize) / inputSize * 100).toFixed(1) : 0;
        showToast(`Size reduced by ${reduction}% (${(inputSize / 1024).toFixed(2)}KB → ${(outputSize / 1024).toFixed(2)}KB)`);
    }

    // Function to minify code using Google Closure Compiler
    async function minifyCode() {
        if (!inputElement || !outputElement) {
            showToast('Error: Input or output elements not found');
            return;
        }

        const code = inputElement.value?.trim();
        if (!code) {
            showToast('Please enter some code to minify');
            return;
        }

        try {
            // Prepare request to Google Closure Compiler Service
            const params = new URLSearchParams({
                js_code: code,
                compilation_level: compressCode?.checked ? 'ADVANCED_OPTIMIZATIONS' : 'SIMPLE_OPTIMIZATIONS',
                output_format: 'json',
                output_info: 'compiled_code',
                language: 'ECMASCRIPT_2020'
            });

            if (removeComments?.checked) {
                params.append('formatting', 'PRETTY_PRINT');
            }

            const response = await fetch('https://closure-compiler.appspot.com/compile', {
                method: 'POST',
                body: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const result = await response.json();

            if (result.errors && result.errors.length > 0) {
                throw new Error(result.errors[0].error);
            }

            if (!result.compiledCode) {
                throw new Error('No output generated');
            }

            outputElement.value = result.compiledCode;
            updateSizeLabels();
            showToast('Code minified successfully');
        } catch (error) {
            showToast('Error minifying code: ' + error.message);
            console.error('Minification error:', error);
            outputElement.value = '/* Error minifying code */\n' + error.message;
        }
    }

    // Function to copy output
    async function copyOutput() {
        if (!outputElement) {
            showToast('Error: Output element not found');
            return;
        }

        if (!outputElement.value?.trim()) {
            showToast('No code to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(outputElement.value);
            showToast('Code copied to clipboard');
        } catch (error) {
            showToast('Failed to copy code');
            console.error('Copy error:', error);
        }
    }

    // Function to clear all
    function clearAll() {
        if (!inputElement || !outputElement) return;
        
        inputElement.value = '';
        outputElement.value = '';
        showToast('All code cleared');
    }

    // Event listeners - only add if elements exist
    minifyButton?.addEventListener('click', minifyCode);
    copyButton?.addEventListener('click', copyOutput);
    clearButton?.addEventListener('click', clearAll);

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to minify
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            minifyCode();
        }
        // Ctrl/Cmd + Shift + C to copy
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            copyOutput();
        }
    });
});
