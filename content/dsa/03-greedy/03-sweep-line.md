---
title: Sweep Line and Intervals
summary: Turn intervals into start and end events, sort them, and sweep left to right to count overlaps, merge ranges and handle huge coordinates.
minutes: 40
difficulty: intermediate
rating: [1000, 1700]
tags: [sweep line, intervals, sorting, coordinate compression]
prereqs: [sorting-and-searching, prefix-sums]
problems:
  - cf: 1015A
    name: Points in Segments
    rating: 800
  - cf: 237A
    name: Free Cash
    rating: 1000
    note: the largest number of customers at the same minute
  - cses: 1619
    name: Restaurant Customers
    core: true
    note: maximum overlap, the template of this lesson
  - lc: merge-intervals
    name: Merge Intervals
    difficulty: Medium
    core: true
  - lc: car-pooling
    name: Car Pooling
    difficulty: Medium
  - lc: insert-interval
    name: Insert Interval
    difficulty: Medium
  - lc: divide-intervals-into-minimum-number-of-groups
    name: Divide Intervals Into Minimum Number of Groups
    difficulty: Medium
  - cf: 1000C
    name: Covered Points Count
    rating: 1700
    core: true
    note: huge coordinates, events in a map
  - cf: 1249D1
    name: Too Many Segments (easy version)
    rating: 1800
---

## The problem

You have $n$ intervals on a number line, for example meetings with a start and end time. Questions of this kind come up again and again:

- What is the largest number of intervals that overlap at one moment?
- If I merge all overlapping intervals, what remains?
- For each $k$, how many points are covered by exactly $k$ intervals?

## Brute force first

For every possible time, count how many intervals contain it. With $n$ intervals and coordinates up to $10^9$ that is far too many times. Checking only the $n$ start points is better, but each check scans all $n$ intervals: $O(n^2)$. For $n = 2 \cdot 10^5$ that is 4 billion steps.

## The idea

A sweep line is an imaginary vertical line that moves from left to right. The count of active intervals can only change at two kinds of moments, called events:

- an interval starts: the count goes up by 1,
- an interval ends: the count goes down by 1.

So we ignore all the empty space between events. Make a list of $2n$ events, sort it by position, walk through it, and keep one running counter.

:::key
Intervals become points. Sorting the points once replaces all the pairwise comparisons.
:::

## Template: maximum overlap

We treat each interval as half-open, $[l, r)$: it includes $l$ but not $r$. So an interval ending at 5 and one starting at 5 do not overlap.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> ev;            // (position, +1 start / -1 end)
    for (int i = 0; i < n; i++) {
        int l, r;
        cin >> l >> r;
        ev.push_back({l, +1});
        ev.push_back({r, -1});
    }
    sort(ev.begin(), ev.end());           // at equal positions -1 comes before +1
    int cur = 0, best = 0;
    for (auto [pos, d] : ev) {
        cur += d;
        best = max(best, cur);
    }
    cout << best << "\n";
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        long[] ev = new long[2 * n];          // position * 2 + (1 start, 0 end)
        for (int i = 0; i < n; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            long l = Long.parseLong(st.nextToken());
            long r = Long.parseLong(st.nextToken());
            ev[2 * i] = l * 2 + 1;
            ev[2 * i + 1] = r * 2;
        }
        Arrays.sort(ev);                      // at equal positions an end (0) comes first
        int cur = 0, best = 0;
        for (long e : ev) {
            cur += (e & 1) == 1 ? 1 : -1;
            best = Math.max(best, cur);
        }
        System.out.println(best);
    }
}
```
```input
5
1 5
2 6
4 8
7 9
8 10
```
```output
3
```

The tie rule matters. When an end and a start share a position, process the end first, otherwise you count an overlap that does not exist.

```quiz
q: Events are (5, end) and (5, start) for half-open intervals. Which order is correct?
options:
  - Start first, then end
  - End first, then start
  - Either, the result is the same
answer: 1
why: "[1,5) and [5,9) do not overlap. Processing the start first would show a count of 2 at position 5."
```

```predict
lang: cpp
code: |
  vector<pair<int,int>> ev = {{5,-1},{3,+1},{5,+1},{1,+1}};
  sort(ev.begin(), ev.end());
  int cur = 0, best = 0;
  for (auto [t, d] : ev) {
      cur += d;
      best = max(best, cur);
  }
  cout << best;
