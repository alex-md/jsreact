// Import styles and components
import '@styles/global.css';
import { showToast } from '@/components/toast.js';

// Utility functions
const evaluate = (expression) => {
    // Updated regex to include square root function
    const tokens = expression.match(/\d+|\+|\-|\*|\/|\*\*|\(|\)|sqrt/g);

    if (!tokens) return NaN;

    const applyOperator = (operator, a, b) => {
        switch (operator) {
            case "+": return a + b;
            case "-": return a - b;
            case "*": return a * b;
            case "/":
                if (b === 0) {
                    throw new Error("Division by zero"); // Handle division by zero
                }
                return a / b;
            case "**": return a ** b;
            default: throw new Error(`Unknown operator: ${operator}`);
        }
    };

    // Apply function (for square root)
    const applyFunction = (funcName, value) => {
        switch (funcName) {
            case "sqrt":
                if (value < 0) {
                    throw new Error("Square root of negative number");
                }
                return Math.sqrt(value);
            default:
                throw new Error(`Unknown function: ${funcName}`);
        }
    };

    function precedence(operator) {
        switch (operator) {
            case "+":
            case "-":
                return 1;
            case "*":
            case "/":
                return 2;
            case "**":
                return 3;
            case "sqrt":
                return 4; // Higher precedence for functions
            default:
                return 0;
        }
    }

    function shuntingYard(tokens) {
        const output = [];
        const operators = [];
        let expectOperand = true; // Track if we expect an operand or operator

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (!isNaN(token)) {
                output.push(Number(token));
                expectOperand = false;
            } else if (token === "sqrt") {
                operators.push(token);
                expectOperand = true;
            } else if (token === "(") {
                operators.push(token);
                expectOperand = true;
            } else if (token === ")") {
                while (operators.length && operators[operators.length - 1] !== "(") {
                    output.push(operators.pop());
                }
                if (operators.length === 0) {
                    throw new Error("Mismatched parentheses");
                }
                operators.pop(); // Remove the '('

                // After a closing parenthesis, check if it closes a function call
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
            if (operators[operators.length - 1] === '(') {
                throw new Error("Mismatched parentheses");
            }
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
                if (stack.length < 1) {
                    throw new Error("Invalid expression");
                }
                const a = stack.pop();
                stack.push(applyFunction(token, a));
            } else {
                if (stack.length < 2) {
                    throw new Error("Invalid expression");
                }
                const b = stack.pop();
                const a = stack.pop();
                stack.push(applyOperator(token, a, b));
            }
        }
        if (stack.length !== 1) {
            throw new Error("Invalid expression");
        }
        return stack.pop();
    }

    let result;
    try {
        const postfix = shuntingYard(tokens);
        result = evaluatePostfix(postfix);
    } catch (error) {
        return NaN;  // Return NaN if there is an error in evaluation.
    }

    return result;
};

