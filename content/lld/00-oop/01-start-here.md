---
title: Start Here - LLD and OOP
summary: What low-level design rounds ask for, how Java and C++ differ in object-oriented code, and what to expect from this track.
minutes: 15
difficulty: beginner
tags: [lld, oop, interview, start]
prereqs: []
exercises:
  - Pick any app you use daily (a food-delivery app, a notes app). List five nouns from it that could become classes, and one verb each could own.
  - In one sentence each, say what a class, an object and a method are. Then check your answers against the next lesson.
---

## What LLD is

**LLD (Low-Level Design)** means deciding the classes, their fields, their methods and how they talk to each other. **HLD (High-Level Design)**, also called system design, decides servers, databases and queues.

| | HLD (system design) | LLD (object design) |
|---|---|---|
| Question | How do 10 million users fit? | How is the code organised so it stays easy to change? |
| Unit | Services, databases, caches | Classes, interfaces, methods |
| Output | Box-and-arrow diagram | Class diagram plus working code |
| Example | Design a URL shortener | Design a parking lot |

```quiz
q: Which of these is an LLD question?
options:
  - Choose between Kafka and RabbitMQ for order events
  - Decide how many database shards a chat app needs
  - Decide which classes and interfaces a vending machine needs
answer: 2
why: Classes and interfaces are the unit of LLD. The other two are about infrastructure, which is HLD.
```

## What a machine-coding round looks like

A **machine-coding round** gives you 45 to 90 minutes, a problem statement and an editor. You must produce running code, not just a diagram. A common flow:

1. Ask questions and fix the requirements (2 to 3 minutes of clarifying is normal).
2. List the entities: the nouns in the requirements.
3. Sketch a class diagram.
4. Write the core classes and a `main` that demonstrates them.
5. Talk through how a new requirement would fit.

```order
prompt: Put the steps of a machine-coding round in a sensible order.
lang: text
code: |
  1. Clarify the requirements
  2. List the entities (nouns)
  3. Sketch the class diagram
  4. Write core classes and a demo main
  5. Discuss extensions
why: Code written before the requirements and entities are clear usually gets rewritten halfway through.
```

:::truth
Most candidates lose points for messy, hard-to-extend code, not for a missing feature. A smaller design that runs and is easy to extend beats a large one that does not compile.
:::

## Java and C++ side by side

This track shows both languages. The ideas are identical; the defaults differ. Skim the table now and return to it when a lesson mentions a difference.

| Topic | Java 17 | C++17 |
|---|---|---|
| Objects | Variables hold references to objects on the heap | Variables can hold the object itself (a value) |
| Memory | Garbage collector frees objects | You manage lifetime; use smart pointers (`std::unique_ptr`) |
| Polymorphic method | Overridable by default | Only if marked `virtual` |
| Interface | `interface` keyword | A class with only pure virtual methods |
| Multiple inheritance | Interfaces only | Allowed for classes |
| Access control | Modifier on each member | `public:` / `private:` sections |
| Cleanup | `AutoCloseable`, try-with-resources | Destructor, runs when the object goes out of scope |
| Null | `null` for any reference | `nullptr` for pointers; references cannot be null |

:::key
The biggest practical difference: in Java, `b = a` copies a reference. In C++, `b = a` copies the whole object unless `b` is a reference or pointer.
:::

## A first taste

One tiny class in both languages. A **class** is a blueprint; an **object** is one thing built from it. Here `Account` holds a balance and offers one operation.

```java
class Account {
    private int balance;

    Account(int opening) { balance = opening; }

    void deposit(int amount) { balance += amount; }

    int balance() { return balance; }
}

public class Main {
    public static void main(String[] args) {
        Account a = new Account(100);
        Account b = a;          // b points to the same object as a
        b.deposit(50);
        System.out.println("a=" + a.balance());
    }
}
```
```cpp
#include <iostream>

class Account {
    int balance;

public:
    explicit Account(int opening) : balance(opening) {}

    void deposit(int amount) { balance += amount; }

    int getBalance() const { return balance; }
};

int main() {
    Account a(100);
    Account& b = a;         // b is another name for a
    b.deposit(50);
    std::cout << "a=" << a.getBalance() << "\n";
}
```
```output
a=150
```

Both print the same, but only because the C++ code used `Account&` (a reference). Predict what happens with a plain copy.

```predict
lang: cpp
code: |
  Account a(100);
  Account b = a;
  b.deposit(50);
  cout << a.getBalance() << " " << b.getBalance();
output: 100 150
why: "`Account b = a;` copies the object. Depositing into b leaves a untouched."
```

## Honest expectations

- Reading about design is not enough. You learn it by writing a class, feeling it get awkward, and fixing it.
- Patterns are vocabulary. Using one where a plain class works is a mistake, not a skill.
- Plan for the full path: OOP basics, SOLID principles, the common patterns, then case studies. Each case study asks you to change the design, because that is where weak designs break.
- Write the code by hand in Java or C++ at least once per case study. Time yourself against 45 to 60 minutes.

```quiz
q: What is the most useful way to practise LLD?
options:
  - Memorise the class diagrams of famous problems
  - Write the code, then add a new requirement and see what has to change
  - Read more pattern descriptions before writing any code
answer: 1
why: Design quality shows when requirements change. Memorised diagrams do not survive a follow-up question.
```

```cards
- q: What does LLD decide?
  a: The classes, interfaces, fields and methods of a program, and how they interact.
- q: How does LLD differ from HLD?
  a: HLD chooses services, databases and queues for scale. LLD organises the code inside one service.
- q: What does Account b = a; do in Java?
  a: Copies the reference, so both names point to the same object.
- q: What does Account b = a; do in C++?
  a: Copies the whole object. Use Account& or a pointer to share it.
- q: In C++, which methods can a subclass override polymorphically?
  a: Only those declared virtual in the base class.
```

## Notes

:::notes
- LLD = classes, interfaces and methods inside a program. HLD = servers, databases, queues.
- Machine-coding round: clarify, list entities, sketch classes, code a runnable demo, discuss extensions.
- Interviewers reward code that runs and is easy to extend, not the largest design.
- Java: references to heap objects, garbage collector, overridable by default, interfaces keyword.
- C++: values by default, manual lifetime with smart pointers, `virtual` is opt-in, interface = pure virtual class.
- Java `b = a` shares the object; C++ `b = a` copies it unless b is a reference or pointer.
- Patterns are vocabulary, not goals. Practise by changing a working design.
:::
