---
lang: en-US
title: "Wake-on-LAN"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 41a223ca58fec4c7ab27b00142ea69d1e243f1e754436b23ad42d6d70367ca73
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Wake-on-LAN

`Wake-on-LAN` starts a powered-off or sleeping device by sending a Magic Packet on its LAN. fn-knock can broadcast directly onto its local network or use the built-in Relay of another fn-knock instance to reach a different network. It can also shut down an online device over SSH. Signed-in users can open a simplified power-control page from the gateway portal.

Wake-on-LAN only sends a wake signal; it does not replace the device's own power management. WOL must already be enabled in the target motherboard, network adapter, firmware, and operating system, and the adapter must remain powered after shutdown.

## Enable the feature

Enable `Wake-on-LAN` under `System settings → Features`. Saving shows the Wake-on-LAN sidebar entry and starts device status checks, the built-in Relay, and configured third-party connections. Disabling the switch stops those runtime tasks and hides the entry without deleting devices, Relays, or third-party settings.

First verify direct wake for one device on the same LAN. Configure cross-network Relay or third-party access only after that test, so a device-side WOL problem is easier to isolate.

## Add a local device

Open `Wake-on-LAN → Devices` and add a device manually or select `Discover devices`:

1. By default, discovery scans the directly connected IPv4 networks detected by fn-knock. Expand the scan settings and enter one or more CIDRs to specify the range.
2. Only devices that respond and whose MAC address can be resolved from the neighbor table appear. A sleeping device, a device that blocks ICMP, or an entry already aged out of the switch's neighbor table may be absent.
3. Select devices, confirm their names, and add them in a batch. Discovery also fills in the device IP and directed broadcast address for its network.

The main fields for a manual device are:

| Field | Purpose |
| --- | --- |
| `Name` | Name shown in the admin page, portal, and event records |
| `MAC address` | Magic Packet target; stored in uppercase colon notation |
| `Device IP address` | Used for online checks; it is not the sole destination of the Magic Packet |
| `Wake path` | Use direct broadcast for a local device or a paired Relay for another network |
| `Broadcast address` | Used for direct local wake; when empty, fn-knock tries the broadcasts of detected local interfaces |
| `Enabled` | A disabled device remains configured but cannot be woken from admin, the portal, or a third-party platform |

Selecting `Wake` confirms only that the broadcast was submitted, not that the device has booted. A short per-device cooldown prevents repeated clicks from continuously sending packets.

## How online status is determined

Enabled devices are checked approximately once per minute. Creating or editing a device triggers an immediate check. After a wake request, fn-knock performs two more checks after short delays, so the state does not turn online at the instant you select Wake.

- `Online`: a probe responded and the responding address matches the target MAC.
- `Offline`: the probe completed without finding the target.
- `Pending check`: the target has not been checked, or the probe timed out, the Relay is unavailable, or the address cannot be confirmed.

If DHCP changes a device IP, fn-knock can update the observed address from the neighbor table. Do not interpret `Pending check` as proof that the device is off. Container networking, ICMP policy, inter-VLAN routing, and system permissions can all make a probe inconclusive.

## Wake from the gateway portal

After WOL is enabled, `System settings → Gateway → Portal` includes `Show Wake-on-LAN shortcut`, enabled by default. The same option is available from the settings button on the Wake-on-LAN page. The shortcut opens the built-in `/__wol__` page for signed-in users. It exposes only enabled-device names and simplified status, not MAC addresses, device IPs, broadcast addresses, Relay details, or internal errors.

All of the following are required:

1. The WOL feature is enabled.
2. The portal is allowed to show WOL.
3. The browser has a live sign-in session.
4. The sign-in credential's service scope includes the built-in WOL page.

A credential with `All scopes` includes this entry automatically. For `Custom scopes`, select `Built-in Wake-on-LAN page` under `Auth settings → Permissions`. The same scope permits shutdown for an online device whose SSH shutdown configuration is enabled. Hiding the portal shortcut does not delete devices or affect administrator, Relay, or third-party operations, but it does prevent the public authentication API from opening or operating the built-in page.

## SSH remote shutdown

Edit a saved device to configure `SSH remote shutdown`. The device must be directly reachable over SSH from fn-knock and cannot be the machine running the current fn-knock instance. Linux, macOS, and Windows targets are supported, using either a password or a private key.

fn-knock uses a fixed command for each operating system rather than accepting an arbitrary command:

```text
Linux:   sudo -n /usr/bin/systemctl poweroff --no-block
macOS:   sudo -n /sbin/shutdown -h now
Windows: shutdown.exe /s /t 0
```

Run `Test SSH` after saving. The test pins the server host key and verifies login and shutdown permission without powering off the device. Retest whenever the host, port, username, authentication method, operating system, or server host key changes.

The shutdown action appears only while the device is online and its SSH configuration is complete. It requires a confirmation countdown. An accepted SSH command is not proof that the device has powered off: fn-knock checks status again after short delays and applies a per-device cooldown to prevent repeated requests.

SSH credentials are stored in the current installation's encrypted credential directory. Use a dedicated least-privilege account and grant only the exact fixed command. Do not enable general passwordless `sudo`, Administrator access, or interactive shell privileges solely for this feature.

## Cross-network Relay

