---
title: Digit DP
summary: Count numbers up to N that satisfy a digit property by building them one digit at a time, with a tight flag that tracks whether the prefix still matches N.
minutes: 40
difficulty: advanced
rating: [1900, 2400]
tags: [dp, digit-dp, counting, memoization]
prereqs: [dp-introduction, recursion]
problems:
  - cses: 2220
    name: Counting Numbers
    core: true
    note: the program of this lesson
  - lc: numbers-at-most-n-given-digit-set
    name: Numbers At Most N Given Digit Set
    difficulty: Hard
  - lc: non-negative-integers-without-consecutive-ones
    name: Non-negative Integers without Consecutive Ones
    difficulty: Hard
  - lc: count-special-integers
    name: Count Special Integers
    difficulty: Hard
    core: true
    note: state = mask of used digits
  - lc: numbers-with-repeated-digits
    name: Numbers With Repeated Digits
    difficulty: Hard
    note: count the complement
  - cf: 1036C
    name: Classy Numbers
    rating: 1900
    core: true
    note: at most 3 non-zero digits, count in a huge range
  - lc: number-of-digit-one
    name: Number of Digit One
    difficulty: Hard
    note: count how often a digit appears, not just how many numbers
  - cf: 628D
    name: Magic Numbers
    rating: 2200
    note: position parity and remainder modulo m
  - cf: 1073E
    name: Segment Sum
    rating: 2300
    note: stretch; at most k distinct digits, and you need the sum, not the count
  - cf: 55D
    name: Beautiful numbers
    rating: 2500
    note: stretch; remainder modulo lcm(1..9) = 2520
exercises:
  - Change the program to count numbers in [0, N] whose digit sum is exactly S. What replaces last?
  - Why can the memo table ignore N, as long as you only store non-tight states?
---

## The problem

Count how many integers in $[a, b]$ have a property that depends on their digits. For example: no two adjacent digits are equal (`1213` yes, `1223` no).

The range can reach $10^{18}$, so you cannot test each number. Brute force over $10^{18}$ numbers is far out of reach.

## The idea

Two moves make this easy.

1. **Reduce to a prefix.** Let $f(N)$ = how many numbers in $[0, N]$ qualify. Then the answer is $f(b) - f(a - 1)$.
2. **Build the number digit by digit** from the left. A number has at most 18 digits, and each step has 10 choices. Only a small summary of the digits placed so far matters.

The main trick is the **tight flag**. Walk through the digits of `N`:

- While the prefix you have built equals the prefix of `N`, the next digit cannot exceed `N`'s digit. The prefix is **tight**.
- As soon as you place a smaller digit, the number is below `N` whatever follows. The prefix is **free**: every later digit can be 0 to 9.

```steps
title: Building numbers up to N = 325
view: array
frames:
  - arr: [3, 2, 5]
    pointers: {pos: 0}
    highlight: {0: active}
    vars: {tight: true, limit: 3}
    note: Position 0 may hold 0, 1, 2 or 3. The digits 0, 1 and 2 are below N's digit, so the number is already smaller than N and the rest is free.
  - arr: [3, 2, 5]
    pointers: {pos: 0}
    highlight: {0: done}
    vars: {tight: true, chosen: 3}
    note: Choosing 3 matches N's digit, so we stay tight. We must follow N to avoid going over.
  - arr: [3, 2, 5]
    pointers: {pos: 1}
    highlight: {0: done, 1: active}
    vars: {tight: true, limit: 2}
    note: Position 1 may hold 0, 1 or 2. Digits 0 and 1 make the number free; digit 2 keeps it tight.
  - arr: [3, 2, 5]
    pointers: {pos: 2}
    highlight: {0: done, 1: done, 2: active}
    vars: {tight: true, limit: 5}
    note: Position 2 may hold 0 to 5. All of them end the number, since this is the last digit. 325 itself is included.
```

