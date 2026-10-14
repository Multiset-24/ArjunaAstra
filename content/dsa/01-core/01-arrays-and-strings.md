---
title: Arrays and Strings
summary: The loops, counters and in-place tricks that almost every easy and medium problem is built from.
minutes: 35
difficulty: beginner
rating: [800, 1200]
tags: [arrays, strings, fundamentals]
prereqs: [complexity, stl-and-collections]
problems:
  - cf: 71A
    name: Way Too Long Words
    rating: 800
  - cf: 112A
    name: Petya and Strings
    rating: 800
  - cf: 236A
    name: Boy or Girl
    rating: 800
    core: true
    note: distinct letters with a frequency array
  - cf: 1520A
    name: Do Not Be Distracted!
    rating: 800
    core: true
    note: frequency array plus one pass
  - cf: 1367A
    name: Short Substrings
    rating: 800
  - cf: 96A
    name: Football
    rating: 900
    note: longest run of equal characters
  - cf: 58A
    name: Chat room
    rating: 1000
    core: true
    note: subsequence check with one pointer
  - cf: 118A
    name: String Task
    rating: 1000
  - cf: 1155A
    name: Reverse a Substring
    rating: 1000
    note: look at adjacent pairs
  - lc: move-zeroes
    name: Move Zeroes
    difficulty: Easy
    note: the in-place write pointer
  - lc: valid-palindrome
    name: Valid Palindrome
    difficulty: Easy
  - lc: is-subsequence
    name: Is Subsequence
    difficulty: Easy
exercises:
  - Write a function that returns the longest run of equal characters in a string, then change it to return where the run starts.
  - Given an array, rotate it right by k positions using only O(1) extra memory (reversing three times works).
---

## The problem

You are given a string such as `abracadabra`. How many different letters does it contain?

That one question already needs the three habits of this lesson:

- Walk through the data in a controlled way.
- Count things in a small table instead of searching for them.
- Change data in place when memory or time is tight.

An **array** is a row of values stored one after another in memory, numbered from index 0 to n - 1. A **string** is an array of characters with a few extra tools. Reading `a[i]` costs the same for any i, which is called O(1), or constant time.

## Three words people mix up

| Word | Pieces must be | Example from `abcd` | How many in length n |
|---|---|---|---|
| Subarray / substring | next to each other | `bc` | n(n + 1) / 2 |
| Subsequence | in order, gaps allowed | `ad` | 2^n (including the empty one) |
| Subset | any, order ignored | `da` | 2^n |

Problems say which one they mean. Mixing them up is a common reason for a correct-looking solution to fail.

```quiz
questions:
  - q: How many non-empty subarrays does an array of length 5 have?
    options:
      - "5"
      - "15"
      - "31"
    answer: 1
    why: "A subarray is a choice of start and end with start <= end. That is 5 + 4 + 3 + 2 + 1 = 15."
  - q: "Is `ace` a subsequence of `abcde`? Is it a substring?"
    options:
      - Subsequence yes, substring no
      - Substring yes, subsequence no
      - Both yes
    answer: 0
    why: The letters appear in order, so it is a subsequence. They are not next to each other, so it is not a substring.
```

## Traversal patterns

Most array code is one of these loops. Learn to see which one a problem needs.

```cpp
for (int i = 0; i < n; i++) { }                          // forward
for (int i = n - 1; i >= 0; i--) { }                     // backward
for (int i = 0; i + 1 < n; i++) { /* a[i], a[i+1] */ }   // adjacent pairs
for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++) { }                  // all pairs, O(n^2)
```
```java
for (int i = 0; i < n; i++) { }                          // forward
for (int i = n - 1; i >= 0; i--) { }                     // backward
for (int i = 0; i + 1 < n; i++) { /* a[i], a[i+1] */ }   // adjacent pairs
for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++) { }                  // all pairs, O(n^2)
```

The last pattern does about n^2 / 2 steps. With n = 200,000 that is 2 x 10^10, far too slow for a typical limit of about 10^8 simple operations per second. The next sections show how to avoid it.

```predict
lang: cpp
code: |
  string s = "banana";
  int cnt[26] = {0};
  for (char c : s) cnt[c - 'a']++;
  cout << cnt['a' - 'a'] << " " << cnt['n' - 'a'] << " " << s.substr(1, 3);
output: 3 2 ana
why: banana has three a and two n. substr(1, 3) means start at index 1 and take 3 characters, which is ana.
```

