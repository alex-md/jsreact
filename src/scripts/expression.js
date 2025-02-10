// Helper function to handle async generator functions
function handleAsyncGenerator(generator) {
    function next(value) {
        return generator.next(value);
    }
    function throwError(error) {
        return generator.throw(error);
    }
    return new Promise(function (resolve, reject) {
        function step(result) {
            result.done ? resolve(result.value) : Promise.resolve(result.value).then(next, throwError).then(step, reject);
        }
        step(generator.next());
    });
}

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

    /**
     * Finds one expression that evaluates to the target efficiently
     * @param {number[]} numbers - Array of input numbers
     * @param {number} target - Target number
     * @returns {string} The found expression or "No solution found"
     */
    function findExpressionOptimized(numbers, target) {
        const operators = ["+", "-", "*", "/"];
        if (document.getElementById("exponents-checkbox").checked) {
            operators.push("**");
        }

        const seen = new Set();

        function evaluateExpression(expression) {
            try {
                return eval(expression);
            } catch {
                return null;
            }
        }

        function generateExpressions(nums) {
            if (nums.length === 1) {
                return nums[0].toString();
            }

            for (let i = 1; i < nums.length; i++) {
                const left = nums.slice(0, i);
                const right = nums.slice(i);

                const leftExpr = generateExpressions(left);
                const rightExpr = generateExpressions(right);

                for (let le of [leftExpr]) {
                    for (let re of [rightExpr]) {
                        for (let op of operators) {
                            let expr = `(${le}${op}${re})`;

                            if (!seen.has(expr)) {
                                seen.add(expr);
                                if (evaluateExpression(expr) === target) return expr;
                            }
                        }
                    }
                }
            }
            return null;
        }

        return generateExpressions(numbers) || "No solution found";
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
        return handleAsyncGenerator(function* () {
            event.preventDefault();
            const submitButton = document.getElementById("submit-button");
            const solutionOutput = document.getElementById("solution-output");

            submitButton.innerHTML = "Calculating...";
            solutionOutput.classList.remove("hidden");

            const numbers = document.getElementById("numbers-input").value.split(",").map(Number);
            const target = Number(document.getElementById("target-input").value);

            const result = yield new Promise(resolve => setTimeout(() => resolve(findExpressionOptimized(numbers, target)), 10));

            solutionOutput.innerHTML = result;
            submitButton.innerHTML = "Find expression";
        }());
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
