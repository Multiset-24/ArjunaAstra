---
title: Trees Basics
summary: Store a tree as adjacency lists, walk it with DFS and BFS, and compute parent, depth, subtree size and diameter in one linear pass.
minutes: 40
difficulty: intermediate
rating: [1100, 1500]
tags: [trees, dfs, bfs, graphs]
prereqs: [recursion, stacks-and-queues]
problems:
  - lc: maximum-depth-of-binary-tree
    name: Maximum Depth of Binary Tree
    difficulty: Easy
  - lc: diameter-of-binary-tree
    name: Diameter of Binary Tree
    difficulty: Easy
  - cses: 1674
    name: Subordinates
    core: true
    note: subtree sizes, exactly the second half of this lesson
  - cses: 1131
    name: Tree Diameter
  - cf: 1905B
    name: Begginer's Zelda
    rating: 1100
  - cf: 913B
    name: Christmas Spruce
    rating: 1200
  - cf: 1843D
    name: Apple Tree
    rating: 1200
  - cf: 1676G
    name: White-Black Balanced Subtrees
    rating: 1300
    core: true
    note: count something inside every subtree
  - cf: 1143C
    name: Queen
    rating: 1400
  - cf: 580C
    name: Kefa and Park
    rating: 1500
    core: true
    note: DFS that carries a running count down the path
  - cf: 982C
    name: Cut 'em all!
    rating: 1500
---

## The problem

A tree is a set of $n$ nodes connected by $n - 1$ edges, with no cycles and one path between any two nodes. Maps of roads between cities, folder structures and "who reports to whom" are trees.

Typical questions:

- Who is the parent of each node, and how deep is it?
- How many nodes are in the subtree below each node?
- What is the longest path in the tree (the diameter)?

## Brute force first

For each node, search the whole tree to find its distance to the root, or to count the nodes below it. Each search is $O(n)$, so $n$ nodes cost $O(n^2)$. For $n = 2 \cdot 10^5$ that is 40 billion steps.

One traversal that records everything on the way takes $O(n)$.

## Storing a tree: adjacency lists

Keep for every node the list of its neighbours. A tree has $n - 1$ edges, so the lists hold $2(n - 1)$ entries in total. The memory is $O(n)$. An $n \times n$ matrix would use $n^2$ cells and is almost never used for trees.

Rooting: a tree has no direction by itself. Pick a node as the root (often node 1). Then every other node has a parent (the neighbour toward the root) and children (the other neighbours). Leaves are nodes without children. The subtree of $v$ is $v$ and everything below it.

## DFS: walk it and watch

DFS (depth-first search) goes as deep as possible before backing up. Use the visualizer with a small tree (nodes are numbered from 0 here).

```viz
algo: graph-traversal
input:
  n: 7
  edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [4, 6]]
  start: 0
  mode: dfs
```

Switch `mode` to `bfs` to see the other order. BFS (breadth-first search) visits nodes level by level, so the depth of a node is the number of BFS layers needed to reach it.

```quiz
q: A connected graph has 10 nodes and 9 edges. What can you say?
options:
  - It is a tree
  - It may still contain a cycle
  - It has exactly 9 leaves
answer: 0
why: A connected graph on n nodes needs at least n - 1 edges. With exactly n - 1 edges there is no room for a cycle, so it is a tree. The number of leaves varies, a path has only 2.
```

## What to record during the walk

When DFS or BFS arrives at $v$ from its parent $p$:

| Value | Rule |
|---|---|
| `parent[v]` | the node we came from, $p$ |
| `depth[v]` | `depth[p] + 1`, with the root at 0 |
| `size[v]` | 1 plus the sum of `size[c]` over children $c$ (computed on the way back) |

The rule for children is "every neighbour except the parent". A tree has no cycles, so no `visited` array is needed. Comparing with the parent is enough.

## Template

Here are all of them in one program. It runs BFS from the root to get the visiting order, parents and depths. Then it processes the order backwards to add each node's size into its parent. A child always appears later in the BFS order than its parent, so going backwards handles children first.

The diameter uses a known trick. The farthest node from any start is one end of some longest path. The farthest node from that end is the other end. Two BFS runs find it.

