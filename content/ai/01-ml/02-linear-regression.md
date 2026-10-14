---
title: Linear Regression
summary: Fit a straight line to data by minimising squared error, with gradient descent and with a closed-form solution.
minutes: 35
difficulty: beginner
tags: [regression, gradient-descent, mse]
prereqs: [what-is-ml, math-for-ml]
exercises:
  - Using x = [1, 2, 3] and y = [2, 4, 6], compute the loss and the two gradients at w = 0, b = 0 by hand. Then take one step with a learning rate of 0.1.
  - Run the gradient descent code with raw (unscaled) x and a learning rate of 0.1. Explain what goes wrong and why scaling fixes it.
  - Add a second feature (x squared) to the normal equation example. Does the training error go down? Does that prove the model is better?
resources:
  - title: scikit-learn linear models
    url: https://scikit-learn.org/stable/modules/linear_model.html
  - title: Mathematics for Machine Learning (free book)
    url: https://mml-book.github.io/
---

## The idea

**Linear regression** predicts a number as a weighted sum of the inputs. With one feature it is a straight line:

$$ \hat{y} = w x + b $$

- $x$ is the input feature and $\hat{y}$ ("y hat") is the prediction.
- $w$ is the **weight** (slope): how much the prediction changes per unit of $x$.
- $b$ is the **bias** (intercept): the prediction when $x$ is 0.

With many features it is $\hat{y} = w_1 x_1 + \dots + w_d x_d + b$, which in NumPy is `X @ w + b`. The task: find $w$ and $b$ that fit the data.

## Measuring the fit

For each example, the **residual** is the prediction minus the true value. Squaring residuals makes errors positive and punishes big mistakes more. Averaging them gives the **mean squared error**:

$$ L(w, b) = \frac{1}{n} \sum_{i=1}^{n} (w x_i + b - y_i)^2 $$

This is the **loss**: a single number that is low for a good line. Learning means finding the $w$ and $b$ with the lowest loss.

```quiz
q: A line is wrong by +1 on one example and -1 on another. Why use squared errors instead of plain errors?
options:
  - Plain errors would cancel out to zero, hiding the mistakes
  - Squares are faster for computers to calculate
  - Squared errors are always smaller
answer: 0
why: Positive and negative mistakes cancel in a plain sum. Squaring makes every error positive, and as a bonus it is smooth, so its gradient is easy to compute.
```

## Gradient descent on the loss

The loss is a bowl-shaped surface over $(w, b)$. Gradient descent walks downhill. Differentiating the loss gives:

$$ \frac{\partial L}{\partial w} = \frac{2}{n} \sum_i (\hat{y}_i - y_i)\, x_i \qquad \frac{\partial L}{\partial b} = \frac{2}{n} \sum_i (\hat{y}_i - y_i) $$

Each update is `w -= lr * dw` and `b -= lr * db`, where `lr` is the learning rate.

```viz
algo: gradient-descent
input:
  lr: 0.1
  points: 16
  noise: 0.6
```

Try a learning rate of 0.5 or higher and watch the loss. Then try a very small one. This is the single most important dial in training.

```predict
lang: python
code: |
  import numpy as np
  x = np.array([1.0, 2.0]); y = np.array([2.0, 4.0])
  w = b = 0.0
  err = (w * x + b) - y
  print(2 * np.mean(err * x), 2 * np.mean(err))
output: -10.0 -6.0
why: err is [-2, -4]. The slope gradient is 2 * mean([-2, -8]) = -10 and the bias gradient is 2 * mean([-2, -4]) = -6. Both are negative, so the update raises w and b.
```

## Code: gradient descent from scratch

```python
import numpy as np
rng = np.random.default_rng(0)
x = rng.uniform(0, 10, size=50)
y = 3 * x + 2 + rng.normal(0, 1, size=50)

xs = (x - x.mean()) / x.std()      # scale the feature first
w, b, lr = 0.0, 0.0, 0.1
for step in range(100):
    err = (w * xs + b) - y          # shape (50,)
    dw = 2 * np.mean(err * xs)
    db = 2 * np.mean(err)
    w -= lr * dw
    b -= lr * db
    if step in (0, 9, 99):
        print(step, round(float(np.mean(err ** 2)), 2))
```
```output
0 398.34
9 8.15
99 0.99
```

