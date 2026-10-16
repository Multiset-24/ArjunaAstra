---
title: Dynamic Programming Basics
summary: Spot repeated subproblems, then reuse each answer with memoization or a table. Learn to name the state, transition, base case and answer.
minutes: 40
difficulty: intermediate
rating: [1000, 1500]
tags: [dp, memoization, tabulation, technique]
prereqs: [recursion, complexity]
problems:
  - lc: climbing-stairs
    name: Climbing Stairs
    difficulty: Easy
    note: the smallest DP; write the recurrence first
  - lc: min-cost-climbing-stairs
    name: Min Cost Climbing Stairs
    difficulty: Easy
  - cf: 1182A
    name: Filling Shapes
    rating: 1000
    note: find the recurrence on small n, then simplify it
  - cf: 189A
    name: Cut Ribbon
    rating: 1300
    core: true
    note: the worked example below
  - cf: 698A
    name: Vacations
    rating: 1400
    core: true
    note: state = (day, what you did yesterday)
  - lc: minimum-cost-for-tickets
    name: Minimum Cost For Tickets
    difficulty: Medium
    core: true
    note: state = day index
  - cf: 474D
    name: Flowers
    rating: 1700
    note: stretch; DP plus prefix sums for range queries
exercises:
  - Write the state, transition, base case and answer for Climbing Stairs when you may also climb 3 steps.
  - Count how many calls naive fib(30) makes, then count again with a memo array.
---

## The problem

You climb a staircase of `n` steps. Each move goes up 1 or 2 steps. How many different ways reach the top?

Think about the last move. It came from step `n - 1` or from step `n - 2`. So:

$$ways(n) = ways(n-1) + ways(n-2)$$

That is a recursive answer. It is correct, and it is very slow.

## Brute force: the same work, again and again

```viz
algo: recursion-tree
input:
  fn: fib
  n: 5
  memo: false
```

The tree has 15 calls for `n = 5`. `fib(3)` is computed twice, `fib(2)` three times. The number of calls grows like $1.6^n$, so `n = 50` is already hopeless.

```predict
lang: cpp
code: |
  int calls = 0;
  int fib(int n) {
      calls++;
      if (n <= 1) return n;
      return fib(n - 1) + fib(n - 2);
  }
  // main: fib(5); cout << calls;
prompt: How many calls does fib(5) make, counting the first one?
output: "15"
why: calls(n) = 1 + calls(n-1) + calls(n-2), with calls(0) = calls(1) = 1. That gives 1, 1, 3, 5, 9, 15 for n = 0..5.
```

## The idea

**Dynamic programming (DP)** means: solve each distinct subproblem once, store the answer, and reuse it.

Two things must be true:

- **Overlapping subproblems.** The same smaller question is asked many times. Without this, caching gains nothing (that is plain divide and conquer, like merge sort).
- **Optimal substructure.** The answer to a big question is built from answers to smaller ones.

Turn the memo on and the repeated branches vanish.

```viz
algo: recursion-tree
input:
  fn: fib
  n: 5
  memo: true
```

:::key
Number of states times work per state is the running time. Fibonacci has `n` states and 2 steps per state, so $O(n)$.
:::

## The four things to write down

Before any code, answer these in words. Most wrong DP solutions fail here, not in the code.

| Part | Question | Climbing stairs |
|---|---|---|
| State | What do I need to know to describe a subproblem? | `ways[i]` = ways to reach step `i` |
| Transition | How does a state use smaller states? | `ways[i] = ways[i-1] + ways[i-2]` |
| Base case | Which states have a known answer? | `ways[0] = ways[1] = 1` |
| Answer | Which state is the question? | `ways[n]` |

## Two ways to code it

- **Memoization (top-down).** Write the recursion, add a cache. It only visits states that are actually needed.
- **Tabulation (bottom-up).** Fill a table from the base case upward with a loop. No recursion, so no stack overflow and usually faster.

```cpp
#include <bits/stdc++.h>
using namespace std;
const long long MOD = 1000000007;
vector<long long> memo;

long long ways(int n) {                   // top-down
    if (n <= 1) return 1;                 // base case
    if (memo[n] != -1) return memo[n];    // already solved
    return memo[n] = (ways(n - 1) + ways(n - 2)) % MOD;
}

int main() {
    int n;
    cin >> n;
    memo.assign(n + 1, -1);
    cout << ways(n) << "\n";
    vector<long long> dp(n + 1);          // bottom-up
    dp[0] = 1;
    if (n >= 1) dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = (dp[i - 1] + dp[i - 2]) % MOD;
    cout << dp[n] << "\n";
}
```
```java
import java.util.*;

public class Main {
    static final long MOD = 1000000007L;
    static long[] memo;

    static long ways(int n) {
        if (n <= 1) return 1;
        if (memo[n] != -1) return memo[n];
        return memo[n] = (ways(n - 1) + ways(n - 2)) % MOD;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        memo = new long[n + 1];
        Arrays.fill(memo, -1);
        System.out.println(ways(n));
        long[] dp = new long[n + 1];
        dp[0] = 1;
        if (n >= 1) dp[1] = 1;
        for (int i = 2; i <= n; i++) dp[i] = (dp[i - 1] + dp[i - 2]) % MOD;
        System.out.println(dp[n]);
    }
}
```
```input
10
```
```output
89
89
```

