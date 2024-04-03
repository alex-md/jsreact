document.querySelector("#form").addEventListener("submit", function (e) {
    e.preventDefault();
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
