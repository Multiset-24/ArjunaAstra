---
title: Unique ID Generation
summary: How distributed systems create IDs that never collide, from auto-increment and UUIDs to time-ordered Snowflake IDs.
minutes: 25
difficulty: intermediate
tags: [ids, snowflake, uuid, distributed-systems]
prereqs: [databases-sql-vs-nosql, indexing, back-of-the-envelope]
exercises:
  - Design an ID scheme for a chat app that must sort messages by time, be unique across 50 servers, and avoid a central database call per message. Choose bit sizes and justify them.
  - Your Snowflake generator host reboots and its clock is 3 seconds behind the last ID it issued. Describe what could go wrong and what the code should do.
  - Compare UUID v4, UUID v7 and an auto-increment column as the primary key of a PostgreSQL orders table with 500 million rows. Which would you pick and why?
resources:
  - title: RFC 9562 - Universally Unique IDentifiers (UUIDs)
    url: https://www.rfc-editor.org/rfc/rfc9562
---

## Why IDs are a design problem

Every row, message and file needs an **ID** (identifier) that no other item shares. On one database this is trivial. With many servers creating records at once, two of them must never pick the same ID, and ideally nobody should wait on a central service.

Properties you may want:

- **Unique** across all machines. This one is mandatory.
- **Sortable by time.** Newer IDs are larger, so "latest 20 items" is cheap.
- **Compact.** A 64-bit number is half the size of a 128-bit UUID in every index and foreign key.
- **Not guessable.** Sequential public IDs let anyone count your orders or scrape `/users/1`, `/users/2`, ...
- **Generated locally.** No network call per ID.

No scheme gives all five. The options below trade them off.

## Option 1: database auto-increment

`BIGSERIAL` in PostgreSQL or `AUTO_INCREMENT` in MySQL hands out 1, 2, 3, ...

