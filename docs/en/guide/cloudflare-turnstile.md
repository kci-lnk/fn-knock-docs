---
lang: en-US
title: "Cloudflare Turnstile"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: bff7a9896c9cb9682d294bc7410d6890f4a1cc2a185542614228ec82e42fe628
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Cloudflare Turnstile

Turnstile is an optional human-verification method for the fn-knock sign-in page. It validates only browser requests before sign-in and does not replace a reverse proxy, CDN, or WAF.

## Configuration

1. Sign in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and create a Turnstile widget.
2. The widget type can remain in the normal visible mode. Add the domain used to open the sign-in page to the hostname list; do not include a scheme, path, or port.
3. Copy the widget's `Site key` and `Secret key`.
4. In fn-knock, open `System settings → Challenge`, select `Turnstile`, enter both keys, and save.
5. Open the authentication Host over a real external network and complete a sign-in test.

If the authentication Host is `auth.example.com`, register `auth.example.com` with Cloudflare. If access passes through a CDN or tunnel, enter the domain that users ultimately see in the browser, not `localhost`, a container name, or the gateway's private address.

The `Site key` is sent to the browser. The `Secret key` is used only by the server when calling the Cloudflare Siteverify API. Never put the Secret key in frontend code, a public issue, or a troubleshooting screenshot.

fn-knock also submits the detected client IP for Turnstile verification. When a CDN or reverse proxy sits in front of fn-knock, first confirm that `Client IP` is correct in `Request Logs`.

## Common failures

| Symptom | Check first |
| --- | --- |
| Widget does not appear | Widget hostname, browser connectivity to Cloudflare, and whether the sign-in page loaded the new configuration |
| Configuration reported as incomplete | Whether both keys were saved and whether the sign-in page is still using the previous configuration |
| Verification still fails after the widget succeeds | Whether the `Secret key` belongs to the same widget, Cloudflare Siteverify connectivity, server time, domain, and proxy path |
| Token reported as empty or response invalid | Whether the browser submitted the widget result and whether a reverse proxy rewrote the request body |
| Appears inactive on the LAN | A private source may receive a local exemption; verify over cellular data |
| Accessing by IP address only | Hostname validation and the HTTPS context are generally unsuitable for Turnstile; use a domain |

If Cloudflare's verification service is unreachable, fn-knock rejects the authentication attempt rather than bypassing human verification. On networks with unreliable Cloudflare connectivity, switch back to the built-in PoW method, which has no third-party dependency.

Cloudflare's widget types and dashboard can change. Follow the [official Turnstile documentation](https://developers.cloudflare.com/turnstile/get-started/) for current options.

- [Pre-login Bot Protection](/en/guide/captcha)
- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
