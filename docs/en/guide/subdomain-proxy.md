---
lang: en-US
title: "Subdomain Routing"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 2febfd2cbb94b2c7361b1244cc5d6fe872b9bcadcb4e730715254ab7b6fee159
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Subdomain Routing

`Subdomain mapping` routes multiple domains to local web services by their HTTP `Host` header. It is the default routing method for new deployments and works with two network topologies:

- `Subdomain mode`: Domains resolve directly to a reachable public entry point.
- `Reverse proxy mode → Subdomain mapping`: FRP or Cloudflared carries requests for each subdomain to the gateway.

Both topologies use `auth.example.com` as the sign-in entry point and share one gateway across application Hosts such as `nas.example.com` and `alist.example.com`. Path mapping is a compatibility option for older deployments, not a prerequisite for subdomain mapping.

## Request Flow

```text
Browser -> Direct public access or tunnel -> fn-knock gateway -> Match by Host -> Local Target
                                                   |
                                                   +-> Public / Require sign-in / Advanced authentication temporary grant
```

With direct public access on the default port, the URL is usually `https://nas.example.com:7999`. When EdgeOne, ESA, or Cloudflared sits in front, visitors normally use the standard `https://nas.example.com` URL, while the origin still points to the gateway's actual port.

## Configuration Order

1. Under `System settings → Mode`, select `Subdomain mode` or `Reverse proxy mode → Subdomain mapping`.
2. Under `Subdomain mapping`, save a root domain such as `example.com`.
3. Click `Add auth service` to create `auth.example.com`.
4. Configure public DNS, router forwarding, or Tunnel Public Hostnames so that all relevant Hosts reach the same gateway.
5. Add application Hosts and decide whether to enable `Require sign-in` for each mapping.
6. To grant access based on the source or request attributes, open `Advanced authentication` from the mapping's right-side menu.
7. Test over a mobile network and verify the sign-in redirect, return URL, and client IP in request logs.

For the complete direct-public-access workflow, see [Public IP Access with Subdomain Routing](/en/quick-start/subdomain-mode) and [Direct Public Access with a Subdomain](/en/tutorials/subdomain-direct-with-fknock).

## Subdomain Mode Configuration

| Field | Purpose | Recommendation |
| --- | --- | --- |
| `Domain` | Parent domain used to generate application Hosts, such as `example.com` | Save it before adding the auth service and application mappings |
| `Current auth service` | Shared sign-in entry point for users who are not signed in | Use `auth.example.com`; only one is allowed |
| `Public HTTPS port for the auth service` | Visitor-facing HTTPS port used to generate sign-in redirect URLs | Enter the port visitors actually see |
| `Edge real IP detection` | Reads visitor addresses from EdgeOne / ESA in direct-public `Subdomain mode` | Enable it only when the matching platform proxies to the origin |

The public HTTPS port for the auth service affects external URLs only. It does not change the application's listening port, open a port, or create NAT forwarding on a router, container, or edge platform.

The root domain and Host mappings cannot contain `*`. Enter `example.com` as the root domain and `nas` or `nas.example.com` as an application mapping. A DNS wildcard such as `*.example.com` is configured at a different layer and must not be entered as an fn-knock root domain or Host.

### EdgeOne / ESA

Direct-public `Subdomain mode` can enable Tencent Cloud EdgeOne or Alibaba Cloud ESA support. Once enabled, public URLs can omit `:7999`. The subdomain list, mapping URLs, and auth service also show only the public Host instead of a stale configured gateway port. This is visitor-side display only; the edge origin must still point to fn-knock's actual listening port. The gateway also reads the real client IP from the platform-specific header:

| Platform | Client IP header |
| --- | --- |
| Tencent Cloud EdgeOne | `EO-Connecting-IP` |
| Alibaba Cloud ESA | `Ali-Real-Client-IP` |

