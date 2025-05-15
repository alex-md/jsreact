// filepath: /Users/alex/Documents/GitHub/jsreact/src/pages/playground/components/Preview.jsx
import React from 'react';
import { css } from '@emotion/react';
import { Smartphone, Tablet, Monitor, RefreshCw, XCircle, Terminal } from 'lucide-react';

const DevicePreview = {
    DESKTOP: { width: '100%', height: '100%' },
    TABLET: { width: '768px', height: '1024px' },
    MOBILE: { width: '375px', height: '667px' }
};

// Helper to generate script tags for JS packages
const generatePackageScripts = (packages) =>
    packages
        .filter((pkg) => pkg.endsWith('.js'))
        .map((pkg) => `<script src="${pkg}"></script>`)
        .join('\n');

// Helper to generate link tags for CSS packages
const generatePackageStyles = (packages) =>
    packages
        .filter((pkg) => pkg.endsWith('.css'))
        .map((pkg) => `<link rel="stylesheet" href="${pkg}" />`)
        .join('\n');

// Helper for the main script to be injected into the iframe
const getIframeClientScript = (userJS) => `
// Create a custom console to capture logs
const originalConsole = console;
const consoleProxy = {};
['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
  consoleProxy[method] = function(...args) {
    window.parent.postMessage({ 
      type: 'console', 
      method: method, 
      args: args.map(arg => 
        typeof arg === 'object' && arg !== null 
          ? JSON.parse(JSON.stringify(arg, (key, value) => 
              typeof value === 'function' ? '[Function]' : value
            )) 
          : arg
      ) 
    }, '*');
    originalConsole[method](...args);
  };
});
console = consoleProxy;

// Run the user script
try {
  (function() { ${userJS} })();
} catch (e) {
  window.parent.postMessage({ type: 'error', message: e.toString(), lineno: e.lineNumber }, '*');
  if (originalConsole && originalConsole.error) { 
    originalConsole.error('User script execution error:', e);
  }
}

// Signal that execution is complete
window.parent.postMessage({ type: 'ready' }, '*');
`;

// Helper function for dynamic button classes
const getButtonClasses = (isActive, isDarkMode) => {
    const baseClasses = 'p-1.5 rounded-md transition-colors';
    if (isActive) {
        return `${baseClasses} ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'}`;
    }
    return `${baseClasses} text-gray-500 hover:text-gray-700 dark:hover:text-gray-300`;
};

