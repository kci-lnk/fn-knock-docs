---
lang: en-US
title: "Cloudflare Tunnel with cloudflared"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: bff0db45d864b571554efb273368b024d0a2ba556678b1503ed9a5a32cc1ac9f
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Cloudflare Tunnel with cloudflared

Cloudflared establishes an outbound connection to Cloudflare Tunnel and sends public requests to the fn-knock gateway. Managed mode is recommended: after you provide a Cloudflare API Token, fn-knock discovers the Zone and Account, creates or attaches to a Tunnel, maintains wildcard DNS and Ingress, retrieves the Tunnel Token, and starts Cloudflared. Normal setup no longer requires adding Public Hostnames one by one in the Cloudflare dashboard.

Use `Tunnels → Subdomain mapping` for new deployments. Cloudflare preserves the original Host, and fn-knock dispatches `auth.example.com`, `nas.example.com`, and other hosts to local services. Path mode is only for compatibility with an existing single-domain path entry point.

## Before you start

1. Download Cloudflared under `System settings → Cloudflared` and confirm it is ready.
2. Select `Tunnels → Subdomain mapping` under `System settings → Mode`.
3. Save a root domain, an authentication service, and at least one application mapping.
4. Create a Cloudflare Account API Token scoped to the target Account and Zone.

### Recommended: create an Account API Token

An Account API Token belongs to the Cloudflare Account rather than an individual user. It does not stop working merely because the creator leaves the Account, making it better suited to a long-running service such as fn-knock. Creating one requires Super Administrator access to that Account. Use a user API Token only when you do not have that role.

1. Sign in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Open `Manage Account → Account API Tokens` and select the Account that owns the Zone.
3. Select `Create Token`, choose a custom token, and name it, for example, `fn-knock Cloudflare Tunnel`.
4. Add the Account and Zone permissions listed below.
5. Under `Account Resources`, select only this Account. Under `Zone Resources`, select only the Zone that contains the fn-knock root domain.
6. Optionally set an expiration date. Use Client IP restrictions only when the device has a stable public egress IP; otherwise a network change can unexpectedly disable the Token.
7. Select `Continue to summary`, verify that no extra permissions or resources are included, and select `Create Token`.
8. The secret is shown once. Copy it directly into fn-knock's `API connection` field and connect. Do not store it in documentation, screenshots, or chat messages.

See Cloudflare's [Account API token documentation](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/) for the current dashboard path. If you use a user API Token, create it under `My Profile → API Tokens`; it follows that user's lifecycle and is better suited to temporary testing than a durable deployment.

Managed Tunnel setup requires:

- `Account / Cloudflare Tunnel / Edit`
- `Zone / Zone / Read`
- `Zone / DNS / Edit`

Optimization Beta additionally requires:

- `Zone / SSL and Certificates / Edit`

The Token must be able to read the active Zone that contains the root domain. The root may be the Zone itself or a child domain; for example, fn-knock continues from `tu.example.com` to its parent `example.com` Zone. API Tokens and Account API Tokens are supported. Do not put a Global API Key or Token in screenshots, issues, or public logs. Rotate any exposed Token immediately.

## Managed setup

Open `Tunnels → Cloudflared`. Every section can be collapsed; runtime status and logs appear first and are expanded by default.

### 1. Connect Cloudflare

Expand `API connection`, paste the API Token, and connect. The detected Zone appears after a successful connection. Later read APIs never return the plaintext Token.

If connection fails, check the Zone status and the Token's resource scope. A Token that can read the Zone but cannot edit DNS may connect successfully and then fail during preview or apply.

### 2. Select a Tunnel

Expand `Tunnel and domain sync`:

- `Dedicated Tunnel` is recommended. fn-knock creates a Tunnel with an instance identifier and manages only its own configuration.
- `Existing Tunnel` reuses a remotely managed Cloudflared Tunnel. fn-knock preserves unrelated Ingress rules and their order, placing its wildcard rule before the terminal rule.

Select `Preview` to see the Tunnel, Ingress, DNS, and optimization resources that will be created, updated, or kept. A preview is valid for 10 minutes. If the remote configuration changes before apply, generate a new preview. A resource with the same name but different ownership is reported as a conflict and is modified only after you explicitly approve takeover.

Managed setup maintains this baseline automatically:

```text
*.example.com  -> <tunnel-id>.cfargotunnel.com (proxied CNAME)
*.example.com  -> fn-knock's dedicated local Tunnel entry (Ingress)
final rule     -> HTTP 404
```

After apply succeeds, fn-knock retrieves the Tunnel Token through the official Cloudflare API and starts Cloudflared with a `0600` Token file. The Token does not appear in process arguments.

### 3. Verify public access

Managed Cloudflare Tunnel exposes standard HTTPS URLs:

```text
https://auth.example.com/
https://nas.example.com/
```

Do not append `:7999`. Even if an old public HTTPS port remains in the configuration, Cloudflare Tunnel mode omits it from mapping lists, authentication URLs, and sign-in redirects. Cloudflare serves external port `443`; fn-knock manages the local Tunnel entry automatically.

New application Hosts work through the wildcard Tunnel immediately and do not need another Public Hostname in the dashboard. When optimization is enabled, exact-host resources reconcile in the background; the wildcard Tunnel continues serving them until optimization is ready.

## Optimization Beta

Optimization measures the real path from the current device to Cloudflare Anycast IPv4 addresses, then overlays exact application domains with Cloudflare for SaaS Custom Hostnames. The standard wildcard Tunnel always remains as the fallback.

### Enable it

