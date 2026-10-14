---
title: Evals
summary: Measure whether an LLM feature works with a test set, code-based checks and calibrated judges, so changes are decided by numbers and not by impressions.
minutes: 40
difficulty: intermediate
tags: [evals, testing, llm-as-judge, metrics]
prereqs: [evaluation-metrics, llm-apis-and-structured-output, rag]
exercises:
  - Write 15 test cases for a feature you care about, including 3 that should be refused and 3 with misspelled input. Grade them with code where possible. Which cases could not be graded by code, and why?
  - Take the judge prompt in this lesson and have two people also grade 20 outputs by hand. Compute how often the judge and each person agree, and how often the two people agree with each other.
  - Run the simulation with n = 200 instead of 50. How does the interval width change? Work out how many cases you would need for a half-width of 3 percentage points.
resources:
  - title: Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena (Zheng et al.)
    url: https://arxiv.org/abs/2306.05685
---

## Why evals

A prompt change that fixes one example often breaks three others you did not look at. Reading a few outputs and thinking "this looks better" does not scale and is easy to fool.

An **eval** (evaluation) is a repeatable test: a fixed set of inputs, a way to score each output, and a single number you can compare before and after a change. It is the unit test of AI work.

:::key
No eval, no progress you can trust. Build the smallest eval first, then improve the system against it.
:::

## Build a test set

- Start with 20 to 50 real inputs. Take them from production logs, support tickets or your own usage, not only from imagination.
- For each, record what a good answer needs: an exact label, required facts, or a rule such as "must refuse".
- Cover normal cases, edge cases (empty input, other languages, typos) and known past failures.
- Add every new bug you find in production as a new case. The set grows with the product.
- Keep a **held-out** part you never tune on. If you adjust the prompt until the whole set passes, the score no longer predicts new data.

## Ways to grade

| Grader | How | Good for | Weak at |
|---|---|---|---|
| Code check | Exact match, regex, JSON schema, unit tests on generated code | Labels, formats, extraction, code | Open-ended text |
| LLM judge | A second model scores the output against a rubric | Tone, helpfulness, faithfulness | Biases; needs calibration |
| Human review | People rate outputs | Ground truth, new tasks | Slow, costly, inconsistent |

Prefer the cheapest grader that actually measures what you care about. Many tasks can be reshaped so code can grade them, for example by asking for a label first.

```python
import json
import numpy as np

# A tiny eval set: input plus what a correct answer must satisfy
cases = [
    {"q": "Charged twice for one order", "label": "refund"},
    {"q": "Where is my parcel", "label": "tracking"},
    {"q": "Do you sell gift cards", "label": "other"},
    {"q": "I want my money back", "label": "refund"},
]

def grade(output: str, case: dict) -> bool:
    """Code-based grader: valid JSON and the right label."""
    try:
        return json.loads(output).get("label") == case["label"]
    except (json.JSONDecodeError, AttributeError):
        return False

fake_outputs = ['{"label": "refund"}', 'Sure! tracking', '{"label": "other"}', '{"label": "tracking"}']
results = [grade(o, c) for o, c in zip(fake_outputs, cases)]
print(results, sum(results) / len(results))
```
```output
[True, False, True, False] 0.5
```

The two failures have different causes: one is a format failure (extra text, not JSON), the other a wrong label. Report them separately, because the fixes differ.

```predict
lang: python
code: |
  results = [True, False, True, True]
  print(sum(results) / len(results))
output: "0.75"
why: True counts as 1 and False as 0, so three passes out of four give 0.75.
```

## LLM as judge

For outputs with no single right answer, a second model can score against a written rubric.

```python
JUDGE_PROMPT = """You are grading a support reply.
Question: {question}
Sources: {sources}
Reply: {reply}

Score 1 to 5 for faithfulness: 5 means every claim is supported by the sources, 1 means unsupported claims.
Return only JSON: {{"score": <int>, "reason": "<one sentence>"}}"""

def call_llm(messages: list[dict], temperature: float = 0.0) -> str:
    """Placeholder for your provider's chat call."""
    raise NotImplementedError
```

Known problems with judges:

- **Position bias**: when comparing two answers, the first or second may be favoured. Swap the order and average.
- **Length bias**: longer answers often score higher regardless of quality.
- **Self-preference**: a model can favour text written by itself or a similar model.
- **Drift**: if the judge model is updated, scores shift.

Calibrate: have a person label 30 to 50 outputs, then check how often the judge agrees. Use a specific rubric ("every claim is supported") over a vague one ("is it good").

## Scores are noisy

With a small set, a difference between two versions may be luck. The code simulates two prompt versions on the same 50 cases and attaches a **95 percent interval**, a range that would contain the true accuracy in about 95 of 100 repeats of the experiment.

