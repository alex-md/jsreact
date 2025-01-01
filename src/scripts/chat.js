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
	event.preventDefault();

	const prompt = sanitizeInput(inputText.value.trim());
	const apiKey = apiKeyInput.value.trim();

	if (!validateApiKey(apiKey)) {
		responseDiv.textContent = "Invalid API key format";
		return;
	}

	if (!validateTextLength(prompt)) {
		responseDiv.textContent = "Message exceeds maximum length";
		return;
	}

	responseDiv.textContent = "Loading...";

	try {
		const aiResponse = await getAIResponse(prompt, apiKey);
		promptHistory.push(sanitizeInput(aiResponse));
		responseDiv.innerHTML = promptHistory
			.map((prompt) => `<p class="chat-message">${prompt}</p>`)
			.join("");
		inputText.value = "";
	} catch (error) {
		console.error(error);
		responseDiv.textContent = handleApiError(error);
	}
}

function handleKeyDown(event) {
	if (event.key === "Enter") {
		event.preventDefault();
		submitButton.click();
	}
}

async function getAIResponse(prompt, apiKey) {
	const requestData = {
		model: "gpt-3.5-turbo",
		messages: [
			...promptHistory.map(content => ({ role: 'user', content: sanitizeInput(content) })),
			{ role: 'user', content: sanitizeInput(prompt) }
		],
		temperature: 0.7,
		max_tokens: 160,
		top_p: 1,
		frequency_penalty: 0,
		presence_penalty: 0
	};

	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify(requestData)
	});

	if (!response.ok) throw response;
	const data = await response.json();
	return data.choices[0].message.content;
}
