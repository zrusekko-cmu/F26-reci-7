import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// A first attempt at a generator. It has a problem: run the tests and read
// the counterexample.
const point = fc.integer({ min: -20, max: 20 });
const interval: fc.Arbitrary<Interval> = fc.tuple(point, point).map(([a, b]) => (a <= b ? [a, b] : [b, a]));
const intervalList = fc.array(interval, { maxLength: 10 });

const covered = (xs: readonly Interval[], p: number) => xs.some(([s, e]) => s <= p && p <= e);

// Targeted generator for the already-disjoint input conditional property. 
const disjointSorted: fc.Arbitrary<Interval[]> = fc
  .tuple(
    point,
    fc.array(fc.tuple(fc.integer({ min: 1, max: 5 }), fc.nat(5)), { maxLength: 8 }),
  )
  .map(([initialStart, gapAndLengthPairs]) => {
    const intervals: Interval[] = [];
    let previousEnd = initialStart;

    gapAndLengthPairs.forEach(([gap, length], index) => {
      const start = index === 0 ? previousEnd : previousEnd + gap;
      intervals.push([start, start + length]);
      previousEnd = start + length;
    });

    return intervals;
  });

describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

  // Add your properties here. Aim for at least one of each pattern:
  // invariant, algebraic, metamorphic, differential, conditional.

  // Pattern: invariant. The output is sorted and disjoint, and the input is not modified.
  it('output is sorted and disjoint, input not modified', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const copy = xs.map(([s, e]) => [s, e]);
        const output = mergeIntervals(xs);
        expect(xs).toEqual(copy);
        for (let index = 0; index + 1 < output.length; index++) {
          expect(output[index][1]).toBeLessThan(output[index + 1][0]);
        }
      }),
    );
  });

  // Pattern: algebraic. Merging an already-merged list modifies nothing.
  it('does not modify already-merged intervals', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const output = mergeIntervals(xs);
        expect(mergeIntervals(output)).toEqual(output);
      }),
    );
  });

  // Pattern: metamorphic. Reordering the input does not change the output.
  it('output the same merged intervals regardless of input order', () => {
    fc.assert(
      fc.property(
        intervalList.chain(xs =>
          fc.tuple(fc.constant(xs), fc.shuffledSubarray(xs, { minLength: xs.length, maxLength: xs.length })),
        ),
        ([xs, ys]) => {
          expect(mergeIntervals(ys)).toEqual(mergeIntervals(xs));
        },
      ),
    );
  });

  // Pattern: differential. Merging combines overlapping intervals without adding or losing covered points.
  it('does not add or lose covered points', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const output = mergeIntervals(xs);
        for (let pointIndex = -50; pointIndex <= 70; pointIndex++) {
          const point = pointIndex / 2;
          expect(covered(output, point)).toBe(covered(xs, point));
        }
      }),
    );
  });

  // Pattern: conditional. Merging already-disjoint input does not modify it.
  it('already-disjoint input is not modified', () => {
    fc.assert(
      fc.property(disjointSorted, xs => {
        expect(mergeIntervals(xs)).toEqual(xs);
      }),
    );
  });
});
