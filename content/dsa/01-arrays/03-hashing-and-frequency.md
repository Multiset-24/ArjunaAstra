---
title: Hashing and Frequency Counting
summary: Use hash maps and sets to answer "have I seen this?" and "how many times?" in constant time, and turn pair-counting into a single pass.
minutes: 35
difficulty: intermediate
rating: [800, 1500]
tags: [hashing, maps, sets, counting, technique]
prereqs: [arrays-and-strings, prefix-sums]
problems:
  - cf: 1703B
    name: ICPC Balloons
    rating: 800
    note: count distinct letters with a set or array
  - lc: two-sum
    name: Two Sum
    difficulty: Easy
    core: true
  - cses: 1621
    name: Distinct Numbers
    note: a set, or sort and count
  - lc: group-anagrams
    name: Group Anagrams
    difficulty: Medium
    note: a sorted word is a good map key
  - cf: 1520D
    name: Same Differences
    rating: 1200
    core: true
    note: rewrite the pair condition as key equality
  - cf: 4C
    name: Registration System
    rating: 1300
    note: map from a name to how often it was used
  - lc: subarray-sum-equals-k
    name: Subarray Sum Equals K
    difficulty: Medium
    core: true
    note: prefix sums plus a map
  - cf: 1899D
    name: Yarik and Musical Notes
    rating: 1300
    note: find a pair-equality rewrite, then count
  - lc: longest-consecutive-sequence
    name: Longest Consecutive Sequence
    difficulty: Medium
    note: a set, and only start from sequence beginnings
  - cf: 2A
    name: Winner
    rating: 1500
    note: two passes with a map
exercises:
  - Count pairs i < j with a[i] + a[j] = k in one pass. What do you store, and when do you update it?
  - Why is `unordered_map<pair<int,int>, int>` a compile error in C++, and how would you fix it?
---

## The problem

Three questions come up constantly:

1. Have I seen this value before?
2. How many times has it appeared?
3. How many earlier elements have some property that matches the current one?

All three are lookups by value. An array only helps when values are small whole numbers. When the value is `10^9`, a string, or a pair, you need a different tool.

## Brute force first

Keep a plain list of what you have seen. Each question scans the list: O(n) per question, so O(n^2) for n items.

With n = 200,000 that is about 4 x 10^10 steps. A typical judge allows about 10^8 simple steps per second, so this takes minutes instead of one second.

## The idea: a hash table

A **hash table** stores each key in a **bucket** chosen by a **hash function**, a function that turns a key into a number. The simplest version is `key mod size`.

- To look a key up, compute its bucket and look only there.
- Keys that land in the same bucket **collide**. They share a short list, called a chain.
- If the table is big enough and the hash spreads keys well, chains stay short. Each operation costs O(1) on average.

```viz
algo: hash-table
input:
  keys: [15, 11, 27, 8, 12, 22, 4]
  size: 7
```

Try keys that are all multiples of 7. Every one lands in bucket 0 and the table degrades to a list. Remember this for the anti-hash section.

```quiz
q: A hash table has 1,000,000 keys and a hash function that sends every key to bucket 0. What is the cost of one lookup?
options:
  - O(1), because it is a hash table
  - O(log n), because buckets are sorted
  - O(n), because one chain holds everything
answer: 2
why: "Speed comes from the hash spreading keys over many buckets. If all keys collide, the single chain is searched from the start, which is a plain list scan."
```

## The toolbox

| Need | C++ | Java |
|---|---|---|
| Count each value | `unordered_map<K,int>` | `HashMap<K,Integer>` |
| Have I seen it? | `unordered_set<K>` | `HashSet<K>` |
| Sorted keys, nearest key | `map`, `set` | `TreeMap`, `TreeSet` |
| Keys are small integers | `vector<int>` | `int[]` |

:::tip
If the keys fit in a range like 0..10^6, a plain array is faster and simpler than any hash table. Use a map only when the keys are large, negative, or not numbers.
:::

## Counting pairs with a map

Problem: given `a`, count pairs `i < j` with `a[j] - a[i] = j - i`.

Brute force checks all pairs. The trick is to move everything about `i` to one side:

- `a[j] - j = a[i] - i`.
- Define `key(x) = a[x] - x`. The condition is now "two keys are equal".
- Walk `j` from left to right. Before inserting `key(j)`, the map holds the earlier keys, so its count for `key(j)` is exactly the number of valid `i`.

This pattern covers most "count pairs" problems: **rewrite the condition as equality, then count earlier matches while scanning**.

The program below uses `seen[key]++`, which returns the old count and then adds one.

```cpp
#include <bits/stdc++.h>
using namespace std;

struct SplitMix {
    static uint64_t mix(uint64_t x) {
        x += 0x9e3779b97f4a7c15ULL;
        x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9ULL;
        x = (x ^ (x >> 27)) * 0x94d049bb133111ebULL;
        return x ^ (x >> 31);
    }
    size_t operator()(uint64_t x) const {
        static const uint64_t SEED =
            chrono::steady_clock::now().time_since_epoch().count();
        return mix(x + SEED);
    }
};

int main() {
    int n;
    scanf("%d", &n);
    unordered_map<long long, int, SplitMix> seen;
    long long pairs = 0;
    for (int i = 0; i < n; i++) {
        long long a;
        scanf("%lld", &a);
        pairs += seen[a - i]++;
    }
    printf("%lld\n", pairs);
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
        HashMap<Long, Integer> seen = new HashMap<>();
        long pairs = 0;
        for (int i = 0; i < n; i++) {
            long key = Long.parseLong(st.nextToken()) - i;
            int c = seen.getOrDefault(key, 0);
            pairs += c;
            seen.put(key, c + 1);
        }
        System.out.println(pairs);
    }
}
```
```input
7
3 4 2 5 6 7 9
```
```output
6
```

