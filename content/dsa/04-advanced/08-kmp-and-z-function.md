---
title: KMP and Z-function
summary: Find a pattern in a text in linear time with the prefix function, and read borders and periods straight from the prefix and Z arrays.
minutes: 45
difficulty: advanced
rating: [1700, 2300]
tags: [strings, kmp, z-function, prefix-function]
prereqs: [arrays-and-strings, string-hashing]
problems:
  - lc: find-the-index-of-the-first-occurrence-in-a-string
    name: Find the Index of the First Occurrence in a String
    difficulty: Easy
  - cses: 1753
    name: String Matching
    note: count the occurrences of a pattern
  - cses: 1732
    name: Finding Borders
    note: all borders of a string
  - cses: 1733
    name: Finding Periods
  - cf: 471D
    name: MUH and Cube Walls
    rating: 1800
    core: true
    note: match differences of neighbouring heights, not the heights
  - lc: longest-happy-prefix
    name: Longest Happy Prefix
    difficulty: Hard
    note: the last value of the prefix function
  - cf: 535D
    name: Tavas and Malekas
    rating: 1900
    core: true
    note: check overlaps with the Z-function, count free positions
  - cf: 432D
    name: Prefixes and Suffixes
    rating: 2000
    core: true
    note: all borders, each counted by how often it occurs
  - lc: sum-of-scores-of-built-strings
    name: Sum of Scores of Built Strings
    difficulty: Hard
    note: the sum of the Z-function
  - cf: 808G
    name: Anthem of Berland
    rating: 2300
    note: prefix function as an automaton inside a DP
exercises:
  - Using only the prefix function, write a program that prints all borders of a string from longest to shortest.
  - Count how many times each prefix of a string appears in the whole string, in O(n), using the prefix function.
---

## The problem

You have a text `t` of length n and a pattern `p` of length m. List every position where `p` occurs in `t`. Both can have a million characters.

## Brute force first

- Try each start, compare up to m letters: O(n * m) worst case.
- The worst case is real: `t = aaaa...a`, `p = aaa...ab`. Every start matches almost all of the pattern before failing.
- The waste: after a mismatch, the brute force forgets that it just saw the first letters of `p` in `t`.

## The idea

A **border** of a string is a proper prefix (shorter than the whole string) that is also a suffix. `abcab` has the border `ab`.

The **prefix function** `pi[i]` is the length of the longest border of `s[0..i]`.

- Suppose `k` characters of the pattern are matched and the next text letter does not match.
- The last `k` text letters equal `p[0..k-1]`. So the next best candidate is the longest border of that prefix, which has length `pi[k-1]`.
- Fall back to `k = pi[k-1]` and try again. Repeat until a letter matches or `k = 0`.
- The text pointer never moves back.

```viz
algo: prefix-function
input:
  s: aabaaab
```

```quiz
q: What is the last value of the prefix function for abcabcabc?
options:
  - "3"
  - "6"
  - "8"
  - "9"
answer: 1
why: "The longest proper border is abcabc, of length 6. Length 9 is the whole string, which is not proper. A border of length 8 would need the first 8 letters to equal the last 8, which is false."
```

```predict
lang: cpp
code: |
  string s = "ababaca";
  int n = s.size();
  vector<int> pi(n, 0);
  for (int i = 1; i < n; i++) {
      int k = pi[i - 1];
      while (k > 0 && s[i] != s[k]) k = pi[k - 1];
      if (s[i] == s[k]) k++;
      pi[i] = k;
  }
  for (int x : pi) cout << x << " ";
output: 0 0 1 2 3 0 1
why: "The borders grow while ababa repeats (a, ab, aba), then the c breaks every border so pi drops to 0, and the last a matches the first letter again."
```

```order
prompt: Arrange the computation of the prefix function.
lang: cpp
code: |
  for (int i = 1; i < n; i++) {
      int k = pi[i - 1];
      while (k > 0 && s[i] != s[k]) k = pi[k - 1];
      if (s[i] == s[k]) k++;
      pi[i] = k;
  }
distractors:
  - "    int k = 0;"
  - "    while (k > 0 && s[i] != s[k]) k--;"
why: Start from the previous border. On a mismatch, jump to the next shorter border pi[k-1] instead of decrementing by one. If the letters match, the border grows by one.
```

