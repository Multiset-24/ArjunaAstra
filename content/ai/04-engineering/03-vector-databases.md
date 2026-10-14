---
title: Vector Databases and Approximate Search
summary: Find the nearest vectors among millions without comparing against all of them, using IVF and HNSW indexes and their speed versus recall trade-off.
minutes: 40
difficulty: intermediate
tags: [vector-search, hnsw, ivf, ann, embeddings]
prereqs: [rag, embeddings]
exercises:
  - Run the IVF code with n_lists set to 8 and to 128. How do recall and the number of scanned vectors change at nprobe 1? Explain why.
  - Your index holds 20 million vectors of 1024 dimensions. Compute the float32 memory, then the memory with 8-bit values. Decide whether each fits on one 64 GB machine.
  - Read the HNSW paper abstract and list the three parameters that trade speed, memory and recall. Match them to the names used by a vector library you like.
resources:
  - title: Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs (Malkov and Yashunin)
    url: https://arxiv.org/abs/1603.09320
  - title: Faiss wiki (index types and guidelines)
    url: https://github.com/facebookresearch/faiss/wiki
---

## The problem

After embedding, every document chunk is a vector, and a question becomes a vector too. Retrieval means: find the k stored vectors nearest to the query vector. This is **nearest-neighbour search**.

The exact method, **brute force** (also called a flat index), compares the query with every vector. It is simple and perfectly accurate. Its cost grows linearly with the number of vectors.

```estimate
q: A collection has 1 million vectors with 768 dimensions each, stored as 32-bit floats (4 bytes). How much memory do the raw vectors take?
answer: 3.1
unit: GB
tolerance: 0.2
hint: Multiply count x dimensions x bytes per number, then convert bytes to gigabytes (10^9).
solution: "10^6 x 768 x 4 bytes = 3.07 x 10^9 bytes, about 3.1 GB. Ten million vectors would need about 31 GB, before any index overhead."
```

```estimate
q: Brute force must read all 3.1 GB for each query. If memory delivers about 10 GB/s to one core, roughly how long does one query take?
answer: 300
unit: ms
tolerance: order
hint: Time = data size divided by bandwidth.
solution: "3.1 GB / 10 GB/s = 0.31 s, about 300 ms per query. Batching and many cores help, but the work still grows with the collection size."
```

At millions of vectors, 300 ms per query is too slow for a live product. We accept **approximate nearest neighbour** (ANN) search: it may miss a true neighbour in exchange for looking at far fewer vectors.

:::key
ANN trades **recall** (the share of true neighbours that are found) against speed and memory. Every index has dials for this. There is no setting that is fast, small and perfect.
:::

## IVF: search only nearby clusters

**IVF** (Inverted File index) works like a library with labelled shelves.

1. **Train**: run k-means (the clustering algorithm from the unsupervised learning lesson) to pick `n_lists` centroids.
2. **Add**: assign each vector to its nearest centroid. Each centroid owns a list of vectors.
3. **Search**: find the `nprobe` centroids closest to the query, and scan only those lists.

```viz
algo: kmeans
input:
  k: 3
  points: 30
  seed: 7
```

The clusters above are the "shelves". A query only walks to the closest few.

```order
prompt: Arrange an IVF query.
lang: python
code: |
  near = closest_centroids(query, centroids, nprobe)
  candidates = concat(lists[j] for j in near)
  dists = distance(query, vectors[candidates])
  return candidates[argsort(dists)[:k]]
distractors:
  - "dists = distance(query, vectors)   # scans everything"
why: Pick the nprobe nearest clusters first, collect only their members, rank those, and return the best k.
```

Here is a runnable toy with NumPy. The data has 32 overlapping clusters in 16 dimensions.

```python
import numpy as np

rng = np.random.default_rng(0)
n, d, n_lists = 4000, 16, 32
centers = rng.normal(size=(n_lists, d)) * 1.0
data = centers[rng.integers(0, n_lists, n)] + rng.normal(size=(n, d))
queries = centers[rng.integers(0, n_lists, 200)] + rng.normal(size=(200, d))

def dist2(a, b):                                   # squared distances, shape (len(a), len(b))
    return (a ** 2).sum(1)[:, None] - 2 * a @ b.T + (b ** 2).sum(1)[None, :]

# exact search: compare the query with every vector
truth = dist2(queries, data).argmin(axis=1)

# IVF step 1: k-means picks n_lists centroids
cent = data[rng.choice(n, n_lists, replace=False)]
for _ in range(10):
    assign = dist2(data, cent).argmin(axis=1)
    for j in range(n_lists):
        members = data[assign == j]
        if len(members):
            cent[j] = members.mean(axis=0)
assign = dist2(data, cent).argmin(axis=1)
lists = [np.where(assign == j)[0] for j in range(n_lists)]   # the inverted lists

# IVF step 2: search only the nprobe closest lists
def search(q, nprobe):
    near = dist2(q[None], cent)[0].argsort()[:nprobe]
    cand = np.concatenate([lists[j] for j in near])
    best = cand[dist2(q[None], data[cand])[0].argmin()]
    return best, len(cand)

for nprobe in (1, 2, 4, 8):
    out = [search(q, nprobe) for q in queries]
    recall = np.mean([b == t for (b, _), t in zip(out, truth)])
    scanned = np.mean([c for _, c in out])
    print(f"nprobe={nprobe}  recall@1={recall:.2f}  scanned={scanned:.0f} of {n}")
```
```output
nprobe=1  recall@1=0.83  scanned=127 of 4000
nprobe=2  recall@1=0.93  scanned=255 of 4000
nprobe=4  recall@1=0.98  scanned=510 of 4000
nprobe=8  recall@1=0.99  scanned=1015 of 4000
```

