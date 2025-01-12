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

    infoButton.addEventListener("click", function() {
        calculatorDescription.classList.remove("hidden");
        // Use setTimeout to ensure the transition works
        setTimeout(() => {
            calculatorDescription.classList.remove("translate-y-full", "opacity-0");
        }, 10);

        // Auto-hide after 5 seconds
        clearTimeout(descriptionTimeout);
        descriptionTimeout = setTimeout(() => {
            calculatorDescription.classList.add("translate-y-full", "opacity-0");
            setTimeout(() => {
                calculatorDescription.classList.add("hidden");
            }, 300); // Match the transition duration
        }, 5000);
    });

    /**
     * Generates all possible expressions using parentheses and operators
     * @param {string[]} tokens - Array of numbers and operators
     * @param {number} start - Start index
     * @param {number} end - End index
     * @returns {string[]} Array of possible expressions
     */
    function generateExpressions(tokens, start = 0, end = tokens.length) {
        if (1 === end - start) {
            return [tokens[start]];
        }
        let expressions = [];
        for (let i = start + 1; i < end; i += 2) {
            let leftExpressions = generateExpressions(tokens, start, i);
            let rightExpressions = generateExpressions(tokens, i + 1, end);
            leftExpressions.forEach(left => {
                rightExpressions.forEach(right => {
                    expressions.push(`(${left}${tokens[i]}${right})`);
                });
            });
        }
        return expressions;
    }

    /**
     * Evaluates an expression and checks if it equals the target
     * @param {string} expression - The arithmetic expression to evaluate
     * @param {number} target - The target number
     * @returns {boolean} Whether the expression equals the target
     */
    function evaluateExpression(expression, target) {
        try {
            return eval(expression) === target;
        } catch (error) {
            if (error instanceof SyntaxError || error instanceof ReferenceError || error instanceof EvalError) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Generates all possible expressions using the input numbers and operators
     * @param {number[]} numbers - Array of input numbers
     * @param {string[]} operators - Array of operators
     * @yields {string} A possible expression
     */
    function* generateAllExpressions(numbers, operators) {
        if (1 === numbers.length) {
            yield numbers[0].toString();
        } else {
            for (let numberPermutation of generateNumberPermutations(numbers)) {
                for (let operatorCombination of generateOperatorCombinations(operators, numbers.length - 1)) {
                    let tokens = [];
                    for (let i = 0; i < numberPermutation.length; i++) {
                        if (i > 0) tokens.push(operatorCombination[i - 1]);
                        tokens.push(numberPermutation[i].toString());
                    }
                    for (let expression of generateExpressions(tokens)) {
                        yield expression;
                    }
                }
            }
        }
    }

    /**
     * Generates all possible permutations of numbers
     * @param {number[]} numbers - Array of numbers
     * @yields {number[]} A permutation of numbers
     */
    function* generateNumberPermutations(numbers) {
        if (0 === numbers.length) {
            yield [];
        } else {
            for (let i = 0; i < numbers.length; i++) {
                for (let permutation of generateNumberPermutations(numbers.slice(0, i).concat(numbers.slice(i + 1)))) {
                    yield [numbers[i], ...permutation];
                }
            }
        }
    }

    /**
     * Generates all possible combinations of operators
     * @param {string[]} operators - Array of operators
     * @param {number} count - Number of operators needed
     * @yields {string[]} A combination of operators
     */
    function* generateOperatorCombinations(operators, count) {
        if (0 === count) {
            yield [];
        } else {
            for (let operator of operators) {
                for (let combination of generateOperatorCombinations(operators, count - 1)) {
                    yield [operator, ...combination];
                }
            }
        }
    }

    /**
     * Finds an expression that evaluates to the target number
     * @param {number[]} numbers - Array of input numbers
     * @param {number} target - Target number
     * @returns {Promise<string>} The found expression or "No solution found"
     */
    function findExpression(numbers, target) {
        return new Promise(resolve => {
            setTimeout(() => {
                const operators = ["+", "-", "*", "/"];
                if (document.getElementById("exponents-checkbox").checked) {
                    operators.push("**");
                }
                
                for (let expression of generateAllExpressions(numbers, operators)) {
                    if (evaluateExpression(expression, target)) {
                        resolve(expression);
                        return;
                    }
                }
                resolve("No solution found");
            }, 800);
        });
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
            solutionOutput.classList.remove("hidden"); // Show the solution element
            
            const numbers = document.getElementById("numbers-input").value.split(",").map(Number);
            const target = Number(document.getElementById("target-input").value);
            const result = yield findExpression(numbers, target);
            
            solutionOutput.innerHTML = result;
            solutionOutput.classList.remove("hidden"); // Ensure it's visible
            submitButton.innerHTML = "Find expression";
        }());
    });
});

// Event handlers for advanced settings
document.addEventListener("DOMContentLoaded", function () {
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
