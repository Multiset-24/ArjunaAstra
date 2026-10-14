---
title: 1D DP Patterns
summary: The four one-dimensional DP shapes you meet most - take or skip, minimum coins, counting ways, and jumps - each with state, transition, base case and answer.
minutes: 40
difficulty: intermediate
rating: [1200, 1700]
tags: [dp, 1d-dp, coin-change, house-robber]
prereqs: [dp-introduction]
problems:
  - lc: house-robber
    name: House Robber
    difficulty: Medium
    core: true
    note: take or skip
  - cf: 1195C
    name: Basketball Exercise
    rating: 1400
    note: two rows, never take two neighbours
  - lc: coin-change
    name: Coin Change
    difficulty: Medium
    core: true
  - lc: coin-change-ii
    name: Coin Change II
    difficulty: Medium
    note: count combinations; loop order matters
  - lc: decode-ways
    name: Decode Ways
    difficulty: Medium
  - lc: jump-game-ii
    name: Jump Game II
    difficulty: Medium
    note: DP first, then the greedy O(n)
  - cf: 1881E
    name: Block Sequence
    rating: 1500
    note: dp from the right end
  - cf: 455A
    name: Boredom
    rating: 1500
    core: true
    note: count values, then it is House Robber
  - cf: 431C
    name: k-Tree
    rating: 1600
    note: ways to reach sum n; add a flag for the second condition
exercises:
  - Solve House Robber II (houses in a circle) by running House Robber twice on different ranges.
  - Change Coin Change so each coin can be used at most once. Which loop must run backwards?
---

## The problem

Most early DP problems have a state that is a single index or a single number: "the best answer using the first `i` items" or "the best answer for total `s`". That is a **1D DP**, a table with one dimension.

This lesson covers four shapes. Each is the same loop with a different transition.

| Shape | State `dp[i]` | Transition idea |
|---|---|---|
| Take or skip | best value using the first `i` items | skip item `i`, or take it and skip its neighbour |
| Min coins | fewest coins to make amount `i` | try every coin as the last one |
| Count ways | number of ways to make `i` | add the ways of every smaller state |
| Jumps | fewest jumps to reach position `i` | try every position that can jump to `i` |

## Take or skip: House Robber

Houses in a row hold money `a[i]`. You may not rob two adjacent houses. Maximise the total.

Brute force tries every subset with no two neighbours: exponentially many. Instead, look at house `i` only.

- **State:** `dp[i]` = best total using houses `0..i`.
- **Transition:** `dp[i] = max(dp[i-1], dp[i-2] + a[i])`. Skip house `i`, or rob it and fall back to `i - 2`.
- **Base case:** `dp[0] = a[0]`, `dp[1] = max(a[0], a[1])`.
- **Answer:** `dp[n-1]`.

