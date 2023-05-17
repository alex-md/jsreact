const parameters = {};

const hashString =
	"#preset=react&data=" + encodeURIComponent(JSON.stringify(parameters));
const iframe = document.createElement("iframe");
iframe.src =
	"//unpkg.com/javascript-playgrounds/public/index.html" + hashString;
// place the iframe below the main
document.querySelector("section").insertAdjacentElement("afterend", iframe);
