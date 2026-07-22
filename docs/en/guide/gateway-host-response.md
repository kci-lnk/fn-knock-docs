---
lang: en-US
title: "Preserve the Host Header Upstream"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 2ca12f8a45486d4679a747a99818ce4460a68848c7135d050ccafb04cb6c11e4
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Preserve the Host Header Upstream

By default, the reverse proxy preserves the visitor's `Host` header when forwarding upstream. For example, when a visitor opens `https://nas.example.com`, the upstream still sees `Host: nas.example.com`. Applications can use it to generate external links, set Cookie domains, select virtual hosts, or validate callback URLs.

`System settings → Gateway → Host response` is editable only for Host-based routing in subdomain mapping mode. This includes `Subdomain mode` with direct public ingress and `Reverse proxy mode → Subdomain mapping`. Path mode and Direct mode do not provide this setting, and authentication service Hosts are not listed as editable entries.

## When to Disable It

Keep the default enabled unless the upstream explicitly requires its own address as the Host. Common examples include:

- The upstream web server is configured only with an internal virtual-host name;
- The application validates a Host allowlist, but the public domain cannot yet be added;
- A legacy application returns `400`, redirects to the wrong location, or serves the wrong site when it receives the public Host.

When disabled, the gateway no longer forces the public Host to be preserved, so the upstream handles the Host based on the reverse-proxy target address. This can fix upstream Host validation, but it can also cause the application to generate links containing `127.0.0.1`, a container service name, or a private domain. After changing the setting, test sign-in redirects, absolute links, Cookies, and WebSockets.

## Applied by Target

The page shows a switch for each Host, but the running gateway compiles the setting by upstream Target. The following two Hosts share one Target:

```text
photos.example.com -> http://127.0.0.1:8080
files.example.com  -> http://127.0.0.1:8080
```

Disabling Host preservation for either Host affects this shared Target. If the Hosts need different policies, give them different Target addresses. They can still reach the same application through separate listener addresses, ports, or an intermediate reverse proxy.

A reverse-proxy action in Path responses follows the same runtime rule for its actual Target. A fixed response has no upstream, so Host preservation does not apply.

## Verification and Troubleshooting

1. After making a change, wait for the page to confirm that it was saved and synchronized.
2. Open the real application domain and check the status code, redirect location, and sign-in flow.
3. In `Request Logs`, confirm the matched Host, route type, and upstream Target.
4. Record the received Host in the upstream access log and confirm that it matches the application's expectation.
5. If multiple Hosts change at once, check whether they reuse the same Target.

Host preservation does not determine how fn-knock identifies the client IP, and it does not modify TLS certificates or DNS. Client-source information is carried in proxy headers; see [Forward Proxy Headers Upstream](/en/guide/gateway-proxy-headers).

- [Subdomain Routing](/en/guide/subdomain-proxy)
- [Static Path Responses](/en/guide/gateway-path-response)
- [Request Logs](/en/guide/request-logs)
