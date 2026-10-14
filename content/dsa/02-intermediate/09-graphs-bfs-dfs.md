---
title: Graphs, BFS and DFS
summary: Store a graph as adjacency lists, find shortest paths on unweighted graphs and grids with BFS, and count components, detect cycles and 2-colour with DFS.
minutes: 50
difficulty: intermediate
rating: [1200, 1700]
tags: [graphs, bfs, dfs, grids]
prereqs: [trees-basics, stacks-and-queues]
problems:
  - cf: 500A
    name: New Year Transportation
    rating: 1000
  - cf: 1829E
    name: The Lakes
    rating: 1100
    core: true
    note: components on a grid, the simplest real use of DFS or BFS
  - lc: number-of-islands
    name: Number of Islands
    difficulty: Medium
  - cf: 217A
    name: Ice Skating
    rating: 1200
    note: components where "connected" needs one observation
  - cses: 1667
    name: Message Route
    core: true
    note: BFS plus printing the path
  - lc: is-graph-bipartite
    name: Is Graph Bipartite?
    difficulty: Medium
  - cf: 977E
    name: Cyclic Components
    rating: 1500
  - cf: 687A
    name: NP-Hard Problem
    rating: 1500
    core: true
    note: 2-colouring with a twist in the output
  - cf: 1037D
    name: Valid BFS?
    rating: 1700
    note: what exactly can a BFS order look like
  - cf: 1365D
    name: Solve The Maze
    rating: 1700
    note: grid reachability with a greedy wall placement
---

## The problem

A graph is a set of nodes (also called vertices) joined by edges. An edge can be undirected (works both ways, like a road) or directed (one way, like a link between web pages). Cities and roads, friends in a network, cells of a maze and "task A must come before task B" are all graphs.

Questions that come up again and again:

- Can I get from node $a$ to node $b$?
- What is the fewest number of edges on a path from $a$ to $b$?
- How many separate pieces (connected components) does the graph have?
- Is there a cycle (a path that returns to its start)?
- Can the nodes be split into two groups with every edge going between the groups (bipartite)?

Notation: $n$ nodes, $m$ edges.

## Brute force first

Keep the graph as a plain list of $m$ edges. To visit the neighbours of one node you scan all $m$ edges. A traversal touches $n$ nodes, so it costs $O(n \cdot m)$. With $n = m = 2 \cdot 10^5$ that is $4 \cdot 10^{10}$ steps.

An $n \times n$ table (adjacency matrix) answers "is there an edge between $a$ and $b$" instantly, but it needs $n^2$ cells and listing the neighbours of a node costs $O(n)$.

## Storing a graph

| Structure | Memory | Neighbours of $v$ | Edge $a$-$b$ exists? |
|---|---|---|---|
| Edge list | $O(m)$ | scan everything | scan everything |
| Adjacency matrix | $O(n^2)$ | $O(n)$ | $O(1)$ |
| Adjacency list | $O(n + m)$ | $O(\deg v)$ | $O(\deg v)$ |

The degree $\deg v$ is the number of edges at $v$. The adjacency list (a vector of neighbours per node) is the default in contests.

```quiz
q: A graph has n = 200000 nodes and m = 200000 edges. How many cells would an adjacency matrix need?
options:
  - About 4 * 10^10, far too much memory
  - About 4 * 10^5
  - About 2 * 10^5
answer: 0
why: "The matrix has n * n = 4 * 10^10 cells. The adjacency list holds only n + 2m = 6 * 10^5 entries for an undirected graph."
```

For an undirected edge $a$-$b$, push $b$ into the list of $a$ and $a$ into the list of $b$. Forgetting one direction is a classic bug.

## BFS: layer by layer

BFS (breadth-first search) starts at a source node and visits all nodes at distance 1, then all at distance 2, and so on. A queue (first in, first out) gives exactly this order.

```viz
algo: graph-traversal
input:
  n: 7
  edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [4, 6], [5, 6]]
  start: 0
  mode: bfs
```

