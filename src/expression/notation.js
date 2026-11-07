const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2, '**': 4 };

export function numberNotation(value) {
    return { expression: String(value), precedence: value < 0 ? 3 : 5 };
}

export function binaryNotation(left, right, operator) {
    const precedence = PRECEDENCE[operator];
    const leftNeedsGroup = left.precedence < precedence
        || (operator === '**' && left.precedence === precedence);
    const rightNeedsGroup = right.precedence < precedence
        || (right.precedence === precedence && (operator === '-' || operator === '/'))
        || (operator === '*' && right.operator === '/')
        || right.precedence === 3; // Make negative operands explicit.
    const a = leftNeedsGroup ? `(${left.expression})` : left.expression;
    const b = rightNeedsGroup ? `(${right.expression})` : right.expression;
    return { expression: `${a} ${operator} ${b}`, precedence, operator };
}