```steps
title: House Robber on [2, 7, 9, 3, 1]
view: array
frames:
  - arr: [2, 7, 9, 3, 1]
    highlight: {0: done, 1: done}
    vars: {dp0: 2, dp1: 7}
    note: Base cases. dp[0] = 2 and dp[1] = max(2, 7) = 7.
  - arr: [2, 7, 9, 3, 1]
    pointers: {i: 2}
    highlight: {0: compare, 2: active}
    vars: {skip: 7, take: 11, dp2: 11}
    note: Skip gives dp[1] = 7. Take gives dp[0] + 9 = 11. Keep 11.
  - arr: [2, 7, 9, 3, 1]
    pointers: {i: 3}
    highlight: {1: compare, 3: active}
    vars: {skip: 11, take: 10, dp3: 11}
    note: Skip gives 11. Take gives dp[1] + 3 = 10. Keep 11.
  - arr: [2, 7, 9, 3, 1]
    pointers: {i: 4}
    highlight: {2: compare, 4: active}
    vars: {skip: 11, take: 12, dp4: 12}
    note: Skip gives 11. Take gives dp[2] + 1 = 12. The answer is 12.
```

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n), dp(n);
    for (auto &x : a) cin >> x;
    dp[0] = a[0];
    if (n > 1) dp[1] = max(a[0], a[1]);
    for (int i = 2; i < n; i++) dp[i] = max(dp[i - 1], dp[i - 2] + a[i]);
    cout << dp[n - 1] << "\n";
}
```
```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        long[] a = new long[n], dp = new long[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextLong();
        dp[0] = a[0];
        if (n > 1) dp[1] = Math.max(a[0], a[1]);
        for (int i = 2; i < n; i++) dp[i] = Math.max(dp[i - 1], dp[i - 2] + a[i]);
        System.out.println(dp[n - 1]);
    }
}
```
```input
5
2 7 9 3 1
```
```output
12
```

:::tip
Boredom (Codeforces 455A) looks different but is the same problem. Taking value `v` forbids `v - 1` and `v + 1`, so count each value's total in `cnt[v] * v` and run House Robber over the values.
:::

## Coins: minimum and number of ways

You have unlimited coins of given values and a target amount `T`.

**Minimum coins**

- **State:** `mn[s]` = fewest coins that sum to `s`.
- **Transition:** `mn[s] = min(mn[s - x] + 1)` over coins `x <= s`.
- **Base case:** `mn[0] = 0`; unreachable amounts hold a large sentinel.
- **Answer:** `mn[T]`, or `-1` if it is still the sentinel.

**Number of ways (combinations)**

- **State:** `ways[s]` = number of multisets of coins that sum to `s`.
- **Transition:** `ways[s] += ways[s - x]`.
- **Base case:** `ways[0] = 1` (one way to make zero: take nothing).
- **Answer:** `ways[T]`.

Both fit in one program. The coin loop is on the outside.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int k, T;
    cin >> k;
    vector<int> c(k);
    for (auto &x : c) cin >> x;
    cin >> T;
    const int INF = 1000000000;
    vector<int> mn(T + 1, INF);
    vector<long long> ways(T + 1, 0);
    mn[0] = 0;
    ways[0] = 1;
    for (int x : c)
        for (int s = x; s <= T; s++) {
            if (mn[s - x] != INF) mn[s] = min(mn[s], mn[s - x] + 1);
            ways[s] += ways[s - x];
        }
    cout << (mn[T] == INF ? -1 : mn[T]) << "\n" << ways[T] << "\n";
}
```
```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int k = sc.nextInt();
        int[] c = new int[k];
        for (int i = 0; i < k; i++) c[i] = sc.nextInt();
        int T = sc.nextInt();
        final int INF = 1000000000;
        int[] mn = new int[T + 1];
        long[] ways = new long[T + 1];
        Arrays.fill(mn, INF);
        mn[0] = 0;
        ways[0] = 1;
        for (int x : c)
            for (int s = x; s <= T; s++) {
                if (mn[s - x] != INF) mn[s] = Math.min(mn[s], mn[s - x] + 1);
                ways[s] += ways[s - x];
            }
        System.out.println((mn[T] == INF ? -1 : mn[T]) + "\n" + ways[T]);
    }
}
```
```input
3
1 2 5
11
```
```output
3
11
```

The minimum is `5 + 5 + 1`. There are 11 combinations in total.

### Loop order decides what you count

:::warn
Coins outside, amounts inside counts **combinations**: `1+2` and `2+1` are the same. Amounts outside, coins inside counts **sequences**: `1+2` and `2+1` are different. For the minimum, either order works.
:::

```predict
lang: cpp
code: |
  int ways[4] = {1, 0, 0, 0};
  for (int s = 1; s <= 3; s++)
      for (int x : {1, 2})
          if (s >= x) ways[s] += ways[s - x];
  cout << ways[3];
prompt: Coins are 1 and 2, target 3. The amount loop is outside. What prints?
output: "3"
why: This counts ordered sequences 1+1+1, 1+2 and 2+1. With the coin loop outside it would print 2, because 1+2 and 2+1 would count once.
```

## Jumps

An array `a` says that from position `j` you may jump 1 to `a[j]` steps right. Find the fewest jumps from position 0 to position `n - 1`.

