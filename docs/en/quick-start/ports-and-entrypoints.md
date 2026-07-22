---
lang: en-US
title: "Ports, Endpoints, and URL Paths"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 62d4a248faf3d6200904bb8cd5c66697a59019152d19d17f704f6b37a8b23331
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Ports, Endpoints, and URL Paths

`fn-knock` exposes two user-facing endpoints: the admin endpoint for configuration and the gateway endpoint for application traffic. The native fnOS FPK opens the admin interface from its desktop icon. Docker, OpenWrt, and Linux use `7991` for the admin panel by default. The Synology DSM 7 SPK can be administered only through its package entry on the DSM desktop. On Windows, the `fn-knock Windows Manager` opens local `127.0.0.1:7991` in the system browser; it is not a LAN or public admin endpoint. The gateway normally uses `7999`.

Ports `7998`, `7997`, and `7996` are internal component ports and must not be exposed directly to the internet.

## Default ports

| Port | Role | Default use |
| --- | --- | --- |
| `7991` | Admin panel | Default admin endpoint for Docker, OpenWrt, and Linux; loopback-only access on Windows |
| `7998` | Admin backend | Target of the native fnOS FPK's desktop CGI proxy; also used internally by Docker |
| `7997` | Authentication service | Handles sign-in, sign-out, Passkeys, and bot challenges |
| `7996` | Gateway management port | Internal communication between the admin backend and Go gateway |
| `7999` | Gateway endpoint | Accepts web application traffic and applies authentication and routing |

Ports can be changed during installation. When troubleshooting, use the deployed configuration and the endpoint shown in the admin interface rather than assuming that every installation uses the defaults.

## Externally reachable ports by deployment

| Deployment | Admin endpoint | Gateway endpoint | Notes |
| --- | --- | --- | --- |
| Native fnOS FPK | fnOS desktop icon | `7999` | The desktop CGI proxies to local `7998`; do not treat `7991` as the FPK admin endpoint |
| Docker Compose | `7991` | `7999` | Only these two ports are published by default |
| OpenWrt | `7991` | `7999` | Uses `17998` for the internal admin backend by default |
| Linux (systemd / OpenRC) | `7991` | `7999` | Installation and `sudo knock config` can change the ports; `7998`, `7997`, and `7996` listen on localhost only |
| Synology DSM 7 SPK | Package entry on the DSM desktop | `7999` | Does not expose `7991`; DSM CGI proxies to the internal admin service, while `7998`, `7997`, and `7996` listen on localhost only |
| Windows x86_64 | Manager opens `127.0.0.1:7991` | `7999`, listening on `0.0.0.0` and `::` by default | Admin access is forced to the local machine; the installer adds static application rules only for the Domain and Private Windows Firewall profiles |

The Docker container ports and the ports published on the host are both defined by the deployment files. See [Deploy with Docker Compose](/en/quick-start/docker-deployment) for the complete configuration.

## What happens after a request reaches the gateway

The gateway endpoint only gets traffic into fn-knock. The gateway must still determine routing and access policy:

1. **Network topology**: Traffic reaches the gateway directly from the internet or LAN, or arrives through a tunnel such as FRP or Cloudflared.
2. **Routing**: Web services should normally be dispatched by the request `Host`, such as `nas.example.com`. Path mappings are reserved for compatibility with legacy endpoints such as `/alist`.
3. **Access policy**: The current Host editor uses `Require sign-in` to switch between public access and login-first behavior. Legacy strict-allowlist rules continue to enforce source-IP authorization.

TCP/UDP stream mappings listen on their own public ports and do not pass through the HTTP Host routing on `7999`. Direct mode instead uses the gateway as the login endpoint and opens original service ports for the authorized source IP after sign-in.

## `local_exempt`: A LAN test does not prove internet-facing protection

The authentication service classifies loopback, private, and link-local sources identified by the gateway as `local_exempt`. These requests are treated as local-network traffic and bypass normal sign-in and allowlist checks. A strict allowlist does not block them as internet-originated traffic either.

As a result:

- Opening a service from the same LAN cannot validate the public sign-in policy.
- When traffic enters through a reverse proxy or tunnel, use the request logs to confirm that the gateway sees the real public client IP rather than the proxy node's private address.
- Validate internet-facing access over a real external connection such as cellular data.

`local_exempt` is a source-network exception, not a browser session. Signing out does not change the local exemption for that network.

## Platform capability boundaries

- Docker supports Host and path routing through the gateway, but it does not write host firewall rules and does not support Direct mode or Smart Connect.
- The native fnOS FPK can manage the host firewall and provides Direct mode and Smart Connect.
- With root privileges, OpenWrt supports host firewall integration, Direct mode, and Smart Connect. Smart Connect requires an installed `dnsmasq` and a main configuration that includes `/etc/dnsmasq.d/`; the UI's `apt-get` installer does not apply to OpenWrt. OpenWrt does not provide SSH security, a web terminal, or in-app FPK updates.
- The Synology DSM 7 SPK registers `7999` as a public gateway port in the DSM firewall UI, but the package cannot modify the host firewall itself. It does not support Direct mode, Smart Connect, the web terminal, or SSH security.
- On Windows, `7999` listens on all interfaces by default. The installer's static `FnKnock Gateway` application rule applies only to the Domain and Private Windows Firewall profiles. Windows still does not support Direct mode, in-app host firewall management, Smart Connect, built-in tunnels, the web terminal, or SSH security. Before enabling public access, check the router or NAT, IPv6 firewall, ISP policy, and third-party security software.

With Host or path routing, `fn-knock` protects only requests that actually pass through the gateway. If an upstream service still listens on an address reachable from the internet or LAN, users may bypass the gateway and connect to it directly. Direct mode is the exception: on a supported host firewall, it temporarily opens original ports only for a source IP authorized after sign-in. Do not add a separate broad public allow rule.

## Trace the request path when troubleshooting

If the native fnOS FPK admin page does not open, first check the desktop icon, app process, and `7998` backend. For Docker or OpenWrt, check `7991`, the bind address, and published ports. If an application domain does not open, check the following in order:

1. Whether external traffic reaches the actual gateway port (`7999` by default).
2. Whether the request `Host` or compatibility path matches a mapping.
3. Whether the mapped target is reachable from the environment where `fn-knock` runs.
4. Whether the client IP, authorization type, and upstream target in the request logs are correct.

See [Path-based Reverse Proxy (Compatibility Mode)](/en/guide/reverse-proxy) for path compatibility rules and [Choose a Runtime Mode](/en/quick-start/run-modes) for the overall decision guide.
