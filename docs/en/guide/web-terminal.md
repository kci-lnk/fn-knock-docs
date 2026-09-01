---
lang: en-US
title: "Web Terminal"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 5138571d3061f8831ff295f4e8c1cb0017000eb5ce15c85f0bcbfb09924c5075
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Web Terminal

Web Terminal provides two backends for status checks, short commands, and emergency troubleshooting:

- `Local` opens a PTY as the fn-knock service process identity on deployments that support it.
- SSH targets connect to remote Linux, macOS, or Windows hosts configured by an administrator, provided that the SSH server allows an interactive PTY.

Remote SSH targets are available on every package. The optional local PTY is available only on the standard fnOS FPK, Linux service, macOS, and OpenWrt packages. It is unavailable on Knock Lite, Docker, Synology, Windows, and development runtimes. The server-reported capability is authoritative; an unsupported package does not show an enable control.

For SSH, the fn-knock runtime must be able to reach the target host and port. Web Terminal does not change Docker port publishing, OpenWrt firewall rules, or other platform networking. A local PTY does not require an SSH server and does not detour through SSH to `localhost`.

## Security boundary

Remote commands run with the configured SSH user's privileges. Local commands run with the effective UID and GID of the fn-knock service process; the terminal neither drops privileges nor creates a localhost SSH hop. If fn-knock runs as root, the local shell is a root shell.

Restrict the admin panel to trusted administrators. For SSH targets, prefer a dedicated least-privilege account and private-key authentication, and verify host fingerprints over an independent trusted channel. Back up before changing packages, configuration, or firewall rules. Web Terminal does not replace SSH hardening, command-level auditing, or least-privilege controls.

## Enable the local terminal

The local terminal is disabled by default. When enabled, `Local` appears as a fixed target before saved SSH targets. It cannot be added, edited, or deleted like an SSH target. Its settings show the actual service identity and whether it is root, the shell that will be used, and the initial directory. Enabling it requires acknowledging the risk; if no supported executable login shell can be found, it cannot be enabled.

The backend selects an executable shell from zsh, the service account's configured shell, bash, ash, or sh, and starts it as a login shell. It starts in the account home when usable, otherwise in the fn-knock data directory, and finally `/`. The child environment is cleared and rebuilt with basic account, path, terminal, locale, and time-zone values so that service secrets are not inherited automatically.

Disabling the local terminal while local sessions exist requires a second confirmation and ends those sessions. The settings revision is checked when saving, so an older browser view cannot silently overwrite a newer change; reload and decide again after a conflict.

On the standard fnOS FPK, local-terminal requests stay on the protected application path through `index.cgi` to the loopback Rust service. They do not pass through the fnOS unified gateway, Go gateway, gRPC, or WebSocket. Local and SSH terminals use the same HTTP long-polling session transport in the browser, so no additional management port should be exposed for this feature.

## Add an SSH target

Open `Web Terminal`, select `Add SSH target`, and enter a name, host, port, username, and authentication method. Authentication supports a password or an OpenSSH private key, including a passphrase for encrypted keys.

Credentials are encrypted on the fn-knock host. On the first test, fn-knock retrieves the server host key and displays its algorithm and fingerprint. Authentication data is sent only after explicit confirmation. Compare the fingerprint with the server console, a known SSH client, or a record supplied by the administrator; do not trust it solely because it appears in the dialog.

Save after fingerprint confirmation and a successful connection test. Changing the host, port, username, authentication method, or trusted host key may require active sessions to end; the dialog shows the affected sessions before applying the change.

Editing and deletion both start in the target's `Edit SSH target` dialog; on a touch device, tap the target card first to reveal its edit action. Deletion asks for confirmation. If active sessions remain, the UI then presents a second `End sessions and delete` confirmation. At confirmation time, it checks the target revision again so that a stale page cannot delete configuration another administrator has changed. Success removes the target and encrypted credential. Ending sessions and deleting a target cannot be undone.

## Targets and sessions

Each local or SSH target can have multiple independent shell sessions. A session remains alive while the terminal service is running, so closing the page, refreshing, or briefly losing the network does not immediately end its shell. It cannot be recovered after the fn-knock service restarts, the shell exits, or an administrator ends it.

The page can create, switch, rename, and reconnect sessions; maximize the terminal; change font size; copy, paste, select all, and send text verbatim; and show connection phases. Remote SSH phases include name resolution, host-key verification, authentication, and PTY allocation, while local phases include opening the PTY and starting the shell.

Only one browser controls input for a session at a time. Other browsers can watch in read-only mode and choose `Take control`. Ending a session cannot be undone.

## Mobile use

Narrow screens provide common control keys, modifiers, navigation keys, and font controls. If the browser cannot read the clipboard, paste manually into the `Send to terminal` dialog. Use a local SSH client for long commands, interactive editing, long-running work, or file transfer.

## Audit and credentials

Event Center records SSH target creation, updates and deletion, fingerprint confirmation, connection tests, and session creation, termination, exit, or loss. Local-terminal enable and disable events and local session events also record the backend, service identity, and whether it was root. It does not record every command typed in either terminal backend; configure command-level auditing on the operating system or SSH target when required.

SSH target metadata and encrypted credentials are included in application backups. The local-terminal enable switch and all live sessions are excluded, so local access is disabled after a restore until an administrator verifies the new host's service identity, shell, and initial directory and explicitly enables it again. Protect exports, migrated data directories, and diagnostic material like credential files. After deleting a target, revoke any account or public key that is no longer needed on the server.

## Troubleshooting

- Cannot retrieve or confirm a fingerprint: verify that fn-knock can resolve the host and reach its SSH port. If the fingerprint differs, do not authenticate; inspect DNS, target reinstallation or host-key rotation records, and any possible man-in-the-middle proxy.
- Connection test fails: check the username, password or key format, passphrase, permitted authentication methods, and interactive PTY support.
- Local target is unavailable: confirm that the current package supports a local PTY. On a supported package, inspect the reported service identity and verify that at least one supported shell is installed and executable.
- Session cannot be restored: inspect its phase and error. The shell may have exited, the SSH link may have broken, the remote target configuration may have changed, the local terminal may have been disabled, or the fn-knock terminal service may have restarted. Confirm the target and platform capability before creating a new session.
- Read-only input: another browser controls the session. Take control only when it will not interrupt that operator, or create a separate session.

- [Event Center and notifications](/en/guide/event-center-and-notifications)
- [SSH security](/en/guide/ssh-security)
- [Security boundary and baseline](/en/guide/security)
