import React from 'react';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { DomainApp } from './Domain.jsx';

const container = document.getElementById('root');

if (!container) {
    console.error('Root element #root not found in the DOM.');
} else {
    try {
        const root = createRoot(container);
        root.render(
            <StrictMode>
                <DomainApp />
            </StrictMode>
        );
    } catch (error) {
        console.error('Error mounting React app:', error);
    }
}
