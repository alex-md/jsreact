import '@styles/global.css';
import { showToast } from '@/components/toast.js';
document.addEventListener("DOMContentLoaded", () => {
    let descriptionTimeout, infoButton = document.getElementById("info-toggle"), calculatorDescription = document.getElementById("calculator-description");
    infoButton.addEventListener("click", () => {
        calculatorDescription.classList.remove("hidden", "translate-y-full", "opacity-0"), clearTimeout(descriptionTimeout), descriptionTimeout = setTimeout(() => {
            calculatorDescription.classList.add("hiding"), setTimeout(() => {
                calculatorDescription.classList.remove("hiding"), calculatorDescription.classList.add("hidden");
            }, 300);
        }, 5000);
    }), document.getElementById("random-numbers-button").addEventListener("click", (event) => {
        event.preventDefault();
        let count = document.getElementById("num-integers-input").value || 6, maxValue = document.getElementById("max-number-input").value || 90, randomNumbers = Array.from({
            length: parseInt(count)
        }, () => Math.floor(Math.random() * parseInt(maxValue)) + 1);
        document.getElementById("numbers-input").value = randomNumbers.join(","), showToast('Random numbers generated');
    });

    let currentWorker = null;

    document.getElementById("submit-button").addEventListener("click", (event) => {
        event.preventDefault();

        // Terminate existing worker if running
        if (currentWorker) {
            currentWorker.terminate();
        }

        let submitButton = document.getElementById("submit-button"),
            solutionOutput = document.getElementById("solution-output"),
            originalButtonText = submitButton.innerHTML,
            loadingSpinner = document.createElement('span');

        loadingSpinner.className = 'loading-spinner';
        submitButton.innerHTML = 'Calculating';
        submitButton.appendChild(loadingSpinner);
        submitButton.disabled = true;

        // Hide previous results but keep container ready
        solutionOutput.classList.add("hidden");

        // robust input parsing: allows commas, spaces, newlines
        let rawInput = document.getElementById("numbers-input").value;
        let numbers = rawInput.split(/[\s,]+/).filter(s => s.trim().length > 0).map(num => parseInt(num));
        let target = parseInt(document.getElementById("target-input").value);

        if (!numbers.every((n) => !isNaN(n)) || isNaN(target)) {
            showToast('Please enter valid numbers');
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
            return;
        }

        // Initialize Worker
        currentWorker = new Worker(new URL('../workers/expressionSolver.js', import.meta.url), { type: 'module' });

        currentWorker.postMessage({
            numbers,
            target,
            config: {
                useExponents: document.getElementById("exponents-checkbox").checked,
                useSqrt: document.getElementById("sqrt-checkbox").checked,
                noParentheses: document.getElementById("no-parentheses-checkbox").checked
            }
        });

        currentWorker.onmessage = function (e) {
            const response = e.data;
            solutionOutput.classList.remove("hidden");

            if (response.success) {
                const { expr, steps } = response.result;

                // Save to History (LocalStorage)
                saveToHistory({ numbers, target, expr, date: Date.now() });

                // Render Logic (Reused)
                let latexExpression = (function (expr) {
                    try {
                        if (typeof math !== 'undefined') return math.parse(expr).toTex({ parenthesis: 'keep' });
                        throw new Error("Math.js not found");
                    } catch (err) {
                        console.warn("Math.js fallback active:", err);
                        let tex = expr.replace(/\*\*/g, '^');
                        while (tex.includes('sqrt(')) {
                            let startIndex = tex.indexOf('sqrt(');
                            let openParens = 0;
                            let endIndex = -1;
                            for (let i = startIndex + 4; i < tex.length; i++) {
                                if (tex[i] === '(') openParens++;
                                else if (tex[i] === ')') {
                                    openParens--;
                                    if (openParens === 0) {
                                        endIndex = i;
                                        break;
                                    }
                                }
                            }
                            if (endIndex !== -1) {
                                let content = tex.substring(startIndex + 5, endIndex);
                                tex = tex.substring(0, startIndex) + `\\sqrt{${content}}` + tex.substring(endIndex + 1);
                            } else {
                                break;
                            }
                        }
                        return tex.replace(/\*/g, ' \\times ').replace(/\//g, ' \\div ');
                    }
                })(expr) + ` = ${target}`;

                try {
                    solutionOutput.innerHTML = '';

                    // Main Result Card
                    let resultCard = document.createElement('div');
                    resultCard.className = 'bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6 flex justify-center items-center relative overflow-hidden';
                    resultCard.innerHTML = '<div class="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 opacity-100 z-0"></div>';

                    let katexDiv = document.createElement('div');
                    katexDiv.className = 'katex-display relative z-10 transform transition-transform hover:scale-105 duration-300 cursor-default';
                    resultCard.appendChild(katexDiv);
                    solutionOutput.appendChild(resultCard);

                    solutionOutput.style.fontSize = "1.3em";
                    solutionOutput.style.overflowX = "visible"; // Allow shadows/scales to overflow if needed, or handle scrolling differently
                    // Reset padding as we are using internal cards
                    solutionOutput.style.padding = "0";

                    if (typeof katex !== 'undefined') {
                        katex.render(latexExpression, katexDiv, {
                            displayMode: true,
                            throwOnError: false,
                            trust: true
                        });
                    } else {
                        katexDiv.textContent = `${expr} = ${target}`;
                    }

                    if (steps && steps.length > 0) {
                        let stepsContainer = document.createElement('div');
                        stepsContainer.className = 'mt-8 border-t border-gray-100 pt-6';

                        let stepsHeader = document.createElement('h3');
                        stepsHeader.className = 'flex items-center gap-2 font-bold mb-4 text-sm uppercase tracking-wider text-gray-500';
                        stepsHeader.innerHTML = '<i class="fas fa-stream"></i> Solution Path';
                        stepsContainer.appendChild(stepsHeader);

                        let ul = document.createElement('ul');
                        ul.className = 'space-y-3 relative';

                        // Vertical Line
                        let line = document.createElement('div');
                        line.className = 'absolute left-[1.125rem] top-4 bottom-4 w-0.5 bg-gray-100 -z-10';
                        ul.appendChild(line);

                        steps.forEach((step, index) => {
                            let li = document.createElement('li');
                            li.className = 'flex items-center gap-4 opacity-0 transform translate-y-4 animate-slide-in';
                            li.style.animationDelay = `${index * 100}ms`;
                            li.style.animationFillMode = 'forwards';

                            // Step Badge
                            let badge = document.createElement('div');
                            badge.className = 'w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm shrink-0';
                            badge.textContent = index + 1;
                            li.appendChild(badge);

                            // Step Content Card
                            let content = document.createElement('div');
                            content.className = 'flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100/50 hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all duration-300';

                            // Format the math safely using a single-pass replacement to avoid recursive matching of HTML tags
                            let mathContent = step.replace(/(\d+)|([+\-*/^])|(=)/g, (match, num, op, eq) => {
                                if (num) return `<span class="font-semibold text-gray-800">${num}</span>`;
                                if (op) return `<span class="text-indigo-400 font-bold mx-1">${op}</span>`;
                                if (eq) return `<span class="text-gray-400 mx-2">=</span>`;
                                return match;
                            });

                            content.innerHTML = `<div class="font-mono text-base text-gray-600">${mathContent}</div>`;
                            li.appendChild(content);

                            ul.appendChild(li);
                        });
                        stepsContainer.appendChild(ul);
                        solutionOutput.appendChild(stepsContainer);

                        // Add styles for animation if not present
                        if (!document.getElementById('step-animations')) {
                            let style = document.createElement('style');
                            style.id = 'step-animations';
                            style.textContent = `
                                @keyframes slideIn {
                                    from { opacity: 0; transform: translateY(10px); }
                                    to { opacity: 1; transform: translateY(0); }
                                }
                                .animate-slide-in {
                                    animation-name: slideIn;
                                    animation-duration: 0.4s;
                                    animation-timing-function: ease-out;
                                }
                            `;
                            document.head.appendChild(style);
                        }
                    }

                    let copyButton = document.createElement('button');
                    copyButton.className = 'group absolute top-4 right-4 p-2 bg-white text-gray-400 rounded-lg hover:text-primary hover:bg-indigo-50 transition-all shadow-sm border border-gray-100';
                    copyButton.title = 'Copy Expression';
                    copyButton.innerHTML = '<i class="fas fa-copy text-lg"></i><span class="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Copy</span>';

                    copyButton.addEventListener('click', () => {
                        let copyText = `${expr} `;
                        navigator.clipboard.writeText(copyText).then(() => {
                            let icon = copyButton.querySelector('i');
                            icon.classList.remove('fa-copy');
                            icon.classList.add('fa-check', 'text-green-500');
                            showToast('Expression copied!');

                            setTimeout(() => {
                                icon.classList.remove('fa-check', 'text-green-500');
                                icon.classList.add('fa-copy');
                            }, 2000);
                        }).catch((err) => console.error('Failed to copy:', err));
                    });

                    // Ensure container is relative for absolute positioning
                    solutionOutput.classList.add('relative');
                    solutionOutput.appendChild(copyButton);

                } catch (err) {
                    console.error('KaTeX error:', err);
                    solutionOutput.textContent = expr;
                }
                showToast('Solution found!');
            } else {
                solutionOutput.innerHTML = `<div class="p-4 text-center text-red-500 font-medium">${response.error}</div>`;
                showToast(response.error);
            }

            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        };

        currentWorker.onerror = function (error) {
            console.error('Worker error:', error);
            solutionOutput.innerHTML = `<div class="p-4 text-center text-red-500">An unexpected error occurred.</div>`;
            showToast('Error occurred in solver');
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        };
    });

    function saveToHistory(item) {
        try {
            const history = JSON.parse(localStorage.getItem('expression_history') || '[]');
            // Deduplicate based on expression and target
            const newHistory = [item, ...history.filter(h => h.expr !== item.expr || h.target !== item.target)].slice(0, 10);
            localStorage.setItem('expression_history', JSON.stringify(newHistory));
            updateHistoryUI();
        } catch (e) { console.error("History save failed", e); }
    }

    function updateHistoryUI() {
        // Implementation for History UI will be added in the Challenge Mode update
        // for now just saving data
    }
    let advancedSettings = document.querySelector("#advanced-settings"), advancedSettingsToggle = document.querySelector("#advanced-settings-toggle");
    if (advancedSettingsToggle && advancedSettings && (advancedSettingsToggle.addEventListener("click", () => {
        advancedSettings.classList.toggle("hidden");
    }), advancedSettings.querySelectorAll('input[type="number"]').forEach((input) => {
        input.addEventListener("click", (event) => event.stopPropagation());
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

    // --- Challenge Mode Logic ---
    const tabSolver = document.getElementById("view-solver");
    const tabChallenge = document.getElementById("view-challenge");
    const viewSolver = document.getElementById("solver-view");
    const viewChallenge = document.getElementById("challenge-view");

    tabSolver.addEventListener("click", () => switchTab('solver'));
    tabChallenge.addEventListener("click", () => switchTab('challenge'));

    function switchTab(tab) {
        if (tab === 'solver') {
            tabSolver.className = "px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm bg-white text-gray-800";
            tabChallenge.className = "px-6 py-2 rounded-lg text-sm font-semibold transition-all text-gray-600 hover:text-gray-800 hover:bg-gray-100";
            viewSolver.classList.remove("hidden");
            viewChallenge.classList.add("hidden");
        } else {
            tabChallenge.className = "px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm bg-white text-gray-800";
            tabSolver.className = "px-6 py-2 rounded-lg text-sm font-semibold transition-all text-gray-600 hover:text-gray-800 hover:bg-gray-100";
            viewChallenge.classList.remove("hidden");
            viewSolver.classList.add("hidden");
        }
    }

    // Game State
    let gameState = {
        active: false,
        score: 0,
        target: 0,
        numbers: [],
        expression: [], // Array of tokens: { type: 'num'|'op', val: ..., id: ... }
        timerInterval: null,
        timeLeft: 0,
        roundDuration: 60
    };

    const gameActionBtn = document.getElementById("game-action-btn");
    const gameNumbersDiv = document.getElementById("game-numbers");
    const builderZone = document.getElementById("builder-zone");
    const gameTargetDisplay = document.getElementById("game-target");
    const scoreDisplay = document.getElementById("game-score");
    const timerBar = document.getElementById("game-timer-bar");
    const gameBackspace = document.getElementById("game-backspace");

    gameActionBtn.addEventListener("click", () => {
        if (gameState.active) {
            checkSolution();
        } else {
            startGame();
        }
    });

    document.querySelectorAll(".game-op").forEach(btn => {
        btn.addEventListener("click", () => {
            if (!gameState.active) return;
            addToken('op', btn.dataset.val);
        });
    });

    gameBackspace.addEventListener("click", () => {
        if (!gameState.active || gameState.expression.length === 0) return;
        const lastToken = gameState.expression.pop();
        if (lastToken.type === 'num') {
            const numBtn = document.getElementById(lastToken.id);
            if (numBtn) {
                numBtn.classList.remove("opacity-30", "cursor-not-allowed", "border-gray-100");
                numBtn.disabled = false;
            }
        }
        updateBuilderUI();
    });

    function startGame() {
        gameState.score = 0;
        gameState.roundDuration = 60;
        updateScore(0);

        // Timer Logic will be per round or global? 
        // Let's do a "Survival Mode": Adds time on correct answer, lose if time runs out.
        // Or "Speed Mode": Solve as many as possible in 60s.
        // Let's do Speed Mode: 60s total.
        gameState.timeLeft = 60;
        gameState.active = true;

        gameActionBtn.textContent = "Submit Answer";
        gameActionBtn.className = "w-full py-4 bg-primary text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform transition-all";

        startTimer();
        nextRound();
    }

    function startTimer() {
        if (gameState.timerInterval) clearInterval(gameState.timerInterval);
        timerBar.style.opacity = '1';

        gameState.timerInterval = setInterval(() => {
            gameState.timeLeft -= 0.1;
            const pct = (gameState.timeLeft / 60) * 100;
            timerBar.style.width = `${pct}%`;

            if (gameState.timeLeft <= 10) {
                timerBar.classList.remove("bg-primary");
                timerBar.classList.add("bg-red-500");
            } else {
                timerBar.classList.add("bg-primary");
                timerBar.classList.remove("bg-red-500");
            }

            if (gameState.timeLeft <= 0) {
                endGame();
            }
        }, 100);
    }

    function endGame() {
        clearInterval(gameState.timerInterval);
        gameState.active = false;
        showToast(`Game Over! Score: ${gameState.score}`);
        gameActionBtn.textContent = "Play Again";
        gameActionBtn.className = "w-full py-4 bg-gray-800 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform transition-all";
        builderZone.innerHTML = `<span class="text-gray-400 font-bold">Time's Up! Final Score: ${gameState.score}</span>`;
        gameNumbersDiv.innerHTML = '';
        gameTargetDisplay.textContent = '-';
        timerBar.style.width = '0%';
    }

    function nextRound() {
        // Generate solvable problem
        // Method: Generate 4 numbers (1-9), perform 3 operations to get target.
        const nums = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9) + 1);

        // Compute target
        let currentVal = nums[0];
        let steps = `${currentVal}`;
        // Simple forward generation (ignore order of ops for generation, just accumulate value)
        // Note: This guarantees solvability IF strict left-to-right evaluation is used, 
        // BUT the player uses invalid standard math order.
        // Better: Construct a tree or just pick 3 random ops and apply them.
        // Actually, just pick a target and use the WORKER to check if solvable!
        // That allows truly random interesting targets.

        // Optimized approach for "guaranteed solvable":
        // 1. Generate 4 numbers.
        // 2. Randomly shuffle and pair them with operators to compute a result.
        // 3. That result is the target.
        let tempNums = [...nums];
        while (tempNums.length > 1) {
            const aIdx = Math.floor(Math.random() * tempNums.length);
            const a = tempNums.splice(aIdx, 1)[0];
            const bIdx = Math.floor(Math.random() * tempNums.length);
            const b = tempNums.splice(bIdx, 1)[0];

            const ops = ['+', '-', '*']; // Avoid division to prevent fractions easily, or handle carefully
            const op = ops[Math.floor(Math.random() * ops.length)];

            let res = 0;
            switch (op) {
                case '+': res = a + b; break;
                case '-': res = a - b; break; // Allow negative intermediates
                case '*': res = a * b; break;
            }
            tempNums.push(res);
        }

        const generatedTarget = tempNums[0];

        // If target is too weird (negative, too big, or 0), retry
        if (generatedTarget <= 0 || generatedTarget > 100 || !Number.isInteger(generatedTarget)) {
            nextRound(); // Recursion risk negligible with these constraints
            return;
        }

        gameState.target = generatedTarget;
        gameState.numbers = nums; // Original numbers
        gameState.expression = [];

        // Render
        gameTargetDisplay.textContent = gameState.target;
        renderGameNumbers();
        updateBuilderUI();
    }

    function renderGameNumbers() {
        gameNumbersDiv.innerHTML = '';
        gameState.numbers.forEach((num, idx) => {
            const btn = document.createElement("button");
            btn.className = "h-14 w-14 bg-white border-2 border-gray-200 text-gray-800 rounded-xl font-bold text-xl hover:border-primary hover:text-primary transition-all shadow-sm";
            btn.textContent = num;
            btn.id = `num-${idx}`;
            btn.addEventListener("click", () => {
                if (!gameState.active || btn.disabled) return;
                addToken('num', num, btn.id);
                btn.classList.add("opacity-30", "cursor-not-allowed", "border-gray-100");
                btn.disabled = true;
            });
            gameNumbersDiv.appendChild(btn);
        });
    }

    function addToken(type, val, id = null) {
        // Validation: Don't allow operator at start (except -? No, keep simple)
        // Don't allow double operators
        const last = gameState.expression[gameState.expression.length - 1];
        if (type === 'op' && (!last || last.type === 'op' && last.val !== ')')) {
            // Ignore (maybe allow '-' as unary later?)
            if (val === '(') {
                // Open parenthesis allowed
            } else {
                return;
            }
        }
        if (type === 'num' && last && last.type === 'num') {
            // Don't allow implicit multiplication or multi-digit unless intended?
            // "2" "4" -> "24"? Or "2" * "4"? 
            // Let's assume individual numbers. Implicit mult is confusing.
            return;
        }

        gameState.expression.push({ type, val, id });
        updateBuilderUI();
    }

    function updateBuilderUI() {
        if (gameState.expression.length === 0) {
            builderZone.innerHTML = '<span class="text-gray-400 pointer-events-none select-none text-sm">Tap numbers and operators</span>';
            return;
        }
        builderZone.innerHTML = '';
        gameState.expression.forEach(token => {
            const span = document.createElement("span");
            span.className = token.type === 'num'
                ? "bg-white border border-gray-200 px-3 py-1 rounded-lg font-bold shadow-sm"
                : "text-indigo-600 font-bold text-lg px-1";
            span.textContent = token.val;
            builderZone.appendChild(span);
        });
    }

    function checkSolution() {
        const exprStr = gameState.expression.map(t => t.val).join(' ');
        try {
            // Safe eval using Function or Math.js if avail
            // We have math.js fallback in other code, let's simple eval with replacement
            const cleanExpr = exprStr.replace(/×/g, '*').replace(/÷/g, '/');
            // DANGER: eval is evil, but inputs are strictly controlled buttons.
            // We can use the existing `math.evaluate` or similar if we imported it.
            // `math` object is on window from script tag in HTML.
            let result;
            if (typeof math !== 'undefined') {
                result = math.evaluate(cleanExpr);
            } else {
                result = new Function('return ' + cleanExpr)();
            }

            if (Math.abs(result - gameState.target) < 0.0001) {
                // Check if all numbers used?
                // Let's require just "correct answer" for now.

                // Show success animation
                gameState.score += 10 + Math.ceil(gameState.timeLeft / 10); // Bonus for speed
                // Add time back
                gameState.timeLeft = Math.min(gameState.timeLeft + 5, 60);

                updateScore(gameState.score);
                showToast("Correct! +Time Bonus");
                nextRound();
            } else {
                showToast(`Result is ${result}, target is ${gameState.target}`);
                // Penalty?
                builderZone.classList.add("bg-red-50");
                setTimeout(() => builderZone.classList.remove("bg-red-50"), 500);
            }
        } catch (e) {
            showToast("Invalid Expression");
            builderZone.classList.add("bg-red-50");
            setTimeout(() => builderZone.classList.remove("bg-red-50"), 500);
        }
    }

    function updateScore(s) {
        scoreDisplay.textContent = s;
    }
});
