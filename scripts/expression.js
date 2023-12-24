document.addEventListener("DOMContentLoaded", function () {
    function insertParentheses (tokens, start = 0, end = tokens.length) {
        if (end - start == 1) return [tokens[start]];
        let result = [];
        for (let index = start + 1; index < end; index += 2) {
            let left = insertParentheses(tokens, start, index), right = insertParentheses(tokens, index + 1, end);
            left.forEach((start) => {
                right.forEach((end) => {
                    result.push(`(${start}${tokens[index]}${end})`);
                });
            });
        }
        return result;
    }
    function calculateAndCompare (expression, target) {
        try {
            return eval(expression) === target;
        } catch (e) {
            if (e instanceof SyntaxError || e instanceof ReferenceError || e instanceof EvalError) return false;
            throw e;
        }
    }
    function findExpression (tokens, target) {
        let operators = [
            "+",
            "-",
            "*",
            "/"
        ];
        // Check if the checkbox is checked
        if (document.getElementById("exponents-checkbox").checked) {
            operators.push("**");
        }
        for (let expression of generateAllExpressions(tokens, operators)) if (calculateAndCompare(expression, target)) return expression;
        return "No solution found";
    }
    function* generateAllExpressions (tokens, operators) {
        if (1 === tokens.length) {
            yield tokens[0].toString();
            return;
        }
        for (let permutation of permutations(tokens)) for (let combination of product(operators, tokens.length - 1)) {
            let expression = [];
            for (let index = 0; index < permutation.length; index++) index > 0 && expression.push(combination[index - 1]), expression.push(permutation[index].toString());
            for (let parenthesized of insertParentheses(expression)) yield parenthesized;
        }
    }
    function* permutations (tokens) {
        if (0 === tokens.length) {
            yield [];
            return;
        }
        for (let index = 0; index < tokens.length; index++) for (let permutation of permutations(tokens.slice(0, index).concat(tokens.slice(index + 1)))) yield [
            tokens[index],
            ...permutation
        ];
    }
    function* product (tokens, length) {
        if (0 === length) {
            yield [];
            return;
        }
        for (let token of tokens) for (let combination of product(tokens, length - 1)) yield [
            token,
            ...combination
        ];
    }
    function findExpressionAsync (tokens, target) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(findExpression(tokens, target));
            }, 800);
        });
    }
    document.getElementById("random-numbers-button").addEventListener("click", function (event) {
        event.preventDefault();
        let numIntegers = document.getElementById("num-integers-input").value || 6, maxNumber = document.getElementById("max-number-input").value || 60, randomNumbers = Array.from({
            length: numIntegers
        }, () => Math.floor(Math.random() * maxNumber) + 1);
        document.getElementById("numbers-input").value = randomNumbers.join(",");
    }), document.getElementById("submit-button").addEventListener("click", async function (event) {
        event.preventDefault();
        let submitButton = document.getElementById("submit-button");
        submitButton.innerHTML = "Calculating...";
        let numbersInput = document.getElementById("numbers-input").value, targetInput = document.getElementById("target-input").value, numbers = numbersInput.split(",").map(Number), target = Number(targetInput), solution = await findExpressionAsync(numbers, target);
        document.getElementById("solution-output").innerHTML = solution, submitButton.innerHTML = "Find expression";
    });
}), document.addEventListener("DOMContentLoaded", function () {
    document.querySelector(".text-end");
    let advancedSettings = document.querySelector("#advancedSettings");
    document.querySelector(".text-end a").addEventListener("click", function () {
        "none" === advancedSettings.style.display ? advancedSettings.style.display = "block" : advancedSettings.style.display = "none";
    }), advancedSettings.querySelectorAll('input[type="number"]').forEach(function (input) {
        input.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    });
});