When the target is outside the current fn-knock broadcast domain, deploy another fn-knock instance on the target network and pair the two instances:

1. On the controller, open `Wake-on-LAN → Across networks`, select `Add remote network`, and enter an address that reaches the fn-knock instance on the target network. The default UDP port is `40009`.
2. Save and immediately copy the one-time pairing code beginning with `FNW1.`.
3. On the target-network instance, open `Wake-on-LAN → Relay receiver`, paste the code, and enable the receiver.
4. Return to the controller, run `Test connection`, add the target device, and select this Relay as its `Wake path`.

The instances need a routable UDP path, such as a site-to-site VPN, controlled port forwarding, or another trusted network. Allow the Relay UDP port through the router and host firewall. With Docker, explicitly publish the UDP port and ensure the container can broadcast onto the target LAN.

The pairing code contains a pre-shared key and must travel through a trusted channel. Relay requests and acknowledgements use signatures, time-window validation, and replay protection. `Allowed source CIDRs` can further restrict controller addresses, but do not replace the PSK. Regenerating the pairing code immediately invalidates the previous key, so the target instance must receive the new code. Excessive clock difference between the two systems causes the Relay to reject requests.

Change the advanced listen address, broadcast destinations, and source CIDRs only when automatic detection does not fit a VLAN, container, or multi-interface topology. Keep at least one broadcast destination, normally the target network's directed broadcast address on UDP port `9`.

## Blinker and Bemfa

Edit a device and choose one provider under `Third-party platform integration`. Only one provider can be enabled per device. Runtime state shows connecting, connected, reconnecting, missing credentials, or an error.

### Blinker

Create an independent network device in the Blinker app and enter its device key in fn-knock. When `Bind switch component` is enabled:

- `on` wakes the device.
- `off` reports the current online state; it does not shut down the device.
- A state query returns the latest online state detected by fn-knock.

### Bemfa

Enter the Bemfa private key and subscription topic. A topic may contain only letters, digits, and underscores. Follow Bemfa's convention of ending it in `001` or `006` when voice-platform discovery is required.

- Receiving `on` wakes the device.
- Receiving `off` does not shut it down; it publishes the current state to `{topic}/up`.
- Changes detected by online checks also publish `on` or `off` to the upstream topic.

### Connect Mi Home and XiaoAI

After configuring Blinker or Bemfa and confirming that the device is connected:

1. Open the Mi Home app and go to `Me → Connect third-party platforms`.
2. Search for `巴法` (Bemfa) or `点灯` (Blinker), select the platform configured for the current fn-knock device, and follow the prompts to add it.
3. Authorize the account and sync devices. You can then wake the device from Mi Home or ask XiaoAI to turn on or power on the device.

Mi Home and XiaoAI send commands through the selected platform. A turn-on command maps to `on` and triggers WOL. A turn-off command does not remotely shut down the target; it only reports or synchronizes the current state as described above.

Both integrations require outbound access from fn-knock to the provider's HTTPS and MQTT TLS services. Never expose device keys, private keys, topics, or screenshots containing them. Platform commands bypass the gateway portal page, so grant platform-account and device access only to trusted users.

## Events, backups, and migration

Each wake attempt creates a `Wake-on-LAN completed` event with the target, delivery method, source (administrator, portal, Blinker, or Bemfa), result, and latency. A shutdown attempt creates an `SSH remote shutdown completed` event. You can create notification rules for both in the Event Center. A wake event reports the broadcast workflow rather than a completed boot, and a shutdown event reports SSH command handling rather than a guaranteed power-off; confirm either result with the later online state.

Devices, Relays, and non-sensitive integration settings are application configuration. SSH passwords and private keys, Relay PSKs, Blinker device keys, and Bemfa private keys are kept in the current installation's encrypted credential directory and are not included in a `.knock` application backup. After migration or restore, re-enter and retest SSH credentials, pair Relays again, re-enter third-party credentials, and verify that device addresses, ports, host keys, and firewall rules still match the new environment.

## Troubleshooting order

1. Enable WOL in the target BIOS/UEFI, adapter driver, and operating system, then test from another tool on the same LAN.
2. Confirm the MAC address. After complete shutdown, verify that the network port remains powered.
3. For direct wake, verify the directed broadcast address. With Docker, check network mode, UDP broadcast reachability, and the host firewall first.
4. For another network, test the Relay first. Check UDP `40009` (or the custom port), routing, source CIDRs, both clocks, and whether pairing is current.
5. If broadcast succeeds but the device stays off, investigate the device, switch, or broadcast path instead of repeatedly selecting Wake.
6. If status remains pending, check the device IP, ICMP, neighbor table, inter-VLAN routing, and Relay status probing.
7. If the portal entry is missing, check the feature switch, `Show Wake-on-LAN shortcut`, and credential service scope.
8. If SSH testing fails, verify direct reachability, the pinned host key, credentials, the selected operating system, and permission for the exact fixed command. Do not work around it by granting unrestricted administrative access.
9. If a third-party platform does not respond, inspect connection state and the latest error, confirm outbound HTTPS/MQTT TLS, credentials, and topic, then save the device again.

- [Gateway Portal](/en/guide/gateway-portal)
- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
- [Event Center and Notifications](/en/guide/event-center-and-notifications)
- [Backup, Restore, and Data Cleanup](/en/guide/backup-and-restore)
