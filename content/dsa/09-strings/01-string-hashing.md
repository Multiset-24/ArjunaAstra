---
title: String Hashing
summary: Turn substrings into numbers with a polynomial hash so any two substrings compare in O(1), and know exactly when it can fail.
minutes: 40
difficulty: advanced
rating: [1700, 2200]
tags: [strings, hashing, binary-search]
prereqs: [hashing-and-frequency, modular-arithmetic, binary-search]
problems:
  - lc: find-the-index-of-the-first-occurrence-in-a-string
    name: Find the Index of the First Occurrence in a String
    difficulty: Easy
    note: rolling hash as a warm-up
  - cf: 126B
    name: Password
    rating: 1700
    note: a prefix that is also a suffix and appears in the middle
  - cf: 271D
    name: Good Substrings
    rating: 1800
    core: true
    note: count distinct substrings by their hashes
  - cf: 1326D2
    name: Prefix-Suffix Palindrome (Hard version)
    rating: 1800
    note: hashes of the string and its reverse give palindrome checks
  - cf: 514C
    name: Watto and Mechanism
    rating: 2000
    core: true
    note: for each query, try changing each position and look up the hash
  - cf: 1200E
    name: Compress Words
    rating: 2000
    note: longest overlap of a suffix and a prefix
  - lc: longest-duplicate-substring
    name: Longest Duplicate Substring
    difficulty: Hard
    core: true
    note: binary search on the length, a set of window hashes
  - lc: distinct-echo-substrings
    name: Distinct Echo Substrings
    difficulty: Hard
exercises:
  - Use the program to find the longest substring that appears twice in a string of length 2000, by binary search on length. Check it against an O(n^3) loop.
  - Check whether a string is a palindrome in O(1) per query by hashing it and its reverse.
---

## The problem

You have a string `s` of length up to 200,000 and many queries. Each query gives two substrings and asks whether they are equal. Comparing letter by letter costs the length of the substring.

## Brute force first

- Compare character by character: O(length) per query, up to about 4e10 steps in total.
- Store every substring in a set: O(n^2) memory.
- The fix: compress each substring into one number, and compare numbers.

## The idea

A **polynomial hash** treats a string as a number in base `B`, taken modulo a large number `M`:

$$ \text{hash}(s_0 s_1 \dots s_{k-1}) = s_0 B^{k-1} + s_1 B^{k-2} + \dots + s_{k-1} \pmod M $$

Precompute prefix hashes in one pass, and a power table:

$$ h[i+1] = h[i] \cdot B + s_i \pmod M \qquad pw[i] = B^i \pmod M $$

Then the hash of `s[l..r)` (half-open) is:

$$ h[r] - h[l] \cdot pw[r-l] \pmod M $$

Multiplying `h[l]` by `B^(r-l)` shifts the prefix up to the same position as in `h[r]`, so the subtraction cancels it.

```steps
title: Hash of "abab" with a = 1, b = 2, base 10 and no wrap-around
view: array
frames:
  - arr: [0, 1, 12, 121, 1212]
    note: "Prefix hashes h[0..4]: h[1] = 1, h[2] = 1 * 10 + 2 = 12, h[3] = 121, h[4] = 1212."
  - arr: [0, 1, 12, 121, 1212]
    highlight: {2: active}
    note: "The substring s[0..2) = ab has hash h[2] - h[0] * 100 = 12."
  - arr: [0, 1, 12, 121, 1212]
    highlight: {4: active, 2: compare}
    note: "The substring s[2..4) = ab has hash h[4] - h[2] * 100 = 1212 - 1200 = 12. Same hash as the first, so the two substrings are equal."
```

```predict
lang: cpp
code: |
  long long B = 10, M = 1000003;
  string s = "abab";                 // a = 1, b = 2
  vector<long long> h(5, 0), pw(5, 1);
  for (int i = 0; i < 4; i++) {
      h[i + 1] = (h[i] * B + (s[i] - 'a' + 1)) % M;
      pw[i + 1] = pw[i] * B % M;
  }
  // hash of s[1..4), which is "bab"
  cout << ((h[4] - h[1] * pw[3]) % M + M) % M;
output: "212"
why: "h[4] = 1212 and h[1] = 1, pw[3] = 1000. So 1212 - 1000 = 212, which is b * 100 + a * 10 + b."
```

## Can it be wrong?

Equal strings always have equal hashes. Different strings can share a hash, called a **collision**. So the check is one-sided.

