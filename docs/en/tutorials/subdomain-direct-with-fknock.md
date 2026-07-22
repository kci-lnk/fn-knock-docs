---
lang: en-US
title: "Publish Services on Subdomains with a Public IP"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: f2efa5b87964cd7b5c57c139140d7f1675c3f305e51f6b3c4e7b19de8a4f0bc6
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Publish Services on Subdomains with a Public IP

Use this pattern when you have reachable public IPv4 or IPv6 connectivity, control a domain, and want each web application to use its own subdomain. The resulting URLs might look like:

```text
auth.example.com     Sign-in endpoint
nas.example.com      fnOS or NAS service
files.example.com    File service
```

This pattern uses `Subdomain mode` for direct public ingress and Host routing. It is not `Reverse proxy mode → Subdomain mapping`. If you do not have public ingress, see [Publish a Subdomain through a Tunnel without a Public IP](/en/tutorials/reverse-proxy-with-fknock).

## Prerequisites

- The fn-knock gateway port is reachable from the internet. The native fnOS FPK, Docker, OpenWrt, Linux, Synology DSM 7 SPK, and Windows deployments can all use this pattern. Docker must publish the gateway port; on Synology and Windows, also confirm that the DSM / Windows firewall, router, or upstream proxy sends public traffic to the gateway.
- The router, cloud security group, and host do not separately expose an application's original port to the internet.
- You control DNS for a domain such as `example.com`.
- At least one recovery device has a working TOTP or username/password credential.
- A real external connection, such as cellular data, is available for testing.

## Configuration

1. Under `System settings → Mode`, select `Subdomain mode` and save.
2. Open `Domains` and enter the root domain and the public port actually used by the authentication service. For example, if the root domain is `example.com`, the authentication Host is `auth.example.com`, and public port `443` forwards to internal gateway port `7999`, enter `443` as the public port.
3. Add the authentication-service mapping. It must remain publicly reachable and must not enable `Require sign-in`, a legacy strict-allowlist rule, or upstream Basic Auth injection on itself.
4. Add the first application Host, such as `files.example.com`. Set its Target to the application's private HTTP address and enable `Require sign-in`.
5. Point both the authentication and application Hosts at the same public endpoint in DNS. Use a wildcard record if you have many services, and confirm that the router forwards the gateway port to fn-knock.
6. Under `SSL`, configure a certificate that covers both the authentication and application Hosts.
7. Configure DDNS if the public address changes; skip it for a static public address.

## DNS and port example

```text
auth.example.com  A/AAAA -> Public endpoint
files.example.com A/AAAA -> Public endpoint
Public 443/TCP -> fn-knock 7999/TCP
```

The browser now opens `https://files.example.com`, and `Public HTTPS port for the auth service` in the root-domain configuration should be `443`. If the public URL is `https://files.example.com:8443`, forward public port `8443` to the actual gateway port and enter `8443` in the corresponding public-port setting.

Before publishing both A and AAAA records, verify separately that IPv4 and IPv6 can reach the gateway. If AAAA points to an unreachable address, an IPv6-capable client may prefer the failing path. Publish only an A record when stable IPv6 ingress is unavailable.

## Application mapping fields

| Field | Recommendation |
| --- | --- |
| Host | Enter the full domain, or let the page combine a prefix with the root domain; do not include a path |
| Target | Use an `http://` or `https://` address reachable from the fn-knock runtime |
| Require sign-in | Enable for private applications; disable for the authentication service |
| Host response | Preserve the visitor's Host by default; turn this off only when the upstream accepts its own Host |
| Skip Basic Auth | Use only to inject the upstream application's own Basic Auth; it cannot replace fn-knock sign-in |
| WAF | Enable or bypass per Host according to application compatibility |

Inside Docker, `127.0.0.1` refers only to the container itself; applications on the host or in other containers must use an address reachable from the fn-knock container. Multiple Hosts that reuse the same Target share the `Host response` setting. Use distinct Targets when they require different policies.

## Verification

Disconnect from home Wi-Fi and test over cellular data in this order:

1. Open the authentication Host and sign in.
2. Open the application Host and confirm that it reaches the correct upstream.
3. In `Request Logs`, confirm the Host, client IP, authentication status, and upstream Target.
4. Try to connect to the application's original public port and confirm that it cannot bypass the gateway.

Being able to access the service without signing in on the LAN does not prove that the public policy works. fn-knock treats private and local sources as locally exempt.

Also test these failure cases:

- Open an unconfigured Host. It should return the gateway's default response rather than another application.
- Use a credential whose service scope does not cover a restricted Host. Access should be denied.
- Sign out and reopen the application Host. The authentication flow should start again unless the current source still has valid IP authorization.
- Confirm that WebSockets, uploads, downloads, and application callbacks continue to work.

## Rollback

Onboard only one application Host before a bulk migration. To roll back, restore the original DNS and port forwarding, then delete or disable the new mappings. Remove certificates and DDNS jobs only after confirming that no other Host uses them. Do not delete the only authentication Host first, or every application that requires sign-in will lose its working entry point.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Authentication Host does not open | DNS, gateway port, router forwarding, certificate, and authentication-service mapping |
| Application Host still rejects access after sign-in | Mapping access policy, credential service scope, cookie domain, and real client IP |
| Wrong application opens | Host name, DNS record, and upstream Target |
| Browser reports a certificate error | The certificate does not cover the Host, or the CDN / origin connection uses the wrong TLS name |

- [Subdomain Routing](/en/guide/subdomain-proxy)
- [TLS Certificates and HTTPS](/en/guide/ssl)
- [Dynamic DNS (DDNS)](/en/guide/ddns)
