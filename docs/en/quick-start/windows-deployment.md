---
lang: en-US
title: "Deploy on Windows (x86_64)"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: d5c6f6c5ebe2b4db1d7e8a3862b2d8d4cc4339c9e029f3861fb0d874d536dae1
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Deploy on Windows (x86_64)

The Windows edition uses a native installer to set up a machine-wide service, along with the `Knock Windows Manager` and a system-tray entry. It supports only 64-bit x86_64 Windows and requires administrator privileges.

The admin panel is always available only on the local loopback interface, while gateway port `7999` listens on all IPv4 and IPv6 interfaces by default. A Windows host can therefore serve as a gateway for direct public ingress or a self-managed tunnel, but actual external reachability still depends on Windows Firewall, the router or NAT, ISP inbound restrictions, and other security software. The Windows edition does not provide Direct mode authorization, built-in FRP, or Cloudflared.

## Native application with an independent service

The Windows edition is a native application. It does not depend on WebView or WebView2, nor does it keep a browser engine resident inside the desktop program. Core components such as the gateway, authentication service, and admin backend run in the background as the `FnKnock` Windows service; the desktop manager does not need to remain open.

The desktop shortcut opens a lightweight manager for viewing service status, changing ports, opening the admin panel, clearing the admin password, and installing updates. It uses only about `2 MB` while running. When you configure fn-knock, the manager opens the local admin panel in your default system browser instead of embedding the page.

You can exit the manager at any time after setup. Even if you quit it completely from the system tray, the `FnKnock` service continues running in the background, so existing authentication, mappings, and gateway access are unaffected. Only explicitly stopping `FnKnock` or uninstalling fn-knock interrupts gateway service.

## Before you install

- The system is running 64-bit Windows, and your account can elevate through UAC.
- The default ports `7991`, `7998`, `7997`, `7996`, and `7999` are not in use by another program. You can change them in the manager after installation.
- The admin panel is for the Windows host running fn-knock only. Do not plan to access it over the LAN, a VPN, or a reverse proxy.
- If the gateway will be accessed from the LAN or internet, first verify the Windows network profile, firewall, router or NAT, and ISP inbound policy. Never expose an admin port.

## Download the Windows installer

