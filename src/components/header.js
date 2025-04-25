export function createHeader(title, description) {
  const header = document.createElement('header');
  header.className = 'header-banner';

  /* --- Animated grid overlay --- */
  const gridOverlay = document.createElement('div');
  gridOverlay.className = 'header-grid';
  header.appendChild(gridOverlay);

  /* --- Floating accent elements --- */
  const accent1 = document.createElement('div');
  accent1.className = 'header-accent';
  header.appendChild(accent1);

  const accent2 = document.createElement('div');
  accent2.className = 'header-accent';
  header.appendChild(accent2);

  const container = document.createElement('div');
  container.className = 'header-content';

  const badge = document.createElement('span');
  badge.className = 'header-badge';
  badge.innerHTML = '<i class="fas fa-sparkles"></i> Developer Tools';

  const h1 = document.createElement('h1');
  h1.className = 'header-title';
  h1.textContent = title;

  const p = document.createElement('p');
  p.className = 'header-description';
  p.textContent = description;

  container.append(badge, h1, p);
  header.appendChild(container);
  return header;
}
