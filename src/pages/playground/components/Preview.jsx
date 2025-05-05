import React, { useEffect, useRef, useState } from 'react';
import { Smartphone, Tablet, Monitor, RefreshCw, XCircle, Terminal } from 'lucide-react';

const DevicePreview = {
    DESKTOP: { width: '100%', height: '100%' },
    TABLET: { width: '768px', height: '1024px' },
    MOBILE: { width: '375px', height: '667px' }
};

const Preview = ({ html, css, js, packages, darkMode }) => {
    const iframeRef = useRef(null);
    const [device, setDevice] = useState('DESKTOP');
    const [error, setError] = useState(null);
    const [consoleMessages, setConsoleMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showConsole, setShowConsole] = useState(false);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data.type === 'console') {
                setConsoleMessages(prev => [...prev, {
                    type: event.data.method,
                    content: event.data.args.map(arg =>
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' '),
                    timestamp: new Date().toLocaleTimeString()
                }]);
            } else if (event.data.type === 'error') {
                setError(`${event.data.message} (${event.data.lineno}:${event.data.colno})`);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        const updatePreview = () => {
            if (!iframeRef.current) return;

            setIsLoading(true);
            setError(null);

            try {
                const fullHtml = `
                    <!DOCTYPE html>
                    <html class="${darkMode ? 'dark' : ''}">
                        <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1">
                            <base target="_blank">
                            ${packages
                        .filter(pkg => pkg.endsWith('.css'))
                        .map(pkg => `<link rel="stylesheet" href="${pkg}" />`)
                        .join('\n')
                    }
                            <style>
                                :root { color-scheme: ${darkMode ? 'dark' : 'light'}; }
                                body { margin: 0; min-height: 100vh; }
                                .dark body { background: #1a1a1a; color: #fff; }
                                ${css}
                            </style>
                        </head>
                        <body>
                            ${html}
                            ${packages
                        .filter(pkg => pkg.endsWith('.js'))
                        .map(pkg => `<script src="${pkg}"></script>`)
                        .join('\n')
                    }
                            <script>
                                // Set up console message forwarding
                                (function() {
                                    const consoleMethods = ['log', 'error', 'warn', 'info'];
                                    consoleMethods.forEach(method => {
                                        const original = console[method];
                                        console[method] = (...args) => {
                                            window.parent.postMessage({
                                                type: 'console',
                                                method,
                                                args
                                            }, '*');
                                            original.apply(console, args);
                                        };
                                    });

                                    window.onerror = (message, source, lineno, colno, error) => {
                                        window.parent.postMessage({
                                            type: 'error',
                                            message,
                                            source,
                                            lineno,
                                            colno
                                        }, '*');
                                        return true;
                                    };
                                })();

                                try {
                                    ${js}
                                } catch (error) {
                                    console.error(error);
                                }
                            </script>
                        </body>
                    </html>
                `;

                // Use srcDoc instead of document.write
                iframeRef.current.srcdoc = fullHtml;
            } catch (err) {
                setError(err.message);
                console.error('Preview update error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce the preview update
        const debounceTimeout = setTimeout(updatePreview, 300);
        return () => clearTimeout(debounceTimeout);
    }, [html, css, js, packages, darkMode]);

    const deviceStyle = {
        ...DevicePreview[device],
        border: `1px solid ${darkMode ? '#2d2d2d' : '#e5e7eb'}`,
        borderRadius: '8px',
        margin: 'auto',
        transition: 'all 0.3s ease'
    };

    return (
        <div className="h-full flex flex-col">
            <div className={`flex items-center justify-between p-2 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setDevice('DESKTOP')}
                        className={`p-1.5 rounded-md transition-colors ${device === 'DESKTOP'
                            ? (darkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800')
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        title="Desktop view"
                    >
                        <Monitor size={16} />
                    </button>
                    <button
                        onClick={() => setDevice('TABLET')}
                        className={`p-1.5 rounded-md transition-colors ${device === 'TABLET'
                            ? (darkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800')
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        title="Tablet view"
                    >
                        <Tablet size={16} />
                    </button>
                    <button
                        onClick={() => setDevice('MOBILE')}
                        className={`p-1.5 rounded-md transition-colors ${device === 'MOBILE'
                            ? (darkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800')
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        title="Mobile view"
                    >
                        <Smartphone size={16} />
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowConsole(!showConsole)}
                        className={`p-1.5 rounded-md transition-colors ${showConsole
                            ? (darkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800')
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        title="Toggle console"
                    >
                        <Terminal size={16} />
                    </button>
                    <button
                        onClick={() => {
                            if (iframeRef.current) {
                                const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
                                doc.location.reload();
                            }
                        }}
                        className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        title="Refresh preview"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto relative">
                <div className={`h-full flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors`}>
                    <div style={deviceStyle} className="relative bg-white dark:bg-gray-800 overflow-hidden shadow-xl">
                        {error && (
                            <div className={`absolute inset-0 flex items-center justify-center ${darkMode ? 'bg-gray-900/90' : 'bg-white/90'}`}>
                                <div className="p-4 rounded-lg flex items-center space-x-2 text-red-500">
                                    <XCircle size={20} />
                                    <span className="text-sm">{error}</span>
                                </div>
                            </div>
                        )}
                        <iframe
                            ref={iframeRef}
                            title="Preview"
                            sandbox="allow-scripts allow-modals allow-same-origin"
                            className="w-full h-full"
                            onLoad={() => setIsLoading(false)}
                        />
                    </div>
                </div>
            </div>

            {showConsole && (
                <div className={`h-48 overflow-y-auto border-t ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="p-2 space-y-1 font-mono text-xs">
                        {consoleMessages.map((msg, i) => (
                            <div key={i} className={`p-1 rounded ${msg.type === 'error' ? 'text-red-500 bg-red-500/10' :
                                msg.type === 'warn' ? 'text-yellow-500 bg-yellow-500/10' :
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                <span className="opacity-50">{msg.timestamp}</span> {msg.content}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Preview;
