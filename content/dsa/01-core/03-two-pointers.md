---
title: Two Pointers
summary: Walk two indices through an array to replace a nested loop with a single pass.
minutes: 30
difficulty: beginner
rating: [800, 1400]
tags: [arrays, technique, sorting]
prereqs: [arrays-and-strings, sorting-and-searching]
problems:
  - cf: 1462A
    name: Favorite Sequence
    rating: 800
  - cf: 381A
    name: Sereja and Dima
    rating: 800
  - lc: valid-palindrome
    name: Valid Palindrome
    difficulty: Easy
  - cf: 1669F
    name: Eating Candies
    rating: 1100
    core: true
    note: left and right pointers with running sums
  - cf: 489B
    name: BerSU Ball
    rating: 1200
    core: true
    note: sort, then match from both lists
  - lc: two-sum-ii-input-array-is-sorted
    name: Two Sum II - Input Array Is Sorted
    difficulty: Medium
  - cses: 1640
    name: Sum of Two Values
    note: keep the original indices when you sort
  - cses: 1090
    name: Ferris Wheel
  - cf: 1538C
    name: Number of Pairs
    rating: 1300
    core: true
    note: count pairs with sum in a range
  - lc: container-with-most-water
    name: Container With Most Water
    difficulty: Medium
  - cf: 1324D
    name: Pair of Topics
    rating: 1400
  - lc: 3sum
    name: 3Sum
    difficulty: Medium
exercises:
  - Given a sorted array, count pairs with sum at most x, then sum between L and R, using the counting rule from this lesson twice.
  - Merge two sorted arrays and remove duplicates in the same pass.
---

## The problem

You get a sorted array `a` of n numbers and a target T. Find two different positions i < j with `a[i] + a[j] = T`, or report that none exist.

## Brute force first

Try every pair: for each i, for each j > i, check the sum.

- Cost: about n^2 / 2 pairs, which is O(n^2).
- For n = 200,000 that is 2 x 10^10 checks. Too slow by a factor of about 200.
- What the brute force ignores: the array is sorted. Order carries information, and the loops never use it.

## The idea: pointers at both ends

Put `l` at the first element and `r` at the last. Look at `s = a[l] + a[r]`.

- `s == T`: done.
- `s < T`: the sum is too small. `a[l]` is paired with the largest value still available, and even that is not enough, so `a[l]` can never be part of the answer. Move `l` right.
- `s > T`: symmetric. `a[r]` is too big even with the smallest partner. Move `r` left.

Each step throws away one element for good, so there are at most n steps.

```viz
algo: two-pointers
input:
  arr: [1, 2, 4, 7, 11, 15]
  target: 15
```

```quiz
q: In a sorted array the current sum a[l] + a[r] is larger than the target. Which move is safe?
options:
  - Move l right, to make the left value bigger
  - Move r left, to make the right value smaller
  - Move both pointers inward
answer: 1
why: Moving l right would only increase the sum. Moving both could skip a valid pair. Only a smaller a[r] can bring the sum down, and a[r] is already too large even with the smallest left partner.
```

:::details[Why the pointers never skip the answer (proof)]
Suppose a valid pair (i, j) with i < j exists. Claim: at every step, `l <= i` and `j <= r`. At the start this is true. Take a step where `a[l] + a[r] < T`. If `l == i`, then `a[l] + a[r] >= a[i] + a[j] = T` because `r >= j` and the array is sorted, a contradiction. So `l < i`, and moving `l` right keeps `l <= i`. The case `a[l] + a[r] > T` is the mirror image. The pointers can only stop on the answer, or cross when no answer exists.
:::

:::key
Two pointers need a **monotonic** property: each move must change the value in only one direction, so that one element can be discarded safely. Sorting creates this property.
:::

## Template

The program reads a sorted array and prints the 1-indexed positions of a pair, or `NO`.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    long long target;
    cin >> n >> target;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;          // already sorted ascending

    int l = 0, r = n - 1;
    while (l < r) {
        long long s = a[l] + a[r];
        if (s == target) {
            cout << l + 1 << " " << r + 1 << "\n";
            return 0;
        }
        if (s < target) l++;             // need a bigger sum
        else r--;                        // need a smaller sum
    }
    cout << "NO\n";
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
        long target = Long.parseLong(st.nextToken());
        long[] a = new long[n];
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());   // sorted ascending

        int l = 0, r = n - 1;
        while (l < r) {
            long s = a[l] + a[r];
            if (s == target) {
                System.out.println((l + 1) + " " + (r + 1));
                return;
            }
            if (s < target) l++;         // need a bigger sum
            else r--;                    // need a smaller sum
        }
        System.out.println("NO");
    }
}
```
```input
6 15
1 2 4 7 11 15
```
```output
3 5
```

### Walkthrough

- `l=0, r=5`: 1 + 15 = 16 is too big, so `r` moves to 4.
- `l=0, r=4`: 1 + 11 = 12 is too small, so `l` moves to 1.
- `l=1, r=4`: 2 + 11 = 13 is too small, so `l` moves to 2.
- `l=2, r=4`: 4 + 11 = 15. Print positions 3 and 5.

```predict
lang: cpp
code: |
  int a[] = {1, 3, 4, 6, 9, 12};
  int l = 0, r = 5, target = 11, steps = 0;
  while (l < r) {
      steps++;
      int s = a[l] + a[r];
      if (s == target) break;
      if (s < target) l++; else r--;
  }
  cout << l << " " << r << " " << steps;
