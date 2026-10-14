---
title: Sqrt Decomposition and Mo's Algorithm
summary: Split the array into blocks of about sqrt(n) to balance update and query costs, and reorder offline range queries so two moving pointers do little work in total.
minutes: 45
difficulty: advanced
rating: [1800, 2400]
tags: [sqrt-decomposition, mo-algorithm, offline, data-structures]
prereqs: [prefix-sums, sorting-and-searching, complexity]
problems:
  - lc: range-sum-query-mutable
    name: Range Sum Query - Mutable
    difficulty: Medium
    note: try blocks first, then a Fenwick tree
  - cses: 1648
    name: Dynamic Range Sum Queries
  - cses: 1734
    name: Distinct Values Queries
    core: true
    note: the textbook Mo's problem
  - cf: 220B
    name: Little Elephant and Array
    rating: 1800
    core: true
    note: count values x that appear exactly x times in a range
  - cf: 617E
    name: XOR and Favorite Number
    rating: 2200
    core: true
    note: Mo with prefix XORs
  - cf: 86D
    name: Powerful array
    rating: 2200
    note: maintain a sum of cnt^2 * value
  - cf: 877F
    name: Ann and Books
    rating: 2300
  - cf: 375D
    name: Tree and Queries
    rating: 2400
    note: Mo on the Euler tour order
  - cf: 1000F
    name: One Occurrence
    rating: 2400
    note: solvable with Mo, intended with sweep and segment tree
---

## The problem

You have an array of $n$ numbers and $q$ queries. Two shapes appear again and again.

- **Online with updates.** "Change one element" and "sum of $a[l..r]$", mixed in any order.
- **Offline, no updates.** "How many distinct values are in $a[l..r]$?" You may read all queries first.

## Brute force first

- Answer each query by scanning the range: $O(n)$ per query, $O(nq)$ total.
- For $n = q = 10^5$ that is $10^{10}$ steps. Too slow by a factor of 100.
- Prefix sums fix the pure-sum case without updates, but not updates, and not distinct counts.

## The idea 1: blocks

Cut the array into blocks of size $B$ and store a summary of each block (here, its sum).

- A query $[l, r]$ is a few elements at the left end, some whole blocks in the middle, and a few elements at the right end.
- Partial pieces cost at most $2B$ elements. Whole blocks cost at most $n/B$ summaries.
- Choose $B \approx \sqrt{n}$ so both are $O(\sqrt{n})$.
- A point update changes one element and its block summary: $O(1)$.

```predict
lang: cpp
code: |
  int n = 10, B = (int)sqrt((double)n);
  cout << B << " " << 7 / B << " " << (n + B - 1) / B;
output: 3 2 4
why: B is the integer part of sqrt(10), which is 3. Index 7 is in block 7 / 3 = 2 (blocks 0..2, 3..5, 6..8). The number of blocks is the ceiling of 10 / 3, which is 4.
```

