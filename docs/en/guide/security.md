---
lang: en-US
title: "Security Model and Baseline"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: d230c595c28eab13387328c443de0dfca85aedb802ec7a708f3063f57d1521b6
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Security Model and Baseline

Start security configuration by answering two questions: does every request pass through fn-knock, and does the gateway receive the real client IP? If either answer is no, authentication, allowlists, and region rules can behave differently from what you expect.

## Confirm the Boundary First

fn-knock can control only traffic that passes through the gateway entry point. Handle these cases outside the gateway:

- A router, cloud security group, or Docker publishes an application's original port;
- A CDN, reverse proxy, or tunnel connects directly to the application upstream;
- A preceding proxy incorrectly presents its own private address as the client IP;
- The admin panel, database, or SSH is exposed separately.

The gateway treats loopback, private, link-local, and CGNAT addresses as local sources and allows them during the authentication preflight. This check takes priority over sessions and IP authorization. Test a protected service through a mobile network or another genuine public path, not only over home Wi-Fi.

## Recommended Security Baseline

1. Expose only the ports required by the gateway. Keep the admin entry point on the LAN, behind a VPN, or behind a trusted reverse proxy.
2. Install a valid HTTPS certificate on the gateway and configure correct DNS for every public Host.
3. Create at least two recoverable sign-in credentials, then bind Passkeys to frequently used devices.
4. Enable `Require sign-in` by default for new services and make one public only when explicitly required.
5. Enable Request Logs and event notifications. Observe normal traffic before tightening the WAF, gateway throttling, scanner, or blacklist rules.
6. Regularly update the host, fn-knock, and upstream services, and export a protected backup before updating.

## What Each Layer Controls

| Layer | Problem it solves | Main entry point |
| --- | --- | --- |
| Gateway Visibility | Restricts which regions or CIDRs can reach the gateway | `System settings → Gateway` |
| Mapping access policy | Decides whether a Host is public or requires sign-in | `Subdomain mappings` |
| Subdomain advanced authentication | Issues a temporary grant for the current Host based on source or request characteristics | `Subdomain mappings → Advanced authentication` |
| Authentication and sessions | Controls identity, session lifetime, shared Cookies, and credential scopes | `Auth`, `Sessions & Security` |
| IP Allowlist | Authorizes a fixed IP/CIDR or an IP after sign-in | `IP Allowlist` |
| Login backoff | Delays repeated failed sign-in attempts from one source | `Sessions & Security → Login backoff` |
| Gateway throttling and crawler blocking | Limits high-frequency reverse-proxy traffic and rejects identified crawlers | `System settings → Gateway` |
| Automated scan blocking | Maintains a separate blacklist from uncommon-path hits | `System settings → Blocking` |
| General blacklist | Immediately rejects one confirmed source IP | `Sessions & Security → General blacklist` |
| WAF | Detects or blocks HTTP requests passing through the gateway | `System settings → WAF` |
| SSH firewall | Protects the host's SSH service by source and failed sign-ins | `SSH security`; only on deployments with host capabilities |
| Host or upstream firewall | Reduces exposure of original application and management ports | Host, router, or cloud security group |

These controls complement one another and are not interchangeable. A WAF does not close an exposed database port, and an allowlist does not fix a vulnerability in an upstream application. A subdomain advanced-authentication match grants access to the entire current Host, so do not treat it as a persistent path-level restriction.

## Real Client IP

Correct identification of requests from a CDN, reverse proxy, or tunnel depends on that upstream's real-IP headers. fn-knock processes common `X-Forwarded-For`, `X-Real-IP`, `EO-Connecting-IP`, and `Ali-Real-Client-IP` information in order.

The current settings page has no inbound trusted-proxy CIDR list. A preceding proxy must remove or overwrite real-IP headers that an external client could spoof. If it incorrectly forwards an address such as `127.0.0.1` or `192.168.x.x`, a public request can be mistaken for a local exemption. After adding EdgeOne, ESA, Cloudflare, or a self-hosted reverse proxy, test each path externally and compare `Client IP` with `Connection source IP` in Request Logs.

## Isolate the Management Plane

The admin panel can change authentication, certificates, proxies, blacklists, and terminal access, so it needs a stricter boundary than an ordinary application entry point:

1. Configure the `Admin panel` access scope separately under `Auth`.
2. Prefer limiting it to the LAN, a VPN, or a fixed trusted CIDR.
3. Do not share weak credentials with a public application.
4. On platforms that provide the terminal, account for the host privileges of the service process.
5. Keep a second administrator credential and a local-console recovery path.
6. Regularly review active sessions, IP drift records, and Login backoff.

Hiding the admin panel or changing its path is not access control. The entry point still needs authentication, network restrictions, and valid HTTPS.

## Restrict Upstream Ports

A reverse proxy forms a security boundary only when clients cannot bypass it:

- Prefer binding an upstream service to `127.0.0.1` or a container network reachable only by fn-knock;
- If it must listen on a LAN address, use the host firewall to allow only the gateway source;
- Review Docker `ports`, router port forwarding, cloud security groups, FRP, and CDN origin configuration;
- Stream mappings expose TCP/UDP traffic that does not pass through HTTP authentication or the WAF, so restrict them separately.

Scan the public address externally and confirm that original application ports are not exposed accidentally. Testing only from the same LAN cannot prove that the public boundary is correct.

## When Something Goes Wrong

1. First confirm in Request Logs whether the request reached the gateway.
2. Check whether the Host, path, upstream target, and route type match the intended configuration.
3. Confirm that the client IP is a real public address rather than a proxy address.
4. Review sessions, the IP Allowlist, Login backoff, Scanner blacklist, General blacklist, and WAF logs.
5. Compare the Event Center timeline for configuration changes, sign-ins, blocks, or updates.
6. If an original port might be exposed, inspect the router, cloud security group, container ports, and host firewall one by one.

To restore service, temporarily relax only the single policy layer causing the problem and record its original value. Once the cause is verified, restore the security setting. Avoid disabling authentication, the WAF, and blacklists at the same time, which removes the evidence needed to isolate the issue.

- [Gateway Visibility](/en/guide/gateway-visibility)
- [Forward Proxy Headers Upstream](/en/guide/gateway-proxy-headers)
- [IP Allowlist](/en/guide/whitelist)
- [Global Blocklist](/en/guide/general-blacklist)
- [Automated Scan Blocking](/en/guide/scanner-interception)
- [Web Application Firewall (WAF)](/en/guide/waf)
- [Request Logs](/en/guide/request-logs)
- [SSH Hardening](/en/guide/ssh-security)
