import { showToast } from '@/components/toast.js';

export class EditorManager {
    constructor(state, previewManager) {
        this.state = state;
        this.previewManager = previewManager;
        this.editor = null;
        this.setupEditor();
        this.setupEventListeners();
    }

    setupEditor() {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
        require(['vs/editor/editor.main'], () => {
            this.editor = monaco.editor.create(document.getElementById('editor'), {
                value: this.state[this.state.currentTab],
                language: this.state.currentTab,
                theme: 'vs',
                automaticLayout: true,
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                roundedSelection: true,
                scrollBeyondLastLine: false,
                renderWhitespace: 'selection'
            });

            this.setupEditorEvents();
            this.previewManager.update(this.state);
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
                this.state[this.state.currentTab] = this.editor.getValue();
                tabs.forEach(t => document.getElementById(`${t}-tab`).classList.remove('active'));
                button.classList.add('active');
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
        let isResizing = false;

        resizer.addEventListener('mousedown', () => {
            isResizing = true;
            resizer.classList.add('active');
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const container = document.querySelector('.editor-container');
            const containerRect = container.getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;

            if (newWidth >= 200 && newWidth <= containerRect.width - 300) {
                editorPane.style.width = `${newWidth}px`;
                this.editor.layout();
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            resizer.classList.remove('active');
            document.body.style.userSelect = '';
        });
    }
}