```cpp
#include <bits/stdc++.h>
using namespace std;

int n, q, B;
vector<long long> a, blk;

long long query(int l, int r) {                   // inclusive, 0-indexed
    long long s = 0;
    int bl = l / B, br = r / B;
    if (bl == br) {
        for (int i = l; i <= r; i++) s += a[i];
        return s;
    }
    for (int i = l; i < (bl + 1) * B; i++) s += a[i];       // left partial block
    for (int b = bl + 1; b < br; b++) s += blk[b];          // whole blocks
    for (int i = br * B; i <= r; i++) s += a[i];            // right partial block
    return s;
}

int main() {
    scanf("%d %d", &n, &q);
    B = max(1, (int)sqrt((double)n));
    a.assign(n, 0);
    blk.assign((n + B - 1) / B, 0);
    for (int i = 0; i < n; i++) {
        scanf("%lld", &a[i]);
        blk[i / B] += a[i];
    }
    while (q--) {
        int t;
        scanf("%d", &t);
        if (t == 1) {                              // 1 i v: add v to a[i]
            int i; long long v;
            scanf("%d %lld", &i, &v);
            i--;
            a[i] += v;
            blk[i / B] += v;
        } else {                                   // 2 l r: print the sum
            int l, r;
            scanf("%d %d", &l, &r);
            printf("%lld\n", query(l - 1, r - 1));
        }
    }
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static int n, q, B;
    static long[] a, blk;

    static long query(int l, int r) {
        long s = 0;
        int bl = l / B, br = r / B;
        if (bl == br) {
            for (int i = l; i <= r; i++) s += a[i];
            return s;
        }
        for (int i = l; i < (bl + 1) * B; i++) s += a[i];
        for (int b = bl + 1; b < br; b++) s += blk[b];
        for (int i = br * B; i <= r; i++) s += a[i];
        return s;
    }

    public static void main(String[] args) throws IOException {
        StreamTokenizer in = new StreamTokenizer(new BufferedInputStream(System.in));
        in.nextToken(); n = (int) in.nval;
        in.nextToken(); q = (int) in.nval;
        B = Math.max(1, (int) Math.sqrt(n));
        a = new long[n];
        blk = new long[(n + B - 1) / B];
        for (int i = 0; i < n; i++) {
            in.nextToken();
            a[i] = (long) in.nval;
            blk[i / B] += a[i];
        }
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) {
            in.nextToken();
            int t = (int) in.nval;
            if (t == 1) {
                in.nextToken(); int i = (int) in.nval - 1;
                in.nextToken(); long v = (long) in.nval;
                a[i] += v;
                blk[i / B] += v;
            } else {
                in.nextToken(); int l = (int) in.nval - 1;
                in.nextToken(); int r = (int) in.nval - 1;
                sb.append(query(l, r)).append('\n');
            }
        }
        System.out.print(sb);
    }
}
```
```input
10 4
1 2 3 4 5 6 7 8 9 10
2 1 10
1 5 100
2 3 7
2 8 10
```
```output
55
125
27
```

:::truth
For sums, a Fenwick tree or segment tree does the same job in $O(\log n)$ and is not harder to write. Blocks are worth knowing for the cases where the block summary can be almost anything: a sorted copy of the block, a count table, a lazy tag. Those problems have no neat tree solution but fit in blocks easily.
:::

## The idea 2: Mo's algorithm

For offline queries on **ranges**, keep a current window $[curL, curR]$ together with its answer, and move the ends one step at a time. Adding or removing one element must update the answer in $O(1)$. For distinct counting, keep `cnt[v]` and the number of values with `cnt > 0`.

The only freedom is the **order** of the queries, and a good order makes total pointer movement small:

- Split positions into blocks of size $B \approx \sqrt{n}$ and sort queries by (block of $l$, then $r$).
- Within one block of $l$, the pointer $curL$ stays inside the block, so it moves at most $B$ per query: $O(qB)$ in total.
- Within one block of $l$, $r$ only increases, so $curR$ moves at most $n$ per block: $O(n \cdot n/B)$ in total.
- With $B = \sqrt{n}$ the total is $O((n + q)\sqrt{n})$.

Optimisation: in odd blocks sort $r$ **descending**, so the pointer sweeps back and forth and does not jump back at each block boundary.

```steps
title: Mo window on [1,2,1,3,2,1,3,3,2], from query [0,2] to query [2,6]
view: array
frames:
  - arr: [1, 2, 1, 3, 2, 1, 3, 3, 2]
    window: [0, 2]
    vars: {distinct: 2}
    note: Window [0, 2] holds 1, 2, 1. Two distinct values.
  - arr: [1, 2, 1, 3, 2, 1, 3, 3, 2]
    window: [0, 3]
    vars: {distinct: 3}
    pointers: {R: 3}
    note: Next query is [2, 6]. Expand R first. Add a[3] = 3, a new value, so distinct becomes 3.
  - arr: [1, 2, 1, 3, 2, 1, 3, 3, 2]
    window: [0, 4]
    vars: {distinct: 3}
    pointers: {R: 4}
    note: Add a[4] = 2. Already counted, distinct stays 3.
  - arr: [1, 2, 1, 3, 2, 1, 3, 3, 2]
    window: [0, 6]
    vars: {distinct: 3}
    pointers: {R: 6}
    note: Add a[5] = 1 and a[6] = 3. Nothing new.
  - arr: [1, 2, 1, 3, 2, 1, 3, 3, 2]
    window: [1, 6]
    vars: {distinct: 3}
    pointers: {L: 1}
    note: Now shrink L. Remove a[0] = 1. Value 1 still appears at positions 2 and 5.
  - arr: [1, 2, 1, 3, 2, 1, 3, 3, 2]
    window: [2, 6]
    vars: {distinct: 3}
    pointers: {L: 2}
    note: Remove a[1] = 2. Value 2 still appears at position 4. Window [2, 6] has 3 distinct values. Total work was 6 single steps, not 5 + the range length.
```

