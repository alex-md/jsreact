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

        function backtrack(nums, currentExpr) {
            if (nums.length === 0) {
                try {
                    const currentValue = evaluate(currentExpr);
                    if (!isNaN(currentValue) && Math.abs(currentValue - target) < 1e-6) {
                        return currentExpr;
                    }
                } catch (e) {
                    return null; //invalid expressions
                }
                return null;
            }

            for (let i = 0; i < nums.length; i++) {
                const num = nums[i];
                const remainingNums = nums.slice(0, i).concat(nums.slice(i + 1));

                // First number, no operator needed
                if (currentExpr === "") {
                    // Try with and without square root for the first number
                    const result = backtrack(remainingNums, num.toString());
                    if (result) return result;

                    if (useSqrt && num >= 0) {
                        const sqrtResult = backtrack(remainingNums, `sqrt(${num})`);
                        if (sqrtResult) return sqrtResult;
                    }
                }
                else {
                    for (const op of operators) {
                        // Try normal operation
                        const newExpr = `(${currentExpr}${op}${num})`;
                        const result = backtrack(remainingNums, newExpr);
                        if (result) return result;

                        // Try with square root if enabled
                        if (useSqrt && num >= 0) {
                            const sqrtNewExpr = `(${currentExpr}${op}sqrt(${num}))`;
                            const sqrtResult = backtrack(remainingNums, sqrtNewExpr);
                            if (sqrtResult) return sqrtResult;
                        }
                    }
                }
            }
            return null;
        }

        const result = backtrack(numbers, "");
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

        submitButton.innerHTML = "Calculating...";
        solutionOutput.classList.remove("hidden");

        const numbers = document.getElementById("numbers-input").value
            .split(",")
            .map(num => parseInt(num.trim()));
        const target = parseInt(document.getElementById("target-input").value);

        if (!numbers.every(n => !isNaN(n)) || isNaN(target)) {
            showToast('Please enter valid numbers');
            submitButton.innerHTML = "Find Expression";
            return;
        }

        setTimeout(() => {
            let result = findExpressionOptimized(numbers, target);
            // Replace 'sqrt(' with '√(' for proper display if solution found
            let displayResult = result;
            if (result !== "No solution found") {
                displayResult = result.replace(/sqrt\(/g, "√(");
            }
            solutionOutput.innerHTML = displayResult;
            submitButton.innerHTML = "Find Expression";
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
