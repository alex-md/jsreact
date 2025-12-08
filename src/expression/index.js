// Import styles and components
import '@styles/global.css';
import { showToast } from '@/components/toast.js';

// Utility functions
// This is kept for the manual calculator logic if needed elsewhere, 
// but the solver now uses internal math for speed.
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

        const timeLimit = 4000; // 4 seconds soft limit to prevent browser hang
        const startTime = Date.now();
        const isTimedOut = () => Date.now() - startTime > timeLimit;

        // Item class tracks the math value AND the string representation simultaneously
        class Item {
            constructor(val, expr = null, prec = 4) {
                this.val = val;
                this.expr = expr === null ? val.toString() : expr;
                // Precedence: 0:atom/func, 1:+/-, 2:*/, 3:**, 4:raw number
                this.prec = prec; 
            }
        }

        let initialItems = numbers.map(n => new Item(n));
        
        // Memoization: Key is "sorted values joined by |"
        // This prevents re-calculating (3+2)*5 if we already calculated (2+3)*5
        const visited = new Set();
        let solution = null;

        function solve(items) {
            if (solution) return; 
            if (isTimedOut()) return;

            // 1. Check Solution
            for (const item of items) {
                if (Math.abs(item.val - target) < 1e-6) {
                    solution = item.expr;
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
                    // Pruning: sqrt(0) and sqrt(1) don't help reach new targets usually
                    if (x.val > 1) { 
                        const root = Math.sqrt(x.val);
                        // Strict check: Only allow integer roots to keep search space sanity
                        // (Remove Number.isInteger if you want to allow decimals)
                        if (Number.isInteger(root)) { 
                            const newItem = new Item(root, `sqrt(${x.expr})`, 4);
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

                    // --- Addition (+) ---
                    // Commutative: Force order (i < j) to avoid duplicates
                    if (i < j) { 
                        const val = a.val + b.val;
                        const expr = noParentheses 
                            ? `${a.expr}+${b.expr}` 
                            : `(${a.expr} + ${b.expr})`;
                        
                        remaining.push(new Item(val, expr, 1));
                        solve(remaining);
                        remaining.pop();
                        if (solution) return;
                    }

                    // --- Multiplication (*) ---
                    // Commutative: Force order (i < j)
                    if (i < j) {
                        // Pruning: x * 1 is useless
                        if (a.val !== 1 && b.val !== 1) {
                            const val = a.val * b.val;
                            const strA = a.prec < 2 ? `(${a.expr})` : a.expr;
                            const strB = b.prec < 2 ? `(${b.expr})` : b.expr;
                            
                            remaining.push(new Item(val, `${strA} * ${strB}`, 2));
                            solve(remaining);
                            remaining.pop();
                            if (solution) return;
                        }
                    }

                    // --- Subtraction (-) ---
                    // Not Commutative
                    if (b.val !== 0) { // Pruning: - 0 is useless
                        const val = a.val - b.val;
                        // Optional: Check val >= 0 if you don't want negative numbers
                        remaining.push(new Item(val, `(${a.expr} - ${b.expr})`, 1));
                        solve(remaining);
                        remaining.pop();
                        if (solution) return;
                    }

                    // --- Division (/) ---
                    // Not Commutative
                    if (b.val !== 0 && b.val !== 1) { // Pruning
                        const val = a.val / b.val;
                        // Optimization: Only allow integer division results
                        if (Number.isInteger(val)) {
                            const strA = a.prec < 2 ? `(${a.expr})` : a.expr;
                            const strB = b.prec < 2 ? `(${b.expr})` : b.expr;

                            remaining.push(new Item(val, `${strA} / ${strB}`, 2));
                            solve(remaining);
                            remaining.pop();
                            if (solution) return;
                        }
                    }

                    // --- Exponents (**) ---
                    if (useExponents) {
                        // Safety Cap: 500,000 (or close to target) to prevent Infinity or freezing
                        const limit = Math.max(target * 100, 500000); 

                        // Pruning: 
                        // a > 1: 1^x is 1
                        // b > 1: x^1 is x
                        // b < 20: Prevent massive overflow
                        if (a.val > 1 && b.val > 1 && b.val < 20) { 
                            const val = Math.pow(a.val, b.val);
                            if (val < limit && Number.isInteger(val)) {
                                const strA = a.prec < 3 ? `(${a.expr})` : a.expr;
                                const strB = b.prec < 3 ? `(${b.expr})` : b.expr;
                                
                                remaining.push(new Item(val, `${strA} ** ${strB}`, 3));
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
            // Cosmetic cleanup: remove outer parens if they exist
            if (solution.startsWith('(') && solution.endsWith(')')) {
                // Quick balancing check to ensure we aren't removing valid parens e.g. (1+2)*(3+4)
                let balance = 0, clean = true;
                for(let k=1; k<solution.length-1; k++) {
                    if(solution[k] === '(') balance++;
                    if(solution[k] === ')') balance--;
                    if(balance < 0) { clean = false; break; }
                }
                if(clean) solution = solution.substring(1, solution.length - 1);
            }
            return solution;
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

        // Small timeout to allow UI to update with spinner
        setTimeout(() => {
            let result = findExpressionOptimized(numbers, target);

            if (result !== "No solution found" && result !== "Computation timed out - try with fewer numbers") {
                const originalExpression = result;

                // Latex conversion
                function expressionToLatex(expr) {
                    try {
                        // Assuming math.js is available globally or imported
                        if (typeof math !== 'undefined') {
                            const node = math.parse(expr);
                            return node.toTex({ parenthesis: 'keep' });
                        }
                        throw new Error("Math.js not found");
                    } catch (e) {
                        return expr.replace(/\*/g, ' \\times ')
                            .replace(/\//g, ' \\div ')
                            .replace(/\*\*/g, '^');
                    }
                }

                const latexExpression = `${expressionToLatex(result)} = ${target}`;

                try {
                    solutionOutput.innerHTML = '';
                    const katexDiv = document.createElement('div');
                    katexDiv.className = 'katex-display';
                    solutionOutput.appendChild(katexDiv);
                    solutionOutput.style.fontSize = "1.2em";
                    solutionOutput.style.padding = "1.5rem";
                    solutionOutput.style.overflowX = "auto";
                    solutionOutput.style.overflowY = "hidden";

                    if (typeof katex !== 'undefined') {
                        katex.render(latexExpression, katexDiv, {
                            displayMode: true,
                            throwOnError: false,
                            trust: true
                        });
                    } else {
                        // Fallback if katex is missing
                        katexDiv.textContent = `${originalExpression} = ${target}`;
                    }

                    const copyButton = document.createElement('button');
                    copyButton.className = 'px-3 py-1 mt-4 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300';
                    copyButton.textContent = 'Copy Expression';
                    copyButton.addEventListener('click', () => {
                        const copyText = `${originalExpression} `;
                        navigator.clipboard.writeText(copyText).then(() => {
                            showToast('Expression copied!');
                            copyButton.textContent = 'Copied!';
                            setTimeout(() => { copyButton.textContent = 'Copy Expression'; }, 2000);
                        }).catch(err => console.error('Failed to copy:', err));
                    });
                    solutionOutput.appendChild(copyButton);

                } catch (e) {
                    console.error('KaTeX error:', e);
                    solutionOutput.textContent = result;
                }
            } else {
                solutionOutput.textContent = result;
            }

            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
            showToast(result === "No solution found" ? 'No solution found' : 'Solution found!');
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

    // Dynamic Square Root Checkbox Injection
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
            // Append safely
            if(exponentsCheckbox.closest('.form-control')) {
                exponentsCheckbox.closest('.form-control').parentNode.appendChild(sqrtCheckboxContainer);
            } else {
                exponentsCheckbox.parentNode.parentNode.appendChild(sqrtCheckboxContainer);
            }
        }
    }
});
