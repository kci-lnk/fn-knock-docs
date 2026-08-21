---
lang: en-US
title: "Navigation Panel Sync"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 380d6b61eded81f661d2cd7e87c80ec6d1db0b46f3b7e2f3a116fbe5e67d59ca
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Navigation Panel Sync

`Subdomain mappings → Sync to navigation panel` publishes enabled fn-knock application entries one way to Sun-Panel, OneNav, or Van-Nav. It sends only the display title, public URL, public icon, and optional grouping. Internal targets, authentication credentials, and fn-knock administration access are never exported.

## Connect a Panel

1. Select the panel type and enter its complete API URL.
2. Enter the required account, token, or credentials. Allow invalid TLS only for a controlled self-signed deployment whose trust chain cannot yet be fixed.
3. Mirror fn-knock groups, or place all applications in one target category. Mirror mode supports a namespace; ungrouped applications use that namespace.
4. Save the draft and run a connection test. Preview and sync remain unavailable until the test succeeds.

Credentials are encrypted and bound to this installation. Restoring a `.knock` backup clears panel credentials, marks the connection unverified, and disables automatic sync. Re-enter and test them afterward.

## Preview and Apply

A preview is required before every apply. It lists creates, updates, deletes, unchanged items, residual items, and conflicts, and expires after a short period. Apply rechecks the source configuration, remote state, and plan digest. Any change requires a fresh preview, and conflicts block apply.

Only enabled application hosts are included. Authentication services, disabled mappings, and internal targets are excluded. Public URLs follow the current domain, tunnel, and external-port settings; clicking an entry still passes through fn-knock authentication, visibility, and WAF policies.

fn-knock modifies or deletes only remote groups and links registered to this connection. It never takes over unrelated same-name objects. Manual changes to registered objects can be overwritten by the next sync, so keep panel-managed entries outside the sync scope.

## Automatic Sync and Provider Differences

Automatic sync reacts to subdomain changes and periodically recalibrates remote state. The interval can be set from 5 to 1440 minutes. Failures and recovery appear in the Event Center. History keeps at most 20 runs and 30 days.

OneNav and Van-Nav can remove stale owned objects. Sun-Panel lacks stable deletion and category-renaming APIs, so stale objects may be reported as residual and require manual cleanup. Deleting a connection preserves remote content by default; optional cleanup is limited to objects owned by that connection, while Sun-Panel can only detach them.

## Security and Troubleshooting

- Prefer HTTPS and least-privilege panel credentials. Disabling TLS validation exposes credentials to interception.
- If testing succeeds but preview fails, verify the API base path, permissions, and same-name remote conflicts.
- When a plan expires, generate a new preview instead of resubmitting it.
- Check run history and events for network, authentication, quota, or residual-object errors.
- Decide whether remote entries should remain before deleting a connection.

- [Subdomain Routing](/en/guide/subdomain-proxy)
- [Event Center and Notifications](/en/guide/event-center-and-notifications)
