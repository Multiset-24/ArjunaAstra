---
title: Longest Increasing Subsequence
summary: The O(n^2) DP, the O(n log n) tails array with binary search, how to reconstruct the answer, and how LIS hides inside other problems.
minutes: 40
difficulty: intermediate
rating: [1500, 2000]
tags: [dp, lis, binary-search, subsequence]
prereqs: [dp-introduction, binary-search]
problems:
  - lc: longest-increasing-subsequence
    name: Longest Increasing Subsequence
    difficulty: Medium
    core: true
  - cses: 1145
    name: Increasing Subsequence
    note: the plain O(n log n) version with n up to 2*10^5
  - cf: 340D
    name: Bubble Sort Graph
    rating: 1500
    note: the answer is an LIS of the permutation
  - lc: maximum-length-of-pair-chain
    name: Maximum Length of Pair Chain
    difficulty: Medium
    note: sort, then LIS-style
  - cf: 977F
    name: Consecutive Subsequence
    rating: 1700
    core: true
    note: a hash map instead of a binary search
  - cf: 4D
    name: Mysterious Present
    rating: 1700
    core: true
    note: LIS on pairs, with reconstruction
  - lc: number-of-longest-increasing-subsequence
    name: Number of Longest Increasing Subsequence
    difficulty: Medium
    note: keep a count next to each length
  - lc: russian-doll-envelopes
    name: Russian Doll Envelopes
    difficulty: Hard
    note: sort by width ascending, height descending, then LIS on height
  - cf: 597C
    name: Subsequences
    rating: 1900
    note: stretch; count increasing subsequences of a given length with a Fenwick tree
exercises:
  - Change the program to find the longest non-decreasing subsequence by changing a single function name.
  - Why does sorting widths ascending and heights descending make Russian Doll Envelopes an ordinary strict LIS?
---

## The problem

Given an array, pick elements from left to right, keeping their order, so that each chosen element is larger than the previous one. The longest such pick is the **longest increasing subsequence (LIS)**.

For `[10, 9, 2, 5, 3, 7, 101, 18]` the answer is 4, for example `2, 5, 7, 101`. A subsequence may skip elements; a subarray may not.

## Brute force, then the $O(n^2)$ DP

Brute force tries all $2^n$ subsequences. A DP does better by asking where a subsequence ends.

- **State:** `dp[i]` = length of the longest increasing subsequence that **ends at** index `i`.
- **Transition:** `dp[i] = 1 + max(dp[j])` over `j < i` with `a[j] < a[i]`; if no such `j`, `dp[i] = 1`.
- **Base case:** every element alone is a subsequence of length 1.
- **Answer:** `max(dp[i])` over all `i`. The best subsequence can end anywhere.

```cpp
vector<int> dp(n, 1);
for (int i = 0; i < n; i++)
    for (int j = 0; j < i; j++)
        if (a[j] < a[i]) dp[i] = max(dp[i], dp[j] + 1);
int best = *max_element(dp.begin(), dp.end());
```
```java
int[] dp = new int[n];
Arrays.fill(dp, 1);
int best = 0;
for (int i = 0; i < n; i++) {
    for (int j = 0; j < i; j++)
        if (a[j] < a[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    best = Math.max(best, dp[i]);
}
```

This is $O(n^2)$: fine up to about 5000 elements, too slow for $2 \cdot 10^5$.

## The faster idea: keep the best tails

Maintain an array `tails` where `tails[k]` is the **smallest possible last element** of any increasing subsequence of length `k + 1` seen so far.

- A smaller tail is always better, because it is easier to extend.
- `tails` is always sorted increasing, so we can binary search it.

For each new value `x`:

1. Find the first position `p` with `tails[p] >= x` (that is `lower_bound`).
2. If none exists, `x` extends the longest subsequence, so append it.
3. Otherwise set `tails[p] = x`. A subsequence of the same length now ends in something smaller or equal.

