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
                    constructor(val, expr = null, prec = 4, steps = []){
                        this.val = val, this.expr = null === expr ? val.toString() : expr, this.prec = prec, this.steps = steps;
                    }
                }
                let initialItems = numbers.map((n)=>new Item(n)), visited = new Set(), solution = null;
                if (!function solve(items) {
                    if (solution || isTimedOut()) return;
                    if (1 === items.length && 1e-6 > Math.abs(items[0].val - target)) {
                        solution = items[0];
                        return;
                    }
                    let stateKey = items.map((i)=>i.val).sort((a, b)=>a - b).join('|');
                    if (!visited.has(stateKey)) {
                        if (visited.add(stateKey), useSqrt) for(let i = 0; i < items.length; i++){
                            let x = items[i];
                            if (x.val > 1) {
                                let root = Math.sqrt(x.val);
                                if (Number.isInteger(root)) {
                                    let newSteps = [
                                        ...x.steps,
                                        `sqrt(${x.val}) = ${root}`
                                    ], newItem = new Item(root, `sqrt(${x.expr})`, 4, newSteps), nextItems = [
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
                                let val = a.val + b.val, expr = noParentheses ? `${a.expr} + ${b.expr}` : `(${a.expr} + ${b.expr})`, newSteps = [
                                    ...a.steps,
                                    ...b.steps,
                                    `${a.val} + ${b.val} = ${val}`
                                ];
                                if (remaining.push(new Item(val, expr, 1, newSteps)), solve(remaining), remaining.pop(), solution) return;
                            }
                            if (i < j) {
                                if (noParentheses) if (a.prec < 2 || b.prec < 2) ;
                                else {
                                    let val = a.val * b.val, newSteps = [
                                        ...a.steps,
                                        ...b.steps,
                                        `${a.val} * ${b.val} = ${val}`
                                    ];
                                    remaining.push(new Item(val, `${a.expr} * ${b.expr}`, 2, newSteps)), solve(remaining), remaining.pop();
                                }
                                else {
                                    let val = a.val * b.val, strA = a.prec < 2 ? `(${a.expr})` : a.expr, strB = b.prec < 2 ? `(${b.expr})` : b.expr, newSteps = [
                                        ...a.steps,
                                        ...b.steps,
                                        `${a.val} * ${b.val} = ${val}`
                                    ];
                                    remaining.push(new Item(val, `${strA} * ${strB}`, 2, newSteps)), solve(remaining), remaining.pop();
                                }
                                if (solution) return;
                            }
                            if (noParentheses) if (1 === b.prec) ;
                            else {
                                let val = a.val - b.val, newSteps = [
                                    ...a.steps,
                                    ...b.steps,
                                    `${a.val} - ${b.val} = ${val}`
                                ];
                                remaining.push(new Item(val, `${a.expr} - ${b.expr}`, 1, newSteps)), solve(remaining), remaining.pop();
                            }
                            else {
                                let val = a.val - b.val, strB = 1 === b.prec ? `(${b.expr})` : b.expr, newSteps = [
                                    ...a.steps,
                                    ...b.steps,
                                    `${a.val} - ${b.val} = ${val}`
                                ];
                                remaining.push(new Item(val, `${a.expr} - ${strB}`, 1, newSteps)), solve(remaining), remaining.pop();
                            }
                            if (solution) return;
                            if (0 !== b.val) {
                                let val = a.val / b.val;
                                if (Number.isInteger(val)) {
                                    if (noParentheses) if (a.prec < 2 || b.prec < 3) ;
                                    else {
                                        let newSteps = [
                                            ...a.steps,
                                            ...b.steps,
                                            `${a.val} / ${b.val} = ${val}`
                                        ];
                                        remaining.push(new Item(val, `${a.expr} / ${b.expr}`, 2, newSteps)), solve(remaining), remaining.pop();
                                    }
                                    else {
                                        let strA = a.prec < 2 ? `(${a.expr})` : a.expr, strB = b.prec < 3 ? `(${b.expr})` : b.expr, newSteps = [
                                            ...a.steps,
                                            ...b.steps,
                                            `${a.val} / ${b.val} = ${val}`
                                        ];
                                        remaining.push(new Item(val, `${strA} / ${strB}`, 2, newSteps)), solve(remaining), remaining.pop();
                                    }
                                    if (solution) return;
                                }
                            }
                            if (useExponents) {
                                let limit = Math.max(100 * target, 500000);
                                if (a.val <= 1 || b.val < 20) {
                                    let val = Math.pow(a.val, b.val);
                                    if (val < limit && Number.isInteger(val)) {
                                        if (noParentheses) if (a.prec < 3 || b.prec < 3) ;
                                        else {
                                            let newSteps = [
                                                ...a.steps,
                                                ...b.steps,
                                                `${a.val} ^ ${b.val} = ${val}`
                                            ];
                                            remaining.push(new Item(val, `${a.expr} ** ${b.expr}`, 3, newSteps)), solve(remaining), remaining.pop();
                                        }
                                        else {
                                            let strA = a.prec < 3 ? `(${a.expr})` : a.expr, strB = b.prec < 3 ? `(${b.expr})` : b.expr, newSteps = [
                                                ...a.steps,
                                                ...b.steps,
                                                `${a.val} ^ ${b.val} = ${val}`
                                            ];
                                            remaining.push(new Item(val, `${strA} ** ${strB}`, 3, newSteps)), solve(remaining), remaining.pop();
                                        }
                                        if (solution) return;
                                    }
                                }
                            }
                        }
                    }
                }(initialItems), solution) {
                    let finalExpr = solution.expr;
                    if (!noParentheses && finalExpr.startsWith('(') && finalExpr.endsWith(')')) {
                        let balance = 0, clean = !0;
                        for(let k = 1; k < finalExpr.length - 1; k++)if ('(' === finalExpr[k] && balance++, ')' === finalExpr[k] && balance--, balance < 0) {
                            clean = !1;
                            break;
                        }
                        clean && (finalExpr = finalExpr.substring(1, finalExpr.length - 1));
                    }
                    return {
                        expr: finalExpr,
                        steps: solution.steps
                    };
                }
                return isTimedOut() ? "Computation timed out - try with fewer numbers" : "No solution found";
            }(numbers, target);
            if ('object' == typeof result && null !== result) {
                let originalExpression = result.expr, steps = result.steps, latexExpression = `${function(expr) {
                    try {
                        if ('undefined' != typeof math) return math.parse(expr).toTex({
                            parenthesis: 'keep'
                        });
                        throw Error("Math.js not found");
                    } catch (e) {
                        return expr.replace(/\*/g, ' \\times ').replace(/\//g, ' \\div ').replace(/\*\*/g, '^');
                    }
                }(originalExpression)} = ${target}`;
                try {
                    solutionOutput.innerHTML = '';
                    let katexDiv = document.createElement('div');
                    if (katexDiv.className = 'katex-display', solutionOutput.appendChild(katexDiv), solutionOutput.style.fontSize = "1.2em", solutionOutput.style.padding = "1.5rem", solutionOutput.style.overflowX = "auto", solutionOutput.style.overflowY = "hidden", 'undefined' != typeof katex ? katex.render(latexExpression, katexDiv, {
                        displayMode: !0,
                        throwOnError: !1,
                        trust: !0
                    }) : katexDiv.textContent = `${originalExpression} = ${target}`, steps && steps.length > 0) {
                        let stepsContainer = document.createElement('div');
                        stepsContainer.className = 'mt-4 text-left p-4 bg-base-200 rounded-lg shadow-inner';
                        let stepsHeader = document.createElement('h3');
                        stepsHeader.className = 'font-bold mb-2 text-sm uppercase tracking-wide opacity-70', stepsHeader.textContent = 'Solution Steps:', stepsContainer.appendChild(stepsHeader);
                        let ol = document.createElement('ol');
                        ol.className = 'list-decimal list-inside space-y-1 font-mono text-sm', steps.forEach((step)=>{
                            let li = document.createElement('li');
                            li.textContent = step, ol.appendChild(li);
                        }), stepsContainer.appendChild(ol), solutionOutput.appendChild(stepsContainer);
                    }
                    let copyButton = document.createElement('button');
                    copyButton.className = 'px-3 py-1 mt-4 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300 w-full', copyButton.textContent = 'Copy Expression', copyButton.addEventListener('click', ()=>{
                        let copyText = `${originalExpression} `;
                        navigator.clipboard.writeText(copyText).then(()=>{
                            showToast('Expression copied!'), copyButton.textContent = 'Copied!', setTimeout(()=>{
                                copyButton.textContent = 'Copy Expression';
                            }, 2000);
                        }).catch((err)=>console.error('Failed to copy:', err));
                    }), solutionOutput.appendChild(copyButton);
                } catch (e) {
                    console.error('KaTeX error:', e), solutionOutput.textContent = originalExpression;
                }
            } else solutionOutput.innerHTML = `<div class="p-4 text-center">${result}</div>`;
            submitButton.innerHTML = originalButtonText, submitButton.disabled = !1, showToast('object' == typeof result && null !== result ? 'Solution found!' : "No solution found" === result ? 'No solution found' : 'Timeout');
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
