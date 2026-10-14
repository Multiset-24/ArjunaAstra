---
title: Embeddings
summary: Turn words, images or any item into a vector of numbers so that similar things land close together, then compare them with cosine similarity.
minutes: 30
difficulty: intermediate
tags: [embeddings, cosine-similarity, vectors, representation]
prereqs: [math-for-ml, neural-networks, training-deep-networks]
exercises:
  - Add the words "bus" and "rabbit" to the toy vocabulary with vectors you choose. Check that "rabbit" is closest to "cat" and "dog", and "bus" is closest to "car" and "truck".
  - Normalise every vector in the toy vocabulary to length 1. Show that the dot product of two normalised vectors equals their cosine similarity.
  - Think of a search box over 10,000 product descriptions. Write down how you would use embeddings to answer "warm jacket for rain", and one failure case where keyword search would do better.
resources:
  - title: Efficient Estimation of Word Representations in Vector Space (word2vec)
    url: https://arxiv.org/abs/1301.3781
  - title: PyTorch docs - torch.nn.Embedding
    url: https://pytorch.org/docs/stable/generated/torch.nn.Embedding.html
---

## The problem: computers need numbers

A model cannot do arithmetic on the word "cat". The first idea is a **one-hot vector**: a vector as long as the vocabulary, all zeros except a single 1 at the word's position.

- With 50,000 words, every word is a 50,000-long vector.
- Every pair of words is equally far apart. "cat" is no closer to "dog" than to "tractor".
- Nothing about meaning is stored.

An **embedding** replaces this with a short, dense vector, for example 384 numbers, where **distance carries meaning**. Similar things get nearby vectors.

| | One-hot | Embedding |
|---|---|---|
| Length | Vocabulary size (tens of thousands) | Fixed, typically 64 to 4096 |
| Values | Single 1, rest 0 | Real numbers, all used |
| Similarity | None | Close vectors mean similar items |
| Learned? | No | Yes, from data |

## Where the numbers come from

Embeddings are **learned**, not designed. Inside a network, an embedding layer is a lookup table with one row per item; training adjusts the rows so they help the task.

The classic example is **word2vec** (2013). Its idea: words that appear in similar contexts have similar meanings ("you shall know a word by the company it keeps"). Train a small model to predict a word from its neighbours, and the table of word vectors becomes useful as a by-product.

Modern embedding models (for sentences, documents, images, code) are neural networks trained so that related inputs produce nearby vectors. You send text in, get a vector out, and compare vectors. Many APIs and open-source libraries offer this.

Requires PyTorch (not installed here); a lookup table is one line:

```python
# Requires PyTorch
import torch
from torch import nn

emb = nn.Embedding(num_embeddings=10_000, embedding_dim=64)   # 10,000 items, 64 numbers each
ids = torch.tensor([3, 17, 3])
print(emb(ids).shape)          # torch.Size([3, 64]); rows 3 and 3 are identical
```

The table starts random and the rows become meaningful through training.

```quiz
q: Why is a one-hot vector a poor representation of words?
options:
  - It uses too few numbers
  - It cannot be fed into a neural network
  - All words are equally far apart, so no similarity is captured
  - It always produces negative numbers
answer: 2
why: "Any two different one-hot vectors are orthogonal (their dot product is 0), so 'cat' is as far from 'dog' as from 'tractor'. It also wastes memory. A network can use one-hot input, but it learns nothing about similarity from it."
```

## Measuring similarity

Two common measures between vectors $a$ and $b$:

- **Euclidean distance**: the straight-line distance. Small means similar.
- **Cosine similarity**: the cosine of the angle between them.

$$ \cos(a, b) = \frac{a \cdot b}{\lVert a \rVert \, \lVert b \rVert} $$

Here $a \cdot b$ is the **dot product** (multiply matching entries, add them up) and $\lVert a \rVert$ is the length of $a$.

- Ranges from -1 (opposite) through 0 (unrelated, at a right angle) to 1 (same direction).
- It ignores length and compares direction only. A long document and a short note about the same topic can still match.
- If vectors are scaled to length 1, cosine similarity is just the dot product, which is why vector search engines like that setup.

Drag the vectors, or edit the numbers, to see how the angle changes the score.

```viz
algo: cosine
input:
  a: [3, 1]
  b: [1, 2]
```

```predict
lang: python
prompt: What is the cosine similarity of these two vectors?
code: |
  import numpy as np
  a = np.array([1.0, 2.0])
  b = np.array([2.0, 4.0])
  cos = a @ b / (np.linalg.norm(a) * np.linalg.norm(b))
  print(round(float(cos), 2))
output: "1.0"
why: "b is exactly 2 times a, so they point the same way. Cosine ignores length, so the similarity is 1 even though b is twice as long."
```

