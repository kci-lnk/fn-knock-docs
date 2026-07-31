---
lang: en-US
title: "Deploy on OpenWrt"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 3076fc36bb7bde20f2fdd8c9dc1605cd0b20b836051ae4538814070f74f1b816
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Deploy on OpenWrt

The `fn-knock` OpenWrt package includes a LuCI configuration page, the admin interface, authentication pages, the Rust backend, and the Go gateway. After installation, manage the service under `Services → Knock`. The admin interface defaults to `7991`, and the gateway endpoint defaults to `7999`.

First identify both the package format and target architecture used by your firmware. The package manager cannot install the wrong format, and a package for the wrong target will not run even when the CPUs appear similar.

## Choose the correct package

### The firmware determines the package format

| Firmware package manager | Package format | Typical OpenWrt release | Install command |
| --- | --- | --- | --- |
| `opkg` | `.ipk` | `24.10` and earlier | `opkg install /tmp/<file-name>.ipk` |
| `apk` | `.apk` | `25.12` and later | `apk add --allow-untrusted /tmp/<file-name>.apk` |

OpenWrt `25.12` and later generally use `apk`, while `24.10` and earlier generally use `opkg`. Forks and systems in the middle of an upgrade may differ, so always use the package manager actually present on the router. Do not guess from the version number or filename extension; check the router first:

```bash
ubus call system board
if command -v opkg >/dev/null 2>&1; then
  opkg print-architecture
else
  apk --print-arch
fi
```

### Download directly for your firmware architecture

Use the target reported by the commands above, then download the matching package format directly from the table. These are the same stable download endpoints used by the official website, with the format and architecture already selected; you do not need to edit the URL.

