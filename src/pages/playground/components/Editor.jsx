import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import 'monaco-editor/min/vs/editor/editor.main.css';

const Editor = ({ language = 'javascript', value = '', onChange }) => {
    const containerRef = useRef(null);
    const editorRef = useRef(null);
    const resizeObserverRef = useRef(null);

    // 1) initialize Monaco once
    useEffect(() => {
        if (!containerRef.current) return;

        // create the editor
        editorRef.current = monaco.editor.create(containerRef.current, {
            value,
            language,
            theme: 'vs',
            automaticLayout: true,       // let Monaco re-layout on its own
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            renderWhitespace: 'none',
            fixedOverflowWidgets: true,
            'semanticHighlighting.enabled': true,
        });

        // hook up onChange
        const disposable = editorRef.current.onDidChangeModelContent(() => {
            onChange?.(editorRef.current.getValue());
        });

        // watch container resize
        resizeObserverRef.current = new ResizeObserver(() => {
            editorRef.current.layout();
        });
        resizeObserverRef.current.observe(containerRef.current);

        // clean up on unmount
        return () => {
            disposable.dispose();
            resizeObserverRef.current.disconnect();
            editorRef.current.dispose();
            editorRef.current = null;
        };
    }, []); // run once

    // 2) keep value in sync
    useEffect(() => {
        const ed = editorRef.current;
        if (ed && value !== ed.getValue()) {
            ed.setValue(value);
        }
    }, [value]);

    // 3) keep language in sync
    useEffect(() => {
        const ed = editorRef.current;
        if (ed) {
            const model = ed.getModel();
            if (model) monaco.editor.setModelLanguage(model, language);
        }
    }, [language]);

    // Theme is now fixed to 'vs' (light theme)
    useEffect(() => {
        if (editorRef.current) {
            monaco.editor.setTheme('vs');
        }
    }, []);

    // the wrapper
    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', overflow: 'hidden' }}
            className="editor-container"
        />
    );
};

export default Editor;