The length of `tails` at the end is the LIS length.

```viz
algo: lis
input:
  arr: [10, 9, 2, 5, 3, 7, 101, 18]
```

:::warn
`tails` is not itself an increasing subsequence of the array. After `[2, 3, 7, 101]` and then `18`, the array positions may disagree with the order of values. It stores the best tail per length, nothing more. Reconstruction needs extra bookkeeping (below).
:::

Try your own array, with repeated values and a descending run, to watch the tails shrink and grow.

```viz
algo: lis
input:
  arr: [4, 1, 6, 2, 8, 3, 9, 5]
```

## Template with reconstruction

To print an actual subsequence:

- `tailIdx[k]` = index in `a` of the element currently stored at `tails[k]`.
- When `x = a[i]` lands at position `p`, set `par[i] = tailIdx[p - 1]` (or `-1` if `p = 0`), then `tailIdx[p] = i`.
- At the end, start from `tailIdx.back()` and follow `par` backwards.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    scanf("%d", &n);
    vector<int> a(n), par(n, -1), tails, tailIdx;
    for (auto &x : a) scanf("%d", &x);
    for (int i = 0; i < n; i++) {
        int p = lower_bound(tails.begin(), tails.end(), a[i]) - tails.begin();
        if (p == (int)tails.size()) { tails.push_back(a[i]); tailIdx.push_back(i); }
        else { tails[p] = a[i]; tailIdx[p] = i; }
        par[i] = p ? tailIdx[p - 1] : -1;
    }
    vector<int> seq;
    for (int i = tailIdx.back(); i != -1; i = par[i]) seq.push_back(a[i]);
    reverse(seq.begin(), seq.end());
    printf("%d\n", (int)tails.size());
    for (size_t i = 0; i < seq.size(); i++) printf("%d%c", seq[i], i + 1 < seq.size() ? ' ' : '\n');
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
        int[] a = new int[n], par = new int[n], tails = new int[n], tailIdx = new int[n];
        for (int i = 0; i < n; i++) a[i] = Integer.parseInt(st.nextToken());
        int len = 0;
        for (int i = 0; i < n; i++) {
            int lo = 0, hi = len;
            while (lo < hi) {                       // first position with tails[p] >= a[i]
                int mid = (lo + hi) >>> 1;
                if (tails[mid] >= a[i]) hi = mid; else lo = mid + 1;
            }
            tails[lo] = a[i];
            tailIdx[lo] = i;
            par[i] = lo > 0 ? tailIdx[lo - 1] : -1;
            if (lo == len) len++;
        }
        int[] seq = new int[len];
        int k = len - 1;
        for (int i = tailIdx[len - 1]; i != -1; i = par[i]) seq[k--] = a[i];
        StringBuilder sb = new StringBuilder();
        sb.append(len).append("\n");
        for (int i = 0; i < len; i++) sb.append(seq[i]).append(i + 1 < len ? " " : "\n");
        System.out.print(sb);
    }
}
```
```input
8
10 9 2 5 3 7 101 18
```
```output
4
2 3 7 18
```

The printed subsequence is a valid answer of length 4, but not the only one. `2, 5, 7, 101` is another. Problems that need a specific one say so, or accept any.

```blanks
prompt: Complete the core of the tails update.
lang: cpp
code: |
  int pos = [[lower_bound]](t.begin(), t.end(), x) - t.begin();
  if (pos == (int)t.size()) t.push_back(x);
  else t[pos] = [[x]];
why: lower_bound finds the first tail that is >= x, and x replaces it because a smaller or equal tail is never worse.
```

## Strict or not strict

- **Strictly increasing** (`a[j] < a[i]`): use `lower_bound`. Equal values replace an equal tail.
- **Non-decreasing** (`a[j] <= a[i]`): use `upper_bound`. Equal values append.

```predict
lang: cpp
code: |
  vector<int> a = {4, 4, 4};
  vector<int> t;
  for (int x : a) {
      auto it = upper_bound(t.begin(), t.end(), x);
      if (it == t.end()) t.push_back(x);
      else *it = x;
  }
  cout << t.size();
