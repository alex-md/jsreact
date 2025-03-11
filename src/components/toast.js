function createToastContainer() {
    const existingContainer = document.getElementById('toast-container');
    if (existingContainer) return existingContainer;

    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(container);
    return container;
}

export function showToast(message, type = 'info') {
    const toastContainer = createToastContainer();
    const toast = document.createElement('div');

    // Base toast styles
    toast.className = `
        flex items-center gap-3 min-w-[320px] p-4 rounded-lg border shadow-lg
        transform translate-y-2 opacity-0 transition-all duration-300
        bg-background border-border
    `;

    // Type-specific styles and icons
    const typeStyles = {
        info: {
            icon: '<i class="fas fa-info-circle text-blue-500"></i>',
            additionalClasses: 'border-blue-100 dark:border-blue-900/50'
        },
        success: {
            icon: '<i class="fas fa-check-circle text-green-500"></i>',
            additionalClasses: 'border-green-100 dark:border-green-900/50'
        },
        warning: {
            icon: '<i class="fas fa-exclamation-circle text-yellow-500"></i>',
            additionalClasses: 'border-yellow-100 dark:border-yellow-900/50'
        },
        error: {
            icon: '<i class="fas fa-times-circle text-red-500"></i>',
            additionalClasses: 'border-red-100 dark:border-red-900/50'
        }
    };

    const { icon, additionalClasses } = typeStyles[type] || typeStyles.info;
    toast.className += ' ' + additionalClasses;

    // Toast content
    toast.innerHTML = `
        ${icon}
        <p class="text-sm text-foreground flex-1">${message}</p>
        <button class="text-muted-foreground hover:text-foreground transition-colors">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add click handler for close button
    const closeButton = toast.querySelector('button');
    closeButton.onclick = () => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    };

    // Add to container and animate in
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-2');
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}
