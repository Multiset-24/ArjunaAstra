---
title: Builder
summary: Construct objects with many optional fields step by step, validate once at the end, and know when a record or plain constructor is enough.
minutes: 25
difficulty: beginner
tags: [patterns, creational, builder, immutability]
prereqs: [classes-and-objects, encapsulation-and-abstraction]
exercises:
  - Add a retries(int) option that must be between 0 and 5. Where does the check go, and what message would help a caller?
  - Make the builder reject a body on a GET request. Does this rule belong in the setter or in build()? Explain.
  - Convert HttpRequest into a Java record or a C++ struct with default member values. What do you lose?
  - Add copy-on-edit support, such as request.toBuilder().timeoutMs(9000).build(). Why does this help immutable objects?
---

## The problem it solves

Imagine an HTTP request with a URL, method, headers, timeout and body. Most fields are optional. Without a builder you get one of two bad shapes:

- **Telescoping constructors:** `new Request(url, "GET", null, 5000, null, true)`. Which `null` is the body? You cannot tell from the call site.
- **Setters on a mutable object:** `r.setUrl(...)`, `r.setBody(...)`. The object can be half-built, and any code can change it later.

A **builder** is a helper object that collects settings through named, chained calls and then produces the finished object with `build()`. The finished object can be immutable (its fields never change after creation).

## Structure

```mermaid
classDiagram
  class HttpRequest {
    -method String
    -url String
    -headers Map
    -timeoutMs int
    -body String
    -HttpRequest(Builder)
    +builder(url)$ Builder
  }
  class Builder {
    +method(m) Builder
    +header(k, v) Builder
    +timeoutMs(t) Builder
    +body(b) Builder
    +build() HttpRequest
  }
  Builder ..> HttpRequest : creates
  HttpRequest +-- Builder
```

Three details make it work:

- The product's constructor is private, so `build()` is the only way in.
- Each setter returns the builder itself (`return this`), which enables chaining.
- `build()` is the single place that checks rules that involve several fields.

## Code

Required values (the URL) go into the builder's constructor so you cannot forget them. Optional ones have defaults.

