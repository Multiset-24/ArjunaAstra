---
title: How to Think About a Problem
summary: A repeatable routine for reading a statement, finding a brute force, spotting the pattern and checking your answer before you submit.
minutes: 20
difficulty: beginner
rating: [800, 1000]
tags: [problem-solving, brute-force, testing]
prereqs: [start-here]
problems:
  - cf: 231A
    name: Team
    rating: 800
    core: true
  - cf: 1335A
    name: Candies and Two Sisters
    rating: 800
  - cf: 1409A
    name: Yet Another Two Integers Problem
    rating: 800
  - cf: 1360A
    name: Minimal Square
    rating: 800
    core: true
  - cf: 1352A
    name: Sum of Round Numbers
    rating: 800
    core: true
    note: work the examples by hand first
  - cf: 1472A
    name: Cards for Friends
    rating: 800
  - cf: 1520B
    name: Ordinary Numbers
    rating: 800
  - cf: 1475A
    name: Odd Divisor
    rating: 900
  - cf: 479A
    name: Expression
    rating: 1000
  - cf: 1352B
    name: Same Parity Summands
    rating: 1200
    note: a little above the band
exercises:
  - Take any 800 problem you solved. Write the brute force you would have used, then its running time for the largest allowed input.
  - Pick a solved problem and list five edge cases. Run your code on each.
---

## The routine

Strong solvers do not wait for inspiration. They run the same steps every time.

1. **Read** the statement twice. Underline the input format, the output format and every constraint.
2. **Work the examples by hand.** Do not just compare outputs. Ask why that answer is correct.
3. **Write a brute force** in your head or on paper: the slowest correct approach.
4. **Check the constraints.** Is the brute force fast enough? If yes, code it.
5. **Look for a pattern** or something that stays true, then speed up.
6. **Convince yourself** the idea is correct before typing.
7. **Code it**, then test edge cases.

:::key
A slow correct solution is the base of every fast one. You cannot optimise what you cannot state.
:::

## Read the constraints first

Constraints are the biggest hint in the statement. They tell you how fast the solution must be (lesson 4 makes this exact).

| If you see | It usually means |
|---|---|
| n up to 10-20 | try every subset or order (exponential is fine) |
| n up to 2000 | a double loop is fine |
| n up to 200,000 | you need about $O(n \log n)$ or $O(n)$ |
| values up to 10^9 | do not loop over the value; use a formula |
| answer may be huge | use a 64-bit integer or a modulus |

## A worked example

**Problem.** Given an array of `n` numbers, count pairs of positions `i < j` with `a[i] == a[j]`. Here `n` is up to 200,000.

By hand, on `1 2 1 3 1 2`:

- Value 1 sits at 3 positions: pairs (1,3), (1,5), (3,5), so 3 pairs.
- Value 2 sits at 2 positions: 1 pair.
- Value 3 sits at 1 position: 0 pairs.
- Total: 4.

### Brute force

Try every pair. Correct and obvious.

```cpp
long long cnt = 0;
for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++)
        if (a[i] == a[j]) cnt++;
```
```java
long cnt = 0;
for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++)
        if (a[i] == a[j]) cnt++;
```

With `n = 200000` that is about $2 \times 10^{10}$ comparisons. Far too slow, but it is a perfect reference answer for small inputs.

### The pattern

Only equal values pair up, and positions do not matter. If a value appears `c` times, it forms $c(c-1)/2$ pairs. So: group equal values, apply the formula, add up. Sorting puts equal values next to each other.

```steps
title: Sorted array 1 1 1 2 2 3, counting runs
view: array
frames:
  - arr: [1, 1, 1, 2, 2, 3]
    note: After sorting, equal values form runs. Total starts at 0.
    vars: {total: 0}
  - arr: [1, 1, 1, 2, 2, 3]
    highlight: {0: active, 1: active, 2: active}
    note: Run of 1s has length 3, so 3 * 2 / 2 = 3 pairs.
    vars: {total: 3}
  - arr: [1, 1, 1, 2, 2, 3]
    highlight: {0: done, 1: done, 2: done, 3: active, 4: active}
    note: Run of 2s has length 2, so 2 * 1 / 2 = 1 pair.
    vars: {total: 4}
  - arr: [1, 1, 1, 2, 2, 3]
    highlight: {0: done, 1: done, 2: done, 3: done, 4: done, 5: active}
    note: Run of 3s has length 1, so 0 pairs. Final answer 4.
    vars: {total: 4}
```

