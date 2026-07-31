---
lang: en-US
title: "Choose a Runtime Mode"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 2b8bea7d45df0da88d83727dc6ffc8fa6c15b5fb018fbf5611712fde669ef536
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Choose a Runtime Mode

`System settings → Mode` combines network topology and routing into several runtime options. Before configuring it, answer three questions independently: how traffic reaches the device, how the gateway locates a service, and who may access that service.

Host routing is the default for web services. Reserve Path mode for existing path-based endpoints or applications that cannot be migrated; it is not recommended for new deployments.

The in-app tunnel steps on this page apply only to deployments whose admin interface actually provides FRP or Cloudflared. On Windows, `7999` listens on all interfaces by default and can serve as the origin for direct public access or a self-managed tunnel. Windows does not include FRP, Cloudflared, Direct mode authorization, or dynamic host firewall management. External reachability still depends on the active Windows Firewall profile, router or NAT, IPv6 firewall, and ISP policy. See [Deploy on Windows (x86_64)](/en/quick-start/windows-deployment).

## 1. Choose a network topology

| Situation | Admin option | External traffic path |
| --- | --- | --- |
| The device has reachable public IPv4 or IPv6 | `Subdomain mode` | The domain points directly to the gateway |
| The device has no public inbound endpoint | `Reverse proxy mode` | FRP or Cloudflared carries requests to the gateway |
| Users must access original ports after signing in | `Direct mode (not recommended)` | Users sign in through the gateway, then the firewall allows their source IP |

Whether you have a public IP determines the ingress topology; it does not force web services to use path routing. Reverse proxy mode also supports Subdomain mapping.

## 2. Choose a routing method

### Host routing: the default for web services

In `Subdomain mode` with direct public ingress, or in `Reverse proxy mode → Subdomain mapping`, requests are dispatched by `Host`:

```text
auth.example.com  -> authentication service
nas.example.com   -> http://127.0.0.1:5666
alist.example.com -> http://127.0.0.1:5244
```

Each service keeps its root URL, which makes static assets, WebSockets, and callback URLs more likely to work without special handling. Both topologies share the same `Subdomain mapping` configuration, but their capabilities differ:

- Subdomain mode with direct public ingress can integrate with the host firewall, Smart Connect, and TCP/UDP stream proxying.
- Subdomain mapping in Reverse proxy mode can use FRP or Cloudflared, but does not provide Smart Connect or TCP/UDP stream proxying.

See [Public IP Access with Subdomain Routing](/en/quick-start/subdomain-mode) for setup.

### Path routing: a compatibility option

`Reverse proxy mode → Path mode` dispatches services by URL prefix under a single Host:

```text
https://example.com/alist -> http://127.0.0.1:5244
https://example.com/fnos  -> http://127.0.0.1:5666
```

Some applications require prefix stripping, HTML rewriting, or root-path compatibility and may still break because of absolute paths, Service Workers, or callback URLs. Existing path-based deployments can remain in place, but new services should use Host routing. See [NAT Traversal with Subdomain Routing](/en/quick-start/reverse-proxy-mode) for setup.

### TCP/UDP streams and original ports

- `Streams` listens on additional TCP/UDP ports for non-HTTP services such as SSH, databases, and DNS. It is available only in Subdomain mode with direct public ingress. See [TCP/UDP Stream Proxying](/en/guide/stream-mappings).
- `Direct mode` does not proxy a service. After sign-in, it adds the current source IP to the allowlist so the user can connect to original ports such as `5666` or `22`. See [Direct Access on Original Ports](/en/quick-start/direct-mode).

## 3. Choose an access policy

The current Host editor provides a `Require sign-in` switch. Off means public access; on means login-first behavior:

| Setting | Result for an internet request | Best suited for |
| --- | --- | --- |
| Turn off `Require sign-in` on a current login-first mapping | Proxy directly to the upstream | A service intentionally published without fn-knock authentication |
| Turn on `Require sign-in` | If there is no valid source-IP authorization or session, redirect to `auth.example.com`, then return to the original Host after sign-in | Most private web services |

