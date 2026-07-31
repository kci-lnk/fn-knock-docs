---
lang: en-US
title: "Dashboard and System Updates"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 00cf0c677aa96c2b3049a3ecbe8d80152a92e6e01fde6b4383eea13836198691
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Dashboard and System Updates

The `Dashboard` summarizes gateway traffic, security blocks, DDNS, and tunnel status. It is useful for quickly checking whether the system is receiving traffic and whether any obvious problems have occurred recently. It does not replace request logs, long-term monitoring, or health checks provided by upstream services.

## View the Dashboard

At the top of the page, you can select `15 min`, `1 hour`, `6 hours`, `24 hours`, or `7 days`. The selected range affects cumulative ingress and egress traffic, security trends, and the network traffic chart. Realtime ingress, realtime egress, and the current online count always reflect the present state.

The main areas are:

| Area | What it shows |
| --- | --- |
| Realtime and cumulative traffic | Current send and receive rates, plus total ingress and egress traffic within the selected range |
| Security blocking | Login failures, the number of scanner-blacklisted IPs, WAF detection and blocking events, and their trends |
| Entry status | DDNS provider, most recent address, update scope, latest check, and additional-domain status |
| Tunnel entry | FRP and Cloudflared runtime status, the default tunnel, and PID when running in NAT traversal mode |
| Network traffic trend | Ingress and egress time series for the selected range |

You can hide the `Entry status` card under `System settings → Features`. The tunnel area appears only in NAT traversal mode and when the current platform supports FRP or Cloudflared.

When troubleshooting, check the Dashboard in this order:

1. After adding a mapping, connect from an external network and confirm that the online count, realtime rate, or traffic chart changes.
2. If security blocks increase, open the Event Center, scanner blacklist, or WAF logs to identify the source.
3. If DDNS is not updating, open the DDNS page and compare the latest check, address source, and update logs.
4. If a tunnel is shown as stopped, select its card to open the tunnel page and inspect the process status and logs.
5. If only one domain is failing, check that Host's mapping, certificate, access policy, and upstream target.

Traffic from the local device or LAN does not prove that the public entry point works. When testing authentication, reverse proxying, or tunnels, retry through a genuine external connection such as a mobile network.

## Change the Admin Console Color

From the upper-right corner of the Dashboard, you can choose `Default`, `Hermes orange`, `Prussian blue`, or `Dynamic white`. This is saved as the system-wide theme color for the admin console. It is independent of the light/dark appearance setting and does not change the authentication page or upstream applications.

## How the Update Page Varies by Deployment

Path: `Version and updates`. Every deployment shows the current version, latest version, check results, and release notes, plus quick links to the official website, documentation, and GitHub project. Release notes safely render Markdown headings, lists, emphasis, and HTTPS links; they are not arbitrary HTML pages. After the admin console loads, it also shows the current version in the sidebar and checks for updates periodically. When a new version is found, a banner at the top opens the update page for the release notes; only the native fnOS FPK offers in-browser installation from that banner. Synology DSM 7 SPKs are installed through Package Center, while the native Windows edition is installed by the separate `fn-knock Windows Manager`; neither is updated from the web page.

| Deployment | What the update page can do | How to upgrade |
| --- | --- | --- |
| Native fnOS FPK | Check, download, verify, and install with one click | Run `One-click update` on the page; the app restarts |
| Docker Compose | Check the version and view release notes | Pull the release image and recreate the container |
| OpenWrt | Check the version and view release notes | Install an `.ipk` or `.apk` matching the firmware format and architecture |
| Linux (systemd / OpenRC) | Check the version and view release notes | Run `sudo knock update` |
| Synology DSM 7 SPK | Check the version and view release notes | Download the SPK for the correct architecture and update it manually in Package Center |
| Windows x86_64 | Check the version and view release notes | Check for and install updates from `fn-knock Windows Manager` or its tray menu |

Do not try to install an FPK from the update page on Docker, OpenWrt, or Synology. The page marks in-app updates as unsupported on those deployments. On Windows, use the desktop manager instead of trying to install through the web update page.

## Update a Native fnOS FPK

