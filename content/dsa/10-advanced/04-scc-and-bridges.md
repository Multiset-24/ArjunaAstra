---
title: SCCs, Bridges and Articulation Points
summary: One DFS with low-link values finds strongly connected components in a directed graph, and bridges and cut vertices in an undirected one.
minutes: 50
difficulty: advanced
rating: [1700, 2300]
tags: [graphs, dfs, scc, bridges, tarjan]
prereqs: [graphs-bfs-dfs, topological-sort, dsu]
problems:
  - cf: 475B
    name: Strongly Connected City
    rating: 1400
    note: warm-up, every vertex must reach every other
  - cses: 1682
    name: Flight Routes Check
  - cses: 1683
    name: Planets and Kingdoms
    note: print the SCC id of every vertex
  - cf: 427C
    name: Checkposts
    rating: 1700
    core: true
    note: cheapest vertex in each SCC, count the ways
  - lc: find-eventual-safe-states
    name: Find Eventual Safe States
    difficulty: Medium
  - cf: 999E
    name: Reachability from the Capital
    rating: 2000
    core: true
    note: count source components in the condensation
  - cf: 118E
    name: Bertown roads
    rating: 2000
    core: true
    note: orient every edge along the DFS; a bridge makes it impossible
  - cses: 1686
    name: Coin Collector
    note: condense, then DP on the DAG
  - lc: critical-connections-in-a-network
    name: Critical Connections in a Network
    difficulty: Hard
    core: true
  - cf: 1000E
    name: We Need More Bosses
    rating: 2100
    note: contract the 2-edge-connected components, take the tree diameter
  - cf: 732F
    name: Tourist Reform
    rating: 2300
---

## The problem

Two questions about a graph, one tool.

- **Directed graph.** Which vertices can reach each other in both directions? Such a group is a **strongly connected component** (SCC): a maximal set where every vertex reaches every other.
- **Undirected graph.** Which single road is critical, so that closing it splits the network? That edge is a **bridge**. A vertex with the same property is an **articulation point** (cut vertex).

## Brute force first

- **Bridges.** Remove each edge, run a DFS, count components: $O(m \cdot (n + m))$.
- **SCCs.** For each pair $(u, v)$ test reachability both ways: $O(n \cdot (n + m))$ with one DFS per vertex.
- With $n, m = 2 \cdot 10^5$ both are around $10^{10}$ or more. We want one DFS, $O(n + m)$.

## The idea: low-link

Run a DFS and number vertices in the order they are first reached: `tin[v]` (entry time). Then define

- `low[v]` = the smallest `tin` you can reach from the subtree of `v` using the tree edges plus **one** extra edge pointing back to an older vertex.

If `low[v] == tin[v]`, nothing in the subtree of $v$ reaches anything older. In a directed graph, $v$ is then the **root** of an SCC. In an undirected graph, the edge from $v$ to its parent is a bridge.

```viz
algo: graph-traversal
input:
  n: 7
  edges: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 3], [6, 5]]
  start: 0
  mode: dfs
  directed: true
```

Step through this DFS (directed edges, vertices numbered from 0) and write the entry time next to each vertex. The two cycles are where low-link will pull values back down.

## Tarjan's algorithm for SCCs

Add one stack. Push each vertex when it is reached. An edge to a vertex that is **still on the stack** is a back edge into the current component, so it may lower `low`. When `low[v] == tin[v]`, pop the stack down to $v$: those vertices are one SCC.

