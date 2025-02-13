export function showToast(message, type = 'info') {
    // Create or get toast container
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.classList.add(
            'fixed',
            'bottom-4',
            'right-4',
            'z-50',
            'space-y-2'
        );
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.classList.add(
        'bg-white',
        'dark:bg-gray-800',
        'rounded-lg',
        'shadow-lg',
        'border',
        'border-gray-200',
        'dark:border-gray-700',
        'transform',
        'transition-all',
        'duration-300',
        'ease-in-out',
        'opacity-0',
        'translate-y-2',
        'pointer-events-auto',
        'p-4',
        'flex',
        'items-center',
        'gap-2'
    );

    // Add type-specific styles and icon
    let icon = '';
    switch (type) {
        case 'error':
            toast.classList.add('border-l-4', 'border-l-red-500');
            icon = '<i class="fas fa-exclamation-circle text-red-500"></i>';
            break;
        case 'success':
            toast.classList.add('border-l-4', 'border-l-green-500');
            icon = '<i class="fas fa-check-circle text-green-500"></i>';
            break;
        case 'warning':
            toast.classList.add('border-l-4', 'border-l-yellow-500');
            icon = '<i class="fas fa-exclamation-triangle text-yellow-500"></i>';
            break;
        case 'info':
        default:
            toast.classList.add('border-l-4', 'border-l-blue-500');
            icon = '<i class="fas fa-info-circle text-blue-500"></i>';
            break;
    }

    // Create toast content with icon
    toast.innerHTML = `
        ${icon}
        <p class="text-sm text-gray-900 dark:text-white flex-1">${message}</p>
        <button class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
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
