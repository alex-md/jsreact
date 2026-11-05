# Codebase refactoring — November 5, 2026

Used the installed `codebase-refactoring`, `dry-refactoring`, and `jscpd` skills from
https://github.com/kucherenko/jscpd. The installed main skill matched upstream.
Analyzer: jscpd 5.4.2. Changes remain local; no commit or deployment was made.

## Repeat the audit

```sh
npm run audit:codebase
npx --yes jscpd@5.4.2 --dead-code --reporters ai .
npx --yes jscpd@5.4.2 --reporters ai --summary src functions scripts vite.config.js
```

The audit command downloads the pinned analyzer through npx when it is not cached.
`.jscpd.json` excludes dependencies, generated output, local tool state, and the
package lockfile. It explicitly includes HTML-loaded modules and separately
launched workers/functions as entry points, and counts test usage. Keep these
entry points current when adding or removing pages/workers. The analyzer does
not reliably discover inline HTML imports or `new Worker(new URL(...))` by itself.
An unconfigured scan incorrectly called live page/worker code dead; its initial
36/100 score was discarded. Measurements below use the corrected entry points.

## Changes

- Removed seven unused standalone analytics components. The active dashboard's
  own charts and metric cards remain in `AnalyticsDashboard.tsx`.
- Removed four unused OSRS files: the old buy/sell result components, global style
  component, and MUI theme. The current search, result cards, and calculations remain.
- Removed unused imports, an unused analytics type, the keyword analyzer's unused
  `StatBox`, unused elevation/Numigma helpers, and the unused Vite page-discovery
  function. Vite's explicit page inputs remain in place.
- Reused the text cleaner's existing `copyOutput` handler for its copy button.
- Shared Connect 4's transposition-table writes between heuristic and exact
  searches. Bound flags, depth, mirrored moves, cache limit, and search paths retain
  their previous behavior.
- Separated Numigma's seeded randomness, mathematical predicates, and clue-pack
  definitions into `random.js`, `math.js`, and `cluePacks.js`. `engine.js` keeps the
  existing public exports and puzzle orchestration. Simplified factory-result
  collection, candidate filtering, redundant guards, and attempt comparison.
- Added a Numigma regression suite with pre-refactoring digests for 120 seeded
  cases across all four difficulties, every individual pack, all packs together,
  no packs, and depth levels 0 and 3. Digests cover serialized output and clue
  predicate truth tables over the tested range.

## Measurements

| Metric | Before | After |
| --- | ---: | ---: |
| Overall health | 63.3 C | 72.5 B |
| Executable-code duplication | 0.7% | 0.4% |
| Dead-code findings with configured entries | 31 | 0 |
| Total estimated complexity, whole-repository dashboard | 3,954 | 3,841 |
| Exact clones, source/functions/scripts/Vite scan | 35 | 31 |
| Numigma orchestration file lines | 1,287 | 247 |

The Numigma file reduction is mostly organization, not removed functionality.
Its combined engine/math/clue/random complexity fell from 367 to 358; the engine
alone now measures 52. Connect 4's solver fell from 221 to 217. These are estimates,
not proofs of correctness or per-function cognitive-complexity measurements.

The complexity sub-score moved from 43.0 to 41.6: complex files account for 68.0%
of remaining code versus 65.1% before. Removing simple unused components changes
that denominator. The complexity pass was revisited to simplify the Numigma
branches and Connect 4 cache writes; total complexity decreased, but substantial
complexity remains. The aggregate health gain should not obscure this limitation.

## Reviewed findings left in place

- Repeated HTML metadata, page-shell bootstrapping, static article markup, CSS,
  import lists, and small UI fragments: these are declarative repetition or short
  idioms, rather than a useful shared abstraction in this pass.
- Connect 4's cache-read checks and different search loops: they have different
  horizon, tactical, and cancellation behavior. Only their identical cache-write
  policy was consolidated.
- OEIS seasonal model state updates: similar-looking code belongs to fitting and
  prediction passes. Changes to numerical behavior warrant separate focused work.
- OSRS buy/sell pricing formulas: renamed matches contain different market-side
  logic. Their shape alone does not justify merging the algorithms.
- Conservative renamed and similarity scans were also reviewed, using
  `--ignore-identifiers --min-tokens 70` and
  `--max-gap-lines 1 --similarity 0.85`. Remaining candidates include short string
  normalization helpers, pack-selection event handlers, keyboard shortcuts, and
  script/style markup generators. They were retained as small or distinct-context
  code; those wider scan counts are not counts of confirmed defects.

## Validation

- `npm run test:numigma`: 5 tests, including all 120 pre-refactoring comparisons.
- `npm run test:oeis`: 11 tests.
- `npm run test:connect4`: 18 tests, including the independent endgame oracle.
- `npm run build`: production build and sitemap generation pass. Existing large
  chunk and outdated Browserslist-data warnings remain.
- Built-site browser checks: Numigma worker generation and solution reveal;
  text cleaner cleaning, button/keyboard copy (mocked clipboard), and empty-output
  guard; existing `tests/connect4.browser.js` suite covering all three practice
  presets, stale-reply cancellation, worker retry, hints, wins/draws, undo/redo,
  invalid stored/shared state, help focus, and four pages at four viewport widths.
- React mount smoke checks cover analytics, domain, keyword, OSRS, and playground.
  These smoke checks do not validate external provider responses.
- `git diff --check` passes.
