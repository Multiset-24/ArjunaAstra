---
title: Sparse Table
summary: Precompute answers for every power-of-two length so that range min, max or gcd on a fixed array takes O(1) per query.
minutes: 30
difficulty: advanced
rating: [1700, 2200]
tags: [sparse-table, rmq, data-structures, range-queries]
prereqs: [prefix-sums, bit-manipulation]
problems:
  - cses: 1647
    name: Static Range Minimum Queries
    note: the exact template of this lesson
  - cf: 1709D
    name: Rorororobot
    rating: 1700
    note: range maximum over columns decides if a path is blocked
  - cf: 1548B
    name: Integers Have Friends
    rating: 1800
    core: true
    note: gcd of adjacent differences, two pointers
  - cf: 1691D
    name: Max GEQ Sum
    rating: 1800
    core: true
    note: sparse table for max, monotonic stack for the borders
  - cf: 1547F
    name: Array Stabilization (GCD version)
    rating: 1900
    core: true
    note: duplicate the array, binary search on the number of steps
  - cf: 475D
    name: CGCDSSQ
    rating: 2000
    note: count subarrays by gcd value
  - cf: 689D
    name: Friends and Subsequences
    rating: 2100
    note: binary search where max - min is checked in O(1)
  - lc: sliding-window-maximum
    name: Sliding Window Maximum
    difficulty: Hard
    note: a deque is the standard answer; try a sparse table for contrast
exercises:
  - Make the table store the index of the minimum instead of the value. What must the comparison look at?
  - Change the table to answer range gcd queries. Which line changes?
---

## The problem

You have a fixed array of n numbers and q queries. Each asks for the minimum of `a[l..r]`. Nothing ever changes. With n and q near 200,000 or more, you want each query to cost almost nothing.

## Brute force first

| Approach | Build | Query | Memory |
|---|---|---|---|
| Scan the range | none | O(n) | O(1) |
| Table of all pairs `(l, r)` | O(n^2) | O(1) | O(n^2), far too large |
| Segment tree | O(n) | O(log n) | O(n) |
| Sparse table | O(n log n) | O(1) | O(n log n) |

The all-pairs table is the right answer in spirit but stores too much. The sparse table keeps only the ranges whose length is a power of two.

## The idea

Let `sp[k][i]` be the minimum of the `2^k` elements starting at `i`.

- Level 0 is the array itself.
- `sp[k][i] = min(sp[k-1][i], sp[k-1][i + 2^(k-1)])`: two halves of the previous level.
- To answer `[l, r]`, let `len = r - l + 1` and `k = floor(log2(len))`. Two blocks of length `2^k`, one starting at `l` and one ending at `r`, cover the range. They may **overlap**, and that is fine for a minimum.

```steps
title: Levels for [5, 2, 4, 7, 6, 3, 1, 9], then the query [1..6] (0-indexed)
view: array
frames:
  - arr: [5, 2, 4, 7, 6, 3, 1, 9]
    note: "Level 0: sp[0][i] = a[i]. Each cell is the minimum of 1 element."
  - arr: [2, 2, 4, 6, 3, 1, 1]
    note: "Level 1: min of 2 elements. sp[1][0] = min(5, 2) = 2. It has n - 1 cells because the last block would run off the end."
  - arr: [2, 2, 3, 1, 1]
    note: "Level 2: min of 4 elements. sp[2][i] = min(sp[1][i], sp[1][i+2]). Five cells."
  - arr: [1]
    note: "Level 3: min of all 8 elements. One cell."
  - arr: [2, 2, 3, 1, 1]
    highlight: {1: active, 3: active}
    note: "Query [1..6] has length 6, so k = 2. Read sp[2][1] (covers 1..4) and sp[2][6-4+1=3] (covers 3..6). Their minimum is min(2, 1) = 1. Indices 3 and 4 were counted twice, which does not matter."
```

```quiz
q: Which of these queries can NOT be answered from the two overlapping blocks?
options:
  - Range minimum
  - Range gcd
  - Range sum
  - Range bitwise OR
answer: 2
why: "Overlapping blocks count the shared elements twice. That is harmless when op(x, x) = x (min, max, gcd, AND, OR are such operations, called idempotent) and wrong for sum, xor or count."
```

## Template

The program reads `n q`, the array, then q queries `l r` (1-based, inclusive) and prints each minimum.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, q;
    scanf("%d %d", &n, &q);
    int LOG = 32 - __builtin_clz(n);  // levels 0..LOG-1 so that 2^(LOG-1) <= n
    vector<vector<int>> sp(LOG, vector<int>(n));
    for (int i = 0; i < n; i++) scanf("%d", &sp[0][i]);
    for (int k = 1; k < LOG; k++)
        for (int i = 0; i + (1 << k) <= n; i++)
            sp[k][i] = min(sp[k - 1][i], sp[k - 1][i + (1 << (k - 1))]);
    while (q--) {
        int l, r;  // 1-indexed, inclusive
        scanf("%d %d", &l, &r);
        l--; r--;
        int k = 31 - __builtin_clz(r - l + 1);  // floor(log2(length))
        printf("%d\n", min(sp[k][l], sp[k][r - (1 << k) + 1]));
    }
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
        int q = Integer.parseInt(st.nextToken());
        int LOG = 32 - Integer.numberOfLeadingZeros(n);
        int[][] sp = new int[LOG][n];
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) sp[0][i] = Integer.parseInt(st.nextToken());
        for (int k = 1; k < LOG; k++)
            for (int i = 0; i + (1 << k) <= n; i++)
                sp[k][i] = Math.min(sp[k - 1][i], sp[k - 1][i + (1 << (k - 1))]);
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) {
            st = new StringTokenizer(br.readLine());
            int l = Integer.parseInt(st.nextToken()) - 1;
            int r = Integer.parseInt(st.nextToken()) - 1;
            int k = 31 - Integer.numberOfLeadingZeros(r - l + 1);
            sb.append(Math.min(sp[k][l], sp[k][r - (1 << k) + 1])).append('\n');
        }
        System.out.print(sb);
    }
}
```
```input
8 5
5 2 4 7 6 3 1 9
2 7
1 8
4 6
5 5
1 3
```
```output
1
1
3
6
2
```

The level of a query is the position of the highest set bit of the length, found with a count-leading-zeros instruction.

```predict
lang: cpp
code: |
  for (int len : {1, 6, 8, 1000})
      cout << (31 - __builtin_clz(len)) << " ";
