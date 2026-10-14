---
title: Start Here
summary: What system design is, how this track is laid out, what interviews actually test, and how to practise without fooling yourself.
minutes: 15
difficulty: beginner
tags: [orientation, interviews]
prereqs: []
exercises:
  - Pick an app you use daily. Write down five things it must do and three numbers (users, requests per second, data size) you would need to guess before designing it.
  - Draw the path of one tap in that app, from your phone to a database and back, using only boxes and arrows. Mark every place it could be slow.
resources:
  - title: The System Design Primer
    url: https://github.com/donnemartin/system-design-primer
---

## What system design is

System design means deciding how the parts of a software product fit together so it keeps working as more people use it.

A single program on one laptop is easy to reason about. A product used by millions is not. It runs on many machines (servers), stores data in more than one place, and must survive machines failing. The design is the answer to questions like:

- Where does the data live, and how is it copied?
- What happens when one server dies at 2 a.m.?
- How do we keep a page fast when ten thousand people open it at once?
- What do we give up to get that speed?

That last question is the core of the subject. Almost every choice trades one good thing for another: speed for freshness, simplicity for scale, cost for safety.

:::key
There is rarely a correct design. There is a design that fits the requirements and numbers you have, and you can explain why.
:::

## How this track is laid out

The track has four stages. Each one assumes the one before it.

| Stage | What you learn | Example topics |
|---|---|---|
| Foundations | How a request travels, how to estimate load | IP, DNS, HTTP, APIs, back-of-the-envelope maths |
| Building blocks | The standard parts of any large system | Load balancers, caches, CDNs (Content Delivery Networks), databases, sharding |
| Distributed patterns | Techniques for many machines working together | Message queues, rate limiting, reliability, observability |
| Case studies | Complete designs, end to end | URL shortener, chat, news feed, payments |

Each lesson ends with short notes you can copy down and flashcards that join your review deck.

```quiz
q: In which order should you study the stages?
options:
  - Case studies first, because they are the closest to interviews
  - Foundations, building blocks, patterns, then case studies
  - Any order, since the topics are independent
answer: 1
why: Case studies combine everything else. Without the numbers and the building blocks, a case study is a diagram you memorise instead of a design you can reason about.
```

## What interviews actually test

A system design interview is a 45 to 60 minute conversation. You get a vague prompt such as "design a chat app" and an interviewer who plays a colleague. They are not checking whether you know the one right answer. They are watching four things:

1. **Clarifying.** Do you ask what the product must do and how big it is before drawing anything?
2. **Estimating.** Can you turn "10 million users" into requests per second and gigabytes?
3. **Structuring.** Can you go from a simple design to a scaled one in clear steps?
4. **Trade-offs.** When you pick a database or a cache, can you say what it costs and when you would pick differently?

Memorised diagrams fail at point four. If you draw Kafka (a distributed log used to pass messages between services) because you saw it in a video, and cannot say why a plain queue would not do, the diagram counts against you.

:::warn
The most common failure is jumping straight to boxes and technology names. Interviewers read that as not understanding the problem.
:::

## How to practise

Reading is the start, not the practice. A loop that works:

1. Read a lesson, then close it and explain the idea aloud in your own words.
2. Do the exercises at the end. Write the answer, do not just think it.
3. Take a case study. Spend 20 minutes designing it alone on paper before reading ours.
4. Compare. Note what you missed, and write each miss as a one-line rule in your own notes.
5. Redo the same case study a week later from a blank page.

```order
prompt: Arrange one practice session on a case study.
lang: text
code: |
  Write requirements and rough numbers
  Sketch a simple design on paper
  Read the reference design
  List what you missed as one-line rules
  Redo it from a blank page a week later
distractors:
  - Memorise the reference diagram
why: Attempting first makes the reading stick, because you now know which gaps you have. Memorising a diagram trains recall of a picture, not reasoning.
```

## Honest expectations

:::truth
Articles alone will not make you good at this. Experience building and operating real systems matters most, and a few weeks of reading will not replace it. What reading can do is give you the vocabulary, the numbers and a repeatable method, which is enough to do well in most interviews.
:::

- Expect each lesson to take longer than its minutes if you do the exercises.
- Expect to forget details. The notes and cards exist for that.
- Expect to feel lost on your first case study. That is normal and shrinks fast with repetition.
- Skip nothing in Foundations. It is short, and every later lesson uses it.

```quiz
questions:
  - q: An interviewer asks you to design a photo-sharing app. What is the best first move?
    options:
      - Draw a load balancer, cache and database
      - Ask what the app must do and roughly how many users it has
      - Choose between SQL and NoSQL
    answer: 1
    why: Requirements and scale decide every later choice. Drawing first means you are solving an unknown problem.
  - q: Which statement about system design is most accurate?
    options:
      - Each problem has one correct architecture
      - Good designs are the ones with the most components
      - Good designs match the requirements and make their trade-offs explicit
    answer: 2
    why: Extra components add cost and failure points. A simple design you can justify beats a complex one you cannot.
```

```cards
- q: What is system design, in one sentence?
  a: Choosing how the parts of a product fit together so it stays fast, available and correct as usage grows.
- q: What are the four things a system design interview checks?
  a: Clarifying requirements, estimating load, structuring the design in steps, and explaining trade-offs.
- q: What is the most common interview mistake?
  a: Drawing boxes and naming technologies before clarifying requirements and scale.
- q: Why attempt a case study before reading the reference?
  a: Attempting first exposes your specific gaps, which makes the reference design easier to remember.
```

## Notes

:::notes
- System design = deciding how components fit together so a product stays fast, available and correct at scale.
- Every choice is a trade-off. Always be ready to say what you gave up.
- Track order: foundations, building blocks, patterns, case studies.
- Interviews test clarifying, estimating, structuring and trade-offs, not memorised diagrams.
- Never start by drawing boxes. Start with requirements and numbers.
- Practise by attempting a case study alone before reading the reference.
- Redo a case study a week later from a blank page.
- Reading builds vocabulary and method. Real experience builds judgement.
:::
