const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const API_URL = 'https://your-worker-url.workers.dev'; // Replace with your Cloudflare worker URL

const imageInput = document.getElementById('imageInput');
const uploadButton = document.getElementById('uploadButton');
const previewImage = document.getElementById('previewImage');
const qrcodeDiv = document.getElementById('qrcode');
const errorDiv = document.getElementById('error');

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function generateQRCode(url) {
    qrcodeDiv.innerHTML = '';
    const qr = qrcode(0, 'L');
    qr.addData(url);
    qr.make();
    qrcodeDiv.innerHTML = qr.createSvgTag();
}

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
        showError('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
        return;
    }

    if (file.size > MAX_SIZE) {
        showError('File is too large. Maximum size is 10MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
    };
    reader.readAsDataURL(file);
});

uploadButton.addEventListener('click', async () => {
    const file = imageInput.files[0];
    if (!file) {
        showError('Please select an image first.');
        return;
    }

    uploadButton.disabled = true;
    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        const shareUrl = `${API_URL}/${data.id}`;
        generateQRCode(shareUrl);
    } catch (error) {
        showError('Failed to upload image. Please try again.');
    } finally {
        uploadButton.disabled = false;
    }
});