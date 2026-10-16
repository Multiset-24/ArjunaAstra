---
title: Prefix Sums
summary: Precompute running totals once so any range sum, range XOR or range update is answered in constant time.
minutes: 35
difficulty: beginner
rating: [1100, 1700]
tags: [arrays, prefix-sums, difference-array]
prereqs: [arrays-and-strings]
problems:
  - lc: range-sum-query-immutable
    name: Range Sum Query - Immutable
    difficulty: Easy
  - cses: 1646
    name: Static Range Sum Queries
  - cf: 313B
    name: Ilya and Queries
    rating: 1100
    core: true
    note: prefix counts over adjacent pairs
  - cf: 1006C
    name: Three Parts of the Array
    rating: 1200
    note: prefix sums plus two pointers
  - lc: range-sum-query-2d-immutable
    name: Range Sum Query 2D - Immutable
    difficulty: Medium
  - cf: 816B
    name: Karen and Coffee
    rating: 1400
    core: true
    note: difference array, then prefix counts
  - cf: 276C
    name: Little Girl and Maximum Sum
    rating: 1500
    note: difference array, then sort and match
  - lc: subarray-sum-equals-k
    name: Subarray Sum Equals K
    difficulty: Medium
  - lc: corporate-flight-bookings
    name: Corporate Flight Bookings
    difficulty: Medium
  - cses: 1661
    name: Subarray Sums II
  - cf: 1748C
    name: Zero-Sum Prefixes
    rating: 1600
  - cf: 466C
    name: Number of Ways
    rating: 1700
    core: true
    note: split into three equal-sum parts
exercises:
  - Given a grid of 0 and 1, count the all-ones rectangles of a fixed size using a 2D prefix sum.
  - Use prefix XOR to find the number of subarrays whose XOR is 0 (hint - two equal prefix values).
---

## The problem

You get an array of n numbers and q questions. Each question gives two positions l and r and asks for the sum of the elements between them. With n and q both up to 200,000, how do you answer fast?

## Brute force first

Loop from l to r and add. One query costs up to n steps, so q queries cost n x q.

```estimate
q: n = 200,000 and q = 200,000 queries, each asking for the sum of the whole array. How many additions does the brute force perform?
answer: 40000000000
unit: additions
tolerance: 0.1
hint: Each query adds up to n numbers, and there are q queries.
solution: "200,000 x 200,000 = 4 x 10^10 additions. At about 10^8 simple operations per second that is several minutes, against a limit of 1 to 2 seconds."
```

The waste is clear: every query re-adds numbers that earlier queries already added.

## The idea: a table of running totals

Define a **prefix sum** array `p` where `p[i]` is the sum of the first i elements. So `p[0] = 0`, and `p[i] = p[i-1] + a[i-1]`.

The sum of the elements from l to r (0-indexed, both included) is everything up to r, minus everything before l:

$$ \text{sum}(l, r) = p[r+1] - p[l] $$

Building `p` costs O(n). After that, every query is one subtraction.

```viz
algo: prefix-sum
input:
  arr: [3, 1, 4, 1, 5, 9, 2, 6]
  queries: [[2, 5], [0, 3]]
```

```quiz
q: With `p[0] = 0` and `p[i] = a[0] + ... + a[i-1]`, what is the sum of `a[l..r]` (0-indexed, both ends included)?
options:
  - p[r] - p[l]
  - p[r + 1] - p[l]
  - p[r + 1] - p[l + 1]
answer: 1
why: "`p[r+1]` holds a[0..r]. Subtracting `p[l]`, which holds a[0..l-1], leaves exactly a[l..r]. The extra zero at `p[0]` is what lets l = 0 work without a special case."
```

## Template

