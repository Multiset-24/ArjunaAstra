---
title: Backtracking
summary: Build a solution one choice at a time, undo each choice after exploring it, and cut off branches that cannot succeed.
minutes: 40
difficulty: intermediate
rating: [1100, 1500]
tags: [backtracking, recursion, subsets, permutations, pruning]
prereqs: [recursion]
problems:
  - cf: 1097B
    name: Petr and a Combination Lock
    rating: 1200
    core: true
    note: try both directions for every rotation
  - lc: subsets
    name: Subsets
    difficulty: Medium
    core: true
  - lc: permutations
    name: Permutations
    difficulty: Medium
    core: true
  - cf: 476B
    name: Dreamoon and WiFi
    rating: 1300
    note: try every way to fill the unknown commands
  - lc: combinations
    name: Combinations
    difficulty: Medium
    note: choose k of n, prune when too few numbers remain
  - cf: 550B
    name: Preparing Olympiad
    rating: 1400
    note: every subset of at most 15 problems
  - lc: generate-parentheses
    name: Generate Parentheses
    difficulty: Medium
    note: prune when closers would exceed openers
  - lc: combination-sum
    name: Combination Sum
    difficulty: Medium
  - lc: word-search
    name: Word Search
    difficulty: Medium
    note: mark a cell, explore, unmark
  - cses: 1624
    name: Chessboard and Queens
    core: true
    note: N-Queens with blocked squares
  - lc: n-queens
    name: N-Queens
    difficulty: Hard
exercises:
  - Print all subsets of size exactly k. Where does pruning cut the tree?
  - Modify the permutation program so that it handles repeated values without printing duplicates (sort first, skip equal values at the same depth).
---

## The problem

Some questions ask for every arrangement that satisfies rules, or for the count of them:

- All subsets of a set.
- All orderings of `n` items.
- Ways to place 8 queens on a chessboard so that none attack another.

You cannot write the nested loops because the number of loops depends on the input. You need code that makes one choice, moves on to the next, and can go back.

## Brute force first

Generate every possible candidate, then test each one.

- Queens: choose any 8 of the 64 squares, then check for attacks. That is $\binom{64}{8}$, about 4.4 x 10^9 candidates.
- Many of those are broken from the second queen onwards, yet brute force still builds all of them.

**Backtracking** fixes this. It builds a candidate piece by piece and abandons it the moment it breaks a rule.

## The idea: choose, explore, unchoose

Think of a **decision tree**. Each level is one decision, each branch is one option, and each leaf is a complete candidate.

1. **Choose.** Pick an option that is allowed now and apply it.
2. **Explore.** Recurse to make the next decision.
3. **Unchoose.** Undo the option, so the next option starts from the same state.

The third step is the back in backtracking. The recursive function shares one state, so every change must be reversed on the way out.

:::key
Every `push` before the recursive call needs a matching `pop` after it. If the state is not restored, the next branch starts from a corrupted state.
:::

## Subsets

Standard form: pick the elements in increasing order. `go(start)` records the current subset, then tries each `j >= start` as the next element and continues from `j + 1`. Because elements only go up, each subset is built exactly once.

```viz
algo: recursion-tree
input:
  fn: subsets
  n: 3
  memo: false
```

```cpp
#include <bits/stdc++.h>
using namespace std;

int n;
vector<int> cur;

void go(int start) {
    cout << "{";
    for (size_t i = 0; i < cur.size(); i++) cout << (i ? " " : "") << cur[i];
    cout << "}\n";
    for (int j = start; j <= n; j++) {
        cur.push_back(j);     // choose
        go(j + 1);            // explore
        cur.pop_back();       // unchoose
    }
}

int main() {
    cin >> n;
    go(1);
}
```
```java
import java.util.*;

public class Main {
    static int n;
    static ArrayList<Integer> cur = new ArrayList<>();
    static StringBuilder out = new StringBuilder();

    static void go(int start) {
        out.append("{");
        for (int i = 0; i < cur.size(); i++) out.append(i > 0 ? " " : "").append(cur.get(i));
        out.append("}\n");
        for (int j = start; j <= n; j++) {
            cur.add(j);                      // choose
            go(j + 1);                       // explore
            cur.remove(cur.size() - 1);      // unchoose
        }
    }

    public static void main(String[] args) {
        n = new Scanner(System.in).nextInt();
        go(1);
        System.out.print(out);
    }
}
```
```input
3
```
```output
{}
{1}
{1 2}
{1 2 3}
{1 3}
{2}
{2 3}
{3}
```

