---
lang: en-US
title: "Sessions, Source-IP Authorization, and IP Changes"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: cfb19d7f25da7c40908361befa0f9fd47eab1438878efa1e32ee6c68e9a8d3d3
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Sessions, Source-IP Authorization, and IP Changes

`Sessions & Security` brings together `Sessions`, `Login backoff`, `Scanner blacklist`, and `General blacklist`. The `Sessions` tab appears only in Reverse proxy mode and Subdomain mode. Direct mode can still manage the other three types of security records; its main access-control points are the IP Allowlist and host firewall.

## Session List

A session includes its sign-in method, linked credential, current and historical source IPs, sign-in and expiration times, browser information, and comment. With fnOS Quick Authentication, it can also show attached-session status.

Available actions include:

- **Details:** Review source, browser identifier, and time information.
- **Comment:** Add a recognizable device or purpose name.
- **Kick:** Invalidate the session immediately without deleting the TOTP, Passkey, or account.
- **Trace:** Review how the session continued across different source IPs.

An expired or nonexistent session Cookie is cleared on a later request, and the visitor must sign in again. If the post-login redirect behaves unexpectedly, start again from the original application Host; do not copy or repeatedly refresh the authentication callback URL.

## Session Lifetimes and IP Authorization

Under `System settings → Sessions`, configure regular sign-in, `Remember me`, and post-login IP authorization separately. Regular and Remember-me lifetimes must both be at least 60 seconds, and Remember me cannot be shorter than the regular lifetime. A custom IP authorization must also last at least 60 seconds. Lifetimes and authorization modes affect only new sessions subsequently created by TOTP or Passkey; they do not retroactively rewrite issued Cookies, Redis sessions, or post-login IP authorizations.

| Post-login IP authorization | Behavior |
| --- | --- |
| Follow session | Automatic authorization for the current IP follows the session lifecycle |
| Do not authorize IP automatically | Creates only the browser session, without an additional automatic IP record |
| Custom | Creates a fixed-duration authorization for the current IP; signing out revokes it |

The manual IP Allowlist is independent of sessions and is not deleted when a user signs out.

A credential with `Custom scopes` does not create a general automatic IP record that can open arbitrary Hosts or original ports. If the scope includes an authenticated protocol mapping, the system uses the lifetime setting above to grant the current source IP access to that exact `TCP/UDP + external port`. Disabling post-login IP authorization also prevents these protocol grants from being created.

When post-login IP authorization is disabled, Host-based routing relies primarily on the browser Cookie. Once a root domain is configured, compatible Hosts under the same parent domain can share sign-in state. Hosts outside the shared Cookie domain require separate sign-ins. The page lists incompatible Hosts; review them after changing the root domain or authentication Host.

## IP Changes

Mobile networks, upstream proxies, and switching between Wi-Fi and cellular can all change the source IP. When `Relaxed trusted session IPs` is enabled, multiple IPs recently used by the same session are treated as trusted sources. The retention window can be set from 1 minute to 24 hours and does not change the session's own expiration. The Trace page records session creation and later recovery events.

This does not guarantee continuation across every network change. The new request must carry a valid session and pass through fn-knock again, and any preceding proxy must forward the real client IP. In Direct mode, subsequent connections to original ports do not pass through the gateway again; after an IP change, users normally need to return to the gateway entry point and sign in again.

## Troubleshooting Order

1. In the session list, confirm that the session is still valid and that its credential scope allows the target Host.
2. Confirm that Request Logs show the correct client IP.
3. Check whether the Trace contains a recovery event and whether it occurred within the mobility window.
4. Check whether automatic or manual IP authorization remains valid.
5. In Direct mode, authenticate again through the gateway entry point before retesting the original port.

## Login Backoff

Login backoff counts failed attempts by source IP over the latest hour and shows whether the source is restricted and how many seconds remain. If you confirm that you mistyped a credential and the source IP is correct, you can reset that individual IP. Resetting clears only the sign-in failure backoff; it does not delete the General blacklist, Scanner blacklist, sessions, or credentials.

When multiple people share an egress address, repeated failures by one user can affect others behind the same public IP. Identify the source of the failures before resetting. If the page shows a CDN or reverse-proxy node as the IP, fix real client-IP forwarding first.

- [Automated Scan Blocking](/en/guide/scanner-interception)
- [Global Blocklist](/en/guide/general-blacklist)

- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
- [IP Allowlist](/en/guide/whitelist)
- [Request Logs](/en/guide/request-logs)
