---
title: Trie (Prefix Tree)
summary: Store strings or binary numbers on the edges of a tree so prefix questions and maximum-XOR questions take time proportional to the length, not the count.
minutes: 40
difficulty: advanced
rating: [1700, 2200]
tags: [trie, strings, bitmasks, data-structures]
prereqs: [bit-manipulation, trees-basics, hashing-and-frequency]
problems:
  - lc: implement-trie-prefix-tree
    name: Implement Trie (Prefix Tree)
    difficulty: Medium
    core: true
  - lc: maximum-xor-of-two-numbers-in-an-array
    name: Maximum XOR of Two Numbers in an Array
    difficulty: Medium
    core: true
  - cf: 706D
    name: Vasiliy's Multiset
    rating: 1800
    core: true
    note: add, remove and max-XOR queries; keep a count on every node
  - cf: 455B
    name: A Lot of Games
    rating: 1900
    note: win/lose states on the nodes of a trie
  - cf: 842D
    name: Vitya and Strange Lesson
    rating: 2000
    note: XOR every element by x, then find the mex with a trie
  - cf: 817E
    name: Choosing The Commander
    rating: 2000
    note: count numbers whose XOR with p is below l
  - lc: word-search-ii
    name: Word Search II
    difficulty: Hard
  - cf: 665E
    name: Beautiful Subarrays
    rating: 2100
    core: true
    note: prefix XORs plus counting pairs with XOR at least k
  - cf: 282E
    name: Sausage Maximization
    rating: 2200
---

## The problem

Two questions that look unrelated share one answer.

- You store $n$ words. How many of them start with a given prefix such as `app`?
- You store $n$ numbers. Which one gives the largest XOR (bitwise exclusive or: each bit is 1 when the two input bits differ) with a number $x$?

Both ask about the **leading part** of an item: leading letters, or leading bits.

## Brute force first

- Scan all $n$ items and compare each one with the query: $O(n \cdot L)$ per query, where $L$ is the length (letters, or 30 bits).
- With $n = q = 10^5$ and $L = 30$ that is about $3 \cdot 10^{11}$ steps. Too slow.
- A hash set answers "is this exact word stored" in $O(L)$, but it cannot answer prefix questions. Every prefix is a different key and the set does not know they are related.

## The idea: share the prefixes

A **trie** (say "try", from retrieval) is a rooted tree where each edge carries one character. A word is the path from the root to some node.

- Words that share a prefix share the first part of the path, so `app`, `apple` and `apply` use one chain `a - p - p` and then branch.
- Each node keeps a counter: how many inserted words pass through it. The counter of the node reached by `app` is the number of words with that prefix.
- Every operation walks down one edge per character, so it costs $O(L)$ and does not depend on $n$.

```quiz
q: A trie holds the words "tea", "ten" and "to". How many nodes does it have, counting the root?
options:
  - "4"
  - "6"
  - "8"
  - "9"
answer: 1
why: "Root, then t, then e and o under t, then a and n under e. That is 1 + 1 + 2 + 2 = 6. The shared first letter t is stored once."
```

## Template: lowercase words

