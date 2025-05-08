import React, { useEffect, useRef, useState } from 'react';
import { Smartphone, Tablet, Monitor, RefreshCw, XCircle, Terminal } from 'lucide-react';
import { getJsxRuntimeCode } from './jsxRuntime.js';

const DevicePreview = {
    DESKTOP: { width: '100%', height: '100%' },
    TABLET: { width: '768px', height: '1024px' },
    MOBILE: { width: '375px', height: '667px' }
};

const Preview = ({ html, css = '', js, packages, darkMode }) => {
    const iframeRef = useRef(null);
    const [device, setDevice] = useState('DESKTOP');
    const [error, setError] = useState(null);
    const [consoleMessages, setConsoleMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showConsole, setShowConsole] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);

    useEffect(() => {
        setError(null);
    }, [html, js, packages]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;

            if (event.data?.type === 'console') {
                setConsoleMessages((prev) => [
                    ...prev,
                    {
                        type: event.data.method,
                        content: event.data.args
                            .map((arg) =>
                                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                            )
                            .join(' '),
                        timestamp: new Date().toLocaleTimeString()
                    }
                ]);
            } else if (event.data?.type === 'error') {
                const msg = event.data.message || 'Unknown error';
                const loc = event.data.lineno ? ` (line ${event.data.lineno})` : '';
                setError(msg + loc);
            } else if (event.data?.type === 'ready') {
                setIframeLoaded(true);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        const debounced = setTimeout(() => {
            if (!iframeRef.current) return;
            setIsLoading(true);
            setError(null);

            try {
                const jsxRuntimeCode = getJsxRuntimeCode();
                const fullHtml = `
          <!DOCTYPE html>
          <html class="${darkMode ? 'dark' : ''}">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              ${packages
                        .filter((p) => p.endsWith('.css'))
                        .map((p) => `<link rel="stylesheet" href="${p}" />`)
                        .join('\n')}
              <style>
                :root { color-scheme: ${darkMode ? 'dark' : 'light'}; }
                body { margin: 0; min-height: 100vh; }
                .dark body { background: #1a1a1a; color: #fff; }
                .jsx-error { padding:8px; margin:8px 0; color:#ff4444; background:rgba(255,0,0,0.1); border:1px solid rgba(255,0,0,0.2); border-radius:4px; }
                .jsx-component { padding:8px; margin:8px 0; border:1px solid #ccc; border-radius:4px; }
                ${typeof css === 'string' ? css : '/* CSS not available */'}
              </style>
            </head>
            <body>
              ${html || ''}
              ${packages
                        .filter((p) => p.endsWith('.js'))
                        .map((p) => `<script src="${p}"></script>`)
                        .join('\n')}
              <script>
                window.parent.postMessage({ type: 'ready' }, '*');
                window.onerror = function(msg, url, line, col, err) {
                  window.parent.postMessage({ type:'error', message: msg, lineno: line }, '*');
                  return true;
                };
                window.onunhandledrejection = function(e) {
                  window.parent.postMessage({ type:'error', message: e.reason?.toString() || 'Unhandled Promise Rejection' }, '*');
                };
                (function() {
                  ['log','error','warn','info'].forEach(method => {
                    const orig = console[method];
                    console[method] = function(...args) {
                      window.parent.postMessage({ type:'console', method, args: args.map(a =>
                        a instanceof Error ? a.toString() :
                        typeof a === 'object' ? JSON.stringify(a) :
                        String(a)
                      )}, '*');
                      orig.apply(console, args);
                    };
                  });
                })();
                ${jsxRuntimeCode}
                try { (function(){ ${js} })(); } catch(e) {
                  console.error(e);
                  window.parent.postMessage({ type:'error', message: e.toString() }, '*');
                }
              </script>
            </body>
          </html>
        `;
                iframeRef.current.srcdoc = fullHtml;
            } catch (e) {
                setError(e.message);
                console.error('Preview update error:', e);
            }
        }, 300);

        return () => clearTimeout(debounced);
    }, [html, js, packages, darkMode]);

    const handleIframeLoad = () => setIsLoading(false);

    const deviceStyle = {
        ...DevicePreview[device],
        border: `1px solid ${darkMode ? '#2d2d2d' : '#e5e7eb'}`,
        borderRadius: '8px',
        margin: 'auto',
        transition: 'all 0.3s ease'
    };

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div
                className={`flex items-center justify-between p-2 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'
                    }`}
            >
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setDevice('DESKTOP')}
                        className={`p-1.5 rounded-md transition-colors ${device === 'DESKTOP'
                            ? darkMode
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-200 text-gray-800'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        title="Desktop view"
                    >
                        <Monitor size={16} />
                    </button>
                    <button
                        onClick={() => setDevice('TABLET')}
                        className={`p-1.5 rounded-md transition-colors ${device === 'TABLET'
                            ? darkMode
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-200 text-gray-800'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        title="Tablet view"
                    >
                        <Tablet size={16} />
                    </button>
                    <button
                        onClick={() => setDevice('MOBILE')}
                        className={`p-1.5 rounded-md transition-colors ${device === 'MOBILE'
                            ? darkMode
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-200 text-gray-800'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        title="Mobile view"
                    >
                        <Smartphone size={16} />
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowConsole((s) => !s)}
                        className={`p-1.5 rounded-md transition-colors ${showConsole
                            ? darkMode
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-200 text-gray-800'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
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
                        className={`p-1.5 rounded-md ${isLoading ? 'animate-spin' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        title="Refresh preview"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Preview area */}
            <div className="flex-1 overflow-auto relative">
                <div
                    className={`h-full flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'
                        } transition-colors`}
                >
                    <div style={deviceStyle} className="relative bg-white dark:bg-gray-800 overflow-hidden shadow-xl">
                        {error && (
                            <div
                                className={`absolute inset-0 z-10 flex items-center justify-center ${darkMode ? 'bg-gray-900/90' : 'bg-white/90'
                                    }`}
                            >
                                <div className="p-4 rounded-lg flex items-center space-x-2 text-red-500">
                                    <XCircle size={20} />
                                    <span className="text-sm whitespace-pre-wrap">{error}</span>
                                </div>
                            </div>
                        )}                        <iframe
                            ref={iframeRef}
                            title="Preview"
                            sandbox="allow-scripts"
                            className="w-full h-full"
                            onLoad={handleIframeLoad}
                        />
                    </div>
                </div>
            </div>

            {/* Console */}
            {showConsole && (
                <div
                    className={`h-48 overflow-y-auto border-t ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'
                        }`}
                >
                    <div className="p-2 space-y-1 font-mono text-xs">
                        {consoleMessages.map((msg, i) => (
                            <div
                                key={i}
                                className={`p-1 rounded ${msg.type === 'error'
                                    ? 'text-red-500 bg-red-500/10'
                                    : msg.type === 'warn'
                                        ? 'text-yellow-500 bg-yellow-500/10'
                                        : darkMode
                                            ? 'text-gray-300'
                                            : 'text-gray-700'
                                    }`}
                            >
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
