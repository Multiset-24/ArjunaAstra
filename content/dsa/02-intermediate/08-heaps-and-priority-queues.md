---
title: Heaps and Priority Queues
summary: Keep a changing collection ready to hand you its smallest or largest item in O(log n), and use that for top-k and merging problems.
minutes: 40
difficulty: intermediate
rating: [1100, 1600]
tags: [heap, priority-queue, greedy, data-structures]
prereqs: [stl-and-collections, stacks-and-queues]
problems:
  - lc: last-stone-weight
    name: Last Stone Weight
    difficulty: Easy
  - cf: 767A
    name: Snacktower
    rating: 1100
    note: a heap of what has arrived, release the largest when it is due
  - lc: kth-largest-element-in-an-array
    name: Kth Largest Element in an Array
    difficulty: Medium
    core: true
  - lc: top-k-frequent-elements
    name: Top K Frequent Elements
    difficulty: Medium
  - cf: 1506D
    name: Epic Transformation
    rating: 1400
    core: true
    note: always pair the two most frequent values
  - lc: merge-k-sorted-lists
    name: Merge k Sorted Lists
    difficulty: Hard
    core: true
  - cses: 1164
    name: Room Allocation
    note: heap of room end times
  - cf: 1353D
    name: Constructing the Array
    rating: 1600
  - cf: 681C
    name: Heap Operations
    rating: 1600
  - cf: 1526C2
    name: Potions (Hard Version)
    rating: 1600
    core: true
    note: undo the worst past choice with a max-heap
  - lc: find-median-from-data-stream
    name: Find Median from Data Stream
    difficulty: Hard
    note: two heaps
---

## The problem

Many tasks need the same move again and again: look at the smallest (or largest) item, remove it, and let new items arrive in between.

- A scheduler always runs the most urgent job, while new jobs keep coming in.
- A stream of numbers, and after each one you must report the 3rd largest so far.
- Merge 100 sorted files into one sorted file.

A **priority queue** is the abstract structure for this: `push(x)`, `top()` (peek the best item) and `pop()` (remove it). A **heap** is the usual way to build one.

## Brute force first

- Keep an unsorted array: `push` is $O(1)$, but finding the best item is $O(n)$.
- Keep a sorted array: `top` is $O(1)$, but every insert shifts elements, $O(n)$.

With $n = 10^5$ operations either choice costs about $10^{10}$ steps in total. We want both operations in $O(\log n)$.

## The idea: a heap

A **binary heap** is a binary tree stored inside a plain array, with one rule: every parent is at least as good as its children. For a min-heap, "good" means smaller, so the root is always the minimum.

- Index $i$ has children $2i+1$ and $2i+2$, and parent $(i-1)/2$. No pointers are needed.
- The tree is always filled level by level, so its height is about $\log_2 n$.
- **push**: put the item at the end, then **sift up** (swap with the parent while it is better).
- **pop**: move the last item to the root, then **sift down** (swap with the better child while a child is better).

Each move touches one node per level, hence $O(\log n)$.

```viz
algo: heap
input:
  ops: ["push 5", "push 3", "push 8", "push 1", "pop", "push 2", "pop"]
```

Step through it and watch which positions change. Then edit the operations and predict the array before you press next.

```quiz
q: You push n numbers into a heap one by one, then pop them all. What do you get and what does it cost?
options:
  - The numbers in sorted order, in O(n log n) total
  - The numbers in sorted order, in O(n) total
  - The numbers in insertion order, in O(n) total
  - The numbers in sorted order, but only after a final sort
answer: 0
why: Every pop returns the current minimum, so the output is sorted. n pushes and n pops each cost O(log n). This is heap sort, and it cannot beat O(n log n) because it is a comparison sort.
```

:::note
Building a heap from a whole array at once (`make_heap` in C++, or `new PriorityQueue<>(collection)` in Java) takes $O(n)$, not $O(n \log n)$. Rarely needed in contests, but good to know.
:::

## C++ and Java disagree

This is the most common source of heap bugs when people switch languages.

| | C++ `priority_queue<T>` | Java `PriorityQueue<T>` |
|---|---|---|
| Default | max-heap (largest on top) | min-heap (smallest on top) |
| Peek | `top()` | `peek()` |
| Remove best | `pop()` returns nothing | `poll()` returns the item |
| Size | `size()`, `empty()` | `size()`, `isEmpty()` |
| Flip the order | `priority_queue<int, vector<int>, greater<int>>` | `new PriorityQueue<>(Collections.reverseOrder())` |

```cpp
priority_queue<int> maxHeap;                              // largest on top
priority_queue<int, vector<int>, greater<int>> minHeap;   // smallest on top
priority_queue<pair<int,int>> pq;                         // compares first, then second
```
```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();                          // smallest on top
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder()); // largest on top
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
```

