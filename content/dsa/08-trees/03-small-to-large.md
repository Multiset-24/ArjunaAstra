---
title: Small-to-Large Merging and DSU on Tree
summary: Merge the smaller set into the larger so each element moves O(log n) times, and reuse that idea as DSU on tree to answer subtree queries.
minutes: 45
difficulty: advanced
rating: [1800, 2400]
tags: [small-to-large, dsu-on-tree, sack, trees, sets]
prereqs: [dsu, trees-basics, euler-tour, stl-and-collections]
problems:
  - cf: 1213G
    name: Path Queries
    rating: 1800
    note: process edges by weight, merge components, track the pair count
  - lc: accounts-merge
    name: Accounts Merge
    difficulty: Medium
    note: merge lists of emails, smaller into larger
  - cses: 1139
    name: Distinct Colors
    core: true
    note: number of distinct colours in every subtree
  - cf: 208E
    name: Blood Cousins
    rating: 2100
    note: count vertices at a given depth inside a subtree
  - cf: 570D
    name: Tree Requests
    rating: 2200
    core: true
    note: letter counts per depth, can the letters form a palindrome
  - cf: 600E
    name: Lomsat gelral
    rating: 2300
    core: true
    note: the standard DSU-on-tree exercise
  - cf: 1009F
    name: Dominant Indices
    rating: 2300
    core: true
    note: most frequent depth in each subtree
  - cf: 246E
    name: Blood Cousins Return
    rating: 2400
  - cf: 375D
    name: Tree and Queries
    rating: 2400
    note: also solvable with Mo's algorithm on the Euler tour
---

## The problem

A rooted tree has a colour on every vertex. For **every** vertex $v$, report the number of distinct colours in the subtree of $v$ (the vertex and everything below it).

## Brute force first

- For each $v$, walk its subtree and collect the colours in a set: $O(\text{size of subtree})$ per vertex.
- On a path of $n$ vertices the subtree sizes are $n, n-1, \dots, 1$, so the total is $O(n^2)$. With $n = 2 \cdot 10^5$ that is far too slow.

The waste: the answer for $v$ reuses almost everything its children already computed, but we recompute from scratch.

## The idea: merge small into large

Each vertex builds a set of colours by merging the sets of its children. The trick is **which way** you merge.

- Take the child with the largest set and keep that set as it is.
- Insert the elements of every other child's set into it, one by one.
- Never copy the large set.

**Why this is fast.** Count how often one element is moved (inserted into another set). Each time it moves, it goes from a smaller set into a set at least as large, so the set containing it **at least doubles**. A set cannot grow beyond $n$ elements, so any element moves at most $\log_2 n$ times. Total moves are $O(n \log n)$, and with a balanced set (insert costs $\log n$) the total is $O(n \log^2 n)$.

```predict
lang: cpp
code: |
  int size = 1, moves = 0;
  while (size < 1000) { size *= 2; moves++; }
  cout << moves;
output: "10"
why: Each move at least doubles the size of the set an element lives in, and 2^10 = 1024 is the first power of two reaching 1000. So no element is moved more than 10 times in a set of 1000.
```

The same rule is already in your DSU: **union by size** attaches the smaller tree under the larger one. Step through it to see the sizes.

```viz
algo: dsu
input:
  n: 8
  unions: [[0, 1], [2, 3], [1, 3], [4, 5], [6, 7], [5, 7], [3, 7]]
  find: [0]
```

```quiz
q: A growing set absorbs n single-element sets, one after another. What happens if you always insert the LARGER set into the smaller one?
options:
  - O(n^2) element copies in total, because the big set is copied every time
  - O(n) element copies in total
  - The same cost as merging the smaller into the larger
answer: 0
why: Copying the big set into a one-element set costs the size of the big set each time, and that size grows to n, so the total is about n^2 / 2. Inserting the single element into the big set costs 1 each time.
```

## Template: distinct colours in every subtree

Swapping two C++ `set` objects, or two Java references, takes $O(1)$. Use that to "keep the larger set".

