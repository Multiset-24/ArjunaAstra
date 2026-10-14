---
title: Probability and Statistics
summary: Probability, expectation, Bayes' rule, distributions and sampling, the vocabulary every model evaluation uses.
minutes: 35
difficulty: beginner
tags: [probability, statistics, bayes]
prereqs: [math-for-ml]
exercises:
  - A spam filter flags 2% of all email as spam, and 90% of spam gets flagged. If 10% of email is spam, what fraction of flagged email is truly spam? Work it out with Bayes' rule, then check with a simulation.
  - Simulate 10,000 rolls of a fair die with NumPy. Print the mean after 10, 100 and 10,000 rolls and compare each to 3.5.
  - Two model versions score 81% and 83% on a 100-question test. Use a bootstrap to decide whether that gap is believable or could be noise.
resources:
  - title: Think Stats (free book)
    url: https://greenteapress.com/wp/think-stats-2e/
  - title: NumPy random Generator
    url: https://numpy.org/doc/stable/reference/random/generator.html
---

## Why probability

A model rarely knows the answer; it holds a degree of belief. A classifier says "92% spam". A language model assigns a probability to every possible next word. Evaluating models means reasoning about noisy measurements. Probability is the language for all of this.

## The basics

A **probability** is a number from 0 (impossible) to 1 (certain) for how likely an event is.

- The probabilities of all outcomes of one experiment add up to 1.
- $P(A)$ means the probability of event A. $P(\text{not } A) = 1 - P(A)$.
- **Conditional probability** $P(A \mid B)$ is the probability of A given that B happened: "the chance of rain given dark clouds".
- Two events are **independent** if knowing one tells you nothing about the other, so $P(A \text{ and } B) = P(A)\,P(B)$.

:::warn
Do not assume independence because it makes the maths easy. Two words in the same sentence, or two users from the same city, are rarely independent.
:::

## Expectation, variance, standard deviation

- **Expected value** (the mean you would get over many repeats): $E[X] = \sum x \, P(x)$. A fair die gives $(1+2+3+4+5+6)/6 = 3.5$.
- **Variance** is the average squared distance from the mean. It measures spread.
- **Standard deviation** is the square root of the variance, in the same units as the data.

```quiz
questions:
  - q: A coin pays 10 rupees on heads and 0 on tails. What is the expected payout per flip?
    options:
      - 0 rupees
      - 5 rupees
      - 10 rupees
    answer: 1
    why: "0.5 * 10 + 0.5 * 0 = 5. You never actually receive 5 on a single flip; the expectation is the long-run average."
  - q: Which dataset has the larger standard deviation, [49, 50, 51] or [10, 50, 90]?
    options:
      - "[49, 50, 51]"
      - "[10, 50, 90]"
      - They are equal because both have mean 50
    answer: 1
    why: Standard deviation measures spread around the mean. Both means are 50, but the second set is far more spread out.
```

## Bayes' rule

**Bayes' rule** flips a conditional probability. It tells you how to update a belief after seeing evidence:

$$ P(A \mid B) = \frac{P(B \mid A)\,P(A)}{P(B)} $$

Here $P(A)$ is the **prior** (belief before evidence) and $P(A \mid B)$ is the **posterior** (belief after).

A test for a disease is 99% **sensitive** (it flags 99% of sick people) and 95% **specific** (it clears 95% of healthy people). Only 1% of people are sick. You test positive. How likely are you sick?

```python
prior, sens, spec = 0.01, 0.99, 0.95
p_pos = sens * prior + (1 - spec) * (1 - prior)
posterior = sens * prior / p_pos
print(round(posterior, 3))
```
```output
0.167
```

About 17%, not 99%. Most positive results come from the large healthy group.

```predict
lang: python
code: |
  prior, sens, spec = 0.5, 0.99, 0.95
  p_pos = sens * prior + (1 - spec) * (1 - prior)
  print(round(sens * prior / p_pos, 2))
output: "0.95"
why: With a 50% prior, the healthy and sick groups are the same size, so the posterior is sens / (sens + (1 - spec)) = 0.99 / 1.04, about 0.95. The prior matters a lot.
```

