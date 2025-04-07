import '../../assets/styles/global.css';


const textInput = document.getElementById("text-input");
const keywordInput = document.getElementById("keyword-input");
const processButton = document.getElementById("process-button");
const resultTextDiv = document.getElementById("result-text");
const insertionCountP = document.getElementById("insertion-count");
const errorDisplay = document.getElementById("error-display");
const frequencySlider = document.getElementById("frequency-slider");
const frequencyValueSpan = document.getElementById("frequency-value");

// --- Configuration ---
const determiners = new Set([
    "the",
    "a",
    "this",
    "that",
    "these",
    "those",
    "my",
    "your",
    "his",
    "her",
    "its",
    "our",
    "their",
    "some",
    "any",
    "no",
    "every",
    "all",
    "what",
    "which"
]);
const punctuationForInsertion = new Set([",", ";", ":"]);
const prepositions = new Set([
    "about",
    "around",
    "down",
    "for",
    "in",
    "into",
    "off",
    "on",
    "out",
    "over",
    "through",
    "to",
    "up",
    "with"
]);
const auxiliaryVerbs = new Set([
    "am",
    "is",
    "are",
    "was",
    "were",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "should",
    "must",
    "can",
    "could"
    // preceding modification is less universally common or natural.
]);
const commonAdjectives = new Set([
    "good",
    "bad",
    "big",
    "small",
    "new",
    "old",
    "great",
    "long",
    "high",
    "low",
    "different",
    "important",
    "happy",
    "sad",
    "hard",
    "easy",
    "beautiful",
    "dark",
    "light",
    "real",
    "stupid",
    "amazing",
    "terrible",
    "ridiculous",
    "awesome",
    "horrible"
]);
const commonAdverbs = new Set([
    "very",
    "really",
    "quite",
    "too",
    "so",
    "just",
    "well",
    "here",
    "there",
    "now",
    "then",
    "fast",
    "quickly",
    "slowly"
]);

// --- Helper Functions ---

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function cleanWordForCheck(word) {
    if (!word) return "";
    // Remove more punctuation for checks, keep internal hyphens for now
    return word.replace(/^[.,!?;:]+|[.,!?;:]+$/g, "").toLowerCase();
}

function endsWithInsertionPunctuation(word) {
    if (!word || word.length === 0) return false;
    return punctuationForInsertion.has(word[word.length - 1]);
}

function splitIntoSentences(text) {
    const sentenceRegex = /.+?[.!?](\s+|$)|.+$/g;
    let sentences = text.match(sentenceRegex);
    return sentences ? sentences.filter((s) => s && s.trim().length > 0) : [];
}

function isLikelyAdverb(word) {
    const cleaned = cleanWordForCheck(word);
    if (!cleaned) return false;
    if (commonAdverbs.has(cleaned)) return true;
    return cleaned.endsWith("ly");
}

function isLikelyNoun(word, prevCleanWord) {
    const cleaned = cleanWordForCheck(word);
    if (
        !cleaned ||
        isLikelyAdverb(cleaned) ||
        auxiliaryVerbs.has(cleaned) ||
        determiners.has(cleaned) ||
        prepositions.has(cleaned)
    ) {
        return false; // Exclude obvious other types
    }
    // Higher chance if preceded by determiner or adjective
    if (
        determiners.has(prevCleanWord) ||
        commonAdjectives.has(
            prevCleanWord
        )
    ) {
        return true;
    }
    // Basic noun endings (very rough)
    if (
        cleaned.endsWith("tion") ||
        cleaned.endsWith("ment") ||
        cleaned.endsWith("ness") ||
        cleaned.endsWith("ity") ||
        cleaned.endsWith("er") ||
        cleaned.endsWith("or")
    ) {
        return true;
    }
    // Default assumption is weaker, maybe noun if not other types
    // return true; // <-- Could enable this for more noun insertions, but higher risk of errors
    return false; // Be more conservative without stronger signals
}

