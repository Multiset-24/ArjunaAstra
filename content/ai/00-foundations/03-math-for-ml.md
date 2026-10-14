---
title: Math for ML
summary: Vectors, dot products, cosine similarity, derivatives and gradients, only the parts the rest of the track uses.
minutes: 35
difficulty: beginner
tags: [linear-algebra, calculus, math]
prereqs: [python-and-numpy]
exercises:
  - Compute the dot product and cosine similarity of [1, 2, 3] and [2, 4, 6] by hand. Explain why the cosine is exactly 1.
  - For f(w) = (w - 3)^2, write the derivative, then do three gradient descent steps from w = 5 with a step size of 0.25. What happens with a step size of 1.0, and with 1.1?
  - A weight matrix W has shape (3, 2). What shape must x have for W @ x to work, and what shape is the result?
resources:
  - title: Mathematics for Machine Learning (free book)
    url: https://mml-book.github.io/
  - title: NumPy linear algebra routines
    url: https://numpy.org/doc/stable/reference/routines.linalg.html
---

## How much math you need

Less than people fear, more than zero. For this track you need four ideas:

- **Vectors**: lists of numbers that represent things.
- **Dot product and cosine similarity**: how aligned two vectors are.
- **Matrices**: a table of numbers that transforms vectors.
- **Gradients**: which direction to nudge numbers to reduce an error.

Everything else (transformers, embeddings, training) is these four, repeated at scale.

## Vectors

A **vector** is an ordered list of numbers. In ML a vector describes one thing: a house as `[area, rooms, age]`, a word as 300 learned numbers, a photo as a million pixel values.

- Its **length** (or norm) is $\lVert a \rVert = \sqrt{a_1^2 + a_2^2 + \dots}$, the straight-line distance from the origin.
- Adding vectors adds them position by position. Multiplying by a number scales every position.
- The number of positions is the **dimension**. A 300-number word vector lives in 300 dimensions; the intuition from 2-D pictures still holds.

## Dot product and cosine similarity

The **dot product** multiplies matching positions and adds the results:

$$ a \cdot b = a_1 b_1 + a_2 b_2 + \dots + a_n b_n $$

It is large and positive when the vectors point the same way, zero when they are perpendicular, and negative when they point opposite ways.

**Cosine similarity** divides out the lengths so only the direction matters:

$$ \cos\theta = \frac{a \cdot b}{\lVert a \rVert \, \lVert b \rVert} $$

It ranges from -1 (opposite) through 0 (unrelated) to 1 (same direction). Search engines use it to compare an embedding (a vector that captures meaning) of your query with embeddings of documents.

```viz
algo: cosine
input:
  a: [3, 1]
  b: [1, 2]
```

Try making the vectors perpendicular, then opposite. Watch the dot product change sign while the lengths stay put.

```quiz
q: Two vectors point in exactly the same direction, but one is three times longer. What is their cosine similarity?
options:
  - "3"
  - "1"
  - "0.33"
answer: 1
why: Cosine divides by both lengths, so scaling a vector does not change it. Same direction always gives 1. The dot product, in contrast, would grow threefold.
```

```python
import numpy as np

a = np.array([3.0, 1.0])
b = np.array([1.0, 2.0])
dot = a @ b
cos = dot / (np.linalg.norm(a) * np.linalg.norm(b))
print(dot, round(float(cos), 4))
```
```output
5.0 0.7071
```

The vectors are 45 degrees apart, and cosine of 45 degrees is 0.7071.

## Matrices

A **matrix** is a 2-D table of numbers. Multiplying a matrix by a vector takes the dot product of each row with the vector. A neural network layer is exactly this: a weight matrix applied to an input.

```python
import numpy as np

W = np.array([[1.0, 0.0], [0.5, 0.5], [0.0, -1.0]])
x = np.array([2.0, 4.0])
print(W @ x)
```
```output
[ 2.  3. -4.]
```

