document.addEventListener("DOMContentLoaded", function () {
    const infoButton = document.getElementById("info-toggle");
    const calculatorDescription = document.getElementById("calculator-description");
    
    // Info Button Toggle with CSS Transitions
    infoButton.addEventListener("click", function () {
        calculatorDescription.classList.toggle("hidden");

        if (!calculatorDescription.classList.contains("hidden")) {
            setTimeout(() => calculatorDescription.classList.add("hidden"), 5000);
        }
    });

    function evaluate(expression) {
        if (!/^[\d+\-*/() **]+$/.test(expression)) return null; // Prevents invalid characters

        const tokens = expression.match(/(\d+|\+|\-|\*{1,2}|\/|\(|\))/g);
        if (!tokens) return null;

        function validateSyntax(tokens) {
            let openParens = 0, prevToken = null;

            for (const token of tokens) {
                if (token === "(") openParens++;
                if (token === ")") openParens--;
                if (openParens < 0) return false; // Mismatched closing parenthesis

                if (prevToken && /[\+\-*/]/.test(prevToken) && /[\+\-*/]/.test(token)) {
                    return false; // Consecutive operators like "2++3"
                }

                prevToken = token;
            }
            return openParens === 0; // Ensure parentheses are balanced
        }

        if (!validateSyntax(tokens)) return null; // Reject malformed expressions

        function parseExpression(tokens) {
            let index = 0;

            function parsePrimary() {
                if (tokens[index] === "(") {
                    index++;
                    let value = parseAdditionSubtraction();
                    if (tokens[index] !== ")") throw new Error("Mismatched parentheses");
                    index++;
                    return value;
                }
                return parseFloat(tokens[index++]);
            }

            function parseExponentiation() {
                let left = parsePrimary();
                while (tokens[index] === "**") {
                    index++;
                    let right = parsePrimary();
                    left = Math.pow(left, right);
                }
                return left;
            }

            function parseMultiplicationDivision() {
                let left = parseExponentiation();
                while (tokens[index] === "*" || tokens[index] === "/") {
                    let operator = tokens[index++];
                    let right = parseExponentiation();
                    if (operator === "/") {
                        if (right === 0) return null; // Prevent division by zero
                        left /= right;
                    } else {
                        left *= right;
                    }
                }
                return left;
            }

            function parseAdditionSubtraction() {
                let left = parseMultiplicationDivision();
                while (tokens[index] === "+" || tokens[index] === "-") {
                    let operator = tokens[index++];
                    let right = parseMultiplicationDivision();
                    left = operator === "+" ? left + right : left - right;
                }
                return left;
            }

            return parseAdditionSubtraction();
        }

        try {
            return parseExpression(tokens);
        } catch {
            return null;
        }
    }

    function findExpressionOptimized(numbers, target) {
        const operators = ["+", "-", "*", "/"];
        if (document.getElementById("exponents-checkbox").checked) {
            operators.push("**");
        }

        const memo = new Map(); // Cache for subexpression results
        const seen = new Set(); // Prevent duplicate expressions

        function generateExpressions(nums) {
            const key = nums.join(",");
            if (memo.has(key)) return memo.get(key);

            if (nums.length === 1) {
                return [nums[0].toString()];
            }

            let expressions = [];

            for (let i = 1; i < nums.length; i++) {
                const leftNums = nums.slice(0, i);
                const rightNums = nums.slice(i);

                const leftExprs = generateExpressions(leftNums);
                const rightExprs = generateExpressions(rightNums);

                for (let le of leftExprs) {
                    for (let re of rightExprs) {
                        for (let op of operators) {
                            let expr = `(${le}${op}${re})`;

                            if (!seen.has(expr)) {
                                seen.add(expr);
                                expressions.push(expr);

                                const result = evaluate(expr);
                                if (result === target) {
                                    memo.set(key, expr);
                                    return expr; // Return immediately if a valid expression is found
                                }
                            }
                        }
                    }
                }
            }

            memo.set(key, expressions);
            return expressions;
        }

        return generateExpressions(numbers) || "No solution found";
    }

    // Random Number Generation
    document.getElementById("random-numbers-button").addEventListener("click", function (event) {
        event.preventDefault();
        const count = Number(document.getElementById("num-integers-input").value) || 6;
        const maxValue = Number(document.getElementById("max-number-input").value) || 60;
        const randomNumbers = Array.from({ length: count }, () => Math.floor(Math.random() * maxValue) + 1);
        document.getElementById("numbers-input").value = randomNumbers.join(",");
    });

    // Form Submission Handling
    document.getElementById("expression-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        const submitButton = document.getElementById("submit-button");
        const solutionOutput = document.getElementById("solution-output");

        submitButton.innerHTML = "Calculating...";
        solutionOutput.classList.remove("hidden");

        const numbers = document.getElementById("numbers-input").value.split(",").map(Number);
        const target = Number(document.getElementById("target-input").value);

        const result = await new Promise(resolve => setTimeout(() => resolve(findExpressionOptimized(numbers, target)), 10));

        solutionOutput.innerHTML = result;
        submitButton.innerHTML = "Find Expression";
    });

    // Advanced Settings Toggle
    const advancedSettings = document.getElementById("advanced-settings");
    const advancedSettingsToggle = document.getElementById("advanced-settings-toggle");

    advancedSettingsToggle.addEventListener("click", function () {
        advancedSettings.style.display = advancedSettings.style.display === "none" ? "block" : "none";
    });

    advancedSettings.querySelectorAll('input[type="number"]').forEach(function (input) {
        input.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    });
});
