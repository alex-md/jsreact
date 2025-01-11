import { minify } from 'terser';
import '../styles/main.css';

document.addEventListener('DOMContentLoaded', () => {
    const inputElement = document.getElementById('input');
    const outputElement = document.getElementById('output');
    const minifyButton = document.getElementById('minify');
    const copyButton = document.getElementById('copy');

    function updateSizeLabels() {
        const inputSize = new Blob([inputElement.value]).size;
        const outputSize = new Blob([outputElement.value]).size;
        document.getElementById('input-size').textContent = `${(inputSize / 1024).toFixed(2)} KB`;
        document.getElementById('output-size').textContent = `${(outputSize / 1024).toFixed(2)} KB`;
        document.getElementById('compression-ratio').textContent = 
            `${((1 - outputSize / inputSize) * 100).toFixed(1)}%`;
    }

    async function minifyCode() {
        const compressOption = document.getElementById("compress").checked;
        const mangleOption = document.getElementById("mangle").checked;
        const beautifyOption = document.getElementById("beautify").checked;

        if (!inputElement.value.trim()) {
            outputElement.value = 'Please enter JavaScript code to minify';
            return;
        }

        try {
            minifyButton.disabled = true;
            minifyButton.textContent = 'Minifying...';

            const options = {
                compress: compressOption,
                mangle: mangleOption,
                format: {
                    beautify: beautifyOption,
                }
            };

            const result = await minify(inputElement.value, options);
            
            if (result.error) {
                outputElement.value = `Error: ${result.error.message}`;
            } else {
                outputElement.value = result.code;
                updateSizeLabels();
            }
        } catch (error) {
            outputElement.value = `Error: ${error.message}`;
        } finally {
            minifyButton.disabled = false;
            minifyButton.textContent = 'Minify';
        }
    }

    function copyToClipboard() {
        navigator.clipboard.writeText(outputElement.value)
            .then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    }

    minifyButton.addEventListener('click', minifyCode);
    copyButton.addEventListener('click', copyToClipboard);
    inputElement.addEventListener('input', updateSizeLabels);
});
