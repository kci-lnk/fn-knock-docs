---
lang: en-US
title: "Static Path Responses"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 7a3dd9fcebcc2f25c1b353c79143910804695115e4ab1463f74404a067c7bd21
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Static Path Responses

`System settings → Gateway → Path responses` adds a small number of path-level rules to an application Host. It is editable only for Host-based routing in subdomain mapping mode, including direct public `Subdomain mode` and `Reverse proxy mode → Subdomain mapping`. Path mode and Direct mode do not provide this setting. The Host remains the primary route; a request that matches no path rule falls back to that Host's default Target.

This works well for health checks, fixed status responses, or sending a small API subtree on the same Host to another upstream. To organize many applications by path, use the compatibility-oriented [Path-based Reverse Proxy](/en/guide/reverse-proxy) instead of rebuilding a path gateway on top of Host routing.

## Match Order

```text
api.example.com/healthz   -> Fixed response: 200 ok
api.example.com/v2/*      -> http://127.0.0.1:8080
api.example.com/other-path -> Host's default Target
```

First select an existing application Host. The authentication service Host does not appear in the selection list.

A path must start with `/`, but cannot be the root path `/`. The following paths are reserved for authentication, shares, or internal capabilities and cannot be configured:

- Paths beginning with `/__`
- `/s`
- `/s/`

Each Host can have only one rule for the same match mode and path.

## Rule Fields

| Field | Values | Behavior |
| --- | --- | --- |
| `Match` | Exact / Prefix match | Matches only the complete path, or that prefix and its subpaths |
| `Action` | Reverse proxy / Fixed response | Forwards to another upstream, or lets the gateway respond directly |
| `Target` | HTTP / HTTPS URL | Used only for a reverse-proxy action |
| `Strip matched path` | On / Off | Sends `/api/users` as `/users`, or keeps the original path |
| `Rewrite HTML paths` | On / Off | Adds the path prefix to page assets; a pure API usually does not need this |

For a fixed response, you can set a status code from `100` to `599`, `Content-Type`, a body, and custom response headers. Transport-level headers such as `Connection`, `Content-Length`, `Content-Type`, `Transfer-Encoding`, and `Upgrade` cannot be overridden through custom headers; use the dedicated field for the content type.

## Inherit the Host Access Policy

Path responses inherit the current Host's `Require sign-in` setting and existing strict-allowlist rules. They are not a bypass around access control.

A reverse-proxy action injects the Host's `Skip Basic Auth` credentials into requests sent to its actual Target, allowing it to pass that target service's own Basic Auth. These are not fn-knock visitor credentials. Proxy headers and Host preservation follow the shared runtime rules for this actual Target, which may differ from the settings for the Host's default Target. A fixed response has no upstream and therefore sends no Basic Auth credentials, proxy headers, or Host-preservation-related request headers.

When the source is a loopback, private, or link-local address, the authentication service returns `local_exempt`. LAN access might therefore avoid a sign-in prompt or a strict-allowlist denial. Always verify public-access policy from a genuine external network.

## Examples

Health check:

```text
Path             /healthz
Match            Exact
Action           Fixed response
Status code      200
Content-Type     text/plain; charset=utf-8
Body             ok
```

Send an API to a separate upstream:

```text
Path             /api
Match            Prefix match
Action           Reverse proxy
Target           http://127.0.0.1:8080
Strip matched path On
```

## Platform Boundaries

Path responses work with Host-based subdomain routing on the native fnOS FPK, Docker, OpenWrt, Linux, Synology DSM 7 SPK, and Windows, including `Reverse proxy mode → Subdomain mapping`. They do not open firewall ports, create DNS records, publish Docker ports, or make an unreachable Target reachable.

## Troubleshooting

1. Confirm that you are using Host-based routing and selected the correct application Host.
2. Check the path format, reserved paths, and Exact / Prefix match mode.
3. First determine whether the Host's sign-in or allowlist policy blocked the request.
4. Access the reverse-proxy Target from the fn-knock runtime environment.
5. In [Request Logs](/en/guide/request-logs), verify the Host, path, route type, status code, and upstream target.

See [Subdomain Routing](/en/guide/subdomain-proxy) for the primary Host route and [System Settings and Maintenance](/en/guide/system) for related global options.
