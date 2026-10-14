---
title: Complexity and Constraints
summary: Estimate whether a solution will run in time from the input size, using Big-O and the rule of thumb of about 10^8 operations per second.
minutes: 25
difficulty: beginner
rating: [800, 1200]
tags: [complexity, big-o, constraints, memory]
prereqs: [how-to-think, language-setup]
problems:
  - cf: 1328A
    name: Divisibility Problem
    rating: 800
  - cf: 1370A
    name: Maximum GCD
    rating: 800
    core: true
    note: do not try every pair
  - cf: 1520B
    name: Ordinary Numbers
    rating: 800
    core: true
  - cf: 1475A
    name: Odd Divisor
    rating: 900
  - cf: 1490C
    name: Sum of Cubes
    rating: 1100
  - cf: 1352C
    name: K-th Not Divisible by n
    rating: 1200
    core: true
    note: k is up to 10^9
  - cses: 1083
    name: Missing Number
  - cses: 1618
    name: Trailing Zeros
    note: n up to 10^9
  - lc: power-of-two
    name: Power of Two
    difficulty: Easy
exercises:
  - For three problems you have solved, write the constraint, the complexity of your solution, and the number of operations for the largest input.
  - Write a loop with complexity O(n log n) and one with O(sqrt n). Predict the iteration count for n = 100 before running.
---

## What Big-O counts

**Time complexity** describes how the number of basic steps grows when the input size `n` grows. **Big-O** notation, written $O(\cdot)$, keeps only the fastest-growing term and drops constants. A loop of `3n + 10` steps is $O(n)$.

| Name | Written | Typical source |
|---|---|---|
| constant | $O(1)$ | a formula, an array lookup |
| logarithmic | $O(\log n)$ | halving the range each step |
| linear | $O(n)$ | one loop |
| linearithmic | $O(n \log n)$ | sorting |
| quadratic | $O(n^2)$ | two nested loops |
| cubic | $O(n^3)$ | three nested loops |
| exponential | $O(2^n)$ | trying every subset |

Rules you will use daily:

- **Sequential loops add**; the largest wins. $O(n) + O(n^2) = O(n^2)$.
- **Nested loops multiply**: $n$ times $n$ is $n^2$.
- **Halving or doubling** a counter gives $\log n$. About 30 halvings turn $10^9$ into 1.

```predict
lang: cpp
code: |
  int n = 5, cnt = 0;
  for (int i = 0; i < n; i++)
      for (int j = 0; j < i; j++) cnt++;
  cout << cnt;
output: '10'
why: The inner loop runs 0, 1, 2, 3, 4 times, which sums to 10. In general it is n(n-1)/2, still O(n^2).
```

```predict
lang: cpp
code: |
  int cnt = 0;
  for (int i = 1; i <= 100; i *= 2) cnt++;
  cout << cnt;
output: '7'
why: i takes the values 1, 2, 4, 8, 16, 32, 64, and the next value 128 stops the loop. That is about log2(100).
```

## The 10^8 rule

A typical judge runs roughly $10^8$ simple operations per second in C++, and a bit fewer in Java. Time limits are usually 1-2 seconds. So the plan is simple: count operations for the largest input, and compare with about $10^8$ per second of limit.

Drag the slider and watch which curves cross the budget.

```viz
algo: complexity
input:
  n: 200000
```

:::truth
This is a rule of thumb, not a law. Plain additions and array reads can run several times faster. Divisions, `map` operations and cache-unfriendly memory access can be 10 to 50 times slower per step. Treat $10^8$ as a planning number, then leave a safety margin.
:::

## Counting in practice

Follow this routine on any solution before you code it.

1. Find the largest input size in the statement.
2. Count the loops that depend on it, and multiply nested ones.
3. Add the cost of library calls. Sorting costs $O(n \log n)$. A `set` or `map` operation costs $O(\log n)$. Building a string by repeatedly adding one character at the front can cost $O(n)$ per step.
4. Divide by $10^8$ and compare with the time limit.

A second thing to check is the **number of test cases**. If the statement says the sum of `n` over all tests is at most 200,000, then your total work is bounded by that sum. If it says nothing, and there are 10,000 tests of size 100,000, even $O(n)$ per test is too slow.

## Constraints tell you the algorithm

Read the largest `n` in the statement, then pick from this table.

