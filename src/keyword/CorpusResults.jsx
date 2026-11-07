import React, { useState, useMemo } from "react";

const number = (value) =>
  value.toLocaleString(undefined, { maximumFractionDigits: 1 });
const panel =
  "bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 min-w-0";
const muted = "text-sm text-muted-foreground leading-relaxed";
const control =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

// Merge overlapping ranges and render source text as React text nodes.
function Excerpt({ source, start, end, hits }) {
  const ranges = hits
    .filter((h) => h.start < end && h.end > start)
    .sort((a, b) => a.start - b.start);
  const merged = [];
  for (const hit of ranges) {
    const a = Math.max(start, hit.start),
      b = Math.min(end, hit.end);
    const previous = merged.at(-1);
    if (previous && a <= previous.end) previous.end = Math.max(previous.end, b);
    else merged.push({ start: a, end: b });
  }
  const nodes = [];
  let cursor = start;
  merged.forEach((range, i) => {
    nodes.push(source.slice(cursor, range.start));
    nodes.push(
      <mark key={i} className="bg-primary/20 text-foreground rounded-sm">
        {source.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  });
  nodes.push(source.slice(cursor, end));
  return (
    <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
      {start > 0 && "…"}
      {nodes}
      {end < source.length && "…"}
    </p>
  );
}
function Stat({ label, value, note }) {
  return (
    <div className="bg-background rounded-xl border border-border p-4 min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-bold mt-1 break-words">{value}</dd>
      {note && <p className="text-xs text-muted-foreground mt-2">{note}</p>}
    </div>
  );
}
function exportReport(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = "keyword-corpus-analysis.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function CorpusResults({ data, source }) {
  const [targetIndex, setTargetIndex] = useState(0);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [segmentPage, setSegmentPage] = useState(0);
  const allHits = useMemo(
    () => data.stats.flatMap((stat) => stat.hits),
    [data],
  );
  const stat = data.stats[targetIndex];
  const segment = data.windows[segmentIndex];
  const maxRate = Math.max(
    1,
    ...data.windows
      .slice(segmentPage * 100, segmentPage * 100 + 100)
      .map((w) => w.rate),
  );
  const maxThirdRate = Math.max(1, ...stat.sections.map((s) => s.rate));
  const totalPages = Math.ceil(stat.hits.length / 10);
  return (
    <div className="space-y-6" aria-label="Corpus analysis results">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-2xl font-bold">Corpus findings</h2>
        <button className={control} onClick={() => exportReport(data)}>
          Export analysis (JSON)
        </button>
      </div>
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Words / unique forms"
          value={`${number(data.wordCount)} / ${number(data.vocabularySize)}`}
          note={`${number(data.sentenceCount)} estimated sentences`}
        />
        <Stat
          label="Target mentions"
          value={number(data.totalMatches)}
          note="Each target counts independently; overlaps can count twice."
        />
        <Stat
          label="Matched word coverage"
          value={`${number(data.coverage)}%`}
          note="Words touched by any target, counted once."
        />
        <Stat
          label="Segments with matches"
          value={`${data.windows.filter((w) => w.count).length} / ${data.windows.length}`}
          note={`Up to ${data.windowSize} words per segment`}
        />
      </dl>
      <section className={panel}>
        <h3 className="text-lg font-bold">What the evidence suggests</h3>
        <ul className="list-disc pl-5 space-y-3 text-sm leading-relaxed">
          {data.insights.map((insight, i) => (
            <li key={i}>{insight}</li>
          ))}
        </ul>
      </section>
      <section className={panel}>
        <h3 className="text-lg font-bold">Keyword prevalence</h3>
        <p className={muted}>
          Density = mentions ÷ corpus words × 100 (not word coverage; can exceed
          100% for substrings). Mentions per 1,000 words make targets comparable
          across text lengths. Partial matching counts every non-overlapping
          substring occurrence, including multiple occurrences inside one word.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                {[
                  "Target",
                  "Mentions",
                  "Density",
                  "Per 1,000 words",
                  "Segments reached",
                  "Sentence reach",
                  "Explore",
                ].map((h) => (
                  <th
                    key={h}
                    className="p-3 whitespace-nowrap font-medium"
                    scope="col"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.stats.map((s, i) => (
                <tr key={s.keyword} className="border-b border-border">
                  <th scope="row" className="p-3 break-words max-w-64">
                    {s.keyword}
                  </th>
                  <td className="p-3">{number(s.count)}</td>
                  <td className="p-3">{number(s.density)}%</td>
                  <td className="p-3">{number(s.rate)}</td>
                  <td className="p-3">
                    {s.segmentCount}/{data.windows.length}
                  </td>
                  <td className="p-3">
                    {s.sentenceCount}/{data.sentenceCount}
                  </td>
                  <td className="p-3">
                    <button
                      className={control}
                      aria-label={`Explore ${s.keyword}`}
                      onClick={() => {
                        setTargetIndex(i);
                        setPage(0);
                        document
                          .getElementById("target-detail")
                          ?.scrollIntoView({
                            behavior: "instant",
                            block: "start",
                          });
                      }}
                    >
                      Explore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className={`${panel} scroll-mt-24`} id="target-detail">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h3 className="text-lg font-bold">Target explorer</h3>
          <select
            className={`${control} max-w-full`}
            aria-label="Explore target"
            value={targetIndex}
            onChange={(e) => {
              setTargetIndex(Number(e.target.value));
              setPage(0);
            }}
          >
            {data.stats.map((s, i) => (
              <option key={s.keyword} value={i}>
                {s.keyword}
              </option>
            ))}
          </select>
        </div>
        {!stat.count ? (
          <p className={muted}>
            No occurrences of “{stat.keyword}” in this matching mode. Try a
            shorter partial-word target or check its spelling.
          </p>
        ) : (
          <>
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat
                label="First / last mention (word)"
                value={`${stat.firstWord} / ${stat.lastWord}`}
              />
              <Stat
                label="Median words between mentions"
                value={stat.medianGap === null ? "—" : number(stat.medianGap)}
                note="Excludes leading/trailing gaps; overlapping spans have gap 0."
              />
              <Stat
                label="Distribution evenness"
                value={
                  stat.spread === null ? "—" : `${number(stat.spread)}/100`
                }
                note="100 = mentions proportional to segment length. Needs ≥2 mentions and ≥2 segments."
              />
              <Stat
                label="Matched word forms"
                value={stat.formCount}
                note="Distinct enclosing word/phrase forms; case-insensitive."
              />
            </dl>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Frequency through the text</h4>
                <p className={muted}>
                  {stat.trend}. This compares the first and final thirds; text
                  order is not a time trend. Direction labels require at least 5
                  mentions, 30 words, and a rate ratio above 1.5. A middle
                  concentration also needs at least 3 mentions there.
                </p>
                {stat.sections.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs gap-2 mb-1">
                      <span>
                        {["Beginning", "Middle", "End"][i]} · {s.end - s.start}{" "}
                        words
                      </span>
                      <span>
                        {s.count} mentions · {number(s.rate)}/1,000
                      </span>
                    </div>
                    <div className="h-2 bg-background rounded-full">
                      <div
                        className="h-2 bg-primary rounded-full"
                        style={{ width: `${(s.rate / maxThirdRate) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">What actually matched</h4>
                <p className={muted}>
                  Most frequent enclosing forms (up to 15). Counts are
                  occurrences, so a form can match more than once.
                </p>
                <div className="flex flex-wrap gap-2">
                  {stat.forms.map((f) => (
                    <span
                      className="rounded-lg border border-border px-3 py-1 text-sm break-all"
                      key={f.text}
                    >
                      {f.text} <strong>×{f.count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Nearby vocabulary</h4>
              <p className={`${muted} mb-3`}>
                Within 5 words on either side, in the same estimated sentence;
                each term counts at most once per mention. Common English
                function words are omitted. Frequent neighbors suggest recurring
                context, not a proven relationship.
              </p>
              {stat.context.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr>
                        {[
                          "Term",
                          "Mentions with term",
                          "Share of mentions",
                          "Occurrences in corpus",
                        ].map((h) => (
                          <th
                            className="p-2 font-medium text-muted-foreground"
                            key={h}
                            scope="col"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stat.context.map((c) => (
                        <tr key={c.text} className="border-t border-border">
                          <th scope="row" className="p-2 break-all">
                            {c.text}
                          </th>
                          <td className="p-2">{c.count}</td>
                          <td className="p-2">{number(c.share)}%</td>
                          <td className="p-2">{c.corpusCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={muted}>No eligible nearby terms.</p>
              )}
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Occurrences in context</h4>
              <p className={muted}>
                Showing {page * 10 + 1}–{Math.min((page + 1) * 10, stat.count)}{" "}
                of {stat.count}. Excerpts preserve the original text;
                highlighted spans are the selected target.
              </p>
              {stat.hits.slice(page * 10, page * 10 + 10).map((hit, i) => (
                <div
                  className="border-l-2 border-primary pl-4 py-2 space-y-1"
                  key={i}
                >
                  <p className="text-xs text-muted-foreground">
                    Mention {page * 10 + i + 1} · word {hit.wordIndex + 1} ·
                    character {hit.start + 1}
                  </p>
                  <Excerpt
                    source={source}
                    start={Math.max(0, hit.start - 110)}
                    end={Math.min(source.length, hit.end + 160)}
                    hits={[hit]}
                  />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <button
                  className={`${control} disabled:opacity-40`}
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous occurrences
                </button>
                <span className="text-xs">
                  {page + 1}/{totalPages}
                </span>
                <button
                  className={`${control} disabled:opacity-40`}
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next occurrences
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      <section className={panel}>
        <h3 className="text-lg font-bold">Distribution heatmap</h3>
        <p className={muted}>
          Color reflects mentions per 1,000 words within the displayed segments,
          including the shorter final segment. Numbers are raw counts. A phrase
          belongs to the segment where it starts.
        </p>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {data.windows
            .slice(segmentPage * 100, segmentPage * 100 + 100)
            .map((w, localIndex) => {
              const i = segmentPage * 100 + localIndex;
              return (
                <button
                  key={i}
                  aria-label={`Segment ${i + 1}: words ${w.start + 1}–${w.end}, ${w.count} mentions, ${number(w.rate)} per 1,000 words`}
                  aria-pressed={segmentIndex === i}
                  onClick={() => setSegmentIndex(i)}
                  className={`rounded-lg border p-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${segmentIndex === i ? "border-primary ring-2 ring-primary" : "border-border"}`}
                  style={{
                    backgroundColor: `hsl(var(--primary) / ${w.count ? 0.1 + (w.rate / maxRate) * 0.55 : 0})`,
                  }}
                >
                  {w.count}
                </button>
              );
            })}
        </div>
        {data.windows.length > 100 && (
          <div className="flex gap-3 items-center">
            <button
              className={control}
              disabled={segmentPage === 0}
              onClick={() => setSegmentPage((p) => p - 1)}
            >
              Previous segments
            </button>
            <span className="text-xs">
              {segmentPage + 1}/{Math.ceil(data.windows.length / 100)}
            </span>
            <button
              className={control}
              disabled={(segmentPage + 1) * 100 >= data.windows.length}
              onClick={() => setSegmentPage((p) => p + 1)}
            >
              Next segments
            </button>
          </div>
        )}
        {segment && (
          <div className="bg-background p-4 rounded-xl space-y-3">
            <h4 className="font-semibold">
              Segment {segmentIndex + 1} · words {segment.start + 1}–
              {segment.end}
            </h4>
            <p className={muted}>
              {segment.count} mentions · {number(segment.rate)} per 1,000 words
            </p>
            <Excerpt
              source={source}
              start={segment.charStart}
              end={segment.charEnd}
              hits={allHits}
            />
          </div>
        )}
      </section>
      <section className={panel}>
        <h3 className="text-lg font-bold">Peak saturation</h3>
        {data.peak ? (
          <>
            <p className={muted}>
              The fixed {data.peak.end - data.peak.start}-word window containing
              the most mention starts (earliest wins ties). Words{" "}
              {data.peak.start + 1}–{data.peak.end}: {data.peak.count} mentions
              · {number(data.peak.rate)}/1,000 words. Matches may continue
              beyond the window.
            </p>
            <Excerpt
              source={source}
              start={data.peak.charStart}
              end={data.peak.charEnd}
              hits={allHits}
            />
          </>
        ) : (
          <p className={muted}>No matching passage found.</p>
        )}
      </section>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className={panel}>
          <h3 className="text-lg font-bold">Targets appearing together</h3>
          <p className={muted}>
            Matches are attributed to the sentence where they start. Shared
            estimated sentences are counted once per target pair per sentence.
            Lift compares the observed count with the count expected if sentence
            presence were independent. It is descriptive, not a significance
            test; rare pairs can have high lift, and overlapping targets can
            inflate association.
          </p>
          {data.cooccurrence.length ? (
            <ul className="divide-y divide-border">
              {data.cooccurrence.map((pair, i) => (
                <li className="py-3 text-sm break-words" key={i}>
                  <strong>
                    {pair.a} + {pair.b}
                  </strong>
                  <p className="text-muted-foreground">
                    {pair.count} shared sentences · {number(pair.lift)}×
                    expected
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className={muted}>No supplied target pair shares a sentence.</p>
          )}
        </section>
        <section className={panel}>
          <h3 className="text-lg font-bold">Repeated language</h3>
          <p className={muted}>
            Recurring 2–4 word phrases across the corpus (up to 15). Phrases do
            not cross punctuation or sentence boundaries. English function words
            are allowed inside a phrase; overlapping repetitions count.
          </p>
          {data.repeatedPhrases.length ? (
            <ul className="divide-y divide-border">
              {data.repeatedPhrases.map((p) => (
                <li key={p.text} className="py-3 text-sm break-words">
                  <strong>{p.text}</strong>
                  <p className="text-muted-foreground">
                    {p.count} repetitions · {p.sentences} sentences ·{" "}
                    {p.nearTargets} in sentences containing a target
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className={muted}>No repeated eligible phrases found.</p>
          )}
        </section>
      </div>
      <details className={panel}>
        <summary className="font-semibold cursor-pointer">
          How to read these results
        </summary>
        <p className={muted}>
          All matching is case-insensitive. Exact Match and Whole Word require
          complete words or phrases with Unicode-aware boundaries. Exact Match
          keeps apostrophes and hyphens inside a word; Whole Word also matches
          components on either side of them. Underscores remain part of a word
          boundary. Literal phrases accept flexible whitespace. Partial Match
          searches literal substrings. Regular Expression uses JavaScript
          Unicode patterns; zero-length matches are skipped. Matches for each
          target do not overlap themselves.
        </p>
        <p className={muted}>
          Word counts use Unicode letters, marks, and numbers, with internal
          apostrophes and hyphens. Sentences are estimated using periods,
          question marks, exclamation marks, and line breaks; abbreviations can
          split sentences. Languages without spaces may need separate
          segmentation. Counts describe this supplied corpus, not a
          representative population. These measurements cannot establish
          sentiment, author intent, chronology, causation, or SEO ranking.
          Nearby-term filtering uses a small English stop-word list. JSON export
          includes match offsets and measurements, without the complete source
          text.
        </p>
      </details>
    </div>
  );
}
