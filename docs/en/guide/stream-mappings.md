---
lang: en-US
title: "TCP/UDP Stream Proxying"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 5eb652b6816df5e9b524e175a14813ebacb680ae128349c765910f595871d838
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# TCP/UDP Stream Proxying

`Protocol mappings` add TCP or UDP listening ports for non-HTTP services such as SSH, databases, and DNS. They do not inspect a domain Host or URL path; each rule forwards the byte stream on one external port to a `host:port`.

This feature is available only as an addition to direct public `Subdomain mode`. Continue to use [Subdomain Routing](/en/guide/subdomain-proxy) for web services, or see [Path-based Reverse Proxy (Compatibility Mode)](/en/guide/reverse-proxy) for legacy path rules.

## Requirements

`Protocol mappings` belongs only to direct-public Subdomain routing. It appears in the sidebar when:

1. `System settings → Mode` is set to `Subdomain mode`.
2. `System settings → Features → Protocol mapping` is enabled, or saved protocol rules still need to be managed.

Turning off the feature switch stops every Protocol mapping listener but does not delete rules. As long as rules remain, the management entry stays visible with a disabled notice so you can fix or delete them. `Sync gateway` is unavailable while the feature is disabled. Enabling it again restores listeners for the remaining rules. Leaving Subdomain mode also disables the feature and stops its listeners while preserving the rules.

Although `Reverse proxy mode → Subdomain mapping` also uses Host-based routing, it does not provide Protocol mappings. To carry another protocol through FRP or Cloudflare, configure it separately on that platform; you cannot reuse fn-knock's HTTP Host entry point.

## Routing Model

```text
TCP :2222 -> 192.168.1.20:22
TCP :13306 -> 127.0.0.1:3306
UDP :53   -> 127.0.0.1:53
```

A domain only resolves to the entry-point address and does not participate in protocol dispatch. A client can connect to `nas.example.com:2222`, but the selected rule depends only on the transport protocol and port.

## Rule Fields

| Field | Description |
| --- | --- |
| `Transport protocol` | `TCP`, `UDP`, or both; selecting both creates two rules when saved |
| `External port` | The port used by the client, from `1-65535` |
| `Comment` | Optional context for distinguishing and searching similar mappings |
| `Target address` | Plain `host:port`, without `http://` or a path |
| `Require auth` | Checks fn-knock source-IP authorization before accepting the connection |

The same port can have separate TCP and UDP rules, such as `53/tcp` and `53/udp`. A protocol-and-port pair cannot be duplicated.

An external port cannot forward to the same port on the local device. For example, `TCP :3306 -> 127.0.0.1:3306` creates a local forwarding loop and is rejected during save and enable. Validation includes `localhost`, loopback and unspecified addresses, and current local interface addresses. Change either the external or target port.

An existing same-port local-loop rule can automatically disable Protocol mappings. Keep the feature disabled, delete or correct the invalid rule on this page, then enable it again under `System settings → Features`. Repeatedly synchronizing an invalid configuration will not repair it.

The Target must be reachable from the fn-knock runtime environment. In Docker, `127.0.0.1` refers to the container itself; use an address reachable from the container for a host or LAN target.

The list search matches protocol, External port, Comment, Target address, service-detection results, and authentication state. You can edit a Comment directly in the list; use the mapping editor for protocol, port, Target, or authentication changes.

## Service Detection and Strict Protocol Validation

A newly saved Protocol mapping remains enabled and initially shows `Strict validation off`. After saving, open the rule's actions menu and select `Probe`. The system actively connects to the Target. When the result identifies a strictly validatable service with high confidence, it records the service profile and enables `Strict protocol validation`. When the result can identify only the service type, it records that profile but leaves strict validation off. If probing fails or is inconclusive, the mapping remains enabled with strict validation off.

Upstream authentication can make an HTTP probe see only `401`, preventing it from reliably distinguishing ordinary HTTP from a service such as WebDAV. In that case, select `Specify service type` from the actions menu and verify what is actually running at the Target. If that service supports strict validation, you can choose `Confirm and enable validation`; an identification-only service can still be recorded while strict validation remains off. Selecting the wrong strict type rejects legitimate connections as a protocol mismatch. Clearing a manually specified service type turns off strict validation but does not disable the mapping.

Changing a rule's transport, External port, or Target invalidates its previous service profile and turns off strict validation, but the mapping remains enabled. Probe the new Target or specify its service type before relying on strict protocol filtering. An already verified service profile is preserved only when these three fields remain unchanged and you edit a field such as the Comment or login requirement.

Existing rules may appear as legacy or as not using strict validation. Updating the application does not assign a service type to them automatically. Verify each Target and run `Probe`; until then, the mapping can continue forwarding with strict validation off.

## Traffic Details and Active IPs

The `Traffic` column aggregates each mapping separately by `TCP/UDP + external port`. Open the details panel to see real-time inbound and outbound rates, active connections, total traffic, and historical traffic for the last 15 minutes, 1 hour, 6 hours, 1 day, or 7 days.

The same panel lists recently active source IPs. You can blacklist an IP, remove it from the blacklist, or mark it as local without leaving the mapping page. These actions use the global blacklist and local-IP rules; review [General Blacklist](/en/guide/general-blacklist) before changing a shared rule.

Traffic history reflects bytes observed by the protocol gateway and is intended for operations and troubleshooting, not billing. A UDP source is treated as recently active for a short window even though UDP has no connection state. A process restart or cleanup policy may shorten the available history.

## Authentication Checks Source IP and Credential Scope

Clients such as SSH, MySQL, and Redis do not open an fn-knock sign-in page. With `Require auth` enabled, use this flow:

