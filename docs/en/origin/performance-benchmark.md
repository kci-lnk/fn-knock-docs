---
lang: en-US
title: "Performance and Resource Efficiency Benchmark"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: b846207b28fe57b1d61f64c90045bc33836bf315fb1bf76adebdfe083e29909b
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Performance and Resource Efficiency Benchmark

We ran fn-knock and another product in the same environment with the same load-test settings. These numbers describe this test only. They are not third-party certification, and different hardware or real application traffic may produce different results.

<PerformanceBenchmarkCharts />

## Summary

The main test sent the same HTTPS 404 requests through both gateways. In this run, fn-knock handled more requests, had lower P99 latency, completed more work per CPU core, and used less memory. P99 is the time within which 99% of requests completed; lower is better.

| Metric | fn-knock | Other product | Result |
| --- | ---: | ---: | --- |
| Throughput at 512 concurrent connections | 13,026 req/s | 4,642 req/s | fn-knock: `2.81×` |
| P99 at 512 concurrent connections | 498.68 ms | 573.10 ms | fn-knock: `12.99%` lower |
| Per-core throughput | 2,242 req/s/core | 1,063 req/s/core | fn-knock: `110.89%` higher |
| Average memory under load (RSS) | 153.4 MiB | 325.6 MiB | fn-knock: `52.90%` lower |

Disabling request logs for loopback addresses barely changed fn-knock throughput. P99, CPU use, and memory variation improved slightly, and the benchmark requests no longer wrote to the access log.

## Test Conditions

| Item | Setting |
| --- | --- |
| Test date | 2026-07-31 |
| Load generator | `wrk` with 8 threads |
| Concurrency levels | 64, 256, and 512 |
| Primary request | HTTPS with Host `loadtest.invalid`, matching no route and returning 404 |
| Resource recording | `pidstat` recorded average CPU and RSS for each target process; RSS is the physical memory held by the process |
| Test environment | `wrk` and both services shared the same 8-core resources; every run used the same tool and concurrency settings |

This keeps network-path differences small, but `wrk` also uses CPU. The numbers are therefore the result of the whole 8-core environment working together. They are not the limit of either service on dedicated hardware and do not include real Internet latency.

## Throughput and P99 Latency

| Concurrency | fn-knock throughput | Other-product throughput | fn-knock advantage | fn-knock P99 | Other-product P99 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 64 | 13,529 req/s | 2,992 req/s | `352.14%` | 30.38 ms | 81.52 ms |
| 256 | 12,982 req/s | 4,251 req/s | `205.36%` | 242.29 ms | 272.92 ms |
| 512 | 13,026 req/s | 4,642 req/s | `180.63%` | 498.68 ms | 573.10 ms |

fn-knock had already reached approximately 13.5k req/s at 64 concurrent connections. Adding more concurrency did not noticeably improve throughput; it mainly increased waiting time. For the other product, moving from 256 to 512 concurrent connections raised throughput by only `9.2%`, while P99 rose by approximately `110%`. At that point, adding concurrency mostly increased latency instead of useful throughput.

## Resource Efficiency at 512 Concurrent Connections

| Metric | fn-knock | Other product | Interpretation |
| --- | ---: | ---: | --- |
| Service CPU | 5.81 cores | 4.37 cores | fn-knock used `33.07%` more CPU |
| Throughput | 13,026 req/s | 4,642 req/s | fn-knock processed `180.63%` more requests |
| Per-core throughput | 2,242 req/s/core | 1,063 req/s/core | fn-knock was `110.89%` higher |
| Average memory under load (RSS) | 153.4 MiB | 325.6 MiB | fn-knock used `52.90%` less |

fn-knock used more CPU at 512 concurrent connections, but the extra request volume was much larger than the CPU increase. Each core still completed more work. CPU usage should be read together with throughput, P99, and error rate rather than on its own.

## Memory Before and After the Load Test

