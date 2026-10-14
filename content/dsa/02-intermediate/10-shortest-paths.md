---
title: Shortest Paths
summary: Dijkstra with lazy deletion for non-negative weights, 0-1 BFS for weights 0 and 1, Bellman-Ford for negative edges and Floyd-Warshall for all pairs on small graphs.
minutes: 55
difficulty: intermediate
rating: [1500, 2000]
tags: [graphs, shortest-paths, dijkstra, heap]
prereqs: [graphs-bfs-dfs, heaps-and-priority-queues]
problems:
  - lc: network-delay-time
    name: Network Delay Time
    difficulty: Medium
  - cses: 1671
    name: Shortest Routes I
    core: true
    note: plain Dijkstra, the first one to write from memory
  - cses: 1672
    name: Shortest Routes II
    note: all pairs, Floyd-Warshall
  - lc: cheapest-flights-within-k-stops
    name: Cheapest Flights Within K Stops
    difficulty: Medium
    note: Bellman-Ford with a limited number of rounds
  - cses: 1197
    name: Cycle Finding
    note: negative cycle with Bellman-Ford, and print it
  - cf: 295B
    name: Greg and Graph
    rating: 1700
    note: Floyd-Warshall, read the statement for the order of k
  - cf: 1063B
    name: Labyrinth
    rating: 1800
    core: true
    note: 0-1 BFS on a grid
  - cf: 1915G
    name: Bicycles
    rating: 1800
  - cf: 2014E
    name: Rendez-vous de Marian et Robin
    rating: 1800
    note: Dijkstra with a state (node, has a horse)
  - cf: 20C
    name: Dijkstra?
    rating: 1900
    core: true
    note: the classic, with path printing
  - cf: 545E
    name: Paths and Trees
    rating: 2000
---

## The problem

Each edge now has a weight (a length, a cost, a time). The length of a path is the sum of its edge weights. The shortest path problem asks for the smallest total from a source node to every other node.

Plain BFS counts edges, so it fails here: a path with 2 heavy edges can be longer than a path with 5 light ones.

Which tool to use depends on the weights:

| Situation | Tool | Time |
|---|---|---|
| All weights equal | BFS | $O(n + m)$ |
| Weights only 0 or 1 | 0-1 BFS | $O(n + m)$ |
| Weights $\ge 0$ | Dijkstra | $O((n + m) \log n)$ |
| Negative weights possible | Bellman-Ford | $O(n \cdot m)$ |
| All pairs, $n$ up to a few hundred | Floyd-Warshall | $O(n^3)$ |

## Brute force first

List every simple path from the source and keep the best. The number of paths grows exponentially. A simple repair is to keep a distance estimate `dist[v]` for each node and repeat "relax every edge" until nothing changes. That is Bellman-Ford and it costs $O(n \cdot m)$. Dijkstra needs the weights to be non-negative and in return runs near-linearly.

## The idea: relaxation and a greedy order

Relaxing an edge $v \to u$ with weight $w$ means: if `dist[v] + w < dist[u]`, set `dist[u] = dist[v] + w`. Distances only ever go down.

Dijkstra's rule: always process the unfinished node with the smallest `dist`. Its distance is now final, because any other route to it must first pass through some unfinished node that is at least as far, and weights cannot be negative. Use a min-heap (priority queue) to find that node quickly.

```viz
algo: dijkstra
input:
  n: 6
  edges: [[0, 1, 7], [0, 2, 9], [0, 5, 14], [1, 2, 10], [1, 3, 15], [2, 3, 11], [3, 4, 6], [4, 5, 9], [2, 5, 2]]
  start: 0
```

:::details[Why the popped node is final]
Suppose node $v$ has the smallest tentative distance $d$ among unfinished nodes. Any path to $v$ that is shorter than $d$ must leave the finished set through an edge into some unfinished node $x$. That node has `dist[x]` $\ge d$, and the rest of the path adds weights $\ge 0$, so the path is not shorter than $d$. Contradiction. With a negative edge the last step fails, which is why Dijkstra breaks.
:::

### Lazy deletion

A binary heap cannot cheaply lower the key of an item already inside. So when `dist[u]` improves, push a new pair `(newDist, u)` and leave the old one. When an old pair is popped later, its distance is larger than `dist[u]`, and you skip it. This is lazy deletion. Total pushes are at most $m$, so the cost is $O(m \log m) = O(m \log n)$.

