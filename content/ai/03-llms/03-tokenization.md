---
title: Tokenization
summary: How text becomes the integer ids a language model reads, why subword pieces won, and the odd behaviour that comes from it.
minutes: 30
difficulty: beginner
tags: [tokenization, bpe, llm]
prereqs: [embeddings]
exercises:
  - Run the BPE code on a paragraph of your own. After 20 merges, which merged pieces look like real words and which look like accidents of your text?
  - Write down three tasks an LLM might do badly because it sees tokens rather than letters (for example, counting the letters in a word). For each, say what you would do outside the model to make it reliable.
  - Take the same sentence in English and in a language you speak that uses another script. Use a tokenizer library to count tokens for both and compare. What does the difference mean for cost?
resources:
  - title: Neural Machine Translation of Rare Words with Subword Units (BPE for NLP)
    url: https://arxiv.org/abs/1508.07909
  - title: tiktoken, a fast BPE tokenizer (source and README)
    url: https://github.com/openai/tiktoken
---

## Why tokens exist

A neural network reads numbers, not letters. A **tokenizer** converts text into a list of integer **token ids** and back. A **token** is a piece of text: sometimes a whole word, sometimes part of a word, sometimes one character or byte.

Three ways to cut text:

| Unit | Vocabulary size | Problem |
|---|---|---|
| Whole words | Hundreds of thousands | Unseen words ("untokenizable") have no entry; huge embedding table |
| Single characters | Tens to thousands | Sequences become very long, so attention costs more and meaning is spread thin |
| **Subwords** | Typically 30,000 to 250,000 | A balance: common words stay whole, rare words split into known pieces |

:::key
Subword tokenization gives short sequences for common text and still handles any word, including ones nobody has seen before, by falling back to smaller pieces.
:::

## Byte-pair encoding (BPE)

**Byte-pair encoding** builds the vocabulary by counting. It is a training step that runs once before the model is trained.

1. Start with each character (or byte) as its own token.
2. Count every adjacent pair of tokens in the training text.
3. Merge the most frequent pair into one new token.
4. Repeat until the vocabulary reaches the target size.

Watch it build a vocabulary. Step through and see which pair wins each round.

```viz
algo: bpe
input:
  text: low low low low lower lower newest newest newest widest
  merges: 6
```

To encode new text later, replay the learned merges in the order they were learned.

## Code

A tiny BPE trainer in plain Python. Real tokenizers add speed and byte handling, but the loop is the same.

```python
from collections import Counter

def most_frequent_pair(words):
    pairs = Counter()
    for word, freq in words.items():
        for a, b in zip(word, word[1:]):
            pairs[(a, b)] += freq
    return max(pairs, key=lambda p: (pairs[p], p)) if pairs else None   # ties: larger pair wins

def merge(word, pair):
    out, i = [], 0
    while i < len(word):
        if i < len(word) - 1 and (word[i], word[i + 1]) == pair:
            out.append(word[i] + word[i + 1]); i += 2
        else:
            out.append(word[i]); i += 1
    return tuple(out)

text = "low low low low lower lower newest newest newest widest"
words = Counter(tuple(w) for w in text.split())     # each word starts as characters
merges = []
for _ in range(6):
    pair = most_frequent_pair(words)
    merges.append(pair)
    words = Counter({merge(w, pair): f for w, f in words.items()})
print(merges)
print(list(words))
```
```output
[('o', 'w'), ('l', 'ow'), ('s', 't'), ('e', 'st'), ('w', 'est'), ('n', 'e')]
[('low',), ('low', 'e', 'r'), ('ne', 'west'), ('w', 'i', 'd', 'est')]
```

Notice that "low" became one token after two merges, while "widest" still ends in the shared piece "est". The first merge was a tie (`o,w` and `l,o` both occur 6 times), broken by the code's tie rule. Real tokenizers also pick a deterministic tie rule.

```order
prompt: Arrange one round of BPE training.
lang: python
code: |
  pairs = count_adjacent_pairs(corpus)
  best = max(pairs, key=pairs.get)
  corpus = merge_everywhere(corpus, best)
  vocab.append(best[0] + best[1])
distractors:
  - "corpus = shuffle(corpus)"
why: Count pairs, pick the most frequent, rewrite the corpus with that pair merged, and add the new token to the vocabulary.
```

