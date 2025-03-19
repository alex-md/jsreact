import{a as p}from"./footer.b7e959e3.js";import{s as i}from"./toast.bf8b0bbc.js";p();class y{constructor(){this.previewFrame=document.getElementById("preview-frame")}update(e){const t=this.getLibraryLinksHtml(e.libraries),n=`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                ${t.css}
                <style>${e.css}</style>
                ${t.jsHead}
            </head>
            <body>
                ${e.html}
                ${t.jsBody}
                <script>
                    ${this.wrapConsoleLog()}
                    ${e.js}
                <\/script>
            </body>
            </html>
        `;this.previewFrame.srcdoc=n}getLibraryLinksHtml(e){const t={css:"",jsHead:"",jsBody:""};return e&&e.forEach(n=>{n.links&&n.links.forEach(s=>{if(s.type==="css")t.css+=`<link rel="stylesheet" href="${s.url}">
`;else if(s.type==="js"){const r=s.defer?" defer":"",o=`<script src="${s.url}"${r}><\/script>
`;n.type==="css"||s.defer?t.jsHead+=o:t.jsBody+=o}})}),t}wrapConsoleLog(){return`
            const consoleOutput = document.getElementById('console-content');
            function logToConsole(message, type = 'log') {
                const line = document.createElement('div');
                line.classList.add('console-line', type);
                line.textContent = message;
                consoleOutput.appendChild(line);
                consoleOutput.scrollTop = consoleOutput.scrollHeight;
                console[type](message);
            }

            const originalConsoleLog = console.log;
            const originalConsoleWarn = console.warn;
            const originalConsoleError = console.error;
            const originalConsoleInfo = console.info;

            console.log = function() {
                logToConsole(Array.from(arguments).join(' '), 'log');
            };
            console.warn = function() {
                logToConsole(Array.from(arguments).join(' '), 'warn');
            };
            console.error = function() {
                logToConsole(Array.from(arguments).join(' '), 'error');
            };
            console.info = function() {
                logToConsole(Array.from(arguments).join(' '), 'info');
            };

            window.onerror = function(message, source, lineno, colno, error) {
                logToConsole(\`\${message} at \${source}:\${lineno}:\${colno}\`, 'error');
            };
        `}}class g{constructor(e){this.state=e,this.setupLibraryMenu(),this.setupCustomCdnInput(),this.state.libraries&&this.state.libraries.length&&this.state.libraries.forEach(t=>this.addLibrary(t,!1))}setupLibraryMenu(){const e=document.getElementById("library-button"),t=document.getElementById("library-menu");e.addEventListener("click",()=>{t.classList.toggle("visible")}),document.addEventListener("click",s=>{!e.contains(s.target)&&!t.contains(s.target)&&t.classList.remove("visible")}),document.querySelectorAll(".library-item").forEach(s=>{s.addEventListener("click",()=>{const r=s.dataset.library,o=this.getLibraryData(r);o&&this.addLibrary(o),t.classList.remove("visible")})})}setupCustomCdnInput(){document.getElementById("add-cdn-library").addEventListener("click",()=>{const t=document.getElementById("cdn-url-input").value.trim(),n=document.getElementById("cdn-type").value;if(!t){i("Please enter a CDN URL.","error");return}try{new URL(t)}catch{i("Invalid URL. Please enter a valid URL.","error");return}if(this.state.libraries.some(r=>r.links&&r.links.some(o=>o.url===t))){i("This library is already added.","error");return}const s={name:t.split("/").pop(),type:n,links:[{url:t,type:n,defer:!1}]};this.addLibrary(s),document.getElementById("cdn-url-input").value=""})}addLibrary(e,t=!0){if(this.state.libraries.some(s=>s.links&&e.links&&s.links.some(r=>e.links.some(o=>o.url===r.url)))){i("This library is already added.","error");return}this.state.libraries.push(e),t&&i(`${e.name} added successfully!`),this.previewManager.update(this.state)}getLibraryData(e){return{bootstrap:{name:"Bootstrap",type:"css",links:[{type:"css",url:"https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"},{type:"js",url:"https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js",defer:!0}]},tailwind:{name:"Tailwind CSS",type:"css",links:[{type:"css",url:"https://cdn.jsdelivr.net/npm/tailwindcss@3.3.5/dist/tailwind.min.css"}]},bulma:{name:"Bulma",type:"css",links:[{type:"css",url:"https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css"}]},daisyui:{name:"DaisyUI",type:"css",links:[{type:"css",url:"https://cdn.jsdelivr.net/npm/daisyui@4.4.2/dist/full.min.css"}]},materialui:{name:"Material UI",type:"css",links:[{type:"css",url:"https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"},{type:"css",url:"https://cdn.jsdelivr.net/npm/@mui/material@5.15.7/umd/material-ui.production.min.css"},{type:"js",url:"https://cdn.jsdelivr.net/npm/@mui/material@5.15.7/umd/material-ui.production.min.js",defer:!0}]},jquery:{name:"jQuery",type:"js",links:[{type:"js",url:"https://code.jquery.com/jquery-3.7.1.min.js"}]},alpine:{name:"Alpine.js",type:"js",links:[{type:"js",url:"https://cdn.jsdelivr.net/npm/alpinejs@3.13.0/dist/cdn.min.js",defer:!0}]},react:{name:"React",type:"js",links:[{type:"js",url:"https://unpkg.com/react@18/umd/react.development.js"},{type:"js",url:"https://unpkg.com/react-dom@18/umd/react-dom.development.js"}]}}[e]}}class b{constructor(){this.consoleContainer=document.getElementById("console"),this.consoleContent=document.getElementById("console-content"),this.toggleButton=document.getElementById("toggle-console"),this.toggleButton.addEventListener("click",()=>this.toggleConsole())}toggleConsole(){this.consoleContainer.classList.toggle("visible"),this.consoleContainer.classList.contains("visible")&&(this.consoleContent.scrollTop=this.consoleContent.scrollHeight)}}class f{constructor(e,t){this.state=e,this.previewManager=t,this.editor=null,this.setupEditor(),this.setupEventListeners()}setupEditor(){require.config({paths:{vs:"https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs"}}),require(["vs/editor/editor.main"],()=>{monaco.editor.defineTheme("vscode-dark",{base:"vs-dark",inherit:!0,rules:[{token:"comment",foreground:"6A9955"},{token:"keyword",foreground:"569CD6"},{token:"string",foreground:"CE9178"},{token:"number",foreground:"B5CEA8"},{token:"identifier",foreground:"9CDCFE"}],colors:{"editor.background":"#1e1e1e","editor.foreground":"#d4d4d4","editorCursor.foreground":"#d4d4d4","editor.lineHighlightBackground":"#2d2d2d","editorLineNumber.foreground":"#858585","editorLineNumber.activeForeground":"#c6c6c6","editor.selectionBackground":"#264f78","editor.inactiveSelectionBackground":"#3a3d41","editorIndentGuide.background":"#404040","editorIndentGuide.activeBackground":"#707070","editor.selectionHighlightBackground":"#add6ff26","editor.wordHighlightBackground":"#575757b8","editor.wordHighlightStrongBackground":"#004972b8","editorBracketMatch.background":"#0064001a","editorBracketMatch.border":"#888888"}}),this.editor=monaco.editor.create(document.getElementById("editor"),{value:this.state[this.state.currentTab],language:this.state.currentTab==="js"?"javascript":this.state.currentTab,theme:"vscode-dark",automaticLayout:!0,minimap:{enabled:!0,scale:2,renderCharacters:!1},fontSize:14,lineHeight:21,padding:{top:16},folding:!0,foldingStrategy:"indentation",renderLineHighlight:"all",roundedSelection:!1,scrollBeyondLastLine:!1,wordWrap:"on","bracketPairColorization.enabled":!0,renderWhitespace:"selection",guides:{bracketPairs:!0,indentation:!0},scrollbar:{useShadows:!1,verticalScrollbarSize:12,horizontalScrollbarSize:12,vertical:"visible",horizontal:"visible"}}),monaco.editor.setTheme("vscode-dark"),this.setupEditorEvents(),this.previewManager.update(this.state),setTimeout(()=>{this.editor.layout()},100)})}setupEditorEvents(){this.editor.onDidChangeModelContent(()=>{this.state[this.state.currentTab]=this.editor.getValue(),this.state.autoReload&&this.previewManager.update(this.state)})}setupEventListeners(){this.setupTabSwitching(),this.setupAutoReload(),this.setupRunButton(),this.setupClearButton(),this.setupCopyAllButton(),this.setupResizer()}setupTabSwitching(){const e=["html","css","js"];e.forEach(t=>{const n=document.getElementById(`${t}-tab`);n.addEventListener("click",()=>{this.state[this.state.currentTab]=this.editor.getValue(),e.forEach(s=>document.getElementById(`${s}-tab`).classList.remove("active")),n.classList.add("active"),this.state.currentTab=t,this.editor.setValue(this.state[t]),monaco.editor.setModelLanguage(this.editor.getModel(),t==="js"?"javascript":t)})})}setupAutoReload(){const e=document.getElementById("auto-reload");e.addEventListener("change",()=>{this.state.autoReload=e.checked})}setupRunButton(){document.getElementById("run-button").addEventListener("click",()=>{this.state[this.state.currentTab]=this.editor.getValue(),this.previewManager.update(this.state),i("Preview updated")})}setupClearButton(){document.getElementById("clear-button").addEventListener("click",()=>{confirm("Are you sure you want to clear all editors?")&&(this.state.html=`<!DOCTYPE html>
<html>
<head>
  <title>Playground</title>
</head>
<body>

</body>
</html>`,this.state.css="",this.state.js="",this.state.libraries=[],this.editor.setValue(this.state[this.state.currentTab]),this.previewManager.update(this.state),i("All editors cleared"))})}setupCopyAllButton(){document.getElementById("copy-all-button").addEventListener("click",()=>{this.state[this.state.currentTab]=this.editor.getValue();const e=this.generateCombinedCode();navigator.clipboard.writeText(e).then(()=>{i("Code copied to clipboard!")}).catch(t=>{console.error("Failed to copy:",t),i("Failed to copy code")})})}generateCombinedCode(){const e=this.extractBodyContent(this.state.html),t=this.getLibraryLinksHtml();return`<!DOCTYPE html>
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
</html>`}getLibraryLinksHtml(){const e={css:"",jsHead:"",jsBody:""};return!this.state.libraries||this.state.libraries.length===0||this.state.libraries.forEach(t=>{t.links&&t.links.forEach(n=>{if(n.type==="css")e.css+=`    <link rel="stylesheet" href="${n.url}">
`;else if(n.type==="js"){const s=n.defer?" defer":"",r=`    <script src="${n.url}"${s}><\/script>
`;t.type==="css"||n.defer?e.jsHead+=r:e.jsBody+=r}})}),e}extractBodyContent(e){const t=e.match(/<body[^>]*>([\s\S]*)<\/body>/i);return t?t[1].trim():e.includes("<!DOCTYPE html>")?e.replace(/<\!DOCTYPE[^>]*>/i,"").replace(/<html[^>]*>/i,"").replace(/<\/html>/i,"").replace(/<head[^>]*>[\s\S]*<\/head>/i,"").replace(/<body[^>]*>/i,"").replace(/<\/body>/i,"").trim():e.trim()}setupResizer(){const e=document.getElementById("resizer"),t=document.querySelector(".editor-pane"),n=document.querySelector(".preview-pane");let s=!1;const r=l=>{s=!0,e.classList.add("active"),document.body.style.userSelect="none",document.body.style.cursor="col-resize",l.preventDefault()},o=()=>{s&&(s=!1,e.classList.remove("active"),document.body.style.userSelect="",document.body.style.cursor="",this.editor.layout())},u=l=>{if(!s)return;const d=document.querySelector(".editor-container").getBoundingClientRect();if(l.clientX<d.left||l.clientX>d.right){o();return}let c=l.clientX-d.left;const m=200,h=d.width-300;c=Math.max(m,Math.min(c,h)),requestAnimationFrame(()=>{t.style.width=`${c}px`,t.style.flex="0 0 auto",n.style.flex="1 1 auto",this.editor.layout()})};return e.addEventListener("mousedown",r),document.addEventListener("mousemove",u),document.addEventListener("mouseup",o),document.addEventListener("mouseleave",o),()=>{document.removeEventListener("mousemove",u),document.removeEventListener("mouseup",o),document.removeEventListener("mouseleave",o),e.removeEventListener("mousedown",r)}}}document.addEventListener("DOMContentLoaded",()=>{const a={html:`<!DOCTYPE html>
<html>
<head>
  <title>Playground</title>
</head>
<body>

</body>
</html>`,css:"",js:"",currentTab:"html",autoReload:!0,libraries:[]},e=new y,t=new g(a);new f(a,e),new b,t.previewManager=e});
