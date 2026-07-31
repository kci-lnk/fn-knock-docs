---
lang: en-US
title: "Performance and Resource Efficiency Benchmark"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: a37706ac07861597ecacf65c82b5e5c5d7a6e6f17806a6f3f9f6935720417d3b
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Performance and Resource Efficiency Benchmark

This report records a load-test comparison between the fn-knock gateway and another product in the same controlled environment. It shows relative performance for the tested versions, configuration, and request model. It is neither third-party certification nor a performance guarantee for arbitrary hardware or production traffic.

## Summary

In the primary HTTPS unmatched-route scenario, fn-knock delivered better throughput, P99 latency, throughput per CPU core, and memory usage:

| Metric | fn-knock | Other product | Result |
| --- | ---: | ---: | --- |
| Throughput at 512 concurrent connections | 13,026 req/s | 4,642 req/s | fn-knock: `2.81×` |
| P99 at 512 concurrent connections | 498.68 ms | 573.10 ms | fn-knock: `12.99%` lower |
| Throughput per CPU core | 2,242 req/s/core | 1,063 req/s/core | fn-knock: `110.89%` higher |
| Average RSS under load | 153.4 MiB | 325.6 MiB | fn-knock: `52.90%` lower |

After request logging for loopback sources was disabled, fn-knock throughput did not change significantly, while high-concurrency P99, CPU use, and memory variation improved slightly. The benchmark requests also stopped generating access-log writes.

## Test Conditions

| Item | Setting |
| --- | --- |
| Test date | 2026-07-31 |
| Load generator | `wrk` with 8 threads |
| Concurrency levels | 64, 256, and 512 |
| Primary request | HTTPS with Host `loadtest.invalid`, matching no route and returning 404 |
| Resource sampling | `pidstat` averages for the target service process CPU and RSS |
| Environment control | The load generator and both services shared the same 8-core test resources; every run used the same tool and concurrency parameters |

This setup reduces differences in network paths, but the load generator also competes for CPU. The results therefore reflect the combined limit of the complete test environment, not the absolute capacity of either service on dedicated hardware or over a real public network.

## Throughput and Tail Latency

| Concurrency | fn-knock throughput | Other-product throughput | fn-knock advantage | fn-knock P99 | Other-product P99 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 64 | 13,529 req/s | 2,992 req/s | `352.14%` | 30.38 ms | 81.52 ms |
| 256 | 12,982 req/s | 4,251 req/s | `205.36%` | 242.29 ms | 272.92 ms |
| 512 | 13,026 req/s | 4,642 req/s | `180.63%` | 498.68 ms | 573.10 ms |

fn-knock had already reached approximately 13.5k req/s at a concurrency of 64. Increasing concurrency further did not raise stable throughput; it mainly increased queueing and tail latency. For the other product, increasing concurrency from 256 to 512 raised throughput by approximately `9.2%`, while P99 rose by approximately `110%`. Both paths were therefore near their capacity knee for this request model.

## Resource Efficiency at 512 Concurrent Connections

| Metric | fn-knock | Other product | Interpretation |
| --- | ---: | ---: | --- |
| Service CPU | 5.81 cores | 4.37 cores | fn-knock used `33.07%` more CPU |
| Throughput | 13,026 req/s | 4,642 req/s | fn-knock processed `180.63%` more requests |
| Throughput per CPU core | 2,242 req/s/core | 1,063 req/s/core | fn-knock was `110.89%` higher |
| Average RSS under load | 153.4 MiB | 325.6 MiB | fn-knock used `52.90%` less |

fn-knock used more CPU during the high-concurrency run, but its throughput gain was much larger than the CPU increase, so it still achieved higher per-core efficiency. Lower CPU usage is not inherently better; it must be evaluated together with completed request volume, tail latency, and error rate.

## Memory Lifecycle

| Stage | fn-knock | Other product | Other product / fn-knock |
| --- | ---: | ---: | ---: |
| Before the load test | 58.3 MiB | 121.4 MiB | `2.08×` |
| Average under load | 153.4 MiB | 325.6 MiB | `2.12×` |
| Recorded peak | 228.6 MiB | 610.0 MiB | `2.67×` |
| After cooldown in the same run | 132.8 MiB | 201.7 MiB | `1.52×` |

