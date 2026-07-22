---
lang: en-US
title: "Authentication, Sessions, and Service Scopes"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 59c9691e7550cfe7efb06922640b92ccd1f6e56cc358f0771860468163262988
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Authentication, Sessions, and Service Scopes

fn-knock authentication protects services behind the gateway. It is separate from the admin panel password used by Docker or OpenWrt deployments. Gateway authentication determines whether a visitor can reach a service; the panel password protects only the admin entry point.

## What happens during sign-in

For a protected service accessed from a non-local source, the request normally passes through these steps:

1. The gateway uses the mapping policy to determine whether the service requires authentication, then checks for existing source authorization or an advanced-authentication temporary grant for the current Host.
2. If no other allow path applies, the sign-in page runs the enabled human-verification challenge.
3. The visitor authenticates with the active sign-in mode.
4. fn-knock creates a session and uses the session settings to decide whether to authorize the current IP.
5. When the visitor opens a Host, fn-knock checks whether the credential's service scope includes it.

LAN, loopback, and other private-network sources are locally exempt by default. They do not pass through this entire flow, and credential service scopes do not restrict them. Use a real external network to validate public access.

## When the post-login redirect is paused

The authentication page pauses automatic redirection and displays a warning when the destination points back to the current verification page, the same destination keeps looping, or the return URL is unsafe. Do not repeatedly refresh the authentication page. Start a new request from the original application Host, then check the authentication Host, root domain and cookie scope, public scheme, and the `Host`, `X-Forwarded-Host`, and `X-Forwarded-Proto` values supplied by the upstream proxy. An edge platform must not cache sign-in or redirect responses.

## Sign-in modes

| Mode | Available methods | Best for |
| --- | --- | --- |
| `TOTP sign-in mode` | TOTP; linked Passkeys, QQ, and other external accounts | Personal use and quick sign-in with hardware or biometrics |
| `Password sign-in mode` | Username and password | Multiple users who need separate accounts |

Switch between the modes under `Auth`. Before switching, the system checks that the required passwords or TOTP credentials are ready. Users holding sessions created by a sign-in method that becomes disabled must sign in again.

Switching synchronizes account names, permissions, and linked TOTP credentials. Repeating the operation does not create duplicate accounts, reset configured passwords, or copy quick-sign-in bindings. Before switching to Password sign-in mode, every generated account must have a password. Before switching back to TOTP sign-in mode, every account must be linked to a TOTP credential that still exists. Once the switch is confirmed, the system invalidates sessions created by the disabled method:

| Switch to | Sessions invalidated |
| --- | --- |
| Password sign-in mode | TOTP, Passkey, and OIDC sessions |
| TOTP sign-in mode | Username/password sessions |

## How credentials relate to permissions

- A TOTP credential is a named identity whose subdomain access can be restricted. Linked Passkeys, QQ, and other OIDC sign-ins inherit its scope.
- Accounts in Password sign-in mode can also have service scopes.
- If a service scope is set to `Custom scopes` with no entry selected, the credential cannot open any protected Host. The built-in select page at `/__select__` is a separate scope item and must also be selected when needed.
- For a Host with `Require sign-in` enabled, valid manual source authorization can grant access independently. IP authorization created automatically after sign-in normally lets the same source continue to connect, but it cannot override a service-scope denial already attached to a browser request. When no usable source authorization exists, the gateway continues by evaluating the session and credential scope.
- Post-login automatic IP authorization is controlled under `System settings → Sessions`. It is an allow path for a source IP, not a credential-scope control. If a manual allowlist entry is too broad, that source may open a protected Host directly without signing in through a browser.
- A sign-in credential with a restricted service scope does not create automatic IP authorization, preventing source-IP authorization from expanding the credential's scope. This includes a restricted TOTP and its linked Passkey / OIDC identities, as well as username/password accounts with restricted scopes. They are not suitable for automatic authorization in Direct mode.

## The admin panel password is not a gateway login

Docker, OpenWrt, and similar deployments first require an admin panel password. This password protects admin port `7991`; it does not automatically become a visitor account for gateway services and does not replace TOTP or username/password authentication.

On a platform with a separate panel password, adding the fn-knock admin panel as a subdomain mapping makes the `Admin panel` permission appear in the authentication list. Enabling it for a TOTP credential or account lets that identity open the panel through the protected subdomain without entering the panel password a second time. It does not expose the original `7991` port or grant access to unselected application Hosts.

## Import and export credentials

`Auth → More actions → Import/export credentials` operates on the current sign-in mode:

| Current mode | Export contents |
| --- | --- |
| TOTP | TOTP secrets, names, and permissions |
| Username/password | Accounts, password hashes, permissions, and linked TOTP secrets |

The import file must be JSON and is limited to 512 KB by the admin page. Import merges recognized records and skips duplicate IDs, usernames, secrets, and duplicates within the file. It does not restore Passkey or external-account bindings. The exported data is sufficient to sign in, so protect it to the same standard as a `.knock` system backup.

## Advanced authentication is not a sign-in method

Subdomain advanced authentication issues a temporary grant limited to the current Host when a request matches a source, path, Header, Query, or HTTP-method rule. It does not create a system login session or post-login IP authorization, and it neither inherits nor changes the service scopes of TOTP, Passkey, OIDC, or username/password credentials.

This is an independent allow path. Even if the current browser session's service scope excludes the Host, a request that satisfies an advanced-authentication rule can receive temporary access to that Host. Do not use advanced authentication to add another restriction to an existing credential. To narrow credential access, change the credential's own service scope. See [Advanced Authentication for Subdomains](/en/guide/advanced-auth) for rule configuration.

## Recommended order

1. Configure one primary sign-in method and prepare at least one backup credential.
2. Create separate credentials for users or devices that need isolation.
3. Set the accessible subdomain scope for each credential.
4. Then bind Passkeys for frequently used devices, plus QQ or other external accounts as needed.
5. Finally, adjust session lifetimes, `Remember me`, and the post-login IP authorization policy.

- [Username and Password Sign-in](/en/guide/password-login)
- [TOTP Authenticator Apps](/en/guide/totp)
- [Passkeys](/en/guide/passkey)
- [Link QQ for Quick Sign-in](/en/guide/qq-quick-login)
- [External Identity Providers (OIDC / OAuth)](/en/guide/oidc)
- [Advanced Authentication for Subdomains](/en/guide/advanced-auth)
- [Sessions, Source-IP Authorization, and IP Changes](/en/guide/session-management)