```python
import numpy as np

rng = np.random.default_rng(0)
n = 50
easy = rng.random(n)                       # each case has a hidden difficulty
v1 = easy < 0.70                           # version 1 solves about 70 percent
v2 = easy < 0.76                           # version 2 solves about 76 percent (same cases)

def ci95(x):                               # normal-approximation interval for a proportion
    p, n = float(x.mean()), len(x)
    half = 1.96 * float(np.sqrt(p * (1 - p) / n))
    return round(p, 2), round(p - half, 2), round(p + half, 2)

print("v1", ci95(v1))
print("v2", ci95(v2))
print("v2 only right:", int((v2 & ~v1).sum()), " v1 only right:", int((v1 & ~v2).sum()))
```
```output
v1 (0.7, 0.57, 0.83)
v2 (0.76, 0.64, 0.88)
v2 only right: 3  v1 only right: 0
```

- The intervals overlap heavily: 0.70 and 0.76 cannot be told apart from these 50 cases alone.
- Comparing both versions on the **same** cases is stronger. Here version 2 wins 3 cases and loses none.
- Even 3 wins to 0 is weak evidence: if each case were a coin flip, 3 straight wins happens 1 time in 8, so a two-sided test gives about 0.25.
- This is a simulation with an invented difficulty model, so treat it as a picture of the idea.

```estimate
q: You want the 95 percent interval around an accuracy near 50 percent to be about plus or minus 5 percentage points. Roughly how many test cases do you need?
answer: 385
unit: cases
tolerance: 0.2
hint: Half-width = 1.96 x sqrt(p x (1 - p) / n). Set it to 0.05 with p = 0.5 and solve for n.
solution: "n = 1.96^2 x 0.25 / 0.05^2 = 3.84 x 0.25 / 0.0025 = 384, so about 385 cases. Halving the width needs four times the cases."
```

## What to measure in a RAG system

Evaluate the parts separately (see the RAG lesson).

| Part | Metric | Question it answers |
|---|---|---|
| Retrieval | Recall at k | Was the right chunk in the top k? |
| Generation | Faithfulness | Is every claim supported by the retrieved text? |
| Whole answer | Correctness, refusal rate | Right answer, or a correct "I do not know"? |

## A working routine

```order
prompt: Arrange the eval-driven improvement loop.
lang: python
code: |
  baseline = run_eval(system_v1, cases)
  system_v2 = change_prompt(system_v1)
  candidate = run_eval(system_v2, cases)
  show_failures(baseline, candidate)
  if candidate.score > baseline.score:
      ship(system_v2)
distractors:
  - "ship(system_v2)   # looked better in two examples"
why: Always score the current version first, change one thing, score again on the same cases, read the failures, and only then decide.
```

- Change one thing at a time; otherwise you cannot tell which change mattered.
- Read the failing cases yourself. Averages hide patterns like "all failures are non-English".
- Run evals in CI (continuous integration, the automatic checks on each code change) so a regression is caught before release.
- After launch, add **online** signals: thumbs ratings, escalation to a human, and sampled review of real traffic.

:::truth
Building a good eval set is slow, unglamorous work, and it is where most of the quality comes from. Teams that skip it spend longer arguing about which prompt is better.
:::

```quiz
q: A judge model always prefers the longer of two answers, even when the shorter one is correct. What is the best response?
options:
  - Trust it, since longer answers contain more information
  - Name the bias, add rubric lines that penalise padding, and check the judge against human labels
  - Raise the temperature of the judge
answer: 1
why: Length bias is a known judge weakness. You fix it with a sharper rubric and verify the fix by measuring agreement with people, not by trusting the judge.
```

```cards
- q: What is an eval?
  a: A repeatable test of fixed inputs, a scoring method and one comparable number, used to judge changes.
- q: Why keep a held-out set?
  a: If you tune until the whole set passes, the score no longer predicts performance on new inputs.
- q: Name three weaknesses of LLM judges.
  a: Position bias, length bias and self-preference. Calibrate against human labels.
- q: How many cases give roughly plus or minus 5 points at 95 percent confidence near 50 percent accuracy?
  a: About 385. Halving the width needs four times as many.
- q: Why compare two versions on the same cases?
  a: Paired comparison removes case difficulty as a source of noise; you count wins and losses per case.
```

## Notes

:::notes
- Eval = fixed inputs + scorer + one number. Build it before optimising.
- Start with 20 to 50 real cases; add every production failure; keep a held-out part.
- Grade with code when possible, an LLM judge with a specific rubric otherwise, humans for ground truth.
- Judges have position, length and self-preference bias; calibrate against human labels.
- Small sets are noisy: interval half-width is about 1.96 x sqrt(p(1-p)/n); n near 385 gives +/-5 points.
- Compare versions on the same cases; read the failures, not just the average.
- RAG: measure retrieval (recall at k) and generation (faithfulness) separately.
- Run evals in CI and add online signals after launch.
:::
