# Superseeker methods on the OEIS page

This is an independent JavaScript implementation of bounded mathematical methods from [N. J. A. Sloane's published email-server and Superseeker source collection (August 2010)](https://oeis.org/ol_source.txt). It runs in the existing browser module worker. No Cloudflare service, D1 database, new dependency, licensed computer algebra system, or automatic OEIS request is needed. The original collection acknowledges separate rights for some contributed programs. Their implementation text has not been bundled or translated verbatim; this implementation uses the mathematical algorithms and records their provenance here.

The original service orchestrated shell, Fortran, Perl, Maple and Mathematica programs against local OEIS catalog files. The browser does not reproduce that infrastructure. A local exact match means a mathematical rule agrees with the supplied prefix, not that the prefix has been identified in OEIS or that the rule is uniquely correct.

## Source-to-implementation map

| Original component | Browser implementation | Bounds and differences |
| --- | --- | --- |
| `superproc1` polynomial differences | `exact.js`: polynomial discovery | Degrees 0–8; repeated constant differences required. |
| Mira Bernstein's `superprocfan` | `superseeker.js`: inverse-binomial fans | Up to four inverse-binomial layers, followed by polynomial or repeating-pattern recognition, then inverse reconstruction. Unlike the legacy tail-only `pseudoconst` check, the complete transformed prefix must agree. |
| `superproc8.f` periodic differences | `superseeker.js`: periodic differences | Difference depths 1–8, periods 2–12; at least two complete cycles. Existing constant-difference and direct-period tests cover period 1 and depth 0. Modular wrap is applied separately at every forecast step, repairing the legacy second-step boundary issue. |
| `superproc9.f` binary sequences | `transforms.js`: six binary associates | First-seen levels map to 1/2 and 2/1; 1-based level positions; completed run lengths; boundary positions. The last run is censored by the input boundary and is intentionally omitted, as in the Fortran code. These are clues and explicit OEIS search links. |
| Christian Kratthentaler's `Ratekurz` / rational interpolation | `superseeker.js`: rational index and quotient rules | Index n starts at 0; direct values and up to two successive quotient layers. Total numerator+denominator degree ≤4, denominator degree ≤2. Two final transformed terms are excluded from fitting; every term is checked. Zero denominators and missing future branches reject the candidate. |
| Additional exact family: factorial-driven recurrences | `superseeker.js`: exact nonhomogeneous recurrence discovery | Infer lag coefficients and a scaled (n+offset)! forcing term, orders 1–3 and offsets 0–3. Two terms are held out; verify the complete input. This recognizes families such as a(n)=a(n−1)+a(n−2)+n!, without hardcoded sequences or online lookups. |
| gfun `listtorec` and Harm Derksen's `guesss` | `superseeker.js`: polynomial-coefficient recurrence guessing | Exact linear relation solving for orders 1–3 and polynomial degrees 1–2. This covers a bounded linear/holonomic subset; it is not the general Padé–Hermite algorithm, differential-algebraic solver, or symbolic simplifier. Fit at most 32 equations before the final two terms, then verify the complete input. |
| gfun `guessgf` | `exact.js`: rational ordinary generating functions | Constant-coefficient recurrences expose exact numerator/denominator coefficient vectors. T008 recognizes simple patterns after factorial normalization, providing a bounded exponential-generating-function route. No general generating-function reversion/logarithmic-derivative search. |
| gfun `listtoalgeq` | `superseeker.js`: algebraic OGF guessing | Polynomial relation P(x,F)=0, degree 2–3 in F and 1–2 in x, using at most the first 32 terms for fitting and two held-out terms. Check all supplied terms. Enabled for inputs up to 40 terms. Requires nonzero P_F(0,a(0)), selecting a unique formal power series branch through the observed constant. |
| Simon Plouffe's `superbeattyprim` | `superseeker.js`: Beatty interval test | Exact rational intersection max(a(n)/n) ≤ α < min((a(n)+1)/n), n starts at 1. Reports the entire feasible interval and a representative slope, never an exact forecast. No claim that the true slope is irrational. |
| Olivier Gerard's `seqtranslib.m` and `supertrans` | `transforms.js`: T001–T094 and T099–T115 | 111 implemented IDs. OGF/EGF operations, differences, sums, scaling, factorial normalization, diagonal operations, binomial, boustrophedon, Euler, exponential/log, invert, Möbius and Stirling transforms. Includes bisection, complement and sorted-value clues. T095–T098 are empty placeholders in the original executable table and remain omitted. |
| Transform then look up | `superseeker.js`: reversible transform recognition; page search links | Simple exact rules are sought after reciprocal OGF, inverse binomial, inverse Euler, inverse Stirling, Möbius, and factorial normalization. Reversible pairs must reconstruct the full supplied prefix. Every future term is reconstructed by the inverse transform. Odd/even and mod-3 interleaving can also yield continuations when every branch passes exact checks. Other transforms are exploratory previews, with explicit search links for integer results of length ≥3. |
| `CheckSeq.pl`, `agrep`, catalog grep and `dripped` | Not implemented as database searches | These need an OEIS catalog/search index. The page links to OEIS; it does not claim global overlap, edit-distance, or first-difference database search. No catalog has been downloaded or replicated. |
| `supercorr2` | Not added | Marked unused in the original service. Existing statistical forecasting remains available when no exact rule is found. |
| Mail intake, queue, shell limits and formatting | Existing page input/worker lifecycle | Browser inputs and cancellable workers replace the email workflow. |

## Arithmetic, validation and presentation

Exact discovery accepts safe integer inputs, then uses BigInt rational arithmetic throughout. Forecasts and transform values are serialized as strings; no large integer is rounded for output or copying. Decimal inputs retain the existing statistical path. Existing input limits remain 3–200 terms and a horizon of 1–50.

Rational Gaussian elimination rejects underdetermined relation templates. The new fitted rational, polynomial-coefficient and algebraic methods reserve two final terms from fitting and validate the entire prefix. Periodic patterns require repeated cycles; polynomial and fan rules require repeated constant differences. These structural checks are evidence of consistency, not a proof of a continuation. New methods must also produce the full requested forecast without a singularity or arithmetic overflow before appearing as exact candidates.

Arithmetic rejects intermediate numerators or denominators above 16,384 binary digits. Individual method failures do not cancel the whole analysis. Exact candidates are ranked by a simple structural complexity cost; this is a selection heuristic, not a probability. Each candidate retains its own continuation; the page flags disagreement and offers expandable rule/formula comparisons. The existing statistical model blend, rolling validation, approximate ranges, copy and CSV export paths remain intact.

Transform previews use at most the first 32 input terms and display/search at most the first 12 output terms. The binary associates use the full input. Exact candidate validation always uses all supplied input terms. Fraction-valued or shorter-than-three previews have no OEIS search link. Empty, undefined or arithmetic-limited transforms are counted as skipped. Search links open only on user action; there is no automatic third-party lookup.

## Indexing and deliberate repairs

The legacy `supertrans` prose and Mathematica executable table do not always agree. This port follows the executable table's factorial normalization and 1-based Stirling conventions and labels them. Specifically:

- T008 is a(n)/n! with n starting at 0. T010 divides by (n+1)!. T081/T082 add/subtract (n+1)!.
- T054–T058 and other EGF generating-function operations use n! normalization internally and restore it afterward. T059–T061, T065–T066 and the other `vexpseq` operations instead act on the factorial-normalized sequence without restoring factorials.
- T050–T053 and T091–T094 prepend a zero constant and extract coefficient j for j=1..N. EGF diagonals retain the executable helper's (j−1)! output convention.
- T005 intentionally drops exactly two leading terms, as its description says. The original executable definition accidentally combines `Drop[#,2]` with another `Rest`.
- T061 uses the actual third difference, as the executable `GetDiff` does; the prose has a sign typo.
- T102 prepends 1 to the boustrophedon triangle; T103 removes the initial constant in the inverse. Both are explicitly labeled.
- T108/T109 retain all N coefficients in a causal invert/inverse-invert pair rather than losing a coefficient through legacy series truncation.
- Transform signs are preserved. Legacy `SuperTrans` took absolute values of every transformed sequence before searching; doing so can hide mathematically significant information.
- Complement previews are bounded by 60. Unlike the legacy heuristic, small nonempty complements are retained as clues rather than silently suppressed.

## Verification

`npm run test:oeis` checks the existing forecasting regressions plus factorial, Catalan, central-binomial, Motzkin and Bell continuations; successive quotient rules; modular difference wrapping; interleaving; inverse-binomial fans; algebraic and rational generating functions; altered held-out terms; all 111 transform IDs; seven transform/inverse identities; explicit OGF/EGF and diagonal fixtures; binary-run censoring; exact Beatty endpoints; precision; preview limits; undefined reciprocal handling; and worker-safe serialization.

`npm run build` passes and bundles the new mathematical modules into the existing module worker. Local browser checks pass for URL-loaded Catalan analysis, formula comparisons, transformed search links, factorial continuations, binary associates, Beatty intervals, decimal statistical forecasts, input errors, clear/edit cancellation, exact-value copying, CSV contents, 200 input terms with a 50-term forecast, no automatic OEIS requests, and a 390-pixel mobile viewport with expanded transforms and large outputs. The locally served production build also successfully loads the bundled module worker, renders exact factorial forecasts, and exposes all 111 transform previews. No browser runtime errors were observed. Changes have not been deployed.
