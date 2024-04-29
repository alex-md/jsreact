// Get the elements from the document
var input = document.getElementById('input');
var output = document.getElementById('output');
var toastTrigger = document.getElementById('liveToastBtn');
var toastLiveExample = document.getElementById('liveToast');
var cleanBtn = document.getElementById('cleanBtn');
var removePunctuationBtn = document.getElementById('removePunctuationBtn');

// Function to clean the text
function cleanText() {
    var text = input.value;
    var cleanedText = text.trim();
    cleanedText = cleanedText.replace(/(\S)\n(\S)/g, '$1 $2');
    cleanedText = cleanedText.replace(/\s+/g, ' ');
    output.value = cleanedText;
}

// Function to remove punctuation from the text
function removePunctuation() {
    var text = input.value;
    var noPunctuationText = text.replace(/[^\w\s\n]|_/g, '');
    noPunctuationText = noPunctuationText.replace(/\s+/g, ' ');
    output.value = noPunctuationText;
}

document.getElementById('replaceBtn').addEventListener('click', function () {
    var find = document.getElementById('findInput').value;
    var replace = document.getElementById('replaceInput').value;
    var input = document.getElementById('input');
    var text = input.value;
    var newText = text.split(find).join(replace);
    output.value = newText;
});

// Add event listeners to the buttons
cleanBtn.addEventListener('click', cleanText);
removePunctuationBtn.addEventListener('click', removePunctuation);

toastTrigger.addEventListener('click', function () {
    navigator.clipboard.writeText(output.value).then(function () {
        // Show the toast notification
        var toast = new bootstrap.Toast(toastLiveExample);
        toast.show();
    }).catch(function (err) {
        console.error('Could not copy text: ', err);
    });
});
