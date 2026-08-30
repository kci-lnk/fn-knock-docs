---
lang: en-US
title: "Static File and Directory Responses"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 2c754fabb62c6c787287d338960000098393c7294baaec65a6d51dcbd32fa454
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
3. In `Server path`, enter an absolute path in the fn-knock runtime environment—not a path on the computer running the browser.
4. Click `Check path` and confirm that the path exists, its type matches, and the gateway process can read it.
5. For a directory response, adjust the default documents, directory listing, and README rendering as needed.
6. Configure `Require sign-in`, gateway visibility, WAF, availability, title, and icon, then save.
7. Through the real access path, request the root, one existing file, and one missing path. Verify the route type and status in [Request Analysis](/en/guide/request-logs).

`Check path` is a point-in-time check; it does not lock a file or mount. Saving also probes the path when you create a static mapping or change its server path or response type, but changing directory options alone does not repeat that probe. Even after a successful save, the path can be removed, replaced, or lose read access; the gateway opens and validates it again on every request.

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

Enter `/srv/public-site` as the directory path in the admin panel. Recreate the container after changing mounts, then run `Check path`. Never mount the host root, `/etc`, an fn-knock data volume, or a directory containing keys and system configuration merely to serve static content.

A static mapping only reads existing files. It does not create DNS records, open firewall ports, or change container mounts. External reachability still depends on the gateway entry point, DNS, certificates, router, or tunnel for the current deployment.

## Status Codes and Troubleshooting

| Symptom | Check |
| --- | --- |
| Saving reports that the path is unavailable | Absolute-path format, file/directory type, read permission, protected paths, and Docker mounts |
| The root returns `503` | The configured root or single file is missing, unreadable, or no longer safe; the response includes a short retry hint |
| A child path returns `404` | The file is missing, its name is hidden by safety rules, directory listing is off, or a single-file mapping received a non-root path |
| A request returns `405` | Static responses accept only `GET` and `HEAD` at valid paths |
| A listing appears instead of the site home page | The default-document name or priority is wrong, or the matching file is unreadable |
| Refreshing a client-side route returns `404` | Static directories have no SPA fallback; use an upstream web server with History Fallback |
| Request logs show no upstream address | The gateway reads static files directly; this is expected |

Start by running `Check path` again in the editor. Then verify permissions and mounts from the fn-knock runtime environment, and finally inspect the Host, route type, authentication result, WAF action, and status in request logs. Do not work around path checks by mapping a system directory or granting unnecessary root access.

See [Subdomain Routing](/en/guide/subdomain-proxy), [Deploy with Docker Compose](/en/quick-start/docker-deployment), [WAF](/en/guide/waf), and [Security Model and Baseline](/en/guide/security).
