---
lang: en-US
title: "Publish a Subdomain through a Tunnel without a Public IP"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 76576414d16d64aa366385fee2481c3ac258a65993db303ecffe8ae185a21240
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Publish a Subdomain through a Tunnel without a Public IP

You can still use subdomain routing without a public IP. FRP or Cloudflared carries external requests to the fn-knock gateway, which then routes each Host to the matching service on your private network.

Path mappings remain available for legacy configurations, but new deployments should use `Reverse proxy mode → Subdomain mapping`.

## Prerequisites

- fn-knock is deployed and its gateway port is reachable locally.
- You have an FRP server or a Cloudflare Zero Trust account.
- You have a domain whose DNS you can manage, or a public Host provided by the tunnel.
- You have working sign-in credentials and a real external network for testing.

## Configuration

1. Under `System settings → Mode`, select `Reverse proxy mode`, then choose `Subdomain mapping`.
2. Under `Domains`, configure the root domain, authentication Host, and first application Host. Set the application Target to a private-network service address reachable from the fn-knock runtime, and leave `Require sign-in` enabled by default. The authentication Host must remain public.
3. Under `Tunnels`, install and configure FRP or Cloudflared so that external traffic is forwarded to the actual fn-knock gateway port.
4. At the tunnel provider, configure DNS / Public Hostname entries for the authentication and application Hosts. Make sure Host, WebSocket traffic, and the real client IP are forwarded correctly.
5. Configure public HTTPS. If the tunnel or an upstream reverse proxy terminates TLS, define the origin scheme and certificate-validation policy explicitly. Do not use an internal `localhost` address as a browser-facing URL.
6. Open the authentication Host over cellular data, sign in, then open the application Host.

## Differences between FRP and Cloudflared

| Item | FRP | Cloudflared |
| --- | --- | --- |
| Public endpoint | Your own `frps` or a provider node | Cloudflare edge and Tunnel |
| DNS | Usually points to the FRP server | A Public Hostname normally creates or associates the DNS record |
| Real source IP | HTTP headers or a correctly configured PROXY Protocol chain | Cloudflare request headers, configured for the selected ingress path |
| Management in fn-knock | Manage multiple frpc instances, configurations, and logs | Manage resources, Tunnel tokens, processes, and logs |

If FRP performs only TCP forwarding, fn-knock may see the tunnel node or a local relay address as the connection source. Configure PROXY Protocol or a trusted real-IP header for the FRP path, then verify the result in `Request Logs`. A page loading successfully does not prove that the allowlist, region rules, and scanner protections are using the correct client address.

The Cloudflared Public Hostname should use the gateway entry point as its origin, for example `http://127.0.0.1:7999`, rather than connecting directly to the application. Otherwise, it bypasses fn-knock Host routing and authentication.

## Target addresses

- When fn-knock and the application run natively on the same host, you can use the address on which the application actually listens, such as `127.0.0.1:<port>`.
- Inside Docker, `127.0.0.1` refers to the fn-knock container itself. For a host service, use an address reachable from the container; reach another container by its name on a shared network.
- If the application runs on another LAN device, use its stable private IP address or internal DNS name.
- When the Target uses HTTPS, verify the certificate name and trust chain. An invalid private-network certificate appears as a gateway `502` error.

## Why DDNS is usually unnecessary

With a tunnel, the public domain normally resolves to the FRP server or Cloudflare edge rather than your home internet address. Pointing the same Host to your home address through DDNS would create conflicting DNS records. Configure DDNS only when DNS ultimately needs to track a changing public endpoint that you control.

## Verify the request path

Check each layer in order:

1. The tunnel resource is installed in fn-knock, the instance or Tunnel is running, and its logs do not show continuous reconnects.
2. Public DNS points to the correct endpoint.
3. The authentication Host opens and the sign-in flow completes.
4. `Request Logs` shows the correct Host and real client IP.
5. The application Host matches the correct upstream.

If DNS resolves but the request does not appear in fn-knock logs, troubleshoot the tunnel or upstream platform. If the request appears but forwarding fails, inspect the mapping and upstream application.

Continue by testing WebSockets, uploads, downloads, sign-out, and credential service scopes. LAN requests may be classified as `local_exempt`, so the final result must be verified over a real external network.

## Rollback and migration

Before switching tunnels, export the fn-knock configuration and record the old DNS, frpc configuration, or Tunnel Public Hostname. To roll back, restore the old endpoint before stopping the new tunnel. Do not leave two endpoints serving the same Host with different real-IP or TLS semantics for an extended period.

When migrating from Path mode to subdomain routing, create and verify the new application Host alongside the old route before removing the old path. If the upstream application stores absolute callback URLs, update its settings as well.

- [NAT Traversal and Tunnels](/en/guide/tunnel)
- [Cloudflare Tunnel with cloudflared](/en/guide/cloudflared-tunnel)
- [Subdomain Routing](/en/guide/subdomain-proxy)
