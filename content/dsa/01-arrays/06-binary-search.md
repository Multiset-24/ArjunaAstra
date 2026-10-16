---
title: Binary Search
summary: Halve the search range each step using an invariant, so a lookup in a million sorted items takes about twenty comparisons.
minutes: 35
difficulty: intermediate
rating: [1000, 1400]
tags: [searching, binary-search, sorting]
prereqs: [arrays-and-strings, sorting-and-searching]
problems:
  - lc: binary-search
    name: Binary Search
    difficulty: Easy
  - lc: search-insert-position
    name: Search Insert Position
    difficulty: Easy
  - lc: sqrtx
    name: Sqrt(x)
    difficulty: Easy
    note: last index where mid * mid <= x
  - cf: 706B
    name: Interesting drink
    rating: 1100
    core: true
    note: sort, then count prices <= m with upper bound
  - cf: 1676E
    name: Eating Queries
    rating: 1100
    note: prefix sums are sorted, so search them
  - cf: 474B
    name: Worms
    rating: 1200
    core: true
    note: prefix sums of the piles, then lower bound
  - cf: 1352C
    name: K-th Not Divisible by n
    rating: 1200
  - lc: find-first-and-last-position-of-element-in-sorted-array
    name: Find First and Last Position of Element in Sorted Array
    difficulty: Medium
  - cf: 600B
    name: Queries about less or equal elements
    rating: 1300
    core: true
    note: upper bound for each query
  - cf: 230B
    name: T-primes
    rating: 1300
  - lc: search-in-rotated-sorted-array
    name: Search in Rotated Sorted Array
    difficulty: Medium
  - lc: find-peak-element
    name: Find Peak Element
    difficulty: Medium
    note: binary search without sorted data
exercises:
  - Write a function that returns the last index with a[i] <= x, or -1 if none, using the half-open template.
  - On a rotated sorted array, find the index of the minimum with the same template.
---

## The problem

You have a sorted array of 10^6 numbers and 10^6 questions of the form: where does x first appear, and how many times does it appear?

## Brute force first

Scan the array for every question.

- One question costs up to n steps, so all questions cost n x q = 10^12.
- That is about 10^4 seconds at 10^8 simple operations per second.
- The scan ignores that the array is sorted: after looking at one element, half of the array can be ruled out.

## The idea: halve the range

Think of the number-guessing game. Someone picks a number from 1 to 1,000,000. You guess the middle, and "higher" or "lower" removes half of the candidates. After about 20 guesses (because 2^20 is about 10^6) you are done.

```viz
algo: binary-search
input:
  arr: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
  target: 23
  mode: exact
```

Searching for one exact value is the least useful form. Most problems ask for a **boundary**: the first position where a yes/no test becomes true.

## The invariant: first position where a test is true

Suppose a test `pred(i)` gives `false false false true true true` along the array (it is **monotone**, meaning it flips only once). We want the first `true`, or `n` if there is none.

Keep a half-open range `[lo, hi)` plus the possibility that the answer is `hi`, and hold on to this sentence: **the answer is always in `[lo, hi]`**.

```cpp
int lo = 0, hi = n;                      // answer in [lo, hi]
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (pred(mid)) hi = mid;             // mid might be the answer: keep it
    else lo = mid + 1;                   // mid is false: discard it
}
// lo == hi is the first true index, or n
```
```java
int lo = 0, hi = n;                      // answer in [lo, hi]
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (pred(mid)) hi = mid;             // mid might be the answer: keep it
    else lo = mid + 1;                   // mid is false: discard it
}
// lo == hi is the first true index, or n
```

Every step either shrinks `hi` to `mid` or raises `lo` beyond `mid`, so the range always gets smaller and the loop always ends. `mid` is computed as `lo + (hi - lo) / 2` because `lo + hi` can overflow a 32-bit `int` when both are near 10^9.

```viz
algo: binary-search
input:
  arr: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
  target: 20
  mode: lower_bound
```

