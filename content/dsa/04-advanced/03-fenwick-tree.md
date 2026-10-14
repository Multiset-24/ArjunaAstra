---
title: Fenwick Tree
summary: A short, fast structure for prefix sums with updates, built on the lowest set bit of an index, also used for counting and range add.
minutes: 40
difficulty: advanced
rating: [1800, 2300]
tags: [fenwick-tree, bit, data-structures, range-queries]
prereqs: [prefix-sums, bit-manipulation]
problems:
  - lc: range-sum-query-mutable
    name: Range Sum Query - Mutable
    difficulty: Medium
  - cses: 1749
    name: List Removals
    note: find the k-th remaining element, then delete it
  - cf: 459D
    name: Pashmak and Parmida's problem
    rating: 1800
    core: true
    note: count pairs with prefix count greater than suffix count
  - cf: 61E
    name: Enemy is weak
    rating: 1900
    core: true
    note: for each middle element count smaller on the left, greater on the right
  - cf: 1354D
    name: Multiset
    rating: 1900
    core: true
    note: insert, delete the k-th smallest; descend the tree
  - lc: count-of-smaller-numbers-after-self
    name: Count of Smaller Numbers After Self
    difficulty: Hard
  - lc: reverse-pairs
    name: Reverse Pairs
    difficulty: Hard
    note: compress values and count with a tree
  - cf: 540E
    name: Infinite Inversions
    rating: 2100
    note: compress the touched positions, count the gaps between them
  - cf: 301D
    name: Yaroslav and Divisors
    rating: 2200
    note: offline queries sorted by right end
exercises:
  - Build the tree in O(n) with one pass, using the rule that a node passes its sum to `i + lowbit(i)`.
  - Count inversions of a permutation of 1..n and check the answer against an O(n^2) loop on small n.
---

## The problem

You have an array of n numbers. An operation either changes one element or asks for the sum of a prefix `a[1..i]`. You can already do this with a segment tree. A **Fenwick tree** (also called a binary indexed tree, BIT) does the same job in about ten lines and runs faster.

## Brute force first

| Approach | Update | Prefix query |
|---|---|---|
| Plain array | O(1) | O(n) |
| Stored prefix sums | O(n) | O(1) |
| Fenwick tree | O(log n) | O(log n) |

The array and the prefix array are the two extremes. The Fenwick tree stores sums over ranges whose lengths are powers of two, so each side needs only about log n pieces.

## The idea

The **lowbit** of `i` is its lowest set bit, written `i & -i`. For `i = 12` (binary 1100) it is 4 (binary 100). Node `bit[i]` stores the sum of the last `lowbit(i)` elements ending at `i`.

| i | lowbit | `bit[i]` covers |
|---|---|---|
| 1 | 1 | a[1] |
| 2 | 2 | a[1..2] |
| 3 | 1 | a[3] |
| 4 | 4 | a[1..4] |
| 5 | 1 | a[5] |
| 6 | 2 | a[5..6] |
| 7 | 1 | a[7] |
| 8 | 8 | a[1..8] |

```viz
algo: bits
input:
  a: 12
  b: 10
```

- **Prefix query:** to sum `a[1..7]`, read `bit[7]`, then jump to `7 - lowbit(7) = 6`, then to `6 - 2 = 4`, then to 0. The pieces are a[7], a[5..6] and a[1..4].
- **Update:** to change `a[3]`, fix every node whose range contains 3. Start at 3 and jump up with `i += lowbit(i)`: nodes 3, 4 and 8.

```predict
lang: cpp
code: |
  cout << (12 & -12) << " " << (7 & -7) << " " << (40 & -40);
output: 4 1 8
why: "The lowest set bit of 12 (1100) is 4, of 7 (111) is 1, and of 40 (101000) is 8."
```

```quiz
q: Which nodes does a prefix query for index 7 read?
options:
  - bit[7], bit[6], bit[4]
  - bit[7], bit[8]
  - bit[7], bit[6], bit[5]
  - bit[1] up to bit[7]
answer: 0
why: "The query repeatedly removes the lowest set bit: 7 -> 6 -> 4 -> 0. The ranges are a[7], a[5..6] and a[1..4], which cover 1..7 exactly once."
```

```blanks
prompt: Complete both loops of the Fenwick tree.
lang: cpp
code: |
  void add(int i, long long v) {   // a[i] += v
      for (; i <= n; i [[+= i & -i|+=i&-i]]) bit[i] += v;
  }
  long long prefix(int i) {        // a[1] + ... + a[i]
      long long s = 0;
      for (; i > 0; i [[-= i & -i|-=i&-i]]) s += bit[i];
      return s;
  }
why: Updating climbs to bigger ranges that contain the index, so it adds the lowbit. Querying peels off the lowest piece, so it subtracts the lowbit.
```

## Template

The program reads `n q`, the array, then q operations. `1 k u` sets `a[k] = u`, and `2 l r` prints `a[l] + ... + a[r]`, computed as `prefix(r) - prefix(l-1)`. A Fenwick tree adds a difference, so a "set" uses `u - a[k]`.

