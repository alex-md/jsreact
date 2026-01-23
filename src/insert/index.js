import { showToast } from '@components/toast.js';
let textInput = document.getElementById("text-input"), keywordInput = document.getElementById("keyword-input"), processButton = document.getElementById("process-button"), copyResultButton = document.getElementById("copy-result-button"), resultTextDiv = document.getElementById("result-text"), insertionCountP = document.getElementById("insertion-count"), errorDisplay = document.getElementById("error-display"), frequencySlider = document.getElementById("frequency-slider"), frequencyValueSpan = document.getElementById("frequency-value");
const determiners = new Set([
    "the",
    "a",
    "an",
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
    "which",
    "another",
    "each",
    "either",
    "neither",
    "enough",
    "much",
    "many"
]);
const punctuationForInsertion = new Set([
    ",",
    ";",
    ":",
    "—",
    "-"
]);
const prepositions = new Set([
    "about",
    "above",
    "across",
    "after",
    "against",
    "along",
    "around",
    "at",
    "before",
    "behind",
    "below",
    "beneath",
    "beside",
    "between",
    "beyond",
    "but",
    "by",
    "concerning",
    "despite",
    "down",
    "during",
    "except",
    "for",
    "from",
    "in",
    "inside",
    "into",
    "like",
    "near",
    "of",
    "off",
    "on",
    "onto",
    "out",
    "outside",
    "over",
    "past",
    "regarding",
    "since",
    "through",
    "throughout",
    "to",
    "toward",
    "under",
    "underneath",
    "until",
    "unto",
    "up",
    "upon",
    "with",
    "within",
    "without"
]);
const beVerbs = new Set([
    "am",
    "is",
    "are",
    "was",
    "were",
    "be",
    "being",
    "been"
]);
const auxiliaryVerbs = new Set([
    "am",
    "is",
    "are",
    "was",
    "were",
    "be",
    "being",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "shall",
    "should",
    "may",
    "might",
    "must",
    "can",
    "could",
    "don't",
    "doesn't",
    "didn't",
    "won't",
    "shouldn't",
    "can't",
    "cannot"
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
    "horrible",
    "nice",
    "kind",
    "lovely",
    "perfect",
    "huge",
    "tiny",
    "hot",
    "cold",
    "warm",
    "cool",
    "wet",
    "dry",
    "sick",
    "healthy",
    "loud",
    "quiet",
    "bright",
    "dim",
    "clever",
    "dumb",
    "funny",
    "serious",
    "scary",
    "weird",
    "strange",
    "normal",
    "obvious",
    "certain",
    "difficult",
    "simple",
    "expensive",
    "cheap",
    "rich",
    "poor",
    "fast",
    "slow",
    "quick",
    "wrong",
    "right",
    "true",
    "false",
    "crazy",
    "insane",
    "brilliant",
    "fantastic",
    "wonderful",
    "awful",
    "dreadful",
    "possible",
    "impossible",
    "sure",
    "dead",
    "full",
    "empty",
    "busy",
    "ready",
    "sorry"
]);
const commonAdverbs = new Set([
    "very",
    "really",
    "quite",
    "too",
    "so",
    "just",
    "well",
    "fast",
    "quickly",
    "slowly",
    "actually",
    "probably",
    "certainly",
    "definitely",
    "absolutely",
    "incredibly",
    "extremely",
    "highly",
    "truly",
    "completely",
    "totally",
    "utterly",
    "always",
    "never",
    "often",
    "sometimes",
    "usually",
    "rarely",
    "already",
    "yet",
    "still",
    "enough",
    "almost",
    "nearly",
    "quite",
    "rather",
    "somewhat",
    "even",
    "obviously",
    "seriously",
    "especially",
    "particularly",
    "generally",
    "specifically"
]);
const conjunctions = new Set([
    "and",
    "but",
    "or",
    "so",
    "yet",
    "nor",
    "for",
    "while",
    "whereas",
    "although",
    "because",
    "since",
    "if",
    "unless",
    "whether",
    "as",
    "than",
    "when",
    "before",
    "after",
    "until"
]);
const subjectPronouns = new Set([
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "who",
    "what"
]);
const allPronouns = new Set([
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "him",
    "her",
    "us",
    "them",
    "myself",
    "yourself",
    "himself",
    "herself",
    "itself",
    "ourselves",
    "yourselves",
    "themselves",
    "who",
    "whom",
    "whose",
    "which",
    "what",
    "that",
    "this",
    "that",
    "these",
    "those"
]);
function cleanWordForCheck(word) {
    return 'string' == typeof word && word ? word.replace(/^[.,!?;:"'()\[\]{}—-]+|[.,!?;:"'()\[\]{}—-]+$/g, "").toLowerCase() : "";
}
function isLikelyAdverb(word) {
    let cleaned = cleanWordForCheck(word);
    if (!cleaned) return false;
    return commonAdverbs.has(cleaned) || cleaned.length > 4 && cleaned.endsWith("ly");
}
function isLikelyAdjective(word) {
    let cleaned = cleanWordForCheck(word);
    if (!cleaned) return false;
    return commonAdjectives.has(cleaned);
}
function isLikelyVerb(word) {
    let cleaned = cleanWordForCheck(word);
    if (!cleaned || cleaned.length < 2) return false;
    if (cleaned.endsWith("ing") || cleaned.endsWith("ed")) return true;
    return false;
}
function isLikelyNoun(word, prevCleanWord) {
    let cleaned = cleanWordForCheck(word);
    if (!cleaned || cleaned.length < 2) return false;
    if (isLikelyAdverb(cleaned) || isLikelyAdjective(cleaned) || auxiliaryVerbs.has(cleaned) || beVerbs.has(cleaned) || determiners.has(cleaned) || prepositions.has(cleaned) || conjunctions.has(cleaned) || allPronouns.has(cleaned)) {
        return false;
    }
    const nounSuffixes = [
        "tion",
        "sion",
        "ment",
        "ness",
        "ity",
        "er",
        "or",
        "ist",
        "ism",
        "age",
        "ance",
        "ence",
        "dom",
        "ship"
    ];
    if (nounSuffixes.some((s) => cleaned.endsWith(s))) return true;
    if (prevCleanWord && (determiners.has(prevCleanWord) || prepositions.has(prevCleanWord))) return true;
    return true;
}
processButton.addEventListener("click", function () {
    errorDisplay.textContent = "";
    resultTextDiv.textContent = "";
    insertionCountP.textContent = "Keywords inserted: 0";
    let text = textInput.value;
    let keyword = keywordInput.value.trim();
    let frequencyLevel = parseInt(frequencySlider.value, 10);
    let totalInsertions = 0;
    let lowerKeyword = keyword.toLowerCase();
    if ('string' != typeof text || !text.trim()) {
        errorDisplay.textContent = "Error: Please enter some text.";
        return;
    }
    if ('string' != typeof keyword || !keyword) {
        errorDisplay.textContent = "Error: Please enter a keyword.";
        return;
    }
    if (!lowerKeyword.endsWith("ing")) {
        errorDisplay.textContent = 'Error: Keyword must end with "ing" (e.g., "running, "jumping, etc.").';
        return;
    }
    if (isNaN(frequencyLevel) || frequencyLevel < 0 || frequencyLevel > 10) {
        errorDisplay.textContent = 'Error: Invalid frequency level.';
        return;
    }
    processButton.disabled = true;
    try {
        let sentences = text.match(/.+?[.!?…]+(\s+|$)|.+$/g) || [];
        sentences = sentences.filter((s) => 'string' == typeof s && s.trim().length > 0);
        let modifiedSentences = [];
        sentences.forEach((sentence) => {
            let words = sentence.trim().split(/(\s+)/).filter(Boolean);
            if (words.length < 1) {
                modifiedSentences.push(sentence);
                return;
            }
            let potentialInsertionPoints = new Set();
            let prevWord = "";
            let cleanedPrevWord = "";
            for (let i = 0; i < words.length; i++) {
                let currentWord = words[i];
                if (!currentWord.trim()) continue;
                let cleanedCurrentWord = cleanWordForCheck(currentWord);
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
                if (!cleanedCurrentWord || !cleanedPrevWord) continue;
                if (cleanedCurrentWord.includes(lowerKeyword) || cleanedPrevWord.includes(lowerKeyword)) continue;
                if (/^[.,!?;:'"’)\]}—]/.test(currentWord)) continue;
                if (currentWord.startsWith("'")) continue;
                let canInsert = false;
                if ((isLikelyAdjective(currentWord) || isLikelyAdverb(currentWord)) && ![
                    "very",
                    "really",
                    "quite",
                    "too"
                ].includes(cleanedPrevWord)) {
                    canInsert = true;
                } else if (isLikelyNoun(currentWord, cleanedPrevWord) && (determiners.has(cleanedPrevWord) || prepositions.has(cleanedPrevWord))) {
                    canInsert = true;
                } else if ((auxiliaryVerbs.has(cleanedPrevWord) || cleanedPrevWord === "to") && !auxiliaryVerbs.has(cleanedCurrentWord) && !determiners.has(cleanedCurrentWord) && !prepositions.has(cleanedCurrentWord)) {
                    canInsert = true;
                } else if ([
                    "no",
                    "every",
                    "all",
                    "any",
                    "some"
                ].includes(cleanedCurrentWord) && cleanedPrevWord !== "in") {
                    canInsert = true;
                } else if ([
                    "who",
                    "what",
                    "where",
                    "why",
                    "how"
                ].includes(cleanedPrevWord) && isLikelyVerb(currentWord)) {
                    canInsert = true;
                }
                if (canInsert) {
                    potentialInsertionPoints.add(i);
                }
            }
            let validInsertionIndices = Array.from(potentialInsertionPoints);
            let targetInsertions = 0;
            if (validInsertionIndices.length > 0) {
                let frequencyFactor = Math.pow(frequencyLevel / 10, 1.5);
                targetInsertions = Math.ceil(validInsertionIndices.length * frequencyFactor);
                let nonSpaceWordCount = words.filter((w) => w.trim().length > 0).length;
                let hardCap = Math.ceil(nonSpaceWordCount / 3);
                if (frequencyLevel === 10) hardCap = nonSpaceWordCount;
                targetInsertions = Math.min(targetInsertions, hardCap);
            }
            if (targetInsertions > 0 && validInsertionIndices.length > 0) {
                for (let i = validInsertionIndices.length - 1; i > 0; i--) {
                    let j = Math.floor(Math.random() * (i + 1));
                    [validInsertionIndices[i], validInsertionIndices[j]] = [
                        validInsertionIndices[j],
                        validInsertionIndices[i]
                    ];
                }
                let indicesToInsert = validInsertionIndices.slice(0, targetInsertions);
                indicesToInsert.sort((a, b) => b - a);
                indicesToInsert.forEach((index) => {
                    let spaceBefore = " ";
                    let precedingElement = index > 0 ? words[index - 1] : null;
                    if (index === 0 || precedingElement && /\s$/.test(precedingElement)) {
                        spaceBefore = "";
                    }
                    let spaceAfter = " ";
                    let followingElement = index < words.length ? words[index] : null;
                    if (followingElement && /^[.,!?;:'"’)\]}—]/.test(followingElement)) {
                        spaceAfter = "";
                    }
                    words.splice(index, 0, `${spaceBefore}${keyword}${spaceAfter}`);
                    totalInsertions++;
                });
            }
            let joinedSentence = words.join("").replace(/\s{2,}/g, ' ').trim();
            modifiedSentences.push(joinedSentence);
        });
        resultTextDiv.textContent = modifiedSentences.join(" ");
        insertionCountP.textContent = `Keywords inserted: ${totalInsertions}`;
    } catch (error) {
        console.error("Error during processing:", error);
        errorDisplay.textContent = "An unexpected error occurred. Check console.";
        resultTextDiv.textContent = "Processing failed.";
    } finally {
        processButton.disabled = false;
    }
});
frequencySlider.addEventListener("input", () => {
    frequencyValueSpan.textContent = frequencySlider.value;
});
frequencyValueSpan.textContent = frequencySlider.value;
if (copyResultButton) {
    copyResultButton.addEventListener("click", async () => {
        let text = resultTextDiv.textContent;
        if (!text || text === "Processing failed.") {
            showToast("No text to copy", "warning");
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            let originalHTML = copyResultButton.innerHTML;
            copyResultButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
            showToast("Text copied to clipboard", "success");
            setTimeout(() => {
                copyResultButton.innerHTML = originalHTML;
            }, 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
            showToast("Failed to copy to clipboard", "error");
        }
    });
}
