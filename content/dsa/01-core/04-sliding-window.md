---
title: Sliding Window
summary: Keep a moving range of the array and update its total as it grows and shrinks, instead of recomputing it each time.
minutes: 35
difficulty: intermediate
rating: [1000, 1500]
tags: [arrays, strings, technique, two-pointers]
prereqs: [two-pointers, prefix-sums]
problems:
  - cf: 1690D
    name: Black and White Stripe
    rating: 1000
    core: true
    note: fixed window
  - cf: 1840C
    name: Ski Resort
    rating: 1000
    note: count segments by their length
  - lc: maximum-average-subarray-i
    name: Maximum Average Subarray I
    difficulty: Easy
  - cses: 1141
    name: Playlist
    note: longest window with all values distinct
  - cf: 1354B
    name: Ternary String
    rating: 1200
    note: shortest window containing 1, 2 and 3
  - cf: 1692E
    name: Binary Deque
    rating: 1200
    core: true
    note: longest window with a given sum
  - lc: longest-substring-without-repeating-characters
    name: Longest Substring Without Repeating Characters
    difficulty: Medium
    core: true
  - lc: minimum-size-subarray-sum
    name: Minimum Size Subarray Sum
    difficulty: Medium
  - cf: 279B
    name: Books
    rating: 1400
    note: longest window with sum at most t
  - cf: 676C
    name: Vasya and String
    rating: 1500
    core: true
    note: window with at most k letters to change
  - lc: permutation-in-string
    name: Permutation in String
    difficulty: Medium
  - lc: sliding-window-maximum
    name: Sliding Window Maximum
    difficulty: Hard
exercises:
  - Count the subarrays of a positive array whose sum is at most S using one pass.
  - Find the longest substring in which every letter appears at most twice.
---

## The problem

Two questions that look alike:

1. Given an array and a number k, find the largest sum of k consecutive elements.
2. Given an array of positive numbers and a number s, find the shortest run of consecutive elements whose sum is at least s.

A run of consecutive elements is a **window**. Both questions ask about windows, so you inspect them one after another while sliding the window rightward.

## Brute force first

Try every window and add its elements.

- Question 1: n - k + 1 windows of k elements each, so O(n x k).
- Question 2: every pair (start, end), so O(n^2) windows, and O(n^3) if you re-add each one.

Neighbouring windows share almost all their elements. Recomputing them is the waste.

## Fixed window: add one, remove one

When the window moves one step right, one element enters and one leaves. Update the total with two operations.

```viz
algo: sliding-window
input:
  arr: [2, 1, 5, 1, 3, 2]
  mode: fixed
  k: 3
```

```blanks
prompt: Complete the fixed-window loop. The window holds a[r-k+1 .. r].
lang: java
code: |
  long sum = 0, best = Long.MIN_VALUE;
  for (int r = 0; r < n; r++) {
      sum += a[r];
      if (r >= k) sum -= a[[[r - k]]];
      if (r >= k - 1) best = Math.max(best, sum);
  }
why: After adding a[r] the window has k + 1 elements, and the one that must leave is the oldest, at index r - k. The window is full once r >= k - 1.
```

Cost: O(n).

## Variable window: grow right, shrink left

For question 2 the length is not fixed. Use two indices `l` and `r`:

1. Move `r` right and add `a[r]` to the window.
2. While the window is **valid** (sum >= s), record its length and remove `a[l]` by moving `l` right.

```viz
algo: sliding-window
input:
  arr: [2, 3, 1, 2, 4, 3]
  mode: variable
  s: 7
```

Why this is correct: with positive numbers, removing an element always lowers the sum. If a window starting at `l` is already valid, any longer window with the same start is also valid but longer, so only the shortest matters. Once `l` has been advanced, we never need to look at it again.

```quiz
q: The array may contain negative numbers. Why does the shrink loop from above stop being correct?
options:
  - Negative numbers make the sum overflow
  - Removing a negative element can raise the sum, so the window can become valid again after shrinking, and the pointers lose a case
  - The window length becomes negative
answer: 1
why: The method needs "bigger window means bigger sum", which holds only for non-negative values. With negatives the condition is not monotonic, so use prefix sums with a sorted structure or a hash map instead.
```

