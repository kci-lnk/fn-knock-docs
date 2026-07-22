---
layout: home

hero:
  name: fn-knock
  text: One secure gateway for your HomeLab
  tagline: Put your NAS, photo library, download stack, and self-hosted apps behind one gateway. Authenticate first, then connect—directly over a public IP or through FRP and Cloudflare Tunnel when you are behind CGNAT.
  image:
    src: /logo.png
    alt: fn-knock
  actions:
    - theme: brand
      text: Start deploying
      link: /en/quick-start/deployment-options
    - theme: alt
      text: I have a public IP
      link: /en/quick-start/subdomain-mode
    - theme: alt
      text: I am behind CGNAT
      link: /en/quick-start/reverse-proxy-mode

features:
  - title: One gateway, many self-hosted services
    details: Route separate subdomains to your NAS and apps while managing sign-in, TLS, and access policies in one place.
    link: /en/guide/subdomain-proxy
  - title: Authenticate before reaching the service
    details: Use TOTP, passkeys, passwords, or an external IdP, with sessions, IP allowlists, WAF rules, and request logs.
    link: /en/guide/auth
  - title: Fits your hardware and network topology
    details: Deploy on fnOS, Docker, OpenWrt, Linux, Synology DSM, or Windows, with optional FRP and Cloudflare Tunnel connectivity.
    link: /en/quick-start/deployment-options
---

## First-time setup

Bring one service online in this order. Verify the complete path before onboarding the rest of your stack:

1. Choose fnOS, Docker, OpenWrt, Linux, Synology DSM, or Windows and complete the [installation](/en/quick-start/deployment-options).
2. Match the access pattern to your home network: [route subdomains over a public IP](/en/quick-start/subdomain-mode), or use [FRP / Cloudflare Tunnel for NAT traversal](/en/quick-start/reverse-proxy-mode).
3. Configure authentication. Keep a recoverable [TOTP authenticator](/en/guide/totp), then add a passkey or external identity provider if needed.
4. Onboard one test service, configure a [TLS certificate](/en/guide/ssl), and verify the entire sign-in flow over a mobile connection.
5. Once the path is stable, use [service discovery](/en/guide/service-discovery) to onboard more services and export an [application backup](/en/guide/backup-and-restore).

::: warning Do not leave a route that bypasses the gateway
fn-knock can protect only traffic that passes through it. If your router, container platform, or cloud firewall still exposes the NAS admin UI or an application's original port, those requests bypass fn-knock authentication, WAF rules, and request logging.
:::

## Continue from your current setup

- **Not installed yet or unsure which package to use:** start with [deployment and access patterns](/en/quick-start/deployment-options).
- **A public IPv4 or IPv6 address is available:** point your domain at fn-knock and follow [public-IP subdomain routing](/en/quick-start/subdomain-mode).
- **Behind CGNAT or inbound traffic is blocked:** use FRP or Cloudflare Tunnel and follow the [NAT traversal guide](/en/quick-start/reverse-proxy-mode).
- **A client must connect on the application's original port:** first verify that the platform supports [direct original-port access](/en/quick-start/direct-mode).
- **Sign-in, TLS, or reverse proxying is not working:** use the [FAQ and troubleshooting guide](/en/faq).
- **Planning an upgrade, migration, or reinstall:** read [backup, restore, and data cleanup](/en/guide/backup-and-restore) first.
