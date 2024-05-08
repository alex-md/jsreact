let myChart;

function analyze() {
    const textArea = document.getElementById('textArea');
    const keywordInput = document.getElementById('keywordInput');
    const keywordChart = document.getElementById('keywordChart').getContext('2d');

    const frequencyTableBody = document.getElementById('frequencyTableBody');
    frequencyTableBody.innerHTML = '';

    const text = textArea.value;
    const keyword = keywordInput.value;

    const wordList = text.split(' ').map(word => word.toLowerCase());

    const wordFrequency = wordList.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
    }, {});

    const sortedWords = Object.keys(wordFrequency).sort((a, b) => wordFrequency[b] - wordFrequency[a]);

    // Limit the words to the top 10
    const topTenWords = sortedWords.slice(0, 10);

    for (const word of topTenWords) {
        const row = document.createElement('tr');
        const wordCell = document.createElement('td');
        const frequencyCell = document.createElement('td');

        wordCell.textContent = word;
        frequencyCell.textContent = wordFrequency[word];

        row.appendChild(wordCell);
        row.appendChild(frequencyCell);
        frequencyTableBody.appendChild(row);
    }

    const freqList = wordList.map(word => word === keyword ? 1 : 0);

    const windowSize = 10;
    const densityList = [];
    for (let i = 0; i < wordList.length - windowSize + 1; i++) {
        let sum = 0;
        for (let j = 0; j < windowSize; j++) {
            sum += freqList[i + j];
        }
        densityList.push(sum / windowSize);
    }

    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(keywordChart, {
        type: 'line',
        data: {
            labels: Array.from({ length: densityList.length }, (_, i) => i + 1),
            datasets: [{
                label: 'Keyword Density',
                data: densityList,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    highlightKeyword(index * windowSize, (index + 1) * windowSize);
                }
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        const index = tooltipItem.index;
                        const density = densityList[index];
                        return `Density: ${density}`;
                    }
                }
            }
        }
    });

    createElement();
    applyHighlights();

} function createElement() {
    const keywordInput = document.getElementById('keywordInput');
    const keyword = keywordInput.value;

    // Create or select an HTML element to display the count
    let countDisplay = document.getElementById('countDisplay');
    if (!countDisplay) {
        countDisplay = document.createElement('p');
        countDisplay.id = 'countDisplay';
        countDisplay.className = 'p-mx-auto p-4 text-primary w-50'; // Bootstrap class for colored text
        document.body.appendChild(countDisplay);
    }

    let highlightedDiv = document.getElementById('highlightedDiv');
    if (!highlightedDiv) {
        highlightedDiv = document.createElement('div');
        highlightedDiv.id = 'highlightedDiv';
        highlightedDiv.className = 'p-5 w-50 mx-auto shadow my-4'; // Removed 'card' class
        highlightedDiv.style.whiteSpace = 'pre-wrap'; // Preserve whitespace characters
        document.body.insertBefore(highlightedDiv, countDisplay.nextSibling);
    } else {
        highlightedDiv.innerHTML = ''; // Clear the previous content
    }

    return { countDisplay, highlightedDiv, keyword };
}

function applyHighlights() {
    const { countDisplay, highlightedDiv, keyword } = createElement();
    const textArea = document.getElementById('textArea');

    // Create a regular expression from the keyword
    const keywordRegex = new RegExp(`(${keyword})`, 'gi');

    // Initialize a counter for the keyword
    let keywordCount = 0;
    // Split the text by the keyword and create a text node or a highlighted mark for each piece
    textArea.value.split(keywordRegex).forEach(function (piece) {
        const span = document.createElement('span');
        span.className = 'd-inline'; // Ensure the span is displayed inline
        if (piece.toLowerCase() === keyword.toLowerCase()) {
            const mark = document.createElement('mark');
            mark.className = 'bg-warning fs-large fw-bold text-body'; // Bootstrap class for warning text color
            mark.textContent = piece;
            span.appendChild(mark);
            keywordCount++;
        } else {
            span.appendChild(document.createTextNode(piece));
        }
        highlightedDiv.appendChild(span);
    });

    // Display the count
    countDisplay.textContent = `"${keyword}" appears ${keywordCount} times.`;
}
