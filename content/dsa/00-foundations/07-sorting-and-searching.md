---
title: Sorting and Binary Search Basics
summary: Sort arrays and pairs with correct comparators, then use lower_bound and upper_bound to search sorted data in logarithmic time.
minutes: 30
difficulty: beginner
rating: [800, 1200]
tags: [sorting, comparator, binary-search, lower-bound]
prereqs: [complexity, implementation]
problems:
  - cf: 339A
    name: Helpful Maths
    rating: 800
  - cf: 1760A
    name: Medium Number
    rating: 800
  - cf: 160A
    name: Twins
    rating: 900
    core: true
  - cf: 405A
    name: Gravity Flip
    rating: 900
  - cf: 230A
    name: Dragons
    rating: 1000
    core: true
  - cf: 706B
    name: Interesting drink
    rating: 1100
    core: true
    note: sort once, then search for each query
  - cf: 474B
    name: Worms
    rating: 1200
  - cf: 492B
    name: Vanya and Lanterns
    rating: 1200
  - cf: 600B
    name: Queries about less or equal elements
    rating: 1300
    note: a little above the band
  - cses: 1621
    name: Distinct Numbers
  - lc: search-insert-position
    name: Search Insert Position
    difficulty: Easy
exercises:
  - Write lowerBound and upperBound yourself without looking, then test them on arrays with duplicates, a single element, and a target larger than everything.
  - "Sort 10 pairs by (second descending, first ascending) on paper, then confirm with code."
---

## Sorting

**Sorting** puts items in order. It costs $O(n \log n)$, and it is often the first step of a fast solution: equal values become neighbours, the smallest and largest sit at the ends, and binary search becomes possible.

| Task | C++ | Java |
|---|---|---|
| ascending array | `sort(a.begin(), a.end())` | `Arrays.sort(a)` |
| descending | `sort(a.rbegin(), a.rend())` | sort, then reverse; or sort `Integer[]` with `Collections.reverseOrder()` |
| keep equal items in input order | `stable_sort` | `Arrays.sort` on objects, `Collections.sort` |

Watch merge sort split and merge. It shows why the cost is $n \log n$: about $\log n$ levels, each doing $n$ work.

```viz
algo: merge-sort
input:
  arr: [38, 27, 43, 3, 9, 82, 10]
```

## Comparators

A **comparator** is a rule saying which of two items comes first. It must be a **strict weak ordering**:

- `comp(a, a)` is false (an item is never before itself).
- If `comp(a, b)` is true, then `comp(b, a)` is false.
- If `a` is before `b` and `b` is before `c`, then `a` is before `c`.

:::warn
Writing `a <= b` instead of `a < b` breaks the first rule. In C++ that is undefined behaviour and often a crash on large input with many equal values. In Java, a comparator that is inconsistent can throw "Comparison method violates its general contract".
:::

Another trap: `return x - y;` as a Java comparator. It overflows for large values.

```predict
lang: java
code: |
  int x = -2000000000, y = 2000000000;
  System.out.println(Integer.compare(x, y) + " " + (x - y));
output: -1 294967296
why: "x - y is -4000000000, which wraps around to 294967296, a positive number, so the subtraction says x is after y. Integer.compare gives the right answer."
```

## Sorting pairs and records

Problem: given `n` scores, print the ids (1 to n) from highest score to lowest. Break ties by smaller id first.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> v(n);  // (score, id)
    for (int i = 0; i < n; i++) {
        cin >> v[i].first;
        v[i].second = i + 1;
    }
    sort(v.begin(), v.end(), [](const pair<int, int> &a, const pair<int, int> &b) {
        if (a.first != b.first) return a.first > b.first;
        return a.second < b.second;
    });
    for (auto &p : v) cout << p.second << " ";
    cout << "\n";
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringTokenizer st = new StringTokenizer(br.readLine());
        int[][] v = new int[n][2];  // {score, id}
        for (int i = 0; i < n; i++) {
            v[i][0] = Integer.parseInt(st.nextToken());
            v[i][1] = i + 1;
        }
        Arrays.sort(v, (a, b) -> a[0] != b[0] ? Integer.compare(b[0], a[0]) : Integer.compare(a[1], b[1]));
        StringBuilder sb = new StringBuilder();
        for (int[] p : v) sb.append(p[1]).append(" ");
        System.out.println(sb.toString().trim());
    }
}
```
```input
5
50 70 50 90 70
```
```output
4 2 5 1 3
```

:::note
C++ `pair` already compares by first, then second. Sorting a vector of pairs with no comparator gives that order. To sort descending by first, store negative values or write a comparator.
:::

```quiz
q: Which comparator is valid for sorting integers in descending order in C++?
options:
  - "[](int a, int b) { return a >= b; }"
  - "[](int a, int b) { return a > b; }"
  - "[](int a, int b) { return a - b; }"
