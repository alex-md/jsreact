let e={go:document.getElementById("go"),input:document.getElementById("input"),output:document.getElementById("output"),stats:document.getElementById("stats"),log:document.getElementById("log"),optionsWrapper:document.getElementById("options"),options:{}};function t(){e.go.disabled=!0;let t=document.createElement("span");t.classList.add("spinner-border","spinner-border-sm","small-border","my-auto","mx-auto"),t.setAttribute("role","status"),t.setAttribute("aria-hidden","true"),e.go.innerHTML="",e.go.innerHTML+="Compiling... ",e.go.appendChild(t);let o=function(e,t){e.includes("?")||(e+="?");for(let e in t)Array.isArray(t[e])?t[e].forEach((t=>n(e,t))):n(e,t[e]);function n(t,n){e+=`${t}=${encodeURIComponent(n)}&`}return e.slice(0,-1)}("https://closure-compiler.appspot.com/compile",{js_code:e.input.value,compilation_level:e.options.compilation_level.value,output_format:"json",output_info:["compiled_code","warnings","errors","statistics"],formatting:e.options.formatting.value,language_out:"ECMASCRIPT_2015"}),i=function(t){let o;try{o=JSON.parse(t)}catch(e){return void n("Invalid response from the API.")}if(o.errors&&o.errors.length>0)n("Compilation error: "+o.errors[0].error+" on line "+o.errors[0].lineno);else{if(o.compiledCode&&(e.output.innerHTML=o.compiledCode.replace(/^\s*'use strict';\s*/,"").trim(),e.output.style.color="#000"),o.statistics){let t=o.statistics;e.stats.innerHTML=`Compressed ${t.originalSize} bytes down to ${t.compressedSize} bytes (${Math.round((t.originalSize-t.compressedSize)/t.originalSize*100)}%)`}e.go.innerHTML="Compile!",e.go.disabled=!1,clearInterval(blinkingInterval),e.go.classList.remove("blink"),e.go.classList.add("btn-success")}},l=new XMLHttpRequest;l.onreadystatechange=function(){4===this.readyState&&(200===this.status?i.call(window,l.responseText):n("An error occurred during the request."))},l.open("POST",o),l.withCredentials=!1,l.send()}function n(t){e.output.innerHTML=t,e.output.style.color="#b22b27",e.go.innerHTML="Compile!",e.go.disabled=!1,clearInterval(blinkingInterval),e.go.classList.remove("blink"),e.go.classList.add("btn-danger")}e.go.onclick=function(){e.go.classList.add("blink");let n=setInterval((()=>{e.go.classList.toggle("")}),500);setTimeout((()=>{clearInterval(n)}),5e3),t()},function(e,t,n){let o,i=Object.keys(e);for(let l=0;l<i.length;l++){l%2==0&&((o=document.createElement("div")).classList.add("row"),t.appendChild(o));let s=document.createElement("div");s.classList.add("col-sm-6");let r=document.createElement("div");r.classList.add("input-group");let a=document.createElement("div");a.classList.add("input-group-prepend");let d=document.createElement("span");d.classList.add("input-group-text"),d.innerHTML=e[i[l]].label;let p=document.createElement("select");p.classList.add("form-control"),n[i[l]]=p;let c=e[i[l]];for(let e=0;e<c.names.length;e++){let t=document.createElement("option");t.value=c.values[e],t.innerHTML=c.names[e],p.appendChild(t)}p.value=c.default,a.appendChild(d),r.appendChild(a),r.appendChild(p),s.appendChild(r),o.appendChild(s)}}({compilation_level:{names:["Whitespace","Simple","Advanced"],values:["WHITESPACE_ONLY","SIMPLE_OPTIMIZATIONS","ADVANCED_OPTIMIZATIONS"],default:"SIMPLE_OPTIMIZATIONS",label:"Compilation Level"},formatting:{names:["Pretty print","Print input delimiter"],values:["pretty_print","print_input_delimiter"],default:"pretty_print",label:"Formatting"}},e.optionsWrapper,e.options);
//# sourceMappingURL=minify.ec80b59f.js.map