```steps
title: Tarjan on 1 -> 2 -> 3 -> 1 and 3 -> 4 (array shows low[1..4])
view: array
frames:
  - arr: [0, 0, 0, 0]
    note: Nothing visited. Vertices are 1..4 in positions 0..3.
  - arr: [1, 0, 0, 0]
    pointers: {v: 0}
    highlight: {0: active}
    note: Visit 1. tin = low = 1. Stack is [1].
  - arr: [1, 2, 3, 0]
    pointers: {v: 2}
    highlight: {0: compare, 1: compare, 2: active}
    note: Go 1 to 2 to 3. Stack is [1, 2, 3].
  - arr: [1, 2, 1, 0]
    pointers: {v: 2}
    highlight: {2: active, 0: match}
    note: Edge 3 to 1 hits a vertex on the stack, so low[3] = min(3, tin[1]) = 1.
  - arr: [1, 2, 1, 4]
    pointers: {v: 3}
    highlight: {3: active}
    note: Visit 4. It has no outgoing edges and low[4] = tin[4], so pop it alone as an SCC.
  - arr: [1, 1, 1, 4]
    pointers: {v: 1}
    highlight: {3: done, 1: active}
    note: Back in 3, low stays 1. Back in 2, low[2] = min(2, low[3]) = 1.
  - arr: [1, 1, 1, 4]
    highlight: {0: done, 1: done, 2: done, 3: done}
    note: "Back at 1, low[1] = tin[1], so pop 3, 2, 1. SCCs found: {4} then {1, 2, 3}."
```

Two facts worth keeping:

- Tarjan finishes **sink** components first (those with no edge leaving to an unfinished one). So if you number SCCs in the order found, every edge $u \to v$ between components goes from a **higher** id to a **lower** id. The ids are a reverse topological order for free.
- Contracting each SCC into one vertex gives the **condensation** graph, which is always a DAG (directed acyclic graph), because a cycle would have merged its components. Many hard problems become "compute SCCs, then do DP or counting on the DAG".

```cpp
#include <bits/stdc++.h>
using namespace std;

const int N = 200005;
vector<int> g[N];
int tin[N], low[N], comp[N], timer_ = 0, ncomp = 0;
bool onStack[N];
vector<int> st;

void dfs(int v) {
    tin[v] = low[v] = ++timer_;
    st.push_back(v);
    onStack[v] = true;
    for (int to : g[v]) {
        if (!tin[to]) { dfs(to); low[v] = min(low[v], low[to]); }
        else if (onStack[to]) low[v] = min(low[v], tin[to]);
    }
    if (low[v] == tin[v]) {              // v is the root of an SCC
        while (true) {
            int u = st.back(); st.pop_back();
            onStack[u] = false;
            comp[u] = ncomp;
            if (u == v) break;
        }
        ncomp++;
    }
}

int main() {
    int n, m;
    scanf("%d %d", &n, &m);
    while (m--) { int a, b; scanf("%d %d", &a, &b); g[a].push_back(b); }
    for (int v = 1; v <= n; v++) if (!tin[v]) dfs(v);
    printf("%d\n", ncomp);
    for (int v = 1; v <= n; v++) printf("%d%c", comp[v], v == n ? '\n' : ' ');
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static ArrayList<Integer>[] g;
    static int[] tin, low, comp;
    static boolean[] onStack;
    static ArrayDeque<Integer> st = new ArrayDeque<>();
    static int timer = 0, ncomp = 0;

    static void dfs(int v) {
        tin[v] = low[v] = ++timer;
        st.push(v);
        onStack[v] = true;
        for (int to : g[v]) {
            if (tin[to] == 0) { dfs(to); low[v] = Math.min(low[v], low[to]); }
            else if (onStack[to]) low[v] = Math.min(low[v], tin[to]);
        }
        if (low[v] == tin[v]) {
            while (true) {
                int u = st.pop();
                onStack[u] = false;
                comp[u] = ncomp;
                if (u == v) break;
            }
            ncomp++;
        }
    }

    @SuppressWarnings("unchecked")
    static void solve() throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer s = new StringTokenizer(br.readLine());
        int n = Integer.parseInt(s.nextToken()), m = Integer.parseInt(s.nextToken());
        g = new ArrayList[n + 1];
        for (int i = 0; i <= n; i++) g[i] = new ArrayList<>();
        tin = new int[n + 1]; low = new int[n + 1]; comp = new int[n + 1];
        onStack = new boolean[n + 1];
        while (m-- > 0) {
            s = new StringTokenizer(br.readLine());
            g[Integer.parseInt(s.nextToken())].add(Integer.parseInt(s.nextToken()));
        }
        for (int v = 1; v <= n; v++) if (tin[v] == 0) dfs(v);
        StringBuilder sb = new StringBuilder();
        sb.append(ncomp).append('\n');
        for (int v = 1; v <= n; v++) sb.append(comp[v]).append(v == n ? '\n' : ' ');
        System.out.print(sb);
    }

    public static void main(String[] args) throws Exception {
        // a big stack lets the recursive DFS go deep
        Thread t = new Thread(null, () -> {
            try { solve(); } catch (IOException e) { throw new RuntimeException(e); }
        }, "main", 1 << 27);
        t.start();
        t.join();
    }
}
```
```input
8 10
1 2
2 3
3 1
3 4
4 5
5 6
6 4
7 6
7 8
8 7
```
```output
3
1 1 1 0 0 0 2 2
```

