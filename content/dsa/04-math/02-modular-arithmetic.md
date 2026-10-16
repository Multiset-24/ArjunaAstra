---
title: Modular Arithmetic
summary: Work with remainders so huge answers fit in 64 bits, with fast exponentiation, modular inverses and nCr modulo a prime.
minutes: 40
difficulty: intermediate
rating: [900, 1600]
tags: [math, modular arithmetic, binary exponentiation, combinatorics]
prereqs: [number-theory, math-basics]
problems:
  - cf: 913A
    name: Modular Exponentiation
    rating: 900
  - cses: 1095
    name: Exponentiation
  - lc: powx-n
    name: Pow(x, n)
    difficulty: Medium
  - cf: 1514B
    name: AND 0, Sum Big
    rating: 1200
    core: true
    note: the answer is k to the power n, modulo 10^9 + 7
  - cf: 1931D
    name: Divisible Pairs
    rating: 1300
  - cses: 1712
    name: Exponentiation II
  - cf: 1513B
    name: AND Sequences
    rating: 1400
    core: true
    note: count with factorials, take the result modulo p
  - cses: 1079
    name: Binomial Coefficients
  - cf: 1475E
    name: Advertising Agency
    rating: 1600
    core: true
    note: nCr modulo a prime
---

## The problem

Many counting problems have answers like the number of ways to arrange 1000 items, which has thousands of digits. No integer type holds that. So the statement says: "print the answer modulo $10^9 + 7$", meaning the remainder after dividing by $1\,000\,000\,007$.

The modulus is a prime that fits in 32 bits. Two numbers below it multiply to less than about $10^{18}$, which still fits in a 64-bit `long long`.

You must keep every number reduced as you go. Computing the exact value first and reducing at the end is the same wrong idea as brute force: the exact value is far too big.

## Brute force first

Compute $2^{n}$ by multiplying by 2 a total of $n$ times, taking the remainder each time. That is $O(n)$ and fine for $n = 10^6$. For $n = 10^{18}$ it is hopeless. We also need a way to divide, which remainders do not allow directly.

## Rules for remainders

Writing $a \bmod m$ for the remainder:

| Operation | Safe rule |
|---|---|
| Add | $(a + b) \bmod m = ((a \bmod m) + (b \bmod m)) \bmod m$ |
| Subtract | $((a - b) \bmod m + m) \bmod m$ |
| Multiply | $((a \bmod m) \cdot (b \bmod m)) \bmod m$ |
| Divide | not allowed directly, see inverses below |

The subtract rule exists because `%` of a negative number in C++ and Java can be negative.

```predict
lang: cpp
code: |
  cout << (-7) % 5 << " " << ((-7 % 5) + 5) % 5;
output: "-2 3"
why: In C++ and Java the sign of % follows the left operand, so -7 % 5 is -2. Adding 5 and taking % 5 again gives the usual non-negative remainder 3.
```

```predict
lang: cpp
code: |
  long long a = 1000000000LL, b = 1000000000LL;
  cout << a * b % 1000000007LL;
output: "49"
why: 10^9 is 7 less than the modulus, so it is -7 modulo p. Then (-7) * (-7) = 49. The product 10^18 fits in long long, so no overflow happens first.
```

:::warn
The most common bug: `a * b * c % MOD`. The first product is reduced only at the end, so `a * b` can overflow if `c` is large. Write `a * b % MOD * c % MOD`.
:::

## Binary exponentiation

To compute $b^e \bmod m$ fast, use the binary form of $e$. Each bit of $e$ says whether the current power of $b$ is part of the answer.

- $b^{13} = b^{8} \cdot b^{4} \cdot b^{1}$, since $13 = 1101_2$.
- Keep squaring $b$: $b, b^2, b^4, b^8, \dots$
- Multiply the result by the current square whenever the lowest bit of $e$ is 1, then shift $e$ right.

That is $O(\log e)$ multiplications, so about 60 for $e = 10^{18}$.

```order
prompt: Arrange binary exponentiation.
lang: cpp
code: |
  long long power(long long b, long long e) {
      long long r = 1;
      b %= MOD;
      while (e > 0) {
          if (e & 1) r = r * b % MOD;
          b = b * b % MOD;
          e >>= 1;
      }
      return r;
  }
distractors:
  - "        b = b * b;"
why: Both the result and the base must stay reduced after every multiplication, otherwise they overflow after a few squarings.
```

## Division: the modular inverse

The inverse of $a$ modulo $m$ is a number $a^{-1}$ with $a \cdot a^{-1} \equiv 1 \pmod m$. Dividing by $a$ then means multiplying by $a^{-1}$.

Fermat's little theorem says: if $p$ is prime and $a$ is not a multiple of $p$, then $a^{p-1} \equiv 1 \pmod p$. Divide both sides by $a$ and you get

$$a^{-1} \equiv a^{p-2} \pmod p.$$

So the inverse is one call to the power function. For example the inverse of 2 modulo $10^9 + 7$ is $500\,000\,004$, because $2 \cdot 500\,000\,004 = 1\,000\,000\,008 \equiv 1$.

```blanks
prompt: Complete the modular inverse (the modulus MOD is prime).
lang: cpp
code: |
  long long inverse(long long a) {
      return power(a, [[MOD - 2|MOD-2]]);
  }
why: Fermat's little theorem gives a^(p-1) = 1 modulo a prime p, so a^(p-2) is the inverse of a.
```

```quiz
q: When does the Fermat formula a^(p-2) fail to give the inverse of a?
options:
  - When a is larger than 1000
  - When p is not prime, or a is a multiple of p
  - When a is odd
answer: 1
why: The theorem needs p prime and gcd(a, p) = 1. For a composite modulus use the extended Euclidean algorithm instead (it works whenever gcd(a, m) = 1). A multiple of p has no inverse at all.
```

