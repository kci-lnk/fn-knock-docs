---
lang: en-US
title: "Backup, Restore, and Data Cleanup"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: c335d9bafc06e7cb8d739617e601fb345e9249ea5d7b292963643fb01281e212
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Backup, Restore, and Data Cleanup

Use `System settings → Maintenance` to create automatic or manual backups, import application-level fn-knock configuration, or clear the current instance. A `.knock` archive is suitable for migration and configuration rollback, but it is not a backup of the entire machine, container volumes, or upstream application data.

## What a backup contains

An export collects restorable configuration and credentials from the fn-knock application namespace, including:

- Authentication accounts, TOTP, Passkey, and external sign-in configuration.
- Application settings for subdomains, paths, the gateway, WAF, session policies, and similar features.
- Certificates and private keys, DDNS, notification, and tunnel-connection configuration.
- Other objects persisted by fn-knock that can be reapplied on a new instance.

Runtime logs, events, sessions, temporary authorizations, login backoff, locks, traffic statistics, WAF statistics, tunnel runtime state, the last DDNS address, and other short-lived runtime data are excluded. Downloaded FRP / Cloudflared / `acme.sh` files, host firewall state, external DNS records, and upstream application data are also outside the application backup.

A full environment migration therefore normally requires two backup layers:

1. A `.knock` archive exported from Maintenance to restore application configuration.
2. A platform data-directory backup, Docker volume backup, or system snapshot to preserve SQLite, downloaded resources, and platform runtime data.

## Security boundary

A `.knock` file is a password-protected, ZIP-compatible archive, but its archive password is fixed in the application so that different instances can import it. It does not provide meaningful confidentiality. The file may contain certificate private keys, TOTP seeds, account credential hashes, and OIDC / DDNS / notification / FRP secrets.

Treat it as a plaintext backup of your secrets:

- Store it only on encrypted storage, in a trusted password vault, or on controlled offline media.
- Apply independent strong encryption before transferring it through a cloud drive, email, or chat.
- Never upload it to a public issue, group chat, public share, or diagnostic attachment.
- Remove old copies regularly and restrict backup read access to the people who actually maintain the system.

## Automatic backups

Under `System settings → Maintenance → Automatic backups`, fn-knock can periodically write `.knock` archives to `backups/automatic` inside the server data directory. The feature is disabled by default, with a default interval of `24` hours and retention of `7` days. The interval may be `1`–`8760` hours and retention may be `1`–`3650` days.

Enabling the feature for the first time creates a backup immediately, followed by the configured schedule. The page shows the actual directory, last successful run, next scheduled run, and most recent error. A failed run is retried early, no later than about `1` hour. Cleanup removes only expired `.knock` archives from the automatic-backup directory; unrelated files are not treated as old backups.

Automatic and manual archives have the same contents, compatibility rules, and security boundary. Automatic copies live on the current server data disk or container volume, so they do not protect against disk failure, volume loss, or complete host failure. Regularly copy important archives to another device or controlled off-site storage.

During restore, select `Choose automatic backup` to read an archive directly from the server-side directory without first downloading it to the browser device. Restore preserves the current automatic-backup schedule so an older archive cannot unexpectedly replace it. After `Clear all data`, existing automatic-backup files remain in the server directory, but the schedule configuration is reset to disabled. Review old-file retention before enabling it again.

## Export a backup

Open `System settings → Maintenance → Export backup`:

- When the page provides shared-directory support, you can write to `fn-knock / backup` or download the archive to the device running the browser.
- Other deployments download the archive directly to the current device.
- The filename begins with `fn-knock-backup-`, ends with `.knock`, and includes the export time.

The shared-directory option normally appears only in the native fnOS FPK or an environment with a supported shared root mounted explicitly. Docker and OpenWrt do not show this option. A shared directory is not inherently secure; review its access permissions.

Export a backup at these points:

- After completing authentication, routing, and certificate configuration for the first time.
- Before changing the run mode, root domain, authentication method, or WAF.
- Before an application update, migration, reinstall, or data cleanup.
- After an important change to credentials, certificates, DDNS, or tunnel configuration.

A completed export does not prove that the backup is usable. At minimum, confirm that the file is non-empty and has the correct extension, and periodically rehearse an import on an isolated or recoverable instance.

## Before importing

An import does not merge data; it replaces the current fn-knock application namespace. Before starting:

