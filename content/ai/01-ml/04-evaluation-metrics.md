---
title: Evaluation Metrics
summary: Accuracy, precision, recall and F1 from the confusion matrix, the effect of class imbalance, and how to pick a metric.
minutes: 35
difficulty: beginner
tags: [metrics, classification, evaluation]
prereqs: [logistic-regression, probability-and-statistics]
exercises:
  - A fraud model on 10,000 transactions (50 are fraud) catches 40 frauds and wrongly flags 160 honest ones. Fill in the confusion matrix and compute accuracy, precision, recall and F1.
  - You are building a smoke-alarm classifier. Would you raise or lower the threshold from 0.5, and which metric are you protecting? Now answer for a spam filter that sends mail to the trash.
  - Write a function that takes y_true, scores and a list of thresholds and returns precision and recall per threshold. Check it against the table in this lesson.
resources:
  - title: scikit-learn model evaluation
    url: https://scikit-learn.org/stable/modules/model_evaluation.html
  - title: Google ML Crash Course, classification metrics
    url: https://developers.google.com/machine-learning/crash-course/classification
---

## Why accuracy is not enough

**Accuracy** is the fraction of predictions that are correct. It is easy to compute and easy to misread.

Suppose 10 of 100 emails are spam. A "model" that always says "not spam" is right 90 times out of 100. Accuracy 90%, and it catches nothing.

```python
import numpy as np
y_true = np.array([1]*10 + [0]*90)
y_pred = np.zeros(100, dtype=int)         # always predict "negative"
print((y_true == y_pred).mean())
```
```output
0.9
```

This is **class imbalance**: one class is much rarer than the other. Fraud, disease and defects are all rare, and accuracy hides failure on the class you care about.

## The confusion matrix

Count the four ways a binary prediction can turn out, taking "positive" as the class you are hunting for:

| | Predicted positive | Predicted negative |
|---|---|---|
| **Actually positive** | TP (true positive): caught | FN (false negative): missed |
| **Actually negative** | FP (false positive): false alarm | TN (true negative): correctly ignored |

Everything else is built from these four numbers.

## Precision, recall, F1

- **Precision** = TP / (TP + FP). Of everything flagged, how much was right? It punishes false alarms.
- **Recall** (also called sensitivity) = TP / (TP + FN). Of everything real, how much did we catch? It punishes misses.
- **F1** = $2PR/(P+R)$, the harmonic mean of the two. It is low if either is low. The harmonic mean is a kind of average that is dragged toward the smaller number.

```python
import numpy as np
y_true = np.array([1]*10 + [0]*90)
y_pred = np.zeros(100, dtype=int)
y_pred[:6] = 1          # catches 6 of the 10 positives
y_pred[10:14] = 1       # and raises 4 false alarms

tp = int(((y_pred == 1) & (y_true == 1)).sum())
fp = int(((y_pred == 1) & (y_true == 0)).sum())
fn = int(((y_pred == 0) & (y_true == 1)).sum())
tn = int(((y_pred == 0) & (y_true == 0)).sum())
precision = tp / (tp + fp)
recall = tp / (tp + fn)
f1 = 2 * precision * recall / (precision + recall)
print(tp, fp, fn, tn)
print(precision, recall, round(f1, 2))
print((tp + tn) / 100)
```
```output
6 4 4 86
0.6 0.6 0.6
0.92
```

Accuracy is 92%, yet the model misses 4 of 10 real positives. Precision and recall show it.

```quiz
q: A cancer screening model must not miss real cases, and follow-up tests are cheap. Which metric matters most?
options:
  - Precision, because every flagged patient should truly have cancer
  - Recall, because missing a real case is the costly mistake
  - Accuracy, because it counts everything
answer: 1
why: Missing a case (a false negative) is far worse than a false alarm that a cheap follow-up test clears. Optimise recall, and accept lower precision.
```

## Thresholds trade one for the other

A probabilistic classifier gives scores; the **threshold** decides what counts as positive. Lower it and you flag more: recall rises, precision usually falls.

```python
import numpy as np
y_true = np.array([1, 1, 1, 1, 0, 0, 0, 0, 0, 0])
scores = np.array([0.95, 0.80, 0.55, 0.30, 0.70, 0.45, 0.35, 0.20, 0.10, 0.05])
for t in (0.3, 0.5, 0.7):
    pred = (scores >= t).astype(int)
    tp = int(((pred == 1) & (y_true == 1)).sum())
    fp = int(((pred == 1) & (y_true == 0)).sum())
    fn = int(((pred == 0) & (y_true == 1)).sum())
    print(t, "precision", round(tp / (tp + fp), 2), "recall", round(tp / (tp + fn), 2))
```
```output
0.3 precision 0.57 recall 1.0
0.5 precision 0.75 recall 0.75
0.7 precision 0.67 recall 0.5
```

