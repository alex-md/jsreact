import { forecastValue, formatForecast } from './forecast-format.js';
import { parseSequence, validateInput } from './input.js';
import '@styles/global.css';
import './index.css';

(() => {
    "use strict";

    const abs = Math.abs;
    const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 });
    const fmtNum = (x) => {
        if (!Number.isFinite(x)) return "—";
        const ax = abs(x);
        if (ax >= 1e6 || (ax > 0 && ax < 0.001)) return x.toExponential(3);
        if (ax > 100) return x.toFixed(1);
        if (ax > 10) return x.toFixed(2);
        const formatted = x.toFixed(4);
        return formatted.includes('.') ? formatted.replace(/\.?0+$/, "") : formatted;
    };
    const fmtComma = (x) => {
        if (typeof x === 'string') return /^-?\d+$/.test(x) ? BigInt(x).toLocaleString('en-US') : x;
        if (!Number.isFinite(x)) return '—';
        const ax = abs(x);
        if (ax >= 1e12 || (ax > 0 && ax < 1e-6)) return x.toExponential(3);
        return numberFormatter.format(x);
    };

    // --- MAIN APPLICATION CONTROLLER ---
    const APP_CONTROLLER = {
        elements: {},

        lastResults: null, // Store results for export

        init() {
            this.elements = {
                seqInput: document.getElementById('seqInput'),
                horizonInput: document.getElementById('horizon'),
                runBtn: document.getElementById('runBtn'),
                runBtnText: document.getElementById('runBtnText'),
                runIcon: document.getElementById('runIcon'),
                loadingIcon: document.getElementById('loadingIcon'),
                demoBtn: document.getElementById('demoBtn'),
                clearBtn: document.getElementById('clearBtn'),
                exportBtn: document.getElementById('exportBtn'),
                modelInfo: document.getElementById('modelInfo'),
                forecastList: document.getElementById('forecastList'),
                details: document.getElementById('details'),
                seekerResults: document.getElementById('seekerResults'),
                parseWarning: document.getElementById('parseWarning'),
                sequenceStream: document.getElementById('sequenceStream'),
            };
            this.addEventListeners();
            this.checkUrlParams();
        },

        checkUrlParams() {
            const params = new URLSearchParams(window.location.search);
            const seq = params.get('seq');
            const horizon = params.get('horizon');

            if (seq) {
                this.elements.seqInput.value = seq;
                if (horizon) this.elements.horizonInput.value = horizon;
                this.runAnalysis();
            }
        },

        updateUrl(sequence, horizon) {
            const params = new URLSearchParams(window.location.search);
            params.set('seq', sequence.join(', '));
            params.set('horizon', horizon);
            window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
        },

        exportCsv() {
            if (!this.lastResults) return;

            const { sequence, ensembleForecast } = this.lastResults;
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Index,Type,Value,ApproximateLowerBound,ApproximateUpperBound\n";

            sequence.forEach((val, i) => {
                csvContent += `${i + 1},Historical,${val},,\n`;
            });

            ensembleForecast.forEach((f, i) => {
                const idx = sequence.length + i + 1;
                csvContent += `${idx},Forecast,${forecastValue(f.value)},${forecastValue(f.lo)},${forecastValue(f.hi)}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "oeis_forecast.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        renderStream(sequence, ensembleForecast) {
            const container = this.elements.sequenceStream;
            container.innerHTML = '';


            const getTrend = (prev, curr) => {
                if (Number(curr) - Number(prev) > Math.abs(Number(prev)) * 0.01) return '↗';
                if (Number(curr) - Number(prev) < -Math.abs(Number(prev)) * 0.01) return '↘';
                return '→';
            };

            sequence.forEach((val, i) => {
                const prev = i > 0 ? sequence[i - 1] : val;
                const tile = this.createTile({
                    index: i + 1,
                    value: val,
                    type: 'historical',
                    trend: getTrend(prev, val),
                    tooltip: `Index #${i + 1} (Historical)`,
                    delay: i * 50
                });
                container.appendChild(tile);
            });

            ensembleForecast.forEach((f, i) => {
                const prev = i === 0 ? sequence[sequence.length - 1] : ensembleForecast[i - 1].value;
                const tile = this.createTile({
                    index: sequence.length + i + 1,
                    value: forecastValue(f.value),
                    type: 'forecast',
                    trend: getTrend(prev, f.value),
                    tooltip: f.lo === null ? 'Exact continuation under the detected rule' : `Predicted #${sequence.length + i + 1}\nApproximate range: [${formatForecast(f.lo)} — ${formatForecast(f.hi)}]`,
                    delay: (sequence.length + i) * 50
                });
                container.appendChild(tile);
            });
        },

        createTile({ index, value, type, trend, tooltip, delay }) {
            const tile = document.createElement('button');
            tile.type = 'button';
            tile.title = 'Click to copy';
            tile.className = `stream-tile tile-${type} animate-fade-in-up copyable`;
            tile.style.animationDelay = `${Math.min(delay, 700)}ms`;
            tile.dataset.copyValue = value;

            for (const [className, text] of [['tile-index', `#${index}`], ['tile-value', fmtComma(value)], ['tile-trend', trend], ['tile-tooltip', tooltip]]) {
                const span = document.createElement('span');
                span.className = className;
                span.textContent = text;
                tile.appendChild(span);
            }

            return tile;
        },

        addEventListeners() {
            this.elements.runBtn.addEventListener('click', () => this.runAnalysis());
            this.elements.demoBtn.addEventListener('click', () => this.runDemo());
            if (this.elements.clearBtn) this.elements.clearBtn.addEventListener('click', () => this.resetApp());
            if (this.elements.exportBtn) this.elements.exportBtn.addEventListener('click', () => this.exportCsv());

            document.body.addEventListener('click', (e) => this.handleCopy(e));
            for (const input of [this.elements.seqInput, this.elements.horizonInput]) {
                input.addEventListener('input', () => {
                    const wasRunning = Boolean(this.worker);
                    this.cancelAnalysis();
                    this.lastResults = null;
                    this.elements.exportBtn.classList.add('hidden');
                    this.elements.parseWarning.textContent = '';
                    this.clearResults();
                    this.elements.sequenceStream.textContent = wasRunning ? 'Analysis canceled. Run again with your updated input.' : 'Run analysis with your updated input.';
                });
            }

            this.elements.seqInput.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.runAnalysis();
                }
            });
        },

        setLoading(isLoading) {
            this.elements.runBtn.disabled = isLoading;
            this.elements.runIcon.classList.toggle('hidden', isLoading);
            this.elements.loadingIcon.classList.toggle('hidden', !isLoading);
            this.elements.runBtnText.textContent = isLoading ? 'Analyzing...' : 'Extrapolate';

            if (isLoading) {
                this.elements.sequenceStream.innerHTML = `
                    <div class="text-muted-foreground/60 text-sm italic text-center py-8 w-full flex flex-col items-center gap-2">
                        <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Crunching numbers...
                    </div>`;
            }
        },

        parseInput() {
            this.elements.parseWarning.textContent = '';
            return parseSequence(this.elements.seqInput.value);
        },

        runDemo() {
            this.elements.seqInput.value = "0, 1, 1, 2, 3, 5, 8, 13";
            this.runAnalysis();
        },

        resetApp() {
            this.cancelAnalysis();
            this.elements.seqInput.value = '';
            this.elements.parseWarning.textContent = '';
            this.elements.seqInput.focus();
            this.lastResults = null;

            this.elements.sequenceStream.innerHTML = `
                <div id="streamPlaceholder" class="text-muted-foreground/40 text-sm italic text-center py-8 w-full">
                    Enter 3–200 numbers to explore possible continuations.
                </div>`;

            if (this.elements.exportBtn) this.elements.exportBtn.classList.add('hidden');

            window.history.replaceState({}, '', window.location.pathname);

            this.elements.modelInfo.innerHTML = `
                 <div class="h-full flex flex-col items-center justify-center text-muted-foreground/50 space-y-2 min-h-[160px]">
                     <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
                     <span class="text-sm">Analysis Required</span>
                 </div>`;
            this.elements.forecastList.innerHTML = `<li class="text-sm text-muted-foreground/60 italic text-center py-8">No forecast available yet.</li>`;
            this.elements.details.innerHTML = `<div class="h-20 flex items-center justify-center text-xs italic opacity-60">Run analysis to see comparison.</div>`;
            this.elements.seekerResults.textContent = 'Run analysis to explore transformations and mathematical clues.';
        },

        handleCopy(e) {
            const target = e.target.closest('.copyable');
            if (!target) return;
            const textToCopy = target.dataset.copyValue;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalBg = target.style.backgroundColor;
                target.style.backgroundColor = 'hsl(var(--accent))';
                setTimeout(() => {
                    target.style.backgroundColor = originalBg;
                }, 200);
            }).catch(err => console.error('Copy failed', err));
        },

        runAnalysis() {
            this.cancelAnalysis();
            this.lastResults = null;
            this.elements.exportBtn.classList.add('hidden');
            this.clearResults();
            try {
                const sequence = this.parseInput();
                const horizon = Number(this.elements.horizonInput.value);
                validateInput(sequence, horizon);
                this.updateUrl(sequence, horizon);
                this.setLoading(true);
                const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
                this.worker = worker;
                worker.onmessage = ({ data }) => {
                    if (this.worker !== worker) return;
                    this.cancelAnalysis();
                    if (data.error) this.showError(data.error);
                    else {
                        this.lastResults = data;
                        this.updateUI(data);
                    }
                };
                worker.onerror = () => {
                    if (this.worker !== worker) return;
                    this.cancelAnalysis();
                    this.showError('Analysis failed. Try a shorter sequence or reload the page.');
                };
                worker.postMessage({ sequence, horizon });
            } catch (error) {
                this.showError(error.message);
            }
        },

        cancelAnalysis() {
            this.worker?.terminate();
            this.worker = null;
            this.setLoading(false);
        },

        clearResults() {
            this.elements.modelInfo.textContent = 'Analysis Required';
            this.elements.forecastList.replaceChildren();
            this.elements.details.textContent = 'Run analysis to see comparison.';
            this.elements.seekerResults.textContent = 'Run analysis to explore transformations and mathematical clues.';
        },

        showError(message) {
            this.elements.parseWarning.textContent = message;
            this.elements.sequenceStream.textContent = message;
        },

        updateUI({ sequence, fits, bestFit, weights, ensembleForecast, exact, exploration, scoreMetric = 'Validation RMSE', forecastNote }) {
            this.renderStream(sequence, ensembleForecast);
            const node = (tag, text, className = '') => {
                const el = document.createElement(tag);
                if (text !== undefined) el.textContent = text;
                el.className = className;
                return el;
            };
            const info = this.elements.modelInfo;
            info.replaceChildren(node('div', exact ? 'Detected rule' : 'Top forecasting strategy', 'text-xs text-muted-foreground uppercase'),
                node('h3', bestFit.name, 'text-xl font-bold text-primary my-2'),
                node('p', exact
                    ? 'This rule matches the supplied terms and held-out checks exactly. A finite sequence can follow many rules; these next values assume this one continues.'
                    : 'Forecasts blend models using rolling one-step validation. Ranges are approximate model-error bands, not calibrated probabilities. Long-range errors can grow.',
                    'text-sm text-muted-foreground my-3'));
            if (!exact) {
                info.append(node('p', `${scoreMetric}: ${fmtNum(bestFit.score)}`, 'font-mono text-sm my-2'));
                info.append(node('p', forecastNote, 'text-sm text-muted-foreground my-3'));
                info.append(node('p', 'Predicted values are rounded to whole numbers.', 'text-xs text-muted-foreground'));
            }
            for (const [key, value] of Object.entries(bestFit.params)) {
                info.append(node('p', `${key}: ${typeof value === 'number' ? fmtNum(value) : value}`, 'text-xs font-mono my-1'));
            }
            const oeis = node('a', 'Search this sequence on OEIS ↗', 'text-sm text-primary underline block mt-4');
            oeis.href = `https://oeis.org/search?q=${encodeURIComponent(sequence.join(','))}`;
            oeis.target = '_blank'; oeis.rel = 'noopener noreferrer';
            if (sequence.every(Number.isSafeInteger)) info.append(oeis);
            this.elements.exportBtn.classList.remove('hidden');
            this.elements.forecastList.replaceChildren();
            ensembleForecast.forEach((item, i) => {
                const li = node('li', undefined, 'forecast-result p-3 rounded-lg border border-border copyable cursor-copy');
                li.dataset.copyValue = forecastValue(item.value);
                const heading = node('div', undefined, 'forecast-result-heading');
                heading.append(node('span', `#${sequence.length + i + 1}`, 'text-xs text-muted-foreground'),
                    node('span', formatForecast(item.value), 'forecast-result-value font-bold text-primary'));
                li.append(heading);
                li.append(node('div', exact ? 'Rule continuation' : `Approx. range [${formatForecast(item.lo)} — ${formatForecast(item.hi)}]`, 'forecast-result-range text-xs text-muted-foreground'));
                this.elements.forecastList.append(li);
            });
            const table = node('table', undefined, 'table w-full text-left text-xs');
            const head = node('thead'), header = node('tr');
            for (const title of ['Strategy', exact ? 'Rule check' : scoreMetric, exact ? 'Used for forecast' : 'Influence']) header.append(node('th', title, 'p-2'));
            head.append(header); table.append(head);
            const body = node('tbody');
            fits.forEach((fit, i) => {
                const row = node('tr', undefined, 'border-b border-border/40');
                for (const text of [fit.name, exact ? 'Exact checks' : fmtNum(fit.score), exact ? (i === 0 ? 'Yes' : 'Alternative') : `${(100 * weights[i]).toFixed(1)}%`]) row.append(node('td', text, 'p-2'));
                body.append(row);
            });
            table.append(body);
            this.elements.details.replaceChildren(table);
            const seeker = this.elements.seekerResults;
            seeker.replaceChildren(node('p', exploration.methods));
            const attribution = node('a', 'Methods inspired by N. J. A. Sloane’s Superseeker and its contributors ↗', 'text-primary underline block');
            attribution.href = 'https://oeis.org/ol_source.txt'; attribution.target = '_blank'; attribution.rel = 'noopener noreferrer';
            seeker.append(attribution);
            seeker.append(node('p', 'These are local mathematical tests, not confirmed OEIS matches. Search links send the displayed terms to OEIS only when you open them.', 'text-xs'));
            if (exact && fits.length > 1) {
                const disagree = fits.some(f => f.continuation.some((v, i) => v !== ensembleForecast[i].value));
                seeker.append(node('p', disagree
                    ? 'Multiple rules pass exact checks and predict different continuations. The simplest rule supplies the forecast above.'
                    : 'Multiple rules pass exact checks and agree over the requested horizon.', 'font-medium text-foreground'));
                const alternatives = node('details');
                alternatives.append(node('summary', `Compare ${fits.length} matching rules`, 'cursor-pointer text-primary'));
                fits.forEach(f => {
                    const box = node('div', undefined, 'my-3 p-3 rounded border border-border');
                    box.append(node('p', f.name, 'font-medium text-foreground'), node('p', `Next terms: ${f.continuation.slice(0, 8).join(', ')}${f.continuation.length > 8 ? ', …' : ''}`, 'font-mono text-xs break-words my-2'));
                    Object.entries(f.params).forEach(([k, v]) => box.append(node('p', `${k}: ${v}`, 'text-xs break-words')));
                    alternatives.append(box);
                });
                seeker.append(alternatives);
            }
            if (exploration.beatty) {
                const b = exploration.beatty;
                seeker.append(node('p', 'Beatty-compatible prefix', 'font-medium text-foreground'),
                    node('p', `α ∈ [${b.lower}, ${b.upper}); example α = ${b.example}. ${b.note}`, 'text-xs break-words'));
            }
            const appendRows = (title, rows) => {
                if (!rows.length) return;
                const group = node('details');
                group.append(node('summary', `${title} (${rows.length})`, 'cursor-pointer text-primary'));
                for (const row of rows) {
                    const box = node('div', undefined, 'my-3 p-3 rounded border border-border min-w-0');
                    box.append(node('p', `${row.code} · ${row.name}`, 'font-medium text-foreground'),
                        node('p', row.values.slice(0, 12).join(', ') + (row.values.length > 12 ? ', …' : ''), 'font-mono text-xs break-words my-2'));
                    if (row.searchable) {
                        const link = node('a', 'Search transformed terms on OEIS ↗', 'text-primary underline text-xs');
                        link.href = `https://oeis.org/search?q=${encodeURIComponent(row.values.slice(0, 12).join(','))}`;
                        link.target = '_blank'; link.rel = 'noopener noreferrer'; box.append(link);
                    } else box.append(node('p', 'OEIS search needs at least three integer terms.', 'text-xs'));
                    group.append(box);
                }
                seeker.append(group);
            };
            appendRows('Binary associated sequences', exploration.binary);
            appendRows('Sequence transformations', exploration.transforms);
            if (exploration.termsUsed) seeker.append(node('p', `Transform previews use the first ${exploration.termsUsed} input terms (maximum 32); binary associates use the full input. Each preview shows up to 12 terms. Exact candidate rules are checked against the full input. ${exploration.skipped.length} transforms were empty, undefined, or exceeded arithmetic limits. T095–T098 are unimplemented in the original source and are omitted here.`, 'text-xs'));

        },
    };

    document.addEventListener("DOMContentLoaded", () => APP_CONTROLLER.init());
})();