output: 3 3 5
why: The sums seen are 13, 10, 12, 9, 10 and none equals 11. After 5 steps the pointers meet at index 3 and the loop ends, so no pair exists.
```

## Same direction: two arrays and counting

Pointers do not always start at opposite ends. Two common forms:

- **Two sorted arrays.** One pointer per array, always take the smaller front element. This is the merge step of merge sort.
- **Read and write.** One pointer scans, one marks the output position. You saw this in the arrays lesson.

```order
prompt: Arrange the merge of sorted arrays a (length n) and b (length m) into out.
lang: cpp
code: |
  int i = 0, j = 0;
  while (i < n && j < m) {
      if (a[i] <= b[j]) out.push_back(a[i++]);
      else out.push_back(b[j++]);
  }
  while (i < n) out.push_back(a[i++]);
  while (j < m) out.push_back(b[j++]);
distractors:
  - "while (i < n || j < m) {"
why: The main loop runs only while both arrays have elements. Once one is empty, the remaining tail of the other is already sorted and is copied as is. With || the loop would read past the end of one array.
```

### Counting pairs

How many pairs i < j have `a[i] + a[j] <= x`? Sort first, then use the ends. If `a[l] + a[r] <= x`, then `a[l]` also works with every element between `l` and `r`, because they are all no larger than `a[r]`. That is a whole group counted in one step.

```cpp
sort(a.begin(), a.end());
long long count = 0;
int l = 0, r = n - 1;
while (l < r) {
    if (a[l] + a[r] <= x) { count += r - l; l++; }
    else r--;
}
```
```java
Arrays.sort(a);
long count = 0;
int l = 0, r = n - 1;
while (l < r) {
    if (a[l] + a[r] <= x) { count += r - l; l++; }
    else r--;
}
```

```blanks
prompt: Fill in how many new pairs are counted when a[l] + a[r] <= x.
lang: cpp
code: |
  if (a[l] + a[r] <= x) { count += [[r - l|r-l]]; l++; }
why: The partners of a[l] are the positions l+1 through r, which is r - l positions.
```

For "sum between L and R", compute `count(R) - count(L - 1)`.

## When it applies

| Situation | Pointers | Needs |
|---|---|---|
| Pair with a given sum | opposite ends | sorted array |
| Merge, intersect, compare two lists | one per array | both sorted |
| Filter, deduplicate, partition | read and write | nothing |
| Palindrome check | opposite ends | nothing |
| Segment with a sum limit | same direction | positive values (next lesson) |

## Complexity

- The pointer loop is O(n): `l + (n - 1 - r)` grows by one each step and never exceeds n.
- If you must sort first, the total is O(n log n). Sorting dominates.
- Extra memory: O(1).

## Pitfalls

- **Unsorted input.** The method is wrong, not slow, on unsorted data. Sort first, and if you need original positions, sort pairs of (value, index).
- **Loop condition.** For pairs of different elements use `l < r`. With `l <= r` you may pair an element with itself.
- **Moving both pointers.** Move exactly one pointer per step unless you can argue the other cannot matter.
- **Duplicates in 3Sum-style problems.** After fixing one element and using two pointers on the rest, skip equal values or you report the same triple many times.
- **Overflow.** Sums of two values near 10^9 do not fit in a 32-bit `int`.

:::truth
Two pointers is short to write and easy to apply wrongly. Before using it, say in one sentence why moving a pointer can never discard the answer. If you cannot, the technique probably does not apply.
:::

```cards
- q: What must hold for the opposite-ends pair-sum method to work?
  a: The array is sorted, so moving l right can only increase the sum and moving r left can only decrease it.
- q: Time complexity of two pointers on a sorted array, and with sorting included?
  a: "$O(n)$ for the pass, $O(n \\log n)$ if you also have to sort."
- q: How do you count pairs with sum at most x in a sorted array?
  a: "If a[l] + a[r] <= x add r - l and move l right, otherwise move r left."
- q: Why use l < r and not l <= r for pairs?
  a: With l <= r the pointers can meet on one element and pair it with itself.
- q: How do you merge two sorted arrays?
  a: Keep one pointer per array, append the smaller front element, then copy the leftover tail.
```

## Notes

:::notes
- Brute force over pairs is O(n^2). On a sorted array, two pointers solve pair problems in O(n).
- Pair sum: l at the start, r at the end. If the sum is too small move l right, if too big move r left.
- Correctness invariant: if an answer (i, j) exists then l <= i and j <= r at all times.
- Needs a monotonic property. Sorting is the usual way to get one; sort pairs if you need original indices.
- Counting pairs with sum <= x: if a[l] + a[r] <= x add r - l and move l right, else move r left.
- Merge: one pointer per sorted array, take the smaller front, then copy the tail.
- Use `l < r` for distinct elements, `long long` for sums, and skip duplicates in 3Sum.
:::
