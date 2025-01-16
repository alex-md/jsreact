function createFooter() {
    // Remove any existing footer first
    const existingFooter = document.querySelector('footer');
    if (existingFooter) {
        existingFooter.remove();
    }

    const footer = document.createElement('footer');
    footer.classList.add(
        'mt-auto',
        'py-12',
        'bg-white',
        'dark:bg-gray-900',
        'border-t',
        'border-gray-200',
        'dark:border-gray-800'
    );

    const container = document.createElement('div');
    container.classList.add(
        'container',
        'mx-auto',
        'px-4',
        'max-w-7xl'
    );

    const content = document.createElement('div');
    content.classList.add(
        'flex',
        'flex-col',
        'md:flex-row',
        'justify-between',
        'items-center',
        'gap-6'
    );

    // Copyright section
    const copyright = document.createElement('div');
    copyright.classList.add(
        'text-gray-600',
        'dark:text-gray-400',
        'flex',
        'items-center',
        'gap-2'
    );
    copyright.innerHTML = `
        <span>© ${new Date().getFullYear()} JSReact.</span>
        <span class="hidden md:inline">·</span>
        <span>All rights reserved.</span>
    `;

    // Stats section
    const stats = document.createElement('div');
    stats.classList.add(
        'flex',
        'items-center',
        'gap-6',
        'text-gray-600',
        'dark:text-gray-400'
    );

    // Right section with view count
    const viewCountButton = document.createElement('button');
    viewCountButton.classList.add(
        'inline-flex',
        'items-center',
        'gap-2',
        'text-gray-500',
        'dark:text-gray-400',
        'hover:text-gray-700',
        'dark:hover:text-gray-300',
        'transition-colors'
    );
    viewCountButton.id = 'viewCountButton';

    // Add view count icon
    const viewsIcon = `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.5 18.5V4H4V20H20V18.5H5.5Z" fill="currentColor"/>
        <path d="M10.5 17V8H12V17H10.5Z" fill="currentColor"/>
        <path d="M7 17V12H8.5V17H7Z" fill="currentColor"/>
        <path d="M17.5 17V10H19V17H17.5Z" fill="currentColor"/>
        <path d="M14 17V5H15.5V17H14Z" fill="currentColor"/>
    </svg>`;
    viewCountButton.innerHTML = viewsIcon;

    // Fetch and update view count
    async function fetchViewCount() {
        try {
            const response = await fetch('https://views.vs.workers.dev');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.text();
            const count = parseInt(data);
            return isNaN(count) ? 'Unavailable' : count.toLocaleString();
        } catch (error) {
            console.error('Error fetching view count:', error);
            return 'Unavailable';
        }
    }

    // Initialize view count
    fetchViewCount().then(count => {
        const viewCountText = document.createElement('span');
        viewCountText.textContent = ` ${count} views`;
        viewCountButton.appendChild(viewCountText);
    });

    stats.appendChild(viewCountButton);
    content.appendChild(stats);
    container.appendChild(content);
    footer.appendChild(container);

    return footer;
}

// Automatically create and append footer when the script loads
document.addEventListener('DOMContentLoaded', () => {
    const footer = createFooter();
    document.body.appendChild(footer);
});

window.createFooter = createFooter;