```order
prompt: Arrange the Dijkstra main loop with lazy deletion.
lang: cpp
code: |
  dist[s] = 0;
  pq.push({0, s});
  while (!pq.empty()) {
      auto [d, v] = pq.top(); pq.pop();
      if (d > dist[v]) continue;
      for (auto [u, w] : g[v]) {
          if (d + w < dist[u]) {
              dist[u] = d + w;
              pq.push({dist[u], u});
          }
      }
  }
distractors:
  - "              pq.push({w, u});"
why: "The heap must be ordered by total distance from the source, not by the single edge weight. The stale-entry check d > dist[v] is what makes lazy deletion safe."
```

## Template: Dijkstra

Input: `n m s`, then $m$ undirected edges `a b w`. Print the distance from $s$ to every node, or `-1` if unreachable. C++ `priority_queue` is a max-heap, so `greater<>` flips it. Java `PriorityQueue` is already a min-heap, and `Long.compare` avoids overflow from subtraction.

```cpp
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

int main() {
    int n, m, s;
    scanf("%d %d %d", &n, &m, &s);
    vector<vector<pair<int, ll>>> g(n + 1);
    for (int i = 0; i < m; i++) {
        int a, b; ll w;
        scanf("%d %d %lld", &a, &b, &w);
        g[a].push_back({b, w});
        g[b].push_back({a, w});
    }
    const ll INF = (ll)1e18;
    vector<ll> dist(n + 1, INF);
    priority_queue<pair<ll, int>, vector<pair<ll, int>>, greater<pair<ll, int>>> pq;
    dist[s] = 0;
    pq.push({0, s});
    while (!pq.empty()) {
        auto [d, v] = pq.top(); pq.pop();
        if (d > dist[v]) continue;           // stale entry
        for (auto [u, w] : g[v]) {
            if (d + w < dist[u]) {
                dist[u] = d + w;
                pq.push({dist[u], u});
            }
        }
    }
    for (int v = 1; v <= n; v++)
        printf(v > 1 ? " %lld" : "%lld", dist[v] == INF ? -1LL : dist[v]);
    puts("");
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
        in.nextToken(); int s = (int) in.nval;
        int[] head = new int[n + 1], nxt = new int[2 * m], to = new int[2 * m];
        long[] wt = new long[2 * m];
        Arrays.fill(head, -1);
        int cnt = 0;
        for (int i = 0; i < m; i++) {
            in.nextToken(); int a = (int) in.nval;
            in.nextToken(); int b = (int) in.nval;
            in.nextToken(); long w = (long) in.nval;
            to[cnt] = b; wt[cnt] = w; nxt[cnt] = head[a]; head[a] = cnt++;
            to[cnt] = a; wt[cnt] = w; nxt[cnt] = head[b]; head[b] = cnt++;
        }
        final long INF = (long) 1e18;
        long[] dist = new long[n + 1];
        Arrays.fill(dist, INF);
        PriorityQueue<long[]> pq = new PriorityQueue<>((x, y) -> Long.compare(x[0], y[0]));
        dist[s] = 0;
        pq.add(new long[]{0, s});
        while (!pq.isEmpty()) {
            long[] top = pq.poll();
            long d = top[0];
            int v = (int) top[1];
            if (d > dist[v]) continue;       // stale entry
            for (int e = head[v]; e != -1; e = nxt[e]) {
                int u = to[e];
                if (d + wt[e] < dist[u]) {
                    dist[u] = d + wt[e];
                    pq.add(new long[]{dist[u], u});
                }
            }
        }
        StringBuilder sb = new StringBuilder();
        for (int v = 1; v <= n; v++) {
            if (v > 1) sb.append(' ');
            sb.append(dist[v] == INF ? -1 : dist[v]);
        }
        System.out.println(sb);
    }
}
```
```input
6 9 1
1 2 7
1 3 9
1 6 14
2 3 10
2 4 15
3 4 11
4 5 6
5 6 9
3 6 2
```
```output
0 7 9 20 20 11
```

### Walkthrough on the sample

| Popped `(d, v)` | What happens |
|---|---|
| `(0, 1)` | pushes `(7,2)`, `(9,3)`, `(14,6)` |
| `(7, 2)` | node 3 via 17 is worse than 9, node 4 gets 22 |
| `(9, 3)` | node 4 improves to 20, node 6 improves to 11 |
| `(11, 6)` | node 5 gets 20 |
| `(14, 6)` | stale, 14 > 11, skipped |
| `(20, 4)`, `(20, 5)` | no improvements |
| `(22, 4)` | stale, skipped |

