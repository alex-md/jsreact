# Numigma puzzle contract

The v2 builder treats clue count and mathematical difficulty as independent controls. It supports 2–6 clues, positive integer endpoints up to 1,000,000, and ranges containing at most 50,000 integers. The range is inclusive. These bounds are enforced before evaluating predicates.

A published puzzle has exactly the requested number of clues, exactly one solution in the full range, and an independent witness for each clue: a number satisfying every other clue but failing that clue. This proves that removing any clue, or any larger subset of clues, leaves multiple answers. Every clue also reduces the ordered candidate set, and no clue can solve the puzzle alone. The engine does not publish partial puzzles or add filler to meet a count.

Generation samples targets and varied clue parameters, evaluates and deduplicates truth tables, then searches for an irredundant intersection. It maintains each selected clue's witness set as it adds constraints, pruning a branch as soon as a prior clue becomes redundant. The search is bounded (64 target attempts, 4,500 nodes per target, at most 18 child branches); failure means the search did not find a puzzle, not a proof that none exists. The browser runs it in a disposable worker, with cancellation and a 20-second deadline. Failures retain the previously displayed puzzle.

Difficulty limits the permitted operations and requires at least half the clues in Medium, Hard, and Extreme to meet that tier's upper complexity level. Easy uses arithmetic and decimal properties; Extreme requires deep modular or Diophantine mathematics. These are mathematical-content tiers, not empirical ratings of human solving time. Clue count does not predict ease.

There is no seed control. New puzzle uses a fresh random internal token. Versioned links preserve the token and all accepted settings, reproducing clues and their order while hiding the answer. The link always represents the displayed puzzle, even when the controls have changed. Legacy links are identified as incompatible rather than silently producing a different puzzle under the old identity. Bump `GENERATOR_VERSION` when changing generation semantics.

## Mathematical corrections and extensions

- Squares, cubes, fourth powers, and reversed-prime clues no longer disclose roots or reversed targets.
- One is neither prime nor composite.
- Happy numbers iterate the sum of the squares of individual digits.
- Bell numbers are generated using the Bell triangle.
- Multiplicative order, Carmichael's lambda function, Jacobi symbols, positive quadratic forms, and Pell equations supply the new advanced themes. Definitions are available beside clues.

Reference definitions: [multiplicative order](https://reference.wolfram.com/language/ref/MultiplicativeOrder.html), [Carmichael function](https://mathworld.wolfram.com/CarmichaelFunction.html), [Jacobi symbol](https://reference.wolfram.com/language/ref/JacobiSymbol.html), [Pell equation](https://mathworld.wolfram.com/PellEquation.html).

## Verification

`npm run test:numigma` checks 160 seeded puzzles spanning all difficulties and clue counts, plus offset ranges, restricted theme sets, large ranges, deterministic reconstruction, rejected requests, and mathematical reference cases. It independently enumerates each solution and every leave-one-out intersection. Small Carmichael values are checked directly against the universal-exponent definition; Jacobi symbols are checked against enumerated prime residues and factor products. The former digest snapshots were removed because they froze the superseded generation algorithm.

Browser checks cover desktop and mobile layouts, solving, reveal/hide, link reproduction, exact-count Extreme puzzles, definitions, and recovery after invalid or unbuildable requests.
