export function createNavbar() {
    const navItems = [
        {
            href: './tts.html',
            text: 'OpenAI TTS Demo',
        },
        {
            href: './minify.html',
            text: 'Minify',
        },
        {
            href: './chat.html',
            text: 'Talk to GPT',
        },
        {
            href: './clean.html',
            text: 'Clean Text',
        },
        {
            href: './diff.html',
            text: 'Diff Checker',
        }
    ];

    const navigation = document.createElement("navigation");
    navigation.classList.add("card-header", "navbar", "navbar-expand-lg", "navbar-light");

    const logoLink = document.createElement("a");
    logoLink.classList.add("navbar-brand");
    logoLink.href = "./index.html";

    const logo = document.createElement("img");
    logo.src = "./images/logo.png";
    logo.alt = "Jsreact Logo";
    logo.style.maxWidth = "auto";
    logo.style.maxHeight = "2.8em";
    logo.style.margin = "0 1em";
    logoLink.appendChild(logo);

    const toggler = document.createElement("button");
    toggler.classList.add("navbar-toggler", "m-3");
    toggler.type = "button";
    toggler.dataset.bsToggle = "collapse";
    toggler.dataset.bsTarget = "#navbarNavDropdown";
    toggler.setAttribute("aria-controls", "navbarNavDropdown");
    toggler.setAttribute("aria-expanded", "false");
    toggler.setAttribute("aria-label", "Toggle navigation");

    const span = document.createElement("span");
    span.classList.add("navbar-toggler-icon");
    toggler.appendChild(span);

    const collapse = document.createElement("div");
    collapse.classList.add("collapse", "navbar-collapse");
    collapse.id = "navbarNavDropdown";

    const ul = document.createElement("ul");
    ul.classList.add("navbar-nav", "ms-auto");

    for (const item of navItems) {
        const li = document.createElement("li");
        li.classList.add("nav-item");

        const a = document.createElement("a");
        a.classList.add("nav-link", "text-end", "pe-3");
        a.href = item.href;
        a.textContent = item.text;

        a.addEventListener('mouseover', function () {
            this.style.backgroundColor = "#f8f9fa";
        });
        a.addEventListener('mouseout', function () {
            this.style.backgroundColor = "";
        });

        li.appendChild(a);
        ul.appendChild(li);
    }

    collapse.appendChild(ul);
    navigation.appendChild(logoLink);
    navigation.appendChild(toggler);
    navigation.appendChild(collapse);

    toggler.addEventListener('click', function () {
        collapse.classList.toggle('show');
    });

    return navigation;
}
