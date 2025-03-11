// Import styles
import '@styles/global.css';

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
    }
];

// Helper function to generate correct navigation paths
function getNavigationPath(path) {
    return path;
}

export function createNavbar() {
    const navbar = document.createElement('nav');
    navbar.className = 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 w-full border-b border-border z-50';

    const container = document.createElement('div');
    container.className = 'container mx-auto px-4 max-w-7xl';

    const navContent = document.createElement('div');
    navContent.className = 'flex h-16 items-center justify-between';

    // Logo section with fixed asset path
    const logoSection = document.createElement('div');
    logoSection.className = 'flex items-center gap-2';

    const logoLink = document.createElement('a');
    logoLink.href = '/';
    logoLink.className = 'flex items-center gap-2';

    const logoImage = document.createElement('img');
    logoImage.src = '/assets/images/logo.png';
    logoImage.alt = 'JSReact Logo';
    logoImage.className = 'w-auto h-8 rounded-full';

    // Only append logo image, remove empty text element
    logoLink.appendChild(logoImage);
    logoSection.appendChild(logoLink);

    // Menu section
    const menuSection = document.createElement('div');
    menuSection.className = 'flex items-center gap-4';

    const links = [
        { text: 'Minifier', href: '/pages/minify/', icon: 'fa-compress-alt' },
        { text: 'Generator', href: '/pages/generator/', icon: 'fa-magic' },
        { text: 'Cleaner', href: '/pages/clean/', icon: 'fa-broom' },
        { text: 'Diff', href: '/pages/diff/', icon: 'fa-code-compare' },
        { text: 'Expression', href: '/pages/expression/', icon: 'fa-calculator' },
        { text: 'Keywords', href: '/pages/keyword/', icon: 'fa-key' },
        { text: 'Speech', href: '/pages/speech/', icon: 'fa-microphone-alt' },
        { text: 'Playground', href: '/pages/playground/', icon: 'fa-code' }
    ];

    // Desktop menu
    const desktopMenu = document.createElement('div');
    desktopMenu.className = 'hidden md:flex items-center gap-1';

    links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.href;
        a.className = 'group inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground rounded-md';

        const icon = document.createElement('i');
        icon.className = `fas ${link.icon} mr-2 opacity-70 group-hover:opacity-100 transition-opacity`;

        const text = document.createElement('span');
        text.textContent = link.text;

        a.appendChild(icon);
        a.appendChild(text);
        desktopMenu.appendChild(a);
    });

    // Mobile menu button
    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.className = 'md:hidden btn-modern variant-ghost p-2';
    mobileMenuButton.setAttribute('aria-label', 'Menu');

    const mobileMenuIcon = document.createElement('i');
    mobileMenuIcon.className = 'fas fa-bars text-lg';
    mobileMenuButton.appendChild(mobileMenuIcon);

    // Mobile menu content
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'md:hidden absolute top-16 inset-x-0 bg-background border-b border-border hidden';

    const mobileMenuList = document.createElement('div');
    mobileMenuList.className = 'container mx-auto px-4 py-4 space-y-1';

    links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.href;
        a.className = 'flex items-center px-4 py-3 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors';

        const icon = document.createElement('i');
        icon.className = `fas ${link.icon} mr-3`;

        const text = document.createElement('span');
        text.textContent = link.text;

        a.appendChild(icon);
        a.appendChild(text);
        mobileMenuList.appendChild(a);
    });

    mobileMenu.appendChild(mobileMenuList);

    // Mobile menu toggle functionality
    mobileMenuButton.addEventListener('click', () => {
        const isVisible = mobileMenu.classList.contains('hidden');
        mobileMenu.classList.toggle('hidden', !isVisible);
        mobileMenuIcon.className = isVisible ? 'fas fa-times text-lg' : 'fas fa-bars text-lg';
    });

    // Assemble the navbar
    menuSection.appendChild(desktopMenu);
    menuSection.appendChild(mobileMenuButton);

    navContent.appendChild(logoSection);
    navContent.appendChild(menuSection);

    container.appendChild(navContent);
    navbar.appendChild(container);
    navbar.appendChild(mobileMenu);

    document.body.prepend(navbar);
}

// Export the function as default for consistency
export default createNavbar;

// Only auto-create if the script is loaded directly (not imported)
if (document.currentScript?.type === 'module') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createNavbar);
    } else {
        createNavbar();
    }
}
