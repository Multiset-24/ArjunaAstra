---
title: DP on Grids and Strings
summary: Fill a two-dimensional table where each cell depends on its neighbours - counting grid paths, longest common subsequence and edit distance.
minutes: 45
difficulty: intermediate
rating: [1300, 1800]
tags: [dp, 2d-dp, grid, lcs, edit-distance, strings]
prereqs: [dp-1d-patterns]
problems:
  - cf: 1555C
    name: Coin Rows
    rating: 1300
    note: a grid with two rows; prefix sums are enough, but think of it as a path
  - cses: 1638
    name: Grid Paths
    note: the DP version, count paths around traps
  - lc: unique-paths
    name: Unique Paths
    difficulty: Medium
  - lc: minimum-path-sum
    name: Minimum Path Sum
    difficulty: Medium
  - lc: longest-common-subsequence
    name: Longest Common Subsequence
    difficulty: Medium
    core: true
  - lc: edit-distance
    name: Edit Distance
    difficulty: Medium
    core: true
  - cses: 1639
    name: Edit Distance
  - cf: 706C
    name: Hard problem
    rating: 1600
    core: true
    note: two states per string - reversed or not
  - cf: 1695C
    name: Zero Path
    rating: 1700
    note: stretch; keep the minimum and maximum sum per cell
  - lc: longest-palindromic-subsequence
    name: Longest Palindromic Subsequence
    difficulty: Medium
    note: LCS of a string with its reverse
exercises:
  - Recover an actual longest common subsequence, not just its length, by walking back through the table.
  - Why does Minimum Path Sum need the same base-row and base-column handling as Unique Paths?
---

## The problem

Sometimes one index is not enough to describe a subproblem. A robot in a grid needs a row and a column. Two strings need a position in each. The state then has two numbers, so the table is **2D**: `dp[i][j]`.

The recipe does not change. Write the state, transition, base case and answer, then fill the table in an order where every cell's dependencies are already filled.

## Counting grid paths

A robot starts at the top-left cell of an `n x m` grid and moves only right or down. Cells marked `#` are blocked. Count the paths to the bottom-right cell, modulo $10^9 + 7$.

Brute force tries every path: about $2^{n+m}$ of them. But the number of ways to enter a cell depends only on the cell above and the cell to its left.

- **State:** `dp[i][j]` = number of paths from the start to cell `(i, j)`.
- **Transition:** if `(i, j)` is open, `dp[i][j] = dp[i-1][j] + dp[i][j-1]`; if blocked, `0`.
- **Base case:** `dp[0][0] = 1` if the start is open. Cells outside the grid count as `0`.
- **Answer:** `dp[n-1][m-1]`.

```viz
algo: dp-grid
input:
  mode: grid-paths
  grid: ["...", ".#.", "..."]
```

```cpp
#include <bits/stdc++.h>
using namespace std;
const int MOD = 1000000007;

int main() {
    int n, m;
    cin >> n >> m;
    vector<string> g(n);
    for (auto &row : g) cin >> row;
    vector<vector<int>> dp(n, vector<int>(m, 0));
    if (g[0][0] == '.') dp[0][0] = 1;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < m; j++) {
            if (g[i][j] == '#') { dp[i][j] = 0; continue; }
            if (i > 0) dp[i][j] = (dp[i][j] + dp[i - 1][j]) % MOD;
            if (j > 0) dp[i][j] = (dp[i][j] + dp[i][j - 1]) % MOD;
        }
    cout << dp[n - 1][m - 1] << "\n";
}
```
```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        final int MOD = 1000000007;
        int n = sc.nextInt(), m = sc.nextInt();
        String[] g = new String[n];
        for (int i = 0; i < n; i++) g[i] = sc.next();
        int[][] dp = new int[n][m];
        if (g[0].charAt(0) == '.') dp[0][0] = 1;
        for (int i = 0; i < n; i++)
            for (int j = 0; j < m; j++) {
                if (g[i].charAt(j) == '#') { dp[i][j] = 0; continue; }
                if (i > 0) dp[i][j] = (dp[i][j] + dp[i - 1][j]) % MOD;
                if (j > 0) dp[i][j] = (dp[i][j] + dp[i][j - 1]) % MOD;
            }
        System.out.println(dp[n - 1][m - 1]);
    }
}
```
```input
4 4
....
.#..
...#
#...
```
```output
3
```