```predict
lang: cpp
code: |
  priority_queue<int> pq;
  for (int x : {3, 1, 4, 1, 5}) pq.push(x);
  pq.pop();
  cout << pq.top() << " " << pq.size();
output: 4 4
why: C++ priority_queue is a max-heap, so the first pop removes 5. The new top is 4 and four items remain.
```

## Pattern 1: k-th largest with a min-heap

**Problem.** Given $n$ numbers, find the $k$-th largest.

Sorting works in $O(n \log n)$. A heap does it in $O(n \log k)$ and also works on a stream:

- Keep a **min**-heap holding the $k$ largest numbers seen so far.
- After each push, if the heap has more than $k$ items, pop. The popped item is the smallest of the $k+1$, so it cannot be among the top $k$.
- At the end, the top of the heap is the $k$-th largest.

It feels backwards to use a min-heap for "largest", but the item you need to see and evict is the weakest member of the group.

```order
prompt: Arrange the loop that keeps the k largest values in a min-heap.
lang: cpp
code: |
  priority_queue<int, vector<int>, greater<int>> pq;
  for (int x : a) {
      pq.push(x);
      if ((int)pq.size() > k) pq.pop();
  }
  return pq.top();
distractors:
  - "      if ((int)pq.size() < k) pq.pop();"
why: Push first, then trim back to k by removing the smallest. What remains are the k largest, and the smallest of them (the top) is the k-th largest.
```

```cpp
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k;
    scanf("%d %d", &n, &k);
    priority_queue<int, vector<int>, greater<int>> pq;  // min-heap
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        pq.push(x);
        if ((int)pq.size() > k) pq.pop();
    }
    printf("%d\n", pq.top());
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
        PriorityQueue<Integer> pq = new PriorityQueue<>();  // min-heap by default
        st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) {
            pq.add(Integer.parseInt(st.nextToken()));
            if (pq.size() > k) pq.poll();
        }
        System.out.println(pq.peek());
    }
}
```
```input
6 2
3 2 1 5 6 4
```
```output
5
```

Walkthrough with $k = 2$ on `3 2 1 5 6 4`:

| Read | Heap after trimming | Note |
|---|---|---|
| 3, 2 | {2, 3} | size reached k |
| 1 | {2, 3} | pushed 1, popped 1 |
| 5 | {3, 5} | popped 2 |
| 6 | {5, 6} | popped 3 |
| 4 | {5, 6} | popped 4 |

The top is 5, the second largest.

```quiz
q: To track the k smallest values seen so far, which heap would you keep and which end would you evict?
options:
  - A min-heap, evicting the smallest
  - A max-heap, evicting the largest
  - A min-heap, evicting the largest
  - A max-heap, evicting the smallest
answer: 1
why: The group you keep is the k smallest, so its weakest member is the largest one. A max-heap shows that member on top, and that is the one to evict.
```

## Pattern 2: merge k sorted lists

**Problem.** There are $k$ sorted lists with $N$ items in total. Produce one sorted list.

- Merging pairs one after another can cost $O(Nk)$.
- Better: the next output is always the smallest among the **current heads** of the lists. Keep those $k$ heads in a min-heap.
- Pop the smallest head, output it, and push the next item of the same list.

Each item is pushed and popped once, so the cost is $O(N \log k)$.

```cpp
#include <bits/stdc++.h>
using namespace std;
int main() {
    int k;
    scanf("%d", &k);
    vector<vector<int>> lists(k);
    for (int i = 0; i < k; i++) {
        int m;
        scanf("%d", &m);
        lists[i].resize(m);
        for (int &x : lists[i]) scanf("%d", &x);
    }
    // (value, which list, index inside that list)
    using T = tuple<int, int, int>;
    priority_queue<T, vector<T>, greater<T>> pq;
    for (int i = 0; i < k; i++)
        if (!lists[i].empty()) pq.push({lists[i][0], i, 0});
    vector<int> res;
    while (!pq.empty()) {
        auto [v, i, j] = pq.top();
        pq.pop();
        res.push_back(v);
        if (j + 1 < (int)lists[i].size()) pq.push({lists[i][j + 1], i, j + 1});
    }
    for (size_t t = 0; t < res.size(); t++) printf("%d%c", res[t], t + 1 < res.size() ? ' ' : '\n');
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StreamTokenizer in = new StreamTokenizer(br);
        in.nextToken();
        int k = (int) in.nval;
        int[][] lists = new int[k][];
        for (int i = 0; i < k; i++) {
            in.nextToken();
            lists[i] = new int[(int) in.nval];
            for (int j = 0; j < lists[i].length; j++) {
                in.nextToken();
                lists[i][j] = (int) in.nval;
            }
        }
        // entry = {value, which list, index inside that list}
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        for (int i = 0; i < k; i++)
            if (lists[i].length > 0) pq.add(new int[]{lists[i][0], i, 0});
        StringBuilder sb = new StringBuilder();
        while (!pq.isEmpty()) {
            int[] e = pq.poll();
            sb.append(e[0]).append(' ');
            if (e[2] + 1 < lists[e[1]].length)
                pq.add(new int[]{lists[e[1]][e[2] + 1], e[1], e[2] + 1});
        }
        System.out.println(sb.toString().trim());
    }
}
```
```input
3
3 1 4 7
2 2 5
3 0 3 8
```
```output
0 1 2 3 4 5 7 8
```

