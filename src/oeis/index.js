import '@styles/global.css';
import './index.css';

(() => {
    "use strict";

    // --- CONSTANTS ---
    const MIN_SEQUENCE_LENGTH = 3;
    const Z_SCORE_95 = 1.96;
    const NUMERIC_TOLERANCE = 1e-12;

    // --- UTILITY & FORMATTING FUNCTIONS ---
    const ln = Math.log;
    const exp = Math.exp;
    const pow = Math.pow;
    const sqrt = Math.sqrt;
    const abs = Math.abs;
    const sign = Math.sign;
    const min = Math.min;
    const max = Math.max;

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
        if (!Number.isFinite(x)) return '—';
        const ax = abs(x);
        if (ax >= 1e12 || (ax > 0 && ax < 1e-6)) return x.toExponential(3);
        return numberFormatter.format(x);
    };

    // --- STATISTICAL & LINEAR ALGEBRA ENGINE ---
    const STATS_ENGINE = {
        makeIndexArray: (len) => Array.from({ length: len }, (_, i) => i + 1),
        transpose: function (A) {
            const m = A.length, n = A[0].length;
            const At = Array.from({ length: n }, () => Array(m).fill(0));
            for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) At[j][i] = A[i][j];
            return At;
        },
        qrDecomposition: function (A) {
            let m = A.length, n = A[0].length;
            let R = A.map(row => row.slice());
            let Q = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => +(i === j)));
            for (let j = 0; j < min(n, m); j++) {
                let x = Array(m - j).fill(0);
                for (let i = j; i < m; i++) x[i - j] = R[i][j];
                let norm_x = sqrt(x.reduce((s, v) => s + v * v, 0));
                if (norm_x < NUMERIC_TOLERANCE) continue;
                let s = -sign(x[0]) || -1;
                let u1 = x[0] - s * norm_x;
                let w = x.map(val => val / u1);
                w[0] = 1;
                let tau = -s * u1 / norm_x;
                let v = Array.from({ length: m }, (_, i) => i < j ? 0 : w[i - j]);
                let Rv = Array(n).fill(0);
                for (let k = j; k < n; k++) for (let i = j; i < m; i++) Rv[k] += R[i][k] * v[i];
                for (let i = j; i < m; i++) for (let k = j; k < n; k++) R[i][k] -= tau * v[i] * Rv[k];
                let Qv = Array(m).fill(0);
                for (let k = 0; k < m; k++) for (let i = j; i < m; i++) Qv[k] += Q[k][i] * v[i];
                for (let i = 0; i < m; i++) for (let k = j; k < m; k++) Q[i][k] -= tau * Qv[i] * v[k];
            }
            return { Q, R };
        },
        backSolve: function (R, b) {
            const n = R[0].length;
            const x = Array(n).fill(0);
            for (let i = n - 1; i >= 0; i--) {
                let sum = 0;
                for (let j = i + 1; j < n; j++) sum += R[i][j] * x[j];
                x[i] = abs(R[i][i]) < NUMERIC_TOLERANCE ? 0 : (b[i] - sum) / R[i][i];
            }
            return x;
        },
        qrSolve: function (A, b) {
            const { Q, R } = this.qrDecomposition(A);
            const Qt = this.transpose(Q);
            const m = A.length;
            const n = A[0] ? A[0].length : 0;
            const Qtb = Array(m).fill(0);
            for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) Qtb[i] += Qt[i][j] * b[j];
            return this.backSolve(R, Qtb.slice(0, n));
        },
        median: function (arr) {
            if (!arr || arr.length === 0) return 0;
            const sorted = arr.slice().sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        },
        mad: function (arr) {
            if (!arr || arr.length === 0) return NUMERIC_TOLERANCE;
            const med = this.median(arr);
            return this.median(arr.map(v => abs(v - med))) || NUMERIC_TOLERANCE;
        },
        aicc: function (numObs, sse, numParams) {
            sse = sse <= 0 ? NUMERIC_TOLERANCE : sse;
            const k = numParams + 1;
            const denominator = numObs - k - 1;
            if (denominator <= 0) return Infinity;
            return numObs * ln(sse / numObs) + 2 * k + (2 * k * (k + 1)) / denominator;
        },
        robustOls: function (X, y, opts = {}) {
            const n = X.length;
            if (n === 0) return { beta: [], yhat: [], resid: [], sse: 0, R: [] };
            const p = X[0].length;
            const maxIter = opts.maxIter ?? 25;
            const tol = opts.tol ?? 1e-6;
            const delta = opts.delta ?? 1.345;
            let weights = Array(n).fill(1);
            for (let it = 0; it < maxIter; it++) {
                const W_sqrt = weights.map(wi => sqrt(wi));
                const X_w = X.map((row, i) => row.map(val => val * W_sqrt[i]));
                const y_w = y.map((val, i) => val * W_sqrt[i]);
                const beta = this.qrSolve(X_w, y_w);
                const yhat = X.map(row => row.reduce((s, v, j) => s + v * beta[j], 0));
                const resid = y.map((v, i) => v - yhat[i]);
                const scale = 1.4826 * this.mad(resid);
                if (scale < NUMERIC_TOLERANCE) break;
                let changed = false;
                const new_weights = resid.map(r => {
                    const r_scaled = abs(r / scale);
                    return r_scaled <= delta ? 1 : delta / r_scaled;
                });
                for (let i = 0; i < n; i++) if (abs(new_weights[i] - weights[i]) > tol) changed = true;
                weights = new_weights;
                if (!changed) break;
            }
            const W_sqrt = weights.map(wi => sqrt(wi));
            const X_w = X.map((row, i) => row.map(val => val * W_sqrt[i]));
            const y_w = y.map((val, i) => val * W_sqrt[i]);
            const beta = this.qrSolve(X_w, y_w);
            const R = this.qrDecomposition(X_w).R.slice(0, p);
            const yhat = X.map(row => row.reduce((s, v, j) => s + v * beta[j], 0));
            const resid = y.map((v, i) => v - yhat[i]);
            const sse = resid.reduce((s, r) => s + r * r, 0);
            return { beta, yhat, resid, sse, R };
        },
        stderrFromSSE: (sse, numObs, numParams) => sqrt(sse / max(1, numObs - numParams)),
        linearModelInterval: function (x_new, R_chol, stderr, z) {
            const se_pred = stderr * sqrt(1 + this.backSolve(this.transpose(R_chol), x_new).reduce((s, val) => s + val * val, 0));
            return (yhat_val) => [yhat_val - z * se_pred, yhat_val + z * se_pred];
        },
        nelderMead: (fn, x0, opts = {}) => {
            const maxIter = opts.maxIter ?? 400, tol = opts.tol ?? 1e-8, n = x0.length;
            let simplex = [x0.slice()];
            const step = opts.step ?? 0.2;
            for (let i = 0; i < n; i++) {
                let xi = x0.slice();
                xi[i] = xi[i] !== 0 ? xi[i] * (1 + step) : step;
                simplex.push(xi);
            }
            let f = simplex.map(fn);
            for (let it = 0; it < maxIter; it++) {
                const idx = Array.from({ length: n + 1 }, (_, i) => i).sort((a, b) => f[a] - f[b]);
                simplex = idx.map(i => simplex[i]);
                f = idx.map(i => f[i]);
                const fmean = f.reduce((s, v) => s + v, 0) / f.length;
                if (sqrt(f.reduce((s, v) => s + (v - fmean) ** 2, 0) / f.length) < tol) break;
                const best = simplex[0], worst = simplex[n];
                const centroid = Array(n).fill(0);
                for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) centroid[j] += simplex[i][j] / n;
                const xr = centroid.map((c, j) => c + (c - worst[j])), fr = fn(xr);
                if (fr < f[0]) {
                    const xe = centroid.map((c, j) => c + 2 * (xr[j] - c)), fe = fn(xe);
                    fe < fr ? ([simplex[n], f[n]] = [xe, fe]) : ([simplex[n], f[n]] = [xr, fr]);
                } else if (fr < f[n - 1]) {
                    [simplex[n], f[n]] = [xr, fr];
                } else {
                    const xc = centroid.map((c, j) => c + 0.5 * (worst[j] - c)), fc = fn(xc);
                    if (fc < f[n]) {
                        [simplex[n], f[n]] = [xc, fc];
                    } else {
                        for (let i = 1; i < simplex.length; i++) {
                            simplex[i] = best.map((b, j) => b + 0.5 * (simplex[i][j] - b));
                            f[i] = fn(simplex[i]);
                        }
                    }
                }
            }
            const ib = f.indexOf(min(...f));
            return { x: simplex[ib], fx: f[ib] };
        },
        difference: function (series, d = 1, m = 1) {
            if (d <= 0) return series.slice();
            let current = series.slice();
            for (let k = 0; k < d; k++) {
                if (current.length <= m) return [];
                const next = [];
                for (let i = m; i < current.length; i++) next.push(current[i] - current[i - m]);
                current = next;
            }
            return current;
        },
        armaSSE: function (z, phi, theta, P, Q, m) {
            const p = phi.length, q = theta.length, n = z.length, max_lag = max(p, q, (P.length * m), (Q.length * m));
            if (n <= max_lag) return { sse: Infinity, e: [] };

            let e = Array(n).fill(0), sse = 0;
            for (let t = max_lag; t < n; t++) {
                let pred = 0;
                for (let i = 1; i <= p; i++) pred += phi[i - 1] * z[t - i];
                for (let j = 1; j <= q; j++) pred += theta[j - 1] * e[t - j];
                for (let i = 1; i <= P.length; i++) pred += P[i - 1] * z[t - i * m];
                for (let j = 1; j <= Q.length; j++) pred += Q[j - 1] * e[t - j * m];

                e[t] = z[t] - pred;
                sse += e[t] * e[t];
                if (!Number.isFinite(sse)) return { sse: Infinity, e };
            }
            return { sse, e };
        },
        metrics: function (y, yhat) {
            const n = y.length;
            if (n === 0 || yhat.length < n) return { sse: Infinity, r2: -Infinity, mape: Infinity };
            const mean = y.reduce((s, v) => s + v, 0) / n;
            const sse = y.reduce((s, v, i) => s + (yhat[i] !== undefined ? (v - yhat[i]) ** 2 : 0), 0);
            const sst = y.reduce((s, v) => s + (v - mean) ** 2, 0) || NUMERIC_TOLERANCE;
            const mape = y.reduce((s, v, i) => s + (v !== 0 && yhat[i] !== undefined ? abs((v - yhat[i]) / v) : 0), 0) / n;
            return { sse, r2: 1 - sse / sst, mape };
        },
        simpleLinearRegression: function (y) {
            const n = y.length;
            if (n < 2) return { intercept: y[0] || 0, slope: 0 };
            const x = this.makeIndexArray(n);
            const { beta } = this.robustOls(x.map(t => [1, t]), y);
            return { intercept: beta[0], slope: beta[1] };
        },
        detectSeasonality: function (y) {
            const n = y.length;
            const periods = [12, 7, 4].filter(p => n >= 2 * p);
            if (periods.length === 0) return 1;

            let bestPeriod = 1, minVar = Infinity;
            for (const p of periods) {
                const numCycles = Math.floor(n / p);
                const seasonalAvgs = Array(p).fill(0);
                for (let i = 0; i < p * numCycles; i++) seasonalAvgs[i % p] += y[i];
                for (let j = 0; j < p; j++) seasonalAvgs[j] /= numCycles;

                const overallAvg = seasonalAvgs.reduce((a, b) => a + b, 0) / p;
                const seasonalVar = seasonalAvgs.reduce((a, b) => a + (b - overallAvg) ** 2, 0) / p;

                if (seasonalVar < minVar) {
                    minVar = seasonalVar;
                    bestPeriod = p;
                }
            }
            const totalVar = y.reduce((s, v, i, arr) => s + (v - arr.reduce((a, b) => a + b, 0) / n) ** 2, 0) / n;
            if (totalVar > 0 && minVar / totalVar < 0.1) return 1;
            return bestPeriod > 1 ? bestPeriod : 1;
        }
    };

    // --- MODEL DEFINITIONS ---
    const MODELS = [];

    MODELS.push({
        key: "linear", name: "Linear: y = a + b·n", valid: y => y.length >= 3,
        fit: y => {
            const numObs = y.length, numParams = 2;
            const { beta, sse, yhat, R } = STATS_ENGINE.robustOls(STATS_ENGINE.makeIndexArray(numObs).map(t => [1, t]), y);
            const stderr = STATS_ENGINE.stderrFromSSE(sse, numObs, numParams);
            return {
                params: { a: beta[0], b: beta[1] }, sse, yhat, k: numParams, stderr, scale: 'linear',
                predict: t => beta[0] + beta[1] * t,
                interval: (t, z, yhatVal) => STATS_ENGINE.linearModelInterval([1, t], R, stderr, z)(yhatVal),
            };
        }
    });

    MODELS.push({
        key: "quadratic", name: "Quadratic: y = a + b·n + c·n²", valid: y => y.length >= 4,
        fit: y => {
            const numObs = y.length, numParams = 3;
            const { beta, sse, yhat, R } = STATS_ENGINE.robustOls(STATS_ENGINE.makeIndexArray(numObs).map(t => [1, t, t * t]), y);
            const stderr = STATS_ENGINE.stderrFromSSE(sse, numObs, numParams);
            return {
                params: { a: beta[0], b: beta[1], c: beta[2] }, sse, yhat, k: numParams, stderr, scale: 'linear',
                predict: t => beta[0] + beta[1] * t + beta[2] * t * t,
                interval: (t, z, yhatVal) => STATS_ENGINE.linearModelInterval([1, t, t * t], R, stderr, z)(yhatVal),
            };
        }
    });

    MODELS.push({
        key: "exp", name: "Exponential: y = A·rⁿ", valid: y => y.every(v => v > 0) && y.length >= 3,
        fit: y => {
            const numObs = y.length, numParams = 2, x = STATS_ENGINE.makeIndexArray(numObs);
            const ly = y.map(ln);
            const { beta, sse: sseLog, R } = STATS_ENGINE.robustOls(x.map(t => [1, t]), ly);
            const A = exp(beta[0]), r = exp(beta[1]);
            const yhat = x.map(t => A * pow(r, t));
            const sseLinear = STATS_ENGINE.metrics(y, yhat).sse;
            const stderr = STATS_ENGINE.stderrFromSSE(sseLinear, numObs, numParams);
            return {
                params: { A, r }, sse: sseLinear, yhat, k: numParams, stderr, scale: 'log',
                predict: t => A * pow(r, t),
                interval: (t, z, yhatVal) => {
                    if (yhatVal <= 0) return [0, 0];
                    const [lo_log, hi_log] = STATS_ENGINE.linearModelInterval([1, t], R, STATS_ENGINE.stderrFromSSE(sseLog, numObs, numParams), z)(ln(yhatVal));
                    return [exp(lo_log), exp(hi_log)];
                },
            };
        }
    });

    MODELS.push({
        key: "holts", name: "Holt's Linear Trend", valid: y => y.length >= 4,
        fit: y => {
            const numObs = y.length, numParams = 4; // l0, b0, alpha, beta
            const { intercept: initial_level, slope: initial_trend } = STATS_ENGINE.simpleLinearRegression(y.slice(0, Math.min(y.length, 10)));
            const { x: pars } = STATS_ENGINE.nelderMead(p => {
                const alpha = 1 / (1 + exp(-p[0])), beta = 1 / (1 + exp(-p[1]));
                let l = initial_level, b = initial_trend, sse = 0;
                for (let i = 0; i < numObs; i++) {
                    const yhat_i = l + b;
                    sse += (y[i] - yhat_i) ** 2;
                    const l_prev = l;
                    l = alpha * y[i] + (1 - alpha) * yhat_i;
                    b = beta * (l - l_prev) + (1 - beta) * b;
                }
                return sse;
            }, [0, 0], { maxIter: 500 });
            const alpha = 1 / (1 + exp(-pars[0])), beta = 1 / (1 + exp(-pars[1]));
            const yhat = Array(numObs);
            let l = initial_level, b = initial_trend;
            for (let i = 0; i < numObs; i++) {
                const l_prev = l;
                yhat[i] = l + b;
                l = alpha * y[i] + (1 - alpha) * yhat[i];
                b = beta * (l - l_prev) + (1 - beta) * b;
            }
            const sse = STATS_ENGINE.metrics(y, yhat).sse;
            const stderr = STATS_ENGINE.stderrFromSSE(sse, numObs, numParams);
            return {
                params: { alpha, beta, "level(end)": l, "trend(end)": b }, sse, yhat, k: numParams, stderr, scale: 'linear',
                predict: t => l + (t - numObs) * b,
                interval: (t, z, yhatVal) => {
                    const h = t - numObs;
                    const se_pred = stderr * sqrt(1 + h * (alpha * alpha + alpha * beta * h));
                    return [yhatVal - z * se_pred, yhatVal + z * se_pred];
                }
            };
        }
    });

    const holtWintersFit = (y, type = 'add') => {
        const m = STATS_ENGINE.detectSeasonality(y);
        if (m <= 1) throw new Error("No seasonality detected for Holt-Winters.");
        if (y.length < 2 * m) throw new Error(`Series too short for period ${m}.`);
        if (type === 'mul' && y.some(v => v <= 0)) throw new Error("Multiplicative model requires positive data.");

        const numObs = y.length, numParams = 3 + m;

        const initial_trend_y = y.slice(0, 2 * m);
        const { intercept: initial_level, slope: initial_trend } = STATS_ENGINE.simpleLinearRegression(initial_trend_y);
        const initial_seasonals = Array(m).fill(type === 'add' ? 0 : 1);
        for (let i = 0; i < m; i++) {
            let sum = 0, count = 0;
            for (let j = i; j < y.length; j += m) {
                const trend_val = initial_level + initial_trend * (j + 1);
                if (type === 'mul' && trend_val <= 0) continue;
                sum += (type === 'add' ? y[j] - trend_val : y[j] / trend_val);
                count++;
            }
            initial_seasonals[i] = count > 0 ? sum / count : (type === 'add' ? 0 : 1);
        }

        const { x: pars } = STATS_ENGINE.nelderMead(p => {
            const alpha = 1 / (1 + exp(-p[0]));
            const beta = 1 / (1 + exp(-p[1]));
            const gamma = 1 / (1 + exp(-p[2]));
            let l = initial_level, b = initial_trend, s = initial_seasonals.slice(), sse = 0;
            for (let i = 0; i < numObs; i++) {
                const yhat_i = type === 'add' ? (l + b + s[i % m]) : (l + b) * s[i % m];
                sse += (y[i] - yhat_i) ** 2;
                if (!isFinite(sse)) return Infinity;
                const l_prev = l;
                const y_deseasonalized = type === 'add' ? y[i] - s[i % m] : (s[i % m] !== 0 ? y[i] / s[i % m] : y[i]);
                l = alpha * y_deseasonalized + (1 - alpha) * (l + b);
                b = beta * (l - l_prev) + (1 - beta) * b;
                s[i % m] = gamma * (type === 'add' ? y[i] - l : (l !== 0 ? y[i] / l : y[i])) + (1 - gamma) * s[i % m];
            }
            return sse;
        }, [0, -2, 0], { maxIter: 500 });

        const alpha = 1 / (1 + exp(-pars[0])), beta = 1 / (1 + exp(-pars[1])), gamma = 1 / (1 + exp(-pars[2]));

        let l = initial_level, b = initial_trend, s = initial_seasonals.slice();
        const yhat = Array(numObs);
        for (let i = 0; i < numObs; i++) {
            yhat[i] = type === 'add' ? l + b + s[i % m] : (l + b) * s[i % m];
            const l_prev = l;
            const y_deseasonalized = type === 'add' ? y[i] - s[i % m] : (s[i % m] !== 0 ? y[i] / s[i % m] : y[i]);
            l = alpha * y_deseasonalized + (1 - alpha) * (l + b);
            b = beta * (l - l_prev) + (1 - beta) * b;
            s[i % m] = gamma * (type === 'add' ? y[i] - l : (l !== 0 ? y[i] / l : y[i])) + (1 - gamma) * s[i % m];
        }

        const sse = STATS_ENGINE.metrics(y, yhat).sse;
        const stderr = STATS_ENGINE.stderrFromSSE(sse, numObs, numParams);

        return {
            params: { alpha, beta, gamma, m }, sse, yhat, k: numParams, stderr, scale: 'linear',
            predict: t => {
                const h = t - numObs;
                const s_idx = (t - 1) % m;
                return type === 'add' ? l + h * b + s[s_idx] : (l + h * b) * s[s_idx];
            },
            interval: (t, z, yhatVal) => {
                const h = t - numObs;
                const se_pred = stderr * sqrt(1 + h); // Simplified interval
                return [yhatVal - z * se_pred, yhatVal + z * se_pred];
            }
        };
    };

    MODELS.push({ key: "hw_add", name: "Holt-Winters Additive", valid: y => y.length >= 10, fit: y => holtWintersFit(y, 'add') });
    MODELS.push({ key: "hw_mul", name: "Holt-Winters Multiplicative", valid: y => y.length >= 10 && y.every(v => v > 0), fit: y => holtWintersFit(y, 'mul') });


    MODELS.push({
        key: "auto_seasonal_arima", name: "Auto-SARIMA (grid search)", valid: y => y.length >= 12,
        fit: y => {
            const numObs = y.length;
            const m = STATS_ENGINE.detectSeasonality(y);
            const candidates = [];
            const p_max = 1, d_max = 1, q_max = 1, P_max = 1, D_max = 1, Q_max = 1;

            for (let d = 0; d <= d_max; d++) {
                for (let D = (m > 1 ? 0 : D_max + 1); D <= D_max; D++) {
                    if (d + D > 2) continue;
                    let y_diff = STATS_ENGINE.difference(y, d, 1);
                    if (m > 1) y_diff = STATS_ENGINE.difference(y_diff, D, m);
                    if (y_diff.length < 5) continue;
                    const meanZ = y_diff.reduce((s, v) => s + v, 0) / y_diff.length;
                    const zc = y_diff.map(v => v - meanZ);
                    for (let p = 0; p <= p_max; p++) for (let q = 0; q <= q_max; q++) {
                        for (let P = (m > 1 ? 0 : P_max + 1); P <= P_max; P++) for (let Q = (m > 1 ? 0 : Q_max + 1); Q <= Q_max; Q++) {
                            if (p === 0 && q === 0 && P === 0 && Q === 0) continue;
                            try {
                                const dim = p + q + P + Q;
                                if (dim === 0) continue;
                                const init = Array(dim).fill(0.1);
                                const obj = v => STATS_ENGINE.armaSSE(zc, v.slice(0, p), v.slice(p, p + q), v.slice(p + q, p + q + P), v.slice(p + q + P), m).sse;
                                const { x: pars } = STATS_ENGINE.nelderMead(obj, init, { maxIter: 300 });
                                const { sse } = STATS_ENGINE.armaSSE(zc, pars.slice(0, p), pars.slice(p, p + q), pars.slice(p + q, p + q + P), pars.slice(p + q + P), m);
                                const numParams = dim + 1;
                                const score = STATS_ENGINE.aicc(zc.length, sse, numParams);
                                if (Number.isFinite(score)) candidates.push({ p, d, q, P, D, Q, m, score, k: numParams });
                            } catch { }
                        }
                    }
                }
            }
            if (candidates.length === 0) throw Error("SARIMA search failed.");
            candidates.sort((a, b) => a.score - b.score);
            const best = candidates[0];

            let y_diff_final = STATS_ENGINE.difference(y, best.d, 1);
            if (best.m > 1) y_diff_final = STATS_ENGINE.difference(y_diff_final, best.D, best.m);
            const meanZ_final = y_diff_final.reduce((s, v) => s + v, 0) / y_diff_final.length;
            const zc_final = y_diff_final.map(v => v - meanZ_final);
            const dim_final = best.p + best.q + best.P + best.Q;
            const obj_final = v => STATS_ENGINE.armaSSE(zc_final, v.slice(0, best.p), v.slice(best.p, best.p + best.q), v.slice(best.p + best.q, best.p + best.q + best.P), v.slice(best.p + best.q + best.P), best.m).sse;
            const { x: final_pars } = STATS_ENGINE.nelderMead(obj_final, Array(dim_final).fill(0.1), { maxIter: 300 });

            const phi = final_pars.slice(0, best.p), theta = final_pars.slice(best.p, best.p + best.q);
            const s_phi = final_pars.slice(best.p + best.q, best.p + best.q + best.P), s_theta = final_pars.slice(best.p + best.q + best.P);

            const final_params = {};
            phi.forEach((v, i) => final_params[`φ${i + 1}`] = v);
            theta.forEach((v, i) => final_params[`θ${i + 1}`] = v);
            if (best.m > 1) {
                s_phi.forEach((v, i) => final_params[`Φ${i + 1}`] = v);
                s_theta.forEach((v, i) => final_params[`Θ${i + 1}`] = v);
            }

            const { e } = STATS_ENGINE.armaSSE(zc_final, phi, theta, s_phi, s_theta, best.m);
            const yhat_diff = zc_final.map((v, i) => v - e[i] + meanZ_final);
            const hist_len = y.length - yhat_diff.length;
            const yhat = [...y.slice(0, hist_len)];
            for (let i = 0; i < yhat_diff.length; i++) {
                let val = yhat_diff[i];
                if (best.m > 1 && best.D > 0) val += y[hist_len + i - best.m];
                if (best.d > 0) val += yhat[yhat.length - 1];
                yhat.push(val);
            }

            const sse = STATS_ENGINE.metrics(y, yhat).sse;
            const stderr = STATS_ENGINE.stderrFromSSE(sse, numObs, best.k);
            const modelName = best.m > 1 ? `SARIMA(${best.p},${best.d},${best.q})(${best.P},${best.D},${best.Q})[${best.m}]` : `ARIMA(${best.p},${best.d},${best.q})`;

            return {
                key: `sarima_${best.p}${best.d}${best.q}x${best.P}${best.D}${best.Q}_${best.m}`,
                name: modelName,
                params: final_params,
                sse, yhat, k: best.k, stderr, scale: 'linear',
                predict: t => {
                    const h = max(1, Math.round(t - numObs));
                    let y_ext = y.slice();
                    for (let step = 0; step < h; step++) {
                        let diff_series = STATS_ENGINE.difference(y_ext, best.d, 1);
                        if (best.m > 1) diff_series = STATS_ENGINE.difference(diff_series, best.D, best.m);
                        const mean_pred = diff_series.reduce((a, b) => a + b, 0) / diff_series.length;
                        const zc_pred = diff_series.map(v => v - mean_pred);
                        const { e: e_pred } = STATS_ENGINE.armaSSE(zc_pred, phi, theta, s_phi, s_theta, best.m);
                        let pred_z = mean_pred;
                        for (let i = 1; i <= best.p; i++) pred_z += phi[i - 1] * zc_pred[zc_pred.length - i];
                        for (let i = 1; i <= best.q; i++) pred_z += theta[i - 1] * e_pred[e_pred.length - i];
                        if (best.m > 1) {
                            for (let i = 1; i <= best.P; i++) pred_z += s_phi[i - 1] * zc_pred[zc_pred.length - i * best.m];
                            for (let i = 1; i <= best.Q; i++) pred_z += s_theta[i - 1] * e_pred[e_pred.length - i * best.m];
                        }
                        let next_val = pred_z;
                        if (best.m > 1 && best.D > 0) next_val += y_ext[y_ext.length - best.m];
                        if (best.d > 0) next_val += y_ext[y_ext.length - 1];
                        y_ext.push(next_val);
                    }
                    return y_ext[y_ext.length - 1];
                },
                interval: (t, z, yhatVal) => [yhatVal - z * stderr * sqrt(t - numObs), yhatVal + z * stderr * sqrt(t - numObs)]
            };
        }
    });


    // --- MAIN APPLICATION CONTROLLER ---
    const APP_CONTROLLER = {
        elements: {},
        chart: null,

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
                resetBtn: document.getElementById('resetBtn'),
                clearBtn: document.getElementById('clearBtn'),
                exportBtn: document.getElementById('exportBtn'),
                modelInfo: document.getElementById('modelInfo'),
                forecastList: document.getElementById('forecastList'),
                details: document.getElementById('details'),
                parseWarning: document.getElementById('parseWarning'),
                sequenceStream: document.getElementById('sequenceStream'),
                streamPlaceholder: document.getElementById('streamPlaceholder'),
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
                setTimeout(() => this.runAnalysis(), 100);
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
            csvContent += "Index,Type,Value,LowerBound_95,UpperBound_95\n";

            sequence.forEach((val, i) => {
                csvContent += `${i + 1},Historical,${val},,\n`;
            });

            ensembleForecast.forEach((f, i) => {
                const idx = sequence.length + i + 1;
                csvContent += `${idx},Forecast,${f.value},${f.lo},${f.hi}\n`;
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

            const allValues = [...sequence, ...ensembleForecast.map(f => f.value)];
            const maxVal = Math.max(...allValues.map(Math.abs));
            const minVal = Math.min(...allValues.map(Math.abs));
            const range = maxVal - minVal || 1;

            const getTrend = (prev, curr) => {
                if (curr > prev * 1.01) return '↗';
                if (curr < prev * 0.99) return '↘';
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
                    value: f.value,
                    type: 'forecast',
                    trend: getTrend(prev, f.value),
                    tooltip: `Predicted #${sequence.length + i + 1}\nRange: [${fmtComma(f.lo)} — ${fmtComma(f.hi)}]`,
                    delay: (sequence.length + i) * 50
                });
                container.appendChild(tile);
            });
        },

        createTile({ index, value, type, trend, tooltip, delay }) {
            const tile = document.createElement('div');
            tile.className = `stream-tile tile-${type} animate-fade-in-up copyable`;
            tile.style.animationDelay = `${delay}ms`;
            tile.dataset.copyValue = value;

            tile.innerHTML = `
                <span class="tile-index">#${index}</span>
                <span class="tile-value">${fmtComma(value)}</span>
                <span class="tile-trend">${trend}</span>
                <span class="tile-tooltip">${tooltip.replace('\n', '<br>')}</span>
            `;

            return tile;
        },

        addEventListeners() {
            this.elements.runBtn.addEventListener('click', () => this.runAnalysis());
            this.elements.demoBtn.addEventListener('click', () => this.runDemo());
            if (this.elements.clearBtn) this.elements.clearBtn.addEventListener('click', () => this.resetApp());
            if (this.elements.exportBtn) this.elements.exportBtn.addEventListener('click', () => this.exportCsv());

            document.body.addEventListener('click', (e) => this.handleCopy(e));

            this.elements.seqInput.addEventListener('blur', () => {
                const val = this.elements.seqInput.value;
                if (!val.trim()) return;
                const parts = val.split(/[^0-9.\-]+/).filter(Boolean);
                if (parts.length > 0) {
                    this.elements.seqInput.value = parts.join(', ');
                }
            });

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
            const rawInput = this.elements.seqInput.value.split(/[\s,]+/);
            const initialCount = rawInput.filter(Boolean).length;
            const sequence = rawInput.map(s => s.trim()).filter(Boolean).map(Number).filter(v => Number.isFinite(v));

            const ignoredCount = initialCount - sequence.length;
            this.elements.parseWarning.textContent = ignoredCount > 0 ? `${ignoredCount} invalid items ignored` : '';

            return sequence;
        },

        runDemo() {
            this.elements.seqInput.value = "105, 122, 141, 115, 125, 145, 120, 135, 155, 129, 140, 162, 135, 151, 170";
            this.runAnalysis();
        },

        resetApp() {
            this.elements.seqInput.value = '';
            this.elements.parseWarning.textContent = '';
            this.elements.seqInput.focus();
            this.lastResults = null;

            this.elements.sequenceStream.innerHTML = `
                <div id="streamPlaceholder" class="text-muted-foreground/40 text-sm italic text-center py-8 w-full">
                    Enter a sequence to see the magic ✨
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

        runTimeSeriesCV(model, sequence, minTrainSize) {
            let errorsSq = [];
            for (let i = minTrainSize; i < sequence.length; i++) {
                const trainData = sequence.slice(0, i);
                const trueValue = sequence[i];
                try {
                    const fit = model.fit(trainData);
                    const prediction = fit.predict(i + 1);
                    if (Number.isFinite(prediction) && Number.isFinite(trueValue)) {
                        errorsSq.push((trueValue - prediction) ** 2);
                    }
                } catch (e) { }
            }

            if (errorsSq.length < 1) return Infinity;
            const mse = errorsSq.reduce((a, b) => a + b, 0) / errorsSq.length;
            return sqrt(mse);
        },

        runAnalysis() {
            const sequence = this.parseInput();
            if (sequence.length < MIN_SEQUENCE_LENGTH) {
                return alert(`Please provide at least ${MIN_SEQUENCE_LENGTH} numbers.`);
            }
            const horizon = Math.max(1, parseInt(this.elements.horizonInput.value, 10)) || 5;

            this.setLoading(true);

            setTimeout(() => {
                try {
                    const results = this.fitAndForecast(sequence, horizon);
                    this.updateUI(results);
                } catch (e) {
                    alert(`Model fitting error: ${e.message}`);
                    console.error(e);
                } finally {
                    this.setLoading(false);
                }
            }, 50);
        },

        fitAndForecast(sequence, horizon) {
            const minTrainSize = Math.max(MIN_SEQUENCE_LENGTH - 2, Math.floor(sequence.length * 0.7));

            const scoredModels = MODELS.filter(M => {
                try { return M.valid(sequence); } catch { return false; }
            }).map(M => {
                const cvScore = this.runTimeSeriesCV(M, sequence, minTrainSize);
                return { model: M, score: cvScore };
            }).filter(item => Number.isFinite(item.score));

            if (scoredModels.length === 0) throw new Error("No models could be successfully cross-validated.");
            scoredModels.sort((a, b) => a.score - b.score);

            const fits = scoredModels.map(({ model, score }) => {
                try {
                    const fitResult = model.fit(sequence);
                    return { key: model.key, name: fitResult.name || model.name, score, ...fitResult };
                } catch { return null; }
            }).filter(Boolean);

            if (fits.length === 0) throw new Error("No valid model could be fit to the provided data.");

            const bestFit = fits[0];

            const minScore = bestFit.score > 0 ? bestFit.score : NUMERIC_TOLERANCE;
            const rawWeights = fits.map(f => exp(-2 * (f.score / minScore - 1)));
            const weightSum = rawWeights.reduce((s, v) => s + v, 0) || 1;
            const weights = rawWeights.map(w => w / weightSum);

            const numObs = sequence.length;
            const startIdx = numObs + 1;
            const ensembleForecast = [];

            for (let i = 0; i < horizon; i++) {
                const t = startIdx + i;
                const components = fits.map((f, j) => ({
                    yhat_t: f.predict(t),
                    stderr: f.stderr,
                    w: weights[j],
                }));

                const yhatEnsemble = components.reduce((s, c) => s + c.w * c.yhat_t, 0);
                const varianceFromModelError = components.reduce((s, c) => s + c.w * c.stderr ** 2, 0);
                const varianceFromModelDisagree = components.reduce((s, c) => s + c.w * (c.yhat_t - yhatEnsemble) ** 2, 0);
                const seEnsemble = sqrt(varianceFromModelError + varianceFromModelDisagree);

                ensembleForecast.push({
                    value: yhatEnsemble,
                    lo: yhatEnsemble - Z_SCORE_95 * seEnsemble,
                    hi: yhatEnsemble + Z_SCORE_95 * seEnsemble,
                });
            }

            return { sequence, fits, bestFit, weights, ensembleForecast };
        },

        updateUI({ sequence, fits, bestFit, weights, ensembleForecast }) {
            const { name, score, params } = bestFit;
            const { r2, mape } = STATS_ENGINE.metrics(sequence, bestFit.yhat);

            this.renderStream(sequence, ensembleForecast);

            const simpleName = (n) => {
                if (n.includes("Linear:")) return "Linear Trend";
                if (n.includes("Quadratic:")) return "Accelerating Trend";
                if (n.includes("Exponential:")) return "Exponential Growth";
                if (n.includes("Holt's")) return "Adaptive Trend";
                if (n.includes("Holt-Winters")) return "Seasonal Pattern";
                if (n.includes("ARIMA")) return "Advanced Pattern Analysis";
                return n;
            };

            const dispName = simpleName(name);
            const extraInfo = name.includes(":") ? name.split(':')[1].trim() : "";

            this.elements.modelInfo.innerHTML = `
        <div class="space-y-5">
            <div>
                <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Top Prediction Strategy</div>
                <div class="text-xl font-bold text-primary">${dispName}</div>
                <div class="text-xs text-muted-foreground mt-1 font-mono">${extraInfo}</div> 
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div class="bg-muted/40 p-3 rounded-lg border border-border/50">
                    <div class="text-[10px] text-muted-foreground uppercase font-semibold">Match Score</div>
                    <div class="text-2xl font-semibold text-foreground tracking-tight">${(r2 * 100).toFixed(1)}<span class="text-sm font-normal text-muted-foreground">%</span></div>
                </div>
                <div class="bg-muted/40 p-3 rounded-lg border border-border/50">
                    <div class="text-[10px] text-muted-foreground uppercase font-semibold">Avg. Error</div>
                    <div class="text-2xl font-semibold text-foreground tracking-tight">±${fmtNum(score)}</div>
                </div>
                <div class="bg-muted/40 p-3 rounded-lg border border-border/50">
                     <div class="text-[10px] text-muted-foreground uppercase font-semibold">Deviation</div>
                     <div class="text-2xl font-semibold text-foreground tracking-tight">${(100 * mape).toFixed(1)}<span class="text-sm font-normal text-muted-foreground">%</span></div>
                </div>
            </div>

             <div>
                <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Key Factors</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    ${Object.entries(params)
                    .filter(([k, v]) => Number.isFinite(v))
                    .map(([k, v]) => `
                            <div class="flex justify-between items-center bg-muted/20 px-3 py-2 rounded-md border border-border/40 copyable hover:bg-muted/40 transition-colors cursor-copy" data-copy-value="${v}" title="Click to copy">
                                <span class="font-medium text-muted-foreground">${k}</span>
                                <span class="font-mono text-xs text-foreground">${fmtNum(v)}</span>
                            </div>
                        `).join("")}
                </div>
            </div>
        </div>`;

            if (this.elements.exportBtn) this.elements.exportBtn.classList.remove('hidden');

            this.elements.forecastList.innerHTML = '';
            ensembleForecast.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = `group flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card hover:border-primary/30 hover:shadow-sm transition-all copyable cursor-copy animate-fade-in-up delay-${Math.min((index + 1) * 100, 700)}`;

                li.innerHTML = `
                    <div class="flex items-baseline gap-2">
                        <span class="text-xs text-muted-foreground font-mono w-6">#${sequence.length + index + 1}</span>
                        <span class="font-bold text-lg text-primary copyable" title="Click to copy">${fmtComma(item.value)}</span>
                    </div>
                    <div class="text-right">
                         <div class="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Likely Range</div>
                         <div class="text-xs font-mono text-muted-foreground/80 copyable" title="95% Confidence Interval">
                            [${fmtComma(item.lo)} — ${fmtComma(item.hi)}]
                         </div>
                    </div>
                `;
                this.elements.forecastList.appendChild(li);
            });

            let detailsHtml = `<table class="table w-full text-left text-xs">
          <thead><tr class='border-b text-muted-foreground'>
            <th class="py-2 pl-2">Strategy</th>
            <th class="py-2">Error Rating</th>
            <th class="py-2">Match %</th>
            <th class="py-2">Influence</th>
          </tr></thead><tbody>`;
            fits.forEach((f, i) => {
                const { r2 } = STATS_ENGINE.metrics(sequence, f.yhat);
                const weight = weights[i];
                const fDispName = simpleName(f.name);
                detailsHtml += `<tr class='border-b border-border/40 ${f.key === bestFit.key ? "bg-primary/5 font-medium" : "text-muted-foreground"}'>
            <td class="py-2 pl-2">${fDispName}</td>
            <td class="py-2">${fmtNum(f.score)}</td>
            <td class="py-2">${(r2 * 100).toFixed(1)}%</td>
            <td class="py-2">${(100 * weight).toFixed(1)}%</td>
          </tr>`;
            });
            this.elements.details.innerHTML = detailsHtml + "</tbody></table>";
        },
    };

    document.addEventListener("DOMContentLoaded", () => APP_CONTROLLER.init());
})();
