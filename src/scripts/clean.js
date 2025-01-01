// Get the elements from the document
const input = document.getElementById('input');
const output = document.getElementById('output');
const toastTrigger = document.getElementById('liveToastBtn');
const toastElement = document.getElementById('liveToast');
const cleanBtn = document.getElementById('cleanBtn');
const removePunctuationBtn = document.getElementById('removePunctuationBtn');

// Function to clean the text
function cleanText() {
    const text = input.value;
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/(\S)\n(\S)/g, '$1 $2');
    cleanedText = cleanedText.replace(/\s+/g, ' ');
    output.value = cleanedText;
}

// Function to remove punctuation from the text
function removePunctuation() {
    const text = input.value;
    let noPunctuationText = text.replace(/[^\w\s\n]|_/g, '');
    noPunctuationText = noPunctuationText.replace(/\s+/g, ' ');
    output.value = noPunctuationText;
}

// Function to show toast notification
function showToast() {
    toastElement.classList.remove('hidden');
    setTimeout(() => {
        toastElement.classList.add('hidden');
    }, 3000);
}

// Add event listener for replace functionality
document.getElementById('replaceBtn').addEventListener('click', function() {
    const find = document.getElementById('findInput').value;
    const replace = document.getElementById('replaceInput').value;
    const text = input.value;
    
    if (!find) {
        return; // Don't proceed if find field is empty
    }
    
    // Use a case-sensitive regular expression for global replacement
    const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const newText = text.replace(regex, replace);
    output.value = newText;
});

// Add event listeners to the buttons
cleanBtn.addEventListener('click', cleanText);
removePunctuationBtn.addEventListener('click', removePunctuation);

// Copy to clipboard functionality
toastTrigger.addEventListener('click', async function() {
    try {
        if (!output.value) {
            return; // Don't copy if output is empty
        }
        await navigator.clipboard.writeText(output.value);
        showToast();
    } catch (err) {
        console.error('Could not copy text: ', err);
    }
});

// Add input event listener to enable real-time cleaning
input.addEventListener('input', function() {
    if (this.value === '') {
        output.value = ''; // Clear output when input is empty
    }
});
