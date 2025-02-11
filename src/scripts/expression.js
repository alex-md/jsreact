document.addEventListener("DOMContentLoaded", function () {
    // Info button functionality
    const infoButton = document.getElementById("info-toggle");
    const calculatorDescription = document.getElementById("calculator-description");
    let descriptionTimeout;

    infoButton.addEventListener("click", function () {
        calculatorDescription.classList.remove("hidden");
        setTimeout(() => {
            calculatorDescription.classList.remove("translate-y-full", "opacity-0");
        }, 10);

        clearTimeout(descriptionTimeout);
        descriptionTimeout = setTimeout(() => {
            calculatorDescription.classList.add("translate-y-full", "opacity-0");
            setTimeout(() => {
                calculatorDescription.classList.add("hidden");
            }, 300);
        }, 5000);
    });

    // Custom expression evaluator
    function evaluate(expression) {
        const tokens = expression.match(/\d+|\+|\-|\*|\/|\*\*|\(|\)/g);

        function applyOperator(operator, a, b) {
            switch (operator) {
                case "+": return a + b;
                case "-": return a - b;
                case "*": return a * b;
                case "/": return a / b;
                case "**": return a ** b;
                default: throw new Error(`Unknown operator: ${operator}`);
            }
        }

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
                    operators.pop(); 
                } else {
                    while (
                        operators.length &&
                        precedence(operators[operators.length - 1]) >= precedence(token)
                    ) {
                        output.push(operators.pop());
                    }
                    operators.push(token);
                }
            }
            while (operators.length) {
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
                    const b = stack.pop();
                    const a = stack.pop();
                    stack.push(applyOperator(token, a, b));
                }
            }
            return stack.pop();
        }

        const postfix = shuntingYard(tokens);
        return evaluatePostfix(postfix);
    }

    // Expression finder logic
   function findExpressionOptimized(numbers, target) {
    const operators = ["+", "-", "*", "/"];
    if (document.getElementById("exponents-checkbox").checked) {
        operators.push("**");
    }

    function backtrack(nums, currentExpr, currentValue) {
    if (nums.length === 0) {
        if (Math.abs(currentValue - target) < 1e-6) { // Account for floating-point precision
            return currentExpr;
        }
        return null;
    }

        for (let i = 0; i < nums.length; i++) {
            const num = nums[i];
            const remainingNums = nums.slice(0, i).concat(nums.slice(i + 1));

            for (const op of operators) {
                if (op === "/" && currentValue === 0) continue; // Avoid division by zero
                
                let newValue;
                try {
                    newValue = evaluate(`${currentValue}${op}${num}`);
                } catch (error) {
                    // If evaluation fails (e.g., division by zero), skip this operation
                    continue; 
                }
                
                const newExpr = `(${currentExpr}${op}${num})`;
                const result = backtrack(remainingNums, newExpr, newValue);
                if (result) return result;
            }
        }
        return null;
    }

    for (let i = 0; i < numbers.length; i++) {
        const num = numbers[i];
        const remainingNums = numbers.slice(0, i).concat(numbers.slice(i + 1));
        const result = backtrack(remainingNums, num.toString(), num);
        if (result) return result;
    }

    return "No solution found";
}

    // Event handler for random numbers generation
    document.getElementById("random-numbers-button").addEventListener("click", function (event) {
        event.preventDefault();
        const count = document.getElementById("num-integers-input").value || 6;
        const maxValue = document.getElementById("max-number-input").value || 60;
        const randomNumbers = Array.from({ length: count }, () => Math.floor(Math.random() * maxValue) + 1);
        document.getElementById("numbers-input").value = randomNumbers.join(",");
    });

    // Event handler for form submission
    document.getElementById("submit-button").addEventListener("click", function (event) {
        event.preventDefault();
        const submitButton = document.getElementById("submit-button");
        const solutionOutput = document.getElementById("solution-output");

        submitButton.innerHTML = "Calculating...";
        solutionOutput.classList.remove("hidden");

        const numbers = document.getElementById("numbers-input").value.split(",").map(Number);
        const target = Number(document.getElementById("target-input").value);

        setTimeout(() => {
            const result = findExpressionOptimized(numbers, target);
            solutionOutput.innerHTML = result;
            submitButton.innerHTML = "Find Expression";
        }, 10);
    });

    // Event handlers for advanced settings
    const advancedSettings = document.querySelector("#advanced-settings");
    const advancedSettingsToggle = document.querySelector("#advanced-settings-toggle");

    advancedSettingsToggle.addEventListener("click", function () {
        advancedSettings.style.display = advancedSettings.style.display === "none" ? "block" : "none";
    });

    advancedSettings.querySelectorAll('input[type="number"]').forEach(function (input) {
        input.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    });
});
