---
lang: en-US
title: "Install and Set Up the Native fnOS FPK"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: b6e745c3267459146e2902d348543e722b336b442a23575339165ce93c84e425
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Install and Set Up the Native fnOS FPK

This page covers only the native `fn-knock` FPK for fnOS. For other platforms, see [Docker deployment](/en/quick-start/docker-deployment), [OpenWrt deployment](/en/quick-start/openwrt-deployment), [Linux deployment (systemd / OpenRC)](/en/quick-start/linux-deployment), [Synology DSM 7 deployment](/en/quick-start/synology-deployment), or [Windows x86_64 deployment](/en/quick-start/windows-deployment).

## Before you install

Use the official direct-download link for your fnOS device architecture. Native FPK packages are currently available for two architectures:

| fnOS device architecture | Official direct download |
| --- | --- |
| x86-64 (Intel / AMD) | [Download the x86_64 native FPK](https://get.fnknock.cn/) |
| ARM64 (`aarch64`) | [Download the ARM64 native FPK](https://get.fnknock.cn/?arch=arm64) |

> **Use the native FPK from the official website**
>
> The standard fnOS FPK from the official website is the most feature-complete fn-knock edition. If the installed app is named `Knock Lite`, it is a native non-root package, not a Docker edition. It supports reverse proxying, authentication, DDNS, certificates, WAF, built-in tunnels, and monitoring, but not Direct mode and host-firewall management, network optimization, fnOS certificate-store sync, Web Terminal, FN Connect WAF ingress, or in-app updates. Lite still supports certificates and HTTPS; the missing “automatic HTTPS” capability is a standard-port public-ingress helper used when public TCP `80 / 443` are reachable. To migrate, export a `.knock` backup from Lite and stop or uninstall Lite before installing the standard FPK for your architecture and importing the archive. Do not run both editions at the same time, because their ports may conflict. See [fnOS App Store Lite vs. the Standard FPK](/en/quick-start/fpk-lite-vs-standard) for the full comparison.

Do not install the ARM64 package on a 32-bit ARM device, and do not try to install a package intended for another deployment method as a native FPK. The setup wizard asks for four ports. Keep the defaults unless they conflict with another service. Every value must be between `1` and `65535`, and the four values must be unique.

| Default port | Wizard field | Purpose |
| --- | --- | --- |
| `7998` | Admin backend port | Admin backend reached through the local proxy when you open the fnOS desktop icon |
| `7997` | Authentication port | Authentication pages for sign-in, sign-out, Passkeys, and related flows |
| `7996` | Go admin port | Internal gRPC channel between the gateway and admin backend |
| `7999` | Go proxy port | Gateway endpoint through which external service traffic normally enters |

Do not forward `7998`, `7997`, or `7996` as public endpoints. To publish services, expose only the gateway port and its domain names. The exact ingress setup depends on the run mode you choose.

Lite defaults to ports `8998 / 8997 / 8996 / 8999`, and its setup wizard accepts only `1024`–`65535`. The remaining steps and default `799x` ports on this page describe the standard FPK from the official website. Confirm the app name before troubleshooting against either port set.

## Install on fnOS

1. Open App Center in fnOS, choose manual installation, and select the `.fpk` file you downloaded.
2. Confirm the four ports in the port configuration step. Change them only if they conflict with an existing service.
3. Finish the installation and wait for the app status to show that it is running.
4. Return to the fnOS desktop and open the `Knock` icon.

The desktop icon opens the admin interface, not the gateway endpoint used by external visitors. Changing ports in the app settings restarts the app so the new values can take effect.

## First-time setup order

### 1. Choose an access model

Open `System settings → Mode` and choose the option that matches your network:

- If you have a publicly reachable endpoint and a domain, and primarily publish web services, use Subdomain mode.
- If you need an FRP or Cloudflared tunnel, use Reverse proxy mode. For a new deployment, choose Subdomain mapping; Path mode is only for legacy compatibility.
- Consider Direct mode only when users must access the device's original ports after signing in.

The run mode controls how traffic enters and is routed; it does not change the admin interface address. Read [Choose a Runtime Mode](/en/quick-start/run-modes) before deciding.

### 2. Create sign-in credentials

Bind at least one TOTP authenticator under `Auth` before configuring a public endpoint. Keep the secret on another trusted device or in an offline backup, separate from your everyday device. If the only copy is on one phone, replacing or losing that phone can lock you out.

To sign in with a username and password, Passkey, QQ, or another external identity provider, set up the base credential first and then follow the relevant guide:

- [TOTP Authenticator Apps](/en/guide/totp)
- [Username and Password Sign-in](/en/guide/password-login)
- [External Identity Providers (OIDC / OAuth)](/en/guide/oidc)
- [Link QQ for Quick Sign-in](/en/guide/qq-quick-login)

### 3. Configure certificates and ingress

Before creating mappings, DDNS records, or tunnels, decide which component will expose the gateway endpoint. If you need HTTPS, configure an existing certificate, ACME, or a test certificate under `SSL`. The certificate, DNS records, and port forwarding must all point to the same ingress path.

## Verify the installation

After installation, verify both of the following:

1. Open `Knock` from the fnOS desktop and confirm that the admin interface loads.
2. Create one minimal mapping, then access the gateway domain or `7999` over a real external connection such as cellular data. Confirm that the request follows the expected authentication and routing flow.

Opening the desktop icon from your LAN proves only that the app is running. It does not validate port forwarding, DDNS, certificates, or authentication from the public internet.

## Troubleshooting

### The desktop app cannot connect to the backend

First confirm in App Center that `Knock` is running, then check whether any of the four ports conflict with another app. After changing a port, wait for the app to finish restarting. If it still fails, inspect the app logs for startup errors.

### The admin interface works, but external access fails

Trace the entire request path: check that the gateway port or domain is reachable, the selected mode matches the topology, DNS or DDNS is correct, the certificate covers the requested domain, and the upstream tunnel or port forward targets `7999`. A reachable admin interface is not a substitute for an end-to-end test from the public internet.

## Security boundary

`fn-knock` consolidates ingress and provides an authentication layer in front of your services. It does not replace fnOS updates, backups, least-privilege access, or the account security of each upstream service. With subdomain routing or tunneling, exposing the admin port or an upstream service's original port directly to the internet bypasses the gateway. Original ports should be opened temporarily by fn-knock firewall rules for authorized source IPs only when using [Direct Access on Original Ports](/en/quick-start/direct-mode).

Continue reading:

- [Ports, Endpoints, and URL Paths](/en/quick-start/ports-and-entrypoints)
- [Choose a Runtime Mode](/en/quick-start/run-modes)
- [TLS Certificates and HTTPS](/en/guide/ssl)
- [Backup, Restore, and Data Cleanup](/en/guide/backup-and-restore)
