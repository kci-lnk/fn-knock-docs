---
lang: en-US
title: "Pre-login Bot Protection"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: b888d7d3c8efcde6d1418cab1260153f38eff61a8e203ed832c2d68125796c4a
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

PoW is the built-in default. The browser receives a SHA-256 challenge and computes the proof locally. A challenge remains valid for 5 minutes and can be used successfully only once.

## PoW difficulty

PoW provides two presets: `Standard` uses a search limit of `100000`, and `Very hard` uses `300000`. After upgrading from an older version, another valid stored value appears as a custom value. The server accepts integers from `10000` through `1000000` in steps of `10000`.

A higher search limit increases average client work, but actual time still depends on the device, browser, and random hit position. Raising it increases the cost of automation and may noticeably slow low-end phones, older devices, or battery-saving mode. Test changes on a representative desktop and mobile device.

When `Increase difficulty for uncommon locations` is enabled, fn-knock learns common locations from public IPs that successfully authenticated during the last 7 days:

- A resolved location that matches a learned common location uses the base difficulty.
- A resolved location outside the learned common locations uses the uncommon-location difficulty.
- Private or local addresses, unresolved locations, and a model without enough data use the base difficulty.

The uncommon-location difficulty cannot be lower than the base difficulty. This feature does not create a fixed per-account trusted-location list and does not reject a new location; it only raises the PoW computation cost. Travel, ISP egress changes, and inaccurate IP location can all trigger the higher tier. If sign-in becomes impractical, disable this option first instead of weakening other authentication or access controls.

Before selecting Turnstile, create a widget in Cloudflare and enter its `Site key` and `Secret key` in fn-knock. See [Cloudflare Turnstile](/en/guide/cloudflare-turnstile) for detailed instructions.

## Switch and save

Under `System settings → Challenge`, select PoW or Cloudflare Turnstile. For PoW, choose the base difficulty and optionally enable the uncommon-location tier. For Turnstile, both the Site key and Secret key are required; the frontend and backend both reject incomplete settings.

The Site key is sent to the public sign-in page to render the widget. The Secret key remains on the server and is used to validate tokens with Cloudflare. Switching back to PoW preserves the Turnstile parameters in the configuration so they can be reused later.

Changing the provider does not invalidate signed-in sessions. It affects only new requests entering the authentication flow. An already open sign-in page may still hold the previous challenge; refresh it before testing.

## Verification boundaries

- The challenge protects only traffic that passes through the fn-knock sign-in page.
- Private-network and local sources are locally exempt by default, so a LAN result cannot prove that public verification works.
- Turnstile requires the browser to reach Cloudflare verification resources. A restricted network or blocking rule may prevent the widget from appearing or cause verification to fail.
- After changing the verification method, complete a full sign-in in an incognito window over cellular data.

## Troubleshooting

1. Confirm that the settings were saved, then reopen the sign-in page.
2. If PoW reports that a challenge has expired or was already used, refresh the page to obtain a new one. An incorrect system clock can also break expiry checks. If computation is slow only from a new location, check the uncommon-location difficulty.
3. For Turnstile, confirm that the `Site key`, `Secret key`, widget hostname, and actual sign-in domain agree.
4. Confirm that the sign-in domain resolves correctly and uses HTTPS.
5. Review errors in the browser console, `Request Logs`, and `Events`.

- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
- [Cloudflare Turnstile](/en/guide/cloudflare-turnstile)