```quiz
questions:
  - q: "Why does the loop contain `if (d > dist[v]) continue;`?"
    options:
      - It skips heap entries that were made obsolete by a later, shorter distance
      - It detects negative edges
      - It prevents going back to the parent
    answer: 0
    why: "Improving a distance pushes a new pair and leaves the old one in the heap. The old pair has a larger d than the current dist[v] and must be ignored."
  - q: "Edges have weights between 1 and 10^9 and n = m = 2 * 10^5. Which tool?"
    options:
      - BFS
      - Dijkstra with a heap
      - Floyd-Warshall
      - Bellman-Ford
    answer: 1
    why: "Weights are positive and the graph is large, so Dijkstra at O(m log n) fits. Floyd-Warshall would need about 8 * 10^15 steps and Bellman-Ford about 4 * 10^10."
```

## 0-1 BFS

When every weight is 0 or 1 you do not need a heap. Use a deque (double-ended queue): relaxing a weight-0 edge pushes the node to the front, a weight-1 edge pushes it to the back. The deque then stays sorted by distance, like a two-layer Dijkstra. Typical use: a grid where moving is free in some situations and costs 1 in others (1063B).

```cpp
deque<int> dq;
dist[s] = 0;
dq.push_back(s);
while (!dq.empty()) {
    int v = dq.front(); dq.pop_front();
    for (auto [u, w] : g[v]) {            // w is 0 or 1
        if (dist[v] + w < dist[u]) {
            dist[u] = dist[v] + w;
            if (w == 0) dq.push_front(u);
            else dq.push_back(u);
        }
    }
}
```
```java
ArrayDeque<Integer> dq = new ArrayDeque<>();
dist[s] = 0;
dq.addLast(s);
while (!dq.isEmpty()) {
    int v = dq.pollFirst();
    for (int[] e : g[v]) {                // e = {neighbour, w}, w is 0 or 1
        if (dist[v] + e[1] < dist[e[0]]) {
            dist[e[0]] = dist[v] + e[1];
            if (e[1] == 0) dq.addFirst(e[0]);
            else dq.addLast(e[0]);
        }
    }
}
```

## Bellman-Ford: negative edges

Relax every edge, and repeat. After $i$ rounds, every shortest path that uses at most $i$ edges is correct. A shortest path has at most $n - 1$ edges, so $n - 1$ rounds are enough. If round $n$ still improves something, a negative cycle (a cycle whose weights sum below zero) is reachable, and shortest distances do not exist because you can loop forever and go lower.

Input: `n m s`, then $m$ directed edges `a b w`. Print distances (`INF` if unreachable) or `negative cycle`.

```cpp
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

int main() {
    int n, m, s;
    scanf("%d %d %d", &n, &m, &s);
    vector<int> ea(m), eb(m);
    vector<ll> ew(m);
    for (int i = 0; i < m; i++) scanf("%d %d %lld", &ea[i], &eb[i], &ew[i]);
    const ll INF = (ll)1e18;
    vector<ll> dist(n + 1, INF);
    dist[s] = 0;
    bool neg = false;
    for (int round = 1; round <= n; round++) {
        bool changed = false;
        for (int i = 0; i < m; i++) {
            if (dist[ea[i]] == INF) continue;
            if (dist[ea[i]] + ew[i] < dist[eb[i]]) {
                dist[eb[i]] = dist[ea[i]] + ew[i];
                changed = true;
            }
        }
        if (!changed) break;
        if (round == n) neg = true;
    }
    if (neg) { puts("negative cycle"); return 0; }
    for (int v = 1; v <= n; v++) {
        if (v > 1) printf(" ");
        if (dist[v] == INF) printf("INF"); else printf("%lld", dist[v]);
    }
    puts("");
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
        in.nextToken(); int s = (int) in.nval;
        int[] ea = new int[m], eb = new int[m];
        long[] ew = new long[m];
        for (int i = 0; i < m; i++) {
            in.nextToken(); ea[i] = (int) in.nval;
            in.nextToken(); eb[i] = (int) in.nval;
            in.nextToken(); ew[i] = (long) in.nval;
        }
        final long INF = (long) 1e18;
        long[] dist = new long[n + 1];
        Arrays.fill(dist, INF);
        dist[s] = 0;
        boolean neg = false;
        for (int round = 1; round <= n; round++) {
            boolean changed = false;
            for (int i = 0; i < m; i++) {
                if (dist[ea[i]] == INF) continue;
                if (dist[ea[i]] + ew[i] < dist[eb[i]]) {
                    dist[eb[i]] = dist[ea[i]] + ew[i];
                    changed = true;
                }
            }
            if (!changed) break;
            if (round == n) neg = true;
        }
        if (neg) { System.out.println("negative cycle"); return; }
        StringBuilder sb = new StringBuilder();
        for (int v = 1; v <= n; v++) {
            if (v > 1) sb.append(' ');
            sb.append(dist[v] == INF ? "INF" : String.valueOf(dist[v]));
        }
        System.out.println(sb);
    }
}
```
```input
4 4 1
1 2 4
1 3 5
2 3 -3
3 4 2
```
```output
0 4 1 3
```

