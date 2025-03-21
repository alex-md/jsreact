// import "@styles/global.css";

export function createNavbar() {
    let navbar = document.createElement("nav");
    navbar.className =
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 w-full border-b border-border z-50";

    let container = document.createElement("div");
    container.className = "container mx-auto px-4"; // Removed max-w-7xl for responsiveness

    let navContent = document.createElement("div");
    navContent.className = "flex h-12 items-center justify-between"; // Reduced height

    let logoSection = document.createElement("div");
    logoSection.className = "flex items-center gap-2";

    let logoLink = document.createElement("a");
    logoLink.href = "/";
    logoLink.className = "flex items-center gap-2";

    let logoImage = document.createElement("img");
    logoImage.src = "/assets/images/logo.png";
    logoImage.alt = "JSReact Logo";
    logoImage.style.width = "calc(100% - 1rem)"; // Adjusted width
    logoImage.style.maxWidth = "150px"; // Reduced maxWidth
    logoImage.style.minWidth = "80px"; // Reduced minWidth
    logoImage.style.height = "auto";
    logoImage.className = "";
    logoLink.appendChild(logoImage);
    logoSection.appendChild(logoLink);

    let menuSection = document.createElement("div");
    menuSection.className = "flex items-center gap-2"; // Reduced gap

    let links = [
        { text: "Minifier", href: "/pages/minify/", icon: "fa-compress-alt" },
        { text: "Generator", href: "/pages/generator/", icon: "fa-magic" },
        { text: "Cleaner", href: "/pages/clean/", icon: "fa-broom" },
        { text: "Diff", href: "/pages/diff/", icon: "fa-code-compare" },
        { text: "Expression", href: "/pages/expression/", icon: "fa-calculator" },
        { text: "Keywords", href: "/pages/keyword/", icon: "fa-key" },
        { text: "Speech", href: "/pages/speech/", icon: "fa-microphone-alt" },
        { text: "Playground", href: "/pages/playground/", icon: "fa-code" },
    ];

    let desktopMenu = document.createElement("div");
    desktopMenu.className = "hidden md:flex items-center gap-1";
    links.forEach((link) => {
        let a = document.createElement("a");
        a.href = link.href;
        a.className =
            "group inline-flex items-center justify-center px-2 py-1 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground rounded-md"; // Reduced padding
        let icon = document.createElement("i");
        icon.className = `fas ${link.icon} mr-1 opacity-70 group-hover:opacity-100 transition-opacity`; // Reduced margin
        let text = document.createElement("span");
        text.textContent = link.text;
        a.appendChild(icon);
        a.appendChild(text);
        desktopMenu.appendChild(a);
    });

    let mobileMenuButton = document.createElement("button");
    mobileMenuButton.className = "md:hidden btn-modern variant-ghost p-1"; // Reduced padding
    mobileMenuButton.setAttribute("aria-label", "Menu");

    let mobileMenuIcon = document.createElement("i");
    mobileMenuIcon.className = "fas fa-bars text-lg";
    mobileMenuButton.appendChild(mobileMenuIcon);

    let mobileMenu = document.createElement("div");
    mobileMenu.className =
        "md:hidden absolute top-12 inset-x-0 bg-background border-b border-border hidden"; // Adjusted top

    let mobileMenuList = document.createElement("div");
    mobileMenuList.className = "container mx-auto px-2 py-2 space-y-1"; // Reduced padding
    links.forEach((link) => {
        let a = document.createElement("a");
        a.href = link.href;
        a.className =
            "flex items-center px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"; // Reduced padding
        let icon = document.createElement("i");
        icon.className = `fas ${link.icon} mr-2`; // Reduced margin
        let text = document.createElement("span");
        text.textContent = link.text;
        a.appendChild(icon);
        a.appendChild(text);
        mobileMenuList.appendChild(a);
    });
    mobileMenu.appendChild(mobileMenuList);

    mobileMenuButton.addEventListener("click", () => {
        let isVisible = mobileMenu.classList.contains("hidden");
        mobileMenu.classList.toggle("hidden", !isVisible);
        mobileMenuIcon.className = isVisible ? "fas fa-times text-lg" : "fas fa-bars text-lg";
    });

    menuSection.appendChild(desktopMenu);
    menuSection.appendChild(mobileMenuButton);

    navContent.appendChild(logoSection);
    navContent.appendChild(menuSection);

    container.appendChild(navContent);
    navbar.appendChild(container);
    navbar.appendChild(mobileMenu);
    document.body.prepend(navbar);
}

export default createNavbar;

document.currentScript?.type === "module" &&
    ("loading" === document.readyState
        ? document.addEventListener("DOMContentLoaded", createNavbar)
        : createNavbar());
