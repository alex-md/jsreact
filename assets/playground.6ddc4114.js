import{a as u}from"./footer.38783371.js";import{s as n}from"./toast.bf8b0bbc.js";u();class m{constructor(){this.container=document.getElementById("console"),this.content=document.getElementById("console-content")}log(e,t="log"){const s=document.createElement("div");s.className=`console-line ${t}`,s.textContent=e,this.content.appendChild(s),this.content.scrollTop=this.content.scrollHeight}clear(){this.content.innerHTML=""}toggle(e){e.consoleVisible=!e.consoleVisible,this.container.classList.toggle("visible")}}class h{constructor(e){this.frame=document.getElementById("preview-frame"),this.consoleManager=e,this.setupMessageListener()}setupMessageListener(){window.addEventListener("message",e=>{if(e.data.type==="console"){const t=e.data.args.map(s=>typeof s=="object"?JSON.stringify(s):String(s)).join(" ");this.consoleManager.log(t,e.data.method)}})}update(e){this.consoleManager.clear();let t=this.extractBodyContent(e.html);const s=this.generatePreviewHTML(t,e);this.frame.srcdoc=s}extractBodyContent(e){const t=e.match(/<body[^>]*>([\s\S]*)<\/body>/i);return t?t[1]:e.includes("<!DOCTYPE html>")?e.replace(/<\!DOCTYPE[^>]*>/i,"").replace(/<html[^>]*>/i,"").replace(/<\/html>/i,"").replace(/<head[^>]*>[\s\S]*<\/head>/i,"").replace(/<body[^>]*>/i,"").replace(/<\/body>/i,""):e}generatePreviewHTML(e,t){const s=this.getConsoleScript(),i=this.getLibraryLinks(t.libraries);return`
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    ${i.css}
                    <style>${t.css}</style>
                    ${s}
                    ${i.jsHead}
                </head>
                <body>
                    ${e}
                    ${i.jsBody}
                    <script>${t.js}<\/script>
                </body>
            </html>
        `}getLibraryLinks(e){const t={css:"",jsHead:"",jsBody:""};return!e||e.length===0||e.forEach(s=>{s.links&&s.links.forEach(i=>{if(i.type==="css")t.css+=`<link rel="stylesheet" href="${i.url}">
`;else if(i.type==="js"){const a=i.defer?" defer":"",o=`<script src="${i.url}"${a}><\/script>
`;s.type==="css"||i.defer?t.jsHead+=o:t.jsBody+=o}})}),t}getConsoleScript(){return`
            <script>
            (function() {
                const originalConsole = window.console;
                window.console = {
                    log: (...args) => {
                        originalConsole.log(...args);
                        window.parent.postMessage({ type: 'console', method: 'log', args }, '*');
                    },
                    error: (...args) => {
                        originalConsole.error(...args);
                        window.parent.postMessage({ type: 'console', method: 'error', args }, '*');
                    },
                    warn: (...args) => {
                        originalConsole.warn(...args);
                        window.parent.postMessage({ type: 'console', method: 'warn', args }, '*');
                    }
                };
                window.onerror = function(message, source, lineno, colno, error) {
                    window.parent.postMessage({ 
                        type: 'console', 
                        method: 'error', 
                        args: [message + ' (line: ' + lineno + ')']
                    }, '*');
                    return false;
                };
            })();
            <\/script>
        `}}class y{constructor(e,t){this.state=e,this.previewManager=t,this.editor=null,this.setupEditor(),this.setupEventListeners()}setupEditor(){require.config({paths:{vs:"https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs"}}),require(["vs/editor/editor.main"],()=>{this.editor=monaco.editor.create(document.getElementById("editor"),{value:this.state[this.state.currentTab],language:this.state.currentTab,theme:"vs",automaticLayout:!0,minimap:{enabled:!1},fontSize:14,padding:{top:16},roundedSelection:!0,scrollBeyondLastLine:!1,renderWhitespace:"selection"}),this.setupEditorEvents(),this.previewManager.update(this.state)})}setupEditorEvents(){this.editor.onDidChangeModelContent(()=>{this.state[this.state.currentTab]=this.editor.getValue(),this.state.autoReload&&this.previewManager.update(this.state)})}setupEventListeners(){this.setupTabSwitching(),this.setupAutoReload(),this.setupRunButton(),this.setupClearButton(),this.setupCopyAllButton(),this.setupResizer()}setupTabSwitching(){const e=["html","css","js"];e.forEach(t=>{const s=document.getElementById(`${t}-tab`);s.addEventListener("click",()=>{this.state[this.state.currentTab]=this.editor.getValue(),e.forEach(i=>document.getElementById(`${i}-tab`).classList.remove("active")),s.classList.add("active"),this.state.currentTab=t,this.editor.setValue(this.state[t]),monaco.editor.setModelLanguage(this.editor.getModel(),t==="js"?"javascript":t)})})}setupAutoReload(){const e=document.getElementById("auto-reload");e.addEventListener("change",()=>{this.state.autoReload=e.checked})}setupRunButton(){document.getElementById("run-button").addEventListener("click",()=>{this.state[this.state.currentTab]=this.editor.getValue(),this.previewManager.update(this.state),n("Preview updated")})}setupClearButton(){document.getElementById("clear-button").addEventListener("click",()=>{confirm("Are you sure you want to clear all editors?")&&(this.state.html=`<!DOCTYPE html>
<html>
<head>
  <title>Playground</title>
</head>
<body>

</body>
</html>`,this.state.css="",this.state.js="",this.state.libraries=[],this.editor.setValue(this.state[this.state.currentTab]),this.previewManager.update(this.state),n("All editors cleared"))})}setupCopyAllButton(){document.getElementById("copy-all-button").addEventListener("click",()=>{this.state[this.state.currentTab]=this.editor.getValue();const e=this.generateCombinedCode();navigator.clipboard.writeText(e).then(()=>{n("Code copied to clipboard!")}).catch(t=>{console.error("Failed to copy:",t),n("Failed to copy code")})})}generateCombinedCode(){const e=this.extractBodyContent(this.state.html),t=this.getLibraryLinksHtml();return`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Combined Code</title>
    ${t.css}
    <style>
${this.state.css}
    </style>
    ${t.jsHead}
</head>
<body>
${e}
${t.jsBody}
<script>
${this.state.js}
<\/script>
</body>
</html>`}getLibraryLinksHtml(){const e={css:"",jsHead:"",jsBody:""};return!this.state.libraries||this.state.libraries.length===0||this.state.libraries.forEach(t=>{t.links&&t.links.forEach(s=>{if(s.type==="css")e.css+=`    <link rel="stylesheet" href="${s.url}">
`;else if(s.type==="js"){const i=s.defer?" defer":"",a=`    <script src="${s.url}"${i}><\/script>
`;t.type==="css"||s.defer?e.jsHead+=a:e.jsBody+=a}})}),e}extractBodyContent(e){const t=e.match(/<body[^>]*>([\s\S]*)<\/body>/i);return t?t[1].trim():e.includes("<!DOCTYPE html>")?e.replace(/<\!DOCTYPE[^>]*>/i,"").replace(/<html[^>]*>/i,"").replace(/<\/html>/i,"").replace(/<head[^>]*>[\s\S]*<\/head>/i,"").replace(/<body[^>]*>/i,"").replace(/<\/body>/i,"").trim():e.trim()}setupResizer(){const e=document.getElementById("resizer"),t=document.querySelector(".editor-pane");let s=!1;e.addEventListener("mousedown",()=>{s=!0,e.classList.add("active"),document.body.style.userSelect="none"}),document.addEventListener("mousemove",i=>{if(!s)return;const o=document.querySelector(".editor-container").getBoundingClientRect(),c=i.clientX-o.left;c>=200&&c<=o.width-300&&(t.style.width=`${c}px`,this.editor.layout())}),document.addEventListener("mouseup",()=>{s=!1,e.classList.remove("active"),document.body.style.userSelect=""})}}class b{constructor(e,t){this.state=e,this.previewManager=t,this.libraryDefinitions=this.getLibraryDefinitions(),this.setupEventListeners()}setupEventListeners(){document.querySelectorAll(".library-item").forEach(e=>{e.addEventListener("click",()=>{const t=e.getAttribute("data-library");this.importLibrary(t)})})}importLibrary(e){const t=this.libraryDefinitions[e];if(!t){n(`Library ${e} not found`);return}if(this.state.libraries.some(s=>s.id===e)){n(`${t.name} is already imported`);return}this.state.libraries.push({id:e,...t}),this.previewManager.update(this.state),document.getElementById("library-menu").classList.remove("visible"),n(`${t.name} has been imported`),t.type==="css"&&this.isHtmlEmpty()&&this.addExampleToHTML(e)}isHtmlEmpty(){return this.state.html.includes(`<body>
  <h1>Hello World</h1>
</body>`)}addExampleToHTML(e){var s,i;let t="";switch(e){case"bootstrap":t=`<div class="container mt-5">
  <div class="row">
    <div class="col-md-6">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Bootstrap Card</h5>
          <p class="card-text">This is a basic Bootstrap card example.</p>
          <button class="btn btn-primary">Learn More</button>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="alert alert-success" role="alert">
        Bootstrap has been imported successfully!
      </div>
    </div>
  </div>
</div>`;break;case"tailwind":t=`<div class="container mx-auto px-4 py-8">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-gray-800">Tailwind Card</h2>
      <p class="mt-2 text-gray-600">This is a basic Tailwind CSS card example.</p>
      <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Learn More
      </button>
    </div>
    <div class="bg-green-100 border-l-4 border-green-500 p-4">
      <p class="text-green-700">Tailwind CSS has been imported successfully!</p>
    </div>
  </div>
</div>`;break;case"bulma":t=`<div class="container">
  <div class="columns is-desktop mt-5">
    <div class="column">
      <div class="card">
        <div class="card-content">
          <p class="title is-4">Bulma Card</p>
          <p class="subtitle">This is a basic Bulma card example.</p>
          <button class="button is-primary">Learn More</button>
        </div>
      </div>
    </div>
    <div class="column">
      <div class="notification is-success">
        Bulma has been imported successfully!
      </div>
    </div>
  </div>
</div>`;break;case"daisyui":t=`<div class="container mx-auto p-4">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="card w-full bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">DaisyUI Card</h2>
        <p>This is a basic DaisyUI card example.</p>
        <div class="card-actions justify-end">
          <button class="btn btn-primary">Learn More</button>
        </div>
      </div>
    </div>
    <div class="alert alert-success">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>DaisyUI has been imported successfully!</span>
    </div>
  </div>
</div>`;break;case"materialui":t=`<div class="container">
  <div class="mdc-card demo-card">
    <div class="mdc-card__primary-action">
      <div class="demo-card__primary">
        <h2 class="demo-card__title mdc-typography mdc-typography--headline6">Material Design</h2>
        <h3 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2">This is a basic Material card example.</h3>
      </div>
    </div>
    <div class="mdc-card__actions">
      <button class="mdc-button mdc-card__action mdc-card__action--button">
        <span class="mdc-button__ripple"></span>
        <span class="mdc-button__label">Learn More</span>
      </button>
    </div>
  </div>
</div>`;break}if(t&&(this.state.html=this.state.html.replace(`<body>
  <h1>Hello World</h1>
</body>`,`<body>
  ${t}
</body>`),this.state.currentTab==="html"&&((i=(s=window.monaco)==null?void 0:s.editor)!=null&&i.getModels))){const a=monaco.editor.getModels()[0];a&&a.setValue(this.state.html)}}getLibraryDefinitions(){return{bootstrap:{name:"Bootstrap 5",version:"5.3.2",type:"css",links:[{type:"css",url:"https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"},{type:"js",url:"https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"}]},tailwind:{name:"Tailwind CSS",version:"3.3.5",type:"css",links:[{type:"css",url:"https://cdn.jsdelivr.net/npm/tailwindcss@3.3.5/dist/tailwind.min.css"}]},bulma:{name:"Bulma",version:"0.9.4",type:"css",links:[{type:"css",url:"https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css"}]},daisyui:{name:"DaisyUI",version:"4.4.2",type:"css",links:[{type:"css",url:"https://cdn.jsdelivr.net/npm/tailwindcss@3.3.5/dist/tailwind.min.css"},{type:"css",url:"https://cdn.jsdelivr.net/npm/daisyui@4.4.2/dist/full.css"}]},materialui:{name:"Material Design",version:"3.0.0",type:"css",links:[{type:"css",url:"https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css"},{type:"js",url:"https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js"}]},jquery:{name:"jQuery",version:"3.7.1",type:"js",links:[{type:"js",url:"https://code.jquery.com/jquery-3.7.1.min.js"}]},alpine:{name:"Alpine.js",version:"3.13.0",type:"js",links:[{type:"js",url:"https://cdn.jsdelivr.net/npm/alpinejs@3.13.0/dist/cdn.min.js",defer:!0}]},react:{name:"React",version:"18.2.0",type:"js",links:[{type:"js",url:"https://unpkg.com/react@18.2.0/umd/react.production.min.js"},{type:"js",url:"https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"},{type:"js",url:"https://unpkg.com/babel-standalone@6.26.0/babel.min.js"}]}}}}const d={html:`<!DOCTYPE html>
<html>
<head>
  <title>Playground</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`,css:`body {
  font-family: system-ui, -apple-system, sans-serif;
  padding: 2rem;
}

h1 {
  color: #0ea5e9;
}`,js:`// Your JavaScript code here
console.log("Hello from the playground!");`,currentTab:"html",autoReload:!0,consoleVisible:!1,libraries:[]},l=new m,p=new h(l);new b(d,p);new y(d,p);document.getElementById("toggle-console").addEventListener("click",()=>{l.toggle(d)});document.addEventListener("DOMContentLoaded",()=>{const r=document.getElementById("library-button"),e=document.getElementById("library-menu");r.addEventListener("click",t=>{t.stopPropagation(),e.classList.toggle("visible")}),document.addEventListener("click",()=>{e.classList.remove("visible")}),e.addEventListener("click",t=>{t.stopPropagation()})});
