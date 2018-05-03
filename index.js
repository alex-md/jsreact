'use strict';

require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.12.0/min/vs' } });
window.MonacoEnvironment = { getWorkerUrl: function getWorkerUrl() {
        return proxy;
    } };
var proxy = URL.createObjectURL(new Blob(["\n\tself.MonacoEnvironment = {\n\t\tbaseUrl: 'https://unpkg.com/monaco-editor@0.12.0/min/'\n\t};\n\timportScripts('https://unpkg.com/monaco-editor@0.12.0/min/vs/base/worker/workerMain.js');\n"], { type: 'text/javascript' }));
require(["vs/editor/editor.main"], function () {
    var editor = monaco.editor.create(document.getElementById('container'), {
        value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join('\n'),
        language: 'javascript',
        theme: 'vs-dark'
    });
    editor.addListener('didType', function () {
        console.log(editor.getValue());
    });
});
