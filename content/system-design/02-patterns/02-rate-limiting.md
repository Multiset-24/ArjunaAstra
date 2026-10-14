---
title: Rate Limiting
summary: Cap how many requests a client can make, using token bucket, leaky bucket and window counters, usually backed by Redis.
minutes: 30
difficulty: intermediate
tags: [rate-limiting, redis, api-gateway, token-bucket]
prereqs: [apis, caching, load-balancing]
exercises:
  - Design a rate limiter for a public API with a free tier (60 requests/min) and a paid tier (600 requests/min). Say what the key is, which algorithm you use and what you return on rejection.
  - Your limiter runs on 10 API servers, each with its own in-memory counter. A client is limited to 100 requests/min. What is the real maximum it can send, and how do you fix it?
  - Redis holding the counters goes down. Should the API reject all traffic or allow all traffic? Argue for one and describe the risk.
resources:
  - title: Nginx - ngx_http_limit_req_module
    url: https://nginx.org/en/docs/http/ngx_http_limit_req_module.html
  - title: RFC 6585 - Additional HTTP Status Codes (429)
    url: https://www.rfc-editor.org/rfc/rfc6585
---

## What rate limiting is

A **rate limiter** caps how many requests a client may send in a period of time. Extra requests are rejected or delayed.

It protects you from:

- **Abuse**: scrapers, brute-force login attempts, credential stuffing.
- **Accidents**: a client bug that retries in a tight loop.
- **Overload**: one noisy customer starving everyone else (the "noisy neighbour" problem).
- **Cost**: paid downstream calls, such as an SMS or LLM API.

It also lets you sell tiers: 60 requests/min free, 600/min paid.

Decide three things before picking an algorithm:

1. **The key**: who is limited? User id, API key, IP address, or a combination. IP alone is weak because many users share one IP behind a NAT (Network Address Translation, for example an office or mobile carrier).
2. **The limit**: for example 100 requests per minute, with a short burst allowed.
3. **The action**: reject with an error, queue, or slow down.

## Token bucket

A bucket holds up to `capacity` tokens. Tokens are added at a fixed refill rate. Each request takes one token. No token means rejection.

- Bursts are allowed up to the capacity, then traffic settles to the refill rate.
- State per key is tiny: a token count and the last refill time.
- Used by AWS API Gateway and Stripe-style APIs.

Try it. Capacity is 3 and refill is 1 token per second. Watch which requests pass when they arrive in a burst, then slowly.

```viz
algo: token-bucket
input:
  capacity: 3
  refillPerSec: 1
  requests: [0, 0.2, 0.4, 0.6, 1.5, 2.1, 2.2, 4, 4.1, 4.2]
```

```quiz
q: A token bucket has capacity 10 and refills 2 tokens per second. It is full. A client sends 30 requests in the first second. About how many are accepted?
options:
  - "10"
  - "12"
  - "30"
answer: 1
why: "The 10 tokens in the full bucket are used at once, and about 2 more arrive during that second. Capacity sets the burst, the refill rate sets the sustained speed."
```

## Leaky bucket

Requests enter a queue (the bucket) and leave at a constant rate, like water dripping from a hole. If the queue is full, new requests are dropped.

- Output is smooth: the downstream service sees a steady rate.
- Bursts are delayed rather than passed through, so latency rises.
- Nginx `limit_req` behaves like this: `rate=10r/s burst=20` queues up to 20 extra requests and serves them at 10 per second.

| | Token bucket | Leaky bucket |
|---|---|---|
| Allows bursts | Yes, up to capacity | No, smooths them out |
| Output rate | Variable | Constant |
| Best for | APIs where short bursts are normal | Protecting a backend that needs steady load |

## Window counters

**Fixed window.** Count requests per clock window (for example per minute). Reset the count when the window changes. Simple, but it has a boundary flaw.

```predict
lang: python
prompt: Limit is 3 requests per 10-second window. Requests arrive at these seconds. How many are allowed?
code: |
  limit, window = 3, 10
  counts = {}
  allowed = 0
  for t in [1, 2, 9, 11, 12, 13]:
      w = t // window
      counts[w] = counts.get(w, 0) + 1
      if counts[w] <= limit:
          allowed += 1
  print(allowed)
output: "6"
why: Seconds 1, 2, 9 fall in window 0 and 11, 12, 13 in window 1. All six pass, so 4 requests got through in 5 seconds (9 to 13) against a limit of 3 per 10.
```

