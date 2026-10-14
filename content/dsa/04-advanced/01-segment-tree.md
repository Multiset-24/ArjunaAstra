---
title: Segment Tree
summary: Answer range queries and point updates in O(log n) by storing the answer for every halved segment of the array.
minutes: 45
difficulty: advanced
rating: [1600, 2300]
tags: [segment-tree, data-structures, range-queries]
prereqs: [prefix-sums, recursion]
problems:
  - cses: 1648
    name: Dynamic Range Sum Queries
    note: the exact template of this lesson
  - lc: range-sum-query-mutable
    name: Range Sum Query - Mutable
    difficulty: Medium
  - cses: 1649
    name: Dynamic Range Minimum Queries
  - cf: 1234D
    name: Distinct Characters Queries
    rating: 1600
    core: true
    note: store a 26-bit mask per node and merge with OR
  - cf: 339D
    name: Xenia and Bit Operations
    rating: 1700
    core: true
    note: the merge operation alternates by level
  - cf: 482B
    name: Interesting Array
    rating: 1800
    note: one tree per bit, or AND-merge with a build step
  - cf: 380C
    name: Sereja and Brackets
    rating: 2000
    core: true
    note: node = (matched pairs, open left, close right)
  - cf: 689D
    name: Friends and Subsequences
    rating: 2100
    note: two trees (max and min) plus binary search
  - cf: 438D
    name: The Child and Sequence
    rating: 2300
    note: keep max per node, skip segments where max < mod
exercises:
  - Change the tree so a query returns the position of the minimum, not just its value.
  - Add a query that returns the first index i >= l with a[i] >= x by descending the recursive tree.
---

## The problem

You have an array of n numbers and q operations. Each one is either "set a[i] to v" or "print the sum of a[l..r]". Both n and q can reach 200,000.

## Brute force first

| Approach | Update | Query | Total for n = q = 2e5 |
|---|---|---|---|
| Plain array | O(1) | O(n) | about 4e10 steps, too slow |
| Prefix sums | O(n) rebuild | O(1) | about 4e10 steps, too slow |
| Segment tree | O(log n) | O(log n) | about 7e6 steps |

Prefix sums are great when the array never changes. A single update shifts every later prefix. You need a structure where both operations are cheap.

## The idea

A **segment tree** stores the answer for a segment in a node, then splits the segment in half and does the same for each half.

- The root holds the answer for the whole array.
- Each node has two children covering its left and right halves.
- A leaf covers one element.
- A query splits `[l, r]` into at most about 2 log n whole nodes and merges their answers.
- An update changes one leaf, then recomputes its ancestors, which is one node per level.

```viz
algo: segment-tree
input:
  arr: [5, 8, 6, 3, 2, 7, 2, 6]
  queries: [[2, 6]]
  updates: [[3, 10]]
```

:::note
The visualizer uses 0-indexed, inclusive queries. The code below uses half-open ranges `[l, r)`, which is the usual form for the array layout.
:::

```quiz
q: An array has 1024 elements. You set one element. About how many tree nodes change?
options:
  - 1, only the leaf
  - 11, the leaf and its 10 ancestors
  - 512, half of the tree
  - 1024, every leaf
answer: 1
why: "Only the leaf and the nodes above it contain that element. The tree has about log2(1024) = 10 levels above the leaves, so 11 nodes in total."
```

## The array layout

You do not need pointers. Store the tree in an array `t` of size 2n:

- Leaves live at `t[n .. 2n-1]`, so element `i` is `t[n + i]`.
- Node `i` has children `2i` and `2i + 1`, and parent `i >> 1`.
- Node 1 is the root. Build is one loop from `n-1` down to 1.

```predict
lang: cpp
code: |
  int n = 4;
  long long t[8] = {0, 0, 0, 0, 1, 2, 3, 4};
  for (int i = n - 1; i >= 1; i--) t[i] = t[2 * i] + t[2 * i + 1];
  cout << t[1] << " " << t[2] << " " << t[3];
output: 10 3 7
why: t[2] covers the first two leaves (1 + 2 = 3), t[3] the last two (3 + 4 = 7), and the root t[1] is their sum, 10.
```

