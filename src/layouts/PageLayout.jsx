import { createHeader } from '@components/common/header';
import { createNavbar } from '@components/common/navbar';
import { createFooter } from '@components/common/footer';
import { dom } from '@utils/core';

export function createPageLayout({ title, description, content, className = '' }) {
    // Create main container
    const container = dom.createElement('div', `min-h-screen flex flex-col ${className}`);

    // Add header content
    const headerContent = createHeader(title, description);
    container.appendChild(headerContent);

    // Create main content area
    const main = dom.createElement('main', 'container mx-auto px-4 py-12 max-w-7xl flex-grow');

    // Add content
    if (typeof content === 'string') {
        main.innerHTML = content;
    } else if (content instanceof Node) {
        main.appendChild(content);
    }

    container.appendChild(main);

    // Add footer
    container.appendChild(createFooter());

    return container;
}
