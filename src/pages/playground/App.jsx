import React, { useState, useEffect, useRef } from 'react';
import { Package, Moon, Sun, X } from 'lucide-react';
import Split from 'split.js';
import Editor from './components/Editor';
import Preview from './components/Preview';
import PackageManager from './components/PackageManager';
import { showToast } from '@components/toast.js';

function App() {
    console.log("App component rendering");
    const [isSimplifiedMode, setIsSimplifiedMode] = useState(false);
    const [html, setHtml] = useState('<style>\nbody {\n  font-family: system-ui, -apple-system, sans-serif;\n  color: #333;\n}\n\nh1 {\n  color: #0070f3;\n}\n</style>\n\n<div class="container mt-5">\n  <h1>Hello, World!</h1>\n  <p>Start coding to see your changes in real-time.</p>\n</div>');
    const [js, setJs] = useState(`// Your JavaScript code here\nconsole.log("Hello from the playground!");\n\n// Example of JSX usage\nconst ExampleComponent = () => {\n  return React.createElement('div', { className: 'example' },\n    React.createElement('h2', null, 'JSX Example'),\n    React.createElement('p', null, 'This is an example of how to use JSX-like syntax')\n  );\n};\n\n// Create an element in the DOM\nconst container = document.createElement('div');\ndocument.body.appendChild(container);\n`);
    const [packages, setPackages] = useState([
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css'
    ]);
    const [darkMode, setDarkMode] = useState(false);
    const [showPackageManager, setShowPackageManager] = useState(false);
    const [activeTab, setActiveTab] = useState('html');
    const [showJsxNotification, setShowJsxNotification] = useState(true);

    const splitVerticalRef = useRef(null);
    const splitHorizontalRef = useRef(null);
    const splitVerticalInstance = useRef(null);
    const splitHorizontalInstance = useRef(null);

    // Handle layout splitting
    useEffect(() => {
        const initSplits = () => {
            if (!splitVerticalRef.current || !splitHorizontalRef.current) return;

            const editorsContainer = document.querySelector('.editors-container');
            const previewPane = document.querySelector('.preview-pane');
            const htmlEditor = document.querySelector('.html-editor');
            const jsEditor = document.querySelector('.js-editor');

            const splitOptions = {
                sizes: [50, 50],
                minSize: 100,
                gutterSize: 8,
                direction: 'horizontal',
                elementStyle: (_, size, gutterSize) => ({
                    'flexBasis': `calc(${size}% - ${gutterSize}px)`,
                }),
                gutterStyle: (_, gutterSize) => ({
                    'flexBasis': `${gutterSize}px`,
                }),
                // Add options to handle touch events passively
                dragInterval: 1,
                onDragStart: function () { },
                onDragEnd: function () { },
                snapOffset: 0
            };

            if (editorsContainer && previewPane && !splitVerticalInstance.current) {
                try {
                    splitVerticalInstance.current = Split(['.editors-container', '.preview-pane'], {
                        ...splitOptions,
                    });
                } catch (err) {
                    console.error("Error initializing vertical split:", err);
                }
            }

            if (htmlEditor && jsEditor && !splitHorizontalInstance.current) {
                try {
                    splitHorizontalInstance.current = Split(['.html-editor', '.js-editor'], {
                        ...splitOptions,
                    });
                } catch (err) {
                    console.error("Error initializing horizontal split:", err);
                }
            }
        };

        const timer = setTimeout(initSplits, 1000);
        return () => {
            clearTimeout(timer);
            if (splitVerticalInstance.current) {
                splitVerticalInstance.current.destroy();
                splitVerticalInstance.current = null;
            }
            if (splitHorizontalInstance.current) {
                splitHorizontalInstance.current.destroy();
                splitHorizontalInstance.current = null;
            }
        };
    }, []);

    // Handle dark mode
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    // Add error boundary effect
    useEffect(() => {
        const handleError = (event) => {
            console.error("Global error caught:", event.error);
            event.preventDefault();
            setIsSimplifiedMode(true);
        };

        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    // Set up a key press shortcut to toggle simplified mode
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && event.shiftKey) {
                setIsSimplifiedMode(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSimplifiedMode]);

    // Show welcome toast when component mounts
    useEffect(() => {
        // Create toast container if it doesn't exist
        const createToastContainer = () => {
            const existingContainer = document.getElementById('toast-container');
            if (existingContainer) return;

            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        };

        const timer = setTimeout(() => {
            createToastContainer();
            showToast('Welcome to the JavaScript Playground! JSX support has been enabled.', 'info');
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

    // Render simplified mode if enabled
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

    // Main render
    return (
        <div className="flex flex-col h-screen">
            <div className="flex-1 flex min-h-0" ref={splitVerticalRef}>
                <div className="editors-container min-h-0" ref={splitHorizontalRef}>
                    <div className="html-editor editor-container">
                        <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                            <h2 className="text-sm font-medium">HTML & CSS</h2>
                        </div>
                        <div className="editor-content">
                            <Editor
                                language="html"
                                value={html}
                                onChange={setHtml}
                                theme={darkMode ? 'vs-dark' : 'vs'}
                            />
                        </div>
                    </div>

                    <div className="js-editor editor-container">
                        <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                            <h2 className="text-sm font-medium">JavaScript</h2>
                        </div>
                        <div className="editor-content">
                            {showJsxNotification && (
                                <div className={`absolute top-0 left-0 right-0 z-10 p-2 text-sm ${darkMode ? 'bg-blue-900/80 text-blue-100' : 'bg-blue-100 text-blue-800'} border-b ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium">JSX Support:</span> Basic JSX syntax is now supported! Add React libraries from Package Manager for full React support.
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowJsxNotification(false);
                                                showToast('JSX notification dismissed. You can still use JSX in your code.', 'info');
                                            }}
                                            className={`p-1 rounded-full ${darkMode ? 'hover:bg-blue-800' : 'hover:bg-blue-200'}`}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            <Editor
                                language="javascript"
                                value={js}
                                onChange={setJs}
                                theme={darkMode ? 'vs-dark' : 'vs'}
                            />
                        </div>
                    </div>
                </div>
                <div className="preview-pane h-full flex flex-col min-h-0">
                    <div className={`flex items-center justify-between px-4 py-2 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                        <h2 className="text-sm font-medium">Preview</h2>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setShowPackageManager(true)}
                                className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                                title="Manage packages"
                            >
                                <Package className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                                title={darkMode ? "Light mode" : "Dark mode"}
                            >
                                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <Preview html={html} js={js} packages={packages} darkMode={darkMode} />
                    </div>
                </div>
            </div>

            {showPackageManager && (
                <PackageManager
                    packages={packages}
                    addPackage={addPackage}
                    removePackage={removePackage}
                    onClose={() => setShowPackageManager(false)}
                    darkMode={darkMode}
                />
            )}
        </div>
    );
}

export default App;
