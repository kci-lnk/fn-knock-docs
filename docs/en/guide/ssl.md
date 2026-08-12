---
lang: en-US
title: "TLS Certificates and HTTPS"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 7b3c4a39f3e77db7abc0a56d2415e317de99cb605d798e5cc78a4745a097f740
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# TLS Certificates and HTTPS

HTTPS is foundational for Passkeys, OIDC callbacks, and most public services. A certificate must cover the authentication Host and application Hosts that visitors actually use. A certificate issued only for an internal address or an old domain still causes browser warnings or sign-in failures at the gateway.

## Page Layout and Certificate Sources

`SSL / HTTPS` has three tabs:

| Tab | What it manages |
| --- | --- |
| `Certificate config` | Current HTTPS state, gateway deployment mode, manual uploads, and the certificate library |
| `Self-signed certificate` | A local root CA and domain/IP server certificates issued by it |
| `ACME certificate` / `DNS-01 certificate` | Multiple request items, issuance, renewal, logs, and certificate-library links |

| Source | Best suited for | Notes |
| --- | --- | --- |
| Upload an existing certificate | A certificate issued by a CDN, control panel, or another tool | Store the certificate chain and private key together, and record who is responsible for renewal |
| Self-signed certificate | LAN testing or temporary validation | Clients must trust the root manually; unsuitable for ordinary public access |
| ACME | A verifiable domain where automatic renewal is wanted | The current request flow uses DNS-01; protect DNS API credentials |

## Certificate Library and Manual Uploads

The upload area accepts pasted PEM certificate and private-key text. Platforms with shared-directory capability can also read them from shared files. The certificate and key must match, and the certificate chain should include the server certificate and any required intermediate certificates.

Two save actions are available:

| Action | Result |
| --- | --- |
| `Save to library only` | Validates and stores the certificate without changing the current public certificate |
| `Save and enable` | Stores it, marks it as the current active/default fallback certificate, and synchronizes the gateway immediately |

The certificate library shows source, covered domains, validity, update time, and Host coverage. Deleting a certificate that is currently in use also disables HTTPS. `Clear certificate library` deletes every certificate, clears the certificate set already received by the gateway, and disables HTTPS. To turn off HTTPS temporarily while keeping certificates, use `Disable HTTPS` on the status card.

## Single Active Certificate and Multi-certificate SNI

The library can retain multiple certificates. `Deployment mode and gateway sync` controls how many the gateway actually receives:

| Deployment mode | Gateway behavior | Best suited for |
| --- | --- | --- |
| `Single active certificate` | Sends only the current active certificate, which is returned for every domain | One wildcard or SAN certificate that covers all Hosts |
| `Multi-certificate SNI` | Sends the complete certificate set and selects by TLS SNI | Different parent domains or certificate sources sharing one gateway |

Multi-certificate SNI still requires a default/fallback certificate. If a client sends no SNI, opens an unknown Host, or has no matching certificate, the gateway returns the default entry. After switching deployment modes, inspect `Certificates currently received by the gateway`. If the saved mode differs from the running mode or a sync error appears, do not assume that the library contents alone are live.

For subdomains, cover the authentication Host and every public application Host. `*.example.com` covers only one subdomain level; it does not cover the root `example.com` or `a.b.example.com`. The page's Host coverage analysis identifies gaps using the current mappings.

## Self-signed Root CA

Use `Self-signed certificate` in this order:

1. Initialize the root certificate and download the root CA.
2. Install the root CA as a trusted root on every client or managed device that needs access.
3. Add the actual access names to the domain and IP list.
4. Select `Deploy` to issue and install a server certificate, or download the server certificate for separate use.

Server certificates are valid for 20 years. A long validity period does not remove the need to protect private keys or plan revocation. Regenerating or clearing the root CA makes server certificates issued by the old root untrusted, so the UI requires two confirmations. Prepare distribution of the new root certificate and a rollback plan first.

Self-signed certificates fit a controlled LAN, test devices, or an environment where you can deploy the root CA centrally. Public visitors, third-party OIDC, and unmanaged clients should normally use a publicly trusted CA.

## ACME Request Items

On non-Windows platforms, first initialize `acme.sh` under `System settings → ACME` and select a default CA if needed. Changing the CA affects only future requests and automatic renewals; it does not immediately replace certificates that are already issued or deployed.

Each ACME request item independently stores:

- A name and one or more domains;
- The DNS provider and API credentials used by this item;
- The Automatic renewal switch;
- The current certificate, certificate-library link, and latest task state.

`Save` updates only the request item. `Save and apply` immediately submits an issuance task. After successful issuance, the certificate synchronizes to the library automatically, but does not necessarily become the current certificate. In Single active certificate mode, you can then select `Set as current certificate`. In Multi-certificate SNI mode, confirm that it entered the gateway certificate set.

When the same request item renews or reissues a certificate, the system replaces the linked library record in place and preserves its label and active/default deployment role, avoiding duplicate entries. If a task fails or is stopped after its domains were changed, the previous usable issuance result is retained. If sending the new certificate to the gateway fails, the system tries to restore and resend the previous SSL configuration. If a newer concurrent configuration already exists, it preserves and sends that newer configuration instead. The task still ends as failed; use its logs to confirm whether the previous configuration was restored, a newer configuration was preserved, or even the safe configuration could not be recovered.

The request item's menu can also show task logs, download the certificate, update it in the certificate library manually, deploy it, delete the certificate, or delete the request item. The two deletion actions have different scopes:

| Action | What remains |
| --- | --- |
| Delete certificate | Keeps the request-item configuration but removes the currently saved issuance result and certificate-library link |
| Delete request item | Deletes the request configuration; its existing certificate and link are cleaned up with it |