```quiz
q: In Mo's loop, why do the "expand" while-loops (curL > l, curR < r) come before the "shrink" loops?
options:
  - Expanding is faster than shrinking
  - It prevents the window from briefly having a negative size, which would make counts go below zero
  - It keeps the queries sorted
answer: 1
why: If you shrink first, curL can pass curR, and you would remove elements that were never added, driving cnt negative. Expanding first guarantees every element removed was added earlier.
```

```cpp
#include <bits/stdc++.h>
using namespace std;

const int MAXV = 100001;                 // values are at most 100000
int a[100005], cnt[MAXV], distinctNow = 0;

void addAt(int i)    { if (cnt[a[i]]++ == 0) distinctNow++; }
void removeAt(int i) { if (--cnt[a[i]] == 0) distinctNow--; }

int main() {
    int n, q;
    scanf("%d %d", &n, &q);
    for (int i = 0; i < n; i++) scanf("%d", &a[i]);
    int B = max(1, (int)sqrt((double)n));
    vector<array<int, 3>> qs(q);                      // {l, r, original index}
    for (int i = 0; i < q; i++) {
        scanf("%d %d", &qs[i][0], &qs[i][1]);
        qs[i][0]--; qs[i][1]--; qs[i][2] = i;
    }
    sort(qs.begin(), qs.end(), [&](const array<int, 3>& x, const array<int, 3>& y) {
        int bx = x[0] / B, by = y[0] / B;
        if (bx != by) return bx < by;
        return (bx & 1) ? x[1] > y[1] : x[1] < y[1];  // odd blocks go right to left
    });
    vector<int> ans(q);
    int curL = 0, curR = -1;
    for (auto& [l, r, id] : qs) {
        while (curL > l) addAt(--curL);
        while (curR < r) addAt(++curR);
        while (curL < l) removeAt(curL++);
        while (curR > r) removeAt(curR--);
        ans[id] = distinctNow;
    }
    for (int i = 0; i < q; i++) printf("%d\n", ans[i]);
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static int[] a, cnt;
    static int distinctNow = 0;

    static void addAt(int i)    { if (cnt[a[i]]++ == 0) distinctNow++; }
    static void removeAt(int i) { if (--cnt[a[i]] == 0) distinctNow--; }

    public static void main(String[] args) throws IOException {
        StreamTokenizer in = new StreamTokenizer(new BufferedInputStream(System.in));
        in.nextToken(); int n = (int) in.nval;
        in.nextToken(); int q = (int) in.nval;
        a = new int[n];
        cnt = new int[100001];
        for (int i = 0; i < n; i++) { in.nextToken(); a[i] = (int) in.nval; }
        final int B = Math.max(1, (int) Math.sqrt(n));
        final int[] L = new int[q], R = new int[q];
        Integer[] ord = new Integer[q];
        for (int i = 0; i < q; i++) {
            in.nextToken(); L[i] = (int) in.nval - 1;
            in.nextToken(); R[i] = (int) in.nval - 1;
            ord[i] = i;
        }
        Arrays.sort(ord, (x, y) -> {
            int bx = L[x] / B, by = L[y] / B;
            if (bx != by) return Integer.compare(bx, by);
            return (bx & 1) == 1 ? Integer.compare(R[y], R[x]) : Integer.compare(R[x], R[y]);
        });
        int[] ans = new int[q];
        int curL = 0, curR = -1;
        for (int id : ord) {
            int l = L[id], r = R[id];
            while (curL > l) addAt(--curL);
            while (curR < r) addAt(++curR);
            while (curL < l) removeAt(curL++);
            while (curR > r) removeAt(curR--);
            ans[id] = distinctNow;
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < q; i++) sb.append(ans[i]).append('\n');
        System.out.print(sb);
    }
}
```
```input
9 5
1 2 1 3 2 1 3 3 2
1 3
3 7
1 9
6 6
4 8
```
```output
2
3
3
1
3
```

