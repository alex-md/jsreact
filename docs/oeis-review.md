# OEIS extrapolator review

The original review correctly identified a mismatch between sequence discovery and the page's statistical forecasting engine. Both are useful, so the page now tries exact rules first and retains forecasts for noisy data.

## Implemented

- Exact integer polynomial differencing (degree up to 8), repeating patterns, and rational linear recurrence discovery (order up to 8). Recurrences use exact Gaussian elimination over BigInt fractions instead of the supplied floating-point Berlekamp–Massey snippet. The latter is not exact and its discrepancy convention was inconsistent with its coefficient updates.
- Polynomial degrees require repeated constant differences rather than interpolation through all available points. Recurrences reserve two final terms from coefficient fitting (one for three-term inputs), require full rank, and verify every equation. Repeating patterns require two complete cycles. Discovery remains a hypothesis: finite prefixes never uniquely determine a continuation. Different matching rules can disagree later; the simplest candidate determines the displayed continuation.
- Exact forecast values travel as strings through rendering, copying, and CSV export, preserving large integers and fractions. Inputs that would lose integer precision are rejected.
- Detrended lag correlation over every period from 2 through floor(N/2), with a correlation threshold and preference for the smallest strong period. This is a heuristic, not a significance test; short/noisy series may not reveal seasonality.
- Exponential mean forecasts use empirical residual smearing rather than asserting Gaussian log errors in a robust regression. Log-space prediction limits retain their original center and are back-transformed separately. Transformation and bias-adjustment context: [Forecasting: Principles and Practice](https://otexts.com/fpp3/ftransformations.html).
- Metrics explicitly handle constant targets and divide MAPE by the count of nonzero targets. MAPE is unavailable for all-zero targets. The misleading in-sample “match score” was removed from the UI.
- ARIMA now includes the formerly unreachable nonseasonal search. First-order ordinary and seasonal AR/MA factors are independently bounded to ±0.98 and multiplied, preserving the seasonal cross terms. This guarantees stable/invertible ARMA factors for the supported orders; differenced forecasts can still grow. Corrected ordinary/seasonal differencing inversion, fixed training mean, and zero future innovations. Cached multi-step forecasts avoid recomputing every preceding horizon. Candidate scoring uses a common original-scale window. Model equations: [Seasonal ARIMA](https://otexts.com/fpp3/seasonal-arima.html).
- Every statistical candidate uses the same last one to five rolling validation origins. A failed fold rejects a candidate instead of silently skipping difficult observations. A last-value baseline ensures short finite inputs can still be forecast.
- Dedicated module worker for computation; Clear, edits, and reruns terminate pending work and prevent stale results. Inputs are limited to 200 terms and horizons to 1–50.
- Householder regression applies transformations directly to the response instead of allocating a full square Q matrix. Reused typed residual buffers in optimization. Fixed the triangular solve used for regression prediction leverage.
- Dynamic result text uses DOM nodes and `textContent`. The original numeric-only input and internal model names did not establish an exploitable XSS route, but removing these dynamic HTML interpolations makes that boundary explicit. Remaining HTML templates contain static markup only.
- Scientific notation no longer gets rewritten by a destructive blur handler. Malformed tokens produce an error rather than silently shifting sequence indices. Working CSV export now saves the latest successful results; invalidated results cannot be exported. Negative-valued trend indicators and missing copy payloads were corrected.
- Removed unsupported AI-powered and 95%-coverage claims. Statistical bands combine approximate per-model errors and model disagreement; they are not calibrated prediction intervals. One-step validation is not evidence of long-horizon coverage.

## OEIS lookup and limits

The page provides an explicit [OEIS sequence search](https://oeis.org/hints.html) link for integer inputs. It does not automatically send input to a third party, depend on cross-origin API availability, or claim a database match. Statistical fitting and rule discovery remain local.

This is bounded browser-based discovery, not a general symbolic solver or an exhaustive implementation of OEIS. It does not identify arbitrary prime, factorial, combinatorial, nonlinear, or piecewise rules. Statistical optimization remains a bounded conditional-SSE Nelder–Mead search with finite iterations; it does not guarantee a global optimum, maximum likelihood estimates, or calibrated uncertainty. Decimal inputs use floating-point statistical forecasts, while exact rule discovery applies to safe integer inputs.

## Validation

`npm run test:oeis` exercises known exact sequences, held-out rejection, large integer preservation, parsing, horizon bounds, seasonal periods, constant/zero metrics, regression leverage, exponential back-transformation, nonseasonal and seasonal ARIMA, and finite worker-serializable forecasts. `npm run build` verifies the Vite module worker bundle. Browser checks cover exact/noisy analyses, URL loading, input errors, mobile layout, cancellation, copying, and CSV download.
