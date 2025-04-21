// Import styles and components
import '@/assets/styles/global.css';
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
        const operators = ["+", "-", "*", "/"];
        const useExponents = document.getElementById("exponents-checkbox").checked;
        const useSqrt = document.getElementById("sqrt-checkbox").checked;
        const noParentheses = document.getElementById("no-parentheses-checkbox").checked;
        if (useExponents) {
            operators.push("**");
        }

        const timeLimit = 15000; // 15 seconds
        const startTime = Date.now();
        let timeoutReached = false;
        const memo = new Map();

        function checkTimeout() {
            if (Date.now() - startTime > timeLimit) {
                timeoutReached = true;
                return true;
            }
            return false;
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