```cpp
#include <bits/stdc++.h>
using namespace std;

int n;
vector<vector<int>> g;

// BFS from src: fills dist, par and the visiting order
void bfs(int src, vector<int> &dist, vector<int> &par, vector<int> &order) {
    dist.assign(n + 1, -1);
    par.assign(n + 1, 0);
    order.clear();
    dist[src] = 0;
    order.push_back(src);
    for (size_t i = 0; i < order.size(); i++) {
        int u = order[i];
        for (int v : g[u]) {
            if (v != par[u]) {
                par[v] = u;
                dist[v] = dist[u] + 1;
                order.push_back(v);
            }
        }
    }
}

int main() {
    cin >> n;
    g.assign(n + 1, {});
    for (int i = 0; i < n - 1; i++) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }
    vector<int> dep, par, order;
    bfs(1, dep, par, order);
    vector<int> sz(n + 1, 1);
    for (int i = n - 1; i >= 1; i--) sz[par[order[i]]] += sz[order[i]];
    int a = order.back();                       // farthest from the root
    vector<int> d2, p2, o2;
    bfs(a, d2, p2, o2);
    int diameter = d2[o2.back()];               // farthest from a
    cout << "parent:";
    for (int v = 1; v <= n; v++) cout << " " << par[v];
    cout << "\ndepth:";
    for (int v = 1; v <= n; v++) cout << " " << dep[v];
    cout << "\nsize:";
    for (int v = 1; v <= n; v++) cout << " " << sz[v];
    cout << "\ndiameter: " << diameter << "\n";
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    static int n;
    static List<Integer>[] g;

    // BFS from src: fills dist, par and returns the visiting order
    static int[] bfs(int src, int[] dist, int[] par) {
        Arrays.fill(dist, -1);
        Arrays.fill(par, 0);
        int[] order = new int[n];
        int head = 0, tail = 0;
        dist[src] = 0;
        order[tail++] = src;
        while (head < tail) {
            int u = order[head++];
            for (int v : g[u]) {
                if (v != par[u]) {
                    par[v] = u;
                    dist[v] = dist[u] + 1;
                    order[tail++] = v;
                }
            }
        }
        return order;
    }

    @SuppressWarnings("unchecked")
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        n = Integer.parseInt(br.readLine().trim());
        g = new List[n + 1];
        for (int i = 0; i <= n; i++) g[i] = new ArrayList<>();
        for (int i = 0; i < n - 1; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int u = Integer.parseInt(st.nextToken());
            int v = Integer.parseInt(st.nextToken());
            g[u].add(v);
            g[v].add(u);
        }
        int[] dep = new int[n + 1], par = new int[n + 1];
        int[] order = bfs(1, dep, par);
        int[] sz = new int[n + 1];
        Arrays.fill(sz, 1);
        for (int i = n - 1; i >= 1; i--) sz[par[order[i]]] += sz[order[i]];
        int a = order[n - 1];                       // farthest from the root
        int[] d2 = new int[n + 1], p2 = new int[n + 1];
        int[] o2 = bfs(a, d2, p2);
        int diameter = d2[o2[n - 1]];               // farthest from a
        StringBuilder sb = new StringBuilder("parent:");
        for (int v = 1; v <= n; v++) sb.append(' ').append(par[v]);
        sb.append("\ndepth:");
        for (int v = 1; v <= n; v++) sb.append(' ').append(dep[v]);
        sb.append("\nsize:");
        for (int v = 1; v <= n; v++) sb.append(' ').append(sz[v]);
        sb.append("\ndiameter: ").append(diameter).append('\n');
        System.out.print(sb);
    }
}
```
```input
7
1 2
1 3
2 4
2 5
3 6
5 7
```
```output
parent: 0 1 1 2 2 3 5
depth: 0 1 1 2 2 2 3
size: 7 4 2 1 2 1 1
diameter: 5
```

```order
prompt: Arrange the loop that adds every node's size into its parent. `order` is the BFS order from the root.
lang: cpp
code: |
  vector<int> sz(n + 1, 1);
  for (int i = n - 1; i >= 1; i--) {
      int v = order[i];
      sz[par[v]] += sz[v];
  }
distractors:
  - "  for (int i = 1; i < n; i++) {"
why: Going backwards through the BFS order visits every child before its parent, so a node's size is final when it is added into its parent.
```

## Walkthrough

For the sample tree, rooted at node 1:

- Edges 1-2, 1-3, 2-4, 2-5, 3-6, 5-7. BFS order: 1, 2, 3, 4, 5, 6, 7.
- Depths: node 1 is 0; nodes 2 and 3 are 1; nodes 4, 5, 6 are 2; node 7 is 3.
- Sizes, going backwards: node 7 adds 1 into node 5 (size 2). Node 6 adds 1 into node 3 (size 2). Node 5 adds 2 into node 2, node 4 adds 1: node 2 has size 4. Finally 2 and 3 add into node 1: size 7.
- Diameter: the farthest node from 1 is 7 at depth 3. From 7, the farthest is 6 at distance 5 (path 7-5-2-1-3-6). So the diameter is 5 edges.