```predict
lang: cpp
code: |
  void go(int start, string cur) {
      cout << "[" << cur << "] ";
      for (int j = start; j <= 3; j++) go(j + 1, cur + to_string(j));
  }
  go(1, "");
prompt: What does this print? Here the state is passed by value, so there is no explicit undo.
output: "[] [1] [12] [123] [13] [2] [23] [3]"
why: Each call prints its own subset first, then extends it with every larger element. After [1] it goes deeper to [12] and [123], returns, then tries [13], before moving on to [2].
```

## Permutations

A permutation uses every item once, in some order. At each depth, try any item not yet used. A `used` array records what is taken, and it is the state you must undo.

```cpp
#include <bits/stdc++.h>
using namespace std;

int n;
vector<int> path;
vector<bool> used;

void perm() {
    if ((int)path.size() == n) {
        for (int i = 0; i < n; i++) cout << path[i] << (i + 1 < n ? " " : "\n");
        return;
    }
    for (int x = 1; x <= n; x++) {
        if (used[x]) continue;
        used[x] = true;
        path.push_back(x);
        perm();
        path.pop_back();
        used[x] = false;
    }
}

int main() {
    cin >> n;
    used.assign(n + 1, false);
    perm();
}
```
```java
import java.util.*;

public class Main {
    static int n;
    static ArrayList<Integer> path = new ArrayList<>();
    static boolean[] used;
    static StringBuilder out = new StringBuilder();

    static void perm() {
        if (path.size() == n) {
            for (int i = 0; i < n; i++) out.append(path.get(i)).append(i + 1 < n ? " " : "\n");
            return;
        }
        for (int x = 1; x <= n; x++) {
            if (used[x]) continue;
            used[x] = true;
            path.add(x);
            perm();
            path.remove(path.size() - 1);
            used[x] = false;
        }
    }

    public static void main(String[] args) {
        n = new Scanner(System.in).nextInt();
        used = new boolean[n + 1];
        perm();
        System.out.print(out);
    }
}
```
```input
3
```
```output
1 2 3
1 3 2
2 1 3
2 3 1
3 1 2
3 2 1
```

```blanks
prompt: Complete the unchoose step of the permutation loop.
lang: java
code: |
  used[x] = true;
  path.add(x);
  perm();
  path.remove(path.size() - 1);
  used[x] = [[false]];
why: The item x must become available again for the next branch at this depth. If used[x] stays true, the later branches silently miss permutations.
```

### Combinations

To choose `k` of `n` numbers, use the subset pattern but stop at size `k`. A simple prune: if fewer numbers remain than you still need, return immediately. With `need = k - cur.size()` more to pick, only values up to `n - need + 1` can start a valid completion.

## Pruning

**Pruning** means cutting a branch as soon as it cannot lead to a solution. N-Queens is the classic case. Place one queen per row. A square is allowed only if its column and its two diagonals are free.

- Column of a square: `c`.
- Diagonal "down-right": `r - c` is constant, shifted by `n - 1` to avoid negatives.
- Diagonal "down-left": `r + c` is constant.

The program counts solutions and also how many calls it makes.