:::key
In BFS the first time a node is reached is along a shortest path. So `dist[u] = dist[v] + 1` at that moment is final, and `dist[u] == -1` doubles as the "not seen yet" mark.
:::

```order
prompt: Arrange the BFS loop that fills dist from a source s.
lang: cpp
code: |
  queue<int> q;
  dist[s] = 0;
  q.push(s);
  while (!q.empty()) {
      int v = q.front(); q.pop();
      for (int u : g[v]) {
          if (dist[u] != -1) continue;
          dist[u] = dist[v] + 1;
          q.push(u);
      }
  }
distractors:
  - "      int v = q.back(); q.pop();"
why: "Taking from the back would make the queue behave like a stack. The source gets distance 0 before the loop, and a node is marked when it is pushed, never later."
```

### Template: shortest path with the path itself

Input: `n m s t`, then $m$ undirected edges (1-indexed). Print the fewest edges from $s$ to $t$ and one such path, or `-1`. `par[u]` remembers who discovered $u$, so walking from $t$ back to $s$ gives the path.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, m, s, t;
    scanf("%d %d %d %d", &n, &m, &s, &t);
    vector<vector<int>> g(n + 1);
    for (int i = 0; i < m; i++) {
        int a, b;
        scanf("%d %d", &a, &b);
        g[a].push_back(b);
        g[b].push_back(a);
    }
    vector<int> dist(n + 1, -1), par(n + 1, 0);
    queue<int> q;
    dist[s] = 0;
    q.push(s);
    while (!q.empty()) {
        int v = q.front(); q.pop();
        for (int u : g[v]) {
            if (dist[u] != -1) continue;
            dist[u] = dist[v] + 1;
            par[u] = v;
            q.push(u);
        }
    }
    if (dist[t] == -1) { puts("-1"); return 0; }
    vector<int> path;
    for (int v = t; v != 0; v = par[v]) path.push_back(v);
    reverse(path.begin(), path.end());
    printf("%d\n", dist[t]);
    for (size_t i = 0; i < path.size(); i++)
        printf(i ? " %d" : "%d", path[i]);
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
        in.nextToken(); int t = (int) in.nval;
        List<List<Integer>> g = new ArrayList<>();
        for (int i = 0; i <= n; i++) g.add(new ArrayList<>());
        for (int i = 0; i < m; i++) {
            in.nextToken(); int a = (int) in.nval;
            in.nextToken(); int b = (int) in.nval;
            g.get(a).add(b);
            g.get(b).add(a);
        }
        int[] dist = new int[n + 1], par = new int[n + 1];
        Arrays.fill(dist, -1);
        ArrayDeque<Integer> q = new ArrayDeque<>();
        dist[s] = 0;
        q.add(s);
        while (!q.isEmpty()) {
            int v = q.poll();
            for (int u : g.get(v)) {
                if (dist[u] != -1) continue;
                dist[u] = dist[v] + 1;
                par[u] = v;
                q.add(u);
            }
        }
        if (dist[t] == -1) { System.out.println(-1); return; }
        ArrayList<Integer> path = new ArrayList<>();
        for (int v = t; v != 0; v = par[v]) path.add(v);
        Collections.reverse(path);
        StringBuilder sb = new StringBuilder();
        sb.append(dist[t]).append("\n");
        for (int i = 0; i < path.size(); i++) {
            if (i > 0) sb.append(" ");
            sb.append(path.get(i));
        }
        System.out.println(sb);
    }
}
```
```input
6 6 1 6
1 2
1 3
2 4
3 4
4 5
5 6
```
```output
4
1 2 4 5 6
```

:::truth
BFS finds fewest edges, not cheapest route. As soon as edges have different costs, BFS can be wrong. The next lessons handle that.
:::

## Grids are graphs

Each cell is a node. Its neighbours are the four cells up, down, left and right that are inside the grid and not a wall. You never build the edge list. A pair of direction arrays does the job.

```viz
algo: grid-bfs
input:
  grid:
    - "S..#...."
    - ".#.#.##."
    - ".#...#.."
    - ".####.#."
    - "......#T"