| Largest n | Complexity that fits | Typical approach |
|---|---|---|
| 10 | $O(n!)$ | try every order |
| 20 | $O(2^n \cdot n)$ | try every subset |
| 500 | $O(n^3)$ | triple loop |
| 5,000 | $O(n^2)$ | double loop |
| 200,000 | $O(n \log n)$ | sorting, binary search, heaps |
| $10^6$ to $10^7$ | $O(n)$ | one pass, prefix sums |
| $10^9$ or more | $O(\log n)$ or $O(1)$ | formula, binary search on value |

```estimate
q: An O(n^2) solution runs with n = 200,000 at 10^8 simple steps per second. About how many seconds?
answer: 400
unit: seconds
tolerance: 0.5
hint: n^2 = 4 x 10^10 steps.
solution: 4 x 10^10 / 10^8 = 400 seconds. The limit is 1-2 seconds, so you need O(n log n), about 3.6 million steps.
```

```quiz
q: A problem has n up to 100,000 and a time limit of 1 second. Which solution is the most reasonable target?
options:
  - O(n^2)
  - O(n log n)
  - O(2^n)
answer: 1
why: n^2 is 10^10, which is about a hundred times too slow. 2^n is astronomically larger. n log n is under two million steps.
```

## Amortised cost

Some code looks quadratic but is not. **Amortised** analysis averages cost over the whole run instead of the worst single step.

```cpp
int l = 0;
for (int r = 0; r < n; r++) {          // r moves right n times
    sum += a[r];
    while (sum > limit) sum -= a[l++]; // l only moves right
}
```
```java
int l = 0;
for (int r = 0; r < n; r++) {          // r moves right n times
    sum += a[r];
    while (sum > limit) sum -= a[l++]; // l only moves right
}
```

The inner `while` can run many times in one round, but `l` never moves left and never passes `n`. Across the whole loop it runs at most `n` times in total. The code is $O(n)$, not $O(n^2)$. The same idea explains why `vector::push_back` and Java `ArrayList.add` are cheap on average: occasional resizing is paid for by many cheap appends.

```quiz
q: A for loop over i from 1 to n contains `while (x > 0) x /= 2;` where x is reset to n each round. What is the complexity?
options:
  - O(n)
  - O(n log n)
  - O(n^2)
answer: 1
why: The inner loop halves x, so it runs about log n times each round, and there are n rounds. Here x is reset, so nothing is amortised away.
```

## Memory

Judges also limit memory, commonly 256 MB. An `int` takes 4 bytes, a `long long` 8 bytes, a `bool` or `char` 1 byte.

| Structure | Approx. size |
|---|---|
| `int a[10^6]` | 4 MB |
| `int a[10^7]` | 40 MB |
| `long long a[10^7]` | 80 MB |
| `int a[5000][5000]` | 100 MB |
| `int a[10^8]` | 400 MB (too big) |

```estimate
q: A table of 3 x 10^7 long long values uses how many megabytes?
answer: 240
unit: MB
tolerance: 0.1
solution: 3 x 10^7 x 8 bytes = 2.4 x 10^8 bytes, about 240 MB. That is close to the usual 256 MB limit, so look for a smaller structure.
```

## Cards

```cards
- q: What does O(n log n) mean in plain words?
  a: The number of steps grows a little faster than n, like sorting. For n = 200,000 it is about 3.6 million steps.
- q: How many simple operations fit in one second?
  a: About 10^8 as a planning number; the real speed depends on the operations.
- q: Which complexity fits n up to 5,000? n up to 200,000?
  a: O(n^2) for 5,000. O(n log n) for 200,000.
- q: What is amortised O(n) with a nested while loop?
  a: The inner pointer only moves in one direction, so its total movement across the whole run is at most n.
- q: How much memory does an int array of 10^7 use?
  a: 40 MB (4 bytes each).
```

## Notes

:::notes
- Big-O keeps the fastest-growing term and drops constants; sequential loops add, nested loops multiply, halving gives log n.
- Plan for about 10^8 simple operations per second; leave a margin for slow operations.
- n up to 10: n!; 20: 2^n; 500: n^3; 5,000: n^2; 200,000: n log n; 10^6 to 10^7: n; 10^9: log n or O(1).
- Amortised: a pointer that never moves backwards costs n in total, even inside a while loop.
- Memory: int 4 bytes, long long 8 bytes; limits are commonly 256 MB; 10^7 ints is 40 MB.
- If your idea is too slow, it still works as a brute force to test the fast one.
:::
