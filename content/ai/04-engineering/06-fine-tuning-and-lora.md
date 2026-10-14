---
title: Fine-Tuning and LoRA
summary: Decide when training a model beats prompting or retrieval, and see how LoRA adapts a large model by training a few million extra parameters.
minutes: 40
difficulty: advanced
tags: [fine-tuning, lora, qlora, sft, peft]
prereqs: [how-llms-are-trained, training-deep-networks, evals]
exercises:
  - Change r from 4 to 16 in the NumPy code. How do the parameter counts and the rank of the update change? What would a rank of d do to the savings?
  - You have 300 labelled support tickets. Write down the order in which you would try prompting, few-shot examples, RAG and fine-tuning, and the eval result that would justify moving to the next step.
  - Compute full fine-tuning memory (16 bytes per parameter) for a 1B, 7B and 70B model. Which fit on a single 80 GB GPU?
resources:
  - title: LoRA, Low-Rank Adaptation of Large Language Models (Hu et al.)
    url: https://arxiv.org/abs/2106.09685
  - title: QLoRA, Efficient Finetuning of Quantized LLMs (Dettmers et al.)
    url: https://arxiv.org/abs/2305.14314
---

## Should you fine-tune at all

**Fine-tuning** means continuing to train a pretrained model on your own examples so its weights change. It is the most expensive way to change behaviour, so try the cheaper ones first.

| Need | Try first | Why |
|---|---|---|
| Follow instructions better | Clearer prompt, examples in the prompt | Free to iterate |
| Use private or changing facts | RAG (retrieval) | Facts live in an index you can update |
| A fixed output format or house style | Prompt, then fine-tune | Training makes it consistent |
| Cheaper or faster at one narrow task | Fine-tune a small model | A small tuned model can match a large prompted one |
| New behaviour prompts cannot reach | Fine-tune | Last resort |

:::key
Fine-tuning teaches skills and style well. It teaches facts poorly and cannot be edited afterwards. Put facts in retrieval, put behaviour in weights.
:::

You need an eval first (see the evals lesson). Without one you cannot tell whether the tuned model is better or just different.

## What the data looks like

The common method is **SFT** (supervised fine-tuning): show the model prompts with the exact replies you want, and train it to produce them.

```python
example = {
    "messages": [
        {"role": "system", "content": "Classify the ticket as refund, tracking or other. Reply with the label only."},
        {"role": "user", "content": "Charged twice for one order"},
        {"role": "assistant", "content": "refund"},
    ]
}
```

- One JSON object per line (**JSONL**) is a common file format; check your provider or library for its exact fields.
- A few hundred clean examples can change style or format. Hundreds to thousands are typical for a narrow task.
- Quality beats volume. Inconsistent labels teach inconsistent behaviour.
- Hold out part of the data for evaluation, as in the evals lesson.

Other methods exist. **Preference tuning** (for example **DPO**, Direct Preference Optimization) trains on pairs of "better" and "worse" replies instead of single targets.

## Why full fine-tuning is heavy

Training stores more than the weights. With the common mixed-precision Adam setup, each parameter needs roughly 16 bytes: 2 for the weights, 2 for the gradient, and 12 for a full-precision copy plus Adam's two running averages. Activations come on top.

```estimate
q: Roughly how much GPU memory does full fine-tuning of a 7-billion-parameter model need for weights, gradients and optimizer state, at 16 bytes per parameter?
answer: 112
unit: GB
tolerance: 0.2
hint: 7 x 10^9 parameters x 16 bytes.
solution: "7e9 x 16 = 1.12e11 bytes, about 112 GB. That already exceeds one 80 GB GPU, before counting activations."
```

## LoRA: train a small correction

**LoRA** (Low-Rank Adaptation) freezes the pretrained weight matrix $W$ and learns a small update next to it:

$$ h = Wx + \frac{\alpha}{r} B A x $$

- $W$ is $d \times d$ and frozen.
- $A$ is $r \times d$ and $B$ is $d \times r$, with a small **rank** $r$ such as 4 to 64. Only $A$ and $B$ are trained.
- $\alpha$ is a scaling constant. $B$ starts at zero, so training begins exactly at the pretrained model.
- The idea behind it: the change needed for a new task often has low rank, so a thin pair of matrices can capture it.

```python
import numpy as np

rng = np.random.default_rng(0)
d, r, alpha = 64, 4, 8                       # layer width, LoRA rank, scaling
W = rng.normal(size=(d, d))                  # frozen pretrained weight
A = rng.normal(size=(r, d)) * 0.01           # trainable, small random start
B = np.zeros((d, r))                         # trainable, zero start
x = rng.normal(size=d)

def forward(x):
    return W @ x + (alpha / r) * (B @ (A @ x))

print("same as base at start:", np.allclose(forward(x), W @ x))
print("full params:", W.size, " LoRA params:", A.size + B.size)

B = rng.normal(size=(d, r)) * 0.1            # pretend training changed B
delta = (alpha / r) * (B @ A)                # the learned update
print("rank of update:", np.linalg.matrix_rank(delta))
merged = W + delta                           # fold the adapter into the weight
print("merged matches adapter:", np.allclose(merged @ x, forward(x)))
```
```output
same as base at start: True
full params: 4096  LoRA params: 512
rank of update: 4
merged matches adapter: True
```

