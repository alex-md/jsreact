# Numigma puzzle contract

The v3 builder treats clue count and mathematical difficulty as independent controls. It supports 2–6 clues, positive integer endpoints up to 1,000,000, and ranges containing at most 50,000 integers. The range is inclusive. These bounds are enforced before evaluating predicates.

A published puzzle has exactly the requested number of clues, exactly one solution in the full range, and an independent witness for each clue: a number satisfying every other clue but failing that clue. This proves that removing any clue, or any larger subset of clues, leaves multiple answers. Every clue also reduces the ordered candidate set, and no clue can solve the puzzle alone. The engine does not publish partial puzzles or add filler to meet a count.

Hard and Extreme also prohibit repeated clue factories (for example two Jacobi clues with different denominators). For every nonempty proper subset with r clues missing, at least 2ʳ candidates must remain in the inclusive range. This checks all orders of attack and prevents a small subset from nearly giving away the answer. It is a deliberate quality floor, not an empirical model of human difficulty. Settings that cannot meet it fail explicitly.

Generation samples targets and varied clue parameters, evaluates and deduplicates truth tables, then searches for an irredundant intersection. It maintains each selected clue's witness set as it adds constraints, pruning a branch as soon as a prior clue becomes redundant. The search is bounded (64 target attempts, 4,500 nodes per target, at most 18 child branches); failure means the search did not find a puzzle, not a proof that none exists. The browser runs it in a disposable worker, with cancellation and a 20-second deadline. Failures retain the previously displayed puzzle.

Difficulty limits the permitted operations and requires at least half the clues in Medium, Hard, and Extreme to meet that tier's upper complexity level. Easy uses arithmetic and decimal properties; Extreme requires deep modular or Diophantine mathematics. Complexity follows the simplified operation: a zero Jacobi symbol is a common-factor test (level 3), a base-ending digit is a remainder (level 2), and order 1 or 2 modulo a prime is a simple residue test (level 2). Shifted-property anchors sample the full interval below the target instead of sitting within 20 of it. These are mathematical-content tiers, not empirical ratings of human solving time. Clue count does not predict ease.

There is no seed control. New puzzle uses a fresh random internal token. Versioned links preserve the token and all accepted settings, reproducing clues and their order while hiding the answer. The link always represents the displayed puzzle, even when the controls have changed. Legacy links are identified as incompatible rather than silently producing a different puzzle under the old identity. Bump `GENERATOR_VERSION` when changing generation semantics.

## Mathematical corrections and extensions

- Squares, cubes, fourth powers, and reversed-prime clues no longer disclose roots or reversed targets.
- One is neither prime nor composite.
- Happy numbers iterate the sum of the squares of individual digits.
- Bell numbers are generated using the Bell triangle.
- Multiplicative order, Carmichael's lambda function, Jacobi symbols, positive quadratic forms, and Pell equations supply the new advanced themes. Definitions are available beside clues.

Reference definitions: [multiplicative order](https://reference.wolfram.com/language/ref/MultiplicativeOrder.html), [Carmichael function](https://mathworld.wolfram.com/CarmichaelFunction.html), [Jacobi symbol](https://reference.wolfram.com/language/ref/JacobiSymbol.html), [Pell equation](https://mathworld.wolfram.com/PellEquation.html).

Clues are presented with a shifted-property anchor first when available, then simpler operations before advanced checks. Witness certificates follow this presentation order. The hints panel provides strategy notes, candidate counts in the displayed deduction order, and a separate necessity proof per clue: how many answers would remain without it, plus a counterexample satisfying all the other clues. The counterexample is never the answer. These notes support reasoning; they are not an automatically derived human proof.

## Feedback regression: 835

In the range 1–999, the reported five clues select 835. Removing each clue in order leaves:

1. Order modulo 17: 835, 895, 955.
2. Base-6 last digit: 835 only (redundant).
3. Zero Jacobi symbol modulo 55: 835, 859, 967.
4. Jacobi symbol modulo 77: 835 only (redundant).
5. Prime offset from 816: 355, 655, 835, 865.

This demonstrates why all candidates in the stated range must be tested, rather than stopping at the first two plausible offsets. “Exceeds 816 by a prime” supplies a lower bound only; the displayed range supplies the upper bound. This set fails the existing essential-clue contract, and v3 additionally rejects repeated Jacobi factories and weak subsets.

## Verification

`npm run test:numigma` checks 160 seeded puzzles spanning all difficulties and clue counts, plus offset ranges, restricted theme sets, large ranges, deterministic reconstruction, rejected requests, and mathematical reference cases. It independently enumerates each solution and every leave-one-out intersection, and every proper subset for Hard/Extreme. Regression cases cover the reported 835 puzzle and simplified complexity levels. Small Carmichael values are checked directly against the universal-exponent definition; Jacobi symbols are checked against enumerated prime residues and factor products. The former digest snapshots were removed because they froze the superseded generation algorithm.

Browser checks cover desktop and mobile layouts, solving, reveal/hide, link reproduction, exact-count Extreme puzzles, definitions, and recovery after invalid or unbuildable requests.
