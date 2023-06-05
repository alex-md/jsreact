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
        let xhttp;
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

        xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                callback.call(window, xhttp.responseText);
            }
        };
        xhttp.open('POST', url);
        xhttp.withCredentials = false;
        xhttp.send();
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