- Pros: tiny, sorted, simple.
- Cons: one database is the single source of IDs. After sharding (splitting data across databases) each shard would generate the same numbers.
- Leaks business volume: an ID of 48,213 tells competitors your order count.
- Workaround: give each database a different step (server A odd, server B even). It works for two or three servers and gets painful after that.
- A **ticket server** (Flickr's design) is one dedicated database that only issues numbers. It is simple, but it is a single point of failure unless replicated.

## Option 2: UUIDs

A **UUID** (Universally Unique Identifier) is a 128-bit value written as 36 characters, such as `550e8400-e29b-41d4-a716-446655440000`.

| Version | Made of | Sortable | Notes |
|---|---|---|---|
| v4 | 122 random bits | No | Collision chance is negligible; no coordination needed |
| v7 | 48-bit millisecond timestamp + random bits | Yes | Standardised in RFC 9562 (2024); good database key |

Why v4 hurts at scale: a primary key is stored in a **B-tree** index (a sorted tree on disk). Random keys land in random places, so inserts touch many pages, split them and push the hot working set out of memory. Time-ordered keys (v7, ULID, Snowflake) append near the right edge, which databases handle well.

```quiz
q: You switch a 400-million-row table's primary key from UUID v4 to UUID v7. What improves most?
options:
  - Collision probability drops to zero
  - Inserts become mostly appends at the end of the index, so fewer page splits and better cache use
  - The ID shrinks from 128 to 64 bits
answer: 1
why: "Both are 128 bits and both are practically collision-free. The gain is locality: v7 starts with a timestamp, so new keys sort near each other."
```

## Option 3: Snowflake-style 64-bit IDs

**Snowflake** is the scheme Twitter described: an ID is a 64-bit integer built from three fields.

```text
| 1 bit  | 41 bits         | 10 bits    | 12 bits  |
| unused | ms since epoch  | machine id | sequence |
```

- **Timestamp (41 bits).** Milliseconds since a custom epoch (a start date you pick, such as the day you launched). Because it is the high part, IDs sort by creation time.
- **Machine id (10 bits).** Which worker made it: up to 1,024 workers. Assigned at startup from ZooKeeper, etcd or config.
- **Sequence (12 bits).** A counter that resets every millisecond: up to 4,096 IDs per millisecond per worker.

Each worker needs no network call: it reads its clock, its own id and its counter. If the counter hits 4,096 in one millisecond, it waits for the next millisecond.

```predict
lang: java
prompt: Build a Snowflake-style ID with the layout above. What does this print?
code: |
  long ts = 5, machine = 3, seq = 7;
  long id = (ts << 22) | (machine << 12) | seq;
  System.out.println(id);
output: "20983815"
why: "The timestamp is shifted past 10 + 12 = 22 bits, giving 5 x 4,194,304 = 20,971,520. The machine id shifted by 12 adds 12,288, and the sequence adds 7."
```

```estimate
q: The timestamp field has 41 bits of milliseconds. How many years until it overflows?
answer: 70
unit: years
tolerance: 0.1
hint: 2^41 is about 2.2 x 10^12 ms. A year is about 3.15 x 10^10 ms.
solution: "2^41 ms = 2.2 x 10^12 ms. Divided by 3.15 x 10^10 ms per year it is about 69.7 years from your chosen epoch. Choosing the epoch near launch buys the full span."
```

:::key
Throughput per worker is 4,096 IDs per millisecond, about 4 million per second. Across 1,024 workers that is over 4 billion IDs per second, far more than most companies need.
:::

## The clock problem

Snowflake trusts the machine's clock. Clocks drift, and **NTP** (Network Time Protocol, which syncs clocks over the network) can step a clock backwards.

If the clock moves back, the generator might produce a timestamp it already used with the same machine id and sequence. That is a duplicate ID.

Defences:

- Store the last timestamp used. If `now < last`, do not issue. Wait until the clock catches up, or throw an error for a small gap.
- Run NTP in slew mode (gradual adjustment) instead of stepping.
- On restart, wait a safe interval before issuing IDs.
- Two workers must never share a machine id. Duplicated machine ids cause silent collisions.

:::truth
Snowflake IDs are only roughly ordered across machines. Two workers with clocks 5 ms apart can issue IDs out of true order. If you need strict global ordering, you need a single sequencer, which limits throughput.
:::

## In the real world

- **Twitter, Discord** use Snowflake-style IDs. Instagram generates 64-bit IDs inside PostgreSQL shards using a similar bit layout.
- **MongoDB ObjectId** is 12 bytes: timestamp, random value, counter.
- **UUID v7** is a good default when you do not want to run an ID service. **ULID** is a similar sortable 128-bit format.
- Keep internal IDs sortable but consider a separate random public ID if enumeration matters.

```blanks
prompt: Complete the bit budget of a Snowflake ID.
lang: text
code: |
  1 bit unused + [[41]] bits timestamp + 10 bits machine + [[12]] bits sequence = 64 bits
why: 1 + 41 + 10 + 12 = 64. The 12-bit sequence allows 2^12 = 4,096 IDs per millisecond per machine.
```

## Interview angle

- Start from requirements: must IDs sort by time, fit in 64 bits, avoid a central call?
- Rule out auto-increment for sharded data, then compare UUID v7 and Snowflake.
- Lay out the bits, compute capacity, then name the clock-skew risk and the machine-id assignment.

```cards
- q: Layout of a Snowflake ID?
  a: 1 unused bit, 41 bits of milliseconds since a custom epoch, 10 bits machine id, 12 bits sequence.
- q: Why is UUID v4 a poor database primary key at scale?
  a: Random values scatter inserts across the B-tree index, causing page splits and poor cache use.
- q: What does UUID v7 fix?
  a: It starts with a millisecond timestamp, so IDs are time-sortable and inserts are nearly append-only.
- q: What breaks if a Snowflake worker's clock moves backwards?
  a: It may reissue a timestamp with the same machine id and sequence, creating duplicate IDs. Refuse or wait until the clock catches up.
```

## Notes

:::notes
- Wanted: unique, time-sortable, compact, not guessable, generated without a network call. No scheme gives all.
- Auto-increment: simple and small, but a single bottleneck, leaks volume, and breaks across shards.
- UUID v4: 128 random bits, no coordination, but random inserts hurt B-tree indexes.
- UUID v7: timestamp first, so sortable and index-friendly; standardised in RFC 9562.
- Snowflake: 1 + 41 timestamp + 10 machine + 12 sequence bits; 4,096 IDs per ms per worker; about 70 years of range.
- Clock moving backwards can cause duplicates: store the last timestamp, wait or fail.
- Machine ids must be unique per running worker.
- IDs from different machines are only roughly time-ordered.
:::
