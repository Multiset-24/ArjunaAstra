---
title: Constructive Algorithms
summary: Build an object that meets given conditions by solving small cases, spotting the pattern, and using parity and invariants to know when it is impossible.
minutes: 40
difficulty: intermediate
rating: [800, 1400]
tags: [constructive, patterns, parity, invariants]
prereqs: [math-basics, implementation]
problems:
  - cf: 1325A
    name: EhAb AnD gCd
    rating: 800
  - cf: 1343B
    name: Balanced Array
    rating: 800
    core: true
    note: the worked example in this lesson
  - cf: 1783A
    name: Make it Beautiful
    rating: 800
  - cses: 1070
    name: Permutations
  - cf: 1474B
    name: Different Divisors
    rating: 1000
  - cf: 1352B
    name: Same Parity Summands
    rating: 1200
    core: true
    note: fix k - 1 parts, let the last one absorb the rest
  - cf: 1537C
    name: Challenging Cliffs
    rating: 1200
    core: true
    note: sort, then place the closest pair at the two ends
  - cf: 1196B
    name: Odd Sum Segments
    rating: 1200
  - cf: 909B
    name: Segments
    rating: 1300
  - cf: 1348B
    name: Phoenix and Beauty
    rating: 1400
---

## The problem

In a constructive problem you do not compute a number. You output an object: an array, a permutation, a string, a grid. Any object that satisfies the conditions is accepted, and a special program called a checker verifies it. If no such object exists, you print `NO` or `-1`.

Two skills are needed: finding a construction, and proving that none exists.

## Brute force first

Write a slow program that tries every candidate for tiny $n$ (say $n \le 8$) and prints the valid ones. You are not submitting it. You are using it as a microscope. Staring at ten valid outputs usually shows the pattern faster than thinking about the statement.

## The idea: small cases, pattern, check

1. **Solve $n = 1, 2, 3, 4$ by hand** or with the brute force. Write the answers down.
2. **Look for structure.** Which elements stay the same as $n$ grows? Is there a repeating block? Is the last element special?
3. **Guess a general rule.** Express it as a loop.
4. **Test it** on small $n$ against the brute force. If it fails, go back to step 2.
5. **If no answer exists**, find what blocks it. Parity (odd or even) and sums are the usual suspects.

## Worked example: balanced array

Given an even $n$, build an array of $n$ distinct positive integers where the first $n/2$ elements are even, the other $n/2$ are odd, and the two halves have equal sums. If impossible, print `NO`.

Try the smallest elements first. Even half: $2, 4, \dots, n$. Odd half: $1, 3, \dots, n - 1$.

| n | even half sum | odd half sum | gap | can we fix it? |
|---|---|---|---|---|
| 2 | 2 | 1 | 1 | `NO` |
| 4 | 6 | 4 | 2 | add 2 to the last odd: 3 becomes 5, still odd |
| 6 | 12 | 9 | 3 | adding 3 to 5 gives 8, which is even, so `NO` |
| 8 | 20 | 16 | 4 | add 4 to the last odd: 7 becomes 11 |

The gap is always $n/2$. We close it by adding $n/2$ to the last odd number. That number stays odd only if $n/2$ is even.

```steps
title: Balanced array for n = 8
view: array
frames:
  - arr: [2, 4, 6, 8, 1, 3, 5, 7]
    note: Smallest evens, then smallest odds. Evens sum to 20, odds sum to 16.
  - arr: [2, 4, 6, 8, 1, 3, 5, 7]
    highlight: {0: done, 1: done, 2: done, 3: done, 4: compare, 5: compare, 6: compare, 7: compare}
    vars: {evens: 20, odds: 16, gap: 4}
    note: "The gap is n/2 = 4. Add it to the last odd number."
  - arr: [2, 4, 6, 8, 1, 3, 5, 11]
    highlight: {7: active}
    vars: {evens: 20, odds: 20}
    note: 7 + 4 = 11 is odd, so the halves are equal and the conditions hold.
```

