import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Step 1: a generator for five-letter uppercase words.
// const word = ...

const wordFrom = (letters: string) =>
  fc.array(fc.constantFrom(...letters), { minLength: 5, maxLength: 5 }).map(cs => cs.join(''));

const word = fc.oneof(wordFrom('ABC'), wordFrom(ALPHABET));

describe('matchGuess', () => {

  // Pattern: invariant. The result always have exactly five colors.
  it('returns exactly five colors', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        expect(matchGuess(secret, guess)).toHaveLength(5);
      }),
    );
  });

  // Pattern: invariant. Every color is G, Y, or B.
  it('only uses the colors G, Y, B', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        for (const c of matchGuess(secret, guess)) expect(['G', 'Y', 'B']).toContain(c);
      }),
    );
  });

  // Pattern: conditional. Guessing the secret gives all greens.
  it('guessing the secret gives all greens', () => {
    fc.assert(
      fc.property(word, w => {
        expect(matchGuess(w, w)).toEqual(['G', 'G', 'G', 'G', 'G']);
      }),
    );
  });
  

  // Pattern: invariant. A letter is never credited more times than the secret contains it.
  it('never credits a letter more times than the secret contains it', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const result = matchGuess(secret, guess);
        for (const letter of new Set(guess)) {
          const credited = [...guess].filter((c, i) => c === letter && result[i] !== 'B').length;
          const inSecret = [...secret].filter(c => c === letter).length;
          expect(credited).toBeLessThanOrEqual(inSecret);
        }
      }),
    );
  });

  // Pattern: invariant. A position is green exactly when guess and secret have the same letter there.
  it('green exactly where letters match in place for guess and secret', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        for (let index = 0; index < 5; index++) {
          expect(matchGuess(secret, guess)[index] === 'G').toBe(guess[index] === secret[index]);
        }
      }),
    );
  });

  // Pattern: conditional. If the guess is a rearrangement of the secret, no square is black.
  it('an anagram of the secret has no black squares', () => {
    fc.assert(
      fc.property(
        word.chain(secret =>
          fc.tuple(
            fc.constant(secret),
            fc
              .shuffledSubarray([...secret], { minLength: 5, maxLength: 5 })
              .map(letters => letters.join('')),
          ),
        ),
        ([secret, guess]) => {
          expect(matchGuess(secret, guess)).not.toContain('B');
        },
      ),
    );
  });

  // Pattern: metamorphic. Applying the same one-to-one letter substitution to both words preserves the result.
  it('preserves the result when letters are consistently substituted', () => {
    fc.assert(
      fc.property(
        word,
        word,
        fc.shuffledSubarray([...ALPHABET], { minLength: 26, maxLength: 26 }),
        (secret, guess, letterMapping) => {
          const substituteLetters = (word: string) =>
            [...word]
              .map(letter => letterMapping[ALPHABET.indexOf(letter)])
              .join('');

          expect(
            matchGuess(substituteLetters(secret), substituteLetters(guess)),
          ).toEqual(matchGuess(secret, guess));
        },
      ),
    );
  });
});
