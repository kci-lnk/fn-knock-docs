---
lang: en-US
title: "External Identity Providers (OIDC / OAuth)"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: c3fe4e8953c57b8ed772c285d3f380b3958e969947b9c2c92ba260120c396148
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# External Identity Providers (OIDC / OAuth)

External account sign-in binds QQ, Google, Microsoft, GitHub, or a compatible OIDC identity provider to a TOTP credential. It is available only in `TOTP sign-in mode`. After third-party sign-in succeeds, the user still receives an fn-knock session and the service scope of the linked TOTP.

## QQ Uses the Built-in Integration

QQ is a built-in public provider in fn-knock. You do not need to register a QQ application, enter a Client ID, Client Secret, or Issuer, or manually register a Callback URL. After adding the provider, you still need to bind each user's QQ account to the intended TOTP credential.

See [Link QQ for Quick Sign-in](/en/guide/qq-quick-login) for all prerequisites, binding invitations, callback requirements, and revocation steps.

## Google, Microsoft, GitHub, and Custom OIDC

1. Confirm that the authentication Host is configured as a publicly reachable HTTPS address.
2. From the action menu at the top of `Auth`, open `OIDC configuration` and add a provider.
3. Copy the Callback URL displayed by fn-knock exactly into the third-party provider's allowed callback list.
4. Enter the provider's Client ID and Client Secret. For Microsoft, you can specify `common`, `organizations`, or a tenant ID; custom OIDC also requires an Issuer.
5. Review the Scopes. The field accepts spaces or commas as separators. Keep at least `openid` and any user-information scopes required by the provider for identity resolution.
6. Under `Manage quick login → External account bindings` for the target TOTP credential, generate an invitation and complete the authorization flow to bind the account.
7. Test from the sign-in page in a private window, then verify the TOTP credential's service scope.

The Callback URL must use the authentication Host that visitors actually see. `localhost`, a container name, a private IP, or the wrong port causes the third-party provider to reject the callback. The system handles QQ's dynamic callback, so the manual registration step in this section does not apply to QQ.

Most providers are created as enabled when all required connection parameters are present. If parameters are missing, the provider is saved as a `Needs configuration` draft. When editing, leave Client Secret blank to preserve the current value. Disabling a provider hides or rejects its sign-in entry while retaining the configuration for later re-enabling.

## Access Scope

OIDC is not a separate administrator identity. It inherits the subdomain scope of its linked TOTP credential. Revoking a binding prevents that third-party account from signing in but does not delete the TOTP itself. Deleting a provider also removes every external account binding under that provider; first confirm that all users still have TOTP or another recovery method.

A binding invitation is valid for exactly 30 minutes and attaches the external identity that completes authorization to the current TOTP credential. Treat the invitation link as sensitive authorization material; do not post it in group chats, support tickets, or public pages. After binding, verify the provider, account, Subject, and last-used time on the quick-login management page.

## Common Problems

| Symptom | What to check |
| --- | --- |
| No external account button on the sign-in page | The current mode must be TOTP sign-in mode, and the provider must be enabled |
| Provider rejects the callback | Callback URL, HTTPS, allowed redirect URI, domain, and port |
| Shown as unbound after the callback | Complete the external account-to-TOTP binding in fn-knock first |
| Access is still denied after sign-in | Check the linked TOTP's service scope and the target Host policy |

- [Link QQ for Quick Sign-in](/en/guide/qq-quick-login)
- [TOTP Authenticator Apps](/en/guide/totp)
- [Passkeys](/en/guide/passkey)
- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
