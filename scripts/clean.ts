function ioText(action: string): void {
    const input = document.getElementById('input') as HTMLInputElement;
    const output = document.getElementById('output') as HTMLInputElement;

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

function cleanText(text: string): string {
    // Trim whitespace, remove line breaks, add space in front of text on new line
    return text.trim().replace(/\n/g, ' ').replace(/(\S)\n(\S)/g, '$1 $2').replace(/\s+/g, ' ');
}

function removePunctuation(text: string): string {
    // Remove punctuation using regular expression
    return text.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ');
}

function copyToClipboard(text: string): void {
    // Create a temporary textarea to copy the text to the clipboard
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = text;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextarea);
}

// Add this to your JavaScript file
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
const popupCard = document.getElementById('popup-card') as HTMLDivElement;

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
    const output = document.getElementById('output') as HTMLInputElement;
    output.select();
    document.execCommand('copy');
});

// Position the popup card above the copy button
const copyBtnRect = copyBtn.getBoundingClientRect();
popupCard.style.bottom = `${window.innerHeight - copyBtnRect.top + 10}px`;
popupCard.style.left = `${copyBtnRect.left}px`;