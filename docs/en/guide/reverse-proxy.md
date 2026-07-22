---
lang: en-US
title: "Path-based Reverse Proxy (Compatibility Mode)"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: a5c2d2d14d03659b1798f2dbf1496082ee3d8cc398978d44caa41e811a4e7aaf
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Path-based Reverse Proxy (Compatibility Mode)

`Path mappings` serve as the primary router only under `Reverse proxy mode → Path mode`. They send path prefixes on one public Host to different HTTP upstreams—for example, `/alist` to AList.

For new deployments, prefer [Subdomain Routing](/en/guide/subdomain-proxy). Host-based routing lets every application continue to run at its root path and is usually more reliable than path rewriting. Path mode is useful for retaining existing URLs or for deployments that cannot yet plan multiple subdomains.

## Routing Model

```text
https://example.com/alist    -> http://127.0.0.1:5244
https://example.com/jellyfin -> http://127.0.0.1:8096
```

The gateway uses longest-prefix matching. If both `/app` and `/app-admin` exist, a request for `/app-admin/users` matches `/app-admin`.

The path prefix remains in the browser URL. An application that hardcodes `/`, callback addresses, a Service Worker scope, or WebSocket addresses can still fail even with rewriting enabled. In that case, migrate to Host-based routing instead of stacking more rules.

## Add a Mapping

Open `Path mappings`. You can use `Discover` to generate candidate rules or enter a mapping manually:

| Field | Purpose |
| --- | --- |
| `Trigger path` | The public path prefix, beginning with `/` |
| `Target address` | An upstream `http`, `https`, `ws`, or `wss` URL |
| `Require authentication` | Sends an unauthorized visitor through the fn-knock sign-in flow first |
| `Strip request prefix` | Sends `/alist/users` upstream as `/users` |
| `Rewrite HTML content` | Adds the public path prefix to some page asset references |
| `Use root mode` | Records the matched mapping, then directs the browser to `/` for an application that must run at the root |

The Target address must be reachable from the fn-knock runtime environment. A loopback or LAN address is typical. In Docker, `127.0.0.1` refers to the container itself; use an address reachable from the container for a service on the host.

The authentication, rewriting, and prefix-stripping options suggested by `Discover` are only recommendations. Adjust them for the target application's base-path support before saving.

For scan intensity, choose `Follow device recommendation` or Low, Medium, High, or Extreme. Every level covers the same range and finds the same services; only concurrency, duration, and device load change. Prefer automatic or Low intensity on a resource-constrained device.

Scanning accepts only local IPv4 CIDRs, and candidate configurations do not go live automatically. See [Service Discovery and Bulk Onboarding](/en/guide/service-discovery) for target sources, port ranges, concurrency limits, and the full troubleshooting flow.

## Access Policy

Disabling `Require authentication` makes the path public. When enabled, a public visitor signs in through fn-knock before reaching the upstream. Path mappings do not have an independent strict-allowlist policy. The `IP Allowlist` can authorize a source, but it does not turn an authenticated path into one that only that source may access. To narrow the source before it reaches the path, use [Gateway Visibility](/en/guide/gateway-visibility) or an external network-layer rule.

When the gateway identifies a loopback, private, or link-local source, the authentication result is `local_exempt` and normal sign-in checks are skipped. A path opening directly over the LAN therefore does not prove that public authentication works. With FRP or another proxy, confirm in Request Logs that the real public client IP is preserved.

`Skip Basic Auth` in a Host mapping injects upstream credentials for the target service; it is not an fn-knock sign-in. Do not use browser Basic Auth on a path mapping as a substitute for gateway authentication.

## Default Route

The default route handles the root path `/`. Service discovery normally sets fnOS as the default service. Change it only when the root path should explicitly enter another application.

After changing multiple mappings or the default route, select `Sync routes` to push the current configuration to the gateway again. Saving a single rule normally triggers synchronization already.

## When to Migrate to Host-based Routing

Prefer a migration if any of the following applies:

- Static assets, WebSockets, or sign-in callbacks still return to the root path.
- The application does not support a configurable base path.
- Prefixes, Cookies, or Service Workers from multiple applications interfere with one another.
- Different services need their own `Require sign-in`, scheduled availability, or upstream Basic Auth injection.

After switching to `Reverse proxy mode → Subdomain mapping`, existing path rules are retained but their entry is hidden. Clean up the old rules only after confirming that Host-based routing is stable.

## Troubleshooting

1. Confirm that the current mode is `Reverse proxy mode → Path mode`.
2. Open the Target URL directly from the fn-knock runtime environment.
3. Confirm that longest-prefix matching selects the intended rule.
4. Use the URI received by the upstream to decide whether to enable `Strip request prefix`.
5. If page assets fail, check `Rewrite HTML content`; if they still fail, consider Host-based routing.
6. Review the client IP, matched path, status code, and upstream target in Request Logs.

See [NAT Traversal and Tunnels](/en/guide/tunnel) for the network entry point, [NAT Traversal with Subdomain Routing](/en/quick-start/reverse-proxy-mode) for the setup flow, and [Publish a Subdomain through a Tunnel without a Public IP](/en/tutorials/reverse-proxy-with-fknock) for a complete reverse-proxy example.
