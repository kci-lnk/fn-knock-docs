---
lang: en-US
title: "Put Alibaba Cloud ESA in Front of fn-knock"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 9d7a51de355551d9492def65755568e6aa2df23a0aed9d679eb3e545a71d0bcf
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Put Alibaba Cloud ESA in Front of fn-knock

Alibaba Cloud ESA can sit in front of fn-knock to provide DNS, TLS, and edge delivery. The origin remains the fn-knock gateway; ESA configuration must not bypass fn-knock authentication, sessions, Host routing, or access policies.

## Before you begin

- The subdomain mappings have been verified over a path that does not use ESA.
- The DNS, certificate, and upstream target for every authentication and application Host are known.
- ESA can reach the address, port, and scheme exposed by the fn-knock gateway.
- You have retained a management or rollback path that bypasses ESA.

## Key configuration steps

1. Under `Domains → Subdomain mode → Edge real IP detection`, select `Alibaba Cloud ESA`. The gateway reads `Ali-Real-Client-IP` and forwards the detected address to the authentication service through `X-Forwarded-For`; enable ESA managed request-header transformation.
2. Add the site in ESA and point both the authentication Host and application Hosts to the fn-knock gateway.
3. Preserve Host, WebSocket traffic, and the real-client-IP header when forwarding to the origin.
4. Bypass the cache for authentication, callbacks, APIs, and other dynamic paths. Before caching static assets, confirm that doing so will not break cookies or authorization.
5. Over a real external connection, test sign-in, application pages, file downloads, and long-lived connections in sequence.

## Origin settings

Configure the ESA origin with an address that reaches the fn-knock gateway and use the actual gateway port, `7999` by default. Do not point the origin at admin port `7991` or an internal backend port. The authentication Host and application Hosts may share one origin, but ESA must pass the original Host to fn-knock.

If ESA connects to the origin over HTTPS, the certificate presented by fn-knock must cover the origin Host and its chain must pass the platform's validation. If ESA uses HTTP to the origin while visitors use HTTPS, confirm that the scheme information supplied by the edge does not cause applications to generate `http://` callback URLs or incorrect cookie attributes.

Treat the following as dynamic requests:

- Authentication pages and authentication APIs.
- External sign-in callbacks for OIDC, QQ, and similar providers.
- Sign-out, session-status, Passkey, and cookie-setting responses.
- The application's own sign-in, upload, download-signing, and WebSocket handshake flows.

Cache static assets only after confirming that the response does not vary by cookie, user, or permission. Never cache a `Set-Cookie` response or let different users share a cached object containing private data.

## Trust boundary for the real client IP

After selecting the ESA provider, fn-knock uses `Ali-Real-Client-IP` when determining the client address. An attacker who can bypass ESA and connect directly to the origin could forge that header. Restrict the gateway entry point at the firewall, cloud security group, or origin access-control layer so that only ESA origin nodes and required administrative sources can connect.

Do not route the admin entry point through a public ESA site. For remote administration, use a VPN, a restricted reverse proxy, or another independent management path.

## Troubleshooting

Run an end-to-end test over a mobile network:

1. Open an application Host while signed out and confirm that the authentication flow starts.
2. Sign in and confirm that you return to the application Host.
3. In `Request Logs`, confirm that `Client IP` is the visitor's address, `Connection source IP` may be an ESA node, and `Ali-Real-Client-IP` is present.
4. Check the request Host, authentication result, upstream Target, and response status.
5. Test sign-out, external sign-in callbacks, WebSockets, and file transfers.
6. Try to bypass ESA and connect directly to the origin; confirm that the network layer rejects the attempt.

If you encounter a sign-in loop, broken asset loading, or incorrect region-rule matching, check the ESA cache policy, origin Host, public scheme, cookie domain, and client-IP header before changing an fn-knock mapping. If a request never appears in fn-knock logs, troubleshoot DNS, ESA origin health, and the origin network. If the log shows `502`, troubleshoot the path from fn-knock to the application Target.

## Rollback

Before making changes, save the original DNS, origin scheme, port, certificate, and cache policy. To roll back, restore the original endpoint or disable the ESA proxy first, then change fn-knock's edge real-IP provider to match the active request path. During DNS propagation, avoid using different cookie domains or cache policies on the old and new endpoints.

The ESA console and plan features can change. Follow the [official ESA documentation](https://help.aliyun.com/zh/edge-security-acceleration/esa/) for current edge-side procedures.

- [Security Model and Baseline](/en/guide/security)
- [Request Logs](/en/guide/request-logs)
- [Subdomain Routing](/en/guide/subdomain-proxy)
