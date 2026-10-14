---
title: Training Deep Networks
summary: The practical knobs that decide whether a network trains well - batches, learning rate, optimizers, initialisation, normalisation - and how to debug a run that does not.
minutes: 35
difficulty: intermediate
tags: [training, optimizers, adam, initialization, batchnorm]
prereqs: [neural-networks, backpropagation, overfitting-and-regularization]
exercises:
  - In the initialisation experiment, change ReLU to tanh and compare "He" (scale sqrt(2/n)) with "Xavier" (scale sqrt(1/n)). Which keeps the activations steadier, and why?
  - Modify the Adam example to minimise f(w) = (w - 3)^2 with lr = 0.5 and then lr = 0.01. Describe both runs after 100 steps.
  - You train for 30 epochs. Training loss falls every epoch; validation loss falls until epoch 12, then rises. Which epoch's weights do you keep and which two techniques from this lesson or the last would you add?
resources:
  - title: "Adam: A Method for Stochastic Optimization"
    url: https://arxiv.org/abs/1412.6980
  - title: Delving Deep into Rectifiers (He initialisation)
    url: https://arxiv.org/abs/1502.01852
  - title: Batch Normalization
    url: https://arxiv.org/abs/1502.03167
---

## The training loop, again

You have a model, a loss and gradients from backprop. Training is the loop around them:

1. Take a small chunk of the data, called a **mini-batch**.
2. Forward pass: compute predictions and the loss on that batch.
3. Backward pass: compute gradients.
4. Optimizer step: update the weights.
5. Repeat. One full pass over the data is an **epoch**.

Why mini-batches instead of the whole dataset or one example at a time?

- The whole dataset per step is slow and often does not fit in memory.
- One example per step gives a noisy gradient and wastes hardware that is built for parallel work.
- A batch of 32 to 512 gives a decent gradient estimate at a fair cost. The noise even helps the model escape poor spots.

This is **SGD** (stochastic gradient descent): gradient descent where each gradient comes from a random mini-batch.

```estimate
q: A dataset has 50,000 training images and you use batch size 128. How many optimizer steps are in one epoch?
answer: 391
unit: steps
tolerance: 0.1
hint: Divide 50,000 by 128 and round up, because the last batch is smaller.
solution: "50,000 / 128 = 390.6, so 391 steps per epoch (the last batch has 80 images)."
```

## Learning rate: the most important setting

The **learning rate** (lr) is how big each step is: $w \leftarrow w - \text{lr} \cdot \text{grad}$.

| Learning rate | What you see |
|---|---|
| Too small | Loss falls very slowly; training seems stuck |
| About right | Loss falls quickly, then flattens |
| Too large | Loss bounces, rises, or becomes `nan` |

- Start with a known default for your optimizer, then try values a factor of 3 to 10 apart (for example 1e-2, 1e-3, 1e-4).
- A **schedule** lowers the lr during training: large early for progress, small late for fine tuning. A short **warmup** (starting small and ramping up) is common for large models.

```quiz
q: Training loss jumps around and then becomes nan after a few steps. What is the first thing to try?
options:
  - Train for more epochs
  - Lower the learning rate
  - Add more hidden layers
  - Increase the batch size to the full dataset
answer: 1
why: "An exploding loss usually means steps are too large, so the weights overshoot. Lowering the learning rate is the cheapest first fix. Also check for bad inputs such as missing values."
```

## Optimizers

An **optimizer** decides how to turn gradients into updates.

- **SGD**: step against the gradient. Simple, needs a tuned lr.
- **Momentum**: keep a running average of past gradients, so steps smooth out and speed up along consistent directions, like a ball rolling downhill.
- **Adam**: momentum plus a per-weight scaling. It divides by a running average of squared gradients, so weights with large gradients take smaller steps and weights with small gradients take larger steps. A common default is lr = 1e-3.

```python
import numpy as np

def adam_step(w, g, state, lr=0.1, b1=0.9, b2=0.999, eps=1e-8):
    state["t"] += 1
    state["m"] = b1 * state["m"] + (1 - b1) * g          # running average of gradients
    state["v"] = b2 * state["v"] + (1 - b2) * g * g      # running average of squared gradients
    m_hat = state["m"] / (1 - b1 ** state["t"])          # fix the bias from starting at zero
    v_hat = state["v"] / (1 - b2 ** state["t"])
    return w - lr * m_hat / (np.sqrt(v_hat) + eps)

# minimise f(w) = (w - 3)^2, gradient 2(w - 3)
w = np.array([0.0])
state = {"t": 0, "m": 0.0, "v": 0.0}
for step in range(1, 101):
    w = adam_step(w, 2 * (w - 3), state)
    if step in (1, 10, 50, 100):
        print(f"step {step:3d}: w = {w[0]:.3f}")
```
```output
step   1: w = 0.100
step  10: w = 0.986
step  50: w = 3.169
step 100: w = 2.981
```

- Each early step moves about `lr` regardless of how large the gradient is. That is the scaling at work.
- Adam overshoots the minimum at 3 (3.169 at step 50) and then settles. With a smaller lr or a schedule it would settle faster.

:::tip
Default recipe: AdamW (Adam with decoupled weight decay, an L2-style shrink applied to the weights) at lr 1e-3 for small models, 1e-4 to 3e-4 for larger ones. Plain SGD with momentum still wins for some vision models, but it needs more tuning.
:::

