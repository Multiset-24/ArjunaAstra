---
title: Knapsack DP
summary: Choose items under a weight limit to maximise value - 0/1 and unbounded versions, subset sum, and the one-array trick where loop direction is the whole difference.
minutes: 45
difficulty: intermediate
rating: [1500, 2000]
tags: [dp, knapsack, subset-sum, 0-1-knapsack]
prereqs: [dp-1d-patterns, dp-on-grids-and-strings]
problems:
  - lc: partition-equal-subset-sum
    name: Partition Equal Subset Sum
    difficulty: Medium
    core: true
    note: subset sum with target = total / 2
  - cses: 1158
    name: Book Shop
    core: true
    note: the plain 0/1 knapsack
  - lc: last-stone-weight-ii
    name: Last Stone Weight II
    difficulty: Medium
    note: split into two groups with the smallest difference
  - lc: target-sum
    name: Target Sum
    difficulty: Medium
    note: count subsets after a rewrite
  - lc: ones-and-zeroes
    name: Ones and Zeroes
    difficulty: Medium
    note: knapsack with two capacities
  - cf: 1516C
    name: Baby Ehab Partitions Again
    rating: 1700
    core: true
    note: subset sum, then remove one element
  - cf: 543A
    name: Writing Code
    rating: 1800
    note: counting variant with an unbounded flavour
  - cf: 577B
    name: Modulo Sum
    rating: 1900
    note: stretch; subset sum on remainders, with a pigeonhole shortcut
exercises:
  - Change the 0/1 program so it also prints which items were taken. What do you need to store?
  - Prove with a two-item example that the forward loop would use an item twice.
---

## The problem

You have `n` items, each with a weight `w` and a value `v`, and a bag that holds total weight `W`. Pick items to maximise total value without exceeding `W`. Each item can be taken once. This is the **0/1 knapsack** (0 = leave it, 1 = take it).

Brute force tries all $2^n$ subsets. For $n = 40$ that is already far too slow, yet `n = 100` and `W = 10000` is an easy DP.

## The idea

Process items one by one. For each item you decide: leave it, or take it.

- **State:** `dp[i][c]` = best value using the first `i` items with capacity `c`.
- **Transition:** `dp[i][c] = max(dp[i-1][c], dp[i-1][c - w_i] + v_i)`. The second option needs `c >= w_i`.
- **Base case:** `dp[0][c] = 0` for every `c`. No items, no value.
- **Answer:** `dp[n][W]`.

```viz
algo: dp-grid
input:
  mode: knapsack
  weights: [1, 3, 4, 5]
  values: [1, 4, 5, 7]
  capacity: 7
```

Time is $O(nW)$ (n items times W capacities). Memory is also $O(nW)$ in this form.

:::truth
$O(nW)$ is not polynomial in the input size: `W` is a number, and a number written in 30 bits can be a billion. The DP works only when `W` is small (about $10^5$ to $10^7$ cells in total). If `W` is huge but values are small, flip the state: `dp[value]` = least weight needed.
:::

## One array is enough

Row `i` uses only row `i-1`. So keep a single array `dp[c]` and update it in place. The catch is the order in which you update capacities.

- **0/1 (each item once):** loop `c` from `W` **down** to `w`. Then `dp[c - w]` still holds the value from before this item.
- **Unbounded (any number of copies):** loop `c` from `w` **up** to `W`. Now `dp[c - w]` may already include this item, which is exactly what allows reuse.

```predict
lang: cpp
code: |
  int dp[6] = {0, 0, 0, 0, 0, 0};
  int w = 2, v = 3;
  for (int c = w; c <= 5; c++)
      dp[c] = max(dp[c], dp[c - w] + v);
  cout << dp[5];
prompt: One item of weight 2 and value 3. The capacity loop runs upward. What prints?
output: "6"
why: dp[2] = 3, dp[3] = 3, dp[4] = dp[2] + 3 = 6, dp[5] = dp[3] + 3 = 6. The single item was taken twice. Looping downward would give 3.
```

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, W;
    cin >> n >> W;
    vector<long long> w(n), v(n);
    for (int i = 0; i < n; i++) cin >> w[i] >> v[i];

    vector<long long> one(W + 1, 0), many(W + 1, 0);
    for (int i = 0; i < n; i++) {
        for (int c = W; c >= w[i]; c--)          // 0/1: downward
            one[c] = max(one[c], one[c - w[i]] + v[i]);
        for (int c = w[i]; c <= W; c++)          // unbounded: upward
            many[c] = max(many[c], many[c - w[i]] + v[i]);
    }
    cout << one[W] << "\n" << many[W] << "\n";
}
```
```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), W = sc.nextInt();
        int[] w = new int[n];
        long[] v = new long[n];
        for (int i = 0; i < n; i++) { w[i] = sc.nextInt(); v[i] = sc.nextLong(); }

        long[] one = new long[W + 1], many = new long[W + 1];
        for (int i = 0; i < n; i++) {
            for (int c = W; c >= w[i]; c--)
                one[c] = Math.max(one[c], one[c - w[i]] + v[i]);
            for (int c = w[i]; c <= W; c++)
                many[c] = Math.max(many[c], many[c - w[i]] + v[i]);
        }
        System.out.println(one[W] + "\n" + many[W]);
    }
}
```
```input
4 10
1 1
3 4
4 5
5 7
```
```output
13
14
```

With capacity 10, taking each item at most once gives 13 (weights 1, 4, 5). With copies allowed, two items of weight 5 give 14.

```order
prompt: Arrange the 0/1 knapsack update for one item (weight w, value v).
lang: cpp
code: |
  for (int c = W; c >= w; c--) {
      dp[c] = max(dp[c], dp[c - w] + v);
  }
