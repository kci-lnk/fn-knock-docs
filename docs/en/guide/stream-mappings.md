---
lang: en-US
title: "TCP/UDP Stream Proxying"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: dc06c83e625cd689de61e9022f3c0c0095814a7765046bb174c91f07f860d59f
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# TCP/UDP Stream Proxying

`Protocol mappings` add TCP or UDP listening ports for non-HTTP services such as SSH, databases, and DNS. They do not inspect a domain Host or URL path; each rule forwards the byte stream on one external port to a `host:port`.

This feature is available only as an addition to direct public `Subdomain mode`. Continue to use [Subdomain Routing](/en/guide/subdomain-proxy) for web services, or see [Path-based Reverse Proxy (Compatibility Mode)](/en/guide/reverse-proxy) for legacy path rules.

## Requirements

`Protocol mappings` appears in the sidebar only when both conditions are met:

1. `System settings → Mode` is set to `Subdomain mode`.
2. `System settings → Features → Protocol mapping` is enabled.

Turning off the feature switch clears existing protocol mappings; it does not merely hide the menu. The feature is also disabled when you leave Subdomain mode, so record any rules you still need before changing modes.

Although `Reverse proxy mode → Subdomain mapping` also uses Host-based routing, it does not provide Protocol mappings. To carry another protocol through FRP or Cloudflare, configure it separately on that platform; you cannot reuse fn-knock's HTTP Host entry point.

## Routing Model

```text
TCP :2222 -> 192.168.1.20:22
TCP :3306 -> 127.0.0.1:3306
UDP :53   -> 127.0.0.1:53
```

A domain only resolves to the entry-point address and does not participate in protocol dispatch. A client can connect to `nas.example.com:2222`, but the selected rule depends only on the transport protocol and port.

## Rule Fields

| Field | Description |
| --- | --- |
| `Transport protocol` | `TCP`, `UDP`, or both; selecting both creates two rules when saved |
| `External port` | The port used by the client, from `1-65535` |
| `Target address` | Plain `host:port`, without `http://` or a path |
| `Require auth` | Checks fn-knock source-IP authorization before accepting the connection |

The same port can have separate TCP and UDP rules, such as `53/tcp` and `53/udp`. A protocol-and-port pair cannot be duplicated.

The Target must be reachable from the fn-knock runtime environment. In Docker, `127.0.0.1` refers to the container itself; use an address reachable from the container for a host or LAN target.

## Authentication Checks Source IP and Credential Scope

Clients such as SSH, MySQL, and Redis do not open an fn-knock sign-in page. With `Require auth` enabled, use this flow:

1. Open the fn-knock web entry point in a browser and sign in.
2. If `System settings → Sessions → Post-login IP authorization` is not disabled, sign-in creates protocol access for the current public egress IP; otherwise, add the IP/CIDR manually.
3. Connect to the external port from a protocol client using that same egress IP.

With `All scopes`, protocol access applies to every protocol mapping that requires authentication. With `Custom scopes`, select the exact `TCP/UDP + external port` under `Auth → Permission`. The system authorizes the current source IP only for the selected mapping; an unselected protocol or port is still denied. Changing the credential scope also reconciles protocol access for existing sessions.

If the egress IP changes, authorization expires, post-login IP authorization is disabled, or the protocol client uses another network, the connection is rejected immediately. Sign in again or update the manual authorization. A browser Cookie is not sent with a TCP or UDP connection; the protocol entry point checks source IP, protocol, and external port. Manual IP/CIDR authorization remains an independent allow path. See [Sessions, Source-IP Authorization, and IP Changes](/en/guide/session-management) for sessions and IP changes, and [Authentication, Sessions, and Service Scopes](/en/guide/auth) for custom scopes.

Disabling `Require auth` makes the listening port a public forward. You must still configure the target service's own SSH keys, database password, TLS, and least-privilege access.

### `local_exempt`

The authentication service classifies loopback, private, and link-local sources identified by the gateway as `local_exempt`. Connections from these sources to an authenticated Protocol mapping are treated as local-network access and do not require a prior web sign-in.

Therefore:

- A successful LAN connection does not prove that public authentication works.
- If another NAT or proxy sits in front of the port, confirm that the gateway does not see the proxy's private address.
- Test from a genuine external network and compare its source IP with the session record.

## Save, Synchronize, and Open the Firewall

Saving a rule updates the configuration, refreshes gateway listeners, and opens the port on supported deployments. `Sync gateway` replays the complete configuration after several consecutive rule changes; you normally do not need to select it after every edit.

Platform boundaries:

- The native fnOS FPK and an OpenWrt runtime with root-level host capability can synchronize protocol ports when automatic firewall management is enabled.
- Docker neither publishes a new host port nor modifies the host firewall. Explicitly publish fixed ports in the container startup configuration and manage host and router rules manually. Adding a port only in the admin console cannot expose it publicly from an already-running Compose deployment.
- If you manage the gateway runtime yourself, opening ports remains the system administrator's responsibility. Do not assume that fn-knock modifies the host firewall.

Regardless of automatic firewall support, the router's port forwarding, cloud security group, and upstream network policy must also allow the port.

## Verification and Troubleshooting

1. Confirm that the current mode is Subdomain mode with direct public ingress and that the feature switch remains enabled.
2. Check that the protocol and External port match the client.
3. Connect to the Target directly from the fn-knock runtime environment.
4. Check container port publishing, the host firewall, router forwarding, and cloud security group.
5. With authentication enabled, confirm that the browser sign-in and protocol client use the same public egress IP, post-login IP authorization is enabled, and a custom credential includes the current protocol and external port.
6. If the listener is still absent after saving, select `Sync gateway`, then review status and logs.

See [System Settings and Maintenance](/en/guide/system) for the related feature switch.