```cpp
#include <bits/stdc++.h>
using namespace std;

const int N = 200005;
vector<int> g[N];
set<int> st[N];
int c[N], ans[N];

void dfs(int v, int p) {
    st[v].insert(c[v]);
    for (int u : g[v]) {
        if (u == p) continue;
        dfs(u, v);
        if (st[u].size() > st[v].size()) swap(st[u], st[v]);   // O(1), keeps the larger
        for (int x : st[u]) st[v].insert(x);                   // move the smaller
        st[u].clear();
    }
    ans[v] = st[v].size();
}

int main() {
    int n;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++) scanf("%d", &c[i]);
    for (int i = 1; i < n; i++) {
        int a, b;
        scanf("%d %d", &a, &b);
        g[a].push_back(b);
        g[b].push_back(a);
    }
    dfs(1, 0);
    for (int i = 1; i <= n; i++) printf("%d%c", ans[i], i == n ? '\n' : ' ');
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static ArrayList<Integer>[] g;
    static HashSet<Integer>[] st;
    static int[] c, ans;

    static void dfs(int v, int p) {
        st[v].add(c[v]);
        for (int u : g[v]) {
            if (u == p) continue;
            dfs(u, v);
            if (st[u].size() > st[v].size()) {                 // swap references: O(1)
                HashSet<Integer> t = st[u]; st[u] = st[v]; st[v] = t;
            }
            st[v].addAll(st[u]);                               // move the smaller
            st[u] = null;
        }
        ans[v] = st[v].size();
    }

    @SuppressWarnings("unchecked")
    static void solve() throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        g = new ArrayList[n + 1];
        st = new HashSet[n + 1];
        c = new int[n + 1];
        ans = new int[n + 1];
        StringTokenizer tk = new StringTokenizer(br.readLine());
        for (int i = 1; i <= n; i++) { c[i] = Integer.parseInt(tk.nextToken()); g[i] = new ArrayList<>(); st[i] = new HashSet<>(); }
        for (int i = 1; i < n; i++) {
            tk = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(tk.nextToken()), b = Integer.parseInt(tk.nextToken());
            g[a].add(b);
            g[b].add(a);
        }
        dfs(1, 0);
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= n; i++) sb.append(ans[i]).append(i == n ? '\n' : ' ');
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
5
1 2 3 2 3
1 2
1 3
3 4
3 5
```
```output
3 1 2 1 1
```

Walkthrough: leaves 2, 4, 5 have one colour each. Vertex 3 starts with $\{3\}$, takes the set of vertex 4 ($\{2\}$) and vertex 5 ($\{3\}$) and ends with $\{2, 3\}$, so its answer is 2. Vertex 1 starts with $\{1\}$, merges the set of vertex 2 and the set of vertex 3, and ends with $\{1, 2, 3\}$.

```blanks
prompt: Fill in the "keep the larger set" step (C++).
lang: cpp
code: |
  if (st[u].size() [[>]] st[v].size()) [[swap]](st[u], st[v]);
  for (int x : st[u]) st[v].insert(x);
why: If the child's set is bigger, exchange the two sets so the big one lives in st[v]. The swap of two std::set objects is O(1). Then only the smaller set is copied element by element.
```

## DSU on tree (sack)

Sets are not always the right summary. Sometimes the data is an array of counters, like `cnt[colour]` plus the current maximum. Copying counters is impossible, but the idea carries over: **keep the data of the heavy child, re-add the light subtrees**.

- The **heavy child** of $v$ is its child with the largest subtree. All other children are **light**.
- Procedure `dfs(v, keep)`:
  1. Run `dfs` on each light child with `keep = false` (afterwards the counters are cleared).
  2. Run `dfs` on the heavy child with `keep = true` (its data stays in the counters).
  3. Add $v$ and every vertex of every light subtree. Now the counters describe the subtree of $v$. Record the answer.
  4. If `keep = false`, remove the whole subtree of $v$ from the counters.
- To loop over a subtree quickly, store the vertices in **Euler tour** (DFS visit) order. A subtree is a contiguous range `tin[v] .. tout[v]-1`.

**Why this is fast.** A vertex is re-added once for every **light edge** on its path to the root. Going up a light edge at least doubles the subtree size, so there are at most $\log_2 n$ light edges. The total is $O(n \log n)$ additions.

Example problem (Lomsat gelral): for each vertex, the sum of the most frequent colours in its subtree (if two colours tie, add both).