The program below reads 1-indexed queries, as most problems do, so the formula becomes `p[r] - p[l-1]`.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, q;
    scanf("%d %d", &n, &q);
    vector<long long> p(n + 1, 0);
    for (int i = 0; i < n; i++) {
        long long x;
        scanf("%lld", &x);
        p[i + 1] = p[i] + x;
    }
    while (q--) {
        int l, r;                      // 1-indexed, inclusive
        scanf("%d %d", &l, &r);
        printf("%lld\n", p[r] - p[l - 1]);
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
        int q = Integer.parseInt(st.nextToken());
        long[] p = new long[n + 1];
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) p[i + 1] = p[i] + Long.parseLong(st.nextToken());
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) {
            st = new StringTokenizer(br.readLine());
            int l = Integer.parseInt(st.nextToken());   // 1-indexed, inclusive
            int r = Integer.parseInt(st.nextToken());
            sb.append(p[r] - p[l - 1]).append('\n');
        }
        System.out.print(sb);
    }
}
```
```input
8 3
3 1 4 1 5 9 2 6
3 6
1 4
5 5
```
```output
19
9
5
```

### Walkthrough

- `p = [0, 3, 4, 8, 9, 14, 23, 25, 31]`.
- Query `3 6`: `p[6] - p[2] = 23 - 4 = 19`, which is 4 + 1 + 5 + 9.
- Query `5 5`: `p[5] - p[4] = 14 - 9 = 5`, a single element.

## Two dimensions

For a grid, let `P[i][j]` be the sum of the rectangle from the top-left corner to row i - 1 and column j - 1. A query adds the big rectangle, subtracts the strip above and the strip to the left, and adds back the corner that was subtracted twice.

```cpp
// build: P has (R + 1) x (C + 1) cells, row 0 and column 0 are zero
for (int i = 0; i < R; i++)
    for (int j = 0; j < C; j++)
        P[i + 1][j + 1] = a[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];

// sum of rows r1..r2 and columns c1..c2, both ends included
long long s = P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1];
```
```java
// build: P has (R + 1) x (C + 1) cells, row 0 and column 0 are zero
for (int i = 0; i < R; i++)
    for (int j = 0; j < C; j++)
        P[i + 1][j + 1] = a[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];

// sum of rows r1..r2 and columns c1..c2, both ends included
long s = P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1];
```

```blanks
prompt: Complete the 2D build and the four-corner query with the right signs.
lang: cpp
code: |
  P[i + 1][j + 1] = a[i][j] + P[i][j + 1] + P[i + 1][j] [[-]] P[i][j];
  long long s = P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] [[+]] P[r1][c1];
why: The strip above and the strip to the left both contain P[i][j], so it is counted twice and subtracted once. In the query, the top-left corner is subtracted twice, so it is added back once.
```

## Difference arrays: range updates

The reverse problem: many updates of the form "add v to every element from l to r", and only at the end you need the array. Instead of touching every element, record the change at the two borders in an array `d`, then take prefix sums of `d` once.

```steps
title: Two range updates on n = 5 zeros, using d of size n + 1
view: array
frames:
  - arr: [0, 0, 0, 0, 0, 0]
    note: Start with d of size n + 1 so that index r + 1 is always valid.
  - arr: [3, 0, 0, -3, 0, 0]
    highlight: {0: active, 3: active}
    note: Add 3 to positions 0..2. Record d[0] += 3 and d[3] -= 3.
  - arr: [3, 2, 0, -3, -2, 0]
    highlight: {1: active, 4: active}
    note: Add 2 to positions 1..3. Record d[1] += 2 and d[4] -= 2.
  - arr: [3, 5, 5, -3, -2, 0]
    pointers: {i: 2}
    highlight: {0: done, 1: done, 2: done}
    note: Start taking prefix sums of d. The +3 from the left border is carried to the right.
  - arr: [3, 5, 5, 2, 0, 0]
    highlight: {0: done, 1: done, 2: done, 3: done, 4: done, 5: muted}
    note: Finished. The array is [3, 5, 5, 2, 0]; the last cell is spare and ignored.
```

```cpp
// update: add v to a[l..r]
d[l] += v;
d[r + 1] -= v;

// after all updates: a[i] = d[0] + ... + d[i]
for (int i = 1; i < n; i++) d[i] += d[i - 1];
```
```java
// update: add v to a[l..r]
d[l] += v;
d[r + 1] -= v;

// after all updates: a[i] = d[0] + ... + d[i]
for (int i = 1; i < n; i++) d[i] += d[i - 1];
```

:::key
Prefix sum and difference array are inverse operations. One turns "values" into "running totals", the other turns "range additions" into two point edits.
:::

## Prefix XOR and prefix counts

The same trick works whenever the operation can be undone.

- **XOR** (bitwise exclusive or, written `^`) undoes itself: `x ^ x = 0`. So `xor(l..r) = px[r+1] ^ px[l]`.
- **Counts** work too: `cnt[i]` = how many positions before i satisfy a condition, and a range count is a subtraction.

```predict
lang: cpp
code: |
  int a[] = {5, 1, 4, 2};
  int px[5] = {0};
  for (int i = 0; i < 4; i++) px[i + 1] = px[i] ^ a[i];
  cout << (px[3] ^ px[1]) << " " << px[4];
