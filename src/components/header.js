function createHeader(title, subtitle) {
    const header = document.createElement('header');
    header.classList.add(
        'relative',
        'py-24',
        'overflow-hidden',
        'bg-gradient-to-br',
        'from-gray-900',
        'to-gray-800',
        'dark:from-black',
        'dark:to-gray-900'
    );

    // Add background pattern
    const pattern = document.createElement('div');
    pattern.classList.add(
        'absolute',
        'inset-0',
        'bg-grid-white/[0.05]',
        'bg-[size:60px_60px]'
    );
    header.appendChild(pattern);

    const container = document.createElement('div');
    container.classList.add(
        'relative',
        'container',
        'mx-auto',
        'px-4',
        'max-w-7xl',
        'text-center',
        'text-white'
    );

    const heading = document.createElement('h1');
    heading.classList.add(
        'text-4xl',
        'md:text-6xl',
        'font-bold',
        'text-dark',
        'mb-6'
    );
    heading.innerHTML = `<span class="text-primary-300">${title}</span>`;

    if (subtitle) {
        const subheading = document.createElement('p');
        subheading.classList.add(
            'mt-6',
            'text-lg',
            'text-gray-300',
            'max-w-2xl',
            'mx-auto',
            'leading-relaxed'
        );
        subheading.textContent = subtitle;
        container.appendChild(heading);
        container.appendChild(subheading);
    } else {
        container.appendChild(heading);
    }

    header.appendChild(container);
    return header;
}

window.createHeader = createHeader;
