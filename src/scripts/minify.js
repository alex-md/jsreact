let DOM = {
    go: document.getElementById("go"),
    input: document.getElementById("input"),
    output: document.getElementById("output"),
    stats: document.getElementById("stats"),
    log: document.getElementById("log"),
    options: {
        compilation_level: document.getElementById("compilation_level"),
        formatting: document.getElementById("formatting")
    }
};

async function compile() {
    DOM.go.disabled = true;
    DOM.go.innerHTML = "Compiling... <span class='spinner-border spinner-border-sm small-border my-auto mx-auto' role='status' aria-hidden='true'></span>";

    let url = buildURL('https://closure-compiler.appspot.com/compile', {
        js_code: DOM.input.value,
        compilation_level: DOM.options.compilation_level.value,
        output_format: 'json',
        output_info: ['compiled_code', 'warnings', 'errors', 'statistics'],
        formatting: DOM.options.formatting.value,
        language_out: 'ECMASCRIPT_2020'
    });

    try {
        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            credentials: 'omit'
        });

        if (!response.ok) {
            throw new Error("An error occurred during the request.");
        }

        let data = await response.text();
        handleResponse(data);
    } catch (error) {
        showError(error.message);
    } finally {
        DOM.go.innerHTML = 'Compile!';
        DOM.go.disabled = false;
    }
}

function handleResponse(data) {
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
    DOM.go.innerHTML = 'Compile!';
    DOM.go.disabled = false;
}

function showError(errorMessage) {
    DOM.output.innerHTML = errorMessage;
    DOM.output.style.color = '#b22b27';
    DOM.go.innerHTML = 'Compile!';
    DOM.go.disabled = false;
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
        domain += `${encodeURIComponent(key)}=${encodeURIComponent(param)}&`; // Encode key and value separately
    }

    return domain.slice(0, -1);
}

DOM.go.addEventListener('click', compile);
