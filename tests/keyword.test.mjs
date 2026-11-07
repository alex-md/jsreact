import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeCorpus } from "../src/keyword/analyzeCorpus.js";
const analyze = (text, keywords, options = {}) =>
  analyzeCorpus({ text, keywords, ...options });

test("literal modes are case insensitive and partial counts occurrences inside words", () => {
  const text = "Cat cats concatenate cat-cat CAT. banana";
  assert.deepEqual(
    analyze(text, ["cat", "ana"]).stats.map((s) => s.count),
    [6, 1],
  );
  for (const matchingStrategy of ["exact", "word"]) {
    assert.equal(
      analyze(text, ["cat"], { matchingStrategy }).totalMatches,
      matchingStrategy === "word" ? 4 : 2,
    );
  }
  assert.equal(analyze("aaaa", ["aa"]).totalMatches, 2);
});
test("literal metacharacters, flexible phrases, and Unicode boundaries", () => {
  assert.equal(analyze("C++ c++ c+", ["c++"]).totalMatches, 2);
  const data = analyze(
    "naïve naïveté ÉCOLE école. cafe\u0301 cafe\u0301ine",
    ["naïve", "école", "cafe\u0301"],
    { matchingStrategy: "word" },
  );
  assert.deepEqual(
    data.stats.map((s) => s.count),
    [1, 2, 1],
  );
  const phrase = analyze("Clean\n energy clean energy.", ["clean energy"], {
    matchingStrategy: "word",
    windowSize: 1,
  });
  assert.equal(phrase.totalMatches, 2);
  assert.equal(phrase.coverage, 100);
  assert.deepEqual(
    phrase.windows.map((w) => w.count),
    [1, 0, 1, 0],
  );
});
test("deduplicates targets, preserves submitted casing, and ignores empty targets", () => {
  const data = analyze("Cat cat", [" Cat ", "cat", ""]);
  assert.equal(data.stats.length, 1);
  assert.equal(data.stats[0].keyword, "Cat");
  assert.equal(data.totalMatches, 2);
});
test("overlapping targets count separately while token coverage is a union", () => {
  const data = analyze("solar energy solar", ["solar", "solar energy"]);
  assert.equal(data.totalMatches, 3);
  assert.equal(data.coverage, 100);
  assert.equal(data.stats[1].hits[0].wordEnd, 2);
});
test("preserves source offsets and excludes the next word after regex trailing whitespace", () => {
  const text = '<script>alert("solar")</script> solar  energy';
  const data = analyze(text, ["solar\\s+"], { matchingStrategy: "regex" });
  const hit = data.stats[0].hits[0];
  assert.equal(text.slice(hit.start, hit.end), "solar  ");
  assert.equal(hit.wordEnd - hit.wordIndex, 1);
  assert.equal(data.stats[0].forms[0].text, "solar");
  assert.equal("highlightedText" in data, false);
});
test("regex works and invalid expressions report a target-specific error", () => {
  assert.equal(
    analyze("run running runs", ["run(?:ning|s)?"], {
      matchingStrategy: "regex",
    }).totalMatches,
    3,
  );
  assert.throws(
    () => analyze("text", ["["], { matchingStrategy: "regex" }),
    /Invalid regular expression/,
  );
  assert.equal(
    analyze("abc", ["(?=a)"], { matchingStrategy: "regex" }).totalMatches,
    0,
  );
});
test("empty and punctuation-only corpora have finite metrics", () => {
  for (const text of ["", "!!!\n…"]) {
    const data = analyze(text, ["z"]);
    assert.equal(data.wordCount, 0);
    assert.equal(data.coverage, 0);
    assert.equal(data.stats[0].spread, null);
    assert.equal(data.peak, null);
    assert.equal(data.stats[0].rate, 0);
  }
});
test("short final segment is normalized and distribution does not depend on raw frequency scale", () => {
  const data = analyze("cat x x x cat", ["cat"], { windowSize: 4 });
  assert.deepEqual(
    data.windows.map((w) => w.rate),
    [250, 1000],
  );
  assert.ok(Math.abs(data.stats[0].spread - 70) < 1e-9);
  assert.equal(
    analyze("cat x", ["cat"], { windowSize: 1 }).stats[0].spread,
    null,
  );
});
test("nearby terms count once per mention, stay inside sentences, and report corpus baseline", () => {
  const data = analyze("solar bright bright. distant alone. solar power.", [
    "solar",
  ]);
  const context = data.stats[0].context;
  assert.equal(context.find((t) => t.text === "bright").count, 1);
  assert.equal(context.find((t) => t.text === "bright").corpusCount, 2);
  assert.equal(context.find((t) => t.text === "bright").share, 50);
  assert.equal(
    context.some((t) => t.text === "distant"),
    false,
  );
});
test("line breaks split unpunctuated sentences and co-occurrence is per sentence", () => {
  const data = analyze("cat cat dog\ncat dog\ncat\ndog", ["cat", "dog"]);
  assert.equal(data.sentenceCount, 4);
  assert.equal(data.stats[0].sentenceCount, 3);
  assert.equal(data.cooccurrence[0].count, 2);
  assert.ok(Math.abs(data.cooccurrence[0].lift - 8 / 9) < 1e-9);
});
test("repeated phrases retain internal function words without crossing punctuation", () => {
  const data = analyze(
    "power of nature. power of nature! solar, energy. solar, energy.",
    ["power"],
  );
  const phrase = data.repeatedPhrases.find((p) => p.text === "power of nature");
  assert.equal(phrase.count, 2);
  assert.equal(phrase.sentences, 2);
  assert.equal(phrase.nearTargets, 2);
  assert.equal(
    data.repeatedPhrases.some((p) => p.text === "solar energy"),
    false,
  );
});
test("frequency direction requires sufficient evidence and uses normalized thirds", () => {
  const text = [...Array(20).fill("x"), ...Array(10).fill("solar")].join(" ");
  const stat = analyze(text, ["solar"]).stats[0];
  assert.equal(stat.trend, "More frequent near the end");
  assert.deepEqual(
    stat.sections.map((s) => s.count),
    [0, 0, 10],
  );
  assert.equal(
    analyze("solar solar", ["solar"]).stats[0].trend,
    "Insufficient evidence",
  );
});
test("peak scanning and segment totals agree with independent brute-force counts", () => {
  for (let size = 1; size <= 11; size++) {
    const tokens = Array.from({ length: 47 }, (_, i) =>
      i % 7 === 0 || i % 11 === 0 ? "target" : "other",
    );
    const data = analyze(tokens.join(" "), ["target", "tar"], {
      windowSize: size,
    });
    const counts = Array.from(
      { length: tokens.length - size + 1 },
      (_, i) =>
        tokens.slice(i, i + size).filter((t) => t === "target").length * 2,
    );
    assert.equal(data.peak.count, Math.max(...counts));
    assert.equal(data.peak.start, counts.indexOf(Math.max(...counts)));
    assert.equal(
      data.windows.reduce((sum, w) => sum + w.count, 0),
      data.totalMatches,
    );
  }
});
test("long corpus keeps counts and reach accurate", () => {
  const data = analyze(
    "Solar energy grows. Wind energy grows.\n".repeat(5000),
    ["solar", "energy"],
    { windowSize: 100 },
  );
  assert.equal(data.wordCount, 30000);
  assert.equal(data.totalMatches, 15000);
  assert.equal(data.stats[1].sentenceCount, 10000);
  assert.equal(data.windows.length, 300);
});

test("punctuation outside a sentence does not invent sentence co-occurrence", () => {
  const data = analyze("!!!\ncat dog", ["!", "cat"], {
    matchingStrategy: "regex",
  });
  assert.equal(data.stats[0].sentenceCount, 0);
  assert.equal(data.cooccurrence.length, 0);
});
test("middle concentrations and window fallback are explicit", () => {
  const text = [
    ...Array(10).fill("x"),
    ...Array(10).fill("cat"),
    ...Array(10).fill("x"),
  ].join(" ");
  const data = analyze(text, ["cat"], { windowSize: Infinity });
  assert.equal(data.stats[0].trend, "Concentrated in the middle");
  assert.equal(data.windowSize, 50);
  assert.ok(Math.abs(data.stats[0].density - 100 / 3) < 1e-9);
});
