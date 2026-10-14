---
title: Math Basics for Contests
summary: Parity, divisibility, remainders with negatives, gcd and lcm with Euclid, ceiling division, sums of series and digit tricks.
minutes: 25
difficulty: beginner
rating: [800, 1200]
tags: [math, gcd, modulo, parity]
prereqs: [language-setup, complexity]
problems:
  - cf: 1328A
    name: Divisibility Problem
    rating: 800
    core: true
  - cf: 1426A
    name: Floor Number
    rating: 800
    note: ceiling division
  - cf: 1154A
    name: Restoring Three Numbers
    rating: 800
  - cf: 1389A
    name: LCM Problem
    rating: 800
  - cf: 1899A
    name: Game with Integers
    rating: 800
  - cf: 318A
    name: Even Odds
    rating: 900
    core: true
  - cf: 1A
    name: Theatre Square
    rating: 1000
    core: true
    note: ceiling division and 64 bits
  - cf: 1352B
    name: Same Parity Summands
    rating: 1200
    note: a little above the band
  - lc: palindrome-number
    name: Palindrome Number
    difficulty: Easy
  - lc: add-digits
    name: Add Digits
    difficulty: Easy
exercises:
  - Prove to yourself that the sum of three odd numbers is odd, then check a few examples.
  - "Run Euclid by hand on gcd(1071, 462) and write each remainder."
---

## Parity

**Parity** is whether an integer is even or odd. It sounds trivial, yet many 800-1000 problems reduce to it.

| Operation | Result |
|---|---|
| even + even, odd + odd | even |
| even + odd | odd |
| even x anything | even |
| odd x odd | odd |

- Test with `x % 2 == 0` for even. For odd, test `x % 2 != 0`, never `x % 2 == 1`, because `-3 % 2` is `-1` in C++ and Java.
- A sum of `k` odd numbers has the parity of `k`.

```quiz
questions:
  - q: a and b are both odd. Which value is always even?
    options:
      - a * b
      - a + b
      - a + b + 1
    answer: 1
    why: Odd plus odd is even. The product of two odds is odd, and adding 1 to an even number gives odd.
  - q: In C++, what does (-3) % 2 == 1 evaluate to?
    options:
      - "true"
      - "false"
    answer: 1
    why: The remainder takes the sign of the left operand, so (-3) % 2 is -1. Test odd with != 0.
```

## Divisibility and remainders

`a` is **divisible** by `b` when `a % b == 0`. Handy rules:

- Divisible by 2, 5 or 10: look at the last digit.
- Divisible by 3 or 9: the sum of the digits is divisible by 3 or 9.
- Remainders respect addition and multiplication: $(a + b) \bmod m = ((a \bmod m) + (b \bmod m)) \bmod m$, and the same for products.

For a non-negative remainder in any case, use `((x % m) + m) % m`. Lesson 3 showed why.

## gcd and lcm

The **gcd** (greatest common divisor) of `a` and `b` is the largest number dividing both. The **lcm** (least common multiple) is the smallest positive number both divide. They are linked: $\gcd(a,b) \cdot \operatorname{lcm}(a,b) = a \cdot b$.

**Euclid's algorithm**: $\gcd(a, b) = \gcd(b, a \bmod b)$, and $\gcd(a, 0) = a$. The numbers shrink fast, so it takes $O(\log \min(a,b))$ steps.

```steps
title: gcd(48, 18) by Euclid
view: array
frames:
  - arr: [48, 18]
    highlight: {0: active, 1: active}
    note: Start with a = 48, b = 18. Compute 48 mod 18 = 12.
  - arr: [18, 12]
    highlight: {0: active, 1: active}
    note: Replace (a, b) by (b, a mod b) = (18, 12). Now 18 mod 12 = 6.
  - arr: [12, 6]
    highlight: {0: active, 1: active}
    note: Now (12, 6). 12 mod 6 = 0.
  - arr: [6, 0]
    highlight: {0: match}
    note: b is 0, so the answer is a = 6.
```

To avoid overflow, compute lcm as `a / g * b`, not `a * b / g`.