Components: $\{4,5,6\}$ finishes first (id 0), then $\{1,2,3\}$ (id 1), then $\{7,8\}$ (id 2). Every cross edge goes from a higher id to a lower one: $3 \to 4$ is $1 \to 0$ and $7 \to 6$ is $2 \to 0$.

```order
prompt: Arrange the part of Tarjan that closes a component once low[v] == tin[v].
lang: cpp
code: |
  if (low[v] == tin[v]) {
      while (true) {
          int u = st.back(); st.pop_back();
          onStack[u] = false;
          comp[u] = ncomp;
          if (u == v) break;
      }
      ncomp++;
  }
distractors:
  - "          if (u != v) break;"
why: Pop vertices until v itself comes off, giving all of them the same component id. Breaking when u differs from v would stop after the first pop.
```

:::details[Kosaraju: the other classic]
Run a DFS on the graph and record vertices by finish time. Then process them in decreasing finish time, running DFS on the **reversed** graph; each DFS tree is one SCC. It needs two passes and a reversed adjacency list but no `low` values. Both run in $O(n + m)$, and Tarjan is shorter once you know it.
:::

## Bridges and articulation points

Same DFS, now on an undirected graph. Skip the edge you came from (by **edge id**, not by parent vertex, so parallel edges are handled). For a tree child `to` of `v`:

- Edge $(v, to)$ is a **bridge** when `low[to] > tin[v]`: the subtree of `to` cannot reach `v` or anything older except through this edge.
- $v$ is an **articulation point** when `low[to] >= tin[v]` for some child and $v$ is not the root. Note `>=`: reaching $v$ itself is still not enough to avoid $v$.
- The **root** is an articulation point only if it has at least two DFS children.

```quiz
q: A DFS child `to` of `v` has low[to] == tin[v]. What does that tell you?
options:
  - The edge v-to is a bridge
  - The edge v-to is not a bridge, but v (if not the root) is an articulation point
  - Neither the edge nor v is critical
  - v is the root of the DFS
answer: 1
why: low[to] reaches v itself through some other edge, so the edge v-to lies on a cycle and is not a bridge. But the subtree of to cannot get above v, so removing v cuts that subtree off.
```

