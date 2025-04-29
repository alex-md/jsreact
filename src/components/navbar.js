import logoUrl from '@assets/images/logo.png';

export function createNavbar() {
    const navbar = document.createElement("nav");
    navbar.className = "navbar bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 w-full border-b border-border z-50";

    const container = document.createElement("div");
    container.className = "container mx-auto px-4";

    const navContent = document.createElement("div");
    navContent.className = "flex h-16 items-center justify-between"; // Increased height for better touch targets

    // Logo section remains the same
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
    logoSection.appendChild(logoLink);

    // Organize links into categories
    const categories = {
        "Text Tools": [
            { text: "Minifier", href: "/pages/minify/", icon: "fa-compress-alt" },
            { text: "Cleaner", href: "/pages/clean/", icon: "fa-broom" },
            { text: "Insert", href: "/pages/insert/", icon: "fa-edit" },
            { text: "Keywords", href: "/pages/keyword/", icon: "fa-key" },
        ],
        "Code Tools": [
            { text: "Generator", href: "/pages/generator/", icon: "fa-magic" },
            { text: "Diff", href: "/pages/diff/", icon: "fa-code-compare" },
            { text: "Expression", href: "/pages/expression/", icon: "fa-calculator" },
            { text: "Playground", href: "/pages/playground/", icon: "fa-code" },
        ], "Utilities": [
            { text: "QR Code", href: "/pages/qr/", icon: "fa-qrcode" },
            { text: "Speech", href: "/pages/speech/", icon: "fa-microphone-alt" },
            { text: "Domain Appraisal", href: "/pages/domain/", icon: "fa-chart-line" },
            { text: "OSRS Flipper", href: "/pages/osrs/", icon: "fa-coins" },
        ],
    };

    const menuSection = document.createElement("div");
    menuSection.className = "flex items-center gap-4";

    // Search functionality
    const setupSearch = (input, resultsContainer) => {
        let selectedIndex = -1;
        let visibleResults = [];

        const showResults = (results) => {
            resultsContainer.innerHTML = '';
            resultsContainer.classList.remove('hidden');

            results.forEach((result, index) => {
                const item = document.createElement('a');
                item.href = result.href;
                item.className = `flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${index === selectedIndex ? 'bg-accent text-accent-foreground' : ''}`;

                const icon = document.createElement('i');
                icon.className = `fas ${result.icon} mr-3 w-4`;

                const text = document.createElement('span');
                text.textContent = result.text;

                item.append(icon, text);
                resultsContainer.appendChild(item);
            });

            if (results.length === 0) {
                resultsContainer.innerHTML = '<div class="px-4 py-2 text-sm text-foreground/70">No results found</div>';
            }
        };

        const hideResults = () => {
            resultsContainer.classList.add('hidden');
            selectedIndex = -1;
        };

        input.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            if (query === '') {
                hideResults();
                return;
            }

            visibleResults = [];
            Object.entries(categories).forEach(([category, items]) => {
                items.forEach(item => {
                    if (item.text.toLowerCase().includes(query)) {
                        visibleResults.push(item);
                    }
                });
            });

            showResults(visibleResults);
            selectedIndex = visibleResults.length > 0 ? 0 : -1;
            showResults(visibleResults);
        });

        input.addEventListener("keydown", (e) => {
            if (!visibleResults.length) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, visibleResults.length - 1);
                    showResults(visibleResults);
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, 0);
                    showResults(visibleResults);
                    break;
                case "Enter":
                    e.preventDefault();
                    if (selectedIndex >= 0) {
                        window.location.href = visibleResults[selectedIndex].href;
                    }
                    break;
                case "Escape":
                    hideResults();
                    input.blur();
                    break;
            }
        });

        // Hide results when clicking outside
        document.addEventListener("click", (e) => {
            if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
                hideResults();
            }
        });

        // Show results when focusing the input if there's a value
        input.addEventListener("focus", () => {
            if (input.value) {
                input.dispatchEvent(new Event('input'));
            }
        });
    };

    // Search box for desktop
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
    desktopMenu.className = "hidden md:flex items-center gap-2";

    Object.entries(categories).forEach(([category, items]) => {
        const dropdown = document.createElement("div");
        dropdown.className = "relative group";

        const trigger = document.createElement("button");
        trigger.className = "group inline-flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors text-foreground hover:bg-accent hover:text-accent-foreground rounded-md gap-1";
        trigger.innerHTML = `${category} <i class="fas fa-chevron-down text-xs opacity-70 transition-all duration-200 ml-1"></i>`;

        const menu = document.createElement("div");
        menu.className = "absolute top-full left-0 mt-1 w-48 rounded-md bg-white text-gray-900 shadow-lg transition-all duration-200 ease-out opacity-0 invisible";

        let hideTimeout;
        const chevron = trigger.querySelector('.fa-chevron-down');

        // Show menu on hover
        dropdown.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
            menu.classList.add('opacity-100', 'visible');
            menu.classList.remove('opacity-0', 'invisible');
            chevron.style.transform = 'rotate(180deg)';
            chevron.style.opacity = '1';
        });

        // Hide menu with delay
        dropdown.addEventListener('mouseleave', () => {
            hideTimeout = setTimeout(() => {
                menu.classList.remove('opacity-100', 'visible');
                menu.classList.add('opacity-0', 'invisible');
                chevron.style.transform = 'rotate(0)';
                chevron.style.opacity = '0.3';
            }, 150); // 150ms delay before hiding
        });

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

    // Mobile menu with categories
    const mobileMenu = document.createElement("div");
    mobileMenu.className = "md:hidden flex flex-wrap gap-2 px-4 py-2 overflow-x-auto whitespace-nowrap relative z-[100]";

    Object.entries(categories).forEach(([category, items]) => {
        const dropdown = document.createElement("div");
        dropdown.className = "relative inline-block align-top";

        const trigger = document.createElement("button");
        trigger.className = "inline-flex items-center justify-center px-3 py-2 text-base font-medium transition-colors bg-white text-black hover:bg-accent hover:text-accent-foreground rounded-md gap-1";
        trigger.innerHTML = `${category} <i class=\"fas fa-chevron-down text-xs opacity-70 transition-all duration-200 ml-1\"></i>`;

        // Portal dropdown menu
        const menu = document.createElement("div");
        menu.className = "fixed hidden rounded-md bg-gray-900 border border-border shadow-lg z-[99999] js-mobile-dropdown-menu opacity-0 invisible";
        menu.style.background = 'rgba(24, 26, 27, 0.98)';
        menu.style.backdropFilter = 'blur(8px)';
        menu.style.boxShadow = '0 8px 32px 0 rgba(0,0,0,0.25)';
        menu.style.minWidth = '180px';
        menu.style.maxWidth = '90vw';
        menu.style.left = '0';
        menu.style.right = 'auto';
        menu.style.top = '0'; // Will be set dynamically

        const chevron = trigger.querySelector('.fa-chevron-down');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Hide all other menus
            document.querySelectorAll('.js-mobile-dropdown-menu').forEach(el => {
                if (el !== menu) el.classList.add('hidden');
            });
            // Position menu below the trigger, aligned left
            const rect = trigger.getBoundingClientRect();
            menu.style.top = `${rect.bottom + 4}px`;
            menu.style.left = `${rect.left}px`;
            menu.style.right = 'auto';
            menu.style.width = `${rect.width}px`;
            menu.classList.toggle('hidden');
            chevron.style.transform = menu.classList.contains('hidden') ? 'rotate(0)' : 'rotate(180deg)';
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.add('hidden');
                chevron.style.transform = 'rotate(0)';
            }
        });

        items.forEach(({ text, href, icon }) => {
            const a = document.createElement("a");
            a.href = href;
            a.className = "flex items-center px-4 py-2 text-base hover:bg-accent hover:text-accent-foreground transition-colors";
            const i = document.createElement("i");
            i.className = `fas ${icon} mr-2 w-4`;
            const span = document.createElement("span");
            span.textContent = text;
            a.append(i, span);
            menu.appendChild(a);
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

export default createNavbar;

if (document.currentScript?.type === "module") {
    document.readyState === "loading"
        ? document.addEventListener("DOMContentLoaded", createNavbar)
        : createNavbar();
}
