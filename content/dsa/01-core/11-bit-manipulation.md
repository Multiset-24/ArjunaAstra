---
title: Bit Manipulation
summary: Treat integers as rows of on/off flags, learn the handful of bit tricks that matter, and use masks to enumerate subsets.
minutes: 40
difficulty: intermediate
rating: [800, 1500]
tags: [bits, xor, masks, subsets, technique]
prereqs: [arrays-and-strings, recursion]
problems:
  - cf: 1527A
    name: And Then There Were K
    rating: 800
    core: true
    note: look at the highest set bit of n
  - lc: single-number
    name: Single Number
    difficulty: Easy
    note: XOR cancels pairs
  - lc: number-of-1-bits
    name: Number of 1 Bits
    difficulty: Easy
  - lc: counting-bits
    name: Counting Bits
    difficulty: Easy
    note: popcount of every number up to n
  - cf: 579A
    name: Raising Bacteria
    rating: 1000
    core: true
    note: the answer is a popcount
  - cf: 1632B
    name: Roof Construction
    rating: 1000
    note: split at the largest power of two below n
  - lc: missing-number
    name: Missing Number
    difficulty: Easy
  - cf: 1420B
    name: Rock and Lever
    rating: 1200
    core: true
    note: group numbers by highest set bit
  - cses: 1623
    name: Apple Division
    note: try every subset with a mask
  - cf: 1669H
    name: Maximal AND
    rating: 1300
    note: decide bits from the highest to the lowest
  - cf: 1516B
    name: AGAGA XOOORRR
    rating: 1500
    note: XOR of all elements decides the number of parts
exercises:
  - Using only lowbit and subtraction, write a loop that visits each set bit of x.
  - How many (mask, submask) pairs exist for n = 12? Compare with iterating all pairs of masks.
---

## The problem

An integer is stored as a row of **bits**, each 0 or 1. Reading them as flags gives you three things:

- A compact way to store a **set** of up to 20 to 60 items in one number, called a **mask**.
- Tricks that run in a single machine instruction (lowest set bit, count of ones).
- A way to enumerate all subsets with a plain `for` loop.

Bit positions count from 0 at the right. In `1100` (decimal 12), bits 2 and 3 are on.

## The operators

| Operator | Meaning | 12 (1100) and 10 (1010) |
|---|---|---|
| `a & b` | AND: 1 only if both are 1 | 1000 = 8 |
| `a \| b` | OR: 1 if either is 1 | 1110 = 14 |
| `a ^ b` | XOR: 1 if they differ | 0110 = 6 |
| `~a` | NOT: flip every bit | all bits flipped |
| `a << k` | shift left, multiplies by $2^k$ | 12 << 1 = 24 |
| `a >> k` | shift right, divides by $2^k$ (rounded down) | 12 >> 2 = 3 |

```viz
algo: bits
input:
  a: 12
  b: 10
```

## Set, clear, toggle, test

Use `1 << i`, a number with only bit `i` on, as the mask.

| Action | Code |
|---|---|
| Test bit i | `(x >> i) & 1` |
| Set bit i | `x \| (1 << i)` |
| Clear bit i | `x & ~(1 << i)` |
| Toggle bit i | `x ^ (1 << i)` |

:::warn
`1 << i` is a 32-bit `int`. For `i >= 31` use `1LL << i` in C++ and `1L << i` in Java, or the result is wrong or undefined.
:::

```quiz
questions:
  - q: You want bit 40 of a 64-bit `long long x` set. Which is correct in C++?
    options:
      - "x |= 1 << 40;"
      - "x |= 1LL << 40;"
      - "x ^= 40;"
    answer: 1
    why: "The literal 1 is an int, so `1 << 40` overflows before it is widened. `1LL` makes the shift happen in 64 bits."
  - q: What does `x & 1 == 0` compute?
    options:
      - Whether x is even
      - x & (1 == 0), which is always 0
      - A compile error
    answer: 1
    why: "Comparison binds tighter than `&`, so it parses as `x & (1 == 0)`. Write `(x & 1) == 0`. Always parenthesise bit operations."
```

## Lowest bit and popcount

