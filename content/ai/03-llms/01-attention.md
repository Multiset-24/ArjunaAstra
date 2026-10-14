---
title: Attention
summary: How each token in a sequence looks at every other token and mixes in the information it needs, using queries, keys and values.
minutes: 35
difficulty: intermediate
tags: [attention, transformers, llm]
prereqs: [neural-networks, embeddings, math-for-ml]
exercises:
  - In the attention heatmap above, change the sentence to one with two possible referents ("the trophy didn't fit in the suitcase because it was too big"). Which tokens does "it" attend to? Remember the vectors are toy values, so write down what you would need to change for the heatmap to be meaningful.
  - By hand, compute softmax over scores [0, 0, 1] to two decimals. Then divide the scores by 2 first and recompute. Which result is sharper, and why?
  - For a sequence of 8,000 tokens, how many entries does the score matrix have? At 2 bytes each, how many megabytes is that for one head in one layer? What does that suggest about long inputs?
resources:
  - title: Attention Is All You Need
    url: https://arxiv.org/abs/1706.03762
  - title: Neural Machine Translation by Jointly Learning to Align and Translate
    url: https://arxiv.org/abs/1409.0473
---

## Intuition

Take the sentence "The animal didn't cross the street because **it** was tired." To understand "it", you look back and decide that it means "animal", not "street".

**Attention** is a mechanism that lets each token (a word or word piece) do the same thing: look at every other token, decide how relevant each one is, and pull in a weighted mix of their information.

- Input: one vector per token. A **vector** is a list of numbers; an **embedding** is a vector that represents a token's meaning.
- Output: one new vector per token, now enriched by the tokens it looked at.
- The weights are not fixed rules. They are computed fresh for every input.

:::key
Attention is a soft lookup. Each token asks a question, every token offers a label, and the answer is a blend of the contents of the best matches.
:::

## Queries, keys and values

Each token's vector is turned into three new vectors by three learned weight matrices (tables of numbers adjusted during training):

| Name | Symbol | Plain meaning |
|---|---|---|
| Query | $q$ | What I am looking for |
| Key | $k$ | What I contain, as a label others can match against |
| Value | $v$ | The information I hand over if I am chosen |

A library analogy: the query is your search phrase, the keys are book titles, the values are the books' contents. You do not pick one book. You get a blend, weighted by how well each title matches.

## The math

Stack all queries into a matrix $Q$, keys into $K$, values into $V$ (one row per token). Then:

$$ \text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right) V $$

Read it from the inside out:

1. $QK^\top$: the dot product of every query with every key. A **dot product** multiplies two vectors entry by entry and sums; it is large when they point the same way. This gives an $n \times n$ table of match scores for $n$ tokens.
2. Divide by $\sqrt{d_k}$, where $d_k$ is the key vector length. Dot products grow with vector length, and huge scores make softmax almost one-hot with tiny gradients, so training stalls.
3. **Softmax** turns each row of scores into positive numbers that sum to 1. These are the attention weights.
4. Multiply by $V$: each output is the weighted average of the value vectors.

```viz
algo: attention
input:
  sentence: the animal didn't cross the street because it was tired
```

:::warn
The heatmap uses toy vectors, not a trained model. It shows the shape of the computation. In a real model the matrices are learned, so patterns like "it looks at animal" emerge from training rather than being typed in.
:::

```quiz
q: Why divide the scores by $\sqrt{d_k}$ before softmax?
options:
  - To make the weights sum to 1
  - To keep scores from growing with vector length, which would make softmax too sharp and gradients tiny
  - To remove the need for the value matrix
  - To make the model attend to earlier tokens only
answer: 1
why: "Softmax already makes rows sum to 1. Without scaling, dot products of long vectors get large, the largest score dominates, and the gradient through softmax almost vanishes."
```

Softmax on its own is worth a minute. Raise one score and watch the others shrink; the weights always sum to 1.

```viz
algo: softmax
input:
  logits: [3, 1, 0.5, -1]
  labels: ["it", "animal", "street", "tired"]
  temperature: 1
```

## Code

