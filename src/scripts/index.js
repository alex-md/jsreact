import '../styles/main.css';
import { initializeGoogleAnalytics } from './common';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Google Analytics
    initializeGoogleAnalytics();

    // Add any home page specific functionality here
    const cards = document.querySelectorAll('.bg-white.dark\\:bg-gray-800');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('shadow-xl');
            card.classList.remove('shadow-lg');
        });
        card.addEventListener('mouseleave', () => {
            card.classList.remove('shadow-xl');
            card.classList.add('shadow-lg');
        });
    });
}); 