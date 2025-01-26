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
        const nav = document.createElement('nav');
        nav.classList.add(
            'sticky',
            'top-0',
            'z-50',
            'bg-white',
            // 'dark:bg-gray-900/10',
            'backdrop-blur-xl',
            'shadow-lg',
            'transition-all',
            'duration-300',
        );

        // Container with modern styling
        const container = document.createElement('div');
        container.classList.add(
            'container-custom',
            'h-16',
            'flex',
            'items-center',
            'justify-between',
            'bg-white',
        );

        // Modern logo section
        const logoLink = document.createElement('a');
        logoLink.href = './';
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
        logoLink.innerHTML = `
            <img src="./images/logo.png" alt="JSReact Logo" class="h-8 md:h-10 lg:h-12 px-5 transition-transform duration-300 hover:scale-110" />
            <span></span>
        `;

        // Navigation links
        const navLinks = document.createElement('div');
        navLinks.classList.add(
            'hidden',
            'md:flex',
            'items-center',
            'gap-1'
        );

        navItems.forEach(item => {
            const link = document.createElement("a");
            link.classList.add(
                "tooltip",
                "px-3",
                "py-2",
                "text-sm",
                "font-medium",
                "text-gray-600",
                "dark:text-gray-300",
                "hover:text-primary-500",
                "dark:hover:text-primary-400",
                "rounded-lg",
                "transition-all",
                "duration-300",
                "hover:bg-primary-50",
                "dark:hover:bg-primary-900/20"
            );
            link.setAttribute('data-tooltip', item.text);
            link.href = item.href;
            link.textContent = item.text;

            if (window.location.pathname.includes(item.href)) {
                link.classList.add(
                    "bg-gray-100",
                    "text-gray-900"
                );
            }

            navLinks.appendChild(link);
        });

        container.appendChild(logoLink);
        container.appendChild(navLinks);
        nav.appendChild(container);

        // Enhanced mobile menu
        const mobileMenu = document.createElement("div");
        mobileMenu.classList.add(
            'md:hidden',
            'fixed',
            'inset-x-0',
            'top-16',
            'bg-white',
            'dark:bg-gray-900',
            'border-b',
            'border-gray-200',
            'dark:border-gray-800',
            'shadow-lg',
            'transform',
            'transition-transform',
            'duration-200',
            'ease-in-out',
            'hidden'
        );
        mobileMenu.id = "mobile-menu";

        const mobileNav = document.createElement("div");
        mobileNav.classList.add(
            "px-2",
            "pt-2",
            "pb-3",
            "space-y-1",
            "bg-white",
            "border-b",
            "border-gray-200"
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
                "hover:text-gray-900",
                "hover:bg-gray-100",
                "rounded-md"
            );
            link.href = item.href;
            link.textContent = item.text;

            if (window.location.pathname.includes(item.href)) {
                link.classList.add(
                    "bg-gray-100",
                    "text-gray-900"
                );
            }

            mobileNav.appendChild(link);
        });

        mobileMenu.appendChild(mobileNav);

        // Enhanced mobile menu button
        const mobileMenuBtn = document.createElement("button");
        mobileMenuBtn.classList.add(
            'md:hidden',
            'btn-modern',
            'text-gray-600',
            'dark:text-gray-300',
            'hover:text-primary-500',
            'dark:hover:text-primary-400'
        );
        mobileMenuBtn.setAttribute("aria-controls", "mobile-menu");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
        mobileMenuBtn.type = "button";

        const togglerIcon = document.createElement("i");
        togglerIcon.classList.add("fas", "fa-bars");
        mobileMenuBtn.appendChild(togglerIcon);

        mobileMenuBtn.addEventListener("click", () => {
            const mobileMenu = document.getElementById("mobile-menu");
            if (mobileMenu.classList.contains("hidden")) {
                mobileMenu.classList.remove("hidden");
            } else {
                mobileMenu.classList.add("hidden");
            }
        });

        nav.appendChild(mobileMenu);
        nav.appendChild(mobileMenuBtn);

        return nav;
    }

    document.body.prepend(createNavbar());
})();