## nCr modulo a prime

The binomial coefficient $\binom{n}{r}$ ("n choose r") is the number of ways to choose $r$ items from $n$:

$$\binom{n}{r} = \frac{n!}{r!\,(n-r)!}.$$

Factorials are huge and division is needed, so use the tools above:

1. Precompute `fact[i]` $= i! \bmod p$ for all $i$ up to the largest $n$.
2. Compute the inverse of `fact[N]` once with Fermat, then walk downward: $\frac{1}{(i-1)!} = \frac{1}{i!} \cdot i$. This gives all inverse factorials with one power call.
3. Answer each query in $O(1)$: `fact[n] * invFact[r] % p * invFact[n-r] % p`.

```cpp
#include <bits/stdc++.h>
using namespace std;

const long long MOD = 1000000007LL;
const int N = 1000000;
long long fact[N + 1], invFact[N + 1];

long long power(long long b, long long e) {
    long long r = 1;
    b %= MOD;
    while (e > 0) {
        if (e & 1) r = r * b % MOD;
        b = b * b % MOD;
        e >>= 1;
    }
    return r;
}

int main() {
    fact[0] = 1;
    for (int i = 1; i <= N; i++) fact[i] = fact[i - 1] * i % MOD;
    invFact[N] = power(fact[N], MOD - 2);
    for (int i = N; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;
    int q;
    cin >> q;
    while (q--) {
        int n, r;
        cin >> n >> r;
        if (r < 0 || r > n) cout << 0 << "\n";
        else cout << fact[n] * invFact[r] % MOD * invFact[n - r] % MOD << "\n";
    }
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    static final long MOD = 1000000007L;

    static long power(long b, long e) {
        long r = 1;
        b %= MOD;
        while (e > 0) {
            if ((e & 1) == 1) r = r * b % MOD;
            b = b * b % MOD;
            e >>= 1;
        }
        return r;
    }

    public static void main(String[] args) throws IOException {
        int N = 1000000;
        long[] fact = new long[N + 1], invFact = new long[N + 1];
        fact[0] = 1;
        for (int i = 1; i <= N; i++) fact[i] = fact[i - 1] * i % MOD;
        invFact[N] = power(fact[N], MOD - 2);
        for (int i = N; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int q = Integer.parseInt(br.readLine().trim());
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int n = Integer.parseInt(st.nextToken());
            int r = Integer.parseInt(st.nextToken());
            if (r < 0 || r > n) sb.append(0).append('\n');
            else sb.append(fact[n] * invFact[r] % MOD * invFact[n - r] % MOD).append('\n');
        }
        System.out.print(sb);
    }
}
```
```input
5
5 2
10 5
1000 500
1000000 500000
3 5
```
```output
10
252
159835829
996692777
0
```

## Walkthrough: 5 choose 2

- `fact[5] = 120`, `fact[2] = 2`, `fact[3] = 6`.
- $\binom{5}{2} = 120 / (2 \cdot 6) = 10$. The code computes the same thing as `120 * inv(2) * inv(6)`, where `inv` means the inverse modulo $p$.
- Because the exact answer is small, the modular answer equals it: 10.

## Complexity

- Precomputation: $O(N)$ time and memory, plus one $O(\log p)$ power call.
- Each nCr query: $O(1)$.
- A single power call: $O(\log e)$.

## Pitfalls

- Forgetting the `+ MOD` after a subtraction.
- Multiplying three numbers before reducing.
- Using `int` for `fact[]`. A product of two values below $10^9 + 7$ needs 64 bits.
- Taking the inverse of 0, or when the modulus is not prime. Check the statement for 998244353 (prime) or other moduli.
- Forgetting the case $r > n$ or $r < 0$. It must give 0.
- Precomputing factorials only up to a bound smaller than the largest `n` in the tests.

:::truth
Modular arithmetic has no deep idea beyond what is on this page, yet it costs many beginners wrong answers. The cause is almost always one missing `% MOD` or one overflowing product. A habit helps more than cleverness: reduce after every operation and use `long long` everywhere.
:::

```cards
- q: What does "print the answer modulo 10^9 + 7" mean?
  a: Print the remainder of the true answer divided by 1000000007. Reduce after every operation to avoid overflow.
- q: How do you subtract safely under a modulus?
  a: "`((a - b) % MOD + MOD) % MOD`, because % can return a negative number."
- q: What does binary exponentiation do and what does it cost?
  a: Squares the base and multiplies it into the result for each set bit of the exponent. It takes $O(\log e)$ multiplications.
- q: How do you divide by a modulo a prime p?
  a: Multiply by the modular inverse $a^{p-2}$ (Fermat's little theorem), computed with fast exponentiation.
- q: How do you answer many nCr queries modulo a prime?
  a: Precompute fact[] and invFact[] up to N, then use fact[n] * invFact[r] * invFact[n-r] in $O(1)$.
```

## Notes

:::notes
- Modulus 1e9+7 and 998244353 are primes. Products of two residues fit in long long.
- Add, subtract and multiply under a modulus. Subtract as (a - b + MOD) % MOD. No direct division.
- Reduce after every multiplication: a * b % MOD * c % MOD.
- Binary exponentiation: while e > 0, multiply result if the low bit is 1, square the base, shift e. O(log e).
- Inverse of a modulo prime p: a^(p-2). Fails if p is not prime or p divides a.
- nCr = fact[n] * invFact[r] * invFact[n-r]. Build invFact from one power call and a downward loop.
- Return 0 for r < 0 or r > n.
- % of a negative number is negative in C++ and Java.
:::