```order
prompt: Arrange the bottom-up version.
lang: cpp
code: |
  vector<long long> dp(n + 1);
  dp[0] = 1;
  dp[1] = 1;
  for (int i = 2; i <= n; i++)
      dp[i] = dp[i - 1] + dp[i - 2];
  return dp[n];
distractors:
  - "    dp[i] = dp[i + 1] + dp[i + 2];"
why: Base cases first, then fill in increasing i so that dp[i-1] and dp[i-2] already hold answers. Reading dp[i+1] would use values not computed yet.
```

:::truth
Top-down is easier to write when the order of states is unclear. Bottom-up is safer when the depth is large: recursion 10^5 deep can crash a Java or C++ program, so prefer loops there.
:::

## Worked example: Cut Ribbon

A ribbon has length `n`. Cut it into pieces of length `a`, `b` or `c` only, using the whole ribbon. Maximise the number of pieces.

- **State:** `dp[i]` = most pieces that exactly make length `i`, or $-\infty$ if impossible.
- **Transition:** `dp[i] = max(dp[i - x]) + 1` over `x` in `{a, b, c}` with `i >= x` and `dp[i - x]` reachable.
- **Base case:** `dp[0] = 0` (an empty ribbon needs no pieces).
- **Answer:** `dp[n]`.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, a, b, c;
    cin >> n >> a >> b >> c;
    const int NEG = -1000000000;
    vector<int> dp(n + 1, NEG);
    dp[0] = 0;
    int cut[3] = {a, b, c};
    for (int i = 1; i <= n; i++)
        for (int x : cut)
            if (i >= x && dp[i - x] != NEG) dp[i] = max(dp[i], dp[i - x] + 1);
    cout << dp[n] << "\n";
}
```
```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] cut = {sc.nextInt(), sc.nextInt(), sc.nextInt()};
        final int NEG = -1000000000;
        int[] dp = new int[n + 1];
        Arrays.fill(dp, NEG);
        dp[0] = 0;
        for (int i = 1; i <= n; i++)
            for (int x : cut)
                if (i >= x && dp[i - x] != NEG) dp[i] = Math.max(dp[i], dp[i - x] + 1);
        System.out.println(dp[n]);
    }
}
```
```input
7 5 5 2
```
```output
2
```

For `n = 7`, pieces `5 + 2` give 2. Two 2s and a 3 would need a length 3, which is not allowed.

```blanks
prompt: Complete the unreachable check in the transition.
lang: cpp
code: |
  if (i >= x && dp[i - x] != [[NEG|-INF]])
      dp[i] = max(dp[i], dp[i - x] [[+ 1|+1]]);
why: A state marked impossible must not be extended, otherwise -INF + 1 looks like a real answer. Adding one piece is the transition.
```

## Complexity

- Time: states x transitions per state. Here $O(3n)$.
- Memory: one value per state. Often you only need the last few, so a rolling variable can cut it to $O(1)$.

## Pitfalls

- **Wrong state.** If two different situations share one state, the answer is silently wrong. Ask: does the future depend on anything not in my state?
- **Forgetting impossible states.** Use a sentinel (a special marker value) and test it before using it.
- **Overflow.** Counting problems blow past 64 bits fast. The problem usually asks for the answer modulo $10^9 + 7$; reduce after every addition.
- **Wrong fill order.** Bottom-up needs every dependency computed before it is read.
- **Sentinel -1 with a legitimate -1 answer.** Pick a marker that cannot be a real answer.

```quiz
q: Which problem is a good fit for DP?
options:
  - Sort an array of n numbers
  - Count the ways to climb n stairs with 1 or 2 steps, where each answer depends on the two before it
  - Find the largest element of an array
answer: 1
why: Only the stairs problem asks the same smaller question repeatedly, with answers built from smaller answers. Sorting and maximum have no overlapping subproblems.
```

```quiz
q: A DP has 10^6 states and each state tries 5 options. Roughly how many operations?
options:
  - 5 x 10^6
  - 10^6 + 5
  - 5^(10^6)
answer: 0
why: Time is the number of states times the work per state.
```

```cards
- q: What are the two conditions that make DP useful?
  a: Overlapping subproblems (the same question repeats) and optimal substructure (a big answer is built from smaller answers).
- q: What four things do you write before coding a DP?
  a: State, transition, base case, and which state is the answer.
- q: Memoization versus tabulation?
  a: Memoization is top-down recursion plus a cache. Tabulation is a bottom-up loop that fills a table from the base case.
- q: How do you compute the running time of a DP?
  a: Number of states times the work done per state.
```

## Notes

:::notes
- DP = solve each distinct subproblem once, store it, reuse it.
- Needs overlapping subproblems and optimal substructure.
- Always write down: state, transition, base case, answer.
- Time = (number of states) x (work per state).
- Top-down (memo) is easy to write; bottom-up (table) avoids deep recursion.
- Mark impossible states with a sentinel and check it before extending.
- Counting problems: reduce modulo $10^9 + 7$ after every addition.
- If the state misses something the future depends on, the answer is wrong, however clean the code looks.
:::
