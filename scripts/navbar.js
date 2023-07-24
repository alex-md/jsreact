(function () {
    const navItems = [
        {
            href: './minify.html',
            text: 'Minify',
            span: false,
        },
        {
            href: './chat.html',
            text: 'Talk to GPT',
            span: false,
        },
        {
            href: './clean.html',
            text: 'Clean Text',
            span: false,
        },
        {
            href: './diff.html',
            text: 'Diff Checker',
            span: false,
        },
    ];

    let link = document.createElement("link");
    function createNavbar () {
        let nav = document.createElement("nav");
        nav.classList.add("navbar", "navbar-expand-lg", "bg-light", "navbar-light", "shadow");
        nav.style.fontFamily = "'Nunito', Helvetica, Arial, sans-serif";
        nav.style.fontSize = "1.1rem";

        let container = document.createElement("div");
        container.classList.add("container-fluid");

        let logoLink = document.createElement("a");
        logoLink.classList.add("navbar-brand");
        logoLink.href = "./index.html";

        let logo = document.createElement("img");
        logo.src = "./images/logo.png";
        logo.alt = "Logo";
        logo.style.maxWidth = "auto";
        logo.style.maxHeight = "2.8em";
        logo.style.margin = "0 auto";
        logoLink.appendChild(logo);

        let toggler = document.createElement("button");
        toggler.classList.add("navbar-toggler");
        toggler.type = "button";
        toggler.dataset.bsToggle = "collapse";
        toggler.dataset.bsTarget = "#navbarSupportedContent";
        toggler.setAttribute("aria-controls", "navbarSupportedContent");
        toggler.setAttribute("aria-expanded", "false");
        toggler.setAttribute("aria-label", "Toggle navigation");

        let span = document.createElement("span");
        span.classList.add("navbar-toggler-icon");
        toggler.appendChild(span);

        let collapse = document.createElement("div");
        collapse.id = "navbarSupportedContent";
        collapse.classList.add("collapse", "navbar-collapse");

        let ul = document.createElement("ul");
        ul.classList.add("navbar-nav", "ms-auto");

        for (let item of navItems) {
            let li = document.createElement("li");
            li.classList.add("nav-item");

            let a = document.createElement("a");
            a.classList.add("nav-link");
            a.href = item.href;
            a.textContent = item.text;
            if (item.span) {
                let span = document.createElement("span");
                span.classList.add("visually-hidden");
                span.textContent = item.spanText;
                a.appendChild(span);
            }
            li.appendChild(a);
            ul.appendChild(li);
        }

        link.href = "https://fonts.googleapis.com/css?family=Nunito&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);

        collapse.appendChild(ul);
        container.appendChild(logoLink);
        container.appendChild(toggler);
        container.appendChild(collapse);
        nav.appendChild(container);
        document.body.appendChild(nav);

        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach((link) => {
            link.addEventListener('mouseenter', () => {
                link.style.transform = 'translateY(-2px)';
                link.style.transition = 'transform 0.2s ease';
            });

            link.addEventListener('mouseleave', () => {
                link.style.transform = 'translateY(0)';
                link.style.transition = 'transform 0.2s ease';
            });
        });

        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarCollapse = document.querySelector('.navbar-collapse');

        navbarToggler.addEventListener('click', () => {
            navbarCollapse.classList.toggle('show');
        });
    }

    const style = document.createElement('style');
    style.textContent = '.navbar-toggler-icon { transition: none; }';
    document.head.appendChild(style);

    window.createNavbar = createNavbar;
})();
