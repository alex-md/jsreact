import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// @ts-ignore
self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'json') {
            return new jsonWorker();
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker();
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return new htmlWorker();
        }
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker();
        }
        return new editorWorker();
    }
};

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

// Document ready function to ensure DOM is fully loaded
function initReactApp() {
    const container = document.getElementById('root');

    if (!container) {
        console.error('Root element #root not found in the DOM.');
    } else {
        try {
            const root = createRoot(container); try {
                // Wrap App in error boundary
                const ErrorFallback = () => {
                    console.log("Error fallback rendered");
                    return (
                        <div style={{ padding: '20px', margin: '20px', border: '1px solid red', borderRadius: '5px' }}>
                            <h2>Something went wrong!</h2>
                            <p>There was an error in the playground. Please check the console for details.</p>
                        </div>
                    );
                };

                class ErrorBoundary extends React.Component {
                    constructor(props) {
                        super(props);
                        this.state = { hasError: false, error: null };
                    }

                    static getDerivedStateFromError(error) {
                        return { hasError: true, error };
                    }

                    componentDidCatch(error, info) {
                        console.error("Error caught by boundary:", error, info);
                    }

                    render() {
                        if (this.state.hasError) {
                            return <ErrorFallback />;
                        }
                        return this.props.children;
                    }
                }

                root.render(
                    <ErrorBoundary>
                        <App />
                    </ErrorBoundary>
                );
            } catch (renderError) {
                console.error("Error during render:", renderError);
            }
            console.log('React app successfully mounted');
        } catch (error) {
            console.error('Error mounting React app:', error);
        }
    }
}
// init app
document.addEventListener('DOMContentLoaded', initReactApp);