- `x & -x` keeps only the lowest set bit (**lowbit**). In two's complement, `-x` flips all bits above the lowest set bit and keeps that bit and the zeros below it, so the AND isolates it.
- `x & (x - 1)` removes the lowest set bit.
- `x > 0 && (x & (x - 1)) == 0` tests for a power of two.
- **Popcount** is the number of 1 bits.

| Task | C++ | Java |
|---|---|---|
| popcount | `__builtin_popcount(x)`, `__builtin_popcountll(x)` | `Integer.bitCount(x)`, `Long.bitCount(x)` |
| trailing zeros | `__builtin_ctz(x)` | `Integer.numberOfTrailingZeros(x)` |
| highest bit index | `31 - __builtin_clz(x)` | `31 - Integer.numberOfLeadingZeros(x)` |

The built-ins need `x > 0` for `ctz` and `clz`.

```predict
lang: cpp
code: |
  int x = 44;   // binary 101100
  cout << (x & -x) << " " << (x & (x - 1)) << " " << __builtin_popcount(x);
output: 4 40 3
why: 44 = 101100. The lowest set bit is 100 = 4. Removing it leaves 101000 = 40. There are three 1 bits.
```

```blanks
prompt: Complete the two lowest-bit tricks.
lang: cpp
code: |
  int low = x & [[-x]];
  int rest = x & ([[x - 1|x-1]]);
why: -x keeps the lowest set bit and flips everything above it, so x & -x isolates that bit. x - 1 flips the lowest set bit and the zeros below it, so x & (x - 1) clears it.
```

## XOR

XOR has three properties that make it useful:

- $a \oplus a = 0$
- $a \oplus 0 = a$
- Order does not matter.

If every number appears twice except one, XOR of everything leaves the single one, because pairs cancel.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    int x = 0;
    for (int i = 0; i < n; i++) {
        int a;
        cin >> a;
        x ^= a;
    }
    cout << x << "\n";
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringTokenizer st = new StringTokenizer(br.readLine());
        int x = 0;
        for (int i = 0; i < n; i++) x ^= Integer.parseInt(st.nextToken());
        System.out.println(x);
    }
}
```
```input
7
4 1 2 1 2 4 9
```
```output
9
```

### Think one bit at a time

AND, OR and XOR work on each bit position independently. A problem about 30-bit numbers often splits into 30 separate 0/1 problems. Examples: count the pairs whose XOR has bit 3 set, or decide the answer's bits from the highest down.

## Masks as subsets

Bit `i` of a mask means "item `i` is chosen". The numbers `0` to `2^n - 1` are exactly all subsets of `n` items.

Apple Division: split `n` apples (weights given) into two groups with the smallest weight difference. Try every mask; the chosen group sums to `s`, the other to `total - s`.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> w(n);
    long long total = 0;
    for (auto& x : w) { cin >> x; total += x; }
    long long best = LLONG_MAX;
    for (int mask = 0; mask < (1 << n); mask++) {
        long long s = 0;
        for (int i = 0; i < n; i++)
            if ((mask >> i) & 1) s += w[i];
        best = min(best, llabs(total - 2 * s));
    }
    cout << best << "\n";
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringTokenizer st = new StringTokenizer(br.readLine());
        long[] w = new long[n];
        long total = 0;
        for (int i = 0; i < n; i++) { w[i] = Long.parseLong(st.nextToken()); total += w[i]; }
        long best = Long.MAX_VALUE;
        for (int mask = 0; mask < (1 << n); mask++) {
            long s = 0;
            for (int i = 0; i < n; i++)
                if (((mask >> i) & 1) == 1) s += w[i];
            best = Math.min(best, Math.abs(total - 2 * s));
        }
        System.out.println(best);
    }
}
```
```input
5
3 2 7 4 1
```
```output
1
```

Walkthrough: total is 17. The subset {3, 4, 1} sums to 8, the other group to 9, so the difference is 1. No subset can reach a difference of 0 because 17 is odd.

Cost: $2^n$ masks times $n$ per mask, so $O(2^n \cdot n)$. Fine up to about n = 20.

### Submasks

