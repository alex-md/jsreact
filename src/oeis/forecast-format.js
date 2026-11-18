// Round statistical outputs for presentation/copy/export, while preserving the
// engine's full precision and exact integer/fraction strings from rule discovery.
export function forecastValue(value, significantDigits = null) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (!Number.isFinite(value)) throw new Error('Cannot format a nonfinite forecast');
    const rounded = significantDigits ? Number(value.toPrecision(significantDigits)) : Math.round(value);
    return Number.isInteger(rounded) ? BigInt(rounded).toString() : String(rounded);
}

export function formatForecast(value, significantDigits = null) {
    const text = forecastValue(value, significantDigits);
    return /^-?\d+$/.test(text) ? BigInt(text).toLocaleString('en-US') : text;
}
