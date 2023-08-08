// Get elements
const inputText = document.getElementById("input-text"); // Text input
const submitButton = document.getElementById("submit-button"); // Submit button
const responseDiv = document.getElementById("response"); // Response div
const apiKeyInput = document.getElementById("api-key-input"); // API key input

// Initialize prompt history
const promptHistory = [];

// Define regex pattern for API key validation
const apiKeyPattern = /^sk-[A-Za-z0-9]/;

// Add event listener to submit button
submitButton.addEventListener("click", handleSubmit);

// Add event listener to input text element
inputText.addEventListener("keydown", handleKeyDown);

async function handleSubmit(event) {
	event.preventDefault(); // Prevent default form submission behavior

	// Get input text
	const prompt = inputText.value.trim();

	// Get API key
	const apiKey = apiKeyInput.value.trim();

	// Validate API key
	if (!apiKey) {
		responseDiv.textContent = "Please enter an API key";
		return;
	}
	if (!apiKeyPattern.test(apiKey)) {
		responseDiv.textContent = "Invalid API key";
		return;
	}

	// Clear any previous error messages
	responseDiv.textContent = "";

	// Show loading message
	responseDiv.textContent = "Loading...";

	try {
		// Make API request
		const aiResponse = await getAIResponse(prompt, apiKey);

		// Display response
		promptHistory.push(aiResponse);
		responseDiv.innerHTML = promptHistory
			.map((prompt) => `<p>${prompt}</p>`)
			.join("<br>"); // Add line break between prompts
		inputText.value = "";
	} catch (error) {
		console.error(error);
	}
}

function handleKeyDown(event) {
	if (event.key === "Enter") {
		event.preventDefault();
		submitButton.click();
	}
}

async function getAIResponse(prompt, apiKey) {
	// Set request data
	const requestData = {
		model: "text-davinci-003",
		prompt: `${promptHistory.join("\n")}\nHuman: ${prompt}\nAI:`,
		temperature: 0.7,
		max_tokens: 160,
		top_p: 1,
		frequency_penalty: 0,
		presence_penalty: 0
	};

	// Set fetch options
	const options = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify(requestData)
	};

	// Make API request
	const response = await fetch("https://api.openai.com/v1/completions", options);
	const data = await response.json();

	// Return AI response
	return data.choices[0].text;
}