```cpp
#include <bits/stdc++.h>
using namespace std;

const int N = 200005;
vector<pair<int, int>> g[N];            // (neighbour, edge id)
int tin[N], low[N], timer_ = 0;
bool isBridge[N], isCut[N];

void dfs(int v, int parentEdge) {
    tin[v] = low[v] = ++timer_;
    int children = 0;
    for (auto [to, id] : g[v]) {
        if (id == parentEdge) continue;
        if (tin[to]) low[v] = min(low[v], tin[to]);          // back edge
        else {
            dfs(to, id);
            children++;
            low[v] = min(low[v], low[to]);
            if (low[to] > tin[v]) isBridge[id] = true;
            if (parentEdge != -1 && low[to] >= tin[v]) isCut[v] = true;
        }
    }
    if (parentEdge == -1 && children >= 2) isCut[v] = true;   // root rule
}

int main() {
    int n, m;
    scanf("%d %d", &n, &m);
    for (int i = 1; i <= m; i++) {
        int a, b;
        scanf("%d %d", &a, &b);
        g[a].push_back({b, i});
        g[b].push_back({a, i});
    }
    for (int v = 1; v <= n; v++) if (!tin[v]) dfs(v, -1);
    vector<int> br, cut;
    for (int i = 1; i <= m; i++) if (isBridge[i]) br.push_back(i);
    for (int v = 1; v <= n; v++) if (isCut[v]) cut.push_back(v);
    printf("%d\n", (int)br.size());
    for (int x : br) printf("%d ", x);
    printf("\n%d\n", (int)cut.size());
    for (int x : cut) printf("%d ", x);
    printf("\n");
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static ArrayList<int[]>[] g;            // {neighbour, edge id}
    static int[] tin, low;
    static boolean[] isBridge, isCut;
    static int timer = 0;

    static void dfs(int v, int parentEdge) {
        tin[v] = low[v] = ++timer;
        int children = 0;
        for (int[] e : g[v]) {
            int to = e[0], id = e[1];
            if (id == parentEdge) continue;
            if (tin[to] != 0) low[v] = Math.min(low[v], tin[to]);
            else {
                dfs(to, id);
                children++;
                low[v] = Math.min(low[v], low[to]);
                if (low[to] > tin[v]) isBridge[id] = true;
                if (parentEdge != -1 && low[to] >= tin[v]) isCut[v] = true;
            }
        }
        if (parentEdge == -1 && children >= 2) isCut[v] = true;
    }

    @SuppressWarnings("unchecked")
    static void solve() throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer s = new StringTokenizer(br.readLine());
        int n = Integer.parseInt(s.nextToken()), m = Integer.parseInt(s.nextToken());
        g = new ArrayList[n + 1];
        for (int i = 0; i <= n; i++) g[i] = new ArrayList<>();
        tin = new int[n + 1]; low = new int[n + 1];
        isBridge = new boolean[m + 1]; isCut = new boolean[n + 1];
        for (int i = 1; i <= m; i++) {
            s = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(s.nextToken()), b = Integer.parseInt(s.nextToken());
            g[a].add(new int[]{b, i});
            g[b].add(new int[]{a, i});
        }
        for (int v = 1; v <= n; v++) if (tin[v] == 0) dfs(v, -1);
        StringBuilder sb = new StringBuilder();
        int cb = 0, cc = 0;
        StringBuilder lb = new StringBuilder(), lc = new StringBuilder();
        for (int i = 1; i <= m; i++) if (isBridge[i]) { cb++; lb.append(i).append(' '); }
        for (int v = 1; v <= n; v++) if (isCut[v]) { cc++; lc.append(v).append(' '); }
        sb.append(cb).append('\n').append(lb).append('\n').append(cc).append('\n').append(lc).append('\n');
        System.out.print(sb);
    }

    public static void main(String[] args) throws Exception {
        Thread t = new Thread(null, () -> {
            try { solve(); } catch (IOException e) { throw new RuntimeException(e); }
        }, "main", 1 << 27);
        t.start();
        t.join();
    }
}
```
```input
7 8
1 2
2 3
3 1
3 4
4 5
5 6
6 4
6 7
```
```output
2
4 8 
3
3 4 6 
```

Two triangles joined by edge 4, and a pendant edge 8 to vertex 7. Both edges are bridges. Vertices 3, 4 and 6 each separate the graph when removed; vertex 6 does because it is the only link to vertex 7.

```blanks
prompt: Fill in the two tests inside the DFS child branch (C++).
lang: cpp
code: |
  if (low[to] [[>]] tin[v]) isBridge[id] = true;
  if (parentEdge != -1 && low[to] [[>=]] tin[v]) isCut[v] = true;
why: A bridge needs the subtree to be unable to even reach v, so strict greater-than. An articulation point only needs the subtree to be unable to get above v, so greater-or-equal.
```

## Complexity