const Preview = ({ html, cssCode = '', js, packages = [], darkMode }) => {
    const iframeRef = React.useRef(null);
    const [device, setDevice] = React.useState('DESKTOP');
    const [error, setError] = React.useState(null);
    const [consoleMessages, setConsoleMessages] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [showConsole, setShowConsole] = React.useState(false);

    const trimmedCss = React.useMemo(() => cssCode.trim(), [cssCode]);

    React.useEffect(() => {
        setError(null);
    }, [html, js, trimmedCss, packages]);

    React.useEffect(() => {
        const handleMessage = (event) => {
            if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
            const { type, method, args, message, lineno } = event.data;

            if (type === 'console') {
                setConsoleMessages((prev) => [
                    ...prev, {
                        type: method,
                        content: args.map((arg) => typeof arg === 'object' && arg !== null ? JSON.stringify(arg, null, 2) : String(arg)).join(' '),
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    }
                ]);
            } else if (type === 'error') {
                setError(`${message || 'Unknown error'}${lineno ? ` (line ${lineno})` : ''}`);
            } else if (type === 'ready') {
                setIsLoading(false);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []); // No dependencies needed as setState functions are stable

    React.useEffect(() => {
        const debounced = setTimeout(() => {
            if (!iframeRef.current) return;
            setError(null);
            setIsLoading(true);
            try {
                const packageScripts = generatePackageScripts(packages);
                const packageStyles = generatePackageStyles(packages);

                const fullHtml = `
                  <!DOCTYPE html>
                  <html class="${darkMode ? 'dark' : ''}">
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      ${packageStyles}
                      <style>
                        :root { color-scheme: ${darkMode ? 'dark' : 'light'}; }
                        body { margin: 0; min-height: 100vh; font-family: sans-serif; }
                        .dark body { background: #1a1a1a; color: #fff; }
                        ${trimmedCss}
                      </style>
                    </head>
                    <body>
                      ${html || ''}
                      ${packageScripts}
                      <script>
                        ${getIframeClientScript(js)}
                      </script>
                    </body>
                  </html>`;
                iframeRef.current.srcdoc = fullHtml;
            } catch (e) {
                setError(e.message);
                console.error('Preview update error:', e);
                setIsLoading(false);
            }
        }, 300);
        return () => clearTimeout(debounced);
        // Use cssCode instead of trimmedCss as it's the source prop.
        // trimmedCss is derived from cssCode and will be captured in the closure.
    }, [html, cssCode, js, packages, darkMode]);
    const handleIframeLoad = React.useCallback(() => setIsLoading(false), [setIsLoading]);

    const deviceStyle = React.useMemo(() => ({
        ...DevicePreview[device],
        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
        borderRadius: '8px', margin: 'auto',
        transition: 'width 0.3s ease, height 0.3s ease',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
    }), [device, darkMode]);

    const refreshPreview = React.useCallback(() => {
        if (iframeRef.current?.contentWindow) {
            setIsLoading(true);
            iframeRef.current.contentWindow.location.reload();
        }
    }, [setIsLoading]);

    const deviceOptions = ['DESKTOP', 'TABLET', 'MOBILE'];
    const iconMap = { DESKTOP: Monitor, TABLET: Tablet, MOBILE: Smartphone };

    return (
        <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center space-x-1 sm:space-x-2">
                    {deviceOptions.map((dev) => (
                        <button
                            key={dev}
                            onClick={() => setDevice(dev)}
                            className={getButtonClasses(device === dev, darkMode)}
                            title={`${dev.charAt(0) + dev.slice(1).toLowerCase()} view`}
                        >
                            {React.createElement(iconMap[dev], { size: 16 })}
                        </button>
                    ))}
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                    <button
                        onClick={() => setShowConsole(s => !s)}
                        className={getButtonClasses(showConsole, darkMode)}
                        title="Toggle console"
                    >
                        <Terminal size={16} />
                    </button>
                    <button
                        onClick={refreshPreview}
                        disabled={isLoading}
                        className={`p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ${isLoading ? 'animate-spin' : ''}`}
                        title="Refresh preview"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-4 relative bg-gray-100 dark:bg-gray-800">
                <div className="h-full flex items-center justify-center transition-colors">
                    <div
                        style={deviceStyle}
                        className={`relative overflow-hidden ${darkMode ? 'bg-gray-950' : 'bg-white'}`}
                    >
                        {isLoading && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-opacity-50 bg-gray-500 dark:bg-opacity-50 dark:bg-gray-700">
                                <RefreshCw size={24} className="animate-spin text-white" />
                            </div>
                        )}
                        {error && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center bg-opacity-80 dark:bg-opacity-80 bg-white dark:bg-gray-900">
                                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 flex items-center space-x-2 text-red-600 dark:text-red-400 max-w-md">
                                    <XCircle size={20} className="flex-shrink-0" />
                                    <span className="text-sm whitespace-pre-wrap break-all">{error}</span>
                                </div>
                            </div>
                        )}
                        <iframe
                            ref={iframeRef}
                            title="Preview Content"
                            sandbox="allow-scripts allow-same-origin"
                            className="w-full h-full block"
                            onLoad={handleIframeLoad}
                        />
                    </div>
                </div>
            </div>
            {showConsole && (
                <div className={`h-48 overflow-y-auto border-t text-xs font-mono ${darkMode ? 'bg-gray-950 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    {consoleMessages.length === 0 ? (
                        <div className={`p-3 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Console is empty.
                        </div>
                    ) : (
                        <>
                            <div className="p-2 space-y-1">
                                {consoleMessages.map((msg, i) => (
                                    <div
                                        key={`${msg.type}-${i}-${msg.timestamp}`}
                                        className={`p-1.5 rounded-sm flex items-start ${msg.type === 'error' ? 'text-red-500 dark:text-red-400 bg-red-500/10' : msg.type === 'warn' ? 'text-yellow-500 dark:text-yellow-400 bg-yellow-500/10' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                    >
                                        <span className="opacity-60 mr-2 select-none">{msg.timestamp}</span>
                                        <span className="flex-1 whitespace-pre-wrap break-all">{msg.content}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setConsoleMessages([])}
                                title="Clear console"
                                className={`sticky bottom-2 right-2 p-1 text-xs rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'} m-1 float-right`}
                            >
                                Clear
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Preview;
