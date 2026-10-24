# Reflection

**Name / Andrew ID:** Zdenek Rusek Kotva / zrusekko

**Recitation group members (Task 2):** Lynsey Li, Ethan Tao, and Tiffany Liu (LETZ)

---

### 1. Valid but weak

Pick a property you wrote that passes on the correct implementation but
kills few or no mutants. Why is it still a *valid* property? Describe a
concrete bug (not one of our mutants) that it *would* catch.

My property "returns exactly five colors" passes on the correct implementation but kills almost nothing: every public Wordle mutant still returns a five-element array, so the length never differs. It is still a valid property because the specification says matchGuess returns five colors, one per position of the guess, so any correct implementation must satisfy it. It would catch a bug that is not in our mutant list, for example an off-by-one loop (`i < 4`) that scores only the first four positions and returns a four-element array, or a version that skips green positions when building the result.

### 2. A generator problem, not a property problem

Describe a mutant, from either task, that survived or was flaky because of
your **generator** rather than your property. What did the generator fail to
produce? How did you fix it? Paste the runner output from before and after.

My starter generator `fc.tuple(fc.integer(), fc.integer())` failed on the correct implementation, not on a mutant, because it could produce intervals with start > end, which break the specification's precondition and make mergeIntervals throw a RangeError. The generator failed to produce only valid intervals, so the runner reported a false alarm instead of testing the property. I fixed it by building intervals that are valid by construction (swapping the endpoints so start <= end, with no .filter or fc.pre), and later drew endpoints from a small range so that touching and nearly touching intervals show up often.

### 3. Reading a counterexample

Paste one counterexample that the mutation runner printed for a killed
mutant. In 2–3 sentences, explain using the *specification* why that input
exposes the bug.

### 4. Your project

Name one function or module in your team's project that would benefit from
property-based testing. State two properties in English, name the pattern of
each, and describe the generator you'd need, including anything about its
inputs that a naive generator would get wrong.

The `exportTarget` function in `file_relations.ts` would benefit from property-based testing. Property 1 (metamorphic): reordering the entries of an exports map must not change the resolved target for a given subpath, and when two wildcard keys both match, the one with the longer prefix wins. Property 2 (differential): when a subpath matches a wildcard key, the resolved target equals the key's target with `*` replaced by the substring the subpath captured, which I can check with a one-line oracle (`target.replace('*', capture)`) without reimplementing the resolver. For Property 1, the generator picks a subpath and builds two overlapping wildcard keys whose prefixes have different lengths and distinct targets, then shuffles their insertion order; a naive generator of random keys would almost never produce overlapping keys, and I would avoid equal-length prefixes because the implementation does not define a tie-break for them. For Property 2, the generator first picks the key's prefix and suffix, then builds a matching subpath as prefix + capture + suffix, where the capture may contain nested path segments (e.g. `a/b`), and a target containing exactly one `*`; independently generated random strings would almost never match the key, so the substitution rule would never be exercised.