| Task | Time | Extra memory |
|---|---|---|
| SCCs (Tarjan or Kosaraju) | $O(n + m)$ | $O(n)$ |
| Bridges and articulation points | $O(n + m)$ | $O(n)$ |
| Condensation DAG | $O(n + m)$ | $O(n + m)$ |

## Using the result

- **Condensation counting.** Components with in-degree 0 are the sources. To make every vertex reachable from a start vertex, add one edge per source component other than the start's.
- **DP on the DAG.** Process component ids in increasing order (Tarjan's ids are reverse topological): the best value starting at a component depends only on lower ids.
- **Bridge tree.** Delete all bridges. Each remaining connected piece is a 2-edge-connected component. Contracting each piece gives a tree whose edges are the bridges.
- **Orienting edges.** In a bridgeless connected undirected graph you can orient every edge so the result is strongly connected: orient tree edges downward and back edges upward during the DFS.

:::truth
These problems are rated 1700 to 2400 mostly because of the modelling, not the DFS. The low-link code is about 15 lines and you will memorise it after writing it three times. The hard part is recognising "condense first" or "this is a bridge problem". Practise that part on problems, not on notes.
:::

## Pitfalls

- **Parent skipping by vertex.** With parallel edges (two roads between the same cities) skipping the parent vertex hides a cycle and reports a false bridge. Skip by edge id.
- **Recursion depth.** A path of $2 \cdot 10^5$ vertices overflows the default Java stack. Run in a thread with a large stack, as above. On Codeforces, C++ is usually fine.
- **Directed `low` uses the stack check.** In Tarjan SCC, only edges to vertices **on the stack** update `low`. A visited vertex in a finished component must be ignored.
- **Root special case.** The articulation test `low[to] >= tin[v]` is true for every child of the root, so apply the "at least two children" rule there instead.
- **Disconnected graphs.** Start a DFS from every unvisited vertex.

```quiz
q: In the condensation of a directed graph, what is true?
options:
  - It may contain cycles if the original graph has long cycles
  - It is always a DAG
  - It is always a tree
  - It always has exactly one source
answer: 1
why: A cycle among components would mean their vertices all reach each other, so they would be one SCC. Hence no cycles. It need not be a tree and can have many sources.
```

## Notes

:::notes
- SCC: maximal set of vertices that all reach each other. Bridge: edge whose removal disconnects. Articulation point: vertex with that property.
- tin[v] = DFS entry time. low[v] = smallest tin reachable from v's subtree using tree edges plus one back edge.
- Tarjan SCC: push v on a stack; edges to on-stack vertices lower low; if low[v] == tin[v], pop to v as one SCC. O(n + m).
- Tarjan's SCC ids come out in reverse topological order of the condensation; edges go from higher id to lower id.
- Condensation (SCCs contracted) is a DAG. Count sources, or run DP over ids.
- Bridge: tree edge (v, to) with low[to] > tin[v]. Articulation point: non-root v with a child where low[to] >= tin[v]; root needs 2+ children.
- Skip the parent by edge id, never by parent vertex, to handle parallel edges.
- Kosaraju alternative: finish order on the graph, then DFS on the reversed graph in decreasing finish time.
- Deep recursion: use a big-stack thread in Java.
:::

```cards
- q: What is low[v] in Tarjan's DFS?
  a: The smallest entry time reachable from v's subtree using tree edges plus at most one back edge.
- q: When does Tarjan close an SCC at v?
  a: When low[v] == tin[v]. Then pop the stack down to v; those vertices form one SCC.
- q: Condition for tree edge (v, to) to be a bridge?
  a: low[to] > tin[v].
- q: Condition for v (not the root) to be an articulation point?
  a: Some DFS child to has low[to] >= tin[v]. The root needs at least two DFS children.
- q: Why is the condensation graph a DAG?
  a: A cycle between components would make all their vertices mutually reachable, merging them into one SCC.
- q: Why skip the parent edge by id, not by vertex?
  a: With parallel edges, skipping the parent vertex ignores the second edge, which is a real cycle, and reports a false bridge.
```
