---
lang: en-US
title: "Request Analysis"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 2fbdb3f92c3e5f60f11cd16c817934b9bb9bde3c9e3c53eb560c3ed1f2ed3259
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Request Analysis

`Request Analysis` turns HTTP requests that pass through the gateway into traffic, performance, source, and security views while retaining individual log records for troubleshooting. It analyzes gateway request logs, not sign-in events, and does not include connections to original ports that never enter the HTTP gateway.

## Enable data collection

Under `System settings → Logs`, enable gateway request logging and set a retention period of at least 1 day. The Go gateway writes daily structured JSON files to the `logs` directory under its runtime directory, and the `Request Analysis` page reads those files directly. Disabling logging stops new analysis data. Files removed after the retention period are no longer available for historical analysis. Logging adds storage and write overhead, so choose a suitable retention period.

`Log requests from local loopback 127.0.0.1` is disabled by default. As a result, local health checks, same-host reverse proxies, and other requests entering the gateway through `127.0.0.1` normally do not appear in the list. Enable it only while tracing a local request path; it changes what is logged, not the access permissions granted to loopback sources.

Writes use an asynchronous queue. If the settings page shows a cumulative dropped count, the queue was congested and some requests were not written to disk. This number is not a count of requests rejected by the gateway. Requests disconnected immediately by gateway reverse-proxy throttling are also absent from the access log.

## Use the Analysis tab

Select Today, Last 7 days, or Last 30 days. Statistics are grouped in the gateway timezone, with a maximum range of 30 consecutive calendar days. If log retention is shorter than the selected range, earlier dates naturally have no data.

The top metrics show requests, unique clients, 5xx error rate, P95 response time, and outbound traffic. The trend chart compares all requests, 4xx responses, and 5xx responses. The breakdown cards cover:

- Request targets: paths, routes, Hosts, and upstreams.
- Traffic sources: Referrer and UTM source, medium, and campaign.
- Countries and regions: aggregated from deduplicated valid client IPs.
- Clients: device type, browser, and operating system.
- Responses: status code, method, and latency band.
- Authentication and security: authentication decisions and WAF actions.

Geographic data comes from the IP location cache. On first view it may show resolving or partial coverage; start a geographic refresh and check again later. The analysis API returns only aggregated country and region buckets, not the client-IP list used to build them. Corrupt or incomplete log records are excluded, and the page reports how many were skipped.

Averages, P95, and error rates help reveal trends; they are not a replacement for full upstream application tracing. When you find an anomaly, switch to the `Logs` tab and locate specific requests by Host, path, time, and status code.

## Use the Logs tab

### Read a Record

| Field | Purpose |
| --- | --- |
| Client IP / Connection source IP | Compare the real visitor with the gateway's actual TCP peer when troubleshooting CDN, reverse-proxy, and Docker paths |
| Method, Host, Path | Determine which service the request matched |
| Route type, Upstream target | Determine whether a Host or path rule reached the intended target |
| Auth result | Determine whether the result came from a session, allowlist, local exemption, advanced-authentication temporary grant, or lack of authorization |
| Subdomain rule group ID / Temporary grant state | For an advanced-authentication match, identify the exact rule group and whether the request used one-request access or a grant was issued, renewed, or reused |
| Status code, Duration | Distinguish a gateway rejection, upstream error, or slow response |

Request Logs can contain access paths, Query parameters, source IPs, User-Agent values, authentication results, and upstream addresses. Treat them as sensitive operations data. Before sharing a troubleshooting excerpt, remove tokens, query parameters, internal addresses, and personally identifying information.

### Recommended Troubleshooting Order

1. Make one reproducible request from an external network.
2. Find the matching Host and path, and confirm that the request reached the gateway.
3. Compare the client IP and confirm that a proxy address was not mistaken for the visitor.
4. Check the authentication result and access policy.
5. Then inspect the upstream target, status code, and the application's own logs.

If no request appears at all, first check whether the test traffic came from `127.0.0.1` and whether loopback logging was enabled. After excluding local traffic, the problem is usually earlier in the path—DNS, CDN, tunnel, router, or port exposure. Do not start by changing mapping rules.

If only some requests are missing, check whether gateway throttling disconnected them immediately and whether the log settings page reports a dropped-queue warning. If the status code came from the gateway rather than the upstream, continue with authentication, Visibility, WAF, and mapping checks. If the correct Upstream target is already shown, move on to the application's own logs.

With managed Cloudflare Tunnel and `Pseudo IPv4 → Overwrite Headers`, an IPv6 visitor's initial edge header can be in `240.0.0.0/4`. A supporting fn-knock release validates `CF-Connecting-IPv6` on the dedicated managed entry and restores `Client IP` to the real public IPv6; `Connection source IP` still reflects the local Tunnel path. If a Class E address remains after upgrading, check whether the origin is manual or whether the header is missing or duplicated. For a manual origin, set Pseudo IPv4 to `Off` or `Add Header`. Do not work around this by adding `240.0.0.0/4` to an allowlist.

With subdomain advanced authentication enabled, an Auth result of `Allowed by subdomain rule` means that advanced authentication allowed the request. Use `Subdomain rule group ID` to locate the triggering configuration. `One-request access` means the request matched a rule but created no persistent grant, which commonly occurs during the initial Cookie probe, with a client that does not store Cookies, during a WebSocket upgrade, or when persistence falls back. `Issued` means this request created a persistent grant, `Renewed` refreshed its idle lifetime, and `Reused` continued to use an existing grant. See [Advanced Authentication for Subdomains](/en/guide/advanced-auth) for rule behavior.

### Act on a Suspicious IP

After confirming that an address is the actual attack source, you can open General blacklist or IP Allowlist actions from the log. First rule out a shared egress address or preceding proxy, and preserve context such as time, Host, and path.

- [Security Model and Baseline](/en/guide/security)
- [Global Blocklist](/en/guide/general-blacklist)
- [Web Application Firewall (WAF)](/en/guide/waf)
