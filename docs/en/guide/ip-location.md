---
lang: en-US
title: "IP Geolocation"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: c7b106ccf83e900b8bc5bbb4d9389bd9fc91eef0ca21ff98d7fa18321312e084
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# IP Geolocation

IP geolocation uses two independently configurable data sources: one identifies an individual public IP, while the other resolves region conditions into CIDRs. It provides display or rule data for sessions, allowlists, request and WAF logs, the Event Center, automated scan blocking, SSH hardening, and Gateway Visibility.

Geolocation results are supporting evidence, not precise location data, and should not be the only authentication condition for a high-risk entry point.

## Two Types of Service

| Service | Purpose |
| --- | --- |
| IP lookup database | Converts one public IP into country, province/city, ISP, and related information |
| CIDR database | Provides province and city lists, then converts region and carrier conditions into CIDRs used by rules |

Each service can independently use the official online service or a custom service, so you can mix them. For example, IP lookup can use the official service while CIDR queries use a self-hosted service on the LAN.

## Official Online Services

When `Official online service` is selected, the system uses:

- IP lookup: `https://ipaddress.fnknock.cn/api/v1`
- CIDR database: `https://cidr.fnknock.cn/api/v1`

The official services require minimal configuration and keep regional data up to date automatically. The fn-knock runtime environment must be able to resolve their domains and connect to the HTTPS endpoints. Use custom services on an offline network or where outbound access is restricted.

## Custom Services

The compatible implementations recommended on the page are:

| Service | Project | Default value |
| --- | --- | --- |
| IP lookup database | `go-ipaddress-api` | `http://127.0.0.1:30661` |
| CIDR database | `go-cidr-api` | `http://127.0.0.1:30662` |

Under `System settings → Location`, select `Custom service` and enter the service root URL. It must begin with `http://` or `https://`; a trailing slash is removed when saved.

If you enter a domain root such as `https://example.test`, fn-knock automatically appends the `/api/v1` API path. If the URL already includes a custom path, such as `https://example.test/custom/`, fn-knock requests endpoints such as `ip/lookup` and `provinces` directly below that path.

In Docker, `127.0.0.1` points to the fn-knock container itself. If a self-hosted service runs in another container or on the host, use its service name on the same Docker network, an address on the host that the container can reach, or an explicitly published port.

## Test and Save

`Test connection` uses the values currently in the form; you do not need to save them first:

- The IP lookup test queries `8.8.8.8` and checks that the response contains a success status and lookup result;
- The CIDR test reads the province list and then probes support for carrier filtering.

Save only after both tests pass. A successful test means that the endpoint and response format work, but it does not guarantee complete data for every address and region.

Region selection can filter CIDRs by China Telecom, China Unicom, or China Mobile. A self-hosted CIDR database must provide carrier data for this filtering. If it does not, the connection test prompts you to update the database while regular province and city queries remain available.

## How Data Appears in the UI

The backend performs IP geolocation lookups asynchronously through a queue and caches the results. The first time you open a session, log, allowlist entry, or event detail, the page might initially show `Resolving location...` and fill in the location afterward. Private and loopback addresses skip public geolocation lookup.

Location data on existing records might have been stored when the record was created or filled later from the cache. After switching data sources, do not assume that every historical record will refresh immediately.

## Verification and Limitations

After saving, spot-check the same public IP in:

1. Request Logs or WAF logs;
2. Sessions, the IP Allowlist, or the General blacklist;
3. The Event Center;
4. SSH sign-in logs.

The different locations should show the same or similar results. If they do not, check the Base URL, scheme, DNS, container networking, TLS certificate, service response format, and fn-knock backend logs.

If every request is shown as a CDN, reverse proxy, private, or loopback address, fix [real client-IP forwarding](/en/guide/gateway-proxy-headers) before changing the geolocation database.

Geolocation databases lag behind real-world changes, ISPs can reuse addresses, and region rules can block travelers, roaming users, or corporate egress by mistake. Combine geolocation with CIDRs, sign-in authentication, and log review instead of using it alone for high-risk access.

- [Gateway Visibility](/en/guide/gateway-visibility)
- [SSH Hardening](/en/guide/ssh-security)
- [Automated Scan Blocking](/en/guide/scanner-interception)
