---
lang: en-US
title: "Deploy on Synology DSM 7 (x86_64 / ARM)"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: ad4203acd39e7498eafeae21acfd0d38b24da49a426da64ac27023961e6f6521
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Deploy on Synology DSM 7 (x86_64 / ARM)

`fn-knock` provides native SPK packages for Synology DSM 7 in the `x86_64`, `armv8`, and `armv7` package architecture families. Each SPK contains native binaries for one architecture only, so select the file that matches the NAS. An FPK built for fnOS cannot be used as a DSM package.

The package runs under the DSM-created `fn-knock-synology` package account and does not require a persistent root process. This preserves DSM's package privilege boundary, but it also means that features requiring direct control of the host are unavailable.

## Before you install

- DSM is version `7.0-40000` or later, and the package architecture is `x86_64`, `armv8`, or `armv7`.
- Your DSM account belongs to the administrators group. Only DSM administrators can open the fn-knock admin interface.
- The gateway uses `7999/tcp` by default. Make sure it does not conflict with an existing reverse proxy, container, or another fn-knock installation.
- If you plan to connect from the internet, prepare the domain, router/NAT, DSM firewall, and IPv6 / ISP policy first. A successful installation does not mean that public ingress is already working.

## Choose the correct SPK

| Synology package architecture | Typical processor type | File name | Download |
| --- | --- | --- | --- |
| `x86_64` | 64-bit Intel / AMD | `fn-knock-synology-x86_64-<version>-<build>.spk` | [Download the x86_64 SPK](https://get.fnknock.cn/?type=synology&arch=x86_64) |
| `armv8` | 64-bit ARM | `fn-knock-synology-armv8-<version>-<build>.spk` | [Download the ARMv8 SPK](https://get.fnknock.cn/?type=synology&arch=armv8) |
| `armv7` | 32-bit ARM | `fn-knock-synology-armv7-<version>-<build>.spk` | [Download the ARMv7 SPK](https://get.fnknock.cn/?type=synology&arch=armv7) |

Use the **Package Arch** value for the Synology model instead of guessing from the product name or processor brand. DSM rejects an SPK for another architecture; download the matching file rather than renaming the package or mixing its binaries.

## Install the SPK

1. Use the table above or the [Synology download page](https://www.fnknock.cn/synology) to download the SPK matching the NAS package architecture.
2. In DSM, open **Package Center**, select **Manual Install**, upload the SPK, and complete the installation.
3. Confirm that the package is running, then open **Knock** from the DSM main menu.
4. Configure authentication, gateway mappings, and certificates in the admin interface.

The admin interface is opened through your signed-in DSM desktop session. The DSM main-menu entry first opens this session launch page:

```text
/webman/3rdparty/fn-knock-synology/launch.html
```

The launch page reads and validates the current session from the DSM desktop window, then continues through the CGI proxy:

```text
/webman/3rdparty/fn-knock-synology/index.cgi/
```

Do not bookmark or open either internal URL directly. Outside the DSM desktop context, the launch page cannot read your session. Do not treat `7998` as a browser-facing admin port, and do not replace the paths above with `/3rdparty/...` under the DSM root.

## Admin entry point and ports

| Entry point or port | Listening scope | Purpose |
| --- | --- | --- |
| **Knock** in the DSM main menu | The launch page validates the signed-in DSM session, then opens the CGI proxy | The only supported admin entry point; available only to DSM administrators |
| `7998` | `127.0.0.1` | Admin backend, proxied locally by DSM CGI |
| `7997` | Local host only | Authentication service |
| `7996` | Local host only | Internal gateway communication |
| `7999` | Public gateway listener | Accepts application-domain and gateway traffic |
| `7991` | Not exposed | The native DSM package does not use this admin port |

Do not forward `7998`, `7997`, or `7996` to the internet or LAN, and do not add DSM firewall allow rules for them. Application traffic should enter only through gateway port `7999`.

## Expose the gateway safely

The SPK declares `7999/tcp` as the package's public gateway port, so DSM can identify this port resource in its firewall interface. The package itself does not rewrite the DSM host firewall as root. Whether external connections are accepted still depends on every layer below:

1. Whether the DSM firewall allows access to `7999` only from the required sources and interfaces.
2. Whether the router forwards the public port to the NAS correctly, or an FRP, Cloudflared, or similar tunnel can reach the origin.
3. Whether the IPv6 firewall, upstream ISP, and DNS records match the selected access pattern.
4. Whether each Host mapping on the gateway has the correct certificate, authentication policy, and target service address.

Keep the admin entry point inside the DSM desktop; do not expose `7998` for convenience. Once configuration is complete, open an application domain over cellular data or another real external connection and confirm that the request passes through the gateway and triggers the expected sign-in policy.

## DSM package capabilities

| Capability | Status in the native DSM SPK |
| --- | --- |
| Host / path mappings, authentication, certificates, and ACME | Supported |
| Built-in FRP and Cloudflared | Supported; either can provide external ingress for the gateway |
| Direct mode authorization, host firewall management, and Smart Connect | Not supported |
| fnOS certificate-library sync and system-clock sync | Not supported |
| Web terminal and SSH Security | Not supported |
| In-app self-update | Not supported; install SPK updates through DSM Package Center |

The absence of host firewall management does not prevent you from configuring firewall rules manually in DSM. It means fn-knock does not rewrite the DSM firewall dynamically according to sign-in state. If you need Direct mode authorization for original ports, use a deployment that supports that capability.

## Data, logs, and upgrades

Runtime data, configuration, certificates, and keys are stored in:

```text
/var/packages/fn-knock-synology/var
```

This directory contains sensitive data. Before an upgrade, export an fn-knock application backup and include DSM snapshots or backups in your recovery plan. Do not clear this directory manually during an upgrade. The service log is stored by default at:

```text
/var/packages/fn-knock-synology/var/fn-knock.log
```

An application `.knock` archive makes configuration migration easier, while a DSM directory snapshot preserves SQLite, certificates, and package runtime data. They cover different data. See [Backup, Restore, and Data Cleanup](/en/guide/backup-and-restore) for the restore order and import-version limits.

The native DSM package does not use the in-app FPK update flow. After downloading a new SPK, choose it under **Package Center → Manual Install** to upgrade. The service briefly restarts during installation. After the upgrade, reopen the admin interface from the DSM main menu and verify the gateway, authentication, and one configured application mapping.

Continue reading:

- [Ports, Endpoints, and URL Paths](/en/quick-start/ports-and-entrypoints)
- [Choose a Deployment and Access Pattern](/en/quick-start/deployment-options)
- [Backup, Restore, and Data Cleanup](/en/guide/backup-and-restore)
- [Dashboard and System Updates](/en/guide/dashboard-and-update)
