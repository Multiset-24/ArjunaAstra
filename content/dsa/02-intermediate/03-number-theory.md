---
title: Number Theory Basics
summary: Primes, divisors and gcd, covering the sieve, factorising with a smallest-prime table, divisors in square-root time and the gcd properties contests lean on.
minutes: 40
difficulty: intermediate
rating: [900, 1600]
tags: [math, number theory, sieve, gcd, divisors]
prereqs: [math-basics, sorting-and-searching]
problems:
  - cf: 1475A
    name: Odd Divisor
    rating: 900
  - cf: 26A
    name: Almost Prime
    rating: 900
  - cf: 122A
    name: Lucky Division
    rating: 1000
  - lc: count-primes
    name: Count Primes
    difficulty: Medium
  - cf: 230B
    name: T-primes
    rating: 1300
    core: true
    note: a number has exactly three divisors only if it is the square of a prime
  - cf: 1360D
    name: Buying Shovels
    rating: 1300
  - cf: 1294C
    name: Product of Three Numbers
    rating: 1300
  - cf: 762A
    name: k-th divisor
    rating: 1400
  - cf: 1285C
    name: Fadi and LCM
    rating: 1400
    core: true
    note: gcd, lcm and divisors together
  - cf: 1458A
    name: Row GCD
    rating: 1600
    core: true
    note: gcd(a, b) = gcd(a, b - a)
  - cses: 1713
    name: Counting Divisors
---

## The problem

Many problems ask about primes (numbers above 1 with no divisors except 1 and themselves), divisors, or the greatest common divisor (gcd, the largest number dividing both). Typical questions:

- Is $n$ prime? Which numbers up to $10^6$ are prime?
- What is the prime factorisation of $x$ (for example $360 = 2^3 \cdot 3^2 \cdot 5$)?
- List all divisors of $n$, or count them.
- What is $\gcd(a, b)$ and $\operatorname{lcm}(a, b)$ (least common multiple)?

## Brute force first

Test $n$ for primality by trying every $d$ from 2 to $n - 1$: $O(n)$. For $n = 10^9$ that is a billion steps. Repeating it for every number up to $10^6$ is $10^{12}$ steps.

Two observations remove almost all of this work:

- If $n = a \cdot b$, one of $a, b$ is at most $\sqrt{n}$. So you only need to try $d \le \sqrt{n}$.
- Composite numbers are multiples of smaller primes. Cross those multiples out instead of testing.

## The sieve of Eratosthenes

Start with all numbers marked "maybe prime". For each prime $p$, cross out $p \cdot p, p \cdot p + p, \dots$. Multiples below $p^2$ were already crossed out by a smaller prime. Watch it work, then try a bigger $n$.

```viz
algo: sieve
input:
  n: 50
```

```cpp
vector<bool> isPrime(N + 1, true);
isPrime[0] = isPrime[1] = false;
for (long long i = 2; i * i <= N; i++)
    if (isPrime[i])
        for (long long j = i * i; j <= N; j += i) isPrime[j] = false;
```
```java
boolean[] composite = new boolean[N + 1];       // 0 and 1 are not prime either
for (long i = 2; i * i <= N; i++)
    if (!composite[(int) i])
        for (long j = i * i; j <= N; j += i) composite[(int) j] = true;
```

Cost: $O(N \log \log N)$, which is nearly linear. About 10 to 30 milliseconds for $N = 10^6$ and a few hundred milliseconds for $10^7$.

```quiz
q: Why does the inner loop of the sieve start at p * p and not at 2 * p?
options:
  - It is a speed trick that changes the result slightly
  - Multiples p*2, p*3, ... below p*p have a smaller prime factor and are already crossed out
  - Because p * p is always the next prime
answer: 1
why: "A composite number k*p with k < p has a prime factor smaller than p, so an earlier prime already crossed it out. Starting at p*p only skips work."
```

## Factorising with the smallest prime factor

If you must factorise many numbers, store for each number its smallest prime factor (SPF) during the sieve. Then factorising $x$ means: repeatedly read `spf[x]`, divide it out, count the exponent. Each factorisation takes $O(\log x)$.