distractors:
  - "for (int c = w; c <= W; c++) {"
why: The capacity loop must go downward so that dp[c - w] still reflects the state before this item was considered.
```

## Subset sum

**Subset sum** asks: can some subset of the numbers add up to exactly `T`? It is knapsack with only a yes/no answer.

- **State:** `can[s]` = true if some subset sums to `s`.
- **Transition:** `can[s] |= can[s - x]` for each number `x`, looping `s` downward (each number once).
- **Base case:** `can[0] = true` (the empty subset).
- **Answer:** `can[T]`.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, T;
    cin >> n >> T;
    vector<bool> can(T + 1, false);
    can[0] = true;
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        for (int s = T; s >= x; s--)
            if (can[s - x]) can[s] = true;
    }
    cout << (can[T] ? "YES" : "NO") << "\n";
}
```
```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), T = sc.nextInt();
        boolean[] can = new boolean[T + 1];
        can[0] = true;
        for (int i = 0; i < n; i++) {
            int x = sc.nextInt();
            for (int s = T; s >= x; s--)
                if (can[s - x]) can[s] = true;
        }
        System.out.println(can[T] ? "YES" : "NO");
    }
}
```
```input
5 9
3 34 4 12 5
```
```output
YES
```

`4 + 5 = 9`. Partition Equal Subset Sum is this program with `T = total / 2` (and an immediate "no" if the total is odd).

:::tip
In C++, `bitset<N> can; can |= can << x;` does the whole inner loop in $O(N / 64)$ per number. Use it when `T` reaches about $10^6$ or more.
:::

## Walkthrough on capacity 7

For weights `[1, 3, 4, 5]` and values `[1, 4, 5, 7]`, the best choice is items 2 and 3 (weights 3 and 4, values 4 and 5), total value 9. Two other tempting picks are worse: weights 1 and 5 give 8, and weights 1 and 4 give only 6. The table tracks each choice without trying all subsets.

```blanks
prompt: Complete the single-array 0/1 knapsack for one item of weight w and value v.
lang: cpp
code: |
  for (int c = [[W]]; c >= [[w]]; c--)
      dp[c] = max(dp[c], dp[c - w] + [[v]]);
why: The loop starts at the full capacity and stops at w, because a smaller capacity cannot hold the item. Taking the item adds its value v to the best result for the remaining capacity.
```

## Pitfalls

- **Wrong loop direction.** The most common knapsack bug. Downward for 0/1, upward for unbounded.
- **Capacity bounds.** The inner loop must stop at `w`, otherwise `c - w` is negative.
- **Overflow.** Values up to $10^9$ with $10^5$ items need `long long` / `long`.
- **"Exactly" versus "at most".** With `dp` filled with zeros, `dp[c]` means capacity at most `c`. For an exact weight, start with `-INF` except `dp[0] = 0`.
- **Counting subsets.** Initialise `ways[0] = 1`, then `ways[s] += ways[s - x]`, downward, with a modulus.

```quiz
q: You loop capacity upward in the single-array 0/1 knapsack. What goes wrong?
options:
  - Nothing, the answer is identical
  - Items can be taken more than once, so the answer can be too large
  - The program skips the last item
answer: 1
why: Going upward lets dp[c - w] already contain the current item, which turns the problem into the unbounded knapsack.
```

```quiz
q: n = 100 items, W = 10^9. Is the O(nW) DP practical?
options:
  - Yes, 10^11 steps is fine
  - No, W is far too large for a table over capacities
  - Yes, if you use long long
answer: 1
why: A table with 10^9 cells and 10^11 steps is far over the limit. Look at another dimension, such as total value, or a different technique.
```

```cards
- q: Transition of 0/1 knapsack?
  a: dp[i][c] = max(dp[i-1][c], dp[i-1][c - w] + v). Leave the item, or take it.
- q: Loop direction for the single-array version?
  a: Downward for 0/1 (each item once), upward for unbounded (copies allowed).
- q: Time complexity of knapsack and why it is "pseudo-polynomial"?
  a: O(nW). It depends on the numeric value W, not only on the length of the input.
- q: Subset sum base case and transition?
  a: can[0] = true, then can[s] |= can[s - x] looping s downward.
- q: What changes for "exactly weight c" instead of "at most c"?
  a: Start dp at minus infinity except dp[0] = 0.
```

## Notes

:::notes
- 0/1 knapsack: `dp[i][c] = max(dp[i-1][c], dp[i-1][c-w] + v)`, base all zeros, answer `dp[n][W]`.
- Time $O(nW)$, memory $O(W)$ with one array.
- Single array: 0/1 loops capacity downward, unbounded loops upward.
- Subset sum: `can[0] = true`; `can[s] |= can[s-x]` downward. A bitset speeds it up by 64.
- Equal partition: total must be even, then subset sum to total / 2.
- Counting ways: `ways[0] = 1`, add `ways[s-x]`, mind the modulus.
- Complexity is pseudo-polynomial: fine when `W` is up to about $10^6$, useless at $10^9$.
- If weights are large but values small, make the value the state.
:::
