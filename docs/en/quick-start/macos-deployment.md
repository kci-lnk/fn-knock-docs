---
lang: en-US
title: "Deploy on macOS (Intel / Apple Silicon)"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 0912ae4a2d36e245cbe4770888063c9d343483a9a8a72e20b7573ef7a8a48ac9
---

# Deploy on macOS (Intel / Apple Silicon)

The macOS edition uses a command-line installer and the `knock` management command. It does not ship an `.app`, `.pkg`, or menu-bar application. macOS 13 and later are supported with separate native packages for Intel and Apple Silicon.

The admin panel listens only on `127.0.0.1:7991` by default. The macOS runtime never invokes `iptables` and does not modify the macOS host firewall.

## Requirements

- macOS 13 or later.
- An account that can use `sudo`.
- HTTPS access to `cdn.fnknock.cn` and GitHub Releases.
- Ports `7991`, `7996`, `7997`, `7998`, and `7999` are free. The installer prompts for alternatives when it detects a conflict.

The installer selects the architecture automatically:

| Mac | Release architecture | Archive name |
| --- | --- | --- |
| Intel (`x86_64`) | `amd64` | `fn-knock-macos-<version>-amd64.tar.gz` |
| Apple Silicon (`arm64`) | `arm64` | `fn-knock-macos-<version>-arm64.tar.gz` |

When run from a Rosetta terminal on Apple Silicon, the installer still detects the physical architecture and selects `arm64`. It also validates the Mach-O architecture before installing the service.

## One-line installation

Run in Terminal:

```bash
curl -fsSL https://cdn.fnknock.cn/macos/install.sh | sudo bash
```

The installer downloads the stable package for the current architecture, checks its size and SHA-256, installs a root LaunchDaemon, and waits for the admin service and gateway to become ready. Homebrew is not required.

Verify the installation:

```bash
sudo knock status
```

Open this URL in a browser on the Mac:

```text
http://127.0.0.1:7991/
```

Set the panel password on first access. It protects only the admin panel and is separate from TOTP, user/password, or passkey credentials used by gateway visitors.

### Administer from another computer

Port `7991` is intentionally loopback-only. For temporary remote administration, create an SSH tunnel from the client:

```bash
ssh -L 7991:127.0.0.1:7991 <macOS-user>@<Mac-address>
```

Keep the SSH session open and browse to `http://127.0.0.1:7991/` on the client. For a permanent entry point, use `sudo knock nginx` as a starting point for an HTTPS reverse proxy and add access control.

## Unsigned release and Gatekeeper

The macOS archives are not signed with an Apple Developer ID and are not notarized. The command-line installer verifies the downloaded size and SHA-256 against the stable pointer. For a manual download, obtain both the archive and `SHA256SUMS` from the official GitHub Release, then run:

```bash
shasum -a 256 fn-knock-macos-<version>-<amd64-or-arm64>.tar.gz
```

The result must exactly match the entry with the same filename in `SHA256SUMS`.

A browser may attach a quarantine attribute to manually downloaded and extracted files. Only after checksum verification, remove it from the extracted directory if required:

```bash
xattr -dr com.apple.quarantine /path/to/fn-knock
```

The installer does not silently clear quarantine. Never run `xattr` on files from an unverified source.

## Ports and network boundary

| Default port | Bind scope | Purpose |
| --- | --- | --- |
| `7991` | `127.0.0.1` | Admin panel |
| `7998` | Loopback | Rust admin backend |
| `7997` | Loopback | Authentication service |
| `7996` | Loopback | Go gateway control interface |
| `7999` | Determined by gateway configuration; default application entry | Traffic passing through fn-knock |

Never expose `7996`, `7997`, or `7998`. Reachability of `7999` from a LAN or the internet still depends on the macOS firewall, router or NAT, IPv6 firewall, and ISP inbound policy. fn-knock does not modify any of them.

Automatic HTTPS and protocol mappings configure fn-knock listeners and routing only. They do not open the macOS firewall, router ports, or cloud security groups. Manually allow every fixed protocol-mapping port that you expose.

## Manage with `knock`

Run `sudo knock` without arguments for the interactive menu. Common commands are:

| Command | Purpose |
| --- | --- |
| `sudo knock status` | Inspect LaunchDaemon, core processes, ports, and memory |
| `sudo knock start` / `stop` / `restart` | Control the service |
| `sudo knock config` | Change the five runtime ports and check conflicts |
| `sudo knock logs` | Show the last 100 lines of stdout and stderr |
| `sudo knock logs --follow` | Follow logs |
| `sudo knock update` | Check for and install a same-architecture update |
| `sudo knock update --yes` | Confirm an update non-interactively |
| `sudo knock rollback` | Switch to the retained previous version and verify it |
| `sudo knock nginx` | Print an HTTPS reverse-proxy example for the admin panel |
| `sudo knock reset-panel-password` | Clear the panel password so it can be set again |
| `sudo knock version` | Print the installed version |

An update is downloaded and verified before the `current` symlink is switched atomically. If the new version fails its health check, the version links, command, LaunchDaemon configuration, and previous running state are restored. This is not a backup substitute; export an application backup before updating.

## File locations

| Content | Path |
| --- | --- |
| Version directory | `/Library/Application Support/FnKnock/releases/<version>` |
| Current and previous versions | `/Library/Application Support/FnKnock/current`, `previous` |
| Runtime configuration | `/Library/Application Support/FnKnock/config/fn-knock.env` |
| Application data | `/Library/Application Support/FnKnock/data` |
| Service logs | `/Library/Logs/FnKnock` |
| Management command | `/usr/local/bin/knock` |
| LaunchDaemon | `/Library/LaunchDaemons/cn.fnknock.service.plist` |

The LaunchDaemon runs as root, starts before login, loads after a system reboot, and asks launchd to restart the complete service group after an unexpected core-process exit.

## Platform capabilities

macOS supports Host and path reverse proxying, authentication, certificates and ACME, WAF, monitoring, deep monitoring, and built-in FRP / Cloudflared. It does not provide:

- `iptables` or macOS host-firewall management.
- Direct mode authorization or Smart Connect.
- SSH security management, web terminal, fnOS certificate-store sync, or fnOS-specific network tuning.
- Web-based update installation; use `sudo knock update`.

A feature hidden or rejected by the backend is an intentional platform boundary. Whitelist entries still participate in gateway access policy, but cannot open original host ports on macOS.

## Uninstall

Remove the program and service while retaining configuration, data, and logs:

```bash
sudo knock uninstall
```

Remove the program, configuration, data, and logs permanently:

```bash
sudo knock uninstall --purge
```

A purge requires typing `DELETE` in an interactive terminal. Export an application backup first; the uninstaller cannot recover deleted local data.

## Troubleshooting

```bash
sudo knock status
sudo launchctl print system/cn.fnknock.service
sudo knock logs
```

- Admin panel unavailable: use `127.0.0.1` on the Mac where fn-knock is installed and confirm whether port `7991` was changed.
- Service not ready: inspect `/Library/Logs/FnKnock/stdout.log` and `stderr.log`, then check all five ports for conflicts.
- Gateway unreachable externally: verify the actual `7999` listener, macOS firewall, router/NAT, IPv6, and ISP policy.
- Update failed: check whether automatic restoration completed; run `sudo knock rollback` only when `previous` exists.
- Architecture mismatch: do not force installation. Run the one-line installer again to select the native package.

Continue with [Ports and Endpoints](/en/quick-start/ports-and-entrypoints), [Choose a Deployment and Access Pattern](/en/quick-start/deployment-options), and [Dashboard and System Updates](/en/guide/dashboard-and-update).