```cpp
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

ll gcdll(ll a, ll b) { return b == 0 ? a : gcdll(b, a % b); }

int main() {
    int t;
    cin >> t;
    while (t--) {
        ll a, b;
        cin >> a >> b;
        ll g = gcdll(a, b);
        cout << g << " " << a / g * b << "\n";
    }
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int t = Integer.parseInt(br.readLine().trim());
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            long a = Long.parseLong(st.nextToken());
            long b = Long.parseLong(st.nextToken());
            long g = gcd(a, b);
            out.append(g).append(" ").append(a / g * b).append("\n");
        }
        System.out.print(out);
    }
}
```
```input
3
12 18
7 13
1000000000 999999999
```
```output
6 36
1 91
1 999999999000000000
```

:::note
C++17 also has `std::gcd` and `std::lcm` in `<numeric>`. Java's standard library has no `long` gcd, so keep the three-line function in your template.
:::

```blanks
prompt: Complete Euclid's algorithm.
lang: cpp
code: |
  long long g(long long a, long long b) {
      return b == [[0]] ? a : g(b, a [[%]] b);
  }
why: When b reaches 0, a holds the gcd. Otherwise the pair becomes (b, a mod b).
```

## Ceiling division

Integer division rounds down. For positive `a` and `b`, the ceiling of `a / b` (smallest integer not below it) is `(a + b - 1) / b`. It answers "how many boxes of size b do I need for a items?".

```predict
lang: cpp
code: |
  cout << 7 / 2 << " " << (7 + 2 - 1) / 2 << " " << 8 / 2 << " " << (8 + 2 - 1) / 2;
output: 3 4 4 4
why: 7 / 2 rounds down to 3, while the ceiling formula gives 8 / 2 = 4. For exact multiples such as 8, both agree on 4.
```

## Sums and series

- Sum of 1 to n: $n(n+1)/2$.
- Sum of an arithmetic series (constant step): count x (first + last) / 2.
- Sum of powers of two: $1 + 2 + \dots + 2^{k-1} = 2^k - 1$.

```estimate
q: Roughly what is 1 + 2 + ... + 200000?
answer: 20000100000
tolerance: 0.05
solution: n(n+1)/2 = 200000 x 200001 / 2 = 20,000,100,000. This exceeds the int range, so use long long.
```

## Digits

Peel digits with `% 10` and `/ 10`. The number of digits of `n` is the number of loop rounds.

```predict
lang: cpp
code: |
  int n = 4091, s = 0;
  while (n > 0) { s += n % 10; n /= 10; }
  cout << s;
output: '14'
why: The loop adds 1, 9, 0 and 4, in that order, for a total of 14.
```

:::truth
These topics look small, and they are. But at 800-1200 the main difficulty is exactly this: seeing that a problem is a parity argument, a ceiling, or a gcd. Practice recognising them rather than memorising more formulas.
:::

## Cards

```cards
- q: How do you test that x is odd safely in C++ and Java?
  a: x % 2 != 0. For negative x, x % 2 is -1, so == 1 fails.
- q: What is Euclid's algorithm?
  a: gcd(a, b) = gcd(b, a mod b), stopping at gcd(a, 0) = a. It takes O(log) steps.
- q: How do you compute lcm without overflow?
  a: a / gcd(a, b) * b, dividing first.
- q: Ceiling of a / b for positive integers?
  a: (a + b - 1) / b
- q: Sum of 1..n and the overflow risk?
  a: n(n+1)/2. For n around 10^5 and above, the result exceeds int, so use long long.
```

## Notes

:::notes
- Parity: odd x odd is odd; a sum of k odd numbers has the parity of k. Test odd with x % 2 != 0.
- Remainder keeps the left operand's sign; normalise with ((x % m) + m) % m.
- Divisible by 3 or 9: the digit sum is. Divisible by 2, 5, 10: last digit.
- gcd(a, b) = gcd(b, a % b), O(log). lcm = a / gcd * b.
- Ceiling division for positives: (a + b - 1) / b.
- Sum 1..n = n(n+1)/2, powers of two: 2^k - 1. Check for overflow.
- Digits: n % 10 gives the last digit, n / 10 removes it.
:::
