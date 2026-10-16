---
title: Lazy Propagation
summary: Add to or assign a whole range in O(log n) by leaving a pending note on a segment tree node and pushing it down only when needed.
minutes: 45
difficulty: advanced
rating: [1800, 2400]
tags: [segment-tree, lazy-propagation, range-update]
prereqs: [segment-tree]
problems:
  - cses: 1651
    name: Range Update Queries
    note: range add, point query
  - cf: 292E
    name: Copying Data
    rating: 1900
    core: true
    note: range assign, point query; the latest copy wins
  - cf: 242E
    name: XOR on Segment
    rating: 2000
    core: true
    note: one tree per bit, lazy flip
  - cses: 1735
    name: Range Updates and Sums
    note: add and assign tags together
  - lc: my-calendar-iii
    name: My Calendar III
    difficulty: Hard
    note: range add, global maximum
  - cf: 52C
    name: Circular RMQ
    rating: 2200
    core: true
    note: range add, range min, wrapped ranges
  - lc: falling-squares
    name: Falling Squares
    difficulty: Hard
    note: range chmax-assign, range max
  - cf: 145E
    name: Lucky Queries
    rating: 2400
    note: node keeps counts of 4 and 7; lazy flip and swap
exercises:
  - Change the program so a node keeps the minimum instead of the sum, with range add. What changes in apply?
  - Support both "add v" and "assign v" on the same tree. Write down how each tag combines with a pending one.
---

## The problem

You have an array of n numbers. Each query is either "add v to every element of `a[l..r]`" or "print the sum of `a[l..r]`". The plain segment tree handles one changed element in O(log n). Here one query changes up to n elements.

## Brute force first

- Looping over `l..r` for each update costs O(n). With n = q = 2e5, that is about 4e10 steps.
- Pushing the update into the tree leaf by leaf has the same cost.
- The way out: do not touch the leaves at all while nobody looks at them.

## The idea

A **lazy tag** is a note stored on a node: "every element below me still has to receive +v". The tree uses two rules:

- If a node's segment is fully inside the update range, fix the node's own sum, store the tag, and stop.
- If you must go below a node that has a tag, first **push down**: hand the tag to both children, then clear it.

The invariant to remember: a node's own sum is always correct. Its children are correct except for the tags waiting on the node above them.

```steps
title: Array [1, 2, 3, 4] as a tree, shown as the heap array of node sums
view: array
frames:
  - arr: [10, 3, 7, 1, 2, 3, 4]
    pointers: {root: 0}
    note: Cells are nodes 1 to 7. Node 1 is the root [1..4], node 2 is [1..2], node 3 is [3..4], nodes 4 to 7 are the leaves.
  - arr: [10, 13, 7, 1, 2, 3, 4]
    highlight: {1: active}
    vars: {tag2: 5}
    note: Update add 5 on [1..2]. Node 2 is fully inside. Its sum becomes 3 + 5 * 2 = 13, the tag is stored, and we stop. The leaves are stale.
  - arr: [20, 13, 7, 1, 2, 3, 4]
    highlight: {0: done}
    vars: {tag2: 5}
    note: On the way back, the root recomputes itself from its children, 13 + 7 = 20.
  - arr: [20, 13, 7, 1, 2, 3, 4]
    highlight: {1: compare}
    vars: {tag2: 5}
    note: Query sum on [2..2]. The root is partial, so go down to node 2. It is partial too, and it has a tag, so push it down first.
  - arr: [20, 13, 7, 6, 7, 3, 4]
    highlight: {3: active, 4: active}
    vars: {tag2: 0}
    note: After the push the leaves are fixed, 1 + 5 = 6 and 2 + 5 = 7, and node 2 has no tag left.
  - arr: [20, 13, 7, 6, 7, 3, 4]
    highlight: {4: match}
    note: Node 5 is exactly [2..2]. The answer is 7, which is a[2] = 2 plus 5.
```

```predict
lang: cpp
code: |
  // a node covers 4 elements and has sum 20, no tag
  long long sum = 20, tag = 0;
  int len = 4;
  for (long long v : {3, 2}) {
      sum += v * len;
      tag += v;
  }
  cout << sum << " " << tag;
output: 40 5
why: Each add changes the sum by v * len, so 20 + 12 + 8 = 40. Two adds on the same node merge into one tag, 3 + 2 = 5.
```

## Template

The program reads `n q`, the array, then q queries. `1 l r v` adds v to `a[l..r]`, and `2 l r` prints the sum. Indices are 1-based. The functions `apply_add` and `push` are the only new parts compared with the plain tree.

