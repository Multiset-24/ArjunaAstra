---
title: Sharding and Partitioning
summary: Split a dataset across machines - range versus hash, choosing a shard key, hot keys and resharding without downtime.
minutes: 30
difficulty: intermediate
tags: [sharding, partitioning, scaling, databases]
prereqs: [replication]
exercises:
  - Design the shard key for a chat app with 1 billion messages. Compare user_id, conversation_id and message_id, and say which queries each makes cheap or expensive.
  - A celebrity account gets 100 times the traffic of anyone else and one shard is overloaded. Give two ways to relieve it and what each costs.
  - You have 4 shards, each 80 percent full. Describe how to move to 8 shards with no downtime.
resources:
  - title: Redis Cluster specification (hash slots)
    url: https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/
  - title: Vitess - scalable MySQL clustering
    url: https://vitess.io/docs/
---

## Why split data

**Replication** copies the same data to many machines. **Sharding** (also called **partitioning**) splits different data across machines, so each holds only a slice called a **shard**.

Reach for it when one machine cannot keep up with:

- **Storage**: the dataset is bigger than one disk.
- **Write throughput**: one leader cannot absorb the writes.
- **Working set**: the hot data no longer fits in RAM.

Replication scales reads. Sharding scales writes and size. Real systems use both: each shard is itself a leader with followers.

:::truth
Sharding is expensive in complexity. Joins across shards, transactions across shards and global queries all get harder. First try indexes, caching, bigger hardware, read replicas and archiving old data. A single well-tuned PostgreSQL server handles far more than most people expect.
:::

## Range partitioning

Each shard owns a contiguous range of the key, for example users A-F on shard 1, G-M on shard 2.

- Good: range scans are cheap ("all orders from Jan 1 to Jan 7" touches one or few shards). Keys stay sorted.
- Bad: **hot spots**. If the key is a timestamp, today's writes all hit the newest shard while older shards sit idle.
- Used by: HBase, Google Bigtable, MongoDB with range sharding, CockroachDB.

## Hash partitioning

Apply a hash function to the key, then map the hash to a shard. Common form: `shard = hash(key) mod N`.

- Good: spreads keys evenly, so load is balanced even if keys are sequential.
- Bad: neighbouring keys land on different shards, so range scans must ask every shard (**scatter-gather**).
- Used by: Cassandra (Murmur3 partitioner), DynamoDB, Redis Cluster.

```predict
lang: python
prompt: "A toy hash: key mod 3. Which shard does each key land on?"
code: |
  keys = [10, 11, 12, 13, 14, 15]
  print([k % 3 for k in keys])
output: "[1, 2, 0, 1, 2, 0]"
why: Consecutive keys rotate across the shards, giving an even spread. Notice that 10 and 11 are neighbours but live on different shards, which is why range queries become scatter-gather.
```

| | Range | Hash |
|---|---|---|
| Even load | Only if key is well spread | Usually yes |
| Range queries | Cheap | Expensive |
| Hot spots | Sequential keys, such as time | Single hot keys |
| Typical keys | Timestamp, alphabetical | User id, order id |

## Choosing a shard key

The **shard key** decides everything: where data lives and which queries are cheap. A good key has:

- **High cardinality**: many distinct values (a `country` key gives at most about 200 shards).
- **Even distribution**: no value holds a large share of the traffic.
- **Query alignment**: your most frequent queries include the key, so they hit one shard.

Example: for an e-commerce app, `user_id` makes "my orders" a single-shard query. But "all orders for product X" now touches every shard. You accept that, or maintain a second copy of the data keyed by product (a **secondary index** or a separate search store).

```quiz
q: A messaging app shards messages by `sender_id`. Which query becomes expensive?
options:
  - Fetch everything one user has sent
  - Fetch the full conversation between two users
  - Insert a new message
answer: 1
why: "A conversation contains messages from two senders who live on different shards, so reading it needs scatter-gather and merging. Sharding by conversation_id keeps one conversation on one shard."
```

## Hot keys and skew