:::key
The base rate (prior) matters. A good classifier applied to a rare event still produces mostly false alarms. This returns in the evaluation metrics lesson as precision.
:::

## Distributions

A **distribution** describes how likely each value is.

| Name | Describes | Example |
|---|---|---|
| Bernoulli | One yes/no trial with probability p | A single click or no click |
| Binomial | Number of yeses in n trials | Clicks out of 100 views |
| Uniform | All values in a range equally likely | A random number in [0, 1) |
| Normal (Gaussian) | A bell curve around a mean | Heights, measurement noise |
| Categorical | One choice among k options | The next word from a vocabulary |

The normal distribution is common because averages of many small effects tend to look normal (the **central limit theorem**). A categorical distribution over a vocabulary is exactly what a language model outputs.

## Sampling and the law of large numbers

A **sample** is a handful of draws from a distribution. The **law of large numbers** says the sample mean approaches the true mean as the sample grows.

```python
import numpy as np
rng = np.random.default_rng(0)

flips = rng.integers(0, 2, size=10_000)
for n in (10, 100, 10_000):
    print(n, flips[:n].mean())
```
```output
10 0.4
100 0.56
10000 0.503
```

Small samples are noisy: 10 flips gave 0.4 and 100 gave 0.56, while 10,000 landed within 0.003 of the truth. Treat an eval on 20 examples with the same suspicion.

## How sure are you? Bootstrap

A model scores 5.0 on average over 8 test cases. How much would that move with different cases? The **bootstrap** answers this: resample your own data with replacement many times, compute the mean each time, and look at the spread.

```python
import numpy as np
rng = np.random.default_rng(0)

sample = np.array([4.1, 5.0, 5.3, 6.2, 4.8, 5.9, 5.1, 4.4])
means = [rng.choice(sample, size=len(sample), replace=True).mean()
         for _ in range(2000)]
print(np.round(np.percentile(means, [2.5, 97.5]), 2))
```
```output
[4.65 5.55]
```

The middle 95% of resampled means runs from about 4.65 to 5.55. A claimed improvement smaller than that width is hard to distinguish from luck.

:::truth
Most "improvements" reported from small test sets are within noise. Before celebrating a 2-point gain, ask how many examples were tested and how much the score moves if you swap them.
:::

```blanks
prompt: Complete the Bayes' rule posterior.
lang: python
code: |
  p_pos = sens * prior + (1 - spec) * (1 - prior)
  posterior = [[sens * prior]] / [[p_pos]]
why: The numerator is P(positive and sick). The denominator is P(positive) over both groups, sick and healthy.
```

```cards
- q: What is conditional probability P(A | B)?
  a: The probability of A given that B has happened.
- q: State Bayes' rule.
  a: "$P(A \\mid B) = P(B \\mid A)\\,P(A) / P(B)$: posterior = likelihood times prior, divided by evidence."
- q: What does the law of large numbers say?
  a: The sample mean approaches the true mean as the sample size grows.
- q: Why can a 99% accurate test still give mostly false alarms?
  a: When the event is rare, healthy cases vastly outnumber sick ones, so even a small false-positive rate produces many false alarms.
- q: What is a bootstrap?
  a: Resampling your data with replacement many times to see how much a statistic (like a mean) varies.
```

## Notes

:::notes
- Probability runs from 0 to 1; outcomes of one experiment sum to 1.
- P(A | B) is the chance of A given B; independence means P(A and B) = P(A) P(B).
- Expected value is the long-run average; variance is average squared distance from the mean; standard deviation is its square root.
- Bayes' rule: posterior = likelihood * prior / evidence. Base rates matter.
- Common distributions: Bernoulli, binomial, uniform, normal, categorical (what a language model outputs).
- Law of large numbers: sample means converge; small samples are noisy.
- Bootstrap: resample with replacement to estimate how uncertain a score is.
- Differences smaller than the noise are not evidence.
:::