```quiz
q: Two substrings have different hashes. Two other substrings have equal hashes. What do you know?
options:
  - The first pair is definitely different, the second pair is probably equal
  - The first pair is probably different, the second pair is definitely equal
  - Both pairs are definitely what the hashes say
  - Nothing, hashes are useless for comparison
answer: 0
why: "The same string always gives the same hash, so a different hash proves the strings differ. An equal hash can come from a collision, with a probability you control by choosing M."
```

The **birthday paradox** is why a single modulus near 1e9 is risky: with `m` strings there are about `m^2 / 2` pairs, and each pair collides with probability about `1/M`.

```estimate
q: You hash 100,000 different strings with a single modulus 1,000,000,007. Roughly how many colliding pairs do you expect?
answer: 5
unit: pairs
tolerance: order
hint: There are about m^2 / 2 pairs of strings, each colliding with probability 1 / M.
solution: "100,000^2 / 2 is 5 x 10^9 pairs. Divide by 10^9 and you get about 5 collisions. With M = 2^61 - 1, the same count gives about 2 x 10^-9, so a collision is practically impossible."
```

| Choice | Verdict |
|---|---|
| One modulus near 1e9 | Fails when you compare many strings (see above) |
| Two moduli near 1e9 | About 1e18 combined, fine |
| Modulus `2^61 - 1` | About 2.3e18, one value, needs a 128-bit multiply |
| Natural overflow (mod `2^64`) | Never. Thue-Morse strings collide for every base |
| Fixed base | Risky on Codeforces, where others can craft tests. Choose the base at random at runtime |

```quiz
q: Why is the base chosen at random when the program starts?
options:
  - To make the hash faster
  - So that nobody can prepare a test that collides for your fixed base
  - Because the base must be a prime
  - To avoid negative numbers
answer: 1
why: "A fixed base and modulus are known, so a test can be built to collide on them. A random base changes per run and can't be targeted."
```

## Template

The program reads `s`, then `q` queries `l1 r1 l2 r2` (1-based, inclusive), and prints `YES` if the two substrings are equal. It uses modulus `2^61 - 1` and a random base. The multiply is done with a 128-bit product (C++) or `Math.multiplyHigh` (Java).

```cpp
#include <bits/stdc++.h>
using namespace std;
typedef unsigned long long ull;

const ull MOD = (1ULL << 61) - 1;

ull mul(ull a, ull b) {  // (a * b) mod (2^61 - 1) using a 128-bit product
    unsigned __int128 t = (unsigned __int128)a * b;
    ull r = (ull)(t & MOD) + (ull)(t >> 61);
    if (r >= MOD) r -= MOD;
    return r;
}

int main() {
    string s;
    int q;
    cin >> s >> q;
    int n = s.size();
    mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
    ull B = rng() % (MOD - 1000) + 500;  // random base, so no fixed test can break it
    vector<ull> h(n + 1, 0), pw(n + 1, 1);
    for (int i = 0; i < n; i++) {
        h[i + 1] = mul(h[i], B) + (ull)s[i];
        if (h[i + 1] >= MOD) h[i + 1] -= MOD;
        pw[i + 1] = mul(pw[i], B);
    }
    auto get = [&](int l, int r) {  // hash of s[l..r), half-open
        ull x = h[r] + MOD - mul(h[l], pw[r - l]);
        return x >= MOD ? x - MOD : x;
    };
    while (q--) {
        int l1, r1, l2, r2;  // 1-indexed, inclusive
        cin >> l1 >> r1 >> l2 >> r2;
        bool same = (r1 - l1 == r2 - l2) && get(l1 - 1, r1) == get(l2 - 1, r2);
        cout << (same ? "YES" : "NO") << "\n";
    }
    return 0;
}
```
```java
import java.io.*;
import java.util.*;

public class Main {
    static final long MOD = (1L << 61) - 1;

    static long mul(long a, long b) {  // (a * b) mod (2^61 - 1)
        long hi = Math.multiplyHigh(a, b);
        long lo = a * b;
        long r = (lo & MOD) + ((lo >>> 61) | (hi << 3));
        r = (r & MOD) + (r >>> 61);
        return r >= MOD ? r - MOD : r;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine().trim();
        int q = Integer.parseInt(br.readLine().trim());
        int n = s.length();
        Random rnd = new Random(System.nanoTime());
        long B = (rnd.nextLong() >>> 4) % (MOD - 1000) + 500;
        long[] h = new long[n + 1], pw = new long[n + 1];
        pw[0] = 1;
        for (int i = 0; i < n; i++) {
            h[i + 1] = mul(h[i], B) + s.charAt(i);
            if (h[i + 1] >= MOD) h[i + 1] -= MOD;
            pw[i + 1] = mul(pw[i], B);
        }
        StringBuilder sb = new StringBuilder();
        while (q-- > 0) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int l1 = Integer.parseInt(st.nextToken()), r1 = Integer.parseInt(st.nextToken());
            int l2 = Integer.parseInt(st.nextToken()), r2 = Integer.parseInt(st.nextToken());
            boolean same = false;
            if (r1 - l1 == r2 - l2) {
                long x = h[r1] + MOD - mul(h[l1 - 1], pw[r1 - l1 + 1]);
                if (x >= MOD) x -= MOD;
                long y = h[r2] + MOD - mul(h[l2 - 1], pw[r2 - l2 + 1]);
                if (y >= MOD) y -= MOD;
                same = x == y;
            }
            sb.append(same ? "YES" : "NO").append('\n');
        }
        System.out.print(sb);
    }
}
```
```input
abracadabra
5
1 4 8 11
1 3 4 6
2 4 9 11
1 1 4 4
1 5 7 11
```
```output
YES
NO
YES
YES
NO
```

