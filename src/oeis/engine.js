import { findExactPattern } from './exact.js';
import { validateInput } from './input.js';
// --- CONSTANTS ---
const ERROR_BAND_MULTIPLIER = 1.96;
const NUMERIC_TOLERANCE = 1e-12;

// --- UTILITY & FORMATTING FUNCTIONS ---
const ln = Math.log;
const exp = Math.exp;
const pow = Math.pow;
const sqrt = Math.sqrt;
const abs = Math.abs;
const min = Math.min;
const max = Math.max;

// --- STATISTICAL & LINEAR ALGEBRA ENGINE ---
const STATS_ENGINE = {
    makeIndexArray: (len) => Array.from({ length: len }, (_, i) => i + 1),
    // Apply Householder reflections directly to b: O(n p²) work and O(n p)
    // storage, instead of building an n × n orthogonal matrix on every IRLS step.
    leastSquares(A, b) {
        const R = A.map(row => row.slice()), rhs = b.slice();
        const m = A.length, p = A[0].length;
        for (let j = 0; j < p; j++) {
            const v = new Float64Array(m - j);
            let norm = 0;
            for (let i = j; i < m; i++) { v[i - j] = R[i][j]; norm = Math.hypot(norm, v[i - j]); }
            if (norm < NUMERIC_TOLERANCE) throw Error('Singular regression');
            v[0] += (v[0] >= 0 ? 1 : -1) * norm;
            let vv = 0;
            for (const value of v) vv += value * value;
            for (let k = j; k < p; k++) {
                let dot = 0;
                for (let i = j; i < m; i++) dot += v[i - j] * R[i][k];
                for (let i = j; i < m; i++) R[i][k] -= 2 * dot / vv * v[i - j];
            }
            let dot = 0;
            for (let i = j; i < m; i++) dot += v[i - j] * rhs[i];
            for (let i = j; i < m; i++) rhs[i] -= 2 * dot / vv * v[i - j];
        }
        return { beta: this.backSolve(R, rhs), R: R.slice(0, p) };
    },
    backSolve(R, b) {
        const n = R[0].length, x = Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            let sum = 0;
            for (let j = i + 1; j < n; j++) sum += R[i][j] * x[j];
            x[i] = (b[i] - sum) / R[i][i];
        }
        return x;
    },
    qrSolve(A, b) { return this.leastSquares(A, b).beta; },
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
        const { beta, R } = this.leastSquares(X_w, y_w);
        const yhat = X.map(row => row.reduce((s, v, j) => s + v * beta[j], 0));
        const resid = y.map((v, i) => v - yhat[i]);
        const sse = resid.reduce((s, r) => s + r * r, 0);
        return { beta, yhat, resid, sse, R };
    },
    stderrFromSSE: (sse, numObs, numParams) => sqrt(sse / max(1, numObs - numParams)),
    linearModelInterval: function (x_new, R_chol, stderr, z) {
        const v = Array(x_new.length).fill(0);
        for (let i = 0; i < v.length; i++) {
            let sum = 0;
            for (let j = 0; j < i; j++) sum += R_chol[j][i] * v[j];
            v[i] = (x_new[i] - sum) / R_chol[i][i];
        }
        const se_pred = stderr * sqrt(1 + v.reduce((s, val) => s + val * val, 0));
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
    metrics(y, yhat) {
        const n = y.length;
        if (!n || yhat.length !== n || yhat.some(v => !Number.isFinite(v))) return { sse: Infinity, r2: null, mape: null };
        const mean = y.reduce((s, v) => s + v / n, 0);
        let sse = 0, sst = 0, percentError = 0, nonzero = 0;
        for (let i = 0; i < n; i++) {
            sse += (y[i] - yhat[i]) ** 2;
            sst += (y[i] - mean) ** 2;
            if (y[i] !== 0) { percentError += abs((y[i] - yhat[i]) / y[i]); nonzero++; }
        }
        return { sse, r2: sst === 0 ? (sse < NUMERIC_TOLERANCE ? 1 : 0) : 1 - sse / sst,
            mape: nonzero ? percentError / nonzero : null };
    },
    simpleLinearRegression: function (y) {
        const n = y.length;
        if (n < 2) return { intercept: y[0] || 0, slope: 0 };
        const x = this.makeIndexArray(n);
        const { beta } = this.robustOls(x.map(t => [1, t]), y);
        return { intercept: beta[0], slope: beta[1] };
    },
    detectSeasonality(y) {
        const n = y.length;
        if (n < 6) return 1;
        // Remove linear drift before checking lag correlations. Require repeated
        // evidence and prefer the fundamental period to its multiples.
        const mean = y.reduce((s, v) => s + v / n, 0), center = (n - 1) / 2;
        let cov = 0, xx = 0;
        for (let i = 0; i < n; i++) { cov += (i - center) * (y[i] - mean); xx += (i - center) ** 2; }
        const slope = cov / xx;
        const residual = y.map((v, i) => v - mean - slope * (i - center));
        const variance = residual.reduce((s, v) => s + v * v, 0);
        const roundoff = Number.EPSILON * max(1, ...y.map(abs)) * n;
        if (variance <= roundoff ** 2) return 1;
        let best = 1, bestCorr = 0.6;
        for (let lag = 2; lag <= Math.floor(n / 2); lag++) {
            let dot = 0, left = 0, right = 0;
            for (let i = lag; i < n; i++) { dot += residual[i] * residual[i - lag]; left += residual[i] ** 2; right += residual[i - lag] ** 2; }
            const corr = dot / sqrt(left * right);
            if (corr > bestCorr + 0.03) { best = lag; bestCorr = corr; }
        }
        return best;
    }
};

