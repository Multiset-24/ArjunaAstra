---
title: Stacks, Queues and Monotonic Structures
summary: Use a stack for matching and "nearest greater" questions and a deque for sliding-window maximum, each in a single linear pass.
minutes: 40
difficulty: intermediate
rating: [1000, 1600]
tags: [stack, queue, deque, monotonic, technique]
prereqs: [arrays-and-strings, sliding-window]
problems:
  - cf: 1374C
    name: Move Brackets
    rating: 1000
    core: true
    note: balance counter, the stack idea without the stack
  - lc: valid-parentheses
    name: Valid Parentheses
    difficulty: Easy
    core: true
  - lc: remove-all-adjacent-duplicates-in-string
    name: Remove All Adjacent Duplicates In String
    difficulty: Easy
    note: the string itself is the stack
  - lc: next-greater-element-i
    name: Next Greater Element I
    difficulty: Easy
  - cf: 26B
    name: Regular Bracket Sequence
    rating: 1400
    note: longest regular subsequence, count matched pairs
  - lc: min-stack
    name: Min Stack
    difficulty: Medium
    note: store the running minimum next to each value
  - lc: daily-temperatures
    name: Daily Temperatures
    difficulty: Medium
    core: true
    note: next greater element, answer is the distance
  - cf: 91B
    name: Queue
    rating: 1500
    note: farthest smaller element to the right
  - lc: sliding-window-maximum
    name: Sliding Window Maximum
    difficulty: Hard
    note: monotonic deque
  - lc: largest-rectangle-in-histogram
    name: Largest Rectangle in Histogram
    difficulty: Hard
    note: nearest smaller on both sides
  - cf: 547B
    name: Mike and Feet
    rating: 1900
    note: stretch; span in which each bar is the minimum
exercises:
  - Change the next-greater program to find the next smaller element instead. Which comparison flips?
  - Process a circular array by looping twice over the indices. Which problem on the list needs this idea?
---

## The problem

Three questions, one family:

1. Is a string of brackets like `([]{})` correctly nested?
2. For each element, where is the next element to its right that is larger?
3. For every window of k consecutive elements, what is the maximum?

Each asks about the most recent unresolved item, or the best item in a moving range. A **stack** and a **deque** answer them in one pass.

## Stack, queue, deque

| Structure | Rule | Operations |
|---|---|---|
| Stack | LIFO, last in first out | push, pop, top |
| Queue | FIFO, first in first out | push back, pop front, front |
| Deque (double-ended queue) | both ends | push and pop at front and back |

- C++: `vector` works as a stack (`push_back`, `back`, `pop_back`), `queue` and `deque` are in the library.
- Java: use `ArrayDeque` for all three. The old `Stack` class is slow and legacy.

```predict
lang: cpp
code: |
  stack<int> s;
  queue<int> q;
  for (int x : {1, 2, 3}) { s.push(x); q.push(x); }
  s.pop();
  q.pop();
  s.push(4);
  q.push(4);
  cout << s.top() << " " << q.front();
output: 4 2
why: The stack holds 1 2 4 and its top is the last pushed, 4. The queue held 1 2 3, lost 1 from the front, then gained 4 at the back, so its front is 2.
```

## Brackets

Scan left to right. An opening bracket waits on the stack. A closing bracket must match the **most recent** unmatched opener, which is the stack top.

