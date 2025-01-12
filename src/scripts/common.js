/**
 * Common utility functions for JSReact applications
 * @module common
 */

// API Key Management
let api_key;

/**
 * Updates the API key based on input field value and validates it
 */
function updateApiKey() {
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
function isValidOpenAIKey(key) {
    const regexPattern = /^sk-proj-[A-Za-z0-9-_]{120,140}$/;
    return regexPattern.test(key);
}

/**
 * Sanitizes input by removing HTML tags
 * @param {string} input - The input string to sanitize
 * @returns {string} Sanitized string with HTML tags removed
 */
function sanitizeInput(input) {
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

// Export functions
window.api_key = api_key;
window.updateApiKey = updateApiKey;
window.isValidOpenAIKey = isValidOpenAIKey;
window.sanitizeInput = sanitizeInput;
window.validateTextLength = validateTextLength;
window.handleApiError = handleApiError; 