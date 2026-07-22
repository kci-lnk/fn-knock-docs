---
lang: en-US
title: "Deploy with Docker Compose"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: efd17576c9922af7b163e51a729df52d857eb01e58e179275383dbb565311a9e
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Deploy with Docker Compose

This guide uses the published `kcilnk/fn-knock` image and `deploy/docker/compose.remote.yaml` from the repository. That Compose file has no local build configuration and is intended for server deployments. If the image is not already present, `docker compose up -d` pulls it automatically.

To install and set up the native fnOS FPK instead, see [Install and Set Up the Native fnOS FPK](/en/quick-start/install-and-first-login).

## Requirements and boundaries

- Docker Engine and Docker Compose v2 are installed.
- Host ports `7991` and `7999` are free, or you have chosen replacement ports.
- The admin endpoint is reachable only from your LAN, VPN, or a trusted reverse proxy. Never port-forward it directly to the public internet.

The standard Compose stack publishes only the admin and gateway endpoints. The backend, authentication service, and the gateway's internal gRPC port are not published to the host.

| Host port | Container service | Purpose |
| --- | --- | --- |
| `7991` | Admin panel | Set the Docker admin panel password on first access |
| `7999` | Gateway endpoint | Entry point for users accessing mapped services |
| Not published | `7998`, `7997`, `7996` | Admin backend, authentication service, and internal gRPC |

The Docker admin panel password is separate from the TOTP, username and password, or Passkey that `fn-knock` uses to authenticate visitors.

## Get the release Compose file

As root—or with `sudo` before each command—create a dedicated working directory and save the release Compose file under the default filename:

```bash
install -d -m 0750 /opt/fn-knock
cd /opt/fn-knock
curl -fsSLo compose.yaml \
  https://raw.githubusercontent.com/kci-lnk/fn-knock-turborepo/main/deploy/docker/compose.remote.yaml
```

Create `.env` in the same directory. The following is the default production configuration. `compose.remote.yaml` reads the image, ports, and network ranges from this file.

```dotenv
FN_KNOCK_IMAGE=kcilnk/fn-knock:latest
TZ=Asia/Shanghai
ADMIN_VIEW_PORT=7991
GO_REPROXY_PORT=7999
DOCKER_ADMIN_TRUSTED_PROXY_CIDRS=
```

In most deployments, you only need to change `ADMIN_VIEW_PORT`, `GO_REPROXY_PORT`, and the time zone. Compose uses IPv4 `172.30.0.0/16` and IPv6 `fd42:fb33:7f7a:100::/64` by default. Add `FN_KNOCK_DOCKER_IPV4_SUBNET` and `FN_KNOCK_DOCKER_IPV6_SUBNET` to `.env` and choose unused private ranges only if the defaults overlap an existing Docker network, VPN, or host route. Do not add a Redis container or `REDIS_*` environment variables for a new deployment; the current release image uses SQLite.

If the admin endpoint must sit behind an internet-facing reverse proxy, add only that proxy's egress IP or CIDR to `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS` and configure it to pass `X-Forwarded-For` or `X-Real-IP`. Never put `0.0.0.0/0` in the trusted proxy list.

## Start and verify

```bash
cd /opt/fn-knock
docker compose config
docker compose up -d
docker compose ps
docker compose logs --tail=100 fn-knock
```

`docker compose config` should print the complete resolved configuration, and `docker compose ps` should show `fn-knock` as running. Run the admin service health check on the host:

```bash
set -a
. ./.env
set +a
curl -fsS "http://127.0.0.1:${ADMIN_VIEW_PORT}/api/admin/healthz"
```

Then open the admin panel from your LAN:

```text
http://<host-LAN-address>:<ADMIN_VIEW_PORT>/
```

`<ADMIN_VIEW_PORT>` is the actual admin port from `.env`, which defaults to `7991`. Follow the prompt to set the Docker admin panel password, then configure the run mode, authentication, and mappings in the `fn-knock` admin interface. Public service traffic must enter through the gateway port specified by `GO_REPROXY_PORT` in `.env`, which defaults to `7999`. After creating a mapping, test it over a real external connection such as cellular data instead of testing only against `127.0.0.1` on the host.

## Data, backups, and recovery access

Compose creates two persistent volumes:

| Logical volume | Contents |
| --- | --- |
| `fn_knock_gateway` | Gateway configuration and the SQLite database |
| `fn_knock_data` | Secrets, backups, FRP / Cloudflared resources, and other runtime data |

Recreating the container does not clear these volumes; deleting the volumes does. Before an update or migration, export an application backup and include both volumes in your host backup. They may contain credentials and private keys, so never store their archives in a publicly readable directory.

A `.knock` archive and a volume backup serve different purposes. The archive restores portable application settings, while the volume backup retains SQLite data, downloaded resources, and container runtime data. See [Backup, Restore, and Data Cleanup](/en/guide/backup-and-restore) for archive contents, version constraints, and post-restore validation.

If you forget the Docker admin panel password—not a visitor sign-in credential—run the following command from the working directory:

```bash
docker compose exec fn-knock \
  fn-knock-reset-panel-password
```

### Migrate from legacy Redis

This procedure is only for upgrades from an older Compose stack that still includes Redis and whose data must be retained. Do not add Redis or run this migration on a fresh installation.

Back up the legacy Redis data and both persistent volumes first. Make sure the legacy Redis service and the current `fn-knock` container are still on the same Compose network, then run:

```bash
docker compose exec \
  -e FN_KNOCK_LEGACY_REDIS_URL=redis://redis:6379/ \
  fn-knock /opt/fn-knock/bin/server-admin-rs migrate-redis-to-sqlite
```

After a successful migration, the command deletes the `fn_knock:*` keys from Redis so the legacy data cannot be read again. A backup is therefore mandatory. Verify both the admin interface and the SQLite data before removing Redis or switching to the current Compose stack. Add `--force` only when you explicitly intend to overwrite existing SQLite data.

## Docker feature limitations

| Feature | Behavior in Docker Compose |
| --- | --- |
| In-app FPK updates | Not supported; pull and recreate the image with Compose |
| Direct mode, host firewall management, Smart Connect | Unavailable; a container cannot safely take control of host network policy |
| Web terminal, SSH security | Unavailable; these features depend on the host terminal or SSH logs |
| Automatic HTTPS | The standard Compose stack does not publish host port `80`; use an upstream reverse proxy and certificate setup, or plan the ports and certificates manually |

These limitations do not prevent Subdomain mode or Reverse proxy mode from using the gateway. For Docker deployments, prefer a mode that does not rely on fn-knock managing host firewall rules.

## Update the release image

When using `latest`:

```bash
cd /opt/fn-knock
docker compose pull
docker compose up -d
docker compose ps
```

If `.env` pins a version tag, change `FN_KNOCK_IMAGE` to the target version before running the same commands. After the update, verify the admin interface, gateway endpoint, certificates, and every active tunnel. Public access must be tested from an external network.

Continue reading:

- [Ports, Endpoints, and URL Paths](/en/quick-start/ports-and-entrypoints)
- [Choose a Runtime Mode](/en/quick-start/run-modes)
- [Backup, Restore, and Data Cleanup](/en/guide/backup-and-restore)
- [Dashboard and System Updates](/en/guide/dashboard-and-update)
