---
title: Combinatorics
summary: Counting without listing, using the sum and product rules, nCr, Pascal's triangle, stars and bars, inclusion-exclusion and the pigeonhole principle.
minutes: 40
difficulty: intermediate
rating: [1000, 1600]
tags: [combinatorics, counting, math, inclusion-exclusion]
prereqs: [modular-arithmetic, math-basics]
problems:
  - lc: pascals-triangle
    name: Pascal's Triangle
    difficulty: Easy
  - cf: 1840C
    name: Ski Resort
    rating: 1000
  - cf: 610A
    name: Pasha and Stick
    rating: 1000
  - lc: unique-paths
    name: Unique Paths
    difficulty: Medium
  - cf: 1922B
    name: Forming Triangles
    rating: 1200
    core: true
    note: group by length, then choose with nCr
  - cf: 478B
    name: Random Teams
    rating: 1300
  - cf: 1433E
    name: Two Round Dances
    rating: 1300
  - cf: 1328B
    name: K-th Beautiful String
    rating: 1300
  - cf: 1475C
    name: Ball in Berland
    rating: 1400
    core: true
    note: total pairs minus bad ones, an inclusion-exclusion step
  - cf: 1475E
    name: Advertising Agency
    rating: 1600
    core: true
    note: nCr modulo a prime with a tie at the boundary
  - cses: 1079
    name: Binomial Coefficients
---

## The problem

Combinatorics is counting: in how many ways can something be arranged, chosen or distributed? In contests the answer is usually huge and printed modulo a prime, and the work is to find a formula instead of enumerating.

## Brute force first

Generate every arrangement and count them. Choosing 10 people from 50 has $\binom{50}{10} \approx 10^{10}$ possibilities. Even that is too many to list, and real inputs go up to $n = 10^6$. We need formulas.

## Counting rules

| Rule | Meaning | Example |
|---|---|---|
| Sum rule | Exclusive alternatives add. | 3 ways to go by bus or 2 by train: 5 ways. |
| Product rule | Independent steps multiply. | 3 shirts and 4 trousers: 12 outfits. |
| Permutations | Ordered arrangements of $n$ distinct items: $n!$ | 4 books on a shelf: 24. |
| Arrangements of $k$ from $n$ | $n! / (n-k)!$ | Gold, silver, bronze among 10 runners: 720. |
| Combinations | Unordered choice of $k$ from $n$: $\binom{n}{k} = \frac{n!}{k!(n-k)!}$ | A team of 3 from 10: 120. |
| Repeated items | $n! / (a!\, b!\, \cdots)$ | Letters of "AABB": $4!/(2!\,2!) = 6$. |

An unordered choice divides the ordered count by $k!$, because each group of $k$ items was counted in $k!$ different orders.

Growth is fast. $20!$ is about $2.4 \cdot 10^{18}$, the last factorial that fits in a signed 64-bit integer.

```quiz
q: What is the largest n for which n! fits in a signed 64-bit integer (limit about 9.2 * 10^18)?
options:
  - "15"
  - "20"
  - "25"
answer: 1
why: 20! = 2,432,902,008,176,640,000 is below 9.22 * 10^18, while 21! is about 5.1 * 10^19 and overflows. Beyond that you need modular arithmetic.
```

## Pascal's triangle

Computing factorials is not the only way to get $\binom{n}{k}$. A choice either contains a particular item or does not:

$$\binom{n}{k} = \binom{n-1}{k-1} + \binom{n-1}{k}.$$

The first term counts choices that contain the item, the second counts choices that avoid it. Filling a table with this rule is Pascal's triangle. It needs no division, so it works for any modulus, and it costs $O(n^2)$.

