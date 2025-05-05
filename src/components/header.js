export function createHeader(title, description) {
  const header = document.createElement('header');
  header.className = 'header-banner';

  // Grid overlay for visual effect
  const gridOverlay = document.createElement('div');
  gridOverlay.className = 'header-grid transition-opacity';
  header.appendChild(gridOverlay);

  // Floating accent elements for visual depth
  const accents = [
    { delay: '0s', position: 'top' },
    { delay: '400ms', position: 'bottom' }
  ].forEach((config, index) => {
    const accent = document.createElement('div');
    accent.className = `header-accent header-accent-${index + 1}`;
    accent.style.animationDelay = config.delay;
    accent.style.transitionDelay = config.delay;
    header.appendChild(accent);
  });

  // Content container with glass effect
  const container = document.createElement('div');
  container.className = 'header-content header-grid transition-transform';
  container.style.transitionDuration = 'var(--motion-duration-medium)';

  // Badge element
  const badge = document.createElement('span');
  badge.className = 'header-badge transition-opacity';
  badge.style.transitionDelay = 'var(--motion-delay-small)';
  badge.innerHTML = '<i class="fas fa-sparkles loading-pulse"></i> Developer Tools';

  // Title element - using heading-1 class from our typography system
  const h1 = document.createElement('h1');
  h1.className = 'header-title heading-1 transition-transform';
  h1.textContent = title;

  // Description element - using body-lg class from our typography system
  const p = document.createElement('p');
  p.className = 'header-description body-lg transition-transform';
  p.style.transitionDelay = 'var(--motion-delay-medium)';
  p.textContent = description;

  // Assemble the header
  container.append(badge, h1, p);
  header.appendChild(container);

  return header;
}