```predict
lang: cpp
code: |
  int par[] = {0, 0, 1, 1, 2, 2};   // par[v] is the parent of node v, node 1 is the root
  int sz[]  = {0, 1, 1, 1, 1, 1};
  for (int v = 5; v >= 2; v--) sz[par[v]] += sz[v];
  cout << sz[1] << " " << sz[2];
output: "5 3"
why: "Nodes 4 and 5 are children of 2, so sz[2] becomes 3. Node 2 (size 3) and node 3 (size 1) are children of 1, so sz[1] becomes 1 + 3 + 1 = 5. Parents have smaller numbers here, so counting down handles children first."
```

## Recursive DFS

Recursion is shorter and also common:

```cpp
void dfs(int u, int p) {
    sz[u] = 1;
    for (int v : g[u]) {
        if (v == p) continue;
        dep[v] = dep[u] + 1;
        dfs(v, u);
        sz[u] += sz[v];          // child is finished: its size is ready
    }
}
```
```java
static void dfs(int u, int p) {
    sz[u] = 1;
    for (int v : g[u]) {
        if (v == p) continue;
        dep[v] = dep[u] + 1;
        dfs(v, u);
        sz[u] += sz[v];          // child is finished: its size is ready
    }
}
```

The risk is depth. A path-shaped tree with $2 \cdot 10^5$ nodes recurses $2 \cdot 10^5$ levels. That usually works in C++ on Codeforces, but Java's default thread stack overflows around 10 to 20 thousand levels. In Java either use the BFS-order version above, or run `main` inside `new Thread(null, runnable, "", 1 << 28)`.

```blanks
prompt: Complete the recursive DFS by filling in what is skipped and what is accumulated.
lang: cpp
code: |
  for (int v : g[u]) {
      if (v == [[p]]) continue;
      dfs(v, u);
      sz[u] += [[sz[v]]];
  }
why: The only neighbour that must be skipped is the parent. After the call returns, the child's subtree size is complete and is added to its parent.
```

## Complexity

- Reading the tree: $O(n)$. Each traversal visits every node and each edge twice: $O(n)$.
- Memory: $O(n)$.
- Diameter by two BFS: $O(n)$. This trick needs unweighted edges (or non-negative weights).

## Pitfalls

- Forgetting the second direction when adding an edge: `g[u]` and `g[v]` both need it.
- Skipping the wrong neighbour. In a tree only the parent must be skipped. Skipping all visited nodes also works, but passing the parent is simpler and cheaper.
- Counting diameter in nodes versus edges. Read the statement. Here it is in edges.
- Deep recursion in Java (see above).
- 1-indexed input stored in 0-indexed arrays. Size arrays `n + 1` when nodes start at 1.
- Assuming the input is rooted. A statement may say "node 1 is the root", or not give a root at all, in which case you choose.

```quiz
q: In a rooted tree with n nodes, what is the sum of the subtree sizes of all nodes?
options:
  - n
  - The sum of (depth + 1) over all nodes
  - n * (n - 1) / 2
answer: 1
why: A node v is counted once in the subtree of every ancestor and itself, which is depth(v) + 1 times. For a path of 3 nodes the sizes are 3 + 2 + 1 = 6 = 1 + 2 + 3, and for a star it is n + (n - 1).
```

:::truth
Plain tree traversal is rarely the whole problem, but nearly every harder tree problem (tree DP, LCA, rerooting) starts with these three arrays: parent, depth and subtree size. Get them out without bugs, quickly, and the later topics become small additions.
:::

```cards
- q: How many edges does a tree with n nodes have?
  a: n - 1. It is connected and has no cycles.
- q: What do you skip when walking a rooted tree with DFS?
  a: Only the parent. There are no cycles, so no visited array is needed.
- q: How do you compute subtree sizes?
  a: size[v] = 1 + sum of size[child]. In DFS add it after the recursive call. With a BFS order, go backwards and add each node into its parent.
- q: How do you find the diameter of a tree?
  a: BFS from any node to find the farthest node a, then BFS from a. The largest distance found is the diameter (edges). $O(n)$.
- q: Why can recursive DFS fail on a tree with 200000 nodes?
  a: A path-shaped tree recurses 200000 levels deep, which can overflow the stack, especially in Java. Use BFS order or a bigger thread stack.
```

## Notes

:::notes
- Tree: n nodes, n - 1 edges, connected, no cycles, one path between any two nodes.
- Store with adjacency lists (g[u] holds neighbours). Add each edge in both directions.
- Choose a root, then parent, children, depth and subtree size are defined.
- DFS/BFS on a tree: skip only the parent. depth[v] = depth[parent] + 1.
- size[v] = 1 + sum of children sizes. With BFS order, process it backwards.
- Diameter: BFS to the farthest node a, BFS from a, answer = largest distance. O(n).
- Recursive DFS can overflow the stack on a path of 2e5 nodes, especially in Java.
- Sum of subtree sizes = sum of (depth + 1) over all nodes.
:::
