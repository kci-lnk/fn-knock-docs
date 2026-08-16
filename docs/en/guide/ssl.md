---
lang: en-US
title: "TLS Certificates and HTTPS"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: dfc34f5be70cf1a410521b76bc46afb6f09bd6a6e5340a1fa89b5ae0adad66d2
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

## Receiving Certificates from External Tools

`Certificate config → Receive external certificates` lets Certd, acme.sh, lego, or Certbot remain responsible for issuance and renewal while pushing the full certificate chain and private key into fn-knock. This endpoint does not ask a CA to issue a certificate. fn-knock authenticates the deployment, validates it, stores it in the certificate library, and updates the gateway when required.

This workflow fits environments where:

- Certd already manages certificates for several domains, VPS instances, NAS devices, or CDNs;
- Existing acme.sh, lego, or Certbot renewal jobs should remain in place without storing the DNS API credential again in fn-knock;
- One issued certificate must be distributed to several fn-knock instances; or
- The fn-knock host cannot perform DNS-01 itself but can accept an internal certificate push.

### Deployment model

A complete deployment proceeds as follows:

1. The external tool issues or renews the certificate with the CA.
2. After issuance succeeds, a Webhook or deploy hook sends the `fullchain` and private key to the binding-specific endpoint.
3. fn-knock authenticates the binding's Bearer Token and checks the request size, PEM encoding, complete chain, validity period, and certificate/private-key match.
4. The certificate is written to the stable slot `external_<binding_id>`. Later renewals replace that same library entry instead of creating another certificate each time.
5. If the certificate is already in use, fn-knock preserves its active/default role and updates the gateway immediately. If it is not active, it does not take over the existing default certificate. Multi-certificate SNI mode resynchronizes the complete certificate set.
6. After gateway synchronization succeeds, the endpoint shows the latest receive time, domains, and expiration. If gateway delivery fails, the request returns a non-2xx response, fn-knock attempts to restore the previous configuration, and the external tool should mark the deployment failed and retry according to its policy.

When fn-knock has no current certificate, the first certificate successfully received through an external endpoint is activated and sent to the gateway automatically. When another current certificate already exists, the first push to a new endpoint only adds a library entry. Enable it manually from the library if it should replace the public default.

| Tool | Configuration generated by fn-knock | When it runs |
| --- | --- | --- |
| Certd | `PUT` Webhook URL, Header, JSON template, and success marker | Add a “Deploy certificate by Webhook” step to the Certd certificate pipeline |
| acme.sh | Deploy hook script containing the endpoint and Token | Run `--deploy-hook fnknock` after issuance |
| lego | Script compatible with the lego v5 deploy hook and v4 renew hook | Invoke it from the renewal command or `.lego.yaml` |
| Certbot | Deploy hook script that reads `RENEWED_LINEAGE` | Place it in the renewal-hook directory or invoke it with `certbot renew --deploy-hook` |

### Creating a certificate receiving endpoint

1. Open `TLS Certificates → Certificate config` and expand `Receive external certificates`.
2. Select Certd, acme.sh, lego, or Certbot under `Certificate tool`.
3. Enter a name that identifies the certificate or target node, such as `Certd example.com` or `Certbot gateway-01`.
4. Select `Create receiving endpoint`.
5. Copy all generated configuration immediately. The Token appears only when the endpoint is created or its Token is regenerated. It cannot be read again after the configuration panel is closed.

Each endpoint owns one stable certificate slot and one independent Token. Do not send unrelated certificates through the same endpoint: the later push replaces the earlier certificate. Do not share a Token among fn-knock instances either; create an endpoint on every instance.

### `BACKEND_PORT`, loopback, and reverse proxying

The generated URL looks like this:

```text
http://127.0.0.1:7998/api/integrations/certificates/<BINDING_ID>
```

The port comes from fn-knock's runtime `BACKEND_PORT`; `7998` is only the default. The administration backend listens on `127.0.0.1` and `::1` by default, so this URL works only when the certificate tool and fn-knock share the same host or network namespace.

