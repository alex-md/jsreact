(function () {
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
        const navigation = document.createElement("nav");
        navigation.classList.add(
            "fixed",
            "top-0",
            "left-0",
            "right-0",
            "z-50",
            "bg-white",
            "dark:bg-gray-800",
            "border-b",
            "border-gray-200",
            "dark:border-gray-700"
        );

        const container = document.createElement("div");
        container.classList.add(
            "container",
            "mx-auto",
            "px-4",
            "max-w-7xl",
            "h-16",
            "flex",
            "items-center",
            "justify-between"
        );

        const leftSection = document.createElement("div");
        leftSection.classList.add("flex", "items-center", "gap-2");

        const logoLink = document.createElement("a");
        logoLink.classList.add(
            "flex",
            "items-center",
            "gap-2",
            "font-semibold",
            "text-gray-900",
            "dark:text-white",
            "hover:text-primary",
            "dark:hover:text-primary",
            "transition-colors"
        );
        logoLink.href = "./index.html";

        const logo = document.createElement("img");
        logo.src = "./images/icon.png";
        logo.alt = "JSReact Logo";
        logo.classList.add("h-8", "w-8");
        logoLink.appendChild(logo);

        const brandText = document.createElement("span");
        brandText.textContent = "JSReact";
        brandText.classList.add("text-lg");
        logoLink.appendChild(brandText);

        leftSection.appendChild(logoLink);

        const rightSection = document.createElement("div");
        rightSection.classList.add("flex", "items-center", "gap-4");

        // Dark mode toggle
        const darkModeButton = document.createElement("button");
        darkModeButton.classList.add(
            "p-2",
            "rounded-lg",
            "text-gray-500",
            "dark:text-gray-400",
            "hover:bg-gray-100",
            "dark:hover:bg-gray-700",
            "focus:outline-none",
            "focus:ring-2",
            "focus:ring-gray-200",
            "dark:focus:ring-gray-700"
        );
        darkModeButton.setAttribute("aria-label", "Toggle dark mode");
        
        const sunIcon = '<svg class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>';
        const moonIcon = '<svg class="w-5 h-5 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>';
        
        darkModeButton.innerHTML = sunIcon + moonIcon;

        darkModeButton.addEventListener("click", () => {
            const html = document.documentElement;
            html.classList.toggle("dark");
            localStorage.theme = html.classList.contains("dark") ? "dark" : "light";
            
            // Update theme color meta tag
            const metaThemeColor = document.querySelector("meta[name='theme-color']");
            if (metaThemeColor) {
                metaThemeColor.setAttribute("content", html.classList.contains("dark") ? "#09090b" : "#ffffff");
            }
        });

        const mobileMenuBtn = document.createElement("button");
        mobileMenuBtn.classList.add(
            "lg:hidden",
            "inline-flex",
            "items-center",
            "justify-center",
            "p-2",
            "rounded-md",
            "text-gray-500",
            "dark:text-gray-400",
            "hover:text-gray-900",
            "dark:hover:text-white",
            "hover:bg-gray-100",
            "dark:hover:bg-gray-700",
            "focus:outline-none",
            "focus:ring-2",
            "focus:ring-inset",
            "focus:ring-primary"
        );
        mobileMenuBtn.setAttribute("aria-controls", "mobile-menu");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
        mobileMenuBtn.type = "button";

        const togglerIcon = document.createElement("i");
        togglerIcon.classList.add("fas", "fa-bars");
        mobileMenuBtn.appendChild(togglerIcon);

        const navContent = document.createElement("div");
        navContent.classList.add(
            "hidden",
            "lg:flex",
            "lg:items-center",
            "lg:gap-1"
        );
        navContent.id = "navContent";

        navItems.forEach(item => {
            const link = document.createElement("a");
            link.classList.add(
                "px-3",
                "py-2",
                "text-sm",
                "font-medium",
                "text-gray-500",
                "dark:text-gray-400",
                "hover:text-gray-900",
                "dark:hover:text-white",
                "hover:bg-gray-100",
                "dark:hover:bg-gray-700",
                "rounded-md",
                "transition-colors"
            );
            link.href = item.href;
            link.textContent = item.text;
            
            if (window.location.pathname.includes(item.href)) {
                link.classList.add(
                    "bg-gray-100",
                    "dark:bg-gray-700",
                    "text-gray-900",
                    "dark:text-white"
                );
            }

            navContent.appendChild(link);
        });

        rightSection.appendChild(navContent);
        rightSection.appendChild(darkModeButton);
        rightSection.appendChild(mobileMenuBtn);

        container.appendChild(leftSection);
        container.appendChild(rightSection);
        navigation.appendChild(container);

        // Mobile menu
        const mobileMenu = document.createElement("div");
        mobileMenu.classList.add("lg:hidden", "hidden");
        mobileMenu.id = "mobile-menu";

        const mobileNav = document.createElement("div");
        mobileNav.classList.add(
            "px-2",
            "pt-2",
            "pb-3",
            "space-y-1",
            "bg-white",
            "dark:bg-gray-800",
            "border-b",
            "border-gray-200",
            "dark:border-gray-700"
        );

        navItems.forEach(item => {
            const link = document.createElement("a");
            link.classList.add(
                "block",
                "px-3",
                "py-2",
                "text-base",
                "font-medium",
                "text-gray-500",
                "dark:text-gray-400",
                "hover:text-gray-900",
                "dark:hover:text-white",
                "hover:bg-gray-100",
                "dark:hover:bg-gray-700",
                "rounded-md"
            );
            link.href = item.href;
            link.textContent = item.text;

            if (window.location.pathname.includes(item.href)) {
                link.classList.add(
                    "bg-gray-100",
                    "dark:bg-gray-700",
                    "text-gray-900",
                    "dark:text-white"
                );
            }

            mobileNav.appendChild(link);
        });

        mobileMenu.appendChild(mobileNav);

        // Toggle mobile menu
        mobileMenuBtn.addEventListener("click", () => {
            const mobileMenu = document.getElementById("mobile-menu");
            const isExpanded = mobileMenuBtn.getAttribute("aria-expanded") === "true";
            
            mobileMenuBtn.setAttribute("aria-expanded", !isExpanded);
            mobileMenu.classList.toggle("hidden");
        });

        navigation.appendChild(mobileMenu);

        // Add padding to body to account for fixed navbar
        const style = document.createElement('style');
        style.textContent = `
            body { 
                padding-top: 4rem;
            }
        `;
        document.head.appendChild(style);

        return navigation;
    }

    window.createNavbar = createNavbar;
})();

document.addEventListener("DOMContentLoaded", function () {
    const navbar = createNavbar();
    document.body.insertAdjacentElement('afterbegin', navbar);

    // Only show notice banner on chat.html or tts.html pages
    if (false) {
        const noticeBanner = document.createElement('div');
        noticeBanner.className = 'fixed top-16 left-0 right-0 z-40 bg-yellow-50 dark:bg-yellow-900 border-b border-yellow-200 dark:border-yellow-700 p-3';
        noticeBanner.innerHTML = `
            <div class="container mx-auto px-4 max-w-7xl">
                <p class="text-center text-yellow-800 dark:text-yellow-200">
                    🚧 This feature is currently under development. Some functionality may be limited or unstable. 🚧
                </p>
            </div>
        `;
        document.body.insertAdjacentElement('afterbegin', noticeBanner);
        
        // Adjust body padding when notice banner is present
        document.body.style.paddingTop = '7rem';
    }
});
