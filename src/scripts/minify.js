let DOM = {
    go: document.getElementById("go"),
    input: document.getElementById("input"),
    output: document.getElementById("output"),
    stats: document.getElementById("stats"),
    log: document.getElementById("log"),
    optionsWrapper: document.getElementById("options"),
    options: {}
};
function initializeOptions() {
    createOptions({
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
            label: "Compilation Level"
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
            default: "pretty_print",
            label: "Formatting"
        }
    }, DOM.optionsWrapper, DOM.options);
}
function createOptions(options, wrapper, domOptions) {
    let row;
    let keys = Object.keys(options);
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
}
function compile() {
    DOM.go.disabled = true;
    // Create a new span element for the spinner
    let spinner = document.createElement("span");
    spinner.classList.add("spinner-border", "spinner-border-sm", "small-border", "my-auto", "mx-auto");
    spinner.setAttribute("role", "status");
    spinner.setAttribute("aria-hidden", "true");

    // Add the spinner to the button
    DOM.go.innerHTML = "";
    DOM.go.innerHTML += "Compiling... ";
    DOM.go.appendChild(spinner);

    let url = buildURL('https://closure-compiler.appspot.com/compile', {
        js_code: DOM.input.value,
        compilation_level: DOM.options.compilation_level.value,
        output_format: 'json',
        output_info: ['compiled_code', 'warnings', 'errors', 'statistics'],
        formatting: DOM.options.formatting.value,
        language_out: 'ECMASCRIPT_2015'
    });

    let callback = function (data) {
        let parsed;
        try {
            parsed = JSON.parse(data);
        } catch (error) {
            showError("Invalid response from the API.");
            return;
        }

        if (parsed.errors && parsed.errors.length > 0) {
            showError("Compilation error: " + parsed.errors[0].error + " on line " + parsed.errors[0].lineno);
            return;
        }

        if (parsed.compiledCode) {
            DOM.output.innerHTML = parsed.compiledCode.replace(/^\s*'use strict';\s*/, '').trim();
            DOM.output.style.color = '#000';
        }

        if (parsed.statistics) {
            let s = parsed.statistics;
            DOM.stats.innerHTML = `Compressed ${s.originalSize} bytes down to ${s.compressedSize} bytes (${Math.round((s.originalSize - s.compressedSize) / s.originalSize * 100)}%)`;
        }

        // Remove the spinner from the button when compiling is done
        DOM.go.innerHTML = 'Compile!';
        DOM.go.disabled = false;
        clearInterval(blinkingInterval);
        DOM.go.classList.remove('blink');
        DOM.go.classList.add('btn-success');
    };

    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.status === 200) {
                callback.call(window, xhttp.responseText);
            } else {
                showError("An error occurred during the request.");
            }
        }
    };

    xhttp.open('POST', url);
    xhttp.withCredentials = false;
    xhttp.send();
}
function showError(errorMessage) {
    DOM.output.innerHTML = errorMessage;
    DOM.output.style.color = '#b22b27';
    DOM.go.innerHTML = 'Compile!';
    DOM.go.disabled = false;
    clearInterval(blinkingInterval);
    DOM.go.classList.remove('blink');
    DOM.go.classList.add('btn-danger');
}

function buildURL(domain, params) {
    if (!domain.includes('?')) {
        domain += '?';
    }

    for (let key in params) {
        if (Array.isArray(params[key])) {
            params[key].forEach(param => addParameter(key, param));
        } else {
            addParameter(key, params[key]);
        }
    }

    function addParameter(key, param) {
        domain += `${key}=${encodeURIComponent(param)}&`;
    }

    return domain.slice(0, -1);
}

function blink() {
    DOM.go.classList.add('blink');
    let blinkingInterval1 = setInterval(() => {
        DOM.go.classList.toggle('');
    }, 500);

    setTimeout(() => {
        clearInterval(blinkingInterval1);
    }, 5000);

    compile();
}

DOM.go.onclick = blink;
initializeOptions();
