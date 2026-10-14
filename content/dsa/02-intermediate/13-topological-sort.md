---
title: Topological Sort
summary: Order the nodes of a directed graph so every edge points forward, detect cycles with Kahn's algorithm or DFS, and run DP over the order.
minutes: 40
difficulty: intermediate
rating: [1500, 2000]
tags: [graphs, topological-sort, dag, dp, dfs]
prereqs: [graphs-bfs-dfs]
problems:
  - lc: course-schedule
    name: Course Schedule
    difficulty: Medium
  - lc: course-schedule-ii
    name: Course Schedule II
    difficulty: Medium
  - cses: 1679
    name: Course Schedule
    core: true
    note: print the order, or IMPOSSIBLE on a cycle
  - lc: find-eventual-safe-states
    name: Find Eventual Safe States
    difficulty: Medium
    note: run Kahn on the reversed graph
  - cses: 1680
    name: Longest Flight Route
    note: DP over a DAG with a path to print
  - cf: 510C
    name: Fox And Names
    rating: 1600
    note: build the letter order from adjacent names, then sort
  - cf: 919D
    name: Substring
    rating: 1700
    core: true
    note: DP on a DAG for every letter, a cycle means infinity
  - cf: 1572A
    name: Book
    rating: 1800
    note: longest chain with a twist on the cost of each edge
  - cf: 1385E
    name: Directing Edges
    rating: 2000
    core: true
    note: order the directed edges first, then orient the rest by that order
  - cf: 1131D
    name: Gourmet choice
    rating: 2000
    note: merge equal items with DSU, then longest path on layers
---

## The problem

A DAG (directed acyclic graph) is a directed graph with no directed cycle. A topological order lists all nodes so that for every edge $u \to v$, $u$ comes before $v$.

Everyday meaning: tasks with prerequisites, build steps that depend on each other, courses that need other courses. The order tells you what can be done first.

Two facts:

- A topological order exists if and only if the graph has no directed cycle.
- It is usually not unique. Independent nodes can appear in any relative order.

## Brute force first

Try all $n!$ orderings and check every edge. Hopeless beyond $n = 10$.

A smarter version: repeatedly scan for a node with no incoming edge from the remaining nodes, remove it, repeat. Each scan costs $O(n + m)$ and you do it $n$ times, $O((n + m) \cdot n)$. Kahn's algorithm below is the same idea with the scanning replaced by counters.

## Kahn's algorithm

The in-degree of a node is the number of edges coming into it. A node with in-degree 0 has no unfinished prerequisite, so it can go next.

1. Count the in-degree of every node.
2. Put all nodes with in-degree 0 into a queue.
3. Pop a node, append it to the order. For each outgoing edge $v \to u$, decrease `indeg[u]`. If it reaches 0, push $u$.
4. If the order holds fewer than $n$ nodes, the leftover nodes sit on or behind a cycle.

```viz
algo: topo-sort
input:
  n: 6
  edges: [[5, 2], [5, 0], [4, 0], [4, 1], [2, 3], [3, 1]]
```

```order
prompt: Arrange Kahn's loop (nodes 1..n, g is the adjacency list, indeg is filled).
lang: cpp
code: |
  for (int i = 1; i <= n; i++) if (indeg[i] == 0) q.push(i);
  while (!q.empty()) {
      int v = q.front(); q.pop();
      order.push_back(v);
      for (int u : g[v])
          if (--indeg[u] == 0) q.push(u);
  }
distractors:
  - "          if (++indeg[u] == 0) q.push(u);"
why: "Taking v out of the graph removes its outgoing edges, so each neighbour loses one incoming edge. Increasing the count would never reach 0."
```

```predict
lang: cpp
prompt: What does this print?
code: |
  int n = 4;
  vector<pair<int, int>> e = {{0, 1}, {0, 2}, {1, 3}, {2, 3}};
  vector<int> indeg(n, 0);
  for (auto [a, b] : e) indeg[b]++;
  for (int x : indeg) cout << x << " ";
output: 0 1 1 2
why: Node 0 has no incoming edge, nodes 1 and 2 each have one (from 0), and node 3 has two (from 1 and 2). Only node 0 starts in the queue.
```

### Template: order, cycle check, and DP

Input: `n m`, then $m$ directed edges `a b` (meaning $a \to b$). Print a topological order, then the length (in edges) of the longest path, or `IMPOSSIBLE` if there is a cycle. The queue is a min-heap, so among available nodes the smallest label goes first. That gives the lexicographically smallest order, a common requirement. Use a plain queue when any order is fine.

