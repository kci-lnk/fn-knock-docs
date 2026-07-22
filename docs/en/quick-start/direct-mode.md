---
lang: en-US
title: "Direct Access on Original Ports"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: f6e49496052b564f36d0462a6ca4f524aa5530599256e19349b234043cabff98
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Direct Access on Original Ports

Use this pattern when the device accepts inbound traffic from the public internet and users must connect directly to SSH, Remote Desktop, or another original TCP/UDP port. A visitor first authenticates through the fn-knock gateway, after which fn-knock temporarily opens the protected port for that visitor's public egress IP.

- Network topology: direct public ingress
- Routing: original TCP/UDP ports
- Access control: post-login IP authorization
- Admin location: `System settings → Mode → Direct mode (not recommended)`

Direct mode depends on the host firewall and is intended primarily for the native fnOS FPK and OpenWrt. Docker, Synology DSM 7 SPK, and Windows deployments do not let fn-knock manage the host firewall and must not use this pattern.

## When to use this pattern

Before enabling Direct mode, confirm all of the following:

- `Direct mode (not recommended)` is visible in the admin interface and this deployment supports host firewall management.
- The device has usable public IPv4 or IPv6 connectivity, or controllable port forwarding.
- You need to protect original service ports rather than HTTP/HTTPS websites.
- You have local or console access for firewall recovery if a configuration error locks you out.

Direct mode is not a NAT traversal solution. Without inbound connectivity from the public internet, use [NAT Traversal with Subdomain Routing](/en/quick-start/reverse-proxy-mode). For websites, prefer [Public IP Access with Subdomain Routing](/en/quick-start/subdomain-mode).

fn-knock controls only the network perimeter. Keep SSH, Remote Desktop, and every other upstream service patched, restrict privileges, and retain each service's own authentication.

## Request flow

1. The visitor opens the fn-knock gateway from the public internet on the default port, `7999`.
2. The visitor signs in.
3. If the session settings and credential permit it, fn-knock creates a temporary authorization for the visitor's current egress IP. Otherwise, an administrator must add the IP manually.
4. The visitor connects to the original service port from the same egress IP.
5. When the session or authorization expires, the service port rejects that IP again.

## Before you begin

Complete these steps before switching modes:

- Record the admin endpoint, gateway endpoint, and every port that needs protection.
- Confirm that at least one of TOTP, password login, Passkey, or OIDC can sign in successfully.
- Back up the current run mode, routes, and firewall configuration.
- Keep LAN or device-console access available as a recovery path.

Switching modes changes firewall rules. Never enable Direct mode for the first time over your only remote management connection.

## 1. Enable Direct mode

Open `System settings → Mode`, select `Direct mode (not recommended)`, and save.

After enabling it, verify that:

- The fn-knock gateway port is reachable through the intended public endpoint.
- Protected ports such as SSH and Remote Desktop are closed to unauthorized IPs by default.
- The LAN or another explicitly retained management source can still recover the configuration.

The native fnOS FPK and OpenWrt use different firewall implementations. Immediately test from an external network without signing in and confirm that the service port is actually blocked.

## 2. Configure the authentication endpoint

Configure at least one sign-in method and make sure the fn-knock gateway is reachable from the public internet. Example addresses:

- `auth.example.com:7999`
- If public port `443` forwards to gateway port `7999`, use `https://auth.example.com`

Use HTTPS for the authentication endpoint so credentials and session data are not sent in cleartext. See [TLS Certificates and HTTPS](/en/guide/ssl) for certificate setup.

## 3. Configure post-login IP authorization

Open `System settings → Sessions` and choose how IP authorization works after sign-in:

| Mode | When to use it |
| --- | --- |
| Follow session | Recommended for Direct mode; keeps the corresponding IP authorized for the lifetime of the session |
| Do not authorize IP automatically | Keeps only the browser session; original ports still require a manually added IP authorization |
| Custom | Uses a fixed authorization window |

Direct mode protects network ports. If automatic IP authorization is disabled, signing in through the browser does not automatically open SSH or Remote Desktop.

A sign-in credential with a restricted service scope never creates automatic IP authorization. This applies to a scoped TOTP, any Passkey or OIDC identity linked to it, and username/password accounts with a restricted service scope. This prevents a limited credential from gaining broader access through its source IP. For Direct mode, use a credential without service-scope restrictions or manually add the current public IP or CIDR, then retest the port from an external network.

## 4. Configure the domain, DDNS, and certificate

If your public address changes, use [DDNS](/en/guide/ddns) to update `auth.example.com`. Publish only address records that are actually reachable from the public internet.

Configure a trusted certificate for the authentication domain. Automatic HTTPS is available only on supported deployments. Docker and OpenWrt require you to provide the certificate or terminate TLS at an upstream proxy.

## 5. Verify from an external network

Test over cellular data or another external connection:

1. Connect to the protected port without signing in. The connection should be rejected or time out.
2. Open the authentication endpoint and sign in.
3. Connect to the protected port again from the same network. You should reach the service's own authentication flow.
4. Under `System settings → Sessions` or in the IP authorization list, confirm the current egress IP and expiration time.
5. Sign out or wait for the authorization to expire, then confirm that the port is closed again.

When testing SSH, open a new connection. An established connection cannot prove that the new firewall rules are working.

## Egress IP changes

Mobile networks, corporate proxies, and some residential ISPs may change your egress IP frequently. Existing authorization does not automatically follow a new address; reopen the authentication endpoint and sign in again.

For tighter source restrictions, manually add a stable IP or CIDR. Do not add an overly broad mobile-network range, as that would expose the protected ports to many unrelated users.

## Deployment limitations

| Deployment | Direct mode | Notes |
| --- | --- | --- |
| Native fnOS FPK | Supported | Can manage the host firewall |
| OpenWrt package | Supported | Rules apply to the router firewall |
| Docker Compose | Not supported | A container cannot manage the host firewall on its behalf |
| Synology DSM 7 SPK | Not supported | The package does not modify the DSM host firewall |
| Windows x86_64 | Not supported | Installer-created application rules are not equivalent to Direct mode authorization; the admin interface does not expose this mode |

## Troubleshooting

| Symptom | Check first |
| --- | --- |
| Sign-in succeeds, but the original port is still unreachable | Post-login IP authorization mode, current egress IP, and port forwarding |
| The service port works without signing in | A router or host firewall rule is still bypassing fn-knock |
| Remote management is lost after enabling the mode | Use local or console access to recover the firewall and run mode |
| IPv4 is protected, but IPv6 remains exposed | The IPv6 firewall was not restricted as well, or the AAAA record points to another endpoint |
| Authorization expires too quickly | The session lifetime is too short, or the egress IP has changed |
| Sign-in succeeds, but no automatic IP authorization appears | The credential has a restricted service scope; use an unrestricted credential or add the IP / CIDR manually |
| Direct mode is missing in Docker | This is a deployment limitation; use subdomain routing instead |

See the [FAQ](/en/faq) for the complete troubleshooting index.

## Related documentation

- [Choose a Deployment and Access Pattern](/en/quick-start/deployment-options)
- [Ports, Endpoints, and URL Paths](/en/quick-start/ports-and-entrypoints)
- [Sessions, Source-IP Authorization, and IP Changes](/en/guide/session-management)
- [IP Allowlist](/en/guide/whitelist)
- [Security Model and Baseline](/en/guide/security)
