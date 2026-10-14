---
title: Unsupervised Learning
summary: Find structure in data that has no labels, using k-means clustering and PCA for dimensionality reduction.
minutes: 30
difficulty: intermediate
tags: [clustering, kmeans, pca, unsupervised]
prereqs: [what-is-ml, math-for-ml, evaluation-metrics]
exercises:
  - Run the k-means code with three blobs instead of two (add a third group around [4, -4]) and print inertia for k from 1 to 6. Where is the elbow?
  - Run k-means with different `seed` values on overlapping blobs. Do you always get the same clusters and the same inertia? Explain what that tells you about the starting centroids.
  - Name two real datasets where you would want clusters (for example, customer purchase histories) and say how you would check whether the clusters are useful without any labels.
resources:
  - title: scikit-learn user guide - clustering
    url: https://scikit-learn.org/stable/modules/clustering.html
  - title: scikit-learn user guide - decomposing signals (PCA)
    url: https://scikit-learn.org/stable/modules/decomposition.html#pca
---

## No labels, no right answer

In **supervised learning** each example comes with a label to predict. In **unsupervised learning** you only have inputs, and you ask the data to show its own structure.

| Task | Question | Common method |
|---|---|---|
| **Clustering** | Which examples belong together? | k-means |
| **Dimensionality reduction** | Can fewer numbers describe each example? | PCA (principal component analysis) |
| **Anomaly detection** | Which examples look unlike the rest? | Distance or density based |

Typical uses: group customers into segments, compress features before another model, plot high-dimensional data in 2-D, find unusual transactions.

:::truth
With no labels there is no accuracy score. A clustering is "good" only if it is useful for something you care about, and you have to judge that yourself. Two reasonable methods can give different, equally valid groupings.
:::

## k-means: the idea

**k-means** splits points into $k$ groups, where you choose $k$. Each group is summarised by its **centroid** (the mean position of its points).

Repeat two steps until nothing changes:

1. **Assign**: give each point to its nearest centroid (usually by Euclidean distance, the straight-line distance).
2. **Update**: move each centroid to the mean of the points assigned to it.

Step through it below. Try different values of `k` and `seed` and watch how the starting positions change the outcome.

```viz
algo: kmeans
input:
  k: 3
  points: 30
  seed: 7
```

The quantity k-means reduces is **inertia**: the sum of squared distances from each point to its centroid. Each step can only lower it or keep it the same, so the loop always stops. It may stop at a **local minimum** (a decent but not the best grouping), which is why implementations run several random starts and keep the best.

```quiz
q: In k-means, what does the update step do?
options:
  - Reassigns every point to a random cluster
  - Moves each centroid to the mean of the points currently assigned to it
  - Increases k by one if inertia is high
  - Removes the points farthest from their centroid
answer: 1
why: "Assignment fixes the centroids and moves the points. Update fixes the points and moves the centroids. Alternating the two lowers inertia each round."
```

## k-means in NumPy

Two blobs of 20 points each, then the k-means loop, then PCA (covered below).

```python
import numpy as np

rng = np.random.default_rng(0)
# two blobs in 2-D
A = rng.normal([0, 0], 0.5, size=(20, 2))
B = rng.normal([4, 4], 0.5, size=(20, 2))
X = np.vstack([A, B])

def kmeans(X, k, iters=10, seed=0):
    rng = np.random.default_rng(seed)
    centroids = X[rng.choice(len(X), size=k, replace=False)]
    for _ in range(iters):
        # assign: distance from every point to every centroid -> index of nearest
        d = np.linalg.norm(X[:, None, :] - centroids[None, :, :], axis=2)
        labels = d.argmin(axis=1)
        # update: each centroid moves to the mean of its points
        new = np.array([X[labels == c].mean(axis=0) if np.any(labels == c) else centroids[c]
                        for c in range(k)])
        if np.allclose(new, centroids):
            break
        centroids = new
    inertia = float(((X - centroids[labels]) ** 2).sum())
    return labels, centroids, inertia

for k in [1, 2, 3, 4]:
    _, c, inertia = kmeans(X, k)
    print(f"k={k}: inertia {inertia:.1f}")
labels, c, _ = kmeans(X, 2)
print("centroids:", np.round(c, 1).tolist())
print("cluster sizes:", np.bincount(labels).tolist())

# PCA via SVD
Xc = X - X.mean(axis=0)
U, S, Vt = np.linalg.svd(Xc, full_matrices=False)
ratio = S ** 2 / np.sum(S ** 2)
print("variance explained:", np.round(ratio, 3).tolist())
```
```output
k=1: inertia 367.4
k=2: inertia 17.4
k=3: inertia 13.9
k=4: inertia 9.1
centroids: [[4.2, 4.1], [-0.1, 0.1]]
cluster sizes: [20, 20]
variance explained: [0.98, 0.02]
```