```cpp
#include <bits/stdc++.h>
using namespace std;

int n;
long long cnt = 0, nodes = 0;
vector<bool> col, d1, d2;

void place(int r) {
    nodes++;
    if (r == n) { cnt++; return; }
    for (int c = 0; c < n; c++) {
        if (col[c] || d1[r + c] || d2[r - c + n - 1]) continue;   // prune
        col[c] = d1[r + c] = d2[r - c + n - 1] = true;
        place(r + 1);
        col[c] = d1[r + c] = d2[r - c + n - 1] = false;
    }
}

int main() {
    cin >> n;
    col.assign(n, false);
    d1.assign(2 * n, false);
    d2.assign(2 * n, false);
    place(0);
    cout << cnt << " " << nodes << "\n";
}
```
```java
import java.util.*;

public class Main {
    static int n;
    static long cnt = 0, nodes = 0;
    static boolean[] col, d1, d2;

    static void place(int r) {
        nodes++;
        if (r == n) { cnt++; return; }
        for (int c = 0; c < n; c++) {
            if (col[c] || d1[r + c] || d2[r - c + n - 1]) continue;   // prune
            col[c] = d1[r + c] = d2[r - c + n - 1] = true;
            place(r + 1);
            col[c] = d1[r + c] = d2[r - c + n - 1] = false;
        }
    }

    public static void main(String[] args) {
        n = new Scanner(System.in).nextInt();
        col = new boolean[n];
        d1 = new boolean[2 * n];
        d2 = new boolean[2 * n];
        place(0);
        System.out.println(cnt + " " + nodes);
    }
}
```
```input
8
```
```output
92 2057
```

Eight queens has 92 solutions. The search visits only 2,057 calls, against billions of candidates for brute force. The pruning check is cheap, because the three boolean arrays answer "is this square attacked" in O(1).

```quiz
q: In N-Queens, what must the search do after `place(r + 1)` returns?
options:
  - Nothing, the arrays are only read
  - Clear the column and both diagonal flags it set for this square
  - Reset the whole board
answer: 1
why: "The flags describe the queens currently placed. After exploring this square the queen is removed, so its three flags must be cleared before the next column is tried."
```

## Complexity

Backtracking is exponential. The cost is the size of the decision tree that pruning leaves.

| n | Subsets $2^n$ | Permutations $n!$ |
|---|---|---|
| 10 | 1,024 | 3,628,800 |
| 15 | 32,768 | 1,307,674,368,000 |
| 20 | 1,048,576 | about 2.4 x 10^18 |
| 25 | 33,554,432 | about 1.6 x 10^25 |

- Subsets are feasible up to about n = 20 to 25.
- Permutations are feasible up to about n = 10 or 11.
- Printing the answers can itself dominate the running time.

:::truth
Backtracking is a brute-force method that is organized well. It is the right tool only when constraints are tiny (n up to roughly 10 for orderings, 20 for subsets). If n is 10^5, no amount of pruning saves it. Read the constraints first; they tell you whether this is the intended solution.
:::

## Pitfalls

- **Missing undo.** The most common bug. Pair every change with its reversal, in reverse order.
- **Storing a reference.** When saving a result, copy the path (`results.push_back(path)`, `new ArrayList<>(path)`). Otherwise later undo steps modify what you saved.
- **Duplicates.** If the input has repeated values, sort it and skip a value equal to the previous one at the same depth.
- **Wrong prune.** A prune must discard only branches that truly cannot succeed. Test it by comparing counts against the unpruned version on small input.
- **Late checks.** Test a rule when you place the piece, not after the full candidate is built.

```cards
- q: What are the three steps in a backtracking loop?
  a: Choose an option, explore by recursing, then unchoose (undo) the option.
- q: Why must the state be restored after the recursive call?
  a: The state is shared by all branches. Without the undo, the next option begins from the previous branch's leftovers.
- q: How does the subset program avoid generating the same subset twice?
  a: Elements are added in increasing order, because each call continues from j + 1.
- q: What does pruning do?
  a: It stops a branch the moment a rule is broken or success becomes impossible, so the unvisited part of the tree is never built.
- q: Rough feasibility limits of generating all subsets and all permutations?
  a: Subsets up to about n = 20 to 25, permutations up to about n = 10 or 11.
```

## Notes

:::notes
- Backtracking = choose, explore (recurse), unchoose. Shared state must be restored after every call.
- Subsets: loop j from start to n, recurse with j + 1. Permutations: loop over all items, skip used ones.
- Combinations: stop at size k; prune when too few items remain.
- Prune early: N-Queens keeps column, d1 = r + c and d2 = r - c + n - 1 flags to test a square in O(1).
- Cost is the number of tree nodes: 2^n for subsets, n! for permutations. Printing output can dominate.
- Feasible sizes: roughly n <= 20 to 25 for subsets and n <= 10 or 11 for permutations.
- Copy the path before saving a result. Sort and skip equal neighbours to avoid duplicate results.
- If constraints are large, backtracking is not the intended solution.
:::
