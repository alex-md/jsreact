function c(){const o=document.getElementById("toast-container");if(o)return o;const t=document.createElement("div");return t.id="toast-container",t.className="fixed bottom-4 right-4 z-50 flex flex-col gap-2",document.body.appendChild(t),t}function l(o,t="info"){const s=c(),e=document.createElement("div");e.className=`
        flex items-center gap-3 min-w-[320px] p-4 rounded-lg border shadow-lg
        transform translate-y-2 opacity-0 transition-all duration-300
        bg-background border-border
    `;const a={info:{icon:'<i class="fas fa-info-circle text-blue-500"></i>',additionalClasses:"border-blue-100 dark:border-blue-900/50"},success:{icon:'<i class="fas fa-check-circle text-green-500"></i>',additionalClasses:"border-green-100 dark:border-green-900/50"},warning:{icon:'<i class="fas fa-exclamation-circle text-yellow-500"></i>',additionalClasses:"border-yellow-100 dark:border-yellow-900/50"},error:{icon:'<i class="fas fa-times-circle text-red-500"></i>',additionalClasses:"border-red-100 dark:border-red-900/50"}},{icon:r,additionalClasses:n}=a[t]||a.info;e.className+=" "+n,e.innerHTML=`
        ${r}
        <p class="text-sm text-foreground flex-1">${o}</p>
        <button class="text-muted-foreground hover:text-foreground transition-colors">
            <i class="fas fa-times"></i>
        </button>
    `;const i=e.querySelector("button");i.onclick=()=>{e.classList.add("opacity-0","translate-y-2"),setTimeout(()=>e.remove(),300)},s.appendChild(e),requestAnimationFrame(()=>{e.classList.remove("opacity-0","translate-y-2")}),setTimeout(()=>{e.parentElement&&(e.classList.add("opacity-0","translate-y-2"),setTimeout(()=>e.remove(),300))},5e3)}export{l as s};
