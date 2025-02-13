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
    const fileTypeSelect = document.getElementById('file-type');
    const jsOptionsDiv = document.getElementById('js-options');

    // Early return if required elements are missing
    if (!inputElement || !outputElement || !minifyButton) {
        console.error('Required DOM elements not found');
        return;
    }

    // Load Terser script with error handling
    function loadTerser() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/terser@latest/dist/bundle.min.js';
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Terser'));
            document.head.appendChild(script);
        });
    }

    // Initialize Terser
    loadTerser().catch(error => {
        console.error('Error loading Terser:', error);
        showToast('❌ Failed to load minification library');
    });

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

    // Function to toggle JS options visibility
    function toggleJsOptions() {
        if (!jsOptionsDiv || !fileTypeSelect) return;
        jsOptionsDiv.style.display = fileTypeSelect.value === 'js' ? 'block' : 'none';
    }

    // Add file type change listener
    fileTypeSelect?.addEventListener('change', toggleJsOptions);

    // Initial toggle of JS options
    toggleJsOptions();

    // Function to detect input type
    function detectInputType(code) {
        // Check for HTML
        if (/<[^>]+>/g.test(code)) {
            return 'html';
        }
        // Check for CSS
        if (/{[\s\S]*}/.test(code) && /[\w-]+\s*:/.test(code)) {
            return 'css';
        }
        // Default to JavaScript
        return 'js';
    }

    // Function to minify code
    async function minifyCode() {
        if (!inputElement || !outputElement || !minifyButton || !window.Terser) return;

        // Show loading state
        const originalButtonText = minifyButton.innerHTML;
        minifyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Minifying...';
        minifyButton.disabled = true;

        try {
            const code = inputElement.value?.trim();
            if (!code) {
                throw new Error('Please enter some code to minify');
            }

            try {
                const fileType = fileTypeSelect?.value || detectInputType(code);

                if (fileType === 'html' || fileType === 'css') {
                    // Basic minification for HTML/CSS
                    const minified = code
                        .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
                        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove CSS comments
                        .replace(/[^\S ]+/g, '') // Remove whitespace except spaces
                        .replace(/\s+/g, ' ') // Collapse multiple spaces
                        .replace(/\s*([{}>~,+])\s*/g, '$1') // Remove spaces around special chars
                        .replace(/\s*:\s*/g, ':') // Remove spaces around colons
                        .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
                        .trim();

                    outputElement.value = minified;
                } else {
                    // JavaScript minification using Terser
                    const options = {
                        parse: {
                            bare_returns: false,
                        },
                        compress: document.getElementById('compress-code')?.checked ?? true,
                        mangle: {
                            keep_fnames: document.getElementById('keep-fnames')?.checked ?? false,
                            keep_classnames: document.getElementById('keep-classnames')?.checked ?? false,
                            toplevel: document.getElementById('mangle-names')?.checked ?? true
                        },
                        format: {
                            comments: !(document.getElementById('remove-comments')?.checked ?? true),
                            max_line_len: false,
                        },
                        sourceMap: false,
                        module: document.getElementById('module-type')?.checked ?? false,
                        ecma: parseInt(document.getElementById('ecma-version')?.value ?? '2020', 10),
                        toplevel: true
                    };

                    const result = await window.Terser.minify(code, options);
                    if (!result || !result.code) {
                        throw new Error('No output generated from minifier');
                    }

                    outputElement.value = result.code;
                }

                updateSizeLabels();
                updateSizes();
                showToast('✨ Code minified successfully');

            } catch (minifyError) {
                console.error('Minification error:', minifyError);
                if (minifyError.message.includes('ERROR')) {
                    const match = minifyError.message.match(/ERROR: (.*?)\[.*?:(\d+),(\d+)\]/);
                    if (match) {
                        const [, message, line, col] = match;
                        throw new Error(`Error at line ${line}, column ${col}: ${message.trim()}`);
                    }
                }
                throw new Error(`Minification failed: ${minifyError.message}`);
            }

        } catch (error) {
            console.error('Error:', error);
            outputElement.value = `/* Error minifying code */
${error.message}

/* Original code preserved */
${inputElement.value}`;
            showToast('❌ ' + error.message);
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