For ESA, also enable the managed transformation that adds the real client IP header to requests. This switch covers only EdgeOne / ESA; it is not a general-purpose trust switch for arbitrary CDNs. Cloudflared should use the dedicated `Reverse proxy mode → Subdomain mapping` path.

When the edge platform handles external ports `80 / 443`, its origin must still point to fn-knock's actual gateway port. Disable any rule that caches sign-in responses and allow WebSocket connections. See [TLS Certificates and HTTPS](/en/guide/ssl) and [DDNS Management](/en/guide/ddns) for certificates and DNS records.

## Host Mappings

A mapping contains at least a Host and a Target:

```text
nas.example.com   -> http://127.0.0.1:5666
alist.example.com -> http://127.0.0.1:5244
photos.example.com -> http://127.0.0.1:5666/photos/
```

| Field | Behavior |
| --- | --- |
| `Host / subdomain` | Matches the request Host; after saving a root domain, you can enter only `nas` |
| `Target` | HTTP, HTTPS, WS, or WSS upstream URL; it may include a base path and must be reachable from the fn-knock runtime |
| `Require sign-in` | Redirects unsigned-in users to the auth Host, then returns them to the original URL |
| `Disable` / `Schedule enable or disable` | Takes the mapping offline manually or controls its daily open window using server-local time |
| `Group` | Places an application Host in an existing group; the auth service cannot be grouped |
| `Show portal` | Controls the app switcher and sign-out entry shown after sign-in |
| `Display title` | Overrides the name shown in lists, the portal, and exported bookmarks |
| `App icon` | Uses the automatically collected icon or uploads a custom icon for this application Host |
| `Skip Basic Auth` | Injects a Basic Auth username and password into upstream requests |
| `Visibility` | Inherits the global rules, replaces them with rules for this Host, or disables visibility restrictions only for this Host |
| `Enable WAF` | Enabled by default for application Hosts; when disabled, this Host skips the global WAF |

Whenever possible, bind application services only to a loopback or private address so that clients cannot bypass the gateway. In Docker, `127.0.0.1` refers to the container itself; to proxy a service on the host, use a host address reachable from the container. On Docker deployments, the Target field suggests detected reachable LAN IP candidates, but a suggestion does not change container networking, published ports, or the upstream listener.

When a Target contains a path, the gateway preserves that base path and appends the visitor's request path. This can be used for services such as fnOS Photos or Music that are mounted below a subpath. After saving, test the home page, static assets, redirects, Cookies, and WebSockets. A base-path Target cannot make an application that only supports root deployment subpath-aware. Title and icon collection uses the complete Target and preserves an explicit port.

The auth service is a special Host mapping. It must remain public and must not require sign-in or inject Basic Auth credentials, or the sign-in entry point will loop or block itself.

### Grouped View

After enabling `Grouped view` above the list, use `Manage groups` to create, rename, reorder, or delete groups. Assign application Hosts through the single-item editor, bulk move, or drag and drop. You can create up to `32` groups. Names must contain `1`–`40` characters and must be unique when compared case-insensitively. Deleting a non-empty group does not delete its Hosts; they move to `Ungrouped`.

Group order and Host order synchronize to the signed-in portal and built-in `/__select__` page. Exported browser bookmarks also use matching group folders. Switching back to list view preserves group assignments, but the portal, selection page, and newly exported bookmarks use a flat order. Search shows only matching groups and Hosts and expands results temporarily; collapsed state is stored only in the current browser.

Grouping changes navigation and management order only. It does not change authentication, visibility, WAF, or the Target. The auth service always remains outside groups, and credential Host scopes still determine actual access.

### Basic Auth Injects Upstream Credentials

`Skip Basic Auth` stores credentials for the target service's own Basic Auth challenge. The gateway sends them upstream when proxying requests and fetching the page title or favicon, preventing the browser from showing another Basic Auth dialog.

It does not create an fn-knock account, replace sign-in at `auth.example.com`, or change `Require sign-in` or an existing `strict_whitelist` rule. Treat these credentials as sensitive configuration and save them only when needed.