Even a hash spreads keys, not traffic. One celebrity user or one viral product can overload a single shard. This is **skew**.

Mitigations:

- **Salting**: append a small random suffix (`celeb#0` to `celeb#9`) so writes spread over 10 shards. Reads must query all 10 and combine.
- **Cache** hot reads in front (Redis, CDN).
- **Dedicated shard** or extra replicas for known heavy keys.
- **Split on load**: some systems split a hot range automatically (HBase, Bigtable, CockroachDB).

## Resharding

Data grows, so the shard count must grow. The naive scheme `hash(key) mod N` is a trap: changing N from 4 to 5 remaps most keys, forcing a huge data move.

Better approaches:

- **Many fixed partitions**: create far more partitions than machines (for example 1,024 over 8 nodes) and move whole partitions between nodes. The key-to-partition mapping never changes. Redis Cluster does this with 16,384 **hash slots**. Kafka and Elasticsearch also use fixed partition or shard counts.
- **Consistent hashing**: only a small fraction of keys move when a node joins. That is the next lesson.
- **Directory service**: a lookup table says which shard holds which key range. Flexible but the directory becomes a component to keep available.

Online resharding recipe: copy data to the new layout in the background, send writes to both, verify, then switch reads.

```estimate
q: Your database takes 40,000 writes per second at peak. A single shard comfortably handles 5,000 writes per second. Minimum shards needed, ignoring headroom?
answer: 8
unit: shards
tolerance: 0.01
hint: Divide total load by per-shard capacity.
solution: "40,000 / 5,000 = 8 shards. In practice add headroom of 30 to 50 percent for skew and growth, so plan for 12 or more, or choose many small partitions."
```

## Costs you take on

- **Cross-shard joins**: avoid by denormalising (storing related data together) or joining in the application.
- **Cross-shard transactions**: need two-phase commit or sagas, both slower and more fragile. Better to design so a transaction stays inside one shard.
- **Global unique ids**: auto-increment per shard collides. Use Snowflake-style ids (covered in a later lesson).
- **Operations**: backups, schema changes and monitoring multiply by shard count.

Tools: Vitess (sharding for MySQL), Citus (for PostgreSQL), MongoDB sharded clusters, Cassandra and DynamoDB (sharded by design).

```cards
- q: What is the difference between replication and sharding?
  a: Replication copies the same data to many nodes. Sharding splits different data across nodes.
- q: Range partitioning - main benefit and main risk?
  a: Cheap range scans, but sequential keys such as timestamps create a hot shard.
- q: Hash partitioning - main benefit and main cost?
  a: Even spread of keys, but range queries need scatter-gather across all shards.
- q: Three traits of a good shard key?
  a: High cardinality, even distribution of load, and alignment with your most common queries.
- q: Why is hash(key) mod N bad for resharding?
  a: Changing N remaps most keys, so nearly all data must move.
- q: How do you relieve a hot key?
  a: Salt the key across several shards, cache its reads, or give it dedicated capacity.
```

## Interview angle

- State why you shard (size or write throughput) before how.
- Name the shard key, then list one query it makes cheap and one it makes expensive.
- Pick hash for even load, range when scans matter, and mention hot keys unprompted.
- Say how you will reshard: fixed partitions or consistent hashing, never plain mod N.

## Notes

:::notes
- Sharding splits data across machines to scale storage and writes. Replication copies data to scale reads and availability. Use both.
- Delay sharding: try indexes, caching, bigger hardware and read replicas first.
- Range partitioning: ordered, cheap scans, risk of hot spots on sequential keys (HBase, Bigtable).
- Hash partitioning: even spread, range queries become scatter-gather (Cassandra, DynamoDB, Redis Cluster).
- Good shard key: high cardinality, even load, matches the common query.
- Hot keys: salting, caching, dedicated shards, automatic splitting.
- Avoid hash mod N for resharding. Use many fixed partitions (Redis 16,384 slots) or consistent hashing.
- Costs: cross-shard joins and transactions, unique ids, operational overhead.
:::
