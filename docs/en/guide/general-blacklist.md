---
lang: en-US
title: "Global Blocklist"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 9153c53cb0d8f61bce3b40352411e07f2a317d073c63a2bd428716a6f787e79c
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Global Blocklist

The General blacklist tells the gateway to reject public IPs that you know are untrusted. Use it for confirmed attack sources or persistent abusive traffic—not for a temporary application failure, a proxy address, or an uncertain geolocation result.

The blacklist accepts only exact IPv4 or IPv6 addresses; CIDRs are not supported. Entries do not expire automatically and continue to take part in gateway decisions until deleted.

## Confirm the Source Before Adding It

Prefer copying the real client IP from `Request Logs`, WAF logs, or a Host's `Active IPs`. Do not add:

- `127.0.0.1`, private-network or Docker ranges, or the reverse-proxy node itself;
- A shared egress address, CDN edge IP, or a VPN egress you have not verified;
- A source that appeared only once without supporting log context.

Blocking an upstream proxy by mistake can make every user lose access at once.

## Add Entries

Under `Sessions & Security → General blacklist`, select `Add IPs`:

1. Enter one IP per line, or separate addresses with spaces, commas, or semicolons.
2. The page deduplicates them and shows how many will be submitted.
3. Add an optional comment with the log time, Host, Trace ID, or reason for the action.
4. Confirm `Add to blacklist`.

If an IP already exists, adding it again updates the existing entry. The success message reports added and updated counts separately. If the input contains even one invalid address, the entire submission fails; correct every invalid address first.

The entry point records a source label:

| Source | Where it comes from |
| --- | --- |
| Manual | The add dialog under `Sessions & Security → General blacklist` |
| Request log | Blocking one or several IPs from `Request Logs` |
| Active IP | The Host `Active IPs` list |
| WAF log | Blocking one or several IPs from WAF logs |

Source labels and comments are for auditing. They do not imply priority or an automatic release condition.

## Review and Delete Entries

The list shows IP, location, source, comment, creation time, and update time. You can search by IP, source, or comment, browse pages, and delete entries individually or in a batch.

After deletion, the IP returns to the normal gateway flow, but its requests are not guaranteed to be allowed. The WAF, scanner blacklist, Gateway Visibility, authentication policy, SSH firewall, or upstream rules might still reject it.

Request Logs and WAF logs indicate whether an IP is currently in the General blacklist and let you block or release it directly. Refresh the relevant log list after the action and confirm that its state has changed.

## Relationship to Other Features

| Feature | Best suited for |
| --- | --- |
| General blacklist | A confirmed individual public IP that must be rejected immediately |
| Automated scan blocking | A separate blacklist maintained automatically from unusual-path hits |
| WAF | HTTP request content or rule matches |
| Gateway Visibility | Restricting allowed regions or CIDRs in advance |
| IP Allowlist | Explicitly allowing a fixed source |
| SSH hardening | Controlling sources and failed-sign-in blocks for the host's SSH port |

The General blacklist and scanner blacklist are two separate sets of records. Deleting an IP from the General blacklist does not clear a scanner block, and vice versa.

## Maintenance Recommendations

- Keep evidence and a specific reason with each entry instead of writing only “abnormal”;
- Set a review date for shared egress and ISP addresses to avoid blocking later users indefinitely;
- Before acting on CDN or reverse-proxy traffic, compare the client IP with the connection-source IP;
- Periodically review older entries by update time and source;
- If you block a proxy node by mistake, remove the entry through a trusted management path and check real-IP forwarding.

- [Request Logs](/en/guide/request-logs)
- [Web Application Firewall (WAF)](/en/guide/waf)
- [Automated Scan Blocking](/en/guide/scanner-interception)
- [Gateway Visibility](/en/guide/gateway-visibility)
