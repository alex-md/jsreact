let DOM = {
    go: document.getElementById("go"),
    input: document.getElementById("input"),
    output: document.getElementById("output"),
    stats: document.getElementById("stats"),
    log: document.getElementById("log"),
    optionsWrapper: document.getElementById("options"),
    options: {}
};
!((options, wrapper, domOptions) => {
    let row, keys = Object.keys(options);
    for (let i = 0; i < keys.length; i++) {
        i % 2 == 0 && ((row = document.createElement("div")).classList.add("row"), wrapper.appendChild(row));
        let col = document.createElement("div");
        col.classList.add("col-sm-6");
        let inputgroup = document.createElement("div");
        inputgroup.classList.add("input-group");
        let inputgroupprepend = document.createElement("div");
        inputgroupprepend.classList.add("input-group-prepend");
        let title = document.createElement("span");
        title.classList.add("input-group-text"), title.innerHTML = options[keys[i]].label;
        let select = document.createElement("select");
        select.classList.add("form-control"), domOptions[keys[i]] = select;
        let selectoptions = options[keys[i]];
        for (let j = 0; j < selectoptions.names.length; j++) {
            let option = document.createElement("option");
            option.value = selectoptions.values[j], option.innerHTML = selectoptions.names[j], select.appendChild(option);
        }
        select.value = selectoptions.default, inputgroupprepend.appendChild(title), inputgroup.appendChild(inputgroupprepend), inputgroup.appendChild(select), col.appendChild(inputgroup), row.appendChild(col);
    }
})({
    compilation_level: {
        names: [
            "Whitespace",
            "Simple",
            "Advanced"
        ],
        values: [
            "WHITESPACE_ONLY",
            "SIMPLE_OPTIMIZATIONS",
            "ADVANCED_OPTIMIZATIONS"
        ],
        default: "SIMPLE_OPTIMIZATIONS",
        label: "Compilation"
    },
    formatting: {
        names: [
            "Pretty print",
            "Print input delimiter"
        ],
        values: [
            "pretty_print",
            "print_input_delimiter"
        ],
        default: "print_input_delimiter",
        label: "Formatting"
    }
}, DOM.optionsWrapper, DOM.options), DOM.go.onclick = function blink() {
    DOM.go.classList.add('blinking');
    const blinkingInterval = setInterval(() => {
        DOM.go.classList.toggle('blink');
    }, 500);

    compile();

    function compile() {
        DOM.go.disabled = true;
        DOM.go.innerHTML = 'Compiling...';

        let url, callback;
        url = ((domain, params) => {
            !domain.includes('?') && (domain += '?');
            let keys = Object.keys(params);
            for (keys of keys)
                if (Array.isArray(params[keys])) {
                    for (let i = 0; i < params[keys].length; i++) addParameter(params[keys][i]);
                } else addParameter(params[keys]);
            return domain = domain.slice(0, -1);
            function addParameter(param) {
                domain += `${keys}=${encodeURIComponent(param)}&`;
            }
        })('https://closure-compiler.appspot.com/compile', {
            js_code: DOM.input.value,
            compilation_level: DOM.options.compilation_level.value,
            output_format: 'json',
            output_info: [
                'compiled_code',
                'warnings',
                'errors',
                'statistics'
            ],
            formatting: DOM.options.formatting.value,
            language_out: 'ECMASCRIPT_2015'
        });

        callback = data => {
            let parsed = JSON.parse(data);
            let keys = Object.keys(parsed);

            for (let i = 0; i < keys.length; i++) {
                switch (keys[i]) {
                    case 'compiledCode':
                        DOM.output.innerHTML = parsed.compiledCode.replace('// Input 0', '').trim();
                        break;
                    case 'statistics':
                        let s = parsed.statistics;
                        DOM.stats.innerHTML = `Compressed ${s.originalSize} bytes down to ${s.compressedSize} bytes (${Math.round((s.originalSize - s.compressedSize) / s.originalSize * 100)}%)`;
                        break;
                    default:
                        console.log(parsed[keys[i]]);
                }
            }

            DOM.go.disabled = false;
            DOM.go.innerHTML = 'Compile!';
            clearInterval(blinkingInterval);
            DOM.go.classList.remove('blinking');
            DOM.go.classList.remove('blink');
        };

        fetch(url, {
            method: 'POST',
            credentials: 'omit'
        })
            .then(response => response.text())
            .then(callback)
            .catch(error => console.error(error));
    }
}


