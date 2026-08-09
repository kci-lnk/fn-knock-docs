---
lang: en-US
title: "TOTP Authenticator Apps"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: f585853abe37ff472a2bb7f925ba4226cf35ce6e31ca6c21df67c484719091c0
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# TOTP Authenticator Apps

TOTP is a time-based one-time password. In fn-knock, it can serve both as the primary sign-in method and as the identity anchor for Passkeys, QQ, and other external-account sign-ins.

## Bind a Credential

1. Open `Auth` and add a TOTP credential.
2. Scan the QR code with a trusted authenticator app. If scanning is unavailable, open `Manual setup` and copy the `TOTP secret`.
3. Enter the current verification code to complete validation, then give the credential a recognizable name.
4. Bind a second independent device or prepare an offline recovery method.

Do not keep your only TOTP on a single phone. A lost device, operating-system reinstall, or clock problem could lock you out.

## Service Scopes

In the TOTP list, `Permission` can be set to `All scopes` or `Custom scopes`. The custom list groups application Hosts that require sign-in, the built-in select page, the enabled built-in Wake-on-LAN page, and authenticated TCP / UDP protocol mappings. Entries removed from the mappings but retained in the permission are marked `Unavailable`. When the custom scope is empty, the credential cannot access any protected entry point.

This restriction also applies to linked Passkeys, QQ accounts, other OIDC external accounts, and LDAP / Active Directory accounts. A TOTP with a restricted service scope does not create general automatic post-login IP authorization. If the scope includes a specific protocol mapping and post-login IP authorization is enabled, the system authorizes the current source IP only for that protocol and external port. Separate credentials for personal, family, automation, and administrative use so that each can be revoked and audited independently.

`Manage quick login` lets you view or remove linked Passkeys, inspect external-account bindings, and generate a binding invite valid for 30 minutes. Passkeys themselves are created on the visitor status page after TOTP sign-in, not directly in the admin table.

## Clock Out of Sync

If verification codes fail repeatedly, first check the date, time zone, and automatic time synchronization on both the phone and server. Do not keep retrying until sign-in backoff is triggered. Fix an incorrect server clock on the host. Docker does not let fn-knock synchronize it directly; on OpenWrt, first verify the router's own NTP configuration and the current process permissions.

## Import and Export

A TOTP export includes the secrets that generate verification codes, credential names, and permissions. Import skips entries with an existing ID, an existing secret, or duplicates within the file. The admin page accepts JSON files no larger than 512 KB, and import does not restore Passkeys or external-account bindings.

Export files, QR codes, and manual secrets are all equivalent to sign-in credentials. Store them encrypted, and do not capture screenshots, share them publicly, or upload them to cloud notes. Deleting a TOTP also deletes its linked Passkeys and external-account bindings, disabling those sign-in methods.

- [Passkeys](/en/guide/passkey)
- [Link QQ for Quick Sign-in](/en/guide/qq-quick-login)
- [External Identity Providers (OIDC / OAuth / LDAP)](/en/guide/oidc)
- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