The backend still recognizes `strict_whitelist` in legacy configurations. Such a rule may remain non-public even after `Require sign-in` is turned off, because access is decided by valid source authorization records created manually or after sign-in. A browser session cookie cannot replace the source requirement. The current UI has no control for creating or switching to a strict-allowlist rule. To leave one, record the complete mapping and recreate it through the current UI. On new mappings, a manual source authorization can grant access independently. Automatic IP authorization normally lets the same source continue, but it cannot override a denial carried by a service scope. `IP Allowlist` is not a strict source-restriction switch. To narrow ingress before a request reaches a mapping, use [Gateway Visibility](/en/guide/gateway-visibility) or an external network-layer rule.

Sign-in credentials can also restrict the permitted service scope. A Host outside that scope is denied even when the browser already has a valid session.

`Skip Basic Auth` is not an fn-knock access policy. It injects a username and password into requests sent upstream so they can pass the target service's own Basic Auth. Visitors cannot use it to sign in to `fn-knock`.

### Local-source exemption

When the gateway identifies a loopback, private, or link-local source, authentication returns `local_exempt`; both normal sign-in and strict-allowlist checks allow the request. This behavior treats the LAN as part of the trust boundary:

- Do not use a LAN test to decide whether internet-facing authentication is working.
- Tunnels and edge proxies must pass the real client IP correctly. Otherwise, all visitors may appear to come from one proxy address or may even be classified as local.
- Verify sign-in, allowlist behavior, and post-sign-out access over a mobile network.

## Recommended combinations

| Scenario | Network topology | Routing | Access policy |
| --- | --- | --- | --- |
| Web services with a public IP and domain | `Subdomain mode` | Host | Enable `Require sign-in`; add Gateway Visibility if ingress must be narrowed |
| No public IP, using Cloudflared | `Reverse proxy mode → Subdomain mapping` | Host | Enable `Require sign-in` |
| No public IP, using FRP | `Reverse proxy mode → Subdomain mapping` | Host | Enable `Require sign-in`; confirm that PROXY Protocol preserves the source IP |
| Legacy path-based deployment being migrated | `Reverse proxy mode → Path mode` | Path | Decide whether to require sign-in on each mapping |
| Many original ports must remain accessible | `Direct mode (not recommended)` | Original ports | Allow the source IP after sign-in |

## What a mode switch preserves or stops

- After switching from Path mode to either form of subdomain routing, path mappings are hidden. When entering Subdomain mode with direct public ingress, the UI asks whether to remove path rules.
- Both Subdomain mapping and Path mode under Reverse proxy mode can use FRP or Cloudflared. When leaving Reverse proxy mode, the system attempts to stop any running tunnels.
- After leaving Subdomain mode with direct public ingress, TCP/UDP stream proxying is disabled and its listeners stop, but saved rules are preserved. Re-enter the mode and enable the feature to restore them.
- Direct mode depends on the host firewall. It is unavailable on Docker, Synology DSM 7 SPK, Windows, and any deployment without host-management capability.
- Docker does not write host firewall rules and does not support Smart Connect. OpenWrt likewise provides no fn-knock host-firewall management, Direct mode, or Smart Connect, and it also lacks SSH security, the web terminal, and in-app FPK updates. OpenWrt itself must manage port access and split-horizon LAN DNS.
- Windows does not support Direct mode authorization, in-app host firewall management, Smart Connect, built-in FRP / Cloudflared, the web terminal, or SSH security. The web update page also cannot install Windows updates.
- The Synology DSM 7 SPK includes FRP and Cloudflared, but does not support Direct mode authorization, host firewall management, Smart Connect, the web terminal, SSH security, or updates from the web UI.

After switching modes, test from a real external network and verify the endpoint, Host, client IP, authorization type, and upstream target. Simply confirming that a page opens is not enough.
