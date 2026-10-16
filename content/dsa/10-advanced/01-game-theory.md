---
title: Game Theory, Nim and Grundy Numbers
summary: Decide who wins a two-player game with perfect play, using win/lose states, the XOR rule of Nim, and Grundy numbers for sums of games.
minutes: 45
difficulty: advanced
rating: [1400, 2200]
tags: [games, nim, grundy, sprague-grundy, dp, bitmasks]
prereqs: [bit-manipulation, dp-introduction, recursion]
problems:
  - lc: nim-game
    name: Nim Game
    difficulty: Easy
  - cses: 1729
    name: Stick Game
    note: win/lose DP over positions
  - cses: 1730
    name: Nim Game I
  - cf: 1370C
    name: Number Game
    rating: 1400
    core: true
    note: reason about the last move before reaching for theory
  - cf: 1537D
    name: Deleting Divisors
    rating: 1700
    core: true
    note: print win/lose for small n and find the pattern
  - cf: 1451D
    name: Circle Game
    rating: 1700
  - cf: 1396B
    name: Stoned Game
    rating: 1800
  - lc: can-i-win
    name: Can I Win
    difficulty: Medium
    note: win/lose states over a bitmask
  - cf: 455B
    name: A Lot of Games
    rating: 1900
    core: true
    note: win and lose flags on trie nodes
  - cf: 768E
    name: Game of Stones
    rating: 2100
    core: true
    note: Grundy value of each pile, then XOR
  - cf: 603C
    name: Lieges of Legendre
    rating: 2200
    note: Grundy values with a repeating pattern
---

## The problem

Two players take turns making moves in a game with no luck and no hidden information. Both play perfectly. In **normal play** the player who cannot move loses. Who wins from the starting position?

Games where both players have the same moves from every position are called **impartial**. Chess is not impartial (each player moves only their own pieces). Taking stones from piles is.

## Brute force first

- Build the whole game tree and play it out (minimax: you pick the best move, the opponent picks the worst for you). The tree is exponential in the game length.
- Many positions repeat, so memoise. That is the first real idea, and it already solves a lot.

## The idea: win and lose states

Label every position from the end of the game backwards.

- **Losing position (L):** the player to move loses. A position with no moves is L.
- **Winning position (W):** at least one move leads to an L position.
- A position is L exactly when **all** its moves lead to W positions.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;
    vector<int> mv(k);
    for (int &m : mv) cin >> m;
    vector<bool> win(n + 1, false);         // win[x]: the player to move at x wins
    for (int x = 0; x <= n; x++)
        for (int m : mv)
            if (x >= m && !win[x - m]) win[x] = true;
    string s;
    for (int x = 0; x <= n; x++) s += win[x] ? 'W' : 'L';
    cout << s << "\n";
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int n = Integer.parseInt(st.nextToken()), k = Integer.parseInt(st.nextToken());
        int[] mv = new int[k];
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < k; i++) mv[i] = Integer.parseInt(st.nextToken());
        boolean[] win = new boolean[n + 1];
        for (int x = 0; x <= n; x++)
            for (int m : mv)
                if (x >= m && !win[x - m]) win[x] = true;
        StringBuilder sb = new StringBuilder();
        for (int x = 0; x <= n; x++) sb.append(win[x] ? 'W' : 'L');
        System.out.println(sb);
    }
}
```
```input
12 3
1 3 4
```
```output
LWLWWWWLWLWWW
```

The game: a pile of $x$ stones, each move removes 1, 3 or 4 stones. The string shows positions $0$ to $12$. The L positions are $0, 2, 7, 9$, so the pattern repeats every 7.

```quiz
q: In the pile game with moves {1, 3, 4}, you start with 14 stones. Using the repeating pattern, who wins?
options:
  - The first player
  - The second player
  - It depends on the strategy
answer: 1
why: L positions repeat with period 7, at 0, 2, 7, 9, 14, 16 and so on. 14 is a multiple of 7, so the player to move at 14 loses and the second player wins.
```

:::tip
The most useful habit in contest game problems: write the slow win/lose DP, print it for small inputs, and **look at the pattern** (period, parity, a power of two). Then prove it or trust it and code the formula.
:::

## Nim

**Nim**: several piles of stones. A move removes any positive number of stones from one pile. Last player to move wins.

The rule: let $X$ be the XOR of all pile sizes.

- $X = 0$: the player to move loses.
- $X \ne 0$: the player to move wins.

To win from $X \ne 0$, find a pile $a_i$ with $a_i \oplus X < a_i$ and reduce it to $a_i \oplus X$. That makes the new XOR zero.

```predict
lang: cpp
code: |
  int x = 0;
  for (int p : {1, 2, 3}) x ^= p;
  cout << x << " " << (x ? "first" : "second");
