---
title: Binary Search on the Answer
summary: When you can quickly test whether a candidate answer works, and bigger candidates never hurt, binary search the answer itself.
minutes: 40
difficulty: intermediate
rating: [1100, 1700]
tags: [binary-search, technique, greedy]
prereqs: [binary-search]
problems:
  - lc: koko-eating-bananas
    name: Koko Eating Bananas
    difficulty: Medium
  - cf: 1873E
    name: Building an Aquarium
    rating: 1100
    core: true
    note: find the largest height whose water fits
  - cf: 1613C
    name: Poisoned Dagger
    rating: 1200
  - cf: 492B
    name: Vanya and Lanterns
    rating: 1200
    note: also solvable directly after sorting
  - lc: capacity-to-ship-packages-within-d-days
    name: Capacity To Ship Packages Within D Days
    difficulty: Medium
    core: true
  - cses: 1620
    name: Factory Machines
  - cf: 1201C
    name: Maximum Median
    rating: 1400
    core: true
    note: maximise the median under an operation budget
  - lc: magnetic-force-between-two-balls
    name: Magnetic Force Between Two Balls
    difficulty: Medium
    note: maximise the minimum distance
  - cf: 670D2
    name: Magic Powder - 2
    rating: 1500
  - cses: 1085
    name: Array Division
  - cf: 371C
    name: Hamburgers
    rating: 1600
  - cf: 460C
    name: Present
    rating: 1700
    note: the check uses a difference array
exercises:
  - Compute the integer square root of n with the first-true template and a check of mid * mid > n.
  - Find the smallest d such that the number of multiples of 3 or 5 up to d is at least k.
---

## The problem

A shop must ship `n` packages in order, one after another, within `days` days. The ship carries at most `cap` weight per day, and a package cannot be split. What is the smallest capacity that finishes on time?

For weights `3 2 2 4 1 4` and 3 days the answer is 6.

## Brute force first

Try `cap = 1, 2, 3, ...` and test each by loading packages greedily.

- One test is O(n): add packages to today's load until the next one does not fit, then start a new day.
- The answer can be as large as the total weight, about 2 x 10^14 for a big input. Trying every value is hopeless.

Notice what the brute force reveals: the test is easy and fast. The slow part is the number of candidates.

## The idea: search the answer, not the array

Define `feasible(cap)` = "all packages ship within `days` days". It is **monotone**: if capacity 6 works, 7 certainly works. So along the candidates 1, 2, 3, ... the test reads `false false ... false true true ...`. That is the same shape as the previous lesson, so we find the first `true` with binary search.

```viz
algo: binary-search-answer
input:
  weights: [3, 2, 2, 4, 1, 4]
  days: 3
```

:::key
Binary search works on any yes/no question that flips once. The "array" is the range of possible answers, and "looking at an element" means running the check.
:::

## The recipe

1. Name the answer: "the smallest capacity" or "the largest minimum distance".
2. Write `feasible(x)`, usually a greedy scan in O(n).
3. Argue the monotonic direction. Does a bigger x make it easier or harder?
4. Choose bounds where the low end is surely wrong (or right) and the high end the opposite.
5. Run the first-true template for a minimum, or last-true for a maximum.

## Template: minimise the maximum

Lowest sensible capacity: the heaviest package, since each must fit alone. Highest: the total weight, which ships everything in one day.

```cpp
#include <bits/stdc++.h>
using namespace std;

int n, days;
vector<long long> w;

// can all packages ship within `days` days with a ship of this capacity?
bool feasible(long long cap) {
    int used = 1;
    long long load = 0;
    for (long long x : w) {
        if (load + x > cap) { used++; load = 0; }
        load += x;
    }
    return used <= days;
}

int main() {
    cin >> n >> days;
    w.resize(n);
    for (auto &x : w) cin >> x;

    long long lo = *max_element(w.begin(), w.end());               // must fit the heaviest
    long long hi = accumulate(w.begin(), w.end(), 0LL);            // one big trip always works
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (feasible(mid)) hi = mid;     // works: try smaller
        else lo = mid + 1;               // fails: need more
    }
    cout << lo << "\n";
    return 0;
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static int n, days;
    static long[] w;

    // can all packages ship within `days` days with a ship of this capacity?
    static boolean feasible(long cap) {
        int used = 1;
        long load = 0;
        for (long x : w) {
            if (load + x > cap) { used++; load = 0; }
            load += x;
        }
        return used <= days;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        n = Integer.parseInt(st.nextToken());
        days = Integer.parseInt(st.nextToken());
        w = new long[n];
        st = new StringTokenizer(br.readLine());
        long lo = 0, hi = 0;
        for (int i = 0; i < n; i++) {
            w[i] = Long.parseLong(st.nextToken());
            lo = Math.max(lo, w[i]);     // must fit the heaviest
            hi += w[i];                  // one big trip always works
        }
        while (lo < hi) {
            long mid = lo + (hi - lo) / 2;
            if (feasible(mid)) hi = mid; // works: try smaller
            else lo = mid + 1;           // fails: need more
        }
        System.out.println(lo);
    }
}
```
```input
6 3
3 2 2 4 1 4
```
```output
6
```