Reading the output: scanning 3 percent of the data already finds the true nearest neighbour 83 percent of the time. Doubling `nprobe` doubles the work and buys less each time. A query near a cluster border has its neighbour on the "wrong shelf", which is the source of the misses.

```predict
lang: python
code: |
  n, n_lists, nprobe = 1_000_000, 1000, 5
  print(nprobe * n // n_lists + n_lists)
output: "6000"
why: Five lists of about 1000 vectors each is 5000 comparisons, plus 1000 comparisons to find the nearest centroids. Brute force would do 1,000,000.
```

## HNSW: walk a graph

**HNSW** (Hierarchical Navigable Small World) builds a graph where each vector is a node linked to a few near neighbours. Search is a greedy walk: move to whichever neighbour is closer to the query until no neighbour is closer.

A single graph can need many hops. HNSW stacks layers like a road map:

- **Top layers** hold few nodes with long links (highways). Start there and jump close to the target quickly.
- **Bottom layer** holds every node with short links (local streets). Search it carefully for the final answer.

| Parameter | Meaning | Higher value means |
|---|---|---|
| `M` | Links kept per node | Better recall, more memory |
| `efConstruction` | Candidate list size while building | Better graph, slower build |
| `efSearch` | Candidate list size while querying | Better recall, slower query |

Search cost grows roughly with the logarithm of the collection size, which is why HNSW is a common default. The graph links also cost memory, on the order of 100 bytes per vector for typical `M`, on top of the vectors themselves.

## Choosing an index

| Index | Speed | Memory | Notes |
|---|---|---|---|
| Flat (brute force) | Slow at scale | Vectors only | Exact; fine up to a few hundred thousand vectors |
| IVF | Fast | Vectors + centroids | Needs a training step; tune `nprobe` |
| HNSW | Very fast | Vectors + graph | No training; deletes and updates are awkward |
| IVF with PQ | Fast | Much smaller | **PQ** (product quantization) stores each vector as short codes; lossy |

```quiz
questions:
  - q: You raise `nprobe` from 4 to 16 in an IVF index. What happens?
    options:
      - Recall tends to rise, and each query scans more vectors so it gets slower
      - Recall falls because more clusters add noise
      - Query time stays the same because the index is already built
    answer: 0
    why: More probed lists means more candidates are checked. That finds more true neighbours and costs more time per query.
  - q: Which statement about ANN indexes is correct?
    options:
      - They always return the exact nearest neighbours
      - They may miss a true neighbour in exchange for speed
      - They only work with text
    answer: 1
    why: Approximation is the point. You measure recall against brute force on a sample and tune until the miss rate is acceptable.
```

## In the real world

- **Libraries**: FAISS (a vector search library from Meta) provides flat, IVF, HNSW and PQ indexes in-process.
- **Inside a database you already run**: Postgres with the pgvector extension offers HNSW and IVF indexes next to your normal tables.
- **Dedicated services**: Qdrant, Milvus, Weaviate, Pinecone and others add sharding, replication and filtering.

:::warn
Metadata filters interact badly with ANN. If you search first and filter afterwards (post-filtering), a strict filter can leave you with fewer than k results. Check how your system applies filters, and test with the narrowest filter you will allow.
:::

:::truth
For under a few hundred thousand vectors, a flat index on one machine is often fast enough and has no tuning. Reach for ANN when measurements show you need it, and always measure recall against brute force on a sample of real queries.
:::

```cards
- q: What does an ANN index trade away?
  a: Some recall (it may miss true neighbours) in exchange for much lower query time and sometimes memory.
- q: How does IVF search?
  a: Cluster vectors with k-means, then scan only the nprobe lists whose centroids are closest to the query.
- q: How does HNSW search?
  a: A greedy walk on a layered neighbour graph, from sparse long-link top layers down to the dense bottom layer.
- q: Which parameter raises HNSW query recall at the cost of speed?
  a: efSearch, the size of the candidate list kept during the query.
- q: Raw memory for N vectors of dimension D in float32?
  a: N x D x 4 bytes, before any index overhead.
```

## Notes

:::notes
- Nearest-neighbour search: find the k stored vectors closest to the query vector.
- Brute force is exact but costs O(N) per query; raw memory is N x D x 4 bytes in float32.
- ANN gives up some recall for speed. Measure recall against brute force on real queries.
- IVF: k-means into n_lists clusters; query scans only the nprobe nearest lists. Raise nprobe for recall.
- HNSW: layered neighbour graph, greedy descent; dials are M, efConstruction and efSearch.
- PQ compresses vectors into short codes: far less memory, some accuracy lost.
- Post-filtering by metadata can return fewer than k results.
- Under a few hundred thousand vectors a flat index is often enough.
:::
