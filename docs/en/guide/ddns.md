---
lang: en-US
title: "Dynamic DNS (DDNS)"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: e86a3edaacbf546ce67762e99db72171dcac09583a855d24bdd2732d5eab4975
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Dynamic DNS (DDNS)

DDNS only updates a DNS record to point to the current public address. It does not open ports, configure tunnels, issue certificates, or route application traffic through the gateway.

## When You Need DDNS

- Your public IPv4 or IPv6 address changes and the gateway is accessed directly from outside your network.
- Subdomain mode requires the authentication Host, application Hosts, or a wildcard record to point to the same entry point.
- You use an edge CDN to reach the origin, but the origin address changes.

When using Cloudflare Tunnel, DNS is normally managed through the tunnel's Public Hostname. Do not create a competing DDNS record for the same domain.

## Configure a Record

Under `DDNS Management`, select a provider and enter the credentials, domain, record type, and update scope. Pay particular attention to:

| Item | What to check |
| --- | --- |
| Domain | Enter the record name to update, not a full URL, path, or port |
| Update scope | Select IPv4, IPv6, or dual stack based on the network that is actually available |
| IP source | Use public detection, a selected interface, a static IP, or another domain's resolved address; in Docker, confirm that the result is the host address |
| Outbound interface | On a multi-interface device, select an interface that can reach the provider API |
| Wildcard record | A subdomain gateway usually needs `*.example.com`; the authentication Host must also resolve |

After saving, run the page's test or a manual update, then verify the record value with `dig`, `nslookup`, or the DNS provider's console. Correct resolution only proves that DNS was updated. You must still test the port, certificate, and gateway routing from an external network.

The current provider catalog includes Alibaba Cloud DNS, Baidu Cloud DNS, Cloudflare, DNSHE, DNSPod, DuckDNS, Dynu, dynv6, Tencent Cloud EdgeOne (CNAME access), Tencent Cloud EdgeOne, Alibaba Cloud ESA, GoDaddy, Huawei Cloud DNS, No-IP, Porkbun, and Tencent Cloud DNSPod. The page displays the required fields for the selected provider. Do not reuse another provider's Zone ID, Token, or root-domain field.

### DNSHE

For `DNSHE`, enter the `API Key` generated under API Management and its paired `API Secret`, then distinguish the two domain fields:

| Field | Description |
| --- | --- |
| `DNSHE managed domain` | The full, usable managed domain registered in the DNSHE account, such as `example.com` |
| `Domain` | The full record name to update within that managed domain, such as `nas.example.com` |
| `TTL` | Optional; defaults to `600` seconds |

DNSHE supports A and AAAA records at the apex, ordinary subdomains, and wildcards. Synchronization updates an existing record when its address changes, creates a missing record, and skips unnecessary writes when the address is unchanged. If the log reports a missing or unavailable managed domain or a record without an internal ID, verify the domain status and record ownership in DNSHE before retrying.

## Primary and Additional Domains

`Primary domain config` is the default update target. Its status card shows the current IPv4 and IPv6 addresses, last check, and last successful update. Under `Additional domains`, you can add independent targets, each with its own provider, credentials, IP source, update scope, and enabled state.

Additional domains do not inherit the primary domain name or provider configuration. The page can, however, recognize credentials saved for the same provider in another module or target and fill only fields that are currently empty. After filling them, verify the Zone, root domain, and least-privilege permissions.

For an individual additional domain, you can run `Update now`, disable it, enable it, edit it, or delete it. Disabling only pauses that target; deleting also removes its runtime status. Clearing the primary configuration does not delete additional domains, but the primary domain cannot participate in automatic updates until it is configured again.

## Pair a Domain with Its Wildcard

For providers that support two targets, the domain field can contain a wildcard and its matching base domain:

```text
*.r.example.com, r.example.com
```

The two values must form a wildcard/base pair, and the base must match the provider's Zone or root domain, or be beneath it. The page accepts an ASCII comma, full-width comma, or whitespace and normalizes the value when the field loses focus. Single-address or single-domain providers such as EdgeOne CNAME do not accept this pair; follow the capability hint shown on the page.

## Select an Address from an Interface

When you select `Use interface directly`, you must explicitly choose an interface. By default, the page uses only globally routable public candidates. It excludes RFC1918 private IPv4, IPv6 ULA, tentative addresses, addresses that failed duplicate-address detection, and deprecated addresses; temporary/privacy IPv6 addresses are also excluded by default. If no candidates remain, choose another interface or switch to public detection, a static IP, or domain resolution.

Enable `Allow private addresses` when publishing an address for internal DNS, a VPN, or split-horizon DNS. This switch adds only RFC1918 IPv4 and IPv6 ULA addresses to the current target's interface candidates. It does not admit loopback, link-local, CGNAT, or other reserved addresses, and it does not change router, firewall, or public-DNS reachability.

Address selection no longer depends on an address's position in the interface list. If you set a `Preferred address`, the system uses it first whenever it still satisfies the filter rules. Only when no preferred address is set or it is unavailable does the system keep the current usable address, then choose stably from the remaining candidates. This keeps an explicit choice ahead of the system recommendation while preventing record churn when no choice is set. Address positions saved by older versions are converted to stable selection rules on the page and take effect after saving. If an older configuration has no selection rule or its old position is no longer valid, the backend also applies the automatic stable-selection rule; unattended updates do not stop merely because a position is missing.

