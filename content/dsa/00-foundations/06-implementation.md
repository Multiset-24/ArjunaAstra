---
title: Implementation and Simulation
summary: Turn a statement into correct code step by step, with off-by-one control, string handling and a checklist for easy problems.
minutes: 25
difficulty: beginner
rating: [800, 1000]
tags: [implementation, simulation, strings, edge-cases]
prereqs: [how-to-think, language-setup]
problems:
  - cf: 263A
    name: Beautiful Matrix
    rating: 800
    core: true
  - cf: 282A
    name: Bit++
    rating: 800
  - cf: 116A
    name: Tram
    rating: 800
  - lc: fizz-buzz
    name: "Fizz Buzz"
    difficulty: Easy
  - lc: robot-return-to-origin
    name: "Robot Return to Origin"
    difficulty: Easy
  - cf: 266A
    name: Stones on the Table
    rating: 800
  - cf: 112A
    name: Petya and Strings
    rating: 800
    core: true
  - cf: 281A
    name: Word Capitalization
    rating: 800
  - cf: 96A
    name: Football
    rating: 900
  - cf: 118A
    name: String Task
    rating: 1000
    core: true
  - cf: 58A
    name: Chat room
    rating: 1000
  - cf: 339B
    name: Xenia and Ringroad
    rating: 1000
    note: simulate, watch the wrap-around
  - lc: spiral-matrix
    name: "Spiral Matrix"
    difficulty: Medium
  - lc: rotate-image
    name: "Rotate Image"
    difficulty: Medium
  - lc: game-of-life
    name: "Game of Life"
    difficulty: Medium
exercises:
  - Pick two problems from the list and write the checklist from this lesson next to each statement before coding.
  - Rewrite the robot program so it also prints the farthest distance from the origin.
---

## What "implementation" means

An **implementation problem** has no clever algorithm. The statement describes a process, and you must code it exactly. These are the bulk of Div. 2 A and B problems, and the usual reason a strong idea still gets Wrong Answer.

A **simulation** is the most direct kind: do what the statement says, step by step, keeping the state in variables.

## A simulation example

A robot starts at (0, 0) and reads a string of moves: `U` up, `D` down, `L` left, `R` right. Print its final x and y, and how many times it stood on (0, 0) after a move.

Plan: keep `x`, `y`, `back`. For each character change the position, then check for the origin.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    cin >> s;
    int x = 0, y = 0, back = 0;
    for (char c : s) {
        if (c == 'U') y++;
        else if (c == 'D') y--;
        else if (c == 'L') x--;
        else x++;
        if (x == 0 && y == 0) back++;
    }
    cout << x << " " << y << " " << back << "\n";
}
```
```java
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine().trim();
        int x = 0, y = 0, back = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == 'U') y++;
            else if (c == 'D') y--;
            else if (c == 'L') x--;
            else x++;
            if (x == 0 && y == 0) back++;
        }
        System.out.println(x + " " + y + " " + back);
    }
}
```
```input
RLUDRR
```
```output
2 0 2
```

Notice that the check happens after each move, and the starting position is not counted. That is the kind of detail the statement decides.

```quiz
q: In the robot program, what changes if the statement says the starting moment also counts as standing on (0, 0)?
options:
  - Initialise back = 1
  - Check the origin before every move
  - Nothing changes
answer: 0
why: The start is one extra visit. Everything after it is counted exactly as before.
```

## Off-by-one errors

An **off-by-one error** is a loop or count that is one too many or too few. The three usual causes:

- **Inclusive versus half-open ranges.** Positions `l` to `r` inclusive hold `r - l + 1` items. A half-open range `[l, r)`, which includes `l` but not `r`, holds `r - l`.
- **Index base.** Input is often 1-indexed, arrays are 0-indexed. Subtract 1 when reading.
- **Loop bounds.** `i < n` visits `0..n-1`; `i <= n` needs an array of size `n + 1`.

String functions are a classic trap, because C++ and Java disagree.

```steps
title: Same letters, two substring rules on "abcdef"
view: array
frames:
  - arr: ["a", "b", "c", "d", "e", "f"]
    note: The string has indices 0 to 5.
  - arr: ["a", "b", "c", "d", "e", "f"]
    highlight: {1: match, 2: match, 3: match, 4: match}
    note: C++ s.substr(1, 4) means start 1, length 4. It takes "bcde".
  - arr: ["a", "b", "c", "d", "e", "f"]
    highlight: {1: match, 2: match, 3: match}
    note: Java s.substring(1, 4) means from 1 up to but not including 4. It takes "bcd".
