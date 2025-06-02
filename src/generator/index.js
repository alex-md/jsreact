// Import styles and components
import '../assets/styles/global.css';
import { showToast } from '@/components/toast.js';
import generator from '@rstacruz/startup-name-generator';

// Get DOM elements
const generateButton = document.getElementById('generate-button');
const clearButton = document.getElementById('clear-button');
const copyAllButton = document.getElementById('copy-all-button');
const inputField = document.getElementById('input-text');
const resultsContainer = document.getElementById('results');
const loadingIndicator = document.getElementById('loading');

// Store generated names for copy all functionality
let generatedNames = [];

// Copy text helper function
async function copyText(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check text-xs"></i> Copied!';
        button.disabled = true;
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.disabled = false;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        showToast('Failed to copy to clipboard');
    }
}

// Generate names
function generateNames() {
    const input = inputField.value.trim();
    if (!input) {
        showToast('Please enter some words to generate names from.');
        return;
    }

    // Show loading indicator
    loadingIndicator.classList.remove('hidden');
    resultsContainer.innerHTML = '';
    generatedNames = []; // Reset generated names

    try {
        const names = generator(input);
        generatedNames = names; // Store for copy all functionality

        // Create result cards
        names.forEach(name => {
            const card = document.createElement('div');
            card.className = 'group bg-white  p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary/20 dark:hover:border-primary/20 relative overflow-hidden';

            // Background decoration
            const decoration = document.createElement('div');
            decoration.className = 'absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300';
            card.appendChild(decoration);

            // Content container
            const content = document.createElement('div');
            content.className = 'relative z-10';

            // Name display
            const nameText = document.createElement('h3');
            nameText.className = 'text-2xl font-bold text-gray-900  mb-3 group-hover:text-primary transition-colors duration-300';
            nameText.textContent = name;

            // Domain suggestions
            const domainContainer = document.createElement('div');
            domainContainer.className = 'space-y-2';

            const domains = [
                { tld: 'com', class: 'text-blue-600 dark:text-blue-400' },
                { tld: 'org', class: 'text-gray-600 dark:text-gray-400' },
                { tld: 'io', class: 'text-purple-600 dark:text-purple-400' },
                { tld: 'ai', class: 'text-green-600 dark:text-green-400' },
            ];

            domains.forEach(domain => {
                const domainLink = document.createElement('a');
                domainLink.href = `https://www.namecheap.com/domains/registration/results.aspx?domain=${name.toLowerCase()}.${domain.tld}`;
                domainLink.target = '_blank';
                domainLink.className = `flex items-center gap-2 text-sm ${domain.class} hover:opacity-80 transition-opacity`;

                const icon = document.createElement('i');
                icon.className = 'fas fa-globe text-xs';

                const text = document.createElement('span');
                text.textContent = `${name.toLowerCase()}.${domain.tld}`;

                domainLink.appendChild(icon);
                domainLink.appendChild(text);
                domainContainer.appendChild(domainLink);
            });

            // Copy button
            const copyButton = document.createElement('button');
            copyButton.className = 'mt-4 w-full py-2 px-4 bg-gray-50  text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-2';
            copyButton.innerHTML = '<i class="fas fa-copy text-xs"></i> Copy name';
            copyButton.onclick = () => copyText(name, copyButton);

            content.appendChild(nameText);
            content.appendChild(domainContainer);
            content.appendChild(copyButton);
            card.appendChild(content);
            resultsContainer.appendChild(card);
        });

        // Show copy all button if we have results
        if (names.length > 0) {
            copyAllButton.classList.remove('hidden');
        }
    } catch (error) {
        showToast('Failed to generate names. Please try again.');
        console.error('Generation error:', error);
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

// Copy all names with their TLDs
function copyAllNames() {
    if (generatedNames.length === 0) {
        showToast('No Names', 'Generate some names first!');
        return;
    }

    const domains = ['com', 'io', 'ai', 'sh'];
    const allDomains = generatedNames.flatMap(name =>
        domains.map(tld => `${name.toLowerCase()}.${tld}`)
    ).join('\n ');

    copyText(allDomains, copyAllButton);
}

// Clear results
function clearResults() {
    inputField.value = '';
    resultsContainer.innerHTML = '';
    generatedNames = [];
    copyAllButton.classList.add('hidden');
}

// Event listeners
generateButton.addEventListener('click', generateNames);
clearButton.addEventListener('click', clearResults);
copyAllButton.addEventListener('click', copyAllNames);

// Also generate on Enter key
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        generateNames();
    }
});
