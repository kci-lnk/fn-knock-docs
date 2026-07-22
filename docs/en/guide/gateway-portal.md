---
lang: en-US
title: "Gateway Portal"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: b53d82b49a9f480732b149d385b3cb8e9d9c560bea091349dd94371a66d1380c
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Gateway Portal

The portal is a service-navigation component displayed on signed-in gateway pages. It makes it easy to switch among navigable application Hosts and path mappings, and provides a way to sign out of the current session. It does not change mapping permissions, allowlists, or authentication requirements.

![Expanded portal service list with app icons, service names, and a sign-out entry](/screen-gobtn.webp)

Select the floating button in the lower-right corner of the page to expand the portal. From there, you can switch among services available to the current account or sign out of the current session.

Under `System settings → Gateway → Portal settings`, you can control whether the portal appears, whether services use their title or domain, whether app icons are shown, and whether the icon snaps to a corner or can be dragged freely.

| Setting | Page behavior |
| --- | --- |
| `Enable portal` | When enabled, signed-in users see an app-switching toolbar while visiting application subdomains |
| `Portal display` | Selects the domain or site title; an empty title falls back to the domain |
| `Portal icon drag position` | `Corners` snaps the icon to a corner, while `Free` lets it remain anywhere in the viewport |
| `Show app icons` | Shows entries with an automatically collected or custom icon; entries without an icon do not reserve blank space |

These options are saved and synchronized as soon as you select them. You do not need to return to the main Gateway page and run a separate save. Changing the display style does not end the sign-in session.

Whether a service appears in the portal depends on the current routing method and mapping state. A Host can be hidden individually with its `Show portal` setting; path mappings currently have no equivalent per-entry switch. Hiding a Host affects navigation only—it does not make the service private or public.

After configuring the portal, sign in through a protected application Host and confirm that the toolbar, titles, icons, and drag behavior match your expectations. The portal itself grants no permissions. Even if a Host appears in the list, access for a restricted credential is still determined by its actual service scope when the request is made.

If the display is incorrect, check in this order:

1. Confirm that the global portal is enabled and that the current Host has not disabled `Show portal`.
2. Confirm that the current request is signed in and uses a routing mode that supports Host entries.
3. Check the mapping's site title. In title mode, an empty title displays the domain.
4. If an icon is missing, edit the corresponding Host under `Domains`, open `App icon`, then recollect it or upload a custom image. An entry still without an icon does not reserve a space.
5. Compare the credential's service scope. Seeing an entry in the list does not mean the credential can access it.

- [Authentication, Sessions, and Service Scopes](/en/guide/auth)
- [Subdomain Routing](/en/guide/subdomain-proxy)
- [Path-based Reverse Proxy (Compatibility Mode)](/en/guide/reverse-proxy)
