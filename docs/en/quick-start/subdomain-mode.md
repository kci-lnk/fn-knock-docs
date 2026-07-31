---
lang: en-US
title: "Public IP Access with Subdomain Routing"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: dd0abe9f5bd285c3dca81d8f2b3b556d9c1b03cbd5f81fa3c9aa47cef889bf20
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Public IP Access with Subdomain Routing

Use this pattern when the device has a public IPv4 address, usable IPv6 connectivity, or an edge platform that can reach the origin. fn-knock routes each request by domain, sending visitors through a shared sign-in flow before forwarding them to the requested service.

- Network topology: direct public ingress
- Routing: dispatch services by `Host`
- Recommended policy: require sign-in
- Admin location: `System settings → Mode → Subdomain mode`

## Before you begin

You need:

- A domain whose DNS you can manage, such as `example.com`.
- A public endpoint that can reach the fn-knock gateway. The native fnOS FPK, Docker Compose, OpenWrt, Linux, Synology DSM 7 SPK, and Windows deployments default to `7999`. This guide refers to that value as the "actual gateway port."
- At least one working sign-in method: TOTP, password, Passkey, or a configured OIDC provider.
- Network connectivity from the fn-knock device to each upstream application.

If you do not have public ingress, use [NAT Traversal with Subdomain Routing](/en/quick-start/reverse-proxy-mode). To protect original TCP/UDP ports such as SSH or Remote Desktop, see [Direct Access on Original Ports](/en/quick-start/direct-mode).

## Deployment boundaries

| Deployment | Availability | Notes |
| --- | --- | --- |
| Native fnOS FPK | Full support | Supports automatic HTTPS, host firewall management, and Smart Connect |
| Docker Compose | Supports subdomain routing | Does not manage the host firewall; no Smart Connect or automatic HTTPS |
| OpenWrt package | Supports subdomain routing | fn-knock does not manage the host firewall or provide Smart Connect or automatic HTTPS; OpenWrt manages port access and split-horizon LAN DNS |
| Synology DSM 7 SPK | Supports subdomain routing | No Direct mode, host firewall management, or Smart Connect; manage the inbound path through the DSM firewall and router/NAT |
| Windows x86_64 | Can serve as a public gateway | `7999` listens on all interfaces by default; verify Windows Firewall profiles, router/NAT, IPv6 firewall rules, and ISP inbound policy yourself; no Direct mode authorization |

Inside Docker, `127.0.0.1` refers to the container itself. If an application runs on the host or another LAN device, enter an address that the container can reach.

## 1. Configure public ingress and DNS

Point the authentication and application domains to the public endpoint. For example:

| Domain | Purpose | DNS target |
| --- | --- | --- |
| `auth.example.com` | Shared sign-in | `192.0.2.10` |
| `nas.example.com` | NAS service | `192.0.2.10` |

You can also create a wildcard record for `*.example.com`.

Your router should forward the public port to the fn-knock gateway:

- Public `443` → actual gateway port: visitors normally do not need to include a port in the URL.
- Custom public port → actual gateway port: visitors must retain that public port in the URL.

The admin endpoint exists only to configure fn-knock and must not be used as the public origin. See [Ports, Endpoints, and URL Paths](/en/quick-start/ports-and-entrypoints) for deployment-specific ports.

## 2. Switch to Subdomain mode

Open `System settings → Mode`, select `Subdomain mode`, and save.

After saving, the sidebar should show `Domains`. If you were previously using a tunnel, switching modes stops the related tunnel processes; Path mode mappings may also be removed. Back up the current configuration before switching.

A Docker deployment does not modify the host firewall automatically. Open only the public ports you intend to expose.

## 3. Set the root domain

Open `Domains`, expand the `Subdomain mode` configuration, and enter:

- `Domain`: `example.com`
- `Public HTTPS port for the auth service`: the public port that visitors actually use. For example, enter `443` when public port `443` forwards to the actual gateway port
- `Edge real IP detection`: enable the matching provider only when using EdgeOne or Alibaba Cloud ESA

The root domain determines the full URL for each subdomain mapping. After changing it, confirm that the existing authentication service and application mappings still match.

## 4. Add the authentication service

Under `Domains`, click `Add auth service` and add `auth.example.com`. Once saved, it appears under `Subdomain mode → Current auth service`.

The authentication service must:

- Be the only active authentication endpoint.
- Allow public access, or visitors cannot reach the sign-in page.
- Not reuse a legacy mapping that still has a strict-allowlist rule. Record the original configuration and recreate the authentication service instead.
- Have working DNS and a public port that reaches the fn-knock gateway.

