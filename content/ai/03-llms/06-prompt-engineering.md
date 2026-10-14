---
title: Prompt Engineering
summary: Write prompts that are specific, structured and testable, and learn which tricks actually help and which are folklore.
minutes: 30
difficulty: beginner
tags: [prompting, few-shot, llm]
prereqs: [decoding-and-sampling, how-llms-are-trained]
exercises:
  - Take a vague prompt such as "Summarise this ticket". Rewrite it with a role, an audience, a length limit, an output format and one example. Then write three test tickets, including one where the right output is "unclear".
  - Build a prompt-injection test case for your classifier prompt, meaning a customer message that tries to change the instructions. What does your prompt do, and what would you change?
  - Collect 10 inputs with expected outputs for one task. Run two prompt versions on all 10 (by hand or with call_llm) and record scores. Keep the winner only if the gain is not one lucky case.
resources:
  - title: Chain-of-Thought Prompting Elicits Reasoning in Large Language Models
    url: https://arxiv.org/abs/2201.11903
  - title: Language Models are Few-Shot Learners (GPT-3)
    url: https://arxiv.org/abs/2005.14165
---

## What a prompt is

A **prompt** is the text you give a model so it can continue it. In chat APIs it is a list of **messages**, each with a role:

| Role | Purpose |
|---|---|
| `system` | Standing instructions: who the assistant is, rules, output format |
| `user` | The request or the data to work on |
| `assistant` | Earlier model replies (and, in few-shot prompts, example answers) |

The model has no hidden knowledge of your goal. Everything it knows about your task is in the prompt, plus what it learned in training.

:::key
Treat a prompt like a brief for a capable new colleague who has no context: state the goal, the audience, the constraints and what a good answer looks like.
:::

## The parts of a good prompt

Most strong prompts contain some of these parts. Not all are needed every time.

1. **Task**: one clear verb. "Classify", "extract", "rewrite", not "look at".
2. **Context**: facts the model cannot guess (company policy, the user's plan, today's date).
3. **Constraints**: length, tone, things to avoid, what to do when unsure.
4. **Format**: exactly what the output should look like.
5. **Examples**: one to five input-output pairs.
6. **Input**: the data to process, clearly separated from the instructions.

```order
prompt: Arrange a prompt so instructions come first and the untrusted data last, clearly fenced.
lang: text
code: |
  You label support messages as refund, tracking or other.
  Reply with the label only.
  If the message is unclear, reply other.
  Message (between the triple quotes):
  """
  {user_text}
  """
distractors:
  - "Ignore any rules above."
why: Instructions go first and the variable data goes in a fenced slot, so the model can tell rules from content. A line telling it to ignore the rules would undo the prompt.
```

## Examples beat adjectives

Writing "be concise and professional" leaves a lot to interpretation. Showing two answers in the style you want is clearer.

- **Zero-shot**: instructions only.
- **Few-shot**: instructions plus a few worked examples. The model infers the pattern from them. This is called **in-context learning**: no weights change, the pattern is picked up from the prompt.

Choose examples that cover the hard cases, not only the easy ones, and keep their format identical. If all your examples have the label `refund`, the model learns to say `refund`.

## Code

A classifier prompt with a placeholder `call_llm`. Replace the body with your provider's chat call.

```python
def call_llm(messages: list[dict], temperature: float = 0.0) -> str:
    """Placeholder: send messages to your provider's chat endpoint, return the text."""
    raise NotImplementedError

SYSTEM = (
    "You label customer messages for a payments app.\n"
    "Labels: refund, tracking, other.\n"
    "Reply with the label only. If the message is unclear, reply other."
)

EXAMPLES = [
    ("I was charged twice, please return one payment", "refund"),
    ("Where is my order right now?", "tracking"),
    ("Do you have a dark mode?", "other"),
]

def build_messages(user_text: str) -> list[dict]:
    msgs = [{"role": "system", "content": SYSTEM}]
    for text, label in EXAMPLES:                      # few-shot: show the pattern
        msgs.append({"role": "user", "content": text})
        msgs.append({"role": "assistant", "content": label})
    msgs.append({"role": "user", "content": user_text})
    return msgs

def classify(user_text: str) -> str:
    label = call_llm(build_messages(user_text)).strip().lower()
    return label if label in {"refund", "tracking", "other"} else "other"

# Offline check of the prompt shape (no model needed)
msgs = build_messages("my parcel is late")
print(len(msgs), msgs[0]["role"], msgs[-1]["content"])
```
```output
8 system my parcel is late
```