### Walkthrough

The range starts at `lo = 4`, `hi = 16`.

- `mid = 10`: days are `3 2 2 | 4 1 4`, so 2 days. Works, `hi = 10`.
- `mid = 7`: `3 2 2 | 4 1 | 4`, 3 days. Works, `hi = 7`.
- `mid = 5`: `3 2 | 2 | 4 1 | 4`, 4 days. Fails, `lo = 6`.
- `mid = 6`: `3 2 | 2 4 | 1 4`, 3 days. Works, `hi = 6`. Now `lo == hi == 6`.

```predict
lang: cpp
code: |
  int w[] = {3, 2, 2, 4, 1, 4};
  int cap = 5, used = 1, load = 0;
  for (int x : w) {
      if (load + x > cap) { used++; load = 0; }
      load += x;
  }
  cout << used;
output: "4"
why: The loads are 3 2 | 2 | 4 1 | 4, which is 4 days. Four days is more than the allowed 3, so capacity 5 is infeasible.
```

```blanks
prompt: Complete the update rules for a minimum (first true).
lang: cpp
code: |
  if (feasible(mid)) hi = [[mid]];
  else lo = [[mid + 1|mid+1]];
why: A feasible mid might be the smallest feasible value, so it stays inside the range. An infeasible mid and everything below it are ruled out.
```

```quiz
q: The answer can be as large as 10^18. About how many times does the loop call feasible?
options:
  - About 18
  - About 60
  - About 10^9
answer: 1
why: Each call halves the range, and 2^60 is about 1.15 x 10^18. Binary search needs about log2 of the range, so even huge ranges cost only a few dozen checks.
```

## Maximise the minimum

The mirror image: place `c` cows in stalls at given positions so that the closest pair is as far apart as possible. Let `ok(d)` = "we can place all cows with every gap at least d". Larger d is harder, so `ok` reads `true true ... true false false`. We want the **last true**.

Greedy check: put the first cow at the leftmost stall, then each next cow in the first stall at least `d` further along.

To keep the loop simple, hold `ok(lo)` true and `ok(hi)` false, and stop when they are adjacent.

```cpp
#include <bits/stdc++.h>
using namespace std;

int n, c;
vector<int> x;

// can we place c cows so that every two are at least d apart?
bool ok(int d) {
    int placed = 1, last = x[0];
    for (int i = 1; i < n; i++) {
        if (x[i] - last >= d) { placed++; last = x[i]; }
    }
    return placed >= c;
}

int main() {
    cin >> n >> c;
    x.resize(n);
    for (auto &v : x) cin >> v;
    sort(x.begin(), x.end());

    int lo = 1, hi = x[n - 1] - x[0] + 1;    // ok(lo) is true, ok(hi) is false
    while (hi - lo > 1) {
        int mid = lo + (hi - lo) / 2;
        if (ok(mid)) lo = mid;           // keep the last true
        else hi = mid;
    }
    cout << lo << "\n";
    return 0;
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static int n, c;
    static int[] x;

    // can we place c cows so that every two are at least d apart?
    static boolean ok(int d) {
        int placed = 1, last = x[0];
        for (int i = 1; i < n; i++) {
            if (x[i] - last >= d) { placed++; last = x[i]; }
        }
        return placed >= c;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        n = Integer.parseInt(st.nextToken());
        c = Integer.parseInt(st.nextToken());
        x = new int[n];
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) x[i] = Integer.parseInt(st.nextToken());
        Arrays.sort(x);

        int lo = 1, hi = x[n - 1] - x[0] + 1;    // ok(lo) is true, ok(hi) is false
        while (hi - lo > 1) {
            int mid = lo + (hi - lo) / 2;
            if (ok(mid)) lo = mid;       // keep the last true
            else hi = mid;
        }
        System.out.println(lo);
    }
}
```
```input
5 3
1 2 8 4 9
```
```output
3
```

The stalls sorted are `1 2 4 8 9`. Gap 3 works with cows at 1, 4 and 8. Gap 4 gives only 1 and 8, which is 2 cows, so the answer is 3. The program assumes 2 <= c <= n.

