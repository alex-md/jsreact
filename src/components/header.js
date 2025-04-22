export function createHeader(title, description) {
    const header = document.createElement('header');
    header.className = `
    relative overflow-hidden isolate
    bg-[rgba(6,12,20,0.65)] dark:bg-[rgba(0,0,0,0.55)]
    backdrop-blur-xl
    py-20 md:py-28
  `.trim();

    /* --- subtle animated grid --- */
    const gridOverlay = document.createElement('div');
    gridOverlay.className = `
    pointer-events-none absolute inset-0
    bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),
        linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]
    dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),
        linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]
    bg-[size:24px_24px]
    animate-[grid-fade-in_1.8s_ease-out_forwards]
  `.trim();
    header.appendChild(gridOverlay);

    /* --- pulsating nebula glow --- */
    const glow = document.createElement('div');
    glow.className = `
    absolute -z-10 left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2
    rounded-full
    bg-[radial-gradient(circle_at_center,_var(--accent,theme(colors.violet.400))_0%,_transparent_70%)]
    opacity-20 blur-[160px]
    animate-[pulse_6s_ease-in-out_infinite]
  `.trim();
    header.appendChild(glow);

    const container = document.createElement('div');
    container.className = 'relative mx-auto max-w-5xl px-6 text-center flex flex-col items-center gap-6';

    const badge = document.createElement('span');
    badge.className = `
    inline-flex items-center gap-2 rounded-lg
    bg-white/5 dark:bg-white/7
    ring-1 ring-inset ring-white/10
    px-4 py-1.5 text-sm font-medium text-white/90
    backdrop-blur-sm
  `.trim();
    badge.innerHTML = `<i class="fas fa-sparkles text-[var(--accent,theme(colors.violet.400))]"></i> Developer&nbsp;Tools`;

    const h1 = document.createElement('h1');
    h1.className = `
    text-4xl md:text-6xl font-extrabold tracking-tight
    text-white drop-shadow-sm animate-slide-up
  `.trim();
    h1.textContent = title;

    const p = document.createElement('p');
    p.className = `
    max-w-2xl mx-auto
    text-lg md:text-xl text-white/80
    animate-slide-up
    [animation-delay:200ms]
  `.trim();
    p.textContent = description;

    container.append(badge, h1, p);
    header.appendChild(container);
    return header;
}

/* Note: Move the CSS below to a separate CSS file and import it in your HTML or JS entry file */
/*
:root {
    --accent: #a855f7; 
}

@keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.25; }
    50% { transform: scale(1.15); opacity: 0.35; }
}
*/
