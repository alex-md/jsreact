import { createFooter } from './footer.js';
import { createHeader } from './header.js';
import { createNavbar } from './navbar.js';

export function initPageShell({
    title,
    description,
    headerContainerId = 'header',
    footerContainerId,
    includeNavbar = true,
    includeFooter = true
} = {}) {
    if (includeNavbar) {
        createNavbar();
    }

    if (title && description) {
        const headerContainer = document.getElementById(headerContainerId);
        if (headerContainer) {
            headerContainer.innerHTML = '';
            headerContainer.appendChild(createHeader(title, description));
        } else {
            console.warn(`Header container not found: ${headerContainerId}`);
        }
    }

    if (includeFooter) {
        const footerMount = footerContainerId
            ? document.getElementById(footerContainerId)
            : null;
        createFooter(footerMount || null);
    }
}

if (typeof window !== 'undefined') {
    window.initPageShell = initPageShell;
}
