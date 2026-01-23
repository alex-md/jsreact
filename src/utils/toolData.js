const TOOL_DATA_URL = '/data/tools.json';

const DEFAULT_CATEGORY_ORDER = ['Text Tools', 'Code Tools', 'Utilities'];

let cachedTools = null;
let toolsPromise = null;

const normalizeTool = (tool) => ({
    ...tool,
    title: tool.title || tool.name || '',
    description: tool.description || '',
    link: tool.link || tool.href || '#',
    category: tool.category || 'Other'
});

export async function fetchTools() {
    if (cachedTools) return cachedTools;
    if (!toolsPromise) {
        toolsPromise = fetch(TOOL_DATA_URL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((tools) => {
                cachedTools = Array.isArray(tools) ? tools.map(normalizeTool) : [];
                return cachedTools;
            })
            .catch((error) => {
                console.error('Error fetching tool data:', error);
                cachedTools = [];
                return cachedTools;
            });
    }
    return toolsPromise;
}

export function groupToolsByCategory(tools, order = DEFAULT_CATEGORY_ORDER) {
    const grouped = tools.reduce((acc, tool) => {
        const category = tool.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(tool);
        return acc;
    }, {});

    const orderedEntries = [];
    order.forEach((category) => {
        if (grouped[category]) {
            orderedEntries.push([category, grouped[category]]);
            delete grouped[category];
        }
    });

    Object.keys(grouped)
        .sort((a, b) => a.localeCompare(b))
        .forEach((category) => {
            orderedEntries.push([category, grouped[category]]);
        });

    return orderedEntries;
}

export { DEFAULT_CATEGORY_ORDER };