Both the username and password are required, and the username cannot contain a colon. If an incomplete or invalid configuration is saved, the system disables this option and clears the credentials instead of retaining a partial configuration.

### App Icon

When editing a regular application Host, open `App icon` to preview the current source, recollect the upstream icon, or upload a custom image. PNG, JPG, WebP, AVIF, SVG, and ICO are supported, with a 5 MB source-file limit. The browser removes external SVG content, and the server rejects SVG files with unsafe `DOCTYPE` or entity declarations. The image is then fitted inside a square canvas without cropping and converted into an embedded icon no larger than 128 KiB.

A custom icon takes priority in the subdomain list and portal, and is embedded when browser bookmarks are exported. `Restore automatic collection` removes the custom override and reads the Target again. If the Target returns no icon, the page shows that none has been collected. The authentication service does not support a custom icon. Icons are included in the configuration and `.knock` backups; do not share sensitive internal artwork in routine troubleshooting attachments.

### Per-Host Visibility and WAF

After global gateway visibility is enabled, an application Host's advanced settings can use `Inherit global visibility`, `Custom`, or `Disabled`. Custom rules replace the global rules, while Disabled skips visibility checks only for the current Host. The auth Host must inherit the global rules. See [Gateway Visibility](/en/guide/gateway-visibility) for configuration and recovery guidance.

WAF is enabled for application Hosts by default and can be disabled per Host to skip the global WAF. This switch provides no protection while the global WAF itself is disabled, and the auth Host cannot bypass WAF through Host settings. See [Web Application Firewall (WAF)](/en/guide/waf) for policy details.

### Advanced Authentication

The right-side menu for an HTTP / HTTPS application Host with `Require sign-in` enabled includes `Advanced authentication`. It can issue a temporary grant limited to the current Host based on the source IP, region, URL path, request header, query parameter, or HTTP method. Requests that match no rule continue through the normal sign-in flow.

Once a rule matches, it grants access to the entire current Host, not just the path or request that triggered the rule. It is not a system sign-in, does not create a portal, and grants no access to other Hosts. Read [Advanced Authentication for Subdomains](/en/guide/advanced-auth) before configuring it.

## Access Policies and `local_exempt`

| Current UI configuration | Unauthorized public request |
| --- | --- |
| `Require sign-in` disabled (current login-first mapping) | Proceeds directly to the upstream |
| `Require sign-in` enabled | Redirects to the auth Host without a valid source-IP authorization or session |
| `Require sign-in` and advanced authentication enabled | A matching rule issues a temporary grant for this Host; otherwise, source authorization and sign-in are checked |

The backend remains compatible with `strict_whitelist` rules in existing configurations. A mapping with such a rule is not necessarily public when `Require sign-in` is disabled: it still checks valid source authorization records, created manually or automatically after sign-in, and a browser session cookie alone cannot replace the source condition. The current Host editor has no control for creating or switching strict-allowlist rules. To leave this behavior, record the full mapping and recreate it through the current UI. For new mappings, manual source authorization can grant access independently. Automatic IP authorization usually lets the same source continue to connect, but it does not override a service-scope denial carried by the credential. `IP allowlist` is not a switch for strict source restrictions. To restrict sources before requests reach a mapping, use [Gateway Visibility](/en/guide/gateway-visibility) or external network-layer rules.

Sign-in credentials can limit which Hosts they may access. Successfully signing in with one credential does not automatically grant access to every application subdomain.

The auth service first evaluates the source IP recognized by the gateway. Loopback, private, and link-local sources return `local_exempt`, bypassing normal sign-in and strict-allowlist checks. This makes the LAN a trusted boundary by default:

- An existing strict-allowlist rule does not force LAN sources to sign in.
- A credential's Host service scope does not restrict locally exempt sources. This is a network trust boundary and is unsuitable for testing credential scopes.
- A LAN test does not prove that the public access policy works.
- With FRP, Cloudflared, EdgeOne, or ESA in front, confirm in request logs that the real public IP reaches the gateway. Mistaking a proxy's private address for the visitor source changes authorization results.

