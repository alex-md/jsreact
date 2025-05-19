import{c as a,a as i}from"./footer.CxdUKtjX.js";import{c as n}from"./head.DlN-cGO8.js";n("Web Tools Hub","A collection of free developer tools to simplify your workflow");a();async function c(){const t=document.getElementById("tool-cards-container");if(!t){console.error("Tool cards container not found!");return}try{const r=await fetch("/data/tools.json");if(!r.ok)throw new Error(`HTTP error! status: ${r.status}`);(await r.json()).forEach(e=>{const s=document.createElement("article");s.className="tool-card group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-1";const o=e.new?`
        <div class="absolute -right-2 -top-2 z-10">
          <span class="inline-flex items-center rounded-full bg-primary/90 px-2.5 py-0.5 text-xs font-medium text-white">New</span>
        </div>`:"";s.innerHTML=`
        <div class="relative">
          ${o}
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 rounded-lg bg-${e.color}-100 ring-1 ring-${e.color}-200">
              <i class="${e.icon} text-${e.color}-500 text-xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">${e.title}</h3>
          </div>
          <div class="flex items-center gap-2 mb-6 min-h-[3rem]">
            <i class="${e.icon} text-${e.color}-500 text-lg"></i>
            <p class="text-gray-700">${e.description}</p>
          </div>
          <a href="${e.link}" class="flex justify-center">
            <span class="inline-flex items-center justify-center rounded-lg bg-${e.color}-400/30 text-${e.color}-800 font-semibold shadow-sm px-5 py-2 text-base transition-all hover:bg-${e.color}-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-${e.color}-200">
              Try ${e.title.split(" ")[0]}
              <i class="fas fa-arrow-right ml-2 text-xs opacity-80"></i>
            </span>
          </a>
        </div>
      `,t.appendChild(s)})}catch(r){console.error("Error fetching or processing tool data:",r),t.innerHTML='<p class="text-red-500">Error loading tools. Please try again later.</p>'}}c();i();
