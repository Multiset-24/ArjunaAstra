---
title: Minimum Spanning Tree
summary: Connect all nodes at the lowest total edge weight with Kruskal (sort edges, join with DSU) or Prim (grow one tree with a heap), and know why greedy works.
minutes: 40
difficulty: intermediate
rating: [1600, 2000]
tags: [graphs, mst, kruskal, prim, dsu, greedy]
prereqs: [dsu, shortest-paths]
problems:
  - lc: min-cost-to-connect-all-points
    name: Min Cost to Connect All Points
    difficulty: Medium
    note: a complete graph, so Prim without a heap works well
  - cses: 1675
    name: Road Reparation
    core: true
    note: the template, plus printing IMPOSSIBLE
  - cf: 1468J
    name: Road Reform
    rating: 1800
    core: true
    note: build the MST, then think about which edge is closest to the target
  - cf: 25D
    name: Roads not only in Berland
    rating: 1900
    note: edges rejected by Kruskal are the ones you can move
  - cf: 1245D
    name: Shichikuji and Power Grid
    rating: 1900
    core: true
    note: add a virtual node so that "build a station" becomes "take an edge"
  - cf: 1095F
    name: Make It Connected
    rating: 1900
    note: only a few edges can matter
  - cf: 1242B
    name: 0-1 MST
    rating: 1900
    note: the weight-0 edges are the complement of the input
  - cf: 1513D
    name: GCD and MST
    rating: 2000
  - cf: 1108F
    name: MST Unification
    rating: 2100
    note: equal-weight edges, process them in groups
---

## The problem

A spanning tree of a connected graph is a set of edges that links all $n$ nodes with no cycle. Every spanning tree has exactly $n - 1$ edges. A minimum spanning tree (MST) is the spanning tree with the smallest total weight.

Real shapes of the same question: lay cable to connect all offices as cheaply as possible, rebuild the cheapest set of roads so every city is reachable, cluster points by repeatedly joining the closest ones.

If the graph is not connected there is no spanning tree. You get a spanning forest, one tree per component.

## Brute force first

Try every set of $n - 1$ edges, check that it is a tree, keep the cheapest. There are $\binom{m}{n-1}$ sets, which explodes already for $n = 30$. We need a rule that tells us which edges to keep without searching.

## The idea: the cheapest edge across a cut is safe

A cut splits the nodes into two non-empty sides $S$ and the rest. An edge crosses the cut if its ends are on different sides.

:::key
**Cut property:** the cheapest edge crossing any cut belongs to some MST (to every MST if it is the unique cheapest).
:::

So greedy choices are safe: take a cheapest edge between two groups, and never regret it. Both algorithms below are this idea with different cuts.

:::details[Why the cut property holds]
Take an MST $T$ that does not contain the cheapest crossing edge $e$. Adding $e$ to $T$ creates exactly one cycle. That cycle must cross the cut a second time through another edge $f$, and $w(f) \ge w(e)$. Swap $f$ for $e$. The result is still a spanning tree and is not heavier. So some MST contains $e$.
:::

## Kruskal: sort, then join

1. Sort the edges by weight, ascending.
2. Go through them. Take an edge if its ends are in different components, otherwise skip it (it would close a cycle).
3. Stop after $n - 1$ edges.

"Different components" is exactly what the DSU from the previous lesson answers, and `unite` returns whether the join happened.

