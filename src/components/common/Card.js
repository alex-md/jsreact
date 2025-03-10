// Common Card component
export function createCard({ title, description, icon, iconBg, children }) {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100 dark:border-gray-700';

    // Header section with icon if provided
    if (title || icon) {
        const header = document.createElement('div');
        header.className = 'flex items-center gap-3 mb-4';

        if (icon) {
            const iconWrapper = document.createElement('div');
            iconWrapper.className = `p-2 ${iconBg || 'bg-primary-100'} rounded-lg`;
            iconWrapper.innerHTML = `<i class="${icon}"></i>`;
            header.appendChild(iconWrapper);
        }

        if (title) {
            const heading = document.createElement('h3');
            heading.className = 'text-lg font-semibold text-gray-900 dark:text-white';
            heading.textContent = title;
            header.appendChild(heading);
        }

        card.appendChild(header);
    }

    // Description if provided
    if (description) {
        const desc = document.createElement('p');
        desc.className = 'text-gray-600 dark:text-gray-300 mb-6 min-h-[3rem]';
        desc.textContent = description;
        card.appendChild(desc);
    }

    // Add any additional content
    if (typeof children === 'string') {
        card.insertAdjacentHTML('beforeend', children);
    } else if (children instanceof Node) {
        card.appendChild(children);
    } else if (Array.isArray(children)) {
        children.forEach(child => {
            if (child instanceof Node) {
                card.appendChild(child);
            }
        });
    }

    return card;
}
