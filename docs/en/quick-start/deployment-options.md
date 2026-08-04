---
lang: en-US
title: "Choose a Deployment and Access Pattern"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 26293c364e63399f0fc92b735b069246feb7d6d52a341fbf58d6de1e9f23bfe9
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Choose a Deployment and Access Pattern

An fn-knock deployment involves three decisions: where the software runs, how external traffic reaches the gateway, and how the gateway forwards requests to upstream services. The access policy then determines which requests are allowed through.

fn-knock consolidates ingress and places authentication in front of your services. It does not replace system updates, backups, least-privilege access, or the security controls of each upstream service.

## Choose a deployment method

| Deployment | Admin endpoint | Default gateway endpoint | Best suited for | Main limitations |
| --- | --- | --- | --- | --- |
| Native fnOS FPK | `Knock` on the fnOS desktop (local CGI proxies to backend `7998`) | `7999` | An fnOS host where full host integration is required | `7998` is the admin backend, not a public endpoint or a browser-facing admin URL |
| Docker Compose | `7991` | `7999` | A NAS, home server, or general-purpose Docker host | No Direct mode, host firewall management, automatic HTTPS, SSH security, Smart Connect, or web terminal |
| OpenWrt package | `Services → Knock`; default port `7991` | `7999` | A primary router, x86 router appliance, or downstream gateway | No Direct mode, host-firewall management, Smart Connect, automatic HTTPS, SSH security, web terminal, or in-app FPK updates |
| [Linux (systemd / OpenRC)](/en/quick-start/linux-deployment) | `7991` | `7999` | A standard Linux server, VPS, or self-managed host | Requires root and a running systemd or OpenRC init system; the administrator manages the host firewall |
| [macOS 13+ (Intel / Apple Silicon)](/en/quick-start/macos-deployment) | Local `127.0.0.1:7991` | `7999` | An Intel or Apple Silicon Mac | Unsigned and not notarized; no Direct mode, `iptables`, host-firewall management, Smart Connect, SSH security, or web terminal |
| [Synology DSM 7 x86_64 / ARM SPK](/en/quick-start/synology-deployment) | Package entry on the DSM desktop | `7999` | An Intel, AMD, or ARM NAS running DSM 7 | No Direct mode, host firewall management, Smart Connect, web terminal, or SSH security; updates are installed through Package Center |
| [Windows x86_64](/en/quick-start/windows-deployment) | Manager opens local `127.0.0.1:7991` | `7999`, listening on all interfaces by default | A Windows service managed from a local system-tray app | Firewall and NAT still require manual setup; no Direct mode authorization, built-in FRP / Cloudflared, Smart Connect, web terminal, or SSH security |

Docker, OpenWrt, Linux, macOS, and Windows deployments require a separate panel password for the admin endpoint. That password protects the admin panel and is unrelated to the TOTP, username and password, or Passkey used at the gateway.

If the app on an fnOS device is named `Knock Lite`, it is a native non-root package, not a Docker deployment, and does not have the full host permissions of the standard FPK in the table. Lite supports Host proxying, authentication, DDNS, certificates, WAF, built-in FRP / Cloudflared, and monitoring. It does not support Direct mode and the host firewall, Smart Connect, system clock sync, automatic HTTPS, fnOS certificate-store sync, Web Terminal, FN Connect WAF ingress, or in-app updates. Here, “automatic HTTPS” means the standard-port public-ingress helper used when the ISP and inbound path allow TCP `80 / 443`; it does not mean Lite lacks certificates or HTTPS. See [fnOS App Store Lite vs. the Standard FPK](/en/quick-start/fpk-lite-vs-standard) for the complete boundary and migration procedure.

Installation guides:

