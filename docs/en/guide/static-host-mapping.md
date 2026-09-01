---
lang: en-US
title: "Static File and Directory Responses"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: b6aeb503e2b828f34b1a7c9f831ae724ae768189161d3a41c647219acf34392b
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Static File and Directory Responses

A Host mapping can respond with a file or directory from the fn-knock gateway's filesystem instead of forwarding the request to an upstream. This is useful for downloads, static documentation, small sites, and read-only file directories without running a separate web server.

A static response remains a full Host route. `Require sign-in`, advanced authentication, gateway visibility, WAF, availability schedules, request logs, and gateway throttling all run before the gateway reads a file. Static responses do not provide server-side rewrites or single-page application (SPA) fallback. If every unknown path must return `index.html`, continue to use an upstream web server that supports that behavior.

## Choose a Response Type

When adding or editing an application Host, choose a `Response type`:

| Response type | Request behavior | Typical use |
| --- | --- | --- |
| `Reverse proxy` | Forwards requests to an HTTP, HTTPS, or WebSocket Target | Dynamic web applications and APIs |
| `Single file` | Returns one specified file only at the Host root path `/` | Download entry points, notices, and fixed assets |
| `Directory` | Maps URL paths to files and subdirectories under a specified directory | Static sites, documentation, and file browsing |

Switching a reverse-proxy mapping to a static response requires confirmation and clears proxy-only settings: the Target, path responses, upstream Basic Auth, Host preservation, and Target path mode. Host authentication, visibility, WAF, availability, title, icon, and group are retained. Before closing the editor, switching back to Reverse proxy restores the unsaved proxy draft from that editing session.

Static mappings do not extract a title or icon from their files. Enter a `Display title` and upload a custom icon when the portal, mapping list, or exported bookmarks should show a friendly name.

## Configure a Static Host

1. Use `Subdomain mode` or `Reverse proxy mode → Subdomain mapping`, and make sure the application Host reaches the fn-knock gateway.
2. Add or edit an application Host under `Subdomain mapping`, then choose `Single file` or `Directory`.
3. Select `Browse` next to `Server path`. Navigate the gateway server one level at a time, or enter an absolute path in the address bar and press Enter.
4. For a directory response, enter the target directory and select `Use current folder`. For a single-file response, select a regular file and then select `Use selected file`.
5. For a directory response, adjust the default documents, directory listing, and README rendering as needed.
6. Configure `Require sign-in`, gateway visibility, WAF, availability, title, and icon, then save.
7. Through the real access path, request the root, one existing file, and one missing path. Verify the route type and status in [Request Analysis](/en/guide/request-logs).

## Browse Server Paths

The path browser shows the filesystem visible to the fn-knock gateway process, not the computer that opened the admin console. An existing path is used as the starting point. When the path is empty, POSIX platforms begin at `/`, while Windows first lists available local drives. A filesystem root is for navigation only and cannot be selected as a static directory. With Docker, only content mounted inside the container is visible; the browser neither reads host paths nor creates or changes mounts.

The address bar accepts an absolute path, with controls for the root location, parent, breadcrumbs, and refresh. Directories are always listed before regular files, with at most `100` entries per page and previous/next navigation. Single-file mode selects regular files only; directory mode uses the current folder. If a directory cannot be scanned within the safe entry limit, the whole directory returns an error instead of presenting a truncated list that could mislead a selection.

The browser omits dot-prefixed hidden names, `__`-prefixed internal reserved names, special files, entries that cannot be opened safely, and protected paths and their descendants. An ancestor of a protected path can still be used to navigate elsewhere, but cannot be selected as a static root. A symbolic link is shown only when it resolves inside the current browsed directory without entering a hidden or protected location.

Selecting `Use current folder` or `Use selected file` probes the exact path again to confirm that it still exists, is readable, and has the expected type. A successful selection writes the path only into the current mapping draft; the mapping must still be saved. This is a point-in-time check and does not lock the file or mount. Saving also probes a newly created static mapping or one whose server path or response type changed; changing only directory options does not repeat that probe. Even after successful selection and saving, a path can later be removed, replaced, or lose read access, so the gateway opens and validates it again on every request.

## Single-file Responses

A single-file mapping responds only at the Host root:

```text
download.example.com/        -> /srv/downloads/manual.pdf
download.example.com/other   -> 404
```

The gateway derives `Content-Type` from the server-side filename extension and supports `GET`, `HEAD`, byte-range requests, and common conditional cache requests. `ETag` and the modification time follow the current file state. The URL does not need to contain the server filename, and query parameters do not select a different file.

## Directory Responses

A directory mapping resolves each URL path under the configured root:

```text
docs.example.com/                 -> /srv/docs/
docs.example.com/assets/app.css   -> /srv/docs/assets/app.css
docs.example.com/manual/          -> /srv/docs/manual/
```

When a request resolves to a directory but its URL does not end in `/`, the gateway permanently redirects to the canonical trailing-slash URL. Conversely, when a regular-file URL has an extra trailing `/`, the gateway permanently redirects to the URL without it. Both redirects preserve the query string. Inside a directory, default documents are checked in their configured order. The initial order is `index.html`, then `index.htm`, and up to `16` names can be configured. Each name must be one visible filename without path separators. Removing every name disables default-document lookup.

If no default document is found:

- With `Directory listing` off, the gateway returns `404`.
- With `Directory listing` on, the gateway generates a listing for the current directory.
- `Render README.md` is available only with directory listing and safely renders the current directory's `README.md` below the listing.

