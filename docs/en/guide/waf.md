---
lang: en-US
title: "Web Application Firewall (WAF)"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: b43b61bc0baa2b46b8131002c14c44fa63f3a2062223f824302a6a33e519157f
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Web Application Firewall (WAF)

WAF inspects HTTP requests that pass through fn-knock and logs or blocks suspicious content according to the enabled rules. It supplements gateway authentication and application security, but cannot protect ports that bypass the gateway, TCP/UDP traffic, or host services.

fn-knock uses Coraza to load system and custom rules. The global switch, protection level, rule status, and rule updates all synchronize to the Go gateway.

## Checks Before Enabling WAF

1. Confirm that the [real client IP](/en/guide/gateway-proxy-headers) is correct. Behind a CDN or upstream reverse proxy, if the gateway always sees the proxy node's address, WAF logs, blocklists, and source evaluation will also use the wrong address.
2. Confirm that the target application is reachable only through fn-knock. WAF does not inspect requests that bypass the gateway and connect directly to an upstream port.
3. Keep an admin access method that does not depend on the application entry point so that you can adjust rules after a false positive.
4. Record the normal request patterns of health checks, webhooks, upload endpoints, and application APIs, then watch those paths closely after enabling WAF.

## Global Settings

Configure the following under `System settings → WAF`:

| Setting | Default or range | How it takes effect |
| --- | --- | --- |
| `Enable WAF` | Disabled by default | When enabled, system rules are checked and synchronized first, then loaded into the gateway at the current level; when disabled, WAF checks stop immediately |
| `Automatic rule updates` | Enabled by default | The backend maintains system rules automatically and retries failed updates in later cycles |
| `Common-location exemption` | Disabled by default | Requests from recently used sign-in regions skip WAF checks |
| `Protection level` | Levels 1–4; Level 1 by default | Changes are reapplied to the gateway immediately |

The protection levels are:

- `Level 1 — Daily protection`: Recommended for everyday use.
- `Level 2 — Enhanced protection`: More sensitive matching; watch application APIs closely.
- `Level 3 — Strict protection`: Further increases the chance of false positives.
- `Level 4 — Maximum protection`: Intended mainly for short-term troubleshooting; do not leave it enabled long-term without validation.

A higher level is not a substitute for fixing vulnerabilities. It enables stricter detection and is also more likely to classify legitimate requests as suspicious.

### Boundaries of the Common-Location Exemption

Common locations are derived from recent sign-in locations. Once the exemption is enabled, requests matching those regions bypass WAF entirely rather than merely receiving a lower rule score. Mobile networks, VPNs, corporate egress points, and inaccuracies in the IP database can all broaden the exempted range. Restrict upstream ports and retain authentication, blocklists, and request logs as additional controls.

Scanner blocking has its own independent common-location exemption. Changing the WAF switch does not alter scanner settings.

## System Rules

The System rules section shows the remote manifest time, local synchronization time, and whether an update is available. It supports:

- Updating rules manually.
- Enabling, disabling, viewing, and downloading individual rules.
- Enabling or disabling selected rules in bulk.
- Enabling all or disabling all rules.
- Restoring `Recommended only`.

Enabling the global WAF first attempts to update system rules and skips rule files that the project has identified as frequent sources of false positives. Manually enabling every rule can reintroduce many false positives, so test it in an environment with a known recovery path.

`Recommended only` restores system rules to the enabled state recommended by the current version. It does not modify custom rules or enable the global WAF automatically. If WAF is enabled, rule changes load directly into the gateway. If WAF is disabled, the configuration is retained and applied the next time it is enabled.

## Custom Rules

The Custom rules section accepts one or more `.conf` files per upload and lets you enable, disable, preview, download, or delete each file. Uploading, changing status, or deleting a rule reloads gateway rules immediately while WAF is enabled.

Administrators are responsible for maintaining custom rules:

1. Before upload, check rule syntax, phases, actions, and rule IDs to avoid conflicts with existing rules.
2. Observe the rule in logging or detection mode before enabling a blocking action.
3. Keep the original `.conf` file and a change history. Backup and restore does not replace independent version control for rules.
4. After a custom rule is deleted, the gateway no longer loads that file. Download a copy first if it must be archived.

## Skip WAF for One Host

WAF is enabled by default in the advanced settings of application Hosts under subdomain mapping. To isolate a false positive or compatibility problem, you can disable WAF for one Host. That Host then skips the global WAF while other Hosts remain protected.

The per-Host switch is not an independent WAF instance: it provides no protection while the global WAF is disabled. After troubleshooting, adjust the rules based on logs and restore protection for the Host instead of treating disabled WAF as a permanent compatibility workaround.

## View WAF Logs

The `WAF logs` page reads persisted events by date. Historical events remain available even when WAF is currently disabled. The page supports:

- Selecting a date that contains logs.
- Searching by Trace ID, Host, path, or IP.
- Viewing one request path by Trace ID.
- Showing 20, 50, 100, or 200 rows per page with cursor-based pagination.
- Selecting one or more source IPs to add to or release from the general blacklist.
- Deleting all WAF events for the selected date.

Logs for a deleted date cannot be restored from the admin UI. Export or copy the details first when audit evidence must be retained.

### Log Detail Fields

Details include the time, Trace ID, transaction ID, action, mode, HTTP status code, client IP, remote address, IP location, request method, scheme, Host, path, query, full request URI, User-Agent, Referer, route type, route key, upstream target, rule bundle, rule IDs, rule file and line number, interruption details, and error.

Actions normally fall into three categories:

- `Logged`: A rule matched and created an event without interrupting the request.
- `Blocked`: A rule interrupted the request and recorded the rule ID, action, and response status.
- `Passed`: The event entered the WAF flow and continued through it.

One event may match multiple rules. The list shows the primary rule, while the details retain the others. Do not troubleshoot based only on the first rule name.

## Troubleshoot False Positives

1. In [Request Logs](/en/guide/request-logs), confirm that the request reached the gateway and record its time, Host, path, client IP, and Trace ID.
2. Search WAF logs for the Trace ID. If there is no result, search by Host, path, or IP.
3. Inspect the action, mode, blocking status, primary rule, and rule-file location.
4. Preview the corresponding rule file and determine whether it is a system rule or custom rule.
5. Prefer temporarily disabling one rule or lowering the protection level, then reproduce the request. Avoid disabling the global WAF outright.
6. Confirm that the legitimate request works again while the suspicious sample is still logged or blocked, then make the adjustment permanent.

If WAF logs contain no event, also check whether gateway throttling, the general blacklist, visibility, scanner blocking, or authentication handled the request first, and whether WAF is disabled for the target Host.

## What WAF Does Not Protect

- Original ports that do not pass through fn-knock.
- DNS, routers, cloud security groups, or an incorrectly configured CDN origin.
- Application authorization design, data backups, or vulnerability remediation.
- Non-HTTP protocol-mapping traffic.

- [Request Logs](/en/guide/request-logs)
- [Global Blocklist](/en/guide/general-blacklist)
- [Automated Scan Blocking](/en/guide/scanner-interception)
- [Security Boundaries and Baseline](/en/guide/security)
