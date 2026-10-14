---
title: Python and NumPy
summary: Arrays, shapes and broadcasting, the habits that make ML code short and the bugs that make it confusing.
minutes: 30
difficulty: beginner
tags: [python, numpy, arrays]
prereqs: [start-here]
exercises:
  - Given a (5, 3) array of exam scores (students by subjects), standardise each subject column to mean 0 and standard deviation 1 without a loop.
  - Predict the shape of `np.ones((4, 1)) * np.ones((1, 5))` and of `np.ones((4, 3)) + np.ones((4,))`. Run both and read the error for the second.
  - Rewrite a for-loop that computes the Euclidean distance (straight-line distance) from one point to 1000 other points as a single NumPy expression.
resources:
  - title: NumPy absolute basics for beginners
    url: https://numpy.org/doc/stable/user/absolute_beginners.html
  - title: NumPy broadcasting
    url: https://numpy.org/doc/stable/user/basics.broadcasting.html
---

## Why NumPy

**NumPy** is the Python library for fast arrays of numbers. A Python list holds objects and loops slowly. A NumPy array holds raw numbers in one block of memory and runs loops in compiled C.

- ML data is arrays: a table of examples is a 2-D array, an image is 3-D, a batch of images is 4-D.
- One NumPy expression often replaces a 5-line loop and runs 10 to 100 times faster.
- PyTorch, the deep learning library you will meet later, copies NumPy's ideas almost exactly.

## Shape is everything

Every array has a **shape**: the length along each **axis** (a dimension). Most ML bugs are shape bugs, so read shapes the way you read types.

```python
import numpy as np

a = np.arange(6)
print(a, a.shape)
m = a.reshape(2, 3)
print(m)
print(m.shape, m.ndim)
```
```output
[0 1 2 3 4 5] (6,)
[[0 1 2]
 [3 4 5]]
(2, 3) 2
```

- `(6,)` is a 1-D array with 6 numbers. `(2, 3)` is 2 rows and 3 columns.
- `ndim` is the number of axes.
- `reshape` re-labels the same numbers; the total count must match.

```quiz
q: An array has shape `(4, 5)`. What does `x.reshape(2, 10)` give?
options:
  - An error, because the shape changes
  - A (2, 10) array holding the same 20 numbers in the same order
  - A (2, 10) array with 10 numbers dropped
answer: 1
why: Reshape only changes how the 20 numbers are grouped. It works whenever the product of the new shape equals the number of elements.
```

## Vectorised operations

**Vectorised** means an operation applies to the whole array at once, with no Python loop.

- `v * 2`, `v + w`, `v > 4` all work element by element.
- A boolean array can index another array: `v[v > 4]` keeps only the matching items.
- `@` is matrix multiplication; `*` is element-wise multiplication. Mixing them up is a classic bug.

:::key
If you write a `for` loop over array elements in NumPy code, stop and ask whether an array expression does the same thing.
:::

## Broadcasting

**Broadcasting** is how NumPy combines arrays of different shapes. The rule, applied from the last axis backwards:

1. Compare the two shapes axis by axis, starting at the end.
2. Two sizes are compatible if they are equal or one of them is 1.
3. A size-1 axis is stretched (virtually, no copy) to match the other.
4. A missing leading axis counts as 1.

Subtract each column's mean from a table:

```python
import numpy as np

x = np.array([[1.0, 10.0],
              [3.0, 20.0],
              [5.0, 30.0]])
mean = x.mean(axis=0)
print(mean, mean.shape)
print(x - mean)
```
```output
[ 3. 20.] (2,)
[[ -2. -10.]
 [  0.   0.]
 [  2.  10.]]
```

Here `x` is `(3, 2)` and `mean` is `(2,)`. The missing leading axis is treated as 1, then stretched to 3 rows.

```python
import numpy as np

col = np.array([[1], [2], [3]])   # (3, 1)
row = np.array([10, 20])           # (2,)
print((col + row).shape)
print(col + row)
```
```output
(3, 2)
[[11 21]
 [12 22]
 [13 23]]
```

`(3, 1)` with `(2,)` becomes `(3, 2)`: every column value meets every row value.

```predict
lang: python
code: |
  import numpy as np
  a = np.ones((3, 4))
  b = np.ones(4)
  print((a + b).shape)
output: (3, 4)
why: The shapes (3, 4) and (4,) line up from the end (4 and 4), and the missing leading axis of b becomes 1 and stretches to 3.
```

## Axis and keepdims

`axis` says which dimension to collapse. `axis=0` collapses rows (one result per column), `axis=1` collapses columns (one result per row).

```python
import numpy as np

x = np.array([[1.0, 10.0],
              [3.0, 20.0],
              [5.0, 30.0]])
row_sum = x.sum(axis=1, keepdims=True)
print(row_sum.shape)
print((x / row_sum).round(2))
```
```output
(3, 1)
[[0.09 0.91]
 [0.13 0.87]
 [0.14 0.86]]
```

`keepdims=True` keeps the collapsed axis as size 1, so the result broadcasts back against the original. Without it you get shape `(3,)`, and `x / row_sum` fails or, worse, silently divides along the wrong axis.

:::warn
A silent broadcast is more dangerous than an error. If a `(100,)` array meets a `(100, 1)` array, you get a `(100, 100)` result with no warning. Print shapes whenever a result looks too big.
:::

```blanks
prompt: Standardise each column of x (shape n by d) so it has mean 0 and standard deviation 1.
lang: python
code: |
  mean = x.mean(axis=[[0]])
  std = x.std(axis=0)
  z = (x - mean) / [[std]]
why: Collapse axis 0 (the rows) to get one mean and one std per column, then broadcasting stretches them back over every row.
```

## Habits that save hours

- Use `np.random.default_rng(0)` for random numbers so results repeat.
- Check `.shape` and `.dtype` (the number type, such as `int64` or `float64`) when something looks odd.
- Integer arrays do integer maths: `np.array([1, 2]) / 2` gives floats, but storing 0.5 into an int array truncates it to 0.
- Prefer slicing and boolean masks to loops; reach for a loop only when each step depends on the previous one.

:::truth
Vectorising is a skill that takes practice. Expect to print shapes constantly for the first few weeks. That is normal, not a sign you are slow.
:::

```cards
- q: What does shape (3, 4) mean?
  a: 2 axes; 3 along axis 0 (rows) and 4 along axis 1 (columns), so 12 numbers.
- q: State the broadcasting rule.
  a: Compare shapes from the last axis backwards; sizes must be equal or one must be 1; missing leading axes count as 1.
- q: What does keepdims=True do?
  a: Keeps the reduced axis with size 1 so the result still broadcasts against the original array.
- q: "Difference between `*` and `@` on arrays?"
  a: "`*` multiplies element by element (with broadcasting); `@` is matrix multiplication."
- q: Why use a seeded generator?
  a: np.random.default_rng(0) makes random numbers repeatable, so results and bugs can be reproduced.
```

## Notes

:::notes
- A NumPy array stores numbers compactly and runs operations in compiled code; avoid Python loops over elements.
- Shape is the length of each axis; most ML bugs are shape bugs, so print `.shape`.
- `reshape` regroups the same numbers; the element count must match.
- Broadcasting: compare shapes from the end; equal or 1 is compatible; missing leading axes count as 1.
- `axis=0` collapses rows (one value per column); `axis=1` collapses columns (one per row).
- `keepdims=True` keeps the reduced axis so the result broadcasts back correctly.
- `*` is element-wise, `@` is matrix multiplication.
- Seed with `np.random.default_rng(0)` for repeatable examples.
:::
