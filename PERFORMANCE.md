# Pixelift Performance Overview

**📅 1 June 2025**

---

## 🧪 Browser Decode + Resize Benchmark

Pixelift uses the browser’s native `createImageBitmap()` API for efficient decoding and leverages GPU-accelerated canvas operations for resizing. This benchmark evaluates throughput (operations per second) across image formats and scenarios in **Chromium v125**.

---

### 🔍 Decode-Only Performance

| Format | Input Type  | Size   | Throughput (ops/sec) | Notes                         |
|--------|-------------|--------|----------------------|-------------------------------|
| JPEG   | Blob        | Small  | **383.62**           | Fastest decode                |
| JPEG   | Blob        | Medium | 150.05               | Prefer Blob over ArrayBuffer  |
| JPEG   | ArrayBuffer | Medium | 131.50               | Slightly slower               |
| PNG    | Blob        | Medium | 65.37                | Heavier decode                |
| WebP   | Blob        | Large  | 61.35                | Slower due to size/complexity |

---

### 🖼️ Decode + Resize (Canvas Scaling)

| Format | Resize Hint     | Throughput (ops/sec) | Notes                      |
|--------|-----------------|----------------------|----------------------------|
| JPEG   | Thumbnail cover | **439.91**           | Resize overhead negligible |
| JPEG   | Small cover     | 423.49               |                            |
| JPEG   | Medium contain  | 323.61               |                            |
| PNG    | Medium contain  | 71.37                | Limited by decode time     |
| WebP   | Large contain   | 66.50                | Limited by decode time     |

> ⚡ **Resizing overhead is minimal for JPEG.** Performance is primarily constrained by decode speed.

---

### 🧵 Concurrency Throughput (5 Workers, 1 Decode Each)

| Format | Threads | Throughput (ops/sec) |
|--------|---------|----------------------|
| JPEG   | 3       | 283.83               |
| JPEG   | 5       | 268.02               |
| JPEG   | 10      | 184.00               |
| JPEG   | 16      | 136.18               |
| JPEG   | 32      | 79.92                |
| PNG    | 3       | 42.93                |
| PNG    | 5       | 36.29                |
| PNG    | 10      | 23.19                |
| WebP   | 3       | 40.74                |
| WebP   | 5       | 28.07                |
| WebP   | 10      | 16.58                |

> ⚠️ `createImageBitmap()` scales efficiently up to **\~5–10 concurrent decodes**. Beyond that, performance degrades due to CPU saturation and internal queuing — especially for PNG and WebP.

---

## 📊 Visual Benchmark Results

### Concurrency Performance

![Concurrency Performance.png](test/fixtures/images/benchmarks/2025-06-01/Concurrency%20Performance.png)

### Resize Operations

![Resize Operations.png](test/fixtures/images/benchmarks/2025-06-01/Resize%20Operations.png)

### Stress & Edge Cases

![Stress & Edge Cases.png](test/fixtures/images/benchmarks/2025-06-01/Stress%20%26%20Edge%20Casses.png)

### Scalability Analysis

![Scalability Analysis.png](test/fixtures/images/benchmarks/2025-06-01/Scalability%20Analysis.png)

### Core Decode Operations

![Core Decode Operations.png](test/fixtures/images/benchmarks/2025-06-01/Core%20Decode%20Operations.png)

### Performance Regression Detection

![Performance Regression Detection.png](test/fixtures/images/benchmarks/2025-06-01/Performance%20Regression%20Detection.png)

---

## ✅ Key Takeaways

* Utilizes **zero-copy `createImageBitmap(Blob)`** for optimal decode performance.
* **Canvas scaling is GPU-accelerated**, making it highly efficient for generating thumbnails and previews.
* Scales well with light concurrency—ideal for **parallelized image decode pipelines**.
* Performance degrades under high thread count due to browser internals, but remains effective under a moderate load.

---

**📅 1 July 2025**
