import '@/assets/styles/global.css';
import { ConsoleManager } from './components/ConsoleManager.js';
import { PreviewManager } from './components/PreviewManager.js';
import { EditorManager } from './components/EditorManager.js';
import { LibraryManager } from './components/LibraryManager.js';

// Editor state
const state = {
    html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Playground</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>',
    css: 'body {\n  font-family: system-ui, -apple-system, sans-serif;\n  padding: 2rem;\n}\n\nh1 {\n  color: #0ea5e9;\n}',
    js: '// Your JavaScript code here\nconsole.log("Hello from the playground!");',
    currentTab: 'html',
    autoReload: true,
    consoleVisible: false,
    libraries: [] // Array to store selected libraries
};

// Initialize components
const consoleManager = new ConsoleManager();
const previewManager = new PreviewManager(consoleManager);
const libraryManager = new LibraryManager(state, previewManager);
const editorManager = new EditorManager(state, previewManager);

// Setup console toggle
document.getElementById('toggle-console').addEventListener('click', () => {
    consoleManager.toggle(state);
});

// Setup library menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const libraryButton = document.getElementById('library-button');
    const libraryMenu = document.getElementById('library-menu');

    // Toggle library menu
    libraryButton.addEventListener('click', (e) => {
        e.stopPropagation();
        libraryMenu.classList.toggle('visible');
    });

    // Close menu when clicking outside
    document.addEventListener('click', () => {
        libraryMenu.classList.remove('visible');
    });

    libraryMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});
