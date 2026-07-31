---
lang: en-US
title: "Use the fnOS App through fn-knock"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 23c60dd4f0d78a94fb1ac36ba078dc26b9894c43a465a0c27a0a6ba3a0b1813d
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Use the fnOS App through fn-knock

The address entered in the fnOS App must match the way fn-knock publishes the service. Whether the App can handle web authentication redirects, cookies, and Passkeys directly depends on the client version and its networking implementation. A session in the phone's browser is not necessarily shared with the native App. After configuration, verify actual sign-in, file, and media operations in the App; a page opening in the browser is not sufficient.

Two request paths are available:

| Pattern | Address entered in the App | Role of fn-knock |
| --- | --- | --- |
| Subdomain gateway or tunneled subdomain | The fnOS application Host, such as `https://nas.example.com` | Every App request passes through Host routing and the access policy |
| Direct mode authorization | The original public fnOS address and port | Sign in through the browser first; fn-knock temporarily opens the original port for the source IP |

## Subdomain gateway or tunneled subdomain

Create an application Host for fnOS, such as `nas.example.com`, and point its Target to the private address of the fnOS service. Both the authentication Host and fnOS Host must enter through the same gateway.

1. Open the fnOS Host in the phone's browser. While signed out, confirm that it redirects to the authentication Host, then complete sign-in.
2. Enter `https://nas.example.com` in the App, or use the full URL including the actual public port.
3. Sign in with the fnOS account inside the App, then test directory browsing, uploads, downloads, media, and long-lived connections.
4. On fn-knock's `Request Logs` page, confirm the Host, client IP, authentication result, and upstream Target for the App requests.

If the App does not reuse browser cookies, a Host with `Require sign-in` enabled may repeatedly return web authentication redirects. Do not make the application Host public as a workaround. First check whether the App supports system-browser authentication or persistent cookies. If it remains incompatible, use controlled Direct mode authorization or allow access at the network layer only from a VPN / fixed trusted source.

With the subdomain pattern, do not enter an original public port such as `5666` that bypasses the gateway. Doing so also bypasses authentication, sessions, and source-IP evaluation.

## Direct mode

Direct mode authenticates through the gateway entry point, then allows the current public IP to reach the original port. It is available only with the standard fnOS FPK. Knock Lite, Docker, OpenWrt, generic Linux, Synology DSM 7 SPK, and Windows do not provide this dynamic port authorization.

1. Under `System settings → Mode`, select `Direct mode (not recommended)` and retain a local recovery path.
2. Under `System settings → Sessions`, set post-login IP authorization to `Follow session` or the required duration.
3. Open the gateway entry point in the phone's browser and sign in.
4. Confirm that the current mobile-network egress IP appears in the IP authorization list.
5. Enter the original public address and port of the fnOS service in the App, then test its actual features.

After a network switch changes the public IP, the App's original-port connection cannot refresh its authorization on its own. Reopen the gateway entry point in the browser, then return to the App and test again.

A sign-in credential with a restricted service scope does not create automatic IP authorization. For Direct mode, use a credential without service-scope restrictions or have an administrator add the current source manually. Do not authorize an oversized CIDR for a mobile network.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| App cannot connect | Whether the App URL matches the published Host, DNS / certificate, tunnel, or public endpoint |
| Browser works, but the App does not | Whether the App shares browser cookies, can handle authentication redirects, trusts the HTTPS certificate, and accepts the URL format |
| App repeatedly requests sign-in | Check the authentication result in `Request Logs`; confirm whether the App retains cookies, and do not cache authentication responses |
| Access fails after changing networks | Check the session, client IP, and Direct mode allowlist; sign in again if necessary |
| Page is broken or sign-in loops | Cookie domain, authentication Host, real client IP, and upstream proxy cache |
| Original port remains unreachable after Direct mode sign-in | IP authorization policy, credential service scope, current egress IP, fnOS service listener, and firewall synchronization |

Turn off Wi-Fi when testing over cellular data, and open a new App connection after changing networks. When testing is complete, remove any automatic or manual IP authorization that is no longer needed.

- [Sessions, Source-IP Authorization, and IP Changes](/en/guide/session-management)
- [Subdomain Routing](/en/guide/subdomain-proxy)
- [Direct Access on Original Ports](/en/quick-start/direct-mode)