```predict
lang: cpp
code: |
  string s = "325";
  bool tight = true;
  for (int pos = 0; pos < 3; pos++) {
      int lim = tight ? s[pos] - '0' : 9;
      cout << lim << " ";
      int d = (pos == 0) ? 1 : lim;    // first digit 1, then the largest allowed
      tight = tight && d == lim;
  }
prompt: What does this print?
output: 3 9 9
why: At position 0 the limit is 3. Choosing digit 1 is below 3, so tight becomes false and every later limit is 9.
```

## The state

Define the DP by what the future needs:

- **State:** `go(pos, last, tight, started)`: how many ways to fill positions `pos..end`, given that the previous digit is `last`, `tight` says whether we are still matching `N`, and `started` says whether a non-zero digit has appeared yet.
- **Transition:** try each digit `d` from 0 to `lim` (`lim = tight ? s[pos] : 9`). Skip it if the property breaks (`started` and `d == last`). Recurse with `tight && d == lim`.
- **Base case:** `pos == length` returns 1: a complete valid number (the all-zero number counts as 0).
- **Answer:** `go(0, none, true, false)` = $f(N)$.

Why `started`? Numbers have different lengths. We pad with leading zeros to the length of `N`, but those zeros are not real digits, so `0012` must not be judged as having two equal adjacent digits.

Memoise only when `tight` is false. A tight state is reached by exactly one path per call, so caching it saves nothing; the free states are shared by many prefixes and are where the repeated work is.

## Template

```cpp
#include <bits/stdc++.h>
using namespace std;

string s;
long long memo[20][11][2];

long long go(int pos, int last, bool tight, bool started) {
    if (pos == (int)s.size()) return 1;
    if (!tight && memo[pos][last][started] != -1) return memo[pos][last][started];
    int lim = tight ? s[pos] - '0' : 9;
    long long res = 0;
    for (int d = 0; d <= lim; d++) {
        if (started && d == last) continue;          // property: no equal neighbours
        bool ns = started || d != 0;
        res += go(pos + 1, ns ? d : 10, tight && d == lim, ns);
    }
    if (!tight) memo[pos][last][started] = res;
    return res;
}

long long f(long long n) {                           // numbers in [0, n]
    if (n < 0) return 0;
    s = to_string(n);
    memset(memo, -1, sizeof memo);
    return go(0, 10, true, false);
}

int main() {
    long long a, b;
    cin >> a >> b;
    cout << f(b) - f(a - 1) << "\n";
}
```
```java
import java.util.*;

public class Main {
    static String s;
    static long[][][] memo;

    static long go(int pos, int last, boolean tight, boolean started) {
        if (pos == s.length()) return 1;
        int st = started ? 1 : 0;
        if (!tight && memo[pos][last][st] != -1) return memo[pos][last][st];
        int lim = tight ? s.charAt(pos) - '0' : 9;
        long res = 0;
        for (int d = 0; d <= lim; d++) {
            if (started && d == last) continue;
            boolean ns = started || d != 0;
            res += go(pos + 1, ns ? d : 10, tight && d == lim, ns);
        }
        if (!tight) memo[pos][last][st] = res;
        return res;
    }

    static long f(long n) {
        if (n < 0) return 0;
        s = Long.toString(n);
        memo = new long[20][11][2];
        for (long[][] x : memo) for (long[] y : x) Arrays.fill(y, -1);
        return go(0, 10, true, false);
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long a = sc.nextLong(), b = sc.nextLong();
        System.out.println(f(b) - f(a - 1));
    }
}
```
```input
123 321
```
```output
171
```

For the range 123 to 321 there are 199 numbers, and 171 have no two equal neighbours.

```blanks
prompt: Fill in the two limits that control the tight flag.
lang: cpp
code: |
  int lim = tight ? s[pos] - '0' : [[9]];
  for (int d = 0; d <= lim; d++) {
      res += go(pos + 1, d, tight && d == [[lim]], true);
  }
why: When the prefix is free, any digit up to 9 is allowed. A digit stays tight only if it equals the limit, that is, N's digit at this position.
```

