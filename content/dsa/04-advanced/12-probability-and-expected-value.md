---
title: Probability and Expected Value
summary: Compute averages over random processes with linearity of expectation, indicator variables and expected-value DP, and print fractions modulo a prime.
minutes: 45
difficulty: advanced
rating: [1500, 2200]
tags: [probability, expected-value, dp, modular-arithmetic, math]
prereqs: [modular-arithmetic, combinatorics, dp-introduction]
problems:
  - lc: knight-probability-in-chessboard
    name: Knight Probability in Chessboard
    difficulty: Medium
    note: probability DP over steps
  - cf: 839C
    name: Journey
    rating: 1500
    core: true
    note: expected path length on a tree, one DFS
  - cf: 1461C
    name: Random Events
    rating: 1500
    note: the answer is 1 minus a product of probabilities
  - cf: 453A
    name: Little Pony and Expected Maximum
    rating: 1600
    core: true
    note: E[max] = sum over k of P(max >= k)
  - cf: 518D
    name: Ilya and Escalator
    rating: 1700
    note: expected value DP over time
  - cf: 148D
    name: Bag of mice
    rating: 1800
  - lc: new-21-game
    name: New 21 Game
    difficulty: Medium
    note: probability DP with a sliding window sum
  - cf: 235B
    name: Let's Play Osu!
    rating: 2000
    core: true
    note: maintain the expected value of a running streak
  - cf: 1753C
    name: Wish I Knew How to Sort
    rating: 2000
    core: true
    note: expected-value DP with a self-loop, answer mod 998244353
  - cf: 280C
    name: Game on Tree
    rating: 2200
    note: linearity, one indicator per vertex
---

## The problem

Randomness enters competitive programming in three ways.

- **Probability:** how likely is an outcome? "What is the chance the die shows 6?"
- **Expected value (EV):** the average result if you repeated the process many times. "On average, how many rolls until the first 6?"
- **Modular answers:** the expected value is a fraction $p/q$, and the statement asks for $p \cdot q^{-1}$ modulo a prime.

Definition: $E[X] = \sum_x x \cdot P(X = x)$, each outcome weighted by its probability.

## Brute force first

- List every outcome, give each its probability and add up. For $n$ coin flips that is $2^n$ outcomes.
- Even for $n = 40$ this is far too slow, and for processes without a fixed end (roll until you get a 6) the list is infinite.

We need two tools that skip the enumeration.

## Tool 1: linearity of expectation

For any random variables, **even dependent ones**:

$$E[X + Y] = E[X] + E[Y]$$

The standard trick uses an **indicator variable**: $I_j = 1$ if event $j$ happens, else 0. Then $E[I_j] = P(\text{event } j)$, and if $X$ counts events, $X = \sum I_j$ gives $E[X] = \sum P(\text{event } j)$.

| Question | Indicators | Answer |
|---|---|---|
| Fixed points of a random permutation of $n$ items | $I_i$ = item $i$ is in its place, $P = 1/n$ | $n \cdot \frac1n = 1$ |
| Inversions in a random permutation | $I_{ij}$ = pair $i<j$ is out of order, $P = 1/2$ | $\binom n2 / 2 = n(n-1)/4$ |
| Heads in $n$ flips with probability $p$ | one per flip | $np$ |

You never need to know how the events depend on each other. That is why this trick turns scary problems into one-line sums.

```quiz
q: Shuffle 100 items uniformly at random. What is the expected number of items that end up in their original position?
options:
  - 0.01
  - 1
  - 50
  - 100
answer: 1
why: "Each of the 100 items is in its place with probability 1/100. By linearity the expectation is 100 * (1/100) = 1, even though these events are not independent."
```

```estimate
q: You roll a fair six-sided die again and again until a 6 appears. On average, how many rolls?
answer: 6
unit: rolls
tolerance: 0.1
hint: Success has probability 1/6 each roll. For a first success the average wait is 1 divided by the success probability.
solution: "Let E be the expected rolls. With probability 1/6 you are done after 1 roll. Otherwise you used 1 roll and are back at the start: E = 1 + (5/6)E, so E/6 = 1 and E = 6. In general the wait is 1/p."
```

## Tool 2: expected-value DP

Define $E[s]$ = expected remaining cost from state $s$. Then

$$E[s] = \sum_{t} P(s \to t) \cdot \bigl(\text{cost}(s \to t) + E[t]\bigr)$$

- Terminal states have $E = 0$ (nothing more to pay).
- Fill states in an order where $E[t]$ is known before $E[s]$ (often backwards).
- If a state can return to **itself** with probability $q$, move it to the left: $E[s] = c + qE[s] + \dots$ becomes $E[s] = (c + \dots)/(1 - q)$.

