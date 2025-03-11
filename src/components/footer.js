// Import styles
import '@/assets/styles/global.css';

// Active users fetch function
async function fetchActiveUsers() {
    try {
        const response = await fetch('https://activeusers.vs.workers.dev/', {
            headers: {
                'Cache-Control': 'no-cache',
            },
            mode: 'cors'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.activeUsers === 0 ? '0' : data.activeUsers || 'Unavailable';
    } catch (error) {
        console.error('Error fetching active users:', error);
        return '0';
    }
}

// View count fetch function
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

export function createFooter() {
    // Prevent multiple footer instances
    if (document.querySelector('footer[data-jsreact-footer]')) {
        return;
    }

    // Create footer elements
    const footer = document.createElement('footer');
    footer.setAttribute('data-jsreact-footer', 'true');
    footer.classList.add(
        'mt-auto',
        'py-12',
        'bg-background',
        'border-t',
        'border-border',
        'animate-fade-in',
        'relative',
        'bottom-0',
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
        'gap-6',
        'w-full',
        'fixed',  // Changed from absolute to fixed for sticky behavior
        'bottom-0',
        'left-0',  // Added to ensure full width alignment
        'right-0', // Added to ensure full width alignment
        `px-4`,
        `opacity-90`,
    );

    // Copyright section
    const copyright = document.createElement('div');
    copyright.innerHTML = `
   `;

    // Stats section
    const stats = document.createElement('div');
    stats.classList.add(
        'flex',
        'items-center',
        'text-muted-foreground',
        'md:order-2',
        // 'm-2rem',
        'animate-slide-up',
        'delay-400',
        'card',
        `border-none`,
        `text-sm`,
        `shadow-float`
    );

    // Add active users icon
    const usersIcon = `<svg class="w-5 h-5 text-muted-foreground/70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
    </svg>`;

    const viewsIcon = `<svg class="w-5 h-5 text-muted-foreground/70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.5 18.5V4H4V20H20V18.5H5.5Z" fill="currentColor"/>
        <path d="M10.5 17V8H12V17H10.5Z" fill="currentColor"/>
        <path d="M7 17V12H8.5V17H7Z" fill="currentColor"/>
        <path d="M17.5 17V10H19V17H17.5Z" fill="currentColor"/>
        <path d="M14 17V5H15.5V17H14Z" fill="currentColor"/>
    </svg>`;

    // Update active users count with debouncing
    let updateTimeout;
    const updateActiveUsers = async () => {
        if (updateTimeout) clearTimeout(updateTimeout);
        updateTimeout = setTimeout(async () => {
            const count = await fetchActiveUsers();
            const activeUsersText = activeUsersButton.querySelector('span');
            if (activeUsersText) {
                activeUsersText.textContent = ` ${count} online`;
            } else {
                const text = document.createElement('span');
                text.textContent = ` ${count} online`;
                text.classList.add('group-hover:text-foreground', 'transition-colors');
                activeUsersButton.appendChild(text);
            }
        }, 100);
    };

    // Create and initialize active users button
    const activeUsersButton = document.createElement('button');
    activeUsersButton.classList.add(
        'inline-flex',
        'items-center',
        'gap-2',
        'text-muted-foreground',
        'hover:text-foreground',
        'transition-colors',
        'group'
    );
    activeUsersButton.id = 'activeUsersButton';
    activeUsersButton.innerHTML = usersIcon;

    // Initialize active users count and set up interval
    updateActiveUsers();
    const updateInterval = setInterval(updateActiveUsers, 60000);

    // Clean up interval when the footer is removed
    footer.addEventListener('remove', () => clearInterval(updateInterval));

    // Create and initialize view count button
    const viewCountButton = document.createElement('button');
    viewCountButton.classList.add(
        'inline-flex',
        'items-center',
        'gap-2',
        'text-muted-foreground',
        'hover:text-foreground',
        'transition-colors',
        'group'
    );
    viewCountButton.id = 'viewCountButton';
    viewCountButton.innerHTML = viewsIcon;

    // Initialize view count
    fetchViewCount().then(count => {
        const viewCountText = document.createElement('span');
        viewCountText.textContent = ` ${count} views`;
        viewCountText.classList.add('group-hover:text-foreground', 'transition-colors');
        viewCountButton.appendChild(viewCountText);
    });

    stats.appendChild(activeUsersButton);
    stats.appendChild(viewCountButton);

    // Change append order
    content.appendChild(copyright);  // Append copyright first
    content.appendChild(stats);      // Append stats second
    container.appendChild(content);
    footer.appendChild(container);

    // Make sure footer is always at the bottom
    if (document.body) {
        // Remove any existing footers without the data attribute
        document.querySelectorAll('footer:not([data-jsreact-footer])').forEach(f => f.remove());
        document.body.appendChild(footer);
    } else {
        // If body isn't ready, wait for it
        document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(footer);
        });
    }

    return footer;
}

// Auto-create footer when imported
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFooter);
} else {
    createFooter();
}

// Expose to window for manual creation if needed
window.createFooter = createFooter;