output: 0 2 3 9
why: "floor(log2(len)) is the index of the highest set bit. 6 is 110 (bit 2), 8 is 1000 (bit 3), 1000 is just under 1024 = 2^10, so 9."
```

```blanks
prompt: Complete the query for the 0-indexed inclusive range [l, r].
lang: cpp
code: |
  int k = [[31 - __builtin_clz(r - l + 1)]];
  int ans = min(sp[k][l], sp[k][r - [[(1 << k)|(1<<k)|1 << k]] + 1]);
why: k is the highest set bit of the length. The second block must end at r, so it starts at r - 2^k + 1.
```

## Walkthrough

For `[5, 2, 4, 7, 6, 3, 1, 9]`:

- Query `2 7` has length 6 and `k = 2`. It reads `sp[2][1]` and `sp[2][3]`, giving `min(2, 1) = 1`.
- Query `4 6` has length 3 and `k = 1`. It reads `sp[1][3]` and `sp[1][4]`, giving `min(6, 3) = 3`.
- A single element, `5 5`, has `k = 0` and both blocks are the same cell.

## Complexity and memory

- Build is O(n log n) time. Each query is O(1) with two array reads.
- Memory is `n * (floor(log2 n) + 1)` values.

```estimate
q: You build a sparse table of int values (4 bytes each) for n = 1,000,000. About how many megabytes does it take?
answer: 80
unit: MB
tolerance: 0.3
hint: The number of levels is floor(log2(10^6)) + 1.
solution: "log2(10^6) is about 19.9, so there are 20 levels. 20 x 10^6 x 4 bytes is 80 MB. With long long it would be 160 MB, which often breaks a 256 MB limit."
```

## Variants

- **Other idempotent operations.** Replace `min` with `max`, `gcd`, `&` or `|`. Nothing else changes.
- **Index of the minimum.** Store indices and compare `a[i]` values.
- **Non-idempotent operations.** For a sum, use prefix sums. For xor, use prefix xor.
- **Updates.** A sparse table is static. Any change means a rebuild, so use a segment tree.

## Pitfalls

- Computing `k` with floating-point `log2`. Use `31 - __builtin_clz(len)` or `Integer.numberOfLeadingZeros`.
- Mixing 0-based and 1-based indices in `l` and `r`. Convert once, at input.
- Building level `k` for indices where `i + 2^k > n`. Those cells are never read, so leave them out.
- Using `long long` tables when `int` is enough. Memory grows with the number of levels.
- Using it on an operation that is not idempotent.

:::truth
With q around 2e5, a segment tree at O(log n) per query passes almost every time. The sparse table matters when q is in the millions, when RMQ sits inside another loop (binary search on top of it, or an LCA by Euler tour), or when you just want the shorter code. Do not reach for it first when the array has updates.
:::

```cards
- q: What does sp[k][i] store?
  a: The answer (min, max, gcd, ...) over the 2^k elements starting at index i.
- q: How is level k built from level k-1?
  a: "`sp[k][i] = op(sp[k-1][i], sp[k-1][i + 2^(k-1)])`."
- q: How do you answer a query on [l, r]?
  a: With k = floor(log2(r - l + 1)), take op(sp[k][l], sp[k][r - 2^k + 1]). Two blocks that may overlap.
- q: Which operations allow the overlap trick?
  a: Idempotent ones, where op(x, x) = x. Min, max, gcd, AND and OR work. Sum, xor and count do not.
- q: Build time, query time and memory?
  a: $O(n \log n)$ build, $O(1)$ per query, $O(n \log n)$ memory.
```

## Notes

:::notes
- Sparse table: `sp[k][i]` = answer over the `2^k` elements starting at `i`.
- Build: `sp[k][i] = op(sp[k-1][i], sp[k-1][i + 2^(k-1)])` for `i + 2^k <= n`.
- Query `[l, r]`: `k = 31 - clz(r - l + 1)`, answer `op(sp[k][l], sp[k][r - 2^k + 1])`.
- Overlap is only safe for idempotent operations: min, max, gcd, AND, OR.
- Not for sum, xor or count (use prefix sums) and not for arrays with updates (use a segment tree).
- Build and memory are O(n log n); each query is O(1).
- Compute the level with clz, not floating-point log.
:::
