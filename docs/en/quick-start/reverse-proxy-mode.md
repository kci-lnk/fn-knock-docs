---
lang: en-US
title: "NAT Traversal with Subdomain Routing"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: a67540d8598cd97e2f29fabe40e516d0b7ad5d101e02474b68ea286804ca52ba
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# NAT Traversal with Subdomain Routing

Use this pattern when your network has no inbound public connectivity, port forwarding is unavailable, or you want FRP or Cloudflared to provide the public endpoint. Internet traffic travels through the tunnel to the fn-knock gateway, which forwards each request to an application according to its domain.

- Network topology: outbound tunnel
- Routing: dispatch services by `Host`
- Recommended policy: require sign-in
- Admin location: `System settings → Mode → Reverse proxy mode → Subdomain mapping`

Subdomain mapping is the default routing option for a tunneled deployment. Use `Path mode` only for legacy configurations or applications that must run under a URL prefix.

## Before you begin

You need:

- A domain whose DNS you can manage, such as `example.com`.
- An FRP server or a working Cloudflare Tunnel.
- At least one working sign-in method.
- Network connectivity from the fn-knock device to each upstream application.

The native fnOS FPK, Docker, OpenWrt, Linux, and Synology DSM 7 SPK deployments can all use in-app tunnels. Windows x86_64 does not include FRP or Cloudflared. If you run your own tunnel client on the same Windows host, use local `127.0.0.1:7999` as the origin; fn-knock does not manage that client's installation or lifecycle. Inside Docker, `127.0.0.1` refers to the current container. If the upstream runs on the host or another LAN device, enter an address reachable from the container.

## Request path

An external request passes through:

1. The public endpoint for `auth.example.com` or `nas.example.com`.
2. The FRP or Cloudflared tunnel.
3. The actual fn-knock gateway port. The native fnOS FPK, Docker Compose, OpenWrt, Linux, Synology DSM 7 SPK, and Windows default to `7999`. A self-managed Windows tunnel should normally use the same host's loopback address as its origin.
4. The authentication service or matching upstream application.

The tunnel must preserve the original `Host` when forwarding to fn-knock. Every domain points to the same local gateway, and fn-knock performs the remaining routing.

## 1. Select Reverse proxy mode and Subdomain mapping

Open `System settings → Mode`:

1. Select `Reverse proxy mode`.
2. Select `Subdomain mapping` as the routing method.
3. Save the configuration.

After saving, the sidebar should show `Domains` and the tunnel-related entries.

When switching from another mode, review existing routes, certificates, and the public authentication URL. A Path mode mapping cannot be reused directly as a subdomain mapping.

## 2. Set the root domain and authentication service

Open `Domains`, expand the `Subdomain mode` configuration, enter `example.com` under `Domain`, and save. Set `Public HTTPS port for the auth service` to the public port that visitors actually use. Then click `Add auth service` and add `auth.example.com`.

The authentication service must:

- Allow public access.
- Not reuse a legacy mapping that still has a strict-allowlist rule. Record the original configuration and recreate the authentication service instead.
- Be the only active authentication endpoint.
- Reach the local fn-knock gateway through the tunnel.

Confirm that the authentication URL opens from an external network before configuring application mappings.

## 3. Add an application mapping

Open `Domains` and add an application. For example:

| Setting | Example |
| --- | --- |
| Subdomain | `nas` |
| Target | `http://192.168.1.20:5666` |
| Require sign-in | On |

After saving, the public URL is `https://nas.example.com`.

If the upstream requires HTTP Basic Auth, enable `Skip Basic Auth` in the mapping's advanced settings and enter the upstream credentials. fn-knock uses these credentials when connecting upstream; they do not replace visitor sign-in.

## 4. Configure the access policy

The current Host editor provides a `Require sign-in` switch:

| Setting | Behavior |
| --- | --- |
| Turn off `Require sign-in` on a current login-first mapping | Public access; no fn-knock session or allowlist check |
| Turn on `Require sign-in` | If no valid source authorization exists, continue by evaluating the session and credential scope |
| Legacy strict-allowlist rule | May remain non-public even when `Require sign-in` is off; access depends exclusively on valid source authorization records created manually or after sign-in, and a session cookie cannot replace the source requirement |

