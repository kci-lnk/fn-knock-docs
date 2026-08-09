---
lang: en-US
title: "Gateway Portal"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: c221bf25ccf8054e9f174402f93ecd44b391eb25ec13885dba028b80abbb29e7
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Gateway Portal

The portal is a service-navigation component displayed on signed-in gateway pages. It makes it easy to switch among navigable application Hosts and path mappings, and provides a way to sign out of the current session. It does not change mapping permissions, allowlists, or authentication requirements.

![Expanded portal service list with app icons, service names, and a sign-out entry](/screen-gobtn.webp)

Select the floating button on the page to open the portal. From there, you can switch among services available to the current account or sign out of the current session.

Under `System settings → Gateway → Portal settings`, you can select the Portal version and control whether the portal appears, whether services use their title or domain, whether app icons are shown, and whether the icon snaps to a corner or can be dragged freely.

| Setting | Page behavior |
| --- | --- |
| `Enable portal` | When enabled, signed-in users see an app-switching toolbar while visiting application subdomains |
| `Portal version` | `v1 Classic` uses the classic toolbar; `v2 Launchpad` uses a full-screen glass Launchpad and can be selected at any time |
| `Portal display` | Selects the domain or site title; an empty title falls back to the domain |
| `Portal icon drag position` | `Corners` snaps the icon to a corner, while `Free` lets it remain anywhere in the viewport |
| `Show app icons` | Shows collected or custom icons; v1 omits empty icon slots, while v2 generates a placeholder icon |
| `Show Wake-on-LAN shortcut` | Appears when WOL is enabled and lets authorized signed-in accounts open the built-in device wake page |

These options are saved and synchronized as soon as you select them. You do not need to return to the main Gateway page and run a separate save. Switching versions or changing the display style does not end the sign-in session.

Whether a service appears in the portal depends on the current routing method and mapping state. A Host can be hidden individually with its `Show portal` setting; path mappings currently have no equivalent per-entry switch. Hiding a Host affects navigation only—it does not make the service private or public.

When subdomain mappings use `Grouped view`, the portal and built-in `/__select__` page use the same group names, group order, and Host order. Switching back to list view makes both locations flat again without discarding saved group assignments. Grouping changes navigation structure only; credential service scopes and each mapping's authentication settings still apply.

After configuring the portal, sign in through a protected application Host and confirm that the selected version, titles, icons, and drag behavior match your expectations. The portal itself grants no permissions. Even if a Host appears in the list, access for a restricted credential is still determined by its actual service scope when the request is made.

The Wake-on-LAN shortcut is enabled by default but is displayed only while `System settings → Features → Wake-on-LAN` is enabled. The built-in `/__wol__` page lists only enabled-device names and simplified status. A credential with a custom service scope must also include `Built-in Wake-on-LAN page` under `Auth settings → Permissions`. Disabling the shortcut also blocks the page through the public authentication API, but it does not prevent an administrator or third-party platform from triggering wake. See [Wake-on-LAN](/en/guide/wake-on-lan) for full setup.

If the display is incorrect, check in this order:

1. Confirm that the global portal is enabled and that the current Host has not disabled `Show portal`.
2. Confirm that the current request is signed in and uses a routing mode that supports Host entries.
3. Check the mapping's site title. In title mode, an empty title displays the domain.
4. If an icon is missing, edit the corresponding Host under `Domains`, open `App icon`, then recollect it or upload a custom image. v2 displays a generated placeholder until an icon is available.
5. If grouping or ordering is incorrect, confirm that subdomain mappings currently use `Grouped view`, then inspect the order under `Manage groups`.
6. Compare the credential's service scope. Seeing an entry in the list does not mean the credential can access it.
7. If Wake-on-LAN is missing, check the WOL feature, the portal shortcut, and whether the current credential includes the built-in WOL page.

- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
- [Subdomain Routing](/en/guide/subdomain-proxy)
- [Path-based Reverse Proxy (Compatibility Mode)](/en/guide/reverse-proxy)
- [Wake-on-LAN](/en/guide/wake-on-lan)
