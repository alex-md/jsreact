document.querySelector("#form").addEventListener("submit", function (e) {
    e.preventDefault();
    document.querySelector("#copyButton").classList.remove("d-none");
    document.querySelector("#optionsCard").classList.remove("d-none");
    var input = document.querySelector("#input").value;
    var results = document.querySelector("#results");
    var items = StartupNameGenerator(input);
    results.innerHTML = ""; // Clears the results container
    items.forEach(function (item) {
        var anchor = document.createElement("a");
        anchor.className = "result-item";
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("href", "https://www.namecheap.com/domains/registration/results.aspx?domain=" + item.toLowerCase() + ".com");
        anchor.innerHTML = "<span>" + item + "</span>";
        results.appendChild(anchor);
    });
});

document.querySelector("#copyButton").addEventListener("click", function () {
    var results = document.querySelector("#results");
    var items = Array.from(results.getElementsByClassName("result-item"));
    var names = items.map(function (item) {
        return item.textContent;
    });

    var copyWithTLD = document.querySelector("#copyWithTLD").checked;
    var namesString;

    if (copyWithTLD) {
        namesString = names.map(function (name) {
            return `${name}.com\n${name}.io\n${name}.dev\n${name}.ai\n${name}.zip`;
        }).join("\n").toLowerCase();
    } else {
        namesString = names.join("\n").toLowerCase();
    }

    navigator.clipboard.writeText(namesString).then(function () {
        console.log('Copying to clipboard was successful!');
    }, function (err) {
        console.error('Could not copy text: ', err);
    });
});
