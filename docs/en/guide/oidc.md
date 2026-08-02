---
lang: en-US
title: "External Identity Providers (OIDC / OAuth / LDAP)"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 445f88b52c1313d35d5a7333c4638395111f5270cad7b7d9e76c7dcd80ac0b78
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# External Identity Providers (OIDC / OAuth / LDAP)

External account sign-in binds QQ, Google, Microsoft, GitHub, a compatible OIDC identity provider, or an LDAP / Active Directory account to a TOTP credential. It is available only in `TOTP sign-in mode`. After sign-in succeeds, fn-knock still applies its own session, the linked TOTP's service scope, and the post-login IP authorization policy.

OIDC / OAuth redirects the browser to a third-party site for authorization. LDAP connects from the fn-knock server to a directory over LDAPS or StartTLS. Both must be linked to an existing TOTP credential and cannot create an fn-knock identity automatically.

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

## LDAP / Active Directory

Open `Auth → OIDC configuration`, then add OpenLDAP, Active Directory, or Custom LDAP under `LDAP / Active Directory providers`. Directory connections always validate TLS certificates; plain-text LDAP is unsupported. When the directory uses a private CA, paste the issuing chain into `Private CA PEM`.

| Setting | Behavior |
| --- | --- |
| Server URLs | Enter one per line. Use `ldaps://ldap.example.com:636` for LDAPS or `ldap://ldap.example.com:389` for StartTLS. Unavailable servers are tried in order |
| `Base DN` | The root of user searches, such as `dc=example,dc=com` |
| `Search then bind` | Uses a service account to find exactly one user under the Base DN, then verifies the password by binding as that user's DN |
| `Direct bind` | Builds a DN or UPN from a `{username}` template, verifies the user password, then reads identity attributes under the Base DN |
| User filter | Must contain `{username}`; input is escaped as an LDAP filter value |
| Stable ID attribute | Identifies the same directory identity over time; defaults to `entryUUID` for OpenLDAP and `objectGUID` for Active Directory |

Select `Test` before enabling the provider. Search-then-bind tests connectivity and the service account. Direct bind asks for a directory account for a one-time test and does not save those test credentials. Login fails when the connection times out, the certificate name or private CA is wrong, the Base DN is incorrect, or the filter returns zero or multiple users.

### Bind a directory account

1. Under `Auth`, open `Quick login` for the target TOTP credential.
2. Generate an invitation under `External account bindings` and choose an enabled LDAP provider.
3. Have the directory user open the link within 30 minutes, complete the bot check, and enter their directory username and password.
4. Return to the quick-login page, verify the provider, account, Subject, and last-used time, then test sign-in in a private window.

The invitation links the successfully verified directory identity to the selected TOTP and is sensitive authorization material. One directory identity cannot be linked to multiple TOTP credentials through the same provider. Removing a binding changes only fn-knock and does not modify the directory account. Deleting a provider removes all of that provider's bindings.

## Access Scope

OIDC and LDAP are not separate administrator identities. They inherit the linked TOTP credential's subdomain and protocol-mapping scopes. Revoking a binding prevents the external account from signing in but does not delete the TOTP itself. Deleting a provider also removes every external account binding under that provider; first confirm that all users still have TOTP or another recovery method.

A binding invitation is valid for exactly 30 minutes and attaches the external identity that completes authorization to the current TOTP credential. Treat the invitation link as sensitive authorization material; do not post it in group chats, support tickets, or public pages. After binding, verify the provider, account, Subject, and last-used time on the quick-login management page.

## Common Problems

| Symptom | What to check |
| --- | --- |
| No external account entry on the sign-in page | The current mode must be TOTP sign-in mode, and the provider must be enabled with all required settings complete |
| Provider rejects the callback | Callback URL, HTTPS, allowed redirect URI, domain, and port |
| Shown as unbound after the callback | Complete the external account-to-TOTP binding in fn-knock first |
| LDAP reports that the service is unavailable | From the fn-knock environment, check directory DNS, port, TLS certificate chain, and system time |
| LDAP credentials are correct but login still fails | Check the Base DN, user filter, bind mode, stable ID, and username attributes; the search result must be unique |
| Access is still denied after sign-in | Check the linked TOTP's service scope and the target Host policy |

- [Link QQ for Quick Sign-in](/en/guide/qq-quick-login)
- [TOTP Authenticator Apps](/en/guide/totp)
- [Passkeys](/en/guide/passkey)
- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