Worst case, a client sends the full limit at the end of one window and again at the start of the next: up to 2x the limit in a short span.

**Sliding window log.** Store a timestamp for every request and count those in the last N seconds. Exact, but memory grows with the limit.

**Sliding window counter.** Keep counts for the current and previous window and weight the previous one by how much of it still overlaps. Cheap and close to exact. Cloudflare has described using this approach.

```estimate
q: A sliding window log stores one 8-byte timestamp per request. The limit is 100 requests/min and 1 million users are all at their limit. How much memory?
answer: 800
unit: MB
tolerance: 0.3
hint: Users x requests per user x bytes per timestamp.
solution: "1,000,000 x 100 x 8 B = 800 MB, before any overhead from the data structure. A sliding window counter stores two integers per user, around 16 MB total. That is why counters are more common at scale."
```

## Doing it with Redis

With several API servers, counters must be shared, so they live in **Redis** (an in-memory key-value store). A fixed-window check:

```text
INCR   rl:user42:28571        # key includes the current minute
EXPIRE rl:user42:28571 60     # set only when the value is 1
```

If the count exceeds the limit, reject. Two commands are not atomic: a crash between them leaves a key with no expiry. Fix it by running both in a **Lua script** (Redis executes a script as one uninterrupted step). Token bucket works the same way: read tokens and last time, compute refill, subtract, write back, all inside one script.

:::warn
A "read the counter, then write it" sequence from two servers at once loses updates. Always use atomic operations (`INCR`, Lua) instead of get-then-set.
:::

## What the client sees

Reject with **HTTP 429 Too Many Requests** and tell the client when to come back.

```blanks
prompt: Complete the rejection response.
lang: http
code: |
  HTTP/1.1 [[429]] Too Many Requests
  [[Retry-After]]: 30
  Content-Type: application/json
why: 429 is the status for rate limiting, and the Retry-After header gives the wait in seconds so well-behaved clients back off.
```

## Where to put it and what goes wrong

- **Placement**: an API gateway or reverse proxy (Nginx, Envoy, Kong) before your services, so rejected traffic is cheap. Add finer limits inside services for expensive endpoints.
- **Failure mode**: if Redis is unreachable, you choose fail-open (allow traffic, risk overload) or fail-closed (reject, risk an outage). Most public APIs fail open for general traffic and fail closed for login.
- **Latency**: one Redis call per request adds about a millisecond. Some systems keep a local approximate count and sync it periodically.

:::truth
Rate limiting does not stop a real distributed attack. Thousands of IPs each stay under the limit. It needs help from a CDN, a WAF (Web Application Firewall) and bot detection.
:::

## Interview angle

- Ask who is limited, what the limit is, and whether bursts are allowed.
- Pick token bucket by default and say why: bursts allowed, tiny state.
- Mention shared state in Redis, atomic scripts, the 429 response and the fail-open choice.

```cards
- q: Token bucket in one sentence?
  a: Tokens refill at a fixed rate up to a capacity, each request spends one, and an empty bucket means rejection.
- q: What flaw does a fixed window counter have?
  a: A client can send the full limit at the end of one window and again at the start of the next, reaching up to twice the limit.
- q: Why use a Lua script with Redis rate limiting?
  a: It makes the check and update one atomic step, so concurrent servers cannot lose updates.
- q: Which HTTP status and header signal a rate limit?
  a: 429 Too Many Requests, with a Retry-After header telling the client how long to wait.
```

## Notes

:::notes
- Rate limiting caps requests per key (user, API key, IP) to prevent abuse, overload and cost blowouts.
- Token bucket: capacity gives the burst, refill rate gives the sustained speed. Default choice.
- Leaky bucket: constant output rate through a queue; smooths traffic, adds latency.
- Fixed window is simple but allows up to 2x the limit at window edges; sliding window counter fixes most of it cheaply.
- Shared counters live in Redis; use INCR or Lua scripts so updates are atomic.
- Reject with 429 and a Retry-After header.
- Decide fail-open or fail-closed for when the limiter store is down.
- Put the limiter at the gateway; it will not stop a large distributed attack alone.
:::
