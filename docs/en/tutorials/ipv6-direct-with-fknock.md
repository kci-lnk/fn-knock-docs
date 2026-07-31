---
lang: en-US
title: "Public IPv6 Access and Original-Port Authorization"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 1b966bf0e5e777f72ccf476e1ed5a739fb1539a6681444f7926f3923585eaae7
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Public IPv6 Access and Original-Port Authorization

Direct mode lets visitors sign in through the gateway first, then use an IP allowlist to reach original ports exposed by fnOS or other services. It is intended for IPv6 environments that genuinely require original-port access, not as the preferred way to publish web applications.

This mode requires fn-knock to manage the host firewall, so it is available only with the standard fnOS FPK. Knock Lite, Docker, OpenWrt, generic Linux, Synology DSM 7 SPK, and Windows do not support Direct mode.

## Prerequisites

- The device has a globally routable IPv6 address.
- The router and host firewall allow IPv6 traffic to the gateway entry point.
- You have an AAAA record or can update one through DDNS.
- An IPv6 client outside the same LAN is available for testing.
- You have prepared at least one sign-in credential that can be used to recover access.

Confirm the address family from both the device and an external network. Receiving a `fe80::/10` link-local address or a private ULA does not mean that the device has public IPv6 connectivity. The AAAA record must point to the device's current, globally routable address. Even when a residential connection does not require IPv4 NAT port forwarding, the router's inbound IPv6 firewall may still reject connections by default.

Record the following recovery information before switching modes:

- The fn-knock admin entry point and LAN address.
- A backup of the current firewall configuration.
- The gateway entry point and original ports you plan to protect.
- A method for restoring the rules from the LAN or device console.

## Configuration

1. In `DDNS Management`, select `IPv6 only`. The address source can be selected automatically or pinned to the actual public interface. Docker cannot use the Direct mode described in this tutorial.
2. After synchronization, query the AAAA record from an external DNS resolver. Confirm that it returns the device's current global IPv6 address, not an old prefix, temporary address, or another device.
3. In the router's IPv6 firewall, allow inbound traffic only to the fn-knock gateway entry point. Do not broadly expose the original ports you intend to protect, or traffic will bypass dynamic authorization.
4. Under `System settings → Mode`, select `Direct mode (not recommended)`. Read the confirmation prompt; after saving, the system synchronizes firewall rules for the selected mode.
5. Under `Auth`, configure a TOTP credential or username and password. Then open `System settings → Sessions` and set post-login IP authorization to `Follow session` or the required fixed duration.
6. Configure an HTTPS certificate for the gateway domain. The certificate must cover the Host that visitors use. See [TLS Certificates and HTTPS](/en/guide/ssl) for the requirements to issue and deploy a certificate through automatic HTTPS.
7. From an external network, open the gateway entry point, for example `https://auth.example.com:<gateway-port>`, and sign in.
8. Connect to the required original service port. Confirm that the current public IPv6 address is active in the IP authorization list.

A TOTP credential, username/password account, Passkey, or OIDC credential with a restricted service scope does not create automatic IP authorization. This prevents a limited credential from expanding its privileges through the source address. To open original ports automatically in Direct mode, use a credential without service-scope restrictions or manually add the required IPv6 address / CIDR.

## Firewall verification sequence

Open a new connection for every step. Do not reuse an established SSH, browser, or app connection:

1. While signed out, the gateway entry point should be reachable, while a protected original port should reject the connection or time out.
2. After signing in, connect to the original port from the same external network. You should reach the upstream service's own authentication.
3. Under `Whitelist` or in the session details, confirm the record type, IPv6 address, and expiration time.
4. Sign out or wait for the authorization to expire, then open another new connection. The original port should be rejected again.
5. Test from a different external network. Its unauthorized IPv6 address must not inherit access granted to the previous network.

## When the IP address changes

In Direct mode, later connections to original ports do not pass through the gateway. If the IPv6 prefix or client egress address changes, reopen the gateway entry point and sign in, wait for automatic IP authorization to synchronize, then retry the original service port.

A client may use a temporary privacy-extension address, and a mobile network may change its prefix. Do not authorize an oversized IPv6 range merely to avoid signing in again; a manually added CIDR authorizes the entire range.

## Verification and troubleshooting

- Test over a mobile network or another IPv6 network; home Wi-Fi may receive a local exemption.
- The AAAA record resolves correctly, but the connection fails: check the router's IPv6 firewall, ISP inbound policy, and host firewall.
- Sign-in succeeds, but the original port is unreachable: check the allowlist record, run-mode synchronization status, and whether the service listens on IPv6.
- No authorization appears after sign-in: check the session's IP authorization policy and whether the credential has a restricted service scope.
- The address occasionally points to an unreachable host: check the interface selected by DDNS, temporary IPv6 addresses, and prefix changes.
- The original port is reachable without signing in: immediately inspect the router, cloud security group, and manual firewall rules for an allow rule that bypasses fn-knock.

To roll back, use the LAN or device console to switch back to the previous run mode, restore the backed-up firewall rules, and remove any AAAA record that is no longer used. Restore administrative access before cleaning up temporary authorization records.

- [IP Allowlist](/en/guide/whitelist)
- [Dynamic DNS (DDNS)](/en/guide/ddns)
- [Choose a Runtime Mode](/en/quick-start/run-modes)
- [Direct Access on Original Ports](/en/quick-start/direct-mode)
