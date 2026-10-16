---
title: LCA and Binary Lifting
summary: Find the lowest common ancestor, distances and k-th ancestors in a rooted tree by jumping 2^k steps at a time.
minutes: 40
difficulty: advanced
rating: [1800, 2200]
tags: [trees, lca, binary-lifting]
prereqs: [trees-basics, bit-manipulation]
problems:
  - lc: lowest-common-ancestor-of-a-binary-tree
    name: Lowest Common Ancestor of a Binary Tree
    difficulty: Medium
    note: the plain recursive version, to see the definition at work
  - cses: 1688
    name: Company Queries II
    note: LCA of two employees
  - cses: 1687
    name: Company Queries I
    note: k-th ancestor
  - cses: 1135
    name: Distance Queries
  - lc: kth-ancestor-of-a-tree-node
    name: Kth Ancestor of a Tree Node
    difficulty: Hard
  - cf: 1328E
    name: Tree Queries
    rating: 1900
    core: true
    note: a path from the root through the deepest node must pass within one step of every query node
  - cf: 191C
    name: Fools and Roads
    rating: 1900
    core: true
    note: LCA plus a difference array on the tree
  - cf: 1304E
    name: 1-Trees and Queries
    rating: 2000
    core: true
    note: shortest walk with one extra edge is the best of three distances
  - cf: 519E
    name: A and B and Lecture Rooms
    rating: 2100
    note: the middle of a path, then subtree sizes
  - cf: 609E
    name: Minimum spanning tree for each edge
    rating: 2100
    note: store the maximum edge on each jump
exercises:
  - Add mx[k][v], the largest edge weight on the 2^k edges above v. Use it to answer "largest edge on the path u to v".
  - Rewrite the BFS part as a recursive DFS and find the smallest path length at which it overflows your stack.
---

## The problem

You have a rooted tree with n nodes. Each query gives two nodes `u` and `v`. The **lowest common ancestor** (LCA) is the deepest node that is an ancestor of both. Related queries: the distance between `u` and `v`, and the k-th ancestor of a node.

## Brute force first

- Lift the deeper node until both have equal depth, then lift both together until they meet.
- This costs O(depth) per query. In a tree shaped like a path, depth is n, so 2e5 queries cost about 4e10 steps.
- The fix: lift by large jumps instead of single steps.

## The idea

Let `up[k][v]` be the `2^k`-th ancestor of `v`. This is **binary lifting**.

- `up[0][v]` is the parent. For the root, use the root itself, so jumps never fall off the tree.
- `up[k][v] = up[k-1][ up[k-1][v] ]`: two jumps of size `2^(k-1)`.
- The k-th ancestor: write `k` in binary and make one jump for each set bit.
- The LCA: first lift the deeper node to the other's depth. If they are equal, done. Otherwise, from the largest `k` down to 0, jump both nodes whenever their `2^k`-th ancestors differ. Afterwards they are children of the LCA, so the answer is `up[0][u]`.
- The distance is `depth[u] + depth[v] - 2 * depth[lca]`.

```steps
title: Tree 1-2, 1-3, 2-4, 2-5, 3-6, 5-7, 5-8, 6-9. Row index i is node i + 1.
view: array
frames:
  - arr: [1, 1, 1, 2, 2, 3, 5, 5, 6]
    note: "up[0] is the parent of nodes 1 to 9. The root, node 1, points to itself."
  - arr: [1, 1, 1, 1, 1, 1, 2, 2, 3]
    note: "up[1][v] = up[0][up[0][v]]. For node 7: parent 5, then its parent 2."
  - arr: [1, 1, 1, 1, 1, 1, 1, 1, 1]
    note: "up[2] is the 4th ancestor. Every node is at most 3 deep, so all of them reach the root."
  - arr: [1, 1, 1, 1, 1, 1, 2, 2, 3]
    highlight: {6: compare, 8: compare}
    note: "LCA(7, 9). Both have depth 3, so no lifting first. At k = 2 and k = 3 the ancestors of 7 and 9 are both node 1, equal, so do not jump. At k = 1 the row says 2 for node 7 and 3 for node 9. They differ."
  - arr: [1, 1, 1, 1, 1, 1, 2, 2, 3]
    highlight: {1: active, 2: active}
    note: "Jump both: u = 2, v = 3. At k = 0 their parents are both node 1, equal, so do not jump. The answer is the parent of u, node 1."
```

```quiz
q: A tree has up to 100,000 nodes. How many levels (k = 0, 1, 2, ...) does `up` need so that every possible jump distance can be written?
options:
  - "10"
  - "17"
  - "100"
  - "100,000"
answer: 1
why: "A depth can be up to 99,999. Levels 0 to 16 give jumps up to 2^17 - 1 = 131,071, which covers it. 10 levels reach only 1023."
```

## Template

