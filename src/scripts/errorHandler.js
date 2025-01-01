// Global error handler
window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo);
    return false;
};

// API error handler
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