answer: 1
why: "a > b is false for equal items, as the rules require. a >= b is true for equal items and can crash. a - b returns a number, not a yes/no, and is truthy whenever a differs from b."
```

## Anti-quicksort in Java

Java's `Arrays.sort(int[])` is a quicksort variant. On older Java versions an attacker can craft an input that makes it take $O(n^2)$ time, and Codeforces users do submit such tests in hacks. Newer JDKs added a fallback, but the judge version is not always the newest, so the cheap habit is worth keeping. C++ `std::sort` is introsort (quicksort that switches to heapsort if it goes too deep), so it is safe.

```java
// Option 1: shuffle, then sort primitives
Random rnd = new Random();
for (int i = n - 1; i > 0; i--) {
    int j = rnd.nextInt(i + 1);
    int tmp = a[i]; a[i] = a[j]; a[j] = tmp;
}
Arrays.sort(a);

// Option 2: sort boxed values (merge-sort variant, no attack)
Integer[] b = new Integer[n];            // fill b from a first
Arrays.sort(b);
```

Sorting objects, such as `int[][]` above, already uses the safe algorithm.

## Why sorting helps

Sort first when the answer does not depend on the order of the input. Typical gains:

- **Equal values** become neighbours, so counting duplicates is one pass.
- **Smallest and largest** sit at the two ends.
- **Greedy choices** such as "take the biggest first" become a simple loop.
- **Searching** drops from $O(n)$ to $O(\log n)$ per query, which is the next topic.

Sorting changes positions. If the problem asks for original indices, sort pairs of (value, index), as in the pairs example above.

## Binary search: lower_bound and upper_bound

**Binary search** looks at the middle of a sorted range and throws away the half that cannot contain the answer. After about $\log_2 n$ steps one position is left: 20 steps for a million items.

On a sorted array, `lower_bound(x)` is the **first index with a[i] >= x** and `upper_bound(x)` is the **first index with a[i] > x**. Both return `n` if there is none. Each takes $O(\log n)$, since the range halves every step.

| Question | Answer |
|---|---|
| how many items equal x | `upper_bound(x) - lower_bound(x)` |
| how many items in [l, r] | `upper_bound(r) - lower_bound(l)` |
| how many items less than x | `lower_bound(x)` |

```viz
algo: binary-search
input:
  arr: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
  target: 20
  mode: lower_bound
```

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto &x : a) cin >> x;       // already sorted
    int q;
    cin >> q;
    while (q--) {
        int l, r;
        cin >> l >> r;
        int cnt = upper_bound(a.begin(), a.end(), r) - lower_bound(a.begin(), a.end(), l);
        cout << cnt << "\n";
    }
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static int lowerBound(int[] a, int x) {   // first index with a[i] >= x
        int lo = 0, hi = a.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] >= x) hi = mid; else lo = mid + 1;
        }
        return lo;
    }

    static int upperBound(int[] a, int x) {   // first index with a[i] > x
        int lo = 0, hi = a.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] > x) hi = mid; else lo = mid + 1;
        }
        return lo;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringTokenizer st = new StringTokenizer(br.readLine());
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = Integer.parseInt(st.nextToken());
        int q = Integer.parseInt(br.readLine().trim());
        StringBuilder out = new StringBuilder();
        while (q-- > 0) {
            st = new StringTokenizer(br.readLine());
            int l = Integer.parseInt(st.nextToken());
            int r = Integer.parseInt(st.nextToken());
            out.append(upperBound(a, r) - lowerBound(a, l)).append("\n");
        }
        System.out.print(out);
    }
}
```
```input
8
1 3 3 5 7 7 7 9
3
3 7
4 6
10 20
```
```output
6
1
0
```

:::tip
Java's `Arrays.binarySearch` returns any matching index when there are duplicates, and a negative number when absent. Use your own `lowerBound` instead.
:::

```order
prompt: Arrange upper_bound, the first index with a[i] > x.
lang: java
code: |
  int lo = 0, hi = a.length;
  while (lo < hi) {
      int mid = lo + (hi - lo) / 2;
      if (a[mid] > x) hi = mid;
      else lo = mid + 1;
  }
  return lo;
distractors:
  - "    if (a[mid] > x) hi = mid - 1;"
why: Keep mid as a candidate with hi = mid, and discard it with lo = mid + 1. Using mid - 1 could throw away the answer.
```

## Cards

```cards
- q: What does lower_bound(x) return?
  a: The first index with a[i] >= x in a sorted array, or n if none.
- q: How do you count the items in [l, r] in a sorted array?
  a: upper_bound(r) - lower_bound(l)
- q: What is a strict weak ordering?
  a: A comparator where an item is never before itself, and which is consistent in both directions and transitive.
- q: Why shuffle before Arrays.sort on int[] in Java?
  a: Older Java versions can be attacked with inputs that make its quicksort take O(n^2) time.
- q: Why not return a - b from a comparator?
  a: The subtraction can overflow. Use Integer.compare(a, b).
```

## Notes

:::notes
- Sorting costs O(n log n) and groups equal values together.
- A comparator must be a strict weak ordering: use < and >, never <=, and return false for equal items.
- Java comparators: Integer.compare(a, b), not a - b.
- C++ pair sorts by first, then second.
- lower_bound = first index with a[i] >= x; upper_bound = first index with a[i] > x. Both are O(log n).
- Count in [l, r] on a sorted array = upper_bound(r) - lower_bound(l).
- Java: write your own lowerBound; Arrays.binarySearch is unreliable with duplicates.
- Shuffle before Arrays.sort(int[]) or sort boxed objects. std::sort is safe.
:::
