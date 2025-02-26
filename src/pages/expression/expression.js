// Import styles and components
import '@/assets/styles/global.css';
import { showToast } from '@/components/toast.js';

// Utility functions
const evaluate = (expression) => {
    const tokens = expression.match(/\d+|\+|\-|\*|\/|\*\*|\(|\)/g);

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
            default:
                return 0;
        }
    }

    function shuntingYard(tokens) {
        const output = [];
        const operators = [];
        for (const token of tokens) {
            if (!isNaN(token)) {
                output.push(Number(token));
            } else if (token === "(") {
                operators.push(token);
            } else if (token === ")") {
                while (operators.length && operators[operators.length - 1] !== "(") {
                    output.push(operators.pop());
                }
                if (operators.length === 0) {
                  throw new Error("Mismatched parentheses");
                }
                operators.pop(); // Remove the '('
            } else {
                while (operators.length && precedence(operators[operators.length - 1]) >= precedence(token)) {
                    output.push(operators.pop());
                }
                operators.push(token);
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
                     const result = backtrack(remainingNums, num.toString());
                     if (result) return result;
                }
                else {

                  for (const op of operators) {

                    const newExpr = `(${currentExpr}${op}${num})`; // Always use parentheses
                    const result = backtrack(remainingNums, newExpr);
                      if (result) {
                        return result;
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
            const result = findExpressionOptimized(numbers, target);
            solutionOutput.innerHTML = result;
            submitButton.innerHTML = "Find Expression";
            showToast(result === "No solution found" ? 'No solution found' : 'Solution found!');
        }, 10);
    });

    // Advanced settings toggle
    const advancedSettings = document.querySelector("#advanced-settings");
    const advancedSettingsToggle = document.querySelector("#advanced-settings-toggle");

    advancedSettingsToggle.addEventListener("click", () => {
        advancedSettings.style.display = advancedSettings.style.display === "none" ? "block" : "none";
    });

    advancedSettings.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener("click", (event) => event.stopPropagation());
    });
});