```cpp
#include <bits/stdc++.h>
using namespace std;

const int MAXN = 200005;
long long sum_[4 * MAXN], lz[4 * MAXN];
int a[MAXN];

void apply_add(int node, int len, long long v) {  // add v to every element of the node's segment
    sum_[node] += v * len;
    lz[node] += v;
}

void push(int node, int l, int r) {  // hand the pending tag down to both children
    if (lz[node] == 0) return;
    int m = (l + r) / 2;
    apply_add(2 * node, m - l + 1, lz[node]);
    apply_add(2 * node + 1, r - m, lz[node]);
    lz[node] = 0;
}

void build(int node, int l, int r) {
    if (l == r) { sum_[node] = a[l]; return; }
    int m = (l + r) / 2;
    build(2 * node, l, m);
    build(2 * node + 1, m + 1, r);
    sum_[node] = sum_[2 * node] + sum_[2 * node + 1];
}

void update(int node, int l, int r, int ql, int qr, long long v) {
    if (qr < l || r < ql) return;
    if (ql <= l && r <= qr) { apply_add(node, r - l + 1, v); return; }
    push(node, l, r);
    int m = (l + r) / 2;
    update(2 * node, l, m, ql, qr, v);
    update(2 * node + 1, m + 1, r, ql, qr, v);
    sum_[node] = sum_[2 * node] + sum_[2 * node + 1];
}

long long query(int node, int l, int r, int ql, int qr) {
    if (qr < l || r < ql) return 0;
    if (ql <= l && r <= qr) return sum_[node];
    push(node, l, r);
    int m = (l + r) / 2;
    return query(2 * node, l, m, ql, qr) + query(2 * node + 1, m + 1, r, ql, qr);
}

int main() {
    int n, q;
    scanf("%d %d", &n, &q);
    for (int i = 1; i <= n; i++) scanf("%d", &a[i]);
    build(1, 1, n);
    while (q--) {
        int type, l, r;
        scanf("%d %d %d", &type, &l, &r);
        if (type == 1) {
            long long v;
            scanf("%lld", &v);
            update(1, 1, n, l, r, v);
        } else {
            printf("%lld\n", query(1, 1, n, l, r));
        }
    }
    return 0;
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static long[] sum, lz;
    static int[] a;

    static void applyAdd(int node, int len, long v) {
        sum[node] += v * len;
        lz[node] += v;
    }

    static void push(int node, int l, int r) {
        if (lz[node] == 0) return;
        int m = (l + r) / 2;
        applyAdd(2 * node, m - l + 1, lz[node]);
        applyAdd(2 * node + 1, r - m, lz[node]);
        lz[node] = 0;
    }

    static void build(int node, int l, int r) {
        if (l == r) { sum[node] = a[l]; return; }
        int m = (l + r) / 2;
        build(2 * node, l, m);
        build(2 * node + 1, m + 1, r);
        sum[node] = sum[2 * node] + sum[2 * node + 1];
    }

    static void update(int node, int l, int r, int ql, int qr, long v) {
        if (qr < l || r < ql) return;
        if (ql <= l && r <= qr) { applyAdd(node, r - l + 1, v); return; }
        push(node, l, r);
        int m = (l + r) / 2;
        update(2 * node, l, m, ql, qr, v);
        update(2 * node + 1, m + 1, r, ql, qr, v);
        sum[node] = sum[2 * node] + sum[2 * node + 1];
    }

    static long query(int node, int l, int r, int ql, int qr) {
        if (qr < l || r < ql) return 0;
        if (ql <= l && r <= qr) return sum[node];
        push(node, l, r);
        int m = (l + r) / 2;
        return query(2 * node, l, m, ql, qr) + query(2 * node + 1, m + 1, r, ql, qr);
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int n = Integer.parseInt(st.nextToken());
        int q = Integer.parseInt(st.nextToken());
        a = new int[n + 1];
        sum = new long[4 * n + 4];
        lz = new long[4 * n + 4];
        st = new StringTokenizer(br.readLine());
        for (int i = 1; i <= n; i++) a[i] = Integer.parseInt(st.nextToken());
        build(1, 1, n);
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) {
            st = new StringTokenizer(br.readLine());
            int type = Integer.parseInt(st.nextToken());
            int l = Integer.parseInt(st.nextToken());
            int r = Integer.parseInt(st.nextToken());
            if (type == 1) {
                long v = Long.parseLong(st.nextToken());
                update(1, 1, n, l, r, v);
            } else {
                sb.append(query(1, 1, n, l, r)).append('\n');
            }
        }
        System.out.print(sb);
    }
}
```
```input
6 6
1 2 3 4 5 6
2 1 6
1 2 4 10
2 1 3
2 4 6
1 1 6 -1
2 1 6
```
```output
21
26
25
45
```

```order
prompt: Arrange the range-add update.
lang: cpp
code: |
  void update(int node, int l, int r, int ql, int qr, long long v) {
      if (qr < l || r < ql) return;
      if (ql <= l && r <= qr) { apply_add(node, r - l + 1, v); return; }
      push(node, l, r);
      int m = (l + r) / 2;
      update(2 * node, l, m, ql, qr, v);
      update(2 * node + 1, m + 1, r, ql, qr, v);
      sum_[node] = sum_[2 * node] + sum_[2 * node + 1];
  }
distractors:
  - "    if (ql <= l && r <= qr) { sum_[node] += v; return; }"
  - "    sum_[node] = sum_[2 * node] + sum_[2 * node + 1] + v;"
why: The covered case must use the segment length and record a tag. The partial case pushes first, recurses, and rebuilds the sum from the children.
```

