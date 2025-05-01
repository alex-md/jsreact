import React from 'react';
import { createRoot } from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import OSRSFlipper from './osrs';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('osrs-root');
    if (rootElement) {
        const root = createRoot(rootElement);
        root.render(
            <React.StrictMode>
                <StyledEngineProvider injectFirst>
                    <CssBaseline />
                    <OSRSFlipper />
                </StyledEngineProvider>
            </React.StrictMode>
        );
    } else {
        console.error('Could not find root element with id "osrs-root"');
    }
});
