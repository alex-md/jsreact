export default function createHeader(title, subtitle) {
    const header = document.createElement('header');
    header.className = 'relative bg-background border-b border-border';

    // Background decorative elements
    const bgDecorator = document.createElement('div');
    bgDecorator.className = 'absolute inset-0 pointer-events-none';
    bgDecorator.innerHTML = `
        <div class="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5"></div>
        <div class="absolute inset-0 bg-grid-primary/[0.02] [mask-image:linear-gradient(0deg,transparent,black)]"></div>
    `;

    // Container
    const container = document.createElement('div');
    container.className = 'container mx-auto px-4 py-12 relative z-10 max-w-7xl';

    // Content wrapper
    const content = document.createElement('div');
    content.className = 'max-w-3xl mx-auto text-center space-y-4';

    // Title
    const titleElement = document.createElement('h1');
    titleElement.className = 'text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70';
    titleElement.textContent = title;

    // Subtitle
    const subtitleElement = document.createElement('p');
    subtitleElement.className = 'text-xl text-muted-foreground';
    subtitleElement.textContent = subtitle;

    // Assemble the header
    content.appendChild(titleElement);
    content.appendChild(subtitleElement);
    container.appendChild(content);
    header.appendChild(bgDecorator);
    header.appendChild(container);

    return header;
}
