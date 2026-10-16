---
title: Matrix Exponentiation
summary: Turn a linear recurrence or a walk-counting question into one matrix, then raise it to a huge power in O(d^3 log n) with repeated squaring.
minutes: 40
difficulty: advanced
rating: [1500, 2300]
tags: [matrices, math, dp, modular-arithmetic, fibonacci]
prereqs: [modular-arithmetic, dp-introduction, recursion]
problems:
  - lc: fibonacci-number
    name: Fibonacci Number
    difficulty: Easy
  - cf: 450B
    name: Jzzhu and Sequences
    rating: 1300
    note: the recurrence has a short period, but try the matrix as practice
  - cses: 1722
    name: Fibonacci Numbers
  - cf: 166E
    name: Tetrahedron
    rating: 1500
    core: true
    note: count walks of length n on four vertices
  - cses: 1723
    name: Graph Paths I
    core: true
  - cf: 1513C
    name: Add One
    rating: 1600
    note: usually done with DP; matrix power also works
  - lc: knight-dialer
    name: Knight Dialer
    difficulty: Medium
    note: walks on a 10-vertex graph
  - cf: 691E
    name: Xor-sequences
    rating: 1900
    core: true
    note: build the adjacency matrix from a condition on pairs
  - cf: 222E
    name: Decoding Genome
    rating: 1900
  - cf: 621E
    name: Wet Shark and Blocks
    rating: 2000
  - cf: 1117D
    name: Magic Gems
    rating: 2100
    core: true
    note: f(n) = f(n-1) + f(n-m), a state of size m
  - cf: 718C
    name: Sasha and Array
    rating: 2300
    note: matrices stored in a segment tree
---

## The problem

Fibonacci numbers are defined by $F(n) = F(n-1) + F(n-2)$. Print $F(n) \bmod (10^9 + 7)$ for $n$ up to $10^{18}$.

Other questions with the same shape:

- A recurrence like $f(n) = 3f(n-1) + 2f(n-2) + 5$ with a huge $n$.
- A directed graph with 50 vertices: in how many ways can you walk exactly $k = 10^{18}$ edges from vertex 1 to vertex 50?

## Brute force first

- Loop from 2 to $n$ keeping the last two values: $O(n)$. For $n = 10^{18}$ that never finishes.
- Notice the idea we want: to jump far, we need to apply "one step" many times **at once**, the same way $a^{1000}$ is computed by squaring and not by 1000 multiplications.

## The idea: one step as a matrix

Keep the state as a vector $v_k$ (here the last two Fibonacci values). One step is a linear map, so it is a matrix $M$:

$$\begin{pmatrix} F(k+1) \\ F(k) \end{pmatrix} = \begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix} \begin{pmatrix} F(k) \\ F(k-1) \end{pmatrix}$$

Apply it $n$ times and you get $v_n = M^n v_0$. Matrix multiplication is **associative** (grouping does not change the result), so $M^n$ can be built by **binary exponentiation**: square repeatedly, and multiply in the squares that match the set bits of $n$. That takes $O(\log n)$ matrix products, each $O(d^3)$ for a $d \times d$ matrix.

```steps
title: Powers of M = [[1,1],[1,0]]
view: grid
frames:
  - grid: [[1, 1], [1, 0]]
    highlight: {"0,0": active}
    note: M. Entry [0][1] is F(1) = 1.
  - grid: [[2, 1], [1, 1]]
    highlight: {"0,1": match}
    note: M squared. Entry [0][1] is F(2) = 1. The top-left is F(3) = 2.
  - grid: [[5, 3], [3, 2]]
    highlight: {"0,1": match}
    note: M to the 4th, by squaring M squared. Entry [0][1] is F(4) = 3.
  - grid: [[8, 5], [5, 3]]
    highlight: {"0,1": match}
    note: M to the 5th = M to the 4th times M. Entry [0][1] is F(5) = 5.
```

