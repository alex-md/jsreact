let api_key = document.getElementById('apiKeyInput').value;
let textToSpeechButton = document.querySelector('#textToSpeechButton');
let ttsAudio = document.querySelector('#ttsAudio');
textToSpeechButton.addEventListener('click', convertToSpeech);
function convertToSpeech () {
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
function convertToText () {
    const fileInput = document.getElementById('speechToTextInput');
    const file = fileInput.files[0];
    const api_key = 'your_openai_api_key';
    const formData = new FormData();
    formData.append('file', file);
    fetch('https://api.openai.com/v1/whisper', {
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
        document.getElementById('transcribedText').innerText = data.text;
    }).catch((error) => console.error('Error:', error));
}
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let pressthenreleaseButton = document.querySelector('#pressthenreleaseButton');
let transcribedText = document.querySelector('#transcribedText');
pressthenreleaseButton.addEventListener('pointerdown', startRecording);
pressthenreleaseButton.addEventListener('pointerup', stopRecording);
function toggleRecording () {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}
function startRecording () {
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
function stopRecording () {
    console.log('stop rec');
    transcribedText.innerHTML = 'stop rec... wait to transcript';
    mediaRecorder.stop();
    isRecording = false;
    document.getElementById('recordingStatus').innerText = 'Not Recording';
    document.getElementById('recordButton').innerText = 'Start Recording';
}
function convertToText (recordedFile) {
    const formData = new FormData();
    formData.append('file', recordedFile);
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
        transcribedText.innerHTML = document.getElementById('textToSpeechInput').value = data.text;
        console.log(data);
    }).catch((error) => console.error('Error:', error));
}
function updateApiKey () {
    api_key = document.getElementById('apiKeyInput').value;
    console.log('API Key updated');
}
