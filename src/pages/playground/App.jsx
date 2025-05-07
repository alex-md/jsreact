import React, { useState, useEffect, useRef } from 'react';
import { Package, Moon, Sun, X } from 'lucide-react';
import Split from 'split.js';
import Editor from './components/Editor';
import Preview from './components/Preview';
import PackageManager from './components/PackageManager';
import { showToast } from '@components/toast.js';

function App() {
    const [html, setHtml] = useState('<div class="container mt-5">\n  <h1>Hello, World!</h1>\n  <p>Start coding to see your changes in real-time.</p>\n</div>');
    const [css, setCss] = useState('body {\n  font-family: system-ui, -apple-system, sans-serif;\n  color: #333;\n}\n\nh1 {\n  color: #0070f3;\n}');
    const [js, setJs] = useState(`// Your JavaScript code here
console.log("Hello from the playground!");

// Example of JSX usage
const ExampleComponent = () => {
  return React.createElement('div', { className: 'example' },
    React.createElement('h2', null, 'JSX Example'),
    React.createElement('p', null, 'This is an example of how to use JSX-like syntax')
  );
};

// Create an element in the DOM
const container = document.createElement('div');
document.body.appendChild(container);

// Render the component (this only works with the React libraries added)
// If you want to use actual JSX, add React libraries from the Package Manager
`);
    const [packages, setPackages] = useState([
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css'
    ]);
    const [darkMode, setDarkMode] = useState(false); const [showPackageManager, setShowPackageManager] = useState(false);
    const [activeTab, setActiveTab] = useState('html');  // Not used, but kept for potential future features
    const [showJsxNotification, setShowJsxNotification] = useState(true);  // Show JSX notification initially

    const splitVerticalRef = useRef(null);
    const splitHorizontalRef = useRef(null);
    const splitVerticalInstance = useRef(null);
    const splitHorizontalInstance = useRef(null);

    // Handle layout splitting
    useEffect(() => {
        if (splitVerticalRef.current && !splitVerticalInstance.current) {
            splitVerticalInstance.current = Split(['.editors-container', '.preview-pane'], {
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
                touchEvents: {
                    passive: true,
                },
            });
        }

        if (splitHorizontalRef.current && !splitHorizontalInstance.current) {
            splitHorizontalInstance.current = Split(['.html-editor', '.css-editor', '.js-editor'], {
                sizes: [33, 33, 34],
                minSize: 100,
                gutterSize: 8,
                direction: 'horizontal',
                elementStyle: (_, size, gutterSize) => ({
                    'flexBasis': `calc(${size}% - ${gutterSize}px)`,
                }),
                gutterStyle: (_, gutterSize) => ({
                    'flexBasis': `${gutterSize}px`,
                }),
                touchEvents: {
                    passive: true,
                },
            });
        }

        return () => {
            if (splitVerticalInstance.current) {
                splitVerticalInstance.current.destroy();
                splitVerticalInstance.current = null;
            }
            if (splitHorizontalInstance.current) {
                splitHorizontalInstance.current.destroy();
                splitHorizontalInstance.current = null;
            }
        };
    }, []);    // Handle dark mode
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    // Show welcome toast when component mounts
    useEffect(() => {
        showToast('Welcome to the JavaScript Playground! JSX support has been enabled.', 'info');
    }, []); const addPackage = (packageUrl) => {
        if (!packages.includes(packageUrl)) {
            setPackages([...packages, packageUrl]);

            // Show success toast when package is added
            const packageName = packageUrl.split('/').pop();
            showToast(`Package ${packageName} added successfully!`, 'success');

            // Show specific notification for React packages
            if (packageUrl.includes('react')) {
                showToast('React detected! You can now use full JSX features in the JavaScript editor.', 'info');
            }
        }
    };

    const removePackage = (packageUrl) => {
        setPackages(packages.filter(p => p !== packageUrl));
        const packageName = packageUrl.split('/').pop();
        showToast(`Package ${packageName} removed.`, 'warning');
    };

    return (
        <div className={`h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
            <header className={`flex items-center justify-between px-4 h-12 border-b ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => setActiveTab('html')}
                        className={`px-3 py-1.5 rounded-md text-sm ${activeTab === 'html'
                            ? (darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900')
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        HTML
                    </button>
                    <button
                        onClick={() => setActiveTab('css')}
                        className={`px-3 py-1.5 rounded-md text-sm ${activeTab === 'css'
                            ? (darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900')
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        CSS
                    </button>
                    <button
                        onClick={() => setActiveTab('js')}
                        className={`px-3 py-1.5 rounded-md text-sm ${activeTab === 'js'
                            ? (darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900')
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        JavaScript
                    </button>
                </div>

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
            </header>

            <div className="flex-1 flex min-h-0" ref={splitVerticalRef}>
                <div className="editors-container min-h-0" ref={splitHorizontalRef}>
                    <div className="html-editor editor-container">
                        <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                            <h2 className="text-sm font-medium">HTML</h2>
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

                    <div className="css-editor editor-container">
                        <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                            <h2 className="text-sm font-medium">CSS</h2>
                        </div>
                        <div className="editor-content">
                            <Editor
                                language="css"
                                value={css}
                                onChange={setCss}
                                theme={darkMode ? 'vs-dark' : 'vs'}
                            />
                        </div>
                    </div>

                    <div className="js-editor editor-container">
                        <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                            <h2 className="text-sm font-medium">JavaScript</h2>
                        </div>                        <div className="editor-content">
                            {showJsxNotification && activeTab === 'js' && (
                                <div className={`absolute top-0 left-0 right-0 z-10 p-2 text-sm ${darkMode ? 'bg-blue-900/80 text-blue-100' : 'bg-blue-100 text-blue-800'} border-b ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium">JSX Support:</span> Basic JSX syntax is now supported! Add React libraries from Package Manager for full React support.
                                        </div>                                        <button
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
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <Preview html={html} css={css} js={js} packages={packages} />
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