1. Export another rollback backup from the current instance.
2. Confirm that you can still reopen the admin panel from the LAN, desktop entry point, or system console.
3. Confirm that the archive comes from a trusted source and was not extracted or modified on an untrusted device.
4. Record the current version, run mode, authentication Host, gateway port, and one critical application mapping.
5. For a cross-platform migration, also record firewall rules, published ports, shared directories, and external DNS state.

The server currently accepts only an archive that:

- Uses the `.knock` extension.
- Is no larger than `128 MiB`.
- Uses the currently supported backup schema, which is Schema `1`.
- Was exported by an application version no older than the minimum compatible version defined by the current code, currently `1.4.0`.
- Was exported by an application version no newer than the running fn-knock version.

A backup exported by a newer release therefore cannot be restored directly to an older release. Upgrade the target to the same or a later version before importing. Use the version range in any failure message as the authoritative compatibility range.

## Restore from a backup

1. On the Maintenance page, select a local `.knock` file or one from the server-side automatic-backup directory. When shared-directory support is available, you can also select one from `fn-knock / backup`.
2. Verify the filename, size, and source, then click `Start import`.
3. Read and confirm the overwrite warning.
4. Wait for the import result. The page reloads after a successful import.

The server clears the existing `fn_knock:` data and writes the restorable entries from the archive, then attempts to synchronize:

- The current run mode and gateway routes.
- The Direct mode allowlist, when applicable.
- Gateway logging, WAF, and SSL deployment.
- Legacy authentication-log cleanup and system resource-monitoring state.

A `Warning` in the import result means that configuration entries were imported but one or more runtime synchronization steps failed. It does not automatically roll back the entire instance to its pre-import state. Save the warning details, keep the admin entry point available, and work through the checks below.

## Post-restore validation

Check the system from the admin side through to the public request path:

1. Confirm that you can reopen the admin panel and that authentication accounts, TOTP credentials, Passkeys, and external sign-in settings are as expected.
2. Verify the run mode, root domain, authentication Host, mapping count, and critical Targets.
3. Check the gateway, WAF, certificates, and `Request Logs`. If the import reported a warning, inspect the corresponding synchronization step first.
4. Confirm that FRP / Cloudflared resources are installed and running again.
5. Test DDNS, notification providers, and external sign-in credentials.
6. Open the authentication Host and at least one protected application Host over cellular data.
7. Confirm the real client IP, route, and upstream status in `Request Logs`.
8. For a cross-platform migration, reconfigure published ports, the host firewall, Smart Connect, and system services.

Restored configuration may refer to loopback addresses, LAN IPs, file paths, or domains from the old environment. The presence of a configuration entry does not mean that its external dependency exists on the new platform.

## Common failures

| Message or symptom | Resolution |
| --- | --- |
| Incorrect file extension | Select the original `.knock` file; do not merely rename a regular ZIP or JSON file |
| Unsupported schema or version | Upgrade the target into the reported range; do not edit the archive version fields manually |
| Archive is too large | Confirm that the file is not corrupt or replaced; each archive is limited to `128 MiB` |
| Failed to read archive | Check file integrity, free disk space, and `unzip` availability; some Linux / OpenWrt environments attempt to install `unzip` through the system package manager |
| Shared directory unavailable | Confirm that the platform provides a shared root, the directory is still mounted, and the process can read and write it; alternatively, use local download and upload |
| Import succeeds with warnings | Do not import again; first inspect the run-mode, WAF, SSL, or gateway synchronization named by the warning, then save the relevant configuration manually if needed |
| Public sign-in fails after the page reloads | Enter through the retained LAN or platform entry point, inspect the authentication Host, DNS, certificate, and external port, then decide whether to restore the pre-import backup |

## Clear all data

`System settings → Maintenance → Cleanup → Clear all data` resets the gateway and removes configuration, accounts, sessions, logs, and other application data from server storage. It then clears local storage in the current browser and reloads the page.

The action requires the confirmation phrase shown on the page; in the English interface it is currently `delete all data`. The operation cannot be undone and does not restore content from an exported file on your behalf. Run it only after validating a backup, confirming the admin entry point and deployment data directory, and intentionally deciding to reinitialize the instance.

- [System Settings and Maintenance](/en/guide/system)
- [Dashboard and System Updates](/en/guide/dashboard-and-update)
- [Security Model and Baseline](/en/guide/security)
- [Choose a Deployment and Access Pattern](/en/quick-start/deployment-options)
