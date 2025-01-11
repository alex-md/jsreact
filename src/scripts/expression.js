document.addEventListener("DOMContentLoaded", function() {
    const numbersInput = document.getElementById("numbers-input");
    const targetInput = document.getElementById("target-input");
    const submitButton = document.getElementById("submit-button");
    const solutionOutput = document.getElementById("solution-output");
    const randomButton = document.getElementById("random-numbers-button");
    const exponentsCheckbox = document.getElementById("exponents-checkbox");
    const advancedSettingsToggle = document.getElementById("advanced-settings-toggle");
    const advancedSettings = document.getElementById("advanced-settings");

    // Show solution with proper styling
    function showSolution(text) {
        solutionOutput.textContent = text;
        solutionOutput.classList.remove('hidden');
        solutionOutput.classList.add('font-mono');
    }

    // Generate all possible expressions using the given numbers and operators
    function generateExpressions(numbers, operators) {
        // Generate all possible permutations of numbers
        function* permute(arr) {
            if (arr.length <= 1) yield arr;
            else {
                for (let i = 0; i < arr.length; i++) {
                    const current = arr[i];
                    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
                    for (const p of permute(remaining)) {
                        yield [current, ...p];
                    }
                }
            }
        }

        // Generate all possible combinations of operators
        function* generateOperatorCombinations(operators, length) {
            if (length === 0) yield [];
            else {
                for (const op of operators) {
                    for (const rest of generateOperatorCombinations(operators, length - 1)) {
                        yield [op, ...rest];
                    }
                }
            }
        }

        // Build and evaluate expressions
        function* buildExpressions(numbers) {
            if (numbers.length === 1) {
                yield numbers[0].toString();
                return;
            }

            for (const nums of permute(numbers)) {
                for (const ops of generateOperatorCombinations(operators, numbers.length - 1)) {
                    let expr = nums[0].toString();
                    for (let i = 0; i < ops.length; i++) {
                        expr = `(${expr}${ops[i]}${nums[i + 1]})`;
                    }
                    yield expr;
                }
            }
        }

        return buildExpressions(numbers);
    }

    // Safely evaluate an expression
    function evaluateExpression(expr, target) {
        try {
            // Use Function instead of eval for better security
            const result = new Function('return ' + expr)();
            return Number.isFinite(result) && result === target;
        } catch (e) {
            return false;
        }
    }

    // Find a solution
    async function findSolution(numbers, target) {
        const operators = ['+', '-', '*', '/'];
        if (exponentsCheckbox.checked) {
            operators.push('**');
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Calculating...';
        solutionOutput.textContent = 'Searching for solution...';

        try {
            // Use setTimeout to allow UI to update
            await new Promise(resolve => setTimeout(resolve, 0));

            for (const expr of generateExpressions(numbers, operators)) {
                if (evaluateExpression(expr, target)) {
                    return expr;
                }
            }
            return 'No solution found';
        } catch (error) {
            console.error('Error finding solution:', error);
            return 'An error occurred while finding a solution';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Find expression';
        }
    }

    // Generate random numbers
    function generateRandomNumbers() {
        const count = parseInt(document.getElementById("num-integers-input").value) || 6;
        const max = parseInt(document.getElementById("max-number-input").value) || 60;
        
        const numbers = Array.from(
            { length: Math.min(Math.max(count, 1), 10) },
            () => Math.floor(Math.random() * Math.min(max, 100)) + 1
        );
        
        numbersInput.value = numbers.join(", ");
    }

    // Event Listeners
    submitButton.addEventListener("click", async function(e) {
        e.preventDefault();
        
        const numbers = numbersInput.value
            .split(/[,\s]+/)
            .map(n => parseInt(n.trim()))
            .filter(n => !isNaN(n));
            
        const target = parseInt(targetInput.value);

        if (numbers.length < 1) {
            showSolution('Please enter valid numbers');
            return;
        }

        if (isNaN(target)) {
            showSolution('Please enter a valid target number');
            return;
        }

        const solution = await findSolution(numbers, target);
        showSolution(solution);
    });

    randomButton.addEventListener("click", function(e) {
        e.preventDefault();
        generateRandomNumbers();
    });

    // Toggle advanced settings
    advancedSettingsToggle.addEventListener("click", function() {
        advancedSettings.classList.toggle("hidden");
    });

    // Initialize with random numbers
    generateRandomNumbers();
});
