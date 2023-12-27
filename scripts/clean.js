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

const toastTrigger = document.getElementById('liveToastBtn')
const toastLiveExample = document.getElementById('liveToast')

document.getElementById('liveToastBtn').addEventListener('click', function () {
    var output = document.getElementById('output');

    navigator.clipboard.writeText(output.value).then(function () {
        // Show the toast notification
        var toastEl = document.getElementById('liveToast');
        var toast = new bootstrap.Toast(toastEl);
        toast.show();
    }, function (err) {
        console.error('Could not copy text: ', err);
    });
});
