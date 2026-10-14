---
title: Recursion
summary: Solve a problem by calling the same function on smaller inputs, and learn to see the call stack, the recursion tree and the cost of repeated work.
minutes: 35
difficulty: beginner
rating: [1000, 1500]
tags: [recursion, call-stack, divide-and-conquer, technique]
prereqs: [arrays-and-strings, binary-search]
problems:
  - lc: fibonacci-number
    name: Fibonacci Number
    difficulty: Easy
  - lc: maximum-depth-of-binary-tree
    name: Maximum Depth of Binary Tree
    difficulty: Easy
    note: the answer for a node comes from its two children
  - lc: climbing-stairs
    name: Climbing Stairs
    difficulty: Easy
    note: recursion, then add a cache
  - lc: merge-two-sorted-lists
    name: Merge Two Sorted Lists
    difficulty: Easy
  - lc: reverse-linked-list
    name: Reverse Linked List
    difficulty: Easy
    note: do it both recursively and with a loop
  - cf: 1829D
    name: Gold Rush
    rating: 1000
    core: true
    note: try the split, recurse on both parts
  - cf: 727A
    name: "Transformation: from A to B"
    rating: 1000
    note: work backwards from b
  - lc: powx-n
    name: Pow(x, n)
    difficulty: Medium
    core: true
    note: halve the exponent
  - cf: 1490D
    name: Permutation Transformation
    rating: 1200
    core: true
    note: split the range at the maximum
  - cf: 1741D
    name: Masha and a Beautiful Tree
    rating: 1300
    note: recurse on halves of the array
  - cf: 1385D
    name: a-Good String
    rating: 1500
    note: stretch; two choices per level
exercises:
  - Write a recursive function that prints the binary representation of n. Does it print before or after the recursive call?
  - Count how many calls naive fib(25) makes, then add a cache and count again.
---

## The problem

Some problems contain smaller copies of themselves.

- Sum of `1..n` is `n` plus the sum of `1..n-1`.
- The depth of a tree is 1 plus the larger depth of its two subtrees.
- `x^n` is `x^(n/2)` squared, times `x` if `n` is odd.

**Recursion** means a function that calls itself on a smaller input. It is the natural way to write these, and the base of backtracking, dynamic programming and tree algorithms later in the track.

## Three parts

1. **Base case.** An input so small that you answer directly. Without it the calls never stop.
2. **Smaller call.** Each call must move toward the base case: smaller `n`, shorter range.
3. **Combine.** Build this answer from the answers of the smaller calls.

```cpp
int sum(int n) {
    if (n == 0) return 0;      // base case
    return n + sum(n - 1);     // smaller call, then combine
}
```

:::key
Do not trace every call in your head. Assume the smaller call returns the correct answer, and check only that the base case is right and that the combine step is right.
:::

## The call stack

Each call gets a **frame**, a block of memory for its parameters and local variables. Frames pile up like plates. A call that returns removes its frame.

```steps
title: Call stack while computing sum(3)
view: array
frames:
  - arr: [3]
    pointers: {top: 0}
    note: sum(3) starts. It needs sum(2) before it can add 3.
  - arr: [3, 2]
    pointers: {top: 1}
    note: sum(2) starts and waits for sum(1).
  - arr: [3, 2, 1]
    pointers: {top: 2}
    note: sum(1) starts and waits for sum(0).
  - arr: [3, 2, 1, 0]
    pointers: {top: 3}
    highlight: {3: match}
    note: sum(0) hits the base case and returns 0. The stack is at its deepest.
  - arr: [3, 2, 1]
    pointers: {top: 2}
    highlight: {2: done}
    note: sum(1) gets 0, returns 1 + 0 = 1.
  - arr: [3, 2]
    pointers: {top: 1}
    highlight: {1: done}
    note: sum(2) gets 1, returns 2 + 1 = 3.
  - arr: [3]
    pointers: {top: 0}
    highlight: {0: done}
    note: sum(3) gets 3, returns 3 + 3 = 6.
```

