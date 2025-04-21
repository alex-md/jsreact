// playground.js  (ES Module - use with type="module")
import { showToast } from '../../components/toast.js';

class PreviewManager {
    constructor() {
        this.previewFrame = document.getElementById('preview-frame');
    }

    update(state) {
        const libraryLinks = this.getLibraryLinksHtml(state.libraries);
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                ${libraryLinks.css}
                <style>${state.css}</style>
                ${libraryLinks.jsHead}
            </head>
            <body>
                ${state.html}
                ${libraryLinks.jsBody}
                <script>
                    ${this.wrapConsoleLog()}
                    ${state.js}
                </script>
            </body>
            </html>
        `;
        this.previewFrame.srcdoc = html;
    }
    getLibraryLinksHtml(libraries) {
        const links = {
            css: '',
            jsHead: '',
            jsBody: ''
        };

        if (!libraries) {
            return links;
        }

        libraries.forEach(library => {
            if (!library.links) return;

            library.links.forEach(link => {
                if (link.type === 'css') {
                    links.css += `<link rel="stylesheet" href="${link.url}">\n`;
                } else if (link.type === 'js') {
                    const attrs = link.defer ? ' defer' : '';
                    const scriptTag = `<script src="${link.url}"${attrs}></script>\n`;

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

    wrapConsoleLog() {
        return `
            const consoleOutput = document.getElementById('console-content');
            function logToConsole(message, type = 'log') {
                const line = document.createElement('div');
                line.classList.add('console-line', type);
                line.textContent = message;
                consoleOutput.appendChild(line);
                consoleOutput.scrollTop = consoleOutput.scrollHeight;
                console[type](message);
            }

            const originalConsoleLog = console.log;
            const originalConsoleWarn = console.warn;
            const originalConsoleError = console.error;
            const originalConsoleInfo = console.info;

            console.log = function() {
                logToConsole(Array.from(arguments).join(' '), 'log');
            };
            console.warn = function() {
                logToConsole(Array.from(arguments).join(' '), 'warn');
            };
            console.error = function() {
                logToConsole(Array.from(arguments).join(' '), 'error');
            };
            console.info = function() {
                logToConsole(Array.from(arguments).join(' '), 'info');
            };

            window.onerror = function(message, source, lineno, colno, error) {
                logToConsole(\`\${message} at \${source}:\${lineno}:\${colno}\`, 'error');
            };
        `;
    }
}

class LibraryManager {
    constructor(state) {
        this.state = state;
        this.setupLibraryMenu();
        this.setupCustomCdnInput();

        // Load libraries from state, if any.
        if (this.state.libraries && this.state.libraries.length) {
            this.state.libraries.forEach(lib => this.addLibrary(lib, false)); // Don't show toast on initial load
        }
    }
    setupLibraryMenu() {
        const libraryButton = document.getElementById('library-button');
        const libraryMenu = document.getElementById('library-menu');
        libraryButton.addEventListener('click', () => {
            libraryMenu.classList.toggle('visible');
        });
        //close menu if clicked outside
        document.addEventListener('click', (event) => {
            if (!libraryButton.contains(event.target) && !libraryMenu.contains(event.target)) {
                libraryMenu.classList.remove('visible');
            }
        });

        const libraryItems = document.querySelectorAll('.library-item');
        libraryItems.forEach(item => {
            item.addEventListener('click', () => {
                const libraryKey = item.dataset.library;
                const library = this.getLibraryData(libraryKey);
                if (library) {
                    this.addLibrary(library);
                }
                libraryMenu.classList.remove('visible'); //hide menu on selection
            });
        });
    }

    setupCustomCdnInput() {
        const addCdnButton = document.getElementById('add-cdn-library');
        addCdnButton.addEventListener('click', () => {
            const cdnUrl = document.getElementById('cdn-url-input').value.trim();
            const cdnType = document.getElementById('cdn-type').value;

            if (!cdnUrl) {
                showToast('Please enter a CDN URL.', 'error');
                return;
            }

            // Basic URL validation
            try {
                new URL(cdnUrl);
            } catch (_) {
                showToast('Invalid URL. Please enter a valid URL.', 'error');
                return;
            }

            // Check for duplicates, but this time, just check the new URL against existing
            if (this.state.libraries.some(lib => lib.links && lib.links.some(link => link.url === cdnUrl))) {
                showToast('This library is already added.', 'error');
                return;
            }

            const library = {
                name: cdnUrl.split('/').pop(), // Extract filename as name
                type: cdnType,
                links: [{ url: cdnUrl, type: cdnType, defer: false }], //custom cannot be deferred

            };
            this.addLibrary(library);
            document.getElementById('cdn-url-input').value = ''; //clear input

        });
    }

    addLibrary(library, showSuccessToast = true) {
        // Check if the library is already added.  This now checks the *links*,
        // as the library name might not be unique (especially for custom URLs).
        const isAlreadyAdded = this.state.libraries.some(lib =>
            lib.links && library.links &&
            lib.links.some(libLink => library.links.some(newLink => newLink.url === libLink.url))
        );

        if (isAlreadyAdded) {
            showToast('This library is already added.', 'error');
            return;
        }

        this.state.libraries.push(library); //add to state
        if (showSuccessToast) {
            showToast(`${library.name} added successfully!`);
        }
        this.previewManager.update(this.state); //update preview

    }


    getLibraryData(key) {
        const libraries = {
            bootstrap: {
                name: 'Bootstrap',
                type: 'css',
                links: [
                    { type: 'css', url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css' },
                    { type: 'js', url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js', defer: true }
                ]
            },
            tailwind: {
                name: 'Tailwind CSS',
                type: 'css',
                links: [{ type: 'css', url: 'https://cdn.jsdelivr.net/npm/tailwindcss@3.3.5/dist/tailwind.min.css' }]
            },
            bulma: {
                name: 'Bulma',
                type: 'css',
                links: [{ type: 'css', url: 'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css' }]
            },
            daisyui: {
                name: 'DaisyUI',
                type: 'css',
                links: [{ type: 'css', url: 'https://cdn.jsdelivr.net/npm/daisyui@4.4.2/dist/full.min.css' }]
            },
            materialui: {
                name: 'Material UI',
                type: 'css',
                links: [
                    { type: 'css', url: 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap' },
                    { type: 'css', url: 'https://cdn.jsdelivr.net/npm/@mui/material@5.15.7/umd/material-ui.production.min.css' },
                    { type: 'js', url: 'https://cdn.jsdelivr.net/npm/@mui/material@5.15.7/umd/material-ui.production.min.js', defer: true }
                ]
            },
            jquery: {
                name: 'jQuery',
                type: 'js',
                links: [{ type: 'js', url: 'https://code.jquery.com/jquery-3.7.1.min.js' }]
            },
            alpine: {
                name: 'Alpine.js',
                type: 'js',
                links: [{ type: 'js', url: 'https://cdn.jsdelivr.net/npm/alpinejs@3.13.0/dist/cdn.min.js', defer: true }]
            },
            react: {
                name: 'React',
                type: 'js',
                links: [
                    { type: 'js', url: 'https://unpkg.com/react@18/umd/react.development.js' },
                    { type: 'js', url: 'https://unpkg.com/react-dom@18/umd/react-dom.development.js' }
                ]
            }

        };
        return libraries[key];
    }
}


class ConsoleManager {
    constructor() {
        this.consoleContainer = document.getElementById('console');
        this.consoleContent = document.getElementById('console-content');
        this.toggleButton = document.getElementById('toggle-console');

        this.toggleButton.addEventListener('click', () => this.toggleConsole());
    }

    toggleConsole() {
        this.consoleContainer.classList.toggle('visible');
        if (this.consoleContainer.classList.contains('visible')) {
            this.consoleContent.scrollTop = this.consoleContent.scrollHeight; //scroll to bottom when opened
        }
    }
}

class EditorManager {
    constructor(state, previewManager) {
        this.state = state;
        this.previewManager = previewManager;
        this.editor = null;
        this.setupEditor();
        this.setupEventListeners();
    }

    setupEditor() {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
        require(['vs/editor/editor.main'], () => {            // Define VS Code-like theme
            monaco.editor.defineTheme('vscode-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                    { token: 'comment', foreground: '6A9955' },
                    { token: 'keyword', foreground: '569CD6' },
                    { token: 'string', foreground: 'CE9178' },
                    { token: 'number', foreground: 'B5CEA8' },
                    { token: 'identifier', foreground: '9CDCFE' }
                ],
                colors: {
                    'editor.background': '#1e1e1e',
                    'editor.foreground': '#d4d4d4',
                    'editorCursor.foreground': '#d4d4d4',
                    'editor.lineHighlightBackground': '#2d2d2d',
                    'editorLineNumber.foreground': '#858585',
                    'editorLineNumber.activeForeground': '#c6c6c6',
                    'editor.selectionBackground': '#264f78',
                    'editor.inactiveSelectionBackground': '#3a3d41',
                    'editorIndentGuide.background': '#404040',
                    'editorIndentGuide.activeBackground': '#707070',
                    'editor.selectionHighlightBackground': '#add6ff26',
                    'editor.wordHighlightBackground': '#575757b8',
                    'editor.wordHighlightStrongBackground': '#004972b8',
                    'editorBracketMatch.background': '#0064001a',
                    'editorBracketMatch.border': '#888888',
                }
            });

            // Create editor instance
            this.editor = monaco.editor.create(document.getElementById('editor'), {
                value: this.state[this.state.currentTab],
                language: this.state.currentTab === 'js' ? 'javascript' : this.state.currentTab,
                theme: 'vscode-dark',
                automaticLayout: true,
                minimap: {
                    enabled: true,
                    scale: 2,
                    renderCharacters: false
                },
                fontSize: 14,
                lineHeight: 21,
                padding: { top: 16 },
                folding: true,
                foldingStrategy: 'indentation',
                renderLineHighlight: 'all',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                'bracketPairColorization.enabled': true,
                renderWhitespace: 'selection',
                guides: {
                    bracketPairs: true,
                    indentation: true
                },
                scrollbar: {
                    useShadows: false,
                    verticalScrollbarSize: 12,
                    horizontalScrollbarSize: 12,
                    vertical: 'visible',
                    horizontal: 'visible'
                }
            });

            // Set the theme
            monaco.editor.setTheme('vscode-dark');

            // Setup events and update preview
            this.setupEditorEvents();
            this.previewManager.update(this.state);

            // Fix initial layout
            setTimeout(() => {
                this.editor.layout();
            }, 100);
        });
    }

    setupEditorEvents() {
        this.editor.onDidChangeModelContent(() => {
            this.state[this.state.currentTab] = this.editor.getValue();
            if (this.state.autoReload) {
                this.previewManager.update(this.state);
            }
        });
    }

    setupEventListeners() {
        this.setupTabSwitching();
        this.setupAutoReload();
        this.setupRunButton();
        this.setupClearButton();
        this.setupCopyAllButton();
        this.setupResizer();
    }

    setupTabSwitching() {
        const tabs = ['html', 'css', 'js'];
        tabs.forEach(tab => {
            const button = document.getElementById(`${tab}-tab`);
            button.addEventListener('click', () => {
                // Save current editor content before switching
                this.state[this.state.currentTab] = this.editor.getValue();

                // Remove active class from all tabs
                tabs.forEach(t => document.getElementById(`${t}-tab`).classList.remove('active'));

                // Add active class to clicked tab
                button.classList.add('active');

                // Update current tab and set editor content and language
                this.state.currentTab = tab;
                this.editor.setValue(this.state[tab]);
                monaco.editor.setModelLanguage(this.editor.getModel(), tab === 'js' ? 'javascript' : tab);
            });
        });
    }

    setupAutoReload() {
        const autoReloadToggle = document.getElementById('auto-reload');
        autoReloadToggle.addEventListener('change', () => {
            this.state.autoReload = autoReloadToggle.checked;
        });
    }

    setupRunButton() {
        document.getElementById('run-button').addEventListener('click', () => {
            this.state[this.state.currentTab] = this.editor.getValue();
            this.previewManager.update(this.state);
            showToast('Preview updated');
        });
    }

    setupClearButton() {
        document.getElementById('clear-button').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all editors?')) {
                this.state.html = '<!DOCTYPE html>\n<html>\n<head>\n  <title>Playground</title>\n</head>\n<body>\n\n</body>\n</html>';
                this.state.css = '';
                this.state.js = '';
                this.state.libraries = []; // Clear libraries as well
                this.editor.setValue(this.state[this.state.currentTab]);
                this.previewManager.update(this.state);
                showToast('All editors cleared');
            }
        });
    }