Example: a frog stands on stone 1 of $n$. Each jump moves it 1 to 6 stones forward with equal probability. How many jumps, on average, until it is on stone $n$ or beyond?

- $E[i] = 1 + \frac16 \sum_{d=1}^{6} E[i+d]$, with $E[j] = 0$ for $j \ge n$.
- Compute $i = n-1$ down to $1$. Answer: $E[1]$.

## Answers modulo a prime

If the statement says "print $p \cdot q^{-1} \bmod 998244353$", the true answer is the fraction $p/q$ and you must never use floating point.

- $q^{-1}$ is the **modular inverse**: the number $r$ with $q \cdot r \equiv 1 \pmod M$.
- For a prime $M$, **Fermat's little theorem** gives $q^{M-2} \equiv q^{-1}$. Compute it by fast exponentiation in $O(\log M)$.
- Replace every division by multiplication with the inverse. Precompute inverses of constants like 6 or 100 once.
- Add, subtract and multiply under `% MOD` as usual. After a subtraction add `MOD` before taking `%`.

```predict
lang: cpp
code: |
  const long long MOD = 998244353;
  long long inv6 = 166374059;
  cout << 6 * inv6 % MOD << " " << (1 + inv6) % MOD;
output: 1 166374060
why: 166374059 is 1/6 modulo 998244353, so 6 times it is 1. The value 7/6 = 1 + 1/6 is therefore 1 + 166374059 = 166374060.
```

The frog program prints both the decimal value (for checking) and the modular value:

```cpp
#include <bits/stdc++.h>
using namespace std;

const long long MOD = 998244353;

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
    int n;
    cin >> n;
    // E[i] = expected jumps to reach stone n or beyond, starting from stone i
    vector<double> ed(n + 7, 0.0);
    vector<long long> em(n + 7, 0);
    long long inv6 = power(6, MOD - 2);
    for (int i = n - 1; i >= 1; i--) {
        double sd = 0;
        long long sm = 0;
        for (int d = 1; d <= 6; d++) {
            sd += ed[i + d];
            sm = (sm + em[i + d]) % MOD;
        }
        ed[i] = 1 + sd / 6;
        em[i] = (1 + sm * inv6) % MOD;
    }
    printf("%.6f\n%lld\n", ed[1], em[1]);
}
```
```java
import java.util.*;

public class Main {
    static final long MOD = 998244353L;

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

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        double[] ed = new double[n + 7];
        long[] em = new long[n + 7];
        long inv6 = power(6, MOD - 2);
        for (int i = n - 1; i >= 1; i--) {
            double sd = 0;
            long sm = 0;
            for (int d = 1; d <= 6; d++) {
                sd += ed[i + d];
                sm = (sm + em[i + d]) % MOD;
            }
            ed[i] = 1 + sd / 6;
            em[i] = (1 + sm * inv6) % MOD;
        }
        System.out.printf(Locale.US, "%.6f%n%d%n", ed[1], em[1]);
    }
}
```
```input
10
```
```output
3.043325
260134797
```

Walkthrough for $n = 3$: $E[2] = 1$, because any jump from stone 2 reaches 3 or beyond. Then $E[1] = 1 + \frac16 (E[2] + 0 + 0 + 0 + 0 + 0) = 1 + \frac16 = \frac76 \approx 1.1667$. Modulo $998244353$ that is $166374060$.

```blanks
prompt: Fill in the recurrence line of the frog DP (C++).
lang: cpp
code: |
  ed[i] = [[1]] + sd / [[6]];
why: Each jump costs one unit, and the next stone is one of six equally likely ones, so the average of the six E values is their sum divided by 6.
```

## Linearity in code

Every pair of neighbouring items $i, i+1$ is present independently with probabilities $p_i\%$ and $p_{i+1}\%$. The expected number of adjacent present pairs is $\sum_i \frac{p_i}{100} \cdot \frac{p_{i+1}}{100}$. Each term is one indicator. The terms overlap, but linearity does not care.

```cpp
#include <bits/stdc++.h>
using namespace std;

const long long MOD = 998244353;

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
    int n;
    cin >> n;
    vector<long long> p(n);
    for (auto &x : p) cin >> x;
    long long inv100 = power(100, MOD - 2), ans = 0;
    for (int i = 0; i + 1 < n; i++) {
        long long a = p[i] * inv100 % MOD;       // probability as a residue
        long long b = p[i + 1] * inv100 % MOD;
        ans = (ans + a * b) % MOD;
    }
    cout << ans << "\n";
}
```
```java
import java.util.*;

public class Main {
    static final long MOD = 998244353L;

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

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        long[] p = new long[n];
        for (int i = 0; i < n; i++) p[i] = sc.nextLong();
        long inv100 = power(100, MOD - 2), ans = 0;
        for (int i = 0; i + 1 < n; i++) {
            long a = p[i] * inv100 % MOD;
            long b = p[i + 1] * inv100 % MOD;
            ans = (ans + a * b) % MOD;
        }
        System.out.println(ans);
    }
}
```
```input
4
50 50 100 20
```
```output
848507701
```

