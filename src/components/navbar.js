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
            "border-b",
            "border-gray-200"
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
            "hover:text-primary",
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

        const mobileMenuBtn = document.createElement("button");
        mobileMenuBtn.classList.add(
            "lg:hidden",
            "inline-flex",
            "items-center",
            "justify-center",
            "p-2",
            "rounded-md",
            "text-gray-500",
            "hover:text-gray-900",
            "hover:bg-gray-100",
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
                "hover:text-gray-900",
                "hover:bg-gray-100",
                "rounded-md",
                "transition-colors"
            );
            link.href = item.href;
            link.textContent = item.text;
            
            if (window.location.pathname.includes(item.href)) {
                link.classList.add(
                    "bg-gray-100",
                    "text-gray-900"
                );
            }

            navContent.appendChild(link);
        });

        rightSection.appendChild(navContent);
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

        // Toggle mobile menu
        mobileMenuBtn.addEventListener("click", () => {
            const mobileMenu = document.getElementById("mobile-menu");
            if (mobileMenu.classList.contains("hidden")) {
                mobileMenu.classList.remove("hidden");
            } else {
                mobileMenu.classList.add("hidden");
            }
        });

        navigation.appendChild(mobileMenu);
        return navigation;
    }

    document.body.prepend(createNavbar());
})();
