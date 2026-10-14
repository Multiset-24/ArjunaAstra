---
title: Greedy Algorithms
summary: Make the locally best choice at every step, and learn how to check that this really gives the best overall answer.
minutes: 40
difficulty: intermediate
rating: [1000, 1500]
tags: [greedy, sorting, proofs]
prereqs: [sorting-and-searching]
problems:
  - cf: 160A
    name: Twins
    rating: 900
  - cf: 230A
    name: Dragons
    rating: 1000
    core: true
    note: sort by the key that makes the first step safe
  - lc: assign-cookies
    name: Assign Cookies
    difficulty: Easy
  - cses: 1629
    name: Movie Festival
    core: true
    note: the activity selection problem from this lesson
  - cses: 1630
    name: Tasks and Deadlines
  - lc: non-overlapping-intervals
    name: Non-overlapping Intervals
    difficulty: Medium
  - cf: 1201C
    name: Maximum Median
    rating: 1400
  - cf: 976C
    name: Nested Segments
    rating: 1500
  - cf: 276C
    name: Little Girl and Maximum Sum
    rating: 1500
    core: true
    note: biggest numbers go to the most-covered positions
---

## The problem

A greedy algorithm builds an answer one step at a time. At each step it takes the choice that looks best right now and never changes its mind later.

A classic example, called activity selection:

- You have one meeting room and $n$ meeting requests, each with a start time and an end time.
- Two meetings cannot overlap. A meeting that ends at time 5 and one that starts at time 5 are fine together.
- Choose as many meetings as possible.

## Brute force first

Try every subset of the $n$ meetings, check that no two overlap, keep the largest valid one. That is $2^n$ subsets, each checked in about $O(n)$. For $n = 40$ it is already hopeless.

We need a rule that tells us which meeting to take first, so we can throw away all the other branches.

## Which rule works?

Three natural rules for "the best meeting to take next":

| Rule | Counterexample |
|---|---|
| Earliest start | One meeting 0 to 100 starts first and blocks ten short ones. |
| Shortest duration | A short meeting in the middle can overlap two long ones that are otherwise compatible. |
| Earliest end | None. This is the correct rule. |

```quiz
q: Meetings are (1,10), (2,3), (4,5), (6,7). Which rule picks the maximum number of meetings (3)?
options:
  - Earliest start first
  - Earliest end first
  - Longest duration first
answer: 1
why: "Earliest end takes (2,3), (4,5), (6,7). Earliest start takes (1,10) first and blocks everything else, giving 1."
```

## The idea: exchange argument

Why is earliest end safe? Take any best answer. Look at its first meeting $X$. Let $E$ be the meeting with the earliest end overall.

- $E$ ends no later than $X$ ends.
- Replace $X$ by $E$. Nothing after $X$ can now overlap, because $E$ ends even sooner.
- The answer is still valid and has the same size.

So some best answer starts with $E$. Take $E$, discard everything that overlaps it, and repeat on what is left. This "swap their choice for ours without making it worse" proof is called an exchange argument. It is the standard way to justify a greedy.

:::details[The same proof in one line per step]
- Let $G$ be our greedy answer and $O$ any optimal one, both sorted by end time.
- Compare them from the left. At the first position where they differ, $G$ has a meeting that ends no later than the one in $O$ (greedy picks the earliest end that fits).
- Swap it into $O$. $O$ stays valid and the same size, and now agrees with $G$ one position longer.
- Repeat. $O$ becomes $G$, so $G$ is optimal.
:::

## Template

The usual shape of a greedy solution: sort by a key, then scan once.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> v(n);          // (end, start)
    for (auto &p : v) cin >> p.second >> p.first;
    sort(v.begin(), v.end());             // by end time
    int last = INT_MIN, cnt = 0;
    for (auto &[e, s] : v) {
        if (s >= last) {                  // fits after the previous pick
            cnt++;
            last = e;
        }
    }
    cout << cnt << "\n";
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        int[][] v = new int[n][2];            // {start, end}
        for (int i = 0; i < n; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            v[i][0] = Integer.parseInt(st.nextToken());
            v[i][1] = Integer.parseInt(st.nextToken());
        }
        Arrays.sort(v, (x, y) -> Integer.compare(x[1], y[1]));   // by end time
        int last = Integer.MIN_VALUE, cnt = 0;
        for (int[] p : v) {
            if (p[0] >= last) {               // fits after the previous pick
                cnt++;
                last = p[1];
            }
        }
        System.out.println(cnt);
    }
}
```
```input
11
1 4
3 5
0 6
5 7
3 9
5 9
6 10
8 11
8 12
2 14
12 16
```
```output
4
```

```order
prompt: Arrange the scan. `v` is already sorted by end time and holds (end, start).
lang: cpp
code: |
  int last = INT_MIN, cnt = 0;
  for (auto &[e, s] : v) {
      if (s >= last) {
          cnt++;
          last = e;
      }
  }
distractors:
  - "        last = s;"