```cpp
#include <bits/stdc++.h>
using namespace std;

int n;
vector<long long> bit;  // 1-indexed; bit[i] covers the last lowbit(i) elements ending at i

void add(int i, long long v) {  // a[i] += v
    for (; i <= n; i += i & -i) bit[i] += v;
}

long long prefix(int i) {  // a[1] + ... + a[i]
    long long s = 0;
    for (; i > 0; i -= i & -i) s += bit[i];
    return s;
}

int main() {
    int q;
    scanf("%d %d", &n, &q);
    bit.assign(n + 1, 0);
    vector<long long> a(n + 1);
    for (int i = 1; i <= n; i++) {
        scanf("%lld", &a[i]);
        add(i, a[i]);
    }
    while (q--) {
        int type;
        scanf("%d", &type);
        if (type == 1) {  // set a[k] = u
            int k;
            long long u;
            scanf("%d %lld", &k, &u);
            add(k, u - a[k]);
            a[k] = u;
        } else {  // sum of a[l..r]
            int l, r;
            scanf("%d %d", &l, &r);
            printf("%lld\n", prefix(r) - prefix(l - 1));
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
    static long[] bit;

    static void add(int i, long v) {
        for (; i <= n; i += i & -i) bit[i] += v;
    }

    static long prefix(int i) {
        long s = 0;
        for (; i > 0; i -= i & -i) s += bit[i];
        return s;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        n = Integer.parseInt(st.nextToken());
        int q = Integer.parseInt(st.nextToken());
        bit = new long[n + 1];
        long[] a = new long[n + 1];
        st = new StringTokenizer(br.readLine());
        for (int i = 1; i <= n; i++) {
            a[i] = Long.parseLong(st.nextToken());
            add(i, a[i]);
        }
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) {
            st = new StringTokenizer(br.readLine());
            int type = Integer.parseInt(st.nextToken());
            if (type == 1) {
                int k = Integer.parseInt(st.nextToken());
                long u = Long.parseLong(st.nextToken());
                add(k, u - a[k]);
                a[k] = u;
            } else {
                int l = Integer.parseInt(st.nextToken());
                int r = Integer.parseInt(st.nextToken());
                sb.append(prefix(r) - prefix(l - 1)).append('\n');
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

For `[5, 8, 6, 3, 2, 7, 2, 6]`:

- `2 3 7` is `prefix(7) - prefix(2)`, which is `33 - 13 = 20`.
- `1 4 10` calls `add(4, 7)`, which touches nodes 4 and 8 only.
- Then `2 3 7` gives 27, and the whole array gives 46.

## Two other uses

**Range add, point query.** Keep the difference array `d`, where `a[i] = start[i] + d[1] + ... + d[i]`. Adding `v` to `a[l..r]` is `add(l, v)` and `add(r + 1, -v)`. The value of `a[i]` is `start[i] + prefix(i)`.

```cpp
#include <bits/stdc++.h>
using namespace std;

int n;
vector<long long> d;  // Fenwick tree over the difference array

void add(int i, long long v) {
    for (; i <= n; i += i & -i) d[i] += v;
}

long long prefix(int i) {
    long long s = 0;
    for (; i > 0; i -= i & -i) s += d[i];
    return s;
}