- Native fnOS FPK: [Install and Set Up the Native fnOS FPK](/en/quick-start/install-and-first-login)
- Docker: [Deploy with Docker Compose](/en/quick-start/docker-deployment)
- OpenWrt: [Deploy on OpenWrt](/en/quick-start/openwrt-deployment)
- Linux: [Deploy on Linux (systemd / OpenRC)](/en/quick-start/linux-deployment)
- macOS: [Deploy on macOS (Intel / Apple Silicon)](/en/quick-start/macos-deployment)
- Synology: [Deploy on Synology DSM 7 (x86_64 / ARM)](/en/quick-start/synology-deployment)
- Windows: [Deploy on Windows (x86_64)](/en/quick-start/windows-deployment)

### Package sources and verification

Start from the [official fn-knock website](https://www.fnknock.cn/) and follow the download link for your platform. Each official release also provides the following verification data:

- [`release-manifest.json`](https://github.com/kci-lnk/fn-knock-turborepo/releases/latest/download/release-manifest.json): version, control API version, application source commit, Go gateway commit, platform, architecture, file size, and SHA-256.
- [`SHA256SUMS`](https://github.com/kci-lnk/fn-knock-turborepo/releases/latest/download/SHA256SUMS): checksums for packages attached to the GitHub Release.
- An SBOM and build provenance for the multi-architecture Docker image.

After downloading a package for offline use or copying it through another system, calculate its SHA-256 again before installation and compare it with the official release manifest. A matching checksum proves only that the file matches the manifest; you must still verify that you selected the correct platform and CPU architecture.

Use the following verification sequence:

1. Follow the official website to the matching GitHub Release. Do not use same-named files from chat groups, file-sharing services, or search results.
2. Find the exact filename in `release-manifest.json` and verify the release version, platform, architecture, and file size.
3. Calculate the local SHA-256:

   ```bash
   # Linux, OpenWrt, or another system with sha256sum
   sha256sum <package-file-name>

   # macOS
   shasum -a 256 <package-file-name>
   ```

   On Windows PowerShell:

   ```powershell
   (Get-FileHash -LiteralPath '<package-file-name>' -Algorithm SHA256).Hash
   ```

4. Compare the result character-for-character with the file's `sha256` value in the manifest or its entry in `SHA256SUMS`. If they differ, stop and download the package again.
5. To audit the build origin, confirm that the package's GitHub build provenance points to the official repository. For Docker, also verify the multi-architecture image digest, SBOM, and provenance listed in the manifest. Pin production deployments by digest if you do not want a future change to `latest`.

`release-manifest.json` also records the control API version, the control-plane source commit, and the Go gateway commit. This confirms that the Rust, Go, and Windows components in a package use the same protocol contract and allows the package to be traced to both codebases. A SHA-256 string by itself does not prove who published a file; the manifest, checksum file, and build provenance must also come from the official Release.

## Choose a network topology

### Direct public ingress

Point the domain directly to your home public IPv4 or IPv6 address, or configure the router to forward a public port to the fn-knock gateway.

Requirements:

- Your home endpoint is reachable from an external network.
- You have a domain name.
- The router, firewall, and ISP do not block the required ports.

For web services, use [Public IP Access with Subdomain Routing](/en/quick-start/subdomain-mode). Use [Direct Access on Original Ports](/en/quick-start/direct-mode) only when clients must continue connecting to the original service ports.

### FRP or Cloudflared tunnel

External requests first reach an FRP server or Cloudflare, then travel through a tunnel to the fn-knock gateway. Your home network does not need a publicly reachable inbound IP address.

For a new web-service deployment, use:

- Run mode: `Reverse proxy mode`
- Routing: `Subdomain mapping`

See [NAT Traversal with Subdomain Routing](/en/quick-start/reverse-proxy-mode) for the complete setup.

### EdgeOne or ESA at the edge

Edge platforms such as EdgeOne and ESA can accept standard public ports `80 / 443` and proxy requests back to fn-knock. They are an edge layer in front of a direct-public-ingress topology and do not change fn-knock's internal Host routing or access policies.

Before adding an edge platform, make sure the local fn-knock gateway, authentication subdomain, and application subdomains already work correctly.

## Choose a routing method

| Routing method | Example public address | Best suited for | Notes |
| --- | --- | --- | --- |
| Host routing | `https://nas.example.com` | Web services | Recommended; give each service its own subdomain |
| Path routing | `https://example.com/photos` | Web apps designed to run under a subpath | Legacy compatibility; available under `Reverse proxy mode → Path mode`, which is marked as not recommended |
| TCP / UDP forwarding | `example.com:3306` | Non-HTTP protocols such as SSH, databases, and DNS | Configure under `Streams`; currently available only in Subdomain mode |

Host routing works with both direct public ingress and FRP / Cloudflared tunnels. A public IP address is not required to use subdomains.

Reserve path routing for cases where:

- Existing path mappings need a gradual migration.
- The upstream application explicitly supports a subpath.
- Only one fixed public hostname is available.

## Choose an access policy

For a new Host mapping, the current admin interface uses the `Require sign-in` switch:

| Policy | Current configuration | When access is allowed |
| --- | --- | --- |
| Public access | Turn off `Require sign-in` on a mapping that currently prefers login | Does not check fn-knock sessions or the allowlist |
| Require sign-in | Turn on `Require sign-in` | A manual source authorization can allow access independently; an automatic IP authorization normally lets the same source continue, but cannot override a denial carried by a service scope; if no usable source authorization exists, the session is checked |
| Advanced authentication for a subdomain | Add an advanced authentication rule to an HTTP / HTTPS Host with `Require sign-in` enabled | When the source or request attributes match, fn-knock issues a temporary credential limited to that Host; otherwise, the regular sign-in flow continues |
| Strict allowlist | Can exist only on legacy mappings; the current UI cannot select it | Turning off `Require sign-in` does not necessarily make the Host public; access depends exclusively on a valid source authorization record created manually or after sign-in, and a session cookie cannot replace the source requirement |

Enable `Require sign-in` for most new application mappings. The authentication service itself must remain public, or signed-out visitors cannot reach the login page. If an upgrade leaves a legacy strict-allowlist rule, inspect both manual and automatic IP authorization records. To remove that rule, record the full mapping and recreate it through the current UI; turning off `Require sign-in` alone is not enough to make it public. If the strict rule should allow only manual sources, disable post-login automatic IP authorization and remove any old automatic records.

Sign-in credentials can also restrict which subdomains a user may access. Advanced authentication for a subdomain is an independent way to grant access to a Host; it does not add restrictions to a sign-in credential. Read [Advanced Authentication for Subdomains](/en/guide/advanced-auth) before configuring it. Upstream Basic Auth credential injection is used only when fn-knock connects to the target service; visitors cannot use it to sign in to fn-knock.

## Start with your use case

| Requirement | Start here |
| --- | --- |
| You have a public endpoint and a domain and primarily access web services | [Public IP Access with Subdomain Routing](/en/quick-start/subdomain-mode) |
| You have no public IP and use FRP or Cloudflared | [NAT Traversal with Subdomain Routing](/en/quick-start/reverse-proxy-mode) |
| Existing path mappings cannot be migrated yet | [Legacy path compatibility under NAT traversal](/en/quick-start/reverse-proxy-mode#path-mode-is-for-legacy-compatibility-only) |
| Users must access original ports such as `5666` or `22` after signing in through the browser | [Direct Access on Original Ports](/en/quick-start/direct-mode) |
| fn-knock is not installed yet, or the admin and gateway endpoints are unclear | [Install and Set Up the Native fnOS FPK](/en/quick-start/install-and-first-login) |
| You are deploying and maintaining fn-knock locally on Windows x86_64 | [Deploy on Windows (x86_64)](/en/quick-start/windows-deployment) |
| You are deploying and maintaining fn-knock on an Intel or Apple Silicon Mac | [Deploy on macOS (Intel / Apple Silicon)](/en/quick-start/macos-deployment) |

For any deployment with an external gateway endpoint, perform final validation over a real external connection such as cellular data. The gateway may trust LAN and local sources, so a LAN test cannot validate internet-facing authentication. Although Windows listens on all interfaces on `7999` by default, you must still verify the active Windows Firewall profile, router or NAT configuration, IPv6 firewall, and ISP inbound policy.