The exponents give the number of divisors: if $x = p_1^{e_1} \cdots p_k^{e_k}$, there are $(e_1 + 1) \cdots (e_k + 1)$ divisors, because each prime can appear $0$ to $e_i$ times.

```cpp
#include <bits/stdc++.h>
using namespace std;

const int N = 1000000;
int spf[N + 1];

int main() {
    for (int i = 2; i <= N; i++)
        if (spf[i] == 0)                       // i is prime
            for (int j = i; j <= N; j += i)
                if (spf[j] == 0) spf[j] = i;
    int q;
    cin >> q;
    while (q--) {
        int x;
        cin >> x;
        cout << x << " =";
        long long divs = 1;
        bool first = true;
        while (x > 1) {
            int p = spf[x], e = 0;
            while (x % p == 0) { x /= p; e++; }
            cout << (first ? " " : " * ") << p;
            if (e > 1) cout << "^" << e;
            divs *= e + 1;
            first = false;
        }
        cout << " (" << divs << " divisors)\n";
    }
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        int N = 1000000;
        int[] spf = new int[N + 1];
        for (int i = 2; i <= N; i++)
            if (spf[i] == 0)                       // i is prime
                for (int j = i; j <= N; j += i)
                    if (spf[j] == 0) spf[j] = i;
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int q = Integer.parseInt(br.readLine().trim());
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) {
            int x = Integer.parseInt(br.readLine().trim());
            sb.append(x).append(" =");
            long divs = 1;
            boolean first = true;
            while (x > 1) {
                int p = spf[x], e = 0;
                while (x % p == 0) { x /= p; e++; }
                sb.append(first ? " " : " * ").append(p);
                if (e > 1) sb.append("^").append(e);
                divs *= e + 1;
                first = false;
            }
            sb.append(" (").append(divs).append(" divisors)\n");
        }
        System.out.print(sb);
    }
}
```
```input
4
12
97
360
1000000
```
```output
12 = 2^2 * 3 (6 divisors)
97 = 97 (2 divisors)
360 = 2^3 * 3^2 * 5 (24 divisors)
1000000 = 2^6 * 5^6 (49 divisors)
```

```order
prompt: Arrange the loop that divides one prime out of x and counts its exponent.
lang: cpp
code: |
  int p = spf[x], e = 0;
  while (x % p == 0) {
      x /= p;
      e++;
  }
  divs *= e + 1;
distractors:
  - "  divs *= e;"
why: Each prime with exponent e can appear 0, 1, ..., e times, so it contributes e + 1 choices.
```

## One number: divisors in square-root time

When there is a single big number (up to about $10^{12}$) and no sieve is possible, loop $i$ while $i \cdot i \le n$. Each $i$ that divides $n$ gives two divisors: $i$ and $n / i$.

```blanks
prompt: Fill in the loop that lists all divisors of n.
lang: cpp
code: |
  for (long long i = 1; [[i * i <= n|i*i<=n]]; i++) {
      if (n % i == 0) {
          d.push_back(i);
          if (i != [[n / i|n/i]]) d.push_back(n / i);
      }
  }
why: The loop only goes up to the square root. The check i != n / i stops a perfect square such as 6 * 6 = 36 from adding 6 twice.
```

## gcd and lcm

Euclid's algorithm: $\gcd(a, b) = \gcd(b, a \bmod b)$ and $\gcd(a, 0) = a$. It takes $O(\log \min(a, b))$ steps.

Properties you will use constantly:

| Fact | Use |
|---|---|
| $\gcd(a, b) \cdot \operatorname{lcm}(a, b) = a \cdot b$ | compute lcm as `a / gcd * b` (divide first to avoid overflow) |
| $\gcd(a, b) = \gcd(a, b - a)$ | gcd of a whole row of differences (Row GCD) |
| $\gcd(a, b, c) = \gcd(\gcd(a, b), c)$ | gcd of an array by folding |
| any $ax + by$ is a multiple of $\gcd(a, b)$ | which sums you can build from two step sizes |
| the running gcd of a prefix changes at most $\log_2 a$ times | each change at least halves it |