What to notice:

- The adapter has 512 parameters against 4,096, and the gap widens with $d$.
- After training you can **merge** the update into $W$, so inference costs nothing extra.
- Or keep adapters separate: one base model, many small task adapters swapped per request.

```predict
lang: python
code: |
  d, r = 4096, 8
  print(2 * d * r)
output: "65536"
why: A is r x d and B is d x r, so together they hold 2 x d x r numbers. The full matrix would hold d x d, about 16.8 million.
```

```estimate
q: A model has 32 layers and hidden size 4096. You add LoRA with rank 8 to two square 4096 x 4096 matrices per layer. How many trainable parameters is that?
answer: 4200000
unit: parameters
tolerance: 0.2
hint: One adapted matrix has 2 x 4096 x 8 parameters. Multiply by 2 matrices and 32 layers.
solution: "2 x 4096 x 8 = 65,536 per matrix; x 2 matrices x 32 layers = 4,194,304, about 4.2 million. Against 7 billion base parameters that is about 0.06 percent."
```

## QLoRA and the practical stack

**QLoRA** stores the frozen base model in 4-bit numbers (quantization: fewer bits per weight, smaller and slightly less precise) and trains LoRA adapters on top in higher precision. This lets a 7B model be tuned on a single consumer-class GPU.

The code below uses the Hugging Face `transformers` and `peft` libraries. They are not installed in this course environment; treat it as a sketch to read, and confirm names and arguments in the current documentation.

```python
# Requires: pip install transformers peft (and a GPU for real training)
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("your-base-model")
config = LoraConfig(
    r=8,
    lora_alpha=16,
    lora_dropout=0.05,
    target_modules=["q_proj", "v_proj"],   # layer names depend on the model
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, config)
model.print_trainable_parameters()          # a small fraction of the total
```

```order
prompt: Arrange the fine-tuning workflow.
lang: python
code: |
  baseline = run_eval(base_model, test_set)
  data = clean(collect_examples())
  adapter = train_lora(base_model, data)
  tuned = run_eval(base_model + adapter, test_set)
  compare(baseline, tuned)
distractors:
  - "train_lora(base_model, test_set)   # trains on the exam"
why: Measure the starting point first, train on training data only, then score the tuned model on the same held-out test set and compare.
```

:::warn
Fine-tuning can cause **catastrophic forgetting**: skills outside your data get worse. Check general behaviour on a few unrelated prompts, not only your task.
:::

:::truth
Most failed fine-tunes fail on data, not on hyperparameters: too few examples, mislabelled ones, or a test set that leaked into training. Expect to spend more time on the dataset than on the training run.
:::

```quiz
q: Your support bot needs to answer from a policy document that changes every month. What is the better first approach?
options:
  - Fine-tune monthly on the new policy text
  - Use retrieval so the current policy is fetched at question time
  - Increase LoRA rank until it memorises the policy
answer: 1
why: Retrieval reads the current text each time and cites it. Fine-tuned facts go stale, are hard to verify, and cannot be edited without retraining.
```

```cards
- q: When should you fine-tune instead of prompting?
  a: When prompts and retrieval cannot give the style, format or narrow skill you need, or when a small tuned model must replace a large prompted one. Have an eval first.
- q: What does LoRA train?
  a: Two thin matrices A (r x d) and B (d x r) added to a frozen weight W, giving W + (alpha / r) B A.
- q: Why does LoRA start exactly at the base model?
  a: B is initialised to zero, so the added update is zero before training.
- q: What does QLoRA add to LoRA?
  a: The frozen base model is stored in 4-bit precision, cutting memory so large models fit on one GPU.
- q: Why is full fine-tuning memory about 16 bytes per parameter?
  a: Weights, gradients, a full-precision master copy and two Adam running averages all need storing.
```

## Notes

:::notes
- Order of tries: prompt, examples, RAG, then fine-tune. Build the eval first.
- Fine-tuning teaches style, format and narrow skills; keep changing facts in retrieval.
- SFT uses prompt and ideal reply pairs; quality and consistency beat volume.
- Full fine-tuning with Adam needs about 16 bytes per parameter (7B is about 112 GB) plus activations.
- LoRA: h = Wx + (alpha/r) B A x with W frozen, A (r x d), B (d x r), B starts at zero.
- LoRA parameters per matrix: 2 x d x r; merge into W for free inference or swap adapters per task.
- QLoRA: 4-bit frozen base plus LoRA adapters; fits large models on one GPU.
- Watch for forgetting and test-set leakage; compare against the untuned baseline.
:::
