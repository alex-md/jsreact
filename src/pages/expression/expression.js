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
    // Info button functionality
    const infoButton = document.getElementById("info-toggle");
    const calculatorDescription = document.getElementById("calculator-description");
    let descriptionTimeout;

    const showDescription = () => {
        calculatorDescription.classList.remove("hidden");
        setTimeout(() => {
            calculatorDescription.classList.remove("translate-y-full", "opacity-0");
        }, 10);

        clearTimeout(descriptionTimeout);
        descriptionTimeout = setTimeout(() => {
            calculatorDescription.classList.add("translate-y-full", "opacity-0");
            setTimeout(() => {
                calculatorDescription.classList.add("hidden");
            }, 3000);  // Shorter timeout
        }, 5000);
    };

    // Custom expression evaluator
    function findExpressionOptimized(numbers, target) {
        const operators = ["+", "-", "*", "/"];
        if (document.getElementById("exponents-checkbox").checked) {
            operators.push("**");
        }

        // Add square root if enabled
        const useSqrt = document.getElementById("sqrt-checkbox").checked;
        const noParentheses = document.getElementById("no-parentheses-checkbox").checked;

        // Memoization cache
        const memo = new Map();
        // Set a computation time limit (15 seconds)
        const timeLimit = 15000;
        const startTime = Date.now();
        let timeoutReached = false;

        // Check if we've exceeded the time limit
        function checkTimeout() {
            if (Date.now() - startTime > timeLimit) {
                timeoutReached = true;
                return true;
            }
            return false;
        }

        function buildExpressionWithoutParentheses(nums, ops) {
            let expr = nums[0].toString();
            for (let i = 0; i < ops.length; i++) {
                expr += ops[i] + nums[i + 1].toString();
            }
            return expr;
        }

        function evaluateOperatorPrecedence(nums, ops) {
            // First handle ** (exponents)
            let values = [...nums];
            let operators = [...ops];

            // Handle exponents first
            if (operators.includes("**")) {
                for (let i = operators.length - 1; i >= 0; i--) {
                    if (operators[i] === "**") {
                        const result = Math.pow(values[i], values[i + 1]);
                        values.splice(i, 2, result);
                        operators.splice(i, 1);
                    }
                }
            }

            // Handle multiplication and division from left to right
            for (let i = 0; i < operators.length; i++) {
                if (operators[i] === "*" || operators[i] === "/") {
                    const a = values[i];
                    const b = values[i + 1];
                    let result;
                    if (operators[i] === "*") {
                        result = a * b;
                    } else {
                        if (b === 0) return NaN;
                        result = a / b;
                    }
                    values.splice(i, 2, result);
                    operators.splice(i, 1);
                    i--;
                }
            }

            // Handle addition and subtraction from left to right
            for (let i = 0; i < operators.length; i++) {
                if (operators[i] === "+" || operators[i] === "-") {
                    const a = values[i];
                    const b = values[i + 1];
                    const result = operators[i] === "+" ? a + b : a - b;
                    values.splice(i, 2, result);
                    operators.splice(i, 1);
                    i--;
                }
            }

            return values[0];
        }

        function backtrackWithoutParentheses(nums) {
            // Early termination if timeout reached
            if (checkTimeout()) return null;

            if (nums.length === 1) {
                return Math.abs(nums[0] - target) < 1e-6 ? nums[0].toString() : null;
            }

            // Smart pruning: Don't generate all permutations at once
            // Instead, use an iterative approach with limited batch size
            const batchSize = 30; // Limit number of permutations to try at once
            let permutationCount = 0;

            // Calculate factorial for the permutation count
            let totalPermutations = 1;
            for (let i = 2; i <= nums.length; i++) {
                totalPermutations *= i;
            }

            // Use a permutation generator instead of generating all at once
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

                    // Check for timeout periodically
                    if (permutationCount++ % 100 === 0 && checkTimeout()) {
                        return;
                    }
                }
            }

            const permGen = permutationGenerator(nums);
            let permutation;

            // Process permutations in batches with a limited operation count
            while ((permutation = permGen.next()).done === false && !timeoutReached) {
                const numPermutation = permutation.value;

                // Generate operation combinations more efficiently - use predefined patterns first
                const opPatterns = [];
                // Try common patterns first (all multiplications, then all additions, etc.)
                if (operators.includes("*")) {
                    opPatterns.push(Array(nums.length - 1).fill("*"));
                }
                if (operators.includes("+")) {
                    opPatterns.push(Array(nums.length - 1).fill("+"));
                }

                // Try operations
                for (const opPattern of opPatterns) {
                    const value = evaluateOperatorPrecedence(numPermutation, opPattern);
                    if (!isNaN(value) && Math.abs(value - target) < 1e-6) {
                        return buildExpressionWithoutParentheses(numPermutation, opPattern);
                    }
                }

                // If predefined patterns don't work, then try combinations
                // But limit how many we try per permutation
                let opCombinationsCount = 0;
                const maxOpCombinations = 100; // Limit combinations to try per permutation

                function tryOperatorCombinations(current = [], index = 0) {
                    if (checkTimeout() || opCombinationsCount >= maxOpCombinations) {
                        return null;
                    }

                    if (index === nums.length - 1) {
                        opCombinationsCount++;
                        const value = evaluateOperatorPrecedence(numPermutation, current);
                        if (!isNaN(value) && Math.abs(value - target) < 1e-6) {
                            return buildExpressionWithoutParentheses(numPermutation, current);
                        }
                        return null;
                    }

                    for (const op of operators) {
                        current[index] = op;
                        const result = tryOperatorCombinations(current, index + 1);
                        if (result) return result;
                    }

                    return null;
                }

                const result = tryOperatorCombinations(Array(nums.length - 1));
                if (result) return result;
            }

            return null;
        }

        function backtrack(nums, currentExpr) {
            // Early termination if timeout reached
            if (checkTimeout()) return null;

            // Use memoization to avoid recalculating the same expressions
            const key = nums.sort().join(',') + '|' + currentExpr;
            if (memo.has(key)) {
                return memo.get(key);
            }

            if (nums.length === 0) {
                try {
                    const currentValue = evaluate(currentExpr);
                    if (!isNaN(currentValue) && Math.abs(currentValue - target) < 1e-6) {
                        return currentExpr;
                    }
                } catch (e) {
                    memo.set(key, null);
                    return null;
                }
                memo.set(key, null);
                return null;
            }

            // Optimization: Try operations that are more likely to succeed first
            // For example, multiplication and division are more likely to reach higher targets
            let orderedOps = [...operators];
            const absTarget = Math.abs(target);
            // If target is large, prioritize multiplication and exponents
            if (absTarget > 100) {
                orderedOps.sort((a, b) => {
                    if ((a === '*' || a === '**') && (b !== '*' && b !== '**')) return -1;
                    if ((b === '*' || b === '**') && (a !== '*' && a !== '**')) return 1;
                    return 0;
                });
            }
            // If target is small, prioritize division and subtraction
            else if (absTarget < 10) {
                orderedOps.sort((a, b) => {
                    if ((a === '/' || a === '-') && (b !== '/' && b !== '-')) return -1;
                    if ((b === '/' || b === '-') && (a !== '/' && a !== '-')) return 1;
                    return 0;
                });
            }

            for (let i = 0; i < nums.length; i++) {
                const num = nums[i];
                const remainingNums = nums.slice(0, i).concat(nums.slice(i + 1));

                if (currentExpr === "") {
                    if (useSqrt && num >= 0) {
                        const sqrtResult = backtrack(remainingNums, `sqrt(${num})`);
                        if (sqrtResult) return sqrtResult;
                    }
                    const result = backtrack(remainingNums, num.toString());
                    if (result) {
                        memo.set(key, result);
                        return result;
                    }
                } else {
                    for (const op of orderedOps) {
                        // Skip division by zero
                        if (op === '/' && num === 0) continue;

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
                                memo.set(key, sqrtResult);
                                return sqrtResult;
                            }
                        }
                    }
                }
            }

            memo.set(key, null);
            return null;
        }

        // Try without parentheses first if the option is selected
        let result = null;
        if (noParentheses) {
            result = backtrackWithoutParentheses(numbers);
        }

        // Fall back to regular solution with parentheses if no solution found or parentheses are allowed
        if (!result && !timeoutReached) {
            result = backtrack(numbers, "");
        }

        // Handle timeout message
        if (timeoutReached) {
            return result || "Computation timed out - try with fewer numbers";
        }

        return result || "No solution found";
    }

    // Event handlers
    infoButton.addEventListener("click", showDescription);

    document.getElementById("random-numbers-button").addEventListener("click", (event) => {
        event.preventDefault();
        const count = document.getElementById("num-integers-input").value || 6;
        const maxValue = document.getElementById("max-number-input").value || 60;
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
                function parseExpression(expr) {
                    // First handle square roots to avoid conflicts
                    expr = expr.replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}");

                    // Split into terms while preserving structure
                    const tokens = expr.match(/(\d+|\+|\-|\*|\/|\(|\))/g) || [];

                    // Convert tokens to LaTeX with proper spacing
                    let latexExpr = '';
                    let prevToken = '';

                    for (const token of tokens) {
                        if (/\d+/.test(token)) {
                            // Number - add space if previous token was an operator
                            latexExpr += (/[\+\-\*\/]/.test(prevToken) ? ' ' : '') + token;
                        } else {
                            switch (token) {
                                case '*':
                                    latexExpr += ' \\times ';
                                    break;
                                case '/':
                                    latexExpr += ' \\div ';
                                    break;
                                case '+':
                                    latexExpr += ' + ';
                                    break;
                                case '-':
                                    latexExpr += ' - ';
                                    break;
                                case '(':
                                    latexExpr += '\\left(';
                                    break;
                                case ')':
                                    latexExpr += '\\right)';
                                    break;
                                default:
                                    latexExpr += token;
                            }
                        }
                        prevToken = token;
                    }

                    return latexExpr.trim();
                }

                const displayResult = parseExpression(result);
                const latexExpression = `${displayResult} = ${target}`;

                try {
                    solutionOutput.style.fontSize = "1.2em";
                    solutionOutput.style.padding = "1.5rem";
                    solutionOutput.style.overflowX = "auto";
                    solutionOutput.style.overflowY = "hidden";

                    katex.render(latexExpression, solutionOutput, {
                        displayMode: true,
                        throwOnError: false,
                        trust: true
                    });
                } catch (e) {
                    console.error('KaTeX error:', e);
                    // Fallback to normal display if KaTeX fails
                    solutionOutput.innerHTML = result.replace(/sqrt\(/g, "√(");
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