```order
prompt: Arrange binary search for the index of the last element with a[i] <= x, or -1 if there is none.
lang: cpp
code: |
  int lo = 0, hi = n;
  while (lo < hi) {
      int mid = lo + (hi - lo) / 2;
      if (a[mid] > x) hi = mid;
      else lo = mid + 1;
  }
  return lo - 1;
distractors:
  - "return lo;"
why: The loop finds the first index with a[i] > x. The element just before it is the last one with a[i] <= x. If lo is 0, the result is -1, which means none.
```

## Template: lower bound, upper bound, count

- **Lower bound** of x: first index with `a[i] >= x`.
- **Upper bound** of x: first index with `a[i] > x`.
- Number of copies of x: `upper - lower`. The value exists if `lower < n && a[lower] == x`.

```cpp
#include <bits/stdc++.h>
using namespace std;

int n;
vector<int> a;

// first index i in [0, n] with a[i] >= x   (n if there is none)
int lowerBound(int x) {
    int lo = 0, hi = n;                  // answer lies in [lo, hi]
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] >= x) hi = mid;       // mid could be the answer: keep it
        else lo = mid + 1;               // mid is too small: discard it
    }
    return lo;
}

// first index i in [0, n] with a[i] > x
int upperBound(int x) {
    int lo = 0, hi = n;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > x) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}

int main() {
    int q;
    scanf("%d %d", &n, &q);
    a.resize(n);
    for (auto &x : a) scanf("%d", &x);   // sorted ascending
    while (q--) {
        int x;
        scanf("%d", &x);
        int lb = lowerBound(x), ub = upperBound(x);
        printf("%d %d\n", lb, ub - lb);  // first position, how many copies
    }
    return 0;
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static int n;
    static int[] a;

    // first index i in [0, n] with a[i] >= x   (n if there is none)
    static int lowerBound(int x) {
        int lo = 0, hi = n;              // answer lies in [lo, hi]
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] >= x) hi = mid;   // mid could be the answer: keep it
            else lo = mid + 1;           // mid is too small: discard it
        }
        return lo;
    }

    // first index i in [0, n] with a[i] > x
    static int upperBound(int x) {
        int lo = 0, hi = n;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] > x) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        n = Integer.parseInt(st.nextToken());
        int q = Integer.parseInt(st.nextToken());
        a = new int[n];
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) a[i] = Integer.parseInt(st.nextToken());   // sorted ascending
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) {
            int x = Integer.parseInt(br.readLine().trim());
            int lb = lowerBound(x), ub = upperBound(x);
            sb.append(lb).append(' ').append(ub - lb).append('\n');   // first position, how many copies
        }
        System.out.print(sb);
    }
}
```
```input
7 5
1 2 2 2 5 7 9
2
3
10
1
5
```
```output
1 3
4 0
7 0
0 1
4 1
```

### Walkthrough for x = 3

- `lo=0, hi=7`: `mid=3`, `a[3]=2 < 3`, so `lo=4`.
- `lo=4, hi=7`: `mid=5`, `a[5]=7 >= 3`, so `hi=5`.
- `lo=4, hi=5`: `mid=4`, `a[4]=5 >= 3`, so `hi=4`.
- `lo == hi == 4`. The upper bound is also 4, so the count is 0 and 3 would be inserted at index 4.

```predict
lang: cpp
code: |
  int a[] = {1, 2, 2, 2, 5, 7, 9};
  int lo = 0, hi = 7, x = 3, steps = 0;
  while (lo < hi) {
      int mid = lo + (hi - lo) / 2;
      steps++;
      if (a[mid] >= x) hi = mid;
      else lo = mid + 1;
  }
  cout << lo << " " << steps;
output: 4 3
why: This is the walkthrough above. The loop runs three times and ends with lo = hi = 4.
```

```blanks
prompt: Change the test so the function returns the upper bound, the first index with a[i] > x.
lang: java
code: |
  while (lo < hi) {
      int mid = lo + (hi - lo) / 2;
      if (a[mid] [[>]] x) hi = mid;
      else lo = mid + 1;
  }
why: Lower bound tests a[mid] >= x; upper bound tests a[mid] > x. That one character decides whether equal elements fall before or after the boundary.
```

