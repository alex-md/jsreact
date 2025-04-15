export function createHeader(title, description) {
    const header = document.createElement('header');
    header.className = 'bg-[#1D201F] py-16 md:py-24 relative overflow-hidden';

    // Grid overlay with subtle animation
    const gridOverlay = document.createElement('div');
    gridOverlay.className = 'absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] animate-[grid-fade-in_1.5s_ease-out]';
    header.appendChild(gridOverlay);

    // Enhanced blurred glow effect
    const glowEffect = document.createElement('div');
    glowEffect.className = 'absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/5 opacity-10 blur-[120px] animate-pulse-slow';
    header.appendChild(glowEffect);

    const container = document.createElement('div');
    container.className = 'container mx-auto px-4 relative';

    const headerContent = document.createElement('div');
    headerContent.className = 'flex flex-col items-center gap-4';

    const badge = document.createElement('span');
    badge.className = 'inline-flex items-center rounded-lg bg-muted/50 px-3 py-1 text-sm font-medium text-white/90 backdrop-blur-sm';
    badge.innerHTML = `
        <span class="flex items-center gap-1">
            <i class="fas fa-sparkles text-primary"></i>
            Developer Tools
        </span>
    `;

    const titleElement = document.createElement('h1');
    titleElement.className = 'text-4xl md:text-5xl font-bold text-white text-center mb-4 animate-slide-up tracking-tight';
    titleElement.textContent = title;

    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'text-lg md:text-xl font-normal text-white/70 text-center max-w-2xl mx-auto animate-slide-up';
    descriptionElement.style.animationDelay = '200ms';
    descriptionElement.textContent = description;

    headerContent.append(badge, titleElement, descriptionElement);
    container.appendChild(headerContent);
    header.appendChild(container);

    return header;
}
