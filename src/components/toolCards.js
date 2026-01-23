import { fetchTools } from '@utils/toolData.js';

export async function createToolCards() {
    const container = document.getElementById('tool-cards-container');
    if (!container) {
        console.error('Tool cards container not found!');
        return;
    }

    try {
        const tools = await fetchTools();
        if (!tools.length) {
            container.innerHTML = '<p class="text-red-500">Error loading tools. Please try again later.</p>';
            return;
        }

        tools.forEach(tool => {
            const card = document.createElement('article');
            card.className = 'tool-card group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-1';

            const newBadge = tool.new ? `
        <div class="absolute -right-2 -top-2 z-10">
          <span class="inline-flex items-center rounded-full bg-primary/90 px-2.5 py-0.5 text-xs font-medium text-white">New</span>
        </div>` : '';

            card.innerHTML = `
        <div class="relative">
          ${newBadge}
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 rounded-lg bg-${tool.color}-100 ring-1 ring-${tool.color}-200">
              <i class="${tool.icon} text-${tool.color}-500 text-xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">${tool.title}</h3>
          </div>
          <div class="flex items-center gap-2 mb-6 min-h-[3rem]">
            <i class="${tool.icon} text-${tool.color}-500 text-lg"></i>
            <p class="text-gray-700">${tool.description}</p>
          </div>
          <a href="${tool.link}" class="flex justify-center">
            <span class="inline-flex items-center justify-center rounded-lg bg-${tool.color}-400/30 text-${tool.color}-800 font-semibold shadow-sm px-5 py-2 text-base transition-all hover:bg-${tool.color}-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-${tool.color}-200">
              Try ${tool.title.split(' ')[0]}
              <i class="fas fa-arrow-right ml-2 text-xs opacity-80"></i>
            </span>
          </a>
        </div>
      `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error fetching or processing tool data:', error);
        container.innerHTML = '<p class="text-red-500">Error loading tools. Please try again later.</p>';
    }
}
