---
title: Bitmask DP
summary: Use an integer's bits as a set of chosen items, so you can run DP over subsets when n is at most about 20 - assignment problems and the travelling salesman.
minutes: 45
difficulty: advanced
rating: [1800, 2200]
tags: [dp, bitmask, tsp, subsets]
prereqs: [dp-introduction, bit-manipulation]
problems:
  - lc: fair-distribution-of-cookies
    name: Fair Distribution of Cookies
    difficulty: Medium
    note: n is tiny; brute force is possible, bitmask DP is the clean version
  - lc: minimum-number-of-work-sessions-to-finish-the-tasks
    name: Minimum Number of Work Sessions to Finish the Tasks
    difficulty: Medium
    note: dp[mask] = best (sessions, load)
  - lc: partition-to-k-equal-sum-subsets
    name: Partition to K Equal Sum Subsets
    difficulty: Medium
  - cf: 580D
    name: Kefa and Dishes
    rating: 1800
    core: true
    note: dp[mask][last]
  - cses: 1653
    name: Elevator Rides
    core: true
    note: dp[mask] stores a pair, rides and the load of the last ride
  - cses: 1690
    name: Hamiltonian Flights
    core: true
    note: count paths that visit every city once
  - lc: shortest-path-visiting-all-nodes
    name: Shortest Path Visiting All Nodes
    difficulty: Hard
    note: BFS over (mask, node) states
  - cf: 8C
    name: Looking for Order
    rating: 2000
    note: fix the lowest unset bit to avoid permutations
  - cf: 401D
    name: Roman and Numbers
    rating: 2000
    note: mask of used digits plus remainder
  - cf: 453B
    name: Little Pony and Harmony Chest
    rating: 2000
    note: stretch; mask of used primes
exercises:
  - Modify the TSP program to print the route, not only its length. What must you store?
  - Why does the assignment DP not need the worker index in its state?
---

## The problem

Some problems ask you to use each item from a small set exactly once, in some order: assign `n` jobs to `n` workers, or visit `n` cities. Brute force tries all $n!$ orders. For $n = 20$ that is about $2.4 \cdot 10^{18}$, impossible.

But the future of such a search depends only on **which items are already used**, not on the order they were used in. There are only $2^n$ sets. That is a DP over subsets.

## Sets as numbers

A **bitmask** stores a set of up to 20 or so items in one integer: bit `j` is 1 if item `j` is in the set.

| Operation | Code |
|---|---|
| Is `j` in the set? | `mask >> j & 1` |
| Add `j` | `mask \| (1 << j)` |
| Remove `j` | `mask & ~(1 << j)` |
| Size of the set | `__builtin_popcount(mask)` (Java: `Integer.bitCount`) |
| Every item | `(1 << n) - 1` |

Masks `0 .. 2^n - 1` are also array indices, so `dp[mask]` is an ordinary array of $2^n$ cells.

## Assignment problem

`n` workers, `n` jobs, `cost[i][j]` is the cost of worker `i` doing job `j`. Give each worker one job, each job to one worker, at minimum total cost.

Process workers in order 0, 1, 2, and so on. After `k` workers have been placed, all that matters is which `k` jobs are taken.

- **State:** `dp[mask]` = minimum cost for the first `popcount(mask)` workers to take exactly the jobs in `mask`.
- **Transition:** let `i = popcount(mask)`. The next worker `i` takes a free job `j`: `dp[mask | 1<<j] = min(dp[mask] + cost[i][j])`.
- **Base case:** `dp[0] = 0`; everything else starts at infinity.
- **Answer:** `dp[(1 << n) - 1]`.