```java
import java.util.*;

final class HttpRequest {
    private final String method;
    private final String url;
    private final Map<String, String> headers;
    private final int timeoutMs;
    private final String body;

    private HttpRequest(Builder b) {
        this.method = b.method;
        this.url = b.url;
        this.headers = Collections.unmodifiableMap(new TreeMap<>(b.headers));   // copy: later builder edits cannot leak in
        this.timeoutMs = b.timeoutMs;
        this.body = b.body;
    }

    static Builder builder(String url) { return new Builder(url); }

    @Override
    public String toString() {
        String s = method + " " + url + " timeout=" + timeoutMs + "ms headers=" + headers;
        if (!body.isEmpty()) s += " body=" + body.length() + " bytes";
        return s;
    }

    static final class Builder {
        private final String url;                       // required: passed to the constructor
        private String method = "GET";                  // optional, with defaults
        private final Map<String, String> headers = new TreeMap<>();
        private int timeoutMs = 5000;
        private String body = "";

        private Builder(String url) { this.url = url; }

        Builder method(String m) { this.method = m; return this; }
        Builder header(String key, String value) { headers.put(key, value); return this; }
        Builder timeoutMs(int t) { this.timeoutMs = t; return this; }
        Builder body(String b) { this.body = b; return this; }

        HttpRequest build() {
            if (url.isEmpty()) throw new IllegalStateException("url is required");
            if (timeoutMs <= 0) throw new IllegalStateException("timeout must be positive");
            if (method.equals("POST") && body.isEmpty()) throw new IllegalStateException("POST needs a body");
            return new HttpRequest(this);
        }
    }
}

public class Main {
    public static void main(String[] args) {
        HttpRequest get = HttpRequest.builder("https://api.test/users")
                .header("Accept", "json")
                .build();
        HttpRequest post = HttpRequest.builder("https://api.test/orders")
                .method("POST")
                .header("Content-Type", "json")
                .body("{\"qty\":3}")
                .timeoutMs(2000)
                .build();
        System.out.println(get);
        System.out.println(post);

        try {
            HttpRequest.builder("https://api.test/x").method("POST").build();
        } catch (IllegalStateException e) {
            System.out.println("error: " + e.getMessage());
        }

        HttpRequest.Builder base = HttpRequest.builder("https://api.test/items")
                .header("Accept", "json").timeoutMs(1000);
        HttpRequest first = base.build();
        HttpRequest second = base.header("X-Trace", "t1").build();
        System.out.println(first);
        System.out.println(second);
    }
}
```
```cpp
#include <iostream>
#include <map>
#include <stdexcept>
#include <string>
#include <utility>

class HttpRequest {
public:
    class Builder {
    public:
        explicit Builder(std::string url) : url_(std::move(url)) {}   // required: constructor argument

        Builder& method(std::string m) { method_ = std::move(m); return *this; }
        Builder& header(const std::string& key, const std::string& value) { headers_[key] = value; return *this; }
        Builder& timeoutMs(int t) { timeoutMs_ = t; return *this; }
        Builder& body(std::string b) { body_ = std::move(b); return *this; }

        HttpRequest build() const {
            if (url_.empty()) throw std::logic_error("url is required");
            if (timeoutMs_ <= 0) throw std::logic_error("timeout must be positive");
            if (method_ == "POST" && body_.empty()) throw std::logic_error("POST needs a body");
            HttpRequest r;
            r.method_ = method_;
            r.url_ = url_;
            r.headers_ = headers_;      // copy: later builder edits cannot leak in
            r.timeoutMs_ = timeoutMs_;
            r.body_ = body_;
            return r;
        }

    private:
        std::string url_;
        std::string method_ = "GET";
        std::map<std::string, std::string> headers_;
        int timeoutMs_ = 5000;
        std::string body_;
    };

    static Builder builder(std::string url) { return Builder(std::move(url)); }

    std::string toString() const {
        std::string h = "{";
        bool first = true;
        for (const auto& kv : headers_) {
            if (!first) h += ", ";
            h += kv.first + "=" + kv.second;
            first = false;
        }
        h += "}";
        std::string s = method_ + " " + url_ + " timeout=" + std::to_string(timeoutMs_) + "ms headers=" + h;
        if (!body_.empty()) s += " body=" + std::to_string(body_.size()) + " bytes";
        return s;
    }

private:
    HttpRequest() = default;   // only the Builder can create one

    std::string method_;
    std::string url_;
    std::map<std::string, std::string> headers_;
    int timeoutMs_ = 0;
    std::string body_;
};

int main() {
    HttpRequest get = HttpRequest::builder("https://api.test/users")
                          .header("Accept", "json")
                          .build();
    HttpRequest post = HttpRequest::builder("https://api.test/orders")
                           .method("POST")
                           .header("Content-Type", "json")
                           .body("{\"qty\":3}")
                           .timeoutMs(2000)
                           .build();
    std::cout << get.toString() << "\n";
    std::cout << post.toString() << "\n";

    try {
        HttpRequest::builder("https://api.test/x").method("POST").build();
    } catch (const std::logic_error& e) {
        std::cout << "error: " << e.what() << "\n";
    }

    HttpRequest::Builder base = HttpRequest::builder("https://api.test/items");
    base.header("Accept", "json").timeoutMs(1000);
    HttpRequest first = base.build();
    HttpRequest second = base.header("X-Trace", "t1").build();
    std::cout << first.toString() << "\n";
    std::cout << second.toString() << "\n";
    return 0;
}
```
```output
GET https://api.test/users timeout=5000ms headers={Accept=json}
POST https://api.test/orders timeout=2000ms headers={Content-Type=json} body=9 bytes
error: POST needs a body
GET https://api.test/items timeout=1000ms headers={Accept=json}
GET https://api.test/items timeout=1000ms headers={Accept=json, X-Trace=t1}
```

Why this output looks the way it does:

- The invalid POST fails at `build()` with a message naming the broken rule. The half-built state never escapes.
- `first` does not contain `X-Trace`, even though the same builder produced `second`. `build()` copies the header map, so the builder can be reused as a template.
- Headers print in sorted order because they live in a sorted map (`TreeMap` in Java, `std::map` in C++). That makes the output deterministic.

