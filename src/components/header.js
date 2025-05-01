export function createHeader(title, description) {
  const header = document.createElement('header');
  header.className = 'header-banner';

  // Grid overlay for visual effect
  const gridOverlay = document.createElement('div');
  gridOverlay.className = 'header-grid animate-fade-in';
  header.appendChild(gridOverlay);

  // Floating accent elements for visual depth
  const accents = [
    { delay: '0s', position: 'top' },
    { delay: '-4s', position: 'bottom' }
  ].forEach((config, index) => {
    const accent = document.createElement('div');
    accent.className = `header-accent animate-float header-accent-${index + 1}`;
    accent.style.animationDelay = config.delay;
    header.appendChild(accent);
  });

  // Content container with glass effect
  const container = document.createElement('div');
  container.className = 'animate-slide-up header-content header-grid';

  // Badge element
  const badge = document.createElement('span');
  badge.className = 'header-badge animate-fade-in';
  badge.innerHTML = '<i class="fas fa-sparkles animate-pulse-slow"></i> Developer Tools';

  // Title element
  const h1 = document.createElement('h1');
  h1.className = 'header-title animate-slide-up';
  h1.textContent = title;

  // Description element
  const p = document.createElement('p');
  p.className = 'header-description animate-slide-up';
  p.style.animationDelay = '200ms';
  p.textContent = description;

  // Assemble the header
  container.append(badge, h1, p);
  header.appendChild(container);

  return header;
}