:::note
The cell `(0, 0)` already holds 1, so the loop adds nothing to it (no cell above or to the left). That is how the base case rides along inside the same loop.
:::

## Longest common subsequence (LCS)

A **subsequence** keeps characters in order but may skip some: `ace` is a subsequence of `abcde`. (A substring must be contiguous.) Given strings `a` and `b`, find the length of their longest common subsequence.

Brute force lists every subsequence of `a` ($2^{|a|}$ of them) and tests each against `b`. Instead, compare the last characters of two prefixes.

- **State:** `dp[i][j]` = LCS length of the first `i` characters of `a` and the first `j` of `b`.
- **Transition:** if `a[i-1] == b[j-1]`, `dp[i][j] = dp[i-1][j-1] + 1`. Otherwise `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`.
- **Base case:** `dp[0][j] = dp[i][0] = 0` (an empty string shares nothing).
- **Answer:** `dp[|a|][|b|]`.

Matching characters can always be paired up at the end, so taking the match is never worse. If they differ, at least one of the two last characters is unused.

```viz
algo: dp-grid
input:
  mode: lcs
  a: ABCBDAB
  b: BDCAB
```

## Edit distance

The **edit distance** between `a` and `b` is the fewest single-character operations (insert, delete, replace) that turn `a` into `b`. Spell checkers and diff tools use it.

- **State:** `dp[i][j]` = edit distance between the first `i` characters of `a` and the first `j` of `b`.
- **Transition:** `dp[i][j] = min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + (a[i-1] != b[j-1]))`. These are delete, insert, and replace (or keep, if equal).
- **Base case:** `dp[i][0] = i` (delete everything), `dp[0][j] = j` (insert everything).
- **Answer:** `dp[|a|][|b|]`.

```viz
algo: dp-grid
input:
  mode: edit-distance
  a: kitten
  b: sitting
```

Both table programs fit on one page. The program reads two words and prints the LCS length, then the edit distance.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    string a, b;
    cin >> a >> b;
    int n = a.size(), m = b.size();
    vector<vector<int>> lcs(n + 1, vector<int>(m + 1, 0));
    vector<vector<int>> ed(n + 1, vector<int>(m + 1, 0));
    for (int i = 0; i <= n; i++)
        for (int j = 0; j <= m; j++) {
            if (i == 0 || j == 0) { ed[i][j] = i + j; continue; }
            if (a[i - 1] == b[j - 1]) lcs[i][j] = lcs[i - 1][j - 1] + 1;
            else lcs[i][j] = max(lcs[i - 1][j], lcs[i][j - 1]);
            ed[i][j] = min({ed[i - 1][j] + 1, ed[i][j - 1] + 1,
                            ed[i - 1][j - 1] + (a[i - 1] != b[j - 1])});
        }
    cout << lcs[n][m] << "\n" << ed[n][m] << "\n";
}
```
```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String a = sc.next(), b = sc.next();
        int n = a.length(), m = b.length();
        int[][] lcs = new int[n + 1][m + 1];
        int[][] ed = new int[n + 1][m + 1];
        for (int i = 0; i <= n; i++)
            for (int j = 0; j <= m; j++) {
                if (i == 0 || j == 0) { ed[i][j] = i + j; continue; }
                if (a.charAt(i - 1) == b.charAt(j - 1)) lcs[i][j] = lcs[i - 1][j - 1] + 1;
                else lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
                int rep = ed[i - 1][j - 1] + (a.charAt(i - 1) != b.charAt(j - 1) ? 1 : 0);
                ed[i][j] = Math.min(Math.min(ed[i - 1][j] + 1, ed[i][j - 1] + 1), rep);
            }
        System.out.println(lcs[n][m] + "\n" + ed[n][m]);
    }
}
```
```input
kitten sitting
```
```output
4
3
```

The common subsequence is `ittn`; the three edits are k to s, e to i, and an inserted g.

```predict
lang: cpp
code: |
  string a = "ab", b = "ba";
  int dp[3][3];
  for (int i = 0; i <= 2; i++)
      for (int j = 0; j <= 2; j++) {
          if (i == 0) dp[i][j] = j;
          else if (j == 0) dp[i][j] = i;
          else dp[i][j] = min({dp[i-1][j] + 1, dp[i][j-1] + 1,
                               dp[i-1][j-1] + (a[i-1] != b[j-1])});
      }
  cout << dp[2][2];
