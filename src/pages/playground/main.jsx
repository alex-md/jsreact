import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
);
