/**
 * Synchronizes scrolling between two elements.
 * @param {HTMLElement} inputElement - The element that triggers the scroll event.
 * @param {HTMLElement} outputElement - The element that should be scrolled.
 */
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
const inputElement = document.querySelector("#input");
const outputElement = document.querySelector("#output");
synchronizeScroll(inputElement, outputElement);