int main() {
    int q;
    scanf("%d %d", &n, &q);
    d.assign(n + 2, 0);
    vector<long long> a(n + 1);
    for (int i = 1; i <= n; i++) scanf("%lld", &a[i]);
    while (q--) {
        int type;
        scanf("%d", &type);
        if (type == 1) {  // add v to a[l..r]
            int l, r;
            long long v;
            scanf("%d %d %lld", &l, &r, &v);
            add(l, v);
            add(r + 1, -v);
        } else {  // value of a[i]
            int i;
            scanf("%d", &i);
            printf("%lld\n", a[i] + prefix(i));
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
    static long[] d;

    static void add(int i, long v) {
        for (; i <= n; i += i & -i) d[i] += v;
    }

    static long prefix(int i) {
        long s = 0;
        for (; i > 0; i -= i & -i) s += d[i];
        return s;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        n = Integer.parseInt(st.nextToken());
        int q = Integer.parseInt(st.nextToken());
        d = new long[n + 2];
        long[] a = new long[n + 1];
        st = new StringTokenizer(br.readLine());
        for (int i = 1; i <= n; i++) a[i] = Long.parseLong(st.nextToken());
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) {
            st = new StringTokenizer(br.readLine());
            int type = Integer.parseInt(st.nextToken());
            if (type == 1) {
                int l = Integer.parseInt(st.nextToken());
                int r = Integer.parseInt(st.nextToken());
                long v = Long.parseLong(st.nextToken());
                add(l, v);
                add(r + 1, -v);
            } else {
                int i = Integer.parseInt(st.nextToken());
                sb.append(a[i] + prefix(i)).append('\n');
            }
        }
        System.out.print(sb);
    }
}
```
```input
5 6
3 1 4 1 5
2 3
1 2 4 10
2 3
2 5
1 1 5 -2
2 1
```
```output
4
14
5
1
```

```quiz
q: In the difference-array tree, you add v to a[3..5]. Which two calls do you make?
options:
  - add(3, v) and add(5, -v)
  - add(3, v) and add(6, -v)
  - add(3, v) and add(4, -v)
  - add(2, v) and add(5, -v)
answer: 1
why: "The change must stop after position 5, so the cancelling -v goes at 6. Prefix sums of d then give +v at 3, 4, 5 and 0 at 6 onwards."
```

**Counting.** Let `bit` hold counts: `add(x, 1)` records value `x`, and `prefix(x)` is how many recorded values are at most `x`. After compressing values to `1..m`, this counts inversions, and the same loop answers "how many smaller values came before me".

```cpp
long long inv = 0;
for (int i = 0; i < n; i++) {
    inv += i - prefix(a[i]);  // earlier elements strictly greater than a[i]
    add(a[i], 1);
}
```
```java
long inv = 0;
for (int i = 0; i < n; i++) {
    inv += i - prefix(a[i]);  // earlier elements strictly greater than a[i]
    add(a[i], 1);
}
```

The counting tree also finds the k-th smallest recorded value by descending powers of two, with no binary search on top:

```cpp
int kth(int k) {  // smallest index whose prefix count is >= k
    int pos = 0;
    for (int pw = 1 << (31 - __builtin_clz(n)); pw; pw >>= 1)
        if (pos + pw <= n && bit[pos + pw] < k) { pos += pw; k -= bit[pos]; }
    return pos + 1;
}
```
```java
static int kth(int k) {
    int pos = 0;
    for (int pw = Integer.highestOneBit(n); pw > 0; pw >>= 1)
        if (pos + pw <= n && bit[pos + pw] < k) { pos += pw; k -= bit[pos]; }
    return pos + 1;
}
```

```estimate
q: Counting inversions of an array of 200,000 numbers does one update and one prefix query per element. About how many loop steps is that in total?
answer: 7000000
unit: steps
tolerance: order
hint: Each operation takes about log2(200000), roughly 18, steps. There are two operations per element.
solution: "200,000 x 2 x 18 is about 7 million steps, so it finishes in well under a second. The O(n^2) loop would need 2 x 10^10 steps."
```

:::details[Range add and range sum with two trees]
With a difference array `d`, the sum of the first `x` elements after updates is `(x + 1) * sum(d[1..x]) - sum(j * d[j] for j <= x)`. Keep one tree over `d[j]` and one over `j * d[j]`. A range add does two updates on each tree.
:::

## Complexity

- Update and prefix query are O(log n). Memory is n, with a tiny constant.
- Build by n updates is O(n log n). The one-pass build is O(n).

## Pitfalls

- Index 0 loops forever in `add`, because `0 & -0` is 0. Use 1-based indices.
- Calling `add(r + 1, -v)` with `r = n` is safe, because the loop condition `i <= n` skips it. Do not add that guard by hand.
- Using it for min or max. It only works with operations that can be undone, such as sum, xor and counts.
- Forgetting to compress large values before using them as indices.

:::truth
The Fenwick tree is not smarter than a segment tree. It is shorter and faster for sums and counts. When the problem needs min, max or a rich node, the segment tree is the right tool, so know both.
:::

```cards
- q: What is lowbit(i) and how do you compute it?
  a: The lowest set bit of i, computed as `i & -i`. For i = 12 it is 4.
- q: What does bit[i] store?
  a: The sum of the last lowbit(i) elements ending at i, that is a[i - lowbit(i) + 1 .. i].
- q: What are the two loops of a Fenwick tree?
  a: "Update: `for (; i <= n; i += i & -i)`. Prefix query: `for (; i > 0; i -= i & -i)`."
- q: How do you do range add and point query?
  a: Keep a Fenwick tree over differences. Add v at l and -v at r+1; the point value is the prefix sum at i.
- q: Which operations does a Fenwick tree support?
  a: Those that can be undone, such as sum, xor and counts. Not arbitrary range min or max.
```

## Notes

:::notes
- Fenwick tree (BIT): `bit[i]` stores the sum of `a[i - lowbit(i) + 1 .. i]`, where `lowbit(i) = i & -i`.
- Update: `for (; i <= n; i += i & -i) bit[i] += v`. Prefix: `for (; i > 0; i -= i & -i) s += bit[i]`.
- Range sum is `prefix(r) - prefix(l - 1)`. A "set" is an add of the difference.
- Range add and point query: tree over the difference array, add at l and -v at r+1.
- Counting: record each value with `add(x, 1)`; inversions are `i - prefix(a[i])` per element after compression.
- K-th smallest: descend from the highest power of two while the prefix count is below k.
- 1-based indices only; the operation must be invertible (sum, xor, count).
- Use a segment tree when you need min, max or a richer node.
:::
