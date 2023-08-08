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
