---
lang: en-US
title: "Deploy on Linux (systemd / OpenRC)"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: e90b21ae59103a44858cf77355da8ae1c08bd5d08c064f9dd16d6518234919d4
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Deploy on Linux (systemd / OpenRC)

This guide is for a standard Linux host. Packages are available for `amd64`, `arm64`, and `armv7`, with support for systemd distributions and OpenRC on Alpine Linux. Installation requires root privileges and a normally booted systemd or OpenRC environment. Minimal containers without an init system cannot use this host installer; use [Docker Compose](/en/quick-start/docker-deployment) instead.

The installer adds `curl`, `openssl`, `tar`, `unzip`, `gzip`, and port-inspection tools as needed. On Alpine, it also uses `apk` to install Bash and the required runtime dependencies.

The Linux deployment serves the admin panel on `7991` and the Go gateway on `7999`. Restrict the admin panel to your LAN, VPN, or an access-controlled HTTPS reverse proxy. Never expose it directly to the public internet.

## Install

### systemd distributions

Run:

```bash
curl -fsSL https://cdn.fnknock.cn/install.sh | sudo bash
```

### Alpine Linux (OpenRC)

Start the installer with `sh` because Bash may not be installed yet:

```sh
curl -fsSL https://cdn.fnknock.cn/install.sh | sudo sh
```

The installer confirms that OpenRC is running, registers `fn-knock` in the `default` runlevel, and starts it immediately. If `rc-service` exists but `/run/openrc` does not, the system is not a normally booted OpenRC host. Installation stops without leaving a partially configured service.

With either service manager, the installer first checks for an existing fn-knock installation:

- On a fresh host, you can continue or exit.
- If fn-knock is already installed, you can install the latest version, open the management menu, view service status, or uninstall it.
- Before downloading a release package, the installer checks the required TCP ports. If a port is in use, it shows the listener details and opens the port configuration menu so you can change the port before continuing.

If no installation is detected but an old `/etc/fn-knock/fn-knock.env` remains, the installer reports a `leftover port configuration` and lets you keep, edit, or remove it. Choosing to remove the leftover port configuration deletes only that environment file and restores the default ports. It does not delete data or gateway configuration under `/var/lib/fn-knock`.

After installation, open:

```text
http://<server-address>:7991/
```

Follow the prompt to set the admin panel password. This password protects only the admin panel and is separate from the TOTP, username and password, or Passkey used to access applications.

## Default ports

`7999` is the primary Go gateway endpoint for application traffic handled by configured mappings. It appears first in the Linux port configuration menu.

| Port | Purpose | Default bind scope |
| --- | --- | --- |
| `7999` | Go gateway endpoint | All interfaces |
| `7991` | Admin panel | All interfaces |
| `7998` | Rust admin backend | Localhost only |
| `7997` | Authentication service | Localhost only |
| `7996` | Go management API | Localhost only |

During both initial installation and an update, enter a port's menu number to change it. The installer rejects duplicate ports and ports already occupied by another service before saving.

## Management commands

After installation, run `sudo knock` to open the management menu. Common non-interactive commands include:

```bash
sudo knock status
sudo knock restart
sudo knock config
sudo knock update
sudo knock logs
sudo knock reset-panel-password
```

`sudo knock status` reports whether the service is enabled and running, its externally listening ports, and the PID, RSS memory, and combined memory usage of the two core processes, `server-admin-rs` and `go-reauth-proxy`.

The command automatically uses the host's service manager: `systemctl` for systemd and `rc-service` for OpenRC. Both environments show service state, external listeners, and core-process memory. On systemd, the output also includes the main PID, most recent exit code, and activation time.

To view logs, run:

```bash
sudo knock logs
sudo knock logs --follow
```

On systemd, these commands read `journalctl`. On OpenRC, they read or follow `/var/log/fn-knock.log`. If the log file has not been created yet, `knock logs` reports that condition instead of treating it as a service failure.

`sudo knock config` displays a numbered port table. Enter `1` through `5` to edit a port, `S` to validate and save, or `R` to restore the defaults. Keeping a port currently used by the running service is not incorrectly reported as a conflict.

`sudo knock reset-panel-password` asks for confirmation. It clears the admin panel password, all panel sessions, and failed-login backoff records. The next visit to the actual admin address on `7991` returns to the first-time password setup.

## Update and roll back

`sudo knock update` displays both the installed and latest available versions. The updater reads the architecture-specific release manifest from a stable URL. The release pipeline refreshes that URL in the CDN and verifies it by reading it back, so the command no longer adds a random query parameter to every check.

Even when the installed and available versions match, you can confirm that you want to download and deploy that version again. After starting the new version, the installer checks the admin panel health endpoint. If startup fails, it restores the previous version, management command, matching systemd unit or OpenRC service script, and the previous enabled/running state.

If a previous version is available, run:

```bash
sudo knock rollback
```

## Data and backups