// Main logic
document.addEventListener("DOMContentLoaded", () => {
    // Info button functionality - Optimized
    const infoButton = document.getElementById("info-toggle");
    const calculatorDescription = document.getElementById("calculator-description");
    let descriptionTimeout;

    const showDescription = () => {
        calculatorDescription.classList.remove("hidden", "translate-y-full", "opacity-0");

        clearTimeout(descriptionTimeout);
        descriptionTimeout = setTimeout(() => {
            // Use a single class for hiding with transition
            calculatorDescription.classList.add("hiding");

            // Remove the hiding class after the transition (300ms is standard, reduce if desired)
            setTimeout(() => {
                calculatorDescription.classList.remove("hiding"); // Remove class after animation
                calculatorDescription.classList.add("hidden");
            }, 300); // Match CSS transition time
        }, 5000);
    };

    infoButton.addEventListener("click", showDescription);

    function findExpressionOptimized(numbers, target) {
        const useExponents = document.getElementById("exponents-checkbox").checked;
        const useSqrt = document.getElementById("sqrt-checkbox").checked;
        const noParentheses = document.getElementById("no-parentheses-checkbox").checked;

        const timeLimit = 4000; // 4 seconds soft limit
        const startTime = Date.now();

        // Check for timeout
        const isTimedOut = () => Date.now() - startTime > timeLimit;

        // An Item represents a number and its history (expression string)
        // precedence is used to determine if we need parens: 
        // 0: atom/func, 1: +/-, 2: */, 3: **
        class Item {
            constructor(val, expr = null, prec = 4) {
                this.val = val;
                this.expr = expr === null ? val.toString() : expr;
                this.prec = prec; 
            }
        }

        // Convert raw numbers to Items
        let initialItems = numbers.map(n => new Item(n));
        
        // Memoization: Key is sorted values joined by comma
        const visited = new Set();
        
        let solution = null;

        function solve(items) {
            if (solution) return; // Stop if found
            if (isTimedOut()) return;

            // 1. Check if we reached target
            for (const item of items) {
                if (Math.abs(item.val - target) < 1e-6) {
                    solution = item.expr;
                    return;
                }
            }

            // Optimization: Map items to a unique key (sorted values)
            // If we've seen this set of numbers before, don't re-compute
            const stateKey = items.map(i => i.val).sort((a, b) => a - b).join('|');
            if (visited.has(stateKey)) return;
            visited.add(stateKey);

            // 2. Unary Operation: Square Root
            // We do this separately because it doesn't reduce item count, just transforms one
            if (useSqrt) {
                for (let i = 0; i < items.length; i++) {
                    const x = items[i];
                    
                    // Pruning: 
                    // 1. Negative numbers -> NaN
                    // 2. 0 and 1 -> sqrt(0)=0, sqrt(1)=1 (useless loop)
                    // 3. Performance: Only allow integer results? 
                    //    Allowing decimals dramatically increases search space. 
                    //    For standard countdown, we usually check if it's a perfect square.
                    //    Remove `Number.isInteger` check if you strictly want decimal solutions.
                    if (x.val > 1) { 
                        const root = Math.sqrt(x.val);
                        
                        // Strict optimization: Only allow exact squares. 
                        // Relax this to `root === parseFloat(root.toFixed(6))` if you want decimals.
                        if (Number.isInteger(root)) { 
                            const newItem = new Item(root, `sqrt(${x.expr})`, 4);
                            
                            // Create new array with transformed item
                            const nextItems = [...items];
                            nextItems[i] = newItem;
                            
                            solve(nextItems);
                            if (solution) return;
                        }
                    }
                }
            }

            // 3. Binary Operations
            // Pick two numbers, combine them, recurse
            for (let i = 0; i < items.length; i++) {
                for (let j = 0; j < items.length; j++) {
                    if (i === j) continue;

                    const a = items[i];
                    const b = items[j];

                    // Remaining items excluding a and b
                    const remaining = items.filter((_, idx) => idx !== i && idx !== j);

                    // --- Addition (+) ---
                    // Commutative: Only do if i < j to avoid doing a+b AND b+a
                    if (i < j) {
                        // a + b
                        const val = a.val + b.val;
                        const expr = noParentheses 
                            ? `${a.expr}+${b.expr}` // Risky if strictly interpreted, but fits "no parens" text
                            : `${a.expr} + ${b.expr}`;
                        // Precedence of + is 1. No parents needed if children are higher, 
                        // but strictly we just store string. 
                        // If we needed strictly correct parens generation:
                        // const left = a.prec < 1 ? `(${a.expr})` : a.expr; ...
                        
                        remaining.push(new Item(val, `(${a.expr} + ${b.expr})`, 1));
                        solve(remaining);
                        remaining.pop();
                        if (solution) return;
                    }

                    // --- Multiplication (*) ---
                    // Commutative: i < j
                    if (i < j) {
                        // Pruning: x * 1 is useless
                        if (a.val !== 1 && b.val !== 1) {
                            const val = a.val * b.val;
                            // Formatting logic: Add parens if child is + or -
                            const strA = a.prec < 2 ? `(${a.expr})` : a.expr;
                            const strB = b.prec < 2 ? `(${b.expr})` : b.expr;
                            
                            remaining.push(new Item(val, `${strA} * ${strB}`, 2));
                            solve(remaining);
                            remaining.pop();
                            if (solution) return;
                        }
                    }

                    // --- Subtraction (-) ---
                    // Non-commutative. a - b.
                    // Pruning: Usually we don't want negative intermediate numbers in countdown, 
                    // but they are mathematically valid. 
                    // Heavy optimization: Don't subtract 0.
                    if (b.val !== 0) {
                        const val = a.val - b.val;
                        remaining.push(new Item(val, `(${a.expr} - ${b.expr})`, 1));
                        solve(remaining);
                        remaining.pop();
                        if (solution) return;
                    }

                    // --- Division (/) ---
                    // Non-commutative. a / b.
                    // Pruning: No divide by 0. No divide by 1.
                    // Strict countdown: Must result in integer. 
                    // Remove `Number.isInteger` if you allow fractions.
                    if (b.val !== 0 && b.val !== 1) {
                        const val = a.val / b.val;
                        // Optimization: Allow non-integers? 
                        // If we allow 3/2 = 1.5, the tree explodes.
                        // Let's stick to standard countdown rules: division must be clean.
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
                        // Pruning: 
                        // 1 ** x = 1 (useless)
                        // x ** 1 = x (useless)
                        // x ** 0 = 1 (useless, usually achievable by x/x)
                        // negative exponents -> fractions (often messy, skip for speed)
                        // HUGE numbers -> JS goes to Infinity or takes forever. Cap at a reasonable limit.
                        
                        // Limit constraint: 500,000 (arbitrary large number to prevent freezing)
                        // or max(target * 100).
                        const limit = Math.max(target * 100, 500000);

                        if (a.val > 1 && b.val > 1 && b.val < 20) { // b < 20 prevents generic overflow
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
            // Cleanup outer parens if they exist
            if (solution.startsWith('(') && solution.endsWith(')')) {
                // Simple check to see if parens are redundant for the whole expression
                // (This is a naive check, but fine for display)
                let balance = 0;
                let clean = true;
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

        // Optimized Evaluation (Handles operator precedence and avoids eval)
        function evaluateExpression(expression) {
            try {
                if (noParentheses) {
                    return evaluateWithoutParentheses(expression)
                }
                else {
                    return evaluateWithParentheses(expression);
                }
            } catch (e) {
                return NaN; // Handle any evaluation errors
            }
        }

        function evaluateWithoutParentheses(expression) {
            const tokens = tokenize(expression); // Tokenize once

            function tokenize(expr) {
                const tokens = [];
                let currentNumber = '';

                for (const char of expr) {
                    if (operators.includes(char)) {
                        if (currentNumber !== '') {
                            tokens.push(parseFloat(currentNumber));
                            currentNumber = '';
                        }
                        tokens.push(char);
                    } else if (char === 's') { // Handle 'sqrt('
                        if (currentNumber !== '') {
                            tokens.push(parseFloat(currentNumber));
                            currentNumber = '';
                        }
                        tokens.push('sqrt(');
                    }
                    else if (char === ')') {
                        if (currentNumber !== '') {
                            tokens.push(parseFloat(currentNumber));
                            currentNumber = '';
                        }
                        tokens.push(')');

                    }
                    else {
                        currentNumber += char;
                    }
                }

                if (currentNumber !== '') {
                    tokens.push(parseFloat(currentNumber));
                }
                return tokens;
            }

            // Helper function to apply an operator
            function applyOp(op, b, a) { // Note the order for correct subtraction/division
                if (op === "+") return a + b;
                if (op === "-") return a - b;
                if (op === "*") return a * b;
                if (op === "/") {
                    if (b === 0) throw new Error("Division by zero");
                    return a / b;
                }
                if (op === "**") return Math.pow(a, b);
                throw new Error("Invalid operator");
            }


            // Operator precedence handling using shunting yard principle (simplified for no parentheses)
            function precedence(op) {
                if (op === "+" || op === "-") return 1;
                if (op === "*" || op === "/") return 2;
                if (op === "**") return 3; // Exponents have higher precedence
                if (op === 'sqrt(') return 4;
                return 0;
            }

            const values = [];
            const ops = [];

            for (const token of tokens) {
                if (typeof token === 'number') {
                    values.push(token);
                } else if (token === 'sqrt(') {
                    ops.push(token);
                }
                else if (token === ')') {
                    while (ops.length > 0 && ops[ops.length - 1] !== 'sqrt(') {
                        values.push(applyOp(ops.pop(), values.pop(), values.pop()));
                    }
                    if (ops.length > 0 && ops[ops.length - 1] === 'sqrt(') {
                        ops.pop(); //remove 'sqrt('
                        values.push(Math.sqrt(values.pop()));
                    }

                } else { // Operator
                    while (ops.length > 0 && precedence(ops[ops.length - 1]) >= precedence(token)) {
                        values.push(applyOp(ops.pop(), values.pop(), values.pop()));
                    }
                    ops.push(token);
                }
            }

            while (ops.length > 0) {
                values.push(applyOp(ops.pop(), values.pop(), values.pop()));
            }
            return values[0];
        }
        function evaluateWithParentheses(expression) {
            function tokenize(expr) {
                const tokens = [];
                let currentNumber = '';
                for (let i = 0; i < expr.length; i++) {
                    const char = expr[i];
                    if (operators.includes(char) || char === '(' || char === ')') {
                        if (currentNumber !== '') {
                            tokens.push(parseFloat(currentNumber));
                            currentNumber = '';
                        }
                        tokens.push(char);
                    }
                    else if (char === 's' && expr.substring(i, i + 5) === 'sqrt(') {
                        if (currentNumber !== '') {
                            tokens.push(parseFloat(currentNumber));
                            currentNumber = '';
                        }
                        tokens.push('sqrt(');
                        i += 4; // Skip 'qrt('
                    }
                    else {
                        currentNumber += char;
                    }
                }
                if (currentNumber !== '') {
                    tokens.push(parseFloat(currentNumber));
                }
                return tokens;
            }
            const tokens = tokenize(expression);

            function precedence(op) {
                if (op === "+" || op === "-") return 1;
                if (op === "*" || op === "/") return 2;
                if (op === "**") return 3;
                if (op === 'sqrt(') return 4;
                return 0;
            }

            function applyOp(op, b, a) {
                if (op === "+") return a + b;
                if (op === "-") return a - b;
                if (op === "*") return a * b;
                if (op === "/") {
                    if (b === 0) throw new Error("Division by zero");
                    return a / b;
                }
                if (op === "**") return Math.pow(a, b);
                throw new Error("Invalid operator");
            }


            const values = [];
            const ops = [];

            for (const token of tokens) {
                if (typeof token === 'number') {
                    values.push(token);
                }
                else if (token === '(') {
                    ops.push(token);
                }
                else if (token === ')') {
                    while (ops.length > 0 && ops[ops.length - 1] !== '(') {
                        values.push(applyOp(ops.pop(), values.pop(), values.pop()));
                    }
                    ops.pop(); // Remove '('
                }
                else if (token === 'sqrt(') {
                    ops.push(token);
                }
                else { // Operator
                    while (ops.length > 0 && ops[ops.length - 1] !== '(' && precedence(ops[ops.length - 1]) >= precedence(token)) {
                        values.push(applyOp(ops.pop(), values.pop(), values.pop()));
                    }
                    ops.push(token);
                }
            }

            while (ops.length > 0) {
                if (ops[ops.length - 1] === 'sqrt(') {
                    ops.pop();
                    values.push(Math.sqrt(values.pop()));
                }
                else {
                    values.push(applyOp(ops.pop(), values.pop(), values.pop()));
                }
            }
            return values[0];
        }

        function* permutationGenerator(arr) {
            const n = arr.length;
            const c = Array(n).fill(0);
            let i = 0;

            yield [...arr]; // First permutation

            while (i < n) {
                if (c[i] < i) {
                    const swapPos = i % 2 === 0 ? 0 : c[i];
                    [arr[i], arr[swapPos]] = [arr[swapPos], arr[i]];
                    yield [...arr];
                    c[i]++;
                    i = 0;
                } else {
                    c[i] = 0;
                    i++;
                }
            }
        }

        // Optimized backtracking (combines features, avoids string concatenation)
        function backtrack(nums, currentExpr) {
            if (checkTimeout()) return null;

            const key = nums.slice().sort((a, b) => a - b).join(',') + '|' + currentExpr;
            if (memo.has(key)) {
                return memo.get(key);
            }


            if (nums.length === 0) {
                const currentValue = evaluateExpression(currentExpr);
                if (!isNaN(currentValue) && Math.abs(currentValue - target) < 1e-6) {
                    return currentExpr;
                }
                memo.set(key, null);
                return null;
            }
            //Permutation optimization
            for (const permutedNums of permutationGenerator(nums)) {
                for (let i = 0; i < permutedNums.length; i++) {
                    const num = permutedNums[i];
                    const remainingNums = permutedNums.slice(0, i).concat(permutedNums.slice(i + 1));

                    //Initial Expression
                    if (currentExpr === "") {
                        if (useSqrt && num >= 0) {
                            const sqrtResult = backtrack(remainingNums, `sqrt(${num})`);
                            if (sqrtResult) {
                                memo.set(key, sqrtResult);
                                return sqrtResult
                            };
                        }
                        const result = backtrack(remainingNums, num.toString());
                        if (result) {
                            memo.set(key, result);
                            return result;
                        }
                    }
                    else {
                        //Operator optimization
                        for (const op of operators) {
                            if (op === "/" && num === 0) continue; // Avoid division by zero

                            const newExpr = noParentheses ? `${currentExpr}${op}${num}` : `(${currentExpr}${op}${num})`;
                            const result = backtrack(remainingNums, newExpr);
                            if (result) {
                                memo.set(key, result);
                                return result;
                            }

                            if (useSqrt && num >= 0) {
                                const sqrtNewExpr = noParentheses ?
                                    `${currentExpr}${op}sqrt(${num})` :
                                    `(${currentExpr}${op}sqrt(${num}))`;
                                const sqrtResult = backtrack(remainingNums, sqrtNewExpr);
                                if (sqrtResult) {
                                    memo.set(key, result);
                                    return sqrtResult;
                                }
                            }
                        }
                    }
                }
            }
            memo.set(key, null);
            return null;
        }

        let result = backtrack(numbers, "");

        if (timeoutReached) {
            return "Computation timed out - try with fewer numbers";
        }

        return result || "No solution found";
    }

    // Event handlers
    infoButton.addEventListener("click", showDescription);

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

        // Create and add loading spinner
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

            if (result !== "No solution found" && result !== "Computation timed out - try with fewer numbers") {
                const originalExpression = result;

                function expressionToLatex(expr) {
                    try {
                        // Use Math.js to parse the expression
                        const node = math.parse(expr);

                        // Use the toTex() method to convert to LaTeX
                        return node.toTex({ parenthesis: 'keep' }); // 'keep' is crucial

                    } catch (e) {
                        console.error("Error parsing expression with Math.js:", e);
                        // Fallback (basic formatting, no fractions)
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

                    // Render using KaTeX
                    katex.render(latexExpression, katexDiv, {
                        displayMode: true,
                        throwOnError: false, // Handle rendering errors gracefully
                        trust: true        // Allow LaTeX commands
                    });

                    // Copy button
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
                    solutionOutput.innerHTML = result.replace(/\*/g, "×").replace(/\//g, "÷").replace(/\*\*/g, "^");
                    const copyButton = document.createElement('button');
                    copyButton.textContent = 'Copy Expression';
                    copyButton.addEventListener('click', () => {
                        navigator.clipboard.writeText(originalExpression);
                    });
                    solutionOutput.appendChild(copyButton);
                }
            } else {
                solutionOutput.textContent = result;
            }

            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
            showToast(result === "No solution found" ? 'No solution found' : 'Solution found!');
        }, 10);
    });

    // Advanced settings toggle
    const advancedSettings = document.querySelector("#advanced-settings");
    const advancedSettingsToggle = document.querySelector("#advanced-settings-toggle");

    advancedSettingsToggle.addEventListener("click", () => {
        advancedSettings.classList.toggle("hidden");
    });

    advancedSettings.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener("click", (event) => event.stopPropagation());
    });

    // Make sure we have the square root checkbox in the HTML
    // If the HTML doesn't already have this element, add it dynamically
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
            exponentsCheckbox.parentNode.parentNode.appendChild(sqrtCheckboxContainer);
        }
    }
});