```steps
title: Pascal's triangle, rows n = 0 to 4
view: grid
frames:
  - grid:
      - [1, "-", "-", "-", "-"]
      - ["-", "-", "-", "-", "-"]
      - ["-", "-", "-", "-", "-"]
      - ["-", "-", "-", "-", "-"]
      - ["-", "-", "-", "-", "-"]
    rowLabels: ["n=0", "n=1", "n=2", "n=3", "n=4"]
    colLabels: ["k=0", "k=1", "k=2", "k=3", "k=4"]
    note: C(0, 0) = 1. There is one way to choose nothing from nothing.
  - grid:
      - [1, "-", "-", "-", "-"]
      - [1, 1, "-", "-", "-"]
      - [1, "-", "-", "-", "-"]
      - ["-", "-", "-", "-", "-"]
      - ["-", "-", "-", "-", "-"]
    highlight: {"2,0": done}
    rowLabels: ["n=0", "n=1", "n=2", "n=3", "n=4"]
    colLabels: ["k=0", "k=1", "k=2", "k=3", "k=4"]
    note: Every row starts with 1 (choose nothing) and ends with 1 (choose everything).
  - grid:
      - [1, "-", "-", "-", "-"]
      - [1, 1, "-", "-", "-"]
      - [1, 2, 1, "-", "-"]
      - [1, "-", "-", "-", "-"]
      - ["-", "-", "-", "-", "-"]
    highlight: {"2,1": active, "1,0": compare, "1,1": compare}
    rowLabels: ["n=0", "n=1", "n=2", "n=3", "n=4"]
    colLabels: ["k=0", "k=1", "k=2", "k=3", "k=4"]
    note: C(2, 1) = C(1, 0) + C(1, 1) = 1 + 1 = 2.
  - grid:
      - [1, "-", "-", "-", "-"]
      - [1, 1, "-", "-", "-"]
      - [1, 2, 1, "-", "-"]
      - [1, 3, 3, 1, "-"]
      - [1, "-", "-", "-", "-"]
    highlight: {"3,2": active, "2,1": compare, "2,2": compare}
    rowLabels: ["n=0", "n=1", "n=2", "n=3", "n=4"]
    colLabels: ["k=0", "k=1", "k=2", "k=3", "k=4"]
    note: C(3, 2) = C(2, 1) + C(2, 2) = 2 + 1 = 3.
  - grid:
      - [1, "-", "-", "-", "-"]
      - [1, 1, "-", "-", "-"]
      - [1, 2, 1, "-", "-"]
      - [1, 3, 3, 1, "-"]
      - [1, 4, 6, 4, 1]
    highlight: {"4,2": active, "3,1": compare, "3,2": compare}
    rowLabels: ["n=0", "n=1", "n=2", "n=3", "n=4"]
    colLabels: ["k=0", "k=1", "k=2", "k=3", "k=4"]
    note: C(4, 2) = C(3, 1) + C(3, 2) = 3 + 3 = 6.
```

```predict
lang: cpp
code: |
  long long c[5][5] = {};
  for (int i = 0; i < 5; i++) {
      c[i][0] = 1;
      for (int j = 1; j <= i; j++) c[i][j] = c[i-1][j-1] + c[i-1][j];
  }
  cout << c[4][2];
output: "6"
why: This is the table from the walkthrough. c[4][2] = c[3][1] + c[3][2] = 3 + 3 = 6. Entries to the right of the diagonal stay 0 from the initialisation.
```

## Stars and bars

How many ways to split $n$ identical items among $k$ people, each receiving zero or more? Write the items as stars and place $k - 1$ bars between people. A line with $n$ stars and $k - 1$ bars is fixed by choosing which positions are bars:

$$\binom{n + k - 1}{k - 1}.$$

If everyone must get at least one item, give each person one first and distribute the remaining $n - k$: $\binom{n - 1}{k - 1}$.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;
    static long long c[61][61];
    for (int i = 0; i <= 60; i++) {
        c[i][0] = 1;
        for (int j = 1; j <= i; j++) c[i][j] = c[i - 1][j - 1] + c[i - 1][j];
    }
    cout << c[n][k] << "\n";                 // choose k of n
    cout << c[n + k - 1][k - 1] << "\n";     // x1 + ... + xk = n, each xi >= 0
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int n = Integer.parseInt(st.nextToken());
        int k = Integer.parseInt(st.nextToken());
        long[][] c = new long[61][61];
        for (int i = 0; i <= 60; i++) {
            c[i][0] = 1;
            for (int j = 1; j <= i; j++) c[i][j] = c[i - 1][j - 1] + c[i - 1][j];
        }
        System.out.println(c[n][k]);                 // choose k of n
        System.out.println(c[n + k - 1][k - 1]);     // x1 + ... + xk = n, each xi >= 0
    }
}
```
```input
6 3
```
```output
20
28
```

Check by hand: $\binom{6}{3} = 20$, and $x_1 + x_2 + x_3 = 6$ with non-negative integers has $\binom{8}{2} = 28$ solutions. The table is only valid while $n + k - 1 \le 60$. For larger values switch to factorials modulo a prime (previous lesson).

## Inclusion-exclusion

How many numbers from 1 to 100 are divisible by 2, 3 or 5? Adding the three counts counts some numbers twice or three times. The fix: add the single sets, subtract the pairwise overlaps, add back the triple overlap, and so on, alternating signs.

$$|A \cup B \cup C| = |A| + |B| + |C| - |A \cap B| - |A \cap C| - |B \cap C| + |A \cap B \cap C|$$

Here $|A \cap B|$ is the count divisible by both 2 and 3, which means divisible by $\operatorname{lcm}(2, 3) = 6$. For 100: $50 + 33 + 20 - 16 - 10 - 6 + 3 = 74$.

For $m$ sets, loop over all $2^m - 1$ non-empty subsets with a bitmask. The sign is plus for odd-sized subsets and minus for even-sized ones.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    long long n;
    int m;
    cin >> n >> m;
    vector<long long> a(m);
    for (auto &x : a) cin >> x;
    long long total = 0;
    for (int mask = 1; mask < (1 << m); mask++) {
        long long l = 1;
        for (int i = 0; i < m; i++) {
            if (mask >> i & 1) {
                l = l / __gcd(l, a[i]) * a[i];
                if (l > n) break;             // no multiples in 1..n
            }
        }
        if (l > n) continue;
        total += (__builtin_popcount(mask) % 2 ? 1 : -1) * (n / l);
    }
    cout << total << "\n";
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    static long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        long n = Long.parseLong(st.nextToken());
        int m = Integer.parseInt(st.nextToken());
        long[] a = new long[m];
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < m; i++) a[i] = Long.parseLong(st.nextToken());
        long total = 0;
        for (int mask = 1; mask < (1 << m); mask++) {
            long l = 1;
            for (int i = 0; i < m; i++) {
                if ((mask >> i & 1) == 1) {
                    l = l / gcd(l, a[i]) * a[i];
                    if (l > n) break;             // no multiples in 1..n
                }
            }
            if (l > n) continue;
            total += (Integer.bitCount(mask) % 2 == 1 ? 1 : -1) * (n / l);
        }
        System.out.println(total);
    }
}
```
```input
100 3
2 3 5
```
```output
74
```

