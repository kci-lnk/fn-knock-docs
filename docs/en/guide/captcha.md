---
lang: en-US
title: "Pre-login Bot Protection"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 616249dde81c98fe080acfd4f39420ef70ccbc85cb91f8bb71a2b3fb735ba654
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Pre-login Bot Protection

The human-verification challenge runs at the start of the sign-in flow to reduce automated requests reaching the authentication endpoint directly. It does not replace sign-in credentials, the IP allowlist, or WAF.

Select a verification method under `System settings → Challenge` and save. New sign-in pages use the updated setting; existing sessions remain valid.

## Available methods

| Method | Characteristics | Best for |
| --- | --- | --- |
| `PoW` | The browser completes a proof of work without relying on a third-party site | Minimizing external dependencies when a small amount of client-side computation is acceptable |
| Cloudflare Turnstile | Cloudflare performs the verification | Existing Cloudflare users who prefer its managed bot challenge |

PoW is the built-in default. The browser receives a SHA-256 challenge and computes the proof locally. A challenge remains valid for 5 minutes and can be used successfully only once. The page has no difficulty control; the server currently sets a maximum search range of 100000.

Before selecting Turnstile, create a widget in Cloudflare and enter its `Site key` and `Secret key` in fn-knock. See [Cloudflare Turnstile](/en/guide/cloudflare-turnstile) for detailed instructions.

## Switch and save

Under `System settings → Challenge`, select PoW or Cloudflare Turnstile. When choosing Turnstile, both the Site key and Secret key are required; the frontend and backend both reject incomplete settings.

The Site key is sent to the public sign-in page to render the widget. The Secret key remains on the server and is used to validate tokens with Cloudflare. Switching back to PoW preserves the Turnstile parameters in the configuration so they can be reused later.

Changing the provider does not invalidate signed-in sessions. It affects only new requests entering the authentication flow. An already open sign-in page may still hold the previous challenge; refresh it before testing.

## Verification boundaries

- The challenge protects only traffic that passes through the fn-knock sign-in page.
- Private-network and local sources are locally exempt by default, so a LAN result cannot prove that public verification works.
- Turnstile requires the browser to reach Cloudflare verification resources. A restricted network or blocking rule may prevent the widget from appearing or cause verification to fail.
- After changing the verification method, complete a full sign-in in an incognito window over cellular data.

## Troubleshooting

1. Confirm that the settings were saved, then reopen the sign-in page.
2. If PoW reports that a challenge has expired or was already used, refresh the page to obtain a new one. An incorrect system clock can also break expiry checks.
3. For Turnstile, confirm that the `Site key`, `Secret key`, widget hostname, and actual sign-in domain agree.
4. Confirm that the sign-in domain resolves correctly and uses HTTPS.
5. Review errors in the browser console, `Request Logs`, and `Events`.

- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
- [Cloudflare Turnstile](/en/guide/cloudflare-turnstile)