prompt: What does this print? Compare it with the answer under strictly increasing rules.
output: "3"
why: upper_bound finds the first tail strictly greater than x, so each 4 is appended. Strict LIS would use lower_bound and print 1.
```

## Where LIS hides

- **Pairs.** Sort by one coordinate, then LIS on the other (Russian Doll Envelopes, pair chains). Break ties so equal first coordinates cannot chain.
- **Permutations.** The longest chain of "in order" elements is an LIS (Bubble Sort Graph).
- **Value-indexed.** If a subsequence must use consecutive values `v, v+1, v+2...`, a map `best[v] = best[v-1] + 1` replaces the binary search.
- **Minimum removals.** `n - LIS` is the fewest deletions to make the array increasing.
- **Longest decreasing:** negate the values, or reverse the array.

## Complexity

| Method | Time | Memory | Reconstruct |
|---|---|---|---|
| `dp[i]` ending at `i` | $O(n^2)$ | $O(n)$ | easy, keep a parent |
| tails + binary search | $O(n \log n)$ | $O(n)$ | needs `tailIdx` and `par` |

## Pitfalls

- **Treating `tails` as the answer sequence.** It is only the best tail per length.
- **Wrong bound function.** `lower_bound` for strict, `upper_bound` for non-decreasing.
- **Answer ends anywhere.** In the $O(n^2)$ DP, take the max over all `i`, not `dp[n-1]`.
- **Subsequence versus subarray.** Subarray problems usually need a single pass, not this.
- **Counting LIS.** Needs a count array too; the `tails` trick alone does not count.

```quiz
q: What does tails[k] store?
options:
  - The k-th element of the array
  - The smallest possible last element of an increasing subsequence of length k + 1
  - The length of the LIS ending at index k
answer: 1
why: A smaller last element leaves more room to extend, so we keep the smallest one for each length. The array of tails stays sorted.
```

```quiz
q: Which function do you use for the longest strictly increasing subsequence?
options:
  - lower_bound (first element >= x)
  - upper_bound (first element > x)
  - binary_search (returns true or false)
answer: 0
why: Under strict rules an equal value must replace the equal tail instead of extending it, and lower_bound finds that position.
```

```cards
- q: State of the O(n^2) LIS DP?
  a: dp[i] is the length of the longest increasing subsequence ending at index i. The answer is the max over all i.
- q: What does tails[k] hold?
  a: The smallest possible last element of any increasing subsequence of length k + 1.
- q: Strict versus non-decreasing LIS in code?
  a: Strict uses lower_bound. Non-decreasing uses upper_bound.
- q: How do you reconstruct an LIS in O(n log n)?
  a: Store tailIdx[k] and a parent par[i] = tailIdx[p - 1] when a[i] lands at position p, then walk the parents back from the last tail.
- q: Fewest deletions to make an array strictly increasing?
  a: n minus the LIS length.
```

## Notes

:::notes
- LIS: longest subsequence (order kept, gaps allowed) with strictly increasing values.
- $O(n^2)$ DP: `dp[i]` = best ending at `i`; `dp[i] = 1 + max dp[j]` for `a[j] < a[i]`; answer is the max over all `i`.
- $O(n \log n)$: `tails[k]` = smallest tail of a length `k+1` subsequence; it stays sorted.
- For each `x`, `lower_bound` in `tails`; append if at the end, else overwrite.
- Non-decreasing: switch to `upper_bound`.
- Reconstruct with `tailIdx` and a parent array; `tails` itself is not the sequence.
- Pairs: sort one coordinate (ties handled so equal values cannot chain), then LIS on the other.
- `n - LIS` = minimum removals to make the array increasing.
:::
