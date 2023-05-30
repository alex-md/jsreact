
function getURL(domain, params) {
    if (domain.indexOf("?") === -1) domain += "?";
    let keys = Object.keys(params);
    for (key of keys) {
        if (Array.isArray(params[key])) {
            for (let i = 0; i < params[key].length; i++) {
                addParameter(params[key][i]);
            }
        } else {
            addParameter(params[key]);
        }
    }
    domain = domain.slice(0, -1);
    return domain;
    function addParameter(param) {
        domain += `${key}=${encodeURIComponent(param)}&`;
    }
}
function getData(url, callback) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            callback.call(window, xhttp.responseText);
        }
    };
    xhttp.open("POST", url);
    xhttp.withCredentials = false;
    xhttp.send();
}
let DOM = {
    go: document.getElementById("go"),
    input: document.getElementById("input"),
    output: document.getElementById("output"),
    stats: document.getElementById("stats"),
    log: document.getElementById("log"),
    optionsWrapper: document.getElementById("options"),
    options: {}
};
const options = {
    compilation_level: {
        names: ["Whitespace", "Simple", "Advanced"],
        values: ["WHITESPACE_ONLY", "SIMPLE_OPTIMIZATIONS", "ADVANCED_OPTIMIZATIONS"],
        default: "SIMPLE_OPTIMIZATIONS",
        label: "Compilation"
    },
    formatting: {
        names: ["Pretty print", "Print input delimiter"],
        values: ["pretty_print", "print_input_delimiter"],
        default: "print_input_delimiter",
        label: "Formatting"
    },
};
function addOptionsToWrapper(options, wrapper, domOptions) {
    let keys = Object.keys(options);
    let row;
    for (let i = 0; i < keys.length; i++) {
        if (i % 2 === 0) {
            row = document.createElement("div");
            row.classList.add("row");
            wrapper.appendChild(row);
        }
        let col = document.createElement("div");
        col.classList.add("col-sm-6");
        let inputgroup = document.createElement("div");
        inputgroup.classList.add("input-group");
        let inputgroupprepend = document.createElement("div");
        inputgroupprepend.classList.add("input-group-prepend");
        let title = document.createElement("span");
        title.classList.add("input-group-text");
        title.innerHTML = options[keys[i]].label;
        let select = document.createElement("select");
        select.classList.add("form-control");
        domOptions[keys[i]] = select;
        let selectoptions = options[keys[i]];
        for (let j = 0; j < selectoptions.names.length; j++) {
            let option = document.createElement("option");
            option.value = selectoptions.values[j];
            option.innerHTML = selectoptions.names[j];
            select.appendChild(option);
        }
        select.value = selectoptions.default;
        inputgroupprepend.appendChild(title);
        inputgroup.appendChild(inputgroupprepend);
        inputgroup.appendChild(select);
        col.appendChild(inputgroup);
        row.appendChild(col);
    }
}
addOptionsToWrapper(options, DOM.optionsWrapper, DOM.options);
DOM.go.onclick = function () {
    this.disabled = true;
    this.innerHTML = "Compiling...";
    getData(
        getURL("https://closure-compiler.appspot.com/compile", {
            js_code: DOM.input.value,
            compilation_level: DOM.options.compilation_level.value,
            output_format: "json",
            output_info: ["compiled_code", "warnings", "errors", "statistics"],
            formatting: DOM.options.formatting.value,
            language: "ECMASCRIPT6_STRICT",
            language_out: "ECMASCRIPT6"
        }),
        function (data) {
            let parsed = JSON.parse(data);
            let keys = Object.keys(parsed);
            for (let i = 0; i < keys.length; i++) {
                switch (keys[i]) {
                    case "compiledCode":
                        DOM.output.innerHTML = parsed.compiledCode;
                        break;
                    case "statistics":
                        let s = parsed.statistics;
                        DOM.stats.innerHTML = `Compressed ${s.originalSize} bytes down to ${s.compressedSize
                            } bytes (${Math.round(
                                ((s.originalSize - s.compressedSize) / s.originalSize) * 100
                            )}%) in ${s.compileTime} ms`;
                        break;
                    default:
                        console.log(parsed[keys[i]]);
                        break;
                }
            }
            DOM.go.disabled = false;
            DOM.go.innerHTML = "Compile !";
        }
    );
};