```cpp
#include <bits/stdc++.h>
using namespace std;

const int N = 100005;
vector<int> g[N];
int c[N], sz[N], heavy[N], tin[N], tout[N], ver[N], timer_ = 0;
long long cntc[N], ans[N], sumDom = 0;
int mx = 0;

void prep(int v, int p) {                       // sizes, heavy child, Euler order
    sz[v] = 1; heavy[v] = -1;
    tin[v] = timer_; ver[timer_++] = v;
    for (int u : g[v]) if (u != p) {
        prep(u, v);
        sz[v] += sz[u];
        if (heavy[v] < 0 || sz[u] > sz[heavy[v]]) heavy[v] = u;
    }
    tout[v] = timer_;
}

void addVertex(int x) {
    int col = c[x];
    cntc[col]++;
    if (cntc[col] > mx) { mx = cntc[col]; sumDom = col; }
    else if (cntc[col] == mx) sumDom += col;
}

void dfs(int v, int p, bool keep) {
    for (int u : g[v]) if (u != p && u != heavy[v]) dfs(u, v, false);   // light children first
    if (heavy[v] != -1) dfs(heavy[v], v, true);                          // heavy child, data kept
    addVertex(v);
    for (int u : g[v]) if (u != p && u != heavy[v])
        for (int t = tin[u]; t < tout[u]; t++) addVertex(ver[t]);       // re-add light subtrees
    ans[v] = sumDom;
    if (!keep) {                                                         // clear this whole subtree
        for (int t = tin[v]; t < tout[v]; t++) cntc[c[ver[t]]]--;
        mx = 0; sumDom = 0;
    }
}

int main() {
    int n;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++) scanf("%d", &c[i]);
    for (int i = 1; i < n; i++) {
        int a, b;
        scanf("%d %d", &a, &b);
        g[a].push_back(b);
        g[b].push_back(a);
    }
    prep(1, 0);
    dfs(1, 0, true);
    for (int i = 1; i <= n; i++) printf("%lld%c", ans[i], i == n ? '\n' : ' ');
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static ArrayList<Integer>[] g;
    static int[] c, sz, heavy, tin, tout, ver;
    static long[] cnt, ans;
    static long sumDom = 0;
    static int mx = 0, timer = 0;

    static void prep(int v, int p) {
        sz[v] = 1; heavy[v] = -1;
        tin[v] = timer; ver[timer++] = v;
        for (int u : g[v]) if (u != p) {
            prep(u, v);
            sz[v] += sz[u];
            if (heavy[v] < 0 || sz[u] > sz[heavy[v]]) heavy[v] = u;
        }
        tout[v] = timer;
    }

    static void addVertex(int x) {
        int col = c[x];
        cnt[col]++;
        if (cnt[col] > mx) { mx = (int) cnt[col]; sumDom = col; }
        else if (cnt[col] == mx) sumDom += col;
    }

    static void dfs(int v, int p, boolean keep) {
        for (int u : g[v]) if (u != p && u != heavy[v]) dfs(u, v, false);
        if (heavy[v] != -1) dfs(heavy[v], v, true);
        addVertex(v);
        for (int u : g[v]) if (u != p && u != heavy[v])
            for (int t = tin[u]; t < tout[u]; t++) addVertex(ver[t]);
        ans[v] = sumDom;
        if (!keep) {
            for (int t = tin[v]; t < tout[v]; t++) cnt[c[ver[t]]]--;
            mx = 0; sumDom = 0;
        }
    }

    @SuppressWarnings("unchecked")
    static void solve() throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        g = new ArrayList[n + 1];
        c = new int[n + 1]; sz = new int[n + 1]; heavy = new int[n + 1];
        tin = new int[n + 1]; tout = new int[n + 1]; ver = new int[n + 1];
        cnt = new long[n + 1]; ans = new long[n + 1];
        StringTokenizer tk = new StringTokenizer(br.readLine());
        for (int i = 1; i <= n; i++) { c[i] = Integer.parseInt(tk.nextToken()); g[i] = new ArrayList<>(); }
        for (int i = 1; i < n; i++) {
            tk = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(tk.nextToken()), b = Integer.parseInt(tk.nextToken());
            g[a].add(b);
            g[b].add(a);
        }
        prep(1, 0);
        dfs(1, 0, true);
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= n; i++) sb.append(ans[i]).append(i == n ? '\n' : ' ');
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
4
1 2 3 4
1 2
2 3
2 4
```
```output
10 9 3 4
```