The directory index sorts by name by default and always places directories before regular files. Visitors can sort by name, size, or modification time in either direction, use breadcrumbs, switch between light and dark themes, and move between cursor-based pages of up to `100` entries. The index interface currently uses English labels, and modification times are fixed to Beijing time (UTC+8). Hidden names, special files, and entries that cannot be opened safely are omitted.

README rendering supports GitHub Flavored Markdown and files up to `1 MiB`. Raw HTML and unsafe content are filtered. Images must use same-origin relative URLs, while external links receive additional safety attributes. A README is rendered only when no default document matched and the directory listing is actually being shown.

Directory responses provide no extension rewrite, dynamic compression, trailing-path fallback, SPA History Fallback, custom static response headers, or custom cache policy. A missing file returns `404`.

## Authentication, WAF, Logs, and Caching

Static Hosts use the same inbound policies as reverse-proxy Hosts:

- `Require sign-in` and advanced authentication are checked before any file is opened. LAN sources can still receive `local_exempt`, so verify public policy from a genuine external network.
- Gateway visibility, the global blocklist, scan blocking, reverse-proxy throttling, and availability schedules continue to apply.
- When the Host's `Enable WAF` option and the global WAF are both enabled, the request passes through WAF before static content is read.
- Request and WAF logs classify the route as `Static file` or `Static directory` and leave the upstream empty. They do not record the server filesystem path.

Public static files use a public cache policy that requires revalidation. Responses that require or have passed authentication use `private, no-store` so protected content does not enter a shared cache. Generated directory listings, redirects, and errors are also excluded from public caches.

## Filesystem Security Boundaries

`Server path` must be absolute and point to a visible regular file or directory. The gateway rejects filesystem roots, hidden targets, parent traversal, control characters, Windows UNC and device namespaces, and paths that overlap fn-knock configuration, data, logs, credentials, or protected system directories. A broad parent that would contain a protected directory is rejected as well.

Filesystem names are handled with their exact spelling. On POSIX platforms such as Linux and macOS, leading or trailing spaces in a path component are not trimmed, so `/srv/docs` and `/srv/docs ` are different targets; only input made entirely of whitespace is rejected. Avoid such easily confused names when possible, and preserve the real characters when copying a path. Windows continues to reject names ending in a space or period, reserved device names, and other unsafe names.

Within a directory, only visible regular files and subdirectories are served; dotfiles, dot-directories, and `.well-known` are unavailable. A symbolic link must resolve to a safe target inside the static root. Requests fail if a link escapes the root, resolves into a hidden location, or changes during validation. FIFOs, sockets, devices, and other special file types are never opened as downloads.

These checks cannot decide whether business content is appropriate for publication. Give each site its own minimal directory, keep it read-only, and do not copy backups, environment files, private keys, databases, or application configuration into the static root. Before enabling a public listing, review every subdirectory and the links and images in each README.

## Docker and Platform Paths

Paths are always interpreted from the fn-knock process's point of view:

- With Docker, mount host content into the container as read-only, then enter the container path. An unmounted host path cannot be used directly.
- On Linux, macOS, OpenWrt, native fnOS FPK / Lite, and Synology, the package account needs directory traversal and file-read permission.
- On Windows, use a local drive-absolute path such as `C:\Sites\docs`. Network-share paths and device namespaces are not supported.

Docker Compose example:

```yaml
services:
  fn-knock:
    volumes:
      - /srv/public-site:/srv/public-site:ro
```

After changing the mount, recreate the container and select `Browse` in the admin console. The path browser should show `/srv/public-site`; enter that directory, select `Use current folder`, and save the mapping. Never mount the host root, `/etc`, an fn-knock data volume, or a directory containing keys and system configuration merely to serve static content.

A static mapping only reads existing files. It does not create DNS records, open firewall ports, or change container mounts. External reachability still depends on the gateway entry point, DNS, certificates, router, or tunnel for the current deployment.

## Status Codes and Troubleshooting

| Symptom | Check |
| --- | --- |
| Saving reports that the path is unavailable | Absolute-path format, file/directory type, read permission, protected paths, and Docker mounts |
| The path browser cannot see a file or directory | Whether you are viewing the gateway or container filesystem, whether the name is hidden or reserved, read permission, protected paths, and the symbolic-link target |
| The path browser reports too many directory entries | Use a smaller dedicated content directory; do not select a broad shared directory as the static root |
| The root returns `503` | The configured root or single file is missing, unreadable, or no longer safe; the response includes a short retry hint |
| A child path returns `404` | The file is missing, its name is hidden by safety rules, directory listing is off, or a single-file mapping received a non-root path |
| A request returns `405` | Static responses accept only `GET` and `HEAD` at valid paths |
| A listing appears instead of the site home page | The default-document name or priority is wrong, or the matching file is unreadable |
| Refreshing a client-side route returns `404` | Static directories have no SPA fallback; use an upstream web server with History Fallback |
| Request logs show no upstream address | The gateway reads static files directly; this is expected |

Start by opening `Browse` in the editor, locating the target again, and selecting `Use current folder` or `Use selected file`. Then verify permissions and mounts from the fn-knock runtime environment, and finally inspect the Host, route type, authentication result, WAF action, and status in request logs. Do not work around path checks by mapping a system directory or granting unnecessary root access.

See [Subdomain Routing](/en/guide/subdomain-proxy), [Deploy with Docker Compose](/en/quick-start/docker-deployment), [WAF](/en/guide/waf), and [Security Model and Baseline](/en/guide/security).