- `W` has shape `(3, 2)`, `x` has shape `(2,)`. The inner sizes (2 and 2) must match.
- The result has shape `(3,)`: one dot product per row.

```predict
lang: python
code: |
  import numpy as np
  print(np.array([1, 2, 3]) @ np.array([4, 5, 6]))
output: "32"
why: 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32. For two 1-D arrays, @ is the dot product.
```

## Derivatives and gradients

A **derivative** says how fast a function changes when you nudge its input. For $f(w) = (w - 3)^2$ the derivative is $2(w - 3)$: at $w = 5$ it is 4, meaning that increasing $w$ slightly raises $f$ by about 4 times the nudge.

A **gradient** is the same idea for many inputs: a vector holding one derivative per input. It points in the direction of steepest increase. To reduce an error, step the opposite way:

$$ w \leftarrow w - \eta \, \frac{df}{dw} $$

Here $\eta$ (eta) is the **learning rate**, the step size. This rule is **gradient descent**, and it trains almost every model in this track.

```python
f = lambda w: (w - 3) ** 2
w, eps = 5.0, 1e-6
numeric = (f(w + eps) - f(w - eps)) / (2 * eps)
print(round(numeric, 3), 2 * (w - 3))
```
```output
4.0 4.0
```

Checking a hand-derived gradient against a numeric one, as above, is a standard way to catch calculus mistakes.

```blanks
prompt: One gradient descent step for f(w) = (w - 3)^2 with learning rate lr.
lang: python
code: |
  grad = 2 * (w - 3)
  w = w [[-]] lr * [[grad]]
why: Move against the gradient. Adding it would climb the hill instead of descending.
```

:::key
Gradient descent: compute how the error changes with each parameter, then move every parameter a small step in the direction that lowers it. Repeat.
:::

## The chain rule

Models are built from stacked functions: $y = g(f(x))$. The **chain rule** says the derivative multiplies through the stack:

$$ \frac{dy}{dx} = \frac{dg}{df} \cdot \frac{df}{dx} $$

You will not differentiate big networks by hand. Libraries do it automatically (**backpropagation**, covered later), but you should know that it is just this rule applied layer by layer.

:::warn
A learning rate that is too large overshoots the minimum and can make the error grow instead of shrink. For the example above, a step of 1.0 jumps from 5 to 1 to 5 and never settles. Too small is safe but slow.
:::

:::truth
You do not need to prove theorems to do AI engineering. You do need to read an equation and know what shapes go in and out. If a symbol is unfamiliar, look it up rather than skipping it.
:::

```cards
- q: What is the dot product of a and b?
  a: "The sum of products of matching positions: $a_1 b_1 + \\dots + a_n b_n$."
- q: What does cosine similarity measure and what is its range?
  a: The angle between two vectors, ignoring length. Range is -1 (opposite) to 1 (same direction).
- q: What shape is the result of W @ x when W is (3, 2) and x is (2,)?
  a: "(3,): one dot product per row of W. The inner dimensions (2 and 2) must match."
- q: What is a gradient?
  a: A vector of derivatives, one per input, pointing in the direction of steepest increase.
- q: Write the gradient descent update.
  a: "$w \\leftarrow w - \\eta \\, \\partial f / \\partial w$, where $\\eta$ is the learning rate."
```

## Notes

:::notes
- A vector is a list of numbers; its length is the square root of the sum of squares.
- Dot product: sum of products of matching positions; positive means aligned, zero perpendicular, negative opposed.
- Cosine similarity = dot product divided by both lengths; ignores scale, ranges from -1 to 1.
- Matrix times vector = dot product of each row with the vector; inner shapes must match.
- Derivative: how fast a function changes with its input. Gradient: the vector of those for many inputs.
- Gradient descent: `w = w - lr * grad`; too large a learning rate overshoots, too small is slow.
- Chain rule multiplies derivatives through stacked functions; backpropagation automates it.
:::