// --- MODEL DEFINITIONS ---
const MODELS = [{ key: 'naive', name: 'Last-value baseline', valid: y => y.length >= 2,
    fit: y => {
        const yhat = y.map((v, i) => i ? y[i - 1] : v);
        const sse = STATS_ENGINE.metrics(y, yhat).sse;
        return { params: {}, yhat, sse, k: 1, stderr: sqrt(sse / (y.length - 1)), predict: () => y.at(-1) };
    } }];

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
        // Empirical smearing estimates E[exp(error)] without assuming Gaussian
        // residuals; keep quantile intervals centered on the unadjusted log fit.
        const correction = ly.reduce((sum, v, i) => sum + exp(v - beta[0] - beta[1] * x[i]) / numObs, 0);
        const A = exp(beta[0]) * correction, r = exp(beta[1]);
        const yhat = x.map(t => A * pow(r, t));
        const sseLinear = STATS_ENGINE.metrics(y, yhat).sse;
        const stderr = STATS_ENGINE.stderrFromSSE(sseLinear, numObs, numParams);
        return {
            params: { A, r }, sse: sseLinear, yhat, k: numParams, stderr, scale: 'log',
            predict: t => A * pow(r, t),
            interval: (t, z, yhatVal) => {
                if (yhatVal <= 0) return [0, 0];
                const [lo_log, hi_log] = STATS_ENGINE.linearModelInterval([1, t], R, STATS_ENGINE.stderrFromSSE(sseLog, numObs, numParams), z)(beta[0] + beta[1] * t);
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

MODELS.push({ key: "hw_add", name: "Holt-Winters Additive", valid: y => y.length >= 6, fit: y => holtWintersFit(y, 'add') });
MODELS.push({ key: "hw_mul", name: "Holt-Winters Multiplicative", valid: y => y.length >= 6 && y.every(v => v > 0), fit: y => holtWintersFit(y, 'mul') });


// Multiplicative first-order ARIMA factors. Each factor is constrained
// inside the unit circle; convolution retains seasonal cross-lag terms.
const convolve = (a, b) => {
    const out = Array(a.length + b.length - 1).fill(0);
    a.forEach((v, i) => b.forEach((w, j) => { out[i + j] += v * w; }));
    return out;
};
const factors = (ordinary, seasonal, period, ar) => {
    const a = ordinary.length ? [1, (ar ? -1 : 1) * ordinary[0]] : [1];
    const b = Array(seasonal.length ? period + 1 : 1).fill(0);
    b[0] = 1;
    if (seasonal.length) b[period] = (ar ? -1 : 1) * seasonal[0];
    return convolve(a, b);
};
function armaResiduals(z, ar, ma, scratch = new Float64Array(z.length)) {
    scratch.fill(0);
    let sse = 0;
    for (let t = 0; t < z.length; t++) {
        let pred = 0;
        for (let j = 1; j < ar.length && j <= t; j++) pred -= ar[j] * z[t - j];
        for (let j = 1; j < ma.length && j <= t; j++) pred += ma[j] * scratch[t - j];
        scratch[t] = z[t] - pred;
        sse += scratch[t] ** 2;
        if (!Number.isFinite(sse)) return { sse: Infinity, e: scratch };
    }
    return { sse, e: scratch };
}
MODELS.push({
    key: 'auto_seasonal_arima', name: 'Auto-ARIMA (bounded grid search)', valid: y => y.length >= 12,
    fit(y) {
        const detected = STATS_ENGINE.detectSeasonality(y);
        const m = y.length >= 3 * detected + 8 ? detected : 1;
        const burn = m + 2;
        let best = null;
        for (let d = 0; d <= 1; d++) for (let D = 0; D <= (m > 1 ? 1 : 0); D++) {
            const differenced = STATS_ENGINE.difference(STATS_ENGINE.difference(y, d), D, m);
            const mean = differenced.reduce((s, v) => s + v / differenced.length, 0);
            const z = differenced.map(v => v - mean);
            const offset = y.length - z.length;
            for (let p = 0; p <= 1; p++) for (let q = 0; q <= 1; q++)
            for (let P = 0; P <= (m > 1 ? 1 : 0); P++) for (let Q = 0; Q <= (m > 1 ? 1 : 0); Q++) {
                const dimension = p + q + P + Q;
                const decode = v => {
                    const c = v.map(x => 0.98 * Math.tanh(x));
                    return { ar: factors(c.slice(0, p), c.slice(p + q, p + q + P), m, true),
                        ma: factors(c.slice(p, p + q), c.slice(p + q + P), m, false), c };
                };
                const scratch = new Float64Array(z.length);
                const objective = v => { const { ar, ma } = decode(v); return armaResiduals(z, ar, ma, scratch).sse; };
                const pars = dimension ? STATS_ENGINE.nelderMead(objective, Array(dimension).fill(0.1), { maxIter: 160 }).x : [];
                const { ar, ma, c } = decode(pars);
                const { e } = armaResiduals(z, ar, ma);
                // Undo (1-B)^d (1-B^m)^D using observed history for one-step fits.
                const restore = (value, history) => {
                    if (d) value += history.at(-1);
                    if (D) value += history.at(-m);
                    if (d && D) value -= history.at(-m - 1);
                    return value;
                };
                const yhat = y.map((v, i) => i < offset ? v : restore(y[i] - (d ? y[i - 1] : 0) - (D ? y[i - m] : 0) + (d && D ? y[i - m - 1] : 0) - e[i - offset], y.slice(0, i)));
                // Common original-scale scoring window across every candidate.
                const sse = STATS_ENGINE.metrics(y.slice(burn), yhat.slice(burn)).sse;
                const k = dimension + 1 + d + D;
                const score = STATS_ENGINE.aicc(y.length - burn, sse, k);
                if (!Number.isFinite(score) || (best && score >= best.score)) continue;
                best = { ar, ma, c, e: Array.from(e), z, mean, restore, yhat, sse, k, score, d, D, p, q, P, Q };
            }
        }
        if (!best) throw Error('ARIMA search failed');
        const { ar, ma, mean, restore, d, D, p, q, P, Q } = best;
        const history = y.slice(), zHistory = best.z.slice(), residuals = best.e.slice();
        const forecasts = [];
        return {
            name: m > 1 ? `SARIMA(${p},${d},${q})(${P},${D},${Q})[${m}]` : `ARIMA(${p},${d},${q})`,
            params: { d, D, period: m, ...Object.fromEntries(best.c.map((v, i) => [`coefficient ${i + 1}`, v])) },
            yhat: best.yhat, sse: best.sse, k: best.k,
            stderr: STATS_ENGINE.stderrFromSSE(best.sse, y.length - burn, best.k),
            predict(t) {
                const h = t - y.length;
                while (forecasts.length < h) {
                    let value = 0;
                    for (let j = 1; j < ar.length; j++) value -= ar[j] * (zHistory.at(-j) ?? 0);
                    for (let j = 1; j < ma.length; j++) value += ma[j] * (residuals.at(-j) ?? 0);
                    const next = restore(value + mean, history);
                    zHistory.push(value); residuals.push(0); history.push(next); forecasts.push(next);
                }
                return forecasts[h - 1];
            }
        };
    }
});

function runTimeSeriesCV(model, sequence, minTrainSize) {
    const errors = [];
    // Same last five rolling origins for every model; an unavailable or failed
    // fold rejects the model rather than giving it an easier validation set.
    for (let i = minTrainSize; i < sequence.length; i++) {
        const train = sequence.slice(0, i);
        if (!model.valid(train)) return Infinity;
        try {
            const prediction = model.fit(train).predict(i + 1);
            if (!Number.isFinite(prediction)) return Infinity;
            errors.push((sequence[i] - prediction) ** 2);
        } catch { return Infinity; }
    }
    return sqrt(errors.reduce((a, b) => a + b, 0) / errors.length);
}

export function fitAndForecast(sequence, horizon) {
    validateInput(sequence, horizon);
    const exact = findExactPattern(sequence, horizon);
    if (exact) return exact;
    const minTrainSize = max(2, sequence.length - 5, Math.floor(sequence.length * 0.7));

    const scoredModels = MODELS.filter(M => {
        try { return M.valid(sequence); } catch { return false; }
    }).map(M => {
        const cvScore = runTimeSeriesCV(M, sequence, minTrainSize);
        return { model: M, score: cvScore };
    }).filter(item => Number.isFinite(item.score));

    if (scoredModels.length === 0) throw new Error("No models could be successfully cross-validated.");
    scoredModels.sort((a, b) => a.score - b.score);

    const fits = scoredModels.map(({ model, score }) => {
        try {
            const fitResult = model.fit(sequence);
            return { key: model.key, name: fitResult.name || model.name, score, ...fitResult };
        } catch { return null; }
    }).filter(f => f && Number.isFinite(f.sse) && Number.isFinite(f.stderr) &&
        f.yhat.every(Number.isFinite) && Array.from({ length: horizon }, (_, i) => f.predict(sequence.length + i + 1)).every(Number.isFinite));

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
        const components = fits.map((f, j) => {
            const prediction = f.predict(t);
            const bounds = f.interval?.(t, ERROR_BAND_MULTIPLIER, prediction);
            const error = bounds && bounds.every(Number.isFinite)
                ? (bounds[1] - bounds[0]) / (2 * ERROR_BAND_MULTIPLIER)
                : f.stderr * sqrt(i + 1);
            return { yhat_t: prediction, stderr: error, w: weights[j] };
        });

        const yhatEnsemble = components.reduce((s, c) => s + c.w * c.yhat_t, 0);
        const varianceFromModelError = components.reduce((s, c) => s + c.w * c.stderr ** 2, 0);
        const varianceFromModelDisagree = components.reduce((s, c) => s + c.w * (c.yhat_t - yhatEnsemble) ** 2, 0);
        const seEnsemble = sqrt(varianceFromModelError + varianceFromModelDisagree);

        ensembleForecast.push({
            value: yhatEnsemble,
            lo: yhatEnsemble - ERROR_BAND_MULTIPLIER * seEnsemble,
            hi: yhatEnsemble + ERROR_BAND_MULTIPLIER * seEnsemble,
        });
    }

    if (ensembleForecast.some(f => ![f.value, f.lo, f.hi].every(Number.isFinite))) throw Error('Forecast exceeds the supported numeric range.');
    // Functions cannot cross the worker boundary.
    const serialize = ({ predict, interval, ...fit }) => fit;
    return { sequence, fits: fits.map(serialize), bestFit: serialize(bestFit), weights, ensembleForecast, exact: false };
}

export { STATS_ENGINE, MODELS };