## Nearest neighbours in code

A toy vocabulary with three made-up dimensions (animal-ness, vehicle-ness, size). Real embeddings have hundreds of dimensions that no human labelled, but the arithmetic is the same.

```python
import numpy as np

# Toy word vectors: [animal-ness, vehicle-ness, size]
vocab = {
    "cat":   np.array([0.9, 0.0, 0.2]),
    "dog":   np.array([0.8, 0.1, 0.4]),
    "car":   np.array([0.0, 0.9, 0.6]),
    "truck": np.array([0.1, 0.8, 0.9]),
}

def cosine(a, b):
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

def nearest(query, k=2):
    q = vocab[query]
    scores = {w: cosine(q, v) for w, v in vocab.items() if w != query}
    return sorted(scores.items(), key=lambda kv: -kv[1])[:k]

for w, s in nearest("cat", k=3):
    print(f"cat ~ {w}: {s:.2f}")
print("car ~ truck:", round(cosine(vocab["car"], vocab["truck"]), 2))
```
```output
cat ~ dog: 0.96
cat ~ truck: 0.24
cat ~ car: 0.12
car ~ truck: 0.96
```

This is the core of **semantic search**: embed the query, embed every document once, and return the documents with the highest cosine similarity. For millions of items, exact comparison against everything is too slow, so systems use **approximate nearest neighbour** indexes that trade a little accuracy for speed. The later lessons on retrieval and vector databases build on this.

```blanks
prompt: Complete the semantic search function.
lang: python
code: |
  def search(query_vec, doc_vecs, k=3):
      scores = doc_vecs @ query_vec              # assumes unit-length vectors
      top = np.[[argsort]](-scores)[:k]
      return top, scores[top]
why: With unit-length vectors the dot product equals cosine similarity. Sorting the negative scores puts the highest similarity first.
```

## What embeddings are used for

- **Search and retrieval**: find text by meaning, not exact words. This powers RAG (retrieval-augmented generation: look up relevant text, then give it to an LLM).
- **Recommendations**: users and items in one space; recommend the nearest items.
- **Clustering and deduplication**: group similar items, find near-duplicates.
- **Classification features**: feed embeddings into a simple classifier such as logistic regression. Often a strong baseline with little data.
- **Inputs to bigger models**: transformers begin with an embedding table for tokens.

## What goes wrong

:::warn
Embeddings from different models are not comparable. A vector from model A means nothing next to a vector from model B, and changing the model means re-embedding everything.
:::

- **Domain mismatch**: a model trained on general web text may place two legal terms close that a lawyer would keep apart. Test on your own data.
- **Bias**: embeddings absorb stereotypes from their training text. Do not treat the geometry as neutral.
- **Not a fact store**: "nearby" means "appears in similar contexts", not "is true" or "is the same". Negation is a known weak spot: "the room is clean" and "the room is not clean" can land close.
- **Famous analogies** (king - man + woman is near queen) work in a few chosen examples and fail often. Do not rely on them.

:::truth
Cosine similarity scores are only meaningful relative to each other within one model. A score of 0.8 might be a strong match in one model and a weak one in another. Pick thresholds by looking at real examples from your data.
:::

```cards
- q: What is an embedding?
  a: A dense vector of real numbers that represents an item, learned so that similar items have nearby vectors.
- q: Cosine similarity formula and range?
  a: "$\\cos(a,b) = a \\cdot b / (\\lVert a \\rVert \\lVert b \\rVert)$, from -1 (opposite) through 0 (unrelated) to 1 (same direction)."
- q: Why does cosine similarity ignore vector length?
  a: It divides by both lengths, so it compares only direction. For unit-length vectors it equals the dot product.
- q: What idea did word2vec use?
  a: Words in similar contexts have similar meanings, so it trained vectors to predict a word from its neighbours.
- q: Can you compare vectors from two different embedding models?
  a: No. Each model has its own space; switching models means re-embedding all data.
```

## Notes

:::notes
- An embedding maps an item to a dense vector; closeness in space means similarity in meaning or use.
- One-hot vectors are long, sparse and treat all items as equally different.
- Embeddings are learned; an embedding layer is a lookup table whose rows are trained.
- Cosine similarity: $a \cdot b / (\lVert a \rVert \lVert b \rVert)$, direction only, range -1 to 1.
- With unit-length vectors, cosine equals the dot product.
- Semantic search: embed the query, rank documents by similarity; large systems use approximate nearest neighbour indexes.
- Never mix vectors from different models; test on your own domain; scores are only relative.
- Embeddings carry bias from training data and can miss negation.
:::
