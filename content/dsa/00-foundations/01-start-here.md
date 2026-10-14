---
title: Start Here
summary: How this track is organised, how Codeforces works, and the practice loop that actually raises your rating.
minutes: 15
difficulty: beginner
rating: [800, 1000]
tags: [roadmap, codeforces, practice]
prereqs: []
problems:
  - cf: 4A
    name: Watermelon
    rating: 800
    core: true
    note: your first submission
  - cf: 71A
    name: Way Too Long Words
    rating: 800
    core: true
  - cf: 231A
    name: Team
    rating: 800
  - cf: 282A
    name: Bit++
    rating: 800
  - cf: 1A
    name: Theatre Square
    rating: 1000
    note: needs a 64-bit integer
  - cses: 1068
    name: Weird Algorithm
exercises:
  - Create a Codeforces account, open the Problemset, and filter by rating 800. Solve the three easiest problems you can read in one go.
  - "Write your own one-page rule for being stuck: how many minutes, then which hint, then what you write down."
resources:
  - title: Codeforces
    url: https://codeforces.com
  - title: CSES Problem Set
    url: https://cses.fi/problemset/
---

## What this track is

This track teaches **competitive programming** (solving short, precisely specified problems against a time limit) and the data structures and algorithms (DSA) behind it. It has five stages. Each stage ends with a milestone you can check against a real rating.

| Stage | What you learn | Milestone |
|---|---|---|
| Foundations | Reading problems, I/O, complexity, math, sorting, STL | Solve most 800-1000 rated problems |
| Core techniques | Prefix sums, two pointers, binary search, hashing, stacks, bits | Pupil (1200) |
| Greedy, math and graphs | Greedy proofs, number theory, trees, shortest paths | Specialist (1400-1600) |
| Dynamic programming | States, transitions, the standard families | Expert (1600+) |
| Advanced | Range queries, strings, trees, game theory | Candidate Master (1900+) |

:::truth
Reading lessons will not raise your rating. Solving problems will. The lessons only make that practice faster and less frustrating.
:::

## Codeforces in five minutes

**Codeforces** is a website that hosts timed online contests and a large archive of past problems. You will use it daily.

- **Contest**: about two hours, 5-8 problems labelled A, B, C and so on, roughly easiest first.
- **Division**: Codeforces groups contests by skill. Div. 4 and Div. 3 are friendliest, Div. 2 is the standard, Div. 1 is for strong participants. Rating limits for each division are shown on the contest page and do change.
- **Rating**: a number that moves up or down after each rated contest. Your **title** comes from it.
- **Verdict**: the judge's answer to a submission. AC (accepted), WA (wrong answer), TLE (time limit exceeded), RE (runtime error), MLE (memory limit exceeded).

| Title | Rating |
|---|---|
| Newbie | below 1200 |
| Pupil | 1200 |
| Specialist | 1400 |
| Expert | 1600 |
| Candidate Master | 1900 |

Each problem also has a **difficulty rating** (800, 900, ... 3500) estimated from how many strong participants solved it. An 800 problem is roughly what a newcomer can solve; a 1900 problem is what a Candidate Master solves reliably.

```quiz
q: A contest ends and your rating is 1450. What is your title?
options:
  - Pupil
  - Specialist
  - Expert
answer: 1
why: Pupil starts at 1200, Specialist at 1400, Expert at 1600. 1450 is in the Specialist range.
```

## Where to practise

- **Codeforces problemset**: the main source. Filter by rating and tags, and sort by number of solves to find classics.
- **CSES Problem Set**: about 300 well-ordered problems with no contest pressure. Good for building a base.
- **LeetCode**: shorter, function-style problems. Useful for interviews, but its style differs from contests.

Pick one main source and stay with it for a few months. Hopping between sites feels productive but spreads practice thin.

## Your first submission

Problem 4A (Watermelon): split a watermelon of weight `w` into two parts, each of even positive weight. The answer is YES when `w` is even and `w > 2`. Every judge reads from **standard input** (what the keyboard would type) and writes to **standard output** (the screen).

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int w;
    cin >> w;
    cout << (w % 2 == 0 && w > 2 ? "YES" : "NO") << "\n";
    return 0;
}
```
```java
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int w = Integer.parseInt(br.readLine().trim());
        System.out.println(w % 2 == 0 && w > 2 ? "YES" : "NO");
    }
}
```
```input
8
```
```output
YES
```

:::note
`w > 2` matters: 2 cannot be split into two positive even parts. Boundary values like this fail more submissions than any hard idea does.
:::

## The practice loop

Most of your growth comes from problems slightly above your level, handled with a fixed routine.

```order
prompt: Put the practice loop in order.
lang: text
code: |
  Attempt the problem alone for 30-45 minutes
  If stuck, read one hint, not the whole solution
  If still stuck, read the editorial (the official write-up)
  Close the editorial and re-implement from memory
  Write the idea and your mistake in your notes
  Upsolve: solve the contest problems you missed, later
why: Struggling first makes the idea stick. Re-implementing proves you understood it. Upsolving turns a failed contest into learning.
```

- **Stuck** means no new idea for 30-45 minutes, not "it feels hard".
- **Hint first**: one nudge keeps most of the learning.
- **Notes**: one line for the idea, one line for the bug. You will reread these.
- **Pick the level**: aim for problems about 100-300 rating above your current rating.

```quiz
q: Your solution passes the samples but gets Wrong answer on test 7. What is the best next step?
options:
  - Submit it again, the judge may be flaky
  - Look for edge cases (smallest and largest input, equal values) or compare against a brute force on small random inputs
  - Rewrite everything in another language
answer: 1
why: The judge is deterministic. A failing hidden test means a case you did not consider. Lesson 2 covers brute-force comparison.
```

## An honest timeline

```estimate
q: You want about 300 solved problems and manage 5 per week. How many weeks is that?
answer: 60
unit: weeks
tolerance: 0.15
solution: 300 / 5 = 60 weeks, a bit over a year. Candidate Master usually needs several hundred to over a thousand problems.
```

:::truth
Candidate Master typically takes one to three years of steady practice. Plateaus of weeks or months are normal. Rating changes only in contests, so enter them regularly even when you feel unready.
:::

## Cards

```cards
- q: What is a Codeforces verdict?
  a: The judge's result for a submission, such as AC (accepted), WA (wrong answer), TLE (time limit exceeded) or RE (runtime error).
- q: What rating starts the title Pupil, Specialist, Expert, Candidate Master?
  a: 1200, 1400, 1600 and 1900. Below 1200 is Newbie.
- q: When are you "stuck" and what do you do?
  a: No new idea for 30-45 minutes. Read one hint, then the editorial if needed, then re-implement from memory.
- q: What is upsolving?
  a: Solving contest problems you could not finish during the contest, after it ends.
```

## Notes

:::notes
- Lessons do not raise your rating; solving problems slightly above your level does.
- Stages: Foundations (800-1000), Core (Pupil 1200), Intermediate (Specialist), DP (Expert), Advanced (Candidate Master 1900).
- Titles: Newbie below 1200, Pupil 1200, Specialist 1400, Expert 1600, Candidate Master 1900.
- Verdicts: AC accepted, WA wrong answer, TLE too slow, RE crash, MLE too much memory.
- Practice loop: attempt 30-45 min, one hint, editorial, re-implement from memory, note the idea and the bug, upsolve.
- Always test boundaries: smallest input, largest input, equal values.
- Expect one to three years to Candidate Master; plateaus are normal.
:::
