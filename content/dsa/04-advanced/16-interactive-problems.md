---
title: Interactive Problems
summary: Talk to a judge program through standard input and output, flush after every query, stay under the query limit, and find hidden values with binary search.
minutes: 35
difficulty: advanced
rating: [1400, 1900]
tags: [interactive, binary-search, io]
prereqs: [binary-search, language-setup, bit-manipulation]
problems:
  - lc: guess-number-higher-or-lower
    name: Guess Number Higher or Lower
    difficulty: Easy
    note: the same idea behind an API call
  - cf: 1167B
    name: Lost Numbers
    rating: 1400
    note: four queries, then brute force the order
  - cf: 679A
    name: Bear and Prime 100
    rating: 1400
  - cf: 1999G1
    name: Ruler (easy version)
    rating: 1500
    note: binary search on a monotone reply
  - cf: 1520F1
    name: Guess the K-th Zero (Easy version)
    rating: 1600
    core: true
    note: the same idea as the example below
  - cf: 1486C1
    name: Guessing the Greatest (easy version)
    rating: 1600
    core: true
    note: find the second maximum with a range query
  - cf: 1407C
    name: Chocolate Bunny
    rating: 1600
  - cf: 1698D
    name: Fixed Point Guessing
    rating: 1600
  - cf: 1479A
    name: Searching Local Minimum
    rating: 1700
    core: true
    note: binary search where the "direction" is a comparison of neighbours
  - cf: 1999G2
    name: Ruler (hard version)
    rating: 1700
  - cf: 1486C2
    name: Guessing the Greatest (hard version)
    rating: 1900
---

## The problem

In a normal problem you read the whole input, compute, and print the answer. In an **interactive** problem a second program, the **judge** (also called the interactor), holds a hidden secret. You learn about it only by asking **queries**, and each answer arrives after you ask.

- Your output is the judge's input, and the judge's output is your input.
- There is a **query limit** (for example 30 queries), and exceeding it gives Wrong Answer.
- At the end you print the final answer in the format the statement asks for.

## Brute force first

- Query every position or every candidate. For a secret in $[1, 10^9]$ that is up to $10^9$ queries, and the limit is about 30.
- The limit is not an accident. It hints at the method: $2^{30} \approx 10^9$, so each query must **halve** the set of remaining candidates. That is binary search where the question is a query to the judge.

## The protocol

Four rules cover almost every mistake.

| Rule | What goes wrong if you break it |
|---|---|
| **Flush** after every line you print | Your line stays in a buffer, the judge waits, you wait: Idleness Limit Exceeded |
| Read the reply before the next query | You answer a question the judge has not answered yet |
| If the reply is `-1`, exit at once | The judge already ended; reading on gives Runtime Error or a hang |
| Respect the exact format (`? 5`, `! 7`) | Wrong Answer on the first query |

**Flush** means forcing buffered output to be sent now instead of when the buffer fills.

| Language | Print and flush |
|---|---|
| C++ `cout` | `cout << x << endl;` (`endl` flushes) or `cout << flush;` |
| C++ `printf` | `printf("..."); fflush(stdout);` |
| Java | `System.out.println(x); System.out.flush();` |

```quiz
q: Your solution prints "? 5" with "\n" and no flush, then waits for the reply. What verdict do you get?
options:
  - Wrong Answer
  - Idleness Limit Exceeded
  - Time Limit Exceeded in the usual sense, because of a slow loop
  - Compilation Error
answer: 1
why: The query sits in your output buffer, so the judge never sees it and stays silent while you wait. Neither side makes progress and the system reports Idleness Limit Exceeded.
```

## The idea: binary search with queries

Take a made-up problem in the style of "Guess the K-th Zero".

- A hidden array $a$ of length $n$ holds only 0s and 1s. You are given $n$ and $k$.
- Query `? r` returns $a_1 + \dots + a_r$ (the sum of the first $r$ cells).
- Find the position of the $k$-th zero in at most 20 queries. Print `! x`.

