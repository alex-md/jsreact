function ioText (action) {
    var input = document.getElementById('input');
    var output = document.getElementById('output');

    switch (action) {
        case 'clean':
            output.value = cleanText(input.value);
            break;
        case 'remove_punctuation':
            output.value = removePunctuation(input.value);
            break;
        case 'copy_to_clipboard':
            copyToClipboard(output.value);
            break;
    }
}

function cleanText (text) {
    // Trim whitespace, remove line breaks, add space in front of text on new line
    return text.trim().replace(/\n/g, ' ').replace(/(\S)\n(\S)/g, '$1 $2').replace(/\s+/g, ' ');
}

function removePunctuation (text) {
    // Remove punctuation using regular expression
    return text.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ');
}

function copyToClipboard (text) {
    // Create a temporary textarea to copy the text to the clipboard
    var tempTextarea = document.createElement('textarea');
    tempTextarea.value = text;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextarea);
}


// Add this to your JavaScript file
const copyBtn = document.getElementById('copy-btn');
const popupCard = document.getElementById('popup-card');

copyBtn.addEventListener('click', () => {
    copyBtn.classList.add('copy-animation');
    setTimeout(() => {
        copyBtn.classList.remove('copy-animation');
    }, 500);

    // Show the popup card for 1 second
    popupCard.classList.add('show');
    setTimeout(() => {
        popupCard.classList.remove('show');
    }, 1000);

    // Copy the text to the clipboard
    const output = document.getElementById('output');
    output.select();
    document.execCommand('copy');
});

// Position the popup card above the copy button
const copyBtnRect = copyBtn.getBoundingClientRect();
popupCard.style.bottom = `${window.innerHeight - copyBtnRect.top + 10}px`;
popupCard.style.left = `${copyBtnRect.left}px`;
