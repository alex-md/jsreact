import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

const configureMonacoJSX = async (retryCount = 0) => {
    if (retryCount > 10) {
        throw new Error('Failed to configure Monaco editor after multiple attempts');
    }

    // Check if Monaco is fully loaded
    if (!window.monaco || !monaco.languages || !monaco.languages.typescript) {
        await new Promise(resolve => setTimeout(resolve, Math.min(100 * Math.pow(1.5, retryCount), 2000)));
        return configureMonacoJSX(retryCount + 1);
    }

    try {
        // Check if already configured
        const existingOptions = monaco.languages.typescript.javascriptDefaults.getCompilerOptions();
        if (existingOptions.jsx === monaco.languages.typescript.JsxEmit.React) {
            return true;
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

        // Add React type definitions
        monaco.languages.typescript.javascriptDefaults.addExtraLib(`
            declare namespace React {
                function createElement(type: any, props: any, ...children: any[]): any;
                function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
                function useEffect(effect: () => void | (() => void), deps?: any[]): void;
                function useRef<T>(initialValue: T): { current: T };
                const Fragment: unique symbol;
            }
            declare module "react" {
                export = React;
            }
        `, 'react.d.ts');

        return true;
    } catch (error) {
        console.error('Error configuring Monaco JSX support:', error);
        if (retryCount < 10) {
            await new Promise(resolve => setTimeout(resolve, Math.min(100 * Math.pow(1.5, retryCount), 2000)));
            return configureMonacoJSX(retryCount + 1);
        }
        throw error;
    }
};

const Editor = ({ language, value, onChange, theme }) => {
    const editorRef = useRef(null);
    const monacoEditorRef = useRef(null);
    const resizeObserverRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const resizeEditor = () => {
        if (monacoEditorRef.current) {
            monacoEditorRef.current.layout();
        }
    };

    // Main initialization effect
    useEffect(() => {
        let mounted = true;
        let initAttempts = 0;
        const maxAttempts = 10;

        const initializeEditor = async () => {
            if (!editorRef.current || monacoEditorRef.current) return;
            if (initAttempts >= maxAttempts) {
                throw new Error('Failed to initialize editor after maximum attempts');
            }

            try {
                setError(null);
                await configureMonacoJSX();

                if (!mounted) return;

                const editorOptions = {
                    value,
                    language,
                    theme: theme || 'vs',
                    automaticLayout: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    tabSize: 2,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    renderWhitespace: 'none',
                    fixedOverflowWidgets: true,
                    'semanticHighlighting.enabled': true
                };

                monacoEditorRef.current = monaco.editor.create(editorRef.current, editorOptions);

                if (language === 'javascript') {
                    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                        noSemanticValidation: true,
                        noSyntaxValidation: false,
                        noSuggestionDiagnostics: true
                    });
                }

                monacoEditorRef.current.onDidChangeModelContent(() => {
                    if (mounted && onChange) {
                        onChange(monacoEditorRef.current.getValue());
                    }
                });

                // Set up resize handling
                resizeObserverRef.current = new ResizeObserver(resizeEditor);
                resizeObserverRef.current.observe(editorRef.current);
                window.addEventListener('resize', resizeEditor);

                // Initial layout
                resizeEditor();
                setIsLoading(false);
            } catch (err) {
                console.error('Editor initialization error:', err);
                initAttempts++;

                if (mounted && initAttempts < maxAttempts) {
                    setTimeout(initializeEditor, Math.min(100 * Math.pow(1.5, initAttempts), 2000));
                } else if (mounted) {
                    setError(err instanceof Error ? err.message : 'Failed to initialize editor');
                    setIsLoading(false);
                }
            }
        };

        // Start initialization with a small delay
        const timer = setTimeout(initializeEditor, 100);

        return () => {
            mounted = false;
            clearTimeout(timer);
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

    // Update value
    useEffect(() => {
        if (monacoEditorRef.current && value !== undefined) {
            const currentValue = monacoEditorRef.current.getValue();
            if (currentValue !== value) {
                monacoEditorRef.current.setValue(value);
            }
        }
    }, [value]);

    // Update language
    useEffect(() => {
        if (monacoEditorRef.current && language) {
            const model = monacoEditorRef.current.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, language);
            }
        }
    }, [language]);

    // Update theme
    useEffect(() => {
        if (monacoEditorRef.current && theme) {
            monaco.editor.setTheme(theme);
        }
    }, [theme]);

    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center flex-col gap-2 text-red-500 p-4">
                <div>Error initializing editor: {error}</div>
                <div className="text-sm text-gray-500">Check console for details</div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="text-sm text-gray-500">Loading editor...</div>
            </div>
        );
    }

    return (
        <div ref={editorRef} className="h-full w-full overflow-hidden" />
    );
};

export default Editor;
