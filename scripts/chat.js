// Get elements
const inputText = document.getElementById("input-text"); // Text input
const submitButton = document.getElementById("submit-button"); // Submit button
const responseDiv = document.getElementById("response"); // Response div

// Initialize prompt history
let promptHistory = [];

// Define regex pattern for API key validation
const apiKeyPattern = /^sk-[A-Za-z0-9]/;

// Add event listener to submit button
submitButton.addEventListener("click", async () => {
	// Get input text
	const prompt = inputText.value.trim();

	// Get API key
	const apiKey = document.getElementById("api-key-input").value.trim();

	// Validate API key
	if (!apiKey) {
		responseDiv.innerHTML = "Please enter an API key";
		return;
	}
	if (!apiKeyPattern.test(apiKey)) {
		responseDiv.innerHTML = "Invalid API key";
		return;
	}

	// Clear any previous error messages
	responseDiv.innerHTML = "";

	// Show loading message
	responseDiv.innerHTML = "Loading...";

	// Set request data
	const requestData = {
		model: "text-davinci-003",
		prompt: `${promptHistory.join("\n")}\nHuman: ${prompt}\nAI:`,
		temperature: 0.7,
		max_tokens: 60,
		top_p: 1,
		frequency_penalty: 0,
		presence_penalty: 0
	};

	// Set request headers
	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${apiKey}`
	};

	// Make API request
	fetch("https://api.openai.com/v1/completions", {
		method: "POST",
		headers: headers,
		body: JSON.stringify(requestData)
	})
		.then((response) => response.json())
		.then((data) => {
			// Display response
			const aiResponse = data.choices[0].text;
			promptHistory.push(`${aiResponse}`);
			responseDiv.innerHTML = promptHistory
				.map((prompt) => `<p>${prompt}</p>`)
				.join("<br>"); // Add line break between prompts
			inputText.value = "";
		})
		.catch((error) => {
			console.error(error);
		});
});


// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
	// Get all "navbar-burger" elements
	const navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

	// Check if there are any navbar burgers
	if (navbarBurgers.length > 0) {
		// Add a click event on each of them
		navbarBurgers.forEach((navbarBurger) => {
			navbarBurger.addEventListener('click', () => {
				// Get the target from the "data-target" attribute
				const target = navbarBurger.dataset.target;
				const targetElement = document.getElementById(target);

				// Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
				navbarBurger.classList.toggle('is-active');
				targetElement.classList.toggle('is-active');
			});
		});
	}
});


// Add event listener to input text element
inputText.addEventListener("keydown", handleKeyDown);

function handleKeyDown(event) {
	if (event.key === "Enter") {
		event.preventDefault();
		submitButton.click();
	}
}
