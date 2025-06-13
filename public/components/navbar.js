// Import logo image
const logoUrl = '/images/logo.png';

// Search functionality
function setupSearch(searchInput, searchResults) {
    const allTools = [
        { name: "Minifier", href: "/minify/", description: "Minify JavaScript, CSS, and HTML code" },
        { name: "Cleaner", href: "/clean/", description: "Clean and format text content" },
        { name: "Insert Tool", href: "/insert/", description: "Insert text at specific positions" },
        { name: "Keywords", href: "/keyword/", description: "Analyze keyword density and distribution" },
        { name: "Generator", href: "/generator/", description: "Generate creative domain names" },
        { name: "Diff Checker", href: "/diff/", description: "Compare text differences" },
        { name: "Expression Tester", href: "/expression/", description: "Test regular expressions" },
        { name: "Playground", href: "/playground/", description: "Live HTML, CSS, JS editor" },
        { name: "QR Code", href: "/qr/", description: "Generate QR codes" },
        { name: "Elevation Finder", href: "/elevation/", description: "Lookup elevation using map or address" },
        { name: "Speech Tools", href: "/speech/", description: "Text to speech conversion" },
        { name: "Domain Appraisal", href: "/domain/", description: "Value domain names" },
        { name: "OSRS Flipper", href: "/osrs/", description: "OSRS item price checker" },
    ];

    let searchTimeout;

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = searchInput.value.toLowerCase();
            if (query.length < 2) {
                searchResults.classList.add('hidden');
                return;
            }

            const matches = allTools.filter(tool =>
                tool.name.toLowerCase().includes(query) ||
                tool.description.toLowerCase().includes(query)
            );

            if (matches.length) {
                searchResults.innerHTML = matches.map(tool => `
                    <a href="${tool.href}" class="flex items-start gap-2 p-2 hover:bg-accent hover:text-accent-foreground">
                        <div>
                            <div class="font-medium">${tool.name}</div>
                            <div class="text-sm text-muted-foreground">${tool.description}</div>
                        </div>
                    </a>
                `).join('');
                searchResults.classList.remove('hidden');
            } else {
                searchResults.innerHTML = '<div class="p-2 text-sm text-muted-foreground">No results found</div>';
                searchResults.classList.remove('hidden');
            }
        }, 200);
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });

    // Close search results when pressing Escape
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchResults.classList.add('hidden');
            searchInput.blur();
        }
    });
}