    setupCopyAllButton() {
        document.getElementById('copy-all-button').addEventListener('click', () => {
            this.state[this.state.currentTab] = this.editor.getValue();
            const combinedCode = this.generateCombinedCode();
            navigator.clipboard.writeText(combinedCode).then(() => {
                showToast('Code copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy:', err);
                showToast('Failed to copy code');
            });
        });
    }
    generateCombinedCode() {
        // Extract just the body content from HTML
        const bodyContent = this.extractBodyContent(this.state.html);

        // Get library links if there are any
        const libraryLinks = this.getLibraryLinksHtml();

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Combined Code</title>
    ${libraryLinks.css}
    <style>
${this.state.css}
    </style>
    ${libraryLinks.jsHead}
</head>
<body>
${bodyContent}
${libraryLinks.jsBody}
<script>
${this.state.js}
</script>
</body>
</html>`;
    }

    getLibraryLinksHtml() {
        // Generate HTML for library links - similar to PreviewManager but for string output
        const links = {
            css: '',
            jsHead: '',
            jsBody: ''
        };

        if (!this.state.libraries || this.state.libraries.length === 0) {
            return links;
        }

        // Add each library's links
        this.state.libraries.forEach(library => {
            if (!library.links) return;

            library.links.forEach(link => {
                if (link.type === 'css') {
                    links.css += `    <link rel="stylesheet" href="${link.url}">\n`;
                } else if (link.type === 'js') {
                    const attrs = link.defer ? ' defer' : '';
                    const scriptTag = `    <script src="${link.url}"${attrs}></script>\n`;

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

    extractBodyContent(html) {
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
            return bodyMatch[1].trim();
        } else if (html.includes('<!DOCTYPE html>')) {
            return html
                .replace(/<\!DOCTYPE[^>]*>/i, '')
                .replace(/<html[^>]*>/i, '')
                .replace(/<\/html>/i, '')
                .replace(/<head[^>]*>[\s\S]*<\/head>/i, '')
                .replace(/<body[^>]*>/i, '')
                .replace(/<\/body>/i, '')
                .trim();
        }
        return html.trim();
    }
    setupResizer() {
        const resizer = document.getElementById('resizer');
        const editorPane = document.querySelector('.editor-pane');
        const previewPane = document.querySelector('.preview-pane');
        let isResizing = false;

        const startResize = (e) => {
            isResizing = true;
            resizer.classList.add('active');
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        };

        const stopResize = () => {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('active');
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
                this.editor.layout(); // Ensure Monaco editor re-layouts
            }
        };

        const resize = (e) => {
            if (!isResizing) return;

            const container = document.querySelector('.editor-container');
            const containerRect = container.getBoundingClientRect();

            // Check if mouse is within container bounds
            if (e.clientX < containerRect.left || e.clientX > containerRect.right) {
                stopResize();
                return;
            }

            let newEditorWidth = e.clientX - containerRect.left;
            const minEditorWidth = 200;
            const maxEditorWidth = containerRect.width - 300;

            newEditorWidth = Math.max(minEditorWidth, Math.min(newEditorWidth, maxEditorWidth));

            requestAnimationFrame(() => {
                editorPane.style.width = `${newEditorWidth}px`;
                editorPane.style.flex = '0 0 auto';
                previewPane.style.flex = '1 1 auto';
                this.editor.layout();
            });
        };

        resizer.addEventListener('mousedown', startResize);
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('mouseleave', stopResize);

        // Cleanup function to remove event listeners when needed
        return () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            document.removeEventListener('mouseleave', stopResize);
            resizer.removeEventListener('mousedown', startResize);
        };
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const initialState = {
        html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Playground</title>\n</head>\n<body>\n\n</body>\n</html>',
        css: '',
        js: '',
        currentTab: 'html',
        autoReload: true,
        libraries: []
    };

    const previewManager = new PreviewManager();
    const libraryManager = new LibraryManager(initialState); // Pass the state
    const editorManager = new EditorManager(initialState, previewManager);
    new ConsoleManager(); //console

    // Make previewManager available to libraryManager
    libraryManager.previewManager = previewManager;


});
