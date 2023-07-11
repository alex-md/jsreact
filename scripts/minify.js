// Define an object that contains references to various DOM elements
let DOM = {
    go: document.getElementById("go"), // The "Compile" button
    input: document.getElementById("input"), // The input code textarea
    output: document.getElementById("output"), // The output code textarea
    stats: document.getElementById("stats"), // The statistics textarea
    log: document.getElementById("log"), // The log textarea
    optionsWrapper: document.getElementById("options"), // The wrapper for the options
    options: {} // An object that will contain the DOM elements for the options
};

/**
 * Initializes the options object with the compilation level and formatting options.
 * Calls createOptions to create the user interface for the options.
 */
function initializeOptions() {
    let options = {
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
    };
    // Create the user interface for the options
    createOptions(options, DOM.optionsWrapper, DOM.options);
}

/**
 * Creates the options for the user interface based on the options object passed in.
 * @param {Object} options - The options object containing the compilation level and formatting options.
 * @param {HTMLElement} wrapper - The HTML element that will contain the options.
 * @param {Object} domOptions - The object that will contain the DOM elements for the options.
 */
function createOptions(options, wrapper, domOptions) {
    let row;
    let keys = Object.keys(options);
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
function compile() {
    // Disable the "Compile" button and display "Compiling..." text
    DOM.go.disabled = true;

    DOM.go.innerHTML = "Compiling...";

    // Build the URL for the Closure Compiler API
    let url = buildURL('https://closure-compiler.appspot.com/compile', {
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
        language_out: 'ECMASCRIPT_2020'
    });

    // Callback function to handle the response from the API
    let callback = function (data) {
        // Parse the JSON response
        let parsed;
        try {
            parsed = JSON.parse(data);
        } catch (error) {
            showError("Invalid response from the API.");
            return;
        }

        let keys = Object.keys(parsed);

        // Check if there are any compilation errors
        if (parsed.errors && parsed.errors.length > 0) {
            showError("Compilation error: " + parsed.errors[0]['error'] + " on line " + parsed.errors[0]['lineno']);
            return;
        }

        // Iterate over the keys in the response object
        for (let i = 0; i < keys.length; i++) {
            switch (keys[i]) {
                case 'compiledCode':
                    // Display the compiled code in the output element
                    // Trim the leading text 'use strict' and any whitespace
                    DOM.output.innerHTML = parsed.compiledCode.replace(/^\s*'use strict';\s*/, '').trim();
                    DOM.output.style.color = '#000'; // Set text color to black
                    break;
                case 'statistics':
                    // Display statistics about the compression
                    let s = parsed.statistics;
                    DOM.stats.innerHTML = `Compressed ${s.originalSize} bytes down to ${s.compressedSize} bytes (${Math.round((s.originalSize - s.compressedSize) / s.originalSize * 100)}%)`;
                    break;
                default:
                    // Log any other keys in the response object
                    console.log(parsed[keys[i]]);
            }
        }

        // Enable the "Go" button, restore its original text and appearance
        DOM.go.disabled = false;
        DOM.go.innerHTML = 'Compile!';
        clearInterval(blinkingInterval);
        DOM.go.classList.remove('blink');
        DOM.go.classList.add('btn-success');
    };

    // Create a new XMLHttpRequest object
    let xhttp = new XMLHttpRequest();

    // Set up the callback function for handling the response
    xhttp.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.status === 200) {
                callback.call(window, xhttp.responseText);
            } else {
                showError("An error occurred during the request.");
            }
        }
    };

    // Open a POST request to the URL
    xhttp.open('POST', url);

    // Specify that credentials should not be included in the request
    xhttp.withCredentials = false;

    // Send the request
    xhttp.send();
}

function showError(errorMessage) {
    DOM.output.innerHTML = errorMessage;
    DOM.output.style.color = '#b22b27'; // Set error text color to red
    DOM.go.disabled = false;
    DOM.go.innerHTML = 'Compile!';
    clearInterval(blinkingInterval);
    DOM.go.classList.remove('blink');
    DOM.go.classList.add('btn-danger');
}


// This function takes a domain and a params object and returns a URL string with the parameters appended to the domain.
function buildURL(domain, params) {
    // If the domain doesn't already have a query string, add one.
    if (!domain.includes('?')) {
        domain += '?';
    }
    // Loop through the keys of the params object.
    let keys = Object.keys(params);
    for (keys of keys) {
        // If the value of the key is an array, loop through the array and add each value as a separate parameter.
        if (Array.isArray(params[keys])) {
            for (let i = 0; i < params[keys].length; i++) {
                addParameter(params[keys][i]);
            }
        } else {
            // If the value of the key is not an array, add it as a single parameter.
            addParameter(params[keys]);
        }
    }
    // Remove the trailing '&' character and return the URL string.
    return domain.slice(0, -1);
    // This function adds a single parameter to the domain string.
    function addParameter(param) {
        domain += `${keys}=${encodeURIComponent(param)}&`;
    }
}

function blink() {
    DOM.go.classList.add('blink');
    const blinkingInterval = setInterval(() => {
        DOM.go.classList.toggle('');
    }, 500);
    setTimeout(() => {
        clearInterval(blinkingInterval);
    }, 5000);
    compile();
}

DOM.go.onclick = blink;
initializeOptions();


// This function synchronizes the scrolling of two elements, an input element and an output element.
// It calculates the ratio of the input element's scroll position to its total scrollable height, and applies that ratio to the output element's total scrollable height to determine the output element's scroll position.
// It then sets the output element's scroll position to the calculated value.
function synchronizeScroll(inputElement, outputElement) {
    function handleScroll() {
        const { scrollTop, scrollHeight, clientHeight } = this;
        const outputScrollHeight = outputElement.scrollHeight;
        const outputClientHeight = outputElement.clientHeight;
        const ratio = scrollTop / (scrollHeight - clientHeight);
        const outputScrollTop = Math.round((outputScrollHeight - outputClientHeight) * ratio);
        outputElement.scrollTop = outputScrollTop;
    }
    // Add event listeners to both elements to call the handleScroll function whenever they are scrolled.
    inputElement.addEventListener('scroll', handleScroll);
    outputElement.addEventListener('scroll', handleScroll);
}