```quiz
q: The builder stores its own `headers` map. In the product constructor we write `new TreeMap<>(b.headers)` instead of `this.headers = b.headers`. Why?
options:
  - It sorts the headers, which HTTP requires
  - It stops later builder calls from changing an object that was already built
  - It makes the constructor faster
answer: 1
why: Sharing the same map would let `base.header(...)` silently change `first` after it was built. Copying defensively keeps the product immutable.
```

```predict
lang: java
prompt: What does this print, using the HttpRequest class above?
code: |
  HttpRequest.Builder b = HttpRequest.builder("u").timeoutMs(10);
  HttpRequest r1 = b.build();
  b.timeoutMs(99);
  HttpRequest r2 = b.build();
  System.out.println(r1 + " | " + r2);
output: "GET u timeout=10ms headers={} | GET u timeout=99ms headers={}"
why: Timeout is a plain int copied into each product at build time, so r1 keeps 10 and r2 gets 99. There are no headers and no body, so both print empty braces and no body suffix.
```

:::note
Where does validation go? Rules about one field can be in its setter (`timeoutMs <= 0`). Rules that span fields, like "POST needs a body", must wait for `build()`, because the caller may set the fields in any order.
:::

```order
prompt: Arrange the build() method so that all checks run before the object exists.
lang: java
code: |
  HttpRequest build() {
      if (url.isEmpty()) throw new IllegalStateException("url is required");
      if (timeoutMs <= 0) throw new IllegalStateException("timeout must be positive");
      if (method.equals("POST") && body.isEmpty()) throw new IllegalStateException("POST needs a body");
      return new HttpRequest(this);
  }
distractors:
  - "    HttpRequest r = new HttpRequest(this);"
why: Validate first, construct last. If you construct first and validate after, an invalid object has already existed.
```

## Common mistakes

- Making the product's fields non-final and adding setters "just in case". The builder then protects nothing.
- Validating in each setter only. Order-dependent rules slip through.
- Returning a new builder from every setter. It works, but it allocates for no benefit.
- Letting `build()` return a partly filled object when a rule fails. Throw instead.

## Builder in the wild

- Java: `StringBuilder`, `Stream.builder()`, Lombok's `@Builder`, protobuf message builders.
- C++: `std::ostringstream` behaves like a builder for strings; many config libraries use chained setters.
- Python and Kotlin use named arguments and defaults, which remove most of the need.

## When to use, when to avoid

| Situation | Choice |
|---|---|
| 4 or more fields, several optional | Builder |
| Rules that span fields, must never be half-built | Builder |
| 2 or 3 fields, all required | Plain constructor |
| Simple data holder | Java `record` or C++ `struct` with defaults |
| Language has named arguments (Python, Kotlin) | Use them |

:::truth
A builder is boilerplate: roughly twice the lines of the class itself. If you can write the constructor call and still read it, do not add a builder. The pattern pays off with many optional fields or strict validation.
:::

:::warn
A builder is not thread-safe by default; it holds mutable state. Build objects on one thread, then share the immutable result freely.
:::

```cards
- q: What two problems does Builder solve?
  a: Unreadable telescoping constructors (many positional arguments) and half-built mutable objects.
- q: Why is the product constructor private?
  a: So `build()` is the only entry point and validation cannot be bypassed.
- q: Where should cross-field validation live?
  a: In `build()`, because setters can be called in any order.
- q: Why copy mutable collections inside the product constructor?
  a: So later changes to the builder cannot alter an object that was already built.
- q: When is a builder overkill?
  a: With few fields, or when the language has named arguments or records.
```

## Notes

:::notes
- Builder = chained, named setters collected in a helper object, then `build()` creates the finished product.
- It fixes telescoping constructors and half-built mutable objects.
- Product constructor is private; setters return `this`; required values go into the builder's constructor.
- Validate rules that span fields inside `build()`, before constructing.
- Copy mutable collections when building so the product stays immutable and the builder is reusable as a template.
- Skip it for small classes, records, or languages with named arguments.
- Builders themselves are not thread-safe; share the built object, not the builder.
:::