| Tool location | URL handling |
| --- | --- |
| Certd / ACME client and fn-knock on the same host | Use the generated `127.0.0.1:${BACKEND_PORT}` URL directly |
| Certd on the host and fn-knock in an isolated container | Make the reverse proxy reach the container's `BACKEND_PORT`; host loopback does not automatically refer to container loopback |
| Certd or the ACME client on another machine | Reverse proxy fn-knock's `127.0.0.1:${BACKEND_PORT}` to an HTTP or HTTPS address reachable by that machine, then replace the generated host and port |

Only publish `/api/integrations/certificates/` through the reverse proxy. Do not expose the entire administration backend. The proxy must preserve the `PUT` method, `Authorization` Header, and original JSON body. This Nginx example uses the default port:

```nginx
location ^~ /api/integrations/certificates/ {
    proxy_pass http://127.0.0.1:7998;
    proxy_set_header Authorization $http_authorization;
    proxy_pass_request_headers on;
    client_max_body_size 1m;
}

location / {
    return 404;
}
```

The reverse-proxy endpoint may use HTTP or HTTPS; fn-knock does not require either protocol. Choose based on the network boundary. HTTP can be sufficient on a trusted internal network. Across the public Internet, the reverse proxy should protect the transport and restrict source addresses. Never put the Token in a URL, query string, reverse-proxy access log, or script debug output.

### Configuring the Certd Webhook

After creating a Certd endpoint, copy the fields shown by fn-knock into the corresponding certificate pipeline:

1. Ensure the pipeline already has a successful certificate request task that outputs the domain certificate.
2. Add a `Deploy certificate by Webhook` step after that request task.
3. For `Domain certificate`, select the output from the preceding request task rather than an unrelated certificate.
4. Enter the deployment parameters below, then save the pipeline.

| Certd field | Value | Notes |
| --- | --- | --- |
| Task name | `Push certificate to fn-knock` | It can include the target node name |
| Webhook URL | Push URL shown by fn-knock | Use `127.0.0.1:${BACKEND_PORT}` on the same host or the reverse-proxy URL across hosts |
| Request method | `PUT` | Do not change it to POST |
| ContentType | `application/json` | Makes Certd send JSON |
| Headers | `Authorization=Bearer fnk_cert_<YOUR_TOKEN>` | This Certd input uses `key=value`; copy the complete Token from fn-knock |
| Message body template | `{"cert":"${crt}","key":"${key}"}` | `${crt}` is the complete certificate content and `${key}` is the private key |
| Ignore certificate validation | Normally off | HTTP has no TLS certificate to validate; for an HTTPS reverse proxy, fix its trust chain instead when possible |
| Success match | `"success":true` | The response must also be 2xx; a non-2xx response is a failure |

![Certd Webhook fields for deploying a certificate to fn-knock](/images/ssl/certd-webhook-deployment.png)

`<BINDING_ID>` and `fnk_cert_<YOUR_TOKEN>` in the screenshot are documentation placeholders and must not be copied literally. Use values from the endpoint that was just created or rotated. The Header uses `Authorization=Bearer ...`, not the colon form `Authorization: Bearer ...`, because this Certd field requires one `key=value` entry per line.

Save and run the Certd pipeline manually once. Before running only the Webhook step, confirm that it can read the certificate output from the preceding task. On success, Certd marks the step successful, fn-knock returns JSON containing `"success":true`, and the receiving endpoint updates its latest status.

### Using acme.sh, lego, or Certbot

These clients do not require manually constructing JSON. After selecting a client and creating an endpoint, fn-knock generates a script with the push URL and Token already embedded. It uses `jq` to encode PEM newlines safely and `curl` to send the request. Restrict the script file's permissions and never print it into CI logs.

#### acme.sh

1. Save the generated script as `~/.acme.sh/deploy/fnknock.sh`.
2. Run `chmod 700 ~/.acme.sh/deploy/fnknock.sh`.
3. After issuance, deploy the certificate with:

```bash
~/.acme.sh/acme.sh --deploy -d example.com --deploy-hook fnknock
```

The script uses the private-key and fullchain parameters supplied by the acme.sh deploy-hook contract. For a wildcard certificate, use its primary acme.sh domain. `--deploy` deploys an existing issuance result; it does not request a new certificate.