1. Open the fn-knock web entry point in a browser and sign in.
2. If `System settings → Sessions → Post-login IP authorization` is not disabled, sign-in creates protocol access for the current public egress IP; otherwise, add the IP/CIDR manually.
3. Connect to the external port from a protocol client using that same egress IP.

With `All scopes`, protocol access applies to every protocol mapping that requires authentication. With `Custom scopes`, select the exact `TCP/UDP + external port` under `Auth → Permission`. The system authorizes the current source IP only for the selected mapping; an unselected protocol or port is still denied. Changing the credential scope also reconciles protocol access for existing sessions.

If the egress IP changes, authorization expires, post-login IP authorization is disabled, or the protocol client uses another network, the connection is rejected immediately. Sign in again or update the manual authorization. A browser Cookie is not sent with a TCP or UDP connection; the protocol entry point checks source IP, protocol, and external port. Manual IP/CIDR authorization remains an independent allow path. See [Sessions, Source-IP Authorization, and IP Changes](/en/guide/session-management) for sessions and IP changes, and [Authentication, Sessions, and Service Scopes](/en/guide/auth) for custom scopes.

Protocol clients have no browser Cookie, so the gateway associates the source IP confirmed by the current session with the protocol grant. While the session remains valid, its current source IP stays eligible for the full lifetime of that protocol grant. Additional IPs observed through mobile-network drift are valid only within the configured mobility window. Once the session or protocol grant expires, connections are denied; an IP is not retained permanently merely because it was used for an earlier sign-in.

Disabling `Require auth` makes the listening port a public forward. You must still configure the target service's own SSH keys, database password, TLS, and least-privilege access.

## Allow Selected Sources to Bypass Login

For a mapping with `Require auth` enabled, open its actions menu and select `Configure login bypass` to let selected sources connect without signing in through the web UI first. Conditions can match an exact source IP, a CIDR, or a source region. All conditions in one group use AND; separate groups use OR. Sources that do not match still follow the normal login-authentication flow.

Region conditions are compiled into a fixed CIDR set when the policy is saved; they are not rewritten automatically when the location database changes. Save the policy again after such an update. A very broad CIDR or a permissive rule made entirely of negative conditions requires a second confirmation. Each mapping can contain up to `16` groups with up to `16` conditions per group.

Login bypass skips only fn-knock's login check. It does not skip service detection or strict protocol validation, and it does not replace the Target's own accounts, keys, or TLS. Turning off `Require auth` already makes the mapping directly reachable from every source, so an enabled bypass policy is disabled while its rules may remain as a draft. Review the policy again if authentication is later re-enabled.

## Global Open Window

Open the menu beside `Add mapping` on the Protocol mappings page and select `Schedule enable or disable` to set one daily open window for all TCP and UDP rules. Times use `HH:mm` and repeat according to the server's local time. The enable and disable times must differ. A window such as `22:00-06:00` automatically crosses midnight into the next day.

Schedule-closed and feature-disabled are different states:

- Disabling the feature switch stops all protocol listeners.
- During a schedule-closed period, ports remain bound, but new TCP connections are rejected and UDP packets are dropped.
- TCP sessions established before the closed period are not forcibly disconnected.
- New connections are accepted again at the next open time without another gateway synchronization.

This runtime schedule applies to every protocol mapping; individual ports cannot have separate windows. The admin page uses server time to show `Scheduled open` or `Scheduled closed`. If the browser or server time zone is wrong, both the display and effective access window may be unexpected, so correct the server clock and time zone first.

### `local_exempt`

The authentication service classifies loopback, private, and link-local sources identified by the gateway as `local_exempt`. Connections from these sources to an authenticated Protocol mapping are treated as local-network access and do not require a prior web sign-in.

Therefore:

- A successful LAN connection does not prove that public authentication works.
- If another NAT or proxy sits in front of the port, confirm that the gateway does not see the proxy's private address.
- Test from a genuine external network and compare its source IP with the session record.

## Save, Synchronize, and Open the Firewall

Create, edit, delete, and Comment updates are saved in sequence so consecutive actions do not overwrite each other. Rule changes that affect listeners refresh the gateway and open the port on supported deployments. Comments are used only for management and search and do not affect forwarding. `Sync gateway` explicitly replays the complete configuration; you normally do not need to select it after every edit.

Platform boundaries:

- The native fnOS FPK can synchronize protocol ports when automatic firewall management is enabled.
- fn-knock no longer manages the OpenWrt host firewall. Protocol mappings can still listen, but an administrator must allow the corresponding ports manually in the OpenWrt firewall.
- Docker neither publishes a new host port nor modifies the host firewall. Explicitly publish fixed ports in the container startup configuration and manage host and router rules manually. Adding a port only in the admin console cannot expose it publicly from an already-running Compose deployment.
- If you manage the gateway runtime yourself, opening ports remains the system administrator's responsibility. Do not assume that fn-knock modifies the host firewall.

Regardless of automatic firewall support, the router's port forwarding, cloud security group, and upstream network policy must also allow the port.

## Verification and Troubleshooting

1. Confirm that the current mode is Subdomain mode with direct public ingress and that the feature switch remains enabled.
2. Check that the protocol and External port match the client.
3. Connect to the Target directly from the fn-knock runtime environment.
4. Check container port publishing, the host firewall, router forwarding, and cloud security group.
5. With authentication enabled, confirm that the browser sign-in and protocol client use the same public egress IP, post-login IP authorization is enabled, and a custom credential includes the current protocol and external port.
6. Confirm that server time is inside the global open window. During a schedule-closed period, a port may still appear in a scan but does not forward new traffic.
7. If the listener is still absent after saving, select `Sync gateway`, then review status and logs.

See [System Settings and Maintenance](/en/guide/system) for the related feature switch.