output: "2"
why: Sorted, the events are (1,+1), (3,+1), (5,-1), (5,+1). The pair (5,-1) sorts before (5,+1), so the count goes 1, 2, 1, 2 and never reaches 3.
```

## Walkthrough

The sample has events at positions 1, 2, 4, 5, 6, 7, 8, 8, 9, 10. The array below shows the +1 / -1 deltas in sorted order.

```steps
title: Sweep on [1,5) [2,6) [4,8) [7,9) [8,10)
view: array
frames:
  - arr: [1, 1, 1, -1, -1, 1, -1, 1, -1, -1]
    note: "Events sorted by position: 1, 2, 4, 5, 6, 7, 8 (end), 8 (start), 9, 10. cur = 0, best = 0."
  - arr: [1, 1, 1, -1, -1, 1, -1, 1, -1, -1]
    pointers: {i: 2}
    highlight: {0: done, 1: done, 2: active}
    vars: {pos: 4, cur: 3, best: 3}
    note: Three starts in a row. The count reaches 3 at position 4.
  - arr: [1, 1, 1, -1, -1, 1, -1, 1, -1, -1]
    pointers: {i: 4}
    highlight: {0: done, 1: done, 2: done, 3: done, 4: active}
    vars: {pos: 6, cur: 1, best: 3}
    note: Two ends bring the count down to 1. The best stays 3.
  - arr: [1, 1, 1, -1, -1, 1, -1, 1, -1, -1]
    pointers: {i: 7}
    highlight: {5: done, 6: compare, 7: active}
    vars: {pos: 8, cur: 2, best: 3}
    note: At position 8 the end is processed first (count 1), then the start (count 2).
  - arr: [1, 1, 1, -1, -1, 1, -1, 1, -1, -1]
    pointers: {i: 9}
    highlight: {8: done, 9: active}
    vars: {pos: 10, cur: 0, best: 3}
    note: "The last ends bring the count to 0. Answer: 3."
```

## Merging intervals

To merge overlapping intervals, sort by start and keep one current merged interval. If the next interval starts at or before the current end, extend the end. Otherwise close the current one and start a new one. Here the intervals are closed, $[l, r]$, so touching at one point counts as overlap.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> v(n);
    for (auto &p : v) cin >> p.first >> p.second;
    sort(v.begin(), v.end());             // by start
    int curL = v[0].first, curR = v[0].second;
    for (int i = 1; i < n; i++) {
        if (v[i].first <= curR) {
            curR = max(curR, v[i].second);
        } else {
            cout << curL << " " << curR << "\n";
            curL = v[i].first;
            curR = v[i].second;
        }
    }
    cout << curL << " " << curR << "\n";
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        int[][] v = new int[n][2];
        for (int i = 0; i < n; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            v[i][0] = Integer.parseInt(st.nextToken());
            v[i][1] = Integer.parseInt(st.nextToken());
        }
        Arrays.sort(v, (a, b) -> Integer.compare(a[0], b[0]));   // by start
        StringBuilder sb = new StringBuilder();
        int curL = v[0][0], curR = v[0][1];
        for (int i = 1; i < n; i++) {
            if (v[i][0] <= curR) {
                curR = Math.max(curR, v[i][1]);
            } else {
                sb.append(curL).append(' ').append(curR).append('\n');
                curL = v[i][0];
                curR = v[i][1];
            }
        }
        sb.append(curL).append(' ').append(curR).append('\n');
        System.out.print(sb);
    }
}
```
```input
5
1 3
2 6
8 10
15 18
17 20
```
```output
1 6
8 10
15 20
```

```blanks
prompt: Complete the merge step.
lang: cpp
code: |
  if (v[i].first <= [[curR]]) {
      curR = [[max(curR, v[i].second)|max(v[i].second, curR)]];
  }
why: The next interval overlaps if it starts at or before the current end. The merged end is the larger of the two ends, because the new interval may be nested inside the current one.
```

## Huge coordinates

Coordinates up to $10^9$ cannot index an array. You have two options:

- **Keep events in a sorted structure.** A `map` in C++ or `TreeMap` in Java stores only positions that matter.
- **Coordinate compression.** Replace each value by its rank among the distinct values, so $\{10, 500, 10^9\}$ becomes $\{0, 1, 2\}$. Now arrays work.