```blanks
prompt: Complete the core of the merge loop in Java.
lang: java
code: |
  int[] e = pq.[[poll]]();
  sb.append(e[0]).append(' ');
  if (e[2] + 1 < lists[e[1]].length)
      pq.add(new int[]{lists[e[1]][[[e[2] + 1|e[2]+1]]], e[1], e[2] + 1});
why: poll removes and returns the smallest head. The replacement comes from the same list (e[1]) at the next index (e[2] + 1).
```

## Complexity

| Operation | Binary heap |
|---|---|
| push | $O(\log n)$ |
| pop | $O(\log n)$ |
| top / peek | $O(1)$ |
| build from n items | $O(n)$ |
| remove an arbitrary item | not supported directly |

- k-th largest: $O(n \log k)$ time, $O(k)$ memory.
- Merge k lists: $O(N \log k)$ time, $O(k)$ extra memory.

:::truth
A heap is not a sorted structure. Only the top is guaranteed to be the best. Iterating over a Java `PriorityQueue` or reading its underlying array does not give sorted order, and C++ `priority_queue` does not let you iterate at all.
:::

## Pitfalls

- **Comparator overflow.** In Java, `(a, b) -> a - b` breaks when the difference exceeds the int range. Use `Integer.compare(a, b)` or `Long.compare`.
- **Empty heap.** Calling `top()` or `pop()` on an empty C++ `priority_queue` is undefined behaviour. Java's `peek()` returns `null`, and `remove()` throws.
- **No decrease-key.** You cannot lower the priority of an item that is already inside. The standard workaround is to push the new version and ignore stale entries when they surface. This is **lazy deletion**, and the shortest-paths lesson uses it.
- **Pairs sort by the first field.** `priority_queue<pair<int,int>>` puts the largest `first` on top. To get the smallest, negate the key or use `greater<>`.
- **Wrong heap for the job.** If you only need the single best item once, a plain scan is simpler than a heap.

:::details[When one heap is not enough: the running median]
Keep the lower half of the numbers in a max-heap and the upper half in a min-heap, with sizes differing by at most one. The median is then at one or both tops. Each new number goes into one heap, and if the sizes drift apart you move one top across. Every insert is $O(\log n)$.
:::

## Notes

:::notes
- A priority queue gives push, peek-best and pop-best; a binary heap makes push and pop O(log n) and peek O(1).
- Heap = binary tree in an array. Children of i are 2i+1 and 2i+2; parent is (i-1)/2.
- push sifts up; pop moves the last item to the root and sifts down.
- C++ priority_queue is a max-heap by default (use greater<> for min). Java PriorityQueue is a min-heap by default (use Collections.reverseOrder() for max).
- k-th largest: keep a min-heap of size k, push then pop when size exceeds k, answer is top. O(n log k).
- Merge k sorted lists: heap of current heads (value, list, index). O(N log k).
- A heap cannot iterate in sorted order and has no decrease-key; push a new copy and skip stale entries (lazy deletion).
- Java comparators: never subtract, use Integer.compare.
- Running median: max-heap for the lower half, min-heap for the upper half.
:::

```cards
- q: What does a min-heap guarantee about its tree?
  a: Every parent is less than or equal to its children, so the minimum is at the root. Nothing is promised between siblings or across levels.
- q: Array indices of the children and parent of node i in a binary heap?
  a: Children 2i+1 and 2i+2, parent (i-1)/2 (0-indexed).
- q: Which heap finds the k-th largest of a stream, and how big is it?
  a: A min-heap of size k. Evict the smallest whenever it grows past k. The top is the k-th largest. O(n log k).
- q: Default order of C++ priority_queue versus Java PriorityQueue?
  a: C++ is a max-heap. Java is a min-heap.
- q: How do you "decrease the key" in a standard heap?
  a: You cannot. Push the new value and ignore outdated entries when they are popped (lazy deletion).
```
