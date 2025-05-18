// filepath: /Users/alex/Documents/GitHub/jsreact/src/pages/playground/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Package, X } from 'lucide-react';
import Split from 'split.js';
import Editor from './components/Editor';
import Preview from './components/Preview';
import PackageManager from './components/PackageManager';
import { showToast } from '@components/toast.js';

function App() {
    console.log("App component rendering");
    const [isSimplifiedMode, setIsSimplifiedMode] = useState(false);
    const [html, setHtml] = useState('<p>Start coding to see your changes in real-time.</p>');
    const [cssText, setCss] = useState(`/* Your CSS code here */
body {
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  color: #0070f3;
}`);
    const [js, setJs] = useState(`// Your JavaScript code here
console.log("Hello from the playground!");

// Example: Create and add elements to the DOM
const title = document.createElement('h2');
title.textContent = 'JavaScript Example';
title.style.color = '#0070f3';

const paragraph = document.createElement('p');
paragraph.textContent = 'This content was dynamically added with JavaScript!';

const container = document.createElement('div');
container.className = 'example-container';
container.appendChild(title);
container.appendChild(paragraph);

document.body.appendChild(container);
`);
    const [packages, setPackages] = useState([
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css'
    ]);
    const [showPackageManager, setShowPackageManager] = useState(false);

    const mainSplitInstanceRef = useRef(null); // For [Editors Block] | [Preview]
    const editorsSplitInstanceRef = useRef(null); // For [HTML] | [CSS] | [JS]

    useEffect(() => {
        let mainSplitter = null;
        let editorsSplitter = null;

        const initSplits = () => {
            const editorsBlockElement = document.querySelector('.editors-block-split-target');
            const previewPaneElement = document.querySelector('.preview-pane-split-target');

            const htmlEditorElement = document.querySelector('.html-editor-split-target');
            const cssEditorElement = document.querySelector('.css-editor-split-target');
            const jsEditorElement = document.querySelector('.js-editor-split-target');

            const commonSplitOptions = {
                minSize: 50,
                gutterSize: 10,
                elementStyle: (dimension, size, gutterSize) => ({
                    'flex-basis': `calc(${size}% - ${gutterSize}px)`,
                }),
                gutterStyle: (dimension, gutterSize) => ({
                    'flex-basis': `${gutterSize}px`,
                }),
                dragInterval: 1,
            };

            // Main split: [Editors Block] | [Preview Pane]
            if (editorsBlockElement && previewPaneElement && !mainSplitInstanceRef.current) {
                try {
                    mainSplitter = Split([editorsBlockElement, previewPaneElement], {
                        ...commonSplitOptions,
                        sizes: [66, 34], // Example sizes: Editors block takes more space
                        direction: 'horizontal', // Side-by-side panes, vertical gutter
                    });
                    mainSplitInstanceRef.current = mainSplitter;
                } catch (err) {
                    console.error("Error initializing main split:", err);
                }
            }

            // Editors split: [HTML] | [CSS] | [JS] (within Editors Block)
            if (htmlEditorElement && cssEditorElement && jsEditorElement && !editorsSplitInstanceRef.current) {
                try {
                    editorsSplitter = Split([htmlEditorElement, cssEditorElement, jsEditorElement], {
                        ...commonSplitOptions,
                        sizes: [33, 34, 33],
                        direction: 'horizontal', // Side-by-side panes, vertical gutter
                    });
                    editorsSplitInstanceRef.current = editorsSplitter;
                } catch (err) {
                    console.error("Error initializing editors split:", err);
                }
            }
        };

        const timer = setTimeout(initSplits, 100);

        return () => {
            clearTimeout(timer);
            if (mainSplitInstanceRef.current) {
                mainSplitInstanceRef.current.destroy();
                mainSplitInstanceRef.current = null;
            }
            if (editorsSplitInstanceRef.current) {
                editorsSplitInstanceRef.current.destroy();
                editorsSplitInstanceRef.current = null;
            }
        };
    }, []);

    // Dark mode effect removed

    useEffect(() => {
        const handleError = (event) => {
            console.error("Global error caught:", event.error);
            event.preventDefault();
            setIsSimplifiedMode(true);
        };
        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && event.shiftKey) {
                setIsSimplifiedMode(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const createToastContainer = () => {
            if (document.getElementById('toast-container')) return;
            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        };
        const timer = setTimeout(() => {
            createToastContainer();
            showToast('Welcome to the HTML, CSS, and JavaScript Playground!', 'info');
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const addPackage = (packageUrl) => {
        if (!packages.includes(packageUrl)) {
            setPackages(prevPackages => [...prevPackages, packageUrl]);
            const packageName = packageUrl.split('/').pop();
            showToast(`Package ${packageName} added successfully!`, 'success');
        }
    };

    const removePackage = (packageUrl) => {
        setPackages(prevPackages => prevPackages.filter(p => p !== packageUrl));
        const packageName = packageUrl.split('/').pop();
        showToast(`Package ${packageName} removed.`, 'warning');
    };

    if (isSimplifiedMode) {
        return (
            <div className="p-4">
                <h1>Playground (Debug Mode)</h1>
                <p>The playground is currently in debug mode due to rendering issues.</p>
                <button
                    onClick={() => setIsSimplifiedMode(false)}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Try Normal Mode
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Main Split Container: lays out [Editors Block] and [Preview Pane] side-by-side */}
            <div className="flex-1 flex flex-row min-h-0"> {/* flex-row for side-by-side children */}

                {/* Editors Block: Contains HTML, CSS, JS editors. It's a target for the main split.
                    Itself lays out its children (HTML, CSS, JS editors) side-by-side.
                    `grow` and `min-w-0` are for its role in the main split.
                    `flex-row` is for its internal layout.
                    `min-h-0` for vertical flexibility if its content overflows. */}
                <div className="editors-block-split-target flex flex-row grow min-w-0 min-h-0">

                    {/* HTML Editor Pane: Target for the inner "editors split".
                        `grow` and `min-w-0` for its role in the editors split.
                        `flex flex-col` for its internal layout (header + editor content).
                        `min-h-0` for vertical flexibility. */}
                    <div className="html-editor-split-target editor-container flex flex-col grow min-w-0 min-h-0">
                        <div className="px-4 py-2 border-b border-gray-200 bg-white">
                            <h2 className="text-sm font-medium">HTML</h2>
                        </div>
                        <div className="editor-content flex-1 min-h-0">
                            <Editor
                                language="html"
                                value={html}
                                onChange={setHtml}
                                theme="vs"
                            />
                        </div>
                    </div>

                    {/* CSS Editor Pane: Target for the inner "editors split". */}
                    <div className="css-editor-split-target editor-container flex flex-col grow min-w-0 min-h-0">
                        <div className="px-4 py-2 border-b border-gray-200 bg-white">
                            <h2 className="text-sm font-medium">CSS</h2>
                        </div>
                        <div className="editor-content flex-1 min-h-0">
                            <Editor
                                language="css"
                                value={cssText}
                                onChange={setCss}
                                theme="vs"
                            />
                        </div>
                    </div>

                    {/* JS Editor Pane: Target for the inner "editors split". */}
                    <div className="js-editor-split-target editor-container flex flex-col grow min-w-0 min-h-0">
                        <div className="px-4 py-2 border-b border-gray-200 bg-white">
                            <h2 className="text-sm font-medium">JavaScript</h2>
                        </div>
                        <div className="editor-content flex-1 min-h-0">
                            <Editor
                                language="javascript"
                                value={js}
                                onChange={setJs}
                                theme="vs"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview Pane: Target for the main split.
                    `grow` and `min-w-0` for its role in the main split.
                    `flex flex-col` for its internal layout (header + preview content).
                    `min-h-0` for vertical flexibility. */}
                <div className="preview-pane-split-target flex flex-col grow min-w-0 min-h-0">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
                        <h2 className="text-sm font-medium">Preview</h2>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setShowPackageManager(true)}
                                className="p-2 rounded-md hover:bg-gray-100"
                                title="Manage packages"
                            >
                                <Package className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden min-h-0">
                        <Preview html={html} cssCode={cssText} js={js} packages={packages} />
                    </div>
                </div>
            </div>

            {showPackageManager && (
                <PackageManager
                    packages={packages}
                    addPackage={addPackage}
                    removePackage={removePackage}
                    onClose={() => setShowPackageManager(false)}

                />
            )}
        </div>
    );
}

export default App;
