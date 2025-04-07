// import "@styles/global.css";

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
    logoImage.src = "/assets/images/logo.png";
    logoImage.alt = "JSReact Logo";
    Object.assign(logoImage.style, {
        width: "calc(100% - 1rem)",
        maxWidth: "150px",
        minWidth: "80px",
        height: "auto",
    });

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
        ],
        "Utilities": [
            { text: "QR Code", href: "/pages/qr/", icon: "fa-qrcode" },
            { text: "Speech", href: "/pages/speech/", icon: "fa-microphone-alt" },
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
    searchBox.className = "hidden md:flex items-center relative";

    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.placeholder = "Search tools...";
    searchInput.className = "px-3 py-1 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm w-40 transition-all duration-200 focus:w-56";

    const searchResults = document.createElement("div");
    searchResults.className = "absolute hidden top-full left-0 mt-1 w-64 max-h-64 overflow-y-auto rounded-md bg-background border border-border shadow-lg z-50";

    searchBox.append(searchInput, searchResults);

    // Set up search for desktop
    setupSearch(searchInput, searchResults);

    // Desktop menu with dropdowns
    const desktopMenu = document.createElement("div");
    desktopMenu.className = "hidden md:flex items-center gap-2";

    Object.entries(categories).forEach(([category, items]) => {
        const dropdown = document.createElement("div");
        dropdown.className = "relative group";

        const trigger = document.createElement("button");
        trigger.className = "group inline-flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground rounded-md gap-1";
        trigger.innerHTML = `${category} <i class="fas fa-chevron-down text-xs opacity-70 transition-all duration-200 ml-1"></i>`;

        const menu = document.createElement("div");
        menu.className = "absolute opacity-0 invisible top-full left-0 mt-1 w-48 rounded-md bg-background border border-border shadow-lg transition-all duration-200 ease-out";

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
                chevron.style.opacity = '0.7';
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

    // Mobile menu improvements
    const mobileMenuButton = document.createElement("button");
    mobileMenuButton.className = "md:hidden btn-modern variant-ghost p-2 hover:bg-accent rounded-md";
    mobileMenuButton.setAttribute("aria-label", "Menu");

    const mobileMenuIcon = document.createElement("i");
    mobileMenuIcon.className = "fas fa-bars text-lg";
    mobileMenuButton.appendChild(mobileMenuIcon);

    const mobileMenu = document.createElement("div");
    mobileMenu.className = "md:hidden absolute top-16 inset-x-0 bg-background border-b border-border transform -translate-y-full transition-transform duration-200 ease-in-out opacity-0";

    const mobileMenuList = document.createElement("div");
    mobileMenuList.className = "container mx-auto divide-y divide-border";

    // Mobile search setup with unique variable names
    const mobileSearchBar = searchBox.cloneNode(true);
    mobileSearchBar.className = "flex items-center px-4 py-3 border-b border-border relative";
    const searchInputMobile = mobileSearchBar.querySelector("input");
    const searchResultsMobile = mobileSearchBar.querySelector("div");
    searchInputMobile.className = "px-3 py-2 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm w-full";
    searchResultsMobile.className = "absolute hidden top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-md bg-background border border-border shadow-lg z-50";
    setupSearch(searchInputMobile, searchResultsMobile);

    mobileMenu.append(mobileSearchBar, mobileMenuList);

    Object.entries(categories).forEach(([category, items]) => {
        const section = document.createElement("div");
        section.className = "py-2";

        const categoryHeading = document.createElement("h3");
        categoryHeading.className = "px-4 py-2 text-sm font-semibold text-foreground/70";
        categoryHeading.textContent = category;

        const itemsList = document.createElement("div");
        itemsList.className = "space-y-1 px-2";

        items.forEach(({ text, href, icon }) => {
            const a = document.createElement("a");
            a.href = href;
            a.className = "flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors";

            const i = document.createElement("i");
            i.className = `fas ${icon} mr-3 w-4`;

            const span = document.createElement("span");
            span.textContent = text;

            a.append(i, span);
            itemsList.appendChild(a);
        });

        section.append(categoryHeading, itemsList);
        mobileMenuList.appendChild(section);
    });

    // Improved mobile menu interaction
    mobileMenuButton.addEventListener("click", () => {
        const isVisible = !mobileMenu.classList.contains("translate-y-full");
        mobileMenu.classList.toggle("translate-y-full", !isVisible);
        mobileMenu.classList.toggle("opacity-0", !isVisible);
        mobileMenuIcon.className = isVisible ? "fas fa-bars text-lg" : "fas fa-times text-lg";
    });

    menuSection.append(searchBox, desktopMenu, mobileMenuButton);
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