| Target architecture | Typical devices | APK (OpenWrt 25.12+) | IPK (OpenWrt 24.10 and earlier) |
| --- | --- | --- | --- |
| `x86_64` | Intel / AMD 64-bit router appliances and virtual machines | [Download APK](https://get.fnknock.cn/?type=apk&arch=x86_64) | [Download IPK](https://get.fnknock.cn/?type=ipk&arch=x86_64) |
| `aarch64_cortex-a53` | IPQ60xx, Cortex-A53, and ImmortalWrt `qualcommax/ipq60xx` | [Download APK](https://get.fnknock.cn/?type=apk&arch=aarch64_cortex-a53) | [Download IPK](https://get.fnknock.cn/?type=ipk&arch=aarch64_cortex-a53) |
| `aarch64_generic` | Generic ARM64 routers and development boards | [Download APK](https://get.fnknock.cn/?type=apk&arch=aarch64_generic) | [Download IPK](https://get.fnknock.cn/?type=ipk&arch=aarch64_generic) |
| `arm_cortex-a7_neon-vfpv4` | 32-bit ARMv7 devices built for the matching target | [Download APK](https://get.fnknock.cn/?type=apk&arch=arm_cortex-a7_neon-vfpv4) | [Download IPK](https://get.fnknock.cn/?type=ipk&arch=arm_cortex-a7_neon-vfpv4) |
| `arm_cortex-a5_vfpv4` | Cortex-A5 / VFPv4 routers | [Download APK](https://get.fnknock.cn/?type=apk&arch=arm_cortex-a5_vfpv4) | [Download IPK](https://get.fnknock.cn/?type=ipk&arch=arm_cortex-a5_vfpv4) |

Release filenames end with the OpenWrt target architecture. For example:

```text
fn-knock_<version>-<release>_x86_64.ipk
fn-knock_<version>-r<release>_aarch64_cortex-a53.apk
```

Use the target reported by `opkg print-architecture` or `apk --print-arch`. In particular, do not interchange `aarch64_generic` and `aarch64_cortex-a53`. Do not force-install a package on MIPS, ARMv6, or another target for which no package is currently available.

Download the main `fn-knock` package, not the app-store metadata package.

## Install

Upload the matching package to `/tmp` on the router, then run the command for your firmware:

```bash
# opkg firmware
opkg install /tmp/fn-knock_*.ipk

# apk firmware
apk add --allow-untrusted /tmp/fn-knock_*.apk
```

These wildcard commands assume that `/tmp` contains only one installable `fn-knock` package. If multiple versions are present, use the complete filename.

Use `apk --allow-untrusted` only for a local package obtained from a trusted release page whose source or checksum you have verified. This option bypasses repository signature verification and must never be used for an untrusted file. Before an offline installation, also confirm that the firmware repositories can provide all dependencies.

The package scripts enable and start the service and refresh the LuCI menu cache. You can also install a local package through LuCI's package upload page, but the command line makes the selected format and architecture easier to verify.

## First launch and ports

Open `Services → Knock`, confirm that the service status is `Running`, then click `Open admin panel`. The default address is:

```text
http://<OpenWrt-LAN-address>:7991/
```

On first access, set the admin panel password. It protects only the OpenWrt admin endpoint and is separate from the TOTP, username and password, or Passkey used by visitors to access applications.

| Port | Bind scope | Purpose |
| --- | --- | --- |
| `7991` | Configurable; default admin endpoint | Admin panel |
| `7999` | Gateway listener | Public endpoint for mapped services |
| `17998` | `127.0.0.1` | Internal Rust admin backend API |
| `7997` | `127.0.0.1` | Authentication service |
| `7996` | `127.0.0.1` | Internal gateway gRPC |

The LuCI page can change these ports, the data directory, and the gateway configuration directory. After you apply the configuration, `procd` reloads the service. Every port value must be unique.

Do not forward or allow `7991` from the WAN. If public access is required, choose the run mode, certificate, and access policy first, then create only the firewall rule or upstream forwarding needed for gateway port `7999`. Installing the package does not replace OpenWrt's WAN firewall policy.

Check service status and logs with:

```bash
/etc/init.d/fn-knock status
logread -e fn-knock
```

A reachable admin panel proves only that the local service has started. After configuring a mapping, test `7999` and the domain over a real external connection such as cellular data. Do not treat a LAN result as proof that internet-facing authentication works.

## Data and upgrades

Runtime configuration and data are stored in:

```text
/etc/config/fn-knock
/etc/fn-knock/gateway
/etc/fn-knock/data
```

`/etc/config/fn-knock` stores UCI port and directory settings, `/etc/fn-knock/gateway` stores gateway runtime configuration, and `/etc/fn-knock/data` stores SQLite, authentication keys, and other persistent data. Back up all three locations before upgrading. They contain sensitive information and must not be uploaded to a public location.

When upgrading from an older version while UCI still uses the default `/var/lib/fn-knock`, the installer stops the service, copies the old data to `/etc/fn-knock/data`, and updates `fn-knock.main.data_dir`. An instance with a custom data directory is not forced to migrate. After upgrading, verify the LuCI data directory, admin sign-in, and existing configuration before handling the legacy directory; do not delete it before validation.

Also export a `.knock` application backup from the Maintenance page. Directory backups retain SQLite and platform runtime data, while `.knock` archives migrate portable settings. See [Backup, Restore, and Data Cleanup](/en/guide/backup-and-restore) for their contents, version constraints, and post-restore validation.

OpenWrt cannot install FPK updates from the admin interface. Use the direct-download table above to get a new package in the same format and for the same firmware target, then run:

```bash
# opkg firmware: install a new version or explicitly reinstall the same version
opkg install --force-reinstall /tmp/fn-knock_*.ipk

# apk firmware
apk add --allow-untrusted /tmp/fn-knock_*.apk

/etc/init.d/fn-knock status
```

If `/tmp` contains more than one version, use the complete filename instead of a wildcard so multiple packages are not passed to the package manager at once.

An upgrade does not proactively clear the runtime directories above. If the package manager asks how to handle a modified `/etc/config/fn-knock`, keep the existing file unless the upgrade instructions explicitly require restoring the default configuration.

If you forget the OpenWrt admin panel password, run the following command over SSH:

```bash
fn-knock-reset-panel-password
```

Then return to the admin panel from LuCI and follow the prompt to set a new password.

## OpenWrt feature limitations

| Feature | OpenWrt package behavior |
| --- | --- |
| In-app FPK updates | Not supported; install a matching package with `opkg` or `apk` |
| Direct mode and host firewall management | Not supported; use OpenWrt's own firewall, a VPN, or an upstream gateway to control original ports |
| Smart Connect | Not supported; configure split DNS yourself in OpenWrt's `dnsmasq`, DHCP settings, or another local resolver |
| SSH security | Not supported; use OpenWrt's own SSH logs, firewall, or security packages |
| Web terminal | Not supported |
| Automatic HTTPS | Not supported by the current OpenWrt package |

`fn-knock` does not replace OpenWrt firmware updates, router backups, or a minimal-exposure firewall policy.

Continue reading:

- [Ports, Endpoints, and URL Paths](/en/quick-start/ports-and-entrypoints)
- [Choose a Runtime Mode](/en/quick-start/run-modes)
- [Backup, Restore, and Data Cleanup](/en/guide/backup-and-restore)
- [Dashboard and System Updates](/en/guide/dashboard-and-update)