First open the authentication URL over cellular data and confirm that the sign-in page appears. Then continue with application mappings.

## 5. Add an application mapping

Open `Domains` and add a service. For example:

| Setting | Example |
| --- | --- |
| Subdomain | `nas` |
| Target | `http://192.168.1.20:5666` |
| Require sign-in | On |
| Host response | Preserve the visitor's Host by default; turn this off only when the upstream accepts only its own address / Host |

After saving, the application URL is `https://nas.example.com`, or the corresponding URL with the actual public port.

If the upstream uses HTTP Basic Auth, enable `Skip Basic Auth` in the mapping's advanced settings and enter the upstream credentials. These credentials apply only to requests from fn-knock to the upstream; they are not a visitor sign-in method.

`Host response` also applies to `Reverse proxy mode → Subdomain mapping`. Unless the upstream explicitly rejects the external Host, keep the default behavior of preserving it so the application does not generate incorrect callback URLs or redirects.

At runtime, `Host response` is keyed by the upstream Target. Multiple Hosts that reuse the same Target share this setting. Use distinct Targets when they require different response policies.

## 6. Configure the access policy

The current Host editor provides a `Require sign-in` switch:

| Setting | Behavior |
| --- | --- |
| Turn off `Require sign-in` on a current login-first mapping | Public access; no fn-knock sign-in or allowlist check |
| Turn on `Require sign-in` | A manual source authorization can grant access independently; automatic IP authorization normally lets the same source continue, but cannot override a service-scope denial already attached to the request; when no usable source authorization exists, fn-knock checks the session |
| Legacy strict-allowlist rule | May remain non-public even when `Require sign-in` is off; access depends exclusively on valid source authorization records created manually or after sign-in, and a session cookie cannot replace the source requirement |

Enable `Require sign-in` for most personal services. The current UI cannot select a strict-allowlist rule. If an upgraded configuration already contains one, review both manual and automatic IP authorization records. To leave the legacy strict rule, record the entire mapping and recreate it through the current UI; turning off `Require sign-in` alone is not enough to make it public. If the strict rule should accept only manually authorized sources, disable post-login automatic IP authorization and remove any stale automatic records.

## 7. Configure HTTPS

Configure a wildcard certificate for `*.example.com` and associate it with the relevant domains. A wildcard certificate normally does not cover the root domain `example.com`; if the root domain also serves traffic, add it to the certificate's SAN list.

The native fnOS FPK can use automatic HTTPS. With Docker or OpenWrt, provide your own certificate or terminate TLS at an upstream proxy or edge platform. See [TLS Certificates and HTTPS](/en/guide/ssl) for details.

## 8. Configure DDNS for a changing public address

Use [Dynamic DNS (DDNS)](/en/guide/ddns) to keep DNS current when your public address changes. Publish records only for address families that are actually reachable from the internet. Do not publish an AAAA record without working IPv6 ingress.

## 9. Verify from an external network

Turn off Wi-Fi on your phone, then test in this order:

1. Open the authentication URL and confirm that the sign-in page is reachable.
2. Open the application URL and confirm that the authentication flow starts when signed out.
3. Sign in and confirm that you return to the original application URL.
4. On the `Requests` page, confirm the matched domain, upstream address, and response status.

A successful LAN test does not replace an external test. NAT loopback, split-horizon DNS, and local caches can hide configuration errors on a home network.

## Troubleshooting

| Symptom | Check first |
| --- | --- |
| Domain times out | DNS, public address, port forwarding, and ISP inbound restrictions |
| Opening the domain shows the admin page | The public origin port is wrong; it must point to the gateway, not the admin endpoint |
| Redirect loop after sign-in | Authentication domain, root domain, cookie scope, public scheme, and the upstream proxy's `Host` / `X-Forwarded-*` values must agree; start a new request from the original application Host |
| 502 response | fn-knock cannot reach the upstream, or the upstream scheme or port is incorrect |
| A subdomain opens the wrong service | Host was not preserved, or the upstream proxy overwrote it |
| HTTPS certificate error | The certificate does not cover the subdomain or is not associated with the correct domain |

See the [Frequently Asked Questions](/en/faq) for the complete troubleshooting index.

## Related documentation

- [Choose a Deployment and Access Pattern](/en/quick-start/deployment-options)
- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
- [Subdomain Routing](/en/guide/subdomain-proxy)
- [TLS Certificates and HTTPS](/en/guide/ssl)
- [Request Logs](/en/guide/request-logs)
