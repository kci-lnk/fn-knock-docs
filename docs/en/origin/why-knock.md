---
lang: en-US
title: "Why We Built fn-knock"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 5dd44afd0472d7e38bba48232ebc4839b57ac05b1a23c0c05d41f20aba14a52d
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Why We Built fn-knock

Many people buy a NAS because they want to keep their photos, files, and personal services under their own control. Once the device is set up, a question quickly follows: how do you reach your NAS when you are away from home?

Port forwarding is the most direct answer. Open one port for the photo library, another for the download client, and another for the admin UI. It is certainly convenient. But as soon as those ports are on the public internet, they face more than you and your family: automated scripts scan public addresses around the clock. You see your services at home; they see a collection of entry points they can keep probing.

We built `fn-knock` to make public access simpler. Your services continue to work as before, while fn-knock takes control of the entry point. A visitor signs in first, and only after their permission is confirmed does the gateway forward the request to the NAS.

## Why Put Another Door in Front of the Service

In early 2026, fnOS experienced a serious security incident. In a subsequent [incident report](https://club.fnnas.com/forum.php?mod=viewthread&tid=28887), the fnOS team confirmed that it had found and fixed three vulnerabilities involving unauthorized access, path traversal, and authentication bypass. After some attack methods became public, devices that had not yet been updated faced widespread probing and attacks.

An [analysis](https://blog.xlab.qianxin.com/netdragon/) of malicious samples by Qianxin XLab found that some infected devices had joined the Netdragon botnet, where they were used for DDoS attacks and remote command execution. The malware also changed firewall rules and the `hosts` file, interfering with the device's ability to retrieve updates.

The incident offers a practical reminder: a sign-in page and two-factor authentication protect only the normal sign-in flow. If a vulnerability exists before sign-in, or if an attacker can bypass the original authentication, adding more sign-in factors cannot stop that request.

This is not unique to fnOS. NAS operating systems, third-party applications, and Docker containers all receive code updates, and any of them may develop new vulnerabilities. Timely updates remain essential, but “I am on the latest version” cannot be the entire security plan. Every entry point removed from public exposure is one less place an attacker can touch the service directly.

## Is Basic Auth Enough?

Tools such as Lucky and Nginx make it easy to add Basic Auth to a page. It works well for temporarily protecting a page or filtering out untargeted scans.

Basic Auth, however, usually relies on one long-lived username and password. The credentials sent over the network are Base64-encoded, not encrypted, so HTTPS is mandatory; [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Authentication) explicitly warns about this. If the credentials leak, anyone who obtains them can continue using them.

There are also compatibility problems in practice. Browsers, WebDAV clients, media players, and mobile apps do not all handle authentication headers in the same way. Repeated sign-in prompts are common, and some clients may not work at all. The result is an ever-growing set of exceptions for individual paths and clients.

Basic Auth can remain a useful additional layer, but we do not want it to be the only credential protecting public NAS access. fn-knock uses separate sign-in credentials and sessions, supports TOTP, Passkeys, and external accounts, lets administrators inspect and revoke sessions, and can restrict which services a credential may access.

## Do I Still Need fn-knock if I Already Have a WAF?

A WAF such as SafeLine is a good fit for protecting a public website. A website is intended to receive every visitor, and the WAF identifies SQL injection, XSS, path traversal, and malicious bots within those requests.

A NAS admin UI, download client, or private photo library usually has no reason to receive requests from strangers. Instead of letting every request touch the service and then deciding whether it looks malicious, we would rather prevent unsigned-in visitors from reaching the service at all.

The two can work together. fn-knock also provides WAF, scanner blocking, blocklists, and rate limiting. Sign-in determines whether the visitor is authorized; WAF continues inspecting suspicious requests that have entered the gateway. Each layer has its own job.

## Why Not Just Use Tailscale or ZeroTier?

Tailscale, ZeroTier, EasyTier, and WireGuard are all mature private-networking solutions. When the devices are predictable and every one of them can run a client, they provide stronger network isolation.

The tradeoff is that every phone, tablet, and computer must join the virtual network first. Temporarily using another device, or sharing one service with a family member, requires additional client configuration. If another VPN or proxy is already running on the device, route, DNS, or operating-system VPN permission conflicts can also occur.

fn-knock serves a different usage pattern: open a browser, enter your own domain, sign in, and use the service. It does not require a private-network client on every device and does not take over the device's entire network egress.

Neither approach is universally better. If you want no public entry point at all, use a virtual private network. If family members should be able to reach web services such as a photo library or media library easily, place fn-knock at the public entry point.

## What fn-knock Actually Does

For web services, you can assign a subdomain to each service:

```text
auth.example.com     Sign-in entry
nas.example.com      NAS
media.example.com    Media library
download.example.com Download client
```

All of these domains reach the fn-knock gateway first. If the visitor is not signed in, the gateway takes them to the authentication page. After sign-in, it forwards the request to the matching private service. Externally, only one shared entry point is needed; there is no need to forward every application's original port.

If your home has no public IP, FRP or Cloudflared can provide [NAT traversal with subdomain routing](/en/quick-start/reverse-proxy-mode) without changing how sign-in and service mappings work. For the few services that must retain an original TCP / UDP port, platforms with host-firewall control can use [direct authorization](/en/quick-start/direct-mode).

A request passes through roughly these stages:

1. The gateway checks scanning behavior, allowlists and blocklists, and the request source.
2. A protected service checks the current session.
3. The user signs in with TOTP, a Passkey, a username and password, or an external account.
4. The gateway confirms whether that credential may access the current service.
5. After WAF and other checks, the request is forwarded to the private application.
6. The result is written to request logs, and abnormal conditions can generate notifications.

If sign-in protection is enabled for a mapping, a request without a valid session is not sent upstream. For this protection to work, all public traffic must pass through fn-knock, and the application's original port must not remain independently exposed.

## How a Request Flows

```text
Visitor
  ↓
DNS / router / CDN / tunnel
  ↓
fn-knock gateway
  ├─ Sign-in, sessions, allowlist, WAF, request logs
  └─ Select a private service by domain, path, or protocol
  ↓
NAS, file service, media service, or another application
```

The admin UI is for administrators to configure fn-knock; it is not the application entry point for ordinary visitors. Three components work together at runtime:

| Component | Responsibility |
| --- | --- |
| Rust service | Admin UI, authentication, security policies, certificates, DDNS, tunnels, and operational tasks |
| Go gateway | Receives external requests and performs sign-in checks, service routing, and reverse proxying |
| SQLite | Stores configuration and runtime data without requiring a separate Redis installation |

The admin frontend is bundled into the installation packages and images, so a normal deployment does not require Node.js. Admin ports, gateway ports, and listening scopes vary by platform; see [Ports, Entry Points, and Access Paths](/en/quick-start/ports-and-entrypoints) when deploying.

## What fn-knock Can and Cannot Protect

fn-knock can protect only requests that pass through its gateway. If the router still forwards the original admin port, or a cloud platform retains another origin path, an attacker can bypass the gateway.

After installation, you still need to:

- Update the NAS operating system, Docker images, and applications promptly.
- Close public ports and origin addresses that are no longer used.
- Configure routers, CDNs, and reverse proxies to pass the visitor's IP correctly.
- Give each account only the services it needs instead of sharing a high-privilege credential.
- Back up configuration, certificates, and important data regularly.
- Test the complete public sign-in flow over mobile data.

By default, fn-knock exempts some LAN, loopback, and private sources so that users can connect directly at home. Being able to open a page on the LAN therefore does not prove that public sign-in is configured correctly. Always test from a real external network.

## Knock First, Then Connect

Security tools often fail in one of two ways: simple tools lack the features people need, while professional tools are difficult to configure. Many users only want to open the family photo library and files safely from a phone; they do not want to study reverse proxies, firewalls, certificates, and multiple authentication protocols first.

fn-knock brings these pieces together so that installation, sign-in, service mapping, and baseline protection can all be handled from a phone. The possibility of a service vulnerability does not disappear, but keeping unsigned-in visitors from touching the service removes a substantial part of the risk.

We will not promise that installing fn-knock makes a system absolutely secure, and we will never suggest that anyone stop updating their system because of it. The product does one practical thing: identify the visitor first, then decide whether to open the door.

Start by connecting one service:

- [Choose a Deployment Method](/en/quick-start/deployment-options)
- [Choose Direct Public Access or NAT Traversal](/en/quick-start/run-modes)
- [Understand Ports, Entry Points, and Access Paths](/en/quick-start/ports-and-entrypoints)

## References

- [fnOS: Full Explanation and Reflection on the Recent Security Incident](https://club.fnnas.com/forum.php?mod=viewthread&tid=28887)
- [Qianxin XLab: Rapid Analysis of the Netdragon Botnet Targeting fnOS NAS](https://blog.xlab.qianxin.com/netdragon/)
- [fnOS Security Disclosure and Mitigation Guidance](https://help.fnnas.com/articles/v1/safety/vulnerability-report)
- [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Authentication)
- [SafeLine README](https://github.com/chaitin/SafeLine)