output: 0 second
why: 1 xor 2 = 3, and 3 xor 3 = 0. The XOR is zero, so the player to move loses and the second player wins.
```

:::details[Why the XOR rule is true]
Three facts prove it by induction on the total number of stones.

- From $X = 0$, any move changes one pile, so the XOR becomes nonzero.
- From $X \ne 0$, take the highest set bit of $X$. Some pile has that bit set. Reducing that pile to $a_i \oplus X$ is a legal decrease (the top differing bit goes from 1 to 0) and makes the XOR zero.
- The terminal position (all piles empty) has $X = 0$ and is losing.

So zero-XOR positions are exactly the losing ones.
:::

## Grundy numbers: sums of games

Real problems often split into independent parts, such as several piles that each follow their own rules. The **Sprague-Grundy theorem** says every impartial game position behaves exactly like a Nim pile of some size, its **Grundy number** (or nim-value).

- $g(\text{position}) = \operatorname{mex}\{ g(\text{next}) \}$ over all moves.
- **mex** (minimum excluded value) of a set is the smallest non-negative integer not in it. $\operatorname{mex}\{0,1,3\} = 2$.
- A position with no moves has $g = 0$.
- For a sum of independent games, the Grundy number is the XOR of the parts. The first player wins exactly when that XOR is nonzero.

Note that $g = 0$ means losing, and a nonzero value means winning, so Grundy numbers refine win/lose labels.

```steps
title: Grundy values for one pile with moves {1, 3, 4}
view: array
frames:
  - arr: [0, 0, 0, 0, 0, 0, 0, 0]
    highlight: {0: done, 1: muted, 2: muted, 3: muted, 4: muted, 5: muted, 6: muted, 7: muted}
    note: g[0] = 0. No moves, so the set of reachable values is empty and its mex is 0.
  - arr: [0, 1, 0, 0, 0, 0, 0, 0]
    highlight: {1: active, 0: compare, 2: muted, 3: muted, 4: muted, 5: muted, 6: muted, 7: muted}
    note: From 1 you can reach 0 (g = 0). The set is {0}, so g[1] = 1.
  - arr: [0, 1, 0, 0, 0, 0, 0, 0]
    highlight: {2: active, 1: compare, 3: muted, 4: muted, 5: muted, 6: muted, 7: muted}
    note: From 2 you can only reach 1 (g = 1). The set is {1}, so g[2] = 0.
  - arr: [0, 1, 0, 1, 0, 0, 0, 0]
    highlight: {3: active, 2: compare, 0: compare, 4: muted, 5: muted, 6: muted, 7: muted}
    note: From 3 reach 2 and 0, both g = 0. The set is {0}, so g[3] = 1.
  - arr: [0, 1, 0, 1, 2, 0, 0, 0]
    highlight: {4: active, 3: compare, 1: compare, 0: compare, 5: muted, 6: muted, 7: muted}
    note: From 4 reach 3, 1, 0 with g = 1, 1, 0. The set is {0, 1}, so g[4] = 2.
  - arr: [0, 1, 0, 1, 2, 3, 0, 0]
    highlight: {5: active, 4: compare, 2: compare, 1: compare, 6: muted, 7: muted}
    note: From 5 reach 4, 2, 1 with g = 2, 0, 1. The set is {0, 1, 2}, so g[5] = 3.
  - arr: [0, 1, 0, 1, 2, 3, 2, 0]
    highlight: {6: active, 5: compare, 3: compare, 2: compare, 7: muted}
    note: From 6 reach 5, 3, 2 with g = 3, 1, 0. The set is {0, 1, 3}, so g[6] = 2.
  - arr: [0, 1, 0, 1, 2, 3, 2, 0]
    highlight: {7: bad, 6: compare, 4: compare, 3: compare}
    note: From 7 reach 6, 4, 3 with g = 2, 2, 1. The set is {1, 2}, which has no 0, so g[7] = 0 and 7 is a losing position.
```

Now the program: several piles, one shared move set, decide the winner.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int p, k;
    cin >> p >> k;
    vector<int> mv(k), piles(p);
    for (int &m : mv) cin >> m;
    for (int &x : piles) cin >> x;
    int mx = *max_element(piles.begin(), piles.end());
    vector<int> g(mx + 1, 0);
    for (int x = 0; x <= mx; x++) {
        set<int> seen;
        for (int m : mv)
            if (x >= m) seen.insert(g[x - m]);
        int v = 0;
        while (seen.count(v)) v++;          // mex
        g[x] = v;
    }
    int total = 0;
    for (int i = 0; i < p; i++) {
        cout << g[piles[i]] << (i + 1 < p ? ' ' : '\n');
        total ^= g[piles[i]];
    }
    cout << (total ? "First" : "Second") << "\n";
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int p = Integer.parseInt(st.nextToken()), k = Integer.parseInt(st.nextToken());
        int[] mv = new int[k], piles = new int[p];
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < k; i++) mv[i] = Integer.parseInt(st.nextToken());
        st = new StringTokenizer(br.readLine());
        int mx = 0;
        for (int i = 0; i < p; i++) { piles[i] = Integer.parseInt(st.nextToken()); mx = Math.max(mx, piles[i]); }
        int[] g = new int[mx + 1];
        for (int x = 0; x <= mx; x++) {
            HashSet<Integer> seen = new HashSet<>();
            for (int m : mv)
                if (x >= m) seen.add(g[x - m]);
            int v = 0;
            while (seen.contains(v)) v++;     // mex
            g[x] = v;
        }
        int total = 0;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < p; i++) {
            sb.append(g[piles[i]]).append(i + 1 < p ? ' ' : '\n');
            total ^= g[piles[i]];
        }
        sb.append(total != 0 ? "First" : "Second");
        System.out.println(sb);
    }
}
```
```input
3 3
1 3 4
5 12 7
```
```output
3 3 0
Second
```

