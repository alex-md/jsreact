import { showToast } from '@components/toast.js';

const textInput = document.getElementById("text-input");
const keywordInput = document.getElementById("keyword-input");
const processButton = document.getElementById("process-button");
const copyResultButton = document.getElementById("copy-result-button");
const resultTextDiv = document.getElementById("result-text");
const insertionCountP = document.getElementById("insertion-count");
const errorDisplay = document.getElementById("error-display");
const frequencySlider = document.getElementById("frequency-slider");
const frequencyValueSpan = document.getElementById("frequency-value");
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
    "could"
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
    "empty"
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
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [
            array[j],
            array[i]
        ];
    }
}
function cleanWordForCheck(word) {
    if (typeof word !== 'string') return "";
    if (!word) return "";
    return word.replace(/^[.,!?;:"'()\[\]{}—-]+|[.,!?;:"'()\[\]{}—-]+$/g, "").toLowerCase();
}
function endsWithInsertionPunctuation(word) {
    if (typeof word !== 'string' || !word || word.length === 0) return false;
    const lastChar = word[word.length - 1];
    return punctuationForInsertion.has(lastChar);
}
function splitIntoSentences(text) {
    if (typeof text !== 'string') return [];
    const sentenceRegex = /.+?[.!?…]+(\s+|$)|.+$/g;
    let sentences = text.match(sentenceRegex);
    return sentences ? sentences.filter((s) => typeof s === 'string' && s.trim().length > 0) : [];
}
function isLikelyAdverb(word) {
    const cleaned = cleanWordForCheck(word);
    if (!cleaned) return false;
    if (commonAdverbs.has(cleaned)) return true;
    if (cleaned.length > 3 && cleaned.endsWith("ly")) {
        if (![
            "friendly",
            "lonely",
            "lovely",
            "silly",
            "ugly",
            "elderly",
            "likely",
            "family",
            "ally",
            "belly",
            "bully",
            "jelly",
            "rely",
            "supply"
        ].includes(cleaned)) {
            return true;
        }
    }
    return false;
}
function isLikelyAdjective(word) {
    const cleaned = cleanWordForCheck(word);
    if (!cleaned) return false;
    if (commonAdjectives.has(cleaned)) return true;
    return false;
}
function isForbiddenPrecedingWord(cleanedWord) {
    if (!cleanedWord) return false;
    return prepositions.has(cleanedWord) || determiners.has(cleanedWord) || conjunctions.has(cleanedWord) || cleanedWord === "to";
}
function isForbiddenFollowingWord(cleanedWord) {
    if (!cleanedWord) return false;
    return prepositions.has(cleanedWord) || determiners.has(cleanedWord) || conjunctions.has(cleanedWord) || auxiliaryVerbs.has(cleanedWord) || beVerbs.has(cleanedWord);
}
function isLikelyVerb(word, cleanedPrevWord) {
    const cleaned = cleanWordForCheck(word);
    if (!cleaned || cleaned.length < 2) return false;
    const validPrev = typeof cleanedPrevWord === 'string' && cleanedPrevWord.length > 0;
    if (determiners.has(cleaned) || prepositions.has(cleaned) || conjunctions.has(cleaned) || commonAdjectives.has(cleaned) || commonAdverbs.has(cleaned) || allPronouns.has(cleaned)) {
        return false;
    }
    if (validPrev && (subjectPronouns.has(cleanedPrevWord) || auxiliaryVerbs.has(cleanedPrevWord))) {
        if (auxiliaryVerbs.has(cleaned) || beVerbs.has(cleaned)) {
            return false;
        }
        return true;
    }
    return false;
}
function isLikelyNoun(word, prevCleanWord) {
    const cleaned = cleanWordForCheck(word);
    if (!cleaned || cleaned.length < 2) return false;
    const validPrev = typeof prevCleanWord === 'string' && prevCleanWord.length > 0;
    if (isLikelyAdverb(cleaned) || isLikelyAdjective(cleaned) || auxiliaryVerbs.has(cleaned) || beVerbs.has(cleaned) || determiners.has(cleaned) || prepositions.has(cleaned) || conjunctions.has(cleaned) || allPronouns.has(cleaned)) {
        return false;
    }
    if (isLikelyVerb(word, prevCleanWord)) {
        return false;
    }
    if (validPrev && (determiners.has(prevCleanWord) || commonAdjectives.has(prevCleanWord) || beVerbs.has(prevCleanWord))) {
        return true;
    }
    if (cleaned.length > 3 && (cleaned.endsWith("tion") || cleaned.endsWith("sion") || cleaned.endsWith("ment") || cleaned.endsWith("ness") || cleaned.endsWith("ity") || cleaned.endsWith("er") || cleaned.endsWith("or") || cleaned.endsWith("ist") || cleaned.endsWith("ism") || cleaned.endsWith("age") || cleaned.endsWith("ance") || cleaned.endsWith("ence"))) {
        return true;
    }
    return false;
}
function processText() {
    errorDisplay.textContent = "";
    resultTextDiv.textContent = "";
    insertionCountP.textContent = "Keywords inserted: 0";
    const text = textInput.value;
    const keyword = keywordInput.value.trim();
    const frequencyLevel = parseInt(frequencySlider.value, 10);
    let totalInsertions = 0;
    const lowerKeyword = keyword.toLowerCase();
    if (typeof text !== 'string' || !text.trim()) {
        errorDisplay.textContent = "Error: Please enter some text.";
        return;
    }
    if (typeof keyword !== 'string' || !keyword) {
        errorDisplay.textContent = "Error: Please enter a keyword.";
        return;
    }
    if (!lowerKeyword.endsWith("ing")) {
        errorDisplay.textContent = 'Error: Keyword must end with "ing".';
        return;
    }
    if (isNaN(frequencyLevel) || frequencyLevel < 0 || frequencyLevel > 10) {
        errorDisplay.textContent = 'Error: Invalid frequency level.';
        return;
    }
    processButton.disabled = true;
    try {
        const sentences = splitIntoSentences(text);
        const modifiedSentences = [];
        sentences.forEach((sentence) => {
            if (typeof sentence !== 'string') return;
            const words = sentence.trim().split(/(\s+)/).filter(Boolean);
            if (words.length < 1) {
                modifiedSentences.push(sentence);
                return;
            }
            const potentialInsertionPoints = new Set();
            let prevWord = "";
            let cleanedPrevWord = "";
            let currentWord = "";
            let cleanedCurrentWord = "";
            for (let i = 0; i < words.length; i++) {
                if (typeof words[i] !== 'string') continue;
                currentWord = words[i];
                if (currentWord.trim().length === 0) continue;
                cleanedCurrentWord = cleanWordForCheck(currentWord);
                prevWord = "";
                cleanedPrevWord = "";
                let k = i - 1;
                while (k >= 0) {
                    if (typeof words[k] === 'string' && words[k].trim().length > 0) {
                        prevWord = words[k];
                        cleanedPrevWord = cleanWordForCheck(prevWord);
                        break;
                    }
                    k--;
                }
                if (!cleanedCurrentWord || cleanedCurrentWord === lowerKeyword || isForbiddenFollowingWord(cleanedCurrentWord) || isForbiddenPrecedingWord(cleanedPrevWord)) {
                    continue;
                }
                if (isLikelyAdverb(cleanedPrevWord)) {
                    if (![
                        "just",
                        "so",
                        "now",
                        "then",
                        "well",
                        "here",
                        "there"
                    ].includes(cleanedPrevWord)) {
                        continue;
                    }
                }
                if (isLikelyAdjective(currentWord)) {
                    potentialInsertionPoints.add(i);
                    continue;
                }
                if (isLikelyAdverb(currentWord)) {
                    potentialInsertionPoints.add(i);
                    continue;
                }
                if (subjectPronouns.has(cleanedPrevWord) && isLikelyVerb(currentWord, cleanedPrevWord)) {
                    potentialInsertionPoints.add(i);
                    continue;
                }
                if (auxiliaryVerbs.has(cleanedPrevWord) && isLikelyVerb(currentWord, cleanedPrevWord) && !auxiliaryVerbs.has(cleanedCurrentWord) && !beVerbs.has(cleanedCurrentWord)) {
                    potentialInsertionPoints.add(i);
                    continue;
                }
                if (beVerbs.has(cleanedPrevWord) && (isLikelyAdjective(currentWord) || isLikelyAdverb(currentWord) || isLikelyNoun(currentWord, cleanedPrevWord))) {
                    potentialInsertionPoints.add(i);
                    continue;
                }
                if (endsWithInsertionPunctuation(prevWord)) {
                    potentialInsertionPoints.add(i);
                    continue;
                }
                if (isLikelyNoun(currentWord, cleanedPrevWord) && (determiners.has(cleanedPrevWord) || commonAdjectives.has(cleanedPrevWord))) {
                    potentialInsertionPoints.add(i);
                    continue;
                }
            }
            const validInsertionIndices = Array.from(potentialInsertionPoints);
            let targetInsertions = 0;
            if (validInsertionIndices.length > 0) {
                const nonSpaceWordCount = words.filter((w) => typeof w === 'string' && w.trim().length > 0).length;
                if (nonSpaceWordCount > 0) {
                    const frequencyFactor = Math.pow(frequencyLevel / 10, 1.7);
                    targetInsertions = Math.ceil(validInsertionIndices.length * frequencyFactor);
                    const divisorFreqPart = isNaN(frequencyLevel) ? 9 : Math.floor(frequencyLevel / 1.2);
                    const maxDensityDivisor = Math.max(2, 9 - divisorFreqPart);
                    const maxLengthCap = Math.ceil(nonSpaceWordCount / maxDensityDivisor);
                    targetInsertions = Math.min(targetInsertions, validInsertionIndices.length, maxLengthCap);
                    targetInsertions = Math.max(0, targetInsertions);
                }
            }
            let sentenceInsertions = 0;
            if (targetInsertions > 0 && validInsertionIndices.length > 0) {
                shuffleArray(validInsertionIndices);
                const indicesToInsert = validInsertionIndices.slice(0, targetInsertions);
                indicesToInsert.sort((a, b) => b - a);
                indicesToInsert.forEach((index) => {
                    let spaceBefore = " ";
                    let precedingElement = index > 0 ? words[index - 1] : null;
                    if (index === 0 || precedingElement && typeof precedingElement === 'string' && /\s$/.test(precedingElement) || precedingElement && typeof precedingElement === 'string' && /[—\-]$/.test(precedingElement)) {
                        spaceBefore = "";
                    }
                    let spaceAfter = " ";
                    let followingElement = index < words.length ? words[index] : null;
                    if (index >= words.length || followingElement && typeof followingElement === 'string' && /^[.,!?;:'"’)\]}—]/.test(followingElement)) {
                        spaceAfter = "";
                    }
                    words.splice(index, 0, `${spaceBefore}${keyword}${spaceAfter}`);
                    sentenceInsertions++;
                });
            }
            let joinedSentence = words.filter((w) => typeof w === 'string').join("").replace(/\s{2,}/g, ' ').trim();
            modifiedSentences.push(joinedSentence);
            totalInsertions += sentenceInsertions;
        });
        resultTextDiv.textContent = modifiedSentences.join(" ");
        insertionCountP.textContent = `Keywords inserted: ${totalInsertions}`;
    } catch (error) {
        console.error("Error during processing:", error);
        errorDisplay.textContent = "An unexpected error occurred during processing. Check console (F12) for details.";
        resultTextDiv.textContent = "Processing failed.";
    } finally {
        processButton.disabled = false;
    }
}
processButton.addEventListener("click", processText);
frequencySlider.addEventListener("input", () => {
    frequencyValueSpan.textContent = frequencySlider.value;
});
frequencyValueSpan.textContent = frequencySlider.value;

if (copyResultButton) {
    copyResultButton.addEventListener("click", async () => {
        const text = resultTextDiv.textContent;
        if (!text || text === "Processing failed.") {
            showToast("No text to copy", "warning");
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            const originalHTML = copyResultButton.innerHTML;
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
