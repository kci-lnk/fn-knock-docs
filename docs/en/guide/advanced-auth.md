---
lang: en-US
title: "Advanced Authentication for Subdomains"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 7935017e44e4c972067b5e804299e41a1cebb8e63a45f920f08a0f0ab418a340
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Advanced Authentication for Subdomains

Subdomain advanced authentication adds conditional allow rules to an HTTP or HTTPS application Host that has `Require sign-in` enabled. When a request first matches a rule, that request receives one-request access and a short-lived capability probe is returned to clients that support Cookies. The system creates a persistent temporary grant limited to the current Host only after a later request returns the probe. Requests that do not match continue through the normal sign-in, session, and service-scope flow.

A temporary grant is not a system login: it does not create a login session or IP authorization, does not display the portal, and cannot access another Host. Advanced authentication is an independent allow path, not an additional check layered on top of the existing sign-in rules.

## Requirements

- The mapping is a regular application Host, not the authentication service.
- The Target uses HTTP or HTTPS.
- The mapping has `Require sign-in` enabled.
- If a rule uses source IP or region, the gateway can identify the real client IP.

In the `Domains` list, open the menu on the right of the application Host and select `Advanced authentication`. This entry does not appear for the authentication Host, public mappings, or TCP / UDP mappings.

## Scope of a temporary grant

After a Cookie-capable client completes the probe and receives a persistent temporary grant, requests to other paths or methods on the current Host do not have to satisfy the original conditions again during its validity period. Path, Header, and Query conditions therefore cannot serve as continuous per-request access control.

Apps, scripts, and other clients that do not return Cookies create no persistent state. Every request from those clients must match the rule again and receives access for that request only. A WebSocket upgrade is also allowed only for the current handshake because `101 Switching Protocols` is not a reliable Cookie-delivery channel; reconnecting evaluates the rules again. `One-request access` in Request Logs identifies this state.

For example, a rule that matches only `/health` does not limit a persistent grant to `/health`. After the browser completes the probe, the entire current Host is allowed for the lifetime of the temporary grant. To expose only a few fixed paths, use [Static Path Responses](/en/guide/gateway-path-response), split them onto a separate Host, or continue enforcing permissions in the upstream application.

Protective denials such as the general blacklist, WAF, and a legacy strict allowlist still take precedence. Advanced authentication cannot bypass these security boundaries.

## Configure the validity period

| Setting | Default | Allowed range | Behavior |
| --- | --- | --- | --- |
| `Expire after no access for` | 24 hours | 5 minutes–30 days | The idle timer restarts after each valid request |
| `Maximum time the grant can be used` | 30 days | 5 minutes–365 days | Counted from initial issuance and not extended by continuous use |

These two periods apply only to persistent temporary grants created after the Cookie probe; one-request access does not continue to a later request. The maximum lifetime cannot be shorter than the no-access expiry. Saving a change to the rules, validity period, or enabled state rotates the policy version and immediately invalidates existing temporary grants. Disabling advanced authentication preserves the draft rules so they can be enabled again later.

## Organize rule groups

Rules use OR between groups and AND within a group:

```text
Rule group 1: Condition A AND Condition B
              OR
Rule group 2: Condition C AND Condition D
```

Matching any complete rule group is sufficient to issue a grant. Each Host supports up to 16 rule groups and up to 16 conditions per group. At least one non-empty rule group is required when advanced authentication is enabled.

The following broad rules require a second confirmation when saved:

- Every condition in a group uses a negative operator such as `not equals` or `does not belong to`.
- Access is allowed only by HTTP method.
- A path rule covers the root path `/`.
- A source network includes `0.0.0.0/0` or `::/0`.

The second confirmation only warns that the rule has broad coverage; it does not mean the configuration is safe. Immediately after saving, test separately from external networks that do and do not satisfy the conditions.

## Scale and issuance rate limits

A single Host is also subject to these hard limits:

| Item | Limit |
| --- | --- |
| Match values or region selections per condition | 256 |
| Match values across all conditions | 4096 |
| Regular expressions in total | 256 |
| One regular expression | 512 bytes |
| CIDRs resolved from region and network conditions | 100000 |
| Advanced authentication configuration request | 8 MiB |

