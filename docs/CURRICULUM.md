# Curriculum

Four tracks. Each lesson is short, interactive and ends with copy-ready notes and flashcards. File paths are relative to `content/`.

Levels: **DSA** targets Codeforces Candidate Master (1900+). **System Design**, **LLD** and **AI Engineering** target a confident intermediate level.

## DSA & Competitive Programming (`dsa/`, C++ and Java)

| Stage | Milestone | Lessons (`<stage-folder>/<NN>-<slug>`) |
|---|---|---|
| `00-foundations` | Solve most 800–1000 problems | 01-start-here · 02-how-to-think · 03-language-setup · 04-complexity · 05-math-basics · 06-implementation · 07-sorting-and-searching · 08-stl-and-collections |
| `01-core` | Pupil (1200) | 01-arrays-and-strings · 02-prefix-sums · 03-two-pointers · 04-sliding-window · 05-binary-search · 06-binary-search-on-answer · 07-hashing-and-frequency · 08-stacks-and-queues · 09-recursion · 10-backtracking · 11-bit-manipulation |
| `02-intermediate` | Specialist (1400–1600) | 01-greedy · 02-sweep-line · 03-number-theory · 04-modular-arithmetic · 05-combinatorics · 06-constructive-algorithms · 07-trees-basics · 08-heaps-and-priority-queues · 09-graphs-bfs-dfs · 10-shortest-paths · 11-dsu · 12-mst · 13-topological-sort |
| `03-dp` | Expert (1600+) | 01-dp-introduction · 02-dp-1d-patterns · 03-dp-on-grids-and-strings · 04-knapsack · 05-lis-and-subsequences · 06-tree-dp-and-rerooting · 07-bitmask-dp · 08-digit-dp |
| `04-advanced` | Candidate Master (1900+) | 01-segment-tree · 02-lazy-propagation · 03-fenwick-tree · 04-sparse-table · 05-lca-binary-lifting · 06-euler-tour · 07-string-hashing · 08-kmp-and-z-function · 09-trie · 10-scc-and-bridges · 11-game-theory · 12-probability-and-expected-value · 13-matrix-exponentiation · 14-sqrt-decomposition-and-mo · 15-small-to-large · 16-interactive-problems · 17-contest-strategy |

## System Design (`system-design/`)

| Stage | Lessons |
|---|---|
| `00-foundations` | 01-start-here · 02-networking-basics · 03-dns-and-http · 04-apis · 05-back-of-the-envelope · 06-interview-framework |
| `01-building-blocks` | 01-scaling-basics · 02-load-balancing · 03-caching · 04-cdn-and-proxies · 05-databases-sql-vs-nosql · 06-indexing · 07-replication · 08-sharding-and-partitioning · 09-consistent-hashing · 10-cap-and-consistency |
| `02-patterns` | 01-message-queues-and-pubsub · 02-rate-limiting · 03-unique-id-generation · 04-reliability-and-availability · 05-microservices-and-api-gateway · 06-observability-and-security |
| `04-tools` | 01-kafka · 02-redis · 03-elasticsearch · 04-cassandra-and-dynamodb · 05-nginx-and-reverse-proxies · 06-object-storage-s3 · 07-zookeeper-and-etcd · 08-docker-and-kubernetes |
| `03-case-studies` | 01-url-shortener · 02-chat-system · 03-news-feed · 04-notification-system · 05-video-streaming · 06-ride-sharing · 07-payment-system · 08-search-autocomplete |

## Low-Level Design (`lld/`, Java and C++)

| Stage | Lessons |
|---|---|
| `00-oop` | 01-start-here · 02-classes-and-objects · 03-encapsulation-and-abstraction · 04-inheritance-and-polymorphism · 05-interfaces-and-abstract-classes · 06-composition-over-inheritance |
| `01-principles` | 01-solid · 02-uml-class-diagrams · 03-clean-design-habits |
| `02-patterns` | 01-singleton · 02-factory · 03-builder · 04-adapter · 05-decorator · 06-facade · 07-proxy · 08-composite · 09-strategy · 10-observer · 11-command · 12-state · 13-template-method · 14-chain-of-responsibility |
| `03-concurrency` | 01-threads-and-locks · 02-thread-safe-design |
| `04-case-studies` | 01-lld-interview-framework · 02-parking-lot · 03-elevator-system · 04-vending-machine · 05-lru-cache · 06-bookmyshow · 07-splitwise · 08-rate-limiter |

## AI Engineering (`ai/`, Python)

| Stage | Lessons |
|---|---|
| `00-foundations` | 01-start-here · 02-python-and-numpy · 03-math-for-ml · 04-probability-and-statistics |
| `01-ml` | 01-what-is-ml · 02-linear-regression · 03-logistic-regression · 04-evaluation-metrics · 05-overfitting-and-regularization · 06-trees-and-ensembles · 07-unsupervised-learning |
| `02-deep-learning` | 01-neural-networks · 02-backpropagation · 03-training-deep-networks · 04-pytorch-basics · 05-cnns · 06-embeddings |
| `03-llms` | 01-attention · 02-transformer-architecture · 03-tokenization · 04-how-llms-are-trained · 05-decoding-and-sampling · 06-prompt-engineering |
| `04-engineering` | 01-llm-apis-and-structured-output · 02-rag · 03-vector-databases · 04-agents-and-tool-use · 05-evals · 06-fine-tuning-and-lora · 07-serving-and-cost · 08-safety-and-guardrails · 09-multimodal-models |

Prerequisites in frontmatter (`prereqs`) use the slug (the part after `NN-`), e.g. `prereqs: [binary-search]`.
