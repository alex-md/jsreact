import { showToast } from '@/components/toast.js';

export class LibraryManager {
    constructor(state, previewManager) {
        this.state = state;
        this.previewManager = previewManager;
        this.libraryDefinitions = this.getLibraryDefinitions();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add click handlers to all library items
        document.querySelectorAll('.library-item').forEach(item => {
            item.addEventListener('click', () => {
                const libraryId = item.getAttribute('data-library');
                this.importLibrary(libraryId);
            });
        });
    }

    importLibrary(libraryId) {
        // Find the library in our definitions
        const library = this.libraryDefinitions[libraryId];

        if (!library) {
            showToast(`Library ${libraryId} not found`);
            return;
        }

        // Check if library is already added
        if (this.state.libraries.some(lib => lib.id === libraryId)) {
            showToast(`${library.name} is already imported`);
            return;
        }

        // Add the library to our state
        this.state.libraries.push({
            id: libraryId,
            ...library
        });

        // Update the preview
        this.previewManager.update(this.state);

        // Close the library menu
        document.getElementById('library-menu').classList.remove('visible');

        // Show toast message
        showToast(`${library.name} has been imported`);

        // If it's a CSS framework, add a simple usage example to HTML if it's empty
        if (library.type === 'css' && this.isHtmlEmpty()) {
            this.addExampleToHTML(libraryId);
        }
    }

    isHtmlEmpty() {
        // Check if HTML is mostly empty (just contains basic structure)
        return this.state.html.includes('<body>\n  <h1>Hello World</h1>\n</body>');
    }

    addExampleToHTML(libraryId) {
        // Add a simple example based on the library
        let example = '';

        switch (libraryId) {
            case 'bootstrap':
                example = `<div class="container mt-5">
  <div class="row">
    <div class="col-md-6">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Bootstrap Card</h5>
          <p class="card-text">This is a basic Bootstrap card example.</p>
          <button class="btn btn-primary">Learn More</button>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="alert alert-success" role="alert">
        Bootstrap has been imported successfully!
      </div>
    </div>
  </div>
</div>`;
                break;

            case 'tailwind':
                example = `<div class="container mx-auto px-4 py-8">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-800">Tailwind Card</h2>
      <p class="mt-2 text-gray-600">This is a basic Tailwind CSS card example.</p>
      <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Learn More
      </button>
    </div>
    <div class="bg-green-100 border-l-4 border-green-500 p-4">
      <p class="text-green-700">Tailwind CSS has been imported successfully!</p>
    </div>
  </div>
</div>`;
                break;

            case 'bulma':
                example = `<div class="container">
  <div class="columns is-desktop mt-5">
    <div class="column">
      <div class="card">
        <div class="card-content">
          <p class="title is-4">Bulma Card</p>
          <p class="subtitle">This is a basic Bulma card example.</p>
          <button class="button is-primary">Learn More</button>
        </div>
      </div>
    </div>
    <div class="column">
      <div class="notification is-success">
        Bulma has been imported successfully!
      </div>
    </div>
  </div>
</div>`;
                break;

            case 'daisyui':
                example = `<div class="container mx-auto p-4">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="card w-full bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">DaisyUI Card</h2>
        <p>This is a basic DaisyUI card example.</p>
        <div class="card-actions justify-end">
          <button class="btn btn-primary">Learn More</button>
        </div>
      </div>
    </div>
    <div class="alert alert-success">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>DaisyUI has been imported successfully!</span>
    </div>
  </div>
</div>`;
                break;

            case 'materialui':
                example = `<div class="container">
  <div class="mdc-card demo-card">
    <div class="mdc-card__primary-action">
      <div class="demo-card__primary">
        <h2 class="demo-card__title mdc-typography mdc-typography--headline6">Material Design</h2>
        <h3 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2">This is a basic Material card example.</h3>
      </div>
    </div>
    <div class="mdc-card__actions">
      <button class="mdc-button mdc-card__action mdc-card__action--button">
        <span class="mdc-button__ripple"></span>
        <span class="mdc-button__label">Learn More</span>
      </button>
    </div>
  </div>
</div>`;
                break;
        }

        if (example) {
            // Replace the Hello World with our example
            this.state.html = this.state.html.replace('<body>\n  <h1>Hello World</h1>\n</body>', `<body>\n  ${example}\n</body>`);

            // If we're currently on HTML tab, update the editor
            if (this.state.currentTab === 'html' && window.monaco?.editor?.getModels) {
                const editor = monaco.editor.getModels()[0];
                if (editor) {
                    editor.setValue(this.state.html);
                }
            }
        }
    }

    getLibraryDefinitions() {
        // Define all available libraries with their CDN URLs
        return {
            bootstrap: {
                name: 'Bootstrap 5',
                version: '5.3.2',
                type: 'css',
                links: [
                    {
                        type: 'css',
                        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css'
                    },
                    {
                        type: 'js',
                        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
                    }
                ]
            },
            tailwind: {
                name: 'Tailwind CSS',
                version: '3.3.5',
                type: 'css',
                links: [
                    {
                        type: 'css',
                        url: 'https://cdn.jsdelivr.net/npm/tailwindcss@3.3.5/dist/tailwind.min.css'
                    }
                ]
            },
            bulma: {
                name: 'Bulma',
                version: '0.9.4',
                type: 'css',
                links: [
                    {
                        type: 'css',
                        url: 'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css'
                    }
                ]
            },
            daisyui: {
                name: 'DaisyUI',
                version: '4.4.2',
                type: 'css',
                links: [
                    {
                        type: 'css',
                        url: 'https://cdn.jsdelivr.net/npm/tailwindcss@3.3.5/dist/tailwind.min.css'
                    },
                    {
                        type: 'css',
                        url: 'https://cdn.jsdelivr.net/npm/daisyui@4.4.2/dist/full.css'
                    }
                ]
            },
            materialui: {
                name: 'Material Design',
                version: '3.0.0',
                type: 'css',
                links: [
                    {
                        type: 'css',
                        url: 'https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css'
                    },
                    {
                        type: 'js',
                        url: 'https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js'
                    }
                ]
            },
            jquery: {
                name: 'jQuery',
                version: '3.7.1',
                type: 'js',
                links: [
                    {
                        type: 'js',
                        url: 'https://code.jquery.com/jquery-3.7.1.min.js'
                    }
                ]
            },
            alpine: {
                name: 'Alpine.js',
                version: '3.13.0',
                type: 'js',
                links: [
                    {
                        type: 'js',
                        url: 'https://cdn.jsdelivr.net/npm/alpinejs@3.13.0/dist/cdn.min.js',
                        defer: true
                    }
                ]
            },
            react: {
                name: 'React',
                version: '18.2.0',
                type: 'js',
                links: [
                    {
                        type: 'js',
                        url: 'https://unpkg.com/react@18.2.0/umd/react.production.min.js'
                    },
                    {
                        type: 'js',
                        url: 'https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js'
                    },
                    {
                        type: 'js',
                        url: 'https://unpkg.com/babel-standalone@6.26.0/babel.min.js'
                    }
                ]
            }
        };
    }
}
