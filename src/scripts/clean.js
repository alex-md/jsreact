'use strict';

const input = document.getElementById('input');
const output = document.getElementById('output');
const toastTrigger = document.getElementById('liveToastBtn');
const toastLiveExample = document.getElementById('liveToast');

const ioText = (action) => {
    switch (action) {
        case 'clean':
            return output.value = cleanText(input.value);
        case 'remove_punctuation':
            return output.value = removePunctuation(input.value);
        case 'copy_to_clipboard':
            return copyToClipboard(output.value);
    }
};

const cleanText = (text) => text.trim().replace(/\n/g, ' ').replace(/(\S)\n(\S)/g, '$1 $2').replace(/\s+/g, ' ');

const removePunctuation = (text) => text.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ');

toastTrigger.addEventListener('click', () => {
    navigator.clipboard.writeText(output.value).then(() => {
        // Show the toast notification
        const toast = new bootstrap.Toast(toastLiveExample);
        toast.show();
    }).catch((err) => {
        console.error('Could not copy text: ', err);
    });
});
