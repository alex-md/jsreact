import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

// Configure Monaco to better handle JSX
const configureMonacoJSX = () => {
    // Add JSX support to JavaScript and TypeScript
    try {
        const languages = ['javascript', 'typescript'];
        if (monaco.languages.typescript) {
            languages.forEach(lang => {
                monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                    jsx: monaco.languages.typescript.JsxEmit.React,
                    jsxFactory: 'React.createElement',
                    reactNamespace: 'React',
                    allowNonTsExtensions: true,
                    allowJs: true,
                    target: monaco.languages.typescript.ScriptTarget.Latest,
                });
            });
        } else {
            console.warn('TypeScript language support not available in Monaco');
        }
    } catch (error) {
        console.error('Error configuring Monaco JSX support:', error);
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
    };
    
    // Main initialization effect
    useEffect(() => {
        const initializeEditor = async () => {
            if (!editorRef.current || monacoEditorRef.current) return;

            try {
                // Configure JSX support for JavaScript/TypeScript
                configureMonacoJSX();

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
                            });
                            
                            // Add comprehensive React type definitions for better intellisense
                            monaco.languages.typescript.javascriptDefaults.addExtraLib(`
                                declare namespace React {
                                    function createElement(type: any, props?: any, ...children: any[]): any;
                                    function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
                                    function useEffect(effect: () => void | (() => void), deps?: any[]): void;
                                    function useRef<T>(initialValue: T): { current: T };
                                    function useContext<T>(context: React.Context<T>): T;
                                    function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
                                    function useMemo<T>(factory: () => T, deps: any[]): T;
                                    const Fragment: symbol;
                                    
                                    // Common types
                                    interface FunctionComponent<P = {}> {
                                        (props: P): any;
                                    }
                                    type FC<P = {}> = FunctionComponent<P>;
                                    
                                    // Context API
                                    interface Context<T> {
                                        Provider: any;
                                        Consumer: any;
                                        displayName?: string;
                                    }
                                    function createContext<T>(defaultValue: T): Context<T>;
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
                resizeEditor(); // Initial layout adjustment
            } catch (err) {
                console.error('Failed to initialize Monaco editor:', err);
                setError(err instanceof Error ? err.message : 'Failed to initialize Monaco editor');
            }
        };

        initializeEditor();

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