```

```blanks
prompt: Count and loop over the positions l..r inclusive.
lang: cpp
code: |
  int len = r - l [[+ 1|+1]];
  for (int i = l; i [[<=]] r; i++) total += a[i];
why: An inclusive range has r - l + 1 items, and the loop must use <= so that r itself is included.
```

## Strings

- C++ `string` is mutable. Java `String` is **immutable** (it cannot change), so building a result with `s += c` in a long loop is slow. Use `StringBuilder`.
- Compare Java strings with `.equals()`, never `==`, which compares object identity.
- Convert case with `tolower` / `toupper` (C++) or `toLowerCase()` / `toUpperCase()` (Java).
- A character is a number: `c - 'a'` is the letter's position 0..25.

```cpp
string s = "Hello";
string t = s.substr(1, 3);          // "ell": start, length
reverse(s.begin(), s.end());        // s is now "olleH"
int pos = 'e' - 'a';                // 4
```
```java
String s = "Hello";
String t = s.substring(1, 4);       // "ell": start, end (exclusive)
String r = new StringBuilder(s).reverse().toString();  // "olleH"
int pos = 'e' - 'a';                // 4
```

```predict
lang: cpp
code: |
  string s = "abcdef";
  cout << s.substr(1, 4) << " " << s.size();
output: bcde 6
why: substr takes a start and a length, so it returns four characters from index 1. The size is 6.
```

## A checklist for 800-1000 problems

Run it in the last two minutes before submitting.

1. **Output format**: case (`YES` versus `Yes`), spaces, one line versus many.
2. **Smallest input**: n = 1, an empty string, a single row.
3. **Largest input**: overflow, and running time.
4. **Index base** and the inclusive/exclusive choice.
5. **State reset** between test cases: counters, arrays, flags.
6. **All equal / all different** inputs, and ties.
7. **Do not edit a list while looping over it** unless you handle the shifting indices.

:::truth
These problems are rated 800 because the idea is easy, not because they are risk free. Most failed submissions at this level come from a detail in the list above, not from a missing algorithm. Speed comes from reading the statement slowly.
:::

```quiz
q: A problem gives n numbers and asks for the largest difference between two neighbouring numbers. Which input is most likely to break a careless solution?
options:
  - n = 1, there are no neighbours
  - n = 5 with random values
  - n = 2 with different values
answer: 0
why: With one number there is no pair, so the loop over neighbours never runs and the answer may be uninitialised. Check what the statement guarantees, then test the smallest allowed n.
```

## Cards

```cards
- q: What is an off-by-one error?
  a: A count or loop bound that is one too large or too small, often from inclusive versus exclusive ranges.
- q: How many items are in positions l..r inclusive? In [l, r)?
  a: r - l + 1 for inclusive, r - l for half-open.
- q: C++ substr versus Java substring?
  a: substr(start, length) versus substring(start, endExclusive).
- q: Why avoid s += c in a long Java loop?
  a: Strings are immutable, so each append copies the whole string. Use StringBuilder.
- q: Name three edge cases to test.
  a: The smallest allowed input, the largest allowed input, and all values equal.
```

## Notes

:::notes
- Implementation problems: do exactly what the statement says; keep state in variables.
- Inclusive range l..r has r - l + 1 items; half-open [l, r) has r - l.
- Convert 1-indexed input with minus 1.
- C++ substr(start, length); Java substring(start, endExclusive).
- Java strings are immutable and compared with equals; build with StringBuilder.
- Letter position: c - 'a'.
- Checklist: output format, smallest input, largest input, index base, reset between tests, ties.
:::