List actions are temporarily locked during a task or automatic renewal. Task logs point to issues such as DNS credentials, DNS API rate limiting, or ACME rate limits. `Stop task` terminates the running `acme.sh` process and marks the task as stopped; start it again later when ready.

### Automatic renewal scheduling and recovery

Request items with automatic renewal enabled are checked immediately after the service starts and then every 6 hours by default. A certificate enters the renewal queue when no more than 30 days remain. When several items qualify, they run sequentially from the earliest expiration to the latest, avoiding concurrent calls to the DNS API and ACME client.

- Automatic scans and per-item issuance jobs use separate owned, heartbeating runtime locks, preventing duplicate renewal in one service. If a manual job is already active, that scan is skipped safely.
- After a service restart, fn-knock scans again. It clears a leftover lock only after confirming that its job has ended; a job still finishing cancellation remains locked so old and new processes cannot overlap.
- Both RFC 3339 and the OpenSSL UTC expiration format found in existing certificates are recognized. An invalid expiration produces a warning and is skipped rather than being treated as not due.
- After each scan, the certificate library and gateway deployment are reconciled again. One renewal failure does not prevent a later scheduled scan, and the previous usable certificate and SSL configuration follow the recovery rules above.

The page has no separate “next scan” switch. Verify renewal from the request item's latest task state, certificate expiration, and logs instead of repeatedly starting manual issuance.

## Native Windows: DNS-01 Certificates

The Windows x86_64 edition requests certificates under `SSL / HTTPS → DNS-01 certificate`. Its bundled certificate client requires no ACME.sh initialization or download. This path always uses Let's Encrypt and accepts only DNS-01 validation; it offers neither HTTP-01 nor switching to another certificate authority.

Select a supported DNS provider and store its API credentials with least privilege. Current providers are Alibaba Cloud DNS, Baidu Cloud DNS, Cloudflare, DNSPod, Tencent Cloud DNSPod, DuckDNS, Dynu, dynv6, GoDaddy, Huawei Cloud DNS, and Porkbun. Cloudflare supports both API Token and Global API Key credentials; prefer a Token restricted to the required Zone.

Automatic renewal is enabled by default on a new request item, and successful issuance adds the certificate to the library. In Single active certificate mode, you must still set the first issued certificate as current manually. The Windows page does not initialize `acme.sh` or provide CA switching.

## fnOS SSL Certificate Library Sync (Native FPK Only)

The native fnOS FPK can update existing fnOS certificate records from the fn-knock certificate library under `System settings → FNOS → FNOS SSL certificate sync`.

Synchronization updates only existing fnOS certificates whose domain and SAN sets match exactly. It never creates or deletes certificate records in fnOS. Confirm that both sides cover the same domain set before synchronizing one item or all items. If there is no match, adjust the certificate records rather than expecting synchronization to create one.

You can synchronize manually or enable automatic synchronization. Automatic mode briefly coalesces changes after the local certificate library is updated, then synchronizes matching items in a batch and refreshes fnOS services once. If the target certificate also uses fnOS automatic renewal, a later fnOS renewal can overwrite the synchronized result. Decide explicitly which side owns renewal.

## Recommended Configuration Order

1. Decide the final public domains and ports; do not request a certificate for a private address first.
2. Confirm in DNS that the authentication Host and application Hosts resolve correctly.
3. Upload, request, or select a certificate under `SSL / HTTPS`.
4. Choose Single active certificate or Multi-certificate SNI based on the certificate count, and confirm that the gateway received the expected set.
5. Review certificate-coverage hints and fix any uncovered Hosts.
6. From a mobile network, open the authentication Host and an application Host and check the browser chain, domain, validity, and sign-in flow.

## Automatic HTTPS Boundaries

Automatic HTTPS concerns only the gateway's HTTP-to-HTTPS redirect and enabling a configured certificate. It does not request a domain, open a router port, or configure a CDN origin for you. Docker and OpenWrt do not expose this host-related switch; when an outer reverse proxy terminates TLS, that proxy should enforce HTTPS. On Windows, even if the switch is shown, you still need a real inbound path and an available port `80`. The fact that `7999` listens on every interface by default does not mean that Windows Firewall, the router/NAT, or the ISP allows public access.

## Troubleshooting

- **Browser reports a domain mismatch:** The certificate's DNS names do not cover the current Host, or an upstream CDN routes to the wrong site.
- **The certificate is in the library, but public access still returns the old one:** Check whether it is the current/default certificate, whether the deployment mode is correct, and whether the certificate set received by the gateway was updated.
- **Several domains return the same wrong certificate:** Check whether the gateway is still in Single active certificate mode, or whether Multi-certificate SNI has no match and falls back to the default.
- **Upload fails:** Check the PEM content, matching private key, and certificate-chain order. Do not paste PKCS#12 file content into a PEM text field.
- **ACME fails:** Check DNS provider credentials, DNS API rate limiting, and TXT propagation. The current request flow uses DNS-01 only, so do not troubleshoot it as HTTP-01.
- **ACME issuance succeeds but is not live:** Check the certificate-library link and whether `Set as current certificate` was run in Single active certificate mode.
- **Cloudflared fails with `https://localhost:7999`:** The upstream TLS name must match the certificate. If it cannot, use a verified HTTP-origin setup first or adjust the Tunnel TLS settings.
- **Application pages work, but Passkey does not:** Confirm that the authentication Host is opened with valid HTTPS and the correct RP domain.

- [Dynamic DNS (DDNS)](/en/guide/ddns)
- [Subdomain Routing](/en/guide/subdomain-proxy)
- [Cloudflare Tunnel with cloudflared](/en/guide/cloudflared-tunnel)
- [System Settings and Maintenance](/en/guide/system)