For a query on `[l, r)`, move both ends up one level at a time. If `l` is a right child (odd), its parent would include an element left of the range, so take `t[l]` alone and step right. If `r` is odd, then `r - 1` is a left child that must be taken alone.

```blanks
prompt: Complete the bottom-up query on the half-open range [l, r).
lang: cpp
code: |
  long long res = 0;
  for (l += n, r += n; l < r; l >>= 1, r >>= 1) {
      if ([[l & 1|l&1|(l & 1) == 1]]) res += t[l++];
      if ([[r & 1|r&1|(r & 1) == 1]]) res += t[--r];
  }
why: An odd l is a right child, so its parent would reach left of the range. An odd r means r - 1 is a left child that has to be taken alone. Both ends then move up with a shift.
```

## Template

The program reads `n q`, then the array, then q operations. Type 1 is `1 k u` (set `a[k] = u`), type 2 is `2 a b` (sum of `a[a..b]`). Indices are 1-based, as in CSES.

```cpp
#include <bits/stdc++.h>
using namespace std;

int n;
vector<long long> t;  // t[1] is the root, leaves are t[n..2n-1]

void update(int i, long long v) {  // set a[i] = v (0-indexed)
    for (t[i += n] = v; i > 1; i >>= 1) t[i >> 1] = t[i] + t[i ^ 1];
}

long long query(int l, int r) {  // sum of a[l..r-1], half-open
    long long res = 0;
    for (l += n, r += n; l < r; l >>= 1, r >>= 1) {
        if (l & 1) res += t[l++];
        if (r & 1) res += t[--r];
    }
    return res;
}

int main() {
    int q;
    scanf("%d %d", &n, &q);
    t.assign(2 * n, 0);
    for (int i = 0; i < n; i++) scanf("%lld", &t[n + i]);
    for (int i = n - 1; i >= 1; i--) t[i] = t[2 * i] + t[2 * i + 1];
    while (q--) {
        int type;
        scanf("%d", &type);
        if (type == 1) {
            int k;
            long long u;
            scanf("%d %lld", &k, &u);
            update(k - 1, u);
        } else {
            int a, b;
            scanf("%d %d", &a, &b);
            printf("%lld\n", query(a - 1, b));
        }
    }
    return 0;
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static int n;
    static long[] t;

    static void update(int i, long v) {
        for (t[i += n] = v; i > 1; i >>= 1) t[i >> 1] = t[i] + t[i ^ 1];
    }

    static long query(int l, int r) {  // sum of a[l..r-1]
        long res = 0;
        for (l += n, r += n; l < r; l >>= 1, r >>= 1) {
            if ((l & 1) == 1) res += t[l++];
            if ((r & 1) == 1) res += t[--r];
        }
        return res;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        n = Integer.parseInt(st.nextToken());
        int q = Integer.parseInt(st.nextToken());
        t = new long[2 * n];
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) t[n + i] = Long.parseLong(st.nextToken());
        for (int i = n - 1; i >= 1; i--) t[i] = t[2 * i] + t[2 * i + 1];
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) {
            st = new StringTokenizer(br.readLine());
            int type = Integer.parseInt(st.nextToken());
            if (type == 1) {
                int k = Integer.parseInt(st.nextToken());
                long u = Long.parseLong(st.nextToken());
                update(k - 1, u);
            } else {
                int a = Integer.parseInt(st.nextToken());
                int b = Integer.parseInt(st.nextToken());
                sb.append(query(a - 1, b)).append('\n');
            }
        }
        System.out.print(sb);
    }
}
```
```input
8 6
5 8 6 3 2 7 2 6
2 3 7
1 4 10
2 3 7
2 1 8
2 5 5
2 2 4
```
```output
20
27
46
2
24
```

## Walkthrough

For `[5, 8, 6, 3, 2, 7, 2, 6]`, the query `2 3 7` asks for `6 + 3 + 2 + 7 + 2 = 20`.

- After `1 4 10`, the same query gives `6 + 10 + 2 + 7 + 2 = 27`.
- The update rewrites the leaf and 3 ancestors, no more.
- The query `2 1 8` covers the whole array, so it reads only the root, which holds 46.