```blanks
prompt: Complete the sign rule for inclusion-exclusion over subsets.
lang: cpp
code: |
  // subset size odd -> [[add|+|plus]], even -> [[subtract|-|minus]]
  total += (__builtin_popcount(mask) % 2 ? 1 : -1) * (n / l);
why: Single sets are added, pairwise overlaps are subtracted, triple overlaps are added back, and so on.
```

A shortcut used often: when you want "at least one", count the complement. The number of pairs that satisfy a condition is the total number of pairs minus the pairs that break it.

## Pigeonhole principle

If you put $n + 1$ objects in $n$ boxes, some box holds at least 2. More generally, $n$ objects in $k$ boxes means some box holds at least $\lceil n / k \rceil$.

This proves existence without finding anything. Among any 13 people, two share a birth month. Among any $m + 1$ integers, two have the same remainder modulo $m$, so their difference is divisible by $m$.

```quiz
q: A list has 6 integers. Which claim is always true?
options:
  - Two of them have the same remainder modulo 5
  - Two of them have the same remainder modulo 7
  - Two of them are equal
answer: 0
why: There are 5 possible remainders modulo 5 and 6 numbers, so two share a remainder (pigeonhole). Modulo 7 there are 7 boxes for 6 numbers, so all may differ, and the numbers need not be equal at all.
```

## Complexity

- Pascal table up to $n$: $O(n^2)$ time and memory. No modulus division needed.
- Factorial method: $O(n)$ precomputation, $O(1)$ per query (see the previous lesson).
- Inclusion-exclusion over $m$ sets: $O(2^m \cdot m)$. It is only used for small $m$, usually 20 or less.

## Pitfalls

- Mixing ordered and unordered counting. Ask yourself: if I swap two chosen items, is it a different answer?
- Overflow. $\binom{60}{30}$ is about $1.2 \cdot 10^{17}$ and still fits, but intermediate $n!$ values do not. Reduce modulo $p$ or use Pascal.
- Missing the case $k > n$. The answer is 0.
- Inclusion-exclusion with the wrong sign, or with `lcm` overflowing. Stop once it exceeds the limit.
- Off-by-one in stars and bars: the bars number $k - 1$, not $k$.

:::truth
Counting problems rarely announce which formula to use. Most of the skill is turning a story into one of these shapes: a product of independent choices, "choose $k$ of $n$", stars and bars, or a complement. Practise by solving the problem for $n = 1, 2, 3$ by hand, then looking for the formula that matches.
:::

```cards
- q: How many ways to choose k items from n, order ignored?
  a: $\binom{n}{k} = \frac{n!}{k!\,(n-k)!}$
- q: What is Pascal's rule?
  a: $\binom{n}{k} = \binom{n-1}{k-1} + \binom{n-1}{k}$. A choice either includes a fixed item or does not.
- q: Number of non-negative solutions of x1 + ... + xk = n?
  a: $\binom{n+k-1}{k-1}$ (stars and bars). If every xi must be at least 1, it is $\binom{n-1}{k-1}$.
- q: How does inclusion-exclusion count |A or B or C|?
  a: Add singles, subtract pairwise overlaps, add the triple overlap. Signs alternate with subset size.
- q: What does the pigeonhole principle say?
  a: Putting $n$ objects into $k$ boxes puts at least $\lceil n/k \rceil$ in some box.
```

## Notes

:::notes
- Sum rule adds exclusive options. Product rule multiplies independent steps.
- n! arranges n distinct items. n! / (n-k)! arranges k of them. C(n, k) = n! / (k! (n-k)!) ignores order.
- Repeated items: n! / (a! b! ...).
- Pascal: C(n, k) = C(n-1, k-1) + C(n-1, k). O(n^2), no division.
- Stars and bars: x1 + ... + xk = n, xi >= 0 gives C(n+k-1, k-1). With xi >= 1 gives C(n-1, k-1).
- Inclusion-exclusion: alternate signs by subset size. Intersection of "divisible by a, b" is "divisible by lcm(a, b)".
- Count the complement when "at least one" is awkward.
- Pigeonhole: n objects in k boxes means some box has at least ceil(n/k).
- 20! is the largest factorial in signed 64 bits. For bigger n use modular factorials.
:::
