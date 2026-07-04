export const VIEW_COUNT_ENDPOINT = 'https://views.vs.workers.dev';

export async function fetchViewCount(): Promise<number> {
  const response = await fetch(VIEW_COUNT_ENDPOINT, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`View count request failed with ${response.status}`);
  }

  const text = await response.text();
  const count = Number.parseInt(text.replace(/,/g, '').trim(), 10);

  if (!Number.isFinite(count)) {
    throw new Error(`View count response was not numeric: ${text}`);
  }

  return count;
}

export async function fetchFormattedViewCount(): Promise<string> {
  const count = await fetchViewCount();
  return count.toLocaleString();
}
