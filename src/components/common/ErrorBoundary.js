// Error Boundary Component
export class ErrorBoundary {
    constructor(container, fallback) {
        this.container = container;
        this.fallback = fallback || this.defaultFallback;
        this.originalContent = container.innerHTML;
        this.setupErrorHandling();
    }

    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            if (this.container.contains(event.target)) {
                this.handleError(event.error);
                event.preventDefault();
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            if (this.container.contains(event.target)) {
                this.handleError(event.reason);
                event.preventDefault();
            }
        });
    }

    handleError(error) {
        console.error('Error caught by boundary:', error);
        this.container.innerHTML = '';
        this.container.appendChild(this.fallback(error));
    }

    reset() {
        this.container.innerHTML = this.originalContent;
    }

    defaultFallback(error) {
        const wrapper = document.createElement('div');
        wrapper.className = 'p-4 rounded-lg bg-red-50 border border-red-200';
        wrapper.innerHTML = `
            <div class="flex items-center gap-3 text-red-700">
                <i class="fas fa-exclamation-circle text-xl"></i>
                <div>
                    <h3 class="font-semibold">Something went wrong</h3>
                    <p class="text-sm mt-1">${error?.message || 'An unexpected error occurred'}</p>
                </div>
            </div>
            <button class="mt-4 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                Retry
            </button>
        `;

        wrapper.querySelector('button').addEventListener('click', () => this.reset());
        return wrapper;
    }
}
