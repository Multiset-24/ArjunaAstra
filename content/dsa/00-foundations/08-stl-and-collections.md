---
title: STL and Java Collections
summary: The standard containers in C++ (STL) and Java side by side, what each operation costs, and the pitfalls that cause wrong answers and timeouts.
minutes: 30
difficulty: beginner
rating: [800, 1200]
tags: [stl, collections, map, set, heap]
prereqs: [complexity, sorting-and-searching]
problems:
  - cf: 520A
    name: Pangram
    rating: 800
  - cf: 1703B
    name: ICPC Balloons
    rating: 800
  - cf: 1722C
    name: Word Game
    rating: 800
    core: true
  - cf: 1760C
    name: Advantage
    rating: 800
  - cf: 519B
    name: A and B and Compilation Errors
    rating: 1100
  - cf: 1520D
    name: Same Differences
    rating: 1200
    core: true
    note: count with a map
  - cf: 1790D
    name: Matryoshkas
    rating: 1200
  - cses: 1621
    name: Distinct Numbers
  - cses: 1091
    name: Concert Tickets
    note: needs a sorted multiset
  - lc: two-sum
    name: Two Sum
    difficulty: Easy
    core: true
  - lc: contains-duplicate
    name: Contains Duplicate
    difficulty: Easy
  - lc: valid-anagram
    name: Valid Anagram
    difficulty: Easy
exercises:
  - Solve Two Sum with a hash map, then again with sorting and two indices. Compare running times on 200,000 numbers.
  - Re-implement a frequency counter with an array instead of a map when values are below 10^6, and compare the speed.
---

## Why containers

A **container** is a ready-made data structure from the standard library: C++ calls its collection the **STL** (Standard Template Library), Java calls its one the **Collections Framework**. Using them saves time in a contest and removes bugs. The skill is knowing which one fits and what it costs.

| Need | C++ | Java |
|---|---|---|
| growable array | `vector<int>` | `ArrayList<Integer>` or `int[]` |
| sorted set | `set<int>` | `TreeSet<Integer>` |
| sorted map | `map<int,int>` | `TreeMap<Integer,Integer>` |
| hash set / map | `unordered_set`, `unordered_map` | `HashSet`, `HashMap` |
| repeated values, sorted | `multiset<int>` | `TreeMap<Integer,Integer>` as counts |
| heap (top item fast) | `priority_queue<int>` (max) | `PriorityQueue<Integer>` (min) |
| stack, queue, deque | `stack`, `queue`, `deque` | `ArrayDeque<Integer>` |

## What each operation costs

| Container | Insert / erase / find | Notes |
|---|---|---|
| vector / ArrayList | end: $O(1)$ amortised; middle: $O(n)$ | index access $O(1)$ |
| set / TreeSet, map / TreeMap | $O(\log n)$ | sorted order, lower_bound / `ceiling` |
| unordered / Hash | $O(1)$ average, $O(n)$ worst | no order |
| priority_queue / PriorityQueue | push, pop $O(\log n)$ | top $O(1)$ |
| deque / ArrayDeque | both ends $O(1)$ | no middle insert |

Hash tables place each key in a bucket by `key mod size`; collisions share a bucket. Step through it.

```viz
algo: hash-table
input:
  keys: [15, 11, 27, 8, 12, 22, 4]
  size: 7
```

## Counting with a map

Problem: read `n` numbers and print each distinct value with how many times it appears, in increasing order.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    map<int, int> cnt;
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        cnt[x]++;
    }
    for (auto &[value, c] : cnt) cout << value << " " << c << "\n";
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
        TreeMap<Integer, Integer> cnt = new TreeMap<>();
        for (int i = 0; i < n; i++) {
            int x = Integer.parseInt(st.nextToken());
            cnt.merge(x, 1, Integer::sum);
        }
        StringBuilder out = new StringBuilder();
        for (Map.Entry<Integer, Integer> e : cnt.entrySet())
            out.append(e.getKey()).append(" ").append(e.getValue()).append("\n");
        System.out.print(out);
    }
}
```
```input
7
5 3 5 1 3 5 9
```
```output
1 1
3 2
5 3
9 1
```

Use `unordered_map` / `HashMap` instead when order is irrelevant. If values are small (say below $10^6$), a plain array `cnt[x]++` is the fastest of all.

## The everyday operations

```cpp
vector<int> v = {3, 1, 2};
v.push_back(4);                          // O(1) amortised
set<int> s(v.begin(), v.end());          // sorted, no duplicates
auto it = s.lower_bound(2);              // first element >= 2, or s.end()
priority_queue<int> pq;                  // max-heap
pq.push(5); int top = pq.top(); pq.pop();
deque<int> dq; dq.push_back(1); dq.push_front(0);
```
```java
List<Integer> v = new ArrayList<>(List.of(3, 1, 2));
v.add(4);                                // O(1) amortised
TreeSet<Integer> s = new TreeSet<>(v);   // sorted, no duplicates
Integer it = s.ceiling(2);               // first element >= 2, or null
PriorityQueue<Integer> pq = new PriorityQueue<>(Collections.reverseOrder()); // max-heap
pq.add(5); int top = pq.peek(); pq.poll();
ArrayDeque<Integer> dq = new ArrayDeque<>(); dq.addLast(1); dq.addFirst(0);
```

A **heap** keeps the smallest (or largest) item at the top. Pushing sifts an item up, popping sifts the last leaf down from the root.

```viz
algo: heap
input:
  ops: ["push 5", "push 3", "push 8", "push 1", "pop", "push 2", "pop"]
