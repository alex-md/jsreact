import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Smartphone,
    Tablet,
    Monitor,
    RefreshCw,
    XCircle,
    Terminal
} from 'lucide-react';

/**
 * Fixed / improved preview component for a playground‑style editor.
 * Main fixes:
 * – Safe defaults for props (html, css, js, packages, darkMode).
 * – Debounced preview update moved to a `useCallback` to avoid stale refs.
 * – Proper iframe reload that reapplies `srcDoc` instead of cross‑origin reload.
 * – Clean‑up of console listener on unmount *and* before re‑registering.
 * – Reset of loading/error state on refresh.
 * – Minor a11y tweaks (aria‑labels) & key usage for console list.
 */

const DEVICE_PREVIEW = {
    DESKTOP: { width: '100%', height: '100%' },
    TABLET: { width: '768px', height: '1024px' },
    MOBILE: { width: '375px', height: '667px' }
};

const Preview = ({
    html = '',
    css = '',
    js = '',
    packages = [], // array of absolute URLs
    darkMode = false
}) => {
    const iframeRef = useRef(null);

    const [device, setDevice] = useState('DESKTOP');
    const [error, setError] = useState(null);
    const [consoleMessages, setConsoleMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showConsole, setShowConsole] = useState(false);

    /* ----------------------------- helpers ----------------------------- */
    const postConsoleMessage = useCallback(event => {
        if (!event.data) return;
        if (event.data.type === 'console') {
            setConsoleMessages(prev => [
                ...prev,
                {
                    type: event.data.method,
                    content: event.data.args
                        .map(arg =>
                            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                        )
                        .join(' '),
                    timestamp: new Date().toLocaleTimeString()
                }
            ]);
        }
        if (event.data.type === 'error') {
            setError(`${event.data.message} (${event.data.lineno}:${event.data.colno})`);
        }
    }, []);

    /* --------------------------- preview update ------------------------- */
    const buildSrcDoc = useCallback(() => {
        // Split CSS / JS packages
        const cssLinks = packages
            .filter(pkg => pkg.trim().endsWith('.css'))
            .map(pkg => `<link rel="stylesheet" href="${pkg}" />`)
            .join('\n        ');

        const jsScripts = packages
            .filter(pkg => pkg.trim().endsWith('.js'))
            .map(pkg => `<script src="${pkg}"></script>`)
            .join('\n        ');

        return `<!DOCTYPE html>
<html class="${darkMode ? 'dark' : ''}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <base target="_blank" />
    ${cssLinks}
    <style>
      :root { color-scheme: ${darkMode ? 'dark' : 'light'}; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .dark body { background:#1a1a1a; color:#fff; }
    </style>
  </head>
  <body>
    ${html}
    ${jsScripts}
    ${css ? `<style>${css}</style>` : ''}
    <script>
      (function() {
        const consoleMethods = ['log','error','warn','info'];
        consoleMethods.forEach(m => {
          const orig = console[m];
          console[m] = (...args) => {
            window.parent.postMessage({ type:'console', method:m, args }, '*');
            orig.apply(console, args);
          };
        });
        window.onerror = (message, source, lineno, colno) => {
          window.parent.postMessage({ type:'error', message, lineno, colno }, '*');
          return true;
        };
      })();
      try { ${js} } catch(e){ console.error(e); }
    </script>
  </body>
</html>`;
    }, [css, darkMode, html, js, packages]);

    const updatePreview = useCallback(() => {
        if (!iframeRef.current) return;
        setIsLoading(true);
        setError(null);
        // Reapply srcDoc (avoids cross‑origin reload issues)
        iframeRef.current.srcdoc = buildSrcDoc();
    }, [buildSrcDoc]);

    /* --------------------------- effect hooks -------------------------- */
    // Register console/error forwarder
    useEffect(() => {
        window.addEventListener('message', postConsoleMessage);
        return () => window.removeEventListener('message', postConsoleMessage);
    }, [postConsoleMessage]);

    // Debounced preview refresh when inputs change
    useEffect(() => {
        const id = setTimeout(updatePreview, 250);
        return () => clearTimeout(id);
    }, [updatePreview]);

    /* ------------------------------- ui -------------------------------- */
    const deviceStyle = {
        ...DEVICE_PREVIEW[device],
        border: `1px solid ${darkMode ? '#2d2d2d' : '#e5e7eb'}`,
        borderRadius: '8px',
        margin: 'auto',
        transition: 'all .3s ease'
    };

    return (
        <div className="h-full flex flex-col">
            {/* toolbar */}
            <div
                className={`flex items-center justify-between p-2 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}
            >
                {/* device buttons */}
                <div className="flex items-center space-x-2">
                    {([
                        ['DESKTOP', Monitor],
                        ['TABLET', Tablet],
                        ['MOBILE', Smartphone]
                    ]).map(([key, Icon]) => (
                        <button
                            key={key}
                            aria-label={`${key.toLowerCase()} view`}
                            onClick={() => setDevice(key)}
                            className={`p-1.5 rounded-md transition-colors ${device === key
                                    ? darkMode
                                        ? 'bg-gray-800 text-white'
                                        : 'bg-gray-200 text-gray-800'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Icon size={16} />
                        </button>
                    ))}
                </div>
                {/* action buttons */}
                <div className="flex items-center space-x-2">
                    <button
                        aria-label="Toggle console"
                        onClick={() => setShowConsole(prev => !prev)}
                        className={`p-1.5 rounded-md transition-colors ${showConsole
                                ? darkMode
                                    ? 'bg-gray-800 text-white'
                                    : 'bg-gray-200 text-gray-800'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Terminal size={16} />
                    </button>
                    <button
                        aria-label="Refresh preview"
                        onClick={() => {
                            setConsoleMessages([]);
                            updatePreview();
                        }}
                        className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* preview */}
            <div className="flex-1 overflow-auto relative">
                <div
                    className={`h-full flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'
                        } transition-colors`}
                >
                    <div
                        style={deviceStyle}
                        className="relative bg-white dark:bg-gray-800 overflow-hidden shadow-xl"
                    >
                        {error && (
                            <div
                                className={`absolute inset-0 flex items-center justify-center ${darkMode ? 'bg-gray-900/90' : 'bg-white/90'
                                    }`}
                            >
                                <div className="p-4 rounded-lg flex items-center space-x-2 text-red-500">
                                    <XCircle size={20} />
                                    <span className="text-sm select-text break-all">{error}</span>
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

            {/* console */}
            {showConsole && (
                <div
                    className={`h-48 overflow-y-auto border-t ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'
                        }`}
                >
                    <div className="p-2 space-y-1 font-mono text-xs">
                        {consoleMessages.map((msg, idx) => (
                            <div
                                key={`${msg.timestamp}-${idx}`}
                                className={`p-1 rounded ${msg.type === 'error'
                                        ? 'text-red-500 bg-red-500/10'
                                        : msg.type === 'warn'
                                            ? 'text-yellow-500 bg-yellow-500/10'
                                            : darkMode
                                                ? 'text-gray-300'
                                                : 'text-gray-700'
                                    }`}
                            >
                                <span className="opacity-50 mr-1">{msg.timestamp}</span>
                                {msg.content}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Preview;