The default installation uses these primary paths:

| Path | Contents |
| --- | --- |
| `/opt/fn-knock` | Versioned application files, current-version symlink, and retained rollback version |
| `/etc/fn-knock` | Port environment file and gateway configuration |
| `/var/lib/fn-knock` | SQLite data, certificates, private keys, downloaded resources, and other application data |
| `/var/log/fn-knock.log` | OpenRC service log; systemd uses the journal |

Before an update or migration, export a `.knock` archive from the Maintenance page, then back up `/etc/fn-knock` and `/var/lib/fn-knock`. The application archive migrates portable settings, while the directory backup retains SQLite and platform runtime data; neither layer replaces the other. See [Backup, Restore, and Data Cleanup](/en/guide/backup-and-restore) for the exact scope and recovery procedure.

These directories contain authentication credentials and private keys. Encrypt backups and restrict them to root or the administrators who actually maintain the system. Never upload a complete directory as an ordinary log attachment.

## Reverse proxy and security boundary

If remote administration is required, place the admin panel behind an HTTPS reverse proxy. After installation, run the following command to print an Nginx example:

```bash
sudo knock nginx
```

Enable TLS on the reverse proxy and restrict access by trusted source IPs, VPN ranges, or additional authentication. Linux runtime modes do not modify the host firewall; open only the ports your services actually need. See [Ports, Endpoints, and URL Paths](/en/quick-start/ports-and-entrypoints) for the distinction between the admin and application gateway endpoints.

### Mount the admin panel under an existing business domain

If Nginx already serves `https://www.example.com` on the cloud server, you can mount the fn-knock admin panel under a subpath without adding another domain or public port. The following example suggests `/fn-knock/`, but you can replace it with any path not already used by the existing site. Add the configuration to the HTTPS `server {}` block for `www.example.com`:

```nginx
# To customize the path, change /fn-knock only on the next line
location ~ ^(?<panel_prefix>/fn-knock)(?<panel_uri>/.*)?$ {
    if ($panel_uri = "") {
        return 308 $panel_prefix/$is_args$args;
    }

    include /etc/nginx/snippets/migrated-proxy-headers.conf;

    proxy_http_version 1.1;

    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    proxy_set_header X-Forwarded-Prefix $panel_prefix;

    proxy_redirect ~^(/.*)$ $panel_prefix$1;

    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;

    rewrite ^ $panel_uri break;
    proxy_pass http://127.0.0.1:7991;
}
```

This example assumes that the admin panel still uses the default port `7991`. If you changed the port during installation, update `proxy_pass` as well. `/etc/nginx/snippets/migrated-proxy-headers.conf` must also exist and provide the common proxy request headers used by the current site. If the existing site uses a different shared proxy configuration, change the `include` path to that file.

An Nginx `location` cannot directly reference a variable defined with `set`. This example instead uses named regular-expression captures: `/fn-knock` appears only once and is saved as `$panel_prefix`, so changing the path to `/knock-admin`, for example, requires editing only the `location` line. `$panel_uri` holds the request path after the prefix so that the external prefix can be removed before proxying. If the same `server` contains other regular-expression locations, place this block before any rule that could also match these requests.

- A prefix without the trailing slash is redirected to the `/`-terminated URL with status `308`, preserving the original query string.
- `rewrite` uses `$panel_uri` to remove the external prefix before forwarding the request to the admin panel. `X-Forwarded-Prefix` tells the panel its external path, while `proxy_redirect` rewrites root-relative redirects returned by the upstream service under the same prefix.
- `X-Forwarded-Host` and `X-Forwarded-Port` preserve the domain and port used by the visitor.

After saving the configuration, check its syntax and then reload Nginx with the service manager used by the host:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

On Alpine Linux, use:

```sh
sudo rc-service nginx reload
```

After a successful reload, the example makes the admin panel available at `https://www.example.com/fn-knock/`. If you changed the suggested path, use the same new prefix in the URL. Opening the URL without its trailing slash redirects automatically. This path proxies only the `7991` admin endpoint; it does not replace the `7999` application gateway endpoint. If the path is reachable from the public internet, continue to restrict it by source IP, place it behind a VPN, or require additional authentication.

## Uninstall

```bash
sudo knock uninstall
```

By default, uninstalling removes only the application and its registration with the current service manager—the systemd unit or OpenRC service script. Configuration under `/etc/fn-knock` and data under `/var/lib/fn-knock` are retained. Configuration and data are deleted permanently only when you explicitly use `--purge` and type `DELETE` in an interactive terminal.

Continue reading:

- [Choose a Deployment and Access Pattern](/en/quick-start/deployment-options)
- [Ports, Endpoints, and URL Paths](/en/quick-start/ports-and-entrypoints)
- [Backup, Restore, and Data Cleanup](/en/guide/backup-and-restore)
- [Dashboard and System Updates](/en/guide/dashboard-and-update)
