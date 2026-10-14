---
title: How LLMs Are Trained
summary: Next-token prediction at scale, then instruction tuning and preference training, with the loss, the compute and the limits spelled out.
minutes: 35
difficulty: intermediate
tags: [pretraining, rlhf, scaling, llm]
prereqs: [transformer-architecture, tokenization, backpropagation]
exercises:
  - Change the text in the bigram example to a sentence of your own with more repeated words. Does the final loss go lower or higher than 0.85, and why?
  - A 13-billion-parameter model is trained on 260 billion tokens. Using the rule of thumb of about 20 tokens per parameter, is it under-trained, about right or over-trained? What would change if the model will serve billions of requests?
  - Write a five-item list of "things pretraining teaches" and a five-item list of "things post-training teaches". Which list holds facts and which holds behaviour?
resources:
  - title: Training Compute-Optimal Large Language Models (Chinchilla)
    url: https://arxiv.org/abs/2203.15556
  - title: Training language models to follow instructions with human feedback (InstructGPT)
    url: https://arxiv.org/abs/2203.02155
  - title: Language Models are Few-Shot Learners (GPT-3)
    url: https://arxiv.org/abs/2005.14165
---

## The one task

An LLM (large language model) is trained on a single objective: given the tokens so far, predict the next token.

- Input: "The cat sat on the"
- Target: " mat"
- Output: a probability for every token in the vocabulary.

That is all. Writing, translating, coding and answering questions all emerge from getting good at this prediction on enough varied text.

:::key
The model is never told what a fact or a task is. To predict text well, it has to pick up grammar, facts, style and some reasoning patterns, because they help it guess the next token.
:::

## The loss

Training needs one number to minimise. For next-token prediction it is **cross-entropy loss**:

$$ \text{loss} = -\log P(\text{correct next token}) $$

averaged over many positions.

- If the model gives the correct token probability 1, the loss is 0.
- If it gives probability 0.1, the loss is about 2.3.
- A model that knows nothing and spreads probability evenly over $V$ tokens has loss $\ln V$.

Lower loss means the model puts more probability on what actually came next.

```quiz
q: A model has a vocabulary of 50,000 tokens and guesses uniformly at random. Roughly what is its loss per token?
options:
  - "0"
  - About 1
  - About 10.8
  - About 50,000
answer: 2
why: "Uniform guessing gives each token probability 1/50,000, so the loss is -ln(1/50,000) = ln(50,000), about 10.8. A trained model's loss on ordinary text is far lower."
```

## Code

A bigram model is the smallest possible language model. It predicts the next character from only the current one, using a table of scores (logits). The training loop is the same as for an LLM, just tiny.

```python
import numpy as np

text = "the cat sat on the mat. the cat ate."
chars = sorted(set(text))
ix = {c: i for i, c in enumerate(chars)}
ids = np.array([ix[c] for c in text])
V = len(chars)

# Training pairs: (current token) -> (next token)
x, y = ids[:-1], ids[1:]

# A bigram "model": a table of logits, one row per current token
logits = np.zeros((V, V))

def loss_fn(logits):
    z = logits - logits.max(axis=1, keepdims=True)
    p = np.exp(z) / np.exp(z).sum(axis=1, keepdims=True)
    return -np.log(p[x, y]).mean(), p      # cross-entropy: -log P(correct next token)

print("vocab size:", V, " ln(V) =", round(float(np.log(V)), 3))
for step in range(201):
    loss, p = loss_fn(logits)
    if step % 100 == 0:
        print(step, round(float(loss), 3))
    grad = np.zeros_like(logits)
    np.add.at(grad, x, p[x])               # each training pair adds its row of probabilities...
    np.add.at(grad, (x, y), -1)            # ...minus 1 at the correct next token
    logits -= 1.0 * grad / len(x)          # learning rate 1.0, averaged over pairs
```
```output
vocab size: 11  ln(V) = 2.398
0 2.398
100 0.971
200 0.846
```

- Step 0 matches $\ln V$: all logits are zero, so every character is equally likely.
- Loss falls because the table learns which character follows which.
- It cannot reach 0, since after "t" the next character is sometimes "h" and sometimes " ".

```blanks
prompt: Complete one training step of next-token prediction.
lang: python
code: |
  targets = tokens[1:]
  logits = model(tokens[:-1])
  loss = cross_entropy(logits, [[targets]])
  loss.[[backward]]()
  optimizer.step()
why: The targets are the same sequence shifted by one position, and backward computes the gradients that the optimizer step then uses to update the weights.
```

## Stage 1: pretraining

**Pretraining** runs this objective over a very large text collection (web pages, books, code, papers).

