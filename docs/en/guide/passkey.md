---
lang: en-US
title: "Passkeys"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 86ea645fe3edf31535747fe19df3f2209f795644a3a67551074668a50c648e15
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Passkeys

A Passkey lets a bound device complete sign-in with system biometrics or device unlock. It is available only in `TOTP sign-in mode` and is linked to an existing TOTP credential. Keep TOTP available as a recovery method.

## Prerequisites

- Use HTTPS and the final domain that visitors will open; browsers require a secure context.
- Create a working TOTP credential first.
- Make sure the authentication Host, Cookie domain, and Passkey RP configuration match your domain plan.
- Use a browser and operating system that support WebAuthn.

The current implementation supports Windows Passkey providers, Android / Google Password Manager, and credential formats returned by different browsers. Updating the application does not change the RP binding of existing Passkeys. If an existing credential still fails, sign in with TOTP and bind a test credential again on the same final domain; do not delete your only recovery method first.

For a subdomain setup, you can bind Passkeys to the authentication Host or use the product's parent-domain RP option. Changing the RP configuration affects whether existing Passkeys work, so retain a working TOTP before switching.

## Bind and Sign In

After signing in with TOTP, follow the prompt on the status page to bind a Passkey. The device asks you to confirm with a fingerprint, face recognition, or system unlock. `System settings → Features → Prompt to bind Passkey after sign-in` controls only whether the status page proactively shows this prompt. Disabling it does not delete existing Passkeys or disable Passkey sign-in on the sign-in page.

The signed-in status page detects whether the current browser has previously used or recorded a Passkey for the account:

- If the current browser has no known Passkey and the account has none bound, the page shows `Enable Passkey sign-in`.
- If the account has a Passkey but the current browser has no known credential, it shows `Add another Passkey`, allowing you to add one for a new device or a password manager that did not synchronize it.
- If the current browser has a known Passkey, the page does not show the binding entry again.

“Known to the current browser” controls only the binding prompt. The page stores a SHA-256 digest of the credential ID in browser local storage; it never stores the Passkey private key. After clearing site data, disabling local storage, or switching browsers, the binding prompt might appear again. This does not mean the server-side credential was lost. Try Passkey sign-in directly, or add another Passkey if needed.

For a TOTP entry, `Manage quick login` shows the Passkey ID, device name, and binding time, and lets you delete an individual Passkey. It does not create new Passkeys. The same page also manages external account bindings; to link QQ, see [Link QQ for Quick Sign-in](/en/guide/qq-quick-login).

A Passkey inherits the service scope and session policy of its linked TOTP credential. Deleting one Passkey revokes only that credential; it does not delete the TOTP, other Passkeys, or external account bindings. Deleting the parent TOTP removes all linked quick-sign-in credentials as well.

## Domains and the RP

WebAuthn binds a Passkey to a Relying Party (RP) domain. Plan a stable relationship among the authentication Host, root domain, and Passkey RP:

- If you use only one authentication domain, align the RP with that authentication Host.
- To reuse Passkeys across multiple Hosts under the same parent domain, configure the RP with the supported parent-domain option.
- Existing Passkeys might stop working after changing the authentication domain, moving from an IP to a domain, or changing the parent domain.

Before migrating, retain a working TOTP and bind a test Passkey on the new domain first. A reverse proxy should preserve the final public Host and HTTPS scheme information.

## Troubleshooting

- **The entry does not appear:** Confirm that TOTP sign-in mode is still active, the page is served over HTTPS, and the browser supports WebAuthn.
- **The Passkey cannot sign in after binding:** Check that the authentication domain and RP configuration match, then recover with TOTP.
- **You changed browsers or devices:** Availability depends on whether the operating system or password manager synchronized the Passkey; do not assume that it always migrates automatically.
- **Creation was cancelled or timed out:** Start the binding flow again and complete the biometric or unlock prompt from the system.
- **The system could not create a Passkey:** Confirm that the device has a screen lock, the browser allows Passkeys, and the password manager or system credential service is available.
- **Android registration fails:** fn-knock automatically retries with the standard registration profile for compatible errors. If it still fails, update the browser and Google Play services and confirm that Google Password Manager is enabled.
- **Windows does not show the expected provider:** Update the browser and operating system, confirm that Windows Hello or your password manager is enabled, then start binding again from the status page.
- **This device already has the Passkey:** Do not bind it again; use Passkey sign-in directly. If a new device did not receive the synchronized credential, add another from the status page.

- [TOTP Authenticator Apps](/en/guide/totp)
- [Link QQ for Quick Sign-in](/en/guide/qq-quick-login)
- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