Vertex 2 has colours $\{2, 3, 4\}$, each appearing once, so all three tie and the answer is $2 + 3 + 4 = 9$. Vertex 1 adds colour 1, giving $10$.

```order
prompt: Arrange the body of dfs(v, p, keep) for DSU on tree.
lang: cpp
code: |
  for (int u : g[v]) if (u != p && u != heavy[v]) dfs(u, v, false);
  if (heavy[v] != -1) dfs(heavy[v], v, true);
  addVertex(v);
  for (int u : g[v]) if (u != p && u != heavy[v])
      for (int t = tin[u]; t < tout[u]; t++) addVertex(ver[t]);
  ans[v] = sumDom;
  if (!keep) { for (int t = tin[v]; t < tout[v]; t++) cntc[c[ver[t]]]--; mx = 0; sumDom = 0; }
distractors:
  - "  if (keep) { for (int t = tin[v]; t < tout[v]; t++) cntc[c[ver[t]]]--; }"
why: Light children go first so their data is cleared, then the heavy child is processed last and kept. Only after both is the subtree of v assembled. Clearing must happen when keep is false, otherwise a light subtree would pollute its parent's counters.
```

## Complexity

| Method | Time | Memory |
|---|---|---|
| Brute force per vertex | $O(n^2)$ | $O(n)$ |
| Small-to-large with `set` | $O(n \log^2 n)$ | $O(n)$ |
| Small-to-large with hash set | $O(n \log n)$ expected | $O(n)$ |
| DSU on tree (counters) | $O(n \log n)$ | $O(n)$ |

:::truth
For many "per-subtree" questions there is also an Euler-tour solution: flatten the tree so each subtree is a range, then use Mo's algorithm, a segment tree or offline sweeps. DSU on tree is one option, not the only one. In contests, pick the one you can write without bugs, and know at least one of them by heart.
:::

## Pitfalls

- **Merging the wrong way.** Inserting the large set into the small one gives $O(n^2)$ on a path or a caterpillar. Always compare sizes first.
- **Forgetting to clear.** In DSU on tree, a light child must leave the counters empty. If you skip the reset of `mx` and the running answer, the next subtree starts with stale values.
- **Order of children.** Heavy child last, so its data is the one left in the counters.
- **Recursion depth.** A path of $2 \cdot 10^5$ vertices overflows small stacks. In Java run inside a thread with a large stack.
- **Ties.** In the dominant-colour problem add the colour when its count equals the maximum, and reset the sum when the maximum increases.
- **Swap by value.** In C++ `swap(set, set)` is $O(1)$, but assigning `st[v] = st[u]` copies everything.

## Notes

:::notes
- Small-to-large: merge the smaller set into the larger. Each element moves at most log2(n) times because its set at least doubles.
- With ordered sets the total is O(n log^2 n); with hash sets, O(n log n) expected.
- Swap the containers (O(1)) so the big one stays; never copy it.
- DSU union by size and path compression use the same doubling argument.
- DSU on tree (sack): process light children (clear), then the heavy child (keep), then add the vertex and the light subtrees.
- Heavy child = child with the largest subtree. A vertex has at most log2(n) light edges above it, so re-adds total O(n log n).
- Euler tour order makes each subtree a range tin..tout-1; loop it to add or remove a whole subtree.
- Alternatives for subtree queries: Euler tour plus Mo, a segment tree, or an offline sweep.
- Always clear the counters and running maximum after a light child.
:::

```cards
- q: Why does merging the smaller set into the larger take O(n log n) element moves in total?
  a: An element moves only into a set at least as large as its own, so its set at least doubles with every move. It can double at most log2(n) times.
- q: What is a heavy child?
  a: The child of a vertex with the largest subtree. All other children are light.
- q: Why is DSU on tree O(n log n)?
  a: A vertex is re-added once per light edge on its path to the root, and there are at most log2(n) light edges on any root path.
- q: In DSU on tree, in what order are the children processed, and why?
  a: Light children first with keep = false (their data is cleared), the heavy child last with keep = true, so only its data remains for the parent.
- q: How do you iterate a subtree quickly in DSU on tree?
  a: Store vertices in Euler tour order. The subtree of v is the contiguous range tin[v] to tout[v] - 1.
- q: How do you swap two std::set objects cheaply?
  a: swap(a, b) exchanges the internal pointers in O(1). Assignment a = b copies all elements.
```
