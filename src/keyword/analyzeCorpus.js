// All positions are UTF-16 offsets in the original source. No HTML is generated.
const WORD = /[\p{L}\p{N}\p{M}]+(?:['’\-][\p{L}\p{N}\p{M}]+)*/gu;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const stopWords = new Set(
  "a an the and or but if to of in on at for from by with is are was were be been being it its this that these those as not no i you he she we they my your our their has have had do does did can could will would should may might".split(
    " ",
  ),
);
const rate = (count, length) => (length ? (count / length) * 1000 : 0);
const ranked = (map) =>
  [...map.entries()]
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));
function lowerBound(items, offset, key = "end") {
  let lo = 0,
    hi = items.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (items[mid][key] <= offset) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
function spread(counts, sizes, total) {
  const sum = counts.reduce((a, b) => a + b, 0);
  return sum < 2 || counts.length < 2
    ? null
    : 100 *
        (1 -
          counts.reduce(
            (acc, count, i) => acc + Math.abs(count / sum - sizes[i] / total),
            0,
          ) /
            2);
}
export function analyzeCorpus({
  text = "",
  keywords = [],
  matchingStrategy = "partial",
  windowSize = 50,
}) {
  const source = String(text);
  const words = [...source.matchAll(WORD)].map((m) => ({
    text: m[0],
    lower: m[0].toLowerCase(),
    start: m.index,
    end: m.index + m[0].length,
  }));
  const wordCount = words.length;
  const requestedSize = Number(windowSize);
  const size =
    Number.isFinite(requestedSize) && requestedSize > 0
      ? Math.max(1, Math.floor(requestedSize))
      : 50;
  const targets = [
    ...new Set(
      keywords
        .map((k) => String(k).trim())
        .filter(Boolean)
        .map((k) => k.toLowerCase()),
    ),
  ].map((k) =>
    String(keywords.find((v) => String(v).trim().toLowerCase() === k)).trim(),
  );
  const sentences = [...source.matchAll(/[^.!?\n]+[.!?]*/gu)]
    .filter((m) => /[\p{L}\p{N}]/u.test(m[0]))
    .map((m) => ({ start: m.index, end: m.index + m[0].length, targets: [] }));
  const sentenceFor = (offset) => {
    const index = lowerBound(sentences, offset);
    return sentences[index]?.start <= offset ? index : -1;
  };
  const vocabulary = new Map();
  words.forEach((word) => {
    vocabulary.set(word.lower, (vocabulary.get(word.lower) || 0) + 1);
    word.sentence = sentenceFor(word.start);
  });
  const windows = Array.from(
    { length: Math.ceil(wordCount / size) },
    (_, i) => {
      const start = i * size,
        end = Math.min(wordCount, start + size);
      return {
        start,
        end,
        charStart: start === 0 ? 0 : words[start].start,
        charEnd: end === wordCount ? source.length : words[end].start,
        count: 0,
        counts: targets.map(() => 0),
        rate: 0,
      };
    },
  );
  const covered = new Uint8Array(wordCount);
  const thirds = Array.from({ length: 3 }, (_, i) => ({
    start: Math.floor((i * wordCount) / 3),
    end: Math.floor(((i + 1) * wordCount) / 3),
  }));
  const stats = targets.map((keyword, targetIndex) => {
    let regex;
    try {
      const literal = escapeRegex(keyword).replace(/\s+/g, "\\s+");
      // Exact retains hyphenated/apostrophized tokens; Whole Word also finds
      // components joined by a hyphen or apostrophe, using Unicode boundaries.
      const boundary =
        matchingStrategy === "word"
          ? "\\p{L}\\p{N}\\p{M}_"
          : "\\p{L}\\p{N}\\p{M}_'’\\-";
      regex = new RegExp(
        matchingStrategy === "regex"
          ? keyword
          : matchingStrategy === "partial"
            ? literal
            : `(?<![${boundary}])${literal}(?![${boundary}])`,
        "giu",
      );
    } catch (error) {
      throw new Error(
        `Invalid regular expression for “${keyword}”: ${error.message}`,
      );
    }
    const hits = [],
      forms = new Map(),
      nearby = new Map(),
      sentenceIds = new Set();
    for (const match of source.matchAll(regex)) {
      if (!match[0].length) continue; // Zero-width regex matches do not describe textual mentions.
      const start = match.index,
        end = start + match[0].length;
      const first = lowerBound(words, start),
        last = lowerBound(words, end - 1, "start");
      // Punctuation-only matches count as mentions but cover no words.
      const overlaps = first < wordCount && words[first].start < end;
      const wordIndex = Math.min(first, Math.max(0, wordCount - 1));
      const wordEnd = overlaps ? Math.min(wordCount, last) : wordIndex;
      const sentence = sentenceFor(start);
      hits.push({ start, end, wordIndex, wordEnd, sentence });
      if (sentence >= 0 && sentence < sentences.length)
        sentenceIds.add(sentence);
      if (windows.length) {
        const w = windows[Math.floor(wordIndex / size)];
        w.count++;
        w.counts[targetIndex]++;
      }
      if (overlaps) {
        for (let i = first; i < wordEnd; i++) covered[i] = 1;
        const form = source
          .slice(words[first].start, words[wordEnd - 1].end)
          .toLowerCase();
        forms.set(form, (forms.get(form) || 0) + 1);
        // Context stops at sentence boundaries and excludes the matched span.
        const seen = new Set();
        for (
          let i = Math.max(0, first - 5);
          i < Math.min(wordCount, wordEnd + 5);
          i++
        ) {
          if ((i >= first && i < wordEnd) || words[i].sentence !== sentence)
            continue;
          if (!stopWords.has(words[i].lower) && words[i].lower.length > 1)
            seen.add(words[i].lower);
        }
        seen.forEach((term) => nearby.set(term, (nearby.get(term) || 0) + 1));
      }
    }
    sentenceIds.forEach((id) => sentences[id].targets.push(targetIndex));
    const counts = windows.map((w) => w.counts[targetIndex]);
    const sections = thirds.map((section) => {
      const count = hits.filter(
        (h) => h.wordIndex >= section.start && h.wordIndex < section.end,
      ).length;
      return {
        ...section,
        count,
        rate: rate(count, section.end - section.start),
      };
    });
    const gaps = hits
      .slice(1)
      .map((h, i) => Math.max(0, h.wordIndex - hits[i].wordEnd))
      .sort((a, b) => a - b);
    const medianGap = gaps.length
      ? (gaps[Math.floor((gaps.length - 1) / 2)] +
          gaps[Math.floor(gaps.length / 2)]) /
        2
      : null;
    const firstRate = sections[0].rate,
      lastRate = sections[2].rate;
    const trend =
      hits.length < 5 || wordCount < 30
        ? "Insufficient evidence"
        : sections[1].count >= 3 &&
            sections[1].rate > Math.max(firstRate, lastRate) * 1.5
          ? "Concentrated in the middle"
          : lastRate > firstRate * 1.5
            ? "More frequent near the end"
            : firstRate > lastRate * 1.5
              ? "More frequent near the beginning"
              : "Similar beginning/end rates";
    const context = ranked(nearby)
      .slice(0, 10)
      .map((term) => ({
        ...term,
        share: (term.count / hits.length) * 100,
        corpusCount: vocabulary.get(term.text),
      }));
    return {
      keyword,
      hits,
      count: hits.length,
      density: wordCount ? (hits.length / wordCount) * 100 : 0,
      rate: rate(hits.length, wordCount),
      forms: ranked(forms).slice(0, 15),
      formCount: forms.size,
      context,
      sentenceCount: sentenceIds.size,
      segmentCount: counts.filter(Boolean).length,
      spread: spread(
        counts,
        windows.map((w) => w.end - w.start),
        wordCount,
      ),
      sections,
      trend,
      medianGap,
      firstWord: hits.length ? hits[0].wordIndex + 1 : null,
      lastWord: hits.length ? hits.at(-1).wordIndex + 1 : null,
    };
  });
  windows.forEach((w) => {
    w.rate = rate(w.count, w.end - w.start);
  });
  const totalMatches = stats.reduce((sum, stat) => sum + stat.count, 0);
  const pairs = new Map();
  sentences.forEach((sentence) => {
    for (let a = 0; a < sentence.targets.length; a++)
      for (let b = a + 1; b < sentence.targets.length; b++) {
        const key = `${sentence.targets[a]},${sentence.targets[b]}`;
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
  });
  const cooccurrence = ranked(pairs)
    .slice(0, 12)
    .map((pair) => {
      const [a, b] = pair.text.split(",").map(Number);
      const expected =
        (stats[a].sentenceCount * stats[b].sentenceCount) /
        (sentences.length || 1);
      return {
        a: stats[a].keyword,
        b: stats[b].keyword,
        count: pair.count,
        lift: expected ? pair.count / expected : 0,
      };
    });
  const phrases = new Map();
  for (let i = 0; i < words.length; i++)
    for (let length = 2; length <= 4 && i + length <= words.length; length++) {
      const end = i + length - 1;
      if (
        words[i].sentence !== words[end].sentence ||
        /[^\p{L}\p{N}\p{M}\s'’\-]/u.test(
          source.slice(words[i].start, words[end].end),
        )
      )
        continue;
      if (stopWords.has(words[i].lower) || stopWords.has(words[end].lower))
        continue;
      const phrase = words
        .slice(i, end + 1)
        .map((w) => w.lower)
        .join(" ");
      let entry = phrases.get(phrase);
      if (!entry) {
        entry = {
          text: phrase,
          count: 0,
          sentences: new Set(),
          nearTargets: 0,
        };
        phrases.set(phrase, entry);
      }
      entry.count++;
      entry.sentences.add(words[i].sentence);
      if (sentences[words[i].sentence]?.targets.length) entry.nearTargets++;
    }
  const repeatedPhrases = [...phrases.values()]
    .filter((p) => p.count >= 2)
    .sort(
      (a, b) =>
        b.count - a.count ||
        b.text.length - a.text.length ||
        a.text.localeCompare(b.text),
    )
    .slice(0, 15)
    .map((p) => ({ ...p, sentences: p.sentences.size }));
  // Sliding fixed-length window, using start-position prefix counts, O(words + hits).
  const prefix = new Uint32Array(wordCount + 1);
  stats.forEach((stat) =>
    stat.hits.forEach((h) => {
      if (wordCount) prefix[h.wordIndex + 1]++;
    }),
  );
  for (let i = 1; i <= wordCount; i++) prefix[i] += prefix[i - 1];
  const peakSize = Math.min(size, wordCount);
  let peak = null;
  for (let i = 0; peakSize && i <= wordCount - peakSize; i++) {
    const count = prefix[i + peakSize] - prefix[i];
    if (count && (!peak || count > peak.count))
      peak = {
        start: i,
        end: i + peakSize,
        charStart: words[i].start,
        charEnd: words[i + peakSize - 1].end,
        count,
        rate: rate(count, peakSize),
      };
  }
  const insights = [];
  const reached = windows.filter((w) => w.count).length;
  if (!totalMatches)
    insights.push(
      "No matches were found. Check the targets and matching mode before drawing conclusions about this corpus.",
    );
  else {
    insights.push(
      `${totalMatches.toLocaleString()} target mentions occur in ${reached} of ${windows.length} segments. ${covered.reduce((a, b) => a + b, 0).toLocaleString()} of ${wordCount.toLocaleString()} words overlap at least one match; overlapping targets are counted once in word coverage.`,
    );
    const leader = [...stats].sort((a, b) => b.count - a.count)[0];
    if (stats.length > 1)
      insights.push(
        `“${leader.keyword}” accounts for ${((leader.count / totalMatches) * 100).toFixed(1)}% of target mentions. This describes the supplied targets, not the prevalence of every topic in the corpus.`,
      );
    if (peak && wordCount > peakSize)
      insights.push(
        `The strongest ${peakSize}-word passage begins at word ${peak.start + 1}: ${peak.count} mentions (${(peak.rate / (rate(totalMatches, wordCount) || 1)).toFixed(1)}× the corpus mention rate). This is a local concentration, not evidence of importance or quality.`,
      );
  }
  const recurring = [...stats]
    .sort((a, b) => b.count - a.count)
    .filter((s) => s.count >= 5)
    .slice(0, 3);
  recurring.forEach((stat) => {
    if (stat.segmentCount < windows.length / 2)
      insights.push(
        `“${stat.keyword}” appears ${stat.count} times but reaches only ${stat.segmentCount} of ${windows.length} segments. Its recurrence is localized rather than corpus-wide at the selected segment size.`,
      );
    if (
      !stat.trend.startsWith("Insufficient") &&
      !stat.trend.startsWith("Similar")
    )
      insights.push(
        `“${stat.keyword}”: ${stat.trend.toLowerCase()}. Beginning / middle / end rates are ${stat.sections.map((s) => s.rate.toFixed(1)).join(" / ")} per 1,000 words; this describes narrative position, not change over time.`,
      );
    const neighbor = stat.context.find(
      (c) =>
        c.count >= 3 &&
        c.share >= 40 &&
        !stat.forms.some((f) => f.text === c.text),
    );
    if (neighbor)
      insights.push(
        `“${neighbor.text}” occurs near ${neighbor.count} of ${stat.count} mentions of “${stat.keyword}” (${neighbor.share.toFixed(1)}%). This repeated local context may be useful when comparing passages; the term occurs ${neighbor.corpusCount} times overall.`,
      );
  });
  if (repeatedPhrases.length) {
    const phrase = repeatedPhrases[0];
    insights.push(
      `The recurring phrase “${phrase.text}” appears ${phrase.count} times across ${phrase.sentences} estimated sentences, with ${phrase.nearTargets} occurrences in sentences containing a target. Inspect the passages to distinguish recurring subject matter from repeated wording.`,
    );
  }
  return {
    wordCount,
    sentenceCount: sentences.length,
    vocabularySize: vocabulary.size,
    totalMatches,
    coverage: wordCount
      ? (covered.reduce((a, b) => a + b, 0) / wordCount) * 100
      : 0,
    windows,
    stats,
    cooccurrence,
    repeatedPhrases,
    peak,
    insights,
    matchingStrategy,
    windowSize: size,
  };
}