At 0.3 nothing real is missed but nearly half the flags are wrong. At 0.7 flags are cleaner but half the real cases slip through. Notice precision is not strictly monotonic: with few examples it bounces.

Two summaries of the whole sweep are common:

- **ROC curve** plots recall against the false-alarm rate across thresholds. **AUC** (area under the curve) is the chance a random positive scores higher than a random negative: 0.5 is guessing, 1.0 is perfect.
- **Precision-recall curve**, often more informative than ROC when positives are rare.

```predict
lang: python
code: |
  tp, fp, fn = 8, 2, 8
  p = tp / (tp + fp)
  r = tp / (tp + fn)
  print(round(p, 2), round(r, 2))
output: 0.8 0.5
why: Precision is 8 / 10 = 0.8. Recall is 8 / 16 = 0.5. The model is careful but misses half the real positives.
```

## The base rate bites again

Even an excellent model produces many false alarms when positives are rare.

```estimate
q: A detector has 99% recall and a 1% false-alarm rate. Only 1% of items are truly positive. Of the items it flags, roughly what percent are truly positive?
answer: 50
unit: "%"
tolerance: 0.2
hint: Take 10,000 items. How many positives are there, and how many negatives get falsely flagged?
solution: "10,000 items give 100 positives and 9,900 negatives. Flagged true positives are 99. Flagged negatives are 1% of 9,900, which is 99. Precision is 99 / 198, exactly 50%."
```

## Regression metrics

For numeric predictions, compare to the true value:

- **MAE** (mean absolute error): the average size of the miss, in the original units. Easy to explain.
- **RMSE** (root mean squared error): the square root of MSE. Also in original units, but large misses weigh more.

```blanks
prompt: Compute MAE and RMSE for arrays y and p.
lang: python
code: |
  mae = np.mean(np.abs(y - p))
  rmse = np.[[sqrt]](np.mean((y - p) [[** 2|**2]]))
why: MAE averages absolute errors. RMSE squares the errors, averages, then takes the square root to return to the original units.
```

With `y = [3, 5, 8]` and `p = [2, 5, 11]`, MAE is 1.33 and RMSE is 1.83. RMSE is larger because the miss of 3 counts extra.

## Choosing a metric

1. Write down the cost of each kind of mistake in the real product.
2. Pick the metric that matches (recall for misses, precision for false alarms, F1 for balance).
3. Report it on a held-out test set, with a confidence interval if the set is small.
4. Look at examples, not only numbers. The errors tell you what to fix.

:::truth
Metrics are proxies. A model can score well and still annoy users. For LLM features there often is no single number; teams combine automatic checks, human review and spot reading of outputs. The principle stays: write the test before you trust the change.
:::

```cards
- q: Why can accuracy mislead?
  a: With imbalanced classes, predicting the majority class gives high accuracy while catching none of the rare class.
- q: Define precision.
  a: "TP / (TP + FP): of the items flagged positive, the fraction that truly are."
- q: Define recall.
  a: "TP / (TP + FN): of the real positives, the fraction the model caught."
- q: What does F1 combine and why harmonic mean?
  a: Precision and recall; the harmonic mean is low whenever either one is low.
- q: What happens to precision and recall when you lower the threshold?
  a: Recall rises (more flagged) and precision usually falls (more false alarms).
- q: What does AUC of 0.5 mean?
  a: The model ranks positives above negatives no better than chance.
```

## Notes

:::notes
- Accuracy hides failure under class imbalance; always look at the confusion matrix (TP, FP, FN, TN).
- Precision = TP / (TP + FP): cost of false alarms. Recall = TP / (TP + FN): cost of misses.
- F1 = harmonic mean of precision and recall; low if either is low.
- Lower threshold: more recall, less precision. Pick the threshold from the real cost of each mistake.
- ROC-AUC is the chance a random positive outranks a random negative; 0.5 is guessing.
- Rare positives mean low precision even for good models (base rate effect).
- Regression: MAE is the average miss; RMSE punishes large misses more.
- Metrics are proxies; read real errors and use a held-out test set.
:::