## Template: shortest subarray with sum at least s

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    long long s;
    cin >> n >> s;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;          // all positive

    int best = INT_MAX, l = 0;
    long long sum = 0;
    for (int r = 0; r < n; r++) {
        sum += a[r];                     // grow the window to the right
        while (sum >= s) {               // valid: try to shrink from the left
            best = min(best, r - l + 1);
            sum -= a[l++];
        }
    }
    cout << (best == INT_MAX ? 0 : best) << "\n";
    return 0;
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int n = Integer.parseInt(st.nextToken());
        long s = Long.parseLong(st.nextToken());
        long[] a = new long[n];
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());   // all positive

        int best = Integer.MAX_VALUE, l = 0;
        long sum = 0;
        for (int r = 0; r < n; r++) {
            sum += a[r];                 // grow the window to the right
            while (sum >= s) {           // valid: try to shrink from the left
                best = Math.min(best, r - l + 1);
                sum -= a[l++];
            }
        }
        System.out.println(best == Integer.MAX_VALUE ? 0 : best);
    }
}
```
```input
6 7
2 3 1 2 4 3
```
```output
2
```

### Walkthrough

- `r` moves to index 3: window `2 3 1 2` has sum 8, valid, length 4. Shrink to `3 1 2` (sum 6), stop.
- `r = 4`: window `3 1 2 4` has sum 10, length 4. Shrink to `1 2 4` (7, length 3), then `2 4` (6), stop.
- `r = 5`: window `2 4 3` has sum 9. Shrink to `4 3` (7, length 2). Shrink again to `3` (3), stop.
- The shortest valid length seen is 2.

### Shortest or longest

- **Shortest valid window:** record the length inside the `while` loop, while the window is valid.
- **Longest valid window:** shrink while the window is **invalid**, then record the length after the loop.

## At most K versus exactly K

Counting windows is a different job. For each `r`, let `l` be the smallest start so that `a[l..r]` is valid under an "at most" rule. Then all `r - l + 1` starts from `l` to `r` give valid windows, because shrinking a window that satisfies "at most" keeps it valid.

"Exactly K distinct values" does not shrink cleanly, so use subtraction:

$$ \text{exactly}(K) = \text{atMost}(K) - \text{atMost}(K-1) $$

Likewise, "at least K" is the total count of windows minus `atMost(K-1)`. To track distinct values, keep a **frequency table** (count per value) and a `distinct` counter that changes only when a count moves between 0 and 1.

```cpp
#include <bits/stdc++.h>
using namespace std;

int n;
vector<int> a;

// number of subarrays with at most k distinct values
long long atMost(int k) {
    vector<int> freq(n + 1, 0);
    int distinct = 0, l = 0;
    long long total = 0;
    for (int r = 0; r < n; r++) {
        if (freq[a[r]]++ == 0) distinct++;
        while (distinct > k) {
            if (--freq[a[l++]] == 0) distinct--;
        }
        total += r - l + 1;              // every start in [l, r] works
    }
    return total;
}

int main() {
    int k;
    cin >> n >> k;
    a.resize(n);
    for (auto &x : a) cin >> x;          // values in 1..n
    cout << atMost(k) - atMost(k - 1) << "\n";
    return 0;
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static int n;
    static int[] a;

    // number of subarrays with at most k distinct values
    static long atMost(int k) {
        int[] freq = new int[n + 1];
        int distinct = 0, l = 0;
        long total = 0;
        for (int r = 0; r < n; r++) {
            if (freq[a[r]]++ == 0) distinct++;
            while (distinct > k) {
                if (--freq[a[l++]] == 0) distinct--;
            }
            total += r - l + 1;          // every start in [l, r] works
        }
        return total;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        n = Integer.parseInt(st.nextToken());
        int k = Integer.parseInt(st.nextToken());
        a = new int[n];
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) a[i] = Integer.parseInt(st.nextToken());   // values in 1..n
        System.out.println(atMost(k) - atMost(k - 1));
    }
}
```
```input
5 2
1 2 1 2 3
```
```output
7
```

With `[1, 2, 1, 2, 3]` and K = 2, `atMost(2) = 12` and `atMost(1) = 5`, so exactly 2 distinct values appear in 12 - 5 = 7 subarrays.

```predict
lang: cpp
code: |
  int a[] = {1, 2, 1, 2, 3};
  int n = 5, k = 2, l = 0, distinct = 0;
  int freq[4] = {0};
  long long total = 0;
  for (int r = 0; r < n; r++) {
      if (freq[a[r]]++ == 0) distinct++;
      while (distinct > k) {
          if (--freq[a[l++]] == 0) distinct--;
      }
      total += r - l + 1;
  }
  cout << total;
