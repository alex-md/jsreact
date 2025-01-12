function createHeader(title, subtitle) {
    const header = document.createElement('header');
    header.classList.add('py-16', 'bg-white', 'dark:bg-gray-800', 'shadow-sm');

    const container = document.createElement('div');
    container.classList.add('container', 'mx-auto', 'px-4', 'max-w-7xl');

    const heading = document.createElement('h1');
    heading.classList.add('text-4xl', 'md:text-5xl', 'font-bold', 'text-center', 'text-gray-900', 'dark:text-white');
    heading.textContent = title;

    if (subtitle) {
        const subheading = document.createElement('p');
        subheading.classList.add('mt-4', 'text-xl', 'text-gray-600', 'dark:text-gray-300', 'text-center', 'max-w-3xl', 'mx-auto');
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