In general $M^n = \begin{pmatrix} F(n+1) & F(n) \\ F(n) & F(n-1) \end{pmatrix}$. Five multiplications of $2 \times 2$ matrices replaced a loop of five steps. For $n = 10^{18}$ it replaces $10^{18}$ steps with about 120 products.

```quiz
q: A matrix power uses d x d matrices and the exponent is about 10^18 (60 bits). Roughly how many multiplications of matrix entries are done?
options:
  - about 60 * d
  - about 60 * d^2
  - about 120 * d^3
  - about 10^18 * d^3
answer: 2
why: Each of the 60 bits needs one squaring and at most one extra product. That is up to 120 matrix products, each costing d^3 entry multiplications.
```

## Template

```cpp
#include <bits/stdc++.h>
using namespace std;

const long long MOD = 1000000007;
typedef vector<vector<long long>> Mat;

Mat mul(const Mat& A, const Mat& B) {
    int d = A.size();
    Mat C(d, vector<long long>(d, 0));
    for (int i = 0; i < d; i++)
        for (int k = 0; k < d; k++)
            for (int j = 0; j < d; j++)
                C[i][j] = (C[i][j] + A[i][k] * B[k][j]) % MOD;
    return C;
}

Mat power(Mat A, long long e) {
    int d = A.size();
    Mat R(d, vector<long long>(d, 0));
    for (int i = 0; i < d; i++) R[i][i] = 1;       // identity matrix
    while (e > 0) {
        if (e & 1) R = mul(R, A);
        A = mul(A, A);
        e >>= 1;
    }
    return R;
}

int main() {
    long long n;
    cin >> n;
    Mat M = {{1, 1}, {1, 0}};
    cout << power(M, n)[0][1] << "\n";            // F(n)
}
```
```java
import java.util.*;

public class Main {
    static final long MOD = 1000000007L;

    static long[][] mul(long[][] A, long[][] B) {
        int d = A.length;
        long[][] C = new long[d][d];
        for (int i = 0; i < d; i++)
            for (int k = 0; k < d; k++)
                for (int j = 0; j < d; j++)
                    C[i][j] = (C[i][j] + A[i][k] * B[k][j]) % MOD;
        return C;
    }

    static long[][] power(long[][] A, long e) {
        int d = A.length;
        long[][] R = new long[d][d];
        for (int i = 0; i < d; i++) R[i][i] = 1;   // identity matrix
        while (e > 0) {
            if ((e & 1) == 1) R = mul(R, A);
            A = mul(A, A);
            e >>= 1;
        }
        return R;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();
        long[][] M = {{1, 1}, {1, 0}};
        System.out.println(power(M, n)[0][1]);     // F(n)
    }
}
```
```input
1000000000000000000
```
```output
209783453
```

The identity matrix $I$ (ones on the diagonal) plays the role of the number 1: $I \cdot A = A$. Start the result there, as above.

```order
prompt: Arrange the inner part of matrix multiplication (C = A * B modulo MOD).
lang: cpp
code: |
  for (int i = 0; i < d; i++)
      for (int k = 0; k < d; k++)
          for (int j = 0; j < d; j++)
              C[i][j] = (C[i][j] + A[i][k] * B[k][j]) % MOD;
distractors:
  - "              C[i][j] = A[i][k] * B[k][j] % MOD;"
why: Entry C[i][j] is the sum over k of A[i][k] * B[k][j]. The line that assigns instead of adding keeps only the last k and loses the rest of the sum.
```

## Building the matrix

Write the next state in terms of the current state, then read off the coefficients row by row.

| Recurrence | State vector | Matrix |
|---|---|---|
| $f(n) = a f(n-1) + b f(n-2)$ | $(f(n), f(n-1))$ | $\begin{pmatrix} a & b \\ 1 & 0 \end{pmatrix}$ |
| $f(n) = a f(n-1) + c$ (constant) | $(f(n), 1)$ | $\begin{pmatrix} a & c \\ 0 & 1 \end{pmatrix}$ |
| $f(n) = f(n-1) + f(n-m)$ | last $m$ values | first row has 1 in columns 1 and $m$, shifted identity below |
| Running sum $S(n) = S(n-1) + f(n)$ | add $S$ to the state | one more row and column |