output: 5 2
why: "px = 0, 5, 4, 0, 2. The first value is a[1] ^ a[2] = 1 ^ 4 = 5, and the second is the XOR of all four numbers."
```

## Counting subarrays with sum k

A subarray ending at r has sum k exactly when some earlier prefix equals `p[r+1] - k`. So while scanning, store how many times each prefix value has appeared in a hash map, and add the matching count. This is O(n) and, unlike two pointers, it works with negative numbers.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    long long k;
    cin >> n >> k;
    unordered_map<long long, int> seen;
    seen[0] = 1;                       // the empty prefix
    long long s = 0, ans = 0;
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        s += x;
        auto it = seen.find(s - k);
        if (it != seen.end()) ans += it->second;
        seen[s]++;
    }
    cout << ans << "\n";
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
        long k = Long.parseLong(st.nextToken());
        HashMap<Long, Integer> seen = new HashMap<>();
        seen.put(0L, 1);               // the empty prefix
        long s = 0, ans = 0;
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) {
            s += Long.parseLong(st.nextToken());
            ans += seen.getOrDefault(s - k, 0);
            seen.merge(s, 1, Integer::sum);
        }
        System.out.println(ans);
    }
}
```
```input
6 3
1 2 1 2 1 -1
```
```output
5
```

The five subarrays with sum 3 are `1 2`, `2 1`, `1 2`, `2 1` and `1 2 1 -1`.

:::truth
Hash maps (data structures that look up a key in about constant time) are the usual tool here, but on Codeforces a plain `unordered_map` can be attacked with inputs that make it slow. If that worries you, sort the prefix values or use a custom hash. You will meet this again in the hashing lesson.
:::

## Complexity

| Task | Build | Each query |
|---|---|---|
| 1D range sum | O(n) | O(1) |
| 2D range sum | O(R x C) | O(1) |
| Range add (difference array) | O(n) at the end | O(1) per update |
| Subarrays with sum k | O(n) with a hash map | not applicable |

## Pitfalls

- **Overflow.** Prefix sums grow to n times the largest value. 200,000 x 10^9 is about 2 x 10^14, so store them in `long long` or `long`.
- **Index mix-ups.** Decide whether `p` is 0-indexed or 1-indexed and write the formula once. The zero at `p[0]` removes the special case for l = 0.
- **Difference array size.** Allocate n + 1 cells, because an update with r = n - 1 writes to `d[n]`.
- **Static data only.** Prefix sums are for arrays that do not change between queries. If values change, you need a Fenwick tree or segment tree, which come later.
- **Forgetting the empty prefix** in the counting trick: without `seen[0] = 1`, subarrays starting at index 0 are missed.

```cards
- q: What is the formula for the sum of a[l..r] with a prefix array p where p[0] = 0?
  a: "`p[r+1] - p[l]` for 0-indexed positions, or `p[r] - p[l-1]` for 1-indexed ones."
- q: How do you apply many "add v to a[l..r]" updates in O(1) each?
  a: "`d[l] += v; d[r+1] -= v;`, then take prefix sums of `d` once at the end."
- q: How do you get the XOR of a[l..r]?
  a: "`px[r+1] ^ px[l]`, because XOR undoes itself."
- q: How do you count subarrays with sum k, including negative numbers?
  a: "Scan prefix sums and add the number of earlier prefixes equal to `s - k`, using a hash map that starts with `{0: 1}`."
- q: What is the inclusion-exclusion rule for a 2D range sum?
  a: Big rectangle, minus the top strip, minus the left strip, plus the overlapping corner.
```

## Notes

:::notes
- Prefix array: `p[0] = 0`, `p[i] = p[i-1] + a[i-1]`. Range sum a[l..r] (0-indexed) is `p[r+1] - p[l]`.
- Build once in O(n), answer each query in O(1). Brute force is O(n x q).
- 2D: `P[i+1][j+1] = a[i][j] + P[i][j+1] + P[i+1][j] - P[i][j]`, query by inclusion-exclusion with four corners.
- Difference array: `d[l] += v; d[r+1] -= v;` then prefix-sum d. Allocate n + 1 cells.
- Prefix XOR works because `x ^ x = 0`. Prefix counts work for any yes/no condition.
- Subarrays with sum k: hash map of prefix values, start with `{0: 1}`, add `seen[s - k]`.
- Use `long long` for prefix sums. Only valid when the array does not change between queries.
:::