| Ingredient | Typical scale and note |
|---|---|
| Data | Trillions of tokens, filtered and de-duplicated; quality filtering matters a lot |
| Model | Billions to hundreds of billions of parameters |
| Hardware | Thousands of GPUs for weeks to months |
| Optimiser | Adam-style, with learning-rate warm-up then decay |
| Result | A **base model**: it continues text, but does not reliably follow instructions |

A base model asked "What is the capital of France?" may continue with more quiz questions, because that is a plausible continuation.

### Compute rule of thumb

Training cost is roughly $6 \times N \times D$ floating-point operations (FLOPs), for $N$ parameters and $D$ training tokens. For 7 billion parameters and 2 trillion tokens that is about $8.4 \times 10^{22}$ FLOPs.

The **Chinchilla** study (2022) found that for a fixed compute budget, parameters and tokens should grow together, roughly 20 tokens per parameter. Many recent models train on far more tokens than that, because a smaller model trained longer is cheaper to run for every user afterwards.

```estimate
q: A 7-billion-parameter model stores each weight in 16 bits (2 bytes). How much memory do the weights alone need?
answer: 14
unit: GB
tolerance: 0.2
hint: 7 billion weights times 2 bytes each.
solution: "7 × 10^9 × 2 bytes = 14 × 10^9 bytes = 14 GB. Training needs several times more, because gradients and optimiser state must be stored too, often around 16 bytes per parameter in total with mixed precision and Adam, so roughly 110 GB."
```

## Stage 2: post-training

A base model is then shaped into an assistant.

1. **Supervised fine-tuning (SFT)**: continue training on thousands to millions of example conversations written or curated by people. The loss is the same; only the data changes.
2. **Preference training**: show the model two answers and train it toward the one people prefer.
   - **RLHF** (reinforcement learning from human feedback): train a reward model on human rankings, then use reinforcement learning to push the LLM toward higher reward.
   - **DPO** (direct preference optimisation): skip the reward model and train directly on the preferred-versus-rejected pairs.
3. **Safety and tool training**: further data for refusals, formatting, tool calls.

```order
prompt: Put the usual training pipeline in order.
lang: text
code: |
  Collect and clean a huge text corpus
  Pretrain: predict the next token
  Supervised fine-tuning on example conversations
  Preference training (RLHF or DPO)
  Evaluate, then deploy
distractors:
  - "Preference training before any pretraining"
why: Preference training adjusts behaviour of a model that already has language ability, so it comes after pretraining and instruction tuning.
```

## What training does not give you

- **No guarantee of truth.** The objective rewards plausible text. A fluent wrong answer is a **hallucination**.
- **A knowledge cutoff.** Facts after the training data ends are unknown unless supplied in the prompt.
- **No memory between conversations.** Weights are frozen at serving time.
- **Preference bias.** Training toward human approval can make models agreeable or long-winded.

:::truth
Almost nobody trains a base model: the compute bill is millions of dollars and the data work is large. Most engineers choose a model, prompt it, retrieve data for it, and sometimes fine-tune a small piece of it. Understanding training helps you predict failures, not repeat the process.
:::

```cards
- q: What is the pretraining objective?
  a: Predict the next token given the tokens before it, minimising cross-entropy loss over a huge text corpus.
- q: Loss of a model that guesses uniformly over V tokens?
  a: '$\ln V$'
- q: Rough training compute formula?
  a: "$6ND$ FLOPs, for $N$ parameters and $D$ tokens."
- q: What does SFT do?
  a: Supervised fine-tuning continues next-token training on example conversations so the model behaves like an assistant.
- q: RLHF versus DPO in one line each?
  a: RLHF trains a reward model on human rankings and optimises the LLM against it; DPO trains directly on preferred and rejected answer pairs.
- q: Why do models hallucinate?
  a: The objective rewards plausible continuations, not verified truth.
```

## Notes

:::notes
- LLMs are trained to predict the next token; the loss is cross-entropy, minus log of the probability of the correct token.
- Uniform guessing over V tokens gives loss ln(V). Training drives it far lower.
- Pretraining uses trillions of tokens and produces a base model that continues text.
- Compute is about 6 x parameters x tokens FLOPs. Chinchilla suggested about 20 tokens per parameter for compute-optimal training.
- Post-training: SFT on example conversations, then preference training (RLHF or DPO).
- Weights in 16-bit need 2 bytes per parameter; training needs several times more memory.
- Training rewards plausible text, so hallucinations and knowledge cutoffs are expected, not bugs to be patched away.
- Most engineers use trained models rather than training them.
:::
