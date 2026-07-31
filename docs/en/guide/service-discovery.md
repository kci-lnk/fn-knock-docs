---
lang: en-US
title: "Service Discovery and Bulk Onboarding"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 80de507c4cd7deef31904c2bf2a22134d264b33e0f8c8ed10c67fb50382282b7
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Service Discovery and Bulk Onboarding

`Discover` searches for HTTP services on local IPv4 networks reachable from fn-knock and turns recognized results into draft subdomain or path mappings for you to review. It does not scan the public internet or automatically publish a service just because it finds an open port.

## Entry Points and Prerequisites

Service discovery is not a separate menu. You can open it from:

- `Subdomain mappings → Discover`: save the root domain first; scan results generate application Hosts;
- `Path mappings → Discover`: shown only under `Reverse proxy mode → Path mode`; scan results generate path rules.

Under Subdomain mappings, discovery cannot start while the root domain is unsaved or the page has other unsaved changes. The scan tests connectivity only from the fn-knock runtime environment. Docker has a different network view from the host, so host services must be reachable from the container network.

## Scan Targets

After opening `Discover`, expand the scan-range settings. Default targets come from the current runtime environment:

| Source | Description |
| --- | --- |
| Localhost | Uses `127.0.0.1/32` on non-Docker deployments |
| Docker host | On Docker deployments, identifies a reachable host LAN network from the management entry point |
| Interface | Local IPv4 interface networks that the current environment is allowed to scan |
| Mapping | Derived from Targets in existing subdomain or path mappings |
| Custom | A CIDR entered and saved manually by an administrator |
| Saved | A previously saved CIDR that remains part of the scan range |

Only IPv4 CIDRs that fall entirely within these ranges are accepted:

- Loopback `127.0.0.0/8`;
- RFC 1918 private networks `10.0.0.0/8`, `172.16.0.0/12`, and `192.168.0.0/16`;
- CGNAT `100.64.0.0/10`;
- Link-local `169.254.0.0/16`.

You can select at most `16` CIDRs per scan, covering no more than `1024` unique hosts in total. If a network is too large, split it into a narrower CIDR instead of relying on the system to truncate the result.

`Use automatic` resumes following the current automatically detected targets. After manually selecting, clearing, or adding a CIDR, save the ranges. Starting a scan directly also makes the page try to save the current ranges first. At least one target must remain selected.

## Port Range and Scan Intensity

Each target host is probed on ports `80–60000`. The scanner skips fn-knock's own ports and known internal service ports, and avoids additional ports that could cause self-probing when it scans the local host. After finding an open TCP port, the system makes an HTTP request to identify the service. An open non-HTTP port alone does not produce a candidate mapping.

Scan intensity can follow the device recommendation or be selected manually:

| Level | Target concurrency |
| --- | ---: |
| Low | 32 |
| Medium | 115 |
| High | 256 |
| Extreme | 512 |

Actual concurrency does not mechanically reach the value in the table. The system calculates a safe limit from CPU cores, available memory, the file-descriptor limit, and container resource limits, then uses the lower value. Automatic mode is enabled by default and recalculates the recommended level when device capacity changes.

The level changes only duration and device load; it does not change CIDRs, the port range, or identification rules. Keep automatic or Low intensity on a NAS, router, or low-memory device. If a higher concurrency level is still slow, the scan range is usually too broad.

## Discovery Results

The scan dialog continuously displays hosts, ports, progress, and identified services. The system recognizes common applications from HTTP status, response headers, and page characteristics. When it cannot identify an application precisely, it creates a generic candidate from the page title or `HTTP + port`.

When a candidate name or identification label is too long, the page truncates it visually and shows the full content on hover, without covering scan settings, suggested actions, or candidate buttons. Truncation does not change the saved value; confirm the full name through the tooltip or editor before saving.

Candidate values are only suggestions:

- Subdomain mode suggests a subdomain and defaults to a mapping that requires sign-in, enables the WAF, and preserves the upstream Host;
- Path mode suggests a path, whether to rewrite HTML, whether to use root mode, and whether to make it the default route;
- When upstream Basic Auth is detected, the page warns about the risk but does not save the username or password automatically;
- The page filters or rejects bulk saving when the same Target, Host, path, or duplicate candidate already exists.

Review every candidate name and Target before saving. Generic detection cannot know an application's real base path, callback URL, WebSocket, Cookie, or trusted-proxy requirements. A successful bulk add does not mean that public access already works.

Stopping a scan or closing the dialog cancels the current task. Candidates already displayed enter the configuration only after you select the bulk-save action.

## Recommended Workflow

1. From the fn-knock runtime environment, confirm that the target IP and port are reachable.
2. Save the root domain or switch to the correct Path mode.
3. Open `Discover`, expand the settings, and narrow the CIDR to the actual device network.
4. Keep automatic or Low intensity on a resource-constrained device, then start the scan.
5. Deselect candidates that should not be published and rename ambiguous or conflicting subdomains and paths.
6. After bulk saving, review authentication, WAF, Target, and routing options for every entry.
7. Verify the upstream on the LAN first, then use a mobile network to test public DNS, tunnel, certificate, and sign-in behavior.
8. In Request Logs, confirm the Host, source IP, route, and upstream status.

## Common Problems

### Host Services Are Not Found

In Docker, `127.0.0.1` is the container itself. Confirm that the service does not listen only on the host loopback interface and use a host address reachable from the container. Also check the Docker network, firewall, and service listener.

On a non-Docker deployment, confirm that the target falls within an allowed local IPv4 range. IPv6 addresses, domains, and public addresses cannot be discovery CIDRs, though you can still create a valid Target manually after discovery.

### A Port Is Found, but No Candidate Appears

Service discovery generates candidates only for services it can analyze over HTTP. TCP, UDP, TLS-only services, or services that require a special handshake can have an open port without producing a result. An HTTP service that forces a plaintext request onto an HTTPS-only port might also be skipped; add the mapping manually and verify the scheme in that case.

### The Scan Takes Too Long or Device Load Is High

First reduce the CIDR and host count, then lower the intensity. A scan can cover as many as `1024 × 59921` port probes, so target range has a larger effect on total work than the concurrency level. Closing the dialog cancels the task, but a small number of already-issued network probes might remain until they time out.

### Candidate Services Are Duplicated or Use Unexpected Ports

The same application can return similar pages on multiple ports. The system merges some results by identification key, but it cannot decide the real entry point for an administrator. Keep the application's production listener and remove health-check ports, redirect ports, or candidates already handled by another mapping.

- [Subdomain Routing](/en/guide/subdomain-proxy)
- [Path-based Reverse Proxy (Compatibility Mode)](/en/guide/reverse-proxy)
- [Request Logs](/en/guide/request-logs)
- [Ports, Endpoints, and URL Paths](/en/quick-start/ports-and-entrypoints)
