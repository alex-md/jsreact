import '@styles/global.css';
import { showToast } from '@/components/toast.js';
document.addEventListener("DOMContentLoaded", ()=>{
    let descriptionTimeout, infoButton = document.getElementById("info-toggle"), calculatorDescription = document.getElementById("calculator-description");
    infoButton.addEventListener("click", ()=>{
        calculatorDescription.classList.remove("hidden", "translate-y-full", "opacity-0"), clearTimeout(descriptionTimeout), descriptionTimeout = setTimeout(()=>{
            calculatorDescription.classList.add("hiding"), setTimeout(()=>{
                calculatorDescription.classList.remove("hiding"), calculatorDescription.classList.add("hidden");
            }, 300);
        }, 5000);
    }), document.getElementById("random-numbers-button").addEventListener("click", (event)=>{
        event.preventDefault();
        let count = document.getElementById("num-integers-input").value || 6, maxValue = document.getElementById("max-number-input").value || 90, randomNumbers = Array.from({
            length: parseInt(count)
        }, ()=>Math.floor(Math.random() * parseInt(maxValue)) + 1);
        document.getElementById("numbers-input").value = randomNumbers.join(","), showToast('Random numbers generated');
    }), document.getElementById("submit-button").addEventListener("click", (event)=>{
        event.preventDefault();
        let submitButton = document.getElementById("submit-button"), solutionOutput = document.getElementById("solution-output"), originalButtonText = submitButton.innerHTML, loadingSpinner = document.createElement('span');
        loadingSpinner.className = 'loading-spinner', submitButton.innerHTML = 'Calculating', submitButton.appendChild(loadingSpinner), submitButton.disabled = !0, solutionOutput.classList.remove("hidden");
        let numbers = document.getElementById("numbers-input").value.split(",").map((num)=>parseInt(num.trim())), target = parseInt(document.getElementById("target-input").value);
        if (!numbers.every((n)=>!isNaN(n)) || isNaN(target)) {
            showToast('Please enter valid numbers'), submitButton.innerHTML = originalButtonText, submitButton.disabled = !1;
            return;
        }
        setTimeout(()=>{
            let result = function(numbers, target) {
                let useExponents = document.getElementById("exponents-checkbox").checked, useSqrt = document.getElementById("sqrt-checkbox").checked, noParentheses = document.getElementById("no-parentheses-checkbox").checked, startTime = Date.now(), isTimedOut = ()=>Date.now() - startTime > 4000;
                class Item {
                    constructor(val, expr = null, prec = 4){
                        this.val = val, this.expr = null === expr ? val.toString() : expr, this.prec = prec;
                    }
                }
                let initialItems = numbers.map((n)=>new Item(n)), visited = new Set(), solution = null;
                if (!function solve(items) {
                    if (solution || isTimedOut()) return;
                    for (let item of items)if (1e-6 > Math.abs(item.val - target)) {
                        solution = item.expr;
                        return;
                    }
                    let stateKey = items.map((i)=>i.val).sort((a, b)=>a - b).join('|');
                    if (!visited.has(stateKey)) {
                        if (visited.add(stateKey), useSqrt) for(let i = 0; i < items.length; i++){
                            let x = items[i];
                            if (x.val > 1) {
                                let root = Math.sqrt(x.val);
                                if (Number.isInteger(root)) {
                                    let newItem = new Item(root, `sqrt(${x.expr})`, 4), nextItems = [
                                        ...items
                                    ];
                                    if (nextItems[i] = newItem, solve(nextItems), solution) return;
                                }
                            }
                        }
                        for(let i = 0; i < items.length; i++)for(let j = 0; j < items.length; j++){
                            if (i === j) continue;
                            let a = items[i], b = items[j], remaining = items.filter((_, idx)=>idx !== i && idx !== j);
                            if (i < j) {
                                let val = a.val + b.val, expr = `${a.expr} + ${b.expr}`;
                                if (remaining.push(new Item(val, expr, 1)), solve(remaining), remaining.pop(), solution) return;
                            }
                            if (i < j && 1 !== a.val && 1 !== b.val) {
                                if (noParentheses) if (a.prec < 2 || b.prec < 2) ;
                                else {
                                    let val = a.val * b.val;
                                    remaining.push(new Item(val, `${a.expr} * ${b.expr}`, 2)), solve(remaining), remaining.pop();
                                }
                                else {
                                    let val = a.val * b.val, strA = a.prec < 2 ? `(${a.expr})` : a.expr, strB = b.prec < 2 ? `(${b.expr})` : b.expr;
                                    remaining.push(new Item(val, `${strA} * ${strB}`, 2)), solve(remaining), remaining.pop();
                                }
                                if (solution) return;
                            }
                            if (0 !== b.val) {
                                if (noParentheses) if (1 === b.prec) ;
                                else {
                                    let val = a.val - b.val;
                                    remaining.push(new Item(val, `${a.expr} - ${b.expr}`, 1)), solve(remaining), remaining.pop();
                                }
                                else {
                                    let val = a.val - b.val, strB = 1 === b.prec ? `(${b.expr})` : b.expr;
                                    remaining.push(new Item(val, `${a.expr} - ${strB}`, 1)), solve(remaining), remaining.pop();
                                }
                                if (solution) return;
                            }
                            if (0 !== b.val && 1 !== b.val) {
                                let val = a.val / b.val;
                                if (Number.isInteger(val)) {
                                    if (noParentheses) a.prec < 2 || b.prec < 3 || (remaining.push(new Item(val, `${a.expr} / ${b.expr}`, 2)), solve(remaining), remaining.pop());
                                    else {
                                        let strA = a.prec < 2 ? `(${a.expr})` : a.expr, strB = b.prec < 3 ? `(${b.expr})` : b.expr;
                                        remaining.push(new Item(val, `${strA} / ${strB}`, 2)), solve(remaining), remaining.pop();
                                    }
                                    if (solution) return;
                                }
                            }
                            if (useExponents) {
                                let limit = Math.max(100 * target, 500000);
                                if (a.val > 1 && b.val > 1 && b.val < 20) {
                                    let val = Math.pow(a.val, b.val);
                                    if (val < limit && Number.isInteger(val)) {
                                        if (noParentheses) a.prec < 3 || b.prec < 3 || (remaining.push(new Item(val, `${a.expr} ** ${b.expr}`, 3)), solve(remaining), remaining.pop());
                                        else {
                                            let strA = a.prec < 3 ? `(${a.expr})` : a.expr, strB = b.prec < 3 ? `(${b.expr})` : b.expr;
                                            remaining.push(new Item(val, `${strA} ** ${strB}`, 3)), solve(remaining), remaining.pop();
                                        }
                                        if (solution) return;
                                    }
                                }
                            }
                        }
                    }
                }(initialItems), solution) {
                    if (solution.startsWith('(') && solution.endsWith(')')) {
                        let balance = 0, clean = !0;
                        for(let k = 1; k < solution.length - 1; k++)if ('(' === solution[k] && balance++, ')' === solution[k] && balance--, balance < 0) {
                            clean = !1;
                            break;
                        }
                        clean && (solution = solution.substring(1, solution.length - 1));
                    }
                    return solution;
                }
                return isTimedOut() ? "Computation timed out - try with fewer numbers" : "No solution found";
            }(numbers, target);
            if ("No solution found" !== result && "Computation timed out - try with fewer numbers" !== result) {
                let latexExpression = `${function(expr) {
                    try {
                        if ('undefined' != typeof math) return math.parse(expr).toTex({
                            parenthesis: 'keep'
                        });
                        throw Error("Math.js not found");
                    } catch (e) {
                        return expr.replace(/\*/g, ' \\times ').replace(/\//g, ' \\div ').replace(/\*\*/g, '^');
                    }
                }(result)} = ${target}`;
                try {
                    solutionOutput.innerHTML = '';
                    let katexDiv = document.createElement('div');
                    katexDiv.className = 'katex-display', solutionOutput.appendChild(katexDiv), solutionOutput.style.fontSize = "1.2em", solutionOutput.style.padding = "1.5rem", solutionOutput.style.overflowX = "auto", solutionOutput.style.overflowY = "hidden", 'undefined' != typeof katex ? katex.render(latexExpression, katexDiv, {
                        displayMode: !0,
                        throwOnError: !1,
                        trust: !0
                    }) : katexDiv.textContent = `${result} = ${target}`;
                    let copyButton = document.createElement('button');
                    copyButton.className = 'px-3 py-1 mt-4 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300', copyButton.textContent = 'Copy Expression', copyButton.addEventListener('click', ()=>{
                        let copyText = `${result} `;
                        navigator.clipboard.writeText(copyText).then(()=>{
                            showToast('Expression copied!'), copyButton.textContent = 'Copied!', setTimeout(()=>{
                                copyButton.textContent = 'Copy Expression';
                            }, 2000);
                        }).catch((err)=>console.error('Failed to copy:', err));
                    }), solutionOutput.appendChild(copyButton);
                } catch (e) {
                    console.error('KaTeX error:', e), solutionOutput.textContent = result;
                }
            } else solutionOutput.textContent = result;
            submitButton.innerHTML = originalButtonText, submitButton.disabled = !1, showToast("No solution found" === result ? 'No solution found' : 'Solution found!');
        }, 20);
    });
    let advancedSettings = document.querySelector("#advanced-settings"), advancedSettingsToggle = document.querySelector("#advanced-settings-toggle");
    if (advancedSettingsToggle && advancedSettings && (advancedSettingsToggle.addEventListener("click", ()=>{
        advancedSettings.classList.toggle("hidden");
    }), advancedSettings.querySelectorAll('input[type="number"]').forEach((input)=>{
        input.addEventListener("click", (event)=>event.stopPropagation());
    })), !document.getElementById("sqrt-checkbox")) {
        let exponentsCheckbox = document.getElementById("exponents-checkbox");
        if (exponentsCheckbox && exponentsCheckbox.parentNode) {
            let sqrtCheckboxContainer = document.createElement("div");
            sqrtCheckboxContainer.className = "form-control", sqrtCheckboxContainer.innerHTML = `
                <label class="flex items-center space-x-2">
                    <input type="checkbox" id="sqrt-checkbox" class="toggle toggle-sm">
                    <span>Allow Square Roots</span>
                </label>
            `, exponentsCheckbox.closest('.form-control') ? exponentsCheckbox.closest('.form-control').parentNode.appendChild(sqrtCheckboxContainer) : exponentsCheckbox.parentNode.parentNode.appendChild(sqrtCheckboxContainer);
        }
    }
});
