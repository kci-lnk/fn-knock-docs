---
lang: en-US
title: "Put Tencent Cloud EdgeOne in Front of fn-knock"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 544d6e4ba7d0447b81b3e05ab57fac721e2bf08313b223018b36c1b2a1e1132d
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Put Tencent Cloud EdgeOne in Front of fn-knock

EdgeOne can provide DNS, TLS, and edge ingress in front of fn-knock. The authentication Host and application Hosts must still be handled by fn-knock. The edge platform must not cache dynamic sign-in pages as static content or discard the real client IP.

## Before you begin

- The fn-knock subdomain mappings have been verified locally or through an existing public endpoint.
- Every Host you plan to publish has a defined upstream Target and access policy.
- EdgeOne can reach the origin address, port, and scheme.
- A test domain is ready and can be opened over cellular data.

## Key configuration steps

1. Under `Domains → Subdomain mode → Edge real IP detection`, select `Tencent EdgeOne`. The gateway reads `EO-Connecting-IP`, uses the detected address as the client IP, and passes it to the authentication service through `X-Forwarded-For`.
2. Add the domain in EdgeOne and configure the authentication and application Hosts to use the fn-knock gateway entry point as their origin.
3. Preserve the request Host, WebSocket upgrade, and EdgeOne real-client-IP header when forwarding to the origin.
4. Bypass the cache for authentication, callbacks, and dynamic application paths. Decide the cache policy per application; never apply a blanket cache rule to sign-in pages.
5. After configuring HTTPS in EdgeOne, test the authentication Host, application Hosts, and applications that use WebSockets or long-lived connections from the internet.

## Origin settings

The authentication Host and application Hosts may share one origin address and port, but the origin request must preserve the Host used by the visitor so fn-knock can match the correct mapping. The origin is the gateway entry point, `7999` by default, not admin port `7991` or internal backend port `7998`.

Choose the origin scheme according to where TLS terminates:

| Public TLS | EdgeOne to fn-knock | fn-knock requirements |
| --- | --- | --- |
| EdgeOne terminates HTTPS, HTTP to origin | HTTP | The origin port is reachable; the upstream layer correctly reports the public scheme |
| EdgeOne terminates HTTPS, HTTPS to origin | HTTPS | The fn-knock certificate covers the origin Host and its chain is trusted by EdgeOne |
| End-to-end HTTPS | HTTPS | Validate both the edge certificate and origin certificate |

Authentication pages, authentication APIs, OIDC / QQ callbacks, sign-out, session-status, and cookie-setting responses must bypass the cache. Whether an application response can be cached depends on its own response headers and sign-in flow; a file extension alone does not prove that a request is static.

## Protect the real-IP header

After selecting the EdgeOne provider, the gateway trusts the semantics of `EO-Connecting-IP`. If any public client can still connect directly to the origin port, an attacker could bypass EdgeOne and forge this header. Use a firewall, origin access control, or a non-publicly-routable origin path so that the gateway accepts only EdgeOne origin traffic and required operational probes.

You may temporarily retain an administrator-only direct test Host while switching, but do not give it the same broad public allow rule as production traffic. After validation, remove the fallback DNS record or restrict its source.

## What to verify

Test separately over cellular data and another external network so that you do not validate only one egress IP:

1. Open the authentication Host while signed out and confirm that the authentication page appears.
2. Sign in, then open an application Host. Confirm that you return to the original destination without a redirect loop.
3. Open `Request Logs` and confirm that `Client IP` is the visitor's address, `Connection source IP` may be an EdgeOne node, and `EO-Connecting-IP` is present.
4. Confirm that the Host, authentication result, upstream Target, and response status match the current request.
5. Test WebSockets, file uploads and downloads, and sign-out. After signing out, reopen a Host that requires authentication.
6. Try to connect directly to the origin from an address that does not pass through EdgeOne and confirm that the network layer rejects it.

If you encounter a sign-in loop, broken page assets, or an incorrect client-region result, check the cache, cookie domain, origin Host, public scheme, and real-IP header in order. If the request never enters fn-knock logs, troubleshoot DNS, the EdgeOne origin, or the origin network. If the request appears in the log but returns `502`, inspect the path from fn-knock to the application Target.

## Rollback

Before making changes, record the original DNS, origin address, port, scheme, and cache rules. To roll back, restore the original DNS or disable acceleration for the domain first, then change fn-knock's edge real-IP provider to match the active entry path. Until DNS propagation completes, both paths may receive requests; make sure neither serves stale authentication content.

The EdgeOne interface, plans, and origin options can change. Follow the [official EdgeOne documentation](https://cloud.tencent.com/document/product/1552) for current edge-side procedures.

- [Security Model and Baseline](/en/guide/security)
- [Request Logs](/en/guide/request-logs)
- [Subdomain Routing](/en/guide/subdomain-proxy)
