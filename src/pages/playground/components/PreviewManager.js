import { showToast } from '@/components/toast.js';

export class PreviewManager {
    constructor(consoleManager) {
        this.frame = document.getElementById('preview-frame');
        this.consoleManager = consoleManager;
        this.setupMessageListener();
    }

    setupMessageListener() {
        window.addEventListener('message', (event) => {
            if (event.data.type === 'console') {
                const message = event.data.args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ');
                this.consoleManager.log(message, event.data.method);
            }
        });
    }

    update(state) {
        this.consoleManager.clear();
        let bodyContent = this.extractBodyContent(state.html);
        const preview = this.generatePreviewHTML(bodyContent, state);
        this.frame.srcdoc = preview;
    }

    extractBodyContent(html) {
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
            return bodyMatch[1];
        } else if (html.includes('<!DOCTYPE html>')) {
            return html
                .replace(/<\!DOCTYPE[^>]*>/i, '')
                .replace(/<html[^>]*>/i, '')
                .replace(/<\/html>/i, '')
                .replace(/<head[^>]*>[\s\S]*<\/head>/i, '')
                .replace(/<body[^>]*>/i, '')
                .replace(/<\/body>/i, '');
        }
        return html;
    }

    generatePreviewHTML(bodyContent, state) {
        const consoleScript = this.getConsoleScript();
        const libraryLinks = this.getLibraryLinks(state.libraries);

        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    ${libraryLinks.css}
                    <style>${state.css}</style>
                    ${consoleScript}
                    ${libraryLinks.jsHead}
                </head>
                <body>
                    ${bodyContent}
                    ${libraryLinks.jsBody}
                    <script>${state.js}</script>
                </body>
            </html>
        `;
    }

    getLibraryLinks(libraries) {
        // Generate HTML for library links
        const links = {
            css: '',
            jsHead: '',
            jsBody: ''
        };

        if (!libraries || libraries.length === 0) {
            return links;
        }

        // Add each library's links
        libraries.forEach(library => {
            if (!library.links) return;

            library.links.forEach(link => {
                if (link.type === 'css') {
                    links.css += `<link rel="stylesheet" href="${link.url}">\n`;
                } else if (link.type === 'js') {
                    const attrs = link.defer ? ' defer' : '';
                    const scriptTag = `<script src="${link.url}"${attrs}></script>\n`;

                    // Add to head or body depending on library type
                    if (library.type === 'css' || link.defer) {
                        links.jsHead += scriptTag;
                    } else {
                        links.jsBody += scriptTag;
                    }
                }
            });
        });

        return links;
    }

    getConsoleScript() {
        return `
            <script>
            (function() {
                const originalConsole = window.console;
                window.console = {
                    log: (...args) => {
                        originalConsole.log(...args);
                        window.parent.postMessage({ type: 'console', method: 'log', args }, '*');
                    },
                    error: (...args) => {
                        originalConsole.error(...args);
                        window.parent.postMessage({ type: 'console', method: 'error', args }, '*');
                    },
                    warn: (...args) => {
                        originalConsole.warn(...args);
                        window.parent.postMessage({ type: 'console', method: 'warn', args }, '*');
                    }
                };
                window.onerror = function(message, source, lineno, colno, error) {
                    window.parent.postMessage({ 
                        type: 'console', 
                        method: 'error', 
                        args: [message + ' (line: ' + lineno + ')']
                    }, '*');
                    return false;
                };
            })();
            </script>
        `;
    }
}