## Bytes and Unicode

Modern tokenizers (for example, the GPT-style ones) work on **bytes**. Text is first encoded as **UTF-8**, a scheme that stores each character as 1 to 4 bytes. Because every string is some sequence of 256 possible byte values, nothing is ever "unknown".

```predict
lang: python
code: |
  s = "héllo 👋"
  b = s.encode("utf-8")
  print(len(s), len(b))
output: 7 11
why: The string has 7 characters. The accented e takes 2 bytes and the waving-hand symbol takes 4, so 7 + 1 + 3 = 11 bytes.
```

## What this explains

Tokenization is the source of several odd model behaviours:

- **Spelling and counting letters**: the model sees pieces like "straw" + "berry", not letters. Questions about individual characters are harder than they look.
- **Arithmetic**: numbers split into arbitrary chunks, so digits are not aligned.
- **Non-English text**: tokenizers trained mostly on English split other languages into more, smaller pieces. The same sentence can cost several times more tokens and fit less into the context window.
- **Whitespace**: " cat" (with a leading space) and "cat" are often different tokens. Stray spaces can change outputs.
- **Glitch tokens**: rare strings in the vocabulary that appeared in tokenizer training data but barely in model training data can behave strangely.

```quiz
q: Why can a model struggle to count the letter "r" in "strawberry"?
options:
  - It cannot do arithmetic of any kind
  - It receives a few multi-letter token ids, not individual letters
  - The word is not in its vocabulary
  - Attention cannot look at the same word twice
answer: 1
why: "The model never directly sees the letters; it sees ids for pieces. It can learn some spelling facts indirectly, but counting characters is an awkward task for token-level input. Code that counts letters is reliable."
```

## Tokens and cost

APIs bill and limit by tokens, not words. Rough rule for ordinary English: one token is about 4 characters, or about 0.75 words. Code, numbers and other languages usually use more tokens per word.

```estimate
q: A document has 3,000 English words. Roughly how many tokens does it use?
answer: 4000
unit: tokens
tolerance: 0.4
hint: One token is about 0.75 of an English word.
solution: "3,000 words ÷ 0.75 ≈ 4,000 tokens. Only an estimate: count with the actual tokenizer for the model you use."
```

Using a real tokenizer (needs `pip install tiktoken`, not installed in this course environment):

```python
import tiktoken   # requires the tiktoken package

enc = tiktoken.get_encoding("cl100k_base")
ids = enc.encode("Tokenization is not magic.")
print(len(ids), enc.decode(ids))
```

:::truth
The tokenizer is fixed before training and tied to the model. You cannot swap in a different one without retraining or heavy adaptation. Always count tokens with the tokenizer of the model you call.
:::

```cards
- q: What is a token?
  a: A piece of text, a whole word, part of a word or a byte, that maps to one integer id in the model's vocabulary.
- q: How does byte-pair encoding build a vocabulary?
  a: Start from single characters or bytes, repeatedly merge the most frequent adjacent pair, stop at the target vocabulary size.
- q: Why use subwords instead of words or characters?
  a: Words give a huge vocabulary and unknown words; characters give very long sequences. Subwords sit between and can spell anything.
- q: Why can the same sentence cost more tokens in another language?
  a: The tokenizer was trained mostly on certain languages, so others split into more, smaller pieces.
- q: Rough tokens-per-word rule for English?
  a: About 0.75 words per token, or about 4 characters per token.
```

## Notes

:::notes
- A tokenizer maps text to integer ids and back; the model only sees ids.
- Subword tokens balance vocabulary size against sequence length and avoid unknown words.
- BPE: start with single characters or bytes, repeatedly merge the most frequent adjacent pair, stop at target size.
- Byte-level BPE works on UTF-8 bytes, so any string can be encoded.
- Quirks: letter counting, digit alignment, leading spaces and non-English cost all trace back to tokens.
- English rule of thumb: about 4 characters or 0.75 words per token. Measure for your model.
- The tokenizer is tied to the trained model; use the matching one to count tokens and cost.
:::
