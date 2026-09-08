---
lang: en-US
title: "Static Path Responses"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 168f3272d500129a990cfef35d32f8dc757906c747b7c2cd5ed02097d2da90af
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Static Path Responses

`System settings → Gateway → Path responses` adds a small number of path-level rules to a reverse-proxy application Host. It is editable only for Host-based routing in subdomain mapping mode, including direct public `Subdomain mode` and `Reverse proxy mode → Subdomain mapping`. Path mode, Direct mode, and single-file or directory responses do not provide this setting. The Host remains the primary route; a request that matches no path rule falls back to that Host's default Target.

This works well for health checks, fixed status responses, or sending a small API subtree on the same Host to another upstream. To organize many applications by path, use the compatibility-oriented [Path-based Reverse Proxy](/en/guide/reverse-proxy) instead of rebuilding a path gateway on top of Host routing.

## Match Order

```text
api.example.com/healthz   -> Fixed response: 200 ok
api.example.com/v2/*      -> http://127.0.0.1:8080
api.example.com/other-path -> Host's default Target
```

First select an existing reverse-proxy application Host. The authentication service Host and [static file or directory Hosts](/en/guide/static-host-mapping) do not appear in the selection list.

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
| `Authentication behavior` | Inherit Host / Public access / Require login | Inherit Host policy, allow public access, or require authentication for this path |
| `Target` | HTTP / HTTPS URL | Used only for a reverse-proxy action |
| `Strip matched path` | On / Off | Sends `/api/users` as `/users`, or keeps the original path |
| `Rewrite HTML paths` | On / Off | Adds the path prefix to page assets; a pure API usually does not need this |

For a fixed response, you can set a status code from `100` to `599`, `Content-Type`, a body, and custom response headers. Transport-level headers such as `Connection`, `Content-Length`, `Content-Type`, `Transfer-Encoding`, and `Upgrade` cannot be overridden through custom headers; use the dedicated field for the content type.

## Path Authentication Behavior

Rules use `Inherit Host` by default and apply the current Host's `Require sign-in` setting and existing strict-allowlist rules. With `Public access`, only requests matching this path rule skip sign-in; other paths on the same Host keep the Host policy.

Choose `Require login` to protect selected paths on a public Host while retaining its allowlist and advanced authentication policies. Hosts with such paths also appear in credential service scopes and Cookie domain compatibility checks. Authorization scopes select the Host, not individual paths.

For example, a public Host with a protected `/admin` prefix keeps ordinary pages public while `/admin` and its subpaths require authentication. Exact matches take priority over prefixes; the longest matching prefix wins. Test both protected paths and adjacent public paths.

Use a public path for a health check, webhook callback, or deliberately anonymous fixed content. The choice covers the rule's entire exact or prefix match: making `/api` public also makes its matched subpaths public. Keep the match narrow and verify that the upstream still enforces its own permissions where required.

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

1. Confirm that you are using Host-based routing, the application Host's response type is reverse proxy, and the correct Host is selected.
2. Check the path format, reserved paths, and Exact / Prefix match mode.
3. Check the rule's `Authentication behavior`. If it inherits the Host policy, then determine whether the Host's sign-in or allowlist policy blocked the request.
4. Access the reverse-proxy Target from the fn-knock runtime environment.
5. In [Request Logs](/en/guide/request-logs), verify the Host, path, route type, status code, and upstream target.

See [Subdomain Routing](/en/guide/subdomain-proxy) for the primary Host route and [System Settings and Maintenance](/en/guide/system) for related global options.