- Closer arrives and the stack is empty: invalid.
- Closer does not match the top: invalid.
- Stack not empty at the end: invalid.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int t;
    cin >> t;
    while (t--) {
        string s;
        cin >> s;
        vector<char> st;
        bool ok = true;
        for (char c : s) {
            if (c == '(' || c == '[' || c == '{') {
                st.push_back(c);
            } else {
                if (st.empty()) { ok = false; break; }
                char o = st.back();
                st.pop_back();
                if ((c == ')' && o != '(') || (c == ']' && o != '[') || (c == '}' && o != '{')) {
                    ok = false;
                    break;
                }
            }
        }
        if (!st.empty()) ok = false;
        cout << (ok ? "YES" : "NO") << "\n";
    }
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int t = Integer.parseInt(br.readLine().trim());
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            String s = br.readLine().trim();
            ArrayDeque<Character> st = new ArrayDeque<>();
            boolean ok = true;
            for (char c : s.toCharArray()) {
                if (c == '(' || c == '[' || c == '{') {
                    st.push(c);
                } else {
                    if (st.isEmpty()) { ok = false; break; }
                    char o = st.pop();
                    if ((c == ')' && o != '(') || (c == ']' && o != '[') || (c == '}' && o != '{')) {
                        ok = false;
                        break;
                    }
                }
            }
            if (!st.isEmpty()) ok = false;
            out.append(ok ? "YES" : "NO").append("\n");
        }
        System.out.print(out);
    }
}
```
```input
4
([]{})
([)]
((
)(
```
```output
YES
NO
NO
NO
```

:::note
With only one kind of bracket, a counter replaces the stack: add 1 for `(`, subtract 1 for `)`, and fail if it ever goes below zero or ends nonzero. Many Codeforces bracket problems need only this.
:::

```quiz
questions:
  - q: Which string is correctly nested?
    options:
      - "{[}]"
      - "[({})]"
      - "(()"
      - "())("
    answer: 1
    why: "`[({})]` closes each bracket in reverse order of opening. `{[}]` closes `{` while `[` is still open, `(()` leaves one opener, and `())(` closes with an empty stack."
  - q: Why does the bracket scan use a stack rather than a queue?
    options:
      - A stack is faster
      - The closer must match the most recent unmatched opener, which is the last one pushed
      - A queue cannot store characters
    answer: 1
    why: "Nested brackets close in reverse order. LIFO gives you the latest opener first; a queue would give the oldest."
```

## Next greater element

For each `a[i]`, find the first `a[j]` with `j > i` and `a[j] > a[i]`.

**Brute force.** For each `i`, scan right until something larger appears. Worst case O(n^2), for example on a decreasing array.

**The idea.** Keep a stack of indices whose answer is still unknown. Their values are non-increasing from bottom to top, which is why this is called a **monotonic stack** (a stack whose values stay sorted).

- A new value `a[i]` is the answer for every stack element smaller than it. Pop those and record `a[i]`.
- Then push `i`.

Each index is pushed once and popped at most once, so the whole pass is O(n) even though there is a `while` inside the `for`. This is called **amortized** cost: the total over the loop, not the worst single step.

```viz
algo: monotonic-stack
input:
  arr: [2, 1, 2, 4, 3, 1, 5]
```

```order
prompt: Arrange the monotonic stack loop that fills res with the next greater value.
lang: cpp
code: |
  for (int i = 0; i < n; i++) {
      while (!st.empty() && a[st.back()] < a[i]) {
          res[st.back()] = a[i];
          st.pop_back();
      }
      st.push_back(i);
  }
distractors:
  - "    while (!st.empty() && a[st.back()] > a[i]) {"
why: Elements smaller than a[i] have just found their answer, so they pop. Whatever remains on the stack has no answer yet. The reversed comparison would find the next smaller element instead.
```

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n), res(n, -1);
    for (int& x : a) cin >> x;
    vector<int> st;
    for (int i = 0; i < n; i++) {
        while (!st.empty() && a[st.back()] < a[i]) {
            res[st.back()] = a[i];
            st.pop_back();
        }
        st.push_back(i);
    }
    for (int i = 0; i < n; i++) cout << res[i] << (i + 1 < n ? " " : "\n");
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringTokenizer tk = new StringTokenizer(br.readLine());
        int[] a = new int[n], res = new int[n];
        Arrays.fill(res, -1);
        for (int i = 0; i < n; i++) a[i] = Integer.parseInt(tk.nextToken());
        int[] st = new int[n];
        int top = 0;
        for (int i = 0; i < n; i++) {
            while (top > 0 && a[st[top - 1]] < a[i]) res[st[--top]] = a[i];
            st[top++] = i;
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) sb.append(res[i]).append(i + 1 < n ? " " : "\n");
        System.out.print(sb);
    }
}
```
```input
7
2 1 2 4 3 1 5
```
```output
4 2 4 5 5 5 -1
```

Variations come from changing the comparison or the direction:

- Next smaller: flip `<` to `>`.
- Previous greater: the stack top after popping is the answer, read it before pushing.
- Nearest smaller on both sides gives the widest range where a bar is the minimum, the core of the histogram problems.

## Sliding window maximum

For each window of size `k`, report its maximum.

**Brute force.** Scan each window: O(n x k).

**The idea.** Keep a **monotonic deque** of indices whose values decrease from front to back. The front is always the window maximum.

- A new element removes smaller elements from the back. They can never be a maximum while the new one is in the window.
- The front is removed when its index leaves the window.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (int& x : a) cin >> x;
    deque<int> dq;
    for (int i = 0; i < n; i++) {
        while (!dq.empty() && dq.front() <= i - k) dq.pop_front();
        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();
        dq.push_back(i);
        if (i >= k - 1) cout << a[dq.front()] << (i + 1 < n ? " " : "\n");
    }
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer tk = new StringTokenizer(br.readLine());
        int n = Integer.parseInt(tk.nextToken()), k = Integer.parseInt(tk.nextToken());
        int[] a = new int[n];
        tk = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) a[i] = Integer.parseInt(tk.nextToken());
        int[] dq = new int[n];
        int head = 0, tail = 0;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            while (head < tail && dq[head] <= i - k) head++;
            while (head < tail && a[dq[tail - 1]] <= a[i]) tail--;
            dq[tail++] = i;
            if (i >= k - 1) sb.append(a[dq[head]]).append(i + 1 < n ? " " : "\n");
        }
        System.out.print(sb);
    }
}
```
```input
8 3
1 3 -1 -3 5 3 6 7
```
```output
3 3 5 5 6 7
```

```blanks
prompt: Complete the two cleanup steps before pushing index i.
lang: java
code: |
  while (head < tail && dq[head] <= [[i - k|i-k]]) head++;
  while (head < tail && a[dq[tail - 1]] <= a[i]) [[tail--]];
  dq[tail++] = i;