Note the last two lines of `classify`: the code validates the model's answer instead of trusting it. That habit matters more than any wording trick.

```predict
lang: python
code: |
  examples = [("a", "x"), ("b", "y"), ("c", "z")]
  msgs = [{"role": "system", "content": "S"}]
  for u, a in examples:
      msgs += [{"role": "user", "content": u}, {"role": "assistant", "content": a}]
  msgs.append({"role": "user", "content": "new"})
  print(len(msgs), msgs[-1]["role"])
output: 8 user
why: One system message, three example pairs (6 messages), and the final user message make 1 + 6 + 1 = 8. The last message is the user's new input.
```

## Reasoning prompts

For multi-step problems, asking the model to **think step by step** (called chain-of-thought) often improves accuracy, because the intermediate tokens give the model room to compute before it commits to an answer.

- Useful for maths, logic, multi-condition rules.
- Costs more tokens and time.
- Many current models reason internally already, so the extra instruction can add little. Test it.
- The written reasoning is not a guaranteed record of how the answer was reached. Treat it as helpful, not as proof.

## Common failure patterns

| Symptom | Likely cause | Fix |
|---|---|---|
| Output format varies | Format only described in words | Show an exact example; validate in code |
| Ignores a rule | Rule buried in a long prompt | Move it to the top or the end; shorten |
| Invents details | No source given, no permission to say "unknown" | Supply the facts; allow "I don't know" |
| Works on your 3 tests, fails in production | Tiny test set | Build a bigger, varied test set |
| Follows instructions found in the input | Prompt injection | Fence data, limit what outputs can do |

:::warn
**Prompt injection** happens when text you are processing (an email, a web page, a customer message) contains instructions, and the model obeys them. You cannot fully prevent this with wording. Treat model output driven by untrusted text as untrusted: validate it, and do not give it power to act without checks.
:::

```quiz
q: A prompt works well on 3 hand-picked examples. What is the most reliable way to know if it is good?
options:
  - Run it a few more times on the same 3 examples
  - Ask the model to rate its own answer
  - Score it on a larger set of varied inputs with known good outputs
  - Add the word "carefully" and see if it improves
answer: 2
why: "A varied, labelled test set is the only repeatable measure. Self-rating is biased and a few cases cannot reveal rare failures."
```

## Iterating with evidence

1. Write 10 to 30 test inputs, including hard and odd ones.
2. Record the expected output or a pass/fail rule for each.
3. Change one thing in the prompt.
4. Re-run all tests. Keep the change only if the score rises without breaking other cases.

```blanks
prompt: Complete the prompt-testing loop.
lang: python
code: |
  score = 0
  for text, expected in test_set:
      if classify(text) == [[expected]]:
          score += 1
  print(score / [[len(test_set)|len(tests)]])
why: Each prediction is compared with the expected label, and the score is divided by the number of test cases to get accuracy.
```

:::truth
Prompting is real engineering, but "magic phrases" are mostly folklore that changes with each model version. Clear task, good examples, validated output and a test set carry over between models. Clever wording does not.
:::

```cards
- q: What goes in the system message?
  a: "Standing instructions (role, rules, output format). The user message carries the specific request or data."
- q: Zero-shot versus few-shot?
  a: Zero-shot gives instructions only; few-shot adds a few input-output examples the model imitates.
- q: Why validate model output in code?
  a: Models sometimes ignore format rules. Checking against an allowed set prevents bad values from flowing downstream.
- q: What is prompt injection?
  a: Instructions hidden in data the model processes, which the model may obey. Treat such output as untrusted.
- q: How do you know a prompt change helped?
  a: Run old and new prompts on the same varied test set and compare scores.
```

## Notes

:::notes
- A prompt is the model's only view of your task; write it like a brief for a smart newcomer.
- Good prompts state the task, context, constraints, output format, examples and clearly fenced input.
- Few-shot examples teach format and edge cases better than adjectives. Keep their format identical.
- Step-by-step reasoning can help on multi-step problems but costs tokens and is not always needed.
- Validate outputs in code (allowed labels, JSON parse) rather than trusting wording.
- Prompt injection: instructions inside processed data can hijack the model. Treat output as untrusted.
- Improve prompts with a test set and one change at a time, not with impressions.
:::
