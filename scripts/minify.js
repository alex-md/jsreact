let DOM = {
    go: document.getElementById("go"),
    input: document.getElementById("input"),
    output: document.getElementById("output"),
    stats: document.getElementById("stats"),
    log: document.getElementById("log"),
    optionsWrapper: document.getElementById("options"),
    options: {}
};
!function (options, wrapper, domOptions) {
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
}({
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
}, DOM.optionsWrapper, DOM.options), DOM.go.onclick = function () {
    var url, callback;
    let xhttp;
    this.disabled = !0, this.innerHTML = "Compiling...", url = function (domain, params) {
        -1 === domain.indexOf("?") && (domain += "?");
        let keys = Object.keys(params);
        for (keys of keys) if (Array.isArray(params[keys])) for (let i = 0; i < params[keys].length; i++)addParameter(params[keys][i]);
        else addParameter(params[keys]);
        return domain = domain.slice(0, -1);
        function addParameter(param) {
            domain += `${keys}=${encodeURIComponent(param)}&`;
        }
    }("https://closure-compiler.appspot.com/compile", {
        js_code: DOM.input.value,
        compilation_level: DOM.options.compilation_level.value,
        output_format: "json",
        output_info: [
            "compiled_code",
            "warnings",
            "errors",
            "statistics"
        ],
        formatting: DOM.options.formatting.value,
        language: "ECMASCRIPT5_STRICT",
        language_out: "ECMASCRIPT6"
    }), callback = function (data) {
        let parsed = JSON.parse(data), keys = Object.keys(parsed);
        for (let i = 0; i < keys.length; i++)switch (keys[i]) {
            case "compiledCode":
                DOM.output.innerHTML = parsed.compiledCode.replace("// Input 0", "").trim();
                break;
            case "statistics":
                let s = parsed.statistics;
                DOM.stats.innerHTML = `Compressed ${s.originalSize} bytes down to ${s.compressedSize} bytes (${Math.round((s.originalSize - s.compressedSize) / s.originalSize * 100)}%)`;
                break;
            default:
                console.log(parsed[keys[i]]);
        }
        DOM.go.disabled = !1, DOM.go.innerHTML = "Compile !";
    }, (xhttp = new XMLHttpRequest()).onreadystatechange = function () {
        4 == this.readyState && 200 == this.status && callback.call(window, xhttp.responseText);
    }, xhttp.open("POST", url), xhttp.withCredentials = !1, xhttp.send();
};
