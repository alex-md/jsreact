let api_key;

function updateApiKey() {
    isValidOpenAIKey(document.getElementById('apiKeyInput').value) ? document.getElementById('apiKeyInput').classList.remove('is-invalid') : document.getElementById('apiKeyInput').classList.add('is-invalid');
    api_key = document.getElementById('apiKeyInput').value;
}

let textToSpeechButton = document.querySelector('#textToSpeechButton');
let ttsAudio = document.querySelector('#ttsAudio');
textToSpeechButton.addEventListener('click', convertToSpeech);

function isValidOpenAIKey(key) {
    const regexPattern = /sk-[a-zA-Z0-9]{48}/;
    return regexPattern.test(key);
}


function showToast() {
    // Create the toast container
    var toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.classList.add('position-fixed', 'bottom-0', 'start-0', 'p-3');

    // Create the toast
    var toast = document.createElement('div');
    toast.id = 'apiKeyToast';
    toast.classList.add('toast');
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    // Create the toast header
    var toastHeader = document.createElement('div');
    toastHeader.classList.add('toast-header', 'bg-warning', 'text-light');

    var strong = document.createElement('strong');
    strong.classList.add('mr-auto');
    strong.textContent = 'Missing API Key';

    var button = document.createElement('button');
    button.type = 'button';
    button.classList.add('ml-2', 'mb-1', 'close', 'hidden');
    button.setAttribute('data-bs-dismiss', 'toast');
    button.setAttribute('aria-label', 'Close');

    toastHeader.appendChild(strong);

    // Create the toast body
    var toastBody = document.createElement('div');
    toastBody.classList.add('toast-body', 'text-body-secondary');
    toastBody.textContent = 'Please enter a valid OpenAI API key.';

    // Append everything
    toast.appendChild(toastHeader);
    toast.appendChild(toastBody);
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);

    // Initialize the toast
    var toastEl = new bootstrap.Toast(toast);
    toastEl.show();

}


function convertToSpeech() {
    if (!api_key || !isValidOpenAIKey(api_key)) {
        showToast();
        return;
    }
    console.log('start convertToSpeedch()');
    const text = document.getElementById('textToSpeechInput').value;
    const selectedVoice = document.querySelector('input[name="voice"]:checked').value;
    fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${api_key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: selectedVoice.toLowerCase()
        })
    }).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    }).then((blob) => {
        const url = URL.createObjectURL(blob);
        ttsAudio.src = url;
        ttsAudio.play();
    }).catch((error) => console.error('Error:', error));
}

let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let pressthenreleaseButton = document.querySelector('#pressthenreleaseButton');
let transcribedText = document.querySelector('#transcribedText');
pressthenreleaseButton.addEventListener('pointerdown', startRecording);
pressthenreleaseButton.addEventListener('pointerup', stopRecording);
function toggleRecording() {
    if (!api_key || !isValidOpenAIKey(api_key)) {
        showToast();
        return;
    }
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}
function startRecording() {
    if (!api_key || !isValidOpenAIKey(api_key)) {
        showToast();
        return;
    }
    console.log('start rec');
    transcribedText.innerHTML = 'start rec...';
    navigator.mediaDevices.getUserMedia({
        audio: true
    }).then((stream) => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => {
            audioChunks.push(e.data);
        };
        mediaRecorder.onstop = (e) => {
            const audioBlob = new Blob(audioChunks, {
                type: 'audio/wav'
            });
            audioChunks = [];
            const file = new File([
                audioBlob
            ], 'recordedAudio.wav', {
                type: 'audio/wav'
            });
            convertToText(file);
        };
        mediaRecorder.start();
        isRecording = true;
        document.getElementById('recordingStatus').innerText = 'Recording...';
        document.getElementById('recordButton').innerText = 'Stop Recording';
    });
}
function stopRecording() {
    if (!api_key || !isValidOpenAIKey(api_key)) {
        showToast();
        return;
    }
    console.log('stop rec');
    transcribedText.innerHTML = 'stop rec... wait to transcript';
    mediaRecorder.stop();
    isRecording = false;
    document.getElementById('recordingStatus').innerText = 'Not Recording';
    document.getElementById('recordButton').innerText = 'Start Recording';
}

function convertToText(recordedFile) {
    const fileInput = document.getElementById('speechToTextInput');
    const file = recordedFile || fileInput.files[0];
    const api_key = 'your_openai_api_key';
    if (!api_key || !isValidOpenAIKey(api_key)) {
        showToast();
        return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${api_key}`
        },
        body: formData
    }).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then((data) => {
        const transcribedTextElement = document.getElementById('transcribedText');
        if (transcribedTextElement) {
            transcribedTextElement.innerText = data.text;
        }
        const textToSpeechInputElement = document.getElementById('textToSpeechInput');
        if (textToSpeechInputElement) {
            textToSpeechInputElement.value = data.text;
        }
        console.log(data);
    }).catch((error) => console.error('Error:', error));
}
