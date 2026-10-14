---
title: Databases - SQL vs NoSQL
summary: What ACID and isolation levels guarantee, the main NoSQL families, and a practical way to choose.
minutes: 30
difficulty: intermediate
tags: [databases, sql, nosql, acid]
prereqs: [scaling-basics]
exercises:
  - Pick a database for each - bank ledger, chat message history, product catalogue with search, session store, social graph of friends - and justify each in two lines.
  - Two users book the last seat at the same moment. Show two ways to prevent a double booking, one with an isolation level or lock and one with a unique constraint.
  - Your PostgreSQL table has 2 billion rows and writes are growing. List what you would try before moving to a NoSQL store.
resources:
  - title: PostgreSQL documentation - Transaction isolation
    url: https://www.postgresql.org/docs/current/transaction-iso.html
  - title: Apache Cassandra documentation
    url: https://cassandra.apache.org/doc/latest/
---

## Two big families

A **database** stores data durably and lets you query it. Two broad families:

- **Relational (SQL)**: data lives in **tables** of rows and columns; tables link through keys; you query with SQL (Structured Query Language). Examples: **PostgreSQL**, **MySQL**.
- **NoSQL** ("not only SQL"): an umbrella for stores that drop part of the relational model to gain flexibility or scale. Examples: Redis, MongoDB, Cassandra.

```sql
SELECT o.id, u.name, o.total
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.created_at > now() - interval '1 day';
```

A **join** combines rows from two tables. Relational databases are very good at this; many NoSQL stores do not offer it.

## ACID

A **transaction** groups several changes into one unit. **ACID** names four promises a relational database makes about it:

| Letter | Meaning | Bank transfer example |
|---|---|---|
| **Atomicity** | All of the changes happen or none do | Debit and credit both apply, or neither |
| **Consistency** | Rules (constraints) always hold after a commit | Balance never drops below zero if forbidden |
| **Isolation** | Concurrent transactions do not see each other's half-done work | Two transfers do not corrupt each other |
| **Durability** | Once committed, it survives a crash | Power loss does not undo the transfer |

```sql
BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;
COMMIT;
```

```order
prompt: Arrange a safe transfer as one transaction.
lang: sql
code: |
  BEGIN;
  UPDATE accounts SET balance = balance - 500 WHERE id = 1;
  UPDATE accounts SET balance = balance + 500 WHERE id = 2;
  COMMIT;
distractors:
  - "COMMIT; -- after the debit only"
why: Both updates sit between BEGIN and a single COMMIT. Committing after only the debit would break atomicity, and money would vanish if the second update failed.
```

## Isolation levels

Full isolation is expensive, so databases offer levels. Each stops more kinds of anomalies (surprising results).

- **Dirty read**: you see another transaction's uncommitted change.
- **Non-repeatable read**: you read a row twice in one transaction and get different values.
- **Phantom**: you run the same query twice and new rows appear.

| Level | Dirty read | Non-repeatable read | Phantom |
|---|---|---|---|
| Read uncommitted | possible | possible | possible |
| **Read committed** | no | possible | possible |
| **Repeatable read** | no | no | possible* |
| **Serializable** | no | no | no |

*PostgreSQL's repeatable read also blocks phantoms, and it treats read uncommitted as read committed. Defaults: PostgreSQL uses read committed; MySQL InnoDB uses repeatable read.

Serializable behaves as if transactions ran one after another. It is the safest and the slowest, and the database may abort transactions that you must retry.

```quiz
q: Within one transaction you run `SELECT balance` twice and get 100, then 80, because another transaction committed in between. Which anomaly is this?
options:
  - Dirty read
  - Non-repeatable read
  - Phantom read
  - Lost durability
answer: 1
why: The other transaction had committed, so the read was not dirty. The same row changed value between two reads, which is a non-repeatable read. A phantom would be extra rows in a range query.
```

## NoSQL families

