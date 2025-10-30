import '@styles/global.css';
import './styles.css';
import { showToast } from '@components/toast.js';
const difficultySettings = {
    easy: {
        label: 'Easy',
        maxClues: 6,
        maxComplexity: 2,
        searchIterations: 6,
        reductionWeight: 1.5,
        complexityBias: -0.25,
        minReductionRatio: 0.15,
        allowStalls: false
    },
    medium: {
        label: 'Medium',
        maxClues: 7,
        maxComplexity: 3,
        searchIterations: 10,
        reductionWeight: 1.75,
        complexityBias: 0.1,
        minReductionRatio: 0.05,
        allowStalls: false
    },
    hard: {
        label: 'Hard',
        maxClues: 9,
        maxComplexity: 4,
        searchIterations: 16,
        reductionWeight: 2.1,
        complexityBias: 0.35,
        minReductionRatio: 0,
        allowStalls: true
    },
    extreme: {
        label: 'Extreme',
        maxClues: 11,
        maxComplexity: 5,
        searchIterations: 24,
        reductionWeight: 2.35,
        complexityBias: 0.55,
        minReductionRatio: 0,
        allowStalls: true,
        aggressive: true
    }
};
const mathCache = new Map();
function memoize(key, compute) {
    if (mathCache.has(key)) {
        return mathCache.get(key);
    }
    const value = compute();
    mathCache.set(key, value);
    return value;
}
function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i += 1) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
    }
    return function () {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        h ^= h >>> 16;
        return h >>> 0;
    };
}
function mulberry32(a) {
    return function () {
        let t = a += 0x6d2b79f5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
function createRng(seed) {
    const safeSeed = seed && seed.length ? seed : `seed-${Date.now()}`;
    return mulberry32(xmur3(safeSeed)());
}
function deriveSeed(base, label) {
    return `${base}|${label}`;
}
function randomInt(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
}
function shuffle(array, rng) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [
            copy[j],
            copy[i]
        ];
    }
    return copy;
}
function digitsOf(n) {
    return memoize(`digits:${n}`, () => n.toString().split('').map(Number));
}
function digitSum(n) {
    return memoize(`digit-sum:${n}`, () => digitsOf(n).reduce((acc, d) => acc + d, 0));
}
function digitProduct(n) {
    return memoize(`digit-product:${n}`, () => digitsOf(n).reduce((acc, d) => acc * d, 1));
}
function isPalindrome(n, base = 10) {
    return memoize(`pal:${base}:${n}`, () => {
        const repr = n.toString(base);
        return repr === repr.split('').reverse().join('');
    });
}
function isDigitsNonDecreasing(n) {
    return memoize(`digits-nondecrease:${n}`, () => {
        const digits = digitsOf(n);
        for (let i = 1; i < digits.length; i += 1) {
            if (digits[i] < digits[i - 1]) {
                return false;
            }
        }
        return true;
    });
}
function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
        [x, y] = [
            y,
            x % y
        ];
    }
    return x;
}
function lcm(a, b) {
    if (a === 0 || b === 0) return 0;
    return Math.abs(a / gcd(a, b) * b);
}
function primeFactors(n) {
    return memoize(`prime-factors:${n}`, () => {
        const factors = new Map();
        let value = n;
        while (value % 2 === 0) {
            factors.set(2, (factors.get(2) || 0) + 1);
            value /= 2;
        }
        let divisor = 3;
        while (divisor * divisor <= value) {
            while (value % divisor === 0) {
                factors.set(divisor, (factors.get(divisor) || 0) + 1);
                value /= divisor;
            }
            divisor += 2;
        }
        if (value > 1) {
            factors.set(value, (factors.get(value) || 0) + 1);
        }
        return factors;
    });
}
function isPrime(n) {
    if (n < 2) return false;
    return memoize(`prime:${n}`, () => {
        if (n === 2) return true;
        if (n % 2 === 0) return false;
        for (let i = 3; i * i <= n; i += 2) {
            if (n % i === 0) return false;
        }
        return true;
    });
}
function divisorCount(n) {
    return memoize(`divcount:${n}`, () => {
        let count = 1;
        primeFactors(n).forEach((exp) => {
            count *= exp + 1;
        });
        return count;
    });
}
function sumOfDivisors(n) {
    return memoize(`sumdiv:${n}`, () => {
        let total = 1;
        primeFactors(n).forEach((exp, prime) => {
            total *= (prime ** (exp + 1) - 1) / (prime - 1);
        });
        return total;
    });
}
function eulerTotient(n) {
    return memoize(`totient:${n}`, () => {
        let result = n;
        primeFactors(n).forEach((_, prime) => {
            result = result * (1 - 1 / prime);
        });
        return Math.round(result);
    });
}
function isAbundant(n) {
    return memoize(`abundant:${n}`, () => sumOfDivisors(n) - n > n);
}
function isPerfectSquare(n) {
    const r = Math.round(Math.sqrt(n));
    return r * r === n;
}
function isPerfectCube(n) {
    const r = Math.round(Math.cbrt(n));
    return r * r * r === n;
}
function isPerfectFourthPower(n) {
    const r = Math.round(Math.pow(n, 0.25));
    return r ** 4 === n;
}
function isPowerOfTwo(n) {
    if (n <= 0) return false;
    return (n & n - 1) === 0;
}
function isTriangular(n) {
    return memoize(`triangular:${n}`, () => {
        const d = 8 * n + 1;
        const sqrt = Math.sqrt(d);
        return Number.isInteger(sqrt) && (sqrt - 1) % 2 === 0;
    });
}
function isFibonacci(n) {
    return memoize(`fibonacci:${n}`, () => isPerfectSquare(5 * n * n + 4) || isPerfectSquare(5 * n * n - 4));
}
function describeBaseNumber(n) {
    if (isPerfectSquare(n)) return 'a perfect square';
    if (isPerfectCube(n)) return 'a perfect cube';
    if (isTriangular(n)) return 'a triangular number';
    if (isFibonacci(n)) return 'a Fibonacci number';
    if (isPrime(n)) return 'a prime number';
    if (n % 2 === 0) return 'an even number';
    return 'an odd number';
}
function describeDeltaAmount(n) {
    const descriptors = [
        {
            matches: isPowerOfTwo,
            text: 'a power of two',
            predicate: (value) => isPowerOfTwo(value)
        },
        {
            matches: isPerfectSquare,
            text: 'a perfect square',
            predicate: (value) => isPerfectSquare(value)
        },
        {
            matches: isPerfectCube,
            text: 'a perfect cube',
            predicate: (value) => isPerfectCube(value)
        },
        {
            matches: isTriangular,
            text: 'a triangular number',
            predicate: (value) => isTriangular(value)
        },
        {
            matches: isFibonacci,
            text: 'a Fibonacci number',
            predicate: (value) => isFibonacci(value)
        },
        {
            matches: isPrime,
            text: 'a prime number',
            predicate: (value) => isPrime(value)
        }
    ];
    for (const descriptor of descriptors) {
        if (descriptor.matches(n)) {
            return {
                text: descriptor.text,
                predicate: descriptor.predicate
            };
        }
    }
    if (n % 2 === 0) {
        return {
            text: 'an even number',
            predicate: (value) => value % 2 === 0
        };
    }
    return {
        text: 'an odd number',
        predicate: (value) => value % 2 === 1
    };
}
function factorialNumbersUpTo(limit) {
    return memoize(`factorials:${limit}`, () => {
        const values = new Set();
        let value = 1;
        let i = 1;
        while (value <= limit) {
            values.add(value);
            i += 1;
            value *= i;
        }
        return values;
    });
}
function catalanNumbersUpTo(limit) {
    return memoize(`catalan:${limit}`, () => {
        const values = new Set([
            1
        ]);
        let n = 1;
        let value = 1;
        while (value <= limit) {
            value = value * 2 * (2 * n - 1) / (n + 1);
            values.add(Math.round(value));
            n += 1;
            if (value > limit * 4) break;
        }
        return values;
    });
}
function bellNumbersUpTo(limit) {
    return memoize(`bell:${limit}`, () => {
        const bells = [
            1
        ];
        let n = 1;
        while (true) {
            const row = [
                bells[n - 1]
            ];
            for (let k = 1; k <= n; k += 1) {
                const value = row[k - 1] + (bells[k - 1] ?? 0);
                row.push(value);
            }
            const next = row[n];
            if (next > limit) break;
            bells.push(next);
            n += 1;
        }
        return new Set(bells);
    });
}
function sumOfProperDivisors(n) {
    return sumOfDivisors(n) - n;
}
function isPerfectNumber(n) {
    return memoize(`perfect:${n}`, () => sumOfProperDivisors(n) === n);
}
function isSphenic(n) {
    return memoize(`sphenic:${n}`, () => {
        const factors = primeFactors(n);
        if (factors.size !== 3) return false;
        for (const exp of factors.values()) {
            if (exp !== 1) {
                return false;
            }
        }
        return true;
    });
}
function isSquareFree(n) {
    return memoize(`square-free:${n}`, () => {
        const factors = primeFactors(n);
        for (const exp of factors.values()) {
            if (exp > 1) {
                return false;
            }
        }
        return true;
    });
}
function mobius(n) {
    return memoize(`mobius:${n}`, () => {
        if (n === 1) return 1;
        const factors = primeFactors(n);
        for (const exp of factors.values()) {
            if (exp > 1) {
                return 0;
            }
        }
        return factors.size % 2 === 0 ? 1 : -1;
    });
}
function describeMobius(mu) {
    if (mu === 0) {
        return '0 (not square-free)';
    }
    if (mu === 1) {
        return '1 (square-free with an even number of prime factors)';
    }
    if (mu === -1) {
        return '-1 (square-free with an odd number of prime factors)';
    }
    return `${mu}`;
}
function largestPrimeFactor(n) {
    return memoize(`largest-prime-factor:${n}`, () => {
        let largest = 1;
        primeFactors(n).forEach((_, prime) => {
            if (prime > largest) {
                largest = prime;
            }
        });
        return largest;
    });
}
function reverseNumber(n) {
    return memoize(`reverse:${n}`, () => Number(n.toString().split('').reverse().join('')));
}
function isBinaryPalindrome(n) {
    return memoize(`binary-pal:${n}`, () => {
        const representation = n.toString(2);
        return representation === representation.split('').reverse().join('');
    });
}
const digitFactorials = [
    1,
    1,
    2,
    6,
    24,
    120,
    720,
    5040,
    40320,
    362880
];
function sumOfDigitFactorials(n) {
    return memoize(`digit-factorials:${n}`, () => digitsOf(n).reduce((acc, digit) => acc + digitFactorials[digit], 0));
}
function digitsArithmeticProgressionStep(n) {
    return memoize(`digit-ap-step:${n}`, () => {
        const digits = digitsOf(n);
        if (digits.length < 3) {
            return null;
        }
        const step = digits[1] - digits[0];
        for (let i = 2; i < digits.length; i += 1) {
            if (digits[i] - digits[i - 1] !== step) {
                return null;
            }
        }
        return step;
    });
}
function isHappyNumber(n) {
    return memoize(`happy:${n}`, () => {
        const seen = new Set();
        let value = n;
        while (value !== 1 && !seen.has(value)) {
            seen.add(value);
            value = digitSum(value ** 2);
        }
        return value === 1;
    });
}
function isNarcissistic(n) {
    return memoize(`narcissistic:${n}`, () => {
        const digits = digitsOf(n);
        const power = digits.length;
        const total = digits.reduce((sum, d) => sum + d ** power, 0);
        return total === n;
    });
}
const highlyCompositeCache = new Set();
function computeHighlyCompositeUpTo(limit) {
    let maxDivisors = 0;
    for (let i = 1; i <= limit; i++) {
        const divs = divisorCount(i);
        if (divs > maxDivisors) {
            highlyCompositeCache.add(i);
            maxDivisors = divs;
        }
    }
}
function isHighlyComposite(n) {
    // Precompute up to a reasonable limit if not already done
    const LIMIT = 10000;
    if (highlyCompositeCache.size === 0) {
        computeHighlyCompositeUpTo(LIMIT);
    }
    if (n <= LIMIT) {
        return highlyCompositeCache.has(n);
    }
    // Fallback to slow method for very large n
    return memoize(`highly-composite:${n}`, () => {
        const current = divisorCount(n);
        for (let i = 1; i < n; i += 1) {
            if (divisorCount(i) >= current) {
                return false;
            }
        }
        return true;
    });
}
function binaryDigitCount(n) {
    return memoize(`binary-count:${n}`, () => n.toString(2).split('').filter((bit) => bit === '1').length);
}
function quadraticResidueRemainders(modulus) {
    return memoize(`quadratic-residues:${modulus}`, () => {
        const residues = new Set();
        for (let i = 0; i < modulus; i += 1) {
            residues.add(i * i % modulus);
        }
        return residues;
    });
}
function sumDigitsInBase(n, base) {
    return memoize(`digit-sum-base:${base}:${n}`, () => n.toString(base).split('').reduce((acc, char) => acc + parseInt(char, base), 0));
}
function binaryLength(n) {
    return memoize(`binary-length:${n}`, () => n.toString(2).length);
}
function generateCandidateRange(min, max) {
    const range = [];
    for (let i = min; i <= max; i += 1) {
        range.push(i);
    }
    return range;
}
function createClue(packId, packLabel, complexity, text, predicate, meta = {}) {
    return {
        id: `${packId}:${meta.key || text}`,
        packId,
        packLabel,
        complexity,
        text,
        predicate,
        meta
    };
}
const cluePackDefinitions = [
    {
        id: 'basic',
        label: 'Basic',
        description: 'Inequalities, parity, and modular arithmetic essentials.',
        icon: 'fa-balance-scale',
        default: true,
        factories: [
            (ctx) => {
                if (ctx.target <= ctx.min + 1) return null;
                const delta = Math.max(1, Math.floor((ctx.target - ctx.min) * (0.25 + ctx.rng() * 0.5)));
                const threshold = Math.min(ctx.target - 1, ctx.target - delta);
                if (threshold < ctx.min) return null;
                const text = `The number is greater than ${threshold}.`;
                return createClue('basic', 'Basic', 1, text, (n) => n > threshold, {
                    key: `gt-${threshold}`
                });
            },
            (ctx) => {
                if (ctx.target >= ctx.max - 1) return null;
                const delta = Math.max(1, Math.floor((ctx.max - ctx.target) * (0.25 + ctx.rng() * 0.5)));
                const threshold = Math.max(ctx.target + 1, ctx.target + delta);
                if (threshold > ctx.max) return null;
                const text = `The number is less than ${threshold}.`;
                return createClue('basic', 'Basic', 1, text, (n) => n < threshold, {
                    key: `lt-${threshold}`
                });
            },
            (ctx) => {
                const parity = ctx.target % 2 === 0 ? 'even' : 'odd';
                const text = `The number is ${parity}.`;
                return createClue('basic', 'Basic', 1, text, (n) => n % 2 === 0 === (ctx.target % 2 === 0), {
                    key: `parity-${parity}`
                });
            },
            (ctx) => {
                const moduli = [
                    3,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                    10,
                    11,
                    12
                ];
                const modulus = moduli[Math.floor(ctx.rng() * moduli.length)];
                const remainder = ctx.target % modulus;
                const text = `It is congruent to ${remainder} modulo ${modulus}.`;
                return createClue('basic', 'Basic', 2, text, (n) => n % modulus === remainder, {
                    key: `mod-${modulus}-${remainder}`
                });
            }
        ]
    },
    {
        id: 'divisibility',
        label: 'Divisibility',
        description: 'Divisibility, factors, and multiples.',
        icon: 'fa-divide',
        default: true,
        factories: [
            (ctx) => {
                const options = [
                    3,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                    11,
                    12
                ];
                const divisor = options[Math.floor(ctx.rng() * options.length)];
                if (ctx.target % divisor !== 0) return null;
                const text = `The number is divisible by ${divisor}.`;
                return createClue('divisibility', 'Divisibility', 2, text, (n) => n % divisor === 0, {
                    key: `div-${divisor}`
                });
            },
            (ctx) => {
                const exclude = [
                    3,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                    11
                ];
                const divisor = exclude[Math.floor(ctx.rng() * exclude.length)];
                if (ctx.target % divisor === 0) return null;
                const text = `It is not a multiple of ${divisor}.`;
                return createClue('divisibility', 'Divisibility', 2, text, (n) => n % divisor !== 0, {
                    key: `not-multi-${divisor}`
                });
            },
            (ctx) => {
                const factorCount = primeFactors(ctx.target).size;
                const text = `It has ${factorCount} distinct prime factor${factorCount === 1 ? '' : 's'}.`;
                return createClue('divisibility', 'Divisibility', 3, text, (n) => primeFactors(n).size === factorCount, {
                    key: `prime-factor-count-${factorCount}`
                });
            },
            (ctx) => {
                const anchors = [
                    6,
                    8,
                    9,
                    10,
                    12,
                    15,
                    18,
                    20,
                    24,
                    30,
                    36
                ];
                const anchor = anchors[Math.floor(ctx.rng() * anchors.length)];
                const value = lcm(ctx.target, anchor);
                if (value === ctx.target) return null;
                const text = `The lcm with ${anchor} equals ${value}.`;
                return createClue('divisibility', 'Divisibility', 4, text, (n) => lcm(n, anchor) === value, {
                    key: `lcm-${anchor}-${value}`
                });
            }
        ]
    },
    {
        id: 'digits',
        label: 'Digit Properties',
        description: 'Base-10 digit sums, palindromes, and monotonic digits.',
        icon: 'fa-grip-lines',
        default: true,
        factories: [
            (ctx) => {
                const sum = digitSum(ctx.target);
                const text = `The sum of its digits is ${sum}.`;
                return createClue('digits', 'Digit Properties', 2, text, (n) => digitSum(n) === sum, {
                    key: `digit-sum-${sum}`
                });
            },
            (ctx) => {
                if (!isPalindrome(ctx.target)) return null;
                const text = 'It reads the same forwards and backwards.';
                return createClue('digits', 'Digit Properties', 3, text, (n) => isPalindrome(n), {
                    key: 'palindrome'
                });
            },
            (ctx) => {
                if (!isDigitsNonDecreasing(ctx.target)) return null;
                const text = 'Its digits never decrease from left to right.';
                return createClue('digits', 'Digit Properties', 3, text, (n) => isDigitsNonDecreasing(n), {
                    key: 'nondecreasing'
                });
            },
            (ctx) => {
                const product = digitProduct(ctx.target);
                if (product === 0 || product > 1000) return null;
                const text = `The product of its digits is ${product}.`;
                return createClue('digits', 'Digit Properties', 3, text, (n) => digitProduct(n) === product, {
                    key: `digit-product-${product}`
                });
            }
        ]
    },
    {
        id: 'primes',
        label: 'Primes & Factorization',
        description: 'Prime checks, factor richness, and abundance.',
        icon: 'fa-atom',
        default: true,
        factories: [
            (ctx) => {
                if (!isPrime(ctx.target)) {
                    const text = 'The number is composite.';
                    return createClue('primes', 'Primes & Factorization', 2, text, (n) => !isPrime(n), {
                        key: 'composite'
                    });
                }
                const text = 'The number is prime.';
                return createClue('primes', 'Primes & Factorization', 3, text, (n) => isPrime(n), {
                    key: 'prime'
                });
            },
            (ctx) => {
                const totalDivisors = divisorCount(ctx.target);
                const text = `It has ${totalDivisors} total divisors.`;
                return createClue('primes', 'Primes & Factorization', 3, text, (n) => divisorCount(n) === totalDivisors, {
                    key: `div-count-${totalDivisors}`
                });
            },
            (ctx) => {
                if (isPrime(ctx.target)) return null;
                const largest = largestPrimeFactor(ctx.target);
                const text = `Its largest prime factor is ${largest}.`;
                return createClue('primes', 'Primes & Factorization', 4, text, (n) => largestPrimeFactor(n) === largest, {
                    key: `largest-prime-${largest}`
                });
            },
            (ctx) => {
                if (!isAbundant(ctx.target)) return null;
                const text = 'It is an abundant number (sum of proper divisors exceeds the number).';
                return createClue('primes', 'Primes & Factorization', 4, text, (n) => isAbundant(n), {
                    key: 'abundant'
                });
            }
        ]
    },
    {
        id: 'figurate',
        label: 'Figurate & Sequences',
        description: 'Squares, triangular numbers, Fibonacci and friends.',
        icon: 'fa-shapes',
        default: true,
        factories: [
            (ctx) => {
                if (!isPerfectSquare(ctx.target)) return null;
                const root = Math.round(Math.sqrt(ctx.target));
                const text = `It is a perfect square (${root}²).`;
                return createClue('figurate', 'Figurate & Sequences', 2, text, (n) => isPerfectSquare(n), {
                    key: 'perfect-square'
                });
            },
            (ctx) => {
                if (!isTriangular(ctx.target)) return null;
                const text = 'It is a triangular number.';
                return createClue('figurate', 'Figurate & Sequences', 3, text, (n) => isTriangular(n), {
                    key: 'triangular'
                });
            },
            (ctx) => {
                if (!isFibonacci(ctx.target)) return null;
                const text = 'It belongs to the Fibonacci sequence.';
                return createClue('figurate', 'Figurate & Sequences', 3, text, (n) => isFibonacci(n), {
                    key: 'fibonacci'
                });
            }
        ]
    },
    {
        id: 'binary',
        label: 'Binary & Bits',
        description: 'Binary weight, powers of two, and bit-length clues.',
        icon: 'fa-microchip',
        default: true,
        factories: [
            (ctx) => {
                const ones = binaryDigitCount(ctx.target);
                const text = `Its binary representation has ${ones} one${ones === 1 ? '' : 's'}.`;
                return createClue('binary', 'Binary & Bits', 3, text, (n) => binaryDigitCount(n) === ones, {
                    key: `ones-${ones}`
                });
            },
            (ctx) => {
                const length = binaryLength(ctx.target);
                const text = `It needs ${length} bit${length === 1 ? '' : 's'} in binary.`;
                return createClue('binary', 'Binary & Bits', 2, text, (n) => binaryLength(n) === length, {
                    key: `bin-length-${length}`
                });
            },
            (ctx) => {
                if (!isBinaryPalindrome(ctx.target)) return null;
                const text = 'Its binary representation is a palindrome.';
                return createClue('binary', 'Binary & Bits', 4, text, (n) => isBinaryPalindrome(n), {
                    key: 'binary-palindrome'
                });
            },
            (ctx) => {
                if ((ctx.target & ctx.target - 1) !== 0) return null;
                const text = 'It is a power of two.';
                return createClue('binary', 'Binary & Bits', 3, text, (n) => (n & n - 1) === 0, {
                    key: 'power-of-two'
                });
            }
        ]
    },
    {
        id: 'gcd',
        label: 'GCD & Residues',
        description: 'Greatest common divisors and quadratic residues.',
        icon: 'fa-project-diagram',
        default: true,
        factories: [
            (ctx) => {
                const anchors = [
                    6,
                    8,
                    9,
                    10,
                    12,
                    14,
                    18,
                    20,
                    24,
                    30
                ];
                const anchor = anchors[Math.floor(ctx.rng() * anchors.length)];
                const value = gcd(ctx.target, anchor);
                if (value === 1 && ctx.target % anchor === 0) return null;
                const text = `The gcd with ${anchor} is ${value}.`;
                return createClue('gcd', 'GCD & Residues', 3, text, (n) => gcd(n, anchor) === value, {
                    key: `gcd-${anchor}-${value}`
                });
            },
            (ctx) => {
                const moduli = [
                    7,
                    9,
                    11,
                    13,
                    17,
                    19
                ];
                const modulus = moduli[Math.floor(ctx.rng() * moduli.length)];
                const residue = ctx.target % modulus;
                if (!quadraticResidueRemainders(modulus).has(residue)) return null;
                const text = `It is a quadratic residue modulo ${modulus}.`;
                return createClue('gcd', 'GCD & Residues', 4, text, (n) => quadraticResidueRemainders(modulus).has(n % modulus), {
                    key: `qr-${modulus}-${residue}`
                });
            }
        ]
    },
    {
        id: 'polynomial',
        label: 'Polynomial & Algebraic',
        description: 'Perfect cubes, fourth powers, and algebraic identities.',
        icon: "fa-superscript",
        default: true,
        factories: [
            (ctx) => {
                if (!isPerfectCube(ctx.target)) return null;
                const root = Math.round(Math.cbrt(ctx.target));
                const text = `It is a perfect cube (${root}³).`;
                return createClue('polynomial', 'Polynomial & Algebraic', 3, text, (n) => isPerfectCube(n), {
                    key: 'cube'
                });
            },
            (ctx) => {
                if (!isPerfectFourthPower(ctx.target)) return null;
                const root = Math.round(Math.pow(ctx.target, 0.25));
                const text = `It is a perfect fourth power (${root}⁴).`;
                return createClue('polynomial', 'Polynomial & Algebraic', 4, text, (n) => isPerfectFourthPower(n), {
                    key: 'fourth-power'
                });
            },
            (ctx) => {
                const base = Math.max(ctx.min, ctx.target - randomInt(ctx.rng, 5, 20));
                const delta = ctx.target - base;
                if (delta <= 0) return null;
                const baseDescriptor = describeBaseNumber(base);
                const deltaDescriptor = describeDeltaAmount(delta);
                const text = `It exceeds ${base}, ${baseDescriptor}, by ${deltaDescriptor.text}.`;
                return createClue('polynomial', 'Polynomial & Algebraic', 2, text, (n) => n > base && deltaDescriptor.predicate(n - base), {
                    key: `affine-${base}-${delta}`
                });
            }
        ]
    },
    {
        id: 'bases',
        label: 'Base Conversions',
        description: 'Properties in alternate bases, palindromes, digit sums.',
        icon: 'fa-layer-group',
        default: true,
        expensive: true,
        factories: [
            (ctx) => {
                const base = [
                    2,
                    3,
                    4
                ][Math.floor(ctx.rng() * 3)];
                if (!isPalindrome(ctx.target, base)) return null;
                const text = `It is a palindrome in base ${base}.`;
                return createClue('bases', 'Base Conversions', 4, text, (n) => isPalindrome(n, base), {
                    key: `pal-base-${base}`
                });
            },
            (ctx) => {
                const base = 8;
                const sum = sumDigitsInBase(ctx.target, base);
                const text = `Its digits sum to ${sum} in base ${base}.`;
                return createClue('bases', 'Base Conversions', 4, text, (n) => sumDigitsInBase(n, base) === sum, {
                    key: `sum-base8-${sum}`
                });
            },
            (ctx) => {
                const base = 6;
                const representation = ctx.target.toString(base);
                const last = representation[representation.length - 1];
                const text = `In base ${base}, it ends with digit ${last}.`;
                return createClue('bases', 'Base Conversions', 3, text, (n) => n.toString(base).endsWith(last), {
                    key: `base${base}-end-${last}`
                });
            }
        ]
    },
    {
        id: 'transformations',
        label: 'Transformations & Patterns',
        description: 'Digit reversals, factorial sums, and arithmetic progressions.',
        icon: 'fa-wand-magic-sparkles',
        default: true,
        factories: [
            (ctx) => {
                const reversed = reverseNumber(ctx.target);
                if (!isPrime(reversed)) return null;
                const text = `Reversing its digits yields the prime ${reversed}.`;
                return createClue('transformations', 'Transformations & Patterns', 4, text, (n) => {
                    const reversedValue = reverseNumber(n);
                    return reversedValue === reversed && isPrime(reversedValue);
                }, {
                    key: `reverse-prime-${reversed}`
                });
            },
            (ctx) => {
                const step = digitsArithmeticProgressionStep(ctx.target);
                if (step === null) return null;
                const text = `Its digits form an arithmetic progression with step ${step}.`;
                return createClue('transformations', 'Transformations & Patterns', 4, text, (n) => digitsArithmeticProgressionStep(n) === step, {
                    key: `digit-ap-${step}`
                });
            },
            (ctx) => {
                const total = sumOfDigitFactorials(ctx.target);
                if (total > 2000000) return null;
                const text = `The sum of the factorials of its digits is ${total}.`;
                return createClue('transformations', 'Transformations & Patterns', 5, text, (n) => sumOfDigitFactorials(n) === total, {
                    key: `digit-factorials-${total}`
                });
            }
        ]
    },
    {
        id: 'combinatorial',
        label: 'Combinatorial Numbers',
        description: 'Factorials, Catalan numbers, Bell numbers.',
        icon: 'fa-sitemap',
        default: true,
        expensive: true,
        factories: [
            (ctx) => {
                if (!factorialNumbersUpTo(ctx.max).has(ctx.target)) return null;
                const text = 'It is a factorial number (n!).';
                return createClue('combinatorial', 'Combinatorial Numbers', 4, text, (n) => factorialNumbersUpTo(ctx.max).has(n), {
                    key: 'factorial'
                });
            },
            (ctx) => {
                if (!catalanNumbersUpTo(ctx.max).has(ctx.target)) return null;
                const text = 'It appears in the Catalan number sequence.';
                return createClue('combinatorial', 'Combinatorial Numbers', 4, text, (n) => catalanNumbersUpTo(ctx.max).has(n), {
                    key: 'catalan'
                });
            },
            (ctx) => {
                if (!bellNumbersUpTo(ctx.max).has(ctx.target)) return null;
                const text = 'It is one of the Bell numbers.';
                return createClue('combinatorial', 'Combinatorial Numbers', 5, text, (n) => bellNumbersUpTo(ctx.max).has(n), {
                    key: 'bell'
                });
            }
        ]
    },
    {
        id: 'rarities',
        label: 'Rare Phenomena',
        description: 'Perfect numbers, square-free values, and sphenic structure.',
        icon: 'fa-gem',
        default: true,
        expensive: true,
        factories: [
            (ctx) => {
                if (!isPerfectNumber(ctx.target)) return null;
                const text = 'It is a perfect number (equals the sum of its proper divisors).';
                return createClue('rarities', 'Rare Phenomena', 5, text, (n) => isPerfectNumber(n), {
                    key: 'perfect-number'
                });
            },
            (ctx) => {
                if (!isSphenic(ctx.target)) return null;
                const text = 'It is the product of exactly three distinct primes.';
                return createClue('rarities', 'Rare Phenomena', 4, text, (n) => isSphenic(n), {
                    key: 'sphenic'
                });
            },
            (ctx) => {
                if (!isSquareFree(ctx.target)) return null;
                const text = 'It is square-free (no prime factor appears more than once).';
                return createClue('rarities', 'Rare Phenomena', 4, text, (n) => isSquareFree(n), {
                    key: 'square-free'
                });
            }
        ]
    },
    {
        id: 'advanced',
        label: 'Advanced Number Theory',
        description: 'Totients, happy numbers, narcissistic and highly composite numbers.',
        icon: 'fa-infinity',
        default: true,
        expensive: true,
        factories: [
            (ctx) => {
                const tot = eulerTotient(ctx.target);
                const text = `Its Euler totient φ(n) equals ${tot}.`;
                return createClue('advanced', 'Advanced Number Theory', 5, text, (n) => eulerTotient(n) === tot, {
                    key: `totient-${tot}`
                });
            },
            (ctx) => {
                const value = mobius(ctx.target);
                const description = describeMobius(value);
                const text = `Its Möbius function μ(n) is ${description}.`;
                return createClue('advanced', 'Advanced Number Theory', 5, text, (n) => describeMobius(mobius(n)) === description, {
                    key: `mobius-${value}`
                });
            },
            (ctx) => {
                if (!isHappyNumber(ctx.target)) return null;
                const text = 'It is a happy number.';
                return createClue('advanced', 'Advanced Number Theory', 4, text, (n) => isHappyNumber(n), {
                    key: 'happy'
                });
            },
            (ctx) => {
                if (!isNarcissistic(ctx.target)) return null;
                const text = 'It is a narcissistic (Armstrong) number.';
                return createClue('advanced', 'Advanced Number Theory', 5, text, (n) => isNarcissistic(n), {
                    key: 'narcissistic'
                });
            },
            (ctx) => {
                if (!isHighlyComposite(ctx.target)) return null;
                const text = 'It is a highly composite number.';
                return createClue('advanced', 'Advanced Number Theory', 5, text, (n) => isHighlyComposite(n), {
                    key: 'highly-composite'
                });
            }
        ]
    }
];
const cluePackMap = new Map(cluePackDefinitions.map((pack) => [
    pack.id,
    pack
]));
const elements = {
    min: document.getElementById('min-value'),
    max: document.getElementById('max-value'),
    seed: document.getElementById('seed'),
    difficulty: document.getElementById('difficulty'),
    generate: document.getElementById('generate-button'),
    share: document.getElementById('copy-share-link'),
    deepen: document.getElementById('deepen-button'),
    rangeStats: document.getElementById('range-stats'),
    cluePackList: document.getElementById('clue-pack-list'),
    selectAll: document.getElementById('select-all-packs'),
    clearAll: document.getElementById('clear-all-packs'),
    packCountIndicator: document.getElementById('pack-count-indicator'),
    clueList: document.getElementById('clue-list'),
    clueCount: document.getElementById('clue-count'),
    copyClues: document.getElementById('copy-clues-button'),
    diagnostics: document.getElementById('diagnostics-panel'),
    status: document.getElementById('status-badge'),
    candidateDetails: document.getElementById('candidate-details'),
    warningBanner: document.getElementById('warning-banner'),
    warningText: document.getElementById('warning-text'),
    solutionCard: document.getElementById('solution-card'),
    toggleSolution: document.getElementById('toggle-solution')
};
const defaultLoadingMarkup = `
    <span class="numigma-loading">
        <span class="numigma-loading__spinner" aria-hidden="true"></span>
        <span>Generating…</span>
    </span>
`;
const generateButtons = [];
const MAX_DEEPENING_LEVEL = 3;
let lastGeneratedSettings = null;
let lastGenerationOptions = {
    depthLevel: 0
};
let lastResult = null;
let lastClueCopyText = '';
if (elements.generate) {
    registerGenerateButton(elements.generate, {
        loadingClasses: 'opacity-80 cursor-wait'
    });
}
elements.generateFloating = createFloatingGenerateButton(elements.generate);
if (elements.generateFloating) {
    registerGenerateButton(elements.generateFloating, {
        loadingClasses: 'is-loading'
    });
}
if (elements.deepen) {
    registerGenerateButton(elements.deepen, {
        loadingMarkup: defaultLoadingMarkup,
        loadingClasses: 'opacity-80 cursor-wait'
    });
    elements.deepen.classList.add('hidden');
    elements.deepen.setAttribute('aria-hidden', 'true');
    elements.deepen.disabled = true;
}
setShareAvailability(false);
function registerGenerateButton(button, options = {}) {
    if (!button) return;
    const { loadingMarkup = defaultLoadingMarkup, loadingClasses = '' } = options;
    button.dataset.defaultContent = button.innerHTML;
    button.dataset.loadingContent = loadingMarkup;
    button.dataset.loadingClasses = loadingClasses;
    generateButtons.push(button);
}
function setShareAvailability(enabled) {
    if (!elements.share) return;
    if (enabled) {
        elements.share.removeAttribute('disabled');
        elements.share.setAttribute('aria-disabled', 'false');
        elements.share.title = 'Copy a link to this puzzle';
    } else {
        elements.share.setAttribute('disabled', 'disabled');
        elements.share.setAttribute('aria-disabled', 'true');
        elements.share.title = 'Generate a puzzle first';
    }
}
function updateClueCopyState(text) {
    lastClueCopyText = text;
    if (!elements.copyClues) return;
    const hasText = Boolean(text);
    elements.copyClues.disabled = !hasText;
    elements.copyClues.setAttribute('aria-disabled', hasText ? 'false' : 'true');
    elements.copyClues.title = hasText ? 'Copy all clues to the clipboard' : 'Generate a puzzle first';
}
function getDifficultyProfile(difficultyKey, depthLevel = 0) {
    const base = difficultySettings[difficultyKey] || difficultySettings.medium;
    if (!depthLevel) {
        return base;
    }
    const profile = {
        ...base
    };
    profile.depthLevel = depthLevel;
    profile.maxClues = base.maxClues + depthLevel * 2;
    profile.searchIterations = Math.round(base.searchIterations * (1 + 0.75 * depthLevel));
    profile.maxComplexity = Math.min(6, base.maxComplexity + depthLevel);
    elements.deepen.innerHTML = markup;
}
function updateDeepenButton(result, depthLevel = 0) {
    if (!elements.deepen) return;
    const shouldOffer = result && !result.error && !result.success && result.remainingCount > 1 && depthLevel < MAX_DEEPENING_LEVEL;
    if (!shouldOffer) {
        elements.deepen.classList.add('hidden');
        elements.deepen.setAttribute('aria-hidden', 'true');
        elements.deepen.disabled = true;
        return;
    }
    const remaining = result.remainingCount;
    const attemptsLeft = MAX_DEEPENING_LEVEL - depthLevel;
    const label = attemptsLeft > 1 ? `Go deeper (${remaining.toLocaleString()} remain)` : `Final pass (${remaining.toLocaleString()} remain)`;
    const markup = `<i class="fas fa-magnifying-glass-plus"></i><span>${label}</span>`;
    elements.deepen.dataset.defaultContent = markup;
    if (!elements.deepen.classList.contains('hidden')) {
        elements.deepen.innerHTML = markup;
    } else {
        elements.deepen.innerHTML = markup;
    }
    elements.deepen.classList.remove('hidden');
    elements.deepen.removeAttribute('aria-hidden');
    elements.deepen.disabled = false;
}
let initialDepthLevel = 0;
function createFloatingGenerateButton(anchor) {
    if (typeof document === 'undefined') return null;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'floating-generate-button';
    button.className = 'floating-generate-button';
    button.setAttribute('aria-label', 'Generate new puzzle');
    button.innerHTML = '<i class="fas fa-dice"></i><span class="floating-generate-button__label">Generate puzzle</span>';
    document.body.appendChild(button);
    button.setAttribute('aria-hidden', 'true');
    if (typeof IntersectionObserver !== 'undefined' && anchor) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    button.classList.remove('is-visible');
                    button.setAttribute('aria-hidden', 'true');
                } else {
                    button.classList.add('is-visible');
                    button.removeAttribute('aria-hidden');
                }
            });
        }, {
            threshold: 0.6
        });
        observer.observe(anchor);
    } else {
        button.classList.add('is-visible');
        button.removeAttribute('aria-hidden');
    }
    return button;
}
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, function (char) {
        const esc = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return esc[char];
    });
}
const checkboxMap = new Map();
const packCardMap = new Map();
function renderCluePacks() {
    elements.cluePackList.innerHTML = '';
    checkboxMap.clear();
    packCardMap.clear();
    cluePackDefinitions.forEach((pack) => {
        const wrapper = document.createElement('label');
        wrapper.className = 'numigma-pack';
        wrapper.dataset.packId = pack.id;
        if (pack.expensive) {
            wrapper.dataset.expensive = 'true';
        }
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = pack.default;
        checkbox.dataset.packId = pack.id;
        const content = document.createElement('div');
        content.className = 'space-y-1';
        const heading = document.createElement('div');
        heading.className = 'pack-heading flex items-center gap-2 flex-wrap';
        const icon = document.createElement('i');
        icon.className = `fas ${pack.icon} text-indigo-500`;
        const title = document.createElement('span');
        title.textContent = pack.label;
        heading.append(icon, title);
        if (pack.expensive) {
            const badge = document.createElement('span');
            badge.className = 'pack-badge';
            badge.textContent = 'Advanced';
            heading.append(badge);
        }
        const description = document.createElement('p');
        description.className = "pack-description";
        description.textContent = pack.description;
        content.append(heading, description);
        wrapper.append(checkbox, content);
        elements.cluePackList.appendChild(wrapper);
        checkboxMap.set(pack.id, checkbox);
        packCardMap.set(pack.id, wrapper);
        wrapper.classList.toggle('is-active', checkbox.checked);
        checkbox.addEventListener('change', () => {
            wrapper.classList.toggle('is-active', checkbox.checked);
            updatePackCountIndicator();
            const rangeSize = updateRangeStats();
            evaluatePerformanceWarnings(rangeSize, getSelectedPacks());
        });
    });
    updatePackCountIndicator();
}
renderCluePacks();
syncPackSelectionStyles();
function syncPackSelectionStyles() {
    packCardMap.forEach((wrapper, id) => {
        const checkbox = checkboxMap.get(id);
        if (!checkbox) return;
        wrapper.classList.toggle('is-active', checkbox.checked);
    });
}
function updatePackCountIndicator() {
    if (!elements.packCountIndicator) return;
    const label = elements.packCountIndicator.querySelector('span');
    if (!label) return;
    const total = cluePackDefinitions.length;
    const selected = getSelectedPacks().length;
    label.textContent = `${selected} of ${total} packs enabled`;
}
function getSelectedPacks() {
    return Array.from(checkboxMap.entries()).filter(([, checkbox]) => checkbox.checked).map(([packId]) => packId);
}
function updateRangeStats() {
    const min = Number(elements.min.value) || 1;
    const max = Number(elements.max.value) || min + 9;
    const rangeSize = Math.max(0, max - min + 1);
    elements.rangeStats.querySelector('span').textContent = `Range size: ${rangeSize.toLocaleString()}`;
    return rangeSize;
}
function createShareUrl(settings, options = {}) {
    const url = new URL(window.location.href);
    url.searchParams.set('min', settings.min);
    url.searchParams.set('max', settings.max);
    url.searchParams.set('seed', settings.seed);
    url.searchParams.set('difficulty', settings.difficulty);
    url.searchParams.set('packs', settings.packs.join(','));
    if (options.depthLevel && options.depthLevel > 0) {
        url.searchParams.set('depth', options.depthLevel);
    } else {
        url.searchParams.delete('depth');
    }
    return url.toString();
}
function randomSeedString() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const array = new Uint32Array(8);
    if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(array);
    } else {
        for (let i = 0; i < array.length; i += 1) {
            array[i] = Math.floor(Math.random() * alphabet.length);
        }
    }
    return Array.from(array, (value) => alphabet[value % alphabet.length]).join('');
}
function setStatus(status, message) {
    const baseClasses = 'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold';
    if (status === 'success') {
        elements.status.className = `${baseClasses} bg-emerald-100 text-emerald-700 border border-transparent`;
        elements.status.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    } else if (status === 'warning') {
        elements.status.className = `${baseClasses} bg-amber-100 text-amber-700 border border-transparent`;
        elements.status.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    } else if (status === 'error') {
        elements.status.className = `${baseClasses} bg-rose-100 text-rose-700 border border-transparent`;
        elements.status.innerHTML = `<i class="fas fa-times-circle"></i> ${message}`;
    } else {
        elements.status.className = `${baseClasses} border border-gray-200 text-gray-600`;
        elements.status.textContent = message;
    }
}
function setLoading(isLoading) {
    generateButtons.forEach((button) => {
        if (!button) return;
        const loadingClasses = (button.dataset.loadingClasses || '').split(' ').map((token) => token.trim()).filter(Boolean);
        if (isLoading) {
            button.disabled = true;
            if (loadingClasses.length) {
                button.classList.add(...loadingClasses);
            }
            button.innerHTML = button.dataset.loadingContent || defaultLoadingMarkup;
        } else {
            button.disabled = false;
            if (loadingClasses.length) {
                button.classList.remove(...loadingClasses);
            }
            if (button.dataset.defaultContent) {
                button.innerHTML = button.dataset.defaultContent;
            }
        }
    });
}
function showWarning(message) {
    if (!message) {
        elements.warningBanner.classList.add('hidden');
        elements.warningText.textContent = '';
        return;
    }
    elements.warningBanner.classList.remove('hidden');
    elements.warningText.textContent = message;
}
function evaluatePerformanceWarnings(rangeSize, packs) {
    if (rangeSize > 8000 && packs.some((id) => cluePackMap.get(id)?.expensive)) {
        showWarning('Large ranges with advanced clue packs may take several seconds. Consider narrowing the range or lowering the difficulty.');
    } else if (rangeSize > 20000) {
        showWarning('Ranges above 20,000 can produce long search times. Try reducing the range for faster generation.');
    } else {
        showWarning('');
    }
}
function parseQueryParameters() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('min')) {
        elements.min.value = Number(params.get('min')) || 1;
    }
    if (params.has('max')) {
        elements.max.value = Number(params.get('max')) || 9999;
    }
    if (params.has('seed')) {
        elements.seed.value = params.get('seed');
    }
    if (params.has('difficulty')) {
        const diff = params.get('difficulty');
        if (difficultySettings[diff]) {
            elements.difficulty.value = diff;
        }
    }
    if (params.has('packs')) {
        const packIds = params.get('packs').split(',').filter(Boolean);
        checkboxMap.forEach((checkbox, id) => {
            checkbox.checked = packIds.includes(id);
        });
        syncPackSelectionStyles();
        updatePackCountIndicator();
    }
    if (params.has('depth')) {
        const depth = Number(params.get('depth'));
        if (!Number.isNaN(depth) && depth > 0) {
            initialDepthLevel = Math.min(MAX_DEEPENING_LEVEL, Math.floor(depth));
        }
    }
}
parseQueryParameters();
updateRangeStats();
elements.min.addEventListener('change', () => {
    const rangeSize = updateRangeStats();
    evaluatePerformanceWarnings(rangeSize, getSelectedPacks());
});
elements.max.addEventListener('change', () => {
    const rangeSize = updateRangeStats();
    evaluatePerformanceWarnings(rangeSize, getSelectedPacks());
});
elements.min.addEventListener('blur', () => {
    if (Number(elements.min.value) >= Number(elements.max.value)) {
        elements.max.value = Number(elements.min.value) + 9;
    }
    const rangeSize = updateRangeStats();
    evaluatePerformanceWarnings(rangeSize, getSelectedPacks());
});
elements.max.addEventListener('blur', () => {
    if (Number(elements.max.value) <= Number(elements.min.value)) {
        elements.max.value = Number(elements.min.value) + 9;
    }
    const rangeSize = updateRangeStats();
    evaluatePerformanceWarnings(rangeSize, getSelectedPacks());
});
if (elements.share) {
    elements.share.addEventListener('click', async (event) => {
        event.preventDefault();
        if (!lastGeneratedSettings) {
            showToast('Generate a puzzle first.');
            return;
        }
        try {
            await navigator.clipboard.writeText(createShareUrl(lastGeneratedSettings, lastGenerationOptions));
            showToast('Sharable link copied to clipboard!');
        } catch (error) {
            console.error(error);
            showToast('Unable to copy link to clipboard.');
        }
    });
}
if (elements.copyClues) {
    updateClueCopyState('');
    elements.copyClues.addEventListener('click', async () => {
        if (!lastClueCopyText) {
            showToast('Generate a puzzle first.');
            return;
        }
        try {
            await navigator.clipboard.writeText(lastClueCopyText);
            showToast('Clues copied to clipboard!');
        } catch (error) {
            console.error(error);
            showToast('Unable to copy clues to clipboard.');
        }
    });
}
elements.selectAll.addEventListener('click', (event) => {
    event.preventDefault();
    checkboxMap.forEach((checkbox) => {
        checkbox.checked = true;
    });
    syncPackSelectionStyles();
    updatePackCountIndicator();
    evaluatePerformanceWarnings(updateRangeStats(), getSelectedPacks());
    showToast('All clue packs enabled.');
});
elements.clearAll.addEventListener('click', (event) => {
    event.preventDefault();
    checkboxMap.forEach((checkbox) => {
        checkbox.checked = false;
    });
    syncPackSelectionStyles();
    updatePackCountIndicator();
    evaluatePerformanceWarnings(updateRangeStats(), getSelectedPacks());
    showToast('Clue packs cleared. Enable at least one to generate.');
});
if (elements.deepen) {
    elements.deepen.addEventListener('click', () => {
        handleDeepen();
    });
}
let lastSolution = null;
let solutionRevealed = false;
function collectSettings(options = {}) {
    const { autoSeed = false } = options;
    const min = Number(elements.min.value) || 1;
    const max = Number(elements.max.value) || 9999;
    if (min >= max) {
        showToast('Minimum must be less than maximum.');
        return null;
    }
    const packs = getSelectedPacks();
    if (!packs.length) {
        showToast('Enable at least one clue pack.');
        return null;
    }
    const difficulty = elements.difficulty.value;
    let seed = elements.seed.value.trim();
    if (autoSeed || !seed) {
        seed = randomSeedString();
    }
    elements.seed.value = seed;
    evaluatePerformanceWarnings(max - min + 1, packs);
    return {
        min,
        max,
        packs,
        difficulty,
        seed
    };
}
elements.toggleSolution.addEventListener('click', () => {
    if (!lastSolution) {
        showToast('Generate a puzzle first.');
        return;
    }
    solutionRevealed = !solutionRevealed;
    if (solutionRevealed) {
        elements.solutionCard.classList.add('revealed');
        elements.solutionCard.innerHTML = `<div class="space-y-2"><p class="text-sm text-slate-200">Secret number</p><p class="solution-value">${lastSolution}</p></div>`;
        elements.toggleSolution.textContent = 'Hide';
    } else {
        elements.solutionCard.classList.remove('revealed');
        elements.solutionCard.innerHTML = '<p class="text-sm text-slate-300">Solution hidden. Click reveal to view the secret number.</p>';
        elements.toggleSolution.textContent = 'Reveal';
    }
});
function buildClueLibrary(settings, target) {
    const librarySeed = deriveSeed(settings.seed, 'library');
    const rng = createRng(librarySeed);
    const context = {
        min: settings.min,
        max: settings.max,
        target,
        rng,
        randomInt: (min, max) => randomInt(rng, min, max)
    };
    const clues = [];
    settings.packs.forEach((packId) => {
        const pack = cluePackMap.get(packId);
        if (!pack) return;
        pack.factories.forEach((factory) => {
            try {
                const result = factory(context);
                if (Array.isArray(result)) {
                    result.filter(Boolean).forEach((clue) => clues.push(clue));
                } else if (result) {
                    clues.push(result);
                }
            } catch (error) {
                console.warn(`Failed to build clue from pack ${packId}`, error);
            }
        });
    });
    return clues;
}
function scoreClueApplication(clue, currentCandidates, filteredCandidates, difficulty) {
    const reduction = currentCandidates.length - filteredCandidates.length;
    const ratio = filteredCandidates.length / currentCandidates.length;
    const complexityBias = clue.complexity * difficulty.complexityBias;
    const reductionScore = reduction * difficulty.reductionWeight;
    const coverageScore = (1 - ratio) * 1.6;
    return reductionScore + coverageScore + complexityBias;
}
function applyClue(clue, candidates) {
    const filtered = [];
    for (let i = 0; i < candidates.length; i += 1) {
        const value = candidates[i];
        if (clue.predicate(value)) {
            filtered.push(value);
        }
    }
    return filtered;
}
function attemptPuzzle(settings, target, library, attemptIndex, difficulty) {
    const attemptSeed = deriveSeed(settings.seed, `attempt:${attemptIndex}`);
    const rng = createRng(attemptSeed);
    let candidates = generateCandidateRange(settings.min, settings.max);
    let available = shuffle(library.filter((clue) => clue.complexity <= difficulty.maxComplexity), rng);
    const steps = [];
    let stagnation = 0;
    while (candidates.length > 1 && steps.length < difficulty.maxClues && available.length) {
        let bestChoice = null;
        let bestFiltered = null;
        let bestIndex = -1;
        let bestScore = -Infinity;
        for (let i = 0; i < available.length; i += 1) {
            const clue = available[i];
            const filtered = applyClue(clue, candidates);
            if (!filtered.length || !filtered.includes(target)) {
                continue;
            }
            const reduction = candidates.length - filtered.length;
            if (reduction === 0 && !difficulty.allowStalls) {
                continue;
            }
            const reductionRatio = reduction / candidates.length;
            if (reductionRatio < difficulty.minReductionRatio && reduction > 0 && candidates.length > 8) {
                continue;
            }
            const score = scoreClueApplication(clue, candidates, filtered, difficulty) + (rng() - 0.5) * 0.08;
            if (score > bestScore) {
                bestScore = score;
                bestChoice = clue;
                bestFiltered = filtered;
                bestIndex = i;
            }
        }
        if (!bestChoice) {
            stagnation += 1;
            if (stagnation > 2) {
                break;
            }
            available = shuffle(available, rng);
            continue;
        }
        stagnation = 0;
        const previousSize = candidates.length;
        candidates = bestFiltered;
        const reduction = previousSize - candidates.length;
        const coverage = candidates.length / previousSize;
        const preview = candidates.slice(0, Math.min(6, candidates.length));
        steps.push({
            clue: bestChoice,
            remaining: candidates.length,
            reduction,
            coverage,
            preview
        });
        available.splice(bestIndex, 1);
    }
    if (difficulty.aggressive && candidates.length > 1 && steps.length < difficulty.maxClues) {
        const remaining = available.slice(0, 6);
        for (let i = 0; i < remaining.length && steps.length < difficulty.maxClues; i += 1) {
            const clue = remaining[i];
            const filtered = applyClue(clue, candidates);
            if (!filtered.includes(target)) continue;
            if (filtered.length === candidates.length) continue;
            const reduction = candidates.length - filtered.length;
            if (reduction <= 0) continue;
            candidates = filtered;
            steps.push({
                clue,
                remaining: candidates.length,
                reduction,
                coverage: candidates.length / (candidates.length + reduction),
                preview: candidates.slice(0, Math.min(6, candidates.length))
            });
        }
    }
    return {
        success: candidates.length === 1 && candidates[0] === target,
        target,
        steps,
        finalCandidates: candidates,
        remainingCount: candidates.length,
        totalCandidates: settings.max - settings.min + 1,
        librarySize: library.length,
        usedClues: steps.length
    };
}
function chooseBestAttempt(currentBest, candidate) {
    if (!currentBest) return candidate;
    if (candidate.success && !currentBest.success) return candidate;
    if (candidate.success && currentBest.success) {
        if (candidate.usedClues < currentBest.usedClues) return candidate;
        if (candidate.usedClues === currentBest.usedClues && candidate.remainingCount < currentBest.remainingCount) return candidate;
        return currentBest;
    }
    if (!candidate.success && !currentBest.success) {
        if (candidate.remainingCount < currentBest.remainingCount) return candidate;
    }
    return currentBest;
}
function generatePuzzle(settings, options = {}) {
    const depthLevel = options.depthLevel ? Math.min(MAX_DEEPENING_LEVEL, Math.max(0, Math.floor(options.depthLevel))) : 0;
    const difficultyProfile = getDifficultyProfile(settings.difficulty, depthLevel);
    const targetSeed = deriveSeed(settings.seed, 'target');
    const rng = createRng(targetSeed);
    const target = randomInt(rng, settings.min, settings.max);
    const library = buildClueLibrary(settings, target);
    if (!library.length) {
        return {
            error: 'No valid clues available for the chosen packs and range. Try enabling more packs or changing the range.',
            target,
            steps: [],
            finalCandidates: [
                target
            ],
            remainingCount: settings.max - settings.min + 1,
            librarySize: 0,
            usedClues: 0,
            totalCandidates: settings.max - settings.min + 1,
            success: false,
            settings,
            difficultyProfile,
            depthLevel
        };
    }
    let bestAttempt = null;
    let attempts = 0;
    for (let attempt = 0; attempt < difficultyProfile.searchIterations; attempt += 1) {
        attempts += 1;
        const result = attemptPuzzle(settings, target, library, attempt, difficultyProfile);
        bestAttempt = chooseBestAttempt(bestAttempt, result);
        if (bestAttempt && bestAttempt.success) {
            break;
        }
    }
    return {
        ...bestAttempt,
        target,
        attempts,
        librarySize: library.length,
        settings,
        difficultyProfile,
        depthLevel
    };
}
function formatCandidatePreview(list) {
    if (!list.length) return '—';
    if (list.length <= 6) {
        return list.join(', ');
    }
    const head = list.slice(0, 5).join(', ');
    return `${head}, … (${list.length} remaining)`;
}
function renderClueCards(result) {
    elements.clueList.innerHTML = '';
    if (!result.steps.length) {
        updateClueCopyState('');
        const message = document.createElement('p');
        message.className = 'text-sm text-gray-500';
        message.textContent = 'No usable clues were assembled. Try widening the range or enabling additional packs.';
        elements.clueList.appendChild(message);
        elements.clueCount.textContent = '0 clues';
        return;
    }
    const fragment = document.createDocumentFragment();
    result.steps.forEach((step, index) => {
        const card = document.createElement('article');
        card.className = 'clue-card';
        const badge = document.createElement('span');
        badge.className = 'clue-pack';
        badge.innerHTML = `<i class="fas fa-lightbulb"></i> ${step.clue.packLabel}`;
        const heading = document.createElement('div');
        heading.className = 'text-xs uppercase tracking-wide text-gray-500';
        heading.textContent = `Clue ${index + 1}`;
        const body = document.createElement('p');
        body.className = 'clue-body';
        body.textContent = step.clue.text;
        const meta = document.createElement('div');
        meta.className = 'clue-meta';
        meta.innerHTML = `
            <span><i class="fas fa-layer-group"></i> Complexity ${step.clue.complexity}</span>
            <span><i class="fas fa-filter"></i> Remaining ${step.remaining}</span>
            <span><i class="fas fa-percentage"></i> Coverage ${(100 - step.coverage * 100).toFixed(1)}% reduction</span>
        `;
        card.append(heading, badge, body, meta);
        fragment.appendChild(card);
    });
    elements.clueList.appendChild(fragment);
    updateClueCopyState(result.steps.map((step, index) => `Clue ${index + 1}: ${step.clue.text}`).join('\n'));
    const profile = result.difficultyProfile || (result.settings ? difficultySettings[result.settings.difficulty] : null);
    const clueCap = profile?.maxClues ?? result.steps.length;
    const depthSuffix = result.depthLevel ? ` • deep +${result.depthLevel}` : '';
    elements.clueCount.textContent = `${result.steps.length} clue${result.steps.length === 1 ? '' : 's'} (max ${clueCap}${depthSuffix})`;
}
function renderCandidateTimeline(result) {
    elements.candidateDetails.innerHTML = '';
    if (!result.steps.length) {
        elements.candidateDetails.innerHTML = '<p>No candidate reduction steps to display.</p>';
        return;
    }
    const fragment = document.createDocumentFragment();
    let previous = result.totalCandidates;
    result.steps.forEach((step, index) => {
        const row = document.createElement('div');
        row.className = 'step-row';
        row.innerHTML = `
            <strong>After clue ${index + 1}</strong>
            <div>${step.clue.text}</div>
            <div class="step-meta">
                <span><i class="fas fa-users"></i> Candidates: ${step.remaining}</span>
                <span><i class="fas fa-arrow-trend-down"></i> Removed: ${previous - step.remaining}</span>
                <span style="display:none;">
  <i class="fas fa-list"></i> Preview: ${formatCandidatePreview(step.preview)}
</span>
            </div>
        `;
        fragment.appendChild(row);
        previous = step.remaining;
    });
    if (result.remainingCount > 1) {
        const unresolved = document.createElement('div');
        unresolved.className = 'step-row';
        unresolved.innerHTML = `
            <strong>Remaining candidates</strong>
            <div class="step-meta">
                <span><i class="fas fa-list-ol"></i> ${result.finalCandidates.slice(0, 10).join(', ')}${result.finalCandidates.length > 10 ? ', …' : ''}</span>
            </div>
        `;
        fragment.appendChild(unresolved);
    }
    elements.candidateDetails.appendChild(fragment);
}
function renderDiagnostics(result) {
    const settings = result.settings || lastGeneratedSettings;
    const baseDifficulty = settings ? difficultySettings[settings.difficulty] : null;
    const profile = result.difficultyProfile || baseDifficulty;
    const rows = [];
    if (settings) {
        rows.push(`<div class="diagnostic-row"><span>Range</span><strong>${settings.min} – ${settings.max}</strong></div>`);
        if (baseDifficulty) {
            rows.push(`<div class="diagnostic-row"><span>Difficulty</span><strong>${baseDifficulty.label}</strong></div>`);
        }
    }
    rows.push(`<div class="diagnostic-row"><span>Total candidates</span><strong>${result.totalCandidates.toLocaleString()}</strong></div>`);
    rows.push(`<div class="diagnostic-row"><span>Clue library size</span><strong>${result.librarySize}</strong></div>`);
    rows.push(`<div class="diagnostic-row"><span>Search attempts</span><strong>${result.attempts}</strong></div>`);
    rows.push(`<div class="diagnostic-row"><span>Remaining candidates</span><strong>${result.remainingCount}</strong></div>`);
    if (profile) {
        rows.push(`<div class="diagnostic-row"><span>Clue budget</span><strong>${profile.maxClues}</strong></div>`);
        if (profile.depthLevel) {
            rows.push(`<div class="diagnostic-row"><span>Search depth</span><strong>Deep +${profile.depthLevel}</strong></div>`);
        }
    }
    const diagnostics = document.createElement('div');
    diagnostics.className = 'diagnostics-grid';
    diagnostics.innerHTML = rows.join('');
    elements.diagnostics.innerHTML = '';
    elements.diagnostics.appendChild(diagnostics);
    if (!result.success) {
        const note = document.createElement('p');
        note.className = 'text-xs text-amber-600';
        if ((result.depthLevel || 0) < MAX_DEEPENING_LEVEL) {
            note.textContent = 'No unique solution was located yet. Consider expanding the clue pool, narrowing the range, or using "Go deeper" to add more clues.';
        } else {
            note.textContent = 'No unique solution was located. Consider adjusting the difficulty, expanding the clue pool, or narrowing the range.';
        }
        elements.diagnostics.appendChild(note);
    }
}
function renderSolution(result) {
    lastSolution = result.target;
    solutionRevealed = false;
    elements.solutionCard.classList.remove('revealed');
    elements.solutionCard.innerHTML = '<p class="text-sm text-slate-300">Solution hidden. Click reveal to view the secret number.</p>';
    elements.toggleSolution.textContent = 'Reveal';
}
function renderPuzzle(result) {
    if (result.error) {
        setStatus('error', 'Generation failed');
        elements.clueList.innerHTML = `<p class="text-sm text-rose-600">${result.error}</p>`;
        elements.candidateDetails.innerHTML = '<p>Unable to compute candidate reductions.</p>';
        elements.diagnostics.innerHTML = '<p class="text-sm text-gray-500">No diagnostics available.</p>';
        lastSolution = null;
        lastResult = null;
        updateClueCopyState('');
        updateDeepenButton(null, 0);
        return;
    }
    lastResult = result;
    const depthLevel = result.depthLevel || 0;
    renderClueCards(result);
    renderCandidateTimeline(result);
    renderDiagnostics(result);
    renderSolution(result);
    if (result.success) {
        const successLabel = depthLevel ? 'Unique solution locked with deep search' : 'Unique solution located';
        setStatus('success', successLabel);
    } else if (result.remainingCount <= 5) {
        setStatus('warning', 'Near-unique solution');
    } else {
        setStatus('warning', 'Multiple candidates remain');
    }
    updateDeepenButton(result, depthLevel);
}
async function handleGenerate(options = {}) {
    const { autoSeed = false, depthLevel = 0, silent = false } = options;
    const settings = collectSettings({
        autoSeed
    });
    if (!settings) return;
    lastGenerationOptions = {
        depthLevel
    };
    setLoading(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const result = generatePuzzle(settings, {
        depthLevel
    });
    if (!result.error) {
        lastGeneratedSettings = {
            ...settings,
            packs: [
                ...settings.packs
            ]
        };
        lastGenerationOptions = {
            depthLevel
        };
        setShareAvailability(true);
    } else if (!lastGeneratedSettings) {
        setShareAvailability(false);
    }
    renderPuzzle(result);
    if (!silent && depthLevel > 0 && !result.error) {
        if (result.success) {
            showToast('Deep search found a unique solution.');
        } else {
            showToast('Added more clues, but multiple candidates remain.');
        }
    }
    setLoading(false);
}
async function handleDeepen() {
    if (!lastGeneratedSettings || !lastResult) {
        showToast('Generate a puzzle first.');
        return;
    }
    const currentDepth = lastGenerationOptions?.depthLevel || 0;
    if (currentDepth >= MAX_DEEPENING_LEVEL) {
        showToast('Deep search already reached its limit.');
        return;
    }
    const settings = {
        ...lastGeneratedSettings,
        packs: [
            ...lastGeneratedSettings.packs
        ]
    };
    elements.seed.value = settings.seed;
    setLoading(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const nextDepthLevel = currentDepth + 1;
    const result = generatePuzzle(settings, {
        depthLevel: nextDepthLevel
    });
    if (!result.error) {
        lastGeneratedSettings = {
            ...settings,
            packs: [
                ...settings.packs
            ]
        };
        lastGenerationOptions = {
            depthLevel: nextDepthLevel
        };
        setShareAvailability(true);
    } else if (!lastGeneratedSettings) {
        setShareAvailability(false);
    }
    renderPuzzle(result);
    if (!result.error) {
        if (result.success) {
            showToast('Additional clues secured a unique solution.');
        } else if (nextDepthLevel >= MAX_DEEPENING_LEVEL) {
            showToast('Deep search exhausted without finding a unique solution. Try adjusting the configuration.');
        } else {
            showToast('Added more clues, but multiple candidates remain.');
        }
    } else {
        showToast('Deep search could not refine this puzzle.');
    }
    setLoading(false);
}
generateButtons.forEach((button) => {
    button.addEventListener('click', () => {
        handleGenerate({
            autoSeed: true
        });
    });
});
evaluatePerformanceWarnings(updateRangeStats(), getSelectedPacks());
const autoParams = new URLSearchParams(window.location.search);
if (autoParams.has('seed') && autoParams.get('autoplay') !== '0') {
    setTimeout(() => {
        handleGenerate({
            autoSeed: false,
            depthLevel: initialDepthLevel,
            silent: true
        });
    }, 120);
}