| Stage | fn-knock | Other product | Other product / fn-knock |
| --- | ---: | ---: | ---: |
| Before the load test | 58.3 MiB | 121.4 MiB | `2.08×` |
| Average under heavy load | 153.4 MiB | 325.6 MiB | `2.12×` |
| Recorded peak | 228.6 MiB | 610.0 MiB | `2.67×` |
| After cooldown in the same run | 132.8 MiB | 201.7 MiB | `1.52×` |

The other product reached a memory peak of 610.0 MiB. In a repeat run, it also produced 6 timeouts and a P99 of up to 1.12 seconds. fn-knock had no timeouts in the repeat run, and its memory peak did not rise further.

The repeat run was short, so it shows only the short-term peak and cooldown. Checking for continuing growth or a leak requires a fixed workload for at least 30–60 minutes and several separate runs.

## Effect of Disabling Benchmark Request Logs

After fn-knock stopped logging requests from loopback addresses, the following changed from the preceding run with logging enabled:

| Concurrency | Throughput change | P99 change | Mean latency change |
| ---: | ---: | ---: | ---: |
| 64 | `−4.06%` | `−13.52%` | `+0.67%` |
| 256 | `−0.72%` | `−10.63%` | `−10.08%` |
| 512 | `+0.32%` | `−6.83%` | `−5.03%` |

At 512 concurrent connections, throughput differed by only `0.32%`, which is small enough to treat as test variation. P99 fell by `6.83%`, average CPU use by `0.96%`, and average memory by `5.39%`. The run sent 593,792 requests and added nothing to the access log.

Request logging was not the main performance limit in this test. Disabling it did not materially improve RPS; it mainly reduced disk writes and made CPU and memory steadier. In production, decide whether to log loopback or trusted-source requests based on audit, storage, and troubleshooting needs.

## The 7998 Management API Is Not Directly Comparable

The test also recorded the readiness endpoint on the `7998` management API:

| Path | Request | Throughput | P99 | Service CPU | Average memory (RSS) |
| --- | --- | ---: | ---: | ---: | ---: |
| fn-knock gateway `7999` | HTTPS 404 with CIDR evaluation and routing | 13,026 req/s | 498.68 ms | 5.81 cores | 153.4 MiB |
| Other product | HTTPS 404 | 4,642 req/s | 573.10 ms | 4.37 cores | 325.6 MiB |
| Management API `7998` | HTTP readiness including a gateway status check | 5,157 req/s | 162.46 ms | 2.01 cores | 169.3 MiB |

Port `7998` is the management interface; `7999` is the gateway that handles user traffic. The two requests do different work, so their numbers should not be ranked directly, and `7998` cannot be used to estimate reverse-proxy capacity. The management API is not an application entry point. Read [OpenAPI: Management API Access and AI Agents](/en/guide/openapi) before exposing it.

## When Using These Numbers

- fn-knock was already close to its throughput limit near 64 concurrent connections in this test. More concurrency mainly added waiting time.
- fn-knock used less memory in the short run, but a longer sustained test is still needed to judge long-term stability.
- Choose what to log from operational and audit needs, not just to improve a benchmark score.
- Ports `7998` and `7999` handle different work. Do not rank their results together.

## Scope and Limitations

- Both primary paths used HTTPS, the same Host, and an unmatched-route 404, but response sizes differed: approximately 11.5 KiB for fn-knock and 65 B for the other product. fn-knock still achieved higher throughput with the larger response.
- This run covered TLS, CIDR checks, route matching, and a gateway-generated 404 response. It did not include an application upstream, so it does not represent every workload's real end-to-end speed.
- “Other product” means only the version and configuration used in this test. The result does not describe its other versions, other deployment modes, or every similar product.
- Hardware, kernel, TLS, certificates, logging, connection reuse, response size, and network path can all change the result. To test your deployment, keep the script and settings fixed, run it several times, and record throughput, P99, error rate, CPU, memory, and connection count together.
- Leave headroom in production. If response time matters, test an acceptable concurrency limit with real requests instead of copying the figures from this page.