## Template

The program reads the text on one line and the pattern on the next. It prints the number of occurrences, then their 1-based start positions.

```cpp
#include <bits/stdc++.h>
using namespace std;

vector<int> prefix_function(const string& s) {
    int n = s.size();
    vector<int> pi(n, 0);
    for (int i = 1; i < n; i++) {
        int k = pi[i - 1];
        while (k > 0 && s[i] != s[k]) k = pi[k - 1];  // fall back to a shorter border
        if (s[i] == s[k]) k++;
        pi[i] = k;
    }
    return pi;
}

int main() {
    string t, p;
    cin >> t >> p;
    vector<int> pi = prefix_function(p);
    vector<int> pos;
    int k = 0;  // length of the pattern prefix matched ending at t[i]
    for (int i = 0; i < (int)t.size(); i++) {
        while (k > 0 && (k == (int)p.size() || t[i] != p[k])) k = pi[k - 1];
        if (t[i] == p[k]) k++;
        if (k == (int)p.size()) pos.push_back(i - k + 2);  // 1-indexed start
    }
    printf("%d\n", (int)pos.size());
    for (size_t i = 0; i < pos.size(); i++) printf(i ? " %d" : "%d", pos[i]);
    printf("\n");
    return 0;
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static int[] prefixFunction(String s) {
        int n = s.length();
        int[] pi = new int[n];
        for (int i = 1; i < n; i++) {
            int k = pi[i - 1];
            while (k > 0 && s.charAt(i) != s.charAt(k)) k = pi[k - 1];
            if (s.charAt(i) == s.charAt(k)) k++;
            pi[i] = k;
        }
        return pi;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String t = br.readLine().trim();
        String p = br.readLine().trim();
        int[] pi = prefixFunction(p);
        StringBuilder sb = new StringBuilder();
        int count = 0, k = 0;
        for (int i = 0; i < t.length(); i++) {
            while (k > 0 && (k == p.length() || t.charAt(i) != p.charAt(k))) k = pi[k - 1];
            if (t.charAt(i) == p.charAt(k)) k++;
            if (k == p.length()) {
                count++;
                sb.append(i - k + 2).append(' ');
            }
        }
        System.out.println(count);
        System.out.println(sb.toString().trim());
    }
}
```
```input
aabaabaaab
aab
```
```output
3
1 4 8
```

The matching loop is the same fallback as in the prefix function. After a full match (`k == m`), fall back once so the next comparison is legal.

:::details[Why it is linear]
Every step adds at most 1 to `k`, so `k` goes up at most n times in total. Every fallback in the `while` loop strictly decreases `k`, and `k` never drops below 0. So the total number of fallbacks is at most n as well.
:::

## Walkthrough

For `t = aabaabaaab` and `p = aab`:

- The pattern has `pi = [0, 1, 0]`.
- Matches end at text indices 3, 6 and 10 (1-based), so they start at 1, 4 and 8.
- The program prints `3` and then `1 4 8`.
- After the first match at index 1, `k` falls back to `pi[2] = 0` and the scan continues from the next text letter.

## The Z-function

`z[i]` is the length of the longest common prefix of `s` and the suffix `s[i..]`.

- Keep the rightmost window `[l, r)` where a prefix match was found.
- For a new `i` inside the window, `z[i]` starts at `min(r - i, z[i - l])` because that part is a copy of earlier work. Then extend by direct comparison.
- Each extension moves `r` right, so the total is O(n).

