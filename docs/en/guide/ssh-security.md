---
lang: en-US
title: "SSH Hardening"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 93a607a9d11e1588b4637de6ea0e44937e87295d8779d52c70672b17d05ed542
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# SSH Hardening

SSH security maintains a block list from host sign-in logs, failure counts, region rules, and CIDRs. It protects the host's SSH entry point, not fn-knock HTTP authentication, and it does not replace SSH keys, disabling weak password authentication, or system updates.

The feature must read host SSH logs and manage the firewall. Currently, only the native fnOS FPK provides the complete capability. The OpenWrt runtime explicitly disables it, and Docker, generic Linux, Synology DSM 7 SPK, and Windows x86_64 do not provide the full capability either. If the page says the current environment is unavailable, configure SSH protection on the host or an upstream firewall.

Keep a working local console or trusted-network recovery path before enabling the feature so that you do not block your current management source.

## Feature Switch and Page Entry

1. Under `System settings → Features`, enable the `SSH security` menu.
2. Open `SSH security` and confirm the availability state, detected SSH ports, allowed-CIDR count, and active-block count in the summary.
3. Expand `SSH security configuration` and save the rules. A successful save applies them immediately. Use `Sync firewall` to rebuild the rules after SSH ports or host-firewall state changes.

The feature-menu switch controls whether the page and backend capability are enabled. `Enable SSH security` in the configuration card determines whether protection is enforced from logs, regions, and thresholds. Saving pushes allowed CIDRs and active blocks to the detected SSH ports immediately. `Sync firewall` reapplies them after a port, rule-chain, or other firewall-state change.

## Configuration Fields

| Field | Default and range | Purpose |
| --- | --- | --- |
| Enable SSH security | Off by default | Watches SSH sign-in logs and maintains blocks by threshold or source range |
| Window | 10 minutes by default; 1–1440 minutes | Counts failures from one source within this window |
| Failure threshold | 5 by default; 1–1000 | Adds the source to the block list when the threshold is reached |
| Block duration | 1 day by default; numeric value 1–365 | Unit can be minutes, hours, days, or months; one month is 30 days, and the block is removed automatically at expiration |
| Regions allowed to access SSH | Empty by default | With no entries, regions are unrestricted; otherwise only selected regions, custom CIDRs, and built-in local sources are allowed |
| Custom CIDRs | Empty by default; one per line | Adds non-standard VPNs, office public egress addresses, or other fixed IPv4/IPv6 networks |

Regions can be selected by province, city, and carrier. CIDRs can be filtered by China Telecom, China Unicom, or China Mobile when the connected CIDR database provides carrier data. If the region list cannot be loaded, do not submit an unverified restriction; use only fixed CIDRs until it is available.

Built-in local sources include loopback, RFC 1918 private networks, IPv4 link-local, Tailscale's `100.64.0.0/10`, and IPv6 ULA/link-local addresses. Region and failed-attempt blocks do not apply to these sources, so Tailscale access should still be controlled by tailnet ACLs. If Headscale, WireGuard, ZeroTier, or another overlay uses a different address pool, add its observed source range under Custom CIDRs.

The page validates custom CIDRs and cannot save while any entry has an invalid format. Before adding a regional restriction, include your current trusted egress and backup management network under Custom CIDRs.

## Synchronize and Clear the Firewall

`Sync firewall` redetects SSH ports and writes the current allowed CIDRs and active blocks into firewall rules managed by fn-knock. The success message reports:

- The number of allowed CIDRs applied;
- The number of active blocks synchronized again;
- The detected SSH ports to which the rules were applied.

Run the synchronization again after changing the SSH service port, reloading the system firewall, or noticing that firewall state differs from the page.

`Clear SSH firewall` deletes the `FN-KNOCK-SSH` chain and marks current active blocks as removed. It does not delete saved regions, CIDRs, thresholds, or durations. A later synchronization recreates rules from the saved configuration.

## Login Logs

The `Login logs` tab supports searching by IP, user, or raw log, and filtering by All results, Success, or Failure. Each record includes:

- Time and sign-in result;
- Username, including an invalid-user indicator for failures;
- Source IP and location;
- Authentication method and SSH port;
- Raw log information for search and troubleshooting.

If no records appear for a long time, first confirm that the deployment supports the feature, the SSH service writes to the system log, and the fn-knock service has permission to read it.

## Block List

The `Block list` shows source IP, location, block time, expiration, reason, failure count, and the threshold at that time. Block reasons include:

- The source is outside the allowed regions and custom CIDRs;
- The source reached the sign-in failure threshold within the window.

The page supports search, pagination, and individual or batch removal. Removing a block takes the IP out of firewall rules managed by this feature. If the same source violates a rule again, it is blocked again.

## Recommended Configuration Order

1. Leave regional restrictions empty and configure only a forgiving Failure threshold and Block duration.
2. Save, then test SSH sign-in from both a trusted and a test network.
3. Check that Login logs identify the user, source IP, authentication method, and port correctly.
4. Add fixed VPN, office egress, and backup networks under Custom CIDRs.
5. Add regional restrictions, save, and test once from both an allowed and disallowed source.
6. Confirm that blocking, automatic expiration, manual removal, and retriggering all work as expected.

Regions and CIDRs are only supporting controls. Mobile networks, corporate egress, and VPN geolocation can change. For a management entry point, SSH keys, disabled password authentication, a minimal allowed CIDR set, a separate VPN path, and upstream firewall restrictions are more reliable.

## Common Problems

### Firewall State Does Not Match the Page After Saving

Run `Sync firewall` and verify the SSH ports in the success message. If another host firewall manager overwrites the rules, synchronize again after it reloads.

### Your Management Egress Was Blocked by Mistake

Prefer entering through the local console and removing the IP from Block list. If the page is unreachable, clear the `FN-KNOCK-SSH` chain or disable this feature, then add the trusted CIDR before synchronizing again.

### The Reported Region Does Not Match the Actual Location

Check [IP Geolocation](/en/guide/ip-location) and the CIDR database version. Proxies, VPNs, CGNAT, and ISP address reassignment can all make the source geolocation differ from its physical location.

- [IP Geolocation](/en/guide/ip-location)
- [Event Center and Notifications](/en/guide/event-center-and-notifications)
- [Security Model and Baseline](/en/guide/security)
