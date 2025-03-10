// Common Modal component
export function createModal({ title, content, actions = [], onClose, size = 'md' }) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm';

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    const modal = document.createElement('div');
    modal.className = `bg-white dark:bg-gray-800 rounded-xl shadow-xl ${sizes[size]} w-full mx-4 transform transition-all`;
    modal.innerHTML = `
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${title}</h3>
            <button class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="p-6">
            ${typeof content === 'string' ? content : ''}
        </div>
        ${actions.length > 0 ? `
            <div class="flex items-center justify-end gap-4 p-6 border-t border-gray-200 dark:border-gray-700">
                ${actions.map(action => `
                    <button class="px-4 py-2 text-sm font-medium rounded-lg ${action.variant === 'primary'
            ? 'bg-primary-500 text-white hover:bg-primary-600'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }">${action.text}</button>
                `).join('')}
            </div>
        ` : ''}
    `;

    // Add content if it's a DOM element
    if (content instanceof Node) {
        modal.querySelector('.p-6').appendChild(content);
    }

    // Setup close handlers
    const closeBtn = modal.querySelector('button');
    closeBtn.addEventListener('click', () => {
        overlay.remove();
        if (onClose) onClose();
    });

    // Setup action handlers
    const actionButtons = modal.querySelectorAll('.border-t button');
    actionButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (actions[index].onClick) actions[index].onClick();
            overlay.remove();
        });
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            if (onClose) onClose();
        }
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
        modal.style.transform = 'scale(1)';
        modal.style.opacity = '1';
    });

    return {
        close: () => overlay.remove(),
        getElement: () => modal
    };
}
