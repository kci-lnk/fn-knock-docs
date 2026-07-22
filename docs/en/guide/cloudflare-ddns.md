---
lang: en-US
title: "Cloudflare DDNS"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 8cd64a630840b5b0f7efad9c106a1050b28fdd690c812b9d13d53ec3967cce27
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Cloudflare DDNS

Cloudflare DDNS uses an API Token to update DNS records in a specified Zone. Because the Token can modify records, grant it only the minimum DNS permissions for the target Zone and protect it like a password.

## Create a Token

1. Create a Token on Cloudflare's API Tokens page by selecting or starting from the **Edit zone DNS** template.
2. Restrict its scope to the target Zone; do not use the Global API Key.
3. If needed, use Cloudflare's token-verification command to confirm that the Token is active.
4. Enter the Token only in the fn-knock DDNS credentials. Do not include it in screenshots, logs, or public configuration files.

Cloudflare may change its Token page and permission names. Follow the [official API Token documentation](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) for current details.

## Configure fn-knock

Under `DDNS`, select Cloudflare and enter:

| Field | Description |
| --- | --- |
| `API token` | A Token with DNS edit permission for the target Zone |
| `Zone ID` | The ID shown in the Cloudflare Zone overview, not the Zone name |
| `Domain` | The full DNS name to maintain; supports one name or a root-domain and wildcard-domain pair |
| `Cloudflare proxy` | `DNS only` or `Orange cloud` |

Enter a DNS name such as `auth.example.com`, without `https://`, a path, or a port. For a root-domain and wildcard-domain pair such as `example.com` and `*.example.com`, fn-knock updates the two records separately and first uses the Cloudflare API to confirm that the root domain belongs to the entered Zone ID.

Select IPv4, IPv6, or dual-stack updates according to the actual network. After saving, run the in-page test first, then confirm the record type, name, and address in the Cloudflare DNS list.

During an update, fn-knock looks up an existing record by domain and record type:

- IPv4 uses `A`.
- IPv6 uses `AAAA`.
- An existing record is updated; a missing record is created.
- TTL uses Cloudflare's automatic value.
- For dual-stack updates, A and AAAA run separately, and any failure appears in the logs.

If the Zone ID, Token, and domain do not match, the test reports an error before modifying any record. Do not use one Zone ID to update a different root domain.

## Proxy status

Cloudflare's proxy status changes the request path. When the gateway uses a non-standard port or clients must connect directly to the origin, start with `DNS only`. Whether proxying is supported depends on Cloudflare's supported ports, SSL mode, and the current service type. `Orange cloud` is not required for DDNS.

With `Orange cloud` selected, external DNS queries return Cloudflare edge addresses rather than your home public IP. This is expected. Real client IP handling, Cloudflare SSL mode, the origin port, and cache rules then require separate configuration. If you only want Cloudflare to host dynamic DNS, `DNS only` is easier to troubleshoot.

## Test failures

| Failure area | Check |
| --- | --- |
| Zone lookup fails | Whether the Token is valid, the Zone ID is correct, and the server can reach the Cloudflare API |
| Zone mismatch | Whether the domain root belongs to the Zone and whether an ID from another account or Zone was entered |
| Record lookup fails | Whether the Token has Zone DNS Read/Edit permission and whether the Cloudflare API is rate-limiting requests |
| Create or update fails | Record-type conflict, same-name CNAME, proxy-status restrictions, and details returned by the API |

After a successful DDNS update, still verify that the domain resolves, the endpoint is reachable from the internet, the TLS certificate matches, and fn-knock ultimately handles the request. Cloudflare also provides a [dynamic DNS reference](https://developers.cloudflare.com/dns/manage-dns-records/how-to/managing-dynamic-ip-addresses/).

- [Dynamic DNS (DDNS)](/en/guide/ddns)
- [TLS Certificates and HTTPS](/en/guide/ssl)