The loss falls from 398 to about 1, close to the noise level we added (variance 1). That floor is the noise itself: no line can remove randomness the data contains.

:::note
The fitted `w` is about 8.9 and `b` about 17.8 because `x` was standardised. The slope is "change in `y` per one standard deviation of `x`", and `b` is the average `y`. Dividing by the standard deviation of `x` (about 2.9) recovers the original slope near 3.
:::

## Why scale features

If one feature ranges over 0 to 1,000,000 and another over 0 to 1, the loss surface becomes a long narrow valley. One learning rate is too big for the steep direction and too small for the flat one, and descent zig-zags. **Standardising** each feature (subtract the mean, divide by the standard deviation) makes the valley round and one learning rate works.

```blanks
prompt: Standardise a feature column x.
lang: python
code: |
  xs = (x - x.[[mean()]]) / x.[[std()]]
why: Subtracting the mean centres the feature at 0; dividing by the standard deviation gives it unit spread.
```

## The closed-form shortcut

For linear regression, the best weights have a direct formula, the **normal equation**. Stack the features in a matrix `X` (with a column of ones for the bias) and solve:

$$ (X^\top X)\, \theta = X^\top y $$

```python
import numpy as np
rng = np.random.default_rng(0)
x = rng.uniform(0, 10, size=50)
y = 3 * x + 2 + rng.normal(0, 1, size=50)
xs = (x - x.mean()) / x.std()

X = np.column_stack([xs, np.ones_like(xs)])
theta = np.linalg.solve(X.T @ X, X.T @ y)
print(np.round(theta, 3))
```
```output
[ 8.896 17.838]
```

This matches gradient descent exactly. So why use descent at all?

| | Normal equation | Gradient descent |
|---|---|---|
| Steps | One solve | Many small updates |
| Cost with d features | Roughly $O(d^3)$, slow for huge d | Cheap per step, scales to millions |
| Needs a learning rate | No | Yes |
| Works for other models | Only linear regression | Neural networks and almost everything else |

Linear regression is the one case where both work. Gradient descent is what you will use for everything later.

## What it cannot do

- It fits straight lines (or flat planes). A curved relationship needs extra features such as $x^2$, or a different model.
- It is pulled hard by **outliers** (extreme points), because squaring magnifies large errors.
- A low training error does not mean good predictions on new data. Check the test set.

:::truth
Linear regression is plain, and it is often the right first model. Plenty of production systems are a linear model on well-chosen features, and it beats an overfit network more often than people expect.
:::

```cards
- q: Write the linear regression model for one feature.
  a: "$\\hat{y} = wx + b$, with weight (slope) $w$ and bias (intercept) $b$."
- q: What is mean squared error?
  a: The average of the squared differences between predictions and true values.
- q: What are the two gradients of MSE for a line?
  a: "$\\frac{2}{n}\\sum(\\hat{y}-y)x$ for $w$ and $\\frac{2}{n}\\sum(\\hat{y}-y)$ for $b$."
- q: Why standardise features before gradient descent?
  a: Different scales make the loss surface a narrow valley; standardising lets one learning rate work for all weights.
- q: When can you skip gradient descent for linear regression?
  a: When the number of features is modest, the normal equation gives the exact answer in one solve.
- q: What does the training loss floor tell you?
  a: It reflects noise in the data that no model of this type can remove.
```

## Notes

:::notes
- Linear regression: prediction is a weighted sum plus a bias; one feature gives a line.
- Loss is mean squared error; squaring stops errors cancelling and punishes large misses.
- Gradients: dw = 2 * mean(err * x), db = 2 * mean(err), where err = prediction minus truth.
- Update: `w -= lr * dw`; too large a learning rate diverges, too small is slow.
- Standardise features (subtract mean, divide by standard deviation) so one learning rate fits all.
- Normal equation solves it in one step; gradient descent generalises to every later model.
- Outliers hurt; a curved pattern needs extra features; always check on held-out data.
:::
