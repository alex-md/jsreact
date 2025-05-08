import QRCode from 'qrcode';
import { showToast } from '../../components/toast.js';

const WORKER_URL = 'https://image-host.vs.workers.dev/upload';

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
        console.log('Initializing event listeners'); // Add this line
        console.log('Dropzone element:', this.dropzone); // Add this line
        console.log('FileInput element:', this.fileInput); // Add this line        // File input handlers
        this.fileInput.addEventListener('change', (e) => {
            console.log('File input change event triggered');
            this.handleFileSelect(e);
        });

        // Drag and drop handlers
        this.dropzone.addEventListener('click', () => {
            console.log('Dropzone click event triggered');
            this.fileInput.click();
        }); this.dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dropzone.classList.add('border-primary');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleFile(file);
            }
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
        const self = this; // Capture the 'this' context

        document.addEventListener('paste', (e) => {
            console.log('Paste event triggered');
            const items = e.clipboardData.items;
            console.log('Clipboard items:', items);
            for (let item of items) {
                console.log('Clipboard item:', item);
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    console.log('File from clipboard:', file);
                    if (file) {
                        self.handleFile(file); // Use 'self' instead of 'this'
                    } else {
                        console.warn('Could not get file from clipboard item');
                        showToast('Could not read image from clipboard');
                    }
                    break;
                } else if (item.kind === 'file' && item.type.startsWith('image/')) {
                    // Handle file-based image data
                    const file = item.getAsFile();
                    console.log('File from clipboard (file kind):', file);
                    if (file) {
                        self.handleFile(file);
                    } else {
                        console.warn('Could not get file from clipboard item (file kind)');
                        showToast('Could not read image from clipboard');
                    }
                    break;
                } else if (item.type === 'text/plain') {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text');
                    console.log('Text from clipboard:', text);
                    try {
                        const url = new URL(text);
                        const allowedDomains = ['example.com', 'trusted.com']; // Define trusted domains
                        if (!allowedDomains.includes(url.hostname)) {
                            console.warn('URL hostname is not in the allowlist:', url.hostname);
                            showToast('The provided URL is not allowed.');
                            return;
                        }
                        // If the URL is valid and in the allowlist, try to load the image
                       fetch(url.toString(), { mode: 'cors' })
                           .then(response => response.blob())
                           .then(blob => {
                               const file = new File([blob], 'pastedImage.png', { type: 'image/png' });
                               self.handleFile(file);
                           })
                           .catch(error => {
                               console.warn('Could not load image from URL:', text, error);
                               showToast('Could not read image from clipboard');
                           });
                   } catch (error) {
                       console.warn('Pasted text is not a valid URL:', text);
                       showToast('Could not read image from clipboard');
                   }
                    break;
                } else {
                    console.log('Unsupported clipboard item type:', item.type, item.kind);
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

            console.log('Attempting to upload to:', WORKER_URL);
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload failed:', response.status, errorText);
                throw new Error(`Upload failed: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log('Upload response:', data);

            if (!data.url) {
                throw new Error('No URL returned from upload');
            }

            await this.generateQRCode(data.url);
            showToast('QR code generated successfully');
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast(`Error uploading image: ${error.message}`);
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
