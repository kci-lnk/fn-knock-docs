---
lang: en-US
title: "Username and Password Sign-in"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 368f92ef1754cf324b51cbddd0e4d0bea8b0bc8263c2f4d3c65a5152e7064fdb
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Username and Password Sign-in

Username and password sign-in is useful when multiple people need separate identities. It is unrelated to the Docker or OpenWrt admin-panel password; the accounts configured here are for accessing services through the gateway.

## Switch Sign-in Modes

Under `Auth → More actions → Switch sign-in mode`, select `Password sign-in mode`. The system first projects existing TOTP credentials into corresponding accounts and lists the accounts that will be created, updated, or still need a password. You must set a password for every projected account before confirming the switch.

After switching:

- The sign-in page displays username and password fields;
- Passkey, QQ, and other external account sign-in entries are hidden;
- Existing sessions created through TOTP, Passkey, OIDC, or LDAP are destroyed, and users must sign in again with a username and password;
- Each account's service scope continues to apply when it accesses a Host or protected protocol mapping.

To use TOTP, Passkey, QQ, another OIDC provider, or LDAP / Active Directory again, switch back to `TOTP sign-in mode`. Before switching back, every account must be linked to a TOTP credential that still exists. Username/password sessions become invalid when the mode changes.

## Create an Account

Under `Auth → Password sign-in accounts`, create an account, set its password, and optionally restrict the subdomains and protocol mappings it can access.

| Field | Backend rules |
| --- | --- |
| Username | 1–64 characters; converted to lowercase when saved; only ASCII letters, digits, `.`, `_`, and `-` are allowed, with no whitespace |
| Password | 1–128 characters; the page warns about short or weak passwords, but the backend rejects only an empty or overlong password |

The backend's minimum accepted length is not a security recommendation. Use a sufficiently long, unique password and do not reuse an admin-panel password or a password from another service.

If an account needs only a subset of entry points, change its permission to `Custom scopes` and select only the required Hosts, built-in select page, or authenticated TCP / UDP protocol mappings. An empty custom scope allows no protected entry. A restricted account receives no general automatic post-login IP authorization. If a specific protocol mapping is selected and post-login IP authorization is enabled, only its protocol and external port are authorized for the current source IP.

Deleting an account also deletes its linked TOTP, Passkeys, external account bindings, and sign-in sessions. If you need to preserve a TOTP recovery path, do not treat account deletion as an operation that removes only the password.

## Import and Export

A credential export includes accounts, password hashes, linked TOTP secrets, and permissions. Store it as a sensitive backup. Import merges accounts by ID, username, and duplicates within the file, and reports password-hash and linked-TOTP results separately. It does not restore Passkeys or third-party account bindings. Export the current configuration before importing so that you have a rollback path.

## Troubleshooting

- **Switching is blocked:** Set passwords for the accounts listed in the prompt, or delete accounts that are no longer needed, then retry.
- **The sign-in page has no username or password fields:** Check whether TOTP sign-in mode is still active and whether you opened the correct authentication Host.
- **Sign-in succeeds, but a subdomain or protocol port is denied:** Check the account's custom scope, post-login IP authorization setting, and the mapping's access policy.
- **The failed-sign-in count keeps increasing:** Under `Sessions & Security → Login backoff`, check the source IP. A shared egress address or incorrect real-IP headers can cause multiple people to share one backoff record.

- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
- [TOTP Authenticator Apps](/en/guide/totp)
