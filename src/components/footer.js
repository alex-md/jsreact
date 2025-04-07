// import "@styles/global.css";

async function fetchActiveUsers() {
    try {
        let response = await fetch("https://activeusers.vs.workers.dev/", {
            headers: { "Cache-Control": "no-cache" },
            mode: "cors"
        });
        if (!response.ok) throw Error(`HTTP error! status: ${response.status}`);
        let data = await response.json();
        return 0 === data.activeUsers ? "0" : data.activeUsers || "Unavailable";
    } catch (error) {
        return console.error("Error fetching active users:", error), "0";
    }
}

async function fetchViewCount() {
    try {
        let response = await fetch("https://views.vs.workers.dev");
        if (!response.ok) throw Error(`HTTP error! status: ${response.status}`);
        let data = await response.text(),
            count = parseInt(data);
        return isNaN(count) ? "Unavailable" : count.toLocaleString();
    } catch (error) {
        return console.error("Error fetching view count:", error), "Unavailable";
    }
}

export function createFooter() {
    let updateTimeout;
    if (document.querySelector("footer[data-jsreact-footer]")) return;
    let footer = document.createElement("footer");
    footer.setAttribute("data-jsreact-footer", "true");
    footer.classList.add(
        "mt-auto",  // Add margin-top auto to push to bottom
        "w-full"
    );

    let container = document.createElement("div");
    container.classList.add(
        "w-full",
        "backdrop-blur-sm"  // Add blur effect
    );

    let content = document.createElement("div");
    content.classList.add(
        "bg-gray-900",
        "flex",
        "h-16",          // Reduced height
        "items-center",
        "justify-between", // Changed from justify-left
        "mx-auto",
        "px-6",          // Increased padding
        "py-2",
        "w-full"
    );

    let copyright = document.createElement("div");
    copyright.innerHTML = `
    `;

    let stats = document.createElement("div");
    stats.classList.add(
        "animate-slide-up",
        "flex",
        "flex-row", // Changed from flex-col
        "gap-4",
        "items-center", // Changed from items-left
        "md:order-2"
    );

    let usersIcon = `<svg class="w-4 h-4 text-muted-foreground/70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
         <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
     </svg>`,
        viewsIcon = `<svg class="w-4 h-4 text-muted-foreground/70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
         <path d="M5.5 18.5V4H4V20H20V18.5H5.5Z" fill="currentColor"/>
         <path d="M10.5 17V8H12V17H10.5Z" fill="currentColor"/>
         <path d="M7 17V12H8.5V17H7Z" fill="currentColor"/>
         <path d="M17.5 17V10H19V17H17.5Z" fill="currentColor"/>
         <path d="M14 17V5H15.5V17H14Z" fill="currentColor"/>
     </svg>`,
        updateActiveUsers = async () => {
            updateTimeout && clearTimeout(updateTimeout), updateTimeout = setTimeout(async () => {
                let count = await fetchActiveUsers(),
                    activeUsersText = activeUsersButton.querySelector("span");
                if (activeUsersText) activeUsersText.textContent = ` ${count} online`;
                else {
                    let text = document.createElement("span");
                    text.textContent = ` ${count} online`, text.classList.add("text-white"), activeUsersButton.appendChild(text);
                }
            }, 100);
        },
        activeUsersButton = document.createElement("button");
    activeUsersButton.classList.add("inline-flex", "items-left", "gap-2", "text-muted-foreground", "hover:text-foreground", "transition-colors", "group", "text-xs"); // Reduced text size
    activeUsersButton.id = "activeUsersButton", activeUsersButton.innerHTML = usersIcon, updateActiveUsers();
    let updateInterval = setInterval(updateActiveUsers, 6e4);
    footer.addEventListener("remove", () => clearInterval(updateInterval));
    let viewCountButton = document.createElement("button");
    return viewCountButton.classList.add("inline-flex", "items-left", "gap-2", "text-muted-foreground", "hover:text-foreground", "transition-colors", "group", "text-xs"), // Reduced text size
        viewCountButton.id = "viewCountButton", viewCountButton.innerHTML = viewsIcon, fetchViewCount().then(count => {
            let viewCountText = document.createElement("span");
            viewCountText.textContent = ` ${count} views`, viewCountText.classList.add("fw-bold", "text-white"), viewCountButton.appendChild(viewCountText);
        }), stats.appendChild(activeUsersButton), stats.appendChild(viewCountButton), content.appendChild(copyright), content.appendChild(stats), container.appendChild(content), footer.appendChild(container), document.body ? (document.querySelectorAll("footer:not([data-jsreact-footer])").forEach(f => f.remove()), document.body.appendChild(footer)) : document.addEventListener("DOMContentLoaded", () => {
            document.body.appendChild(footer);
        }), footer;
}

"loading" === document.readyState ? document.addEventListener("DOMContentLoaded", createFooter) : createFooter(), window.createFooter = createFooter;
