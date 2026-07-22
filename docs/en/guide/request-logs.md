---
lang: en-US
title: "Request Logs"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: efc4056649508d23562afdbadd597386208709360096236f7fcc4e88a2bcb169
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Request Logs

Request Logs record HTTP requests that pass through the gateway. Use them to confirm whether a request reached fn-knock, which Host or path it matched, and where it was ultimately forwarded. They are not sign-in logs and do not record connections to original ports that never enter the gateway.

Under `System settings → Logs`, enable gateway request logging and set a retention period of at least 1 day. The Go gateway writes daily JSON structured files to the `logs` directory under its runtime directory. The admin console's `Request logs` page reads them by date and supports search and detailed inspection. Logging adds storage and write overhead, so choose a retention period appropriate for your needs after troubleshooting.

Writes use an asynchronous queue. If the settings page shows a cumulative dropped count, the queue was congested and some requests were not written to disk. This number is not a count of requests rejected by the gateway. Requests disconnected immediately by gateway reverse-proxy throttling are also absent from the access log.

## Read a Record

| Field | Purpose |
| --- | --- |
| Client IP / Connection source IP | Compare the real visitor with the gateway's actual TCP peer when troubleshooting CDN, reverse-proxy, and Docker paths |
| Method, Host, Path | Determine which service the request matched |
| Route type, Upstream target | Determine whether a Host or path rule reached the intended target |
| Auth result | Determine whether the result came from a session, allowlist, local exemption, advanced-authentication temporary grant, or lack of authorization |
| Subdomain rule group ID / Temporary grant state | For an advanced-authentication match, identify the exact rule group and whether the request used one-request access or a grant was issued, renewed, or reused |
| Status code, Duration | Distinguish a gateway rejection, upstream error, or slow response |

Request Logs can contain access paths, Query parameters, source IPs, User-Agent values, authentication results, and upstream addresses. Treat them as sensitive operations data. Before sharing a troubleshooting excerpt, remove tokens, query parameters, internal addresses, and personally identifying information.

## Recommended Troubleshooting Order

1. Make one reproducible request from an external network.
2. Find the matching Host and path, and confirm that the request reached the gateway.
3. Compare the client IP and confirm that a proxy address was not mistaken for the visitor.
4. Check the authentication result and access policy.
5. Then inspect the upstream target, status code, and the application's own logs.

If no request appears at all, the problem is usually earlier in the path—DNS, CDN, tunnel, router, or port exposure. Do not start by changing mapping rules.

If only some requests are missing, check whether gateway throttling disconnected them immediately and whether the log settings page reports a dropped-queue warning. If the status code came from the gateway rather than the upstream, continue with authentication, Visibility, WAF, and mapping checks. If the correct Upstream target is already shown, move on to the application's own logs.

With subdomain advanced authentication enabled, an Auth result of `Allowed by subdomain rule` means that advanced authentication allowed the request. Use `Subdomain rule group ID` to locate the triggering configuration. `One-request access` means the request matched a rule but created no persistent grant, which commonly occurs during the initial Cookie probe, with a client that does not store Cookies, during a WebSocket upgrade, or when persistence falls back. `Issued` means this request created a persistent grant, `Renewed` refreshed its idle lifetime, and `Reused` continued to use an existing grant. See [Advanced Authentication for Subdomains](/en/guide/advanced-auth) for rule behavior.

## Act on a Suspicious IP

After confirming that an address is the actual attack source, you can open General blacklist or IP Allowlist actions from the log. First rule out a shared egress address or preceding proxy, and preserve context such as time, Host, and path.

- [Security Model and Baseline](/en/guide/security)
- [Global Blocklist](/en/guide/general-blacklist)
- [Web Application Firewall (WAF)](/en/guide/waf)