| Family | Shape | Strength | Examples |
|---|---|---|---|
| **Key-value** | `key -> blob` | Very fast lookups by key | Redis, DynamoDB |
| **Document** | `key -> JSON document` | Flexible shape, one read gets a whole object | MongoDB, Firestore |
| **Wide-column** | Rows with many sparse columns, grouped by partition key | Huge write volume, spread across many machines | Cassandra, HBase |
| **Graph** | Nodes and edges | Relationship queries ("friends of friends") | Neo4j |
| **Search** | Inverted index of words | Full-text search and ranking | Elasticsearch |

Many NoSQL stores trade away joins and strict multi-row transactions in exchange for easy **horizontal scaling** (adding machines), as covered in the scaling lesson. Several now offer transactions, so check the product rather than the label.

:::truth
"SQL does not scale, NoSQL does" is wrong. One well-tuned PostgreSQL server on modern hardware handles thousands of transactions per second and terabytes of data. Instagram ran on PostgreSQL for years. You move away when you have measured a real limit, not because a diagram looked more modern.
:::

```estimate
q: You store 50 million users at about 2 KB per row. How big is the table, ignoring indexes?
answer: 100
unit: GB
tolerance: 0.3
hint: 50 x 10^6 x 2 x 10^3 bytes.
solution: "5 x 10^7 x 2 x 10^3 = 10^11 bytes = 100 GB. That fits on one server's disk, so size alone does not force you to NoSQL."
```

## Choosing

Start from the access pattern, not the brand.

- **Need transactions, joins, constraints** (money, orders, inventory): relational.
- **Lookup by a single key at huge speed** (sessions, carts, cache): key-value.
- **Objects read and written whole, with a changing shape** (profiles, catalogues): document.
- **Very high write rate, time-ordered or partition-friendly data** (events, messages, metrics): wide-column.
- **Relationships are the query** (recommendations, fraud rings): graph.
- **Free-text search**: a search engine beside your main store.

Real systems use several at once, called **polyglot persistence**. A shop might keep orders in PostgreSQL, sessions in Redis, product search in Elasticsearch and images in S3.

```blanks
prompt: Complete the choice for each need.
lang: text
code: |
  Orders with payments and refunds      -> [[PostgreSQL|MySQL|SQL]]
  Millions of chat messages written/sec -> [[Cassandra|wide-column]]
  Login sessions looked up by token     -> [[Redis|key-value]]
why: Money needs transactions and constraints. A heavy write stream spread over many nodes suits a wide-column store. A token-to-session lookup is the plain key-value case.
```

## Interview angle

- Ask about the access pattern and read-to-write ratio before naming a database.
- Default to PostgreSQL or MySQL, then justify any move away from it.
- Mention scaling steps in order: indexes, caching, read replicas, then sharding (later lessons).
- Admit what you give up: joins, transactions or consistency.

```cards
- q: What do the four letters of ACID stand for?
  a: Atomicity, Consistency, Isolation, Durability.
- q: What is a non-repeatable read?
  a: Reading the same row twice in one transaction and seeing different values because another transaction committed in between.
- q: Name the main NoSQL families with one example each.
  a: Key-value (Redis), document (MongoDB), wide-column (Cassandra), graph (Neo4j); search (Elasticsearch) is often added.
- q: What is polyglot persistence?
  a: Using several kinds of database in one system, each for the data it suits best.
- q: What default isolation level does PostgreSQL use?
  a: Read committed.
```

## Notes

:::notes
- Relational databases give tables, joins, constraints and ACID transactions; PostgreSQL and MySQL are the defaults.
- ACID: atomic (all or none), consistent (rules hold), isolated (no interference), durable (survives crashes).
- Anomalies: dirty read, non-repeatable read, phantom. Higher isolation stops more but costs speed.
- Read committed (PostgreSQL default), repeatable read (MySQL InnoDB default), serializable (safest, may abort and retry).
- NoSQL families: key-value, document, wide-column, graph, plus search engines.
- NoSQL usually trades joins and multi-row transactions for easy horizontal scaling.
- Choose by access pattern; measure before leaving SQL; 100 GB fits on one server.
- Real systems mix several stores (polyglot persistence).
:::