## Making it fit other problems

Only the state and the filter change. The structure stays the same.

| Property | Extra state | Filter |
|---|---|---|
| Digit sum equals S | `sum` so far | `sum + d <= S` |
| Divisible by m | `rem` = value mod m | none; check `rem == 0` at the end |
| At most k non-zero digits | count of non-zero digits | `cnt + (d != 0) <= k` |
| All digits distinct | bitmask of used digits | `d` not in mask |
| No two adjacent ones (binary) | `last` bit | skip `1` after `1` |

:::tip
State size multiplies. 18 positions x 2 flags x a sum up to 162 x 10 digits is still tiny. If the extra state grows to millions (a remainder modulo $10^6$), revisit the approach.
:::

## Complexity

- States: positions (about 18) times the size of the extra state, times the flags.
- Work per state: up to 10 digits.
- For the program above: $19 \cdot 11 \cdot 2 \cdot 10$ steps per call, about 4000. Instant.

:::truth
Digit DP rarely shows up below about 1900 rating. When it does, the hard part is choosing the minimal state. Write what a half-built number must remember in order to finish correctly, nothing more.
:::

## Pitfalls

- **Memo across different N.** If your memo depends on the length of `N`, clear it for each call (the program does this with `memset`).
- **Leading zeros.** Without the `started` flag, short numbers are padded with zeros that wrongly trigger the property.
- **Counting 0.** The all-zero number is counted by the base case. Decide whether the problem includes 0 and adjust.
- **`a - 1` when `a = 0`.** The program returns 0 for negative arguments.
- **Memoising tight states with the wrong key.** A tight state depends on the exact prefix of `N`. Either skip caching it or include `tight` in the key.
- **Overflow.** Counts for ranges up to $10^{18}$ need 64-bit integers.

```quiz
q: Why do we pass tight && d == lim into the recursive call?
options:
  - To make the loop run faster
  - Because the number stays equal to N's prefix only if we were already tight and placed exactly N's digit
  - Because lim is always 9
answer: 1
why: Placing a smaller digit makes the number strictly below N, and from then on any digits are allowed.
```

```quiz
q: Why is a started flag needed when counting numbers with no equal adjacent digits?
options:
  - Leading zeros are padding, not real digits, so they must not count as equal neighbours
  - It stores the first digit of the number
  - It checks whether the number is below N
answer: 0
why: With N = 325, the number 7 is written 007. The two zeros are not part of 7 and must not be rejected.
```

```cards
- q: How do you count numbers in [a, b] with a digit property?
  a: f(b) - f(a - 1), where f(N) counts valid numbers in [0, N].
- q: What does the tight flag mean?
  a: The digits placed so far equal N's prefix, so the next digit cannot exceed N's digit at this position.
- q: Why does digit DP need a started flag?
  a: To tell leading zeros (padding) from real digits.
- q: Which states should be memoised?
  a: The free (not tight) states, which many different prefixes reach.
- q: Typical digit DP state?
  a: (position, tight, started, plus a summary such as the last digit, a sum, a remainder or a mask of used digits).
```

## Notes

:::notes
- Digit DP counts numbers in a huge range by building them left to right, one digit per step.
- Reduce $[a, b]$ to $f(b) - f(a - 1)$ with $f(N)$ counting $[0, N]$.
- Tight = prefix equals N's prefix; limit is N's digit when tight, else 9.
- Next tight = tight and chosen digit equals the limit.
- Started flag separates real digits from leading zeros.
- State = (pos, summary, tight, started); memoise only free states; base case at the end returns 1.
- Summary examples: last digit, digit sum, remainder, mask of used digits, count of non-zero digits.
- About 18 positions and 10 digits per step, so the cost is tiny unless the summary state is large.
:::
