// Define updateSizeLabels in the global scope
function updateSizeLabels() {
    const inputElement = document.getElementById('input');
    const outputElement = document.getElementById('output');
    const inputSizeLabel = document.getElementById('inputSizeLabel');
    const outputSizeLabel = document.getElementById('outputSizeLabel');
    const inputSize = new TextEncoder().encode(inputElement.value).byteLength;
    const outputSize = new TextEncoder().encode(outputElement.textContent).byteLength;
    inputSizeLabel.textContent = `Size: ${(inputSize / 1024).toFixed(2)} KB`;
    outputSizeLabel.textContent = `Size: ${(outputSize / 1024).toFixed(2)} KB`;
}

async function minifyCode() {
    const { minify } = await import("https://cdn.skypack.dev/terser@5.17.7");

    const inputElement = document.getElementById("input");
    const outputElement = document.getElementById("output");
    const compressOption = document.getElementById("compress").checked;
    const mangleOption = document.getElementById("mangle").checked;
    const beautifyOption = document.getElementById("beautify").checked;

    const options = {
        compress: compressOption,
        mangle: mangleOption,
        format: {
            beautify: beautifyOption,
        }
    };

    try {
        const { code, error } = await minify(inputElement.value, options);
        if (error) {
            outputElement.value = error.message;
        } else {
            outputElement.value = code;
        }
        updateSizeLabels();
    } catch (error) {
        outputElement.value = error.message;
    }
}

function synchronizeScroll(inputElement, outputElement) {
    const handleScroll = (event) => {
        const { scrollTop, scrollHeight, clientHeight } = event.target;
        const outputScrollHeight = outputElement.scrollHeight;
        const outputClientHeight = outputElement.clientHeight;
        const ratio = scrollTop / (scrollHeight - clientHeight);
        const outputScrollTop = Math.round((outputScrollHeight - outputClientHeight) * ratio);
        outputElement.scrollTop = outputScrollTop;
        updateSizeLabels();
    };

    inputElement.addEventListener("scroll", handleScroll);
    outputElement.addEventListener("scroll", handleScroll);
}

document.addEventListener("DOMContentLoaded", () => {
    const inputElement = document.getElementById("input");
    const outputElement = document.getElementById("output");
    const minifyButton = document.getElementById("minify");

    minifyButton.addEventListener("click", minifyCode);
    synchronizeScroll(inputElement, outputElement);
    inputElement.addEventListener("input", updateSizeLabels);
    outputElement.addEventListener("input", updateSizeLabels);
});