A **submask** of `m` is a mask whose set bits are all inside `m`. The trick `s = (s - 1) & m` steps from one submask to the next smaller one.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int m;
    cin >> m;
    for (int s = m;; s = (s - 1) & m) {
        cout << s << " ";
        if (s == 0) break;
    }
    cout << "\n";
}
```
```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        int m = new Scanner(System.in).nextInt();
        StringBuilder sb = new StringBuilder();
        for (int s = m; ; s = (s - 1) & m) {
            sb.append(s).append(" ");
            if (s == 0) break;
        }
        System.out.println(sb.toString().trim());
    }
}
```
```input
13
```
```output
13 12 9 8 5 4 1 0
```

`13` is `1101`. Its submasks use only bits 0, 2 and 3, giving 8 submasks, listed from largest to smallest.

```order
prompt: Arrange the loop that visits every submask of m, including the empty one.
lang: cpp
code: |
  for (int s = m; ; s = (s - 1) & m) {
      process(s);
      if (s == 0) break;
  }
distractors:
  - "for (int s = m; s > 0; s = (s - 1) & m) {"
why: The loop must process s before testing for zero, otherwise the empty submask is never visited. A condition s > 0 in the loop header stops before reaching it.
```

Enumerating every submask of every mask costs $3^n$ in total, because each item is either outside the mask, in the mask but not the submask, or in both.

```estimate
q: Iterating over all submasks of all masks for n = 15 does about how many steps?
answer: 14348907
unit: steps
tolerance: 0.3
hint: Each of the 15 items has 3 states, so count 3 choices per item.
solution: "3^15 = 14,348,907. Pairs of arbitrary masks would be 4^15, about 1.07 x 10^9, which is about 75 times more."
```

## Complexity

- Single bit operations, lowbit, popcount, XOR: O(1).
- All subsets: $O(2^n)$ masks, times the per-mask work.
- All (mask, submask) pairs: $O(3^n)$.

## Pitfalls

- **Precedence.** `==` binds tighter than `&`, `|` and `^`. Parenthesise every bit expression.
- **Overflow of the shift.** Use `1LL << i` or `1L << i` for bit 31 and above. Shifting an int by 32 or more is undefined in C++, and wraps around in Java.
- **Signed right shift.** `>>` on a negative number keeps the sign in Java (use `>>>` for a logical shift). In C++ prefer unsigned types when you want zeros shifted in.
- **Built-ins on zero.** `ctz` and `clz` are undefined for 0.
- **Wrong popcount width.** `__builtin_popcount` takes 32 bits. For `long long` use `__builtin_popcountll`.

:::truth
Bit tricks are shortcuts, not a topic you master by memorising a list. Most problems tagged with bitmasks are solved by thinking one bit at a time or by enumerating subsets, and the clever one-liners are only a speed-up. Learn the six tricks above, then spend your time on problems.
:::

```cards
- q: What does x & (x - 1) do?
  a: It clears the lowest set bit of x. It is zero for a power of two (and for 0).
- q: What does x & -x give?
  a: The lowest set bit of x, as a number with a single bit on.
- q: Why does XOR of all elements find the number appearing once, when all others appear twice?
  a: a ^ a = 0 and a ^ 0 = a, so equal pairs cancel regardless of order.
- q: How do you loop over all subsets of n items?
  a: For mask from 0 to 2^n - 1, where bit i of the mask says whether item i is chosen. Cost 2^n times the work per mask.
- q: How do you loop over all submasks of m?
  a: "s = m; process s; if s is 0 stop; s = (s - 1) & m. Total over all masks is 3^n."
```

## Notes

:::notes
- Bits count from 0 on the right. Test: `(x >> i) & 1`; set: `x | (1 << i)`; clear: `x & ~(1 << i)`; toggle: `x ^ (1 << i)`.
- Use `1LL << i` (C++) or `1L << i` (Java) for bit 31 and above. Parenthesise every bit expression.
- lowbit is `x & -x`. `x & (x - 1)` removes the lowest set bit. Power of two: `x > 0 && (x & (x - 1)) == 0`.
- Popcount: `__builtin_popcount` / `Integer.bitCount`. Highest bit: `31 - clz`.
- XOR: `a ^ a = 0`, `a ^ 0 = a`, order does not matter. Pairs cancel.
- AND, OR and XOR act on each bit independently. Think about one bit at a time.
- A mask from 0 to 2^n - 1 is a subset of n items. Cost O(2^n * n).
- Submasks of m: `for (s = m; ; s = (s - 1) & m) { ...; if (s == 0) break; }`. All pairs over all masks: 3^n.
:::
