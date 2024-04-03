(function () {
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
            href: './generator.html',
            text: 'AI Name Generator',
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

    function createNavbar() {
        const navigation = document.createElement("navigation");
        navigation.classList.add("card-header", "navbar", "navbar-expand-lg", "shadow-sm", "bg-light");

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
        ul.classList.add("navbar-nav", "ms-auto"); // Add 'ms-auto' to move the navbar links to the right

        for (const item of navItems) {
            const li = document.createElement("li");
            li.classList.add("nav-item");

            const a = document.createElement("a");
            a.classList.add("nav-link", "text-end", "pe-3");
            a.href = item.href;
            a.textContent = item.text;

            // Add hover effect
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
        document.body.appendChild(navigation);

        // Add event listener to toggler
        toggler.addEventListener('click', function () {
            collapse.classList.toggle('show');
        });
    }

    window.createNavbar = createNavbar;
})();

document.addEventListener("DOMContentLoaded", function () {
    // Call the createNavbar function and place it at the top of the page
    createNavbar();

    // Move the navbar element to the top of the page
    document.body.insertAdjacentElement('afterbegin', document.querySelector("navigation"));
});



// Create footer element
var footer = document.createElement('footer');
footer.style.padding = '1rem';
footer.style.position = 'relative';
footer.style.bottom = '0';
footer.style.width = '100%';

// Create div for row
var rowDiv = document.createElement('div');
rowDiv.style.display = 'flex';
rowDiv.style.justifyContent = 'flex-end';
rowDiv.style.margin = '0.5rem';

// Create div for column
var colDiv = document.createElement('div');
colDiv.style.flex = '0 0 auto';

// Create button
var button = document.createElement('div');
button.style.backgroundColor = 'transparent';
button.style.color = '#6c757d';
button.style.border = '0';
button.id = 'viewCountButton'; // Add an id to the button for later reference

// Create anchor
var anchor = document.createElement('div');

button.appendChild(anchor);
colDiv.appendChild(button);
rowDiv.appendChild(colDiv);
footer.appendChild(rowDiv);

document.body.appendChild(footer);

async function fetchViewCount() {
    try {
        const response = await fetch('https://views.vs.workers.dev');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        return data;
    } catch (error) {
        console.error('Error fetching view count:', error);
        return 'Unavailable';
    }
}

function formatWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function updateViewCount() {
    fetchViewCount().then(viewCount => {
        const viewCountButton = document.getElementById('viewCountButton');
        viewCountButton.textContent = `Views: ${formatWithCommas(viewCount)}`;
    });
}

updateViewCount();