why: The window is (i - k, i], so an index at or below i - k has expired and leaves from the front. Smaller or equal values at the back can never beat a[i] and are dropped by moving tail back.
```

## Complexity

- Brackets, next greater, sliding maximum: O(n) time, O(n) memory.
- Every index enters the structure once and leaves once, so total pushes and pops are at most 2n.

## Pitfalls

- **Store indices, not values.** Indices let you test whether an element left the window and let you compute distances.
- **Empty check first.** Always test `!st.empty()` before reading `back()` or `top()`.
- **Strict or non-strict.** `<` versus `<=` decides how ties behave. Decide what you want for equal values and test it on `[2, 2]`.
- **Java `Stack` and `LinkedList`.** Prefer `ArrayDeque` or plain arrays; they are faster and have no hidden synchronization.
- **Unresolved items.** Elements left on the stack at the end have no answer. Give them a default such as -1 or `n`.

:::truth
Monotonic structures feel unnatural the first time, and most people do not invent them on their own. Expect to read one solution, redo it from scratch a day later, and then meet the pattern again in a few different disguises before it becomes automatic. The histogram problem is a good test of whether it has stuck.
:::

```cards
- q: What invariant does the next-greater monotonic stack keep?
  a: Indices of elements still waiting for an answer, with values non-increasing from bottom to top.
- q: Why is the monotonic stack O(n) despite a while loop inside a for loop?
  a: Each index is pushed once and popped at most once, so total work is at most 2n. This is amortized cost.
- q: In the sliding-window maximum, which two removals happen before pushing index i?
  a: Pop the front if its index is at most i - k (expired), and pop the back while its value is at most a[i] (dominated).
- q: When does a counter replace a stack for brackets?
  a: "With only one kind of bracket. Track the balance and fail if it goes negative or ends nonzero."
```

## Notes

:::notes
- Stack is LIFO, queue is FIFO, deque works at both ends. Use `ArrayDeque` in Java, `vector` or `deque` in C++.
- Brackets: push openers, a closer must match the top; invalid if empty on closer or non-empty at the end.
- One bracket kind only: a balance counter is enough.
- Monotonic stack keeps indices of unresolved items. A new value pops every smaller one and becomes their answer.
- Amortized O(n): each index is pushed once and popped once.
- Flip the comparison for next smaller; read the top after popping for previous greater.
- Sliding window maximum: monotonic deque with decreasing values; drop expired indices at the front, dominated ones at the back.
- Store indices, check empty before reading, decide strict versus non-strict for ties.
:::
