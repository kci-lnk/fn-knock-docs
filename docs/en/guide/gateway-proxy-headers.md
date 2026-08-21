---
lang: en-US
title: "Inbound PROXY Protocol and Upstream Headers"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 84149bddf09f75e1eda90eb3fbce8aead310d88afeb751741c8ce841d0db9a69
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Inbound PROXY Protocol and Upstream Headers

The gateway handles two opposite directions of proxy metadata. A front-end load balancer can use PROXY Protocol to tell fn-knock the real connection address, while fn-knock can send `X-Forwarded-*` headers to the application upstream. Their trust boundaries and settings are separate.

## Accept Inbound PROXY Protocol

For HAProxy, Nginx stream, or another layer-4 load balancer, enable v1/v2 under `System settings → Gateway → PROXY Protocol` and list the proxy IPs or CIDRs allowed to send it. Enter the TCP peer address of the proxy, not the visitor address.

At least one trusted source is required. Only IPs and CIDRs are accepted; hostnames and all-address IPv4 or IPv6 networks are rejected. Only listed socket peers may supply a PROXY header. Other peers can still make ordinary connections, but spoofed `X-Forwarded-For` or `X-Real-IP` cannot override the PROXY address.

PROXY Protocol provides no authentication. Do not copy a client allowlist or trust broad public networks. Use fixed private proxy addresses and network-layer restrictions. Managed FRP enables its required effective PROXY Protocol setting automatically, so do not add FRP visitor addresses to this list.

Saving validates and applies the gateway configuration transactionally. After changes, send a request through the external path and compare the socket peer and client IP in request logs.

## Forward HTTP Proxy Headers Upstream

When fn-knock forwards a request, the upstream service might need to know the original scheme, requested Host, or client address. `System settings → Gateway → Proxy headers` controls, by application Host, whether the gateway sends proxy headers such as `X-Forwarded-*` upstream. It is editable only for Host-based routing in subdomain mapping mode, including direct public `Subdomain mode` and `Reverse proxy mode → Subdomain mapping`. Path mode and Direct mode do not provide this setting.

When enabled, upstream applications can use these headers to generate correct public links, detect HTTPS, record client addresses, or configure their own trusted-proxy handling. When disabled, an application normally sees only the connection between fn-knock and itself.

The UI shows the setting by Host, but the running gateway applies it by upstream Target. If multiple Hosts reuse one Target, disabling proxy headers for one Host affects the others that reuse that Target. If they need different policies, give them different Targets.

## Configure the Upstream Too

Sending proxy headers only provides the information; it does not make the upstream use it automatically. In the application or the web server in front of it, you must also:

1. Configure fn-knock's connection address or subnet as a trusted proxy.
2. Specify the proxy header names that are actually used.
3. Check public URLs, HTTPS detection, and the client IP recorded in access logs.

If the upstream trusts `X-Forwarded-For` from every source, an attacker who connects to it directly and bypasses fn-knock can spoof an address. Restrict the upstream listener at the same time, or use a firewall to allow access only from fn-knock.

## Usage Guidelines

- Enable these headers only when the upstream application needs and correctly handles them.
- The upstream application should trust proxy headers only from fn-knock; do not let it accept an arbitrary client's spoofed `X-Forwarded-For`.
- When a CDN, FRP, or Tunnel sits in front of fn-knock, that preceding layer must remove or overwrite real-IP headers that an external client could spoof. Then confirm the client IP identified by fn-knock in `Request Logs`.
- After changing the setting, compare the Host, scheme, and client IP between `Request Logs` and the upstream access log.

This setting affects only the headers that **fn-knock sends upstream**. It does not determine how fn-knock identifies an inbound client IP and cannot act as a trusted-proxy allowlist. Inbound source detection depends on the preceding layer handling real-IP headers correctly; always verify the result in `Request Logs` after deployment.

- [Preserve the Host Header Upstream](/en/guide/gateway-host-response)
- [Security Model and Baseline](/en/guide/security)
- [Request Logs](/en/guide/request-logs)
