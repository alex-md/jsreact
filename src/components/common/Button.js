// Common Button component
export function createButton({ text, icon, variant = 'primary', onClick, className = '', disabled = false }) {
    const button = document.createElement('button');
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2';
    const variants = {
        primary: 'bg-primary-500 text-white hover:bg-primary-600',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        outline: 'border border-gray-200 text-gray-600 hover:border-primary-500 hover:text-primary-500'
    };

    button.className = `${baseClasses} ${variants[variant]} ${className}`;
    button.disabled = disabled;
    button.innerHTML = `${icon ? `<i class="${icon}"></i>` : ''}${text}`;

    if (onClick) {
        button.addEventListener('click', onClick);
    }

    return button;
}
