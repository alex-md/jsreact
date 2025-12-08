// Import styles and components
import '@styles/global.css';
import { showToast } from '@/components/toast.js';

// Utility functions
const evaluate = (expression) => {
    const tokens = expression.match(/\d+|\+|\-|\*|\/|\*\*|\(|\)|sqrt/g);
    if (!tokens) return NaN;

    const applyOperator = (operator, a, b) => {
        switch (operator) {
            case "+": return a + b;
            case "-": return a - b;
            case "*": return a * b;
            case "/": if (b === 0) throw new Error("Division by zero"); return a / b;
            case "**": return a ** b;
            default: throw new Error(`Unknown operator: ${operator}`);
        }
    };

    const applyFunction = (funcName, value) => {
        if (funcName === "sqrt") {
            if (value < 0) throw new Error("Square root of negative number");
            return Math.sqrt(value);
        }
        throw new Error(`Unknown function: ${funcName}`);
    };

    function precedence(operator) {
        if (operator === "+" || operator === "-") return 1;
        if (operator === "*" || operator === "/") return 2;
        if (operator === "**") return 3;
        if (operator === "sqrt") return 4;
        return 0;
    }

    function shuntingYard(tokens) {
        const output = [];
        const operators = [];
        let expectOperand = true;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (!isNaN(token)) {
                output.push(Number(token));
                expectOperand = false;
            } else if (token === "sqrt" || token === "(") {
                operators.push(token);
                expectOperand = true;
            } else if (token === ")") {
                while (operators.length && operators[operators.length - 1] !== "(") {
                    output.push(operators.pop());
                }
                if (operators.length === 0) throw new Error("Mismatched parentheses");
                operators.pop();
                if (operators.length > 0 && operators[operators.length - 1] === "sqrt") {
                    output.push(operators.pop());
                }
                expectOperand = false;
            } else {
                while (operators.length && precedence(operators[operators.length - 1]) >= precedence(token)) {
                    output.push(operators.pop());
                }
                operators.push(token);
                expectOperand = true;
            }
        }
        while (operators.length) {
            if (operators[operators.length - 1] === '(') throw new Error("Mismatched parentheses");
            output.push(operators.pop());
        }
        return output;
    }

    function evaluatePostfix(postfix) {
        const stack = [];
        for (const token of postfix) {
            if (!isNaN(token)) {
                stack.push(token);
            } else if (token === "sqrt") {
                if (stack.length < 1) throw new Error("Invalid expression");
                stack.push(applyFunction(token, stack.pop()));
            } else {
                if (stack.length < 2) throw new Error("Invalid expression");
                const b = stack.pop();
                const a = stack.pop();
                stack.push(applyOperator(token, a, b));
            }
        }
        if (stack.length !== 1) throw new Error("Invalid expression");
        return stack.pop();
    }

    try {
        const postfix = shuntingYard(tokens);
        return evaluatePostfix(postfix);
    } catch (error) {
        return NaN;
    }
};