prompt: What is the edit distance between "ab" and "ba"?
output: "2"
why: One edit is not enough, because no single insert, delete or replace turns ab into ba. Two replaces (a to b, b to a), or delete then insert, both work.
```

## Reading the table

- Row `i`, column `j` always means "prefixes of length `i` and `j`", so the table is one larger than the strings.
- In both string DPs, cell `(i, j)` uses only its left, upper and upper-left neighbours. Fill row by row, left to right.
- To recover the actual answer (not just its length), start at the last cell and walk back, each time moving to the neighbour that produced the value.

```blanks
prompt: Complete the LCS transition.
lang: cpp
code: |
  if (a[i - 1] [[==]] b[j - 1])
      lcs[i][j] = lcs[i - 1][j - 1] + [[1]];
  else
      lcs[i][j] = [[max]](lcs[i - 1][j], lcs[i][j - 1]);
why: A match extends the diagonal cell (both strings shrink by one) by one character. A mismatch drops one character from either string and keeps the better result.
```

## Complexity

- Time: $O(nm)$ cells, one step each.
- Memory: $O(nm)$. Each row depends only on the previous row, so two rows give $O(m)$ if you only need the value.
- Limits: $nm$ up to about $10^7$ is comfortable. Two strings of length $10^5$ do not fit this approach.

## Pitfalls

- **Off-by-one between string index and table index.** `dp[i][j]` uses `a[i-1]` and `b[j-1]`.
- **Forgetting base row and column.** In edit distance they are `i` and `j`, not zero.
- **Blocked start or end cell.** Check them before the loop.
- **Memory.** `int dp[5001][5001]` is about 100 MB. Use rolling rows or a smaller type when the limit is tight.
- **Subsequence versus substring.** For the longest common substring, a mismatch resets the cell to `0`.

:::truth
These three tables look like memorisation, and for a first pass that is fine. What carries over to new problems is the habit of asking "what do the prefixes of both inputs look like, and which last move led here?"
:::

```quiz
questions:
  - q: In LCS, `a[i-1] != b[j-1]`. What is `dp[i][j]`?
    options:
      - dp[i-1][j-1] + 1
      - max(dp[i-1][j], dp[i][j-1])
      - "0"
    answer: 1
    why: The two last characters cannot both be matched together, so one of them is dropped. The better of the two choices stays.
  - q: Why is `dp[i][0] = i` in edit distance?
    options:
      - Turning a prefix of length i into the empty string takes i deletions
      - The empty string has i characters
      - It makes the table symmetric
    answer: 0
    why: Each of the i characters must be deleted, one operation each.
```

```cards
- q: State and answer of LCS?
  a: dp[i][j] is the LCS length of the first i characters of a and first j of b. The answer is dp[|a|][|b|].
- q: Edit distance transition?
  a: min of delete (dp[i-1][j] + 1), insert (dp[i][j-1] + 1), and replace or keep (dp[i-1][j-1] + (a[i-1] != b[j-1])).
- q: Base cases of edit distance?
  a: dp[i][0] = i and dp[0][j] = j.
- q: How do you reduce the memory of a string DP?
  a: Keep only the previous row, since each cell uses only the previous row and the current one.
- q: Subsequence versus substring?
  a: A subsequence keeps order but may skip characters. A substring is contiguous.
```

## Notes

:::notes
- 2D DP: state is a pair (row, column) or (prefix of a, prefix of b); fill in an order that respects dependencies.
- Grid paths: `dp[i][j] = dp[i-1][j] + dp[i][j-1]`, zero on blocked cells, `dp[0][0] = 1`.
- LCS: match gives `dp[i-1][j-1] + 1`, mismatch gives `max(dp[i-1][j], dp[i][j-1])`.
- Edit distance: min of delete, insert, replace; base `dp[i][0] = i`, `dp[0][j] = j`.
- Table size is one larger than each string; `dp[i][j]` uses `a[i-1]`, `b[j-1]`.
- Time and memory are $O(nm)$; roll rows to save memory when only the value is needed.
- Walk back from the last cell to recover the actual subsequence or edit script.
- Longest palindromic subsequence = LCS of the string and its reverse.
:::