Stopping after $k$ rounds (using a copy of the previous round's array) gives the cheapest route with at most $k$ edges, which is the idea behind "Cheapest Flights Within K Stops".

:::truth
Bellman-Ford is rare in contests. Negative weights show up mostly as "detect a cycle that makes you richer". If you see a graph of up to $2 \cdot 10^5$ edges and negative weights, the intended solution is usually a different idea such as a DAG order or a potential trick.
:::

## Floyd-Warshall: all pairs

Let `d[i][j]` start as the edge weight (0 on the diagonal, INF otherwise). For each middle node $k$, test whether going $i \to k \to j$ beats the current best. After processing the first $k$ middle nodes, `d[i][j]` is the best path using only those as intermediate stops.

```cpp
for (int k = 1; k <= n; k++)
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n; j++)
            if (d[i][k] < INF && d[k][j] < INF)
                d[i][j] = min(d[i][j], d[i][k] + d[k][j]);
```
```java
for (int k = 1; k <= n; k++)
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n; j++)
            if (d[i][k] < INF && d[k][j] < INF)
                d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j]);
```

```quiz
q: In Floyd-Warshall, which loop must be the outermost one?
options:
  - The loop over the start node i
  - The loop over the middle node k
  - The loop over the end node j
answer: 1
why: "The state after step k says paths may use middle nodes 1..k. The whole table must be updated for one k before moving to the next one."
```

## Choosing and pitfalls

- Use `long long` distances. Ten edges of $10^9$ already pass the `int` range.
- `INF = 1e18` is safe to add one edge to. Never add two INFs, and check `dist != INF` before relaxing in Bellman-Ford and Floyd.
- Dijkstra with a negative edge does not crash. It prints a wrong answer. Check the constraints.
- Undirected edge means two directed edges.
- Rebuild a path by storing `par[u] = v` whenever you relax `dist[u]`, then walk back from the target.
- Many problems hide a state: (node, used a coupon), (node, has a horse). Run Dijkstra on pairs by making the state the node.
- Java: compare longs with `Long.compare`, not subtraction.

```cards
- q: What does relaxing edge v -> u with weight w do?
  a: "If dist[v] + w < dist[u], it sets dist[u] = dist[v] + w."
- q: Why can Dijkstra finalise the popped node?
  a: Every other route to it passes through an unfinished node that is at least as far, and non-negative weights cannot make it shorter.
- q: What is lazy deletion in Dijkstra?
  a: Push a new heap entry on every improvement and skip popped entries whose d is larger than the current dist.
- q: When do you use 0-1 BFS?
  a: When all weights are 0 or 1. Push to the front on weight 0 and to the back on weight 1, in a deque.
- q: How does Bellman-Ford detect a negative cycle?
  a: If a relaxation still succeeds in round n, a negative cycle is reachable from the source.
- q: Complexity of Dijkstra, Bellman-Ford and Floyd-Warshall?
  a: "$O(m \\log n)$, $O(n \\cdot m)$ and $O(n^3)$."
```

## Notes

:::notes
- Pick by weights: equal means BFS, 0 or 1 means 0-1 BFS, non-negative means Dijkstra, negative means Bellman-Ford, all pairs on small $n$ means Floyd-Warshall.
- Relax: if `dist[v] + w < dist[u]`, update. Dijkstra processes the closest unfinished node first.
- Lazy deletion: push on every improvement, skip popped pairs with `d > dist[v]`. $O(m \log n)$.
- C++ needs `greater<>` for a min-heap. Java `PriorityQueue` is min already. Use `long` and `INF = 1e18`.
- 0-1 BFS: deque, front for weight 0, back for weight 1. $O(n + m)$.
- Bellman-Ford: $n - 1$ rounds over all edges. A change in round $n$ means a negative cycle. $k$ rounds give paths with at most $k$ edges.
- Floyd-Warshall: middle node $k$ is the outer loop. $O(n^3)$, fine for $n \le 400$ or so.
- Dijkstra silently fails on negative edges. State-extended graphs (node plus a flag) are the common trick.
:::