`dp[v]` is the longest path ending at $v$. When $v$ is popped, all its predecessors are already done, so `dp[v]` is final and can be pushed forward.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, m;
    scanf("%d %d", &n, &m);
    vector<vector<int>> g(n + 1);
    vector<int> indeg(n + 1, 0), dp(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int a, b;
        scanf("%d %d", &a, &b);
        g[a].push_back(b);
        indeg[b]++;
    }
    priority_queue<int, vector<int>, greater<int>> pq;
    for (int v = 1; v <= n; v++)
        if (indeg[v] == 0) pq.push(v);
    vector<int> order;
    while (!pq.empty()) {
        int v = pq.top(); pq.pop();
        order.push_back(v);
        for (int u : g[v]) {
            dp[u] = max(dp[u], dp[v] + 1);
            if (--indeg[u] == 0) pq.push(u);
        }
    }
    if ((int)order.size() < n) { puts("IMPOSSIBLE"); return 0; }
    for (int i = 0; i < n; i++) printf(i ? " %d" : "%d", order[i]);
    printf("\n%d\n", *max_element(dp.begin(), dp.end()));
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
        List<List<Integer>> g = new ArrayList<>();
        for (int i = 0; i <= n; i++) g.add(new ArrayList<>());
        int[] indeg = new int[n + 1], dp = new int[n + 1];
        for (int i = 0; i < m; i++) {
            in.nextToken(); int a = (int) in.nval;
            in.nextToken(); int b = (int) in.nval;
            g.get(a).add(b);
            indeg[b]++;
        }
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        for (int v = 1; v <= n; v++)
            if (indeg[v] == 0) pq.add(v);
        List<Integer> order = new ArrayList<>();
        int best = 0;
        while (!pq.isEmpty()) {
            int v = pq.poll();
            order.add(v);
            best = Math.max(best, dp[v]);
            for (int u : g.get(v)) {
                dp[u] = Math.max(dp[u], dp[v] + 1);
                if (--indeg[u] == 0) pq.add(u);
            }
        }
        if (order.size() < n) { System.out.println("IMPOSSIBLE"); return; }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            if (i > 0) sb.append(' ');
            sb.append(order.get(i));
        }
        System.out.println(sb);
        System.out.println(best);
    }
}
```
```input
6 6
6 3
6 1
5 1
5 2
3 4
4 2
```
```output
5 6 1 3 4 2
3
```

### Walkthrough

- In-degrees: node 1 has 2 (from 6 and 5), node 2 has 2 (from 5 and 4), nodes 3 and 4 have 1, nodes 5 and 6 have 0.
- Heap starts as {5, 6}. Pop 5: nodes 1 and 2 drop to 1. Pop 6: node 3 and node 1 drop to 0, both enter the heap.
- Pop 1 (no outgoing edges), pop 3 (frees 4), pop 4 (frees 2), pop 2.
- The longest chain is $6 \to 3 \to 4 \to 2$, three edges.

```quiz
questions:
  - q: Which of these graphs has a topological order?
    options:
      - "a -> b, b -> c, c -> a"
      - "a -> b, a -> c, b -> c"
      - "a -> b, b -> a"
    answer: 1
    why: "The second graph is a DAG, a b c is a valid order. The other two contain a directed cycle, and no node on a cycle can come before all the others."
  - q: Kahn's algorithm finishes with only 4 of 5 nodes in the order. What does that mean?
    options:
      - The graph has a directed cycle
      - The graph is disconnected
      - The order is not unique
    answer: 0
    why: "Nodes on a cycle (and nodes that depend on them) never reach in-degree 0. A disconnected DAG still gets fully ordered."
```

## DFS version

Run DFS, and append a node to a list when it is finished (after all its children). Reverse the list to get a topological order. For cycle detection, keep three states per node: 0 unvisited, 1 on the current DFS path, 2 finished. Meeting a node in state 1 means an edge back to an ancestor, which is a cycle.

```cpp
vector<int> color(n + 1, 0), order;
bool cyc = false;
void dfs(int v) {
    color[v] = 1;
    for (int u : g[v]) {
        if (color[u] == 1) cyc = true;
        else if (color[u] == 0) dfs(u);
    }
    color[v] = 2;
    order.push_back(v);      // reverse(order) at the end
}
```
```java
static int[] color;           // size n + 1, all 0
static ArrayList<Integer> order = new ArrayList<>();
static boolean cyc = false;
static void dfs(int v) {
    color[v] = 1;
    for (int u : g.get(v)) {
        if (color[u] == 1) cyc = true;
        else if (color[u] == 0) dfs(u);
    }
    color[v] = 2;
    order.add(v);            // Collections.reverse(order) at the end
}
```

```blanks
prompt: Fill in the three DFS states.
lang: cpp
code: |
  void dfs(int v) {
      color[v] = 1;
      for (int u : g[v]) {
          if (color[u] == [[1]]) cyc = true;
          else if (color[u] == [[0]]) dfs(u);
      }
      color[v] = [[2]];
      order.push_back(v);
  }