```steps
title: Kruskal on 5 nodes, edges sorted by weight
view: array
frames:
  - arr: [1, 2, 3, 4, 5, 6, 7]
    pointers: {next: 0}
    vars: {components: 5, total: 0}
    note: "Sorted edges: 1-2 (1), 2-3 (2), 1-3 (3), 3-4 (4), 2-4 (5), 4-5 (6), 3-5 (7)."
  - arr: [1, 2, 3, 4, 5, 6, 7]
    highlight: {0: done}
    pointers: {next: 1}
    vars: {components: 4, total: 1}
    note: Edge 1-2 joins two different components. Take it.
  - arr: [1, 2, 3, 4, 5, 6, 7]
    highlight: {0: done, 1: done}
    pointers: {next: 2}
    vars: {components: 3, total: 3}
    note: Edge 2-3 joins node 3 to the group {1, 2}. Take it.
  - arr: [1, 2, 3, 4, 5, 6, 7]
    highlight: {0: done, 1: done, 2: bad}
    pointers: {next: 3}
    vars: {components: 3, total: 3}
    note: Edge 1-3 has both ends in {1, 2, 3} already. It would close a cycle. Skip it.
  - arr: [1, 2, 3, 4, 5, 6, 7]
    highlight: {0: done, 1: done, 2: bad, 3: done}
    pointers: {next: 4}
    vars: {components: 2, total: 7}
    note: Edge 3-4 brings in node 4. Take it.
  - arr: [1, 2, 3, 4, 5, 6, 7]
    highlight: {0: done, 1: done, 2: bad, 3: done, 4: bad}
    pointers: {next: 5}
    vars: {components: 2, total: 7}
    note: Edge 2-4 has both ends in the big group. Skip it.
  - arr: [1, 2, 3, 4, 5, 6, 7]
    highlight: {0: done, 1: done, 2: bad, 3: done, 4: bad, 5: done}
    pointers: {next: 6}
    vars: {components: 1, total: 13}
    note: Edge 4-5 brings in the last node. Take it.
  - arr: [1, 2, 3, 4, 5, 6, 7]
    highlight: {0: done, 1: done, 2: bad, 3: done, 4: bad, 5: done, 6: muted}
    vars: {components: 1, total: 13}
    note: One component and n - 1 = 4 edges taken. Stop. The MST weighs 13.
```

```order
prompt: Arrange the Kruskal loop. The edges are (w, a, b) and d is a DSU.
lang: cpp
code: |
  sort(e.begin(), e.end());
  long long total = 0;
  int used = 0;
  for (auto [w, a, b] : e) {
      if (!d.unite(a, b)) continue;
      total += w;
      used++;
  }
distractors:
  - "      if (d.unite(a, b)) continue;"
why: "unite returns true when it merged two components. Only then is the edge taken. The inverted check would skip every useful edge."
```

### Template: Kruskal

Input: `n m`, then $m$ edges `a b w`. Print the MST weight, or `IMPOSSIBLE` if the graph is not connected. The DSU is the one from the last lesson in short form.

```cpp
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

vector<int> p;
int find(int x) { return p[x] == x ? x : p[x] = find(p[x]); }
bool unite(int a, int b) {
    a = find(a); b = find(b);
    if (a == b) return false;
    p[a] = b;                      // union by size is optional for speed here
    return true;
}

int main() {
    int n, m;
    scanf("%d %d", &n, &m);
    vector<array<ll, 3>> e(m);     // {weight, a, b}
    for (auto &x : e) {
        ll a, b, w;
        scanf("%lld %lld %lld", &a, &b, &w);
        x = {w, a, b};
    }
    sort(e.begin(), e.end());
    p.resize(n + 1);
    iota(p.begin(), p.end(), 0);
    ll total = 0;
    int used = 0;
    for (auto [w, a, b] : e) {
        if (!unite((int)a, (int)b)) continue;
        total += w;
        used++;
    }
    if (used == n - 1) printf("%lld\n", total);
    else puts("IMPOSSIBLE");
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    static int[] p;

    static int find(int x) {
        while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }
        return x;
    }

    static boolean unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;
        p[a] = b;
        return true;
    }

    public static void main(String[] args) throws IOException {
        StreamTokenizer in = new StreamTokenizer(new BufferedReader(new InputStreamReader(System.in)));
        in.nextToken(); int n = (int) in.nval;
        in.nextToken(); int m = (int) in.nval;
        long[][] e = new long[m][3];   // {weight, a, b}
        for (int i = 0; i < m; i++) {
            in.nextToken(); long a = (long) in.nval;
            in.nextToken(); long b = (long) in.nval;
            in.nextToken(); long w = (long) in.nval;
            e[i][0] = w; e[i][1] = a; e[i][2] = b;
        }
        Arrays.sort(e, (x, y) -> Long.compare(x[0], y[0]));
        p = new int[n + 1];
        for (int i = 0; i <= n; i++) p[i] = i;
        long total = 0;
        int used = 0;
        for (long[] ed : e) {
            if (!unite((int) ed[1], (int) ed[2])) continue;
            total += ed[0];
            used++;
        }
        System.out.println(used == n - 1 ? String.valueOf(total) : "IMPOSSIBLE");
    }
}
```
```input
5 7
1 2 1
2 3 2
1 3 3
3 4 4
2 4 5
4 5 6
3 5 7
```
```output
13
```

