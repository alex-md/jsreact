import { randomInt } from './random.js';
import {
    digitSum,
    digitProduct,
    isPalindrome,
    isDigitsNonDecreasing,
    gcd,
    lcm,
    primeFactors,
    isPrime,
    divisorCount,
    eulerTotient,
    isAbundant,
    isPerfectSquare,
    isPerfectCube,
    isPerfectFourthPower,
    isTriangular,
    isFibonacci,
    describeBaseNumber,
    describeDeltaAmount,
    factorialNumbersUpTo,
    catalanNumbersUpTo,
    bellNumbersUpTo,
    isPerfectNumber,
    isSphenic,
    isSquareFree,
    mobius,
    describeMobius,
    largestPrimeFactor,
    reverseNumber,
    isBinaryPalindrome,
    sumOfDigitFactorials,
    digitsArithmeticProgressionStep,
    isHappyNumber,
    isNarcissistic,
    isHighlyComposite,
    binaryDigitCount,
    quadraticResidueRemainders,
    sumDigitsInBase,
    binaryLength
} from './math.js';

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

export { cluePackDefinitions, cluePackMap };
