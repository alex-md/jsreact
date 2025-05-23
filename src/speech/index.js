import '../assets/styles/global.css';
import { showToast } from '@components/toast.js';

class SpeechApp {
    constructor() {
        this.maxFileSizeMB = 25;
        this.apiKey = localStorage.getItem('openai_api_key');
        this.audioUrls = new Set();
        this.initializeWaveform();
        this.initializeUI();
    }

    async initializeWaveform() {
        try {
            this.wavesurfer = WaveSurfer.create({
                container: '#waveform',
                waveColor: '#71717a',
                progressColor: '#18181b',
                cursorColor: '#18181b',
                barWidth: 2,
                barGap: 1,
                height: 64,
                barRadius: 2,
                normalize: true,
                backend: 'WebAudio'
            });

            const audioElement = document.getElementById('audioPlayer');
            this.wavesurfer.on('ready', () => {
                audioElement.addEventListener('play', () => this.wavesurfer.play());
                audioElement.addEventListener('pause', () => this.wavesurfer.pause());
                audioElement.addEventListener('seeked', () => this.wavesurfer.setTime(audioElement.currentTime));
            });

            // Cleanup on page unload
            window.addEventListener('beforeunload', () => this.cleanup());
        } catch (error) {
            console.error('Error initializing waveform:', error);
            showToast('Error initializing audio visualization');
        }
    }

    initializeUI() {
        // Get DOM elements
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.saveApiKeyBtn = document.getElementById('saveApiKey');
        this.audioFileInput = document.getElementById('audioFileInput');
        this.transcribeBtn = document.getElementById('transcribeFile');
        this.transcriptionOutput = document.getElementById('transcriptionOutput');
        this.textInput = document.getElementById('textInput');
        this.generateBtn = document.getElementById('generateSpeech');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');

        // Set initial states
        if (this.apiKey) {
            this.apiKeyInput.value = this.apiKey;
            this.updateButtonStates(true);
        }

        // Add event listeners
        this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.audioFileInput.addEventListener('change', () => this.updateButtonStates(!!this.apiKey));
        this.transcribeBtn.addEventListener('click', () => this.transcribeFile());
        this.generateBtn.addEventListener('click', () => this.generateSpeech());
        this.speedSlider.addEventListener('input', (e) => {
            this.speedValue.textContent = e.target.value;
        });
        this.textInput.addEventListener('input', () => {
            this.generateBtn.disabled = !this.textInput.value.trim() || !this.apiKey;
        });
    }

    updateButtonStates(hasApiKey) {
        this.transcribeBtn.disabled = !this.audioFileInput.files[0] || !hasApiKey;
        this.generateBtn.disabled = !this.textInput.value.trim() || !hasApiKey;
    }

    async saveApiKey() {
        const key = this.apiKeyInput.value.trim();
        if (!key) {
            showToast('Please enter an API key');
            return;
        }

        // Validate key format
        if (!key.startsWith('sk-') || key.length < 40) {
            showToast('Invalid API key format');
            return;
        }

        this.apiKey = key;
        localStorage.setItem('openai_api_key', key);
        this.updateButtonStates(true);
        showToast('API key saved successfully');
    }

    async transcribeFile() {
        const file = this.audioFileInput.files[0];
        if (!file) {
            showToast('Please select an audio file');
            return;
        }

        try {
            // Check file size
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > this.maxFileSizeMB) {
                throw new Error(`File size exceeds ${this.maxFileSizeMB}MB limit`);
            }

            this.transcribeBtn.disabled = true;
            this.transcribeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Transcribing...';

            const formData = new FormData();
            formData.append('file', file);
            formData.append('model', 'whisper-1');

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.transcriptionOutput.value = data.text;
            showToast('Transcription completed successfully');
        } catch (error) {
            console.error('Error transcribing audio:', error);
            showToast(error.message || 'Error transcribing audio');
        } finally {
            this.transcribeBtn.disabled = false;
            this.transcribeBtn.innerHTML = '<i class="fas fa-wave-square mr-2"></i>Transcribe File';
        }
    }

    async generateSpeech() {
        const text = this.textInput.value.trim();
        if (!text) {
            showToast('Please enter some text to convert to speech');
            return;
        }

        try {
            this.generateBtn.disabled = true;
            this.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';

            const selectedVoice = document.getElementById('voiceSelect').value;
            const speed = parseFloat(document.getElementById('speedSlider').value);
            const useHD = document.getElementById('hdModel').checked;

            const response = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: useHD ? 'tts-1-hd' : 'tts-1',
                    input: text,
                    voice: selectedVoice,
                    speed: speed
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audioPlayer = document.getElementById('audioPlayer');

            // Store the new URL
            this.audioUrls.add(audioUrl);

            // Load audio into wavesurfer and audio player
            audioPlayer.src = audioUrl;
            await this.wavesurfer.load(audioUrl);

            // Auto-play when ready
            this.wavesurfer.on('ready', () => {
                audioPlayer.play().catch(console.error);
            });

            // Cleanup when audio ends
            audioPlayer.onended = () => {
                URL.revokeObjectURL(audioUrl);
                this.audioUrls.delete(audioUrl);
            };

            showToast('Speech generated successfully');
        } catch (error) {
            console.error('Error generating speech:', error);
            showToast(error.message || 'Error generating speech');
        } finally {
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Generate Speech';
        }
    }

    cleanup() {
        // Revoke all stored URLs
        this.audioUrls.forEach(url => URL.revokeObjectURL(url));
        this.audioUrls.clear();

        // Destroy wavesurfer instance
        if (this.wavesurfer) {
            this.wavesurfer.destroy();
        }
    }
}

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.speechApp = new SpeechApp();
});