export function createNavbar() {
    // Check if navbar already exists
    if (document.querySelector('nav.navbar')) {
        return;
    }

    const navbar = document.createElement("nav");
    navbar.className = "navbar bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 w-full border-b border-border z-50";

    const container = document.createElement("div");
    container.className = "container mx-auto px-4";

    const navContent = document.createElement("div");
    navContent.className = "flex h-16 items-center justify-between";

    // Logo section
    const logoSection = document.createElement("div");
    logoSection.className = "flex items-center gap-2";

    const logoLink = document.createElement("a");
    logoLink.href = "/";
    logoLink.className = "flex items-center gap-2";

    const logoImage = document.createElement("img");
    logoImage.src = logoUrl;
    logoImage.alt = "JSReact Logo";
    logoImage.className = "h-14 w-auto max-h-16 min-w-[3.5rem] object-contain";

    logoLink.appendChild(logoImage);
    logoSection.appendChild(logoLink);    // Organize links into categories
    const categories = {
        "Text Tools": [
            { text: "Minifier", href: "/minify/", icon: "fa-compress-alt" },
            { text: "Cleaner", href: "/clean/", icon: "fa-broom" },
            { text: "Insert", href: "/insert/", icon: "fa-edit" },
            { text: "Keywords", href: "/keyword/", icon: "fa-key" }
        ],
        "Code Tools": [
            { text: "Generator", href: "/generator/", icon: "fa-magic" },
            { text: "Diff", href: "/diff/", icon: "fa-code-compare" },
            { text: "Expression", href: "/expression/", icon: "fa-calculator" },
            { text: "Playground", href: "/playground/", icon: "fa-code" }
        ],
        "Utilities": [
            { text: "QR Code", href: "/qr/", icon: "fa-qrcode" },
            { text: "Speech", href: "/speech/", icon: "fa-microphone-alt" },
            { text: "Domain Appraisal", href: "/domain/", icon: "fa-chart-line" },
            { text: "OSRS Flipper", href: "/osrs/", icon: "fa-coins" },
            { text: "Elevation", href: "/elevation/", icon: "fa-mountain" }
        ]
    };

    const menuSection = document.createElement("div");
    menuSection.className = "flex items-center gap-4";

    // Search functionality
    const searchBox = document.createElement("div");
    searchBox.className = "hidden md:flex items-center relative w-full md:w-auto";

    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.placeholder = "Search tools...";
    searchInput.className = "px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm w-full md:w-40 transition-all duration-200 md:focus:w-56";

    const searchResults = document.createElement("div");
    searchResults.className = "absolute hidden top-full left-0 mt-1 w-full md:w-64 max-h-64 overflow-y-auto rounded-md bg-background border border-border shadow-lg z-50";

    searchBox.append(searchInput, searchResults);
    setupSearch(searchInput, searchResults);

    // Desktop menu with dropdowns
    const desktopMenu = document.createElement("div");
    desktopMenu.className = "hidden md:flex items-center gap-2"; Object.entries(categories).forEach(([category, items]) => {
        const dropdown = document.createElement("div");
        dropdown.className = "relative";

        const trigger = document.createElement("button");
        trigger.className = "inline-flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors text-foreground hover:bg-accent hover:text-accent-foreground rounded-md gap-1";
        trigger.innerHTML = `${category} <i class="fas fa-chevron-down text-xs opacity-70 transition-all duration-200 ml-1"></i>`;

        const menu = document.createElement("div");
        menu.className = "absolute top-full left-0 mt-1 w-48 rounded-md bg-background border border-border shadow-lg opacity-0 invisible transition-all duration-200 z-50";

        let isDropdownOpen = false;
        let timeoutId = null;

        const showMenu = () => {
            clearTimeout(timeoutId);
            menu.classList.remove('opacity-0', 'invisible');
            menu.classList.add('opacity-100', 'visible');
            isDropdownOpen = true;
        };

        const hideMenu = () => {
            timeoutId = setTimeout(() => {
                menu.classList.remove('opacity-100', 'visible');
                menu.classList.add('opacity-0', 'invisible');
                isDropdownOpen = false;
            }, 100);
        };

        trigger.addEventListener('mouseenter', showMenu);
        trigger.addEventListener('mouseleave', hideMenu);
        menu.addEventListener('mouseenter', showMenu);
        menu.addEventListener('mouseleave', hideMenu);

        items.forEach(({ text, href, icon }) => {
            const a = document.createElement("a");
            a.href = href;
            a.className = "flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors";

            const i = document.createElement("i");
            i.className = `fas ${icon} mr-2 w-4`;

            const span = document.createElement("span");
            span.textContent = text;

            a.append(i, span);
            menu.appendChild(a);
        });

        dropdown.append(trigger, menu);
        desktopMenu.appendChild(dropdown);
    });

    // Mobile menu
    const mobileMenu = document.createElement("div");
    mobileMenu.className = "md:hidden flex flex-wrap gap-2 px-4 py-2 bg-background/95 backdrop-blur border-t border-border overflow-x-auto whitespace-nowrap";

    // Mobile menu dropdown container
    const mobileDropdownContainer = document.createElement("div");
    mobileDropdownContainer.className = "fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] hidden";
    document.body.appendChild(mobileDropdownContainer);

    mobileDropdownContainer.addEventListener('click', (e) => {
        if (e.target === mobileDropdownContainer) {
            mobileDropdownContainer.classList.add('hidden');
            document.querySelectorAll('.mobile-dropdown-menu').forEach(menu => {
                menu.classList.remove('opacity-100', 'visible');
                menu.classList.add('opacity-0', 'invisible');
            });
        }
    });

    Object.entries(categories).forEach(([category, items]) => {
        const dropdown = document.createElement("div");
        dropdown.className = "relative inline-block align-top";

        const trigger = document.createElement("button");
        trigger.className = "inline-flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors bg-background hover:bg-accent hover:text-accent-foreground rounded-md gap-1";
        trigger.innerHTML = `${category} <i class="fas fa-chevron-down text-xs opacity-70 transition-all duration-200 ml-1"></i>`;

        const menu = document.createElement("div");
        menu.className = "fixed left-4 right-4 top-1/4 -translate-y-1/2 bg-background border border-border rounded-lg shadow-xl z-[1000] p-4 opacity-0 invisible transition-all duration-200 mobile-dropdown-menu max-h-[60vh] overflow-y-auto";

        const menuHeader = document.createElement("div");
        menuHeader.className = "flex items-center justify-between mb-4 pb-2 border-b border-border";

        const menuTitle = document.createElement("h3");
        menuTitle.className = "text-lg font-semibold";
        menuTitle.textContent = category;

        const closeButton = document.createElement("button");
        closeButton.className = "p-1 hover:bg-accent hover:text-accent-foreground rounded-md";
        closeButton.innerHTML = '<i class="fas fa-times"></i>';

        menuHeader.append(menuTitle, closeButton);
        menu.appendChild(menuHeader);

        items.forEach(({ text, href, icon }) => {
            const a = document.createElement("a");
            a.href = href;
            a.className = "flex items-center px-4 py-3 text-base hover:bg-accent hover:text-accent-foreground transition-colors rounded-md";

            const i = document.createElement("i");
            i.className = `fas ${icon} mr-3 w-5`;

            const span = document.createElement("span");
            span.textContent = text;

            a.append(i, span);
            menu.appendChild(a);
        });

        // Mobile menu click handler
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = !menu.classList.contains('opacity-0');

            // Hide all other menus
            document.querySelectorAll('.mobile-dropdown-menu').forEach(m => {
                if (m !== menu) {
                    m.classList.remove('opacity-100', 'visible');
                    m.classList.add('opacity-0', 'invisible');
                }
            });

            if (!isVisible) {
                mobileDropdownContainer.classList.remove('hidden');
                menu.classList.remove('opacity-0', 'invisible');
                menu.classList.add('opacity-100', 'visible');
            } else {
                mobileDropdownContainer.classList.add('hidden');
                menu.classList.remove('opacity-100', 'visible');
                menu.classList.add('opacity-0', 'invisible');
            }
        });

        closeButton.addEventListener('click', () => {
            mobileDropdownContainer.classList.add('hidden');
            menu.classList.remove('opacity-100', 'visible');
            menu.classList.add('opacity-0', 'invisible');
        });

        dropdown.append(trigger);
        document.body.appendChild(menu);
        mobileMenu.appendChild(dropdown);
    });

    menuSection.append(searchBox, desktopMenu);
    navContent.append(logoSection, menuSection);
    container.appendChild(navContent);
    navbar.append(container, mobileMenu);
    document.body.prepend(navbar);
}

// Remove the automatic initialization
export default createNavbar;