Reasoning:

- Among the first $r$ cells there are $r - \text{sum}$ zeros.
- That number only grows as $r$ grows, so "are there at least $k$ zeros in the first $r$ cells" is false for small $r$ and true for large $r$.
- The answer is the **smallest** $r$ where it is true. This is binary search on $r$, one query per step.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;                          // array length, and which zero to find
    int lo = 1, hi = n;                     // the answer position is always in [lo, hi]
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        cout << "? " << mid << endl;        // endl flushes the output
        int s;
        cin >> s;                           // sum of a[1..mid]
        if (s == -1) return 0;              // judge says the query was invalid: stop now
        int zeros = mid - s;                // zeros among the first mid cells
        if (zeros >= k) hi = mid;           // the k-th zero is at or before mid
        else lo = mid + 1;
    }
    cout << "! " << lo << endl;
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
        int lo = 1, hi = n;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            System.out.println("? " + mid);
            System.out.flush();                          // never forget this line
            int s = Integer.parseInt(br.readLine().trim());
            if (s == -1) return;                         // invalid query: stop now
            int zeros = mid - s;
            if (zeros >= k) hi = mid;
            else lo = mid + 1;
        }
        System.out.println("! " + lo);
        System.out.flush();
    }
}
```

There is no input sample here because the replies depend on the judge. Follow the input format of the statement exactly.

How many queries? Each query halves $[lo, hi]$, so about $\lceil \log_2 n \rceil$ of them.

```estimate
q: The secret is a number in [1, 1,000,000,000] and each query tells you whether the secret is at most the number you ask about. How many queries does binary search need in the worst case?
answer: 30
unit: queries
tolerance: 0.1
hint: Each query halves the candidates. Find the smallest k with 2^k at least 10^9.
solution: "2^30 = 1,073,741,824, which is at least 10^9, and 2^29 is only about 5.4 * 10^8. So 30 queries are enough in the worst case, and fewer cannot be."
```

```predict
lang: cpp
code: |
  int lo = 1, hi = 100, q = 0;
  while (lo < hi) {
      int mid = (lo + hi) / 2;
      q++;
      if (mid >= 37) hi = mid;      // pretend the secret is 37
      else lo = mid + 1;
  }
  cout << lo << " " << q;
output: 37 7
why: The range shrinks 1..100, 1..50, 26..50, 26..38, 33..38, 36..38, 36..37 and finally 37..37. That took 7 queries, which is within ceil(log2 100) = 7.
```

## Checking your solution locally

You cannot paste a sample, so test against your own small judge.

- Write a tiny interactor in any language. It picks a secret, answers queries, counts them, and prints a verdict.
- Connect the two programs with pipes. On Linux:

```bash
mkfifo to_judge from_judge
./interactor < to_judge > from_judge &
./solution < from_judge > to_judge
```

- Run many random secrets and small edge cases ($n = 1$, $n = 2$, secret at the first and last position).
- Check the worst-case query count, not only correctness.

:::tip
Make your solution print its queries to standard error as well (`cerr` in C++, `System.err` in Java). The judge ignores standard error, and you can read the whole conversation when debugging.
:::

## Other shapes you will meet

- **Direction from a comparison.** Searching Local Minimum asks for a position that is smaller than its neighbours. Query the values at $mid$ and $mid+1$: whichever way the values go down, a local minimum exists on that side. The comparison replaces "is it at most".
- **A range query.** Guessing the Greatest: the judge returns the *position of the second maximum* in a range. Compare it with the position you guessed to decide which half contains the maximum.
- **Fixed number of queries for a fixed structure.** Lost Numbers: six numbers are permuted, and four product queries are enough to identify each. No loop, just clever fixed queries.
- **Adaptive judges.** The judge may change its secret as long as every answer stays consistent with its earlier replies. Your algorithm must work for the worst case, which binary search does.

```blanks
prompt: Complete the query helper (Java).
lang: java
code: |
  static int ask(int mid) throws IOException {
      System.out.println("? " + mid);
      System.out.[[flush]]();
      int s = Integer.parseInt(br.readLine().trim());
      if (s == [[-1]]) System.exit(0);
      return s;
  }