```predict
lang: cpp
prompt: "The edges (w, a, b) are already sorted and d is a fresh DSU on nodes 1..4. What is printed?"
code: |
  vector<array<int, 3>> e = {{1, 1, 2}, {2, 2, 3}, {3, 1, 3}, {4, 3, 4}};
  int total = 0;
  for (auto [w, a, b] : e)
      if (d.unite(a, b)) total += w;
  cout << total;
output: "7"
why: Edges 1-2, 2-3 and 3-4 are taken for 1 + 2 + 4 = 7. The edge 1-3 (weight 3) is skipped because 1 and 3 are already connected.
```

## Prim: grow one tree

Start from any node. Repeatedly add the cheapest edge that leaves the current tree. This is the cut property with the cut "inside the tree versus outside". It looks like Dijkstra, with one difference: the heap key is the edge weight, not the distance from the source.

```cpp
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

int main() {
    int n, m;
    scanf("%d %d", &n, &m);
    vector<vector<pair<int, ll>>> g(n + 1);
    for (int i = 0; i < m; i++) {
        int a, b; ll w;
        scanf("%d %d %lld", &a, &b, &w);
        g[a].push_back({b, w});
        g[b].push_back({a, w});
    }
    vector<char> in(n + 1, 0);
    priority_queue<pair<ll, int>, vector<pair<ll, int>>, greater<pair<ll, int>>> pq;
    pq.push({0, 1});
    ll total = 0;
    int cnt = 0;
    while (!pq.empty()) {
        auto [w, v] = pq.top(); pq.pop();
        if (in[v]) continue;           // stale entry
        in[v] = 1;
        total += w;
        cnt++;
        for (auto [u, c] : g[v])
            if (!in[u]) pq.push({c, u});
    }
    if (cnt == n) printf("%lld\n", total);
    else puts("IMPOSSIBLE");
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        StreamTokenizer in = new StreamTokenizer(new BufferedReader(new InputStreamReader(System.in)));
        in.nextToken(); int n = (int) in.nval;
        in.nextToken(); int m = (int) in.nval;
        ArrayList<long[]>[] g = new ArrayList[n + 1];
        for (int i = 0; i <= n; i++) g[i] = new ArrayList<>();
        for (int i = 0; i < m; i++) {
            in.nextToken(); int a = (int) in.nval;
            in.nextToken(); int b = (int) in.nval;
            in.nextToken(); long w = (long) in.nval;
            g[a].add(new long[]{b, w});
            g[b].add(new long[]{a, w});
        }
        boolean[] inTree = new boolean[n + 1];
        PriorityQueue<long[]> pq = new PriorityQueue<>((x, y) -> Long.compare(x[0], y[0]));
        pq.add(new long[]{0, 1});          // {weight, node}
        long total = 0;
        int cnt = 0;
        while (!pq.isEmpty()) {
            long[] top = pq.poll();
            int v = (int) top[1];
            if (inTree[v]) continue;       // stale entry
            inTree[v] = true;
            total += top[0];
            cnt++;
            for (long[] ed : g[v])
                if (!inTree[(int) ed[0]]) pq.add(new long[]{ed[1], ed[0]});
        }
        System.out.println(cnt == n ? String.valueOf(total) : "IMPOSSIBLE");
    }
}
```
```input
5 7
1 2 1
2 3 2
1 3 3
3 4 4
2 4 5
4 5 6
3 5 7
```
```output
13
```