The program reads `n q`, then the `n - 1` edges of a tree rooted at node 1. A query is `type a b`:

- `1 u v` prints the LCA.
- `2 u v` prints the distance.
- `3 u k` prints the k-th ancestor of `u`, or -1 if it does not exist.

It uses BFS instead of recursion, because a path-shaped tree with 2e5 nodes overflows the call stack.

```cpp
#include <bits/stdc++.h>
using namespace std;

int n, LOG;
vector<vector<int>> adj, up;  // up[k][v] = the 2^k-th ancestor of v
vector<int> depth_;

int kth(int v, int k) {  // k-th ancestor of v, or -1 if it does not exist
    if (k > depth_[v]) return -1;
    for (int j = 0; j < LOG; j++)
        if (k >> j & 1) v = up[j][v];
    return v;
}

int lca(int u, int v) {
    if (depth_[u] < depth_[v]) swap(u, v);
    u = kth(u, depth_[u] - depth_[v]);  // lift u to v's depth
    if (u == v) return u;
    for (int j = LOG - 1; j >= 0; j--)
        if (up[j][u] != up[j][v]) { u = up[j][u]; v = up[j][v]; }
    return up[0][u];
}

int main() {
    int q;
    scanf("%d %d", &n, &q);
    adj.assign(n + 1, {});
    for (int i = 0; i < n - 1; i++) {
        int a, b;
        scanf("%d %d", &a, &b);
        adj[a].push_back(b);
        adj[b].push_back(a);
    }
    LOG = 1;
    while ((1 << LOG) < n) LOG++;
    up.assign(LOG, vector<int>(n + 1, 1));  // the root's parent is the root itself
    depth_.assign(n + 1, 0);
    vector<int> order = {1};  // BFS order, avoids deep recursion
    vector<bool> seen(n + 1, false);
    seen[1] = true;
    for (size_t i = 0; i < order.size(); i++) {
        int v = order[i];
        for (int w : adj[v])
            if (!seen[w]) {
                seen[w] = true;
                up[0][w] = v;
                depth_[w] = depth_[v] + 1;
                order.push_back(w);
            }
    }
    for (int j = 1; j < LOG; j++)
        for (int v = 1; v <= n; v++) up[j][v] = up[j - 1][up[j - 1][v]];
    while (q--) {
        int type, u, v;
        scanf("%d %d %d", &type, &u, &v);
        if (type == 1) printf("%d\n", lca(u, v));
        else if (type == 2) printf("%d\n", depth_[u] + depth_[v] - 2 * depth_[lca(u, v)]);
        else printf("%d\n", kth(u, v));  // v is k here
    }
    return 0;
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static int n, LOG;
    static int[][] up;
    static int[] depth;

    static int kth(int v, int k) {
        if (k > depth[v]) return -1;
        for (int j = 0; j < LOG; j++)
            if ((k >> j & 1) == 1) v = up[j][v];
        return v;
    }

    static int lca(int u, int v) {
        if (depth[u] < depth[v]) { int t = u; u = v; v = t; }
        u = kth(u, depth[u] - depth[v]);
        if (u == v) return u;
        for (int j = LOG - 1; j >= 0; j--)
            if (up[j][u] != up[j][v]) { u = up[j][u]; v = up[j][v]; }
        return up[0][u];
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        n = Integer.parseInt(st.nextToken());
        int q = Integer.parseInt(st.nextToken());
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
        LOG = 1;
        while ((1 << LOG) < n) LOG++;
        up = new int[LOG][n + 1];
        for (int[] row : up) Arrays.fill(row, 1);  // the root's parent is the root itself
        depth = new int[n + 1];
        int[] order = new int[n];
        boolean[] seen = new boolean[n + 1];
        int qh = 0, qt = 0;
        order[qt++] = 1;
        seen[1] = true;
        while (qh < qt) {
            int v = order[qh++];
            for (int e = head[v]; e != -1; e = nxt[e]) {
                int w = to[e];
                if (!seen[w]) {
                    seen[w] = true;
                    up[0][w] = v;
                    depth[w] = depth[v] + 1;
                    order[qt++] = w;
                }
            }
        }
        for (int j = 1; j < LOG; j++)
            for (int v = 1; v <= n; v++) up[j][v] = up[j - 1][up[j - 1][v]];
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) {
            st = new StringTokenizer(br.readLine());
            int type = Integer.parseInt(st.nextToken());
            int u = Integer.parseInt(st.nextToken());
            int v = Integer.parseInt(st.nextToken());
            if (type == 1) sb.append(lca(u, v));
            else if (type == 2) sb.append(depth[u] + depth[v] - 2 * depth[lca(u, v)]);
            else sb.append(kth(u, v));
            sb.append('\n');
        }
        System.out.print(sb);
    }
}
```
```input
9 7
1 2
1 3
2 4
2 5
3 6
5 7
5 8
6 9
1 7 8
1 4 9
2 7 9
3 7 2
3 4 5
1 7 4
2 8 8
```
```output
5
1
6
2
-1
2
0
```