## Walkthrough

For `abracadabra`:

- `1 4 8 11` compares `abra` with `abra`: YES.
- `1 3 4 6` compares `abr` with `aca`: NO.
- `2 4 9 11` compares `bra` with `bra`: YES.
- `1 5 7 11` has lengths 5 and 5, `abrac` against `dabra`: NO.
- Check the length first. Equal lengths are required before comparing hashes.

## What it is used for

| Task | Idea |
|---|---|
| Compare two substrings | `get(l1, r1) == get(l2, r2)` in O(1) |
| Longest repeated substring | Binary search on length L; store the hashes of all windows of length L in a set |
| Distinct substrings of length L | Put all window hashes in a set and count |
| Palindrome check | Hash of the substring against the hash of the reversed string |
| Pattern in text | Slide the window with the same hash; or use KMP, next lesson |

## Complexity

- Build O(n). Each substring hash O(1).
- Binary search plus a set of hashes: O(n log n) overall for the longest repeated substring.

## Pitfalls

- Giving a letter the value 0. Then `a` and `aa` get the same hash. Use `c - 'a' + 1` or the character code.
- Forgetting `+ MOD` before subtracting, which yields negative values.
- Multiplying two numbers near `1e9 + 7` is safe in 64 bits. Two numbers near `2^61` are not.
- Putting hashes in `unordered_map` with the default hash. Sort them or use a custom hash.
- Comparing hashes of substrings of different lengths.

:::truth
Hashing is probabilistic. A well-chosen modulus makes the failure chance negligible, but it is not zero, and a bad choice fails in real contests. If a deterministic tool (KMP, the Z-function, a suffix array) is equally easy for the problem, prefer it. Hashing wins when the question is "are these two arbitrary substrings equal" or when you binary search on the length.
:::

```cards
- q: What is the hash of s[l..r)?
  a: "`h[r] - h[l] * pw[r-l]` modulo M, where `h[i+1] = h[i] * B + s[i]`."
- q: What does equal hash prove, and what does different hash prove?
  a: Different hashes prove the strings differ. Equal hashes mean the strings are probably equal, with a collision chance of about 1/M per pair.
- q: Why is a single modulus near 1e9 unsafe for many comparisons?
  a: The birthday paradox. With 1e5 strings there are about 5e9 pairs, so you expect several collisions.
- q: Which hashing setups are considered safe?
  a: Modulus 2^61 - 1, or two moduli around 1e9, with a random base chosen at runtime.
- q: Why never use natural overflow (mod 2^64)?
  a: Thue-Morse strings collide for every base, so a prepared test breaks it.
```

## Notes

:::notes
- Polynomial hash: `h[i+1] = h[i] * B + s[i] (mod M)`, powers `pw[i] = B^i`.
- Substring hash on `[l, r)`: `h[r] - h[l] * pw[r-l]` (mod M); add M before reducing to avoid negatives.
- Different hashes mean different strings; equal hashes mean probably equal.
- Safe setup: mod `2^61 - 1` (128-bit multiply) or two mods near 1e9, plus a random base.
- Never use mod `2^64` overflow; a single 1e9 mod fails by the birthday paradox with many strings.
- Compare lengths first; give letters nonzero values.
- Typical uses: substring equality, binary search on length with a hash set, palindrome checks.
- Prefer KMP or Z when the problem is plain pattern matching.
:::