See [IP Allowlist](/en/guide/whitelist) and [Gateway Visibility](/en/guide/gateway-visibility) for source-network configuration.

## Bulk Onboarding and Maintenance

`Discover` scans allowed local IPv4 ranges and generates candidate Hosts. A scan accepts up to `16` CIDRs covering at most `1024` hosts in total. It scans only loopback, network-interface, Docker-host, existing-mapping, and manually saved local ranges; it does not probe the public internet.

The scan window offers `Follow device recommendation` (the default) or Low, Medium, High, and Extreme intensity. A level changes only concurrency, speed, and device load—not the scan range or discovery results. The default uses CPU, available memory, and file descriptor budgets to choose a safer level. Keep automatic or Low intensity on resource-constrained devices such as NAS systems and routers.

See [Service Discovery and Bulk Onboarding](/en/guide/service-discovery) for scan ports, allowed CIDR ranges, the Docker network perspective, and bulk-save rules.

List actions include:

- `Refresh icons and titles`: Fetch upstream metadata again.
- `Clean stale services`: Check HTTP / HTTPS upstreams with `HEAD`, then `GET` on failure, and let an administrator confirm before removing unreachable mappings.
- `Export as bookmarks`: Export application Hosts without the auth service.
- `Clear all configuration`: After two confirmations, remove the auth service and all Host mappings while preserving the root domain and other mode settings.

Traffic details for an individual Host show live traffic and active IPs, and let you add suspicious sources to the [Global Blocklist](/en/guide/general-blacklist).

## Additional Host-Routing Capabilities

- [Static Path Responses](/en/guide/gateway-path-response) adds a small number of special paths to one Host. Requests that match none of them still use that Host's default Target.
- [TCP/UDP Stream Proxying](/en/guide/stream-mappings) adds TCP / UDP ports to direct-public `Subdomain mode`; it is unavailable for reverse-proxy subdomain mapping.
- [fnOS Share Bypass](/en/guide/fnos-share-bypass) bypasses the gateway only for valid fnOS `/s/...` share paths; it does not expose the entire site.

None of these features changes the fact that the Host is the primary routing key for web traffic.

## Platform Boundaries

- Host routing works on fnOS FPK, Docker, OpenWrt, Linux, Synology DSM 7 SPK, and Windows. Actual public reachability still depends on each platform's published ports and network path.
- Automatic host-firewall changes and Smart Connect are provided only by the standard fnOS FPK runtime with the matching capabilities. Docker, OpenWrt, Linux, Synology, and Windows do not provide them.
- Protocol mappings appear only in direct-public `Subdomain mode`. Even if extra ports are published for a Docker container, fn-knock does not manage the host firewall.
- OpenWrt itself must manage port access and split-horizon LAN DNS. fn-knock does not provide Direct mode, host-firewall management, or Smart Connect there, nor does it provide SSH Security, Web Terminal, or in-app FPK updates.
- fn-knock does not automatically close an upstream service's existing public listener and cannot replace upstream updates, backups, or least-privilege configuration.

## Verification and Troubleshooting

Check the request path in order:

1. Verify that DNS or the Tunnel Public Hostname sends the current Host to the correct gateway port.
2. Verify the Host and client IP in request logs.
3. Verify that the auth service exists and does not require sign-in or use Basic Auth.
4. Verify that the application mapping is enabled and the current time is within its open window.
5. Verify that the Target is reachable from the fn-knock runtime.
6. Verify that the sign-in credential allows the current Host. If advanced authentication is enabled, also check its rule groups, conditions, and temporary-grant status.
7. If a legacy strict-allowlist rule exists, check whether the current public source is authorized.
8. Verify that the HTTPS certificate covers the current Host and that the platform in front allows WebSocket connections without caching authentication responses.

Connect one or two services and complete public-network testing before using bulk discovery or tightening access policies.
