---
lang: en-US
title: "Request Analysis"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: a8f63bef869180cc200269f0ddeb2a99c558573690ffb41d80b593d2bac61496
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Request Analysis

`Request Analysis` turns HTTP requests that pass through the gateway into traffic, performance, source, and security views while retaining individual log records for troubleshooting. It analyzes gateway request logs, not sign-in events, and does not include connections to original ports that never enter the HTTP gateway.

Use the `Analysis`, `Logs`, and `WAF logs` tabs in `Request Analysis` to switch between statistics, request details and security events.

## Enable data collection

Under `System settings → Logs`, enable gateway request logging and set a retention period of at least 1 day. The Go gateway writes daily structured JSON files by default to the `logs` directory under its runtime directory, and the `Request Analysis` page reads those files directly. Disabling logging stops new analysis data. Files removed after the retention period are no longer available for historical analysis. Logging adds storage and write overhead, so choose a suitable retention period.

`Log requests from local loopback 127.0.0.1` is disabled by default. As a result, local health checks, same-host reverse proxies, and other requests entering the gateway through `127.0.0.1` normally do not appear in the list. Enable it only while tracing a local request path; it changes what is logged, not the access permissions granted to loopback sources.

Writes use an asynchronous queue. If the settings page shows a cumulative dropped count, the queue was congested and some requests were not written to disk. This number is not a count of requests rejected by the gateway. Requests disconnected immediately by gateway reverse-proxy throttling are also absent from the access log.

## Capacity and rolling retention

Under `System settings → Logs`, set daily capacity, total capacity, and retention days. Capacities use MiB; total capacity cannot be smaller than daily capacity. Exceeding capacity or retention deletes the oldest logs while recording continues. Lowering a limit immediately cleans existing records and cannot be undone; back up logs that must be retained first.

Cleanup works by segment, so retained data may fall below the limit. Queries and statistics cover only retained records. Usage updates on load or save, not continuously. If a cursor expires after cleanup, refresh the list and query again. Check capacity/storage write failures separately from asynchronous queue drops.

## Change the log directory

In `System settings → Logs`, enter a log directory or use `Browse folders` to select a folder accessible to the gateway, then save. The request log tab also links to the directory setting. The page shows actual and default directories separately. Save an empty value or use restore default to return to the default location.

The browser shows the gateway server's filesystem; in Docker these are container paths, so mount storage first. The log directory picker can browse protected directories hidden by the static-content browser. This does not make them eligible for public static hosting. Saving validates the path and write access; on failure, read the error and reload the actual directory.

Changing directories does not move old logs. Queries, analysis and retention cleanup use only the current directory after saving; retain or clean up the old directory separately. Logs in memory-backed directories disappear after reboot. External persistent storage can reduce internal FLASH writes. Send an external request after saving and verify the actual directory and a new log entry.

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

Set the start and end dates, then apply the range. Queries cover at most 30 consecutive calendar days and cannot end after the server's current date. Visit-time ordering supports newest or oldest first. Switch between individual requests and grouping by IP; the IP view aggregates all retained matching requests in the selected range and lets you open one IP's requests within that same range.

Log deletion is available only for a single-day range. It removes that date's logs, not just filtered results, and does not delete an entire multi-day range. Widening a query cannot recover deleted or rotated data.

### Read a Record

| Field | Purpose |
| --- | --- |
| Client IP / Connection source IP | Compare the real visitor with the gateway's actual TCP peer when troubleshooting CDN, reverse-proxy, and Docker paths |
| Method, Host, Path | Determine which service the request matched |
| Route type, Upstream target | Determine whether a Host or path rule reached the intended target; static responses show `Static file` or `Static directory` and have no upstream address |
| Auth result | Determine whether the result came from a session, allowlist, local exemption, advanced-authentication temporary grant, or lack of authorization |
| Subdomain rule group ID / Temporary grant state | For an advanced-authentication match, identify the exact rule group and whether the request used one-request access or a grant was issued, renewed, or reused |
| Status code, Duration | Distinguish a gateway rejection, upstream error, or slow response |

