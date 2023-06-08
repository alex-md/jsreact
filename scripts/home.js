// Initial data
const HTML_CODE = `<div class="p-4">

   <div class="card">
   <div class="alert alert-warning" role="alert">
      Bootstrap 5 built-in!
   </div>
      <div class="card-body">
         <span class="btn btn-success">Edit me!</span>
      </div>
   </div>
</div>`;

const CSS_LINKS = [
	"https://cdn.jsdelivr.net/npm/bootstrap/dist/css/bootstrap.min.css"
];

// Elements
const editorCode = document.getElementById("editorCode");
const editorPreview = document.getElementById("editorPreview").contentWindow
	.document;
const editorCopyButton = document.getElementById("editorCopyClipboard");

// Inject CSS
CSS_LINKS.forEach((linkURL) => {
	const link = document.createElement("link");
	link.href = linkURL;
	link.rel = "stylesheet";
	editorPreview.head.appendChild(link);
});

// Monaco loader
require.config({
	paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor/min/vs" }
});

window.MonacoEnvironment = {
	getWorkerUrl: function (workerId, label) {
		return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
      self.MonacoEnvironment = {
        baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor/min/'
      };
      importScripts('https://cdn.jsdelivr.net/npm/monaco-editor/min/vs/base/worker/workerMain.js');`)}`;
	}
};

// Monaco init
require(["vs/editor/editor.main"], function () {
	createEditor(editorCode);
});


/**
 * Creates a Monaco editor instance and sets up its functionality
 * @param {HTMLElement} editorContainer - The container element for the editor
 */
function createEditor(editorContainer) {
	// Create the Monaco editor instance
	const editor = monaco.editor.create(editorContainer, {
		value: HTML_CODE,
		language: "html",
		minimap: { enabled: true },
		automaticLayout: true,
		contextmenu: true,
		fontSize: 12,
		scrollbar: {
			useShadows: false,
			vertical: "visible",
			horizontal: "visible",
			horizontalScrollbarSize: 8,
			verticalScrollbarSize: 8,
		},
	});

	// Set the initial preview content
	editorPreview.body.innerHTML = HTML_CODE;

	// Update the preview content whenever the editor content changes
	editor.onDidChangeModelContent(() => {
		editorPreview.body.innerHTML = editor.getValue();
	});

	// Set up the copy to clipboard functionality
	editorCopyButton.onclick = () => {
		copyToClipboard(editor.getValue());
		const editorCopyButtonText = editorCopyButton.innerHTML;
		editorCopyButton.innerHTML = "Copied!";
		editorCopyButton.disabled = true;
		setTimeout(() => {
			editorCopyButton.disabled = false;
			editorCopyButton.innerHTML = editorCopyButtonText;
		}, 500);
	};
}


function copyToClipboard(str) {
	const el = document.createElement("textarea");
	el.value = str;
	document.body.appendChild(el);
	el.select();
	document.execCommand("copy");
	document.body.removeChild(el);
}