### Which one to use

| | Kruskal | Prim |
|---|---|---|
| Input shape | a list of edges | adjacency lists, or a dense / implicit graph |
| Time | $O(m \log m)$ | $O(m \log n)$ with a heap, $O(n^2)$ without |
| Needs | sorting and a DSU | a priority queue |
| Best for | most contest problems, variations that need the DSU state | complete graphs such as points in the plane, with the $O(n^2)$ array version |

```quiz
questions:
  - q: A connected graph has 6 nodes and 9 edges. How many edges does any spanning tree of it have?
    options:
      - "5"
      - "6"
      - "9"
    answer: 0
    why: "A tree on n nodes always has n - 1 edges. Any more would create a cycle, any fewer would leave it disconnected."
  - q: Two different edges both have the smallest weight in the graph. Is the MST unique?
    options:
      - Yes, the minimum weight always decides
      - Not necessarily, ties can give several MSTs with the same total weight
      - No, the graph then has no MST
    answer: 1
    why: "Equal weights can be swapped, for example in a triangle with all weights 1 any two edges form an MST. The total weight of an MST is unique, the edge set may not be."
```

## Variations seen in problems

- **Maximum spanning tree:** sort descending.
- **Some edges already built:** `unite` them first, then run Kruskal.
- **Costs on nodes (build a station here):** add a virtual node 0, join it to every node $i$ with the cost of building at $i$, and take the MST (1245D).
- **Minimise the largest edge on the path between two nodes:** the MST path does it. This is the minimum bottleneck property.
- **Disconnected output:** fewer than $n - 1$ taken edges means no spanning tree.

:::truth
The MST is not the shortest-path tree. It minimises the total weight of the tree, not any single distance from a source. Mixing the two up is the most common conceptual mistake, and it costs wrong answers on problems that look like Dijkstra.
:::

## Complexity and pitfalls

- Kruskal: sorting dominates, $O(m \log m)$, then $O(m \, \alpha(n))$ for the DSU.
- Prim with a heap: $O(m \log n)$. Dense version with arrays: $O(n^2)$.
- Use `long long` for the total weight. $2 \cdot 10^5$ edges of weight $10^9$ overflow `int` by a wide margin.
- Check connectivity: the number of taken edges must be $n - 1$.
- In Prim, skip a popped node that is already in the tree, otherwise the total is counted twice.
- Self-loops and parallel edges need no special handling in Kruskal, the DSU rejects them.

```cards
- q: How many edges does a spanning tree of n nodes have?
  a: Exactly n - 1.
- q: State the cut property.
  a: The cheapest edge crossing any cut belongs to some MST.
- q: Kruskal in one line?
  a: Sort edges ascending, take an edge when its ends are in different DSU components.
- q: How does Prim differ from Dijkstra?
  a: Both grow a set with a heap. Prim uses the edge weight as key, Dijkstra the total distance from the source.
- q: How do you handle costs attached to nodes in an MST problem?
  a: Add a virtual node joined to every node with that node's cost, then run MST.
- q: How do you detect that no spanning tree exists?
  a: The algorithm takes fewer than n - 1 edges, so the graph is disconnected.
```

## Notes

:::notes
- Spanning tree: $n - 1$ edges, connects all nodes, no cycle. MST: the lightest one.
- Cut property: the cheapest edge across any cut is safe. This justifies both algorithms.
- Kruskal: sort edges, DSU, take an edge if `unite` succeeds. $O(m \log m)$.
- Prim: heap of edges leaving the tree, skip nodes already inside. $O(m \log n)$, or $O(n^2)$ for dense graphs.
- Fewer than $n - 1$ taken edges means the graph is disconnected.
- Total weight needs `long long`. MST weight is unique, the edge set may not be.
- Node costs: add a virtual node. Max spanning tree: sort descending.
- MST is not shortest paths from a source.
:::