## Brute force first

Count the distinct letters of `s`. The direct way: for each position, scan everything before it and see whether the letter was already there.

- Cost: about n^2 / 2 comparisons. Fine for n = 100, hopeless for n = 10^5.
- The waste: we keep re-reading the same characters to answer "have I seen this letter?".

## The idea: a frequency array

A lowercase letter is one of only 26 possibilities, so keep 26 counters. In C++ and Java, `c - 'a'` turns the letter into a number from 0 to 25, because characters are stored as numbers and `'a'`, `'b'`, ... are consecutive.

:::key
When the values come from a small known range, an array indexed by the value replaces searching with a single lookup. This is the simplest form of hashing.
:::

```blanks
prompt: Complete the frequency loop so it prints each present letter with its count.
lang: cpp
code: |
  int cnt[26] = {0};
  for (char c : s) cnt[[[c - 'a'|c-'a']]]++;
  for (int i = 0; i < 26; i++)
      if (cnt[i] > 0) cout << char([['a' + i|'a'+i]]) << cnt[i] << " ";
why: Subtracting 'a' maps a..z to 0..25. Adding 'a' back to the index recovers the letter.
```

## Template: count letters and test a palindrome

A palindrome reads the same in both directions. Two indices, one at each end, walk toward each other and compare.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    cin >> s;
    int cnt[26] = {0};
    for (char c : s) cnt[c - 'a']++;

    int distinct = 0;
    bool first = true;
    for (int i = 0; i < 26; i++) {
        if (cnt[i] == 0) continue;
        distinct++;
        if (!first) cout << " ";
        cout << char('a' + i) << "=" << cnt[i];
        first = false;
    }
    cout << "\n";

    bool pal = true;
    for (int l = 0, r = (int)s.size() - 1; l < r; l++, r--)
        if (s[l] != s[r]) { pal = false; break; }

    cout << "distinct=" << distinct << "\n";
    cout << "palindrome=" << (pal ? "yes" : "no") << "\n";
    return 0;
}
```
```java
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine().trim();
        int[] cnt = new int[26];
        for (int i = 0; i < s.length(); i++) cnt[s.charAt(i) - 'a']++;

        int distinct = 0;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 26; i++) {
            if (cnt[i] == 0) continue;
            if (distinct > 0) sb.append(' ');
            sb.append((char) ('a' + i)).append('=').append(cnt[i]);
            distinct++;
        }
        sb.append('\n');

        boolean pal = true;
        for (int l = 0, r = s.length() - 1; l < r; l++, r--)
            if (s.charAt(l) != s.charAt(r)) { pal = false; break; }

        sb.append("distinct=").append(distinct).append('\n');
        sb.append("palindrome=").append(pal ? "yes" : "no").append('\n');
        System.out.print(sb);
    }
}
```
```input
abracadabra
```
```output
a=5 b=2 c=1 d=1 r=2
distinct=5
palindrome=no
```

### Walkthrough

- Pass 1 reads each of the 11 characters once: `a` is counted 5 times, `b` 2, `r` 2, `c` 1, `d` 1.
- Pass 2 prints the non-zero counters in alphabetical order. Five are non-zero, so `distinct=5`.
- The palindrome loop compares `a` with `a`, then `b` with `r`. They differ, so it stops with `no`.

## In-place work

**In place** means the answer is built inside the same array, using O(1) extra memory. The standard tool is a read index that scans and a write index that marks where the next kept value goes.

```steps
title: Move zeros to the end of [0, 1, 0, 3, 12]
view: array
frames:
  - arr: [0, 1, 0, 3, 12]
    pointers: {w: 0, i: 0}
    note: "w is where the next non-zero value will be written. i scans the array."
  - arr: [1, 1, 0, 3, 12]
    pointers: {w: 1, i: 1}
    highlight: {0: done}
    note: a[1] = 1 is non-zero. Copy it to a[w], then w moves right.
  - arr: [1, 1, 0, 3, 12]
    pointers: {w: 1, i: 2}
    highlight: {0: done}
    note: a[2] = 0. Skip it, w stays.
  - arr: [1, 3, 0, 3, 12]
    pointers: {w: 2, i: 3}
    highlight: {0: done, 1: done}
    note: a[3] = 3 is copied to a[1].
  - arr: [1, 3, 12, 3, 12]
    pointers: {w: 3, i: 4}
    highlight: {0: done, 1: done, 2: done}
    note: a[4] = 12 is copied to a[2]. The scan is finished.
  - arr: [1, 3, 12, 0, 0]
    highlight: {0: done, 1: done, 2: done, 3: muted, 4: muted}
    note: Fill positions w to n - 1 with zeros.