## Real-valued answers

When the answer is a real number, a loop like `while (hi - lo > 1e-9)` is fragile. Run a fixed number of halvings instead. 100 iterations shrink any range below the precision of a `double`.

Example: cut ropes of lengths 9, 6 and 4 into pieces of equal length L, with L as large as possible, so that at least 7 pieces come out. A larger L gives fewer pieces, so the check is `true ... true false ... false` and we want the last true.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;
    vector<double> rope(n);
    for (auto &r : rope) cin >> r;

    double lo = 0, hi = *max_element(rope.begin(), rope.end());
    for (int it = 0; it < 100; it++) {   // 100 halvings are far below double precision
        double mid = (lo + hi) / 2;
        long long pieces = 0;
        for (double r : rope) pieces += (long long)(r / mid);
        if (pieces >= k) lo = mid;       // long enough pieces still give k of them
        else hi = mid;
    }
    printf("%.4f\n", lo);
    return 0;
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int n = Integer.parseInt(st.nextToken());
        int k = Integer.parseInt(st.nextToken());
        double[] rope = new double[n];
        double lo = 0, hi = 0;
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) {
            rope[i] = Double.parseDouble(st.nextToken());
            hi = Math.max(hi, rope[i]);
        }
        for (int it = 0; it < 100; it++) {   // 100 halvings are far below double precision
            double mid = (lo + hi) / 2;
            long pieces = 0;
            for (double r : rope) pieces += (long) (r / mid);
            if (pieces >= k) lo = mid;   // long enough pieces still give k of them
            else hi = mid;
        }
        System.out.println(String.format(Locale.US, "%.4f", lo));
    }
}
```
```input
3 7
9 6 4
```
```output
2.2500
```

At L = 2.25 the pieces are 4 + 2 + 1 = 7. Any longer piece gives at most 6.

## Complexity

- Total cost: O(check x log(range)). For the ship problem that is O(n log(sum of weights)), about 50 passes over the array at most.
- Memory: O(1) beyond the input.
- Integer ranges take about log2(hi - lo) steps. Real ranges take the fixed count you choose.

## Pitfalls

- **Wrong low bound.** In the ship problem, starting `lo` below the heaviest package makes the greedy check meaningless.
- **Non-monotone check.** "Ships in exactly d days" is not monotone. Reword it as "within d days".
- **Wrong direction.** For a minimum, a feasible mid goes to `hi`. For a maximum, a feasible mid goes to `lo`. Mixing them gives an off-by-one or an infinite loop.
- **Overflow.** The high bound can reach 10^14 or 10^18. Use `long long`, and watch products like `mid * mid`.
- **Slow check.** The total is check cost times about 30 to 60. An O(n^2) check usually fails.

:::truth
Spotting this pattern is the skill. The signals are phrases such as "minimise the maximum", "maximise the minimum", or "smallest x such that", combined with a huge answer range and an easy check. After that it takes about ten lines. It becomes automatic after roughly a dozen problems, not after one.
:::

```cards
- q: When can you binary search the answer?
  a: When there is a check(x) that is quick to run and monotone, so its results read false then true (or true then false).
- q: For "minimise the maximum", where does a feasible mid go?
  a: "`hi = mid`, because mid may be the smallest feasible value."
- q: For "maximise the minimum", what is the search target?
  a: The last true. Keep ok(lo) true and ok(hi) false, and set `lo = mid` when ok(mid).
- q: Why use a fixed number of iterations for real-valued answers?
  a: A tolerance loop can stall or loop forever on floating-point rounding. About 100 halvings is always enough for a double.
- q: Total complexity of binary search on the answer?
  a: "$O(\\text{cost of check} \\times \\log(\\text{range}))$"
```

## Notes

:::notes
- Searching the answer: find the smallest or largest x for which a quick `check(x)` holds, where the check results flip only once.
- Recipe: name the answer, write the greedy check, decide the monotonic direction, set safe bounds, then use the template.
- Minimum (first true): `if (check(mid)) hi = mid; else lo = mid + 1;` on `[lo, hi]`.
- Maximum (last true): keep `check(lo)` true and `check(hi)` false, then `if (check(mid)) lo = mid; else hi = mid;` while `hi - lo > 1`.
- Real answers: use a fixed 100 iterations rather than an epsilon loop.
- Cost is check time times log2 of the range, around 30 to 60 checks. Use `long long` for bounds.
- Typical signals: minimise the maximum, maximise the minimum, smallest x such that, huge range with an easy check.
:::
