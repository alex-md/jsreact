
self.onmessage = function (e) {
    const { numbers, target, config } = e.data;
    const { useExponents, useSqrt, noParentheses } = config;

    const startTime = Date.now();
    const isTimedOut = () => Date.now() - startTime > 4000;

    class Item {
        constructor(val, expr = null, prec = 4, steps = [], isAtomic = true, lastPrec = 100) {
            this.val = val;
            this.expr = expr === null ? val.toString() : expr;
            this.prec = prec; // 4: atomic/func, 3: pow, 2: mul/div, 1: add/sub
            this.steps = steps;
            this.isAtomic = isAtomic; // true if it can be the right-side operand in L-R eval without parens
            this.lastPrec = lastPrec; // Precedence of the LAST operator added to this chain (100 for atoms)
        }
    }

    const initialItems = numbers.map(n => new Item(n));
    const visited = new Set();
    let solution = null;

    function solve(items) {
        if (solution || isTimedOut()) return;

        if (items.length === 1) {
            if (Math.abs(items[0].val - target) < 1e-6) {
                solution = items[0];
            }
            return;
        }

        // Optimization: Sort values to create a unique key for the current set of numbers
        // In noParentheses mode, distinction between Atomic and Complex values matters
        const stateKey = items.map(i => i.val + (noParentheses && i.isAtomic ? 'A' : '')).sort().join('|');
        if (visited.has(stateKey)) return;
        visited.add(stateKey);

        // Try Square Root if enabled
        if (useSqrt) {
            for (let i = 0; i < items.length; i++) {
                const x = items[i];
                if (x.val > 1) {
                    const root = Math.sqrt(x.val);
                    if (Number.isInteger(root)) {
                        const newSteps = [...x.steps, `sqrt(${x.val}) = ${root}`];
                        // Sqrt result is atomic (it's a single unit)
                        const newItem = new Item(root, `sqrt(${x.expr})`, 4, newSteps, true, 100);
                        const nextItems = [...items];
                        nextItems[i] = newItem;

                        solve(nextItems);
                        if (solution) return;
                    }
                }
            }
        }

        // Try binary operations
        for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < items.length; j++) {
                if (i === j) continue;

                const a = items[i];
                const b = items[j];
                const remaining = items.filter((_, idx) => idx !== i && idx !== j);

                // Addition (commutative)
                // Op Prec: 1.
                if (i < j || noParentheses) {
                    let operandA = a;
                    let operandB = b;

                    if (noParentheses) {
                        // Strict mode validation
                        // 1. Right side must be atomic (no parentheses needed for the right term)
                        if (!a.isAtomic && !b.isAtomic) continue;

                        // 2. Precedence Monotonicity: + (1) is always safe.

                        if (a.isAtomic && !b.isAtomic) {
                            operandA = b;
                            operandB = a;
                        }
                    } else {
                        if (!(i < j)) continue;
                    }

                    const val = operandA.val + operandB.val;
                    const expr = noParentheses ? `${operandA.expr} + ${operandB.expr}` : `(${operandA.expr} + ${operandB.expr})`;
                    const newSteps = [...operandA.steps, ...operandB.steps, `${operandA.val} + ${operandB.val} = ${val}`];

                    // Result is complex, last op prec 1
                    remaining.push(new Item(val, expr, 1, newSteps, false, 1));
                    solve(remaining);
                    remaining.pop();
                    if (solution) return;
                }

                // Multiplication (commutative)
                // Op Prec: 2.
                if (i < j || noParentheses) {
                    let operandA = a;
                    let operandB = b;

                    if (noParentheses) {
                        if (!a.isAtomic && !b.isAtomic) continue;
                        if (a.isAtomic && !b.isAtomic) {
                            operandA = b;
                            operandB = a;
                        }

                        // Check Precedence: 2 <= operandA.lastPrec
                        if (2 > operandA.lastPrec) continue;
                    } else {
                        if (!(i < j)) continue;
                    }

                    const val = operandA.val * operandB.val;
                    let expr;

                    if (noParentheses) {
                        expr = `${operandA.expr} * ${operandB.expr}`;
                    } else {
                        const strA = operandA.prec < 2 ? `(${operandA.expr})` : operandA.expr;
                        const strB = operandB.prec < 2 ? `(${operandB.expr})` : operandB.expr;
                        expr = `${strA} * ${strB}`;
                    }

                    const newSteps = [...operandA.steps, ...operandB.steps, `${operandA.val} * ${operandB.val} = ${val}`];
                    remaining.push(new Item(val, expr, 2, newSteps, false, 2));
                    solve(remaining);
                    remaining.pop();
                    if (solution) return;
                }

                // Subtraction (not commutative)
                // Op Prec: 1.
                {
                    const valid = !noParentheses || b.isAtomic;
                    if (valid) {
                        const val = a.val - b.val;
                        let expr;

                        if (noParentheses) {
                            expr = `${a.expr} - ${b.expr}`;
                        } else {
                            const strB = b.prec === 1 ? `(${b.expr})` : b.expr;
                            expr = `${a.expr} - ${strB}`;
                        }

                        const newSteps = [...a.steps, ...b.steps, `${a.val} - ${b.val} = ${val}`];
                        remaining.push(new Item(val, expr, 1, newSteps, false, 1));
                        solve(remaining);
                        remaining.pop();
                        if (solution) return;
                    }
                }

                // Division (not commutative)
                // Op Prec: 2.
                if (b.val !== 0) {
                    if (!noParentheses || b.isAtomic) {

                        if (noParentheses && 2 > a.lastPrec) {
                            // Skip
                        } else {
                            const val = a.val / b.val;
                            if (Number.isInteger(val)) {
                                let expr;
                                if (noParentheses) {
                                    expr = `${a.expr} / ${b.expr}`;
                                } else {
                                    const strA = a.prec < 2 ? `(${a.expr})` : a.expr;
                                    const strB = b.prec < 3 ? `(${b.expr})` : b.expr;
                                    expr = `${strA} / ${strB}`;
                                }

                                const newSteps = [...a.steps, ...b.steps, `${a.val} / ${b.val} = ${val}`];
                                remaining.push(new Item(val, expr, 2, newSteps, false, 2));
                                solve(remaining);
                                remaining.pop();
                                if (solution) return;
                            }
                        }
                    }
                }

                // Exponents
                if (useExponents) {
                    const limit = Math.max(target * 100, 500000);
                    if (a.val > 1 || b.val >= 20) {
                        // Check?
                    }

                    const val = Math.pow(a.val, b.val);
                    if (val < limit && Number.isInteger(val)) {
                        // Op Prec: 3.
                        let valid = true;
                        if (noParentheses) {
                            if (!b.isAtomic) valid = false;
                            if (3 > a.lastPrec) valid = false;
                        }

                        if (valid) {
                            let expr;
                            if (noParentheses) {
                                expr = `${a.expr} ** ${b.expr}`;
                            } else {
                                const strA = a.prec < 3 ? `(${a.expr})` : a.expr;
                                const strB = b.prec < 3 ? `(${b.expr})` : b.expr;
                                expr = `${strA} ** ${strB}`;
                            }

                            const newSteps = [...a.steps, ...b.steps, `${a.val} ^ ${b.val} = ${val}`];
                            remaining.push(new Item(val, expr, 3, newSteps, false, 3));
                            solve(remaining);
                            remaining.pop();
                            if (solution) return;
                        }
                    }
                }
            }
        }
    }

    solve(initialItems);

    if (solution) {
        let finalExpr = solution.expr;
        if (!noParentheses && finalExpr.startsWith('(') && finalExpr.endsWith(')')) {
            let balance = 0;
            let clean = true;
            for (let k = 1; k < finalExpr.length - 1; k++) {
                if (finalExpr[k] === '(') balance++;
                else if (finalExpr[k] === ')') balance--;

                if (balance < 0) {
                    clean = false;
                    break;
                }
            }
            if (clean) {
                finalExpr = finalExpr.substring(1, finalExpr.length - 1);
            }
        }

        self.postMessage({
            success: true,
            result: { expr: finalExpr, steps: solution.steps }
        });
    } else {
        self.postMessage({
            success: false,
            error: isTimedOut() ? "Computation timed out" : "No solution found"
        });
    }
};
