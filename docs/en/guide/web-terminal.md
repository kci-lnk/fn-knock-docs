---
lang: en-US
title: "Web Terminal"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 206b1ced2dc52da41e152198583e063d01856c7d7980df534ca8bff398109dff
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Web Terminal

Web Terminal provides controlled host shell sessions in the admin UI. It is useful for checking status, running short commands, and handling emergency troubleshooting. It is not an everyday development environment and should not replace SSH keys, auditing, or least-privilege administration.

The feature uses `tmux` to keep resumable sessions. It currently supports native fnOS FPK and general Linux deployments. Docker, OpenWrt, Synology DSM 7 SPK, and Windows x86_64 do not provide a Web Terminal entry.

## Permission Boundary

Terminal commands run with the operating-system permissions of the fn-knock service process. If the service runs as root, the terminal may also have root privileges, and an incorrect command can directly modify the system, application data, or network configuration.

- Expose the admin panel only to trusted administrators.
- Give the admin panel a separate access scope and strong authentication.
- Do not enter long-lived secrets that may remain in browser history, the clipboard, or screen recordings.
- Back up configuration files, packages, and firewall state before changing them.
- Do not use Web Terminal as a public replacement for SSH.

## tmux Environment

View the tmux status and version under `System settings → Terminal`. Possible states are Not installed, Installing, Installed, and Error.

- When tmux is not installed, start the installation from the page.
- Installation progress appears on the page; refresh the status after it completes.
- After a failed installation, review the error and retry.
- Terminal sessions cannot be created until tmux is ready.

Installation requires a suitable package manager and working network access in the deployment environment. If the page remains in Installing or reports an error, check backend logs, package repositories, and available disk space.

## Terminal Settings

| Setting | Default and range | Description |
| --- | --- | --- |
| `Enable Web terminal` | Disabled by default | Shows the side navigation and permits session creation when enabled |
| `Maximum sessions` | Default 3; range 1–12 | No more sessions can be created after reaching the limit |
| `Idle cleanup time (seconds)` | Default 86400 seconds; range 60–604800 seconds | From 1 minute to 7 days; the backend removes idle sessions after this period |

The idle cleanup time applies to tmux sessions on the server, not browser sign-in session duration. After saving, return to the Web Terminal page and verify its navigation entry and runtime status.

## Session Behavior

When the page first opens, the system reads existing sessions and prefers to restore the session most recently used by the current browser. If none exists, it attempts to create a default session. The page lets you:

- Create a new session.
- Switch between multiple session tabs.
- Rename the current session.
- Reattach to a disconnected session.
- Send a text block to the terminal exactly as entered.
- End and permanently delete the current session.
- Maximize the terminal, adjust the font size, copy, paste, and select all.

The browser receives terminal output over HTTP long polling. It can reconnect after a brief network interruption. Refreshing the page or closing the browser only detaches the current client; it does not immediately end the underlying tmux session. To stop its processes completely and delete the session, exit the shell or click `End session`.

An ended session cannot be recovered. Commands still running inside it terminate with that tmux session.

## Mobile Controls

On narrow screens, a shortcut toolbar provides common control keys, modifier keys, arrow and navigation keys, and font-size controls. If the browser cannot read the clipboard directly, the page opens the `Send to terminal` dialog so the user can paste and send the content manually.

A mobile browser is suitable for brief troubleshooting. Use a local SSH client for long commands, interactive editing, persistent tasks, and file transfers.

## Troubleshooting

### Entry Does Not Appear

Confirm that the deployment platform supports terminal capability, tmux is installed, the feature has been saved as enabled, and the admin configuration has been reloaded.

### Page Says It Is Currently Unavailable

The runtime status explains what is blocking access. Common causes include the feature being disabled, tmux installation in progress, tmux missing, or an installation error. Fix the runtime environment under `System settings → Terminal` first.

### Cannot Create a Session

Check whether the current session count has reached the limit and whether old sessions are still running. End sessions that are no longer needed.

### Cannot Restore a Session

The session may have exceeded the idle cleanup time, been ended by another administrator, disappeared after a host reboot, or become impossible for fn-knock to reattach to through tmux. Refresh the runtime status, then create a new session.

### Connected but No Output Appears

Use `Reconnect` to reattach. If output still does not appear, inspect browser network requests and backend logs. An overly short long-polling timeout on a reverse proxy can also cause repeated disconnections.

- [System Settings and Maintenance](/en/guide/system)
- [SSH Security](/en/guide/ssh-security)
- [Security Boundaries and Baseline](/en/guide/security)