## Initialisation: where the weights start

If all weights start at zero, every unit in a layer computes the same thing and gets the same gradient, so they never become different. Start with small random numbers. How small matters.

- Too small: the signal shrinks layer by layer until it vanishes.
- Too large: it grows layer by layer until it explodes.
- **He initialisation** (for ReLU) draws weights with standard deviation $\sqrt{2 / n_{in}}$, which keeps the signal's size roughly constant through the layers. **Xavier** uses $\sqrt{1 / n_{in}}$ and suits tanh.

The experiment: push random data through 10 ReLU layers of width 100 and look at the spread of the final activations.

```python
import numpy as np

rng = np.random.default_rng(0)
x = rng.normal(size=(256, 100))          # 256 examples, 100 features

def forward_std(scale_fn, activation, layers=10):
    h = x
    for _ in range(layers):
        W = rng.normal(size=(100, 100)) * scale_fn(100)
        h = activation(h @ W)
    return h.std()

relu = lambda z: np.maximum(0, z)
tiny = lambda n: 0.01                    # too small
he = lambda n: np.sqrt(2.0 / n)          # He init, made for ReLU
big = lambda n: 0.3                      # too large

print(f"std after 10 layers, tiny init: {forward_std(tiny, relu):.2e}")
print(f"std after 10 layers, He init:   {forward_std(he, relu):.2f}")
print(f"std after 10 layers, big init:  {forward_std(big, relu):.2e}")
```
```output
std after 10 layers, tiny init: 2.36e-12
std after 10 layers, He init:   0.82
std after 10 layers, big init:  1.34e+03
```

The input had a standard deviation of 1. With the tiny scale the signal is about $10^{-12}$ after ten layers; with the big scale it is over a thousand. Gradients behave the same way in reverse, which is the vanishing and exploding gradient problem from the last lesson. Frameworks use a sensible default, so you rarely set this by hand, but you should know why it exists.

```predict
lang: python
prompt: Every weight in a layer starts at the same value, say 0.5. After training, what do the units in that layer look like?
code: |
  # 3 hidden units, identical weights, identical inputs
  gradients = [0.2, 0.2, 0.2]
  print(len(set(gradients)))
output: "1"
why: Identical weights give identical outputs and therefore identical gradients, so the units get identical updates and stay identical forever. Random initialisation breaks this symmetry.
```

## Normalisation, dropout and friends

- **Batch normalisation** (BatchNorm): rescale each layer's inputs to mean 0 and standard deviation 1 over the batch, then let the network learn its own scale and shift. It makes training steadier and tolerates larger learning rates. Transformers use **LayerNorm**, which normalises across the features of one example instead.
- **Dropout**: during training randomly set a fraction of activations (say 10% to 50%) to zero. It acts as regularization. Turn it off at evaluation time.
- **Weight decay**: shrink weights a little each step; the L2 idea from the overfitting lesson.
- **Gradient clipping**: cap the gradient's size so one bad batch cannot blow up training.
- **Early stopping**: keep the weights from the epoch with the best validation loss.

## When it does not train

Check in this order:

1. **Overfit one tiny batch** (10 examples). The loss should go to nearly zero. If not, there is a bug in the model, loss or data pipeline.
2. Print shapes and a few inputs and labels. Misaligned labels are a classic.
3. Check the loss at the start. For $C$ balanced classes with cross-entropy it should be near $\ln C$ (about 2.30 for 10 classes).
4. Plot training and validation loss together. Both high means underfit; a growing gap means overfit.
5. Sweep the learning rate.
6. Only then change the architecture.

:::truth
Most failed training runs come from data bugs, wrong learning rates or shape mistakes, not from the architecture. Expect to run many small experiments. Keep a log of what you changed and what happened.
:::

```cards
- q: What is a mini-batch, and why use one?
  a: A small random subset of the data used for one gradient step. It gives a decent gradient estimate cheaply and works well on parallel hardware.
- q: What are the symptoms of a learning rate that is too large and too small?
  a: Too large - the loss bounces, rises or turns into nan. Too small - the loss falls very slowly.
- q: How does Adam differ from plain SGD?
  a: It keeps running averages of the gradient (momentum) and of its square, and scales each weight's step by the second one.
- q: Why not initialise all weights to zero?
  a: Every unit would compute the same thing and get the same gradient, so they would never differ.
- q: What is the first debugging test for a network that will not train?
  a: Try to overfit a tiny batch. If the loss cannot reach about zero, there is a bug.
```

## Notes

:::notes
- Training loop: mini-batch, forward, loss, backward, optimizer step; one pass over the data is an epoch.
- Learning rate is the most important setting. Too big - loss bounces or nan. Too small - crawling.
- Schedules and warmup change the lr over time. Sweep by factors of about 3 to 10.
- Adam = momentum + per-weight scaling by squared-gradient average. AdamW at 1e-3 is a strong default.
- Initialise randomly with the right scale (He for ReLU, $\sqrt{2/n_{in}}$) so signals neither vanish nor explode.
- BatchNorm/LayerNorm stabilise training; dropout, weight decay and early stopping fight overfitting; clipping tames big gradients.
- Debug order: overfit one small batch, check shapes and labels, check the starting loss ($\ln C$), plot both losses, sweep lr.
:::
