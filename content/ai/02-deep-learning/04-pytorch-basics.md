---
title: PyTorch Basics
summary: Tensors, automatic gradients, nn.Module and the standard training loop in PyTorch, the framework most deep learning code is written in.
minutes: 35
difficulty: intermediate
tags: [pytorch, tensors, autograd, training-loop]
prereqs: [python-and-numpy, backpropagation, training-deep-networks]
exercises:
  - Rewrite the training loop to use a hidden layer of 16 units with ReLU, `nn.Sequential(nn.Linear(1, 16), nn.ReLU(), nn.Linear(16, 1))`, and fit y = x squared on the range -1 to 1. Does a straight-line model fit it? Does the new one?
  - Add a validation split (last 20% of the data). Print validation loss every 50 epochs using `model.eval()` and `torch.no_grad()`.
  - Save the trained model's `state_dict` to a file, create a fresh model of the same shape, load the weights, and check that both models give identical predictions on the same input.
resources:
  - title: PyTorch tutorials - Learn the Basics
    url: https://pytorch.org/tutorials/beginner/basics/intro.html
  - title: PyTorch docs - Autograd mechanics
    url: https://pytorch.org/docs/stable/notes/autograd.html
---

:::note
Everything in this lesson needs PyTorch (`pip install torch`), which is not installed in this environment. The snippets are small and CPU-only; run them on your own machine or in a free notebook service.
:::

## What PyTorch gives you

PyTorch is a library for array computation with two extras over NumPy:

- **Autograd**: it records operations and computes gradients for you, like the `Value` class from the backprop lesson but for whole arrays.
- **GPU support**: the same code can run on a graphics card (GPU), which does huge numbers of multiplications in parallel.

Its array type is the **tensor**. If you know NumPy, most of it will feel familiar.

## Tensors

```python
# Requires PyTorch
import numpy as np
import torch

a = torch.tensor([[1.0, 2.0, 3.0],
                  [4.0, 5.0, 6.0]])
print(a.shape, a.dtype)             # torch.Size([2, 3]) torch.float32

b = torch.zeros(3, 1) + torch.zeros(1, 4)   # broadcasting, same rules as NumPy
print(b.shape)                      # torch.Size([3, 4])

n = np.array([1.0, 2.0])
t = torch.from_numpy(n)             # shares memory with the NumPy array
print(t.numpy())                    # and back again

print(a @ a.T)                      # matrix multiply, shape (2, 2)
print(a.sum(dim=0), a.mean())       # reductions take dim= instead of axis=
```

- **Shape**: the size along each dimension. **dtype**: the number type. The default float is `float32`; NumPy's is `float64`.
- **Device**: where the tensor lives, CPU or GPU. Tensors must be on the same device to be combined: `x.to("cuda")` moves one when a GPU is available.
- Class labels for classification are stored as integers (`torch.long`), not floats.

Common NumPy habits and their PyTorch spelling:

| NumPy | PyTorch |
|---|---|
| `np.array([...])` | `torch.tensor([...])` |
| `a.reshape(2, 3)` | `a.reshape(2, 3)` or `a.view(2, 3)` |
| `a.sum(axis=0)` | `a.sum(dim=0)` |
| `np.random.randn(3)` | `torch.randn(3)` |
| `a.astype(np.float32)` | `a.to(torch.float32)` |

A standard line picks the GPU when one exists and falls back to the CPU: `device = "cuda" if torch.cuda.is_available() else "cpu"`. You then move the model and each batch with `.to(device)`. Beginners often forget one of the two and get a device mismatch error.

```predict
lang: python
prompt: What does this print?
code: |
  import torch
  b = torch.zeros(3, 1) + torch.zeros(1, 4)
  print(b.shape)
output: torch.Size([3, 4])
why: Broadcasting stretches a size-1 dimension to match the other. A (3, 1) tensor plus a (1, 4) tensor gives (3, 4).
```

## Autograd

Mark a tensor with `requires_grad=True` and PyTorch tracks every operation on it. Calling `.backward()` on a scalar fills in `.grad` for every tracked tensor.

```python
# Requires PyTorch
import torch

w = torch.tensor(3.0, requires_grad=True)
x = torch.tensor(2.0)
loss = (w * x - 10.0) ** 2        # (3*2 - 10)^2 = 16
loss.backward()
print(w.grad)                     # tensor(-16.) because d/dw (wx - 10)^2 = 2(wx - 10) * x = 2 * (-4) * 2
```

- `.grad` accumulates across calls, exactly like the scalar engine. Reset it each step.
- Wrap evaluation in `with torch.no_grad():` to skip recording. It saves memory and time.
- `tensor.item()` turns a one-element tensor into a plain Python number, handy for logging.

## Models with nn.Module

`torch.nn` holds ready-made layers. A model is a class that inherits from `nn.Module`, creates layers in `__init__` and describes the forward pass in `forward`. Layers register their weights automatically, so `model.parameters()` finds them all.

```python
# Requires PyTorch
import torch
from torch import nn

class TinyNet(nn.Module):
    def __init__(self, n_in, n_hidden, n_out):
        super().__init__()
        self.fc1 = nn.Linear(n_in, n_hidden)    # holds W and b
        self.fc2 = nn.Linear(n_hidden, n_out)

    def forward(self, x):
        return self.fc2(torch.relu(self.fc1(x)))

model = TinyNet(1, 8, 1)
print(sum(p.numel() for p in model.parameters()))   # (1*8 + 8) + (8*1 + 1) = 25
```