## Beyond sums

The tree works for any **associative** merge: `merge(merge(a, b), c) = merge(a, merge(b, c))`. The node can store anything you can combine from two halves.

| Question | Node stores | Merge |
|---|---|---|
| Range minimum | min | `min` |
| Range gcd | gcd | `gcd` |
| Distinct letters in range | 26-bit mask | bitwise OR |
| Count of minimums | (min, count) | compare mins, add counts |
| Maximum subarray sum | (sum, best prefix, best suffix, best) | see below |

The last row shows how to work out a node: a subarray lies in the left half, in the right half, or crosses the middle.

```cpp
struct Node { long long sum, pref, suf, best; };
Node leaf(long long x) { return {x, x, x, x}; }
Node merge(const Node& a, const Node& b) {
    return { a.sum + b.sum,
             max(a.pref, a.sum + b.pref),
             max(b.suf, b.sum + a.suf),
             max({a.best, b.best, a.suf + b.pref}) };
}
```
```java
// node = {sum, pref, suf, best}
static long[] leaf(long x) { return new long[]{x, x, x, x}; }
static long[] merge(long[] a, long[] b) {
    return new long[]{ a[0] + b[0],
                       Math.max(a[1], a[0] + b[1]),
                       Math.max(b[2], b[0] + a[2]),
                       Math.max(Math.max(a[3], b[3]), a[2] + b[1]) };
}
```

```quiz
q: Which value can you NOT keep per node and rebuild from the two children alone?
options:
  - The sum of the segment
  - The maximum of the segment
  - The gcd of the segment
  - The median of the segment
answer: 3
why: "The median of a union depends on all the values, not only on the two medians. Sum, max and gcd are associative, so the children are enough."
```

:::warn
The bottom-up query above is written for a commutative merge such as sum or min. If the order of the halves matters, as in the subarray-sum node, either keep separate left and right accumulators or use the recursive version, where the left child is always the left half.
:::

## Complexity

- Build is O(n). Query and update are O(log n).
- Memory is 2n for the layout above. A recursive tree needs 4n to be safe for any n.

## Pitfalls

- Mixing inclusive `[l, r]` and half-open `[l, r)` ranges. Pick one per solution.
- Sizing a recursive tree with 2n. Use `4 * n`.
- Using `int` for sums. 2e5 values of 1e9 overflow 32 bits.
- Writing `t[i] += v` when the task says "set". Either work with the difference or overwrite the leaf.
- Putting a non-associative value in a node, such as a median or a distinct count.

:::truth
For sums alone, a Fenwick tree (next lessons) is shorter and faster. The segment tree earns its place when the node stores something richer. Most of the difficulty in 1900 to 2300 problems is deciding what the node holds, not writing the loops.
:::

```cards
- q: What does a segment tree node store?
  a: The answer for one segment of the array, built by merging the answers of its two half-segments.
- q: Cost of point update and range query?
  a: Both $O(\log n)$. Build is $O(n)$.
- q: In the 2n array layout, where are the leaves, the children and the parent?
  a: Leaves at `t[n..2n-1]`, children of node i at `2i` and `2i+1`, parent at `i >> 1`.
- q: What must the merge operation satisfy?
  a: It must be associative. The node value must be computable from the two children alone.
- q: How big must a recursive segment tree array be?
  a: "`4 * n`, to be safe for any n."
```

## Notes

:::notes
- Segment tree: node = answer for a segment; children = left and right halves.
- Point update touches one leaf and its ancestors; range query uses at most about 2 log n nodes.
- Array layout: leaves `t[n..2n-1]`, parent `i >> 1`, children `2i` and `2i+1`; build loops `i = n-1 .. 1`.
- Bottom-up query on `[l, r)`: odd l take `t[l++]`, odd r take `t[--r]`, then shift both.
- Any associative merge works: min, max, gcd, OR mask, (min, count), max subarray sum as (sum, pref, suf, best).
- Medians and distinct counts are not mergeable from two halves.
- Recursive trees need `4n` memory; use `long long` for sums.
- For plain sums a Fenwick tree is simpler; reach for a segment tree when the node is richer.
:::