1. Enable `Optimization Beta` under `Tunnel and domain sync`.
2. Run `Preview` and review plan capability, permissions, resource changes, and conflicts.
3. Apply the preview. “Enable optimization in a Cloudflare reconcile plan first” means this step has not been completed.
4. Expand `Optimization Beta` and run a speed test.
5. Apply the recommendation or select another verified candidate.

fn-knock first uses an isolated hostname to test Custom Hostname support, certificate issuance, and direct SNI access in the current Zone. An unsupported capability disables only optimization; it does not interrupt the baseline Tunnel.

### Candidate sources

Candidates may come from:

- Deterministic samples from Cloudflare's official IPv4 ranges.
- Built-in public hostnames: Sweden's government `www.gov.se`, the US Library of Congress `www.loc.gov`, ICANN `www.icann.org`, and Visa `www.visa.com`.
- Up to 16 user-defined public candidate hostnames.

These hostnames are used only to discover possible Cloudflare IPv4 addresses. fn-knock never points an application CNAME at them and never sends application traffic with their Host or SNI. Invalid, private, and common fake-IP results are filtered. If local DNS uses fake-IP mode, add a source that can provide real resolution results.

An IP registry or GeoIP result of “United States” does not mean the request lands in the United States. Cloudflare IPv4 is Anycast, so the same address is advertised from many edge locations. The `Cloudflare colo` in scan results comes from the `CF-Ray` suffix observed during the actual probe, such as `SIN` or `HKG`, and better describes that connection's landing point.

### Measurement and switching

A scan uses at most 128 candidates and 32 concurrent probes. Each candidate gets three TLS/latency probes; the best eight receive two 1 MiB downloads, with no more than 20 MiB downloaded in total. Lower scores are better:

```text
median latency + 2 × jitter + 1500 × loss ratio + 800 / max(download Mbps, 1)
```

A candidate must also pass TLS, SNI, and Cloudflare error-page checks against a real application Host. It cannot be applied solely from ping or IP geolocation. Automatic policy scans every 7 days and checks the current IP every 15 minutes. A new candidate must be at least 15% better and remain ahead in two rounds 10 minutes apart before switching.

After repeated failure, fn-knock prefers an already verified candidate. If none is usable, it removes its exact CNAMEs so the domains match the wildcard Tunnel again. You can also select `Fallback to standard Tunnel` at any time.

### Plan and safety boundaries

Optimization depends on Cloudflare for SaaS Custom Hostnames. Availability and quota come from the Zone's actual plan. Application domains beyond the quota remain on the standard Tunnel. fn-knock does not publish an exact CNAME until both the Custom Hostname and certificate are active.

Do not manually point a proxied application A record directly to a Cloudflare edge IP; that can trigger Cloudflare Error 1000. fn-knock uses Custom Hostnames, a dedicated origin hostname, and a DNS-only optimized entry, and keeps the wildcard Tunnel when its capability probe fails.

## Client IP and sign-in redirects

Managed mode uses a dedicated Tunnel entry bound to loopback. The gateway trusts Cloudflare's `CF-Connecting-IP` only on this controlled path and does not treat a visitor-supplied `X-Forwarded-For` as authoritative. EdgeOne / ESA client-IP controls do not apply to Cloudflared and are hidden when unavailable in the current mode.

From a mobile network, open an application Host that requires sign-in and confirm in request logs:

- The redirect uses `https://auth.example.com/...` without `:7999`.
- `redirect_uri` contains the original application Host without `:7999`.
- The client IP is the visitor's public address, not `127.0.0.1`, a container address, or a custom `X-Forwarded-For`.

## Manual Tunnel Token mode

Advanced users can still expand `Manual Tunnel Token`, paste a Tunnel Token obtained from Cloudflare, and select a transport protocol. `Auto` tries QUIC first and falls back to HTTP/2; force HTTP/2 only when UDP `7844` is known to be blocked.

Manual mode does not create the Tunnel, DNS, or Ingress. Configure the Public Hostname and origin Service yourself in Cloudflare. A self-managed process or Windows installation is also manual: it may target the actual gateway port, but managed setup does not control its installation, Token, logs, or lifecycle.

## Disconnecting and cleanup

Deleting the API Token only stops future remote management; it does not delete Cloudflare resources. Use `Remove managed resources` to preview and confirm cleanup:

- An existing Tunnel is never deleted automatically.
- A dedicated Tunnel created by fn-knock is deleted only after explicit confirmation.
- Optimization cleanup restores exact application domains to the wildcard Tunnel first.

## Troubleshooting

| Symptom | Check first |
| --- | --- |
| Zone was not found or is inactive | The root belongs to an active Zone in the Token's Account and Zone scope |
| DNS Edit is required | The Token has `Zone / DNS / Edit` for the target Zone |
| DNS tag quota is 0 | Upgrade to a version that supports comment-only ownership, then preview again; do not create a duplicate record manually |
| Apply returns 409 after preview | Remote state or the local root changed; create a new preview |
| Tunnel is online but the domain fails | Reconcile conflicts, wildcard DNS, Ingress, Cloudflared logs, and the local Host mapping |
| Redirect still includes `:7999` | Confirm `Tunnels → Subdomain mapping`, Cloudflared as the default Tunnel, and a version with standard-port redirect support |
| Optimization cannot be enabled | SSL permission, Cloudflare for SaaS availability, Custom Hostname quota, and the capability probe |
| IP geolocation says United States | Use the Cloudflare colo code from the scan; Anycast registration location is not the connection landing point |
| Every request appears local | Check the request-log client IP and use the dedicated managed entry instead of an incorrect manual origin |

See [Tunnels](/en/guide/tunnel) for overall runtime behavior and [Subdomain Mapping](/en/guide/subdomain-proxy) for Host configuration.
