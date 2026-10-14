---
title: Disjoint Set Union
summary: Track which items belong to the same group while groups merge, using union by size and path compression for near-constant time per operation.
minutes: 40
difficulty: intermediate
rating: [1300, 1900]
tags: [dsu, union-find, graphs, data-structures]
prereqs: [graphs-bfs-dfs]
problems:
  - lc: number-of-provinces
    name: Number of Provinces
    difficulty: Medium
  - lc: redundant-connection
    name: Redundant Connection
    difficulty: Medium
    note: the union that returns false is the extra edge
  - cses: 1676
    name: Road Construction
    core: true
    note: this lesson's template, almost word for word
  - cf: 445B
    name: DZY Loves Chemistry
    rating: 1400
    note: the answer depends only on the number of components
  - cf: 1167C
    name: News Distribution
    rating: 1400
    core: true
    note: component sizes
  - cf: 277A
    name: Learning Languages
    rating: 1400
    note: one corner case when nobody knows any language
  - cf: 356A
    name: Knight Tournament
    rating: 1500
    core: true
    note: the "next free index" use of DSU
  - cf: 771A
    name: Bear and Friendship Condition
    rating: 1500
  - cf: 1594D
    name: The Number of Imposters
    rating: 1700
    note: DSU with a parity (same or different) on each link
  - cf: 25D
    name: Roads not only in Berland
    rating: 1900
    note: find the useless edges and reuse them to connect the components
---

## The problem

You have $n$ items and each starts alone in its own group. Two kinds of events happen:

- **union(a, b):** merge the group of $a$ with the group of $b$.
- **find / same(a, b):** are $a$ and $b$ in the same group? Sometimes also: how big is the group, how many groups are left?

A friendship network where new friendships keep appearing is the standard picture. Groups only merge, they never split.

## Brute force first

Two simple designs, both slow:

- Keep a list of edges and run BFS or DFS for every question. One question costs $O(n + m)$. With $q$ questions, $O(q \cdot (n + m))$.
- Store a group label per item. `same` is $O(1)$, but a union relabels a whole group, $O(n)$ per union. For $2 \cdot 10^5$ unions that is $4 \cdot 10^{10}$ in the worst case.

The disjoint set union (DSU, also called union-find) structure does both operations in nearly constant time.

## The idea: sets as trees

Store each group as a rooted tree using one array `p`, where `p[x]` is the parent of `x`. The root points to itself and acts as the group's name (its representative).

- `find(x)`: follow parents up to the root.
- `union(a, b)`: find both roots and hang one root under the other.
- `same(a, b)`: compare `find(a) == find(b)`.

Done naively, the trees can become long chains and `find` costs $O(n)$. Two small fixes prevent that:

:::key
**Union by size:** hang the smaller tree under the bigger one, so trees stay shallow (depth at most $\log_2 n$).
**Path compression:** while finding the root, point every visited node straight at it, so the next find is almost free.
:::

```viz
algo: dsu
input:
  n: 8
  unions: [[0, 1], [2, 3], [1, 3], [4, 5], [6, 7], [5, 7], [3, 7]]
  find: [0]
```

```blanks
prompt: Complete find with path compression and the size rule in union.
lang: cpp
code: |
  int find(int x) {
      if (p[x] == x) return x;
      return p[x] = [[find(p[x])]];
  }
  bool unite(int a, int b) {
      a = find(a); b = find(b);
      if (a == b) return false;
      if (sz[a] < sz[b]) [[swap(a, b)]];
      p[b] = a;
      sz[a] += sz[b];
      return true;
  }
why: "find rewrites p[x] with the root returned by the recursive call. After the swap, a is the larger root, and the smaller root b is attached under it."
```

## Template

The program below solves CSES 1676 (Road Construction). Input: `n m`, then $m$ roads `a b`. After each road, print the number of components and the size of the largest one. `unite` returns whether a merge really happened.

```cpp
#include <bits/stdc++.h>
using namespace std;

struct DSU {
    vector<int> p, sz;
    int comps, big;
    DSU(int n) : p(n + 1), sz(n + 1, 1), comps(n), big(1) {
        iota(p.begin(), p.end(), 0);
    }
    int find(int x) { return p[x] == x ? x : p[x] = find(p[x]); }
    bool unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;
        if (sz[a] < sz[b]) swap(a, b);
        p[b] = a;
        sz[a] += sz[b];
        comps--;
        big = max(big, sz[a]);
        return true;
    }
};

int main() {
    int n, m;
    scanf("%d %d", &n, &m);
    DSU d(n);
    while (m--) {
        int a, b;
        scanf("%d %d", &a, &b);
        d.unite(a, b);
        printf("%d %d\n", d.comps, d.big);
    }
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    static int[] p, sz;
    static int comps, big;

    static int find(int x) {
        return p[x] == x ? x : (p[x] = find(p[x]));
    }

    static boolean unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;
        if (sz[a] < sz[b]) { int t = a; a = b; b = t; }
        p[b] = a;
        sz[a] += sz[b];
        comps--;
        big = Math.max(big, sz[a]);
        return true;
    }

    public static void main(String[] args) throws IOException {
        StreamTokenizer in = new StreamTokenizer(new BufferedReader(new InputStreamReader(System.in)));
        in.nextToken(); int n = (int) in.nval;
        in.nextToken(); int m = (int) in.nval;
        p = new int[n + 1];
        sz = new int[n + 1];
        for (int i = 0; i <= n; i++) { p[i] = i; sz[i] = 1; }
        comps = n;
        big = 1;
        StringBuilder sb = new StringBuilder();
        while (m-- > 0) {
            in.nextToken(); int a = (int) in.nval;
            in.nextToken(); int b = (int) in.nval;
            unite(a, b);
            sb.append(comps).append(' ').append(big).append('\n');
        }
        System.out.print(sb);
    }
}
```
```input
5 3
1 2
1 2
3 4
```
```output
4 2
4 2
3 2
```

