---
title: Euler Tour on Trees
summary: Flatten a tree with tin and tout times so every subtree becomes one array range, then use a Fenwick or segment tree on it.
minutes: 40
difficulty: advanced
rating: [1900, 2300]
tags: [trees, euler-tour, dfs, fenwick-tree]
prereqs: [trees-basics, fenwick-tree, segment-tree]
problems:
  - cses: 1137
    name: Subtree Queries
    note: the exact template of this lesson
  - cses: 1138
    name: Path Queries
    note: root-to-node sums, range add and point query
  - cf: 1328E
    name: Tree Queries
    rating: 1900
    note: ancestor checks with tin and tout
  - cf: 383C
    name: Propagating tree
    rating: 2000
    core: true
    note: flip the sign of an update by depth parity
  - cf: 877E
    name: Danil and a Part-time Job
    rating: 2000
    core: true
    note: flip a whole subtree with a lazy segment tree
  - cf: 208E
    name: Blood Cousins
    rating: 2100
    note: lists of tin per depth, then binary search
  - cf: 620E
    name: New Year Tree
    rating: 2100
    core: true
    note: assign a colour to a subtree, count distinct colours with a bitmask
  - cf: 600E
    name: Lomsat gelral
    rating: 2300
    note: dominant colour of every subtree; the flat array enables the sack technique
exercises:
  - Write the same program with a recursive DFS and test it on a path of 200,000 nodes. Note what happens.
  - Use a lazy segment tree over the Euler order to support "add x to a subtree" and "sum of a subtree".
---

## The problem

You have a rooted tree where each node holds a number. Queries change one node's value, ask for the sum over the **subtree** of a node (the node and all its descendants), or ask for the sum on the path from the root to a node. A tree is not an array, so range structures do not apply directly.

## Brute force first

- Walk the subtree with a DFS (depth-first search) for every query: O(n) each.
- With n = q = 2e5 that is about 4e10 steps.
- Better: change the shape of the problem so that a subtree is a contiguous block.

## The idea

Run one DFS from the root with a counter. Record two numbers for each node `v`:

- `tin[v]`: the counter value when the DFS enters `v`.
- `tout[v]`: the largest counter value used anywhere inside the subtree of `v`.

Nodes entered during the visit of `v` get consecutive times, so the subtree of `v` is exactly the positions `tin[v] .. tout[v]`. Subtree size is `tout[v] - tin[v] + 1`.

```steps
title: DFS order of the tree 1-2, 1-3, 2-4, 2-5, 3-6, 5-7, 5-8, 6-9
view: array
frames:
  - arr: [1, 2, 4, 5, 7, 8, 3, 6, 9]
    note: Node at each time, from time 1 on the left to time 9 on the right. Children are visited in input order.
  - arr: [1, 2, 4, 5, 7, 8, 3, 6, 9]
    highlight: {1: match, 2: match, 3: match, 4: match, 5: match}
    note: "Subtree of node 2: tin = 2, tout = 6. Times 2 to 6 hold the nodes 2, 4, 5, 7, 8, which are exactly its descendants and itself."
  - arr: [1, 2, 4, 5, 7, 8, 3, 6, 9]
    highlight: {6: match, 7: match, 8: match}
    note: "Subtree of node 3: tin = 7, tout = 9. Nodes 3, 6, 9."
  - arr: [1, 2, 4, 5, 7, 8, 3, 6, 9]
    highlight: {3: active, 5: focus}
    note: "Is node 5 an ancestor of node 8? tin[5] = 4 <= tin[8] = 6 <= tout[5] = 6, so yes. The same test works for any pair."
```

```predict
lang: cpp
code: |
  int tin[]  = {0, 1, 2, 7, 3, 4, 8, 5, 6, 9};   // index = node
  int tout[] = {0, 9, 6, 9, 3, 6, 9, 5, 6, 9};
  auto anc = [&](int u, int v) { return tin[u] <= tin[v] && tin[v] <= tout[u]; };
  cout << anc(2, 7) << anc(3, 7) << anc(5, 5) << anc(7, 2);
output: "1010"
why: Node 7 is inside node 2's subtree (yes), not in node 3's (no). A node counts as its own ancestor here (yes). Node 7 is not an ancestor of node 2 (no).
```

## Two ways to use it

| Query | Structure on the flat array | How |
|---|---|---|
| Sum of a subtree | Fenwick tree, point update | `sum(tout[v]) - sum(tin[v] - 1)` |
| Sum on path root to v, node values change | Fenwick tree over differences | a change at `u` adds delta to range `[tin[u], tout[u]]`; read `prefix(tin[v])` |
| Add to a whole subtree, then query | Lazy segment tree | range add on `[tin[v], tout[v]]` |

The path query works because a change at `u` affects the root-to-`v` sum exactly when `u` is an ancestor of `v`, which is exactly when `tin[v]` falls in `u`'s range.

