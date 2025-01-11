/**
 * Common utility functions for JSReact applications
 * @module common
 */

/**
 * Initializes Google Analytics tracking
 */
export function initializeGoogleAnalytics() {
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-ZEFG04PXR7');
}

// Initialize dark mode
if (!('theme' in localStorage)) {
    localStorage.theme = 'dark';
}

// API Key Management
let api_key;

/**
 * Updates the API key based on input field value and validates it
 */
export function updateApiKey() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    if (apiKeyInput) {
        isValidOpenAIKey(apiKeyInput.value) 
            ? apiKeyInput.classList.remove('is-invalid') 
            : apiKeyInput.classList.add('is-invalid');
        api_key = apiKeyInput.value;
    }
}

/**
 * Validates an OpenAI API key format
 * @param {string} key - The API key to validate
 * @returns {boolean} True if the key matches the expected format
 */
export function isValidOpenAIKey(key) {
    const regexPattern = /^sk-proj-[A-Za-z0-9-_]{120,140}$/;
    return regexPattern.test(key);
}

/**
 * Sanitizes input by removing HTML tags
 * @param {string} input - The input string to sanitize
 * @returns {string} Sanitized string with HTML tags removed
 */
export function sanitizeInput(input) {
    return input.replace(/<[^>]*>/g, '');
}

/**
 * Validates text length against a maximum limit
 * @param {string} text - The text to validate
 * @param {number} [maxLength=50000] - Maximum allowed length
 * @returns {boolean} True if text length is within limit
 */
function validateTextLength(text, maxLength = 50000) {
    return text.length <= maxLength;
}

/**
 * Handles API errors and returns appropriate error messages
 * @param {Error} error - The error object from API response
 * @returns {string} User-friendly error message
 */
function handleApiError(error) {
    if (error.response) {
        switch (error.response.status) {
            case 429: return 'Too many requests. Please try again later.';
            case 401: return 'Invalid API key';
            default: return 'An error occurred. Please try again.';
        }
    }
    return 'Network error. Please check your connection.';
}

/**
 * Shows a toast notification
 * @param {string} [title='Missing API Key'] - Toast title
 * @param {string} [message='Please enter a valid OpenAI API key.'] - Toast message
 */
function showToast(title = 'Missing API Key', message = 'Please enter a valid OpenAI API key.') {
    // Create the toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.classList.add('position-fixed', 'bottom-0', 'start-0', 'p-3');
        document.body.appendChild(toastContainer);
    }

    // Create the toast
    const toast = document.createElement('div');
    toast.classList.add('toast', 'bg-light', 'text-light', 'fs-4', 'w-100');
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    // Create header
    const toastHeader = document.createElement('div');
    toastHeader.classList.add('toast-header', 'bg-danger', 'text-light');
    const strong = document.createElement('strong');
    strong.classList.add('mr-auto');
    strong.textContent = title;
    toastHeader.appendChild(strong);

    // Create body
    const toastBody = document.createElement('div');
    toastBody.classList.add('toast-body', 'text-body-secondary');
    toastBody.textContent = message;

    // Assemble toast
    toast.appendChild(toastHeader);
    toast.appendChild(toastBody);
    toastContainer.appendChild(toast);

    // Show toast
    const toastEl = new bootstrap.Toast(toast);
    toastEl.show();
}

/**
 * Initializes common functionality across the application
 * - Sets up Google Analytics
 * - Configures global error handling
 * - Initializes API key input listener
 */
function initializeCommon() {
    // Initialize Google Analytics
    initializeGoogleAnalytics();
    
    // Add global error handling
    window.onerror = function(msg, url, lineNo, columnNo, error) {
        console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo + '\nError object: ' + JSON.stringify(error));
        return false;
    };

    // Add API key input listener if exists
    const apiKeyInput = document.getElementById('apiKeyInput');
    if (apiKeyInput) {
        apiKeyInput.addEventListener('input', updateApiKey);
    }
}

// Export functions
window.initializeGoogleAnalytics = initializeGoogleAnalytics;
window.initializeCommon = initializeCommon;
window.api_key = api_key;
window.updateApiKey = updateApiKey;
window.isValidOpenAIKey = isValidOpenAIKey;
window.sanitizeInput = sanitizeInput;
window.validateTextLength = validateTextLength;
window.handleApiError = handleApiError;
window.showToast = showToast; 