why: After taking a meeting, the next one must start at or after its end, so `last` stores the end.
```

## Walkthrough

The sample sorted by end time. The array below shows only the end times: 4, 5, 6, 7, 9, 9, 10, 11, 12, 14, 16. Step through the decisions.

```steps
title: Activity selection on the 11-meeting sample (ends shown)
view: array
frames:
  - arr: [4, 5, 6, 7, 9, 9, 10, 11, 12, 14, 16]
    note: Meetings sorted by end time. last = -infinity, picked = 0.
  - arr: [4, 5, 6, 7, 9, 9, 10, 11, 12, 14, 16]
    pointers: {i: 0}
    highlight: {0: match}
    vars: {last: 4, picked: 1}
    note: "Meeting (1,4) starts at 1 >= -infinity. Take it."
  - arr: [4, 5, 6, 7, 9, 9, 10, 11, 12, 14, 16]
    pointers: {i: 2}
    highlight: {0: match, 1: muted, 2: muted}
    vars: {last: 4, picked: 1}
    note: "(3,5) and (0,6) start before 4. Skip both."
  - arr: [4, 5, 6, 7, 9, 9, 10, 11, 12, 14, 16]
    pointers: {i: 3}
    highlight: {0: match, 1: muted, 2: muted, 3: match}
    vars: {last: 7, picked: 2}
    note: "(5,7) starts at 5 >= 4. Take it."
  - arr: [4, 5, 6, 7, 9, 9, 10, 11, 12, 14, 16]
    pointers: {i: 7}
    highlight: {0: match, 1: muted, 2: muted, 3: match, 4: muted, 5: muted, 6: muted, 7: match}
    vars: {last: 11, picked: 3}
    note: "(3,9), (5,9), (6,10) start before 7. Skip. (8,11) starts at 8 >= 7. Take it."
  - arr: [4, 5, 6, 7, 9, 9, 10, 11, 12, 14, 16]
    pointers: {i: 10}
    highlight: {0: match, 1: muted, 2: muted, 3: match, 4: muted, 5: muted, 6: muted, 7: match, 8: muted, 9: muted, 10: match}
    vars: {last: 16, picked: 4}
    note: "(8,12) and (2,14) are skipped. (12,16) starts at 12 >= 11. Take it. Answer: 4."
```

## Sort by key: the family

Most greedy problems at this level are the same move with a different key.

| Problem | Sort by | Why it is safe |
|---|---|---|
| Activity selection | end time | the earliest end leaves the most room |
| Serve customers, minimise total waiting | duration, shortest first | a long job placed early delays everyone behind it |
| Tasks and Deadlines (reward = deadline minus finish time) | duration, shortest first | the deadline part is a constant, only finish times matter |
| Dragons (CF 230A) | dragon strength, weakest first | beating the weakest gives bonus strength soonest |
| Assign Cookies | both lists, smallest first | the smallest cookie that satisfies the least greedy child wastes nothing |

When you suspect a greedy, ask two questions: what should I sort by, and what is the first item I can safely commit to?

## When greedy fails

Greedy is not always right. Coin change with coins 1, 3, 4: to pay 6, taking the largest coin first gives 4 + 1 + 1, which is 3 coins. The best is 3 + 3, which is 2 coins.

```predict
lang: cpp
code: |
  int coins[] = {4, 3, 1};
  int left = 6, used = 0;
  for (int c : coins) {
      used += left / c;
      left %= c;
  }
  cout << used;
output: "3"
why: It takes one 4, then no 3 fits into 2, then two 1s. Three coins, while 3 + 3 needs only two.
```

For coin systems like 1, 5, 10, 25 the greedy happens to work, but that is a property of those specific values, not of the method. When a greedy fails like this, the problem usually needs dynamic programming (DP, solving small cases and reusing their answers), which comes in a later stage.

:::truth
Proving a greedy is the hard part, and in contests many people do not prove it. A practical routine: write the greedy, write a slow brute force for tiny inputs, and compare them on random tests. One failing case tells you the idea is wrong in seconds. Passing tests is not a proof, but it is a good filter.
:::

## Complexity

- Sorting costs $O(n \log n)$.
- The scan is $O(n)$.
- Total: $O(n \log n)$, memory $O(n)$.

## Pitfalls

- `>=` versus `>` in the fit test decides whether touching meetings are allowed. Read the statement.
- In Java, never compare with `x[1] - y[1]`. It can overflow. Use `Integer.compare`.
- Ties in the sort key can matter. If two items have equal keys, think about whether the order changes the answer.
- A greedy that "feels" right is often wrong. Look for a counterexample before you commit.

```quiz
q: Which statement about a greedy algorithm is correct?
options:
  - If it passes the sample tests, it is correct
  - Its choice must be justified, for example by an exchange argument, or tested against brute force
  - It is always faster than dynamic programming and always gives the best answer
answer: 1
why: Samples are tiny and chosen to be friendly. Greedy is only correct when the local choice provably never hurts, and that has to be argued or stress-tested.
```

```cards
- q: What is a greedy algorithm?
  a: It builds the answer step by step, taking the locally best choice each time and never undoing it.
- q: Which key solves activity selection (maximum non-overlapping meetings)?
  a: Sort by end time, take a meeting whenever it starts at or after the last chosen end.
- q: What is an exchange argument?
  a: Take any optimal answer and swap in the greedy choice. If it stays valid and no worse, the greedy choice is safe.
- q: Why does greedy fail for coin change with coins 1, 3, 4 and amount 6?
  a: It picks 4 + 1 + 1 (3 coins) but 3 + 3 needs only 2. The local best choice does not lead to the global best.
- q: How do you test a greedy idea quickly?
  a: Write a brute force for tiny inputs and compare on random tests.
```

## Notes

:::notes
- Greedy: commit to the locally best choice, never revisit it.
- Needs a proof or a stress test. Exchange argument: swap an optimal answer's choice for the greedy one without making it worse.
- Activity selection: sort by end time, take if start >= last end. $O(n \log n)$.
- Most easy greedy problems are "sort by the right key, then scan once".
- Wrong keys to try first and discard: earliest start, shortest duration.
- Coin change with arbitrary coins is not greedy (1, 3, 4 and 6 is the counterexample).
- Java comparators: use `Integer.compare`, not subtraction.
- Stress test: brute force plus random tiny inputs finds wrong greedies fast.
:::