```quiz
q: A node u changes its value by delta. For the path-sum tree, which update do you apply?
options:
  - Point add delta at tin[u]
  - Range add delta on [tin[u], tout[u]], then point query at tin[v]
  - Range add delta on [1, tin[u]]
  - Rebuild the whole tree
answer: 1
why: "Every node w inside u's subtree has u on its root path, so each of their path sums grows by delta. That is a range add on u's block. A path sum is then a point query."
```

## Template

The program reads `n q`, the node values, then the `n - 1` edges (tree rooted at 1). Each query is one of:

- `1 v x`: set the value of `v` to `x`.
- `2 v`: print the sum over the subtree of `v`.
- `3 v`: print the sum on the path from the root to `v`.

It computes `tin` and `tout` with an explicit stack, because recursion on a path of 2e5 nodes may crash.

```cpp
#include <bits/stdc++.h>
using namespace std;

struct BIT {
    int n;
    vector<long long> t;
    BIT(int n) : n(n), t(n + 2, 0) {}
    void add(int i, long long v) { for (; i <= n; i += i & -i) t[i] += v; }
    long long sum(int i) { long long s = 0; for (; i > 0; i -= i & -i) s += t[i]; return s; }
};

int main() {
    int n, q;
    scanf("%d %d", &n, &q);
    vector<long long> val(n + 1);
    for (int i = 1; i <= n; i++) scanf("%lld", &val[i]);
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int a, b;
        scanf("%d %d", &a, &b);
        adj[a].push_back(b);
        adj[b].push_back(a);
    }
    // iterative DFS from node 1: tin[v] = entry time, tout[v] = last entry time inside v's subtree
    vector<int> tin(n + 1), tout(n + 1), par(n + 1, 0), it(n + 1, 0);
    int timer = 0;
    vector<int> stk = {1};
    tin[1] = ++timer;
    while (!stk.empty()) {
        int v = stk.back();
        if (it[v] < (int)adj[v].size()) {
            int w = adj[v][it[v]++];
            if (w == par[v]) continue;
            par[w] = v;
            tin[w] = ++timer;
            stk.push_back(w);
        } else {
            tout[v] = timer;
            stk.pop_back();
        }
    }
    BIT sub(n), path(n);  // sub: point update, range sum.  path: range add, point query
    for (int v = 1; v <= n; v++) {
        sub.add(tin[v], val[v]);
        path.add(tin[v], val[v]);
        path.add(tout[v] + 1, -val[v]);
    }
    while (q--) {
        int type, v;
        scanf("%d %d", &type, &v);
        if (type == 1) {  // set val[v] = x
            long long x;
            scanf("%lld", &x);
            long long delta = x - val[v];
            val[v] = x;
            sub.add(tin[v], delta);
            path.add(tin[v], delta);
            path.add(tout[v] + 1, -delta);
        } else if (type == 2) {  // sum over the subtree of v
            printf("%lld\n", sub.sum(tout[v]) - sub.sum(tin[v] - 1));
        } else {  // sum on the path root -> v
            printf("%lld\n", path.sum(tin[v]));
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

    static void add(long[] t, int i, long v) {
        for (; i <= n; i += i & -i) t[i] += v;
    }

    static long sum(long[] t, int i) {
        long s = 0;
        for (; i > 0; i -= i & -i) s += t[i];
        return s;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        n = Integer.parseInt(st.nextToken());
        int q = Integer.parseInt(st.nextToken());
        long[] val = new long[n + 1];
        st = new StringTokenizer(br.readLine());
        for (int i = 1; i <= n; i++) val[i] = Long.parseLong(st.nextToken());
        int[] head = new int[n + 1], nxt = new int[2 * n], to = new int[2 * n];
        Arrays.fill(head, -1);
        int cnt = 0;
        for (int i = 0; i < n - 1; i++) {
            st = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(st.nextToken());
            int b = Integer.parseInt(st.nextToken());
            to[cnt] = b; nxt[cnt] = head[a]; head[a] = cnt++;
            to[cnt] = a; nxt[cnt] = head[b]; head[b] = cnt++;
        }
        int[] tin = new int[n + 1], tout = new int[n + 1], par = new int[n + 1];
        int[] it = new int[n + 1];
        for (int v = 1; v <= n; v++) it[v] = head[v];
        int[] stk = new int[n + 1];
        int sp = 0, timer = 0;
        stk[sp++] = 1;
        tin[1] = ++timer;
        while (sp > 0) {
            int v = stk[sp - 1];
            if (it[v] != -1) {
                int w = to[it[v]];
                it[v] = nxt[it[v]];
                if (w == par[v]) continue;
                par[w] = v;
                tin[w] = ++timer;
                stk[sp++] = w;
            } else {
                tout[v] = timer;
                sp--;
            }
        }
        long[] sub = new long[n + 2], path = new long[n + 2];
        for (int v = 1; v <= n; v++) {
            add(sub, tin[v], val[v]);
            add(path, tin[v], val[v]);
            add(path, tout[v] + 1, -val[v]);
        }
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) {
            st = new StringTokenizer(br.readLine());
            int type = Integer.parseInt(st.nextToken());
            int v = Integer.parseInt(st.nextToken());
            if (type == 1) {
                long x = Long.parseLong(st.nextToken());
                long delta = x - val[v];
                val[v] = x;
                add(sub, tin[v], delta);
                add(path, tin[v], delta);
                add(path, tout[v] + 1, -delta);
            } else if (type == 2) {
                sb.append(sum(sub, tout[v]) - sum(sub, tin[v] - 1)).append('\n');
            } else {
                sb.append(sum(path, tin[v])).append('\n');
            }
        }
        System.out.print(sb);
    }
}
```
```input
9 7
4 2 5 2 1 3 6 1 7
1 2
1 3
2 4
2 5
3 6
5 7
5 8
6 9
2 2
3 7
1 5 10
2 2
3 7
3 9
2 1
```
```output
12
13
21
22
19
40
```