The other product reached a recorded peak of 610.0 MiB. A subsequent repeat run also produced 6 timeouts and a P99 of up to 1.12 seconds. The fn-knock repeat run produced no timeouts and did not raise its recorded memory peak further.

A short repeat test can show high-water marks and an initial reclamation trend only. Detecting slow growth, fragmentation, or leaks still requires a sustained load of at least 30–60 minutes, a stable request model, and multiple independent runs.

## Effect of Disabling Benchmark Request Logs

After fn-knock stopped logging requests from loopback sources, the following changes were observed relative to the preceding run with logging enabled:

| Concurrency | Throughput change | P99 change | Mean latency change |
| ---: | ---: | ---: | ---: |
| 64 | `−4.06%` | `−13.52%` | `+0.67%` |
| 256 | `−0.72%` | `−10.63%` | `−10.08%` |
| 512 | `+0.32%` | `−6.83%` | `−5.03%` |

At a concurrency of 512, the throughput difference was only `0.32%` and can be treated as measurement variation. P99 fell by `6.83%`, average CPU use fell by `0.96%`, and average RSS under load fell by `5.39%`. The run issued 593,792 requests and added 0 bytes to the access log.

Request logging was therefore not the primary throughput bottleneck in this scenario. Its main benefit was reducing disk writes and resource variation rather than materially increasing RPS. Whether production deployments should log loopback or trusted-source requests depends on audit requirements, storage cost, and troubleshooting practices.

## The Management API Path Is Reference Data Only

The run also sampled the readiness path of the fn-knock management API on `7998` to show the approximate resource position of the control plane:

| Path | Request | Throughput | P99 | Service CPU | Average RSS under load |
| --- | --- | ---: | ---: | ---: | ---: |
| fn-knock gateway `7999` | HTTPS 404 with CIDR evaluation and routing | 13,026 req/s | 498.68 ms | 5.81 cores | 153.4 MiB |
| Other product | HTTPS 404 | 4,642 req/s | 573.10 ms | 4.37 cores | 325.6 MiB |
| Management API `7998` | HTTP readiness including a gateway status check | 5,157 req/s | 162.46 ms | 2.01 cores | 169.3 MiB |

Port `7998` is the control plane. Its readiness request is not equivalent to the HTTPS gateway data plane on `7999`. These numbers cannot be used to infer reverse-proxy capacity, and the management API must not be used as an application traffic entry point. See [OpenAPI: Management API Access and AI Agents](/en/guide/openapi) for exposure options and security boundaries.

## How to Interpret the Results

1. **fn-knock was more efficient for this request model.** In the stable run at 512 concurrent connections, it delivered approximately `2.81×` the throughput of the other product, with lower P99 and `110.89%` higher per-core throughput.
2. **More concurrency does not necessarily mean more useful capacity.** fn-knock reached a throughput plateau near 64 concurrent connections; additional concurrency mainly increased queueing latency.
3. **Memory findings require long-duration confirmation.** fn-knock had lower short-run averages and peaks, but a single test cannot replace long-term stability testing.
4. **Logging policy affects resource variation and disk writes.** Decisions to exclude request classes from logs should follow operational and audit requirements, not benchmark scores alone.
5. **Control-plane and data-plane paths must be evaluated separately.** The `7998` readiness figures are contextual only and cannot be ranked directly against HTTPS proxy requests.

## Scope and Limitations

- Both primary paths used HTTPS, the same Host, and an unmatched-route 404, but response sizes differed: approximately 11.5 KiB for fn-knock and 65 B for the other product. fn-knock still achieved higher throughput with the larger response.
- This run measured TLS, CIDR evaluation, route matching, and gateway-generated response handling. It did not include an application upstream and cannot represent end-to-end performance for arbitrary workloads.
- “Other product” refers only to the specific version and configuration tested. The result must not be generalized to its other versions, deployment modes, or the entire product category.
- Hardware, kernel, TLS implementation, certificates, logging, connection reuse, response size, and network path can all change the result. Evaluate your deployment with repeated runs of the same script and record throughput, P99, error rate, CPU, RSS, and connection count together.
- Capacity plans require headroom. When tail latency matters, determine an acceptable concurrency limit with the real request model instead of adopting the concurrency figures on this page directly.
