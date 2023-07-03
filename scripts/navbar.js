// Wrap the code in an IIFE to avoid polluting the global namespace
(function () {
    // Define the nav items as a constant outside of the function
    const navItems = [
        {
            href: "./minify.html",
            text: "Minify",
            span: false,
        },
        {
            href: "./chat.html",
            text: "Talk to GPT",
            span: false,
        },
        {
            href: "./clean.html",
            text: "Clean Text",
            span: false,
        },
    ];

    // Import the inter font from google fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css?family=Inter&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);


    // Define a function to create the navbar
    function createNavbar() {
        const nav = document.createElement("nav");
        nav.className = "navbar navbar-expand-lg navbar-light bg-light";
        nav.style.fontFamily = "'Inter', Helvetica, Arial, sans-serif";
        nav.style.fontSize = "1.1rem";
        nav.style.display = "flex";
        nav.style.margin = "0";
        nav.style.padding = "0";

        const topContainer = document.createElement("div");
        topContainer.className = "topContainer";
        topContainer.style.borderBottom = "thin solid rgb(204, 204, 204)";
        topContainer.style.margin = "0 auto";
        topContainer.style.boxShadow = "rgba(0, 0, 0, 0.1) 0px 0px 5px";
        topContainer.style.backgroundColor = "rgb(234, 234, 234)";
        topContainer.style.width = "100%";
        topContainer.style.display = "flex";

        const logoLink = document.createElement("a");
        logoLink.className = "navbar-brand";
        logoLink.href = "./index.html";
        logoLink.style.margin = "0 10px 0 0";
        logoLink.style.padding = "0";
        logoLink.style.display = "flex";
        logoLink.style.alignItems = "center";
        logoLink.style.justifyContent = "center";

        const logo = document.createElement("img");
        logo.src = "./images/logo.png";
        logo.alt = "Logo";
        logoLink.appendChild(logo);

        const toggler = document.createElement("button");
        toggler.className = "navbar-toggler ml-auto";
        toggler.type = "button";
        toggler.dataset.toggle = "collapse";
        toggler.dataset.target = "#navbarSupportedContent";
        toggler.setAttribute("aria-controls", "navbarSupportedContent");
        toggler.setAttribute("aria-expanded", "false");
        toggler.setAttribute("aria-label", "Toggle navigation");

        const span = document.createElement("span");
        span.className = "navbar-toggler-icon ml-auto";
        toggler.appendChild(span);

        const collapse = document.createElement("div");
        collapse.id = "navbarSupportedContent";
        collapse.className = "collapse navbar-collapse ml-auto";

        const ul = document.createElement("ul");
        ul.className = "navbar-nav ml-auto";

        for (let item of navItems) {
            const li = document.createElement("li");
            li.className = "nav-item ml-auto";

            const a = document.createElement("a");
            a.className = "nav-link ml-auto";
            a.href = item.href;
            a.textContent = item.text;

            if (item.span) {
                const span = document.createElement("span");
                span.className = "sr-only ml-auto";
                span.textContent = item.spanText;
                a.appendChild(span);
            }

            li.appendChild(a);
            ul.appendChild(li);
        }

        collapse.appendChild(ul);
        topContainer.appendChild(logoLink);
        topContainer.appendChild(toggler);
        topContainer.appendChild(collapse);
        nav.appendChild(topContainer);
        document.body.appendChild(nav);

        const navLinks = document.querySelectorAll(".nav-link");
        navLinks.forEach(link => {
            link.addEventListener("mouseenter", function () {
                link.style.transform = "translateY(-2px)";
                link.style.transition = "transform 0.2s ease";
            });

            link.addEventListener("mouseleave", function () {
                link.style.transform = "translateY(0)";
                link.style.transition = "transform 0.2s ease";
            });
        });

        const navbarToggler = document.querySelector(".navbar-toggler");
        const navbarCollapse = document.querySelector(".navbar-collapse");

        navbarToggler.addEventListener("click", function () {
            navbarCollapse.classList.toggle("show");
        });
    }
    // Export the createNavbar function to be used elsewhere
    window.createNavbar = createNavbar;
})();