Store children in a table `nxt[node][letter]`. Node 0 is the root, and `0` in a child slot means "no child" (the root is never anyone's child).

```cpp
#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;      // total number of letters over all words, plus 1
int nxt[MAXN][26], cnt[MAXN], tot = 1;

void insert(const string& s) {
    int v = 0;
    for (char ch : s) {
        int c = ch - 'a';
        if (!nxt[v][c]) nxt[v][c] = tot++;
        v = nxt[v][c];
        cnt[v]++;             // one more word passes through v
    }
}

int countPrefix(const string& p) {
    int v = 0;
    for (char ch : p) {
        v = nxt[v][ch - 'a'];
        if (!v) return 0;     // the path stops: no word has this prefix
    }
    return cnt[v];
}

int main() {
    int n, q;
    cin >> n >> q;
    for (int i = 0; i < n; i++) { string s; cin >> s; insert(s); }
    while (q--) { string p; cin >> p; cout << countPrefix(p) << "\n"; }
}
```
```java
import java.io.*;

public class Main {
    static final int MAXN = 100005;
    static int[][] nxt = new int[MAXN][26];
    static int[] cnt = new int[MAXN];
    static int tot = 1;

    static void insert(String s) {
        int v = 0;
        for (int i = 0; i < s.length(); i++) {
            int c = s.charAt(i) - 'a';
            if (nxt[v][c] == 0) nxt[v][c] = tot++;
            v = nxt[v][c];
            cnt[v]++;
        }
    }

    static int countPrefix(String p) {
        int v = 0;
        for (int i = 0; i < p.length(); i++) {
            v = nxt[v][p.charAt(i) - 'a'];
            if (v == 0) return 0;
        }
        return cnt[v];
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] first = br.readLine().trim().split(" ");
        int n = Integer.parseInt(first[0]), q = Integer.parseInt(first[1]);
        for (int i = 0; i < n; i++) insert(br.readLine().trim());
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) sb.append(countPrefix(br.readLine().trim())).append('\n');
        System.out.print(sb);
    }
}
```
```input
5 4
apple
app
apply
bat
ban
app
ba
b
c
```
```output
3
2
2
0
```

```blanks
prompt: Complete the descent in a trie lookup (Java).
lang: java
code: |
  int v = 0;
  for (int i = 0; i < p.length(); i++) {
      v = nxt[v][p.charAt(i) - 'a'];
      if ([[v == 0|v==0]]) return 0;
  }
  return [[cnt[v]]];
why: A missing child is stored as 0, so reaching 0 means no word has this prefix. Otherwise the counter of the last node is the answer.
```

:::note
To test for a whole word (not just a prefix) add a second counter `ends[v]`, incremented only at the last node of an insert. A word exists if `ends[v] > 0`.
:::

## Binary trie: maximum XOR

Treat each number as a string of 30 bits (enough for values below $2^{30} \approx 1.07 \cdot 10^9$), most significant bit first. Each node has two children: bit 0 and bit 1.

To maximise $x \oplus y$ over stored $y$:

- The highest bit matters more than all lower bits together, so decide it first.
- At each bit, if a child with the **opposite** bit of $x$ exists, go there: this bit of the XOR becomes 1.
- Otherwise go to the only child that exists: this bit of the XOR is 0.

This greedy is safe because one higher 1 beats any combination of lower bits.

```viz
algo: bits
input:
  a: 12
  b: 10
```

Flip bits and watch XOR: it is 1 exactly where the two numbers differ. Now the full program, which finds the best pair in an array by inserting numbers one at a time.

```cpp
#include <bits/stdc++.h>
using namespace std;

vector<array<int, 2>> t(1, {0, 0});   // t[v][bit] = child, 0 means none

void add(int x) {
    int v = 0;
    for (int b = 29; b >= 0; b--) {
        int c = (x >> b) & 1;
        if (!t[v][c]) { t[v][c] = t.size(); t.push_back({0, 0}); }
        v = t[v][c];
    }
}

int best(int x) {                      // max of x ^ y over stored y
    int v = 0, res = 0;
    for (int b = 29; b >= 0; b--) {
        int c = (x >> b) & 1;
        if (t[v][c ^ 1]) { res |= 1 << b; v = t[v][c ^ 1]; }
        else v = t[v][c];
    }
    return res;
}

int main() {
    int n;
    scanf("%d", &n);
    vector<int> a(n);
    for (int &x : a) scanf("%d", &x);
    int ans = 0;
    add(a[0]);
    for (int i = 1; i < n; i++) {
        ans = max(ans, best(a[i]));
        add(a[i]);
    }
    printf("%d\n", ans);
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static int[][] t;
    static int tot = 1;

    static void add(int x) {
        int v = 0;
        for (int b = 29; b >= 0; b--) {
            int c = (x >> b) & 1;
            if (t[v][c] == 0) t[v][c] = tot++;
            v = t[v][c];
        }
    }

    static int best(int x) {
        int v = 0, res = 0;
        for (int b = 29; b >= 0; b--) {
            int c = (x >> b) & 1;
            if (t[v][c ^ 1] != 0) { res |= 1 << b; v = t[v][c ^ 1]; }
            else v = t[v][c];
        }
        return res;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringTokenizer st = new StringTokenizer(br.readLine());
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = Integer.parseInt(st.nextToken());
        t = new int[n * 30 + 2][2];
        int ans = 0;
        add(a[0]);
        for (int i = 1; i < n; i++) {
            ans = Math.max(ans, best(a[i]));
            add(a[i]);
        }
        System.out.println(ans);
    }
}
```
```input
6
3 10 5 25 2 8
```
```output
28
```

Walkthrough on `5` and `25` (the best pair): in 5-bit form $5 = 00101$ and $25 = 11001$. Looking from the top, the bits differ at positions 4, 3 and 2, giving $11100 = 28$. At each of those bits, the trie held a child on the opposite side, so the greedy took it.

```predict
lang: cpp
code: |
  int x = 6;            // 110
  int y = 3;            // 011
  cout << (x ^ y) << " " << ((x ^ y) > (x | y) ? "xor" : "or");
output: 5 or
why: 6 xor 3 = 101 = 5, while 6 or 3 = 111 = 7. Differing bits give 1 in XOR, but OR is 1 whenever either bit is 1, so OR is never smaller.
```

## Variations you will meet

- **Delete.** Walk the path and decrement the counters. A node whose counter reaches 0 is empty, so the walk treats it as "no child". This is how Vasiliy's Multiset works.
- **XOR below a limit.** Walk the bits of $x$ and the limit together. At a bit where the limit has a 1, every number in the child that gives XOR bit 0 is entirely below the limit, so add that child's counter and continue on the other child.
- **Prefix XOR trick.** The XOR of a subarray is `p[r] ^ p[l-1]`, so "best subarray XOR" becomes "best pair of prefix XORs".
- **Trie on a tree of strings.** For a game on words, mark each node as winning or losing for the player to move, and fill it from the leaves up.

```order
prompt: Arrange the insert loop of a binary trie that also counts how many numbers pass each node.
lang: cpp
code: |
  int v = 0;
  for (int b = 29; b >= 0; b--) {
      int c = (x >> b) & 1;
      if (!t[v][c]) { t[v][c] = t.size(); t.push_back({0, 0}); }
      v = t[v][c];
      cnt[v]++;
  }
distractors:
  - "      v = c;"
why: The loop picks the bit, creates the child if missing, moves into it, then counts the visit. Assigning the bit itself to v would jump to node 0 or 1 instead of following the stored child.
```

## Complexity

| Item | Cost |
|---|---|
| Insert, lookup, prefix count | $O(L)$ |
| Max XOR query on 30-bit numbers | $O(30)$ |
| Memory | at most (total letters + 1) nodes |
| Array table of 26 children | 26 ints per node, even if a node has one child |

:::truth
A trie trades memory for speed. With $10^6$ letters and a 26-wide table you store 26 million ints, about 100 MB. If memory is tight, use `map<char,int>` children, or sort the strings and binary search, or use hashing.
:::

## Pitfalls

- **Memory size.** Size `nxt` by the total number of letters, not by the number of words. For binary tries it is `n * 30 + 2` nodes.
- **Using 0 as "no child".** This works only because the root is never a child. If you start node numbering at 1 for the root, use -1 for "none" instead.
- **Bit width.** If values reach $2 \cdot 10^9$ or more, use 31 or 32 bits, and in Java watch the sign bit.
- **Forgetting to reset.** With many test cases, clear only the nodes you used (`tot` of them), not the whole array.
- **Empty trie.** Querying max XOR before inserting anything walks into node 0 forever. Insert first, or guard with a size check.

```quiz
q: In the max-XOR trie, at some bit the opposite child exists but leads to a smaller total after all lower bits. Should you still take it?
options:
  - No, compare both subtrees fully first
  - Yes, because a 1 in a higher bit beats any lower bits combined
  - Only if the lower bits are all zero
answer: 1
why: A 1 at bit b is worth 2^b, while all lower bits together add at most 2^b - 1. So taking the opposite child at the highest possible bit is never worse.
```

## Notes

:::notes
- A trie stores strings (or binary numbers) as root-to-node paths; shared prefixes share nodes.
- Insert, lookup and prefix count cost O(L) per item, independent of how many items are stored.
- Keep cnt[v] (words through v) for prefix counts, and ends[v] if you need whole-word tests.
- Array form: nxt[node][26], node 0 is the root, 0 in a child slot means none. Size it by total letters + 1.
- Binary trie: bits from the highest down. For max x ^ y, prefer the child with the opposite bit; else take the only child.
- Greedy per bit is correct because one higher 1 outweighs all lower bits together.
- Deletion: decrement counters along the path; treat counter 0 as a missing child.
- Subarray XOR = p[r] ^ p[l-1], so subarray problems become pair problems on prefix XORs.
- Memory is the cost: 26 ints per node. Fall back to map children or hashing if needed.
:::

```cards
- q: What does a trie share between words?
  a: Their common prefixes. Words with the same first k letters use the same first k nodes.
- q: Cost of insert and prefix count in a trie?
  a: O(L), the length of the string, independent of the number of stored strings.
- q: How do you get the number of words with a given prefix?
  a: Keep a counter on each node of how many inserted words pass through it, walk the prefix and read the last node's counter.
- q: How does a binary trie find the max of x XOR y over stored y?
  a: From the top bit down, go to the child with the opposite bit when it exists (that bit of the XOR becomes 1), otherwise go to the other child.
- q: Why do prefix XORs help with subarray XOR problems?
  a: The XOR of a[l..r] equals p[r] XOR p[l-1], so you only need the best pair of prefix values.
- q: What is the main weakness of an array trie?
  a: Memory. Each node holds a full child table (26 ints for lowercase letters), even when most slots are empty.
```