The exact answer is $0.25 + 0.5 + 0.2 = 0.95 = 19/20$, and $848507701$ is $19 \cdot 20^{-1}$ modulo $998244353$.

```order
prompt: Arrange fast modular exponentiation.
lang: cpp
code: |
  long long r = 1;
  b %= MOD;
  while (e > 0) {
      if (e & 1) r = r * b % MOD;
      b = b * b % MOD;
      e >>= 1;
  }
  return r;
distractors:
  - "      b = b * b;"
why: Square the base each round and multiply it into the result when the lowest bit of the exponent is set. Dropping the % MOD on the squaring step overflows a 64-bit integer after a few rounds.
```

## Complexity

| Part | Cost |
|---|---|
| Linearity sum over $m$ events | $O(m)$ |
| EV DP with $S$ states and $T$ transitions each | $O(S \cdot T)$ |
| One modular inverse (fast power) | $O(\log M)$ |
| Many inverses of $1..n$ | $O(n)$ with $inv[i] = -(M/i) \cdot inv[M \bmod i]$ |

:::truth
Expected-value problems rarely need new algorithms; they need a clean definition of the state. Spend your time on "what exactly is a state and what is the cost of one step". If you cannot say that in one sentence, the DP will have bugs.
:::

## Pitfalls

- **Multiplying probabilities that are not independent.** $P(A \text{ and } B) = P(A) P(B)$ only for independent events. Linearity of expectation needs no independence, but products of expectations do: $E[XY] \ne E[X]E[Y]$ in general.
- **Floating point when the statement wants a modulus.** Doubles lose exactness. Use modular inverses everywhere.
- **Dividing by a number that is 0 modulo $M$.** In a fraction $p/q$, $q$ must not be a multiple of $M$. Problems promise this; if your own formula could divide by zero, rethink it.
- **Self-loops.** If $E[s]$ appears on both sides, solve the equation algebraically before coding. A recursion that calls itself loops forever.
- **Negative residues.** After `a - b` use `(a - b + MOD) % MOD`. In Java and C++ `%` can return a negative number.
- **Precision output.** For real-valued answers print enough digits (usually 9) unless the checker says otherwise.

:::details[E[max] and tail sums]
For a non-negative integer variable, $E[X] = \sum_{k \ge 1} P(X \ge k)$. For the maximum of $m$ rolls of an $n$-sided die, $P(\max \le k) = (k/n)^m$, so $P(\max \ge k) = 1 - ((k-1)/n)^m$. Summing over $k$ from 1 to $n$ gives the answer in $O(n \log m)$. This is Little Pony and Expected Maximum.
:::

## Notes

:::notes
- E[X] = sum of x * P(X = x). Linearity: E[X + Y] = E[X] + E[Y] always, no independence needed.
- Indicator trick: X = sum of I_j with I_j = 1 if event j happens; E[X] = sum of P(event j).
- Random permutation: expected fixed points = 1; expected inversions = n(n-1)/4.
- Geometric wait: if each try succeeds with probability p, expected tries = 1/p.
- EV DP: E[s] = sum over transitions of P * (cost + E[next]). Terminal states are 0; fill in dependency order.
- Self-loop with probability q: E[s] = (c + other terms) / (1 - q).
- Modular answer: p/q becomes p * q^(M-2) mod M for prime M (Fermat). Precompute inverses of constants.
- Do not use doubles when the statement asks for a modulus; do not multiply non-independent probabilities.
- Fix negatives with (a - b + MOD) % MOD.
- E[max] = sum over k of P(max >= k).
:::

```cards
- q: What does linearity of expectation say, and what does it not require?
  a: E[X + Y] = E[X] + E[Y]. It does not require X and Y to be independent.
- q: How do you compute the expected count of something with indicators?
  a: Write the count as a sum of indicators (1 if event j happens, else 0). The expectation is the sum of the events' probabilities.
- q: Expected number of tries until the first success, with success probability p each try?
  a: 1/p.
- q: How do you print a fraction p/q modulo a prime M?
  a: Print p * q^(M-2) mod M, where q^(M-2) is the modular inverse of q by Fermat's little theorem.
- q: How do you handle a state that can return to itself with probability q in an EV DP?
  a: Collect E[s] on one side: E[s] = (cost + other terms) / (1 - q).
- q: Is E[XY] equal to E[X] E[Y]?
  a: Only if X and Y are independent (or uncorrelated). In general it is not.
```