// --- Main Processing Function ---
function processText() {
    errorDisplay.textContent = "";
    resultTextDiv.textContent = "";
    insertionCountP.textContent = "Keywords inserted: 0";

    const text = textInput.value;
    const keyword = keywordInput.value.trim();
    const frequencyLevel = parseInt(frequencySlider.value, 10);
    let totalInsertions = 0;

    if (!text.trim()) {
        errorDisplay.textContent = "Error: Please enter some text.";
        return;
    }
    if (!keyword) {
        errorDisplay.textContent = "Error: Please enter a keyword.";
        return;
    }
    if (!keyword.toLowerCase().endsWith("ing")) {
        errorDisplay.textContent = 'Error: Keyword must end with "ing".';
        return;
    }

    processButton.disabled = true;

    try {
        const sentences = splitIntoSentences(text);
        const modifiedSentences = [];

        sentences.forEach((sentence) => {
            // Split maintaining spaces, filter ensures no empty strings from multiple spaces
            const words = sentence.trim().split(/(\s+)/).filter(Boolean);
            if (words.length < 2) {
                // Need at least one word and potential space, or two words
                modifiedSentences.push(sentence);
                return;
            }

            const potentialInsertionPoints = new Set(); // Use Set to avoid duplicate indices

            let currentWord = "";
            let cleanedCurrentWord = "";
            let prevWord = "";
            let cleanedPrevWord = "";
            let nextWord = "";
            let cleanedNextWord = "";

            // Iterate through indices of the words array
            for (let i = 0; i < words.length; i++) {
                currentWord = words[i];
                // Skip whitespace elements for primary logic, but use their index `i`
                if (currentWord.trim().length === 0) {
                    continue;
                }
                cleanedCurrentWord = cleanWordForCheck(currentWord);

                // --- 1. Check based on PRECEDING word ---
                // Find the actual preceding word (skip spaces)
                prevWord = "";
                cleanedPrevWord = "";
                let k = i - 1;
                while (k >= 0) {
                    if (words[k].trim().length > 0) {
                        prevWord = words[k];
                        cleanedPrevWord = cleanWordForCheck(prevWord);
                        break;
                    }
                    k--;
                }

                if (prevWord) {
                    // Insert *after* preceding word (i.e., before current word at index i)
                    if (
                        determiners.has(cleanedPrevWord) ||
                        endsWithInsertionPunctuation(prevWord)
                    ) {
                        if (
                            cleanedCurrentWord !== "and" &&
                            cleanedCurrentWord !== "or" &&
                            cleanedCurrentWord !== "but" &&
                            cleanedCurrentWord !== "so" &&
                            cleanedCurrentWord !== "yet" &&
                            cleanedCurrentWord !== "nor" &&
                            !prepositions.has(cleanedCurrentWord)
                        ) {
                            potentialInsertionPoints.add(i);
                        }
                    }
                }

                // --- 2. Check based on CURRENT word (insert BEFORE it) ---
                // Can we insert the keyword *before* the current word?
                // Check if current word is an Adjective or Adverb (intensifier role)
                // Or if current word is likely a Noun (adjectival role)
                if (
                    isLikelyAdverb(cleanedCurrentWord) ||
                    isLikelyNoun(cleanedCurrentWord, cleanedPrevWord)
                ) {
                    // Check context: Avoid inserting right after an auxiliary or another verb if the current word is also verb-like (less common, avoid "is running thinking")
                    // Also avoid inserting right after a preposition if the target is a noun ("in running house" is odd)
                    if (
                        !auxiliaryVerbs.has(cleanedPrevWord) &&
                        !(
                            prepositions.has(cleanedPrevWord) &&
                            isLikelyNoun(cleanedCurrentWord, cleanedPrevWord)
                        )
                    ) {
                        // Avoid inserting before punctuation
                        if (!/^[.,!?;:]/.test(currentWord)) {
                            potentialInsertionPoints.add(i);
                        }
                    }
                }
            } // End word loop

            const validInsertionIndices = Array.from(potentialInsertionPoints);
            let targetInsertions = 0;

            if (validInsertionIndices.length > 0) {
                const wordCount = words.filter((w) => w.trim().length > 0).length; // Recalculate word count accurately
                // Base target on slider percentage of available valid spots
                targetInsertions = Math.ceil(
                    validInsertionIndices.length * (frequencyLevel / 10)
                );
                targetInsertions = Math.min(targetInsertions, validInsertionIndices.length); // Cap at available spots

                // Optional stricter cap based on sentence length (preventing extreme density)
                // Adjust divisor (e.g., 3-6) and frequency influence (e.g., 12-freq)
                const maxLengthCap = Math.ceil(
                    wordCount / Math.max(2, 6 - Math.floor(frequencyLevel / 2))
                );
                targetInsertions = Math.min(targetInsertions, maxLengthCap);
            }

            let sentenceInsertions = 0;
            if (targetInsertions > 0 && validInsertionIndices.length > 0) {
                shuffleArray(validInsertionIndices);
                const indicesToInsert = validInsertionIndices.slice(0, targetInsertions);
                indicesToInsert.sort((a, b) => b - a); // Sort descending

                indicesToInsert.forEach((index) => {
                    // Check if space is needed before keyword
                    const precedingCharIsSpace = index > 0 && /\s$/.test(words[index - 1]);
                    const spaceNeededBefore = precedingCharIsSpace ? "" : " ";

                    // Check if space is needed after keyword (usually yes, unless followed by punctuation)
                    const followedByPunctuation =
                        index < words.length && /^[.,!?;:]/.test(words[index]);
                    const spaceNeededAfter = followedByPunctuation ? "" : " ";

                    // Insert: [potential space] + keyword + [potential space]
                    // We insert keyword + spaceNeededAfter first, then spaceNeededBefore if required.
                    words.splice(index, 0, keyword + spaceNeededAfter);
                    if (spaceNeededBefore) {
                        words.splice(index, 0, spaceNeededBefore); // Insert space separately if needed
                    }

                    sentenceInsertions++;
                });
            }

            modifiedSentences.push(words.join(""));
            totalInsertions += sentenceInsertions;
        }); // End forEach sentence

        resultTextDiv.textContent = modifiedSentences.join("");
        insertionCountP.textContent = `Keywords inserted: ${totalInsertions}`;
    } catch (error) {
        console.error("Error during processing:", error);
        errorDisplay.textContent = "An unexpected error occurred during processing.";
        resultTextDiv.textContent = "Processing failed.";
    } finally {
        processButton.disabled = false;
    }
}

// --- Event Listeners ---
processButton.addEventListener("click", processText);
frequencySlider.addEventListener("input", () => {
    frequencyValueSpan.textContent = frequencySlider.value;
});
frequencyValueSpan.textContent = frequencySlider.value; // Initialize