#### lego

1. Save the generated script to a stable path and run `chmod 700 /path/to/fn-knock-lego-hook.sh`.
2. With lego v5, run:

```bash
lego --deploy-hook=/path/to/fn-knock-lego-hook.sh renew
```

The script can also be configured in `.lego.yaml` as `hooks.deploy.command`. With lego v4, use `--renew-hook=/path/to/fn-knock-lego-hook.sh`. The generated script recognizes both the v5 `LEGO_HOOK_*` variables and the v4 compatibility variables.

#### Certbot

1. Save the generated script as `/etc/letsencrypt/renewal-hooks/deploy/fn-knock`.
2. Run `chmod 700 /etc/letsencrypt/renewal-hooks/deploy/fn-knock`.
3. Run a rehearsal or specify the hook directly:

```bash
certbot renew --deploy-hook /etc/letsencrypt/renewal-hooks/deploy/fn-knock
```

The script reads `fullchain.pem` and `privkey.pem` from Certbot's `RENEWED_LINEAGE`. A deploy hook runs only after a successful renewal. When testing the hook, use Certbot's supported test procedure and ensure that a staging certificate is not pushed as the production certificate.

### First push, renewal, and deployment roles

| State before the push | fn-knock behavior |
| --- | --- |
| No current certificate | Creates the stable external entry, activates it, and synchronizes the gateway |
| Another current certificate in Single active certificate mode | Adds the new certificate to the library without changing the public certificate |
| This endpoint's certificate is already current | Replaces it in place, keeps its current role, and updates the gateway |
| Multi-certificate SNI mode | Replaces the endpoint certificate and resynchronizes the complete set; the existing default remains unchanged |
| Byte-identical certificate and key are pushed again | Returns idempotent success without another library write or unnecessary gateway reload |
| New certificate expires earlier than the existing certificate in the slot | Returns `409 Conflict` to prevent an accidental rollback to an older certificate |

fn-knock validates chain order and signatures, the CA and Key Usage constraints of intermediate certificates, the not-before and expiration times of every certificate in the chain, and the leaf certificate/private-key match. A leaf certificate without a required intermediate, an out-of-order chain, a not-yet-valid or expired certificate, or a mismatched key is rejected. The request-body limit is 1 MiB.

The library source is recorded as `External push`, with `source_provider` distinguishing Certd, acme.sh, lego, and Certbot. Status and logs include only the binding, result, fingerprint, domains, and validity. They must not contain PEM private keys or plaintext Tokens.

### Verifying a successful deployment

Check in this order after a push:

1. The external tool's deployment task succeeded, not merely its certificate request.
2. The fn-knock endpoint shows `Receiving` and `Last receive succeeded`, with the expected domains, receive time, and expiration.
3. The library contains one external entry for the endpoint; another renewal does not increase the entry count.
4. If the certificate should be public, confirm that it is current/default or present in the Multi-certificate SNI gateway set.
5. Inspect the certificate returned through the real access path:

```bash
openssl s_client \
  -connect auth.example.com:443 \
  -servername auth.example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
```

![Successful external certificate receiving endpoint in fn-knock](/images/ssl/external-certificate-binding-status.png)

`Last receive succeeded` means fn-knock accepted the deployment. Whether it is the public certificate still depends on its active role, deployment mode, and whether public traffic actually reaches this gateway.

### Managing endpoints and Tokens

- `Pause receiving` keeps the endpoint and existing certificate but makes new pushes unavailable. Use it to stop automated updates temporarily.
- `Generate new Token` invalidates the old Token immediately and shows the replacement once. Update Certd or the deploy-hook script; jobs using the old Token receive `401`.
- `Save name` changes only the display name, not the certificate slot, URL, Token, or stored certificate.
- `Delete endpoint` revokes the URL and Token but keeps the imported certificate by default, preventing an endpoint cleanup from interrupting active HTTPS. Delete the certificate separately from the library when needed.

