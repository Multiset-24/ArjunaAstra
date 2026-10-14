---
title: Overfitting and Regularization
summary: Why a model that scores perfectly on its training data can fail on new data, and the standard ways to prevent it.
minutes: 30
difficulty: intermediate
tags: [overfitting, regularization, ridge, validation]
prereqs: [linear-regression, logistic-regression, evaluation-metrics]
exercises:
  - Change the degree in the code below to every value from 1 to 11 and record train and test error. At which degree does test error start rising? Does the answer change if you use a different random seed?
  - In your own words, explain why L1 can set weights exactly to zero while L2 only shrinks them. Draw the two penalty shapes in 2-D to help.
  - A model has 99% accuracy on training data and 71% on validation data. List three different changes you could try, and which of them needs more data versus a simpler model.
resources:
  - title: scikit-learn user guide - linear models (ridge, lasso)
    url: https://scikit-learn.org/stable/modules/linear_model.html
  - title: "Dropout: A Simple Way to Prevent Neural Networks from Overfitting"
    url: https://jmlr.org/papers/v15/srivastava14a.html
---

## Intuition: memorising versus learning

A model is trained on examples but used on examples it has never seen. **Generalisation** is how well it does on those new examples.

- **Overfitting**: the model memorises quirks and noise in the training set. Training error is tiny, new-data error is large.
- **Underfitting**: the model is too simple to capture the real pattern. Both errors are large.
- **Noise** is the random part of the data that no model can predict. A model that fits the noise is learning something that will not repeat.

| Situation | Train error | Validation error | Usual cause |
|---|---|---|---|
| Underfit | High | High (similar) | Model too simple, too few features |
| Good fit | Low | Slightly higher | - |
| Overfit | Very low | Much higher | Model too flexible for the amount of data |

:::key
Training error always improves as the model gets more flexible. Only error on data the model has not seen tells you whether it is actually learning.
:::

```quiz
q: A model has 2% error on training data and 30% error on a held-out validation set. What is the most likely problem?
options:
  - Underfitting, because the error is high
  - Overfitting, because it fits the training set far better than new data
  - The validation set is too small to say anything at all
  - Nothing, since training error is what matters
answer: 1
why: "A large gap between train and validation error is the signature of overfitting. Underfitting would show high error on both."
```

## Seeing it: polynomial fitting

Take 12 noisy points from a sine curve. Fit a polynomial (a sum of powers of x, like $w_0 + w_1 x + w_2 x^2 + \dots$) of increasing **degree** (the highest power). Higher degree means more flexibility. Then measure the **MSE** (mean squared error) on the training points and on 200 fresh points.

```python
import numpy as np

rng = np.random.default_rng(0)

def make(n):
    x = rng.uniform(0, 1, n)
    y = np.sin(2 * np.pi * x) + rng.normal(0, 0.3, n)
    return x, y

x_tr, y_tr = make(12)
x_te, y_te = make(200)

def features(x, degree):
    return np.vander(x, degree + 1, increasing=True)

def fit_ridge(X, y, lam):
    # closed form: w = (X^T X + lam * I)^-1 X^T y  (bias column left unpenalised)
    I = np.eye(X.shape[1])
    I[0, 0] = 0.0
    return np.linalg.solve(X.T @ X + lam * I, X.T @ y)

def mse(X, y, w):
    return float(np.mean((X @ w - y) ** 2))

for degree in [1, 3, 9]:
    Xtr, Xte = features(x_tr, degree), features(x_te, degree)
    w = fit_ridge(Xtr, y_tr, lam=0.0)
    print(f"degree {degree}: train {mse(Xtr, y_tr, w):.3f}  test {mse(Xte, y_te, w):.3f}")
```
```output
degree 1: train 0.266  test 0.454
degree 3: train 0.076  test 0.130
degree 9: train 0.033  test 0.631
```

- Degree 1 underfits: a straight line cannot follow a sine wave.
- Degree 3 is about right: both errors are low.
- Degree 9 has 10 weights for 12 points. It bends through every point, so train error keeps falling while test error is the worst of the three.

```predict
lang: python
prompt: Three points, and a degree-2 polynomial (3 weights). What training MSE does the fit reach?
code: |
  import numpy as np
  x = np.array([0.0, 1.0, 2.0])
  y = np.array([1.0, 3.0, 2.0])
  w = np.polyfit(x, y, 2)
  print(round(float(np.mean((np.polyval(w, x) - y) ** 2)), 3))
output: "0.0"
why: As many weights as points means the curve can pass through every point exactly. Training error hits zero, which says nothing about how it behaves between the points.
```

## Regularization: a penalty on big weights

**Regularization** means adding a cost for complexity so the model prefers simpler explanations. The most common form adds the size of the weights to the loss.

$$ L(w) = \text{MSE}(w) + \lambda \sum_j w_j^2 \qquad \text{(L2, "ridge")} $$