## Library versions

| Need | C++ | Java |
|---|---|---|
| First `>= x` | `lower_bound(a.begin(), a.end(), x) - a.begin()` | write your own |
| First `> x` | `upper_bound(...) - a.begin()` | write your own |
| Exists? | `binary_search(a.begin(), a.end(), x)` | `Arrays.binarySearch(a, x) >= 0` |

Java's `Arrays.binarySearch` returns any matching index when there are duplicates and `-(insertion point) - 1` when the value is missing. It does not give you first or last occurrence, so contests usually use a hand-written version.

## Complexity

- Each step halves the range, so one search costs O(log n). For n = 10^6, that is about 20 steps.
- The 10^6 queries above cost about 2 x 10^7 steps, far below the budget.
- Binary search needs only a monotone test. It does not need a sorted array as such, which is why the next lesson can search over answers.

## Pitfalls

- **Infinite loop.** With `lo = mid` instead of `mid + 1`, a range of two elements has `mid == lo`, and nothing changes. Match the update rules to how `mid` rounds.
- **Mixing styles.** `while (lo <= hi)` with `hi = n - 1` is a different template, with `hi = mid - 1`. Pick one and keep its pieces together.
- **Overflow.** Use `lo + (hi - lo) / 2`.
- **Result not checked.** The answer can be `n`. Test `lo < n` before reading `a[lo]`.
- **Non-monotone test.** If the test flips more than once, the result is meaningless. Check the pattern on a small case.
- **Descending order.** Flip the test or sort ascending first.

```quiz
q: This loop never ends on some inputs. Why?
options:
  - mid is computed with the wrong formula
  - When hi = lo + 1, mid equals lo, and the branch lo = mid changes nothing
  - The loop condition should be lo <= hi
answer: 1
why: "The loop is `while (lo < hi) { mid = lo + (hi - lo) / 2; if (pred(mid)) hi = mid; else lo = mid; }`. With hi = lo + 1, mid rounds down to lo, so `lo = mid` leaves everything as it was. The fix is `lo = mid + 1`."
```

:::truth
Binary search is easy to explain and hard to type correctly. Donald Knuth noted that the first binary search was published in 1946 and that a version without bugs did not appear until 1962. Expect to get boundaries wrong a few times, and test on arrays of length 1 and 2.
:::

```cards
- q: What is the invariant of the half-open binary search template?
  a: "The answer is always in `[lo, hi]`, starting with `lo = 0, hi = n`."
- q: What do you do when `pred(mid)` is true, and when it is false?
  a: "True: `hi = mid` (mid may be the answer). False: `lo = mid + 1` (mid is ruled out)."
- q: How do lower bound and upper bound differ?
  a: "Lower bound is the first index with `a[i] >= x`; upper bound is the first with `a[i] > x`. Their difference is the count of x."
- q: Why write `lo + (hi - lo) / 2`?
  a: "`lo + hi` can overflow a 32-bit int."
- q: What does binary search actually require?
  a: A monotone test (false then true), not necessarily a sorted array.
```

## Notes

:::notes
- Linear search is O(n) per query. Binary search is O(log n) per query, about 20 steps for a million items.
- Template for the first true: `lo = 0, hi = n; while (lo < hi) { mid = lo + (hi - lo) / 2; if (pred(mid)) hi = mid; else lo = mid + 1; }`.
- Invariant: the answer stays in `[lo, hi]`. The result can be `n` (no true), so check before reading `a[lo]`.
- Lower bound: first `a[i] >= x`. Upper bound: first `a[i] > x`. Copies of x = upper - lower.
- Last index with `a[i] <= x` is `upperBound(x) - 1`.
- C++ has `lower_bound` and `upper_bound`. Java's `Arrays.binarySearch` returns any match and a negative value when missing.
- Pitfalls: `lo = mid` causes infinite loops, `lo + hi` can overflow, a non-monotone test breaks everything.
:::
