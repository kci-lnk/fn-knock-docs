---
lang: en-US
title: "fnOS App Store Lite vs. the Standard FPK"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: fca97cc95aaf2bcc6232cd745e089bc048e5b93a2ac2a90be8d04b2a021a45db
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# fnOS App Store Lite vs. the Standard FPK

`Knock Lite` is the native fnOS package distributed through the fnOS App Store. It is not the Docker edition or a time-limited trial. Lite provides the same core gateway and management capabilities as the standard FPK from the official website, but it runs under a dedicated non-root package account.

The main difference is not whether reverse proxying, authentication, or WAF is available. It is whether fn-knock can modify the fnOS host directly. Lite stays within a non-root permission boundary, so it does not provide host firewall changes, system network tuning, or privileged-port listeners. The standard FPK runs as root and can provide those host-level integrations.

## Which edition should you choose?

The App Store Lite edition is usually a good fit when you:

- mainly use Host or path-based reverse proxying;
- need TOTP, username/password, Passkey, OIDC, LDAP, or other authentication;
- need DDNS, certificates, ACME DNS-01, WAF, request logs, and monitoring;
- use the built-in FRP or Cloudflared tunnel without asking fn-knock to modify the host firewall;
- prefer to keep the package inside a non-root permission boundary.

Choose the standard FPK from the official website when you explicitly need any of the following:

- Direct mode, which opens original device ports dynamically after sign-in;
- automatic host-firewall management;
- Smart Connect, SSH security, system clock synchronization, or fnOS network tuning;
- Web Terminal or fnOS certificate-store synchronization;
- FN Connect traffic routed through the WAF;
- in-app updates;
- standard-port public ingress and automatic HTTPS when public ports `80 / 443` are reachable.

## Feature comparison

| Capability | App Store Lite | Standard FPK | Notes |
| --- | --- | --- | --- |
| Host / path reverse proxy | Supported | Supported | Both editions can forward gateway requests to internal web services |
| Authentication and access control | Supported | Supported | Includes TOTP, username/password, Passkey, OIDC, LDAP, sessions, and service scopes |
| DDNS | Supported | Supported | Maintains DNS records for public IPv4 / IPv6 addresses |
| TLS certificates and ACME DNS-01 | Supported | Supported | Lite can request, upload, manage, and use HTTPS certificates |
| WAF, request logs, and monitoring | Supported | Supported | Lite retains the core HTTP protection and observability features |
| Built-in FRP / Cloudflared | Supported | Supported | Tunnels are outbound connections and do not require host-firewall management |
| Direct mode | Not supported | Supported | Direct mode changes the host firewall dynamically for authenticated source addresses |
| Host firewall management | Not supported | Supported | Lite does not write, reset, or remove fnOS firewall rules |
| Smart Connect | Not supported | Supported | Requires control of the host `dnsmasq` service and split-horizon LAN DNS |
| SSH security | Not supported | Supported | SSH log detection, source blocking, and rule synchronization require host logs and firewall access |
| System clock synchronization | Not supported | Supported | Lite does not change the fnOS host clock |
| Automatic HTTPS | Not supported | Supported | A standard-port public-ingress helper used when public `80 / 443` are reachable; this does not mean Lite lacks HTTPS |
| fnOS certificate-store synchronization | Not supported | Supported | Certificates in Lite are not written automatically to fnOS certificate records |
| fnOS network tuning | Not supported | Supported | BBR and TCP MTU probing require changes to host `sysctl` settings |
| Web Terminal | Not supported | Supported | Lite does not expose a host shell or tmux session |
| FN Connect traffic through WAF | Not supported | Supported | This ingress path requires host network and firewall permissions |
| In-app updates | Not supported | Supported | Lite updates through the App Store or manual package installation; the standard FPK can update from the admin panel |

## Automatic HTTPS is not the same as HTTPS support

“Automatic HTTPS” in the table is a narrowly scoped host feature. It is not a verdict on the edition's overall HTTPS support.

It is intended for a direct public-ingress setup where:

1. the ISP does not block inbound TCP ports `80` and `443`;
2. the router, firewall, or NAT forwards those standard public ports to fn-knock;
3. fn-knock already has a valid certificate for the actual public hostname.

Under those conditions, the standard FPK can use host privileges to listen on port `80`, redirect HTTP requests to HTTPS at the gateway, and enable the certificate that has already been configured. The switch does not register a domain, remove ISP filtering, create router port-forwarding rules, or configure a CDN origin.

Lite cannot bind the host's privileged port `80` directly, so it does not offer this switch. That does not prevent you from:

- requesting, uploading, and managing certificates in Lite;
- requesting and renewing certificates with ACME DNS-01;
- serving HTTPS from the Lite gateway on its configured port;
- forwarding public port `443` from a router to the Lite gateway port;
- terminating public HTTPS at an upstream reverse proxy, CDN, edge platform, FRP, or Cloudflared.

If the ISP blocks port `80`, even the standard FPK cannot use public port `80` for the automatic redirect. If port `443` is also unreachable, standard-port direct public HTTPS is unavailable and you need another port, a tunnel, or an edge platform. Certificate issuance through DNS-01 does not depend on public port `80`.

See [TLS Certificates and HTTPS](/en/guide/ssl) for the complete certificate and ingress boundaries.

## Runtime differences

| Item | App Store Lite | Standard FPK |
| --- | --- | --- |
| Runtime account | Dedicated non-root `fn-knock-lite` package account | Root |
| Default ports | `8998 / 8997 / 8996 / 8999` | `7998 / 7997 / 7996 / 7999` |
| Ports accepted by the setup wizard | `1024`–`65535` | `1`–`65535` |
| Update method | App Store or manual package installation | Supports in-app updates from the admin panel |
| Legacy Redis migration | Not provided | Supports migration from early Redis-based releases |

The port-range restriction only means that Lite cannot listen directly on host ports below `1024`. It does not prevent a router from mapping a public port to Lite's high-numbered gateway port.

## Migrate from Lite to the standard FPK

The editions use different default ports, but running both at the same time is still not recommended. Migrate in this order:

1. Export a `.knock` backup from Lite's Maintenance page.
2. Stop or uninstall Lite and confirm that its ports have been released.
3. Install the standard FPK for the device architecture.
4. Open the standard FPK and import the `.knock` archive.
5. Recheck gateway ports, certificates, external port forwarding, tunnels, and host-level features.
6. Test the authentication Host and one application Host from both the LAN and a mobile network.

A `.knock` archive migrates restorable application configuration. It does not contain host firewall state, external DNS records, or upstream application data. See [Backup, Restore, and Data Cleanup](/en/guide/backup-and-restore) for the complete scope.
