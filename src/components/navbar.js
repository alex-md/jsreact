// import "@styles/global.css";

export function createNavbar() {
    const navbar = document.createElement("nav");
    navbar.className =
        "navbar bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 w-full border-b border-border z-50";

    const container = document.createElement("div");
    container.className = "container mx-auto px-4";

    const navContent = document.createElement("div");
    navContent.className = "flex h-12 items-center justify-between";

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

    const menuSection = document.createElement("div");
    menuSection.className = "flex items-center gap-2";

    const links = [
        { text: "Minifier", href: "/pages/minify/", icon: "fa-compress-alt" },
        { text: "Generator", href: "/pages/generator/", icon: "fa-magic" },
        { text: "Cleaner", href: "/pages/clean/", icon: "fa-broom" },
        { text: "Diff", href: "/pages/diff/", icon: "fa-code-compare" },
        { text: "Expression", href: "/pages/expression/", icon: "fa-calculator" },
        { text: "Keywords", href: "/pages/keyword/", icon: "fa-key" },
        { text: "QR Code", href: "/pages/qr/", icon: "fa-qrcode" },
        { text: "Speech", href: "/pages/speech/", icon: "fa-microphone-alt" },
        { text: "Playground", href: "/pages/playground/", icon: "fa-code" },
    ];

    const desktopMenu = document.createElement("div");
    desktopMenu.className = "hidden md:flex items-center gap-1";

    links.forEach(({ text, href, icon }) => {
        const a = document.createElement("a");
        a.href = href;
        a.className =
            "group inline-flex items-center justify-center px-2 py-1 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground rounded-md";

        const i = document.createElement("i");
        i.className = `fas ${icon} mr-1 opacity-70 group-hover:opacity-100 transition-opacity`;

        const span = document.createElement("span");
        span.textContent = text;

        a.append(i, span);
        desktopMenu.appendChild(a);
    });

    const mobileMenuButton = document.createElement("button");
    mobileMenuButton.className = "md:hidden btn-modern variant-ghost p-1";
    mobileMenuButton.setAttribute("aria-label", "Menu");

    const mobileMenuIcon = document.createElement("i");
    mobileMenuIcon.className = "fas fa-bars text-lg";
    mobileMenuButton.appendChild(mobileMenuIcon);

    const mobileMenu = document.createElement("div");
    mobileMenu.className =
        "md:hidden absolute top-12 inset-x-0 bg-background border-b border-border hidden";

    const mobileMenuList = document.createElement("div");
    mobileMenuList.className = "container mx-auto px-2 py-2 space-y-1";

    links.forEach(({ text, href, icon }) => {
        const a = document.createElement("a");
        a.href = href;
        a.className =
            "flex items-center px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors";

        const i = document.createElement("i");
        i.className = `fas ${icon} mr-2`;

        const span = document.createElement("span");
        span.textContent = text;

        a.append(i, span);
        mobileMenuList.appendChild(a);
    });

    mobileMenu.appendChild(mobileMenuList);

    mobileMenuButton.addEventListener("click", () => {
        const isVisible = mobileMenu.classList.contains("hidden");
        mobileMenu.classList.toggle("hidden", !isVisible);
        mobileMenuIcon.className = isVisible ? "fas fa-times text-lg" : "fas fa-bars text-lg";
    });

    menuSection.append(desktopMenu, mobileMenuButton);
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