### Walkthrough

- Start: 5 singleton groups, `comps = 5`, `big = 1`.
- Road `1 2`: roots differ, merge into size 2. `comps = 4`, `big = 2`.
- Road `1 2` again: same root, `unite` returns false, nothing changes. Printed line is the same.
- Road `3 4`: another merge of size 2. `comps = 3`, `big` stays 2.

```quiz
q: "n = 6. Unions are applied in this order: (1,2), (3,4), (2,3), (5,6), (1,4). How many groups remain?"
options:
  - "1 group"
  - "2 groups"
  - "3 groups"
answer: 1
why: "After the first four unions the groups are {1,2,3,4} and {5,6}. The last union (1,4) joins two items already in the same group, so nothing changes. Two groups remain."
```

## Complexity

- With union by size and path compression, a sequence of $k$ operations costs $O(k \cdot \alpha(n))$. Here $\alpha$ is the inverse Ackermann function, which grows so slowly that it is at most 4 for any $n$ you will meet. Treat it as constant.
- With only one of the two tricks, the amortized (averaged over many operations) cost is $O(\log n)$. Still fine.
- Memory is $O(n)$.
- Recursive `find` with union by size has depth at most $\log_2 n$, so recursion is safe. With path compression alone, a chain could be $n$ deep.

## What DSU is used for

| Use | How |
|---|---|
| Count components while edges arrive | `comps` goes down on each successful union |
| Detect the edge that closes a cycle | `unite` returns false |
| Group equal things | union items that must be equal, read the groups at the end |
| Kruskal's minimum spanning tree | sort edges, take an edge when `unite` succeeds (next lesson) |
| "Next free slot" | point a used index to the next one, see below |

### The "next free index" trick

Problem shape: many operations "do something to every not-yet-processed index in $[l, r]$". Let `nxt[i]` be the smallest unprocessed index that is at least $i$. Processing index $i$ means `nxt[i] = i + 1`. Each index is processed once, so the total work is near-linear.

```cpp
// nxt[i] = i initially, for i in 1..n+1
int find(int x) { return nxt[x] == x ? x : nxt[x] = find(nxt[x]); }

for (int i = find(l); i <= r; i = find(i + 1)) {
    // handle index i, exactly once in the whole program
    nxt[i] = i + 1;
}
```
```java
// nxt[i] = i initially, for i in 1..n+1
static int find(int x) { return nxt[x] == x ? x : (nxt[x] = find(nxt[x])); }

for (int i = find(l); i <= r; i = find(i + 1)) {
    // handle index i, exactly once in the whole program
    nxt[i] = i + 1;
}
```

:::details[Groups with a relationship: parity DSU]
Sometimes each link says "same" or "different" (for example, "A says B is an imposter"). Store with each node its parity relative to its parent (0 same, 1 different). `find` returns the root and the parity of the node to the root, and `unite` adds a parity for the new root link. A contradiction appears when two nodes already in one group have the wrong parity. This is the idea behind 1594D.
:::

```quiz
q: Which operation does a plain DSU NOT support?
options:
  - Merging two groups
  - Asking whether two items are in the same group
  - Removing an edge and splitting a group back apart
answer: 2
why: "Trees only get merged. Undoing a union needs extra machinery (a rollback DSU or an offline trick that processes the operations in reverse)."
```

:::truth
DSU is short to write, and that is why it is so common: once you see "groups only merge", the code is the template. At 1700 and above the real difficulty is the modelling, such as noticing that the answer depends on the number of components or that an operation list should be processed backwards.
:::

## Pitfalls

- Union the roots, not the nodes. `p[a] = b` on non-roots breaks the structure.
- Compare `find(a) == find(b)`, never `p[a] == p[b]`.
- Initialise `p[i] = i` for every index used, including the sentinel `n + 1` in the next-free trick.
- Merge sizes only when the union really happens.
- If the items are not $1 \ldots n$ (names, large coordinates), map them to indices first with a map or by sorting.

```cards
- q: What do `find` and `unite` do in a DSU?
  a: find returns the root (representative) of a node's group. unite hangs the root of one group under the root of the other.
- q: Name the two optimisations of DSU.
  a: Union by size (small tree under big tree) and path compression (point visited nodes straight at the root).
- q: Complexity per operation with both optimisations?
  a: "$O(\\alpha(n))$, practically constant. The inverse Ackermann function is at most 4 for any realistic n."
- q: How do you detect that an edge closes a cycle with DSU?
  a: Both endpoints already have the same root, so unite returns false.
- q: What can DSU not do?
  a: Split a group (delete an edge). It only merges.
- q: How does the next-free-index trick work?
  a: "nxt[i] = i + 1 after processing i, and find(i) jumps to the next unprocessed index."
```

## Notes

:::notes
- DSU keeps groups that only merge. `find` gives the root, `unite` merges two roots.
- Store `p[]` and `sz[]`. Root has `p[x] == x`.
- Union by size plus path compression: $O(\alpha(n))$ per operation, practically constant.
- Count components with a counter that drops on each successful union. Track the largest size the same way.
- `unite` returning false means the edge closes a cycle (Redundant Connection, Kruskal).
- Next-free-index trick: `nxt[i] = i + 1` after handling `i`, then jump with `find`.
- Parity DSU handles "same / different" links. It is a common step up from the plain version.
- No deletion. For splits, think offline in reverse or a rollback DSU.
:::