output: "12"
why: The window sizes after each step are 1, 2, 3, 4 and 2, which sum to 12. At r = 4 the value 3 makes three distinct values, so l moves from 0 to 3 and leaves the window 2, 3.
```

## Window maximum with a deque

A sum can be added and removed, but a maximum cannot be undone simply. The fix is a **deque** (double-ended queue: push and pop at both ends) of indices whose values decrease from front to back. A new element removes every smaller value from the back, because those can never be the maximum again while the new one is in the window. The front is always the current maximum, and it is dropped when it leaves the window.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (auto &x : a) cin >> x;

    deque<int> dq;                       // indices; values decreasing front to back
    for (int i = 0; i < n; i++) {
        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();
        dq.push_back(i);
        if (dq.front() <= i - k) dq.pop_front();      // left the window
        if (i >= k - 1) cout << a[dq.front()] << (i + 1 < n ? " " : "\n");
    }
    return 0;
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int n = Integer.parseInt(st.nextToken());
        int k = Integer.parseInt(st.nextToken());
        int[] a = new int[n];
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) a[i] = Integer.parseInt(st.nextToken());

        ArrayDeque<Integer> dq = new ArrayDeque<>();   // indices; values decreasing front to back
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();
            dq.addLast(i);
            if (dq.peekFirst() <= i - k) dq.pollFirst();   // left the window
            if (i >= k - 1) sb.append(a[dq.peekFirst()]).append(i + 1 < n ? " " : "\n");
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

This is an occasional tool, not an everyday one. Every index enters and leaves the deque once, so the total is O(n).

## Complexity

- Both pointers only move right, so each moves at most n times: O(n) in total, even though there is a `while` inside the `for`. This is called **amortized** analysis.
- Memory: O(1) for sums, O(alphabet) or O(n) for frequency tables.

## Pitfalls

- **Window length** is `r - l + 1`, not `r - l`.
- **Order of updates.** Add `a[r]` before testing validity, and remove `a[l]` before moving `l`.
- **Negative values** break the shrink rule, as the quiz showed.
- **Distinct counter.** Change it only when a frequency goes from 0 to 1 or from 1 to 0.
- **Overflow.** Window sums need `long long` when values reach 10^9.
- **No valid window.** Keep a sentinel such as `INT_MAX` and handle it when printing.

:::truth
Recognizing that a problem is a window problem is the hard part. The signals are: "consecutive", "subarray" or "substring", and a condition that gets worse (or better) as the window grows. Expect to practice on 15 to 20 problems before the recognition becomes quick.
:::

```cards
- q: Fixed window of size k, how do you update the sum when it moves right?
  a: "Add the entering element `a[r]` and subtract the leaving one `a[r-k]`."
- q: Variable window skeleton for the shortest valid window?
  a: "For each r add `a[r]`; while valid, record `r-l+1` and remove `a[l++]`."
- q: Why is the variable window O(n) despite a nested loop?
  a: l and r each move right at most n times, so there are at most 2n pointer moves in total.
- q: How do you count subarrays with exactly K distinct values?
  a: "`atMost(K) - atMost(K-1)`, where atMost adds `r - l + 1` for each r."
- q: Which structure gives the maximum of every window in O(n)?
  a: A deque of indices with decreasing values, popping smaller values from the back.
```

## Notes

:::notes
- Window problems involve consecutive elements and a condition that changes in one direction as the window grows.
- Fixed size k: add `a[r]`, subtract `a[r-k]`, record when `r >= k-1`. O(n).
- Variable size: grow `r`; while valid, record the length and move `l`. Shortest records inside the loop, longest after it.
- It relies on monotonicity, so with negative numbers the shrink step is unsafe.
- Counting windows: for each r add `r - l + 1` under an "at most" rule. Exactly K = atMost(K) - atMost(K-1).
- Track distinct values with a frequency table and a counter that changes only at 0 and 1.
- Window maximum: deque of indices with decreasing values. Each index enters and leaves once.
- Amortized O(n) because both pointers only move right. Length is `r - l + 1`.
:::
