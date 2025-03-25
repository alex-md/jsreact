import QRCode from 'qrcode';
import { showToast } from '../../components/toast.js';

const WORKER_URL = 'https://image-host.vs.workers.dev';

class QRGenerator {
    constructor() {
        this.dropzone = document.getElementById('dropzone');
        this.fileInput = document.getElementById('fileInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.preview = document.getElementById('preview');
        this.removeButton = document.getElementById('removeImage');
        this.qrContainer = document.getElementById('qrContainer');
        this.downloadButton = document.getElementById('downloadQR');

        this.currentFile = null;
        this.currentQR = null;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File input change handler
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop handlers
        this.dropzone.addEventListener('click', () => this.fileInput.click());
        this.dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dropzone.classList.add('border-primary');
        });
        this.dropzone.addEventListener('dragleave', () => {
            this.dropzone.classList.remove('border-primary');
        });
        this.dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dropzone.classList.remove('border-primary');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleFile(file);
            }
        });

        // Paste handler
        document.addEventListener('paste', (e) => {
            const items = e.clipboardData.items;
            for (let item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    this.handleFile(file);
                    break;
                }
            }
        });

        // Remove image handler
        this.removeButton.addEventListener('click', () => this.resetUI());

        // Download QR code handler
        this.downloadButton.addEventListener('click', () => this.downloadQRCode());
    }

    async handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            await this.handleFile(file);
        }
    }

    async handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            showToast('Please select a valid image file');
            return;
        }

        try {
            this.currentFile = file;

            // Show image preview
            const reader = new FileReader();
            reader.onload = (e) => {
                this.preview.src = e.target.result;
                this.imagePreview.classList.remove('hidden');
                this.dropzone.classList.add('hidden');
            };
            reader.readAsDataURL(file);

            // Upload image and generate QR code
            await this.uploadAndGenerateQR(file);
        } catch (error) {
            console.error('Error handling file:', error);
            showToast('Error processing image');
        }
    }

    async uploadAndGenerateQR(file) {
        try {
            this.qrContainer.innerHTML = '<div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>';

            // Upload to Cloudflare Worker
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(WORKER_URL + '/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const { url } = await response.json();
            await this.generateQRCode(url);

            showToast('QR code generated successfully');
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('Error uploading image');
            this.qrContainer.innerHTML = '<p class="text-destructive">Failed to generate QR code</p>';
        }
    }

    async generateQRCode(url) {
        try {
            const qrDataUrl = await QRCode.toDataURL(url, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 300,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });

            this.currentQR = qrDataUrl;

            const qrImage = document.createElement('img');
            qrImage.src = qrDataUrl;
            qrImage.className = 'max-w-full h-auto rounded-lg shadow-md';

            this.qrContainer.innerHTML = '';
            this.qrContainer.appendChild(qrImage);
            this.downloadButton.classList.remove('hidden');
        } catch (error) {
            console.error('Error generating QR code:', error);
            showToast('Error generating QR code');
        }
    }

    downloadQRCode() {
        if (!this.currentQR) return;

        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = this.currentQR;
        link.click();
    }

    resetUI() {
        this.currentFile = null;
        this.currentQR = null;
        this.fileInput.value = '';
        this.imagePreview.classList.add('hidden');
        this.dropzone.classList.remove('hidden');
        this.qrContainer.innerHTML = '<p class="text-muted-foreground">Upload or paste an image to generate a QR code</p>';
        this.downloadButton.classList.add('hidden');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new QRGenerator();
});