```cpp
#include <bits/stdc++.h>
using namespace std;

long long gcdll(long long a, long long b) { return b == 0 ? a : gcdll(b, a % b); }

int main() {
    long long n, m;
    cin >> n >> m;
    vector<long long> d;
    for (long long i = 1; i * i <= n; i++) {
        if (n % i == 0) {
            d.push_back(i);
            if (i != n / i) d.push_back(n / i);
        }
    }
    sort(d.begin(), d.end());
    for (size_t k = 0; k < d.size(); k++) cout << d[k] << " \n"[k + 1 == d.size()];
    long long g = gcdll(n, m);
    cout << g << "\n" << n / g * m << "\n";
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
        long m = Long.parseLong(st.nextToken());
        List<Long> d = new ArrayList<>();
        for (long i = 1; i * i <= n; i++) {
            if (n % i == 0) {
                d.add(i);
                if (i != n / i) d.add(n / i);
            }
        }
        Collections.sort(d);
        StringBuilder sb = new StringBuilder();
        for (int k = 0; k < d.size(); k++) sb.append(d.get(k)).append(k + 1 == d.size() ? '\n' : ' ');
        long g = gcd(n, m);
        sb.append(g).append('\n').append(n / g * m).append('\n');
        System.out.print(sb);
    }
}
```
```input
36 48
```
```output
1 2 3 4 6 9 12 18 36
12
144
```

```predict
lang: cpp
code: |
  int a = 12, b = 18;
  int g = __gcd(a, b);
  cout << g << " " << a / g * b;
output: "6 36"
why: gcd(12, 18) = 6, and lcm = 12 / 6 * 18 = 36. Dividing first keeps the intermediate value small.
```

## Complexity

| Task | Cost |
|---|---|
| Primality of one number | $O(\sqrt{n})$ |
| Sieve up to $N$ | $O(N \log \log N)$ time, $O(N)$ memory |
| Factorise with SPF | $O(\log x)$ per query after the sieve |
| Divisors of one $n$ | $O(\sqrt{n})$ |
| gcd | $O(\log \min(a, b))$ |

## Pitfalls

- `i * i <= n` overflows an `int` when $n$ is near $2 \cdot 10^9$. Use `long long` for `i`.
- 1 is not prime, and 0 and 1 have no prime factorisation. Handle them separately.
- A sieve of $10^9$ will not fit in memory or time. Beyond about $10^7$, change the approach.
- `a * b / g` can overflow before the division. Write `a / g * b`.
- Recursion depth is not a worry for gcd: it is only about 45 calls for 64-bit numbers.

:::truth
Number theory in contests is mostly this lesson plus the next one (modular arithmetic). The hard problems add an observation on top, such as "the answer depends only on the exponents" or "gcd must divide the difference". The code is short. The thinking is the work, and it only comes from solving problems.
:::

```cards
- q: Why is it enough to test divisors up to $\sqrt{n}$?
  a: If $n = a \cdot b$ then one of $a, b$ is at most $\sqrt{n}$, so every divisor pair has a member in that range.
- q: Complexity of the sieve of Eratosthenes?
  a: $O(N \log \log N)$ time and $O(N)$ memory.
- q: How do you count divisors from the prime factorisation?
  a: Multiply $(e_i + 1)$ over all primes. 360 = 2^3 * 3^2 * 5 has 4 * 3 * 2 = 24 divisors.
- q: How do you compute lcm safely?
  a: "`a / gcd(a, b) * b`. The division comes first so the product does not overflow early."
- q: What is the identity gcd(a, b) = gcd(a, b - a) good for?
  a: Replacing a gcd with all of $b_j$ by the gcd of $a$ and the differences, so a whole row can be answered with one precomputed value.
```

## Notes

:::notes
- Prime test for one n: try d up to sqrt(n), O(sqrt n). Use long long for d * d.
- Sieve of Eratosthenes: cross out multiples of each prime p starting at p * p. O(N log log N).
- SPF table (smallest prime factor) gives factorisation in O(log x) per number.
- Divisor count = product of (exponent + 1). Max about 1344 divisors for n up to 1e9.
- All divisors of one n: loop i up to sqrt(n), add i and n / i (once if equal).
- gcd(a, b) = gcd(b, a % b), O(log). lcm = a / gcd * b. gcd(a, b) = gcd(a, b - a).
- gcd of an array: fold. The prefix gcd changes at most log times.
- A number has exactly 3 divisors only if it is the square of a prime.
:::