- Inertia always falls as $k$ grows, so you cannot just minimise it. With $k$ equal to the number of points it would be zero.
- Look for the **elbow**: the $k$ after which the drop becomes small. Here it falls from 367 to 17 at $k=2$, then barely moves. The data has two blobs.
- Other checks: the **silhouette score** (how close a point is to its own cluster compared with the next nearest), and whether the clusters make business sense.

:::warn
k-means assumes round, similar-sized clusters and uses distance, so features on larger scales dominate. Standardise features first (subtract the mean, divide by the standard deviation). It also struggles with ring shapes, long thin clusters and outliers.
:::

```order
prompt: Arrange one iteration of k-means.
lang: python
code: |
  d = distances(X, centroids)
  labels = d.argmin(axis=1)
  for c in range(k):
      centroids[c] = X[labels == c].mean(axis=0)
distractors:
  - "  centroids = X[rng.choice(len(X), k)]"
why: Compute distances, assign each point to the nearest centroid, then recompute each centroid as the mean of its points. Picking random centroids belongs to the setup before the loop, not inside it.
```

## PCA: fewer numbers per example

Real data often has many correlated features, so it lives close to a lower-dimensional shape. **PCA** finds new axes, called **principal components**, ordered by how much of the data's variance (spread) they capture.

- Centre the data (subtract the mean of each column).
- The first component points along the direction of largest spread, the second is perpendicular to it with the next largest spread, and so on.
- Keep the top few components and drop the rest. You lose a little information and gain a smaller, less noisy representation.
- It is computed with the **SVD** (singular value decomposition, a matrix factorisation); the squared singular values give the variance per component.

In the output above, 98% of the variance lies along one direction: the line joining the two blobs. A 2-D dataset could be described well with a single number per point.

| | k-means | PCA |
|---|---|---|
| Output | A cluster id per point | A shorter vector per point |
| Needs you to choose | Number of clusters $k$ | Number of components |
| Works on | Distances between points | Directions of variance |
| Main caveat | Local minima, scaling | Only finds linear structure |

```cards
- q: What is the difference between supervised and unsupervised learning?
  a: Supervised data has labels to predict. Unsupervised data has only inputs and the goal is to find structure.
- q: What are the two steps of k-means?
  a: Assign each point to its nearest centroid, then move each centroid to the mean of its assigned points. Repeat until stable.
- q: What is inertia and why can you not just minimise it?
  a: The sum of squared distances from points to their centroids. It always falls as k grows, reaching zero when k equals the number of points.
- q: What is the elbow method?
  a: Plot inertia against k and pick the k after which improvement becomes small.
- q: What does PCA do?
  a: It finds orthogonal directions ordered by how much variance they capture, so you can keep a few and describe each point with fewer numbers.
```

## Notes

:::notes
- Unsupervised learning has no labels; you look for structure, and "good" depends on your use.
- k-means: choose k, then alternate assign-to-nearest-centroid and move-centroid-to-mean.
- Inertia = sum of squared distances to centroids. It always drops as k grows; use the elbow or silhouette score.
- Results depend on initial centroids; run several starts and keep the lowest inertia.
- Standardise features first. k-means expects round, similar-sized clusters.
- PCA finds orthogonal directions of largest variance; computed through the SVD of centred data.
- Keep the top components to compress data or plot it in 2-D. It only captures linear structure.
:::
