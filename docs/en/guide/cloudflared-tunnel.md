---
lang: en-US
title: "Cloudflare Tunnel with cloudflared"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: eec0d64b8afa9b973302d46c06e9eba28248e07035de9d98c29f37c41e520c0e
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Cloudflare Tunnel with cloudflared

Cloudflared establishes an outbound connection from the private network to Cloudflare Tunnel and sends Public Hostname requests to the fn-knock gateway. fn-knock manages only the Cloudflared executable resource, Tunnel Token, transport protocol, and process. Domains and origin Services remain configured in the Cloudflare Dashboard.

For new deployments, use `Reverse proxy mode → Subdomain mapping`. Cloudflare preserves the Host, and fn-knock dispatches the request by Host. Use Path mode only to retain an existing single-domain, path-based entry point.

The Synology DSM 7 SPK includes a built-in Cloudflared resource, Token configuration, and process management. Windows x86_64 does not provide these capabilities, so the system-settings steps on this page do not apply to Windows. If you run Cloudflared independently on the same Windows host, point its Service to `http://127.0.0.1:7999` and manage its process, logs, and updates yourself.

## 1. Prepare the resource and Tunnel

1. Under `System settings → Cloudflared`, download the resource and confirm that its status is ready.
2. Open the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/) and go to `Networks → Tunnels`.
3. Create a Cloudflared Tunnel. On the installation page, copy the long string after `--token`.
4. Return to `Tunnels → Cloudflared` and paste the Token. You can also paste the entire installation command, and the page will attempt to extract the Token.
5. Prefer `Auto (recommended)` for the transport protocol. It tries QUIC first and falls back to HTTP/2. Force HTTP/2 only when UDP `7844` is known to be blocked.
6. Save and start the Tunnel, then confirm from its status and logs that it is connected.

The Token is a tunnel access credential. Protect it like a password and never include it in screenshots or public logs.

## 2. Configure Host routing

First save the root domain, authentication service, and application Hosts in fn-knock. For example:

```text
auth.example.com  -> Authentication service
nas.example.com   -> http://127.0.0.1:5666
alist.example.com -> http://127.0.0.1:5244
```

Then configure this Public Hostname in the Tunnel:

```text
Public Hostname  *.example.com
Service          http://127.0.0.1:7999
```

If the actual gateway does not use `7999`, enter the port shown in the admin interface. The wildcard Public Hostname sends every application Host to the same gateway, while local Host mappings continue to select the specific service.

Because the Cloudflared tunnel already protects traffic between Cloudflare and the private network, HTTP is normally the simplest choice for a local origin. Use an HTTPS origin only when required, and handle its certificate as described below.

## 3. HTTPS to the origin

When HTTPS is enabled on the gateway, the Service can be:

```text
https://localhost:7999
```

Cloudflared validates the origin certificate. With a self-signed certificate or one that does not cover `localhost`, the log may show:

```text
certificate is valid for nas.example.com, not localhost
```

This means the Tunnel reached the origin, but the hostname being validated does not match the certificate. Choose one of these options:

- Set Origin Server Name to a domain covered by the certificate.
- Disable TLS verification for this origin only when you explicitly accept the risk.
- Switch back to `http://127.0.0.1:7999` and let Cloudflare provide public HTTPS.

Disabling verification does not fix the certificate; it only stops validating it. See [TLS Certificates and HTTPS](/en/guide/ssl) for certificate management.

## Path mode compatibility

If you already use a URL such as `https://home.example.com/alist`, retain one Public Hostname under `Reverse proxy mode → Path mode`:

```text
Public Hostname  home.example.com
Service          http://127.0.0.1:7999
```

Cloudflare only sends the request to the gateway; fn-knock continues to route it by path. Do not maintain overlapping path rewrites in both Cloudflare and fn-knock.

## Client IP and `local_exempt`

Sign-in and allowlist decisions use the client IP detected by the gateway. Private, loopback, and link-local sources become `local_exempt`, bypassing normal sign-in and checks for existing strict-allowlist rules.

Cloudflared itself connects to the local host from a loopback address, so the tunneled subdomain path must use the visitor information supplied by Cloudflare correctly. After configuration, connect over cellular data and confirm on fn-knock's `Request Logs` page that the visitor's public IP is recorded rather than `127.0.0.1` or a container address. The EdgeOne / ESA client-IP options do not apply to Cloudflared.

## Platform boundaries

- Cloudflared is an outbound process and does not require fn-knock to manage the host firewall, so Docker can use it.
- The platform must have a Cloudflared resource for its architecture. Saving a Token cannot start the process until the resource is ready.
- Inside Docker, `127.0.0.1` refers only to the current container. When Cloudflared runs in a separate container, change the Service to the fn-knock container's service name and port.
- The Synology DSM 7 SPK supports in-app Cloudflared. Open its admin page from the DSM desktop package entry point and use the actual gateway origin port, `7999`.
- Windows has no in-app Cloudflared resource page. An independently run client is not managed by fn-knock.
- fn-knock does not create Cloudflare DNS records, Tunnels, Public Hostnames, cache rules, or Origin Request settings.

## Troubleshooting

1. **Process does not start**: Check the resource status, Token, and transport-protocol logs.
2. **Tunnel is online, but the domain is unreachable**: Check the Public Hostname, DNS, and actual Service port.
3. **TLS error**: Verify the origin scheme, certificate trust, and Origin Server Name.
4. **Authentication Host opens, but an application Host returns 404**: Confirm that a wildcard Public Hostname is in use and that the request Host has a local mapping.
5. **Every visitor appears to have the same source**: Check the client IP in `Request Logs`, then troubleshoot source forwarding from Cloudflare to the gateway.
6. **The page opens, but its assets fail**: Confirm that WebSockets are enabled. In Path mode, also check prefix stripping and HTML rewriting.

See [NAT Traversal and Tunnels](/en/guide/tunnel) for overall runtime status and [Publish a Subdomain through a Tunnel without a Public IP](/en/tutorials/reverse-proxy-with-fknock) for a complete example.
