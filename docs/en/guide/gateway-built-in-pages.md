---
lang: en-US
title: "Built-in Gateway Pages"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 2a965da8ae338020a10c85ef93b02e978cf6541fa3e850aeb7cfb0458bdf315f
---

# Built-in Gateway Pages

Built-in pages need no mapping. Append a built-in path to any subdomain that resolves and forwards to the fn-knock gateway:

```text
https://nas.example.com/__select__
https://nas.example.com/__wol__
```

The path must match exactly: `/__select__/` and `/__wol__/` are not built-in pages. The subdomain must reach the gateway, and its certificate, CDN, reverse proxy, or tunnel must correctly handle the domain and `Host`.

## Application selection: `/__select__`

Open `https://any-gateway-subdomain/__select__` to show the application selection page. Visitors sign in first when needed; after sign-in, only services available to the current credential are shown.

![Application selection page](/images/gateway-built-in-pages/service-selection.webp)

With a custom service scope, select the built-in selection page under `Authentication Configuration → Permissions`. Opening it does not grant access to unauthorized services.

## Wake-on-LAN: `/__wol__`

Open `https://any-gateway-subdomain/__wol__` to view enabled devices and send a wake request.

![Wake-on-LAN page](/images/gateway-built-in-pages/wake-on-lan-mobile.png)

All of the following are required:

1. Enable WOL under `System Settings → Features → Wake-on-LAN`.
2. Enable `Show Wake-on-LAN shortcut` under `System Settings → Gateway → Portal`.
3. Sign in; custom scopes must also select the built-in Wake-on-LAN page.

When the shortcut is disabled, `/__wol__` returns Not Found and is not forwarded upstream.

## Sign-in fallback: `/__auth__/…`

`/__auth__` is not automatically used by every subdomain.

| Situation | Sign-in address |
| --- | --- |
| Application subdomain is under the configured root domain and can share its Cookie | Shared authentication Host, such as `auth.example.com` |
| Application subdomain is outside the root-domain Cookie scope and cannot share the session | Its own `/__auth__/login` |

For a root domain of `example.com` and an authentication Host of `auth.example.com`, `nas.example.com` uses shared sign-in; `nas.other-example.net` signs in separately at:

```text
https://nas.other-example.net/__auth__/login
```

That session belongs only to the current subdomain and cannot be shared with services under `example.com`. `/__auth__/…` also contains authentication endpoints such as logout and OIDC callbacks; do not use it as a public API.

- [Gateway Portal](/en/guide/gateway-portal)
- [Wake-on-LAN](/en/guide/wake-on-lan)
- [Sessions, Source-IP Authorization, and IP Changes](/en/guide/session-management)
