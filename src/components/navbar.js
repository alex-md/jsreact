// Import styles
import '@/assets/styles/global.css';

const navGroups = [
    {
        name: 'Code Tools',
        icon: 'fa-code',
        items: [
            { href: '/pages/minify', text: 'Minifier' },
            { href: '/pages/playground', text: 'Playground' },
        ]
    },
    {
        name: 'Text Tools',
        icon: 'fa-font',
        items: [
            { href: '/pages/clean', text: 'Clean Text' },
            { href: '/pages/diff', text: 'Diff Checker' },
            { href: '/pages/keyword', text: 'Keyword Analyzer' },
        ]
    },
    {
        name: 'AI Tools',
        icon: 'fa-robot',
        items: [
            { href: '/pages/generator', text: 'Name Generator' },
            { href: '/pages/speech', text: 'Speech Tools' },
        ]
    },
    {
        name: 'Math Tools',
        icon: 'fa-calculator',
        items: [
            { href: '/pages/expression', text: 'Expression Finder' },
        ]
    }
];

// Helper function to generate correct navigation paths
function getNavigationPath(path) {
    return path;
}

function createDropdownMenu(group) {
    const dropdown = document.createElement('div');
    dropdown.className = 'group relative';

    const trigger = document.createElement('button');
    trigger.className = 'flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 rounded-lg transition-all duration-300 hover:bg-primary-50/80 dark:hover:bg-primary-900/20';
    trigger.innerHTML = `
        <i class="fas ${group.icon}"></i>
        ${group.name}
        <i class="fas fa-chevron-down text-xs transition-transform duration-300 group-hover:rotate-180"></i>
    `;

    const menu = document.createElement('div');
    menu.className = 'absolute left-0 top-full mt-1 w-48 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50';

    group.items.forEach(item => {
        const link = document.createElement('a');
        link.href = getNavigationPath(item.href);
        link.className = 'block px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500 hover:bg-primary-50/80 dark:hover:bg-primary-900/20 transition-colors';
        link.textContent = item.text;

        const currentPath = window.location.pathname.toLowerCase();
        const itemPath = item.href.toLowerCase();
        if (currentPath.includes(itemPath)) {
            link.classList.add('bg-primary-50', 'text-primary-500');
        }

        menu.appendChild(link);
    });

    dropdown.appendChild(trigger);
    dropdown.appendChild(menu);
    return dropdown;
}

export function createNavbar() {
    const nav = document.createElement('nav');
    nav.classList.add(
        'sticky',
        'top-0',
        'z-50',
        'bg-white/90',
        'dark:bg-gray-900/90',
        'backdrop-blur-xl',
        'shadow-lg',
        'transition-all',
        'duration-300'
    );

    // Container with modern styling
    const container = document.createElement('div');
    container.classList.add(
        'container-custom',
        'h-16',
        'flex',
        'items-center',
        'justify-between'
    );

    // Modern logo section
    const logoLink = document.createElement('a');
    logoLink.href = '/';
    logoLink.classList.add(
        'flex',
        'items-center',
        'gap-3',
        'text-gray-900',
        'dark:text-white',
        'font-semibold',
        'text-lg',
        'transition-transform',
        'duration-300',
        'hover:scale-105'
    );

    const logoPath = new URL('/assets/images/logo.png', import.meta.url).href;
    logoLink.innerHTML = `
        <img src="${logoPath}" alt="JSReact Logo" class="h-8 md:h-10 lg:h-12 px-5 transition-transform duration-300 hover:scale-110" />
    `;

    // Navigation links with dropdowns
    const navLinks = document.createElement('div');
    navLinks.classList.add(
        'hidden',
        'md:flex',
        'items-center',
        'gap-2'
    );

    navGroups.forEach(group => {
        navLinks.appendChild(createDropdownMenu(group));
    });

    container.appendChild(logoLink);
    container.appendChild(navLinks);
    nav.appendChild(container);

    // Mobile menu
    const mobileMenu = document.createElement('div');
    mobileMenu.classList.add(
        'md:hidden',
        'fixed',
        'inset-x-0',
        'top-16',
        'bg-white',
        'dark:bg-gray-900',
        'border-b',
        'border-gray-200',
        'dark:border-gray-700',
        'shadow-lg',
        'transform',
        'transition-all',
        'duration-300',
        'hidden'
    );
    mobileMenu.id = 'mobile-menu';

    // Create mobile menu content with collapsible sections
    navGroups.forEach(group => {
        const section = document.createElement('div');
        section.className = 'border-b border-gray-100 dark:border-gray-800 last:border-0';

        const header = document.createElement('button');
        header.className = 'flex items-center justify-between w-full px-4 py-3 text-left text-gray-600 dark:text-gray-300 hover:text-primary-500';
        header.innerHTML = `
            <span class="flex items-center gap-2">
                <i class="fas ${group.icon}"></i>
                ${group.name}
            </span>
            <i class="fas fa-chevron-down text-xs transition-transform duration-300"></i>
        `;

        const content = document.createElement('div');
        content.className = 'hidden px-4 py-2 bg-gray-50 dark:bg-gray-800/50';

        group.items.forEach(item => {
            const link = document.createElement('a');
            link.href = getNavigationPath(item.href);
            link.className = 'block py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500';
            link.textContent = item.text;
            content.appendChild(link);
        });

        header.addEventListener('click', () => {
            const isExpanded = !content.classList.contains('hidden');
            header.querySelector('.fa-chevron-down').style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
            content.classList.toggle('hidden');
        });

        section.appendChild(header);
        section.appendChild(content);
        mobileMenu.appendChild(section);
    });

    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.classList.add(
        'md:hidden',
        'p-2',
        'text-gray-600',
        'dark:text-gray-300',
        'hover:text-primary-500'
    );
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars text-xl"></i>';
    mobileMenuBtn.addEventListener('click', () => {
        const menu = document.getElementById('mobile-menu');
        menu.classList.toggle('hidden');
    });

    nav.appendChild(mobileMenu);
    container.appendChild(mobileMenuBtn);

    return nav;
}

// Auto-create navbar when imported
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        document.body.prepend(createNavbar());
    });
} else {
    document.body.prepend(createNavbar());
}