Check for a new version under `Version and updates`. When an update is available, the page downloads the FPK for the device architecture, verifies the file, and then installs it through fnOS App Center before restarting the app. The page shows progress during download, verification, and installation; do not close it during the installation stage.

The admin console and gateway are briefly unavailable during the update. Export a configuration backup before starting. After the update completes, reopen the app from the fnOS desktop and confirm that the version, authentication settings, and gateway entry points are all working.

## Update Docker Compose

Run the following commands from the deployment directory:

```bash
cd /opt/fn-knock
docker compose pull
docker compose up -d
docker compose ps
```

If `.env` pins `FN_KNOCK_IMAGE` to a version tag, change it to the target version first. A container image is not a data backup: back up the persistent volumes `fn_knock_gateway` and `fn_knock_data` before upgrading.

## Update Linux

For a standard Linux installation, run:

```bash
sudo knock update
```

The command compares the local and online versions, downloads and verifies the release package, and deploys it into the version directory. You can also confirm a reinstall when the versions match. If the new version fails its health check, the command restores the previous program, service scripts, and start/stop state. To return to the retained previous version, run `sudo knock rollback`. You should still back up `/etc/fn-knock` and `/var/lib/fn-knock` before updating.

## Update OpenWrt

First choose a new package that matches both the firmware's package manager and the target architecture, then run:

```bash
# Firmware using opkg
opkg install --force-reinstall /tmp/fn-knock_*.ipk

# Firmware using apk
apk add --allow-untrusted /tmp/fn-knock_*.apk

/etc/init.d/fn-knock status
```

If `/tmp` contains multiple versions, replace the wildcard with the complete filename.

Use `--allow-untrusted` for a local `.apk` only when the package came from a trusted release channel. The upgrade preserves `/etc/config/fn-knock`, `/etc/fn-knock/gateway`, and `/etc/fn-knock/data`; back them up beforehand anyway. If an older installation still uses the default `/var/lib/fn-knock`, the installer copies it to the new directory and updates UCI. A custom data directory is not forced to migrate. Do not delete the old directory until sign-in, configuration, and existing data have been verified.

## Update a Synology DSM 7 SPK

After reviewing the version and release notes under `Version and updates`, download the SPK matching your Synology model's architecture and perform a manual update through DSM Package Center. The web page does not install or restart the package on behalf of DSM.

Export an app backup first. Package data is stored in `/var/packages/fn-knock-synology/var`. After the upgrade, reopen the package from the DSM desktop and check that the version, authentication settings, and gateway access have recovered.

## Update Windows x86_64

Open `fn-knock Windows Manager` and select `Check for updates`, or run the same action from the system tray menu. When the manager downloads the Windows installer, it verifies the download source, file size, and SHA-256 before launching it. The web `Version and updates` page is for viewing version information and release notes only.

The installer temporarily stops the service. If the new version does not start during the readiness check, the installer restores the previous program and runtime data. This is not a substitute for a backup, so export an app backup before updating. `%ProgramData%\FnKnock` is retained after a Windows uninstall or upgrade; it contains sensitive data such as configuration, SQLite databases, and certificates.

## Check Every Update

1. Confirm that you can sign in to the admin console and that the current version is correct.
2. Confirm that the gateway domain or port is reachable from a genuine external network.
3. Verify that the current mode, certificates, mappings, and authentication rules still match your intended configuration.
4. Check that any FRP, Cloudflared, or other upstream reverse-proxy connection in use has recovered.
5. Confirm that the Event Center, request logs, and WAF logs continue to receive new records.

Updating `fn-knock` does not replace host system updates or backups. The public gateway, certificates, DNS, and application services each have separate failure modes and should be verified independently after an update.

Continue reading:

- [Request Logs](/en/guide/request-logs)
- [Deploy with Docker Compose](/en/quick-start/docker-deployment)
- [Deploy on OpenWrt](/en/quick-start/openwrt-deployment)
- [Deploy on Synology DSM 7 (x86_64 / ARM)](/en/quick-start/synology-deployment)
- [Deploy on Windows (x86_64)](/en/quick-start/windows-deployment)