```

```blanks
prompt: Complete the neighbour loop for a grid with n rows and m columns.
lang: cpp
code: |
  int dr[4] = {1, -1, 0, 0};
  int dc[4] = {0, 0, 1, -1};
  for (int k = 0; k < 4; k++) {
      int nr = r + dr[k], nc = c + [[dc[k]]];
      if (nr < 0 || nr >= n || nc < 0 || nc >= [[m]]) continue;
      if (a[nr][nc] == '#' || d[nr][nc] != [[-1]]) continue;
  }
why: "Rows are bounded by n and columns by m. A cell is skipped when it is a wall or already has a distance."
```

### Template: shortest path in a maze

Input: `n m`, then $n$ rows of `.`, `#`, `S`, `T`. Print the fewest steps from `S` to `T`, or `-1`. This is the exact grid the visualizer shows.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<string> a(n);
    for (auto &row : a) cin >> row;
    vector<vector<int>> d(n, vector<int>(m, -1));
    queue<pair<int, int>> q;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < m; j++)
            if (a[i][j] == 'S') { d[i][j] = 0; q.push({i, j}); }
    int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
    int ans = -1;
    while (!q.empty()) {
        auto [r, c] = q.front(); q.pop();
        if (a[r][c] == 'T') { ans = d[r][c]; break; }
        for (int k = 0; k < 4; k++) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
            if (a[nr][nc] == '#' || d[nr][nc] != -1) continue;
            d[nr][nc] = d[r][c] + 1;
            q.push({nr, nc});
        }
    }
    cout << ans << "\n";
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int n = Integer.parseInt(st.nextToken()), m = Integer.parseInt(st.nextToken());
        char[][] a = new char[n][];
        for (int i = 0; i < n; i++) a[i] = br.readLine().trim().toCharArray();
        int[][] d = new int[n][m];
        for (int[] row : d) Arrays.fill(row, -1);
        int[] q = new int[n * m];
        int head = 0, tail = 0;
        for (int i = 0; i < n; i++)
            for (int j = 0; j < m; j++)
                if (a[i][j] == 'S') { d[i][j] = 0; q[tail++] = i * m + j; }
        int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
        int ans = -1;
        while (head < tail) {
            int cur = q[head++];
            int r = cur / m, c = cur % m;
            if (a[r][c] == 'T') { ans = d[r][c]; break; }
            for (int k = 0; k < 4; k++) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
                if (a[nr][nc] == '#' || d[nr][nc] != -1) continue;
                d[nr][nc] = d[r][c] + 1;
                q[tail++] = nr * m + nc;
            }
        }
        System.out.println(ans);
    }
}
```
```input
5 8
S..#....
.#.#.##.
.#...#..
.####.#.
......#T
```
```output
15
```

Starting BFS from several cells at once (put all of them in the queue with distance 0) gives the distance to the nearest source for every cell. This "multi-source BFS" is behind many grid problems.

## DFS: go deep, then back up

DFS (depth-first search) follows one path as far as it goes, then backs up and tries the next branch. It uses the call stack instead of a queue. It does not give shortest paths, but it is the easiest way to explore a whole piece of the graph.

Three jobs for DFS on an undirected graph:

- **Components:** start a DFS from every node not yet seen. The number of starts is the number of components.
- **Cycle:** during DFS, meeting an already seen node through a different edge than the one you came by means a cycle.
- **Reachability:** after one DFS from $a$, `seen[b]` tells you whether $b$ is reachable.

Compare edges, not nodes, for "the one you came by". Two parallel edges between the same pair of nodes form a cycle, and comparing parents would miss it. Template: print the number of components and whether a cycle exists.

```cpp
#include <bits/stdc++.h>
using namespace std;

vector<vector<pair<int, int>>> g;  // (neighbour, edge id)
vector<char> seen;
bool cyc = false;

