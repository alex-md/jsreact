export function createHeader(title, description) {
  const header = document.createElement('header');
  header.className = 'header-banner';

  const container = document.createElement('div');
  container.className = 'header-content';

  const badge = document.createElement('span');
  badge.className = 'header-badge';
  badge.textContent = 'JSreact / Browser tools';

  const heading = document.createElement('h1');
  heading.className = 'header-title';
  heading.textContent = title;

  const copy = document.createElement('p');
  copy.className = 'header-description';
  copy.textContent = description;

  container.append(badge, heading, copy);
  header.appendChild(container);
  return header;
}