Go to the [fn-knock Windows download page](https://www.fnknock.cn/windows) and download the official Windows installer.

Do not obtain the installer from chat groups, file-sharing drives, or third-party download sites, and do not use an fnOS FPK, Linux package, or OpenWrt package. For future updates, use only the official website or the channel shown in the Windows Manager.

## Install and open the admin panel

1. Double-click the Windows installer downloaded from the official website, approve administrator access at the UAC prompt, and complete the installation.
2. When installation finishes, launch the Windows Manager, or open it from the Start menu.
3. In the manager, confirm that the service status is ready, then click **Open admin panel**. By default, it opens:

   ```text
   http://127.0.0.1:7991/
   ```

4. Follow the page prompts to set the admin panel password, then configure authentication, mappings, and certificates.

The admin panel password protects only the local admin entry point. It is separate from the TOTP, account password, or Passkey that visitors use through the gateway.

## Default ports and listening scopes

| Port | Listening scope on a new installation | Purpose |
| --- | --- | --- |
| `7991` | Local loopback (IPv4 / IPv6) | Admin panel |
| `7998` | Local loopback (IPv4 / IPv6) | Rust admin backend |
| `7997` | Local loopback (IPv4 / IPv6) | Authentication service |
| `7996` | Local loopback (IPv4 / IPv6) | Internal gRPC for the Go gateway |
| `7999` | All IPv4 / IPv6 interfaces (`0.0.0.0`, `::`) | Gateway entry point |

You can change all five ports in the `Knock Windows Manager`. After you save, the service restarts and checks whether the new ports become ready; if the check fails, it restores the previous configuration. All five ports must be unique. Ports `7998`, `7997`, and `7996` are not external entry points.

The admin panel always accepts local loopback connections only, and `7998`, `7997`, and `7996` are likewise not public entry points. The gateway has no separate listening-scope switch. A legacy `loopback` setting from an older version is migrated automatically to the current all-interface listener when the service starts. Do not edit `%ProgramData%\FnKnock\config\runtime.json` directly.

The installer creates an inbound program rule named `FnKnock Gateway`. By default, it applies only to the Windows **Domain** and **Private** network profiles, not the **Public** profile. This is a static rule matched to the gateway executable, not a firewall capability that opens and closes ports dynamically according to sign-in state. For public access, verify every segment: Windows Firewall or third-party security software, router/NAT port forwarding, the IPv6 firewall, and the ISP's inbound policy.

If an independent tunnel or reverse proxy on the same Windows host provides external ingress, point its origin to `127.0.0.1:7999` to reduce lateral exposure on that host. fn-knock does not manage the process, and it must preserve the original Host and real client IP. The Windows edition has no built-in resource or process management under `System settings → FRP` or `System settings → Cloudflared`.

## Daily operation, updates, and data

Closing the manager window only minimizes it to the system tray. Quitting the manager completely from its tray menu still does not stop the `FnKnock` service or affect gateway traffic. Use the tray menu or main window to open the admin panel, start/stop/restart the service, change ports, clear the admin password, or check for updates.

Run **Check for updates** in the `Knock Windows Manager`. It downloads the installer from the official channel, verifies its size and SHA-256 digest, then launches it. The web panel's `About / Updates` page only shows version details and release notes. The installer briefly stops the service during an upgrade and restores the previous program and data if the new version fails to become ready. Export an application backup before updating.

| Location | Contents |
| --- | --- |
| Application directory under `%ProgramFiles%` | Manager, service, and gateway executables |
| `%ProgramData%\FnKnock` | Configuration, SQLite, certificates, WAF data, logs, state, and rollback data |

Uninstalling removes the service, program files, and related rules, but preserves `%ProgramData%\FnKnock` for reinstallation or recovery. This directory contains sensitive data. Remove it separately with administrator privileges only after confirming that you no longer need to recover the installation.

Plan both an application `.knock` archive and a backup of `%ProgramData%\FnKnock`: the former makes configuration migration easier, while the latter preserves SQLite, certificates, and Windows runtime data. See [Backup, Restore, and Data Cleanup](/en/guide/backup-and-restore) for supported import versions, sensitive-data boundaries, and the verification procedure.

## Windows edition capabilities

| Capability | Status |
| --- | --- |
| Subdomain or path mappings | Configurable through the local admin panel |
| External gateway entry point | `7999` listens on all interfaces by default; the inbound path is determined jointly by the static Windows rule, network, and routing configuration |
| Direct mode authorization and host firewall management | Not supported; firewall rules are not rewritten dynamically according to sign-in state |
| Smart Connect, Web terminal, and SSH Security | Not supported |
| Built-in FRP and Cloudflared | Not supported; you may manage a separate process on the same host |
| ACME certificates | Built-in DNS-01 is supported; see [TLS Certificates and HTTPS](/en/guide/ssl) |
| Update installation | Handled by the Windows Manager |

If you forget the admin panel password, first use **Clear admin password** in the manager. If the manager cannot be opened, run the reset command from an Administrator PowerShell window:

From the application installation directory, run:

```powershell
.\fn-knock-service.exe reset-panel-password
```

This clears the panel password, panel sessions, and sign-in backoff state. It does not remove mappings, certificates, or any other gateway data.

Continue reading:

- [Ports, Endpoints, and URL Paths](/en/quick-start/ports-and-entrypoints)
- [TLS Certificates and HTTPS](/en/guide/ssl)
- [Backup, Restore, and Data Cleanup](/en/guide/backup-and-restore)
- [Dashboard and System Updates](/en/guide/dashboard-and-update)
