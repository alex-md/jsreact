document.addEventListener("DOMContentLoaded", function () {
    // Add event listener for random number generator button
    document.getElementById("random-numbers-button").addEventListener("click", function (event) {
        event.preventDefault(); // Prevent form submission

        // Get the number of integers to generate from the input field
        let numIntegers = document.getElementById("num-integers-input").value || 6;

        // Get the maximum possible number from the input field
        let maxNumber = document.getElementById("max-number-input").value || 40;

        // Generate random numbers between 1 and the maximum number
        let randomNumbers = Array.from({ length: numIntegers }, () => Math.floor(Math.random() * maxNumber) + 1);

        // Set the value of the numbers input field
        document.getElementById("numbers-input").value = randomNumbers.join(",");
    });
  
    // Define a function to insert parentheses around parts of the expression
    function insertParentheses (expressionParts) {
      if (expressionParts.length === 1) {
        return [expressionParts[0]];
      }
  
      let parenthesizedExpressions = [];
      for (let i = 1; i < expressionParts.length; i += 2) {
        // Only insert parentheses around operators
        let leftParts = insertParentheses(expressionParts.slice(0, i));
        let rightParts = insertParentheses(expressionParts.slice(i + 1));
  
        leftParts.forEach((left) => {
          rightParts.forEach((right) => {
            // Combine left and right parts with the operator in the middle
            parenthesizedExpressions.push(`(${left}${expressionParts[i]}${right})`);
          });
        });
      }
      return parenthesizedExpressions;
    }
  
    // Define a function to calculate the result of an expression and check against the target
    function calculateAndCompare (expression, target) {
      try {
        return Math.abs(eval(expression) - target) < 1e-6; // Using a tolerance for floating point comparison
      } catch (e) {
        if (
          e instanceof SyntaxError ||
          e instanceof ReferenceError ||
          e instanceof EvalError
        ) {
          return false; // Handle possible eval errors, such as ZeroDivision
        }
        throw e; // Re-throw the error if it's not one we expect
      }
    }
  
    // Define the main function to find the expression that matches the target value
    function findExpression(numbers, target) {
      const operations = ["+", "-", "*", "/", "**"]; // Removed '^'
      for (let expression of generateAllExpressions(numbers, operations)) {
        if (calculateAndCompare(expression, target)) {
          return expression;
        }
      }
      return "No solution found";
    }
  
    // Define a function to generate all possible expressions from a list of numbers
    function* generateAllExpressions (numbers, operations) {
      if (numbers.length === 1) {
        yield numbers[0].toString();
        return;
      }
  
      for (let nums of permutations(numbers)) {
        for (let ops of product(operations, numbers.length - 1)) {
          // Interleave numbers and operators
          let expressionParts = [nums[0].toString()];
          for (let i = 1; i < nums.length; i++) {
            expressionParts.push(ops[i - 1]);
            expressionParts.push(nums[i].toString());
          }
          // Insert parentheses in all possible ways and generate expressions
          for (let expr of insertParentheses(expressionParts)) {
            yield expr;
          }
        }
      }
    }
  
    // Helper function to get permutations of an array
    function* permutations (array) {
      if (array.length === 0) {
        yield [];
        return;
      }
      for (let i = 0; i < array.length; i++) {
        let rest = array.slice(0, i).concat(array.slice(i + 1));
        for (let perm of permutations(rest)) {
          yield [array[i], ...perm];
        }
      }
    }
  
    // Helper function to get the cartesian product
    function* product (arr, size) {
      if (size === 0) {
        yield [];
        return;
      }
      for (let head of arr) {
        for (let tail of product(arr, size - 1)) {
          yield [head, ...tail];
        }
      }
    }
  
    // Assuming findExpression is a function that takes some time to execute
    function findExpressionAsync(numbers, target) {
      return new Promise((resolve) => {
        // Simulate a delay with setTimeout
        setTimeout(() => {
          let result = findExpression(numbers, target);
          resolve(result);
        }, 800); 
      });
    }

    // Event listener for button click
    document.getElementById("submit-button").addEventListener("click", async function (event) {
      event.preventDefault();
      // Get the submit button and change its text to "Calculating..."
      let submitButton = document.getElementById("submit-button");
      submitButton.innerHTML = "Calculating...";

      // Get input values from form
      let numbersInput = document.getElementById("numbers-input").value;
      let targetInput = document.getElementById("target-input").value;

      // Parse the input values
      let numbers = numbersInput.split(",").map(Number);
      let target = Number(targetInput);

      // Find the solution
      let solutionExpression = await findExpressionAsync(numbers, target);

      // Display the solution in the 'solution-output' element
      let solutionOutput = document.getElementById("solution-output");

      // Set the solution expression as the HTML content of the solution output element
      solutionOutput.innerHTML = solutionExpression;

      // Change the button text back to "Find expression"
      submitButton.innerHTML = "Find expression";
    });
});
document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('.text-end');
  const advancedSettings = document.querySelector('#advancedSettings');

  button.addEventListener('click', () => {
    advancedSettings.style.display = (advancedSettings.style.display === 'none') ? 'block' : 'none';
  });
}); 