The trick for constants and sums is to **add a coordinate** to the state. Sizes stay small, usually $d \le 50$ in contests.

## Counting walks

Let $A$ be the adjacency matrix of a directed graph: $A[i][j]$ is the number of edges from $i$ to $j$. Then $A^k[i][j]$ is the number of **walks** (vertices may repeat) with exactly $k$ edges from $i$ to $j$.

Why: $A^2[i][j] = \sum_t A[i][t] A[t][j]$ counts every way to pick a middle vertex $t$. Each extra factor adds one more step.

```cpp
#include <bits/stdc++.h>
using namespace std;

const long long MOD = 1000000007;
typedef vector<vector<long long>> Mat;

Mat mul(const Mat& A, const Mat& B) {
    int d = A.size();
    Mat C(d, vector<long long>(d, 0));
    for (int i = 0; i < d; i++)
        for (int k = 0; k < d; k++)
            for (int j = 0; j < d; j++)
                C[i][j] = (C[i][j] + A[i][k] * B[k][j]) % MOD;
    return C;
}

Mat power(Mat A, long long e) {
    int d = A.size();
    Mat R(d, vector<long long>(d, 0));
    for (int i = 0; i < d; i++) R[i][i] = 1;
    while (e > 0) {
        if (e & 1) R = mul(R, A);
        A = mul(A, A);
        e >>= 1;
    }
    return R;
}

int main() {
    int n, m;
    long long k;
    cin >> n >> m >> k;
    Mat A(n, vector<long long>(n, 0));
    while (m--) {
        int a, b;
        cin >> a >> b;
        A[a - 1][b - 1]++;                 // parallel edges count separately
    }
    cout << power(A, k)[0][n - 1] << "\n";  // walks from vertex 1 to vertex n
}
```
```java
import java.util.*;

public class Main {
    static final long MOD = 1000000007L;

    static long[][] mul(long[][] A, long[][] B) {
        int d = A.length;
        long[][] C = new long[d][d];
        for (int i = 0; i < d; i++)
            for (int k = 0; k < d; k++)
                for (int j = 0; j < d; j++)
                    C[i][j] = (C[i][j] + A[i][k] * B[k][j]) % MOD;
        return C;
    }

    static long[][] power(long[][] A, long e) {
        int d = A.length;
        long[][] R = new long[d][d];
        for (int i = 0; i < d; i++) R[i][i] = 1;
        while (e > 0) {
            if ((e & 1) == 1) R = mul(R, A);
            A = mul(A, A);
            e >>= 1;
        }
        return R;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(), m = sc.nextInt();
        long k = sc.nextLong();
        long[][] A = new long[n][n];
        while (m-- > 0) {
            int a = sc.nextInt(), b = sc.nextInt();
            A[a - 1][b - 1]++;
        }
        System.out.println(power(A, k)[0][n - 1]);
    }
}
```
```input
4 7 5
1 2
2 3
3 4
1 3
3 1
2 4
2 3
```
```output
6
```

Edge `2 3` appears twice, so it counts as two different edges and the entry `A[1][2]` is 2.

```blanks
prompt: Complete the walk-count query (Java). Vertices are numbered from 1 in the input.
lang: java
code: |
  A[a - 1][[[b - 1|b-1]]]++;
  // after the power:
  System.out.println(power(A, k)[[[0]]][n - 1]);
why: Input vertices start at 1 but matrix indices start at 0, so subtract one from both ends of each edge. Walks start at vertex 1, which is row 0, and end at vertex n, which is column n - 1.
```

## Complexity