void dfs(int v, int parentEdge) {
    seen[v] = 1;
    for (auto [u, id] : g[v]) {
        if (id == parentEdge) continue;
        if (seen[u]) cyc = true;
        else dfs(u, id);
    }
}

int main() {
    int n, m;
    scanf("%d %d", &n, &m);
    g.assign(n + 1, {});
    seen.assign(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int a, b;
        scanf("%d %d", &a, &b);
        g[a].push_back({b, i});
        g[b].push_back({a, i});
    }
    int comps = 0;
    for (int v = 1; v <= n; v++)
        if (!seen[v]) { comps++; dfs(v, -1); }
    printf("%d\n%s\n", comps, cyc ? "cycle" : "no cycle");
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    static ArrayList<int[]>[] g;
    static boolean[] seen;
    static boolean cyc = false;

    static void dfs(int v, int parentEdge) {
        seen[v] = true;
        for (int[] e : g[v]) {
            if (e[1] == parentEdge) continue;
            if (seen[e[0]]) cyc = true;
            else dfs(e[0], e[1]);
        }
    }

    @SuppressWarnings("unchecked")
    public static void main(String[] args) throws Exception {
        Thread th = new Thread(null, () -> {
            try {
                StreamTokenizer in = new StreamTokenizer(new BufferedReader(new InputStreamReader(System.in)));
                in.nextToken(); int n = (int) in.nval;
                in.nextToken(); int m = (int) in.nval;
                g = new ArrayList[n + 1];
                for (int i = 0; i <= n; i++) g[i] = new ArrayList<>();
                seen = new boolean[n + 1];
                for (int i = 0; i < m; i++) {
                    in.nextToken(); int a = (int) in.nval;
                    in.nextToken(); int b = (int) in.nval;
                    g[a].add(new int[]{b, i});
                    g[b].add(new int[]{a, i});
                }
                int comps = 0;
                for (int v = 1; v <= n; v++)
                    if (!seen[v]) { comps++; dfs(v, -1); }
                System.out.println(comps);
                System.out.println(cyc ? "cycle" : "no cycle");
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }, "main", 1 << 28);
        th.start();
        th.join();
    }
}
```
```input
7 5
1 2
2 3
3 1
4 5
5 6
```
```output
3
cycle
```

:::warn
Recursive DFS on a path-shaped graph with $2 \cdot 10^5$ nodes recurses $2 \cdot 10^5$ levels deep. Codeforces gives a large stack, so this usually works there. Other judges may crash, and Java needs a thread with a big stack as shown. When in doubt, write DFS with an explicit stack or use BFS, which has no recursion.
:::

```predict
lang: cpp
prompt: Which distances does this program print?
code: |
  vector<vector<int>> g(4);
  g[0] = {1, 2};
  g[1] = {3};
  g[2] = {3};
  vector<int> d(4, -1);
  queue<int> q;
  d[0] = 0; q.push(0);
  while (!q.empty()) {
      int v = q.front(); q.pop();
      for (int u : g[v]) if (d[u] < 0) { d[u] = d[v] + 1; q.push(u); }
  }
  for (int x : d) cout << x << " ";
output: 0 1 1 2
why: Node 3 is first reached from node 1 at distance 2. The second route through node 2 is skipped because d[3] is already set.
```

## Bipartite check: 2-colouring

A graph is bipartite when you can colour every node with one of two colours so that each edge joins different colours. Equivalent fact: it is bipartite exactly when it has no cycle of odd length.

Colour the source 0 and every newly found neighbour with the opposite colour. If an edge joins two nodes of the same colour, the answer is no. Run it from every uncoloured node, as with components.

```cpp
vector<int> color(n + 1, -1);   // -1 = not coloured yet
bool ok = true;
for (int s = 1; s <= n && ok; s++) {
    if (color[s] != -1) continue;
    color[s] = 0;
    queue<int> q; q.push(s);
    while (!q.empty() && ok) {
        int v = q.front(); q.pop();
        for (int u : g[v]) {
            if (color[u] == -1) { color[u] = color[v] ^ 1; q.push(u); }
            else if (color[u] == color[v]) ok = false;
        }
    }
}
```
```java
int[] color = new int[n + 1];
Arrays.fill(color, -1);          // -1 = not coloured yet
boolean ok = true;
for (int s = 1; s <= n && ok; s++) {
    if (color[s] != -1) continue;
    color[s] = 0;
    ArrayDeque<Integer> q = new ArrayDeque<>();
    q.add(s);
    while (!q.isEmpty() && ok) {
        int v = q.poll();
        for (int u : g.get(v)) {
            if (color[u] == -1) { color[u] = color[v] ^ 1; q.add(u); }
            else if (color[u] == color[v]) ok = false;
        }
    }
}
```

```quiz
q: Which graph is NOT bipartite?
options:
  - A path of 4 nodes
  - A cycle of 4 nodes
  - A cycle of 5 nodes
  - A star (one centre joined to 5 leaves)
answer: 2
why: "A cycle with an odd number of nodes cannot be 2-coloured, since the colours must alternate around it. Paths, stars and even cycles alternate fine."
```

## Complexity

- BFS, DFS and the colouring each visit every node once and every edge twice (once per direction): $O(n + m)$.
- Grid with $R$ rows and $C$ columns: $O(RC)$ time and memory, with 4 neighbours per cell.
- Memory: $O(n + m)$ for lists, $O(n)$ for the queue or the recursion stack.

## Pitfalls

- Mark a node when you push it, not when you pop it, or the same node enters the queue many times.
- Use `long long` for distances only if edge counts could pass $2 \cdot 10^9$. For plain BFS, `int` is fine.
- A graph need not be connected. Loop over all start nodes for components, cycles and colouring.
- Self-loops and repeated edges are legal in many problems. Check the statement.
- Mixed 0-based and 1-based indexing: size arrays `n + 1` for 1-indexed input.
- The path-printing loop needs a stop marker. Here `par[s] = 0` works because nodes start at 1.

```quiz
q: A BFS marks nodes as visited only when it pops them from the queue, not when it pushes them. What goes wrong?
options:
  - A node can be queued many times, wasting time and memory
  - BFS stops finding shortest paths on every graph
  - The graph is treated as directed
answer: 0
why: "Several nodes of the same layer may discover the same neighbour before it is popped, so it is pushed once per discovery. The queue can then hold up to m entries instead of n."
```

```cards
- q: What does BFS give you that DFS does not?
  a: Fewest-edge distances from the source, because the queue visits nodes layer by layer.
- q: When must you mark a node as seen in BFS?
  a: When it is pushed into the queue, so each node enters the queue at most once.
- q: Time complexity of BFS or DFS with adjacency lists?
  a: $O(n + m)$.
- q: How do you count connected components?
  a: Start a DFS or BFS from every node not yet seen. The number of starts is the answer.
- q: A graph is bipartite exactly when...
  a: it has no odd cycle, which is the same as being 2-colourable by BFS or DFS.
- q: How do you get the distance from the nearest of several sources?
  a: Multi-source BFS. Push all sources with distance 0, then run the normal loop.
```

## Notes

:::notes
- Graph = $n$ nodes, $m$ edges. Use adjacency lists: $O(n + m)$ memory. A matrix needs $n^2$.
- Undirected edge: add both directions.
- BFS uses a queue. First arrival is along a shortest path, but only when every edge costs the same.
- Set `dist[u]` (or the seen mark) when pushing. `dist = -1` means unseen. `par[u]` rebuilds the path.
- Grid: four direction arrays, bounds check, wall check, distance check. Multi-source BFS starts with all sources in the queue.
- DFS from every unseen node counts components. A seen node reached by a different edge means a cycle.
- Bipartite means 2-colourable means no odd cycle. Colour with BFS or DFS and compare neighbours.
- Recursive DFS can overflow the stack on long paths. Use a big-stack thread in Java or an explicit stack.
- All of this is $O(n + m)$. Weighted edges need Dijkstra, the next lesson.
:::