- $\lambda$ (lambda) is the **penalty strength**, a setting you choose. It is a **hyperparameter**: set by you, not learned from data.
- $\lambda = 0$ gives ordinary least squares. A huge $\lambda$ pushes all weights to zero and the model underfits.
- L2 shrinks weights smoothly. **L1** (sum of $|w_j|$, called "lasso") can push some weights exactly to zero, which acts like feature selection.

The ridge solution has a closed form, and `fit_ridge` above already uses it. Run this after the block above (it reuses its functions and data). Keep degree 9 and change only $\lambda$:

```python
Xtr, Xte = features(x_tr, 9), features(x_te, 9)
for lam in [0.0, 1e-4, 1e-2, 1.0]:
    w = fit_ridge(Xtr, y_tr, lam)
    print(f"lambda {lam:g}: train {mse(Xtr, y_tr, w):.3f}  test {mse(Xte, y_te, w):.3f}  max|w| {np.abs(w).max():.1f}")
```
Output (degree 9, same data):

| lambda | Train MSE | Test MSE | Largest weight |
|---|---|---|---|
| 0 | 0.033 | 0.631 | about 395,000 |
| 0.0001 | 0.072 | 0.145 | 13.4 |
| 0.01 | 0.109 | 0.295 | 3.3 |
| 1 | 0.251 | 0.462 | 0.4 |

- Without a penalty a weight is about 400,000: a wild curve that squeezes through every point.
- A tiny penalty ($10^{-4}$) cuts test error from 0.631 to 0.145.
- Too much penalty and train error climbs again. The best $\lambda$ is in the middle.

:::warn
Do not pick $\lambda$ by looking at the test set. Choose it on a separate **validation set**, then touch the test set once at the end. Otherwise your test score is optimistic.
:::

```quiz
q: You increase the L2 penalty strength lambda from 0.01 to 1000. What most likely happens?
options:
  - Training error falls and the model fits better
  - All weights shrink toward zero and the model underfits
  - Nothing changes, since lambda only matters for L1
  - Test error is guaranteed to fall
answer: 1
why: "A very large penalty makes small weights worth far more than a good fit, so the model approaches a constant prediction and both errors rise."
```

## Other ways to reduce overfitting

| Method | How it helps | Cost |
|---|---|---|
| More data | The noise averages out | Often expensive or impossible |
| Simpler model | Fewer ways to memorise | May underfit |
| Regularization (L1, L2) | Penalises large weights | One more hyperparameter |
| **Early stopping** | Stop training when validation error stops improving | Needs a validation set |
| **Dropout** (neural nets) | Randomly switch off units during training so none can be relied on | Slower training |
| **Data augmentation** | Create varied copies (flipped images, paraphrases) | Needs domain care |
| **Cross-validation** | Split the data into k folds, train on k-1, validate on the held-out one, rotate | k times the training cost |

```order
prompt: Arrange the safe order for choosing a model and reporting its score.
lang: python
code: |
  train, val, test = split(data, [0.6, 0.2, 0.2])
  for lam in [0.001, 0.01, 0.1, 1.0]:
      model = fit(train, lam)
      scores[lam] = evaluate(model, val)
  best = max(scores, key=scores.get)
  final = fit(train, best)
  print(evaluate(final, test))
distractors:
  - "  scores[lam] = evaluate(model, test)"
why: Fit on train, pick the hyperparameter on validation, report once on test. Scoring candidates on the test set leaks information and inflates the result.
```

:::truth
More flexible models are not bad, and regularization is not a cure. With enough data, large models generalise well. With little data, even a good method only limits the damage. If train and validation data come from different sources, no amount of regularization fixes that gap.
:::

```cards
- q: What is overfitting?
  a: The model fits noise and quirks of the training set, so training error is low but error on new data is much higher.
- q: What does the L2 penalty add to the loss?
  a: "$\\lambda \\sum w_j^2$, which shrinks weights toward zero and discourages wild curves."
- q: Where should you tune hyperparameters such as lambda?
  a: On a validation set, never on the test set. Use the test set once, at the end.
- q: How do L1 and L2 differ in effect?
  a: L2 shrinks all weights smoothly. L1 can set some weights exactly to zero, which acts like feature selection.
- q: What is early stopping?
  a: Stop training when validation error stops improving, even if training error is still falling.
```

## Notes

:::notes
- Generalisation is performance on unseen data. Training error alone is misleading.
- Overfit: low train error, high validation error. Underfit: both high.
- More flexible models always fit the training set better; that proves nothing.
- L2 (ridge) adds $\lambda \sum w^2$ to the loss; L1 (lasso) adds $\lambda \sum |w|$ and can zero out weights.
- Too small lambda overfits, too large underfits. Tune it on a validation set.
- Other tools: more data, simpler model, early stopping, dropout, augmentation, cross-validation.
- Keep the test set untouched until the final report.
:::