```predict
lang: cpp
code: |
  // a path 1-2-3-...-8 rooted at 1, so the parent of v is v - 1
  int v = 8, k = 5;
  for (int j = 0; j < 3; j++)
      if (k >> j & 1) v -= 1 << j;
  cout << v;
output: "3"
why: "5 is 101 in binary, so jump 2^0 = 1 and 2^2 = 4 steps up: 8 - 5 = 3."
```

```order
prompt: Arrange the LCA function.
lang: cpp
code: |
  int lca(int u, int v) {
      if (depth_[u] < depth_[v]) swap(u, v);
      u = kth(u, depth_[u] - depth_[v]);
      if (u == v) return u;
      for (int j = LOG - 1; j >= 0; j--)
          if (up[j][u] != up[j][v]) { u = up[j][u]; v = up[j][v]; }
      return up[0][u];
  }
distractors:
  - "    for (int j = 0; j < LOG; j++)"
  - "    return u;"
why: Equalise depths first. Then try the biggest jump first and take it only if the ancestors differ, so both nodes stay just below the LCA. The answer is their common parent.
```

## Walkthrough

On the sample tree from the visual above, the program prints:

- `1 7 8` gives 5, because both are children of node 5.
- `1 4 9` gives 1, the root, because 4 and 9 sit in different subtrees of it.
- `2 7 9` gives 6, along the path 7-5-2-1-3-6-9.
- `3 7 2` gives 2, and `3 4 5` gives -1, since node 4 has only 2 ancestors.
- `1 7 4` gives 2, and `2 8 8` gives 0.

## Choosing a method

| Method | Build | Query | Notes |
|---|---|---|---|
| Binary lifting | O(n log n) | O(log n) | Also gives k-th ancestor and path maximums |
| Euler tour + sparse table | O(n log n) | O(1) | LCA only, see the Euler tour lesson |
| Heavy-light decomposition | O(n) | O(log n) | Less memory, useful for path updates |

:::details[Adding data to each jump]
Keep `mx[k][v]`, the maximum edge weight over the `2^k` edges above `v`, with `mx[k][v] = max(mx[k-1][v], mx[k-1][up[k-1][v]])`. Each time the LCA loop jumps, fold the matching `mx` into a running maximum. The same idea gives the minimum, a sum, or a gcd along a path.
:::

## Complexity

- Build O(n log n) time and memory. Each query is O(log n).
- For n = 2e5, LOG is 18, so `up` holds about 3.6 million ints.

## Pitfalls

- Setting the root's parent to 0 without making `up[k][0] = 0`. The root-as-its-own-parent trick avoids this.
- A `LOG` too small for the depth. Compute it from n.
- Recursive DFS on a deep tree. Use BFS or an explicit stack.
- Forgetting the early return when `u == v` after lifting. The loop would then do nothing and `up[0][u]` would be wrong.
- Reading the k-th ancestor past the root. Check `k > depth[v]` first.

:::truth
Binary lifting is the answer to most LCA problems at this level, and it handles 2e5 queries easily. The harder part of problems rated 1900 to 2100 is usually the reduction: noticing that the question is an LCA, a distance or a path property.
:::

```cards
- q: What is up[k][v]?
  a: The 2^k-th ancestor of v. The root is its own parent so jumps never leave the tree.
- q: How is up[k][v] computed?
  a: "`up[k][v] = up[k-1][up[k-1][v]]`, two jumps of half the size."
- q: Steps of the LCA query?
  a: Lift the deeper node to the same depth. If equal, done. Else for k from high to low, jump both if their 2^k-th ancestors differ. The answer is the parent.
- q: Distance between u and v?
  a: "`depth[u] + depth[v] - 2 * depth[lca(u, v)]`."
- q: Time and memory of binary lifting?
  a: $O(n \log n)$ to build and store; $O(\log n)$ per query.
```

## Notes

:::notes
- LCA: the deepest node that is an ancestor of both `u` and `v`.
- Binary lifting: `up[k][v]` is the `2^k`-th ancestor; `up[k][v] = up[k-1][up[k-1][v]]`; root points to itself.
- K-th ancestor: one jump per set bit of k; return -1 if `k > depth[v]`.
- LCA: equalise depths, then for k from high to low jump both if `up[k][u] != up[k][v]`; answer `up[0][u]`.
- Distance: `depth[u] + depth[v] - 2 * depth[lca]`.
- Store extra data per jump (max, min, sum) to answer path queries.
- Build with BFS or an explicit stack to avoid stack overflow; `LOG` is about `ceil(log2 n)`.
- Euler tour with a sparse table gives O(1) LCA queries when needed.
:::