| Part | Cost |
|---|---|
| One product of $d \times d$ matrices | $O(d^3)$ |
| Matrix power with exponent $n$ | $O(d^3 \log n)$ |
| Memory | $O(d^2)$ |

```estimate
q: A recurrence has a state of size d = 50 and n = 10^18. About how many basic entry multiplications does the matrix power need?
answer: 15000000
unit: multiplications
tolerance: order
hint: About 120 matrix products (60 squarings plus up to 60 extra), each d^3 = 125,000 multiplications.
solution: "120 products x 125,000 = 1.5 x 10^7 multiplications. That is a fraction of a second. At d = 500 it would be 120 x 1.25 x 10^8 = 1.5 x 10^10, too slow."
```

:::truth
Matrix exponentiation is a specialist tool. Most recurrence problems at 1500 to 1800 are solved with plain DP, a pattern or a short period. Learn it so you recognise the signal: a linear recurrence, a tiny state, and $n$ up to $10^{9}$ or $10^{18}$.
:::

## Pitfalls

- **Overflow before the modulus.** With entries below $10^9 + 7$, one product is about $10^{18}$, which fits in a signed 64-bit integer (limit about $9.2 \cdot 10^{18}$). Summing many such products before reducing can overflow, so reduce after every product.
- **Wrong initial vector.** $M^n$ gives the state $n$ steps after the start. Check the off-by-one with $n = 0, 1, 2$ by hand.
- **Identity matrix.** Starting the result at all zeros makes every power zero.
- **Slow loops for large $d$.** For $d \ge 100$ and many queries, use the `i-k-j` loop order shown (it is cache friendly), and reduce modulo less often if the limits allow.
- **A state that is too big.** If a transition needs more than about 100 state values, think again. The solution may be a different DP or a pattern.

:::details[Why not floating-point or the closed form?]
Binet's closed form for Fibonacci uses $\sqrt{5}$, which needs exact real arithmetic. Modulo a prime it works only if 5 is a square residue, and it does not generalise to other recurrences. Matrices work for every linear recurrence with constant coefficients.
:::

## Notes

:::notes
- A linear recurrence of order d becomes v(k+1) = M v(k) with a d x d matrix; v(n) = M^n v(0).
- Compute M^n by binary exponentiation: O(d^3 log n) time. Start the result at the identity matrix.
- Fibonacci: M = [[1,1],[1,0]]; M^n = [[F(n+1), F(n)], [F(n), F(n-1)]].
- Constants and running sums: add an extra coordinate (a 1, or the sum) to the state vector.
- For f(n) = f(n-1) + f(n-m) the state has m values and the matrix is m x m.
- Adjacency matrix A: (A^k)[i][j] is the number of walks of length exactly k from i to j. Parallel edges add.
- Reduce modulo after every product; products near 10^18 still fit in a signed 64-bit integer.
- Check the off-by-one at n = 0, 1, 2. Useful when d is up to about 50-100 and n is huge.
:::

```cards
- q: What does matrix exponentiation compute?
  a: The state of a linear recurrence (or a walk count) after n steps, as M^n times the starting vector, in O(d^3 log n).
- q: What is the matrix for Fibonacci and what does its power contain?
  a: M = [[1,1],[1,0]]. M^n = [[F(n+1), F(n)], [F(n), F(n-1)]].
- q: How do you handle a constant term in a recurrence?
  a: Add a coordinate that is always 1 to the state, so the constant becomes a matrix entry.
- q: What does the entry (A^k)[i][j] of an adjacency matrix count?
  a: The number of walks with exactly k edges from vertex i to vertex j. Vertices and edges may repeat.
- q: What is the starting value of the result in binary exponentiation of matrices?
  a: The identity matrix (ones on the diagonal, zeros elsewhere).
- q: When is matrix exponentiation the wrong tool?
  a: When the state is large (hundreds of values), when n is small enough for a plain loop, or when the recurrence is not linear.
```