The Token grants only the ability to deploy into one binding-specific certificate slot. It cannot call `/api/admin/ssl/*` or operate on another binding. Do not use an administration-session Cookie for automation.

### Several fn-knock instances

When Certd distributes one certificate to several VPS or NAS nodes, create an endpoint on each instance and add an independent deployment step per instance:

```text
Issue / renew certificate
├── Push to fn-knock gateway-01 (independent URL + Token)
├── Push to fn-knock gateway-02 (independent URL + Token)
└── Push to a CDN or another service
```

This prevents one leaked Token, unreachable node, or gateway synchronization failure from becoming a shared credential problem across all nodes. Certd should retain the result of every deployment step separately; do not let one wrapper script hide a partial-node failure.

### Troubleshooting external pushes

| HTTP status | Common cause | Resolution |
| --- | --- | --- |
| `400 Bad Request` | Invalid JSON or PEM, incomplete/out-of-order chain, mismatched key, not-yet-valid certificate, or expired certificate | Send the fullchain and its matching key; keep Certd's `${crt}` / `${key}` JSON template |
| `401 Unauthorized` | Missing, copied incorrectly, or rotated Token; malformed Certd Header | Regenerate the Token in fn-knock and completely update `Authorization=Bearer ...` |
| `404 Not Found` | Deleted or paused binding, or an unknown binding ID in the URL | Check the endpoint state and complete push path; do not reuse another instance's URL |
| `409 Conflict` | Incoming certificate expires earlier than the stored one, or concurrent changes cannot be committed safely | Check that the pipeline is not sending an old artifact; retry later and avoid simultaneous writes to one endpoint |
| `413 Payload Too Large` | JSON body exceeds 1 MiB | Check for logs, PKCS#12 data, repeated certificates, or unrelated content appended to the PEM |
| `500 Internal Server Error` | Configuration or deployment-status storage failed | Inspect fn-knock logs and disk/configuration storage; preserve the external job failure and retry |
| `502 Bad Gateway` | Validation succeeded but gateway synchronization failed; the response says whether the previous configuration was confirmed restored | Confirm which certificate is currently public, inspect gateway status and fn-knock logs, then retry |

If Certd reports successful issuance while fn-knock remains at `Waiting for first push`, the pipeline did not run the deployment step, the Webhook was unreachable, or the step selected the wrong preceding certificate output. Confirm in the Certd task log that a request was actually sent, then test the same-host `127.0.0.1:${BACKEND_PORT}` path or the cross-host reverse proxy.

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

During a task or automatic renewal, you can still edit and save the request item's DNS configuration; conflicting actions such as another issuance, deployment, or deletion remain locked. Task logs point to issues such as DNS credentials, DNS API rate limiting, or ACME rate limits. `Stop task` first requests cancellation and terminates the process group owned by that task. It reports success only after both the executor and runtime lock finish. If the page still reports a PID or a stop error, do not immediately start a second task; confirm that the old process has exited first.

### Automatic renewal scheduling and recovery

Request items with automatic renewal enabled are checked immediately after the service starts and then every 6 hours by default. A certificate enters the renewal queue when no more than 30 days remain. When several items qualify, they run sequentially from the earliest expiration to the latest, avoiding concurrent calls to the DNS API and ACME client.

- Automatic scans and per-item issuance jobs use separate owned, heartbeating runtime locks, preventing duplicate renewal in one service. If a manual job is already active, that scan is skipped safely.
- After a service restart, fn-knock marks `queued` or `running` jobs with no executor in the new process as stopped and removes their leftover runtime locks before scanning again. An in-process cancellation keeps its lock until the original executor finishes, preventing old and new work from overlapping.
- Both RFC 3339 and the OpenSSL UTC expiration format found in existing certificates are recognized. An invalid expiration produces a warning and is skipped rather than being treated as not due.
- After each scan, the certificate library and gateway deployment are reconciled again. One renewal failure does not prevent a later scheduled scan, and the previous usable certificate and SSL configuration follow the recovery rules above.
- After an automatic renewal fails or is stopped, a 6-hour retry backoff applies by default so every scan does not immediately call the DNS API and CA again. Editing that request item allows the next scan to retry.

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