why: State 1 means "on the current path", so meeting it again closes a cycle. State 0 means not seen yet, so recurse. State 2 means finished, and the node is appended only now.
```

:::warn
The parent trick from undirected cycle detection does not work here. In a directed graph two paths may reach the same node without any cycle, for example a to b, a to c, c to b. Use the three states, or Kahn's count.
:::

Kahn avoids recursion, so it is the safer default for $n$ near $2 \cdot 10^5$. DFS is handy when you already need DFS finish times.

## Where it is used

| Use | How |
|---|---|
| Valid build or study order | print the Kahn order |
| "Is there a cycle?" in a directed graph | fewer than $n$ nodes in the order |
| Longest or shortest path in a DAG | DP in topological order, $O(n + m)$ |
| Count paths from $s$ to $t$ | `ways[u] += ways[v]` along the order |
| Fewest rounds when independent tasks run together | number of Kahn layers (process the queue one layer at a time) |
| Lexicographically smallest order | min-heap instead of a queue |

:::key
Whenever a DP has a dependency graph, a topological order is just the evaluation order that makes every dependency ready. DP over a DAG is the general picture behind the DP lessons that follow.
:::

If the queue holds exactly one node at every step, the topological order is unique. Two nodes in the queue at once means a choice exists.

## Complexity and pitfalls

- Kahn and DFS both run in $O(n + m)$. With a min-heap, $O((n + m) \log n)$.
- Count in-degrees before the first pop, and count each edge once (parallel edges count twice, and are also decremented twice).
- Compare `order.size()` with $n$ to detect a cycle. Do not rely on a flag set inside the loop.
- Edge direction matters. In prerequisite problems, "a needs b" is the edge $b \to a$. Swap it and your order comes out reversed.
- For "which nodes are safe" style questions, reverse every edge and run Kahn from the sinks (nodes with no outgoing edge).
- Recursive DFS on a long chain can overflow the stack. See the BFS and DFS lesson for the remedies.

:::truth
The algorithm is short. The contest difficulty is in building the graph: from adjacent names (510C), from ranking comparisons (1131D) or from merged equal elements. Practise deciding what the nodes and edges are before touching the code.
:::

```cards
- q: What is a topological order?
  a: A list of all nodes where every edge u -> v has u before v. It exists exactly when the directed graph has no cycle.
- q: Outline Kahn's algorithm.
  a: Queue the nodes with in-degree 0. Pop one, output it, decrement its neighbours' in-degrees, queue those that reach 0.
- q: How does Kahn's algorithm reveal a cycle?
  a: Fewer than n nodes end up in the order, because nodes on a cycle never reach in-degree 0.
- q: How do you get a topological order from DFS?
  a: Append each node after its children are done, then reverse the list. A node found again while still on the path means a cycle.
- q: How do you compute the longest path in a DAG?
  a: "Process nodes in topological order and set dp[u] = max(dp[u], dp[v] + 1) for each edge v -> u."
- q: How do you get the lexicographically smallest topological order?
  a: Use a min-heap instead of a queue in Kahn's algorithm.
```

## Notes

:::notes
- Topological order = nodes listed so every edge points forward. Exists iff no directed cycle (DAG).
- Kahn: in-degrees, queue of zeros, pop and decrement. Fewer than $n$ output nodes means a cycle. $O(n + m)$.
- DFS: finish order reversed. Three states (new, on path, done); meeting "on path" is a cycle.
- Min-heap instead of a queue gives the lexicographically smallest order. One node in the queue at all times means the order is unique.
- DP on a DAG: process in topological order. Longest path, number of paths, earliest finish time.
- Prerequisite "a needs b" is the edge $b \to a$. Check the direction first.
- For "safe" or "can finish" questions, try reversing the edges and running Kahn from the sinks.
:::
