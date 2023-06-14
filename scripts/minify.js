import { minify } from "https://cdn.skypack.dev/terser@5.17.7";

const minifyButton = document.getElementById("minify");
const inputSizeLabel = document.getElementById("inputSizeLabel");
const outputSizeLabel = document.getElementById("outputSizeLabel");
const inputLabel = document.getElementById("inputLabel");
const outputLabel = document.getElementById("outputLabel");
const inputArea = document.getElementById("input");
const outputArea = document.getElementById("output");
const compressOption = document.getElementById("compress");
const mangleOption = document.getElementById("mangle");
const beautifyOption = document.getElementById("beautify");

function updateSizeLabels() {
    const inputText = inputArea.value;
    const outputText = outputArea.value;
    const inputSize = new Blob([inputText]).size;
    const outputSize = new Blob([outputText]).size;
    const inputKB = (inputSize / 1024).toFixed(2);
    const outputKB = (outputSize / 1024).toFixed(2);
    if (inputLabel) inputLabel.textContent = inputKB;
    if (outputLabel) outputLabel.textContent = outputKB;
}

async function minifyCode() {
    const inputText = inputArea.value;
    const options = {
        compress: compressOption.checked,
        mangle: mangleOption.checked,
        format: {
            beautify: beautifyOption.checked
        }
    };
    try {
        const result = await minify(inputText, options);
        if (result.error) throw result.error;
        outputArea.value = result.code;
        updateSizeLabels();
    } catch (error) {
        alert(error.message);
    }
}

function synchronizeScroll(inputElement, outputElement) {
    function handleScroll(event) {
        const { scrollTop, scrollHeight, clientHeight } = event.target;
        const outputScrollHeight = outputElement.scrollHeight;
        const outputClientHeight = outputElement.clientHeight;
        const ratio = scrollTop / (scrollHeight - clientHeight);
        const outputScrollTop = Math.round((outputScrollHeight - outputClientHeight) * ratio);
        outputElement.scrollTop = outputScrollTop;
    }
    inputElement.addEventListener("scroll", handleScroll);
    outputElement.addEventListener("scroll", handleScroll);
}

minifyButton.addEventListener("click", minifyCode);
updateSizeLabels();

const inputElement = document.querySelector("#input");
const outputElement = document.querySelector("#output");

synchronizeScroll(inputElement, outputElement);