Walkthrough: the keys `a[i] - i` are 3, 3, 0, 2, 2, 2, 3. The value 3 appears three times (3 pairs) and 2 appears three times (3 pairs), so the answer is 6.

```predict
lang: cpp
code: |
  map<int,int> m;
  int a[] = {4, 1, 4, 4, 1};
  for (int x : a) cout << m[x]++ << " ";
prompt: What does this print?
output: 0 0 1 2 1
why: m[x]++ yields the count before the increment. The first 4 gives 0, the first 1 gives 0, the second 4 gives 1, the third 4 gives 2, the second 1 gives 1.
```

### Two Sum, the classic

Find indices `i < j` with `a[i] + a[j] = target`. For each `i`, the partner you need is `target - a[i]`. Look it up first, then insert `a[i]`.

```blanks
prompt: Complete the one-pass Two Sum.
lang: java
code: |
  HashMap<Integer, Integer> pos = new HashMap<>();
  for (int i = 0; i < n; i++) {
      int need = target - a[i];
      if (pos.containsKey([[need]])) return new int[]{pos.get(need), i};
      pos.put([[a[i]]], i);
  }
why: Look up the partner target - a[i] among earlier elements, then record the current value with its index. Looking up before inserting stops an element from pairing with itself.
```

## Ordered or unordered

| | Unordered (hash) | Ordered (tree) |
|---|---|---|
| Names | `unordered_map`, `HashMap` | `map`, `TreeMap` |
| Insert / find | O(1) average | O(log n) |
| Sorted iteration | no | yes |
| Nearest key (`lower_bound`, `floor`) | no | yes |

The ordered version is a balanced search tree. It is slower per operation but never degrades, and it keeps keys sorted.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    map<string, int> cnt;
    for (int i = 0; i < n; i++) {
        string w;
        cin >> w;
        cnt[w]++;
    }
    for (auto& [w, c] : cnt) cout << w << " " << c << "\n";
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
        TreeMap<String, Integer> cnt = new TreeMap<>();
        for (int i = 0; i < n; i++) cnt.merge(st.nextToken(), 1, Integer::sum);
        for (Map.Entry<String, Integer> e : cnt.entrySet())
            System.out.println(e.getKey() + " " + e.getValue());
    }
}
```
```input
7
pear apple pear fig apple pear fig
```
```output
apple 2
fig 2
pear 3
```

## Anti-hash tests

:::truth
C++ `unordered_map` uses the integer itself as its hash, with a known set of prime table sizes. On Codeforces, other contestants can read your code during the hacking phase and craft thousands of keys that all land in one bucket. Your O(n) solution becomes O(n^2) and fails.
:::

The fix is a hash that an attacker cannot predict:

- **splitmix64** is a short routine that scrambles all 64 bits of a number. It is the `mix` function in the program above.
- Adding a **seed** read from the clock means the scrambling differs on every run, so no key set can be prepared in advance.
- Java's `HashMap` is safer by default. It turns long chains into balanced trees, so the worst case is about O(log n) per operation. It can still be slowed down, so for very large inputs prefer sorting plus coordinate compression (replace values by their rank).

## Complexity

- Average O(1) per insert, lookup and erase for hash tables, so O(n) for a single pass.
- Worst case O(n) per operation for an attacked `unordered_map`. Ordered maps are O(log n) always.
- Memory is O(distinct keys), with a noticeable constant. Hash tables use several times the memory of an array.

## Pitfalls

- **`map[x]` inserts.** In C++, reading `m[x]` creates the key with value 0. Use `m.count(x)` or `find` to test without inserting.
- **Overflow in keys.** `a[i] - i` fits `int` here, but sums of two values need `long long`.
- **Pairs as keys.** `unordered_map<pair<int,int>,...>` has no default hash in C++. Use `map`, or pack the pair into one `long long`.
- **Updating before querying.** For "earlier elements" counts, query first, then insert. Reversing the order counts an element against itself.
- **Leftover zero counts.** After decrementing to 0 the key still exists. Erase it if you later use the map size as "distinct count".

```cards
- q: Average and worst-case cost of one unordered_map lookup?
  a: O(1) on average, O(n) in the worst case when many keys collide into one bucket.
- q: What is a collision in a hash table?
  a: Two different keys that the hash function sends to the same bucket. They share a chain, which is searched linearly.
- q: How do you count pairs i < j with a[j] - j = a[i] - i in one pass?
  a: Scan left to right, add map[key] to the answer, then increment map[key]. Query before inserting.
- q: When use map or TreeMap instead of unordered_map or HashMap?
  a: When you need sorted keys or nearest-key queries, or when you cannot risk anti-hash tests. It costs O(log n) per operation.
- q: Why add a clock-based seed to splitmix64?
  a: So the hash differs on every run and an attacker cannot craft keys that all collide.
```

## Notes

:::notes
- Hash table: key -> bucket via a hash function; average O(1) lookup, insert and erase. Collisions share a chain.
- Use a plain array when keys are small integers (0..10^6); it beats any map.
- Count-pairs pattern: rewrite the condition as key(i) == key(j), scan left to right, add map[key], then insert.
- Query before insert so an element never pairs with itself.
- Two Sum: store value -> index, look up target - a[i] first.
- `unordered_map` can be hacked with colliding keys; use a splitmix64 hash with a clock seed, or `map`.
- `map`/`TreeMap` are ordered and O(log n); they give sorted iteration and nearest-key queries.
- C++ `m[x]` inserts a missing key. Use `count` or `find` to test.
- Pairs are not hashable by default in C++; pack into `long long` or use an ordered map.
:::
