---
lang: en-US
title: "Gateway Visibility"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 2880c3aae15d392fe8c633b10f8499530e10b970ec3482000861f876c3a7efcb
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Gateway Visibility

Gateway Visibility narrows access by region or CIDR before a request reaches an application mapping. It is useful for limiting the gateway to known regions, company egress addresses, or VPN networks. It is not a host firewall and does not replace sign-in authentication.

## How It Differs from Other Rules

| Mechanism | What it controls |
| --- | --- |
| Gateway Visibility | Whether a request can reach the gateway entry point |
| IP Allowlist | Whether a source receives manual or session-associated IP authorization |
| Mapping access policy | Whether a Host is public or requires sign-in |
| Host firewall | Network-layer exposure of original ports; supported by only some deployments |

## Configuration

Configure the global rule under `System settings → Gateway → Visibility`:

1. Enable `Visibility constraint`.
2. Add regions by province, city, and optionally carrier.
3. Add fixed VPN networks, office egress addresses, or other trusted ranges under `Custom CIDRs`.
4. Select `Save and sync` to push the rule to the gateway.

Region selections are resolved to final CIDRs when saved. Enter one custom CIDR per line; both IPv4 and IPv6 are supported, and the configuration cannot be saved while any entry has an invalid format. A region can be filtered by China Telecom, China Unicom, or China Mobile when the connected CIDR database provides carrier data. If that capability is unavailable, you can still use regular regions and custom CIDRs.

Add one CIDR that you know will work—such as your own VPN or office egress—before enabling the restriction. Region databases, mobile networks, and proxy egress locations can all be imprecise. If you restrict access only by region, travel, roaming, and corporate networks can easily be blocked by mistake.

### Enabled with No Rules

The system allows you to save a global configuration that is enabled but has no region or CIDR, and the page displays a warning. In this state, subdomains that inherit the global rule allow only the gateway's existing exempt sources. This is not the same as disabling the restriction; application Hosts can still use a custom range or disable Visibility individually.

This state can easily lock you out of the authentication Host. Use it only when you have a local management path, a backup network, or an explicit Host override strategy.

## Verification and Rollback

1. Open the authentication Host from an external network that should be allowed and confirm that the sign-in page loads.
2. From a network that should not be allowed, confirm that the request is denied instead of reaching the upstream application.
3. Keep a LAN management path available for rollback; do not lock yourself out through your only public management connection.
4. If anything goes wrong, first disable Visibility or add a CIDR, then check the IP geolocation service and real client-IP headers.

## Override the Global Rule for One Host

After global Visibility is enabled, visibility options appear in the advanced settings of each application Host. A Host can select:

| Option | Behavior |
| --- | --- |
| `Inherit global visibility` | Uses the regions and CIDRs from `System settings → Gateway → Visibility` |
| `Custom` | Uses only this Host's own regions or CIDRs, completely replacing the global rule |
| `Disabled` | Applies no Gateway Visibility restriction to this Host; other Hosts continue to follow their own settings |

A custom rule must contain at least one region or CIDR. `Disabled` skips only the Visibility check for the current Host; it does not disable the mapping, sign-in authentication, or other gateway protections. The authentication Host must inherit the global rule and cannot be relaxed separately here.

Host overrides apply only to subdomain mappings in Host-based routing. They do not restrict original ports in Direct mode, stream mappings, or upstream ports that bypass fn-knock.

Local-source authentication exemptions and Gateway Visibility are separate concepts. If a preceding proxy incorrectly forwards a private address, the result might differ from what you expect. Check the client IP in `Request Logs` first.

## Common Problems

### Every Public Entry Point Is Unreachable After Saving

Use a local or backup management path to disable global Visibility or add your current public egress CIDR. Then check whether you accidentally saved an empty rule, whether region resolution succeeded, and whether a preceding proxy supplied the wrong IP.

### An Application Host Works, but the Authentication Host Does Not

The application Host might use `Custom` or `Disabled`, while the authentication Host always inherits the global rule. Add the sign-in source to the global range; relaxing only the application Host is not enough.

### Region Selection Fails to Save

Check connectivity to the CIDR service and the region-resolution result. If carrier filtering is unavailable, upgrade your self-hosted CIDR service or use an unfiltered province/city plus custom CIDRs for now.

- [IP Geolocation](/en/guide/ip-location)
- [IP Allowlist](/en/guide/whitelist)
- [Security Model and Baseline](/en/guide/security)
