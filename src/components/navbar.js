import '../styles/global.css';

const navItems = [
    {
        href: './minify.html',
        text: 'Minify',
    },
    {
        href: './generator.html',
        text: 'AI Name Generator',
    },
    {
        href: './expression.html',
        text: 'Solve',
    },
    {
        href: './clean.html',
        text: 'Clean Text',
    },
    {
        href: './diff.html',
        text: 'Diff Checker',
    },
    {
        href: './keyword.html',
        text: 'Keyword Density Analyzer',
    }
];

function createNavbar() {
    const nav = document.createElement('nav');
    nav.className = 'bg-white dark:bg-gray-800 shadow-sm fixed w-full top-0 z-50';

    const container = document.createElement('div');
    container.className = 'container mx-auto px-4 py-4 flex items-center justify-between';

    // Logo/Home link
    const homeLink = document.createElement('a');
    homeLink.href = './';
    homeLink.className = 'text-2xl font-bold text-gray-900 dark:text-white hover:text-primary transition-colors';
    homeLink.textContent = 'JSreact';

    // Navigation items container
    const navItemsContainer = document.createElement('div');
    navItemsContainer.className = 'hidden md:flex items-center space-x-8';

    // Create navigation items
    navItems.forEach(item => {
        const link = document.createElement('a');
        link.href = item.href;
        link.className = 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors';
        link.textContent = item.text;
        navItemsContainer.appendChild(link);
    });

    // Dark mode toggle
    const darkModeToggle = document.createElement('button');
    darkModeToggle.className = 'p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Mobile menu button
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700';
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';

    // Mobile menu
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'md:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-40 hidden';
    
    const mobileMenuContent = document.createElement('div');
    mobileMenuContent.className = 'fixed inset-y-0 right-0 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 translate-x-full';

    // Add elements to the DOM
    container.appendChild(homeLink);
    container.appendChild(navItemsContainer);
    container.appendChild(darkModeToggle);
    container.appendChild(mobileMenuBtn);
    nav.appendChild(container);
    document.body.prepend(nav);

    // Add padding to body to account for fixed navbar
    document.body.style.paddingTop = nav.offsetHeight + 'px';
}

function toggleDarkMode() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
    }
}

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', createNavbar);
