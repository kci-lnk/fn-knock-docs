---
lang: en-US
title: "NAT Traversal with Subdomain Routing"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 989de42249c3a4f69bda7bfd0bae96d4cf7447b2fc62bde261cc6ae102db2f90
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

The native fnOS FPK, Docker, OpenWrt, Linux, macOS, and Synology DSM 7 SPK deployments can all use in-app tunnels. Windows x86_64 does not include FRP or Cloudflared. If you run your own tunnel client on the same Windows host, use local `127.0.0.1:7999` as the origin; fn-knock does not manage that client's installation or lifecycle. Inside Docker, `127.0.0.1` refers to the current container. If the upstream runs on the host or another LAN device, enter an address reachable from the container.

## Request path

An external request passes through:

1. The public endpoint for `auth.example.com` or `nas.example.com`.
2. The FRP or Cloudflared tunnel.
3. The actual fn-knock gateway port. The native fnOS FPK, Docker Compose, OpenWrt, Linux, macOS, Synology DSM 7 SPK, and Windows default to `7999`. A self-managed Windows tunnel should normally use the same host's loopback address as its origin.
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

Open `Domains`, expand the `Subdomain mode` configuration, enter `example.com` under `Domain`, and save. Then click `Add auth service` and add `auth.example.com`. With managed Cloudflare Tunnel, visitors use standard HTTPS port `443`; the public-port field is hidden and generated authentication URLs do not include `:7999`.

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

1. Prepare the executable under `System settings → Cloudflared`.
2. Open `Tunnels → Cloudflared` and connect the recommended Cloudflare Account API Token with Tunnel, Zone Read, and DNS Edit access.
3. Select the recommended dedicated Tunnel, then choose `Preview` to review the Tunnel, `*.example.com` Ingress, and proxied CNAME.
4. Apply the plan after resolving conflicts. fn-knock retrieves the Tunnel Token and starts Cloudflared.

After apply, `auth.example.com`, `nas.example.com`, and other known Hosts enter the gateway through the wildcard Tunnel. You do not add a Public Hostname for each one in Cloudflare Zero Trust. Visitors use `https://nas.example.com` without `:7999`.

Advanced users may use a manual Tunnel Token. Only manual or externally managed Cloudflared requires configuring a Public Hostname and actual origin port yourself. See [Cloudflare Tunnel with cloudflared](/en/guide/cloudflared-tunnel).

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
| Tunnel is connected, but the domain times out | Cloudflare reconcile conflicts, wildcard DNS, Ingress, the FRP endpoint, and the local Host mapping |
| Every subdomain opens the same service | The tunnel or edge proxy is not preserving Host |
| 502 response | The tunnel cannot reach the gateway, or the gateway cannot reach the upstream application |
| Redirect loops or includes `:7999` | Confirm managed Cloudflared subdomain mapping, use standard public HTTPS, and start again from the original application Host |
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
