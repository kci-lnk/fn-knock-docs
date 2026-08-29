---
lang: en-US
title: "Web Terminal"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 401639e0ef93bcf0f939dd279334aca83fb75d1ff2791cda75985f58af3e481f
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Web Terminal

The Web Terminal connects from the admin panel to SSH targets configured by an administrator. It is intended for status checks, short commands, and emergency troubleshooting. It never opens a local shell on the fn-knock host. A target may run Linux, macOS, or Windows as long as its SSH server provides an interactive PTY.

The feature is available in every fn-knock package. The fn-knock runtime must be able to reach the target host and SSH port; the terminal does not change Docker port publishing, OpenWrt firewall rules, or other platform networking.

## Security boundary

Commands run remotely with the configured SSH user's privileges. Restrict the admin panel to trusted administrators, prefer a dedicated least-privilege account and private-key authentication, and verify host fingerprints over an independent trusted channel. Back up before changing packages, configuration, or firewall rules. The Web Terminal does not replace SSH hardening, auditing, or least-privilege controls.

## Add an SSH target

Open `Web Terminal`, select `Add SSH target`, and enter a name, host, port, username, and authentication method. Authentication supports a password or an OpenSSH private key, including a passphrase for encrypted keys.

Credentials are encrypted on the fn-knock host. On the first test, fn-knock retrieves the server host key and displays its algorithm and fingerprint. Authentication data is sent only after explicit confirmation. Compare the fingerprint with the server console, a known SSH client, or a record supplied by the administrator; do not trust it solely because it appears in the dialog.

Save after fingerprint confirmation and a successful connection test. Changing the host, port, username, authentication method, or trusted host key may require active sessions to end; the dialog shows the affected sessions before applying the change.

## Targets and sessions

Each target can have multiple independent shell sessions. A session remains alive while the terminal service is running, so a page refresh or brief network loss does not immediately end the remote shell. It cannot be recovered after the fn-knock service restarts, the remote shell exits, or an administrator ends it.

The page can create, switch, rename, and reconnect sessions; maximize the terminal; change font size; copy, paste, select all, and send text verbatim; and show connection phases such as name resolution, host-key verification, authentication, and PTY allocation.

Only one browser controls input for a session at a time. Other browsers can watch in read-only mode and choose `Take control`. Deleting a target removes its encrypted credential. If active sessions remain, the UI requires a second confirmation and ends them first. Ending sessions and forced deletion cannot be undone.

## Mobile use

Narrow screens provide common control keys, modifiers, navigation keys, and font controls. If the browser cannot read the clipboard, paste manually into the `Send to terminal` dialog. Use a local SSH client for long commands, interactive editing, long-running work, or file transfer.

## Audit and credentials

Event Center records target creation, updates and deletion, fingerprint confirmation, connection tests, and session creation, termination, exit, or loss. It does not record every command typed in the terminal; configure command-level auditing on the SSH target itself.

Credentials and private keys are sensitive. Protect application exports, migrated data directories, and diagnostic material like credential files. After deleting a target, revoke any account or public key that is no longer needed on the server.

## Troubleshooting

- Cannot retrieve a fingerprint: verify that fn-knock can resolve the host and reach its SSH port. Stop if the fingerprint differs, then inspect DNS, rebuild history, and host-key rotation records.
- Connection test fails: check the username, password or key format, passphrase, permitted authentication methods, and interactive PTY support.
- Session cannot be restored: inspect its connection phase and error. The remote shell, SSH link, or terminal service may have ended; create a new session after reachability is restored.
- Read-only input: another browser controls the session. Take control only when it will not interrupt that operator, or create a separate session.

- [Event Center and notifications](/en/guide/event-center-and-notifications)
- [SSH security](/en/guide/ssh-security)
- [Security boundary and baseline](/en/guide/security)