```steps
title: Assignment DP on a 3x3 cost matrix (rows 9 2 7 / 6 4 3 / 5 8 1)
view: array
frames:
  - arr: [0, 0, 0, 0, 0, 0, 0, 0]
    note: Index is the mask (bit j set means job j is taken). Only dp[0] = 0 is known so far. A 0 elsewhere means not computed yet.
  - arr: [0, 9, 2, 0, 7, 0, 0, 0]
    highlight: {1: active, 2: active, 4: active}
    note: Worker 0 takes one job. dp[001] = 9, dp[010] = 2, dp[100] = 7.
  - arr: [0, 9, 2, 8, 7, 12, 5, 0]
    highlight: {3: active, 5: active, 6: active}
    note: Worker 1 takes a second job. dp[011] = min(9 + 4, 2 + 6) = 8. dp[101] = min(9 + 3, 7 + 6) = 12. dp[110] = min(2 + 3, 7 + 4) = 5.
  - arr: [0, 9, 2, 8, 7, 12, 5, 9]
    highlight: {7: match}
    note: Worker 2 takes the last job. dp[111] = min(8 + 1, 12 + 8, 5 + 5) = 9. That is the answer.
```

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<vector<int>> cost(n, vector<int>(n));
    for (auto &row : cost) for (auto &x : row) cin >> x;
    const int INF = 1000000000;
    vector<int> dp(1 << n, INF);
    dp[0] = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        if (dp[mask] == INF) continue;
        int i = __builtin_popcount(mask);        // next worker
        if (i == n) continue;
        for (int j = 0; j < n; j++)
            if (!(mask >> j & 1))
                dp[mask | (1 << j)] = min(dp[mask | (1 << j)], dp[mask] + cost[i][j]);
    }
    cout << dp[(1 << n) - 1] << "\n";
}
```
```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[][] cost = new int[n][n];
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++) cost[i][j] = sc.nextInt();
        final int INF = 1000000000;
        int[] dp = new int[1 << n];
        Arrays.fill(dp, INF);
        dp[0] = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            if (dp[mask] == INF) continue;
            int i = Integer.bitCount(mask);
            if (i == n) continue;
            for (int j = 0; j < n; j++)
                if ((mask >> j & 1) == 0) {
                    int nxt = mask | (1 << j);
                    dp[nxt] = Math.min(dp[nxt], dp[mask] + cost[i][j]);
                }
        }
        System.out.println(dp[(1 << n) - 1]);
    }
}
```
```input
3
9 2 7
6 4 3
5 8 1
```
```output
9
```

```blanks
prompt: Complete the transition that adds job j to the set.
lang: cpp
code: |
  int i = __builtin_[[popcount]](mask);
  for (int j = 0; j < n; j++)
      if (!(mask >> j & 1))
          dp[mask | (1 << j)] = min(dp[mask | (1 << j)], dp[mask] + [[cost]][i][j]);
why: The number of set bits tells you which worker is next, so the worker index is not part of the state. The cost added is that worker's cost for job j.
```

Time is $O(2^n \cdot n)$: $2^n$ states, $n$ choices each.

## Travelling salesman (TSP)

Visit every city exactly once, starting and ending at city 0, with minimum total distance. Here the next step depends on **where you are now**, so the last city joins the state.

- **State:** `dp[mask][last]` = minimum distance of a route that starts at city 0, visits exactly the cities in `mask`, and ends at `last`.
- **Transition:** `dp[mask | 1<<nxt][nxt] = min(dp[mask][last] + d[last][nxt])` for `nxt` not in `mask`.
- **Base case:** `dp[1][0] = 0` (only city 0 visited, standing at city 0).
- **Answer:** `min(dp[full][last] + d[last][0])` over all `last != 0`. For `n = 1` the answer is 0.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<vector<int>> d(n, vector<int>(n));
    for (auto &row : d) for (auto &x : row) cin >> x;
    const int INF = 1000000000;
    int full = (1 << n) - 1;
    vector<vector<int>> dp(1 << n, vector<int>(n, INF));
    dp[1][0] = 0;
    for (int mask = 1; mask <= full; mask++)
        for (int last = 0; last < n; last++) {
            if (!(mask >> last & 1) || dp[mask][last] == INF) continue;
            for (int nxt = 0; nxt < n; nxt++) {
                if (mask >> nxt & 1) continue;
                int m2 = mask | (1 << nxt);
                dp[m2][nxt] = min(dp[m2][nxt], dp[mask][last] + d[last][nxt]);
            }
        }
    int ans = (n == 1) ? 0 : INF;
    for (int last = 1; last < n; last++) ans = min(ans, dp[full][last] + d[last][0]);
    cout << ans << "\n";
}
```
```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[][] d = new int[n][n];
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++) d[i][j] = sc.nextInt();
        final int INF = 1000000000;
        int full = (1 << n) - 1;
        int[][] dp = new int[1 << n][n];
        for (int[] row : dp) Arrays.fill(row, INF);
        dp[1][0] = 0;
        for (int mask = 1; mask <= full; mask++)
            for (int last = 0; last < n; last++) {
                if ((mask >> last & 1) == 0 || dp[mask][last] == INF) continue;
                for (int nxt = 0; nxt < n; nxt++) {
                    if ((mask >> nxt & 1) == 1) continue;
                    int m2 = mask | (1 << nxt);
                    dp[m2][nxt] = Math.min(dp[m2][nxt], dp[mask][last] + d[last][nxt]);
                }
            }
        int ans = (n == 1) ? 0 : INF;
        for (int last = 1; last < n; last++) ans = Math.min(ans, dp[full][last] + d[last][0]);
        System.out.println(ans);
    }
}
```
```input
4
0 10 15 20
10 0 35 25
15 35 0 30
20 25 30 0
```
```output
80
```