```blanks
prompt: Complete the two O(1) updates for counting distinct values (Java).
lang: java
code: |
  static void addAt(int i)    { if (cnt[a[i]]++ == [[0]]) distinctNow++; }
  static void removeAt(int i) { if (--cnt[a[i]] == [[0]]) distinctNow--; }
why: A value becomes new when its count goes from 0 to 1, and disappears when its count goes from 1 to 0. Post-increment compares the old count, pre-decrement compares the new count; both test against 0.
```

## Complexity

| Method | Time | Needs |
|---|---|---|
| Blocks (sums, point update) | $O(\sqrt{n})$ per query, $O(1)$ per update | a block summary that can be updated |
| Mo's algorithm | $O((n + q)\sqrt{n})$ total | offline queries, no updates, $O(1)$ add and remove |
| Mo with updates | about $O(n^{5/3})$ | offline, sort by (block of $l$, block of $r$, time) |

```estimate
q: Mo's algorithm with n = 10^5 and q = 10^5. Roughly how many single add/remove steps happen in total?
answer: 63000000
unit: steps
tolerance: order
hint: With B = sqrt(n), about 316, the left pointer moves up to B per query and the right pointer up to n per block.
solution: "Left pointer: q * B = 10^5 * 316 = 3.2 * 10^7. Right pointer: n * (n / B) = 10^5 * 316 = 3.2 * 10^7. Total about 6.3 * 10^7, which runs in well under a second when add and remove are O(1)."
```

## Pitfalls

- **Sort comparator.** Without the odd-even trick Mo is still correct, just slower by a constant. A broken comparator (inconsistent ordering) can crash the sort in C++.
- **Remove must undo add exactly.** If add and remove are not exact inverses, the answer drifts. Test on tiny arrays against brute force.
- **Values up to $10^9$.** `cnt` indexed by value needs coordinate compression: sort the values and replace each by its rank.
- **Answer overflow.** Sums like $\sum cnt^2 \cdot value$ need `long long`.
- **Reordering loses input order.** Store the original index and write answers back at that index.
- **Block size.** $B = \sqrt{n}$ is a good default. For heavy `add` and cheap `query`, or the reverse, tune $B$ to balance the two costs.

```order
prompt: Arrange the four pointer-moving loops of Mo's algorithm so the window never becomes invalid.
lang: cpp
code: |
  while (curL > l) addAt(--curL);
  while (curR < r) addAt(++curR);
  while (curL < l) removeAt(curL++);
  while (curR > r) removeAt(curR--);
distractors:
  - "  while (curL < l) addAt(curL++);"
why: First grow the window to cover [l, r] by adding on both sides, then shrink by removing. Using addAt while moving curL right would count elements that are leaving the window.
```

## Notes

:::notes
- Sqrt decomposition: blocks of size B about sqrt(n), each with a summary. A range query is two partial blocks (up to 2B elements) plus up to n/B whole blocks.
- Point update with a sum summary is O(1); query is O(sqrt n). A Fenwick tree does the same in O(log n).
- Blocks shine when the block summary is richer than a sum (sorted copy, count table, lazy tag).
- Mo's algorithm: offline range queries. Sort by (l / B, r) and move a window [curL, curR] one step at a time. Total O((n + q) sqrt n).
- Needs O(1) add and remove that are exact inverses. No updates (Mo with updates is O(n^(5/3))).
- Order of moves: grow first (curL down, curR up), then shrink.
- Odd-even trick: reverse the r order in odd blocks for a speed-up.
- Compress values to 0..n-1 before using a count array. Keep the original query index to print answers in order.
- Use long long when the maintained answer is a sum of products.
:::

```cards
- q: What block size balances partial blocks and whole blocks?
  a: About sqrt(n). Partial blocks cost up to 2B elements, whole blocks cost up to n/B summaries.
- q: What does Mo's algorithm require?
  a: Offline range queries, no updates, and add/remove of one element in O(1) that update the answer exactly.
- q: How does Mo's algorithm order the queries?
  a: By block of l (size about sqrt n), then by r ascending (descending in odd blocks).
- q: Total time of Mo's algorithm?
  a: O((n + q) sqrt n): the left pointer moves O(sqrt n) per query, the right pointer O(n) per block.
- q: Why expand the window before shrinking it?
  a: Shrinking first can remove elements that were never added and push counts below zero.
- q: When is sqrt decomposition a better choice than a segment tree?
  a: When the block summary is awkward to merge in a tree, such as a sorted block, a count table or a lazy rebuild.
```
