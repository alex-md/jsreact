function createToast(title, message, type = 'error') {
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
        'pointer-events-auto'
    );

    // Add type-specific styles
    switch (type) {
        case 'error':
            toast.classList.add('border-l-4', 'border-l-red-500');
            break;
        case 'success':
            toast.classList.add('border-l-4', 'border-l-green-500');
            break;
        case 'warning':
            toast.classList.add('border-l-4', 'border-l-yellow-500');
            break;
        case 'info':
            toast.classList.add('border-l-4', 'border-l-blue-500');
            break;
    }

    // Create toast content
    const content = document.createElement('div');
    content.classList.add('p-4');

    const titleElement = document.createElement('h3');
    titleElement.classList.add(
        'text-sm',
        'font-medium',
        'text-gray-900',
        'dark:text-white'
    );
    titleElement.textContent = title;

    const messageElement = document.createElement('p');
    messageElement.classList.add(
        'mt-1',
        'text-sm',
        'text-gray-500',
        'dark:text-gray-400'
    );
    messageElement.textContent = message;

    content.appendChild(titleElement);
    content.appendChild(messageElement);
    toast.appendChild(content);

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.classList.add(
        'absolute',
        'top-2',
        'right-2',
        'text-gray-400',
        'hover:text-gray-500',
        'dark:hover:text-gray-300'
    );
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.onclick = () => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    };
    toast.appendChild(closeButton);

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

window.createToast = createToast; 