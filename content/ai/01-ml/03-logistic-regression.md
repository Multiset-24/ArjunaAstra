---
title: Logistic Regression
summary: Turn a weighted sum into a probability with the sigmoid, train it with log loss, and choose a decision threshold.
minutes: 35
difficulty: beginner
tags: [classification, sigmoid, log-loss]
prereqs: [linear-regression]
exercises:
  - Compute sigmoid(2) and sigmoid(-2) by hand (e is about 2.718). What do the two values add up to, and why?
  - A model outputs p = 0.9 for an example whose true label is 0. Compute the log loss for that example, then for p = 0.6. Which mistake is punished harder?
  - Change the data generator in the code so both classes have the same mean. What accuracy and loss do you expect, and what do you get?
resources:
  - title: scikit-learn logistic regression
    url: https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression
  - title: Mathematics for Machine Learning (free book)
    url: https://mml-book.github.io/
---

## From numbers to categories

Linear regression predicts any number. For **classification** with two classes (spam or not, 1 or 0) we want a probability between 0 and 1. **Logistic regression** does this in two steps:

1. Compute a score as before: $z = w x + b$. This can be any real number.
2. Squash it into $(0, 1)$ with the **sigmoid** function:

$$ \sigma(z) = \frac{1}{1 + e^{-z}} $$

The output $p = \sigma(z)$ is read as "the probability the label is 1".

Despite the name, it is a classification model. "Regression" is historical: it regresses the score $z$.

## What the sigmoid does

- Very negative $z$ gives $p$ near 0; very positive gives $p$ near 1; $z = 0$ gives exactly 0.5.
- It is smooth, so gradient descent works.
- Large $\lvert z \rvert$ means high confidence. The model's confidence is a number you can inspect, not just a yes or no.

```viz
algo: neuron
input:
  inputs: [1, 0.5]
  weights: [0.8, -0.4]
  bias: 0.1
  activation: sigmoid
```

A single neuron with a sigmoid is exactly logistic regression. Neural networks later stack many of them. Change the weights and see the output move between 0 and 1.

```python
import numpy as np

sigmoid = lambda z: 1 / (1 + np.exp(-z))
print(sigmoid(np.array([-4.0, 0.0, 4.0])).round(3))
```
```output
[0.018 0.5   0.982]
```

```predict
lang: python
code: |
  import numpy as np
  z = 0.0
  print(1 / (1 + np.exp(-z)))
output: "0.5"
why: exp(0) is 1, so the result is 1 / (1 + 1) = 0.5. A score of zero means the model is undecided.
```

## Loss: log loss

Squared error works poorly for probabilities. The standard choice is **log loss** (also called binary cross-entropy). For one example with true label $y$ and predicted probability $p$:

$$ \ell = -\big[\, y \log p + (1 - y) \log (1 - p) \,\big] $$

Reading it:

- If $y = 1$, the loss is $-\log p$: small when $p$ is near 1, huge when $p$ is near 0.
- If $y = 0$, the loss is $-\log(1 - p)$: small when $p$ is near 0.
- Being confidently wrong is punished very hard. Predicting $p = 0.01$ for a true 1 costs $-\log 0.01 \approx 4.6$.

```quiz
q: A model predicts p = 0.99 for an example whose true label is 0. Compared with predicting p = 0.6, the log loss is
options:
  - Slightly higher
  - Much higher
  - The same, since both are wrong
answer: 1
why: For label 0 the loss is -log(1 - p). With p = 0.99 that is -log(0.01), about 4.6. With p = 0.6 it is -log(0.4), about 0.9. Confident mistakes are punished heavily.
```

## Training it

Combining the sigmoid with log loss gives a clean gradient. Per example, with error $p - y$:

$$ \frac{\partial \ell}{\partial w} = (p - y)\, x \qquad \frac{\partial \ell}{\partial b} = p - y $$

Compare with linear regression: the same form (prediction minus truth, times the input), only $p$ replaces $\hat{y}$. That is not a coincidence, and it recurs in neural networks.