```

```cpp
int w = 0;
for (int i = 0; i < n; i++)
    if (a[i] != 0) a[w++] = a[i];
while (w < n) a[w++] = 0;
```
```java
int w = 0;
for (int i = 0; i < n; i++)
    if (a[i] != 0) a[w++] = a[i];
while (w < n) a[w++] = 0;
```

The same pattern removes duplicates, deletes a value, or keeps only elements that pass a test. Reversing is the other classic: swap the two ends and move inward.

```order
prompt: Arrange the in-place reversal of a[0..n-1].
lang: cpp
code: |
  int l = 0, r = n - 1;
  while (l < r) {
      swap(a[l], a[r]);
      l++;
      r--;
  }
distractors:
  - "while (l <= r) {"
why: When l and r meet, the middle element stays where it is, so the loop needs l < r. Using <= still works but does a pointless self-swap.
```

## Strings and StringBuilder

| Operation | C++ `std::string` | Java `String` |
|---|---|---|
| Read `s[i]` | O(1) | O(1), `s.charAt(i)` |
| Change one character | O(1), `s[i] = 'x'` | not allowed, strings are immutable |
| Append one character | O(1) on average | O(n), it copies the whole string |
| Substring of length k | O(k) | O(k) |

Java strings never change after creation, so `s += c` inside a loop copies the string every time. For n = 10^5 that is billions of byte copies. Use `StringBuilder` and call `sb.append(c)`, which is O(1) on average.

:::truth
Java code that builds a long string with `+=` passes the samples and then fails on time limits. If a problem outputs many pieces, append to a `StringBuilder` and print once at the end.
:::

## Complexity

- Frequency counting: O(n) time, O(1) extra memory (26 counters).
- Two-ended palindrome check: O(n) time, O(1) memory.
- Write-pointer compaction: O(n) time, O(1) memory.
- Nested pair loop: O(n^2). Avoid it when n reaches about 10^5.

## Pitfalls

- **Unsigned size.** In C++, `s.size()` is unsigned. For an empty string, `s.size() - 1` wraps to a huge number. Cast with `(int)s.size() - 1`.
- **Going past the end.** In an adjacent-pairs loop, `i < n` with `a[i + 1]` reads out of bounds. Use `i + 1 < n`.
- **Off by one with 1-indexed input.** Many problems number elements from 1. Decide once whether you shift to 0-indexing, and stay consistent.
- **Overflow.** A sum of 2 x 10^5 values up to 10^9 needs `long long`, not `int`.
- **Java string comparison.** `==` compares references. Use `s.equals(t)`.

```cards
- q: What is the difference between a subarray and a subsequence?
  a: A subarray (or substring) is contiguous. A subsequence keeps the order but may skip elements.
- q: How do you count letters of a lowercase string in O(n)?
  a: Keep `cnt[26]` and do `cnt[c - 'a']++` for each character.
- q: What are the two indices in an in-place filter?
  a: A read index that scans every element and a write index that marks where the next kept element goes.
- q: Why is `s += c` in a Java loop slow?
  a: Strings are immutable, so each append copies the whole string. Use `StringBuilder`.
- q: Why write `(int)s.size() - 1` in C++?
  a: "`size()` is unsigned, so `size() - 1` on an empty string wraps around to a huge value."
```

## Notes

:::notes
- Subarray and substring are contiguous (n(n + 1) / 2 of them). A subsequence keeps order but may skip (2^n of them).
- Pick the loop shape first: forward, backward, adjacent pairs i and i + 1, or all pairs (O(n^2), usually too slow past n of about 10^4).
- Small value range means a counting array: `cnt[c - 'a']++` for lowercase letters.
- In-place filtering uses a read index i and a write index w: `if (keep) a[w++] = a[i]`.
- Reverse in place with two ends moving inward while `l < r`.
- Java: build long strings with `StringBuilder`, compare with `equals`. C++: `s.size()` is unsigned.
- Use `long long` or `long` for sums, and watch 0-indexed versus 1-indexed input.
:::
