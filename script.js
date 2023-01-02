const parameters = {};

const hashString =
	"#preset=javascript&=data" + encodeURIComponent(JSON.stringify(parameters));
const iframe = document.createElement("iframe");
iframe.src =
	"//unpkg.com/javascript-playgrounds/public/index.html" + hashString;
document.body.appendChild(iframe);