Request Logs can contain access paths, Query parameters, source IPs, User-Agent values, authentication results, and upstream addresses. Treat them as sensitive operations data. Before sharing a troubleshooting excerpt, remove tokens, query parameters, internal addresses, and personally identifying information.

Static file and directory responses read the filesystem directly at the gateway, so their upstream target is empty. The application Host remains the route key, while the Trace ID, authentication result, WAF action, status code, and duration are recorded normally. The absolute server path is not written to Request Logs or WAF events. See [Static File and Directory Responses](/en/guide/static-host-mapping) for configuration and troubleshooting.

### Recommended Troubleshooting Order

1. Make one reproducible request from an external network.
2. Find the matching Host and path, and confirm that the request reached the gateway.
3. Compare the client IP and confirm that a proxy address was not mistaken for the visitor.
4. Check the authentication result and access policy.
5. Then inspect the upstream target, status code, and the application's own logs.

### Follow the Full Chain by Trace ID

Request logs, WAF logs, system events, and notification deliveries use a common Trace ID to associate related records. Select `Trace ID lookup` in Request Analysis or Event Center, or click a Trace ID in a record, to open `Full-chain trace`.

The trace page orders found requests, WAF events, system events, notification triggers, and deliveries on one timeline. Each source is marked found, not found, or temporarily unavailable; available content remains visible if one source fails. No result can mean collection was disabled, retention expired, or an older record had no unified Trace ID—not necessarily that the request never occurred.

A Trace ID may also appear in a gateway response header, block page, or notification. Before sharing a trace, inspect its Host, path, source IP, upstream address, and notification content. The ID is a correlation key, not a sanitized public credential.

If no request appears at all, first check whether the test traffic came from `127.0.0.1` and whether loopback logging was enabled. After excluding local traffic, the problem is usually earlier in the path—DNS, CDN, tunnel, router, or port exposure. Do not start by changing mapping rules.

If only some requests are missing, check whether gateway throttling disconnected them immediately and whether the log settings page reports a dropped-queue warning. If the status code came from the gateway rather than the upstream, continue with authentication, Visibility, WAF, and mapping checks. If the correct Upstream target is already shown, move on to the application's own logs.

The dedicated Cloudflare origin supports managed and manually configured Tunnels on the same host. With `Pseudo IPv4 → Overwrite Headers`, Cloudflare replaces an IPv6 visitor's `CF-Connecting-IP` with an address in `240.0.0.0/4`. The entry restores IPv6 from a single valid public `CF-Connecting-IPv6` value. Missing, duplicate, private, or malformed IPv6 values retain Pseudo IPv4 without trusting other forwarding headers. If logs still show Class E addresses, check the dedicated origin and both headers, or use `Off` / `Add Header` for Pseudo IPv4. Do not allowlist that subnet.

With subdomain advanced authentication enabled, an Auth result of `Allowed by subdomain rule` means that advanced authentication allowed the request. Use `Subdomain rule group ID` to locate the triggering configuration. `One-request access` means the request matched a rule but created no persistent grant, which commonly occurs during the initial Cookie probe, with a client that does not store Cookies, during a WebSocket upgrade, or when persistence falls back. `Issued` means this request created a persistent grant, `Renewed` refreshed its idle lifetime, and `Reused` continued to use an existing grant. See [Advanced Authentication for Subdomains](/en/guide/advanced-auth) for rule behavior.

### Act on a Suspicious IP

After confirmation, blacklist a source from an individual request or IP-group row, or remove an existing blacklist entry. You can also select the current page or multiple rows for bulk actions. First compare client and connection-source IPs to avoid blocking shared exits, CDNs, or upstream proxies, and retain the time, Host, and path as context.

- [Security Model and Baseline](/en/guide/security)
- [Global Blocklist](/en/guide/general-blacklist)
- [Web Application Firewall (WAF)](/en/guide/waf)