```blanks
prompt: Fill in the two ranges used in the program.
lang: cpp
code: |
  int l = tin[v], r = tout[v];   // the block of v's subtree
  // a change at v affects every path sum inside the block
  path.add(l, delta);
  path.add([[r + 1|r+1]], -delta);
  // sum over the subtree of v
  long long s = sub.sum(r) - sub.sum([[l - 1|l-1]]);
why: A range add on [l, r] is add(l, +d) and add(r + 1, -d). A range sum on [l, r] is prefix(r) minus prefix(l - 1).
```

## Walkthrough

With values `4 2 5 2 1 3 6 1 7` on nodes 1 to 9:

- `2 2` sums nodes 2, 4, 5, 7, 8: `2 + 2 + 1 + 6 + 1 = 12`.
- `3 7` sums the path 1, 2, 5, 7: `4 + 2 + 1 + 6 = 13`.
- After `1 5 10` the subtree of 2 becomes 21 and the path to 7 becomes 22.
- `3 9` sums 1, 3, 6, 9: `4 + 5 + 3 + 7 = 19`. The whole tree, `2 1`, is 40.

## Variations

- **Tour of length 2n.** Record a node on entering and again on leaving. A value added at entry and subtracted at exit gives path sums as a prefix sum. The same tour, with depths, gives LCA as a range minimum.
- **Depth parity.** In Propagating tree, a node's update flips sign for children. Store the update with its sign by depth parity, so one tree handles both parities.
- **Offline subtree counting.** Problems like "how many distinct colours are in a subtree" become range-distinct queries on the flat array.

:::details[Why tout is the last time, not the next one]
Some code stores `tout[v]` as the first time after the subtree, making the range half-open `[tin[v], tout[v])`. Both are valid. Pick one and write it in a comment, since mixing them is the most common off-by-one in these problems.
:::

## Complexity

- The DFS is O(n). Each query is O(log n) with a Fenwick tree or a segment tree.
- Memory is O(n) for `tin`, `tout` and the tree.

## Pitfalls

- Recursive DFS on a deep tree. Use an explicit stack or raise the stack limit.
- Forgetting to skip the parent when walking neighbours.
- Using a Fenwick tree where the position starts at 0. Times start at 1.
- Adding at `tout[v] + 1` without room in the array (size `n + 2`, or a guard in the loop).
- Re-rooting the tree. Every `tin` and `tout` changes, so compute them once for one root.

:::truth
Flattening is one of the highest-value tricks in tree problems, and it is only a few lines. The real work is deciding which structure sits on top. If a query is not about a subtree or a root path, an Euler tour will not help by itself.
:::

```cards
- q: What are tin[v] and tout[v]?
  a: The time the DFS enters v, and the last time used inside the subtree of v. The subtree of v is the range [tin[v], tout[v]].
- q: How do you test that u is an ancestor of v?
  a: "`tin[u] <= tin[v] && tin[v] <= tout[u]`."
- q: How do you get a subtree sum with point updates?
  a: Put the values at position tin[v] in a Fenwick tree and take sum(tout[v]) - sum(tin[v] - 1).
- q: How do you get root-to-v path sums when node values change?
  a: Range add delta on [tin[u], tout[u]] for a change at u, and read the point value at tin[v].
- q: Why avoid recursive DFS here?
  a: A path-shaped tree with 2e5 nodes can overflow the stack. Use an explicit stack.
```

## Notes

:::notes
- Euler tour (flattening): one DFS gives `tin[v]` (enter time) and `tout[v]` (last time in the subtree).
- Subtree of `v` = positions `tin[v]..tout[v]`; its size is `tout[v] - tin[v] + 1`.
- Ancestor test: `tin[u] <= tin[v] <= tout[u]`.
- Subtree sum with point updates: Fenwick tree, `sum(tout) - sum(tin - 1)`.
- Root-to-v path sum with node updates: range add on the subtree block, point query at `tin[v]`.
- Whole-subtree updates need a lazy segment tree on the flat array.
- Use an iterative DFS for deep trees; times start at 1 for Fenwick trees.
- Decide whether `tout` is inclusive or exclusive and stick to it.
:::
