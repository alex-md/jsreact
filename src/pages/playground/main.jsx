import React from 'react';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App';
import './index.css';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Configure Monaco Editor worker paths
window.MonacoEnvironment = {
    getWorkerUrl(_, label) {
        const workerMap = {
            json: jsonWorker,
            css: cssWorker,
            html: htmlWorker,
            typescript: tsWorker,
            javascript: tsWorker
        };
        const worker = workerMap[label] || editorWorker;
        return worker.toString();
    }
};

// Document ready function to ensure DOM is fully loaded
function initReactApp() {
    const container = document.getElementById('root');

    if (!container) {
        console.error('Root element #root not found in the DOM.');
    } else {
        try {
            const root = createRoot(container);
            root.render(
                <StrictMode>
                    <App />
                </StrictMode>
            );
            console.log('React app successfully mounted');
        } catch (error) {
            console.error('Error mounting React app:', error);
        }
    }
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReactApp);
} else {
    initReactApp();
}
