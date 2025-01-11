import '../styles/global.css';
import { initializeGoogleAnalytics } from './common';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Google Analytics
    initializeGoogleAnalytics();

    // Add any policy page specific functionality here
    const lastUpdated = document.getElementById('last-updated');
    if (lastUpdated) {
        lastUpdated.textContent = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}); 