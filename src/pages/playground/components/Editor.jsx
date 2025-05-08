import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

// Configure Monaco to handle JSX in JavaScript only
const configureMonacoJSX = () => {
    try {
        // Wait for monaco to be fully initialized
        if (!monaco.languages || !monaco.languages.typescript) {
            console.warn('Waiting for Monaco language services to initialize...');
            return false;
        }

        // Configure JavaScript defaults
        const compilerOptions = {
            jsx: monaco.languages.typescript.JsxEmit.React,
            jsxFactory: 'React.createElement',
            reactNamespace: 'React',
            allowNonTsExtensions: true,
            allowJs: true,
            target: monaco.languages.typescript.ScriptTarget.Latest,
        };

        monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions);
        return true;
    } catch (error) {
        console.error('Error configuring Monaco JSX support:', error);
        return false;
    }
};

const Editor = ({ language, value, onChange, theme }) => {
    const editorRef = useRef(null);
    const monacoEditorRef = useRef(null);
    const resizeObserverRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const resizeEditor = () => {
        if (monacoEditorRef.current) {
            monacoEditorRef.current.layout();
        }
    };    // Main initialization effect
    useEffect(() => {
        const initializeEditor = async () => {
            if (!editorRef.current || monacoEditorRef.current) return;

            try {
                setIsLoading(true);

                // Retry configuration until Monaco is ready
                let retries = 0;
                const maxRetries = 5;
                let configured = false;

                while (!configured && retries < maxRetries) {
                    configured = configureMonacoJSX();
                    if (!configured) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        retries++;
                    }
                }

                if (!configured) {
                    throw new Error('Failed to configure Monaco editor after multiple attempts');
                }

                monacoEditorRef.current = monaco.editor.create(editorRef.current, {
                    value,
                    language,
                    theme,
                    automaticLayout: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: true,
                    fontSize: 13,
                    tabSize: 2,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    renderWhitespace: 'none',
                    fixedOverflowWidgets: false,
                });

                // Apply specific settings for JSX content if language is javascript
                if (language === 'javascript') {
                    const model = monacoEditorRef.current.getModel();
                    if (model) {
                        // Better JSX support in JavaScript mode
                        if (monaco.languages.typescript) {
                            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                                noSemanticValidation: true,
                                noSyntaxValidation: false,
                                noSuggestionDiagnostics: true
                            });                            // Add basic React declarations for JavaScript
                            monaco.languages.typescript.javascriptDefaults.addExtraLib(`
                                declare namespace React {
                                    function createElement(type, props, ...children);
                                    function useState(initialState);
                                    function useEffect(effect, deps);
                                    function useRef(initialValue);
                                    function useContext(context);
                                    function useCallback(callback, deps);
                                    function useMemo(factory, deps);
                                    const Fragment;
                                }
                                
                                // Export React for global use
                                export = React;
                            `, 'react-types.d.ts');
                        }
                    }
                }

                monacoEditorRef.current.onDidChangeModelContent(() => {
                    onChange(monacoEditorRef.current?.getValue() || '');
                });

                window.addEventListener('resize', resizeEditor);
                resizeObserverRef.current = new ResizeObserver(resizeEditor);
                resizeObserverRef.current.observe(editorRef.current);

                monaco.editor.setTheme(theme);
                resizeEditor(); // Initial layout adjustment            } catch (err) {
                console.error('Failed to initialize Monaco editor:', err);
                setError(err instanceof Error ? err.message : 'Failed to initialize Monaco editor');
            } finally {
                setIsLoading(false);
            }
        };

        // Add a small delay to ensure monaco is ready
        setTimeout(initializeEditor, 100);

        return () => {
            window.removeEventListener('resize', resizeEditor);
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
            if (monacoEditorRef.current) {
                monacoEditorRef.current.dispose();
                monacoEditorRef.current = null;
            }
        };
    }, []);

    // Update language
    useEffect(() => {
        if (monacoEditorRef.current) {
            const model = monacoEditorRef.current.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, language);
            }
        }
    }, [language]);

    // Update value
    useEffect(() => {
        if (monacoEditorRef.current) {
            const currentValue = monacoEditorRef.current.getValue();
            if (currentValue !== value) {
                monacoEditorRef.current.setValue(value);
            }
        }
    }, [value]);

    // Update theme
    useEffect(() => {
        if (monacoEditorRef.current) {
            monaco.editor.setTheme(theme);
        }
    }, [theme]);

    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center flex-col gap-2 text-red-500">
                <div>Error: {error}</div>
                <div className="text-sm text-gray-500">Check browser console for details</div>
            </div>
        );
    }

    return (
        <div ref={editorRef} className="h-full w-full overflow-hidden" />
    );
};

export default Editor;