```

```quiz
q: In Java, `PriorityQueue<Integer> pq` receives 5, 1, 3 with `add`. What does `poll()` return first?
options:
  - 5, because it was added first
  - 1, because the default is a min-heap
  - 5, because the default is a max-heap
answer: 1
why: "Java's PriorityQueue is a min-heap by default. C++ priority_queue is the opposite: a max-heap, unless you give it greater<int>."
```

## Which one do I pick?

- **Does this value exist? How many times?** A hash set or hash map. If the values are small, an array.
- **Need sorted order, or the next larger value?** `set` / `TreeSet`, or sort a vector once.
- **Need the smallest or largest item again and again, with insertions in between?** A heap.
- **Need to add and remove at both ends?** `deque` / `ArrayDeque`.
- **Need indexed access to everything?** A plain array or `vector`.

Two habits help. First, estimate the cost from the table above before choosing: a `set` with $2 \times 10^5$ items and $2 \times 10^5$ operations is about 3.6 million steps, which is fine. Second, prefer the simplest structure. A sorted vector plus binary search from the previous lesson often replaces a `set` and runs faster.

## Pitfalls

```predict
lang: cpp
code: |
  map<int, int> m;
  if (m[5] == 0) cout << "zero ";
  cout << m.size();
output: zero 1
why: Reading m[5] inserts the key with the default value 0. Use m.count(5) or m.find(5) to look without inserting.
```

```predict
lang: java
code: |
  Integer a = 127, b = 127, c = 128, d = 128;
  System.out.println((a == b) + " " + (c == d));
output: true false
why: "== on Integer objects compares references. Java caches boxed values from -128 to 127, so those compare equal; 128 creates two different objects. Use equals()."
```

- **Anti-hash tests.** `unordered_map` with plain integer keys can be attacked by inputs that put every key in one bucket, making each operation $O(n)$. Safer options are `map`, sorting, or a randomised hash.
- **Java `HashMap`** converts long collision chains into balanced trees, so degradation is milder, but boxed `Integer` keys are slow for millions of entries. Prefer arrays or `TreeMap` when you can.
- **`list.remove(3)`** on a `List<Integer>` removes the item at index 3. To remove the value 3 use `list.remove(Integer.valueOf(3))`.
- **Erasing while iterating** invalidates a C++ iterator. Write `it = s.erase(it);`.
- **`v.size() - 1`** is a huge number when the vector is empty, because `size()` is unsigned. Cast: `(int)v.size() - 1`.

```cpp
struct custom_hash {
    static uint64_t splitmix64(uint64_t x) {
        x += 0x9e3779b97f4a7c15ULL;
        x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9ULL;
        x = (x ^ (x >> 27)) * 0x94d049bb133111ebULL;
        return x ^ (x >> 31);
    }
    size_t operator()(uint64_t x) const {
        static const uint64_t R = chrono::steady_clock::now().time_since_epoch().count();
        return splitmix64(x + R);
    }
};
unordered_map<long long, int, custom_hash> m;
```

:::truth
Most 800-1200 problems do not need a clever structure, only the right standard one. If you reach for a hash map, ask first whether sorting or a plain array would do the same job more safely.
:::

```blanks
prompt: Count distinct values with a set.
lang: cpp
code: |
  set<int> s;
  for (int x : a) s.[[insert]](x);
  cout << s.[[size]]();
why: A set stores each value once, so its size is the number of distinct values.
```

## Cards

```cards
- q: Which C++ container is a max-heap and which Java class is a min-heap?
  a: C++ priority_queue is a max-heap by default. Java PriorityQueue is a min-heap by default.
- q: What does map[key] do when the key is missing?
  a: It inserts the key with a default value (0 for int). Use count or find to check without inserting.
- q: Why use equals instead of == for Integer in Java?
  a: == compares object references. Small values are cached, so == works by accident for -128 to 127 and fails above.
- q: Costs of set versus unordered_set?
  a: set is O(log n) per operation and sorted. unordered_set is O(1) on average, O(n) worst case, and unordered.
- q: How do you get a multiset in Java?
  a: Use a TreeMap from value to count and update the counts.
```

## Notes

:::notes
- C++ vector / Java ArrayList: growable array, O(1) amortised append, O(n) middle insert.
- set / map (TreeSet / TreeMap): sorted, O(log n), supports lower_bound / ceiling.
- unordered_* / Hash*: O(1) average, no order, can be attacked with anti-hash tests.
- priority_queue is a max-heap; Java PriorityQueue is a min-heap. Push and pop are O(log n).
- Java has no multiset: use a TreeMap of counts.
- map[key] inserts the key; use count or find to test presence.
- Integer == compares references; use equals. list.remove(int) removes by index.
- When values are small, a plain array beats any map.
:::
