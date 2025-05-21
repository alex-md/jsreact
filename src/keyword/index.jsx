import React from 'react';
import { createRoot } from 'react-dom/client';
import KeywordAnalyzer from './KeywordAnalyzer';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('root');
    if (root) {
        createRoot(root).render(
            <React.StrictMode>
                <KeywordAnalyzer />
            </React.StrictMode>
        );
    }
});
