// Import styles
import '@styles/global.css';

// Import components
import { showToast } from '@components/toast.js';

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const inputElement = document.getElementById('input-code');
    const outputElement = document.getElementById('output-code');
    const minifyButton = document.getElementById('minify-button');
    const copyButton = document.getElementById('copy-button');
    const clearButton = document.getElementById('clear-button');
    const fileTypeSelect = document.getElementById('file-type');
    const jsOptionsDiv = document.getElementById('js-options');

    if (!inputElement || !outputElement || !minifyButton) {
        console.error('Required DOM elements not found');
        return;
    }

    async function loadTerser() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/terser@latest/dist/bundle.min.js';
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Terser'));
            document.head.appendChild(script);
        });
    }

    loadTerser().catch(error => {
        console.error('Error loading Terser:', error);
        showToast('❌ Failed to load minification library');
    });

    function updateSizes() {
        const inputSize = document.getElementById('input-size');
        const outputSize = document.getElementById('output-size');

        if (inputSize && inputElement) {
            inputSize.textContent = formatBytes(new TextEncoder().encode(inputElement.value || '').length);
        }
        if (outputSize && outputElement) {
            outputSize.textContent = formatBytes(new TextEncoder().encode(outputElement.value || '').length);
        }
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 bytes';
        const k = 1024, sizes = ['bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function toggleJsOptions() {
        if (jsOptionsDiv && fileTypeSelect) {
            jsOptionsDiv.style.display = fileTypeSelect.value === 'js' ? 'block' : 'none';
        }
    }
    fileTypeSelect?.addEventListener('change', toggleJsOptions);
    toggleJsOptions();

    // Add input event listeners for updating byte counters
    inputElement.addEventListener('input', updateSizes);
    outputElement.addEventListener('input', updateSizes);

    async function minifyCode() {
        if (!window.Terser) return;
        const code = inputElement.value?.trim();
        if (!code) return showToast('⚠️ No code to minify');

        minifyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Minifying...';
        minifyButton.disabled = true;

        try {
            let minified = '';
            if (fileTypeSelect?.value === 'html' || fileTypeSelect?.value === 'css') {
                minified = code.replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
                    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove CSS comments
                    .replace(/[\s]+/g, ' ') // Collapse spaces
                    .replace(/\s*([{}>~,+:;])\s*/g, '$1') // Trim around symbols
                    .trim();
            } else {
                const options = {
                    compress: document.getElementById('compress-code')?.checked ?? true,
                    mangle: document.getElementById('mangle-names')?.checked ?? true,
                    format: { comments: !(document.getElementById('remove-comments')?.checked ?? true) }
                };
                const result = await window.Terser.minify(code, options);
                if (!result || !result.code) throw new Error('No output generated');
                minified = result.code;
            }
            outputElement.value = minified;
            updateSizes(); // Update byte counters after minification
            showToast('✨ Minification complete');
        } catch (error) {
            console.error('Minification error:', error);
            outputElement.value = `/* Minification Error */\n${error.message}\n\n/* Original Code */\n${inputElement.value}`;
            updateSizes(); // Update byte counters even on error
            showToast('❌ Minification failed');
        } finally {
            minifyButton.innerHTML = 'Minify';
            minifyButton.disabled = false;
        }
    }

    async function copyOutput() {
        if (!outputElement.value?.trim()) return showToast('No code to copy');
        try {
            await navigator.clipboard.writeText(outputElement.value);
            showToast('📋 Copied to clipboard');
        } catch (error) {
            console.error('Copy error:', error);
            showToast('❌ Failed to copy');
        }
    }

    function clearAll() {
        inputElement.value = '';
        outputElement.value = '';
        updateSizes(); // Update byte counters after clearing
        showToast('🗑️ Cleared');
    }

    minifyButton?.addEventListener('click', minifyCode);
    copyButton?.addEventListener('click', copyOutput);
    clearButton?.addEventListener('click', clearAll);

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') minifyCode();
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') copyOutput();
    });

    updateSizes();
});
