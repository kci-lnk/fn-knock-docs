---
lang: en-US
title: "Smart Connect"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 9cf7912a7fa75e589bb8838e64c052f7b9927e36d042da678921578c361ce24e
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Smart Connect

`Smart Connect` provides split-horizon LAN DNS for the standard fnOS FPK when using Subdomain mode with direct public ingress. Public DNS still resolves `nas.example.com` to the public entry point, while LAN devices receive the device's private IPv4 address from its local `dnsmasq`, avoiding NAT loopback and an unnecessary trip through the public network.

It changes only DNS resolution. It does not create Host mappings, modify public DNS, or switch the runtime mode.

## Requirements

Enable Smart Connect only when all of the following are true:

1. The current mode is `Subdomain mode`, not `Reverse proxy mode → Subdomain mapping`.
2. An authentication Host and at least one application Host mapping are configured.
3. The fn-knock device has a stable private IPv4 address.
4. LAN clients use this device as their DNS server.
5. Port `53` is listened on by the `dnsmasq` instance that Smart Connect will use, with no conflicting DNS service.
6. The runtime is the standard fnOS FPK and has a host `dnsmasq` plus service-management capability.

See [Public IP Access with Subdomain Routing](/en/quick-start/subdomain-mode) and [Subdomain Routing](/en/guide/subdomain-proxy) for configuring the subdomain entry point.

## DNS Path

```text
External device -> Public DNS -> Public entry point -> fn-knock
LAN device      -> Local dnsmasq -> 192.168.31.20 -> fn-knock
```

Smart Connect automatically synchronizes the current authentication Host and application Hosts, for example:

```text
auth.example.com  -> 192.168.31.20
nas.example.com   -> 192.168.31.20
alist.example.com -> 192.168.31.20
```

Adding or deleting Host mappings later triggers another synchronization. Smart Connect cannot be enabled when there are no usable Hosts.

## How the Access Policy Changes

Smart Connect does more than shorten the network path. Once traffic follows the LAN route, the gateway normally identifies the client's private source address and returns an authentication result of `local_exempt`:

- A Host with `Require sign-in` enabled no longer asks that LAN source to sign in first.
- Strict-allowlist rules retained from older configurations also allow local sources; they do not force LAN devices into the public allowlist.
- Signing out in the browser ends only the session and does not remove the network's `local_exempt` status.

Enabling Smart Connect therefore adds the LAN to your trust boundary. Guest Wi-Fi, an untrusted VLAN, or a shared network should not use the same split-horizon DNS unless you accept that devices on those networks receive the local exemption.

Always test public authentication through a genuine external path such as a mobile network, not over Wi-Fi that already uses the split DNS.

## Configuration

Path: `System settings → Features → Smart Connect`

1. Enable `Smart Connect`.
2. If the page reports that the resource is not ready, install and initialize `dnsmasq` first.
3. Select a private IPv4 address that LAN clients can actually reach, such as `192.168.31.20`.
4. Select `Save and sync`, then confirm the synchronized domain count and latest sync time.
5. Set the router's DHCP DNS server to that private IPv4 address, or configure one test device manually first.
6. Renew the client's network configuration and query the subdomains after caches have refreshed.

Select the address on the primary LAN interface. Do not choose a Docker bridge, tunnel, or virtual interface used only for internal communication.

## Clients Must Use This DNS Server

A successful save in the admin console means only that the local `dnsmasq` rules were written and the service reloaded. If the router still advertises another DNS server, or the browser uses encrypted DNS that bypasses the LAN resolver, queries can still return the public address.

Local rules use a TTL of about `30` seconds. After a change, wait for the cache to expire, reconnect Wi-Fi, or flush the operating system and browser DNS caches.

Query these names when testing:

```text
auth.example.com
nas.example.com
```

They should return the selected private IPv4 address. The source recorded in Request Logs should then also match the expected LAN client.

## `dnsmasq` Status

| Status | Meaning |
| --- | --- |
| `Not installed` | No usable `dnsmasq` binary exists |
| `Pending initialization` | The binary exists, but the service or initial configuration is not ready |
| `Not running` | Configuration exists, but the service is not currently working |
| `Ready` | Rules can be written and the service reloaded |

If initialization fails, first check what is using `53/tcp` and `53/udp`, then confirm that the runtime can manage the `dnsmasq` service. Do not let two DNS services bind the same address and port.

## Platform Boundaries

- The native fnOS FPK supports Smart Connect. If `dnsmasq` is missing, the page can attempt installation through `apt-get`.
- OpenWrt does not support Smart Connect. Configure split-horizon records yourself in OpenWrt's `dnsmasq`, DHCP settings, or another local DNS service.
- Docker is unsupported. A container cannot take control of the host's `dnsmasq` and port `53`, so the admin console hides or rejects the capability.
- Generic Linux packages do not expose Smart Connect. Configure split-horizon DNS on the router or a separate DNS server instead.
- The Synology DSM 7 SPK does not support Smart Connect or in-app management of `dnsmasq` and LAN DNS.
- Windows x86_64 does not support Smart Connect or in-app management of `dnsmasq` and LAN DNS.
- Environments without host-management capability must provide their own split-horizon DNS.
- `Reverse proxy mode → Subdomain mapping` does not support Smart Connect. Its public entry point lives on the tunnel platform; configure LAN split DNS yourself on the router or a separate DNS server.

## What Smart Connect Does Not Do

- It does not modify DNS records at your registrar, Cloudflare, or another public DNS provider.
- It does not update public IPv4 or IPv6 addresses automatically; use [Dynamic DNS (DDNS)](/en/guide/ddns) or [Cloudflare DDNS](/en/guide/cloudflare-ddns).
- It does not open router or firewall ports or publish Docker ports.
- It does not change upstream listener addresses and cannot prevent LAN users from bypassing the gateway and opening an upstream service directly.

## Troubleshooting

1. **The page is unavailable:** Confirm that the current mode is Subdomain mode with direct public ingress and that the deployment provides the capability.
2. **There are no domains to synchronize:** Create the authentication Host and an application Host first.
3. **There is no selectable IP:** Check that the primary interface has an address in `10/8`, `172.16/12`, or `192.168/16`.
4. **Initialization fails:** Check port `53` usage and `dnsmasq` service state.
5. **Clients still resolve the public address:** Check DHCP advertisements, manual DNS settings, encrypted DNS, and caches.
6. **The domain resolves privately but will not open:** Check the actual gateway port, certificate, and Host mapping instead of continuing to troubleshoot public DDNS.

See [System Settings and Maintenance](/en/guide/system) for other feature switches.