Code placed before the recursive call runs on the way down. Code placed after it runs on the way back.

```predict
lang: cpp
code: |
  void g(int n) {
      if (n == 0) return;
      cout << n << " ";
      g(n - 1);
      cout << n << " ";
  }
  g(3);
prompt: What does g(3) print?
output: 3 2 1 1 2 3
why: Each call prints n, then calls g(n - 1), then prints n again. The first prints happen going down, the second prints happen as each call returns.
```

## Recursion trees and blow-up

Draw each call as a node and each recursive call as a child. This is a **recursion tree**. Its size is the total work.

Naive Fibonacci calls itself twice per node:

```cpp
int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}
```

```viz
algo: recursion-tree
input:
  fn: fib
  n: 5
  memo: false
```

Look for repeated nodes: `fib(2)` and `fib(3)` are computed several times. Turn **memo** on (memoization: remember each answer the first time) and the tree collapses to one node per value of `n`.

| n | Calls in naive fib(n) |
|---|---|
| 10 | 177 |
| 20 | 21,891 |
| 30 | 2,692,537 |
| 40 | 331,160,281 |

The count grows by about 1.6 times for each step of `n`. That is exponential growth, written $O(\varphi^n)$ where $\varphi \approx 1.618$.

```estimate
q: Naive fib(40) makes about how many calls?
answer: 330000000
unit: calls
tolerance: order
hint: The number of calls grows by about 1.6 times when n goes up by 1. Start from 2.7 million at n = 30.
solution: "From n = 30 to n = 40 is 10 steps, and 1.618^10 is about 123. 2.7 million x 123 is about 3.3 x 10^8 calls."
```

The program below counts calls with and without a cache.

```cpp
#include <bits/stdc++.h>
using namespace std;

long long calls = 0;
long long memo[100];

long long fib(int n) {
    calls++;
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

long long fibMemo(int n) {
    calls++;
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = fibMemo(n - 1) + fibMemo(n - 2);
}

int main() {
    int n;
    cin >> n;
    cout << fib(n) << " " << calls << "\n";
    calls = 0;
    fill(memo, memo + 100, -1);
    cout << fibMemo(n) << " " << calls << "\n";
}
```
```java
import java.util.*;

public class Main {
    static long calls = 0;
    static long[] memo = new long[100];

    static long fib(int n) {
        calls++;
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
    }

    static long fibMemo(int n) {
        calls++;
        if (n <= 1) return n;
        if (memo[n] != -1) return memo[n];
        return memo[n] = fibMemo(n - 1) + fibMemo(n - 2);
    }

    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        System.out.println(fib(n) + " " + calls);
        calls = 0;
        Arrays.fill(memo, -1);
        System.out.println(fibMemo(n) + " " + calls);
    }
}
```
```input
30
```
```output
832040 2692537
832040 59
```

The cache turns 2.7 million calls into 59. Turning this into a systematic method is dynamic programming, covered in its own stage.

## Shrinking fast: halving

If each call halves the input, the depth is only $\log_2 n$. Fast exponentiation does this: `x^n` needs one call on `n / 2`, not two.

```order
prompt: Arrange the recursive power function.
lang: cpp
code: |
  long long power(long long x, long long n) {
      if (n == 0) return 1;
      long long half = power(x, n / 2);
      if (n % 2 == 0) return half * half;
      return half * half * x;
  }
distractors:
  - "    if (n == 0) return 0;"
why: The base case x^0 = 1. Calling power only once and reusing half is what makes it O(log n); writing power(x, n/2) * power(x, n/2) would double the calls and lose the saving.
```

