---
title: Language Setup and Contest Template
summary: A C++ and Java template with fast input, multiple test cases, 64-bit integers and modular arithmetic, plus the errors that cost beginners the most submissions.
minutes: 25
difficulty: beginner
rating: [800, 1000]
tags: [setup, io, overflow, modulo]
prereqs: [how-to-think]
problems:
  - cf: 1742A
    name: Sum
    rating: 800
    core: true
    note: multiple test cases
  - cf: 1999A
    name: A+B Again?
    rating: 800
  - cf: 1807A
    name: Plus or Minus
    rating: 800
  - cf: 1669A
    name: Division?
    rating: 800
  - cf: 617A
    name: Elephant
    rating: 800
  - cf: 546A
    name: Soldier and Bananas
    rating: 800
    core: true
    note: a sum that grows
  - cf: 1A
    name: Theatre Square
    rating: 1000
    core: true
    note: the product needs 64 bits
  - cses: 1068
    name: Weird Algorithm
    note: values leave the int range
  - cses: 1094
    name: Increasing Array
  - cses: 1617
    name: Bit Strings
    note: modulo 10^9+7
exercises:
  - Save the template for your language as a file you can copy in one step. Compile it and run it on the sample from this lesson.
  - Write a program that reads n and prints n! modulo 998244353 for n up to 10^6. Check small values by hand.
---

## Why a template

In a contest you do not want to type input code from scratch. You keep one tested file and copy it for every problem. Everything here is about making that file correct and fast.

You need two tools:

- **C++17** compiled with `g++ -std=c++17 -O2` (`-O2` turns on optimisations, as judges do).
- **Java 17** with `javac Main.java` and `java Main`. On Codeforces the class holding `main` can have any name, but on most judges it must be `Main`.

## The template

A **test case** is one independent instance of the problem. Many problems start with `t`, the number of test cases, and your program must handle all of them in one run.

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

void solve() {
    int n;
    cin >> n;
    ll sum = 0;
    for (int i = 0; i < n; i++) {
        ll x;
        cin >> x;
        sum += x;
    }
    cout << sum << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--) solve();
    return 0;
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    static StringTokenizer st;

    static String next() throws IOException {
        while (st == null || !st.hasMoreTokens()) st = new StringTokenizer(br.readLine());
        return st.nextToken();
    }

    static int nextInt() throws IOException { return Integer.parseInt(next()); }
    static long nextLong() throws IOException { return Long.parseLong(next()); }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            int n = nextInt();
            long sum = 0;
            for (int i = 0; i < n; i++) sum += nextLong();
            out.append(sum).append("\n");
        }
        System.out.print(out);
    }
}
```
```input
2
3
1 2 3
4
1000000000 1000000000 1000000000 1000000000
```
```output
6
4000000000
```

Notice the second sum, 4000000000, is larger than an `int` can hold. That is why `sum` is `long long` (C++) or `long` (Java).

## Fast input and output

Reading 200,000 numbers with default settings can take most of a time limit. The fixes:

- **C++**: the two lines `ios::sync_with_stdio(false); cin.tie(nullptr);` stop `cin` from syncing with C's `scanf` and from flushing before every read. After them, do not mix `cin` with `scanf`.
- **Java**: `BufferedReader` reads big chunks, and `StringTokenizer` splits a line into tokens. Collect output in a `StringBuilder` and print once.
- Avoid `endl` in C++ loops. It flushes the buffer every time. Use `"\n"`.

```blanks
prompt: Complete the C++ fast-input lines.
lang: cpp
code: |
  ios::sync_with_stdio([[false]]);
  cin.tie([[nullptr|NULL|0]]);
why: The first call detaches C++ streams from C streams. The second stops cin from flushing cout before each read.
```

## Reading different shapes of input

- **One number per token**: `cin >> x` skips spaces and newlines for you. In Java, use the `next()` helper above.
- **A string without spaces**: `cin >> s` in C++, `next()` in Java.
- **A whole line with spaces**: `getline(cin, line)` in C++, `br.readLine()` in Java. Mixing `cin >> n` then `getline` leaves the newline behind, so read and discard it first.
- **Unknown count**: loop `while (cin >> x)` in C++. Java reads until `readLine()` returns `null`.

Read the format line in the statement slowly. Most input bugs are a misread format, not a misunderstood algorithm.

## Integers: int versus long long

| Type | Range | Use when |
|---|---|---|
| `int` / `int` | about -2.1e9 to 2.1e9 | counts, indices, small values |
| `long long` / `long` | about -9.2e18 to 9.2e18 | sums, products, anything near 10^9 times something |

The rule: **if two numbers can each reach 10^5 or more, their product might overflow an `int`**. When in doubt, use 64 bits. It costs almost nothing.

```predict
lang: java
code: |
  int a = 100000;
  long x = a * a;
  long y = (long) a * a;
  System.out.println(x + " " + y);