A persistent temporary grant is created only when a client returns a valid probe and no reusable grant exists. For the same Host and client IP, the system creates at most 10 grants every 60 seconds; across a single Host, it creates at most 1000 grants every 60 seconds and retains at most 100000 active grants. If the creation rate or capacity is reached, or persistent storage is temporarily unavailable, an already matched request falls back to `One-request access` instead of being denied because it could not be persisted; the next request must match the rule again. A shared proxy egress counts multiple clients as one source, so deployments behind an upstream proxy must first verify real client IP detection.

## Match targets

| Target | Available operators | Configuration notes |
| --- | --- | --- |
| Source IP | equals, not equals, in CIDR, not in CIDR | Supports IPv4 and IPv6; enter one address or network per line |
| Source region | belongs to, does not belong to | Select a province, city, province-wide, or operator scope; resolved to fixed CIDRs when saved |
| URL path | equals, not equals, path prefix, not a prefix, contains, does not contain, RE2 regular expression, not RE2 regular expression | Matches the request path without the domain |
| Request header | exists / does not exist, equals / not equals, contains / does not contain, starts with / does not start with, ends with / does not end with, RE2 regular expression / not RE2 regular expression | Select a common name or enter a custom header directly; values are case-sensitive by default |
| Query parameter | exists / does not exist, equals / not equals, contains / does not contain, starts with / does not start with, ends with / does not end with, RE2 regular expression / not RE2 regular expression | Parameter names and values are included in configuration backups |
| HTTP method | method is in, method is not in | Enter one method per line, such as `GET` or `HEAD` |

When a condition accepts multiple match values, a positive condition succeeds if any value matches. A negative condition requires the request value not to match any configured value. For example, two `not equals` values do not mean "allow when different from either one"; the request value must differ from both.

Region selections are expanded and stored as fixed CIDRs when saved. If the CIDR data source changes later, an existing rule does not expand or shrink automatically. Reopen and save the configuration to recompile it with the current region data.

The header name cannot be a credential, forwarding, or client-IP-related header such as `Host`, `Cookie`, `Authorization`, `X-Forwarded-*`, `X-Real-IP`, or `X-Reauth-*`. When using an upstream proxy, configure it to remove or overwrite any header that an external client could forge.

Header, Query, and path match values are stored in plaintext in the configuration and backups. The system does not include these configured values in advanced-authentication logs, metrics, or error details; `Request Logs` records only the matching rule-group ID and temporary-grant state, without echoing configuration values. Do not place a long-lived, high-value secret directly in a Query parameter, and handle exported backups as sensitive files.

## Example rule

To let a managed device on a trusted office network open `nas.example.com` directly, add both conditions to the same rule group:

1. `Source IP → in CIDR → 203.0.113.0/24`.
2. `Request header → equals → X-Device-ID → device-identifier`.

The system issues a temporary grant for the current Host only when both conditions match. A client can construct the request header itself, so it is not a strong identity credential on its own outside the trusted source network. The upstream application must retain its own authorization controls.

## Verification and troubleshooting

1. Send a matching request from a real external network.
2. In `Request Logs`, confirm that `Auth result` is `Allowed by subdomain rule`.
3. Confirm that `Subdomain rule group ID` identifies the expected group and that `Temporary grant state` is `One-request access`, `Issued`, `Renewed`, or `Reused`. A browser's first request normally uses one-request access; the state becomes Issued after the browser returns the probe Cookie.
4. Test again from a source that does not meet the conditions and confirm that the request returns to the normal sign-in flow.
5. Send two consecutive requests from a client that does not store Cookies and confirm that each request is re-evaluated and logged as one-request access. Then use a browser to confirm that the probe becomes a persistent grant.
6. Change and save the rule, then confirm that the temporary grant held by an existing browser becomes invalid immediately.

If a source-IP or region rule behaves incorrectly, first inspect `Client IP` and `Connection source IP` in the log. If a rule cannot be saved, check its condition values, CIDR address family, RE2 regular expression, region data source, and gateway version.

- [Subdomain Routing](/en/guide/subdomain-proxy)
- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
- [Security Model and Baseline](/en/guide/security)
- [Request Logs](/en/guide/request-logs)