- **State:** `dp[i]` = fewest jumps to reach `i`.
- **Transition:** `dp[i] = min(dp[j] + 1)` over `j < i` with `j + a[j] >= i`.
- **Base case:** `dp[0] = 0`.
- **Answer:** `dp[n-1]`.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n), dp(n, INT_MAX);
    for (auto &x : a) cin >> x;
    dp[0] = 0;
    for (int i = 1; i < n; i++)
        for (int j = 0; j < i; j++)
            if (dp[j] != INT_MAX && j + a[j] >= i) dp[i] = min(dp[i], dp[j] + 1);
    cout << dp[n - 1] << "\n";
}
```
```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] a = new int[n], dp = new int[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextInt();
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = 0;
        for (int i = 1; i < n; i++)
            for (int j = 0; j < i; j++)
                if (dp[j] != Integer.MAX_VALUE && j + a[j] >= i) dp[i] = Math.min(dp[i], dp[j] + 1);
        System.out.println(dp[n - 1]);
    }
}
```
```input
5
2 3 1 1 4
```
```output
2
```

:::truth
This is $O(n^2)$, fine up to about 5000. For 10^5 you need the greedy that tracks the farthest reachable position, which is a different idea and is covered in the greedy lesson. Recognising the DP first is still the safe way to get a correct solution.
:::

## Complexity

| Problem | States | Work per state | Total |
|---|---|---|---|
| House Robber | `n` | 2 | $O(n)$ |
| Coin Change | `T` | `k` coins | $O(Tk)$ |
| Jumps (as above) | `n` | up to `n` | $O(n^2)$ |

## Pitfalls

- Forgetting the base case `n = 1` in House Robber: `dp[1]` does not exist.
- Adding to an unreachable state. `INT_MAX + 1` overflows into a negative number; check before you add.
- Counting answers can exceed 64 bits. Take the modulus after every addition when the statement asks.
- Mixing up combinations and sequences (the loop order above).

```quiz
questions:
  - q: In House Robber, why is `dp[i-1]` an option for `dp[i]`?
    options:
      - It means house i is robbed along with house i-1
      - It means house i is skipped, so the best is whatever was possible with the first i houses
      - It is a base case
    answer: 1
    why: Skipping house i leaves the best over houses 0..i-1, which is exactly dp[i-1].
  - q: The coin loop is inside the amount loop for counting ways. What do you count?
    options:
      - Combinations (order ignored)
      - Ordered sequences (order matters)
      - Only the minimum number of coins
    answer: 1
    why: At each amount every coin is tried as the last coin, so 1+2 and 2+1 are counted separately.
```

```cards
- q: House Robber transition?
  a: dp[i] = max(dp[i-1], dp[i-2] + a[i]). Skip house i, or rob it and use dp[i-2].
- q: Base case of "number of ways" coin DP, and why?
  a: ways[0] = 1. There is exactly one way to make zero, which is to use no coins.
- q: Which loop order counts combinations for coin ways?
  a: Coins in the outer loop, amounts in the inner loop.
- q: How do you avoid overflow when extending a minimum DP?
  a: Check the previous state is reachable (not the sentinel) before adding one.
- q: What shape is Codeforces 455A (Boredom)?
  a: House Robber over values. Taking value v forbids v-1 and v+1.
```

## Notes

:::notes
- 1D DP: `dp[i]` depends on a few earlier cells; write state, transition, base case, answer first.
- House Robber: `dp[i] = max(dp[i-1], dp[i-2] + a[i])`.
- Min coins: `mn[s] = min(mn[s-x] + 1)`, with a sentinel for unreachable sums.
- Count ways: `ways[0] = 1`, `ways[s] += ways[s-x]`.
- Coins outside means combinations; amounts outside means ordered sequences.
- Jumps as DP is $O(n^2)$; there is a greedy $O(n)$ for large inputs.
- Reduce modulo $10^9 + 7$ after every addition when counting.
- Many problems hide a familiar DP: Boredom is House Robber over values.
:::