output: 1410065408 10000000000
why: "a * a is computed in int first and wraps around, then the wrong value is widened to long. The cast on one operand makes the multiplication 64-bit."
```

:::warn
In C++, signed overflow is **undefined behaviour**: the compiler may assume it never happens and produce odd results. In Java it wraps silently. Neither gives an error, so a wrong answer is the only symptom.
:::

## Modulo 10^9+7

When an answer can be astronomically large, a problem asks for it **modulo** `1000000007` (written $10^9+7$, a prime). The result is the remainder after division. Take the remainder after every multiplication, so numbers stay small. Two residues below $10^9+7$ multiply to under $10^{18}$, which fits in 64 bits.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    const long long MOD = 1000000007LL;
    int n;
    cin >> n;
    long long f = 1;
    for (int i = 2; i <= n; i++) f = f * i % MOD;
    cout << f << "\n";
}
```
```java
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        final long MOD = 1000000007L;
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        long f = 1;
        for (int i = 2; i <= n; i++) f = f * i % MOD;
        System.out.println(f);
    }
}
```
```input
25
```
```output
440732388
```

```predict
lang: cpp
prompt: C++ remainder keeps the sign of the left operand. What prints?
code: |
  cout << (-7) % 3 << " " << (-7) / 2 << " " << ((-7) % 3 + 3) % 3;
output: -1 -3 2
why: Division truncates toward zero, so -7 / 2 is -3 and -7 % 3 is -1. Adding the modulus and taking the remainder again gives the non-negative value 2.
```

## Errors you will meet

| Symptom | Likely cause |
|---|---|
| Compilation error | typo, missing `;`, wrong type, wrong class name in Java |
| Wrong answer on test 1 | output format: missing newline, wrong case (`Yes` versus `YES`) |
| Wrong answer on a later test | overflow, a missed edge case, uninitialised variable |
| Runtime error | index outside the array, division by zero, uncaught exception, too-deep recursion |
| Time limit exceeded | slow input (no fast I/O), `endl`, or an algorithm that is too slow |
| Memory limit exceeded | an array bigger than the limit allows |

:::tip
In C++, global arrays start as zeros but local ones hold garbage until you set them. Initialise everything you read before writing.
:::

```predict
lang: cpp
code: |
  cout << 'a' + 1 << " " << (char)('a' + 1);
output: 98 b
why: "'a' is the number 97, so 'a' + 1 is the int 98. The cast turns 98 back into the character b."
```

```quiz
q: A problem asks for the answer modulo 1000000007, and you compute (a * b) % MOD with a and b both below MOD. What type must a and b have?
options:
  - int, because both are below 10^9+7
  - long long, because the product can reach about 10^18
  - double, because it is larger
answer: 1
why: Each value fits in an int, but the product does not. Use 64-bit variables so the multiplication happens in 64 bits before the remainder.
```

## Cards

```cards
- q: Which two C++ lines speed up cin and cout?
  a: ios::sync_with_stdio(false); and cin.tie(nullptr);
- q: Why avoid endl in a loop?
  a: It flushes the output buffer every time, which is slow. Use "\n".
- q: When must you use long long or long?
  a: When a sum or product can exceed about 2.1e9, for example two values near 10^5 or more multiplied, or many values of 10^9 added.
- q: What does -7 % 3 give in C++ and Java?
  a: -1. The sign follows the left operand. Use ((x % m) + m) % m for a non-negative result.
- q: Why take the remainder after each multiplication?
  a: It keeps every number below the modulus, so products fit in 64 bits.
```

## Notes

:::notes
- Keep one tested template per language and copy it for every problem.
- C++ compile: g++ -std=c++17 -O2. Java: public class Main, BufferedReader and StringTokenizer.
- Fast IO in C++: sync_with_stdio(false), cin.tie(nullptr), "\n" not endl.
- Many problems begin with t test cases; wrap the work in solve() and loop.
- Use long long or long when values or products can pass about 2e9. Overflow gives no error.
- Mod 10^9+7: reduce after every multiplication; the product of two residues fits in 64 bits.
- Negative remainder: ((x % m) + m) % m.
- Check output format first when test 1 fails; check overflow and edge cases when a later test fails.
:::