```cpp
vector<int> xs = {500, 10, 1000000000, 10};
sort(xs.begin(), xs.end());
xs.erase(unique(xs.begin(), xs.end()), xs.end());     // distinct, sorted
int rank500 = lower_bound(xs.begin(), xs.end(), 500) - xs.begin();   // 1
```
```java
int[] xs = {500, 10, 1000000000, 10};
int[] s = Arrays.stream(xs).distinct().sorted().toArray();           // distinct, sorted
int rank500 = Arrays.binarySearch(s, 500);                           // 1
```

Here is the full "count points covered by exactly $k$ intervals" problem (Codeforces 1000C). Segments are closed, so an interval $[l, r]$ becomes events at $l$ (+1) and $r + 1$ (-1). Between two consecutive event positions the count is constant, so we add that gap length to `ans[cur]`.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    map<long long, int> ev;
    for (int i = 0; i < n; i++) {
        long long l, r;
        cin >> l >> r;
        ev[l]++;
        ev[r + 1]--;
    }
    vector<long long> ans(n + 1, 0);
    long long prev = 0;
    int cur = 0;
    for (auto [pos, d] : ev) {
        ans[cur] += pos - prev;           // cur segments covered [prev, pos)
        cur += d;
        prev = pos;
    }
    for (int k = 1; k <= n; k++) cout << ans[k] << " \n"[k == n];
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        TreeMap<Long, Integer> ev = new TreeMap<>();
        for (int i = 0; i < n; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            long l = Long.parseLong(st.nextToken());
            long r = Long.parseLong(st.nextToken());
            ev.merge(l, 1, Integer::sum);
            ev.merge(r + 1, -1, Integer::sum);
        }
        long[] ans = new long[n + 1];
        long prev = 0;
        int cur = 0;
        for (Map.Entry<Long, Integer> e : ev.entrySet()) {
            ans[cur] += e.getKey() - prev;   // cur segments covered [prev, pos)
            cur += e.getValue();
            prev = e.getKey();
        }
        StringBuilder sb = new StringBuilder();
        for (int k = 1; k <= n; k++) sb.append(ans[k]).append(k == n ? '\n' : ' ');
        System.out.print(sb);
    }
}
```
```input
3
0 3
1 3
3 8
```
```output
6 2 1
```

The very first iteration adds `pos - 0` to `ans[0]`. That is harmless, because we never print `ans[0]`.

## Complexity

- Sorting $2n$ events: $O(n \log n)$. The sweep itself is $O(n)$.
- A `map` or `TreeMap` costs $O(\log n)$ per insert, so also $O(n \log n)$ in total.
- Memory $O(n)$.

## Pitfalls

- Closed versus half-open intervals. For closed integer intervals $[l, r]$, use the event at $r + 1$, or sort starts before ends at equal positions.
- Wrong tie order at equal positions: it silently over- or under-counts.
- Merging: take `max` of the ends. A later interval can be completely inside the current one.
- Counts of covered points can exceed `int`. Use `long long` / `long` for lengths.
- Java: sort with `Integer.compare`, not subtraction.

```cards
- q: What is a sweep line?
  a: Sort the interesting positions (events) and walk through them once, keeping a running state such as the number of active intervals.
- q: How do you find the maximum overlap of n intervals?
  a: Make +1 events at starts and -1 events at ends, sort, and track the running sum. At equal positions process ends first for half-open intervals.
- q: How do you merge overlapping intervals?
  a: Sort by start. If the next start is at most the current end, extend the end with max. Otherwise close the current interval.
- q: What is coordinate compression?
  a: Replace values by their rank among the sorted distinct values so large coordinates can index arrays. Use sort, unique and lower_bound.
- q: Time complexity of a sweep line over n intervals?
  a: $O(n \log n)$, dominated by sorting the $2n$ events.
```

## Notes

:::notes
- Sweep line: turn intervals into events (+1 at start, -1 at end), sort, scan with a running counter.
- Half-open [l, r): process ends before starts at the same position. Closed [l, r]: put the end event at r + 1.
- Max overlap = maximum running sum.
- Merge intervals: sort by start, extend with max(end), start a new group when next start > current end.
- Huge coordinates: store events in a map / TreeMap, or compress coordinates (sort, unique, lower_bound).
- Count of points covered exactly k times: add the gap between consecutive event positions to ans[cur].
- Complexity $O(n \log n)$. Use long for lengths and sums.
:::