### Code

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    sort(a.begin(), a.end());
    long long total = 0;
    for (int i = 0; i < n;) {
        int j = i;
        while (j < n && a[j] == a[i]) j++;
        long long c = j - i;
        total += c * (c - 1) / 2;
        i = j;
    }
    cout << total << "\n";
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
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = Integer.parseInt(st.nextToken());
        Arrays.sort(a);
        long total = 0;
        for (int i = 0; i < n;) {
            int j = i;
            while (j < n && a[j] == a[i]) j++;
            long c = j - i;
            total += c * (c - 1) / 2;
            i = j;
        }
        System.out.println(total);
    }
}
```
```input
6
1 2 1 3 1 2
```
```output
4
```

```blanks
prompt: Fill in the number of pairs inside a run of length c.
lang: cpp
code: |
  long long c = j - i;
  total += [[c * (c - 1) / 2|c*(c-1)/2]];
why: "Choosing 2 positions out of c gives c (c - 1) / 2. Use long long, because c can reach 200,000 and c * c is about 4e10."
```

:::note
`Arrays.sort` on an `int[]` can be attacked with specially built input on older Java versions. Lesson 7 shows the safe habit.
:::

## Convince yourself

Before coding, test the idea on an input you did not use to find it.

- **Smallest case**: `n = 1`. The formula gives 0, which is right.
- **All equal**: five 7s give $5 \cdot 4 / 2 = 10$. Count by hand: choosing 2 of 5 is 10.
- **All different**: every run has length 1, so 0.

If the idea survives these, code it.

## Stress testing

A **stress test** runs your fast solution and your brute force on thousands of small random inputs and stops at the first difference. It finds the bugs the samples miss.

```bash
for i in $(seq 1 1000); do
  python3 gen.py $i > in.txt      # random small input, seed i
  ./brute < in.txt > out1.txt
  ./fast  < in.txt > out2.txt
  cmp -s out1.txt out2.txt || { echo "differs on seed $i"; break; }
done
```

```quiz
questions:
  - q: Your idea is O(n^2) and n is 200,000. What is the right move?
    options:
      - Submit and hope the tests are weak
      - Keep it as a reference brute force and look for an O(n log n) pattern
      - Switch to a faster language
    answer: 1
    why: About 4e10 steps cannot run in a couple of seconds in any language. Use it as a checker, then search for structure.
  - q: Why use small random inputs in a stress test?
    options:
      - They run faster than large ones
      - When the two programs differ, a tiny input is easy to trace by hand
      - The judge only uses small tests
    answer: 1
    why: A failing case with 5 numbers can be debugged in a minute. A failing case with 200,000 numbers cannot.
```

:::truth
Most wrong answers at this level are not missed ideas but missed cases: n = 1, all values equal, the largest allowed value. Spend two minutes listing them before you submit.
:::

## Cards

```cards
- q: What are the first steps of the routine?
  a: Read the statement and constraints, work the examples by hand, then write a brute force.
- q: What does a brute force give you?
  a: A correct slow solution, and a reference to compare your fast solution against.
- q: What is a stress test?
  a: Running a fast solution and a brute force on many small random inputs until their outputs differ.
- q: Constraint n up to 200,000 means what?
  a: You need roughly O(n log n) or O(n). A double loop is too slow.
```

## Notes

:::notes
- Routine: read, work examples by hand, brute force, check constraints, find pattern, convince yourself, code, test edges.
- Constraints tell you the allowed speed: n up to 2000 allows O(n^2), n up to 200,000 needs about O(n log n).
- Values up to 10^9 mean "use a formula", not "loop over values".
- A brute force is the base of the fast solution and your checker.
- Pairs in a group of c equal items: c(c-1)/2, use long long.
- Test the idea on n = 1, all equal and all different before coding.
- Stress test: random small inputs, compare fast against brute, stop at the first difference.
:::
