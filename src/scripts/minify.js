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

    // Function to format byte size
    function formatBytes(bytes) {
        if (bytes === 0) return '0 bytes';
        const k = 1024;
        const sizes = ['bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Function to update size indicators
    function updateSizes() {
        const inputSize = document.getElementById('input-size');
        const outputSize = document.getElementById('output-size');

        if (inputSize && inputElement) {
            const size = new TextEncoder().encode(inputElement.value || '').length;
            inputSize.textContent = formatBytes(size);
        }

        if (outputSize && outputElement) {
            const size = new TextEncoder().encode(outputElement.value || '').length;
            outputSize.textContent = formatBytes(size);
        }
    }

    // Add input event listener
    inputElement?.addEventListener('input', updateSizes);

    // Function to minify code using Google Closure Compiler
    async function minifyCode() {
        if (!inputElement || !outputElement || !minifyButton) return;

        // Show loading state
        const originalButtonText = minifyButton.innerHTML;
        minifyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Minifying...';
        minifyButton.disabled = true;

        try {
            const code = inputElement.value?.trim();
            if (!code) {
                throw new Error('Please enter some code to minify');
            }

            // Prepare request parameters
            const params = new URLSearchParams();
            params.append('js_code', code);
            params.append('compilation_level', document.querySelector('input[name="optimization"]:checked')?.value || 'SIMPLE_OPTIMIZATIONS');
            params.append('output_format', 'json');
            params.append('output_info', 'compiled_code');
            params.append('output_info', 'warnings');
            params.append('output_info', 'errors');
            params.append('language', 'ECMASCRIPT_2020');
            params.append('language_out', document.getElementById('language-out')?.checked ? 'ECMASCRIPT_2020' : 'ECMASCRIPT_2015');

            if (document.getElementById('use-types')?.checked) {
                params.append('use_types_for_optimization', 'true');
            }

            if (document.getElementById('source-map')?.checked) {
                params.append('create_source_map', 'true');
                params.append('source_map_format', 'V3');
            }

            const response = await fetch('https://closure-compiler.appspot.com/compile', {
                method: 'POST',
                body: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const result = await response.json();

            // Handle compilation errors
            if (result.errors && result.errors.length > 0) {
                const errorMessages = result.errors
                    .map(e => `Line ${e.lineno}: ${e.error}`)
                    .join('\n');
                throw new Error(`Compilation failed:\n${errorMessages}`);
            }

            // Handle warnings
            if (result.warnings && result.warnings.length > 0) {
                console.warn('Compilation warnings:', result.warnings);
                showToast('⚠️ Compiled with warnings - check console for details', 'warning');
            }

            // Validate and use compiled code
            if (!result.compiledCode && !result.serverErrors) {
                throw new Error('Compilation failed - no output generated. Try a lower optimization level.');
            }

            outputElement.value = result.compiledCode || '';
            updateSizeLabels();
            updateSizes(); // Add this line
            showToast('✨ Code minified successfully', 'success');

        } catch (error) {
            showToast('❌ ' + error.message, 'error');
            console.error('Minification error:', error);
            outputElement.value = '/* Error minifying code */\n' + error.message;
        } finally {
            // Restore button state
            minifyButton.innerHTML = originalButtonText;
            minifyButton.disabled = false;
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

    // Update initial sizes
    updateSizes();
});