```python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)   # subtract max for numerical safety
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)

def attention(Q, K, V, causal=False):
    d = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d)              # (n, n): how well each query matches each key
    if causal:
        mask = np.triu(np.ones_like(scores, dtype=bool), k=1)
        scores = np.where(mask, -np.inf, scores)   # block looking at later tokens
    weights = softmax(scores)                  # each row sums to 1
    return weights @ V, weights

rng = np.random.default_rng(0)
X = rng.normal(size=(3, 4))                    # 3 tokens, 4 numbers each
Wq, Wk, Wv = (rng.normal(size=(4, 4)) for _ in range(3))
out, w = attention(X @ Wq, X @ Wk, X @ Wv)
print(np.round(w, 2))
print(w.sum(axis=1))
_, wc = attention(X @ Wq, X @ Wk, X @ Wv, causal=True)
print(np.round(wc, 2))
```
```output
[[0.38 0.3  0.32]
 [0.32 0.21 0.47]
 [0.05 0.01 0.94]]
[1. 1. 1.]
[[1.   0.   0.  ]
 [0.61 0.39 0.  ]
 [0.05 0.01 0.94]]
```

```blanks
prompt: Complete the core of attention.
lang: python
code: |
  scores = Q @ K.T / np.sqrt([[d]])
  weights = softmax(scores)
  out = weights @ [[V]]
why: Scores come from queries against keys, scaled by the square root of the key length. The weights then average the value vectors.
```

## Causal masking

A model that writes text must not peek at future words. In **causal** (also called decoder-style) attention, scores for later positions are set to $-\infty$ before softmax, so their weights become exactly 0.

- Token 1 sees only itself (first row above: `[1, 0, 0]`).
- Token 3 sees tokens 1 to 3.
- This lets one pass train on every position at once, since each position only uses its past.

```predict
lang: python
code: |
  import numpy as np
  scores = np.array([[1.0, 5.0, 9.0],
                     [1.0, 5.0, 9.0],
                     [1.0, 5.0, 9.0]])
  mask = np.triu(np.ones((3, 3), dtype=bool), k=1)
  scores = np.where(mask, -np.inf, scores)
  e = np.exp(scores - scores.max(axis=1, keepdims=True))
  w = e / e.sum(axis=1, keepdims=True)
  print(w[0].round(2))
output: "[1. 0. 0.]"
why: Row 0 can only see column 0, because columns 1 and 2 are masked to minus infinity. Softmax over a single allowed score is 1.
```

## Multi-head attention

One attention pattern is not enough. A token may need to track grammar, a pronoun's referent and a nearby word at once.

- **Multi-head attention** runs several attention computations (heads) in parallel, each with its own $W_Q$, $W_K$, $W_V$.
- Each head works on a smaller slice: with model width $d$ and $h$ heads, each head uses $d/h$ numbers.
- Head outputs are concatenated and mixed by one more matrix.
- Heads often specialise, but the roles are learned and messy. Do not expect a neat "grammar head" in every model.

## Cost

The score matrix is $n \times n$. Doubling the input length quadruples the work and memory for that step.

:::truth
This quadratic cost is why long context is expensive. Production systems use tricks (fused kernels such as FlashAttention, caching, sparse patterns) that cut memory and time, but they do not change the basic fact that every token can look at every other.
:::

```cards
- q: What are queries, keys and values?
  a: Three vectors per token from learned matrices. A query says what it wants, a key says what it offers, a value is the content passed on.
- q: Write the attention formula.
  a: '$\text{softmax}(QK^\top / \sqrt{d_k})\,V$'
- q: Why scale by $\sqrt{d_k}$?
  a: Dot products grow with vector length; unscaled scores make softmax too sharp and gradients tiny.
- q: What does a causal mask do?
  a: Sets scores for future positions to minus infinity, so their weights are 0 and a token only sees its past.
- q: Why does attention cost grow quadratically with length?
  a: Every token scores against every token, giving an $n \times n$ matrix.
```

## Notes

:::notes
- Attention lets each token build a new vector as a weighted mix of all tokens' value vectors.
- Q (query) = what I look for, K (key) = my label, V (value) = what I give.
- Formula: softmax(Q K^T / sqrt(d_k)) V. Softmax makes each row of weights sum to 1.
- Dividing by sqrt(d_k) keeps softmax from saturating as vectors get longer.
- Causal mask: future scores set to minus infinity, weights become 0. Used by text-generating models.
- Multi-head: several smaller attentions in parallel, outputs concatenated.
- Cost is O(n^2) in sequence length for the score matrix; that is the root of long-context cost.
- Heatmaps of attention are a useful picture, not a full explanation of what a model does.
:::