Enable `Require sign-in` for most tunneled services. The current UI cannot select a strict-allowlist policy. To leave a legacy strict rule, recreate the mapping through the current UI; turning off `Require sign-in` alone is not enough to make it public. Do not add the egress IP of Cloudflare, FRP, or another proxy node to the allowlist as though it were a visitor's fixed IP, or every request may appear to come from the same authorized source.

## 5. Configure the tunnel

Prepare the FRP or Cloudflared resources under `System settings`, then create and start the tunnel from the tunnel page.

### Cloudflared

In Cloudflare Zero Trust, configure a Public Hostname for each endpoint:

| Public domain | Local service |
| --- | --- |
| `auth.example.com` | `http://127.0.0.1:<actual-gateway-port>` |
| `nas.example.com` | `http://127.0.0.1:<actual-gateway-port>` |

When fn-knock manages Cloudflared in the same runtime environment as the gateway, use `127.0.0.1` and the actual gateway port. Use the fn-knock container service name and port only when Cloudflared runs in a separate container on the same Docker network. If the containers are on different networks, use an address reachable from Cloudflared.

Cloudflare can terminate public TLS. If the local origin uses HTTPS, its certificate must cover the origin address and be trusted by Cloudflared. Otherwise, use HTTP to the origin over a controlled private network.

### FRP

The FRP server must forward external HTTP or HTTPS traffic to the actual fn-knock gateway port while preserving the original Host. The authentication and application domains can share one gateway endpoint.

The FRP server deployment determines the public ports, certificates, and DNS. Never expose the fn-knock admin endpoint as an FRP application origin.

## 6. Check HTTPS and the public authentication URL

When an edge platform terminates TLS, the browser-facing URL should use HTTPS and the fn-knock authentication redirect must match it. If the public scheme differs from the local origin scheme, do not put the local HTTP URL in the visitor-facing authentication address.

When FRP provides HTTPS directly, configure a certificate that covers every subdomain on the FRP server or fn-knock gateway. See [TLS Certificates and HTTPS](/en/guide/ssl).

## 7. Verify from an external network

Test in the following order over cellular data:

1. Open `auth.example.com` and confirm that the sign-in page is reachable.
2. Open `nas.example.com` and confirm that the authentication flow starts.
3. Sign in and confirm that you return to the application.
4. Check the tunnel status and fn-knock `Requests` page. Confirm that the request matched the correct Host and upstream.

## Path Mode Is for Legacy Compatibility Only {#path-mode-is-for-legacy-compatibility-only}

`Reverse proxy mode → Path mode` is marked as not recommended in the current UI. Use it only when:

- Existing path mappings must remain in place and cannot yet be migrated.
- Only one public domain is available.
- The upstream application explicitly supports deployment under a URL prefix.

For example, you might proxy `https://example.com/nas/` to a NAS application. The upstream must handle the path prefix, redirects, cookies, and WebSockets correctly. Otherwise, assets may return 404, sign-in may loop, or the application may redirect to the site root.

New configurations should give each service its own subdomain. See [Path-based Reverse Proxy (Compatibility Mode)](/en/guide/reverse-proxy) for migration guidance.

## Troubleshooting

| Symptom | Check first |
| --- | --- |
| Tunnel is connected, but the domain times out | Public Hostname, FRP endpoint, DNS, and tunnel target port |
| Every subdomain opens the same service | The tunnel or edge proxy is not preserving Host |
| 502 response | The tunnel cannot reach the gateway, or the gateway cannot reach the upstream application |
| Redirect loop after sign-in | Public scheme, authentication domain, root domain, cookie scope, and the edge proxy's `Host` / `X-Forwarded-*` values do not agree; start a new request from the original application Host |
| Cloudflared reports a TLS error | The origin scheme or certificate trust configuration is incorrect |
| Assets return 404 in Path mode | The upstream does not support a URL prefix; migrate to Subdomain mapping |

See the [Frequently Asked Questions](/en/faq) for the complete troubleshooting index.

## Related documentation

- [Choose a Deployment and Access Pattern](/en/quick-start/deployment-options)
- [Subdomain Routing](/en/guide/subdomain-proxy)
- [Service Discovery and Bulk Onboarding](/en/guide/service-discovery)
- [Path-based Reverse Proxy (Compatibility Mode)](/en/guide/reverse-proxy)
- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
- [Request Logs](/en/guide/request-logs)