You never call `forward` directly. Write `model(x)`, which also runs hooks that PyTorch relies on.

```blanks
prompt: Complete the model definition.
lang: python
code: |
  class Net(nn.Module):
      def __init__(self):
          [[super().__init__()]]
          self.fc = nn.Linear(4, 2)

      def [[forward]](self, x):
          return self.fc(x)
why: "`super().__init__()` sets up PyTorch's bookkeeping for layers and parameters. `forward` is the method `model(x)` calls."
```

## The training loop

The loop from the previous lesson, written out. Fit a line $y = 2x + 1$ from noisy data.

```python
# Requires PyTorch
import torch
from torch import nn

torch.manual_seed(0)
x = torch.linspace(-1, 1, 100).unsqueeze(1)          # shape (100, 1)
y = 2 * x + 1 + 0.1 * torch.randn_like(x)            # noisy targets

model = nn.Linear(1, 1)
loss_fn = nn.MSELoss()
opt = torch.optim.SGD(model.parameters(), lr=0.1)

for epoch in range(200):
    pred = model(x)                  # forward
    loss = loss_fn(pred, y)
    opt.zero_grad()                  # clear old gradients
    loss.backward()                  # backward
    opt.step()                       # update weights
    if epoch % 50 == 0:
        print(epoch, loss.item())

print(model.weight.item(), model.bias.item())    # close to 2 and 1
```

This uses the whole dataset per step for brevity. For bigger data you wrap it in a `DataLoader`, which hands out shuffled mini-batches:

```python
# Requires PyTorch
from torch.utils.data import DataLoader, TensorDataset

loader = DataLoader(TensorDataset(x, y), batch_size=32, shuffle=True)
for xb, yb in loader:
    ...   # forward, loss, zero_grad, backward, step on this batch
```

```order
prompt: Arrange one PyTorch training step.
lang: python
code: |
  pred = model(xb)
  loss = loss_fn(pred, yb)
  opt.zero_grad()
  loss.backward()
  opt.step()
distractors:
  - "  loss = loss_fn(yb, pred)"
why: Forward, loss, clear gradients, backward, step. Zeroing after backward would erase the gradients before the step uses them.
```

```quiz
q: What happens if you forget opt.zero_grad() in the training loop?
options:
  - Nothing, PyTorch clears gradients automatically
  - Gradients from earlier steps add up, so updates are wrong
  - The loss is always zero
  - The model stops being differentiable
answer: 1
why: "backward() adds into .grad rather than replacing it. Without zero_grad each step uses the sum of all previous gradients, and training behaves erratically."
```

## Evaluation, saving and the usual traps

```python
# Requires PyTorch
model.eval()                              # switch off dropout, use stored BatchNorm statistics
with torch.no_grad():
    val_loss = loss_fn(model(x), y)
model.train()                             # back to training mode

torch.save(model.state_dict(), "model.pt")      # weights only
model.load_state_dict(torch.load("model.pt"))   # needs a model of the same shape
```

| Mistake | Symptom |
|---|---|
| No `zero_grad()` | Loss behaves oddly, grows |
| Forgetting `model.eval()` | Validation results are noisy because dropout is still on |
| Labels as float for `CrossEntropyLoss` | Error about dtype; class labels must be `long` |
| Model and data on different devices | Error naming `cpu` and `cuda` tensors |
| Passing softmax outputs to `CrossEntropyLoss` | Worse training; the loss expects raw logits (pre-softmax scores) |

:::tip
For classification, give `nn.CrossEntropyLoss` the raw output of the last layer. It applies the softmax internally in a numerically safe way.
:::

:::truth
Frameworks hide a lot, and shape errors are the most common bug. Print `x.shape` often. Seed everything for debugging, but expect small run-to-run differences on GPUs.
:::

```cards
- q: What are the two main things PyTorch adds over NumPy?
  a: Automatic gradients (autograd) and the ability to run on GPUs.
- q: What does requires_grad=True do?
  a: It tells PyTorch to record operations on the tensor so backward() can fill in its .grad.
- q: What are the five lines of a PyTorch training step?
  a: Forward pass, compute loss, optimizer.zero_grad(), loss.backward(), optimizer.step().
- q: What does model.eval() do, and what does torch.no_grad() do?
  a: eval() turns off training-only behaviour such as dropout. no_grad() stops gradient recording. Use both when evaluating.
- q: What input does nn.CrossEntropyLoss expect?
  a: Raw logits of shape (batch, classes) and integer class labels of dtype long.
```

## Notes

:::notes
- A tensor is PyTorch's array; it has shape, dtype and device. Broadcasting follows NumPy rules.
- `requires_grad=True` plus `loss.backward()` fills `.grad`; gradients accumulate, so zero them each step.
- Models subclass `nn.Module`: layers in `__init__`, computation in `forward`; call `model(x)`.
- Training step: forward, loss, `opt.zero_grad()`, `loss.backward()`, `opt.step()`.
- `DataLoader` gives shuffled mini-batches.
- Evaluate with `model.eval()` and `torch.no_grad()`.
- Save with `state_dict()`. Class labels are `long`; `CrossEntropyLoss` wants logits.
- Print shapes often; shape and device mismatches are the usual bugs.
:::