During automatic sync, if the currently published address remains usable and a previously preferred IPv6 address has just reappeared, the system waits until it is detected in `3` consecutive runs before switching back. This prevents brief recoveries from making DNS flap. A manual immediate update does not use this stabilization delay; use it only after confirming that the path is stable.

When you switch to a different interface, the page clears selection rules associated with the old interface, including its preferred address, CIDRs, and IPv6 interface ID. This prevents old rules from being applied to the new interface. Review the preview and configure any required rules again after switching.

With private addresses enabled, an explicit `Preferred address` still wins, followed by the current usable address. If the system must choose again automatically, public candidates rank ahead of private candidates. Disabling the switch immediately excludes private addresses from the preview and subsequent updates. If the DNS record still contains a private address, update it manually or wait for the next sync to replace it.

You can set a `Preferred address` in either automatic or custom mode. To narrow the selection by subnet or IPv6 interface ID, switch to `Custom matching rules`:

| Setting | Effect |
| --- | --- |
| `Preferred address` | Uses this address ahead of the current address and system ranking when it is a candidate; if it becomes unavailable, another matching candidate may still be selected |
| `Included CIDRs` | Selects only from the specified IPv4 or IPv6 networks |
| `Excluded CIDRs` | Excludes networks that should not be written to DNS |
| `IPv6 interface ID (lower 64 bits)` | Ignores a changing prefix and selects a new IPv6 address with the same interface ID |
| `Allow temporary/privacy IPv6 addresses` | Disabled by default to avoid frequent updates as privacy addresses rotate |

The page previews the final selected address in real time. If the rules match multiple candidates, the preview shows the candidate count and selects one deterministically based on stability, rather than the interface list's incidental order. Do not rely on the configuration for updates if nothing matches. If the IPv6 prefix changes but the device's interface ID remains stable, choose the current preferred address and retain the automatically extracted lower 64-bit interface ID. Leave temporary/privacy addresses disabled when they should not be used.

## Configure Public Address Detection

DDNS public-address detection can use `Built-in HTTP (default)` or the system `curl`. When an outbound interface is selected, built-in HTTP binds to that interface's local address, which is useful for explicitly controlling detection traffic on a multi-interface device. System `curl` depends on the command and network environment already available on the host.

The detection settings can also select a public DNS resolver: `Do not use`, Alibaba DNS, Tencent DNS, Cloudflare DNS, or Google DNS. Alibaba DNS is the default. This resolver is used only to resolve public-address detection services. It does not change the DDNS provider or records being updated, and it does not modify DNS for your application domains.

You can maintain multiple IPv4 and IPv6 detection sources separately. A source may be an HTTP(S) URL that returns a plain IP address, or a resolvable domain. Before changing the configuration, select `Test sources` and verify the status code, response preview, and detected IP for each source. `Restore factory sources` replaces only the draft in the dialog; you must still save it for the change to take effect.

## Automatic Sync and Logs

The automatic sync interval can be set from `5` to `1440` minutes and defaults to `10` minutes. A new interval starts with the next sync cycle after it is saved. Manual `Refresh now` and `Update now` actions for additional domains do not wait for the interval.

Use the logs to distinguish four classes of problem:

| Log stage | Common problems |
| --- | --- |
| Address retrieval | Detection source unreachable, no candidate on the interface, or an invalid static IP or source domain |
| Provider authentication | Incorrect Token, Secret, permissions, or system time |
| Zone / record lookup | Root domain, Zone ID, site name, or full domain does not match |
| Create / update | API rate limiting, record-type conflicts, or unsupported TTL or proxy status |

Clearing logs does not clear the configuration or runtime status. While troubleshooting, keep the most recent failure and the records around it. Redact Tokens, Secrets, Zone IDs, and public addresses before sharing logs.

## Minimal Plan for a Subdomain Setup

For example, `auth.example.com` and all application subdomains can point to the same gateway entry point. A common setup maintains both the authentication Host and a wildcard record. Whether those records should be A, AAAA, or CNAME depends on the DNS provider and network topology.

IPv6 is not an automatic replacement for IPv4. If you configure only IPv6, clients, routers, and CDNs must all have working IPv6 connectivity. Test both record families separately in a dual-stack environment.

## Troubleshooting

1. Review authentication, lookup, and update results in the DDNS logs.
2. Confirm that the interface selector previews an address appropriate for the target DNS. A public record should not accidentally select a Docker or private-network address; a private record requires `Allow private addresses`.
3. After an immediate update, confirm that `Last successful update` changes on the status card. If only `Last check` changes, nothing was written successfully during that run.
4. Confirm that the DNS record name, Zone or root domain, and access Host match exactly.
5. Verify the record value through an authoritative DNS server or the provider console instead of relying only on a local cache.
6. From an external network, test DNS, TLS, the gateway port, and the application itself one layer at a time.

- [Cloudflare DDNS](/en/guide/cloudflare-ddns)
- [TLS Certificates and HTTPS](/en/guide/ssl)
- [Choose a Runtime Mode](/en/quick-start/run-modes)