Why `NO` when $n/2$ is odd? This is a parity argument. The even half always sums to an even number. The odd half has $n/2$ odd numbers, so its sum has the parity of $n/2$. The sums can only be equal if $n/2$ is even. Any array fails when $n/2$ is odd, not only our attempt.

:::key
A parity or sum argument can turn "I could not find one" into "none exists". Whenever your pattern fails at some $n$, ask whether it fails for every attempt.
:::

```quiz
q: A move adds 2 to any single element of an array. The array sum is currently 7. Can any sequence of moves make the sum 10?
options:
  - Yes, add 2 enough times
  - No, the parity of the sum never changes and 7 is odd while 10 is even
  - Only if the array has at least 3 elements
answer: 1
why: Each move changes the sum by 2, so the sum stays odd. A quantity that never changes under the allowed moves is called an invariant. It proves impossibility without trying anything.
```

## Template

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        if ((n / 2) % 2 == 1) { cout << "NO\n"; continue; }
        vector<int> a;
        for (int i = 1; i <= n / 2; i++) a.push_back(2 * i);         // evens
        for (int i = 1; i <= n / 2; i++) a.push_back(2 * i - 1);     // odds
        a.back() += n / 2;                                           // close the gap
        cout << "YES\n";
        for (int i = 0; i < n; i++) cout << a[i] << " \n"[i == n - 1];
    }
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int t = Integer.parseInt(br.readLine().trim());
        StringBuilder sb = new StringBuilder();
        while (t-- > 0) {
            int n = Integer.parseInt(br.readLine().trim());
            if ((n / 2) % 2 == 1) { sb.append("NO\n"); continue; }
            int[] a = new int[n];
            for (int i = 1; i <= n / 2; i++) a[i - 1] = 2 * i;               // evens
            for (int i = 1; i <= n / 2; i++) a[n / 2 + i - 1] = 2 * i - 1;   // odds
            a[n - 1] += n / 2;                                               // close the gap
            sb.append("YES\n");
            for (int i = 0; i < n; i++) sb.append(a[i]).append(i == n - 1 ? '\n' : ' ');
        }
        System.out.print(sb);
    }
}
```
```input
3
2
4
8
```
```output
NO
YES
2 4 1 5
YES
2 4 6 8 1 3 5 11
```

```predict
lang: cpp
code: |
  int n = 4;
  vector<int> a;
  for (int i = 1; i <= n / 2; i++) a.push_back(2 * i);
  for (int i = 1; i <= n / 2; i++) a.push_back(2 * i - 1);
  a.back() += n / 2;
  for (int x : a) cout << x << " ";
output: "2 4 1 5"
why: The evens are 2 4, the odds are 1 3, and the last odd grows by n/2 = 2, so 3 becomes 5. Sums are 6 and 6.
```

## Another pattern: fix all but one

Split $n$ into $k$ positive parts that all have the same parity (all odd or all even). Try the two simplest shapes:

- $k - 1$ ones and one big part $n - (k - 1)$. It works if that part is positive and odd.
- $k - 1$ twos and one big part $n - 2(k - 1)$. It works if that part is positive and even.

If neither works, there is no answer.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int t;
    cin >> t;
    while (t--) {
        long long n, k;
        cin >> n >> k;
        long long big1 = n - (k - 1), big2 = n - 2 * (k - 1);
        if (big1 > 0 && big1 % 2 == 1) {
            cout << "YES\n";
            for (int i = 0; i < k - 1; i++) cout << "1 ";
            cout << big1 << "\n";
        } else if (big2 > 0 && big2 % 2 == 0) {
            cout << "YES\n";
            for (int i = 0; i < k - 1; i++) cout << "2 ";
            cout << big2 << "\n";
        } else {
            cout << "NO\n";
        }
    }
}
```
```java
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int t = Integer.parseInt(br.readLine().trim());
        StringBuilder sb = new StringBuilder();
        while (t-- > 0) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            long n = Long.parseLong(st.nextToken());
            long k = Long.parseLong(st.nextToken());
            long big1 = n - (k - 1), big2 = n - 2 * (k - 1);
            if (big1 > 0 && big1 % 2 == 1) {
                sb.append("YES\n");
                for (int i = 0; i < k - 1; i++) sb.append("1 ");
                sb.append(big1).append('\n');
            } else if (big2 > 0 && big2 % 2 == 0) {
                sb.append("YES\n");
                for (int i = 0; i < k - 1; i++) sb.append("2 ");
                sb.append(big2).append('\n');
            } else {
                sb.append("NO\n");
            }
        }
        System.out.print(sb);
    }
}
```
```input
5
10 3
100 4
8 7
97 2
8 8
```
```output
YES
2 2 6
YES
1 1 1 97
NO
NO
YES
1 1 1 1 1 1 1 1
```

