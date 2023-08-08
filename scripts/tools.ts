function createToolCard(title: string, description: string, link: string, buttonText: string): HTMLDivElement {
  const card: HTMLDivElement = document.createElement('div');
  card.className = 'col-md-6 col-lg-4 mb-4';

  const cardBody: HTMLDivElement = document.createElement('div');
  cardBody.className = 'card card-body mx-auto h-100 d-flex flex-column';

  const cardTitle: HTMLHeadingElement = document.createElement('h5');
  cardTitle.className = 'card-title';
  cardTitle.textContent = title;

  const cardText: HTMLParagraphElement = document.createElement('p');
  cardText.className = 'card-text';
  cardText.textContent = description;

  const cardButton: HTMLAnchorElement = document.createElement('a');
  cardButton.className = 'btn btn-primary w-50 align-self-center';
  cardButton.href = link;
  cardButton.textContent = `${buttonText}`;

  cardBody.appendChild(cardTitle);
  cardBody.appendChild(cardText);
  cardBody.appendChild(cardButton);

  card.appendChild(cardBody);

  return card;
}

function createToolList(title: string, description: string, tools: { title: string, description: string, link: string, buttonText: string }[]): HTMLDivElement {
  const container: HTMLDivElement = document.createElement('div');
  container.className = 'container';

  const heading: HTMLHeadingElement = document.createElement('h1');
  heading.className = 'mt-5 text-center';
  heading.textContent = title;

  const subheading: HTMLParagraphElement = document.createElement('p');
  subheading.className = 'text-center lead';
  subheading.textContent = description;

  heading.appendChild(subheading);
  container.appendChild(heading);

  const row: HTMLDivElement = document.createElement('div');
  row.className = 'row mt-5';

  const fragment: DocumentFragment = document.createDocumentFragment();

  for (const tool of tools) {
    const card: HTMLDivElement = createToolCard(tool.title, tool.description, tool.link, tool.buttonText);
    card.querySelector('.card')!.classList.add('shadow', 'rounded');
    fragment.appendChild(card);
  }

  row.appendChild(fragment);
  container.appendChild(row);

  return container;
}

const tools: { title: string, description: string, link: string, buttonText: string }[] = [
  {
    title: 'Minify Code',
    description: 'Minify your JavaScript code using the Google Closure Compiler',
    link: './minify.html',
    buttonText: 'Minify'
  },
  {
    title: 'Clean Text',
    description: 'Clean text by removing line breaks, removing punctuation, and more',
    link: './clean.html',
    buttonText: 'Clean'
  },
  {
    title: 'Diff Checker',
    description: 'Compare two pieces of text, and highlight the differences between them',
    link: './diff.html',
    buttonText: 'Compare'
  },
  {
    title: 'Talk to GPT',
    description: 'Talk to GPT-4 from OpenAI',
    link: './chat.html',
    buttonText: 'Chat'
  }
];

const toolList: HTMLDivElement = createToolList('Developer Tools', 'Collection of web developer tools for minifying code, cleaning text, comparing diffs, and more.', tools);

document.body.appendChild(toolList);