```cpp
#include <bits/stdc++.h>
using namespace std;

const long long MOD = 1000000007LL;

long long power(long long x, long long n) {
    if (n == 0) return 1;
    long long half = power(x, n / 2);
    long long r = half * half % MOD;
    if (n % 2 == 1) r = r * x % MOD;
    return r;
}

int main() {
    long long x, n;
    cin >> x >> n;
    cout << power(x, n) << "\n";
}
```
```java
import java.util.*;

public class Main {
    static final long MOD = 1_000_000_007L;

    static long power(long x, long n) {
        if (n == 0) return 1;
        long half = power(x, n / 2);
        long r = half * half % MOD;
        if (n % 2 == 1) r = r * x % MOD;
        return r;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long x = sc.nextLong(), n = sc.nextLong();
        System.out.println(power(x, n));
    }
}
```
```input
2 100
```
```output
976371285
```

The answer is taken modulo $10^9 + 7$ (the remainder after dividing by it), a standard way to keep huge results inside a 64-bit number.

```quiz
q: In the power function, why is `half` stored in a variable instead of writing `power(x, n/2) * power(x, n/2)`?
options:
  - The variable makes the code shorter
  - Two calls per level makes the recursion tree have n leaves, losing the logarithmic speed
  - The compiler cannot call a function twice
answer: 1
why: "One call per level gives a chain of depth log n. Two calls per level doubles the work at each level, so the total is about n calls, no better than a loop."
```

## Depth limits

Every frame costs memory, and the stack is small compared with the heap.

| Platform | Typical safe depth |
|---|---|
| C++ on most judges | around 10^5, often more |
| Java, default thread | around 10^4 |

These numbers depend on the judge and on how much each frame holds, so treat them as rough.

- A recursion that goes 10^5 or 10^6 deep (a path-shaped tree, a long chain) can crash with a stack overflow.
- Fix 1: rewrite as a loop or with your own explicit stack.
- Fix 2 (Java): run the work in a thread with a bigger stack.

```java
Thread t = new Thread(null, () -> solve(), "main", 1L << 28);
t.start();
```

:::truth
Recursion is rarely the hard part of a contest problem. The usual failures are a missing or wrong base case, a call that does not shrink the input, and forgetting that the same subproblem is solved again and again. When a recursive solution is too slow, look at the recursion tree for repeated nodes before anything else.
:::

## Complexity

- Time is roughly the number of nodes in the recursion tree times the work per node.
- Space is the maximum depth of the stack, plus anything you store.
- Sum to n: O(n) time and O(n) stack. Fast power: O(log n) time and stack. Naive Fibonacci: exponential time, O(n) stack.

## Pitfalls

- **No base case or a missed one.** Check `n == 0` and `n == 1` and empty ranges.
- **The input does not shrink.** `f(n)` calling `f(n)` runs until the stack overflows.
- **Repeated subproblems.** Same arguments called many times means add a cache.
- **Shared state.** If a function changes a global value, undo it before returning when the caller expects the old one.
- **Deep chains.** Convert to a loop when depth can reach 10^5 or more.

```cards
- q: What are the three parts of a recursive function?
  a: A base case, a call on a smaller input, and a step that combines the results.
- q: What is a call stack frame?
  a: The block of memory holding one call's parameters and local variables. Frames are pushed on call and popped on return.
- q: Why is naive recursive Fibonacci exponential?
  a: Each call makes two more, and the same values are recomputed many times. The call count grows about 1.6 times per step of n.
- q: What does memoization do?
  a: It stores the result of each distinct call the first time, so repeated calls return immediately.
- q: How deep is the recursion when each call halves the input?
  a: About log2(n) levels.
```

## Notes

:::notes
- Recursion = base case + smaller call + combine. Trust the smaller call, verify the base case.
- Each call has a frame on the call stack; code before the call runs going down, code after it runs coming back.
- Recursion tree: nodes are calls. Total work is about the number of nodes times work per node.
- Naive fib is exponential (about 1.6x per step; fib(40) is over 3 x 10^8 calls). Repeated nodes in the tree mean add memoization.
- Halving the input gives depth log n; call the recursive function once and reuse the result (fast power).
- Depth limits: roughly 10^4 in default Java, around 10^5 or more in C++; go iterative or enlarge the Java stack for deep chains.
- Common bugs: missing base case, non-shrinking argument, recomputed subproblems, unrestored shared state.
:::