The three piles have Grundy numbers 3, 3 and 0. Their XOR is 0, so the player to move loses. Two of the piles are winning positions on their own, but together they cancel, exactly like two equal Nim piles.

```blanks
prompt: Complete the mex computation (Java, one position x).
lang: java
code: |
  HashSet<Integer> seen = new HashSet<>();
  for (int m : mv)
      if (x >= m) seen.add(g[[[x - m|x-m]]]);
  int v = 0;
  while (seen.[[contains]](v)) v++;
  g[x] = v;
why: The reachable positions are x - m for each allowed move m, and their Grundy numbers go into the set. The mex is the first value in 0, 1, 2, ... that is missing from the set.
```

## When to use which tool

| Situation | Tool |
|---|---|
| One state space, small | Win/lose DP, print it, look for a pattern |
| Piles you can take any amount from | Nim: XOR of sizes |
| Independent parts with different rules | Grundy number per part, XOR them |
| Parts depend on each other | Not a sum of games: back to DP over the joint state |
| Players have different moves, or a player who cannot move wins (misère) | Different theory; usually the problem is built so a simple argument works |

## Complexity

- Win/lose DP over $S$ states with $M$ moves each: $O(S \cdot M)$.
- Grundy numbers: also $O(S \cdot M)$, plus the mex. The mex of $M$ values is at most $M$, so Grundy numbers stay small.
- Nim with $n$ piles: $O(n)$ for the XOR.

:::truth
Only a minority of game problems need Sprague-Grundy. Many Div. 2 B and C game problems are won by symmetry (mirror the opponent), parity, or brute force plus pattern. Reach for Grundy when the game clearly splits into independent parts, or when the state is a pile that splits into several piles.
:::

## Pitfalls

- **Losing means no good move, not no move.** In a W position every move you make may be fine; in an L position every move hands the opponent a win.
- **Grundy numbers do not decide scoring games.** They only answer "who wins" in normal play. If players collect points, use DP on score difference instead.
- **A move that splits a pile.** The new position is a sum of parts, so its Grundy value is the XOR of the parts' values (this is how Lieges of Legendre works).
- **Large piles.** If positions go to $10^9$, compute Grundy values for small $x$, find the repeating or arithmetic pattern, and use that.
- **Misreading who moves first.** Decide whether the answer is "first player wins" before you code. Off-by-one in the player roles is the most common wrong answer.

```order
prompt: Arrange the code that finds a winning move in Nim (piles a[0..n-1], X is their XOR and is not zero).
lang: cpp
code: |
  for (int i = 0; i < n; i++) {
      int target = a[i] ^ X;
      if (target < a[i]) {
          cout << "take " << a[i] - target << " from pile " << i;
          break;
      }
  }
distractors:
  - "      if (target > a[i]) {"
why: A legal move only decreases a pile. If a[i] xor X is smaller than a[i], reducing the pile to that value makes the new XOR zero. Larger targets would need adding stones.
```

## Notes

:::notes
- Impartial game, normal play: the player who cannot move loses. Both play perfectly.
- Position is L if every move leads to W (a terminal position is L). It is W if some move leads to L. Memoise.
- For small cases, print the W/L table and look for a period, parity or power-of-two pattern.
- Nim: XOR of pile sizes is zero means the player to move loses. Otherwise find a pile with a_i xor X < a_i and reduce it to a_i xor X.
- Grundy number g(x) = mex of g over all next positions. mex is the smallest non-negative integer missing from the set. No moves means g = 0.
- Sprague-Grundy: a sum of independent impartial games has Grundy number equal to the XOR of the parts. Nonzero means the first player wins.
- Splitting a pile into parts: XOR the Grundy values of the parts.
- Scoring games and misere play are not covered by this; use DP on score difference.
- First guess: mirror strategy, parity, or last-move reasoning, before the full theory.
:::

```cards
- q: When is a position winning in an impartial normal-play game?
  a: When at least one move leads to a losing position. It is losing when every move leads to a winning position, or when there are no moves.
- q: Who wins Nim with pile sizes whose XOR is 0?
  a: The second player (the player to move loses).
- q: How do you find a winning move in Nim?
  a: With XOR X not zero, find a pile a with (a xor X) < a and reduce it to a xor X, making the total XOR zero.
- q: What is mex of {0, 1, 3}?
  a: 2, the smallest non-negative integer not in the set.
- q: How do you combine Grundy numbers of independent games?
  a: XOR them. The first player wins exactly when the XOR is nonzero.
- q: What does Grundy number 0 mean for a position?
  a: The position is losing for the player to move.
```