// Main logic
document.addEventListener("DOMContentLoaded", () => {
    // Info button functionality
    const infoButton = document.getElementById("info-toggle");
    const calculatorDescription = document.getElementById("calculator-description");
    let descriptionTimeout;

    const showDescription = () => {
        calculatorDescription.classList.remove("hidden", "translate-y-full", "opacity-0");
        clearTimeout(descriptionTimeout);
        descriptionTimeout = setTimeout(() => {
            calculatorDescription.classList.add("hiding");
            setTimeout(() => {
                calculatorDescription.classList.remove("hiding");
                calculatorDescription.classList.add("hidden");
            }, 300);
        }, 5000);
    };

    infoButton.addEventListener("click", showDescription);

    // --- OPTIMIZED SOLVER START ---
    function findExpressionOptimized(numbers, target) {
        const useExponents = document.getElementById("exponents-checkbox").checked;
        const useSqrt = document.getElementById("sqrt-checkbox").checked;
        const noParentheses = document.getElementById("no-parentheses-checkbox").checked;

        const timeLimit = 4000; // 4 seconds soft limit
        const startTime = Date.now();
        const isTimedOut = () => Date.now() - startTime > timeLimit;

        // Item class tracks the math value, the string expression, AND the steps taken
        class Item {
            constructor(val, expr = null, prec = 4, steps = []) {
                this.val = val;
                this.expr = expr === null ? val.toString() : expr;
                // Precedence: 0:atom/func, 1:+/-, 2:*/, 3:**, 4:raw number
                this.prec = prec;
                this.steps = steps; // Array of string descriptions of operations
            }
        }

        let initialItems = numbers.map(n => new Item(n));

        // Memoization Key
        const visited = new Set();
        let solution = null;

        function solve(items) {
            if (solution) return;
            if (isTimedOut()) return;

            // 1. Check Solution (STRICT: Must use all numbers)
            if (items.length === 1) {
                if (Math.abs(items[0].val - target) < 1e-6) {
                    solution = items[0]; // Store the entire item to access steps
                    return;
                }
            }

            // 2. Pruning via Memoization
            const stateKey = items.map(i => i.val).sort((a, b) => a - b).join('|');
            if (visited.has(stateKey)) return;
            visited.add(stateKey);

            // 3. Unary Operation: Square Root
            if (useSqrt) {
                for (let i = 0; i < items.length; i++) {
                    const x = items[i];
                    // Pruning: sqrt(1)=1 creates loop. 
                    if (x.val > 1) {
                        const root = Math.sqrt(x.val);
                        if (Number.isInteger(root)) {
                            // Add step for sqrt
                            const newSteps = [...x.steps, `sqrt(${x.val}) = ${root}`];
                            const newItem = new Item(root, `sqrt(${x.expr})`, 4, newSteps);

                            const nextItems = [...items];
                            nextItems[i] = newItem;

                            solve(nextItems);
                            if (solution) return;
                        }
                    }
                }
            }

            // 4. Binary Operations
            for (let i = 0; i < items.length; i++) {
                for (let j = 0; j < items.length; j++) {
                    if (i === j) continue;

                    const a = items[i];
                    const b = items[j];
                    const remaining = items.filter((_, idx) => idx !== i && idx !== j);

                    // --- Addition (+) Prec: 1 ---
                    if (i < j) {
                        const val = a.val + b.val;
                        const expr = noParentheses
                            ? `${a.expr} + ${b.expr}`
                            : `(${a.expr} + ${b.expr})`;

                        // Combine steps from children, then add current step
                        const newSteps = [...a.steps, ...b.steps, `${a.val} + ${b.val} = ${val}`];
                        remaining.push(new Item(val, expr, 1, newSteps));

                        solve(remaining);
                        remaining.pop();
                        if (solution) return;
                    }

                    // --- Multiplication (*) Prec: 2 ---
                    if (i < j) {
                        // Allow * 1
                        if (noParentheses) {
                            if (a.prec < 2 || b.prec < 2) {
                                // Forbidden
                            } else {
                                const val = a.val * b.val;
                                const newSteps = [...a.steps, ...b.steps, `${a.val} * ${b.val} = ${val}`];
                                remaining.push(new Item(val, `${a.expr} * ${b.expr}`, 2, newSteps));
                                solve(remaining);
                                remaining.pop();
                            }
                        } else {
                            const val = a.val * b.val;
                            const strA = a.prec < 2 ? `(${a.expr})` : a.expr;
                            const strB = b.prec < 2 ? `(${b.expr})` : b.expr;
                            const newSteps = [...a.steps, ...b.steps, `${a.val} * ${b.val} = ${val}`];
                            remaining.push(new Item(val, `${strA} * ${strB}`, 2, newSteps));
                            solve(remaining);
                            remaining.pop();
                        }
                        if (solution) return;
                    }

                    // --- Subtraction (-) Prec: 1 ---
                    // Allow - 0
                    {
                        if (noParentheses) {
                            if (b.prec === 1) {
                                // Forbidden
                            } else {
                                const val = a.val - b.val;
                                const newSteps = [...a.steps, ...b.steps, `${a.val} - ${b.val} = ${val}`];
                                remaining.push(new Item(val, `${a.expr} - ${b.expr}`, 1, newSteps));
                                solve(remaining);
                                remaining.pop();
                            }
                        } else {
                            const val = a.val - b.val;
                            const strB = b.prec === 1 ? `(${b.expr})` : b.expr;
                            const newSteps = [...a.steps, ...b.steps, `${a.val} - ${b.val} = ${val}`];
                            remaining.push(new Item(val, `${a.expr} - ${strB}`, 1, newSteps));
                            solve(remaining);
                            remaining.pop();
                        }
                        if (solution) return;
                    }

                    // --- Division (/) Prec: 2 ---
                    // Allow / 1
                    if (b.val !== 0) {
                        const val = a.val / b.val;
                        if (Number.isInteger(val)) {
                            if (noParentheses) {
                                if (a.prec < 2 || b.prec < 3) {
                                    // Forbidden
                                } else {
                                    const newSteps = [...a.steps, ...b.steps, `${a.val} / ${b.val} = ${val}`];
                                    remaining.push(new Item(val, `${a.expr} / ${b.expr}`, 2, newSteps));
                                    solve(remaining);
                                    remaining.pop();
                                }
                            } else {
                                const strA = a.prec < 2 ? `(${a.expr})` : a.expr;
                                const strB = b.prec < 3 ? `(${b.expr})` : b.expr;
                                const newSteps = [...a.steps, ...b.steps, `${a.val} / ${b.val} = ${val}`];
                                remaining.push(new Item(val, `${strA} / ${strB}`, 2, newSteps));
                                solve(remaining);
                                remaining.pop();
                            }
                            if (solution) return;
                        }
                    }

                    // --- Exponents (**) Prec: 3 ---
                    if (useExponents) {
                        const limit = Math.max(target * 100, 500000);
                        // Allow 1**9 and 9**1
                        if (a.val <= 1 || b.val < 20) {
                            const val = Math.pow(a.val, b.val);
                            if (val < limit && Number.isInteger(val)) {
                                if (noParentheses) {
                                    if (a.prec < 3 || b.prec < 3) {
                                        // Forbidden
                                    } else {
                                        const newSteps = [...a.steps, ...b.steps, `${a.val} ^ ${b.val} = ${val}`];
                                        remaining.push(new Item(val, `${a.expr} ** ${b.expr}`, 3, newSteps));
                                        solve(remaining);
                                        remaining.pop();
                                    }
                                } else {
                                    const strA = a.prec < 3 ? `(${a.expr})` : a.expr;
                                    const strB = b.prec < 3 ? `(${b.expr})` : b.expr;
                                    const newSteps = [...a.steps, ...b.steps, `${a.val} ^ ${b.val} = ${val}`];
                                    remaining.push(new Item(val, `${strA} ** ${strB}`, 3, newSteps));
                                    solve(remaining);
                                    remaining.pop();
                                }
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
            // Cosmetic cleanup for "standard" mode parens
            if (!noParentheses && finalExpr.startsWith('(') && finalExpr.endsWith(')')) {
                let balance = 0, clean = true;
                for (let k = 1; k < finalExpr.length - 1; k++) {
                    if (finalExpr[k] === '(') balance++;
                    if (finalExpr[k] === ')') balance--;
                    if (balance < 0) { clean = false; break; }
                }
                if (clean) finalExpr = finalExpr.substring(1, finalExpr.length - 1);
            }
            return { expr: finalExpr, steps: solution.steps };
        }

        if (isTimedOut()) {
            return "Computation timed out - try with fewer numbers";
        }

        return "No solution found";
    }
    // --- OPTIMIZED SOLVER END ---

    document.getElementById("random-numbers-button").addEventListener("click", (event) => {
        event.preventDefault();
        const count = document.getElementById("num-integers-input").value || 6;
        const maxValue = document.getElementById("max-number-input").value || 90;
        const randomNumbers = Array.from(
            { length: parseInt(count) },
            () => Math.floor(Math.random() * parseInt(maxValue)) + 1
        );
        document.getElementById("numbers-input").value = randomNumbers.join(",");
        showToast('Random numbers generated');
    });

    document.getElementById("submit-button").addEventListener("click", (event) => {
        event.preventDefault();
        const submitButton = document.getElementById("submit-button");
        const solutionOutput = document.getElementById("solution-output");

        const originalButtonText = submitButton.innerHTML;
        const loadingSpinner = document.createElement('span');
        loadingSpinner.className = 'loading-spinner';
        submitButton.innerHTML = 'Calculating';
        submitButton.appendChild(loadingSpinner);
        submitButton.disabled = true;

        solutionOutput.classList.remove("hidden");

        const numbers = document.getElementById("numbers-input").value
            .split(",")
            .map(num => parseInt(num.trim()));
        const target = parseInt(document.getElementById("target-input").value);

        if (!numbers.every(n => !isNaN(n)) || isNaN(target)) {
            showToast('Please enter valid numbers');
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
            return;
        }

        setTimeout(() => {
            let result = findExpressionOptimized(numbers, target);

            // Handle Object result (Success) or String result (Error/Timeout)
            if (typeof result === 'object' && result !== null) {
                const originalExpression = result.expr;
                
                // --- HELPER: Parse and Structure the Explanation ---
                class SolutionFormatter {
                    constructor(expression) {
                        this.expression = expression;
                        this.tokens = expression.match(/\d+|\+|\-|\*|\/|\*\*|\(|\)|sqrt/g);
                        this.pos = 0;
                    }

                    // Simple Recursive Descent Parser to build an AST
                    parse() {
                        this.pos = 0;
                        return this.parseExpression();
                    }

                    peek() { return this.tokens[this.pos]; }
                    consume() { return this.tokens[this.pos++]; }

                    getPrecedence(op) {
                        if (op === '+' || op === '-') return 1;
                        if (op === '*' || op === '/') return 2;
                        if (op === '**') return 3;
                        return 0;
                    }

                    parseExpression(minPrec = 0) {
                        let left = this.parseFactor();

                        while (this.pos < this.tokens.length) {
                            const op = this.peek();
                            const prec = this.getPrecedence(op);
                            
                            if (prec === 0 || prec < minPrec) break;
                            
                            this.consume(); // eat op
                            const right = this.parseExpression(prec + (op === '**' ? 0 : 1)); // Right associative for **
                            
                            left = { type: 'binary', op, left, right, value: this.evaluateOp(op, left.value, right.value) };
                        }
                        return left;
                    }

                    parseFactor() {
                        const token = this.consume();
                        if (!isNaN(token)) {
                            return { type: 'number', value: Number(token), raw: token };
                        }
                        if (token === 'sqrt') {
                            this.consume(); // (
                            const inner = this.parseExpression();
                            this.consume(); // )
                            return { type: 'unary', op: 'sqrt', arg: inner, value: Math.sqrt(inner.value) };
                        }
                        if (token === '(') {
                            const expr = this.parseExpression();
                            this.consume(); // )
                            // Keep parens in structure for display
                            expr.wrapped = true; 
                            return expr;
                        }
                        throw new Error("Unexpected token: " + token);
                    }

                    evaluateOp(op, a, b) {
                        switch(op) {
                            case '+': return a + b;
                            case '-': return a - b;
                            case '*': return a * b;
                            case '/': return a / b;
                            case '**': return Math.pow(a, b);
                        }
                    }

                    // --- GENERATE HTML OUTPUT ---
                    generateHTML(target) {
                        const ast = this.parse();
                        let html = '';

                        // 1. PLAN
                        html += this.renderPlan(ast);

                        // 2. STEPS
                        const stepsContainer = [];
                        this.traverseAndExplain(ast, 'Final result', stepsContainer, true);

                        html += `<div class="space-y-6 mt-4 text-sm font-mono text-base-content/80">`;
                        stepsContainer.forEach(section => {
                            html += `
                                <div class="bg-base-200 p-4 rounded-lg shadow-sm border border-base-300">
                                    <div class="font-bold text-xs uppercase tracking-wider mb-2 opacity-60 border-b border-base-content/10 pb-1">
                                        ${section.title}
                                    </div>
                                    <div class="flex flex-col space-y-1">
                                        ${section.lines.map(line => `<div>${line}</div>`).join('')}
                                    </div>
                                </div>
                            `;
                        });
                        html += `</div>`;

                        // 3. FINAL ANSWER
                        html += `
                            <div class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-900 font-mono">
                                <div class="font-bold border-b border-green-200 pb-2 mb-2">Final steps:</div>
                                <div>${this.nodeToString(ast)} = <strong>${target}</strong></div>
                            </div>
                        `;

                        return html;
                    }

                    renderPlan(node) {
                        let bullets = [];
                        if (node.type === 'binary') {
                            const leftName = this.getNameForSide(node.op, 'left');
                            const rightName = this.getNameForSide(node.op, 'right');
                            const action = this.getActionVerb(node.op);
                            
                            if (node.left.type !== 'number') bullets.push(`Simplify the ${leftName}`);
                            if (node.right.type !== 'number') bullets.push(`Simplify the ${rightName}`);
                            bullets.push(`${action} to get the result`);
                        } else {
                            bullets.push("Evaluate the expression directly");
                        }

                        return `
                            <div class="mb-6 p-4 bg-base-100 rounded-lg border-l-4 border-primary">
                                <h3 class="font-bold text-sm uppercase mb-2">Plan:</h3>
                                <ul class="list-disc list-inside space-y-1 text-sm opacity-80">
                                    ${bullets.map(b => `<li>${b}</li>`).join('')}
                                </ul>
                            </div>
                        `;
                    }

                    getNameForSide(op, side) {
                        if (op === '/') return side === 'left' ? 'numerator' : 'denominator';
                        if (op === '*') return side === 'left' ? 'left factor' : 'right factor';
                        return side === 'left' ? 'left term' : 'right term';
                    }

                    getActionVerb(op) {
                        if (op === '+') return 'Add the terms';
                        if (op === '-') return 'Subtract the terms';
                        if (op === '*') return 'Multiply the factors';
                        if (op === '/') return 'Divide';
                        if (op === '**') return 'Apply exponent';
                        return 'Combine';
                    }

                    // Recursively build sections
                    traverseAndExplain(node, contextName, outputList, isRoot = false) {
                        if (node.type === 'number') return;

                        // If it's a unary op (sqrt), treat it as a mini-block
                        if (node.type === 'unary') {
                            // If the argument is complex, explain it first
                            if (node.arg.type !== 'number') {
                                this.traverseAndExplain(node.arg, 'Inside the square root', outputList);
                            }
                            // No separate section for simple sqrt unless it's root, just return
                            return;
                        }

                        // Determine if children are complex enough to warrant their own sections
                        const isLeftComplex = node.left.type === 'binary' || (node.left.type === 'unary' && node.left.arg.type !== 'number');
                        const isRightComplex = node.right.type === 'binary' || (node.right.type === 'unary' && node.right.arg.type !== 'number');

                        // Recurse first (Inside -> Out)
                        if (isLeftComplex) {
                            this.traverseAndExplain(node.left, this.getNameForSide(node.op, 'left'), outputList);
                        }
                        if (isRightComplex) {
                            this.traverseAndExplain(node.right, this.getNameForSide(node.op, 'right'), outputList);
                        }

                        // Now build the section for THIS node
                        // We only create a dedicated section if it's the root, or if at least one child was complex
                        // Otherwise, simple math (2+3) is handled inline or in the parent's section
                        if (isRoot || isLeftComplex || isRightComplex) {
                            const lines = [];
                            
                            // Line 1: The expression with immediate children resolved (or visually represented)
                            // e.g., "sqrt(4) + 50" or "25 * (10 - 2)"
                            let line1 = `${this.nodeToString(node.left)} ${this.prettyOp(node.op)} ${this.nodeToString(node.right)}`;
                            
                            // Line 2: If children were operations, show their values now
                            // e.g., "2 + 50"
                            let line2 = `${node.left.value} ${this.prettyOp(node.op)} ${node.right.value}`;
                            
                            // Line 3: Result
                            let line3 = `= ${node.value}`;

                            if (line1 !== line2) {
                                lines.push(line1);
                                lines.push(`= ${line2}`);
                            } else {
                                lines.push(line1);
                            }
                            lines.push(line3);

                            // Capitalize first letter of context
                            const title = contextName.charAt(0).toUpperCase() + contextName.slice(1) + ":";
                            outputList.push({ title, lines });
                        }
                    }

                    nodeToString(node) {
                        if (node.type === 'number') return node.value;
                        if (node.type === 'unary') return `sqrt(${this.nodeToString(node.arg)})`;
                        if (node.type === 'binary') {
                            const left = this.nodeToString(node.left);
                            const right = this.nodeToString(node.right);
                            return `(${left} ${this.prettyOp(node.op)} ${right})`;
                        }
                        return '';
                    }

                    prettyOp(op) {
                        if (op === '*') return '×';
                        if (op === '/') return '÷';
                        return op;
                    }
                }
                // --- END HELPER ---

                // Main Display Logic
                try {
                    solutionOutput.innerHTML = '';
                    
                    // 1. Render Big Header Math
                    const katexDiv = document.createElement('div');
                    katexDiv.className = 'katex-display mb-6 pb-6 border-b border-base-300';
                    
                    // Latex conversion for header
                    function expressionToLatex(expr) {
                        return expr.replace(/\*/g, '\\times')
                            .replace(/\//g, '\\div')
                            .replace(/\*\*/g, '^')
                            .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
                    }

                    if (typeof katex !== 'undefined') {
                        katex.render(`${expressionToLatex(originalExpression)} = ${target}`, katexDiv, {
                            displayMode: true, throwOnError: false
                        });
                    } else {
                        katexDiv.innerHTML = `<div class="text-3xl font-mono text-center">${originalExpression} = ${target}</div>`;
                    }
                    solutionOutput.appendChild(katexDiv);

                    // 2. Render Structured Steps
                    const formatter = new SolutionFormatter(originalExpression);
                    const stepsHTML = formatter.generateHTML(target);
                    
                    const stepsContainer = document.createElement('div');
                    stepsContainer.innerHTML = stepsHTML;
                    solutionOutput.appendChild(stepsContainer);

                    // 3. Copy Button
                    const copyButton = document.createElement('button');
                    copyButton.className = 'btn btn-outline btn-sm w-full mt-6';
                    copyButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                        </svg>
                        Copy Expression
                    `;
                    copyButton.addEventListener('click', () => {
                        navigator.clipboard.writeText(originalExpression).then(() => {
                            const originalText = copyButton.innerHTML;
                            copyButton.innerHTML = 'Copied!';
                            copyButton.classList.add('btn-success', 'text-white');
                            setTimeout(() => { 
                                copyButton.innerHTML = originalText;
                                copyButton.classList.remove('btn-success', 'text-white');
                            }, 2000);
                        });
                    });
                    solutionOutput.appendChild(copyButton);

                } catch (e) {
                    console.error('Render error:', e);
                    solutionOutput.textContent = originalExpression;
                }
            } else {
                // Failure (Timeout or No Solution)
                solutionOutput.innerHTML = `<div class="alert alert-warning shadow-lg">
                    <span>${result}</span>
                </div>`;
            }

            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
            
            const success = typeof result === 'object' && result !== null;
            if(success) showToast('Solution found!');
        }, 20);
    });

    // Advanced settings toggle
    const advancedSettings = document.querySelector("#advanced-settings");
    const advancedSettingsToggle = document.querySelector("#advanced-settings-toggle");

    if (advancedSettingsToggle && advancedSettings) {
        advancedSettingsToggle.addEventListener("click", () => {
            advancedSettings.classList.toggle("hidden");
        });

        advancedSettings.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener("click", (event) => event.stopPropagation());
        });
    }

    if (!document.getElementById("sqrt-checkbox")) {
        const exponentsCheckbox = document.getElementById("exponents-checkbox");
        if (exponentsCheckbox && exponentsCheckbox.parentNode) {
            const sqrtCheckboxContainer = document.createElement("div");
            sqrtCheckboxContainer.className = "form-control";
            sqrtCheckboxContainer.innerHTML = `
                <label class="flex items-center space-x-2">
                    <input type="checkbox" id="sqrt-checkbox" class="toggle toggle-sm">
                    <span>Allow Square Roots</span>
                </label>
            `;
            if (exponentsCheckbox.closest('.form-control')) {
                exponentsCheckbox.closest('.form-control').parentNode.appendChild(sqrtCheckboxContainer);
            } else {
                exponentsCheckbox.parentNode.parentNode.appendChild(sqrtCheckboxContainer);
            }
        }
    }
});
