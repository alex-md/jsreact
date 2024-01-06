// Create footer element
var footer = document.createElement('footer');
footer.style.padding = '1rem';
footer.style.position = 'relative';
footer.style.bottom = '0';
footer.style.width = '100%';

// Create div for row
var rowDiv = document.createElement('div');
rowDiv.style.display = 'flex';
rowDiv.style.justifyContent = 'flex-end';
rowDiv.style.margin = '0.5rem';

// Create div for column
var colDiv = document.createElement('div');
colDiv.style.flex = '0 0 auto';

// Create button
var button = document.createElement('div');
button.style.backgroundColor = 'transparent';
button.style.color = '#6c757d';
button.style.border = '0';
button.id = 'viewCountButton'; // Add an id to the button for later reference

// Create anchor
var anchor = document.createElement('div');

// Append elements
button.appendChild(anchor);
colDiv.appendChild(button);
rowDiv.appendChild(colDiv);
footer.appendChild(rowDiv);

// Append footer to body (or any other parent element)
document.body.appendChild(footer);

// Function to fetch the view count from the Cloudflare Worker
async function fetchViewCount () {
    try {
        const response = await fetch('https://views.vs.workers.dev');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        return data;
    } catch (error) {
        console.error('Error fetching view count:', error);
        return 'Unavailable';
    }
}

// Function to format a number with commas as thousands separators
function formatWithCommas (number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Fetch the view count immediately when the page loads
fetchViewCount().then(viewCount => {
    // Update the button text with the formatted view count
    let viewCountButton = document.getElementById('viewCountButton');
    viewCountButton.insertAdjacentText('beforeend', ` Views: ${formatWithCommas(viewCount)}`);
});