Since many answers are valid (for `10 3`, also `4 4 2`), the judge uses a checker. Your output need not match the sample exactly.

```blanks
prompt: Complete the odd case of the same-parity construction.
lang: cpp
code: |
  long long big1 = n - ([[k - 1|k-1]]);
  if (big1 > 0 && big1 % 2 == [[1]]) {
      // k-1 ones, then big1
  }
why: After k - 1 ones are used, n - (k - 1) remains for the last part. It must be positive and odd to match the parity of the ones.
```

## Typical constructions

| Situation | Try |
|---|---|
| Permutation with a condition on neighbours | alternate small and large, or split into two blocks (evens, odds) |
| Sum, product or gcd constraint | make all but one element simple (1s, 2s) and let one absorb the rest |
| Distinct values wanted | use $1, 2, 3, \dots$ or powers of 2, then adjust the last |
| "Minimise the largest gap" | sort, then place values so the closest ones are neighbours |
| Binary string with a count condition | fill the bulk with one repeating block, then fix the ends |
| Grid | fill a pattern (stripes, chessboard) and handle the boundary separately |

## Complexity

The constructions here are $O(n)$: one pass to fill the array, plus printing. The brute force used to discover the pattern can be exponential, because it only runs on tiny $n$.

## Pitfalls

- Trusting a pattern after checking only $n = 2$ and $n = 3$. Test at least up to $n = 8$.
- Missing the impossible cases, such as $k > n$ or the wrong parity.
- Printing a valid answer in the wrong format: `YES` first, then the array, on separate lines.
- Overflow when values like $n - 2(k - 1)$ are computed with `int` and $n, k$ near $10^9$.
- Not reading the constraints. They often say "elements must be distinct", "at most $10^9$", or "$1 \le a_i \le n$".

:::truth
Constructive problems are the least learnable by reading. No template covers them. What helps is a habit: brute-force small cases, print them, stare, and then guess. Expect to be stuck on many of them and to learn the trick from the editorial. After reading an editorial, solve the problem again alone the next day.
:::

```cards
- q: What is the first step when you meet a constructive problem?
  a: Solve very small cases by hand or with a brute force, write the answers down, and look for a pattern.
- q: What is an invariant?
  a: A quantity that never changes under the allowed moves, for example the parity of a sum when each move adds 2. It proves some targets are unreachable.
- q: In the balanced array problem, why is the answer NO when n/2 is odd?
  a: The even half sums to an even number, while the odd half has n/2 odd numbers and so has the parity of n/2. The sums cannot be equal.
- q: What does "fix all but one" mean?
  a: Choose simple values for k - 1 elements (like 1s or 2s) and let the last element absorb the remainder, then check its validity.
- q: Why does a constructive problem need a checker?
  a: Many different outputs are valid, so the judge verifies the conditions instead of comparing with one expected answer.
```

## Notes

:::notes
- Constructive problem: output an object (array, permutation, string, grid) that meets the conditions, or say it does not exist.
- Method: solve n = 1..4, spot the pattern, write the loop, test against a brute force on tiny inputs.
- Parity and sum arguments prove impossibility. An invariant is something the moves never change.
- Balanced array: evens 2..n then odds 1..n-1, add n/2 to the last odd. NO if n/2 is odd.
- Same parity summands: k-1 ones plus the rest, or k-1 twos plus the rest.
- "Fix all but one" is a common trick: simple values everywhere except one element that absorbs the difference.
- Answers are usually not unique. A checker validates yours.
- Read the constraints: distinctness, value ranges and overflow decide the construction.
:::