function synchronizeScroll(inputElement, outputElement) {
    function handleScroll() {
        const { scrollTop, scrollHeight, clientHeight } = this;
        const outputScrollHeight = outputElement.scrollHeight;
        const outputClientHeight = outputElement.clientHeight;

        const ratio = scrollTop / (scrollHeight - clientHeight);
        const outputScrollTop = Math.round((outputScrollHeight - outputClientHeight) * ratio);

        outputElement.scrollTop = outputScrollTop;
    }

    inputElement.addEventListener('scroll', handleScroll);
    outputElement.addEventListener('scroll', handleScroll);
}

/* let e = { go: document.getElementById("go"), input: document.getElementById("input"), output: document.getElementById("output"), stats: document.getElementById("stats"), log: document.getElementById("log"), optionsWrapper: document.getElementById("options"), options: {} }; ((e, t, n) => { let o, l = Object.keys(e); for (let i = 0; i < l.length; i++) { i % 2 == 0 && ((o = document.createElement("div")).classList.add("row"), t.appendChild(o)); let s = document.createElement("div"); s.classList.add("col-sm-6"); let a = document.createElement("div"); a.classList.add("input-group"); let d = document.createElement("div"); d.classList.add("input-group-prepend"); let r = document.createElement("span"); r.classList.add("input-group-text"), r.innerHTML = e[l[i]].label; let c = document.createElement("select"); c.classList.add("form-control"), n[l[i]] = c; let p = e[l[i]]; for (let e = 0; e < p.names.length; e++) { let t = document.createElement("option"); t.value = p.values[e], t.innerHTML = p.names[e], c.appendChild(t) } c.value = p.default, d.appendChild(r), a.appendChild(d), a.appendChild(c), s.appendChild(a), o.appendChild(s) } })({ compilation_level: { names: ["Whitespace", "Simple", "Advanced"], values: ["WHITESPACE_ONLY", "SIMPLE_OPTIMIZATIONS", "ADVANCED_OPTIMIZATIONS"], default: "SIMPLE_OPTIMIZATIONS", label: "Compilation" }, formatting: { names: ["Pretty print", "Print input delimiter"], values: ["pretty_print", "print_input_delimiter"], default: "print_input_delimiter", label: "Formatting" } }, e.optionsWrapper, e.options), e.go.onclick = function () { e.go.classList.add("blinking"); const t = setInterval(() => { e.go.classList.toggle("blink") }, 500); !function () { let n, o; e.go.disabled = !0, e.go.innerHTML = "Compiling...", n = ((e, t) => { !e.includes("?") && (e += "?"); let n = Object.keys(t); for (n of n) if (Array.isArray(t[n])) for (let e = 0; e < t[n].length; e++)o(t[n][e]); else o(t[n]); return e = e.slice(0, -1); function o(t) { e += `${n}=${encodeURIComponent(t)}&` } })("https://closure-compiler.appspot.com/compile", { js_code: e.input.value, compilation_level: e.options.compilation_level.value, output_format: "json", output_info: ["compiled_code", "warnings", "errors", "statistics"], formatting: e.options.formatting.value, language_out: "ECMASCRIPT_2015" }), o = n => { let o = JSON.parse(n), l = Object.keys(o); for (let t = 0; t < l.length; t++)switch (l[t]) { case "compiledCode": e.output.innerHTML = o.compiledCode.replace("// Input 0", "").trim(); break; case "statistics": let n = o.statistics; e.stats.innerHTML = `Compressed ${n.originalSize} bytes down to ${n.compressedSize} bytes (${Math.round((n.originalSize - n.compressedSize) / n.originalSize * 100)}%)`; break; default: console.log(o[l[t]]) }e.go.disabled = !1, e.go.innerHTML = "Compile!", clearInterval(t), e.go.classList.remove("blinking"), e.go.classList.remove("blink") }, fetch(n, { method: "POST", credentials: "omit" }).then(e => e.text()).then(o).catch(e => console.error(e)) }() } */