```cpp
#include <bits/stdc++.h>
using namespace std;

vector<int> z_function(const string& s) {
    int n = s.size();
    vector<int> z(n, 0);
    for (int i = 1, l = 0, r = 0; i < n; i++) {  // [l, r) is the rightmost match of a prefix
        if (i < r) z[i] = min(r - i, z[i - l]);  // reuse what we already know
        while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;
        if (i + z[i] > r) { l = i; r = i + z[i]; }
    }
    return z;
}

int main() {
    string s;
    cin >> s;
    int n = s.size();
    vector<int> z = z_function(s);
    for (int i = 1; i < n; i++) printf(i > 1 ? " %d" : "%d", z[i]);
    printf("\n");
    int p = n;  // smallest period: first p with p + z[p] == n
    for (int i = 1; i < n; i++)
        if (i + z[i] == n) { p = i; break; }
    printf("period %d\n", p);
    return 0;
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static int[] zFunction(String s) {
        int n = s.length();
        int[] z = new int[n];
        for (int i = 1, l = 0, r = 0; i < n; i++) {
            if (i < r) z[i] = Math.min(r - i, z[i - l]);
            while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) z[i]++;
            if (i + z[i] > r) { l = i; r = i + z[i]; }
        }
        return z;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine().trim();
        int n = s.length();
        int[] z = zFunction(s);
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i < n; i++) sb.append(i > 1 ? " " : "").append(z[i]);
        System.out.println(sb);
        int p = n;
        for (int i = 1; i < n; i++)
            if (i + z[i] == n) { p = i; break; }
        System.out.println("period " + p);
    }
}
```
```input
abcabcabcab
```
```output
0 0 8 0 0 5 0 0 2 0
period 3
```

```blanks
prompt: Complete the Z-function loop.
lang: cpp
code: |
  for (int i = 1, l = 0, r = 0; i < n; i++) {
      if (i < r) z[i] = min([[r - i|r-i]], z[i - l]);
      while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;
      if (i + z[i] > r) { l = [[i]]; r = i + z[i]; }
  }
why: Inside the window, z[i] cannot exceed the room left in the window, r - i. When the match extends past r, the new window starts at i.
```

## What the arrays tell you

| Question | Prefix function | Z-function |
|---|---|---|
| Pattern in text | Match with the fallback loop | Z-values of `p + '#' + t` equal to m |
| Longest border | `pi[n-1]` | largest `n - i` with `i + z[i] = n` |
| All borders | `pi[n-1]`, `pi[pi[n-1]-1]`, ... | every `i` with `i + z[i] = n` gives the border `n - i` |
| Smallest period | `n - pi[n-1]` | smallest `i` with `i + z[i] = n` |
| String is a repetition of a block | period `p` with `p < n` and `n % p == 0` | same test with the Z period |

For `abcabcabcab` the program prints `period 3`. The period does not divide 11, so the string is not a whole repetition of `abc`.

## Complexity

- Prefix function, Z-function and matching: O(n + m) time, O(n + m) memory.

## Pitfalls

- Falling back with `pi[k]` instead of `pi[k-1]`. The index is the last matched letter.
- Not falling back after a full match. The next compare would read `p[m]`.
- Joining `p + '#' + t` when `#` can appear in the input. Use the two-step matching instead.
- Taking `z[0]` as meaningful. It is usually left as 0 or set to `n`.
- Building substrings with `substr` in a loop, which turns O(n) into O(n^2).

:::truth
Plain "find p in t" appears rarely in contests, since a library function does it. The value of KMP and Z is the arrays: borders, periods, counts of prefix occurrences, and automata for DP. Hashing can often replace them, but they are deterministic and just as short once you know them.
:::

```cards
- q: What is a border of a string?
  a: A proper prefix that is also a suffix. For abcab, the border is ab.
- q: What is pi[i]?
  a: The length of the longest proper border of s[0..i].
- q: How does KMP handle a mismatch with k letters matched?
  a: "Set `k = pi[k-1]` and retry. The text pointer never moves back."
- q: What is z[i]?
  a: The length of the longest common prefix of s and the suffix starting at i.
- q: Smallest period of a string from its prefix function?
  a: "`n - pi[n-1]`. The string is a whole repetition when that value divides n and is less than n."
```

## Notes

:::notes
- Border: a proper prefix that is also a suffix. `pi[i]` = longest border of `s[0..i]`.
- Prefix function: `k = pi[i-1]; while (k > 0 && s[i] != s[k]) k = pi[k-1]; if (s[i] == s[k]) k++; pi[i] = k;`
- KMP matching: same loop over the text; on `k == m` record a match, then fall back to `pi[m-1]`.
- Linear because `k` rises at most once per letter and every fallback lowers it.
- Z-function: `z[i]` = common prefix of `s` and `s[i..]`, using the window `[l, r)` and `min(r - i, z[i - l])`.
- Smallest period is `n - pi[n-1]`; a whole repetition needs it to divide `n`.
- All borders: follow `pi[n-1]`, `pi[pi[n-1]-1]`, and so on.
- Prefer the arrays over plain matching; use two-step matching to avoid a separator character.
:::
