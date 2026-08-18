---
lang: en-US
title: "Automated Scan Blocking"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 5b99c573555da5f0849b7f5ce3e928cdba8186d75607de8662f63ecb8057031b
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Automated Scan Blocking

Automated scan blocking adds a source to a separate Scanner blacklist based on suspicious access behavior within a short period. It is useful for reducing repeated probing noise, but it is not a replacement for the WAF, General blacklist, or Login backoff.

Under `System settings → Blocking`, configure the enabled state, Statistics window, Trigger threshold, and Blacklist retention. The Statistics window has a minimum of 5 minutes, the Trigger threshold a minimum of 1 hit, and Blacklist retention a minimum of 1 day. Start with a more forgiving threshold and tighten it only after observing traffic for a while. Health checks, automation scripts, reverse-proxy probes, and retries from mobile networks can all produce seemingly frequent requests.

## Triggers and Records

The scanner counts uncommon-path hits identified by the gateway. When the threshold is reached, the source enters the separate Scanner blacklist; it is not automatically added to the administrator-managed General blacklist. `Sessions & Security → Scanner blacklist` provides:

- Total blocks, an hourly rate, and trends for the selected time range;
- IP, hit count, first and last hit times, and expiration time;
- Hit paths and the time between adjacent hits;
- Search, pagination, and individual or batch deletion.

Deleting a Scanner blacklist record immediately removes this layer's block, but the source is added again if it continues to meet the trigger condition. To reject a confirmed attack source for the long term, use the General blacklist and record the reason.

## Exemptions

You can exempt known regions or CIDRs. Region selections are resolved to final CIDRs when saved. Enter one custom CIDR per line; IPv4 and IPv6 are supported, and the page prevents saving when any entry has an invalid format. Region conditions can also filter CIDRs by China Telecom, China Unicom, or China Mobile when the connected CIDR database provides carrier data.

`Common location exemption` uses common locations learned from recent successful sign-ins. `Region allowlist exemptions` and `CIDR allowlist exemptions` are fixed by an administrator. A source that matches any exemption is neither blocked by the Scanner blacklist nor counted toward uncommon-path hits. Exemptions reduce false positives, but also reduce scan protection for those sources. Add only office networks, VPNs, or service-provider ranges that you can verify.

## Relationship to Other Rules

| Mechanism | What it handles |
| --- | --- |
| Automated scan blocking | Repeated or suspicious scanning behavior |
| General blacklist | An individual source confirmed by an administrator |
| WAF | HTTP request content and rule matches |
| Login backoff | Failed sign-in verification |

## Troubleshoot a False Positive

1. Open the IP details in Scanner blacklist and review the triggering paths and time intervals.
2. In Request Logs, compare the client IP, Host, and route type at the same time.
3. Confirm that a preceding CDN or reverse proxy did not cause many users to share one misidentified source IP.
4. Fix an incorrect health check or probe path. Add an exact CIDR only after confirming that the source is trusted and stable.
5. Delete the blacklist record, test again, and watch whether it triggers another block.

Do not use a broad region exemption to hide a real client-IP or health-check configuration problem.

- [Request Logs](/en/guide/request-logs)
- [Global Blocklist](/en/guide/general-blacklist)
- [Web Application Firewall (WAF)](/en/guide/waf)