The best tour is `0 -> 1 -> 3 -> 2 -> 0` with length $10 + 25 + 30 + 15 = 80$.

## Complexity and limits

| Problem | States | Work each | Time |
|---|---|---|---|
| Assignment | $2^n$ | $n$ | $O(2^n n)$ |
| TSP | $2^n \cdot n$ | $n$ | $O(2^n n^2)$ |

- For $n = 20$ the TSP does about $4 \cdot 10^8$ simple steps, around a second in C++.
- The table has $2^{20} \cdot 20 \approx 2 \cdot 10^7$ entries. As `int` that is about 84 MB, which can break a 256 MB limit in Java. Use `int` rather than `long`, and flat arrays.

:::truth
The honest signal for bitmask DP is the constraint line. If a problem says $n \le 20$ (or 16, or 18) and asks about orders, subsets or assignments, think masks. If $n$ is 50 or more, it is something else.
:::

## Looping over submasks

Some problems split a set into two parts. To visit every non-empty submask `s` of `mask`:

```cpp
for (int s = mask; s > 0; s = (s - 1) & mask) { /* use s */ }
```

Over all masks this totals $3^n$ steps, not $4^n$, because each item is in neither part, one part or the other.

```predict
lang: cpp
code: |
  int mask = 5;   // binary 101
  for (int s = mask; s > 0; s = (s - 1) & mask)
      cout << s << " ";
prompt: What does this print?
output: 5 4 1
why: Starting from 101, subtracting one gives 100 (4), then subtracting one gives 011, and ANDing with 101 leaves 001 (1). The next step gives 0 and the loop stops. The non-empty submasks of {0, 2} are 5, 4 and 1.
```

## Pitfalls

- **Precedence.** Comparisons bind tighter than `&`, so `mask & (1 << j) == 0` means `mask & ((1 << j) == 0)`. Always parenthesise: `(mask & (1 << j)) == 0`.
- **Using `1 << j` with j >= 31.** Use `1LL << j` when masks can go beyond 31 bits.
- **Unreachable states.** Skip `dp == INF` before extending, otherwise `INF + cost` can overflow.
- **Iteration order.** Looping `mask` upward is a valid order because adding a bit always makes the mask larger.
- **Forgetting the start in TSP.** If the route must begin at city 0, set only `dp[1][0] = 0`.

```quiz
q: Why does the assignment DP not need the worker index in its state?
options:
  - Workers are processed in a fixed order, so the number of set bits tells you which worker is next
  - The worker does not affect the cost
  - The cost matrix is symmetric
answer: 0
why: After k workers are placed, exactly k jobs are taken. So popcount(mask) already encodes the next worker.
```

```quiz
q: TSP with n = 18 cities. Roughly how many operations does O(2^n * n^2) need?
options:
  - About 8.5 * 10^7
  - About 18!
  - About 2^18
answer: 0
why: 2^18 is about 262144, multiplied by 324 gives about 8.5 * 10^7. The factorial would be about 6.4 * 10^15.
```

```cards
- q: What does bit j of a mask mean?
  a: Item j is in the set (1) or not (0).
- q: Constraint that hints at bitmask DP?
  a: Small n, about 20 or fewer, with order or subset choices.
- q: State of TSP bitmask DP?
  a: dp[mask][last] is the shortest route starting at city 0, visiting the cities in mask, ending at last.
- q: How do you add, remove and test bit j?
  a: mask | (1 << j), mask & ~(1 << j), mask >> j & 1.
- q: Total cost of looping over all submasks of all masks?
  a: 3^n, not 4^n.
```

## Notes

:::notes
- Bitmask DP = DP where the state includes the set of used items as an integer, for n up to about 20.
- Masks are array indices: `dp[mask]` or `dp[mask][last]`.
- Assignment: `dp[mask]`, next worker is `popcount(mask)`; time $O(2^n n)$.
- TSP: `dp[mask][last]`, start `dp[1][0] = 0`, answer closes the tour back to 0; time $O(2^n n^2)$.
- Add `mask | (1 << j)`, remove `mask & ~(1 << j)`, test `mask >> j & 1`.
- Submask loop: `s = (s - 1) & mask`; all masks together cost $3^n$.
- Mind memory (about 84 MB for 2^20 x 20 ints) and use `1LL <<` beyond 31 bits.
- Parenthesise bit operations; `&` has lower precedence than `==`.
:::
