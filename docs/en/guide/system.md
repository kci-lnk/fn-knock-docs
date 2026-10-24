---
lang: en-US
title: "System Settings and Maintenance"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: a011714889998374270fe7f5a207a45cf8774582c0333a50100fb6a105c7c581
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# System Settings and Maintenance

`System settings` brings together runtime modes, tunnel resources, certificate tools, gateway and session controls, feature switches, and maintenance actions. Tabs appear dynamically according to the runtime mode and deployment capabilities. If a tab is missing, check the current platform and runtime mode before repeatedly refreshing the page.

## Deployment Capability Differences

| Capability | Native fnOS FPK | Docker | OpenWrt | Linux service | macOS | Synology DSM 7 SPK | Windows x86_64 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Direct mode and host firewall | Supported; the process needs host permissions | Not supported | Not supported | Not supported | Not supported | Not supported | Not supported |
| Smart Connect | Supported | Not supported | Not supported | Not supported | Not supported | Not supported | Not supported |
| Web Terminal | Remote SSH + optional local PTY | Remote SSH only | Remote SSH + optional local PTY | Remote SSH + optional local PTY | Remote SSH + optional local PTY | Remote SSH only | Remote SSH only |
| Built-in FRP / Cloudflared | Supported | Supported | Supported | Supported | Supported | Supported | Not supported |
| SSH Security | Supported | Not supported | Not supported | Not supported | Not supported | Not supported | Not supported |
| Automatic HTTPS | Supported | Not supported | Not supported | Supported; requires an available port `80` | Supported; firewall and inbound access remain manual | Not supported | Supported; the Windows inbound path must still be opened |
| ACME DNS-01 | Supported | Supported | Supported | Supported | Supported | Supported | Supported; uses the built-in client |
| System clock sync | Supported | Not supported | Supported | Not supported | Not supported | Not supported | Not supported |
| fnOS SSL certificate store sync | Supported | Not supported | Not supported | Not supported | Not supported | Not supported | Not supported |
| Update installation | Update in the web UI | Pull a new image | Install an IPK or APK matching the firmware | Update manually according to the installation method | `sudo knock update` | Install the SPK in DSM Package Center | Windows manager |
| Separate admin panel password | Uses the fnOS/CGI entry point | Supported | Supported | Supported | Supported; local `127.0.0.1` admin entry only | Uses the DSM desktop CGI entry point | Supported; local `127.0.0.1` admin entry only |

The table reflects runtime capabilities reported by the server. Some unavailable features remain visible with an explanation, while others are hidden entirely. OpenWrt no longer provides Direct mode, host-firewall management, or Smart Connect. It can still run Host routing, Protocol mappings, and built-in tunnels, but OpenWrt's own firewall must allow the ports. Windows does not provide direct mode, built-in FRP / Cloudflared, Smart Connect, or SSH Security. Its gateway listens on all interfaces at `7999` by default, but public reachability still depends on firewall rules, NAT, and network policy. Synology DSM 7 SPK also does not provide direct mode, host-firewall management, Smart Connect, or SSH Security. Remote SSH targets remain available on every platform. A local PTY is available, disabled by default, on the standard fnOS FPK, OpenWrt, Linux, and macOS; it runs with the fn-knock service identity. Docker, Synology, Windows, development runtimes, and Knock Lite provide remote SSH only.

If the app on an fnOS device is named `Knock Lite`, it is a native non-root package rather than the full FPK shown in the table. It supports Host proxying, authentication, DDNS, certificates, WAF, built-in tunnels, monitoring, and remote-SSH Web Terminal, but not a local PTY, Direct mode and the host firewall, network optimization, fnOS certificate-store sync, or in-app updates. To gain full host integration, export a Lite backup and stop Lite before installing the standard FPK from the official website and importing the archive. Do not let both instances compete for the same ports.

## Settings Map