why: Without flush the query never reaches the judge. A reply of -1 means the judge has stopped, so the program must exit immediately instead of continuing the search.
```

```order
prompt: Arrange the C++ query helper so it prints, flushes, reads, and exits on -1.
lang: cpp
code: |
  int ask(int mid) {
      cout << "? " << mid << endl;
      int s;
      cin >> s;
      if (s == -1) exit(0);
      return s;
  }
distractors:
  - "      cout << \"? \" << mid << \"\\n\";"
why: endl prints the newline and flushes, so the judge sees the query. A plain newline stays in the buffer and the judge never replies.
```

## Complexity and limits

| Item | Typical value |
|---|---|
| Queries for a range of size $n$ with yes/no answers | $\lceil \log_2 n \rceil$ |
| $n = 10^3$ | 10 |
| $n = 2 \cdot 10^5$ | 18 |
| $n = 10^9$ | 30 |
| $n = 10^{18}$ | 60 |

:::truth
Interactive problems are not harder in algorithm, just easier to get wrong in the mechanics. A large share of failed attempts come from a missing flush, an off-by-one in the search bounds, or a query count one over the limit. Write the helper function once, test it locally, and reuse it.
:::

## Pitfalls

- **Missing flush.** The most common failure by far. Put it inside your `ask` function so you cannot forget it.
- **Mixing input styles.** Using both `scanf` and `cin`, or both `Scanner` and `BufferedReader`, can lose data. Pick one.
- **Not exiting on `-1`.** Keep reading after the judge stops and you get a hang or a Runtime Error that hides the real bug.
- **Off-by-one in bounds.** Decide whether the search interval is `[lo, hi]` or `[lo, hi)` and keep every update consistent. With `lo = mid + 1` and `hi = mid` loop while `lo < hi`.
- **Extra output.** Debug prints to standard output look like queries to the judge. Print debug text to standard error.
- **One query too many.** Count the worst case, for example $n = 2^k$ or $n = 2^k + 1$, because the limit is exact.

## Notes

:::notes
- Interactive: you and a judge exchange lines through stdin and stdout; the judge holds a hidden secret.
- Flush after every printed line (endl, fflush(stdout), System.out.flush()). A missing flush gives Idleness Limit Exceeded.
- Read the reply after each query. If it is -1, exit immediately.
- Query limit about log2 of the candidate count means binary search: 10 for 10^3, 18 for 2*10^5, 30 for 10^9, 60 for 10^18.
- Turn a yes/no property into "smallest r where it holds" and search on r. Example: zeros in the first r cells = r - prefix sum.
- Direction can come from comparing two neighbouring answers (local minimum).
- Wrap query, flush and read in one helper; exit inside it on -1.
- Test with your own local interactor and pipes; log the conversation to stderr.
- Judges can be adaptive: only rely on what is guaranteed by earlier answers.
:::

```cards
- q: What does flushing do, and why is it required in interactive problems?
  a: It sends buffered output immediately. Without it the judge never sees your query and both sides wait, giving Idleness Limit Exceeded.
- q: What should you do when the judge replies -1?
  a: Exit at once without printing anything else. It means your last query was invalid or the limit was exceeded.
- q: How many queries does binary search need for n candidates?
  a: ceil(log2 n) in the worst case, such as 30 for 10^9 and 60 for 10^18.
- q: How do you find the k-th zero using prefix-sum queries?
  a: Binary search the smallest r with r minus prefix_sum(r) at least k. That r is the position of the k-th zero.
- q: Where should debug output go in an interactive problem?
  a: Standard error (cerr or System.err). Anything on standard output is read by the judge as part of the conversation.
- q: What is an adaptive judge?
  a: A judge that may change its hidden data as long as it stays consistent with all its earlier answers, so only worst-case reasoning is safe.
```