```python
import numpy as np
rng = np.random.default_rng(0)
n = 200
x = np.concatenate([rng.normal(-1, 1, n // 2), rng.normal(1, 1, n // 2)])
y = np.concatenate([np.zeros(n // 2), np.ones(n // 2)])

sigmoid = lambda z: 1 / (1 + np.exp(-z))
w, b, lr = 0.0, 0.0, 0.5
for step in range(500):
    p = sigmoid(w * x + b)
    w -= lr * np.mean((p - y) * x)     # gradient of log loss
    b -= lr * np.mean(p - y)
p = sigmoid(w * x + b)
loss = -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
acc = np.mean((p >= 0.5) == y)
print(round(w, 2), round(b, 2), round(loss, 3), acc)
```
```output
1.84 -0.06 0.381 0.815
```

- Class 0 is centred at -1, class 1 at +1, and they overlap, so perfect accuracy is impossible.
- The learned boundary sits where $wx + b = 0$, which is near $x = 0$, the midpoint between the classes.
- Accuracy of 81.5% is near what the overlap allows.

```blanks
prompt: Complete one gradient step for logistic regression.
lang: python
code: |
  p = sigmoid(w * x + b)
  w -= lr * np.mean((p - [[y]]) * x)
  b -= lr * np.mean([[p - y|p-y]])
why: The error is the predicted probability minus the true label, and the weight gradient multiplies it by the input.
```

## Threshold and decision boundary

The model outputs a probability; you decide what to do with it. The default rule predicts 1 when $p \ge 0.5$.

- The **decision boundary** is where $p = 0.5$, that is, where the score $z = 0$. For two features it is a straight line.
- The **threshold** need not be 0.5. A medical screening tool might flag anything above 0.1, accepting more false alarms to miss fewer cases.
- Moving the threshold trades one kind of error for another. The next lesson shows how to measure that trade.

:::warn
Logistic regression draws a straight boundary. If the classes are arranged in rings or XOR patterns, no weights will separate them. You need extra features or a non-linear model.
:::

## More than two classes: softmax

For $k$ classes, give each class its own score and use **softmax** to turn all scores into probabilities that sum to 1. The viz below lets you change scores and the temperature (a knob that sharpens or flattens the result).

```viz
algo: softmax
input:
  logits: [2, 1, 0.5, -1]
  labels: [cat, dog, fox, car]
  temperature: 1
```

Language models use the same softmax over their whole vocabulary to pick the next word.

:::truth
The raw probabilities from a trained model are not always trustworthy. A model that says 90% may be right only 70% of the time. This is called poor **calibration**, and you check it instead of assuming it.
:::

```cards
- q: What does the sigmoid function do?
  a: "Maps any real score to (0, 1): $\\sigma(z) = 1/(1+e^{-z})$. Zero maps to 0.5."
- q: What is log loss for one example?
  a: "$-[y\\log p + (1-y)\\log(1-p)]$. Small when confident and right, huge when confident and wrong."
- q: What is the logistic regression gradient for the weight?
  a: "$(p - y)\\,x$ per example, averaged over the data; for the bias it is $p - y$."
- q: Where is the decision boundary?
  a: Where the score z = 0, that is, where p = 0.5 with the default threshold.
- q: Why might you change the threshold from 0.5?
  a: To trade false alarms against misses, depending on which mistake costs more.
- q: What does softmax do?
  a: Turns k scores into k probabilities that sum to 1.
```

## Notes

:::notes
- Logistic regression: score z = w x + b, then probability p = sigmoid(z).
- Sigmoid squashes any number into (0, 1); z = 0 gives 0.5.
- Loss is log loss: confident wrong answers are punished heavily.
- Gradients: dw = mean((p - y) * x), db = mean(p - y). Same shape as linear regression.
- Decision boundary is z = 0, a straight line or plane; classes that need a curve need more features.
- The 0.5 threshold is a choice; move it to trade false alarms for misses.
- Softmax extends this to many classes and powers LLM next-word prediction.
- Predicted probabilities may be miscalibrated; check, do not assume.
:::
