import '@styles/global.css';
import { getActiveUsers } from '@utils/activeusers.js';

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

// utils ---------------------------------------------------------
const el = (tag, classes = [], html = '') => {
    const node = document.createElement(tag);
    if (classes.length) node.classList.add(...classes);
    if (html) node.innerHTML = html;
    return node;
};

// shared class presets ----------------------------------------
const BTN_CLASSES = [
    'inline-flex', 'items-left', 'gap-4',
    'text-muted-foreground', 'hover:text-foreground', 'transition-colors'
];

const SVG = {
    users: `
<svg class="w-4 h-4 text-muted-foreground/70" viewBox="0 0 24 24" fill="currentColor">
<path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z"/>
<path d="M12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"/>
</svg>`,
    views: `
<svg class="w-4 h-4 text-muted-foreground/70" viewBox="0 0 24 24" fill="currentColor">
<path d="M5.5 18.5V4H4V20H20V18.5H5.5Z"/>
<path d="M10.5 17V8H12V17H10.5Z"/>
<path d="M7 17V12H8.5V17H7Z"/>
<path d="M17.5 17V10H19V17H17.5Z"/>
<path d="M14 17V5H15.5V17H14Z"/>
</svg>`
};

/* ----------------------------------------------------------------
   createFooter 
---------------------------------------------------------------- */
export function createFooter(mountTarget = null) {
    if (document.querySelector('footer[data-jsreact-footer]')) return; // guard

    /* ---- DOM skeleton ---- */
    const footer = el('footer', ['mt-auto', 'w-full']);
    footer.dataset.jsreactFooter = 'true';

    const container = el('div', ['w-full', 'backdrop-blur-sm']);
    const content = el('div', [
        'bg-card', 'text-foreground', 'border-t', 'border-border',
        'flex', 'items-center', 'justify-end',
        'h-16', 'mx-auto', 'px-6', 'py-2', 'w-full'
    ]);
    const stats = el('div', [
        'animate-slide-up', 'flex', 'flex-row', 'gap-4',
        'items-center', 'md:order-2'
    ]);

    /* ---- Button factory ---- */
    const makeBtn = (id, icon) => {
        const btn = el('button', BTN_CLASSES, icon);
        btn.id = id;
        return btn;
    };

    const activeBtn = makeBtn('activeUsersButton', SVG.users);
    const viewsBtn = makeBtn('viewCountButton', SVG.views);
    viewsBtn.style.cursor = 'pointer'; viewsBtn.addEventListener('click', () => {
        window.location.href = '/analytics/';
    });

    /* ---- Active users logic ---- */
    const updateActiveUsers = async () => {
        const count = await getActiveUsers();
        let span = activeBtn.querySelector('span');
        if (!span) {
            span = el('span', ['text-foreground']);
            activeBtn.appendChild(span);
        }
        span.textContent = ` ${count} online`;
    };

    /* ---- Views logic ---- */
    const loadViewCount = async () => {
        const count = await fetchViewCount();
        const span = el('span', ['fw-bold', 'text-foreground'], ` ${count} views`);
        viewsBtn.appendChild(span);
    };

    /* ---- Assemble & mount ---- */
    stats.append(activeBtn, viewsBtn);
    content.append(stats);
    container.append(content);
    footer.append(container);

    const mount = () => {
        if (mountTarget instanceof HTMLElement) {
            mountTarget.appendChild(footer);
            return;
        }
        if (document.body) {
            document.body.appendChild(footer);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount, { once: true });
    } else {
        mount();
    }

    /* ---- Timers / cleanup ---- */
    updateActiveUsers();
    const refreshTimer = setInterval(updateActiveUsers, 60_000);
    footer.addEventListener('remove', () => clearInterval(refreshTimer));

    loadViewCount();
    return footer;
}

if (typeof window !== 'undefined') {
    window.createFooter = createFooter;
}