## Walkthrough

For `[1, 2, 3, 4, 5, 6]` the sample asks:

- `2 1 6` gives 21.
- After `1 2 4 10` the array is `[1, 12, 13, 14, 5, 6]`, so sum `1..3` is 26 and sum `4..6` is 25.
- After `1 1 6 -1` the whole array shifts by one, so the total goes from 51 to 45.

The last update stops at the root. It stores a tag there and nothing else is visited.

## Other tags

The tree is the same. Only `apply`, `push` and how tags combine change.

| Tag | `apply(node, len, v)` | When a second tag arrives |
|---|---|---|
| Add | `sum += v * len; tag += v` | tags simply add up |
| Assign | `sum = v * len; tag = v; has = true` | the new assign replaces the old one |
| Add after assign | `sum += v * len` | add v to the stored assign value |

```cpp
void apply_set(int node, int len, long long v) {
    sum_[node] = v * len;
    tag[node] = v;
    has[node] = true;  // a new assign overwrites whatever was pending
}
void push(int node, int l, int r) {
    if (!has[node]) return;
    int m = (l + r) / 2;
    apply_set(2 * node, m - l + 1, tag[node]);
    apply_set(2 * node + 1, r - m, tag[node]);
    has[node] = false;
}
```
```java
static void applySet(int node, int len, long v) {
    sum[node] = v * len;
    tag[node] = v;
    has[node] = true;
}
static void push(int node, int l, int r) {
    if (!has[node]) return;
    int m = (l + r) / 2;
    applySet(2 * node, m - l + 1, tag[node]);
    applySet(2 * node + 1, r - m, tag[node]);
    has[node] = false;
}
```

```quiz
q: A node has a pending "assign 7" tag. Now "add 3" covers the whole node. What should the node hold afterwards, if it keeps a single tag?
options:
  - "assign 7 and add 3, kept as two unrelated tags"
  - "assign 10"
  - "add 3 only, because the newest tag wins"
  - "assign 7, because assign always wins"
answer: 1
why: Everything below the node will become 7 first, then gain 3. That equals assigning 10. For both operations at once on the same tree, keep an assign flag plus an add value, or fold the add into the assign value as here.
```

:::details[Why the invariant is enough]
Take any node. Its own sum already includes every update that fully covered it or one of its ancestors and stopped there, but only if the tags above it were pushed. A query or update goes down a path. Before it enters a child, it pushes the tag of the parent, so the child sees every earlier update. The siblings it does not enter keep stale values, and nobody reads them without pushing first.
:::

## Complexity

- Build O(n). Update and query are O(log n); each visits at most about 4 nodes per level.
- Memory is two arrays of size 4n, the sums and the tags.

## Pitfalls

- Reading a child without calling `push` first. This gives wrong answers only on some tests, which is why it survives small samples.
- Forgetting to recompute `sum_[node]` from the children after a partial update.
- Using a value like `0` or `-1` as "no assign". A real assign of that value breaks it. Use a boolean.
- Writing `sum += v` instead of `sum += v * len`.
- Mixing assign and add without defining how they combine (see the table).

:::truth
Lazy propagation is where many 2000-rated data structure solutions break. A brute-force checker on 10 to 20 random tiny arrays, with many mixed operations, finds the bug in minutes. Reading the code again usually does not.
:::

```cards
- q: What is a lazy tag?
  a: A pending note on a node saying "everything below me still needs this update". It is applied to the children only when the search must go below that node.
- q: What are the two cases in a lazy range update?
  a: Fully covered, so apply to the node and stop. Partial overlap, so push down, recurse into both children, and recompute the node from them.
- q: How does a range-add tag change the sum of a node?
  a: "`sum += v * len`, where len is the number of elements in the node's segment."
- q: Why use a boolean for the assign tag?
  a: Any number can be a valid assigned value, so no sentinel value is safe.
- q: Cost of lazy range update and range query?
  a: Both $O(\log n)$.
```

## Notes

:::notes
- Lazy tag = a pending update stored on a node instead of on every leaf below it.
- Fully covered: update the node's sum, add the tag, return. Partial: push down, recurse, rebuild from the children.
- A node's own sum is always correct; its children may be stale by the tag above them.
- Always push before reading or recursing into a child, in updates and in queries.
- Add tag: `sum += v * len`, tags add. Assign tag: `sum = v * len`, the new tag replaces the old one, use a boolean flag.
- Add after assign folds into the assign value.
- Both operations are O(log n); memory is 4n for sums and 4n for tags.
- Stress test against a brute force; lazy bugs hide from small samples.
:::