| Tab or section | When it appears and what it manages | Details |
| --- | --- | --- |
| `Mode` | Always visible; selects direct, reverse-proxy, or subdomain mode and its routing method | [Choose a Runtime Mode](/en/quick-start/run-modes) |
| `FRP`, `Cloudflared` | Visible in reverse proxy mode when the platform has the corresponding capability; downloads and installs tunnel binaries | [NAT Traversal and Tunnels](/en/guide/tunnel) |
| `ACME` | Visible when the platform supports it and is not Windows; manages the `acme.sh` resource and default CA | [TLS Certificates and HTTPS](/en/guide/ssl) |
| `Location` | Configures the IP geolocation database and CIDR location database | [IP Geolocation](/en/guide/ip-location) |
| `fnOS` | Manages fnOS Share Bypass, port-icon takeover, available network optimizations, and FN Connect WAF ingress on the standard FPK | [fnOS Share Bypass](/en/guide/fnos-share-bypass), [WAF](/en/guide/waf#route-fn-connect-traffic-through-waf) |
| `Blocking` | Configures the scanner firewall, trigger window, thresholds, and exemptions | [Automated Scan Blocking](/en/guide/scanner-interception) |
| `Features` | Controls date/time display, home-page entry status, the fnOS console application bar, Passkey binding prompts, automatic HTTPS, SSH Security, protocol mappings, Wake-on-LAN, sidebar ordering, and the Smart Connect entry | [Wake-on-LAN](/en/guide/wake-on-lan) and the corresponding feature documentation |
| `Gateway` | Manages authentication caching, reverse-proxy throttling, crawler blocking, the portal, visibility, and Host-level forwarding options | See below |
| `Update` | Check updates and release notes; installation depends on the deployment | [Dashboard and updates](/en/guide/dashboard-and-update) |
| `WAF`, `Logs` | Manages HTTP rule protection and structured request logs | [Web Application Firewall (WAF)](/en/guide/waf), [Request Logs](/en/guide/request-logs) |
| `Terminal` | Visible on every package; manages remote SSH targets and sessions, plus the optional local PTY where supported | [Web Terminal](/en/guide/web-terminal) |
| `Sessions` | Manages standard sessions, Remember me, post-login IP authorization, and IP drift | [Sessions, Source-IP Authorization, and IP Changes](/en/guide/session-management) |
| `Panel` | Visible on Docker, OpenWrt, Linux, and Windows; changes or resets the separate admin panel password | See below |
| `Challenge` | Uses PoW or Cloudflare Turnstile before sign-in | [Challenge](/en/guide/captcha) |
| `Maintenance` | Manages automatic backups, manual exports, imports, and data cleanup | See below |

## Sidebar Menu Order

Under `System settings → Features → Sidebar menu order`, drag menu items to change the order of the left navigation for this instance. The order saves automatically when a drag ends. Select `Restore default order` to remove all custom ordering.

The page lists only entries visible under the current runtime mode and feature switches. Temporarily hidden entries keep their place in the full order and return to the same relative position when the feature is enabled or the mode changes; they are not appended arbitrarily. This setting changes navigation order only and does not enable, disable, or grant access to any feature.

The desktop sidebar can collapse to an icon rail. Its state is saved in the instance display settings and survives refreshes. Failed saves show an error and restore the previous state.

## Date and Time Display

`System settings → Features → Date and time display` controls time fields that use the shared display component in the admin console:

- `Human-friendly` is the default and shows relative values such as “a few minutes ago” or “yesterday.” Hover, or tap on a touch device, to see the full date and time.
- `Full time` shows the localized full date and time directly. Hovering or tapping instead provides the relative value.

The selection is stored in instance configuration and applied throughout the admin console. It does not change the server time zone, system clock, original log timestamps, or protocol-mapping schedules. Use server time and time zone when troubleshooting scheduled tasks.

## fnOS Console Application Bar

The standard fnOS FPK and `Knock Lite` can enable `Show application list at the top of the console` under `System settings → Features`. It is off by default. When enabled, a horizontally scrollable shortcut bar appears above the admin content and opens each service in a new tab. Docker, OpenWrt, Linux, Synology, and Windows do not show this switch.

With Host routing, the bar lists enabled non-authentication Hosts using portal names, icon settings, and group order. In path mode, saved path mappings supply entries when no Host entries are available. Public links use the gateway's configured public scheme and port, independently of the admin page's HTTP/HTTPS scheme. FRP uses the public HTTPS port; managed tunnels and edge entries omit the relevant standard port. When smart LAN detection is enabled, the bar also selects eligible upstream links according to the source; loopback, invalid targets, and static mappings retain gateway links.

The bar switch does not enable or publish mappings. Gateway links retain mapping authentication and service scopes; direct LAN targets use the upstream application's authentication. If the bar is empty, check available mappings. If links fail, check the public entry or LAN routing; see [Gateway Portal](/en/guide/gateway-portal).

## Runtime mode switching and Smart Connect fallback

Changing runtime mode saves a candidate configuration, then synchronizes Smart Connect, gateway routes, and platform runtime state in sequence while preventing those synchronization steps from waiting on one another. Keep the page open while switching, then verify the new entry path as instructed by the result message.

On the standard fnOS FPK with Smart Connect support, if the local IP or `dnsmasq` cannot synchronize during the change, fn-knock completes the mode switch but automatically disables Smart Connect and shows a warning instead of letting DNS split-horizon failure block the entire operation. Check the local IP, root domain, and `dnsmasq` write access before enabling Smart Connect again under `System settings → Features`. A failure while applying gateway routes or firewall state still triggers an attempted rollback to the previous configuration. Keep a LAN or console entry available, read the error, and do not switch repeatedly through several modes.

## Additional Firewall Ports on the Standard fnOS FPK

The standard fnOS FPK with host-firewall capability can preserve ports outside fn-knock's automatically managed set under `System settings → Mode → Actions → Additional allowed ports`. Docker, OpenWrt, Linux, Synology, Windows, and `fn-knock Lite` do not show this action; manage their ports in the host, router, or cloud firewall instead.

The dialog shows automatically allowed ports, custom entries, and the effective allowlist. Choose `Add port` or `Add port range`; single ports and ranges share a limit of `128` entries. Ports must be integers from `1–65535`. Ranges include both endpoints and require the start to be lower than the end. Single ports must be unique; ranges cannot overlap each other or contain manually added single ports. Each entry allows both TCP and UDP.

For FTP, add control port `21` and the passive range configured on the server, such as `50000–51000`. After `Save and apply`, check the effective allowlist. Unsaved additions and deletions only change the draft. Automatically allowed ports need no duplicate entry; only add service ports that require external access.

Saving follows the runtime mode currently saved by the backend:

- Direct or Subdomain mode immediately rebuilds `FN-KNOCK-FW` and merges automatic and additional ports.
- Reverse-proxy mode does not create `FN-KNOCK-FW`; it retains the list and applies it after switching to Direct or Subdomain mode.
- If `Automatically manage the system firewall` is disabled, switching to Subdomain mode requires a manual reset from `Actions`; Direct mode still manages the firewall.
- An unsaved mode selection on the page does not affect this operation. The dialog's `Current saved mode` is authoritative.

Saving rebuilds fn-knock's managed chain as a whole. It does not replace router port forwarding, cloud security groups, or authentication in the upstream service. Before removing a port, confirm that no remote administration path depends on it.

## Basic Gateway Settings

Settings at the top of `System settings → Gateway` are synchronized directly to the Go gateway. The Host-level editor is available only for Host routing in subdomain mode, and the auth service Host does not appear in the editable list.

| Setting | Behavior and considerations |
| --- | --- |
| `Successful auth cache duration` | Caches a successful result for the same client and authentication target; `0` validates every request in real time |
| `Failed auth cache duration` | Caches a failed authentication result; `0` does not reuse denials. When troubleshooting a recent permission change, account for an earlier failed result that may not have expired |
| `Enable gateway reverse proxy throttling` | Limits traffic per client IP using requests per second and burst tokens, then closes connections directly for the configured penalty period |
| `Block crawler requests` | Blocks requests recognized as crawlers by the gateway; it does not replace WAF or stop requests that bypass the gateway |
| `Unmatched routes` | `Show error page` returns a friendly page; `Reset connection` terminates requests that match no configured route |
| `Show error information when the upstream fails` | Defaults to `Show less`; choose `Show more`, or `Block connection` to abort failed requests without an error page |
| `Portal settings` | Controls the app switcher shown after sign-in |
| `Visibility` | Limits which sources can reach the gateway by region or CIDR |
| `Proxy headers` | Controls whether the gateway sends `X-Forwarded-*` to specified Targets |
| `Host response` | Controls whether the gateway preserves the visitor's requested `Host` for specified Targets |
| `Path responses` | Adds path-level proxying or fixed responses to application Hosts |

The initial reverse-proxy throttling configuration allows `100` requests per second and `200` burst tokens per client IP, with a `30`-second penalty after exceeding the limit. Requests terminated directly by throttling are not written to request logs. If a client connection closes without a corresponding log entry, check this layer as well. Host-level switches in the UI are ultimately compiled by Target: when multiple Hosts point to the exact same Target, they share proxy-header and Host-preservation behavior.

### Unmatched routes and upstream errors

Unmatched routes default to `Show error page`, which returns a welcome, selection, or error page. With `Reset connection`, HTTP/1.x connections are reset and the current HTTP/2 stream is aborted. Default-domain fallback is temporarily disabled, but its saved configuration is retained and resumes when you switch back to the error page. Request logs label these requests as unmatched-route blocks.

`Show error information when the upstream fails` defaults to `Show less`: visitors see only that the upstream is unavailable, without its internal IP, port, or connection failure. `Show more` returns the complete connection error and can expose network topology, so use it only briefly in a controlled environment. With `Block connection`, an upstream connection failure produces no error page: the gateway resets HTTP/1.x connections or aborts the current HTTP/2 stream. This suits an entry point that should not reveal a gateway page to probes, but clients will see an abrupt disconnect.

### Responses for manually disabled domains

`System Settings → Gateway → Disabled domain behavior` defaults to a blocking page indicating that the service is unavailable. Selecting connection abort returns no page: HTTP/1 closes the connection, while HTTP/2 and HTTP/3 abort the current stream. This affects manually disabled subdomains only. It does not change out-of-schedule messages or replace unmatched-route and upstream-error policies.

The selection page has its own switch; see [Built-in Gateway Pages](/en/guide/gateway-built-in-pages). When disabled, requests that would open it also follow the unmatched-route policy.

## Verification Order After Changing Settings

1. Keep one working admin entry point available on the LAN.
2. After changing the runtime mode, Host, certificate, or gateway settings, wait for the page to confirm that runtime synchronization has completed.
3. Test the authentication flow in a private browsing window, then test the application Host from a real external network.
4. Check the client IP, route type, authentication result, and upstream Target in request logs.
5. Check Event Center for synchronization, certificate, tunnel, or notification errors.

For gateway throttling, WAF, and scan blocking, begin in observation mode or with a permissive configuration. These controls may affect health checks, third-party callbacks, application updates, or long-lived client connections.

## Backup and Restore

Automatic and manually exported `.knock` archives contain configuration, certificate private keys, TOTP seeds, and several types of service credentials. Treat them as plaintext backups of secret material. Automatic backups are disabled by default; when enabled, they are stored in the server data directory with a configurable interval and retention period. If that directory is on the same disk or container volume as the active data, it is not a substitute for an off-device backup. Import is replacement, not merge: it replaces the current fn-knock application data and then synchronizes gateway, WAF, SSL, and other runtime state. A synchronization warning does not trigger an automatic full rollback.

See [Backup, Restore, and Data Cleanup](/en/guide/backup-and-restore) for archive security, versions, the `128 MiB` limit, platform entry points, full restoration acceptance testing, and failure handling. An application backup is not a filesystem or container-volume backup, and it does not include external DNS, host-firewall configuration, or upstream application data.

## Clear All Data

`System settings → Maintenance → Cleanup → Clear all data` completely reinitializes the current instance. You must enter `Clear all data` to confirm. The operation clears server-side configuration, accounts, sessions, logs, and other application storage, then clears local data in the current browser and reloads the page.

The database schema and previously exported backup files do not restore content automatically. This action cannot be undone; use it only after verifying that a usable backup exists and intentionally deciding to reinitialize the instance.

## HTTP/3

Enable HTTP/3 under `System settings → Gateway → HTTP/3`; it is off by default. A valid TLS certificate and a reachable UDP gateway port are required. With the default gateway, allow `7999/udp` while retaining TCP. Publish UDP in Docker and configure OpenWrt, router, and host firewall rules as needed; the switch does not configure the entire incoming path.

Set the advertised public port to the UDP port clients actually reach, or `0` to use the local port. This changes advertisement only, not port forwarding. Local listener status and connection statistics do not prove public UDP reachability. With a CDN or Cloudflare Tunnel, browser-to-edge HTTP/3 does not prove edge-to-fn-knock HTTP/3. Verify the protocol in browser network tools from an external network and check listener status.

## Admin Panel Password

The admin panel password on Docker, OpenWrt, Linux, and Windows is separate from visitors' gateway sign-in credentials. If you forget it, use the reset command or manager documented for that deployment. A reset clears only the panel password, panel sessions, and sign-in backoff; it does not delete application mappings or certificate configuration.

- [Dashboard and System Updates](/en/guide/dashboard-and-update)
- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
- [Security Boundaries and Baseline](/en/guide/security)
- [Deploy on Synology DSM 7 (x86_64 / ARM)](/en/quick-start/synology-deployment)
- [Deploy on Windows (x86_64)](/en/quick-start/windows-deployment)
