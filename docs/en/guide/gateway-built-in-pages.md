---
lang: en-US
title: "Built-in Gateway Pages"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 07606bfb495e3303c156e253b716d10e509cc9d83bd9a4d6484697883b122fbd
---

# Built-in Gateway Pages

The Go gateway handles a set of reserved paths before deciding whether to forward a request to a Host or path-mapping upstream. These pages need no mapping of their own: append a built-in path to any subdomain whose request actually reaches the gateway.

For example, the gateway itself, rather than the upstream applications for `nas.example.com` or `auth.example.com`, responds to these addresses:

```text
https://nas.example.com/__select__
https://auth.example.com/__wol__
```

“Any subdomain” means a subdomain whose HTTP/HTTPS request is already delivered to the fn-knock gateway by DNS, port forwarding, or a tunnel. It does not need a separate subdomain mapping. The certificate must still cover the domain in use, and a CDN, reverse proxy, or tunnel in front of it must preserve the original `Host` and forward the request to the gateway. Built-in paths apply only to the web gateway, not the management entry point, TCP/UDP stream mappings, or original ports in direct mode.

The paths must match exactly. Do not append `/` after `/__select__` or `/__wol__`; query parameters work normally. Gateway visibility, WAF, the global blocklist, and reverse-proxy throttling still run before a page is served and can block the request.

## Built-in paths

| Path | Purpose | When it is available |
| --- | --- | --- |
| `/__select__` | Application-selection page for signed-in users | Always reserved by the gateway. It enters the sign-in flow when there is no session; credentials with a custom service scope must also select the built-in selection page. |
| `/__wol__` | Device wake page for signed-in users | Available only when WOL and `System Settings → Gateway → Portal → Show Wake-on-LAN shortcut` are enabled. It enters the sign-in flow when there is no session; a custom scope must also select the built-in Wake-on-LAN page. When the shortcut is off, the path returns Not Found instead of falling through to an upstream application. |
| `/__auth__/login` | Same-origin sign-in fallback | When the current subdomain cannot share the root-domain cookie with the authentication Host, a protected service, selection page, or WOL page redirects to this path on the current subdomain. It can be opened directly for troubleshooting, but normally does not need to be bookmarked. |
| `/__auth__/…` | Same-origin page resources and APIs for the authentication service | Used for sign-in, sign-out, callbacks, and WOL-page data requests. The gateway passes it to the authentication service; it is not a standalone service entry point. |
| `/__assets__/…` | Static assets such as gateway icons and toolbar scripts | Loaded by built-in pages and the portal. It is not a configurable page or file service. |

## Application selection: `/__select__`

Open `/__select__` on any subdomain connected to the gateway to open the application-selection page. Without a valid session, authentication returns to this page; after sign-in, it shows only entries visible to the current credential and currently available. When subdomain routing uses group view, this page uses the same groups and ordering.

![The signed-in application-selection page lists accessible services and offers Wake-on-LAN and sign-out](/images/gateway-built-in-pages/service-selection.webp)

For TOTP credentials or username/password accounts with a custom service scope, select the built-in selection page under `Authentication Configuration → Permissions`. Opening this page does not grant access to other services: the gateway still checks each application's sign-in requirement and credential scope.

## Device wake page: `/__wol__`

`/__wol__` is a compact Wake-on-LAN page. It shows the name and simplified online state of enabled devices and can send a wake request. Open it from the portal shortcut or directly on any subdomain connected to the gateway, for example `https://nas.example.com/__wol__`.

![The mobile Wake-on-LAN built-in page shows device status and a wake button](/images/gateway-built-in-pages/wake-on-lan-mobile.png)

Enable WOL under `System Settings → Features → Wake-on-LAN`, and leave `Show Wake-on-LAN shortcut` enabled under `System Settings → Gateway → Portal`. All-scope credentials can use the page directly; custom-scope credentials must additionally select the built-in Wake-on-LAN page. The page does not expose device MAC addresses, IP addresses, broadcast addresses, Relays, or internal error details.

## Same-origin sign-in fallback and authentication paths: `/__auth__/…`

`/__auth__/login` is not the default sign-in address for subdomains under the same root domain. When a root domain is configured and the cookie can be shared—for example, an authentication Host of `auth.example.com` and an application Host of `nas.example.com`—a protected service redirects to the shared authentication Host. The resulting session can be reused by compatible `*.example.com` Hosts.

Only when the current subdomain is outside the configured root-domain cookie scope, or its domain configuration prevents a shared session with the authentication Host, does the gateway automatically use the same-origin `/__auth__/…` path on the current subdomain. For example, with `example.com` as the root domain but `nas.other-example.net` as the requested host, sign-in completes at this address before returning to the original service:

```text
https://nas.other-example.net/__auth__/login
```

This fallback creates or uses a session within that subdomain's own cookie scope; it cannot give the host the shared session under the authentication Host's root domain. Incompatible Hosts therefore need a separate sign-in. APIs such as `/__auth__/api/auth/logout`, OIDC callbacks, and static resources are also under `/__auth__/…`. They depend on the browser session, redirect parameters, or same-origin checks, so they are not public APIs or ordinary bookmarks. For management APIs, use [OpenAPI: Management API Access and AI Agents](/en/guide/openapi).

## If a page does not open

1. Confirm that the URL uses the gateway entry point, not management port `7991` or internal authentication port `7997`.
2. Confirm that the subdomain’s DNS, tunnel, or fronting reverse proxy actually sends the request to the gateway and that its HTTPS certificate includes the subdomain.
3. Check the exact path: `/__select__/` and `/__wol__/` are not built-in page paths.
4. If the selection page repeatedly returns to sign-in, check the session, authentication Host, root-domain cookie scope, and the fronting proxy’s `Host`, `X-Forwarded-Host`, and `X-Forwarded-Proto` headers. A cross-root-domain Host should use its own `/__auth__/…` path and sign in separately.
5. If WOL returns Not Found or shows no device, check the WOL feature, portal shortcut, enabled state of the device, and the credential’s built-in WOL-page permission.
6. If an external request is denied, check gateway visibility, WAF, blocklist, throttling, and the client IP in request logs. LAN access cannot replace a public-network test.

- [Gateway Portal](/en/guide/gateway-portal)
- [Wake-on-LAN](/en/guide/wake-on-lan)
- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
- [Ports, Endpoints, and URL Paths](/en/quick-start/ports-and-entrypoints)
